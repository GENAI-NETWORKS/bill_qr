const db = require('../utils/db');

exports.getCustomers = async (req, res) => {
  try {
    const sql = `
      SELECT 
        customer_phone as phone, 
        MAX(customer_name) as name, 
        COUNT(id) as total_orders, 
        SUM(total_amount) as total_spent, 
        MAX(created_at) as last_order_date
      FROM orders 
      WHERE customer_phone IS NOT NULL AND customer_phone != ''
      GROUP BY customer_phone
      ORDER BY last_order_date DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const { phone } = req.params;
    const sql = `
      SELECT * 
      FROM orders 
      WHERE customer_phone = ? 
      ORDER BY created_at DESC
    `;
    const [rows] = await db.query(sql, [phone]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
};
