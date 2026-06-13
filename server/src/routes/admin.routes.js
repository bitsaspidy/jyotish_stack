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
  getOrCreateTodayPrediction, fetchPredictionHistory, buildKundliReportExtras,
} = require('../services/kundli-admin.service');
const { kundliReportPdf } = require('../services/report.service');
const { resetInstance: resetRazorpay } = require('../services/razorpay.service');

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
  settings.forEach((s) => {
    // Never expose the raw secret — return a sentinel so the UI knows it's set
    if (s.key === 'razorpay_key_secret') {
      map[s.key] = s.value ? '[SET]' : '';
    } else {
      map[s.key] = s.value;
    }
  });
  return ok(res, { settings: map });
}));

router.patch('/settings', ah(async (req, res) => {
  const updates = req.body; // { key: value, ... }
  let razorpayChanged = false;
  for (const [key, value] of Object.entries(updates)) {
    // Skip the placeholder sentinel — means the admin didn't touch the secret
    if (key === 'razorpay_key_secret' && value === '[SET]') continue;
    // Upsert: insert if not exists, update value if exists
    await db('app_settings')
      .insert({ key, value: String(value), description: '' })
      .onConflict('key')
      .merge({ value: String(value) });
    if (key === 'razorpay_key_id' || key === 'razorpay_key_secret') razorpayChanged = true;
  }
  if ('maintenance_mode' in updates) maintenanceGuard.invalidate();
  if (razorpayChanged) resetRazorpay();
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

// Create a kundli for any user (admin override — no ownership restriction)
router.post('/kundlis', ah(async (req, res) => {
  const { user_email, name, date_of_birth, time_of_birth, place_of_birth,
          latitude, longitude, timezone_offset, gender } = req.body;

  if (!user_email || !name || !date_of_birth || !time_of_birth || !place_of_birth
      || latitude == null || longitude == null || timezone_offset == null || !gender)
    return fail(res, 'user_email and all birth details are required', 400);

  const user = await db('users').where({ email: user_email.trim().toLowerCase() }).first();
  if (!user) return fail(res, `No user found with email "${user_email}"`, 404);

  const newUuid = uuidv4();
  const [id] = await db('kundli_profiles').insert({
    uuid: newUuid, user_id: user.id,
    name, date_of_birth, time_of_birth, place_of_birth,
    latitude, longitude, timezone_offset, gender,
  });

  const profile = await db('kundli_profiles').where({ id }).first();
  const chart   = await calcAndSave(profile);

  return ok(res, { uuid: newUuid, profile, chart_calculated: !!chart }, 'Kundli created for user', 201);
}));

// Jyotish Knowledge Base (Class 1 PDF — jyotish_basics: Vedas, Vedangas, Angas, Karma, Hora, Graha BPHS)
router.get('/jyotish-basics', ah(async (req, res) => {
  const rows = await db('jyotish_basics').orderBy([{ column: 'category' }, { column: 'sort_order' }]);
  const parsed = rows.map((r) => {
    let extra = r.extra_data;
    if (typeof extra === 'string') { try { extra = JSON.parse(extra); } catch { extra = null; } }
    return { ...r, extra_data: extra };
  });
  const grouped = {};
  parsed.forEach((r) => { (grouped[r.category] = grouped[r.category] || []).push(r); });
  return ok(res, { categories: grouped, total: parsed.length });
}));

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

// Today's personal prediction (persisted in predictions table)
router.get('/kundlis/:uuid/today', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  const chart = await ensureCalculatedChart(profile);
  if (!chart) return fail(res, 'Unable to calculate Kundli', 500);
  const prediction = await getOrCreateTodayPrediction(profile, chart);
  if (!prediction) return fail(res, 'Unable to generate prediction', 500);
  return ok(res, { prediction });
}));

// Stored prediction history for one kundli (what the user has been shown)
router.get('/kundlis/:uuid/predictions', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  const history = await fetchPredictionHistory(profile.id, Math.min(100, parseInt(req.query.limit) || 30));
  return ok(res, { history });
}));

