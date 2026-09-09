const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  customerPhone: { type: String, required: true, trim: true },
  state: { type: String, enum: ['IDLE', 'PRODUCT_VIEWED', 'AWAITING_MOMO_NUMBER', 'PAYMENT_PENDING', 'COMPLETED'], default: 'IDLE' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  provider: { type: String, enum: ['mtn', 'vodafone', 'tigo'], default: 'mtn' },
  momoPhone: { type: String, default: '' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000), index: true }
}, { timestamps: true });

whatsappSessionSchema.index({ merchantId: 1, customerPhone: 1 }, { unique: true });
whatsappSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WhatsAppSession', whatsappSessionSchema);
