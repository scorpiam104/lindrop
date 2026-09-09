const express = require('express');
const { dispatchCourier, quoteShipping } = require('../controllers/fulfillmentController');
const { requireAuth, requireFinancialAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/quote', quoteShipping);
router.post('/orders/:orderId/dispatch', requireAuth, requireFinancialAccess, dispatchCourier);

module.exports = router;
