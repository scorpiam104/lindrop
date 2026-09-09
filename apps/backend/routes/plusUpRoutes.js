const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDashboard, syncInventory, createDashboardProduct, getBotConfig, updateBotConfig, getReferral, getReceipt } = require('../controllers/plusUpDashboardController');
const { handleWhatsAppMessage, handlePaystackCommerceWebhook } = require('../controllers/commerceWebhookController');
const { verifyMetaWebhook } = require('../services/whatsappService');

const router = express.Router();
router.get('/webhooks/whatsapp', verifyMetaWebhook);
router.post('/webhooks/whatsapp', handleWhatsAppMessage);
router.post('/webhooks/paystack', handlePaystackCommerceWebhook);
router.get('/refer/:token', getReferral);
router.get('/orders/:orderId/receipt', getReceipt);
router.get('/merchant/dashboard', requireAuth, getDashboard);
router.post('/merchant/dashboard/products', requireAuth, createDashboardProduct);
router.patch('/merchant/dashboard/products/:productId/inventory', requireAuth, syncInventory);
router.get('/merchant/dashboard/bot', requireAuth, getBotConfig);
router.put('/merchant/dashboard/bot', requireAuth, updateBotConfig);

module.exports = router;
