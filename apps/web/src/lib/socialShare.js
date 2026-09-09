// Social Media Share Utilities - Web Intent launchers
// Platform-specific share handlers for WhatsApp, Facebook, X, LinkedIn, Telegram, and native OS share

/**
 * Share to WhatsApp
 * Opens WhatsApp with pre-filled message and product link
 */
export function shareToWhatsApp(text, url) {
  const message = encodeURIComponent(`${text}\n\n${url}`);
  window.open(`https://wa.me/?text=${message}`, '_blank', 'width=500,height=600');
}

/**
 * Share to Facebook
 * Opens Facebook share dialog with product URL
 */
export function shareToFacebook(url, quote = '') {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}${
    quote ? `&quote=${encodeURIComponent(quote)}` : ''
  }`;
  window.open(facebookUrl, 'facebook-share-dialog', 'width=800,height=600');
}

/**
 * Share to X (Twitter)
 * Opens X with pre-filled tweet
 */
export function shareToX(text, url, hashtags = []) {
  const twitterText = encodeURIComponent(
    `${text}\n\n${url}${hashtags.length > 0 ? ' ' + hashtags.join(' ') : ''}`
  );
  window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank', 'width=600,height=400');
}

/**
 * Share to LinkedIn
 * Opens LinkedIn share dialog
 */
export function shareToLinkedIn(url, title = '') {
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(linkedInUrl, '_blank', 'width=700,height=600');
}

/**
 * Share to Telegram
 * Opens Telegram with message and URL
 */
export function shareToTelegram(text, url) {
  const message = encodeURIComponent(`${text}\n${url}`);
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${message}`, '_blank');
}

export function shareToThreads(text, url) {
  window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n\n${url}`)}`, '_blank');
}

export function shareToTikTok(text, url) {
  return nativeShare('Share product', `${text}\n\n${url}`, url);
}

export function shareToSnapchat(text, url) {
  return nativeShare('Share product', `${text}\n\n${url}`, url);
}

/**
 * Share to Email
 * Opens default email client
 */
export function shareViaEmail(subject, body, url) {
  const emailBody = encodeURIComponent(`${body}\n\nView product: ${url}`);
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
}

/**
 * Native OS Share (uses navigator.share API)
 * Available on mobile and some desktop browsers
 * Allows sharing to native apps like Instagram Stories, TikTok, Snapchat, SMS, etc.
 */
export async function nativeShare(title, text, url, imageUrl = null) {
  if (!navigator.share) {
    console.warn('Web Share API not supported in this browser');
    return false;
  }

  try {
    const shareData = {
      title,
      text,
      url,
    };

    // Add image if canvas image generation is available
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        shareData.files = [
          new File([blob], 'product-share.png', { type: 'image/png' }),
        ];
      } catch (error) {
        console.warn('Could not load image for native share:', error);
        // Continue without image
      }
    }

    await navigator.share(shareData);
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('User cancelled sharing');
    } else {
      console.error('Error sharing:', error);
    }
    return false;
  }
}

/**
 * Copy to Clipboard
 * Copies ad text and URL to clipboard
 */
export async function copyToClipboard(text, url) {
  const content = `${text}\n\n${url}`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content);
      return { success: true, message: 'Copied to clipboard!' };
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return { success: true, message: 'Copied to clipboard!' };
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return { success: false, message: 'Failed to copy' };
  }
}

/**
 * Download image
 * Saves OG image to device
 */
export async function downloadImage(imageUrl, filename = 'product-share.png') {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    return { success: true, message: 'Image downloaded!' };
  } catch (error) {
    console.error('Failed to download image:', error);
    return { success: false, message: 'Failed to download image' };
  }
}

/**
 * Generate share links for all platforms at once
 */
export function generateShareLinks(text, url, platforms = []) {
  const links = {};

  if (platforms.includes('whatsapp') || platforms.length === 0) {
    links.whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
  }

  if (platforms.includes('facebook') || platforms.length === 0) {
    links.facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  if (platforms.includes('x') || platforms.length === 0) {
    links.x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }

  if (platforms.includes('linkedin') || platforms.length === 0) {
    links.linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  }

  if (platforms.includes('telegram') || platforms.length === 0) {
    links.telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  }

  if (platforms.includes('threads') || platforms.length === 0) links.threads = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
  if (platforms.includes('snapchat') || platforms.length === 0) links.snapchat = `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`;

  if (platforms.includes('email') || platforms.length === 0) {
    links.email = `mailto:?subject=Check%20out%20this%20product&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  }

  return links;
}

/**
 * Detect browser/device capabilities
 */
export function getShareCapabilities() {
  return {
    nativeShare: !!navigator.share,
    clipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isMobile: /Mobile|Android|iPhone/.test(navigator.userAgent),
  };
}

/**
 * Track share event (for analytics)
 */
export async function trackShare(productId, platform, merchantId) {
  try {
    const response = await fetch('/api/social/share-stats/' + productId, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      console.warn('Could not track share event');
    }
  } catch (error) {
    console.warn('Share tracking failed:', error);
  }
}

export default {
  shareToWhatsApp,
  shareToFacebook,
  shareToX,
  shareToLinkedIn,
  shareToTelegram,
  shareToThreads,
  shareToTikTok,
  shareToSnapchat,
  shareViaEmail,
  nativeShare,
  copyToClipboard,
  downloadImage,
  generateShareLinks,
  getShareCapabilities,
  trackShare,
};
