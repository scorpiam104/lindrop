const express = require('express');
const { handleIncomingWhatsAppMessage, generateProductReply } = require('../controllers/assistantController');
const { verifyMetaWebhook, normalizeWhatsAppBody } = require('../services/whatsappService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/whatsapp/webhook', verifyMetaWebhook);
router.post('/whatsapp/webhook', async (req, res) => {
  const normalized = normalizeWhatsAppBody(req.body);
  if (!normalized) return res.sendStatus(200);

  const syntheticRequest = {
    body: {
      from: normalized.from,
      message: normalized.text,
      merchantId: null,
      merchantSlug: null
    }
  };

  const syntheticResponse = { json: (payload) => payload, status: () => syntheticResponse };
  await handleIncomingWhatsAppMessage(syntheticRequest, syntheticResponse);
  return res.sendStatus(200);
});
router.post('/reply', requireAuth, generateProductReply);

module.exports = router;
