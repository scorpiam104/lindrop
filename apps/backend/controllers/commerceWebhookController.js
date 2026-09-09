const crypto = require('crypto');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const Order = require('../models/Order');
const WhatsAppSession = require('../models/WhatsAppSession');
const WebhookEvent = require('../models/WebhookEvent');
const { get, set } = require('../services/redisService');
const { decrementInventory } = require('../services/inventoryService');
const { chargeMobileMoney } = require('../services/paystackService');
const { createReferralForOrder, registerReferralPurchase, referralUrl } = require('../services/referralService');
const { normalizeWhatsAppBody, sendWhatsAppMessage, sendProductCard, sendMomoPrompt, sendReceipt } = require('../services/whatsappService');

const SESSION_TTL = 30 * 60;
const sessionKey = (merchantId, phone) => `whatsapp:session:${merchantId}:${phone}`;

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function parseMomoDetails(text) {
  const match = String(text || '').trim().match(/(\+?\d[\d\s-]{8,})(?:\s+(mtn|vodafone|tigo))?/i);
  if (!match) return null;
  const phone = normalizePhone(match[1]);
  if (phone.length < 9) return null;
  const provider = String(match[2] || '').toLowerCase() || 'mtn';
  if (!['mtn', 'vodafone', 'tigo'].includes(provider)) return null;
  return { phone, provider };
}

async function resolveMerchant(phoneNumberId) {
  const query = phoneNumberId ? { whatsappPhoneNumberId: phoneNumberId } : { whatsappBot: { $exists: true } };
  return Merchant.findOne({ ...query, isSuspended: false, isVerified: true }).lean();
}

