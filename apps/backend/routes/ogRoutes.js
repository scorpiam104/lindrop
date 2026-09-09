// OpenGraph Image Routes - Dynamic social card generation
const express = require('express');
const router = express.Router();
const ogImageService = require('../services/ogImageService');

/**
 * GET /api/og/product/:productId
 * Generate and serve dynamic OG image for product
 * Used for social media preview when links are shared
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Fetch merchant
    const merchant = await Merchant.findById(product.merchantId);
    if (!merchant) {
      return res.status(404).send('Merchant not found');
    }

    // Generate OG image
    const imageBuffer = await ogImageService.generateOGImage(product, merchant);

    // Set response headers for caching
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Content-Length': imageBuffer.length,
    });

    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({
      error: 'Failed to generate OG image',
      message: error.message,
    });
  }
});

/**
 * GET /api/og/product/:productId/meta
 * Get OpenGraph metadata tags as JSON
 * Useful for server-side rendering
 */
router.get('/product/:productId/meta', async (req, res) => {
  try {
    const { productId } = req.params;
    const protocol = req.protocol;
    const host = req.get('host');

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const merchant = await Merchant.findById(product.merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Generate OG image URL
    const imageUrl = `${protocol}://${host}/api/og/product/${productId}`;

    // Generate meta tags
    const metaTags = ogImageService.generateMetaTags(product, merchant, imageUrl);

    res.json({
      success: true,
      productId,
      metaTags,
    });
  } catch (error) {
    console.error('Error fetching OG metadata:', error);
    res.status(500).json({
      error: 'Failed to fetch OG metadata',
      message: error.message,
    });
  }
});

/**
 * GET /api/og/product/:productId/thumbnail
 * Generate smaller thumbnail image for platform cards
 */
router.get('/product/:productId/thumbnail', async (req, res) => {
  try {
    const { productId } = req.params;
    const { size = 600 } = req.query;

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    const merchant = await Merchant.findById(product.merchantId);
    if (!merchant) {
      return res.status(404).send('Merchant not found');
    }

    // Generate thumbnail
    const imageBuffer = await ogImageService.generateThumbnail(
      product,
      merchant,
      parseInt(size)
    );

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': imageBuffer.length,
    });

    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    res.status(500).json({
      error: 'Failed to generate thumbnail',
      message: error.message,
    });
  }
});

/**
 * GET /api/og/store/:storeSlug
 * Generate OG image for storefront (shows merchant info + featured products)
 */
router.get('/store/:storeSlug', async (req, res) => {
  try {
    const { storeSlug } = req.params;

    const Merchant = require('../models/Merchant');
    const merchant = await Merchant.findOne({ storeSlug });

    if (!merchant) {
      return res.status(404).send('Store not found');
    }

    // For storefront, use merchant logo and name
    const storeOGImage = {
      ogTitle: `${merchant.name} - LinkPay Social Store`,
      ogDescription: 'Shop unique products from a verified merchant on LinkPay',
      ogImage: merchant.logo || `${process.env.APP_URL}/default-merchant.jpg`,
      ogUrl: `${process.env.APP_URL}/store/${storeSlug}`,
    };

    res.json({
      success: true,
      storeSlug,
      metaTags: storeOGImage,
    });
  } catch (error) {
    console.error('Error generating store OG:', error);
    res.status(500).json({
      error: 'Failed to generate store OG',
      message: error.message,
    });
  }
});

/**
 * GET /api/og/checkout/:productId
 * Generate OG image for checkout page (product + price + CTA)
 */
router.get('/checkout/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    const merchant = await Merchant.findById(product.merchantId);
    if (!merchant) {
      return res.status(404).send('Merchant not found');
    }

    // Generate OG image for checkout
    const imageBuffer = await ogImageService.generateOGImage(product, merchant);

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour (price may change)
      'Content-Length': imageBuffer.length,
    });

    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating checkout OG:', error);
    res.status(500).json({
      error: 'Failed to generate checkout OG',
      message: error.message,
    });
  }
});

module.exports = router;
