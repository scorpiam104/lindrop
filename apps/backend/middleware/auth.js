const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    const merchant = await Merchant.findById(decoded.merchantId).select('-passwordHash');
    if (!merchant || merchant.isSuspended) return res.status(401).json({ message: 'Account unavailable.' });
    req.merchant = merchant;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function requireRole(...allowedRoles) {
  return function enforceRole(req, res, next) {
    if (!req.merchant) return res.status(401).json({ message: 'Authentication required.' });
    if (!allowedRoles.includes(req.merchant.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}

function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

function requireFinancialAccess(req, res, next) {
  if (!req.merchant) return res.status(401).json({ message: 'Authentication required.' });
  if (req.merchant.role !== 'merchant' && req.merchant.role !== 'admin') {
    return res.status(403).json({ message: 'This staff role cannot access payouts or financial settings.' });
  }
  if (req.merchant.financialAccess === false) {
    return res.status(403).json({ message: 'Financial access is disabled for this account.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, requireRole, requireFinancialAccess };
