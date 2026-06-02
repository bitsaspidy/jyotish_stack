const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const maintenanceGuard = require('../middleware/maintenance');
const { sendEmail } = require('../services/email.service');
const { ok, fail } = require('../utils/response');

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin', 'superadmin'));

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
router.get('/dashboard', async (_req, res) => {
  const [users, subscribers, kundlis, subscriptions, emailLogs] = await Promise.all([
    db('users').count('id as count').first(),
    db('newsletter_subscribers').where({ is_active: true }).count('id as count').first(),
    db('kundli_profiles').count('id as count').first(),
    db('user_subscriptions').where({ status: 'active' }).count('id as count').first(),
    db('email_logs').count('id as count').first(),
  ]);
  return ok(res, {
    stats: {
      total_users: users.count,
      active_subscribers: subscribers.count,
      kundli_profiles: kundlis.count,
      active_subscriptions: subscriptions.count,
      emails_sent: emailLogs.count,
    },
  });
});

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let q = db('users').select('id', 'uuid', 'name', 'email', 'phone', 'role', 'is_active', 'email_verified', 'preferred_language', 'created_at');
  if (search) q = q.where((b) => b.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`));

  const [total, users] = await Promise.all([q.clone().count('id as count').first(), q.limit(limit).offset(offset).orderBy('created_at', 'desc')]);
  return ok(res, { users, pagination: { page, limit, total: total.count } });
});

router.get('/users/:id', async (req, res) => {
  const user = await db('users').where({ id: req.params.id })
    .select('id', 'uuid', 'name', 'email', 'phone', 'role', 'is_active', 'email_verified', 'preferred_language', 'avatar_url', 'meta', 'created_at', 'updated_at').first();
  if (!user) return fail(res, 'User not found', 404);
  return ok(res, { user });
});

router.patch('/users/:id/toggle-active', async (req, res) => {
  const user = await db('users').where({ id: req.params.id }).first();
  if (!user) return fail(res, 'User not found', 404);
  if (user.role === 'superadmin') return fail(res, 'Cannot deactivate superadmin', 403);
  await db('users').where({ id: req.params.id }).update({ is_active: !user.is_active });
  return ok(res, { is_active: !user.is_active }, `User ${!user.is_active ? 'activated' : 'deactivated'}`);
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  const allowed = ['user', 'admin'];
  if (!allowed.includes(role)) return fail(res, 'Invalid role', 400);
  await db('users').where({ id: req.params.id }).update({ role });
  return ok(res, { role }, 'Role updated');
});

router.post('/users', async (req, res) => {
  const { name, email, password, role = 'user', phone } = req.body;
  if (!name || !email || !password) return fail(res, 'name, email, password required', 400);
  const existing = await db('users').where({ email }).first();
  if (existing) return fail(res, 'Email already registered', 409);
  const password_hash = await bcrypt.hash(password, 12);
  const [id] = await db('users').insert({ uuid: uuidv4(), name, email, phone: phone || null, password_hash, role, email_verified: true, is_active: true });
  const user = await db('users').where({ id }).select('id', 'uuid', 'name', 'email', 'role', 'is_active').first();
  return ok(res, { user }, 'User created', 201);
});

// ─── EMAIL BLAST ──────────────────────────────────────────────────────────────
router.post('/send-email', async (req, res) => {
  const { user_ids, all_users, subject, body: emailBody } = req.body;
  if (!subject || !emailBody) return fail(res, 'subject and body required', 400);

  let targets = [];
  if (all_users) {
    targets = await db('users').where({ is_active: true }).select('email', 'name');
  } else if (Array.isArray(user_ids) && user_ids.length > 0) {
    targets = await db('users').whereIn('id', user_ids).select('email', 'name');
  }
  if (!targets.length) return fail(res, 'No recipients found', 400);

  // Fire-and-forget batch
  setImmediate(async () => {
    for (const t of targets) {
      await sendEmail({ to: t.email, template: 'custom', data: { subject, body: emailBody } });
    }
  });

  return ok(res, { queued: targets.length }, `Email queued for ${targets.length} recipient(s)`);
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
router.post('/notifications', async (req, res) => {
  const { user_id, title, body, type = 'info', action_url } = req.body;
  if (!title || !body) return fail(res, 'title and body required', 400);
  const [id] = await db('notifications').insert({ user_id: user_id || null, title, body, type, action_url: action_url || null, sent_at: new Date() });
  return ok(res, { id }, 'Notification sent', 201);
});

router.get('/notifications', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const [total, notifications] = await Promise.all([
    db('notifications').count('id as count').first(),
    db('notifications').orderBy('created_at', 'desc').limit(limit).offset(offset),
  ]);
  return ok(res, { notifications, pagination: { page, limit, total: total.count } });
});

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────
router.get('/settings', async (_req, res) => {
  const settings = await db('app_settings').select();
  const map = {};
  settings.forEach((s) => (map[s.key] = s.value));
  return ok(res, { settings: map });
});

router.patch('/settings', async (req, res) => {
  const updates = req.body; // { key: value, ... }
  for (const [key, value] of Object.entries(updates)) {
    await db('app_settings').where({ key }).update({ value: String(value) });
  }
  // Invalidate maintenance cache if needed
  if ('maintenance_mode' in updates) maintenanceGuard.invalidate();
  return ok(res, {}, 'Settings updated');
});

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────
router.get('/newsletter', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const [total, subscribers] = await Promise.all([
    db('newsletter_subscribers').count('id as count').first(),
    db('newsletter_subscribers').orderBy('subscribed_at', 'desc').limit(limit).offset(offset),
  ]);
  return ok(res, { subscribers, pagination: { page, limit, total: total.count } });
});

router.post('/newsletter/blast', async (req, res) => {
  const { subject, body: emailBody } = req.body;
  if (!subject || !emailBody) return fail(res, 'subject and body required', 400);
  const subscribers = await db('newsletter_subscribers').where({ is_active: true }).select('email', 'name', 'unsubscribe_token');
  if (!subscribers.length) return fail(res, 'No active subscribers', 400);

  setImmediate(async () => {
    for (const s of subscribers) {
      const unsubscribeUrl = `${process.env.APP_URL || 'https://jyotishstack.com'}/newsletter/unsubscribe?token=${s.unsubscribe_token}`;
      await sendEmail({ to: s.email, template: 'newsletter', data: { subject, body: emailBody, unsubscribeUrl } });
    }
  });

  return ok(res, { queued: subscribers.length }, `Newsletter queued for ${subscribers.length} subscriber(s)`);
});

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────
router.get('/plans', async (_req, res) => {
  const plans = await db('subscription_plans').select();
  return ok(res, { plans });
});

router.post('/plans', async (req, res) => {
  const { name, name_hi, description, price, currency = 'INR', duration_days, features } = req.body;
  if (!name || !price || !duration_days) return fail(res, 'name, price, duration_days required', 400);
  const [id] = await db('subscription_plans').insert({ name, name_hi, description, price, currency, duration_days, features: JSON.stringify(features || []) });
  return ok(res, { id }, 'Plan created', 201);
});

router.patch('/plans/:id', async (req, res) => {
  const allowed = ['name', 'name_hi', 'description', 'price', 'currency', 'duration_days', 'features', 'is_active'];
  const update = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = k === 'features' ? JSON.stringify(req.body[k]) : req.body[k]; });
  await db('subscription_plans').where({ id: req.params.id }).update(update);
  return ok(res, {}, 'Plan updated');
});

// ─── EMAIL LOGS ───────────────────────────────────────────────────────────────
router.get('/email-logs', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * 20;
  const [total, logs] = await Promise.all([
    db('email_logs').count('id as count').first(),
    db('email_logs').orderBy('created_at', 'desc').limit(20).offset(offset),
  ]);
  return ok(res, { logs, pagination: { page, limit: 20, total: total.count } });
});

module.exports = router;
