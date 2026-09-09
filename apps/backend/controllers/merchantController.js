const Merchant = require('../models/Merchant');
const Order = require('../models/Order');
const Product = require('../models/Product');

function serialize(merchant) {
  return {
    id: merchant._id,
    email: merchant.email,
    businessName: merchant.businessName,
    phone: merchant.phone,
    logoUrl: merchant.logoUrl,
    slug: merchant.slug,
    storeSlug: merchant.slug,
    paystackPublicKey: merchant.paystackPublicKey,
    role: merchant.role,
    isVerified: merchant.isVerified,
    totalViews: merchant.totalViews,
    contactDetails: merchant.contactDetails || {},
    socialHandles: merchant.socialHandles || {},
    storeName: merchant.storeName || merchant.businessName,
    storeSlug: merchant.storeSlug || merchant.slug,
    description: merchant.description || '',
    subscriptionTier: merchant.subscriptionTier || 'free',
    status: merchant.status || (merchant.isVerified ? 'active' : 'pending_kyc'),
    customDomain: merchant.customDomain || '',
    metaPixelId: merchant.metaPixelId || '',
    tiktokPixelId: merchant.tiktokPixelId || '',
    googleAnalyticsId: merchant.googleAnalyticsId || '',
    socialConnections: {
      facebookPageId: merchant.socialConnections?.facebookPageId || null,
      instagramBusinessAccountId: merchant.socialConnections?.instagramBusinessAccountId || null,
    }
  };
}

async function getMe(req, res) {
  // return merchant profile including social/contact settings (sensitive tokens excluded)
  try {
    const merchant = await Merchant.findById(req.merchant._id).select('-passwordHash');
    if (!merchant) return res.status(404).json({ message: 'Merchant not found.' });
    return res.json({ merchant: serialize(merchant) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve merchant profile.' });
  }
}

async function updateStore(req, res) {
  // Allow merchants to update store basic info plus contactDetails, socialHandles and optional socialConnections (tokens)
  const { businessName, storeName, slug, storeSlug, description, logoUrl, paystackPublicKey, contactDetails, socialHandles, socialConnections, customDomain, metaPixelId, tiktokPixelId, googleAnalyticsId } = req.body;

  const updates = {};
  const tier = req.merchant.subscriptionTier || 'free';
  if (tier === 'free' && (customDomain || metaPixelId || tiktokPixelId || googleAnalyticsId)) {
    return res.status(403).json({ message: 'Analytics pixels and custom domains require a Pro or Enterprise plan.' });
  }
  if (businessName !== undefined) updates.businessName = businessName;
  if (storeName !== undefined) updates.storeName = storeName;
  if (slug !== undefined) updates.slug = slug?.toLowerCase().trim();
  if (storeSlug !== undefined) updates.storeSlug = storeSlug?.toLowerCase().trim();
  if (description !== undefined) updates.description = description;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (paystackPublicKey !== undefined) updates.paystackPublicKey = paystackPublicKey;
  if (contactDetails !== undefined) updates.contactDetails = contactDetails;
  if (socialHandles !== undefined) updates.socialHandles = socialHandles;
  if (customDomain !== undefined) updates.customDomain = customDomain.trim().toLowerCase();
  if (metaPixelId !== undefined) updates.metaPixelId = metaPixelId.trim();
  if (tiktokPixelId !== undefined) updates.tiktokPixelId = tiktokPixelId.trim();
  if (googleAnalyticsId !== undefined) updates.googleAnalyticsId = googleAnalyticsId.trim();

  try {
    // If metaAccessToken provided, only set the allowed connection fields
    if (socialConnections && typeof socialConnections === 'object') {
      const conn = {};
      if (socialConnections.metaAccessToken) conn['socialConnections.metaAccessToken'] = socialConnections.metaAccessToken;
      if (socialConnections.facebookPageId) conn['socialConnections.facebookPageId'] = socialConnections.facebookPageId;
      if (socialConnections.instagramBusinessAccountId) conn['socialConnections.instagramBusinessAccountId'] = socialConnections.instagramBusinessAccountId;
      Object.assign(updates, conn);
    }

    const merchant = await Merchant.findByIdAndUpdate(req.merchant._id, { $set: updates }, { new: true, runValidators: true });
    return res.json({ merchant: serialize(merchant) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That store URL is already in use.' });
    console.error('Update store error:', error);
    return res.status(400).json({ message: 'Unable to update store settings.' });
  }
}

async function getPublicStore(req, res) {
  const merchant = await Merchant.findOneAndUpdate({ slug: req.params.storeSlug, isSuspended: false, isVerified: true }, { $inc: { totalViews: 1 } }, { new: true }).select('businessName logoUrl slug isVerified totalViews');
  if (!merchant) return res.status(404).json({ message: 'Store not found.' });
  return res.json({ merchant: serialize(merchant) });
}

async function getDashboardStats(req, res) {
  const [orders, productCount] = await Promise.all([
    Order.find({ merchantId: req.merchant._id }).select('totalAmount paymentStatus').lean(),
    Product.countDocuments({ merchantId: req.merchant._id })
  ]);
  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid');
  const sales = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const activeOrders = orders.filter((order) => order.paymentStatus === 'pending').length;
  return res.json({ sales, activeOrders, totalViews: req.merchant.totalViews || 0, conversionRate: req.merchant.totalViews ? (orders.length / req.merchant.totalViews) * 100 : 0, productCount });
}

module.exports = { getDashboardStats, getMe, getPublicStore, updateStore };
