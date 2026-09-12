// OG Image Generation Service - Dynamic social card image rendering
let createCanvas = null;

try {
  ({ createCanvas } = require('@napi-rs/canvas'));
} catch (error) {
  console.warn('Canvas package unavailable; OG image generation is disabled.', error.message);
}

function ensureCanvasAvailable() {
  if (!createCanvas) {
    throw new Error('Canvas library is unavailable. Install native image dependencies or disable OG image generation.');
  }
}

/**
 * Generate dynamic OpenGraph image for product social cards
 * @param {Object} product - Product object with title, description, price, image
 * @param {Object} merchant - Merchant object with name, logo
 * @returns {Buffer} PNG image buffer
 */
async function generateOGImage(product, merchant) {
  try {
    ensureCanvasAvailable();
    const width = 1200;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient (emerald)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#059669'); // emerald-600
    gradient.addColorStop(1, '#047857'); // emerald-700
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Store name - top left
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(merchant.name, 40, 60);

    // "Verified Store" badge - top right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(width - 160, 40, 120, 40, 8);
    ctx.fill();

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✓ Verified', width - 100, 68);
    ctx.textAlign = 'left';

    // Product image area (left side)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(40, 120, 400, 450, 12);
    ctx.fill();

    // Placeholder for product image
    ctx.fillStyle = '#ffffff';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📸', 240, 380);

    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Product Image', 240, 410);
    ctx.textAlign = 'left';

    // Product details - right side
    const detailsX = 480;
    let currentY = 140;

    // Product title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    const titleLines = wrapText(ctx, product.title, 680, 36);
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, detailsX, currentY + idx * 42);
    });
    currentY += titleLines.length * 42 + 20;

    // Product description
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const desc = product.description || 'Premium quality product';
    const descLines = wrapText(ctx, desc, 680, 16);
    descLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, detailsX, currentY + idx * 24);
    });
    currentY += Math.min(descLines.length, 2) * 24 + 20;

    // Price badge - prominent
    ctx.fillStyle = '#fbbf24'; // amber-400
    ctx.beginPath();
    ctx.roundRect(detailsX, currentY, 200, 80, 10);
    ctx.fill();

    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.font = 'bold 16px Arial';
    ctx.fillText('PRICE', detailsX + 15, currentY + 25);

    ctx.font = 'bold 40px Arial';
    ctx.fillText(`GHS ${product.price.toFixed(2)}`, detailsX + 15, currentY + 65);

    currentY += 100;

    // CTA button
    ctx.fillStyle = '#fbbf24'; // amber-400
    ctx.beginPath();
    ctx.roundRect(detailsX, currentY, 300, 60, 8);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SHOP NOW', detailsX + 150, currentY + 42);
    ctx.textAlign = 'left';

    // Branding at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Arial';
    ctx.fillText('Powered by LinkPay Social Commerce', width - 300, height - 20);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating OG image:', error);
    throw new Error(`Failed to generate OG image: ${error.message}`);
  }
}

/**
 * Generate thumbnail for platform cards (smaller version)
 */
async function generateThumbnail(product, merchant, size = 600) {
  try {
    ensureCanvasAvailable();
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#059669');
    gradient.addColorStop(1, '#047857');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Product title - centered
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(size / 15)}px Arial`;
    ctx.textAlign = 'center';
    const titleLines = wrapText(ctx, product.title, size - 40, Math.floor(size / 15));
    titleLines.forEach((line, idx) => {
      ctx.fillText(
        line,
        size / 2,
        Math.floor(size / 3) + idx * Math.floor(size / 12)
      );
    });

    // Price - bottom center
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${Math.floor(size / 10)}px Arial`;
    ctx.fillText(
      `GHS ${product.price.toFixed(2)}`,
      size / 2,
      Math.floor(size * 0.8)
    );

    // Store name - bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `${Math.floor(size / 25)}px Arial`;
    ctx.fillText(merchant.name, size / 2, size - 15);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

/**
 * Wrap text to fit within width
 */
function wrapText(ctx, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generate HTML meta tags for OG image
 */
function generateMetaTags(product, merchant, imageUrl) {
  return {
    ogTitle: product.title,
    ogDescription: product.description || `${product.title} by ${merchant.name}`,
    ogImage: imageUrl,
    ogType: 'product',
    ogUrl: `${process.env.APP_URL}/store/${merchant.storeSlug}`,
    twitterCard: 'summary_large_image',
    twitterTitle: product.title,
    twitterDescription: `GHS ${product.price} - ${merchant.name}`,
    twitterImage: imageUrl,
  };
}

module.exports = {
  generateOGImage,
  generateThumbnail,
  generateMetaTags,
};
