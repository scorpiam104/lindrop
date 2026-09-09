const Order = require('../models/Order');
const { estimateCourierFee, dispatchWithCourier } = require('../services/courierService');

function calculateShippingFee({ latitude, longitude, deliveryAddress = '', provider = 'local-rider' }) {
  return estimateCourierFee({ latitude, longitude, provider });
}

async function quoteShipping(req, res) {
  const { latitude, longitude, provider } = req.query;
  const quote = calculateShippingFee({ latitude: Number(latitude), longitude: Number(longitude), provider });
  return res.json({ ...quote, provider: provider || 'local-rider' });
}

async function dispatchCourier(req, res) {
  const { orderId } = req.params;
  const { latitude, longitude, provider = 'local-rider', deliveryAddress, pickupAddress, customerPhone } = req.body || {};

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return res.status(400).json({ message: 'A valid latitude and longitude are required for dispatch.' });
  }

  const dispatch = await dispatchWithCourier({
    orderId: order._id,
    provider,
    pickupAddress,
    dropoffAddress: deliveryAddress || order.deliveryAddress,
    latitude: Number(latitude),
    longitude: Number(longitude),
    customerPhone: customerPhone || order.customerPhone
  });

  order.shippingFee = dispatch.shippingFee;
  order.geo = { latitude: Number(latitude), longitude: Number(longitude) };
  order.deliveryStatus = 'dispatched';
  order.courierProvider = provider;
  order.trackingCode = dispatch.trackingCode;
  order.trackingUrl = dispatch.trackingUrl;
  order.deliveryEtaMinutes = dispatch.etaMinutes;
  order.deliveryAddress = order.deliveryAddress || deliveryAddress;

  await order.save();

  return res.status(201).json(dispatch);
}

module.exports = { dispatchCourier, quoteShipping, calculateShippingFee };
