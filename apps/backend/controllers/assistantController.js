const Merchant = require('../models/Merchant');
const Product = require('../models/Product');

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCheckoutLink(merchant, product) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  return `${baseUrl.replace(/\/$/, '')}/store/${merchant.slug}/checkout/${product._id}`;
}

function cleanProductName(value = '') {
  return String(value).trim();
}

function buildPromoText(product, merchant) {
  const title = product?.title || 'your product';
  const price = Number(product?.price || 0);
  return `🚀 ${title} is live in ${merchant.businessName}! \nOnly ${price.toFixed(2)} GHS today. Tap to order: ${buildCheckoutLink(merchant, product)} \n#${merchant.businessName.replace(/\s+/g, '')} #ShopLocal #SocialCommerce`;
}

async function handleIncomingWhatsAppMessage(req, res) {
  const { from, message, merchantId, merchantSlug } = req.body || {};
  const normalizedMessage = String(message || '').trim();

  if (!normalizedMessage) {
    return res.status(400).json({ message: 'Missing WhatsApp message payload.' });
  }

  const merchant = merchantId
    ? await Merchant.findById(merchantId).lean()
    : merchantSlug
      ? await Merchant.findOne({ slug: merchantSlug }).lean()
      : null;

  if (!merchant) {
    return res.status(404).json({ message: 'Merchant not found for this WhatsApp conversation.' });
  }

  const products = await Product.find({ merchantId: merchant._id }).sort({ createdAt: -1 }).lean();
  if (!products.length) {
    return res.status(404).json({ message: 'No catalog items found for this merchant.' });
  }

  const phrase = normalizedMessage.toLowerCase();
  const searchQuery = normalizedMessage.replace(/^(what|what's|show|tell|price|stock|link|buy|check)/i, '').trim();
  const product = searchQuery
    ? products.find((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase())) || products.find((item) => phrase.includes(item.title.toLowerCase())) || products[0]
    : products[0];

  if (!product) {
    return res.status(404).json({ message: 'No matching product could be found.' });
  }

  let responseText;
  let intent = 'product_info';

  if (phrase.includes('stock') || phrase.includes('inventory') || phrase.includes('available')) {
    intent = 'stock_check';
    responseText = `${product.title} is ${Number(product.inventoryCount) > 0 ? 'currently in stock' : 'currently out of stock'} with ${product.inventoryCount || 0} units remaining. ${Number(product.inventoryCount) > 0 ? `Order here: ${buildCheckoutLink(merchant, product)}` : 'Check back soon for restock updates.'}`;
  } else if (phrase.includes('price') || phrase.includes('cost') || phrase.includes('how much')) {
    intent = 'price_check';
    responseText = `${product.title} costs GH₵ ${Number(product.price || 0).toFixed(2)}. Quick checkout: ${buildCheckoutLink(merchant, product)}`;
  } else if (phrase.includes('link') || phrase.includes('checkout') || phrase.includes('order')) {
    intent = 'order_link';
    responseText = `Here is your direct order link for ${product.title}: ${buildCheckoutLink(merchant, product)}`;
  } else {
    responseText = buildPromoText(product, merchant);
  }

  return res.json({
    intent,
    from: from || 'unknown',
    merchant: { id: merchant._id, businessName: merchant.businessName, slug: merchant.slug },
    product: {
      id: product._id,
      title: product.title,
      price: Number(product.price || 0),
      inventoryCount: Number(product.inventoryCount || 0),
      imageUrl: product.imageUrl || ''
    },
    responseText,
    orderLink: buildCheckoutLink(merchant, product)
  });
}

async function generateProductReply(req, res) {
  const { merchantId, productId, message } = req.body || {};
  const merchant = await Merchant.findById(merchantId).lean();
  if (!merchant) return res.status(404).json({ message: 'Merchant not found.' });

  const product = await Product.findById(productId).lean();
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const promptText = String(message || `Create a sales message for ${product.title}`);
  const responseText = `${promptText}\n\n${buildPromoText(product, merchant)}`;

  return res.json({
    responseText,
    orderLink: buildCheckoutLink(merchant, product),
    product: {
      id: product._id,
      title: product.title,
      price: Number(product.price || 0),
      stock: Number(product.inventoryCount || 0)
    }
  });
}

module.exports = {
  handleIncomingWhatsAppMessage,
  generateProductReply,
  buildPromoText,
  buildCheckoutLink
};
