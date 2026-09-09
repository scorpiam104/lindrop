const Product = require('../models/Product');

const limits = { free: { products: 25, customDomain: false, pixels: false }, pro: { products: 500, customDomain: true, pixels: true }, enterprise: { products: Infinity, customDomain: true, pixels: true } };

function requireTier(feature) {
  return async function enforceTier(req, res, next) {
    const policy = limits[req.merchant?.subscriptionTier || 'free'] || limits.free;
    if (feature === 'customDomain' && !policy.customDomain) return res.status(403).json({ message: 'Custom domains require a Pro or Enterprise plan.' });
    if (feature === 'pixels' && !policy.pixels) return res.status(403).json({ message: 'Tracking pixels require a Pro or Enterprise plan.' });
    if (feature === 'products' && policy.products !== Infinity && await Product.countDocuments({ merchantId: req.merchant._id }) >= policy.products) return res.status(403).json({ message: `Your plan allows up to ${policy.products} products.` });
    return next();
  };
}

module.exports = { requireTier, limits };