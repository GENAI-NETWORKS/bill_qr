const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerOrders } = require('../controllers/customersController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getCustomers);
router.get('/:phone/orders', requireAuth, getCustomerOrders);

module.exports = router;
