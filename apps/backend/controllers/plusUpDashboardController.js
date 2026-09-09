const Order = require('../models/Order');
const Product = require('../models/Product');
const ReferralGroup = require('../models/ReferralGroup');
const Merchant = require('../models/Merchant');
const { updateInventory } = require('../services/inventoryService');

async function getDashboard(req, res) {
  const merchantId = req.merchant._id;
  const [orders, products, referrals] = await Promise.all([
    Order.find({ merchantId }).sort({ createdAt: -1 }).limit(50).lean(),
    Product.find({ merchantId }).sort({ createdAt: -1 }).lean(),
    ReferralGroup.find({ merchantId, status: { $in: ['active', 'reward_pending'] }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean()
  ]);
  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid');
  return res.json({
    sales: { orders: paidOrders.length, revenue: paidOrders.reduce((sum, order) => sum + order.totalAmount, 0) },
    orders,
    products,
    activeGroupBuyReferrals: referrals,
    bot: req.merchant.whatsappBot || {}
  });
}

async function syncInventory(req, res) {
  try {
    const product = await updateInventory({ productId: req.params.productId, merchantId: req.merchant._id, inventoryCount: req.body.inventoryCount, inventorySyncEnabled: req.body.inventorySyncEnabled });
    return res.json({ product, channels: { whatsapp: product.inventorySyncEnabled, storefront: true, dashboard: true } });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function createDashboardProduct(req, res) {
  const { title, description = '', price, inventoryCount = 0, imageUrl = '' } = req.body;
  if (!title || !Number.isFinite(Number(price))) return res.status(400).json({ message: 'Title and price are required.' });
  const product = await Product.create({ merchantId: req.merchant._id, title, description, price: Number(price), inventoryCount: Number(inventoryCount), imageUrl });
  const quickLink = `${process.env.PUBLIC_APP_URL || 'https://plusup.site'}/api/webhooks/whatsapp?trigger=BUY%20${product._id}`;
  return res.status(201).json({ product, quickLink, qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(quickLink)}` });
}

async function getBotConfig(req, res) {
  return res.json({ bot: req.merchant.whatsappBot || {}, whatsappPhoneNumberId: req.merchant.whatsappPhoneNumberId || '' });
}

async function updateBotConfig(req, res) {
  const { enabled, triggerKeywords, catalogId, autoReplyEnabled, whatsappPhoneNumberId } = req.body;
  const merchant = await Merchant.findByIdAndUpdate(req.merchant._id, { $set: { whatsappPhoneNumberId, whatsappBot: { enabled, triggerKeywords, catalogId, autoReplyEnabled } } }, { new: true, runValidators: true });
  return res.json({ bot: merchant.whatsappBot, whatsappPhoneNumberId: merchant.whatsappPhoneNumberId });
}

async function getReferral(req, res) {
  const referral = await ReferralGroup.findOne({ token: req.params.token, expiresAt: { $gt: new Date() } }).lean();
  if (!referral) return res.status(404).json({ message: 'Referral link expired.' });
  return res.json({ referral: { token: referral.token, expiresAt: referral.expiresAt, purchases: referral.referredOrderIds.length, remaining: Math.max(0, 3 - referral.referredOrderIds.length) } });
}

async function getReceipt(req, res) {
  const order = await Order.findById(req.params.orderId).lean();
  if (!order || order.paymentStatus !== 'paid') return res.status(404).json({ message: 'Receipt not available.' });
  return res.json({ receipt: { transactionId: order.paystackReference, paidAt: order.updatedAt, totalAmount: order.totalAmount, items: order.items, paymentMethod: order.paymentMethod } });
}

module.exports = { getDashboard, syncInventory, createDashboardProduct, getBotConfig, updateBotConfig, getReferral, getReceipt };
