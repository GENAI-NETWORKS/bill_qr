require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+05:30',
  ssl: { rejectUnauthorized: false },
});

/**
 * Execute a parameterized query
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<[rows, fields]>}
 */
async function query(sql, params = []) {
  return pool.execute(sql, params);
}

/**
 * Get a connection from the pool (for transactions)
 * @returns {Promise<mysql.PoolConnection>}
 */
async function getConnection() {
  return pool.getConnection();
}

module.exports = { query, getConnection, pool };
