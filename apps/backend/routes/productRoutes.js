const express = require('express');
const { createProduct, getProduct, getStoreProducts, listProducts } = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');
const { requireTier } = require('../middleware/tierGate');

const router = express.Router();
router.get('/store/:storeSlug', getStoreProducts);
router.get('/:productId', getProduct);
router.get('/', requireAuth, listProducts);
router.post('/', requireAuth, requireTier('products'), createProduct);
module.exports = router;
