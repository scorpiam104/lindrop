const express = require('express');
const { createStaff, listStaff, removeStaff, updateStaff } = require('../controllers/staffController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('merchant', 'admin'));
router.get('/', listStaff);
router.post('/', createStaff);
router.patch('/:staffId', updateStaff);
router.delete('/:staffId', removeStaff);
module.exports = router;