const { query } = require('../utils/db');

async function scanProduct(req, res) {
  const { qr_token } = req.params;

  if (!qr_token) return res.status(400).json({ error: 'QR token is required' });

  try {
    const [rows] = await query(
      `SELECT p.id, p.name, p.image_url, p.unit_type, p.unit_value, p.price, p.stock_qty,
              p.mrp, p.discount_percent, p.gst_percent,
              b.name AS brand_name, c.name AS category_name, p.qr_token
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.qr_token = ?`,
      [qr_token]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Product not found. This QR code may be invalid or expired.' });
    }

    const product = rows[0];
    res.json({
      ...product,
      in_stock: parseFloat(product.stock_qty) > 0,
      stock_qty: parseFloat(product.stock_qty),
      price: parseFloat(product.price),
      mrp: parseFloat(product.mrp) || parseFloat(product.price),
      discount_percent: parseFloat(product.discount_percent) || 0,
      gst_percent: parseFloat(product.gst_percent) || 0,
      unit_value: parseFloat(product.unit_value),
    });
  } catch (err) {
    console.error('scanProduct error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

module.exports = { scanProduct };
