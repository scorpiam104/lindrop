const { v4: uuidv4 } = require('uuid');
const { reelsQueue } = require('./reelsQueue');
const AWS = require('aws-sdk');

// In-memory fallback if Redis is not configured
const jobs = new Map();

async function enqueueReelGeneration({ merchantId, productId, style = 'shopify', duration = 15 }) {
  const id = uuidv4();
  const job = {
    id,
    merchantId,
    productId,
    style,
    duration,
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resultUrl: null
  };

  // If a Redis queue is present, add to queue
  if (reelsQueue) {
    await reelsQueue.add(job);
    return job;
  }

  // Fallback: simulate processing locally
  jobs.set(id, job);
  setTimeout(async () => {
    const resultUrl = `${process.env.APP_URL || 'http://localhost:5173'}/media/generated/${id}.mp4`;
    const finished = { ...job, status: 'completed', updatedAt: new Date().toISOString(), resultUrl };
    jobs.set(id, finished);
    console.log('Reel generation completed (simulated):', id);
  }, 3000);

  return job;
}

// Called by reelsQueue processor when Redis queue processes a job
async function processQueueJob(data) {
  // Simulate heavy media generation and optional S3 upload
  const id = data.id || uuidv4();
  const resultUrl = `${process.env.APP_URL || 'http://localhost:5173'}/media/generated/${id}.mp4`;

  // If S3 is configured, upload a placeholder file or generated media (placeholder here)
  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
    });

    // For now, upload a small JSON manifest as placeholder
    const body = Buffer.from(JSON.stringify({ productId: data.productId, generatedAt: new Date().toISOString() }));
    const key = `generated/${id}.json`;
    await s3.putObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key, Body: body, ContentType: 'application/json' }).promise();
    return { id, status: 'completed', resultUrl: `s3://${process.env.AWS_S3_BUCKET}/${key}` };
  }

  // Otherwise return a simulated local URL
  return { id, status: 'completed', resultUrl };
}

async function getJobStatus(id) {
  if (reelsQueue) {
    // In a real implementation we'd query the queue or a persistent job store
    return null;
  }
  return jobs.get(id) || null;
}

module.exports = { enqueueReelGeneration, getJobStatus, processQueueJob };