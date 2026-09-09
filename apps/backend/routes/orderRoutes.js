const express = require('express');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');
const { listMerchantOrders } = require('../controllers/orderController');

const router = express.Router();

router.get('/merchant', requireAuth, listMerchantOrders);

router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ merchantId: req.merchant._id }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch orders.' });
  }
});

module.exports = router;
