const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  businessName: { type: String, default: '', trim: true },
  storeName: { type: String, default: '', trim: true },
  storeSlug: { type: String, default: null, lowercase: true, trim: true, sparse: true, unique: true },
  description: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  storeTheme: { type: String, enum: ['aurora', 'minimal', 'noir', 'candy', 'editorial', 'ocean', 'sunset', 'botanical', 'mono', 'playful'], default: 'aurora' },
  phone: { type: String, default: '', trim: true },
  firstName: { type: String, default: '', trim: true },
  surname: { type: String, default: '', trim: true },
  dateOfBirth: { type: String, default: '', trim: true },
  gender: { type: String, default: '', trim: true },
  logoUrl: { type: String, default: '' },
  slug: { type: String, default: '', unique: true, lowercase: true, trim: true, sparse: true },
  paystackPublicKey: { type: String, default: '' },
  totalViews: { type: Number, default: 0, min: 0 },
  role: { type: String, enum: ['merchant', 'assistant', 'admin'], default: 'merchant' },
  financialAccess: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  subscriptionTier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['pending_kyc', 'active', 'suspended'], default: 'pending_kyc' },
  ghanaCardNumber: { type: String, default: '', select: false },
  digitalAddress: { type: String, default: '' },
  momoPayoutNumber: { type: String, default: '' },
  momoAccountName: { type: String, default: '' },
  isKycVerified: { type: Boolean, default: false },
  whatsappNumber: { type: String, default: '' },
  whatsappPhoneNumberId: { type: String, default: '', index: true },
  whatsappBot: {
    enabled: { type: Boolean, default: false },
    triggerKeywords: { type: [String], default: ['buy', 'shop'] },
    catalogId: { type: String, default: '' },
    autoReplyEnabled: { type: Boolean, default: true }
  },
  telegramUsername: { type: String, default: '' },
  instagramHandle: { type: String, default: '' },
  facebookPageUrl: { type: String, default: '' },
  tiktokHandle: { type: String, default: '' },
  twitterHandle: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  customDomain: { type: String, default: '' },
  metaPixelId: { type: String, default: '' },
  tiktokPixelId: { type: String, default: '' },
  googleAnalyticsId: { type: String, default: '' },
  paystackSubaccountCode: { type: String, default: '' },
  clearedBalance: { type: Number, default: 0, min: 0 },
  pendingBalance: { type: Number, default: 0, min: 0 },
  resetPasswordToken: { type: String, select: false, default: null, index: true },
  resetPasswordExpires: { type: Date, select: false, default: null },
  twoFactorBackupCodes: [{ type: String, select: false }],

  // Contact & Direct Messaging
  contactDetails: {
    whatsappNumber: { type: String, default: null, trim: true },
    telegramUsername: { type: String, default: null, trim: true },
    supportEmail: { type: String, default: null, lowercase: true, trim: true }
  },

  // Social Media Handles & Profile Links
  socialHandles: {
    instagramHandle: { type: String, default: null, trim: true },
    facebookPageUrl: { type: String, default: null },
    twitterHandle: { type: String, default: null, trim: true },
    tiktokHandle: { type: String, default: null, trim: true },
    linkedinUrl: { type: String, default: null },
    youtubeChannelUrl: { type: String, default: null },
    pinterestUsername: { type: String, default: null, trim: true },
    threadsHandle: { type: String, default: null, trim: true }
  },

  // Merchant-Level Direct API Auth Tokens for Social Posting
  socialConnections: {
    // Facebook & Instagram Direct Posting
    metaAccessToken: { type: String, default: null, select: false }, // User access token (sensitive - excluded by default)
    facebookPageId: { type: String, default: null },
    instagramBusinessAccountId: { type: String, default: null },
    // TikTok Direct Posting (future use)
    tiktokAccessToken: { type: String, default: null, select: false },
    tiktokUserId: { type: String, default: null }
  }
}, { timestamps: true });

// Middleware: Sanitize sensitive tokens before sending to client
merchantSchema.methods.toJSON = function() {
  const obj = this.toObject();
  if (obj.socialConnections) {
    delete obj.socialConnections.metaAccessToken;
    delete obj.socialConnections.tiktokAccessToken;
  }
  return obj;
};

module.exports = mongoose.model('Merchant', merchantSchema);
