const Order = require('../models/Order');
const mongoose = require('mongoose');
const { decrementInventory } = require('../services/inventoryService');

async function createPaidPosOrder({ merchantId, sale, syncStatus }) {
  const mongoSession = await mongoose.startSession();
  let order;
  try {
    await mongoSession.withTransaction(async () => {
      [order] = await Order.create([{
        merchantId,
        customerName: sale.customerName || 'Walk-in customer',
        customerPhone: sale.customerPhone || '',
        deliveryAddress: sale.deliveryAddress || 'In-person pickup',
        items: sale.items || [],
        totalAmount: Number(sale.totalAmount || 0),
        paymentStatus: 'paid',
        paymentMethod: 'offline-pos',
        source: 'pos',
        syncStatus,
        deliveryStatus: 'pending'
      }], { session: mongoSession });
      for (const item of order.items) {
        if (item.productId) await decrementInventory({ productId: item.productId, quantity: item.quantity, session: mongoSession });
      }
    });
  } finally {
    await mongoSession.endSession();
  }
  return order;
}

async function queueOfflineSale(req, res) {
  const { customerName = 'Walk-in customer', customerPhone = '', deliveryAddress = 'In-person pickup', items = [], totalAmount = 0 } = req.body || {};

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Offline POS sales must include one or more items.' });
  }

  const order = await createPaidPosOrder({ merchantId: req.merchant._id, syncStatus: 'pending', sale: {
    customerName,
    customerPhone,
    deliveryAddress,
    items: items.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0)
    })),
    totalAmount: Number(totalAmount || 0)
  } });

  return res.status(201).json({ order, synced: false, status: 'queued-offline' });
}

async function syncOfflineSales(req, res) {
  const sales = Array.isArray(req.body?.sales) ? req.body.sales : [];

  const synced = await Promise.all(sales.map(async (sale) => (await createPaidPosOrder({ merchantId: req.merchant._id, syncStatus: 'synced', sale }))._id));

  return res.json({ syncedCount: synced.length, sales: synced });
}

module.exports = { queueOfflineSale, syncOfflineSales };
