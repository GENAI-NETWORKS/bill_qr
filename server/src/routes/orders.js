const express = require('express');
const router = express.Router();
const { createOrder, getOrder, getOrders, payOrder } = require('../controllers/ordersController');
const { requireAuth } = require('../middleware/auth');

// Public
router.post('/', createOrder);
router.get('/:id', getOrder);
router.post('/:id/pay', payOrder);

// Admin only
router.get('/', requireAuth, getOrders);

module.exports = router;
