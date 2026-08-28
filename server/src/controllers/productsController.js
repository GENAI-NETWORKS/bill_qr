const { query, getConnection } = require('../utils/db');
const { generateQR, generateQRDataUrl } = require('../utils/qrGenerator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function getProducts(req, res) {
  try {
    const { search, brand_id, category_id, sort = 'name', order = 'asc', page = 1, limit = 50 } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (search) {
      where += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (brand_id) {
      where += ' AND p.brand_id = ?';
      params.push(brand_id);
    }
    if (category_id) {
      where += ' AND p.category_id = ?';
      params.push(category_id);
    }

    const allowedSort = { name: 'p.name', stock: 'p.stock_qty', price: 'p.price', created: 'p.created_at' };
    const sortCol = allowedSort[sort] || 'p.name';
    const sortDir = order === 'desc' ? 'DESC' : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sql = `
      SELECT p.*, b.name AS brand_name, c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const [rows] = await query(sql, params);

    // Count total
    const [countRows] = await query(
      `SELECT COUNT(*) as total FROM products p ${where}`,
      params.slice(0, -2)
    );

    res.json({ products: rows, total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function getProduct(req, res) {
  try {
    const [rows] = await query(
      `SELECT p.*, b.name AS brand_name, c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

async function createProduct(req, res) {
  const { name, brand_id, category_id, image_url, unit_type, unit_value, price, mrp, discount_percent, gst_percent, stock_qty, low_stock_threshold } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Product name is required' });
  if (!unit_type) return res.status(400).json({ error: 'Unit type is required' });
  if (!price || isNaN(price) || parseFloat(price) < 0) return res.status(400).json({ error: 'Valid price is required' });

  try {
    // Handle file upload
    let finalImageUrl = image_url || null;
    if (req.file) {
      finalImageUrl = `/uploads/images/${req.file.filename}`;
    }

    // Generate unique token
    const qrToken = uuidv4();
    const scanUrl = `${BASE_URL}/scan/${qrToken}`;

    // Generate QR
    const { relativePath, dataUrl } = await generateQR(scanUrl, qrToken);

    const [result] = await query(
      `INSERT INTO products (name, brand_id, category_id, image_url, unit_type, unit_value, price, mrp, discount_percent, gst_percent, stock_qty, low_stock_threshold, qr_code_path, qr_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        brand_id || null,
        category_id || null,
        finalImageUrl,
        unit_type,
        parseFloat(unit_value) || 1,
        parseFloat(price),
        parseFloat(mrp) || parseFloat(price),
        parseFloat(discount_percent) || 0,
        parseFloat(gst_percent) || 0,
        parseFloat(stock_qty) || 0,
        parseFloat(low_stock_threshold) || 5,
        relativePath,
        qrToken,
      ]
    );

    const [newProduct] = await query(
      `SELECT p.*, b.name AS brand_name, c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ ...newProduct[0], qr_data_url: dataUrl, scan_url: scanUrl });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, brand_id, category_id, image_url, unit_type, unit_value, price, mrp, discount_percent, gst_percent, stock_qty, low_stock_threshold } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Product name is required' });

  try {
    let finalImageUrl = image_url || null;
    if (req.file) {
      finalImageUrl = `/uploads/images/${req.file.filename}`;
    }

    await query(
      `UPDATE products SET name=?, brand_id=?, category_id=?, image_url=?, unit_type=?, unit_value=?, price=?, mrp=?, discount_percent=?, gst_percent=?, stock_qty=?, low_stock_threshold=?, updated_at=NOW()
       WHERE id=?`,
      [
        name.trim(),
        brand_id || null,
        category_id || null,
        finalImageUrl,
        unit_type,
        parseFloat(unit_value) || 1,
        parseFloat(price),
        parseFloat(mrp) || parseFloat(price),
        parseFloat(discount_percent) || 0,
        parseFloat(gst_percent) || 0,
        parseFloat(stock_qty) || 0,
        parseFloat(low_stock_threshold) || 5,
        id,
      ]
    );

    const [rows] = await query(
      `SELECT p.*, b.name AS brand_name, c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const [rows] = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    await query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

async function updateStock(req, res) {
  const { id } = req.params;
  const { action, amount, reason } = req.body;

  if (!['add', 'subtract', 'set'].includes(action)) {
    return res.status(400).json({ error: 'action must be add, subtract, or set' });
  }
  if (isNaN(amount) || parseFloat(amount) < 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  try {
    const [rows] = await query('SELECT stock_qty FROM products WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    let newQty;
    const current = parseFloat(rows[0].stock_qty);
    const amt = parseFloat(amount);

    if (action === 'add') newQty = current + amt;
    else if (action === 'subtract') newQty = Math.max(0, current - amt);
    else newQty = amt;

    await query('UPDATE products SET stock_qty = ?, updated_at = NOW() WHERE id = ?', [newQty, id]);
    res.json({ success: true, stock_qty: newQty });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
}

async function getProductQR(req, res) {
  try {
    const [rows] = await query('SELECT qr_token, qr_code_path, name FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const product = rows[0];
    const scanUrl = `${BASE_URL}/scan/${product.qr_token}`;

    // Regenerate data URL on demand
    const dataUrl = await generateQRDataUrl(scanUrl);

    res.json({
      qr_data_url: dataUrl,
      qr_code_path: product.qr_code_path,
      scan_url: scanUrl,
      product_name: product.name,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get QR' });
  }
}

async function downloadQR(req, res) {
  try {
    const [rows] = await query('SELECT qr_code_path, name FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const filePath = path.join(__dirname, '../../', rows[0].qr_code_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'QR file not found' });
    }

    res.download(filePath, `qr_${rows[0].name.replace(/\s+/g, '_')}.png`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download QR' });
  }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock, getProductQR, downloadQR };
