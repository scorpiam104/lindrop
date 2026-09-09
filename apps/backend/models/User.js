const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  dateOfBirth: { type: Date },
  phoneNumber: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['customer', 'staff', 'merchant', 'admin'], default: 'customer' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null, index: true },
  staffRole: { type: String, enum: ['store_assistant', 'inventory_manager', 'fulfillment_agent', 'none'], default: 'none' },
  isActive: { type: Boolean, default: true },
  twoFactorSecret: { type: String, select: false, default: null },
  isTwoFactorEnabled: { type: Boolean, default: false },
  resetPasswordToken: { type: String, select: false, default: null, index: true },
  resetPasswordExpires: { type: Date, select: false, default: null },
  twoFactorBackupCodes: [{ type: String, select: false }],
  passkeys: [{ credentialId: { type: String, required: true }, publicKey: { type: String, required: true }, counter: { type: Number, default: 0 } }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);