// Designed PDF report (same as user-side report)
router.get('/kundlis/:uuid/report.pdf', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  const chart = await ensureCalculatedChart(profile);
  if (!chart) return fail(res, 'Unable to calculate Kundli', 500);
  const extras = await buildKundliReportExtras(chart, profile);
  const pdf = kundliReportPdf(profile, chart, extras);
  const safe = String(profile.name || 'kundli').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safe}-kundli-report.pdf"`);
  return res.send(pdf);
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

// ─── PANCHANG ────────────────────────────────────────────────────────────────
const { calculateDailyPanchang } = require('../services/helpers/panchang');

router.get('/panchang', ah(async (req, res) => {
  const { date, lat, lon, tz, place } = req.query;
  if (!date || lat === undefined || lon === undefined || tz === undefined)
    return fail(res, 'date, lat, lon, tz are required', 400);

  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return fail(res, 'date must be YYYY-MM-DD', 400);

  const panchang = calculateDailyPanchang({
    year, month, day,
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    tz:  parseFloat(tz),
  });

  return ok(res, { panchang, place: place || null });
}));

// ─── ACTIVITY LOG helper ─────────────────────────────────────────────────────
async function logActivity(req, action, entity, entityId, detail) {
  try {
    await db('activity_logs').insert({
      admin_id:   req.user?.id || null,
      admin_name: req.user?.name || 'Admin',
      action, entity,
      entity_id:  entityId ? String(entityId) : null,
      detail:     detail || null,
      ip_address: req.ip || req.headers['x-forwarded-for'] || null,
    });
  } catch (_) { /* non-fatal */ }
}

// ─── BLOG CATEGORIES ─────────────────────────────────────────────────────────
router.get('/blog/categories', ah(async (_req, res) => {
  const cats = await db('blog_categories').orderBy('name');
  return ok(res, cats);
}));

router.post('/blog/categories', ah(async (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) return fail(res, 'Category name required', 422);
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const [id] = await db('blog_categories').insert({ name: name.trim(), slug, color: color || '#D4AF37' });
  return ok(res, { id, name: name.trim(), slug, color: color || '#D4AF37' }, 201);
}));

router.delete('/blog/categories/:id', ah(async (req, res) => {
  await db('blog_categories').where({ id: req.params.id }).delete();
  return ok(res, null, 204);
}));

// ─── BLOG POSTS ──────────────────────────────────────────────────────────────
router.get('/blog', ah(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || 1));
  const limit = Math.min(50, parseInt(req.query.limit || 20));
  const offset = (page - 1) * limit;
  const status = req.query.status;
  const q      = req.query.q?.trim();

  let qb = db('blog_posts as bp')
    .leftJoin('blog_categories as bc', 'bp.category_id', 'bc.id')
    .select('bp.id','bp.title','bp.slug','bp.excerpt','bp.cover_image','bp.status',
            'bp.author','bp.view_count','bp.published_at','bp.created_at',
            'bc.name as category_name','bc.color as category_color');

  if (status) qb = qb.where('bp.status', status);
  if (q)      qb = qb.where('bp.title', 'like', `%${q}%`);

  const [{ total }] = await qb.clone().count('bp.id as total');
  const posts = await qb.orderBy('bp.created_at', 'desc').limit(limit).offset(offset);

  return ok(res, posts, 200, {
    pagination: { page, limit, total: Number(total), total_pages: Math.ceil(Number(total) / limit) },
  });
}));

router.post('/blog', ah(async (req, res) => {
  const { title, excerpt, content, cover_image, category_id, status, author, seo_title, seo_description, tags } = req.body;
  if (!title?.trim()) return fail(res, 'Title required', 422);
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  const [id] = await db('blog_posts').insert({
    title: title.trim(), slug, excerpt, content, cover_image, category_id: category_id || null,
    status: status || 'draft', author: author || req.user.name,
    seo_title, seo_description, tags,
    published_at: status === 'published' ? new Date() : null,
  });
  await logActivity(req, 'create', 'blog_post', id, `Created: ${title.trim()}`);
  return ok(res, { id, slug }, 201);
}));

router.get('/blog/:id', ah(async (req, res) => {
  const post = await db('blog_posts as bp')
    .leftJoin('blog_categories as bc', 'bp.category_id', 'bc.id')
    .where('bp.id', req.params.id)
    .select('bp.*', 'bc.name as category_name', 'bc.color as category_color')
    .first();
  if (!post) return fail(res, 'Post not found', 404);
  return ok(res, post);
}));

