const jwt = require('jsonwebtoken');

/**
 * Middleware to protect admin routes
 * Reads JWT from httpOnly cookie or Authorization header
 */
function requireAuth(req, res, next) {
  let token = req.cookies?.adminToken;

  // Also support Bearer token (for dev/testing)
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