async function persistSession({ merchantId, customerPhone, state, productId = null, orderId = null, provider = 'mtn', momoPhone = '' }) {
  const value = { merchantId: String(merchantId), customerPhone, state, productId: productId ? String(productId) : null, orderId: orderId ? String(orderId) : null, provider, momoPhone };
  await set(sessionKey(merchantId, customerPhone), value, SESSION_TTL);
  return WhatsAppSession.findOneAndUpdate(
    { merchantId, customerPhone },
    { $set: { ...value, merchantId, productId, orderId, expiresAt: new Date(Date.now() + SESSION_TTL * 1000) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function loadSession(merchantId, customerPhone) {
  const cached = await get(sessionKey(merchantId, customerPhone));
  if (cached) return cached;
  return WhatsAppSession.findOne({ merchantId, customerPhone }).lean();
}

async function findProduct(merchantId, identifier) {
  const query = mongoose.isValidObjectId(identifier)
    ? { _id: identifier, merchantId }
    : { merchantId, title: new RegExp(`^${String(identifier).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  return Product.findOne(query).lean();
}

async function handleWhatsAppMessage(req, res) {
  const message = normalizeWhatsAppBody(req.body);
  if (!message) return res.sendStatus(200);
  if (message.id) {
    try {
      await WebhookEvent.create({ provider: 'whatsapp', eventId: message.id, eventType: message.type, payload: req.body, status: 'processed', processedAt: new Date() });
    } catch (error) {
      if (error.code === 11000) return res.sendStatus(200);
      throw error;
    }
  }
  const merchant = await resolveMerchant(message.businessPhoneNumberId);
  if (!merchant) return res.sendStatus(200);
  const phone = normalizePhone(message.from);
  const text = String(message.text || '').trim();
  const interactionId = message.interactiveId || '';
  const session = await loadSession(merchant._id, phone);
  const command = interactionId || text;

  if (interactionId.startsWith('buy:')) {
    const product = await Product.findOne({ _id: interactionId.slice(4), merchantId: merchant._id }).lean();
    if (!product || product.inventoryCount < 1) await sendWhatsAppMessage({ to: phone, text: 'That product just sold out. Reply WAITLIST to be notified.' });
    else {
      await persistSession({ merchantId: merchant._id, customerPhone: phone, state: 'AWAITING_MOMO_NUMBER', productId: product._id });
      await sendMomoPrompt({ to: phone, amount: product.price });
    }
    return res.sendStatus(200);
  }

  if (/^buy[:\s]/i.test(command)) {
    const identifier = command.replace(/^buy[:\s]+/i, '').trim();
    const product = await findProduct(merchant._id, identifier);
    if (!product) await sendWhatsAppMessage({ to: phone, text: 'I could not find that product. Reply BUY followed by the product ID.' });
    else if (product.inventoryCount < 1) await sendWhatsAppMessage({ to: phone, text: `${product.title} is out of stock. Reply WAITLIST ${product._id} to join the waitlist.` });
    else {
      await persistSession({ merchantId: merchant._id, customerPhone: phone, state: 'PRODUCT_VIEWED', productId: product._id });
      await sendProductCard({ to: phone, product });
    }
    return res.sendStatus(200);
  }

  if (/^waitlist[:\s]/i.test(command)) {
    return sendWhatsAppMessage({ to: phone, text: 'You are on the waitlist. We will message you when this product is available.' }).then(() => res.sendStatus(200));
  }

  if (session?.state === 'AWAITING_MOMO_NUMBER') {
    const momo = parseMomoDetails(text);
    if (!momo) {
      await sendWhatsAppMessage({ to: phone, text: 'Please reply with your MoMo number and network, for example: 0240000000 MTN.' });
      return res.sendStatus(200);
    }
    const product = await Product.findOne({ _id: session.productId, merchantId: merchant._id }).lean();
    if (!product || product.inventoryCount < 1) {
      await sendWhatsAppMessage({ to: phone, text: 'That product is now out of stock. Reply WAITLIST to be notified.' });
      return res.sendStatus(200);
    }
    const reference = `WA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const order = await Order.create({
      merchantId: merchant._id,
      customerName: `WhatsApp ${phone.slice(-4)}`,
      customerPhone: phone,
      customerEmail: `${phone}@whatsapp.local`,
      deliveryAddress: 'WhatsApp delivery details pending',
      items: [{ productId: product._id, title: product.title, quantity: 1, unitPrice: product.price }],
      totalAmount: product.price,
      paymentStatus: 'pending',
      paymentMethod: 'paystack',
      source: 'whatsapp',
      whatsappPhone: phone,
      paystackReference: reference,
      momo: { phone: momo.phone, provider: momo.provider, chargeStatus: 'pending' }
    });
    try {
      const charge = await chargeMobileMoney({ email: order.customerEmail, amount: order.totalAmount, currency: 'GHS', phone: momo.phone, provider: momo.provider, reference, metadata: { orderId: String(order._id), merchantId: String(merchant._id), source: 'whatsapp' } });
      order.momo.chargeStatus = charge.data?.status || 'pending';
      await order.save();
      await persistSession({ merchantId: merchant._id, customerPhone: phone, state: 'PAYMENT_PENDING', productId: product._id, orderId: order._id, provider: momo.provider, momoPhone: momo.phone });
      await sendWhatsAppMessage({ to: phone, text: `MoMo prompt sent for GHS ${Number(order.totalAmount).toFixed(2)}. Approve it on your phone; I will send your receipt here.` });
    } catch (error) {
      await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed', 'momo.chargeStatus': 'failed' });
      await sendWhatsAppMessage({ to: phone, text: 'The MoMo prompt could not be started. No charge was completed. Please try again.' });
    }
    return res.sendStatus(200);
  }

  await sendWhatsAppMessage({ to: phone, text: 'Reply BUY <PRODUCT_ID> to view a product, or send BUY followed by a product ID.' });
  return res.sendStatus(200);
}

function verifyPaystackSignature(req) {
  const signature = req.headers['x-paystack-signature'];
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(raw).digest('hex');
  return Boolean(signature && signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)));
}

async function processSuccessfulCharge(event) {
  const reference = event.data?.reference;
  const order = await Order.findOne({ paystackReference: reference }).populate('items.productId');
  if (!order || order.paymentStatus === 'paid') return order;
  const mongoSession = await mongoose.startSession();
  let paidOrder;
  try {
    await mongoSession.withTransaction(async () => {
      paidOrder = await Order.findOneAndUpdate({ _id: order._id, paymentStatus: { $ne: 'paid' } }, { $set: { paymentStatus: 'paid', syncStatus: 'synced', 'momo.chargeStatus': 'success', 'momo.transactionId': String(event.data?.id || '') } }, { new: true, session: mongoSession });
      if (!paidOrder) return;
      for (const item of paidOrder.items) await decrementInventory({ productId: item.productId?._id || item.productId, quantity: item.quantity, session: mongoSession });
    });
  } finally {
    await mongoSession.endSession();
  }
  if (paidOrder) {
    if (paidOrder.whatsappPhone) await persistSession({ merchantId: paidOrder.merchantId, customerPhone: paidOrder.whatsappPhone, state: 'COMPLETED', productId: paidOrder.items[0]?.productId?._id || paidOrder.items[0]?.productId, orderId: paidOrder._id });
    const referral = await createReferralForOrder(paidOrder);
    if (paidOrder.referralGroupId) await registerReferralPurchase({ token: await getReferralToken(paidOrder.referralGroupId), orderId: paidOrder._id });
    const receiptOrder = paidOrder.toObject();
    receiptOrder.receiptUrl = `${process.env.PUBLIC_APP_URL || ''}/api/orders/${paidOrder._id}/receipt`;
    if (paidOrder.source === 'whatsapp') await sendReceipt({ to: paidOrder.whatsappPhone || paidOrder.customerPhone, order: receiptOrder, referralLink: referralUrl(referral.token) });
  }
  return paidOrder;
}

async function getReferralToken(groupId) {
  const ReferralGroup = require('../models/ReferralGroup');
  const group = await ReferralGroup.findById(groupId).select('token').lean();
  return group?.token;
}

async function handlePaystackCommerceWebhook(req, res) {
  if (!verifyPaystackSignature(req)) return res.status(401).json({ message: 'Invalid Paystack signature.' });
  const payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body;
  const eventId = String(payload.data?.id || payload.data?.reference || crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'));
  try {
    await WebhookEvent.create({ provider: 'paystack', eventId, eventType: payload.event, payload });
  } catch (error) {
    if (error.code === 11000) return res.sendStatus(200);
    throw error;
  }
  try {
    if (payload.event === 'charge.success') await processSuccessfulCharge(payload);
    await WebhookEvent.updateOne({ provider: 'paystack', eventId }, { $set: { status: 'processed', processedAt: new Date() } });
    return res.sendStatus(200);
  } catch (error) {
    await WebhookEvent.updateOne({ provider: 'paystack', eventId }, { $set: { status: 'failed', error: error.message } });
    return res.status(500).json({ message: 'Webhook processing failed.' });
  }
}

module.exports = { handleWhatsAppMessage, handlePaystackCommerceWebhook, processSuccessfulCharge };
