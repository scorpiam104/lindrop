const express = require('express');
const { queueOfflineSale, syncOfflineSales } = require('../controllers/posController');
const { requireAuth, requireFinancialAccess } = require('../middleware/auth');

const router = express.Router();

router.post('/offline', requireAuth, requireFinancialAccess, queueOfflineSale);
router.post('/sync', requireAuth, requireFinancialAccess, syncOfflineSales);

module.exports = router;
