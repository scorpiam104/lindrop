const express = require('express');
const { getAdminAnalytics, getCustomerAnalytics, getMerchantAnalytics } = require('../controllers/analyticsController');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();
router.get('/admin', requireAuth, requireAdmin, getAdminAnalytics);
router.get('/merchant', requireAuth, getMerchantAnalytics);
router.get('/customer', requireAuth, getCustomerAnalytics);
module.exports = router;