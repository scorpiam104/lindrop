const Order = require('../models/Order');

async function listMerchantOrders(req, res) {
  const orders = await Order.find({ merchantId: req.merchant._id }).sort({ createdAt: -1 }).limit(100).lean();
  return res.json(orders);
}

module.exports = { listMerchantOrders };
