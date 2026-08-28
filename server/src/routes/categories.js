const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoriesController');
const { requireAuth } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', requireAuth, createCategory);
router.delete('/:id', requireAuth, deleteCategory);

module.exports = router;
