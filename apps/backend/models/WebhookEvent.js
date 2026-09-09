const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  eventId: { type: String, required: true },
  eventType: { type: String, default: '' },
  payload: { type: mongoose.Schema.Types.Mixed, default: null },
  processedAt: { type: Date, default: null },
  status: { type: String, enum: ['received', 'processed', 'failed'], default: 'received' },
  error: { type: String, default: '' }
}, { timestamps: true });

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
