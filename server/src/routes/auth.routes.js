const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { signAccess, signRefresh, verifyRefresh, randomToken } = require('../utils/token');
const { sendEmail } = require('../services/email.service');
const { authenticate } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 'Validation failed', 400, errors.array());

  const { name, email, password, phone, preferred_language = 'en' } = req.body;

  const existing = await db('users').where({ email }).first();
  if (existing) return fail(res, 'Email already registered', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const emailToken = randomToken();

  const [id] = await db('users').insert({
    uuid: uuidv4(), name, email, phone: phone || null,
    password_hash, preferred_language, email_verification_token: emailToken,
  });

  const verifyUrl = `${process.env.APP_URL || 'https://jyotishstack.com'}/verify-email?token=${emailToken}`;
  sendEmail({ to: email, template: 'welcome', data: { name, verifyUrl } }).catch(() => {});

  const user = await db('users').where({ id }).first();
  const accessToken = signAccess({ id: user.id, role: user.role });
  const refreshToken = signRefresh({ id: user.id });
  await db('user_sessions').insert({ user_id: user.id, refresh_token: refreshToken, ip_address: req.ip, expires_at: new Date(Date.now() + 30 * 86400000) });

  const { password_hash: _, email_verification_token: __, ...safeUser } = user;
  return ok(res, { user: safeUser, accessToken, refreshToken }, 'Registered successfully', 201);
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 'Validation failed', 400, errors.array());

  const { email, password } = req.body;
  const user = await db('users').where({ email }).first();
  if (!user) return fail(res, 'Invalid credentials', 401);
  if (!user.is_active) return fail(res, 'Account is deactivated. Please contact support.', 403);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return fail(res, 'Invalid credentials', 401);

  const accessToken = signAccess({ id: user.id, role: user.role });
  const refreshToken = signRefresh({ id: user.id });
  await db('user_sessions').insert({ user_id: user.id, refresh_token: refreshToken, ip_address: req.ip, expires_at: new Date(Date.now() + 30 * 86400000) });

  const { password_hash, email_verification_token, password_reset_token, ...safeUser } = user;
  return ok(res, { user: safeUser, accessToken, refreshToken }, 'Login successful');
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return fail(res, 'Refresh token required', 400);
  try {
    const payload = verifyRefresh(refreshToken);
    const session = await db('user_sessions').where({ user_id: payload.id, refresh_token: refreshToken }).first();
    if (!session) return fail(res, 'Session not found', 401);
    const user = await db('users').where({ id: payload.id, is_active: true }).first();
    if (!user) return fail(res, 'User not found', 401);
    const accessToken = signAccess({ id: user.id, role: user.role });
    return ok(res, { accessToken });
  } catch {
    return fail(res, 'Invalid refresh token', 401);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await db('user_sessions').where({ user_id: req.user.id, refresh_token: refreshToken }).del();
  return ok(res, {}, 'Logged out');
});

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return fail(res, 'Token required', 400);
  const user = await db('users').where({ email_verification_token: token }).first();
  if (!user) return fail(res, 'Invalid or expired token', 400);
  await db('users').where({ id: user.id }).update({ email_verified: true, email_verification_token: null });
  return ok(res, {}, 'Email verified successfully');
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail().normalizeEmail({ gmail_remove_dots: false })], async (req, res) => {
  const { email } = req.body;
  const user = await db('users').where({ email }).first();
  if (!user) return ok(res, {}, 'If that email exists, a reset link has been sent'); // Don't reveal

  const resetToken = randomToken();
  const expires = new Date(Date.now() + 3600000); // 1 hour
  await db('users').where({ id: user.id }).update({ password_reset_token: resetToken, password_reset_expires: expires });
  const resetUrl = `${process.env.APP_URL || 'https://jyotishstack.com'}/reset-password?token=${resetToken}`;
  sendEmail({ to: email, template: 'reset_password', data: { resetUrl } }).catch(() => {});
  return ok(res, {}, 'If that email exists, a reset link has been sent');
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const { token, password } = req.body;
  const user = await db('users').where({ password_reset_token: token }).first();
  if (!user || new Date(user.password_reset_expires) < new Date()) return fail(res, 'Invalid or expired token', 400);
  const password_hash = await bcrypt.hash(password, 12);
  await db('users').where({ id: user.id }).update({ password_hash, password_reset_token: null, password_reset_expires: null });
  return ok(res, {}, 'Password reset successfully');
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const { password_hash, email_verification_token, password_reset_token, ...safeUser } = req.user;
  return ok(res, { user: safeUser });
});

module.exports = router;
