const crypto = require('crypto');
const ReferralGroup = require('../models/ReferralGroup');
const Order = require('../models/Order');
const { transferToWallet } = require('./paystackService');
const { sendWhatsAppMessage } = require('./whatsappService');

function referralUrl(token) {
  return `${process.env.PUBLIC_APP_URL || 'https://plusup.site'}/refer/${token}`;
}

async function createReferralForOrder(order) {
  const existing = await ReferralGroup.findOne({ sourceOrderId: order._id });
  if (existing) return existing;
  return ReferralGroup.create({
    merchantId: order.merchantId,
    sourceOrderId: order._id,
    sourceCustomerPhone: order.whatsappPhone || order.customerPhone,
    token: crypto.randomBytes(18).toString('hex'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
}

async function registerReferralPurchase({ token, orderId }) {
  const group = await ReferralGroup.findOneAndUpdate(
    { token, status: 'active', expiresAt: { $gt: new Date() }, referredOrderIds: { $ne: orderId } },
    { $addToSet: { referredOrderIds: orderId } },
    { new: true }
  );
  if (!group || group.referredOrderIds.length < 3) return group;
  return rewardReferralGroup(group._id);
}

async function rewardReferralGroup(groupId) {
  const group = await ReferralGroup.findOneAndUpdate(
    { _id: groupId, status: 'active', referredOrderIds: { $size: 3 } },
    { $set: { status: 'reward_pending' } },
    { new: true }
  );
  if (!group) return ReferralGroup.findById(groupId);

  const sourceOrder = await Order.findById(group.sourceOrderId).lean();
  const cashbackAmount = Number((Number(sourceOrder?.totalAmount || 0) * 0.2).toFixed(2));
  try {
    const transfer = await transferToWallet({
      amount: cashbackAmount,
      recipient: process.env.PAYSTACK_CASHBACK_RECIPIENT,
      reason: `Group-buy cashback for ${group.sourceOrderId}`
    });
    const transferReference = transfer.data?.reference || transfer.data?.transfer_code || '';
    const rewarded = await ReferralGroup.findOneAndUpdate(
      { _id: group._id, status: 'reward_pending' },
      { $set: { status: 'rewarded', cashbackAmount, transferReference, rewardedAt: new Date() } },
      { new: true }
    );
    if (group.sourceCustomerPhone) await sendWhatsAppMessage({ to: group.sourceCustomerPhone, text: `Congrats! 3 friends bought using your link. ${cashbackAmount.toFixed(2)} GHS (20% MoMo cashback) has been sent to your phone!` });
    return rewarded;
  } catch (error) {
    await ReferralGroup.updateOne({ _id: group._id }, { $set: { status: 'active' } });
    throw error;
  }
}

module.exports = { createReferralForOrder, registerReferralPurchase, referralUrl, rewardReferralGroup };
