const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  inventoryCount: { type: Number, required: true, min: 0, default: 0 },
  inventorySyncEnabled: { type: Boolean, default: true },
  waitlistEnabled: { type: Boolean, default: true },
  imageUrl: { type: String, default: '' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  // Social sharing & ad generation fields
  adCopyCache: { type: Map, of: String, default: {} },
  shareCount: { type: Number, default: 0 },
  lastSharedAt: { type: Date, default: null },
  lastSharedPlatform: { type: String, default: null }
}, { timestamps: true });

productSchema.index({ merchantId: 1, title: 1 });

module.exports = mongoose.model('Product', productSchema);
