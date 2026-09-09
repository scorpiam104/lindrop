const express = require('express');
const { forgotPassword, generateTwoFactorBackupCodes, login, oauthCallback, oauthStart, register, resetPassword, verifyTwoFactorRecovery } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-2fa-recovery', verifyTwoFactorRecovery);
router.post('/2fa/backup-codes', requireAuth, generateTwoFactorBackupCodes);
router.get('/oauth/:provider', oauthStart);
router.get('/oauth/:provider/callback', oauthCallback);
module.exports = router;
