const express = require('express');
const { queueRecoveryCampaign } = require('../controllers/recoveryController');
const { requireAuth, requireFinancialAccess } = require('../middleware/auth');

const router = express.Router();

router.post('/queue', requireAuth, requireFinancialAccess, queueRecoveryCampaign);

module.exports = router;
