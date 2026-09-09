const crypto = require('crypto');
const Merchant = require('../models/Merchant');
const WalletTransaction = require('../models/WalletTransaction');

async function getSummary(req, res) {
  const [merchant, transfers] = await Promise.all([
    Merchant.findById(req.merchant._id).select('clearedBalance pendingBalance paystackSubaccountCode momoPayoutNumber'),
    WalletTransaction.find({ merchantId: req.merchant._id }).sort({ createdAt: -1 }).limit(50).lean()
  ]);
  return res.json({ clearedBalance: merchant.clearedBalance, pendingBalance: merchant.pendingBalance, paystackSubaccountCode: merchant.paystackSubaccountCode, payoutNumber: merchant.momoPayoutNumber, transfers });
}

async function withdraw(req, res) {
  const amount = Number(req.body.amount);
  const merchant = await Merchant.findById(req.merchant._id);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Withdrawal amount must be greater than zero.' });
  if (!merchant.momoPayoutNumber || !merchant.isKycVerified) return res.status(400).json({ message: 'Verify your KYC and MoMo payout number before withdrawing.' });
  if (amount > merchant.clearedBalance) return res.status(400).json({ message: 'Withdrawal amount exceeds your cleared balance.' });
  const transaction = await WalletTransaction.create({ merchantId: merchant._id, type: 'payout', amount, reference: `momo_${crypto.randomUUID()}`, destination: merchant.momoPayoutNumber, status: 'processing' });
  await Merchant.updateOne({ _id: merchant._id }, { $inc: { clearedBalance: -amount } });
  return res.status(202).json({ message: 'Withdrawal queued for processing.', transaction });
}

module.exports = { getSummary, withdraw };