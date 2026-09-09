const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  type: { type: String, enum: ['payout', 'settlement', 'refund'], required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'processing', 'successful', 'failed'], default: 'pending' },
  reference: { type: String, required: true, unique: true },
  destination: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);