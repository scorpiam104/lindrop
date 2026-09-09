const Queue = require('bull');
const reelsService = require('./reelsService');

// Create a Bull queue for reel generation if REDIS_URL is configured
const redisUrl = process.env.REDIS_URL || null;
let reelsQueue = null;

if (redisUrl) {
  reelsQueue = new Queue('reels-generation', redisUrl);

  // Process jobs: here we simulate generation or call the service worker
  reelsQueue.process(async (job) => {
    const { id, data } = job;
    console.log(`Processing reel job ${id} for product ${data.productId}`);
    // Use existing service logic to generate (or simulate) and return result
    const result = await reelsService.processQueueJob(data);
    return result;
  });

  reelsQueue.on('completed', (job, result) => {
    console.log(`Reel job ${job.id} completed:`, result?.resultUrl);
  });

  reelsQueue.on('failed', (job, err) => {
    console.error(`Reel job ${job.id} failed:`, err.message || err);
  });
}

module.exports = { reelsQueue };
