const { query } = require('../utils/db');

async function getBrands(req, res) {
  try {
    const [rows] = await query('SELECT * FROM brands ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
}

async function createBrand(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Brand name is required' });
  try {
    const [result] = await query('INSERT INTO brands (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Brand already exists' });
    res.status(500).json({ error: 'Failed to create brand' });
  }
}

async function deleteBrand(req, res) {
  try {
    await query('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
}

module.exports = { getBrands, createBrand, deleteBrand };
