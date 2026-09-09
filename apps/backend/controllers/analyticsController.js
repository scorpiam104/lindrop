const Merchant = require('../models/Merchant');
const Order = require('../models/Order');
const Product = require('../models/Product');

function rangeStart(range) {
  const now = new Date();
  if (range === '7d') return new Date(now.getTime() - 7 * 86400000);
  if (range === '30d') return new Date(now.getTime() - 30 * 86400000);
  return new Date(now.getTime() - 365 * 86400000);
}

function unitFor(range) { return range === '12m' ? 'month' : 'day'; }

function trendPipeline(match, range) {
  return [
    { $match: { ...match, createdAt: { $gte: rangeStart(range) }, paymentStatus: 'paid' } },
    { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: unitFor(range), timezone: 'UTC' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 }, aov: { $avg: '$totalAmount' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1, aov: 1 } }
  ];
}

async function getAdminAnalytics(req, res) {
  const range = ['7d', '30d', '12m'].includes(req.query.range) ? req.query.range : '30d';
  const start = rangeStart(range);
  const [gmv, merchantGrowth, paymentMethods] = await Promise.all([
    Order.aggregate([{ $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } }, { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: unitFor(range), timezone: 'UTC' } }, gmv: { $sum: '$totalAmount' }, commission: { $sum: { $multiply: ['$totalAmount', 0.02] } } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', gmv: 1, commission: 1 } }]),
    Merchant.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: unitFor(range), timezone: 'UTC' } }, signups: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, suspended: { $sum: { $cond: [{ $or: [{ $eq: ['$status', 'suspended'] }, { $eq: ['$isSuspended', true] }] }, 1, 0] } } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', signups: 1, active: 1, suspended: 1 } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }, { $project: { _id: 0, method: '$_id', count: 1, total: 1 } }, { $sort: { count: -1 } }])
  ]);
  return res.json({ range, gmv, merchantGrowth, paymentMethods });
}

async function getMerchantAnalytics(req, res) {
  const range = ['7d', '30d', '12m'].includes(req.query.range) ? req.query.range : '30d';
  const match = { merchantId: req.merchant._id };
  const [performance, products, social] = await Promise.all([
    Order.aggregate(trendPipeline(match, range)),
    Order.aggregate([{ $match: { ...match, paymentStatus: 'paid', createdAt: { $gte: rangeStart(range) } } }, { $unwind: '$items' }, { $group: { _id: '$items.title', revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }, units: { $sum: '$items.quantity' } } }, { $sort: { revenue: -1 } }, { $limit: 5 }, { $project: { _id: 0, product: '$_id', revenue: 1, units: 1 } }]),
    Product.aggregate([{ $match: { merchantId: req.merchant._id } }, { $project: { shares: '$shareCount', platform: { $ifNull: ['$lastSharedPlatform', 'direct'] } } }, { $group: { _id: '$platform', shares: { $sum: '$shares' } } }, { $project: { _id: 0, platform: '$_id', shares: 1, orders: { $literal: 0 } } }, { $sort: { shares: -1 } }])
  ]);
  const [views, orders, paidOrders] = await Promise.all([Product.aggregate([{ $match: { merchantId: req.merchant._id } }, { $group: { _id: null, views: { $sum: { $ifNull: ['$viewCount', 0] } } } }]), Order.countDocuments({ ...match, createdAt: { $gte: rangeStart(range) } }), Order.countDocuments({ ...match, paymentStatus: 'paid', createdAt: { $gte: rangeStart(range) } })]);
  return res.json({ range, performance, funnel: { productViews: views[0]?.views || 0, cartAdds: orders, completedCheckouts: paidOrders }, social, products });
}

async function getCustomerAnalytics(req, res) {
  const email = String(req.merchant?.email || req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ message: 'Customer email is required.' });
  const history = await Order.aggregate([{ $match: { customerEmail: email, paymentStatus: 'paid', createdAt: { $gte: rangeStart('12m') } } }, { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: 'month', timezone: 'UTC' } }, spending: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', spending: 1, orders: 1 } }]);
  return res.json({ history, email });
}

module.exports = { getAdminAnalytics, getMerchantAnalytics, getCustomerAnalytics };