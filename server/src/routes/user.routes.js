const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

router.use(authenticate);

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  const { password_hash, email_verification_token, password_reset_token, ...safe } = req.user;
  return ok(res, { user: safe });
});

// PATCH /api/users/profile
router.patch('/profile', async (req, res) => {
  const allowed = ['name', 'phone', 'avatar_url', 'preferred_language', 'meta'];
  const update = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  if (!Object.keys(update).length) return fail(res, 'Nothing to update', 400);
  await db('users').where({ id: req.user.id }).update(update);
  const updated = await db('users').where({ id: req.user.id }).first();
  const { password_hash, email_verification_token, password_reset_token, ...safe } = updated;
  return ok(res, { user: safe }, 'Profile updated');
});

// PATCH /api/users/password
router.patch('/password', async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return fail(res, 'current_password and new_password required', 400);
  if (new_password.length < 8) return fail(res, 'New password must be at least 8 characters', 400);
  const user = await db('users').where({ id: req.user.id }).first();
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) return fail(res, 'Current password is incorrect', 400);
  const password_hash = await bcrypt.hash(new_password, 12);
  await db('users').where({ id: req.user.id }).update({ password_hash });
  return ok(res, {}, 'Password updated');
});

// GET /api/users/notifications
router.get('/notifications', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const [total, notifications] = await Promise.all([
    db('notifications').where((b) => b.where({ user_id: req.user.id }).orWhereNull('user_id')).count('id as count').first(),
    db('notifications').where((b) => b.where({ user_id: req.user.id }).orWhereNull('user_id'))
      .orderBy('created_at', 'desc').limit(limit).offset(offset),
  ]);
  return ok(res, { notifications, pagination: { page, limit, total: total.count } });
});

// PATCH /api/users/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  await db('notifications').where({ id: req.params.id, user_id: req.user.id }).update({ is_read: true });
  return ok(res, {}, 'Marked as read');
});

// GET /api/users/subscriptions
router.get('/subscriptions', async (req, res) => {
  const subs = await db('user_subscriptions as us')
    .join('subscription_plans as p', 'us.plan_id', 'p.id')
    .where({ 'us.user_id': req.user.id })
    .select('us.*', 'p.name as plan_name', 'p.features')
    .orderBy('us.created_at', 'desc');
  return ok(res, { subscriptions: subs });
});

module.exports = router;
