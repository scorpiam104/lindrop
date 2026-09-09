const mongoose = require('mongoose');

const referralGroupSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  sourceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  sourceCustomerPhone: { type: String, required: true, trim: true },
  token: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['active', 'reward_pending', 'rewarded', 'expired'], default: 'active' },
  referredOrderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  expiresAt: { type: Date, required: true, index: true },
  cashbackAmount: { type: Number, default: 0, min: 0 },
  transferReference: { type: String, default: '' },
  rewardedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('ReferralGroup', referralGroupSchema);
