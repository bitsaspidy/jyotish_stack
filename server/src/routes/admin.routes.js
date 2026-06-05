const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const maintenanceGuard = require('../middleware/maintenance');
const { sendEmail } = require('../services/email.service');
const { ok, fail } = require('../utils/response');
const {
  parseJsonMaybe, buildKundliListSummary, ensureCalculatedChart, calcAndSave,
  buildFullKundliResponse, generateVarshphal, computeKundliStrength,
} = require('../services/kundli-admin.service');

// Async error wrapper — passes any thrown/rejected error to Express global handler
// (Express 4 does NOT auto-handle async errors; without this, unhandled rejections
//  crash the process in Node.js ≥ 15)
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin', 'superadmin'));

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
router.get('/dashboard', ah(async (_req, res) => {
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);

  const [
    users, subscribers, kundlis, subscriptions, emailLogs,
    usersToday, kundlisToday, emailsToday,
    recentUsers, recentKundlis,
  ] = await Promise.all([
    db('users').count('id as count').first(),
    db('newsletter_subscribers').where({ is_active: true }).count('id as count').first(),
    db('kundli_profiles').count('id as count').first(),
    db('user_subscriptions').where({ status: 'active' }).count('id as count').first(),
    db('email_logs').count('id as count').first(),
    db('users').where('created_at', '>=', todayStart).count('id as count').first(),
    db('kundli_profiles').where('created_at', '>=', todayStart).count('id as count').first(),
    db('email_logs').where('created_at', '>=', todayStart).count('id as count').first(),
    db('users').select('id','name','email','role','is_active','created_at').orderBy('created_at','desc').limit(7),
    db('kundli_profiles').select('id','uuid','name','place_of_birth','gender','date_of_birth','user_id','created_at').orderBy('created_at','desc').limit(7),
  ]);

  // Weekly signup chart (last 7 days)
  const signups7d = [];
  for (let i = 6; i >= 0; i--) {
    const d     = new Date(Date.now() - i * 86400000);
    const start = new Date(d); start.setHours(0,0,0,0);
    const end   = new Date(d); end.setHours(23,59,59,999);
    const row   = await db('users').whereBetween('created_at', [start, end]).count('id as count').first();
    signups7d.push({ date: start.toISOString().slice(0,10), count: Number(row.count) });
  }

  return ok(res, {
    stats: {
      total_users:          Number(users.count),
      active_subscribers:   Number(subscribers.count),
      kundli_profiles:      Number(kundlis.count),
      active_subscriptions: Number(subscriptions.count),
      emails_sent:          Number(emailLogs.count),
      users_today:          Number(usersToday.count),
      kundlis_today:        Number(kundlisToday.count),
      emails_today:         Number(emailsToday.count),
    },
    recent_users:   recentUsers,
    recent_kundlis: recentKundlis,
    signups_7d:     signups7d,
  });
}));

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
router.get('/users', ah(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const search = (req.query.search || '').trim();
  const role   = req.query.role   || '';
  const status = req.query.status || '';
  const offset = (page - 1) * limit;

  let q = db('users').select('id', 'uuid', 'name', 'email', 'phone', 'role', 'is_active', 'email_verified', 'preferred_language', 'created_at');

  if (search) q = q.where((b) => b.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`));
  if (role)   q = q.where({ role });
  if (status === 'active')   q = q.where({ is_active: true });
  if (status === 'inactive') q = q.where({ is_active: false });

  const [total, users] = await Promise.all([
    q.clone().clearSelect().count('id as count').first(),
    q.clone().limit(limit).offset(offset).orderBy('created_at', 'desc'),
  ]);
  return ok(res, { users, pagination: { page, limit, total: Number(total.count) } });
}));

router.get('/users/:id', ah(async (req, res) => {
  const user = await db('users').where({ id: req.params.id })
    .select('id', 'uuid', 'name', 'email', 'phone', 'role', 'is_active', 'email_verified', 'preferred_language', 'avatar_url', 'meta', 'created_at', 'updated_at').first();
  if (!user) return fail(res, 'User not found', 404);
  return ok(res, { user });
}));

router.patch('/users/:id/toggle-active', ah(async (req, res) => {
  const user = await db('users').where({ id: req.params.id }).first();
  if (!user) return fail(res, 'User not found', 404);
  if (user.role === 'superadmin') return fail(res, 'Cannot deactivate superadmin', 403);
  await db('users').where({ id: req.params.id }).update({ is_active: !user.is_active });
  return ok(res, { is_active: !user.is_active }, `User ${!user.is_active ? 'activated' : 'deactivated'}`);
}));

router.patch('/users/:id/role', ah(async (req, res) => {
  const { role } = req.body;
  const allowed = ['user', 'admin'];
  if (!allowed.includes(role)) return fail(res, 'Invalid role', 400);
  await db('users').where({ id: req.params.id }).update({ role });
  return ok(res, { role }, 'Role updated');
}));

router.post('/users', ah(async (req, res) => {
  const { name, email, password, role = 'user', phone } = req.body;
  if (!name || !email || !password) return fail(res, 'name, email, password required', 400);
  const existing = await db('users').where({ email }).first();
  if (existing) return fail(res, 'Email already registered', 409);
  const password_hash = await bcrypt.hash(password, 12);
  const [id] = await db('users').insert({ uuid: uuidv4(), name, email, phone: phone || null, password_hash, role, email_verified: true, is_active: true });
  const user = await db('users').where({ id }).select('id', 'uuid', 'name', 'email', 'role', 'is_active').first();
  return ok(res, { user }, 'User created', 201);
}));

// ─── EMAIL BLAST ──────────────────────────────────────────────────────────────
router.post('/send-email', ah(async (req, res) => {
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
}));

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
router.post('/notifications', ah(async (req, res) => {
  const { user_id, title, body, type = 'info', action_url } = req.body;
  if (!title || !body) return fail(res, 'title and body required', 400);
  const [id] = await db('notifications').insert({ user_id: user_id || null, title, body, type, action_url: action_url || null, sent_at: new Date() });
  return ok(res, { id }, 'Notification sent', 201);
}));

router.get('/notifications', ah(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const [total, notifications] = await Promise.all([
    db('notifications').count('id as count').first(),
    db('notifications').orderBy('created_at', 'desc').limit(limit).offset(offset),
  ]);
  return ok(res, { notifications, pagination: { page, limit, total: Number(total.count) } });
}));

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────
router.get('/settings', ah(async (_req, res) => {
  const settings = await db('app_settings').select();
  const map = {};
  settings.forEach((s) => (map[s.key] = s.value));
  return ok(res, { settings: map });
}));

router.patch('/settings', ah(async (req, res) => {
  const updates = req.body; // { key: value, ... }
  for (const [key, value] of Object.entries(updates)) {
    await db('app_settings').where({ key }).update({ value: String(value) });
  }
  // Invalidate maintenance cache if needed
  if ('maintenance_mode' in updates) maintenanceGuard.invalidate();
  return ok(res, {}, 'Settings updated');
}));

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────
router.get('/newsletter', ah(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const [total, subscribers] = await Promise.all([
    db('newsletter_subscribers').count('id as count').first(),
    db('newsletter_subscribers').orderBy('subscribed_at', 'desc').limit(limit).offset(offset),
  ]);
  return ok(res, { subscribers, pagination: { page, limit, total: Number(total.count) } });
}));

router.post('/newsletter/blast', ah(async (req, res) => {
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
}));

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────
router.get('/plans', ah(async (_req, res) => {
  const plans = await db('subscription_plans').select();
  return ok(res, { plans });
}));

router.post('/plans', ah(async (req, res) => {
  const { name, name_hi, description, price, currency = 'INR', duration_days, features } = req.body;
  if (!name || !price || !duration_days) return fail(res, 'name, price, duration_days required', 400);
  const [id] = await db('subscription_plans').insert({ name, name_hi, description, price, currency, duration_days, features: JSON.stringify(features || []) });
  return ok(res, { id }, 'Plan created', 201);
}));

router.patch('/plans/:id', ah(async (req, res) => {
  const allowed = ['name', 'name_hi', 'description', 'price', 'currency', 'duration_days', 'features', 'is_active'];
  const update = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = k === 'features' ? JSON.stringify(req.body[k]) : req.body[k]; });
  await db('subscription_plans').where({ id: req.params.id }).update(update);
  return ok(res, {}, 'Plan updated');
}));

// ─── KUNDLI MANAGEMENT ───────────────────────────────────────────────────────
// List all kundli profiles across all users (paginated + searchable)
router.get('/kundlis', ah(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const search = (req.query.search || '').trim();
  const gender = req.query.gender || '';
  const offset = (page - 1) * limit;

  // NOTE: deliberately exclude kp.calculated_data from the sorted query —
  // those JSON blobs can be hundreds of KB each. Including them causes MySQL
  // "Out of sort memory" when ORDER BY is applied. We fetch them separately
  // by primary key (no sort) for just the current page of results.
  let q = db('kundli_profiles as kp')
    .join('users as u', 'kp.user_id', 'u.id')
    .select(
      'kp.id', 'kp.uuid', 'kp.name', 'kp.date_of_birth', 'kp.time_of_birth',
      'kp.place_of_birth', 'kp.gender', 'kp.user_id', 'kp.created_at',
      'u.name as owner_name', 'u.email as owner_email'
    );

  if (search) {
    q = q.where((b) =>
      b.where('kp.name', 'like', `%${search}%`)
       .orWhere('u.email',  'like', `%${search}%`)
       .orWhere('kp.place_of_birth', 'like', `%${search}%`)
    );
  }
  if (gender) q = q.where('kp.gender', gender);

  const [total, profiles] = await Promise.all([
    q.clone().clearSelect().count('kp.id as count').first(),
    q.clone().limit(limit).offset(offset).orderBy('kp.created_at', 'desc'),
  ]);

  // Fetch calculated_data separately for the current page by PK (fast, no sort)
  const pageIds = profiles.map((p) => p.id);
  const calcRows = pageIds.length
    ? await db('kundli_profiles').whereIn('id', pageIds).select('id', 'calculated_data')
    : [];
  const calcMap = Object.fromEntries(calcRows.map((r) => [r.id, r.calculated_data]));

  const profilesWithSummary = profiles.map((p) => ({
    ...p,
    chart_summary: buildKundliListSummary(parseJsonMaybe(calcMap[p.id] || null)),
  }));

  return ok(res, { profiles: profilesWithSummary, pagination: { page, limit, total: Number(total.count) } });
}));

// Full kundli detail — no ownership check (admin sees everything)
router.get('/kundlis/:uuid', ah(async (req, res) => {
  const profile = await buildFullKundliResponse(req.params.uuid);
  if (!profile) return fail(res, 'Kundli not found', 404);
  return ok(res, { profile });
}));

// Varshphal for a kundli (admin endpoint)
router.get('/kundlis/:uuid/varshphal', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  const chart = await ensureCalculatedChart(profile);
  if (!chart) return fail(res, 'Unable to calculate Kundli', 500);
  const targetYear = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
  const varshphal  = generateVarshphal(chart, profile, targetYear);
  if (!varshphal) return fail(res, 'Unable to generate Varshphal', 500);
  return ok(res, { varshphal });
}));

// Strength report for a kundli (admin endpoint)
router.get('/kundlis/:uuid/strength', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  const chart = await ensureCalculatedChart(profile);
  if (!chart) return fail(res, 'Unable to calculate Kundli', 500);
  const strength = computeKundliStrength(chart);
  if (!strength) return fail(res, 'Unable to compute strength', 500);
  return ok(res, { strength });
}));

// Force recalculate (admin override)
router.post('/kundlis/:uuid/recalculate', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  await db('kundli_profiles').where({ id: profile.id }).update({ calculated_data: null });
  const fresh = await db('kundli_profiles').where({ id: profile.id }).first();
  const chart = await calcAndSave(fresh);
  if (!chart) return fail(res, 'Recalculation failed', 500);
  return ok(res, {}, 'Kundli recalculated successfully');
}));

// ─── EMAIL LOGS ───────────────────────────────────────────────────────────────
router.get('/email-logs', ah(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * 20;
  const [total, logs] = await Promise.all([
    db('email_logs').count('id as count').first(),
    db('email_logs').orderBy('created_at', 'desc').limit(20).offset(offset),
  ]);
  return ok(res, { logs, pagination: { page, limit: 20, total: Number(total.count) } });
}));

module.exports = router;
