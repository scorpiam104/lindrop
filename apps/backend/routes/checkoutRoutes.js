const express = require('express');
const { handlePaystackWebhook, initializeCheckout } = require('../controllers/checkoutController');

const router = express.Router();

router.post('/initialize', initializeCheckout);
router.post('/webhook', handlePaystackWebhook);

module.exports = router;
