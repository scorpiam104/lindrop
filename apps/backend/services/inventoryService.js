const Product = require('../models/Product');

async function decrementInventory({ productId, quantity, session }) {
  const amount = Math.max(1, Number(quantity || 1));
  const product = await Product.findOneAndUpdate(
    { _id: productId, inventoryCount: { $gte: amount } },
    { $inc: { inventoryCount: -amount } },
    { new: true, session }
  ).lean();

  if (!product) {
    const existsQuery = Product.exists({ _id: productId });
    if (session) existsQuery.session(session);
    const exists = await existsQuery;
    throw new Error(exists ? 'Product is out of stock.' : 'Product not found.');
  }
  return product;
}

async function updateInventory({ productId, merchantId, inventoryCount, inventorySyncEnabled }) {
  const product = await Product.findOneAndUpdate(
    { _id: productId, merchantId },
    { $set: { inventoryCount: Math.max(0, Number(inventoryCount)), ...(inventorySyncEnabled === undefined ? {} : { inventorySyncEnabled }) } },
    { new: true, runValidators: true }
  ).lean();
  if (!product) throw new Error('Product not found.');
  return product;
}

module.exports = { decrementInventory, updateInventory };
