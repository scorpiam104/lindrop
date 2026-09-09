const Order = require('../models/Order');

function buildRecoveryMessage(order) {
  const summary = order.items?.map((item) => `${item.title} x${item.quantity}`).join(', ') || 'your items';
  const url = `${process.env.APP_URL || 'http://localhost:5173'}/store/${order.merchantSlug || 'store'}`;
  return `Hi ${order.customerName}, you left ${summary} in your cart. Your order is still waiting. Complete it here: ${url}. We saved your basket and it will be ready in minutes.`;
}

async function queueRecoveryCampaign(req, res) {
  const cutoffDate = new Date(Date.now() - 15 * 60 * 1000);
  const unpaidOrders = await Order.find({
    paymentStatus: 'pending',
    createdAt: { $lte: cutoffDate },
    recoveryStatus: { $ne: 'sent' }
  }).populate('merchantId', 'businessName slug').lean();

  const queued = await Promise.all(unpaidOrders.map(async (order) => {
    const message = buildRecoveryMessage({
      ...order,
      merchantSlug: order.merchantId?.slug || 'store',
      customerName: order.customerName || 'there'
    });

    const updated = await Order.findByIdAndUpdate(order._id, {
      recoveryStatus: 'queued',
      recoveryQueuedAt: new Date(),
      recoveryMessage: message
    }, { new: true });

    return {
      orderId: updated._id,
      customerName: updated.customerName,
      recoveryStatus: updated.recoveryStatus,
      recoveryMessage: updated.recoveryMessage,
      whatsappLink: `https://wa.me/${String(updated.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    };
  }));

  return res.json({ queuedCount: queued.length, queued });
}

module.exports = { queueRecoveryCampaign, buildRecoveryMessage };
