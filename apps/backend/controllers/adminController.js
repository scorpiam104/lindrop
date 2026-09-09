const Merchant = require('../models/Merchant');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function getOverview(req, res) {
  const [activeMerchants, totalProducts, paidOrders] = await Promise.all([
    Merchant.countDocuments({ $or: [{ status: 'active' }, { isSuspended: false, isVerified: true }] }),
    Product.countDocuments(),
    Order.find({ paymentStatus: 'paid' }).select('totalAmount').lean()
  ]);
  const totalPlatformGmv = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  return res.json({ totalPlatformGmv, platformCommissionEarnings: totalPlatformGmv * 0.02, activeMerchants, totalProducts, status: 'operational' });
}

async function getStats(req, res) {
  const [merchantCount, pendingApprovals, paidOrders, pendingOrders] = await Promise.all([
    Merchant.countDocuments({ role: 'merchant' }),
    Merchant.countDocuments({ $or: [{ status: 'pending_kyc' }, { isVerified: false, isSuspended: false }] }),
    Order.find({ paymentStatus: 'paid' }).select('totalAmount').lean(),
    Order.countDocuments({ paymentStatus: 'pending' })
  ]);
  const volume = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  return res.json({ merchants: merchantCount, pendingApprovals, platformVolume: volume, commission: volume * 0.02, pendingOrders, status: 'operational' });
}

async function listMerchants(req, res) { return res.json(await Merchant.find({}).select('-passwordHash -ghanaCardNumber').sort({ createdAt: -1 }).lean()); }
async function listPendingKyc(req, res) { return res.json(await Merchant.find({ $or: [{ status: 'pending_kyc' }, { isKycVerified: false, isVerified: false }] }).select('-passwordHash -ghanaCardNumber').sort({ createdAt: -1 }).lean()); }

async function approveKyc(req, res) {
  const merchant = await Merchant.findByIdAndUpdate(req.params.merchantId, { $set: { isKycVerified: true, isVerified: true, status: 'active', isSuspended: false } }, { new: true, runValidators: true }).select('-passwordHash -ghanaCardNumber');
  if (!merchant) return res.status(404).json({ message: 'Merchant not found.' });
  return res.json({ merchant });
}

async function updateMerchantStatus(req, res) {
  const suspended = req.body.status === 'suspended' || req.body.isSuspended === true;
  const merchant = await Merchant.findByIdAndUpdate(req.body.merchantId, { $set: { isSuspended: suspended, status: suspended ? 'suspended' : 'active' } }, { new: true, runValidators: true }).select('-passwordHash');
  if (!merchant) return res.status(404).json({ message: 'Merchant not found.' });
  return res.json({ merchant });
}

async function updateTier(req, res) {
  const tier = String(req.body.subscriptionTier || '').toLowerCase();
  if (!['free', 'pro', 'enterprise'].includes(tier)) return res.status(400).json({ message: 'subscriptionTier must be free, pro, or enterprise.' });
  const merchant = await Merchant.findByIdAndUpdate(req.body.merchantId, { subscriptionTier: tier }, { new: true, runValidators: true }).select('-passwordHash');
  if (!merchant) return res.status(404).json({ message: 'Merchant not found.' });
  return res.json({ merchant });
}

async function updateMerchant(req, res) {
  const updates = {};
  ['isSuspended', 'isVerified'].forEach((key) => { if (typeof req.body[key] === 'boolean') updates[key] = req.body[key]; });
  const merchant = await Merchant.findByIdAndUpdate(req.params.merchantId, updates, { new: true, runValidators: true }).select('-passwordHash');
  if (!merchant) return res.status(404).json({ message: 'Merchant not found.' });
  return res.json(merchant);
}

module.exports = { getOverview, getStats, listMerchants, listPendingKyc, approveKyc, updateMerchantStatus, updateTier, updateMerchant };
