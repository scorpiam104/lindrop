// Ad Generator Service - AI-powered social media ad copy generation
const axios = require('axios');

// Platform-specific ad templates and configurations
const platformConfigs = {
  whatsapp: {
    maxLength: 1024,
    features: ['emojis', 'quick_reply', 'links'],
    hashtagLimit: 3,
  },
  instagram: {
    maxLength: 2200,
    features: ['emojis', 'hashtags', 'mentions'],
    hashtagLimit: 30,
  },
  facebook: {
    maxLength: 63206,
    features: ['emojis', 'hashtags', 'links'],
    hashtagLimit: 10,
  },
  x: {
    maxLength: 280,
    features: ['hashtags', 'mentions'],
    hashtagLimit: 5,
  },
  linkedin: {
    maxLength: 3000,
    features: ['hashtags', 'emojis'],
    hashtagLimit: 5,
  },
  tiktok: {
    maxLength: 2200,
    features: ['hashtags', 'emojis', 'challenge'],
    hashtagLimit: 10,
  },
  general: {
    maxLength: 2000,
    features: ['emojis', 'hashtags', 'links'],
    hashtagLimit: 8,
  },
};

// Tone configurations
const toneConfigs = {
  sales: {
    prefix: '🛍️ LIMITED TIME OFFER',
    cta: 'Shop Now',
    urgency: true,
    adjectives: ['exclusive', 'unbeatable', 'deal of the day'],
  },
  trendy: {
    prefix: '✨ TRENDING',
    cta: 'Grab It',
    urgency: false,
    adjectives: ['hot', 'must-have', 'everyone\'s talking about'],
  },
  urgent: {
    prefix: '⏰ LAST CHANCE',
    cta: 'Buy Before It\'s Gone',
    urgency: true,
    adjectives: ['limited stock', 'ending soon', 'don\'t miss out'],
  },
  casual: {
    prefix: '😊 Check This Out',
    cta: 'See More',
    urgency: false,
    adjectives: ['awesome', 'cool', 'perfect for you'],
  },
};

/**
 * Generate platform-specific ad copy using local prompt formatting
 * @param {Object} product - Product object with title, description, price, image
 * @param {string} platform - Target platform (whatsapp, instagram, facebook, x, linkedin, tiktok, general)
 * @param {string} tone - Ad tone (sales, trendy, urgent, casual)
 * @param {Object} merchant - Merchant object with name, storeSlug
 * @returns {Promise<Object>} Generated ad copy, hashtags, CTA, and metadata
 */
async function generateAdCopy(product, platform, tone, merchant) {
  try {
    const config = platformConfigs[platform] || platformConfigs.general;
    const toneConfig = toneConfigs[tone] || toneConfigs.sales;

    // Generate platform-specific ad copy
    const adCopy = buildAdCopy(
      product,
      platform,
      toneConfig,
      config.maxLength
    );

    // Generate relevant hashtags
    const hashtags = generateHashtags(
      product,
      platform,
      toneConfig,
      config.hashtagLimit
    );

    // Generate call-to-action
    const cta = toneConfig.cta;

    // Build checkout link
    const checkoutLink = buildCheckoutLink(product, merchant);

    // Build full message with link
    const fullMessage = buildFullMessage(
      adCopy,
      hashtags,
      cta,
      checkoutLink,
      platform
    );

    return {
      success: true,
      platform,
      tone,
      adCopy,
      hashtags,
      cta,
      checkoutLink,
      fullMessage,
      charCount: fullMessage.length,
      maxChars: config.maxLength,
      metadata: {
        timestamp: new Date(),
        version: '1.0',
      },
    };
  } catch (error) {
    console.error('Error generating ad copy:', error);
    throw new Error(`Failed to generate ad for platform ${platform}: ${error.message}`);
  }
}

/**
 * Build platform-tailored ad copy
 */
function buildAdCopy(product, platform, toneConfig, maxLength) {
  let copy = `${toneConfig.prefix}\n\n`;

  // Product headline
  copy += `🏆 ${product.title}\n`;

  // Product description (first 150 chars)
  if (product.description) {
    const desc = product.description.substring(0, 150);
    copy += `${desc}...\n\n`;
  }

  // Key benefits based on tone
  copy += '✨ Why you\'ll love it:\n';
  toneConfig.adjectives.forEach((adj) => {
    copy += `  • ${adj.charAt(0).toUpperCase() + adj.slice(1)}\n`;
  });

  // Price highlight
  copy += `\n💰 GHS ${product.price.toFixed(2)}\n`;

  // Platform-specific additions
  if (platform === 'instagram' || platform === 'tiktok') {
    copy += '\n🎉 Swipe up to grab yours!\n';
  } else if (platform === 'x') {
    copy += '\nRT to share the love ❤️\n';
  } else if (platform === 'linkedin') {
    copy += '\n🚀 Transform your lifestyle with this gem!\n';
  }

  // Truncate if needed
  if (copy.length > maxLength) {
    copy = copy.substring(0, maxLength - 3) + '...';
  }

  return copy;
}

