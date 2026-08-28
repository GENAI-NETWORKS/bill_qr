const { query } = require('../utils/db');

async function getCategories(req, res) {
  try {
    const [rows] = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function createCategory(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Category name is required' });
  try {
    const [result] = await query('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: 'Failed to create category' });
  }
}

async function deleteCategory(req, res) {
  try {
    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

module.exports = { getCategories, createCategory, deleteCategory };
