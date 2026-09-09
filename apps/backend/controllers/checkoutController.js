const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const { buildSplitPayload } = require('../services/paystackService');
const ReferralGroup = require('../models/ReferralGroup');

const paystackUrl = 'https://api.paystack.co';

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };
}

function calculateSplit(totalAmount, feePercent = 2.5) {
  const safePercent = Math.min(30, Math.max(0, Number(feePercent || 0)));
  const platformFee = Number((totalAmount * safePercent / 100).toFixed(2));
  return {
    totalAmount,
    platformFeePercent: safePercent,
    platformFee,
    merchantShare: Number((totalAmount - platformFee).toFixed(2))
  };
}

async function initializeCheckout(req, res) {
  const {
    productId,
    product,
    quantity = 1,
    customerName,
    customerPhone,
    deliveryAddress,
    email,
    paymentMethod = 'paystack',
    platformFeePercent = 2.5,
    ussdNetwork = 'MTN',
    authorizationCode,
    referralToken
  } = req.body;

  if ((!productId && !product?.title) || !customerName || !customerPhone || !deliveryAddress) {
    return res.status(400).json({ message: 'Product and customer details are required.' });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ message: 'Paystack is not configured on the server.' });
  }

  const storedProduct = productId ? await Product.findById(productId).lean() : product;
  if (!storedProduct?.title || !Number.isFinite(Number(storedProduct.price))) return res.status(404).json({ message: 'Product not found.' });
  if (Number(storedProduct.inventoryCount) < 1 || Number(storedProduct.inventoryCount) < Number(quantity)) return res.status(409).json({ message: 'Product is out of stock.' });
  const merchantId = storedProduct.merchantId;
  if (!merchantId || !(await Merchant.exists({ _id: merchantId, isSuspended: false, isVerified: true }))) return res.status(404).json({ message: 'Store is not approved.' });
  const itemQuantity = Math.max(1, Number(quantity));
  const totalAmount = Number(storedProduct.price) * itemQuantity;
  const split = calculateSplit(totalAmount, platformFeePercent);
  const splitPayload = buildSplitPayload({
    amount: split.totalAmount,
    platformFeePercent: split.platformFeePercent,
    subAccountCode: process.env.PAYSTACK_SUBACCOUNT_CODE,
    currency: 'GHS'
  });
  const order = await Order.create({
    customerName,
    customerPhone,
    customerEmail: String(email || '').toLowerCase(),
    deliveryAddress,
    merchantId,
    items: [{
      productId: storedProduct._id,
      title: storedProduct.title,
      quantity: itemQuantity,
      unitPrice: Number(storedProduct.price)
    }],
    totalAmount,
    paymentStatus: 'pending',
    paymentMethod: paymentMethod === 'momo_ussd' ? 'momo-ussd' : 'paystack',
    syncStatus: 'pending',
    source: 'web'
  });

  if (referralToken) {
    const referral = await ReferralGroup.findOne({ token: referralToken, status: 'active', expiresAt: { $gt: new Date() } }).select('_id');
    if (referral) {
      order.referralGroupId = referral._id;
      await order.save();
    }
  }

  try {
    const response = await axios.post(`${paystackUrl}/transaction/initialize`, {
      email: email || `${customerPhone.replace(/\D/g, '')}@checkout.local`,
      amount: Math.round(totalAmount * 100),
      currency: 'GHS',
      channels: paymentMethod === 'momo_ussd' ? ['mobile_money'] : ['card', 'mobile_money'],
      split: splitPayload.split,
      metadata: {
        orderId: order._id.toString(),
        customerPhone,
        paymentMethod,
        platformFeePercent,
        transactionType: paymentMethod === 'momo_ussd' ? 'ussd' : 'standard',
        ussdNetwork,
        authorizationCode,
        merchantShare: split.merchantShare,
        platformFee: split.platformFee
      }
    }, { headers: paystackHeaders() });

    order.paystackReference = response.data.data.reference;
    await order.save();

    return res.status(201).json({
      orderId: order._id,
      authorizationUrl: response.data.data.authorization_url,
      reference: order.paystackReference,
      paymentMethod,
      split,
      splitMeta: splitPayload.metadata,
      ussdPush: paymentMethod === 'momo_ussd' ? {
        network: ussdNetwork,
        prompt: `Dial *170# and select the MoMo push prompt to authorize GH₵ ${split.totalAmount.toFixed(2)}.`,
        amount: split.totalAmount,
        reference: order.paystackReference
      } : null
    });
  } catch (error) {
    order.paymentStatus = 'failed';
    await order.save();
    return res.status(502).json({
      message: 'Unable to initialize Paystack payment.',
      details: error.response?.data || error.message
    });
  }
}

async function handlePaystackWebhook(req, res) {
  const { handlePaystackCommerceWebhook } = require('./commerceWebhookController');
  return handlePaystackCommerceWebhook(req, res);
  /*
  const signature = req.headers['x-paystack-signature'];
  const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const expectedSignature = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
    .update(payload)
    .digest('hex');
  const signaturesMatch = signature
    && Buffer.byteLength(signature) === Buffer.byteLength(expectedSignature)
    && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!signaturesMatch) {
    return res.status(401).json({ message: 'Invalid Paystack signature.' });
  }

  const event = JSON.parse(payload.toString('utf8'));
  if (event.event === 'charge.success') {
    const reference = event.data?.reference;
    await Order.findOneAndUpdate(
      { paystackReference: reference },
      { paymentStatus: 'paid', syncStatus: 'synced' }
    );
  }

  return res.sendStatus(200);
  */
}

module.exports = { initializeCheckout, handlePaystackWebhook, calculateSplit };
