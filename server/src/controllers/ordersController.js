const { query, getConnection } = require('../utils/db');

function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${datePart}-${rand}`;
}

async function createOrder(req, res) {
  const { items, customer_name, customer_phone } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

  // Validate items
  for (const item of items) {
    if (!item.product_id || !item.quantity || parseFloat(item.quantity) <= 0) {
      return res.status(400).json({ error: 'Each item must have product_id and positive quantity' });
    }
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Get settings for tax
    const [settingsRows] = await conn.execute('SELECT key_name, value FROM settings WHERE key_name IN (?, ?)', ['tax_percent', 'currency_symbol']);
    const settings = Object.fromEntries(settingsRows.map(r => [r.key_name, r.value]));
    const taxPercent = parseFloat(settings.tax_percent || '0');

    // Lock & validate products
    let subtotal = 0;
    let totalTaxAmount = 0;
    const enrichedItems = [];

    for (const item of items) {
      const [rows] = await conn.execute(
        'SELECT id, name, price, gst_percent, stock_qty FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      if (!rows.length) throw new Error(`Product ${item.product_id} not found`);

      const product = rows[0];
      const qty = parseFloat(item.quantity);

      if (parseFloat(product.stock_qty) < qty) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_qty}`);
      }

      const lineTotal = parseFloat(product.price) * qty;
      const gstPercent = parseFloat(product.gst_percent) || 0;
      const itemTax = (lineTotal * gstPercent) / 100;
      
      subtotal += lineTotal;
      totalTaxAmount += itemTax;

      enrichedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: parseFloat(product.price),
        line_total: lineTotal,
        current_stock: parseFloat(product.stock_qty),
      });
    }

    const totalAmount = subtotal + totalTaxAmount;
    const orderNumber = generateOrderNumber();

    // Insert order
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (order_number, total_amount, tax_amount, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?)',
      [orderNumber, totalAmount, totalTaxAmount, customer_name || null, customer_phone || null]
    );
    const orderId = orderResult.insertId;

    // Insert items + deduct stock
    for (const item of enrichedItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total]
      );
      await conn.execute(
        'UPDATE products SET stock_qty = stock_qty - ?, updated_at = NOW() WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();

    // Return full order
    const [orderRows] = await conn.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.status(201).json({
      ...orderRows[0],
      items: enrichedItems,
      subtotal,
      tax_amount: totalTaxAmount,
      total_amount: totalAmount,
    });
  } catch (err) {
    await conn.rollback();
    console.error('createOrder error:', err);
    if (err.message.includes('Insufficient stock') || err.message.includes('not found')) {
      return res.status(422).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    conn.release();
  }
}

async function getOrder(req, res) {
  try {
    const [orders] = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });

    const [items] = await query(
      `SELECT oi.*, p.image_url, p.mrp, p.discount_percent, p.gst_percent
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    const [settings] = await query('SELECT key_name, value FROM settings');
    const settingsMap = Object.fromEntries(settings.map(s => [s.key_name, s.value]));

    res.json({ ...orders[0], items, settings: settingsMap });
  } catch (err) {
    console.error('getOrder error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

async function getOrders(req, res) {
  try {
    const { page = 1, limit = 20, status, from, to } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (status) { where += ' AND payment_status = ?'; params.push(status); }
    if (from) { where += ' AND DATE(created_at) >= ?'; params.push(from); }
    if (to) { where += ' AND DATE(created_at) <= ?'; params.push(to); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await query(
      `SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
       FROM orders o ${where}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [countRows] = await query(`SELECT COUNT(*) AS total FROM orders ${where}`, params);

    res.json({ orders: rows, total: countRows[0].total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

async function payOrder(req, res) {
  try {
    const [orders] = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    if (orders[0].payment_status === 'paid') {
      return res.json({ success: true, message: 'Already paid', order: orders[0] });
    }

    // Simulate payment processing delay (handled on frontend)
    await query(
      "UPDATE orders SET payment_status = 'paid', payment_method = 'dummy' WHERE id = ?",
      [req.params.id]
    );

    const [updated] = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, order: updated[0] });
  } catch (err) {
    console.error('payOrder error:', err);
    res.status(500).json({ error: 'Payment failed' });
  }
}

module.exports = { createOrder, getOrder, getOrders, payOrder };
