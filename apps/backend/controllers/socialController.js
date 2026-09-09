/**
 * Social Media Controller
 * Handles merchant-level direct posting to Facebook & Instagram using merchant's own access tokens
 * Retrieves credentials from database rather than environment variables
 */

const axios = require('axios');
const Merchant = require('../models/Merchant');
const Product = require('../models/Product');

/**
 * POST /api/social/post-merchant
 * Post to merchant's connected social accounts using their metaAccessToken
 */
async function postToMerchantFacebook(req, res) {
  try {
    const merchantId = req.merchant._id;
    const { productId, caption, imageUrl, actionLink } = req.body;

    // Validate inputs
    if (!productId || !caption) {
      return res.status(400).json({ message: 'productId and caption are required.' });
    }

    // Fetch merchant with sensitive fields
    const merchant = await Merchant.findById(merchantId).select('+socialConnections.metaAccessToken');
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found.' });
    }

    // Check if merchant has connected Facebook account
    if (!merchant.socialConnections?.metaAccessToken || !merchant.socialConnections?.facebookPageId) {
      return res.status(400).json({
        message: 'Facebook account not connected. Please link your Facebook page in social settings.',
        requiresAuth: true,
        authUrl: '/dashboard/social-settings',
      });
    }

    // Fetch product for additional details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Build Facebook Graph API payload
    const facebookPayload = {
      message: caption,
      link: actionLink || `${process.env.APP_URL}/store/${merchant.slug}/checkout/${productId}`,
      picture: imageUrl || product.imageUrl,
      name: product.title,
      description: product.description || 'Check out this amazing product!',
      access_token: merchant.socialConnections.metaAccessToken,
    };

    // Post to Facebook Page
    const apiVersion = process.env.META_GRAPH_API_VERSION || 'v19.0';
    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${merchant.socialConnections.facebookPageId}/feed`,
      facebookPayload
    );

    // Log successful post
    if (product.shareCount === undefined) {
      product.shareCount = 0;
    }
    product.shareCount += 1;
    product.lastSharedAt = new Date();
    product.lastSharedPlatform = 'facebook';
    await product.save();

    res.json({
      success: true,
      message: 'Posted to Facebook successfully!',
      postId: response.data.id,
      platform: 'facebook',
      productId,
    });
  } catch (error) {
    console.error('Facebook posting error:', error.response?.data || error.message);

    // Handle specific Meta API errors
    if (error.response?.data?.error?.code === 190) {
      return res.status(401).json({
        message: 'Your Facebook access token has expired. Please reconnect your account.',
        requiresAuth: true,
      });
    }

    res.status(error.response?.status || 500).json({
      message: error.response?.data?.error?.message || 'Failed to post to Facebook.',
      error: error.response?.data?.error || error.message,
    });
  }
}

/**
 * POST /api/social/post-instagram-merchant
 * Post to merchant's connected Instagram Business account
 */
async function postToMerchantInstagram(req, res) {
  try {
    const merchantId = req.merchant._id;
    const { productId, caption, imageUrl, actionLink } = req.body;

    if (!productId || !caption) {
      return res.status(400).json({ message: 'productId and caption are required.' });
    }

    // Fetch merchant with sensitive fields
    const merchant = await Merchant.findById(merchantId).select('+socialConnections.metaAccessToken');
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found.' });
    }

    // Check if merchant has connected Instagram Business account
    if (!merchant.socialConnections?.metaAccessToken || !merchant.socialConnections?.instagramBusinessAccountId) {
      return res.status(400).json({
        message: 'Instagram Business account not connected. Please link your Instagram in social settings.',
        requiresAuth: true,
        authUrl: '/dashboard/social-settings',
      });
    }

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // For Instagram, we need to use Media endpoint
    // Build caption with hashtags and product link
    const instagramCaption = `${caption}\n\n${actionLink || `${process.env.APP_URL}/store/${merchant.slug}/checkout/${productId}`}`;

    const apiVersion = process.env.META_GRAPH_API_VERSION || 'v19.0';

    // Step 1: Create media object
    const mediaPayload = {
      image_url: imageUrl || product.imageUrl,
      caption: instagramCaption,
      access_token: merchant.socialConnections.metaAccessToken,
    };

    const mediaResponse = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${merchant.socialConnections.instagramBusinessAccountId}/media`,
      mediaPayload
    );

    // Step 2: Publish the media
    const publishResponse = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${mediaResponse.data.id}/publish`,
      { access_token: merchant.socialConnections.metaAccessToken }
    );

    // Log successful post
    if (product.shareCount === undefined) {
      product.shareCount = 0;
    }
    product.shareCount += 1;
    product.lastSharedAt = new Date();
    product.lastSharedPlatform = 'instagram';
    await product.save();

    res.json({
      success: true,
      message: 'Posted to Instagram successfully!',
      mediaId: mediaResponse.data.id,
      platform: 'instagram',
      productId,
    });
  } catch (error) {
    console.error('Instagram posting error:', error.response?.data || error.message);

    if (error.response?.data?.error?.code === 190) {
      return res.status(401).json({
        message: 'Your Instagram access token has expired. Please reconnect your account.',
        requiresAuth: true,
      });
    }

    res.status(error.response?.status || 500).json({
      message: error.response?.data?.error?.message || 'Failed to post to Instagram.',
      error: error.response?.data?.error || error.message,
    });
  }
}

/**
 * GET /api/social/merchant-accounts
 * Retrieve merchant's connected social accounts (public info only)
 */
async function getMerchantAccounts(req, res) {
  try {
    const merchantId = req.merchant._id;
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found.' });
    }

    res.json({
      accounts: {
        facebook: {
          connected: !!merchant.socialConnections?.facebookPageId,
          pageId: merchant.socialConnections?.facebookPageId || null,
        },
        instagram: {
          connected: !!merchant.socialConnections?.instagramBusinessAccountId,
          businessAccountId: merchant.socialConnections?.instagramBusinessAccountId || null,
        },
        tiktok: {
          connected: !!merchant.socialConnections?.tiktokAccessToken,
          userId: merchant.socialConnections?.tiktokUserId || null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching merchant accounts:', error);
    res.status(500).json({ message: 'Failed to fetch account information.' });
  }
}

/**
 * POST /api/social/refresh-token/:platform
 * Refresh expired merchant access token using Meta Refresh Token Exchange
 * (Note: Requires refresh token storage in future implementation)
 */
async function refreshMerchantToken(req, res) {
  try {
    const { platform } = req.params;
    const merchantId = req.merchant._id;

    if (!['facebook', 'instagram', 'tiktok'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform.' });
    }

    const merchant = await Merchant.findById(merchantId).select('+socialConnections.metaAccessToken');

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found.' });
    }

    // This is a placeholder - actual token refresh requires refresh tokens stored in DB
    // For now, direct merchant to re-authenticate
    return res.status(400).json({
      message: `Please reconnect your ${platform} account to refresh access. Your token may have expired.`,
      requiresAuth: true,
      authUrl: '/dashboard/social-settings',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token.' });
  }
}

/**
 * POST /api/social/disconnect/:platform
 * Disconnect and remove merchant's access token for a platform
 */
async function disconnectMerchantAccount(req, res) {
  try {
    const { platform } = req.params;
    const merchantId = req.merchant._id;

    if (!['facebook', 'instagram', 'tiktok'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform.' });
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found.' });
    }

    // Clear tokens and IDs for the platform
    if (platform === 'facebook' || platform === 'instagram') {
      merchant.socialConnections.metaAccessToken = null;
      merchant.socialConnections.facebookPageId = null;
      merchant.socialConnections.instagramBusinessAccountId = null;
    } else if (platform === 'tiktok') {
      merchant.socialConnections.tiktokAccessToken = null;
      merchant.socialConnections.tiktokUserId = null;
    }

    await merchant.save();

    res.json({
      success: true,
      message: `${platform} account disconnected successfully.`,
      platform,
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect account.' });
  }
}

module.exports = {
  postToMerchantFacebook,
  postToMerchantInstagram,
  getMerchantAccounts,
  refreshMerchantToken,
  disconnectMerchantAccount,
};
