const express = require('express');
const router = express.Router();
const { scanProduct } = require('../controllers/scanController');

router.get('/:qr_token', scanProduct);

module.exports = router;
