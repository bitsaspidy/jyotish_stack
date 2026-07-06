const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function userFromAuthorization(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  return db('users').where({ id: payload.id, is_active: true }).first();
}

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const user = await userFromAuthorization(header);
    if (!user) return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const optionalAuthenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return next();
  if (!header.startsWith('Bearer ')) return next();
  try {
    const user = await userFromAuthorization(header);
    if (user) req.user = user;
    return next();
  } catch {
    // Public routes using optional authentication must remain available when a
    // browser carries a stale token. Paid access is granted only after a valid
    // user and active subscription are verified by the route.
    return next();
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate, requireRole };
