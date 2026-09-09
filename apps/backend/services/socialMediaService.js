// Social Media Service - Direct API posting to Facebook, Instagram, and TikTok
const axios = require('axios');

/**
 * Meta Graph API adapter for Facebook & Instagram posting
 */
const metaAPI = {
  baseUrl: 'https://graph.facebook.com/v19.0',

  /**
   * Post to Facebook Page
   */
  async postToFacebook(accessToken, pageId, caption, imageUrl, link) {
    try {
      const payload = {
        message: caption,
        link: link,
        picture: imageUrl,
        access_token: accessToken,
      };

      const response = await axios.post(
        `${this.baseUrl}/${pageId}/feed`,
        payload
      );

      return {
        success: true,
        platform: 'facebook',
        postId: response.data.id,
        timestamp: new Date(),
        url: `https://facebook.com/${response.data.id}`,
      };
    } catch (error) {
      console.error('Facebook posting error:', error.response?.data || error.message);
      throw new Error(
        `Failed to post to Facebook: ${error.response?.data?.error?.message || error.message}`
      );
    }
  },

  /**
   * Post to Instagram Business Account
   */
  async postToInstagram(accessToken, businessAccountId, caption, imageUrl) {
    try {
      // Step 1: Create media container
      const mediaPayload = {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
      };

      const mediaResponse = await axios.post(
        `${this.baseUrl}/${businessAccountId}/media`,
        mediaPayload
      );

      const mediaContainerId = mediaResponse.data.id;

      // Step 2: Publish media container
      const publishPayload = {
        media_product_type: 'FEED',
        access_token: accessToken,
      };

      const publishResponse = await axios.post(
        `${this.baseUrl}/${businessAccountId}/media_publish`,
        {
          creation_id: mediaContainerId,
          ...publishPayload,
        }
      );

      return {
        success: true,
        platform: 'instagram',
        mediaId: publishResponse.data.id,
        mediaContainerId: mediaContainerId,
        timestamp: new Date(),
        url: `https://instagram.com/p/${publishResponse.data.id}`,
      };
    } catch (error) {
      console.error('Instagram posting error:', error.response?.data || error.message);
      throw new Error(
        `Failed to post to Instagram: ${error.response?.data?.error?.message || error.message}`
      );
    }
  },

  /**
   * Schedule Facebook/Instagram post for later
   */
  async schedulePost(accessToken, pageId, caption, imageUrl, scheduledTime) {
    try {
      const payload = {
        message: caption,
        scheduled_publish_time: Math.floor(new Date(scheduledTime).getTime() / 1000),
        link: imageUrl,
        access_token: accessToken,
        is_hidden: false,
      };

      const response = await axios.post(
        `${this.baseUrl}/${pageId}/feed`,
        payload
      );

      return {
        success: true,
        platform: 'facebook_scheduled',
        postId: response.data.id,
        scheduledTime: scheduledTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Schedule post error:', error.response?.data || error.message);
      throw new Error(
        `Failed to schedule post: ${error.response?.data?.error?.message || error.message}`
      );
    }
  },

  /**
   * Get access token refresh status
   */
  async refreshAccessToken(accessToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me`,
        {
          access_token: accessToken,
          fields: 'id,name',
        }
      );

      return {
        isValid: true,
        userId: response.data.id,
        name: response.data.name,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  },
};

/**
 * TikTok API adapter (if Business Account is available)
 */
const tiktokAPI = {
  baseUrl: 'https://open-api.tiktok.com/v1',

  /**
   * Post video to TikTok (requires video URL)
   * Note: TikTok requires video, not image. This would need video generation service.
   */
  async postToTikTok(accessToken, videoUrl, caption, hashtags) {
    try {
      const payload = {
        video: videoUrl,
        title: caption,
        tags: hashtags,
      };

      const response = await axios.post(
        `${this.baseUrl}/post/publish/action/upload/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        platform: 'tiktok',
        videoId: response.data.video_id,
        timestamp: new Date(),
        url: `https://tiktok.com/@merchant/video/${response.data.video_id}`,
      };
    } catch (error) {
      console.error('TikTok posting error:', error.response?.data || error.message);
      throw new Error(
        `Failed to post to TikTok: ${error.response?.data?.message || error.message}`
      );
    }
  },
};

/**
 * Unified social media posting service
 */
class SocialMediaService {
  /**
   * Post to all connected accounts
   */
  static async postToAll(merchant, caption, imageUrl, link, platforms = []) {
    const results = [];
    const errors = [];

    // Get merchant's connected accounts from database
    const connections = merchant.socialConnections || {};

    if (
      platforms.includes('facebook') &&
      connections.facebookPageId &&
      connections.metaAccessToken
    ) {
      try {
        const result = await metaAPI.postToFacebook(
          connections.metaAccessToken,
          connections.facebookPageId,
          caption,
          imageUrl,
          link
        );
        results.push(result);
      } catch (error) {
        errors.push({ platform: 'facebook', error: error.message });
      }
    }

    if (
      platforms.includes('instagram') &&
      connections.instagramBusinessAccountId &&
      connections.metaAccessToken
    ) {
      try {
        const result = await metaAPI.postToInstagram(
          connections.metaAccessToken,
          connections.instagramBusinessAccountId,
          caption,
          imageUrl
        );
        results.push(result);
      } catch (error) {
        errors.push({ platform: 'instagram', error: error.message });
      }
    }

    return {
      successful: results,
      failed: errors,
      timestamp: new Date(),
      summary: {
        total: results.length + errors.length,
        success: results.length,
        failed: errors.length,
      },
    };
  }

  /**
   * Get merchant's connected social accounts status
   */
  static async getConnectedAccounts(merchant) {
    const connections = merchant.socialConnections || {};
    const accounts = [];

    // Check Facebook
    if (connections.metaAccessToken) {
      try {
        const validation = await metaAPI.refreshAccessToken(
          connections.metaAccessToken
        );
        accounts.push({
          platform: 'facebook',
          connected: validation.isValid,
          accountName: validation.name,
          pageId: connections.facebookPageId,
        });
      } catch (error) {
        accounts.push({
          platform: 'facebook',
          connected: false,
          error: error.message,
        });
      }
    }

    // Check Instagram
    if (connections.metaAccessToken && connections.instagramBusinessAccountId) {
      try {
        const validation = await metaAPI.refreshAccessToken(
          connections.metaAccessToken
        );
        accounts.push({
          platform: 'instagram',
          connected: validation.isValid,
          accountName: validation.name,
          businessId: connections.instagramBusinessAccountId,
        });
      } catch (error) {
        accounts.push({
          platform: 'instagram',
          connected: false,
          error: error.message,
        });
      }
    }

    return {
      merchant: merchant.name,
      accounts,
      timestamp: new Date(),
    };
  }

  /**
   * Disconnect a social account
   */
  static async disconnectAccount(merchant, platform) {
    const connections = merchant.socialConnections || {};

    if (platform === 'facebook') {
      delete connections.metaAccessToken;
      delete connections.facebookPageId;
    } else if (platform === 'instagram') {
      delete connections.metaAccessToken;
      delete connections.instagramBusinessAccountId;
    } else if (platform === 'tiktok') {
      delete connections.tiktokAccessToken;
      delete connections.tiktokUserId;
    }

    return {
      success: true,
      platform,
      disconnectedAt: new Date(),
    };
  }
}

module.exports = {
  metaAPI,
  tiktokAPI,
  SocialMediaService,
};
