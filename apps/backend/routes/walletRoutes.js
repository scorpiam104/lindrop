const express = require('express');
const { getSummary, withdraw } = require('../controllers/walletController');
const { requireAuth, requireFinancialAccess } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireFinancialAccess);
router.get('/summary', getSummary);
router.post('/withdraw', withdraw);
module.exports = router;