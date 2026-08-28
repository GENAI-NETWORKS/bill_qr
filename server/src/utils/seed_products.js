require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');

async function seedProducts() {
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

    console.log('Connected to database. Deleting old data...');
    // Delete data in correct order to respect foreign keys
    await connection.query('DELETE FROM order_items');
    await connection.query('DELETE FROM orders');
    await connection.query('DELETE FROM products');

    console.log('Old data deleted. Inserting 10 new products...');

    // Fetch existing brands and categories to link if possible, or we can just insert and get IDs
    const [brands] = await connection.query('SELECT * FROM brands');
    const [categories] = await connection.query('SELECT * FROM categories');

    const getBrandId = (name) => {
      const b = brands.find(br => br.name === name);
      return b ? b.id : null;
    };
    const getCategoryId = (name) => {
      const c = categories.find(cat => cat.name === name);
      return c ? c.id : null;
    };

    const products = [
      {
        name: 'Amul Butter',
        brand: 'Amul', category: 'Dairy',
        sku: 'AMUL-BTR-100', price: 60.00, stock_qty: 50,
        unit_type: 'gram', unit_value: 100,
        image_url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&q=80',
      },
      {
        name: 'Whole Wheat Bread',
        brand: 'Britannia', category: 'Bakery',
        sku: 'BRIT-BRD-400', price: 45.00, stock_qty: 30,
        unit_type: 'gram', unit_value: 400,
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
      {
        name: 'Organic Milk 1L',
        brand: 'Amul', category: 'Dairy',
        sku: 'AMUL-MLK-1L', price: 75.00, stock_qty: 100,
        unit_type: 'litre', unit_value: 1,
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
      },
      {
        name: 'Basmati Rice 5kg',
        brand: 'Generic', category: 'Grains',
        sku: 'GEN-RICE-5KG', price: 650.00, stock_qty: 20,
        unit_type: 'kg', unit_value: 5,
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
      },
      {
        name: 'Sunflower Oil 1L',
        brand: 'Generic', category: 'Grains',
        sku: 'GEN-OIL-1L', price: 150.00, stock_qty: 40,
        unit_type: 'litre', unit_value: 1,
        image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
      },
      {
        name: 'Tata Salt 1kg',
        brand: 'Generic', category: 'Grains',
        sku: 'TATA-SLT-1KG', price: 25.00, stock_qty: 100,
        unit_type: 'kg', unit_value: 1,
        image_url: 'https://images.unsplash.com/photo-1506458539166-34079f1e1d01?w=400&q=80',
      },
      {
        name: 'Maggi Noodles',
        brand: 'Nestle', category: 'Snacks',
        sku: 'NES-MAG-280', price: 48.00, stock_qty: 80,
        unit_type: 'gram', unit_value: 280,
        image_url: 'https://images.unsplash.com/photo-1612929633738-8fe01f7c8166?w=400&q=80',
      },
      {
        name: 'Nescafe Classic',
        brand: 'Nestle', category: 'Beverages',
        sku: 'NES-COF-100', price: 320.00, stock_qty: 25,
        unit_type: 'gram', unit_value: 100,
        image_url: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&q=80',
      },
      {
        name: 'Lays Classic Salted',
        brand: 'Generic', category: 'Snacks',
        sku: 'LAY-CL-50', price: 20.00, stock_qty: 150,
        unit_type: 'gram', unit_value: 50,
        image_url: 'https://images.unsplash.com/photo-1566478989037-e924e50cb0ee?w=400&q=80',
      },
      {
        name: 'Coca Cola 1.5L',
        brand: 'Generic', category: 'Beverages',
        sku: 'COKE-1.5L', price: 95.00, stock_qty: 60,
        unit_type: 'litre', unit_value: 1.5,
        image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      }
    ];

    for (const p of products) {
      const qr_token = require('crypto').randomUUID();
      await connection.query(
        `INSERT INTO products (brand_id, category_id, name, price, stock_qty, unit_type, unit_value, image_url, qr_token) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          getBrandId(p.brand),
          getCategoryId(p.category),
          p.name,
          p.price,
          p.stock_qty,
          p.unit_type,
          p.unit_value,
          p.image_url,
          qr_token
        ]
      );
    }

    console.log('✅ 10 new products successfully inserted!');

  } catch (err) {
    console.error('❌ Error during database operation:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

seedProducts();
