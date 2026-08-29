const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await query('SELECT * FROM admins WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: isProd, // required for sameSite: 'none', but false for local HTTP dev
      sameSite: isProd ? 'none' : 'lax', // required for cross-origin (Vercel to Render)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function logout(req, res) {
  res.clearCookie('adminToken');
  res.json({ success: true });
}

async function me(req, res) {
  res.json({ admin: req.admin });
}

module.exports = { login, logout, me };
