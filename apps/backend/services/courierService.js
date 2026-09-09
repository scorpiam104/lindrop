function getProviderConfig(provider = 'local-rider') {
  const configs = {
    'bolt-send': {
      baseFee: 6.5,
      perKm: 2.2,
      etaMultiplier: 8,
      label: 'Bolt Send'
    },
    yango: {
      baseFee: 7.5,
      perKm: 2.6,
      etaMultiplier: 10,
      label: 'Yango'
    },
    'local-rider': {
      baseFee: 5.0,
      perKm: 1.8,
      etaMultiplier: 12,
      label: 'Local Rider Network'
    }
  };

  return configs[provider] || configs['local-rider'];
}

function estimateCourierFee({ latitude, longitude, provider = 'local-rider' }) {
  const config = getProviderConfig(provider);
  const distanceKm = Math.max(1, Math.abs(Number(latitude || 0)) + Math.abs(Number(longitude || 0)) || 1);
  const fee = Number((config.baseFee + (distanceKm * config.perKm)).toFixed(2));
  const etaMinutes = Math.max(15, Math.min(90, Math.round(distanceKm * config.etaMultiplier)));

  return {
    provider,
    providerLabel: config.label,
    distanceKm: Number(distanceKm.toFixed(2)),
    fee,
    etaMinutes,
    currency: 'GHS'
  };
}

async function dispatchWithCourier({ orderId, provider = 'local-rider', pickupAddress, dropoffAddress, latitude, longitude, customerPhone, customerName }) {
  const estimate = estimateCourierFee({ latitude, longitude, provider });
  const trackingCode = `CRT-${Date.now().toString().slice(-8)}`;
  const payload = buildCourierDispatchPayload({
    orderId,
    provider,
    pickupAddress,
    dropoffAddress,
    latitude,
    longitude,
    customerPhone,
    customerName
  });

  return {
    ok: true,
    orderId,
    provider,
    providerLabel: estimate.providerLabel,
    pickupAddress: payload.pickupAddress,
    dropoffAddress: payload.dropoffAddress,
    trackingCode,
    status: 'dispatched',
    etaMinutes: estimate.etaMinutes,
    shippingFee: estimate.fee,
    trackingUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
    customerPhone,
    courierRequest: payload,
    courierResponse: {
      dispatchedAt: new Date().toISOString(),
      vendor: provider,
      driverRequested: true
    }
  };
}

function buildCourierDispatchPayload({ orderId, provider = 'local-rider', pickupAddress, dropoffAddress, latitude, longitude, customerPhone, customerName }) {
  return {
    orderId,
    provider,
    pickupAddress: pickupAddress || 'Merchant pickup point',
    dropoffAddress: dropoffAddress || 'Customer destination',
    coordinates: {
      pickup: { latitude: Number(latitude || 0), longitude: Number(longitude || 0) },
      dropoff: { latitude: Number(latitude || 0), longitude: Number(longitude || 0) }
    },
    customer: {
      name: customerName || 'Customer',
      phone: customerPhone || ''
    },
    delivery: {
      mode: 'same_day',
      eta_minutes: 30
    },
    metadata: {
      source: 'lindrop-social-commerce'
    }
  };
}

module.exports = {
  estimateCourierFee,
  dispatchWithCourier,
  getProviderConfig,
  buildCourierDispatchPayload
};
