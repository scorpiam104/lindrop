const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const Product = require('../models/Product');

async function listProducts(req, res) {
  const filter = req.merchant ? { merchantId: req.merchant._id } : { merchantId: req.query.merchantId };
  if (!filter.merchantId) return res.status(400).json({ message: 'merchantId is required.' });
  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  return res.json(products);
}

async function createProduct(req, res) {
  const { title, description, price, inventoryCount, imageUrl } = req.body;
  if (!title || !Number.isFinite(Number(price))) return res.status(400).json({ message: 'Title and price are required.' });
  const product = await Product.create({ title, description, price: Number(price), inventoryCount: Number(inventoryCount || 0), imageUrl, merchantId: req.merchant._id });
  return res.status(201).json(product);
}

async function getStoreProducts(req, res) {
  const merchant = await Merchant.findOne({ slug: req.params.storeSlug, isSuspended: false, isVerified: true }).select('_id');
  if (!merchant) return res.status(404).json({ message: 'Store not found.' });
  return res.json(await Product.find({ merchantId: merchant._id, inventoryCount: { $gt: 0 } }).sort({ createdAt: -1 }).lean());
}

async function getMarketplaceProducts(req, res) {
  const merchants = await Merchant.find({ isSuspended: false, isVerified: true, slug: { $nin: [null, ''] } })
    .select('_id businessName storeName slug logoUrl storeTheme')
    .lean();
  const merchantById = new Map(merchants.map((merchant) => [String(merchant._id), merchant]));
  const products = await Product.find({ merchantId: { $in: merchants.map((merchant) => merchant._id) }, inventoryCount: { $gt: 0 } })
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  const productCards = products.map((product) => {
      const merchant = merchantById.get(String(product.merchantId));
      return {
        ...product,
        storeName: merchant.storeName || merchant.businessName || 'Independent store',
        storeSlug: merchant.slug,
        storeLogoUrl: merchant.logoUrl || ''
      };
    });
  return res.json({
    products: productCards,
    stores: merchants.map((merchant) => ({ ...merchant, storeName: merchant.storeName || merchant.businessName || 'Independent store', storeTheme: merchant.storeTheme || 'aurora', productCount: productCards.filter((product) => product.storeSlug === merchant.slug).length }))
  });
}

async function getProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) return res.status(404).json({ message: 'Product not found.' });
  const product = await Product.findById(req.params.productId).lean();
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const merchant = await Merchant.exists({ _id: product.merchantId, isSuspended: false, isVerified: true });
  if (!merchant) return res.status(404).json({ message: 'Product not found.' });
  return res.json(product);
}

module.exports = { createProduct, getMarketplaceProducts, getProduct, getStoreProducts, listProducts };