router.put('/blog/:id', ah(async (req, res) => {
  const { title, excerpt, content, cover_image, category_id, status, author, seo_title, seo_description, tags } = req.body;
  const existing = await db('blog_posts').where({ id: req.params.id }).first();
  if (!existing) return fail(res, 'Post not found', 404);
  await db('blog_posts').where({ id: req.params.id }).update({
    title, excerpt, content, cover_image,
    category_id: category_id || null, status, author, seo_title, seo_description, tags,
    published_at: status === 'published' && !existing.published_at ? new Date() : existing.published_at,
    updated_at: new Date(),
  });
  await logActivity(req, 'update', 'blog_post', req.params.id, `Updated: ${title}`);
  return ok(res, { id: req.params.id });
}));

router.delete('/blog/:id', ah(async (req, res) => {
  const post = await db('blog_posts').where({ id: req.params.id }).first();
  if (!post) return fail(res, 'Post not found', 404);
  await db('blog_posts').where({ id: req.params.id }).delete();
  await logActivity(req, 'delete', 'blog_post', req.params.id, `Deleted: ${post.title}`);
  return ok(res, null, 204);
}));

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
router.get('/testimonials', ah(async (_req, res) => {
  const rows = await db('testimonials').orderBy('sort_order').orderBy('created_at', 'desc');
  return ok(res, rows);
}));

router.post('/testimonials', ah(async (req, res) => {
  const { name, role, location, content, rating, avatar, is_featured } = req.body;
  if (!name?.trim() || !content?.trim()) return fail(res, 'Name and content required', 422);
  const maxOrder = await db('testimonials').max('sort_order as m').first();
  const [id] = await db('testimonials').insert({
    name: name.trim(), role, location, content: content.trim(),
    rating: parseInt(rating || 5), avatar, is_featured: !!is_featured,
    sort_order: (maxOrder?.m || 0) + 1,
  });
  await logActivity(req, 'create', 'testimonial', id, `Added testimonial from ${name.trim()}`);
  return ok(res, { id }, 201);
}));

router.put('/testimonials/:id', ah(async (req, res) => {
  const { name, role, location, content, rating, avatar, is_featured } = req.body;
  await db('testimonials').where({ id: req.params.id })
    .update({ name, role, location, content, rating: parseInt(rating || 5), avatar, is_featured: !!is_featured, updated_at: new Date() });
  await logActivity(req, 'update', 'testimonial', req.params.id, `Updated testimonial: ${name}`);
  return ok(res, { id: req.params.id });
}));

router.delete('/testimonials/:id', ah(async (req, res) => {
  await db('testimonials').where({ id: req.params.id }).delete();
  await logActivity(req, 'delete', 'testimonial', req.params.id, null);
  return ok(res, null, 204);
}));

// ─── INQUIRIES ────────────────────────────────────────────────────────────────
router.get('/inquiries', ah(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page  || 1));
  const limit  = Math.min(50, parseInt(req.query.limit || 20));
  const offset = (page - 1) * limit;
  const status = req.query.status;

  let qb = db('inquiries');
  if (status) qb = qb.where({ status });

  const [{ total }] = await qb.clone().count('id as total');
  const rows = await qb.orderBy('created_at', 'desc').limit(limit).offset(offset);

  return ok(res, rows, 200, {
    pagination: { page, limit, total: Number(total), total_pages: Math.ceil(Number(total) / limit) },
  });
}));

router.get('/inquiries/stats', ah(async (_req, res) => {
  const [total, newCount, read, replied] = await Promise.all([
    db('inquiries').count('id as c').first(),
    db('inquiries').where({ status:'new' }).count('id as c').first(),
    db('inquiries').where({ status:'read' }).count('id as c').first(),
    db('inquiries').where({ status:'replied' }).count('id as c').first(),
  ]);
  return ok(res, { total: Number(total.c), new: Number(newCount.c), read: Number(read.c), replied: Number(replied.c) });
}));

router.get('/inquiries/:id', ah(async (req, res) => {
  const row = await db('inquiries').where({ id: req.params.id }).first();
  if (!row) return fail(res, 'Not found', 404);
  // auto-mark as read
  if (row.status === 'new') await db('inquiries').where({ id: req.params.id }).update({ status: 'read', updated_at: new Date() });
  return ok(res, row);
}));

