const { query } = require('../utils/db');

async function getSummary(req, res) {
  try {
    // Total products & stock value
    const [[productStats]] = await query(
      'SELECT COUNT(*) AS total_products, SUM(stock_qty * price) AS stock_value FROM products'
    );

    // Low stock products
    const [lowStock] = await query(
      `SELECT p.id, p.name, p.stock_qty, p.low_stock_threshold, b.name AS brand_name, c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_qty <= p.low_stock_threshold
       ORDER BY p.stock_qty ASC
       LIMIT 20`
    );

    // Order counts
    const [[todayOrders]] = await query(
      "SELECT COUNT(*) AS count, SUM(total_amount) AS revenue FROM orders WHERE DATE(created_at) = CURDATE()"
    );
    const [[monthOrders]] = await query(
      "SELECT COUNT(*) AS count, SUM(total_amount) AS revenue FROM orders WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())"
    );
    const [[allOrders]] = await query(
      "SELECT COUNT(*) AS count FROM orders"
    );
    const [[revenueRow]] = await query(
      "SELECT SUM(total_amount) AS total FROM orders WHERE payment_status = 'paid'"
    );

    // Stock value by category
    const [stockByCategory] = await query(
      `SELECT c.name AS category, SUM(p.stock_qty * p.price) AS value
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       GROUP BY c.name`
    );

    // Orders last 7 days
    const [ordersLastWeek] = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count, SUM(total_amount) AS revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      total_products: productStats.total_products || 0,
      stock_value: parseFloat(productStats.stock_value || 0).toFixed(2),
      low_stock: lowStock,
      orders: {
        today: { count: todayOrders.count || 0, revenue: parseFloat(todayOrders.revenue || 0).toFixed(2) },
        month: { count: monthOrders.count || 0, revenue: parseFloat(monthOrders.revenue || 0).toFixed(2) },
        all: { count: allOrders.count || 0 },
      },
      total_revenue: parseFloat(revenueRow.total || 0).toFixed(2),
      stock_by_category: stockByCategory,
      orders_last_week: ordersLastWeek,
    });
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
}

async function getRecentOrders(req, res) {
  try {
    const [orders] = await query(
      `SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
       FROM orders o
       ORDER BY o.created_at DESC
       LIMIT 10`
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
}

module.exports = { getSummary, getRecentOrders };
