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

async function getProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) return res.status(404).json({ message: 'Product not found.' });
  const product = await Product.findById(req.params.productId).lean();
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const merchant = await Merchant.exists({ _id: product.merchantId, isSuspended: false, isVerified: true });
  if (!merchant) return res.status(404).json({ message: 'Product not found.' });
  return res.json(product);
}

module.exports = { createProduct, getProduct, getStoreProducts, listProducts };
