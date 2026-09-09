const memoryStore = new Map();
let redisClient = null;
let redisAttempted = false;

function getClient() {
  if (redisAttempted) return redisClient;
  redisAttempted = true;
  if (!process.env.REDIS_URL) return null;
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    redisClient.on('error', (error) => console.error(`Redis error: ${error.message}`));
    redisClient.connect().catch((error) => console.error(`Redis unavailable: ${error.message}`));
  } catch (error) {
    console.error(`Redis adapter unavailable: ${error.message}`);
  }
  return redisClient;
}

async function get(key) {
  const client = getClient();
  if (client) {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

async function set(key, value, ttlSeconds = 1800) {
  const client = getClient();
  if (client) return client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return 'OK';
}

async function del(key) {
  const client = getClient();
  if (client) return client.del(key);
  memoryStore.delete(key);
  return 1;
}

module.exports = { get, set, del };