/**
 * Generate platform-specific hashtags
 */
function generateHashtags(product, platform, toneConfig, limit) {
  const hashtags = [
    '#ShopLocal',
    '#SupportSmallBusiness',
    '#GhanaEcommerce',
    '#SocialCommerce',
    '#MadeInGhana',
  ];

  // Add tone-specific hashtags
  if (toneConfig.urgency) {
    hashtags.push('#LimitedOffer', '#ShopNow', '#HurryUp');
  } else {
    hashtags.push('#MustHave', '#NewArrival', '#CheckItOut');
  }

  // Add platform-specific hashtags
  if (platform === 'instagram') {
    hashtags.push(
      '#Instagram',
      '#InstagridShopping',
      '#ShoppingFeeds',
      '#InstaBusiness'
    );
  } else if (platform === 'tiktok') {
    hashtags.push('#TikTokShop', '#ForYouPage', '#Trending', '#FYP');
  } else if (platform === 'x') {
    hashtags.push('#TwitterCommerce', '#SmallBiz');
  } else if (platform === 'facebook') {
    hashtags.push('#FacebookShops', '#CommunityBusiness');
  }

  // Add product-category hashtags
  const categoryTags = generateCategoryHashtags(product.title);
  hashtags.push(...categoryTags);

  // Shuffle and return limited set
  return hashtags.sort(() => 0.5 - Math.random()).slice(0, limit);
}

/**
 * Generate category-specific hashtags from product title
 */
function generateCategoryHashtags(title) {
  const keywords = title.toLowerCase().split(' ');
  const tags = [];

  keywords.forEach((keyword) => {
    if (keyword.length > 3) {
      tags.push(`#${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`);
    }
  });

  return tags.slice(0, 5);
}

/**
 * Build checkout link
 */
function buildCheckoutLink(product, merchant) {
  const appUrl = process.env.APP_URL || 'https://lindrop.app';
  return `${appUrl}/store/${merchant.storeSlug}/checkout/${product._id}`;
}

/**
 * Combine all elements into full platform-specific message
 */
function buildFullMessage(adCopy, hashtags, cta, checkoutLink, platform) {
  let message = adCopy;

  // Add hashtags based on platform
  if (platform === 'x') {
    // Twitter: hashtags inline
    message += '\n' + hashtags.join(' ');
  } else if (platform === 'whatsapp') {
    // WhatsApp: minimal hashtags (3 max)
    message += '\n' + hashtags.slice(0, 3).join(' ');
  } else {
    // Other platforms: full hashtag set
    message += '\n\n' + hashtags.join(' ');
  }

  // Add CTA and link
  message += `\n\n👉 ${cta}: ${checkoutLink}`;

  return message;
}

/**
 * Generate OG (OpenGraph) image metadata for social cards
 */
async function generateOGMetadata(product, merchant) {
  try {
    return {
      ogTitle: product.title,
      ogDescription: product.description || `${product.title} - ${merchant.name}`,
      ogImage: product.image || `${process.env.APP_URL}/default-product.jpg`,
      ogUrl: `${process.env.APP_URL}/store/${merchant.storeSlug}`,
      twitterCard: 'summary_large_image',
      twitterTitle: product.title,
      twitterDescription: `Buy ${product.title} from ${merchant.name} - GHS ${product.price}`,
      twitterImage: product.image,
    };
  } catch (error) {
    console.error('Error generating OG metadata:', error);
    throw new Error(`Failed to generate OG metadata: ${error.message}`);
  }
}

/**
 * Cache ad copy for a product to avoid regeneration
 */
async function cacheAdCopy(productId, platform, tone, adCopy) {
  const cacheKey = `ad_${platform}_${tone}`;
  return {
    key: cacheKey,
    data: {
      platform,
      tone,
      adCopy,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  };
}

/**
 * Increment share counter for product
 */
async function incrementShareCount(Product, productId, platform) {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: { shareCount: 1 },
        $set: { lastSharedAt: new Date(), lastSharedPlatform: platform },
      },
      { new: true }
    );
    return product;
  } catch (error) {
    console.error('Error incrementing share count:', error);
    throw new Error(`Failed to increment share count: ${error.message}`);
  }
}

module.exports = {
  generateAdCopy,
  generateOGMetadata,
  cacheAdCopy,
  incrementShareCount,
  platformConfigs,
  toneConfigs,
};
