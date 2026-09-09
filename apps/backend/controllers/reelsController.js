const reelsService = require('../services/reelsService');

// POST /api/ai/reels/generate
async function generateReel(req, res) {
  try {
    const { productId, style, duration = 15 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    // create an async job (placeholder) — service returns jobId
    const job = await reelsService.enqueueReelGeneration({ merchantId: req.merchant._id, productId, style, duration });

    return res.status(202).json({ success: true, jobId: job.id, statusUrl: `/api/ai/reels/status/${job.id}` });
  } catch (err) {
    console.error('Reel generation error:', err);
    return res.status(500).json({ message: 'Failed to start reel generation' });
  }
}

// GET /api/ai/reels/status/:id
async function getReelStatus(req, res) {
  try {
    const jobId = req.params.id;
    const status = await reelsService.getJobStatus(jobId);
    if (!status) return res.status(404).json({ message: 'Job not found' });
    return res.json({ job: status });
  } catch (err) {
    console.error('Get reel status error:', err);
    return res.status(500).json({ message: 'Failed to retrieve job status' });
  }
}

module.exports = { generateReel, getReelStatus };