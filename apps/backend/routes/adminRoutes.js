const express = require('express');
const { getOverview, getStats, listMerchants, listPendingKyc, approveKyc, updateMerchantStatus, updateTier, updateMerchant } = require('../controllers/adminController');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get('/stats', getStats);
router.get('/overview', getOverview);
router.get('/kyc-pending', listPendingKyc);
router.patch('/kyc-approve/:merchantId', approveKyc);
router.patch('/merchant-status', updateMerchantStatus);
router.patch('/upgrade-tier', updateTier);
router.get('/merchants', listMerchants);
router.patch('/merchants/:merchantId', updateMerchant);
module.exports = router;
