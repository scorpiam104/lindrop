const express = require('express');
const { generateReel, getReelStatus } = require('../controllers/reelsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.post('/reels/generate', requireAuth, generateReel);
router.get('/reels/status/:id', requireAuth, getReelStatus);

module.exports = router;