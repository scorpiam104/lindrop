const axios = require('axios');

function verifyMetaWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'lindrop-webhook';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Forbidden');
}

function normalizeWhatsAppBody(payload) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const messageEntry = entries.find((entry) => Array.isArray(entry?.changes))?.changes?.[0]?.value || null;

  if (!messageEntry) return null;

  const message = Array.isArray(messageEntry.messages) ? messageEntry.messages[0] : null;
  if (!message) return null;

  return {
    from: message.from,
    type: message.type,
    text: message.text?.body || '',
    interactiveId: message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || '',
    id: message.id,
    metadata: messageEntry.metadata || null,
    businessPhoneNumberId: messageEntry.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || null
  };
}

async function sendWhatsAppMessage({ to, text, templateName, templateLanguage = 'en', mediaUrl }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp Business API credentials are not configured.');
  }

  const payload = mediaUrl
    ? buildMetaImagePayload({ to, imageUrl: mediaUrl, caption: text || '' })
    : templateName
      ? buildMetaTemplatePayload({
          to,
          templateName,
          templateLanguage,
          parameters: [text]
        })
      : buildMetaTextPayload({ to, text });

  const response = await axios.post(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

async function sendWhatsAppPayload(to, payload) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) throw new Error('WhatsApp Business API credentials are not configured.');
  const response = await axios.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    ...payload
  }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
  return response.data;
}

function buildProductCardPayload({ product, currency = 'GHS' }) {
  const price = `${currency} ${Number(product.price || 0).toFixed(2)}`;
  const stock = Number(product.inventoryCount || 0);
  return {
    type: 'interactive',
    interactive: {
      type: 'button',
      header: product.imageUrl ? { type: 'image', image: { link: product.imageUrl } } : undefined,
      body: { text: `*${product.title}*\n${product.description || 'Available now'}\nPrice: ${price}\nStock: ${stock}` },
      footer: { text: stock > 0 ? 'Tap Buy Now to continue' : 'Out of stock - join the waitlist' },
      action: { buttons: stock > 0 ? [{ type: 'reply', reply: { id: `buy:${product._id}`, title: 'Buy Now' } }] : [{ type: 'reply', reply: { id: `waitlist:${product._id}`, title: 'Join Waitlist' } }] }
    }
  };
}

async function sendProductCard({ to, product }) {
  return sendWhatsAppPayload(to, buildProductCardPayload({ product }));
}

async function sendMomoPrompt({ to, amount }) {
  return sendWhatsAppMessage({ to, text: `To pay GHS ${Number(amount).toFixed(2)} by Mobile Money, reply with your MoMo number and network: MTN, Vodafone, or Tigo.\nExample: 0240000000 MTN` });
}

async function sendReceipt({ to, order, referralLink }) {
  const items = order.items.map((item) => `${item.title} x${item.quantity} - GHS ${(item.unitPrice * item.quantity).toFixed(2)}`).join('\n');
  return sendWhatsAppMessage({ to, text: `Payment received ✅\nTransaction: ${order.paystackReference}\n${items}\nTotal: GHS ${Number(order.totalAmount).toFixed(2)}\nReceipt: ${order.receiptUrl || process.env.PUBLIC_APP_URL || ''}${referralLink ? `\nShare & save: ${referralLink}` : ''}` });
}

function buildMetaTemplatePayload({ to, templateName, templateLanguage = 'en', parameters = [] }) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [{
        type: 'body',
        parameters: parameters.map((parameter) => ({
          type: 'text',
          text: parameter
        }))
      }]
    }
  };
}

function buildMetaTextPayload({ to, text }) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  };
}

function buildMetaImagePayload({ to, imageUrl, caption }) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption || ''
    }
  };
}

module.exports = {
  verifyMetaWebhook,
  normalizeWhatsAppBody,
  sendWhatsAppMessage,
  buildMetaTextPayload,
  buildMetaImagePayload,
  buildMetaTemplatePayload
  ,sendWhatsAppPayload
  ,buildProductCardPayload
  ,sendProductCard
  ,sendMomoPrompt
  ,sendReceipt
};
