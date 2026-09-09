// Ad Generation Routes
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const adGeneratorService = require('../services/adGeneratorService');

/**
 * POST /api/ads/generate
 * Generate platform-specific ad copy for a product
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { productId, platform, tone } = req.body;
    const merchantId = req.merchant._id.toString();

    // Validate input
    if (!productId || !platform || !tone) {
      return res.status(400).json({
        error: 'Missing required fields: productId, platform, tone',
      });
    }

    const validPlatforms = [
      'whatsapp',
      'instagram',
      'facebook',
      'x',
      'linkedin',
      'tiktok',
      'general',
    ];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
      });
    }

    const validTones = ['sales', 'trendy', 'urgent', 'casual'];
    if (!validTones.includes(tone)) {
      return res.status(400).json({
        error: `Invalid tone. Must be one of: ${validTones.join(', ')}`,
      });
    }

    // Fetch product and merchant from database
    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Verify merchant owns this product
    if (product.merchantId.toString() !== merchantId) {
      return res.status(403).json({
        error: 'You do not have permission to generate ads for this product',
      });
    }

    // Generate ad copy
    const adData = await adGeneratorService.generateAdCopy(
      product,
      platform,
      tone,
      merchant
    );

    // Cache the ad copy
    const cacheData = await adGeneratorService.cacheAdCopy(
      productId,
      platform,
      tone,
      adData.adCopy
    );

    // Increment share count if new
    if (product.adCopyCache && !product.adCopyCache[cacheData.key]) {
      await adGeneratorService.incrementShareCount(Product, productId, platform);
    }

    res.json({
      success: true,
      data: adData,
      cache: cacheData,
    });
  } catch (error) {
    console.error('Error generating ad:', error);
    res.status(500).json({
      error: 'Failed to generate ad',
      message: error.message,
    });
  }
});

/**
 * POST /api/ads/generate-batch
 * Generate ad copies for multiple platforms at once
 */
router.post('/generate-batch', requireAuth, async (req, res) => {
  try {
    const { productId, platforms, tone } = req.body;
    const merchantId = req.merchant._id.toString();

    if (!productId || !platforms || !tone) {
      return res.status(400).json({
        error: 'Missing required fields: productId, platforms (array), tone',
      });
    }

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (product.merchantId.toString() !== merchantId) {
      return res.status(403).json({
        error: 'You do not have permission to generate ads for this product',
      });
    }

    // Generate ads for each platform
    const adCopies = await Promise.all(
      platforms.map((platform) =>
        adGeneratorService.generateAdCopy(product, platform, tone, merchant)
      )
    );

    res.json({
      success: true,
      productId,
      tone,
      data: adCopies,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating batch ads:', error);
    res.status(500).json({
      error: 'Failed to generate batch ads',
      message: error.message,
    });
  }
});

/**
 * GET /api/ads/templates
 * Get available ad templates, tones, and platforms
 */
router.get('/templates', (req, res) => {
  try {
    const templates = {
      platforms: Object.keys(adGeneratorService.platformConfigs),
      tones: Object.keys(adGeneratorService.toneConfigs),
      configs: {
        platforms: adGeneratorService.platformConfigs,
        tones: adGeneratorService.toneConfigs,
      },
    };

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message,
    });
  }
});

/**
 * GET /api/ads/cache/:productId
 * Get cached ad copies for a product
 */
router.get('/cache/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const merchantId = req.merchant._id.toString();

    const Product = require('../models/Product');
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.merchantId.toString() !== merchantId) {
      return res.status(403).json({
        error: 'You do not have permission to view this product',
      });
    }

    const cached = product.adCopyCache || {};

    res.json({
      success: true,
      productId,
      cacheCount: Object.keys(cached).length,
      cached,
      shareCount: product.shareCount || 0,
      lastShared: product.lastSharedAt,
    });
  } catch (error) {
    console.error('Error fetching ad cache:', error);
    res.status(500).json({
      error: 'Failed to fetch ad cache',
      message: error.message,
    });
  }
});

module.exports = router;
