const STORAGE_KEY = 'luma_offline_pos_queue';

export function readOfflineSales() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

export function queueOfflineSale(sale) {
  const queue = readOfflineSales();
  const payload = {
    id: `offline-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
    ...sale,
    source: 'offline-pos'
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...queue, payload]));
  return payload;
}

export function clearOfflineSales() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getOfflineQueueCount() {
  return readOfflineSales().length;
}

export function syncOfflineSalesToServer(apiRequest) {
  const queue = readOfflineSales();
  if (!queue.length || !apiRequest) return Promise.resolve({ syncedCount: 0, queue: [] });

  return apiRequest('/pos/sync', { sales: queue }).then(({ data }) => {
    clearOfflineSales();
    return data;
  });
}