router.patch('/inquiries/:id', ah(async (req, res) => {
  const { status, admin_note } = req.body;
  const updates = { updated_at: new Date() };
  if (status)     updates.status     = status;
  if (admin_note !== undefined) updates.admin_note = admin_note;
  if (status === 'replied') updates.replied_at = new Date();
  await db('inquiries').where({ id: req.params.id }).update(updates);
  return ok(res, { id: req.params.id });
}));

router.delete('/inquiries/:id', ah(async (req, res) => {
  await db('inquiries').where({ id: req.params.id }).delete();
  return ok(res, null, 204);
}));

// ─── TEAM MEMBERS ─────────────────────────────────────────────────────────────
router.get('/team', ah(async (_req, res) => {
  const rows = await db('team_members').orderBy('sort_order').orderBy('name');
  return ok(res, rows);
}));

router.post('/team', ah(async (req, res) => {
  const { name, role, bio, avatar, linkedin, twitter, is_active } = req.body;
  if (!name?.trim() || !role?.trim()) return fail(res, 'Name and role required', 422);
  const maxOrder = await db('team_members').max('sort_order as m').first();
  const [id] = await db('team_members').insert({
    name: name.trim(), role: role.trim(), bio, avatar, linkedin, twitter,
    is_active: is_active !== false,
    sort_order: (maxOrder?.m || 0) + 1,
  });
  await logActivity(req, 'create', 'team_member', id, `Added team member: ${name.trim()}`);
  return ok(res, { id }, 201);
}));

router.put('/team/:id', ah(async (req, res) => {
  const { name, role, bio, avatar, linkedin, twitter, is_active } = req.body;
  await db('team_members').where({ id: req.params.id })
    .update({ name, role, bio, avatar, linkedin, twitter, is_active: !!is_active, updated_at: new Date() });
  await logActivity(req, 'update', 'team_member', req.params.id, `Updated: ${name}`);
  return ok(res, { id: req.params.id });
}));

router.delete('/team/:id', ah(async (req, res) => {
  await db('team_members').where({ id: req.params.id }).delete();
  await logActivity(req, 'delete', 'team_member', req.params.id, null);
  return ok(res, null, 204);
}));

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
router.get('/activity', ah(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page  || 1));
  const limit  = Math.min(100, parseInt(req.query.limit || 30));
  const offset = (page - 1) * limit;
  const entity = req.query.entity;

  let qb = db('activity_logs');
  if (entity) qb = qb.where({ entity });

  const [{ total }] = await qb.clone().count('id as total');
  const rows = await qb.orderBy('created_at', 'desc').limit(limit).offset(offset);
  return ok(res, rows, 200, {
    pagination: { page, limit, total: Number(total), total_pages: Math.ceil(Number(total) / limit) },
  });
}));

// ─── ADMIN PROFILE ────────────────────────────────────────────────────────────
router.get('/profile', ah(async (req, res) => {
  const admin = await db('users').where({ id: req.user.id })
    .select('id','name','email','phone','role','plan','created_at').first();
  if (!admin) return fail(res, 'Not found', 404);
  return ok(res, admin);
}));

router.put('/profile', ah(async (req, res) => {
  const { name, phone } = req.body;
  if (!name?.trim()) return fail(res, 'Name required', 422);
  await db('users').where({ id: req.user.id }).update({ name: name.trim(), phone: phone || null, updated_at: new Date() });
  await logActivity(req, 'update', 'profile', req.user.id, 'Updated own profile');
  return ok(res, { name: name.trim() });
}));

router.put('/profile/password', ah(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return fail(res, 'Both current and new password required', 422);
  if (new_password.length < 8) return fail(res, 'New password must be at least 8 characters', 422);
  const admin = await db('users').where({ id: req.user.id }).select('password').first();
  const match = await bcrypt.compare(current_password, admin.password);
  if (!match) return fail(res, 'Current password is incorrect', 401);
  const hash = await bcrypt.hash(new_password, 12);
  await db('users').where({ id: req.user.id }).update({ password: hash, updated_at: new Date() });
  await logActivity(req, 'update', 'profile', req.user.id, 'Changed password');
  return ok(res, { message: 'Password changed successfully' });
}));

module.exports = router;
