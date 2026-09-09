// Social Media Posting Routes - Direct API auto-posting
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { SocialMediaService } = require('../services/socialMediaService');
const adGeneratorService = require('../services/adGeneratorService');
const ogImageService = require('../services/ogImageService');

/**
 * POST /api/social/post
 * Post product to connected social media accounts
 */
router.post('/post', requireAuth, async (req, res) => {
  try {
    const { productId, platforms, tone = 'sales' } = req.body;
    const merchantId = req.merchant._id.toString();

    if (!productId || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        error: 'Missing required fields: productId, platforms (array)',
      });
    }

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const merchant = await Merchant.findById(merchantId).select('+socialConnections.metaAccessToken +socialConnections.tiktokAccessToken');
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (product.merchantId.toString() !== merchantId) {
      return res.status(403).json({
        error: 'You do not have permission to post this product',
      });
    }

    // Generate ad copy for each platform
    const ads = await Promise.all(
      platforms.map((platform) =>
        adGeneratorService.generateAdCopy(product, platform, tone, merchant)
      )
    );

    // Generate OG image URL
    const imageUrl = `${process.env.APP_URL}/api/og/product/${productId}`;
    const checkoutLink = `${process.env.APP_URL}/store/${merchant.storeSlug}/checkout/${productId}`;

    // Post to all connected accounts
    const postResults = await SocialMediaService.postToAll(
      merchant,
      ads[0]?.fullMessage || ads[0]?.adCopy,
      imageUrl,
      checkoutLink,
      platforms
    );

    // Increment share count
    await adGeneratorService.incrementShareCount(Product, productId, 'multi');

    res.json({
      success: true,
      productId,
      ads,
      postResults,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error posting to social media:', error);
    res.status(500).json({
      error: 'Failed to post to social media',
      message: error.message,
    });
  }
});

/**
 * POST /api/social/post-facebook
 * Post directly to Facebook Page
 */
router.post('/post-facebook', requireAuth, async (req, res) => {
  try {
    const { productId, tone = 'sales' } = req.body;
    const merchantId = req.merchant._id.toString();

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const merchant = await Merchant.findById(merchantId).select('+socialConnections.metaAccessToken +socialConnections.tiktokAccessToken');
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (product.merchantId.toString() !== merchantId) {
      return res.status(403).json({
        error: 'You do not have permission to post this product',
      });
    }

    // Check if Facebook is connected
    if (
      !merchant.socialConnections ||
      !merchant.socialConnections.metaAccessToken
    ) {
      return res.status(400).json({
        error: 'Facebook account is not connected. Connect in account settings.',
      });
    }

    // Generate ad copy
    const ad = await adGeneratorService.generateAdCopy(
      product,
      'facebook',
      tone,
      merchant
    );

    const imageUrl = `${process.env.APP_URL}/api/og/product/${productId}`;
    const checkoutLink = `${process.env.APP_URL}/store/${merchant.storeSlug}/checkout/${productId}`;

    // Post to Facebook
    const postResult = await require('../services/socialMediaService').metaAPI.postToFacebook(
      merchant.socialConnections.metaAccessToken,
      merchant.socialConnections.facebookPageId,
      ad.fullMessage,
      imageUrl,
      checkoutLink
    );

    // Increment share count
    await adGeneratorService.incrementShareCount(Product, productId, 'facebook');

    res.json({
      success: true,
      platform: 'facebook',
      productId,
      ad,
      postResult,
    });
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    res.status(500).json({
      error: 'Failed to post to Facebook',
      message: error.message,
    });
  }
});

/**
 * POST /api/social/post-instagram
 * Post directly to Instagram Business Account
 */
router.post('/post-instagram', requireAuth, async (req, res) => {
  try {
    const { productId, tone = 'sales' } = req.body;
    const merchantId = req.merchant._id.toString();

    const Product = require('../models/Product');
    const Merchant = require('../models/Merchant');

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const merchant = await Merchant.findById(merchantId).select('+socialConnections.metaAccessToken +socialConnections.tiktokAccessToken');
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (product.merchantId.toString() !== merchantId) {
      return res.status(403).json({
        error: 'You do not have permission to post this product',
      });
    }

    // Check if Instagram is connected
    if (
      !merchant.socialConnections ||
      !merchant.socialConnections.metaAccessToken
    ) {
      return res.status(400).json({
        error: 'Instagram account is not connected. Connect in account settings.',
      });
    }

    // Generate ad copy
    const ad = await adGeneratorService.generateAdCopy(
      product,
      'instagram',
      tone,
      merchant
    );

    const imageUrl = `${process.env.APP_URL}/api/og/product/${productId}`;

    // Post to Instagram
    const postResult = await require('../services/socialMediaService').metaAPI.postToInstagram(
      merchant.socialConnections.metaAccessToken,
      merchant.socialConnections.instagramBusinessAccountId,
      ad.fullMessage,
      imageUrl
    );

    // Increment share count
    await adGeneratorService.incrementShareCount(Product, productId, 'instagram');

    res.json({
      success: true,
      platform: 'instagram',
      productId,
      ad,
      postResult,
    });
  } catch (error) {
    console.error('Error posting to Instagram:', error);
    res.status(500).json({
      error: 'Failed to post to Instagram',
      message: error.message,
    });
  }
});

/**
 * GET /api/social/accounts
 * Get merchant's connected social accounts status
 */
router.get('/accounts', requireAuth, async (req, res) => {
  try {
    const merchantId = req.merchant._id.toString();

    const Merchant = require('../models/Merchant');
    const merchant = await Merchant.findById(merchantId).select('+socialConnections.metaAccessToken +socialConnections.tiktokAccessToken');

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const accountStatus = await SocialMediaService.getConnectedAccounts(merchant);

    res.json({
      success: true,
      data: accountStatus,
    });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    res.status(500).json({
      error: 'Failed to fetch social accounts',
      message: error.message,
    });
  }
});

/**
 * POST /api/social/disconnect/:platform
 * Disconnect a social media account
 */
router.post('/disconnect/:platform', requireAuth, async (req, res) => {
  try {
    const { platform } = req.params;
    const merchantId = req.merchant._id.toString();

    const Merchant = require('../models/Merchant');
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const result = await SocialMediaService.disconnectAccount(merchant, platform);

    // Update merchant in database
    if (!merchant.socialConnections) {
      merchant.socialConnections = {};
    }

    if (platform === 'facebook') {
      merchant.socialConnections.metaAccessToken = null;
      merchant.socialConnections.facebookPageId = null;
    } else if (platform === 'instagram') {
      merchant.socialConnections.metaAccessToken = null;
      merchant.socialConnections.instagramBusinessAccountId = null;
    } else if (platform === 'tiktok') {
      merchant.socialConnections.tiktokAccessToken = null;
      merchant.socialConnections.tiktokUserId = null;
    }

    await merchant.save();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    res.status(500).json({
      error: 'Failed to disconnect social account',
      message: error.message,
    });
  }
});

/**
 * GET /api/social/share-stats/:productId
 * Get sharing statistics for a product
 */
router.get('/share-stats/:productId', requireAuth, async (req, res) => {
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

    res.json({
      success: true,
      productId,
      shareCount: product.shareCount || 0,
      lastShared: product.lastSharedAt,
      lastSharedPlatform: product.lastSharedPlatform,
      adCacheSize: Object.keys(product.adCopyCache || {}).length,
    });
  } catch (error) {
    console.error('Error fetching share stats:', error);
    res.status(500).json({
      error: 'Failed to fetch share stats',
      message: error.message,
    });
  }
});

module.exports = router;
