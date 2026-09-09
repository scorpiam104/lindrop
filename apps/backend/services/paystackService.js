const axios = require('axios');

function buildSplitPayload({ amount, platformFeePercent = 2.5, subAccountCode, currency = 'GHS' }) {
  const feePercent = Math.min(30, Math.max(0, Number(platformFeePercent || 0)));
  const subtotal = Number(amount || 0);
  const platformFee = Number((subtotal * feePercent / 100).toFixed(2));
  const merchantShare = Number((subtotal - platformFee).toFixed(2));

  return {
    amount: Math.round(subtotal * 100),
    currency,
    split: {
      type: 'percentage',
      bearer_type: 'account',
      subaccount: subAccountCode || process.env.PAYSTACK_SUBACCOUNT_CODE || '',
      percentage: feePercent
    },
    metadata: {
      platformFee,
      merchantShare,
      platformFeePercent: feePercent
    }
  };
}

function buildPaystackInitializePayload({ email, amount, currency = 'GHS', channels = ['card', 'mobile_money'], split = null, metadata = {} }) {
  return {
    email,
    amount: Math.round(Number(amount || 0) * 100),
    currency,
    channels,
    split: split || {
      type: 'percentage',
      bearer_type: 'account',
      subaccount: process.env.PAYSTACK_SUBACCOUNT_CODE || '',
      percentage: 2.5
    },
    metadata: {
      ...metadata,
      source: 'lindrop-social-commerce'
    }
  };
}

function buildPaystackTransferPayload({ amount, recipient, reason = 'merchant payout' }) {
  return {
    source: 'balance',
    amount: Math.round(Number(amount || 0) * 100),
    recipient,
    reason
  };
}

function buildPaystackRecipientPayload({ type = 'mobile_money', name, accountNumber, bankCode, currency = 'GHS' }) {
  return {
    type,
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency
  };
}

async function createTransferRecipient({ type = 'mobile_money', name, accountNumber, bankCode, currency = 'GHS' }) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('Paystack secret key is not configured.');

  const payload = buildPaystackRecipientPayload({ type, name, accountNumber, bankCode, currency });

  const response = await axios.post('https://api.paystack.co/dedicated_account/virtual_account', payload, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

async function transferToWallet({ amount, recipient, reason = 'merchant payout' }) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('Paystack secret key is not configured.');

  const payload = buildPaystackTransferPayload({ amount, recipient, reason });

  const response = await axios.post('https://api.paystack.co/transfer', payload, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

module.exports = {
  buildSplitPayload,
  buildPaystackInitializePayload,
  buildPaystackTransferPayload,
  buildPaystackRecipientPayload,
  createTransferRecipient,
  transferToWallet
};
