const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerEmail: { type: String, default: '', lowercase: true, trim: true, index: true },
  deliveryAddress: { type: String, required: true, trim: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['paystack', 'momo-ussd', 'offline-pos', 'cash'], default: 'paystack' },
  source: { type: String, enum: ['web', 'whatsapp', 'dashboard', 'pos'], default: 'web', index: true },
  whatsappPhone: { type: String, default: '', index: true },
  momo: {
    phone: { type: String, default: '' },
    provider: { type: String, default: '' },
    chargeStatus: { type: String, default: '' },
    transactionId: { type: String, default: '' }
  },
  referralGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralGroup', default: null, index: true },
  receiptUrl: { type: String, default: '' },
  syncStatus: { type: String, enum: ['pending', 'synced'], default: 'pending' },
  recoveryStatus: { type: String, enum: ['pending', 'queued', 'sent'], default: 'pending' },
  recoveryQueuedAt: { type: Date, default: null },
  recoveryMessage: { type: String, default: '' },
  shippingFee: { type: Number, default: 0, min: 0 },
  deliveryStatus: { type: String, enum: ['pending', 'dispatched', 'in_transit', 'delivered'], default: 'pending' },
  courierProvider: { type: String, default: '' },
  trackingCode: { type: String, default: '' },
  trackingUrl: { type: String, default: '' },
  deliveryEtaMinutes: { type: Number, default: null },
  geo: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  paystackReference: { type: String, index: true, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
