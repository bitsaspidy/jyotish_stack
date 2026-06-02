const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const verifyRefresh = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

module.exports = { signAccess, signRefresh, verifyRefresh, randomToken };
