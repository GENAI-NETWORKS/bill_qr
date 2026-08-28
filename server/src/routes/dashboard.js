const express = require('express');
const router = express.Router();
const { getSummary, getRecentOrders } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

router.get('/summary', requireAuth, getSummary);
router.get('/recent-orders', requireAuth, getRecentOrders);

module.exports = router;
