const bcrypt = require('bcryptjs');
const User = require('../models/User');

const staffRoles = ['store_assistant', 'inventory_manager', 'fulfillment_agent'];

async function listStaff(req, res) {
  const staff = await User.find({ merchantId: req.merchant._id, role: 'staff' }).select('-passwordHash -twoFactorSecret').lean();
  return res.json(staff);
}

async function createStaff(req, res) {
  const { firstName, lastName, email, password, staffRole = 'store_assistant', phoneNumber = '' } = req.body;
  if (!firstName || !lastName || !email || !password || !staffRoles.includes(staffRole)) return res.status(400).json({ message: 'Name, email, password, and a valid staff role are required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  try {
    const staff = await User.create({ firstName, lastName, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), phoneNumber, role: 'staff', merchantId: req.merchant._id, staffRole });
    return res.status(201).json({ staff: staff.toObject({ transform: (_, value) => { delete value.passwordHash; return value; } }) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That staff email is already registered.' });
    return res.status(400).json({ message: 'Unable to create staff member.' });
  }
}

async function updateStaff(req, res) {
  const updates = {};
  if (staffRoles.includes(req.body.staffRole)) updates.staffRole = req.body.staffRole;
  if (typeof req.body.isActive === 'boolean') updates.isActive = req.body.isActive;
  const staff = await User.findOneAndUpdate({ _id: req.params.staffId, merchantId: req.merchant._id, role: 'staff' }, { $set: updates }, { new: true, runValidators: true }).select('-passwordHash -twoFactorSecret');
  if (!staff) return res.status(404).json({ message: 'Staff member not found.' });
  return res.json({ staff });
}

async function removeStaff(req, res) {
  const result = await User.deleteOne({ _id: req.params.staffId, merchantId: req.merchant._id, role: 'staff' });
  if (!result.deletedCount) return res.status(404).json({ message: 'Staff member not found.' });
  return res.status(204).send();
}

module.exports = { listStaff, createStaff, updateStaff, removeStaff };