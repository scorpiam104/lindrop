const express = require('express');
const { getDashboardStats, getMe, getPublicStore, updateStore } = require('../controllers/merchantController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.get('/me', requireAuth, getMe);
router.get('/dashboard-stats', requireAuth, getDashboardStats);
router.put('/store', requireAuth, updateStore);
router.get('/public/:storeSlug', getPublicStore);
module.exports = router;
