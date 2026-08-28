require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runSchema() {
  let connection;
  try {
    // Connect directly to the existing database (Hostinger pre-creates it)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
    });

    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    // Split by semicolon and run each statement
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await connection.query(stmt);
    }

    console.log('✅ Schema created successfully');
  } catch (err) {
    console.error('❌ Schema error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runSchema();
