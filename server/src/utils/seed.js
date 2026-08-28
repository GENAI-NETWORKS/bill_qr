require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
    });

    // Create admin user
    const email = 'admin@billqr.com';
    const password = 'admin123';
    const name = 'Admin';
    const hash = await bcrypt.hash(password, 10);

    await connection.query(
      'INSERT IGNORE INTO admins (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hash, name]
    );
    console.log(`✅ Admin seeded: ${email} / ${password}`);

    // Seed sample brands
    const brands = ['Generic', 'Amul', 'Nestle', 'Britannia'];
    for (const b of brands) {
      await connection.query('INSERT IGNORE INTO brands (name) VALUES (?)', [b]);
    }
    console.log('✅ Sample brands seeded');

    // Seed sample categories
    const categories = ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Grains'];
    for (const c of categories) {
      await connection.query('INSERT IGNORE INTO categories (name) VALUES (?)', [c]);
    }
    console.log('✅ Sample categories seeded');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seed();
