const express = require('express');
const router = express.Router();
const { getBrands, createBrand, deleteBrand } = require('../controllers/brandsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', getBrands);
router.post('/', requireAuth, createBrand);
router.delete('/:id', requireAuth, deleteBrand);

module.exports = router;
