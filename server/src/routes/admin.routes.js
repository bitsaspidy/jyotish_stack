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
const { composeStrengthUserFriendly } = require('../services/report-engine/strength-humanizer');
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

  let q = db('users').select('id', 'uuid', 'name', 'email', 'phone', 'role', 'plan', 'is_active', 'email_verified', 'preferred_language', 'created_at');

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
    .select('id', 'uuid', 'name', 'email', 'phone', 'role', 'plan', 'is_active', 'email_verified', 'preferred_language', 'avatar_url', 'meta', 'created_at', 'updated_at').first();
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

router.patch('/users/:id/plan', ah(async (req, res) => {
  const { plan } = req.body;
  const allowed = ['free', 'basic', 'premium', 'yearly'];
  if (!allowed.includes(plan)) return fail(res, 'Invalid plan. Must be free, basic, premium, or yearly', 400);
  const user = await db('users').where({ id: req.params.id }).first();
  if (!user) return fail(res, 'User not found', 404);
  await db('users').where({ id: req.params.id }).update({ plan, updated_at: new Date() });
  await logActivity(req, 'update', 'user', req.params.id, `Plan changed to ${plan}`);
  return ok(res, { plan }, 'Plan updated');
}));

router.post('/users/:id/resend-verification', ah(async (req, res) => {
  const user = await db('users').where({ id: req.params.id }).first();
  if (!user) return fail(res, 'User not found', 404);
  if (user.email_verified) return fail(res, 'User email is already verified', 400);
  const { randomToken } = require('../utils/token');
  const { sendEmail } = require('../services/email.service');
  const token = randomToken();
  await db('users').where({ id: user.id }).update({ email_verification_token: token });
  const verifyUrl = `${process.env.APP_URL || 'https://jyotishstack.com'}/verify-email?token=${token}`;
  await sendEmail({ to: user.email, template: 'verify_email', data: { verifyUrl } });
  await logActivity(req, 'create', 'user', user.id, 'Admin resent verification email');
  return ok(res, {}, 'Verification email sent');
}));

// Correct a user's email address (e.g. dots stripped by old normalizeEmail).
// Lowercases but PRESERVES dots — does not re-normalize.
router.patch('/users/:id/email', ah(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 'A valid email is required', 400);

  const user = await db('users').where({ id: req.params.id }).first();
  if (!user) return fail(res, 'User not found', 404);

  const taken = await db('users').where({ email }).whereNot({ id: req.params.id }).first();
  if (taken) return fail(res, 'That email is already used by another account', 409);

  await db('users').where({ id: req.params.id }).update({ email });
  return ok(res, { email }, 'Email updated');
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
  const strength_friendly = composeStrengthUserFriendly(strength, null, chart, {});
  return ok(res, { strength, strength_friendly });
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

// Human-friendly life-guidance report — admin sees the full technical debug
// (houses, planets, dignities, dasha lords, rule IDs, hidden 1-5 scores).
router.get('/kundlis/:uuid/guidance', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  const chart = await ensureCalculatedChart(profile);
  if (!chart) return fail(res, 'Unable to calculate Kundli', 500);
  const { generateLifeReport, generateDailyGuidance } = require('../services/report-engine');
  const { generatePersonalizedRemedies } = require('../services/remedy-engine');
  const lang = req.query.lang;
  const report = generateLifeReport(chart, { admin: true, lang });
  const daily  = generateDailyGuidance(chart, new Date(), { admin: true, lang });
  const personalizedRemedies = generatePersonalizedRemedies(chart);
  return ok(res, { report, daily, personalizedRemedies });
}));

// Sun-based shadow planets (Upagrahas)
router.get('/kundlis/:uuid/upagrahas', ah(async (req, res) => {
  const profile = await db('kundli_profiles').where({ uuid: req.params.uuid }).first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  const chart = await ensureCalculatedChart(profile);
  if (!chart) return fail(res, 'Unable to calculate Kundli', 500);
  const { computeAndLookupUpagrahas } = require('../services/helpers/upagrahas');
  const result = await computeAndLookupUpagrahas(chart);
  return ok(res, result);
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
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = 20;
  const offset = (page - 1) * limit;
  const dept   = req.query.dept   || '';
  const status = req.query.status || '';

  let q = db('email_logs');
  if (dept)   q = q.where({ department: dept });
  if (status) q = q.where({ status });

  const [total, logs] = await Promise.all([
    q.clone().clearSelect().count('id as count').first(),
    q.clone().select('id','to_email','subject','template','status','department','from_address','error_message','created_at')
      .orderBy('created_at', 'desc').limit(limit).offset(offset),
  ]);
  return ok(res, { logs, pagination: { page, limit, total: Number(total.count) } });
}));

// Single log detail — includes html_body (excluded from the list query for perf,
// same large-column rationale as the kundli calculated_data sort-buffer fix)
router.get('/email-logs/:id', ah(async (req, res) => {
  const log = await db('email_logs').where({ id: Number(req.params.id) }).first();
  if (!log) return fail(res, 'Email log not found', 404);
  return ok(res, { log });
}));

// Send a failed/queued email again (re-sends the stored copy immediately)
router.post('/email-logs/:id/retry', ah(async (req, res) => {
  const { retryEmail } = require('../services/email.service');
  const result = await retryEmail(Number(req.params.id));
  return ok(res, result, 'Email re-sent successfully');
}));

// ─── EMAIL MANAGER (IMAP INBOX) ──────────────────────────────────────────────
// Unread count per department — piggybacks on the 60-second IMAP cache
router.get('/email-manager/unread-counts', ah(async (req, res) => {
  const { fetchMailbox } = require('../services/imap.service');
  const depts = ['sales', 'team', 'account'];
  const counts = { sales: 0, team: 0, account: 0, all: 0 };
  await Promise.allSettled(depts.map(async (dept) => {
    try {
      const msgs = await fetchMailbox(dept, 'INBOX', 50);
      counts[dept] = msgs.filter(m => m.seen === false).length;
    } catch (_) {}
  }));
  counts.all = counts.sales + counts.team + counts.account;
  return ok(res, { counts }, 'OK');
}));

router.get('/email-manager/inbox', ah(async (req, res) => {
  const { fetchMailbox } = require('../services/imap.service');
  const dept   = req.query.dept   || 'all';
  const folder = req.query.folder || 'INBOX';
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = 30;

  const depts = dept === 'all' ? ['sales', 'team', 'account'] : [dept];
  const results = await Promise.allSettled(depts.map(d => fetchMailbox(d, folder)));

  let emails = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      r.value.forEach(e => emails.push({ ...e, dept: depts[i] }));
    }
  });

  emails.sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = emails.length;
  const offset = (page - 1) * limit;
  return ok(res, { emails: emails.slice(offset, offset + limit), total, page, limit });
}));

router.get('/email-manager/inbox/:dept/:uid', ah(async (req, res) => {
  const { fetchEmail } = require('../services/imap.service');
  const { dept, uid } = req.params;
  const folder = req.query.folder || 'INBOX';
  const email = await fetchEmail(dept, uid, folder);
  if (!email) return fail(res, 'Email not found', 404);
  return ok(res, { email });
}));

// Starred messages across departments
router.get('/email-manager/starred', ah(async (req, res) => {
  const { fetchStarred } = require('../services/imap.service');
  const dept  = req.query.dept || 'all';
  const depts = dept === 'all' ? ['sales', 'team', 'account'] : [dept];
  const results = await Promise.allSettled(depts.map(d => fetchStarred(d)));
  let emails = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') r.value.forEach(e => emails.push({ ...e, dept: depts[i] }));
  });
  emails.sort((a, b) => new Date(b.date) - new Date(a.date));
  return ok(res, { emails, total: emails.length });
}));

// Mark read / unread
router.patch('/email-manager/inbox/:dept/:uid/seen', ah(async (req, res) => {
  const { markSeen } = require('../services/imap.service');
  const { dept, uid } = req.params;
  const seen = req.body.seen !== false; // default true
  await markSeen(dept, uid, seen, req.body.folder || 'INBOX');
  return ok(res, { seen }, seen ? 'Marked as read' : 'Marked as unread');
}));

// Star / un-star
router.patch('/email-manager/inbox/:dept/:uid/star', ah(async (req, res) => {
  const { toggleStar } = require('../services/imap.service');
  const { dept, uid } = req.params;
  const starred = req.body.starred !== false; // default true
  await toggleStar(dept, uid, starred, req.body.folder || 'INBOX');
  return ok(res, { starred });
}));

// Delete a message
router.delete('/email-manager/inbox/:dept/:uid', ah(async (req, res) => {
  const { deleteMessage } = require('../services/imap.service');
  const { dept, uid } = req.params;
  await deleteMessage(dept, uid, req.query.folder || 'INBOX');
  return ok(res, {}, 'Email deleted');
}));

// Download an attachment — serves raw bytes with correct Content-Type
router.get('/email-manager/attachment/:dept/:uid/:index', ah(async (req, res) => {
  const { fetchAttachmentData } = require('../services/imap.service');
  const { dept, uid, index } = req.params;
  const att = await fetchAttachmentData(dept, uid, Number(index), req.query.folder || 'INBOX');
  if (att.suspicious) {
    res.setHeader('X-Content-Warning', 'Potentially unsafe file type');
  }
  res.setHeader('Content-Type', att.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(att.filename)}"`);
  res.setHeader('Content-Length', att.size);
  res.send(att.content);
}));

// Compose & send from Email Manager
router.post('/email-manager/compose', ah(async (req, res) => {
  const { from_dept, to, subject, body, reply_to } = req.body;
  if (!from_dept || !to || !subject || !body)
    return fail(res, 'from_dept, to, subject, body are required', 400);

  const { sendEmail } = require('../services/email.service');
  try {
    await sendEmail({
      to,
      template:       'custom',
      data:           { subject, body },
      from:           from_dept,
      replyTo:        reply_to || undefined,
      throwOnFailure: true,
    });
  } catch (err) {
    return fail(res, `SMTP error: ${err.message}`, 502);
  }
  return ok(res, {}, 'Email sent successfully');
}));

// Test SMTP connection for a department
router.post('/email-manager/test-smtp', ah(async (req, res) => {
  const { dept = 'account' } = req.body;
  const { testSmtpConnection, sendEmail } = require('../services/email.service');
  try {
    const info = await testSmtpConnection(dept);
    return ok(res, info, `SMTP connection OK for ${dept}`);
  } catch (err) {
    return fail(res, `SMTP connection failed: ${err.message}`, 502);
  }
}));

// ─── EMAIL SIGNATURES ────────────────────────────────────────────────────────
router.get('/email-signatures', ah(async (req, res) => {
  const rows = await db('email_signatures').select('*');
  const result = {};
  ['sales', 'team', 'account'].forEach(d => {
    result[d] = rows.find(r => r.department === d)
      || { department: d, signature_html: '', include_logo: true, is_active: false };
  });
  return ok(res, { signatures: result });
}));

router.put('/email-signatures/:dept', ah(async (req, res) => {
  const { dept } = req.params;
  if (!['sales', 'team', 'account'].includes(dept))
    return fail(res, 'Invalid department', 400);

  const { signature_html, include_logo, is_active } = req.body;
  const { invalidateSignatureCache } = require('../services/email.service');

  const existing = await db('email_signatures').where({ department: dept }).first();
  const payload  = { signature_html, include_logo: !!include_logo, is_active: !!is_active, updated_at: db.fn.now() };

  if (existing) {
    await db('email_signatures').where({ department: dept }).update(payload);
  } else {
    await db('email_signatures').insert({ department: dept, ...payload });
  }

  invalidateSignatureCache(dept);
  return ok(res, {}, 'Signature updated');
}));

// ─── SALES / INVOICES ────────────────────────────────────────────────────────
const { getBusinessConfig, saveBusinessConfig, computeGst } = require('../services/invoice.service');
const { buildInvoicePdf } = require('../services/pdf/invoice');

// GET /admin/sales — paginated invoice list + revenue/GST summary
router.get('/sales', ah(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = 20;
  const offset = (page - 1) * limit;
  const { search = '', status = '', plan = '', from = '', to = '' } = req.query;

  let q = db('invoices');
  if (status) q = q.where({ status });
  if (plan)   q = q.where({ plan_name: plan });
  if (from)   q = q.where('created_at', '>=', new Date(from));
  if (to)     { const t = new Date(to); t.setHours(23, 59, 59, 999); q = q.where('created_at', '<=', t); }
  if (search) {
    q = q.where((b) => b
      .where('invoice_number', 'like', `%${search}%`)
      .orWhere('customer_name', 'like', `%${search}%`)
      .orWhere('customer_email', 'like', `%${search}%`)
      .orWhere('razorpay_payment_id', 'like', `%${search}%`));
  }

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [total, invoices, paidAgg, monthAgg, statusCounts] = await Promise.all([
    q.clone().clearSelect().count('id as count').first(),
    q.clone().select('id', 'uuid', 'invoice_number', 'plan_name', 'document_type',
      'customer_name', 'customer_email', 'taxable_value', 'cgst', 'sgst', 'igst',
      'total_tax', 'total_amount', 'is_interstate', 'currency', 'status',
      'razorpay_payment_id', 'issued_at', 'created_at')
      .orderBy('created_at', 'desc').limit(limit).offset(offset),
    db('invoices').where({ status: 'paid' })
      .sum({ revenue: 'total_amount' }).sum({ tax: 'total_tax' }).sum({ taxable: 'taxable_value' })
      .count({ count: 'id' }).first(),
    db('invoices').where({ status: 'paid' }).where('created_at', '>=', monthStart)
      .sum({ revenue: 'total_amount' }).count({ count: 'id' }).first(),
    db('invoices').select('status').count('id as count').groupBy('status'),
  ]);

  const summary = {
    revenue:  Number(paidAgg.revenue || 0),
    tax:      Number(paidAgg.tax || 0),
    taxable:  Number(paidAgg.taxable || 0),
    paid_count: Number(paidAgg.count || 0),
    month_revenue: Number(monthAgg.revenue || 0),
    month_count:   Number(monthAgg.count || 0),
    status_counts: statusCounts.reduce((m, r) => { m[r.status] = Number(r.count); return m; }, {}),
  };

  return ok(res, { invoices, summary, pagination: { page, limit, total: Number(total.count) } });
}));

// GET /admin/sales/:uuid/invoice.pdf — download an invoice
router.get('/sales/:uuid/invoice.pdf', ah(async (req, res) => {
  const invoice = await db('invoices').where({ uuid: req.params.uuid }).first();
  if (!invoice) return fail(res, 'Invoice not found', 404);
  const business = await getBusinessConfig();
  const pdf = buildInvoicePdf(invoice, business);
  const safe = String(invoice.invoice_number || 'invoice').replace(/[^\w.-]+/g, '-');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safe}.pdf"`);
  return res.send(pdf);
}));

// POST /admin/sales/:uuid/resend — re-email the invoice to the customer
router.post('/sales/:uuid/resend', ah(async (req, res) => {
  const invoice = await db('invoices').where({ uuid: req.params.uuid }).first();
  if (!invoice) return fail(res, 'Invoice not found', 404);
  if (!invoice.customer_email) return fail(res, 'Invoice has no customer email', 400);

  const business = await getBusinessConfig();
  const pdf = buildInvoicePdf(invoice, business);
  const money2 = (n) => Number(n || 0).toFixed(2);
  const isTax = invoice.document_type !== 'bill_of_supply' && Number(invoice.total_tax) > 0;

  await sendEmail({
    to: invoice.customer_email,
    template: 'payment_success',
    data: {
      name: invoice.customer_name || 'Customer',
      planName: invoice.plan_name || 'Subscription',
      expiresAt: '',
      dashboardUrl: `${process.env.APP_URL || 'https://jyotishstack.com'}/dashboard`,
      invoiceNumber: invoice.invoice_number,
      isTax, interstate: !!invoice.is_interstate, gstRate: Number(invoice.gst_rate),
      taxableValue: money2(invoice.taxable_value),
      cgst: money2(invoice.cgst), sgst: money2(invoice.sgst), igst: money2(invoice.igst),
      total: money2(invoice.total_amount),
    },
    attachments: [{ filename: `${String(invoice.invoice_number).replace(/[^\w.-]+/g, '-')}.pdf`, content: pdf, contentType: 'application/pdf' }],
  });
  return ok(res, {}, 'Invoice re-sent to customer');
}));

// POST /admin/sales/:uuid/resend-remedy — regenerate and re-email the remedy PDF
router.post('/sales/:uuid/resend-remedy', ah(async (req, res) => {
  const invoice = await db('invoices').where({ uuid: req.params.uuid }).first();
  if (!invoice) return fail(res, 'Invoice not found', 404);
  if (!invoice.customer_email) return fail(res, 'Invoice has no customer email', 400);

  // Load user (carries meta with birth data) + subscription (older fallback)
  const user = await db('users').where({ id: invoice.user_id }).first();
  const sub  = await db('user_subscriptions')
    .where({ user_id: invoice.user_id })
    .orderBy('created_at', 'desc')
    .first();

  let userMeta = user?.meta;
  if (typeof userMeta === 'string') { try { userMeta = JSON.parse(userMeta); } catch (_) { userMeta = null; } }

  let subMeta = sub?.remedy_meta;
  if (typeof subMeta === 'string') { try { subMeta = JSON.parse(subMeta); } catch (_) { subMeta = null; } }

  // users.meta is primary (set on every new purchase); remedy_meta is legacy fallback
  const birth = userMeta?.date_of_birth ? userMeta : subMeta;

  if (!birth?.date_of_birth) {
    return fail(res, 'Birth data not found for this customer. They may have purchased before birth data was stored — ask them to re-submit their details.', 422);
  }

  const { calculateVedicChart } = require('../services/vedic-calc.service');
  const { generatePersonalizedRemedies } = require('../services/remedy-engine');
  const { buildRemedyPackagePdf } = require('../services/pdf/remedy-package-pdf');

  const name            = user?.name || invoice.customer_name;
  const { date_of_birth, time_of_birth = '12:00:00', place_of_birth = 'India',
          latitude = '20.5937', longitude = '78.9629', timezone_offset = '5.5', lang = 'en' } = birth;

  const [yr, mo, dy] = String(date_of_birth).split('-').map(Number);
  const [hr, mn, sc] = String(time_of_birth).split(':').map(Number);
  const chart = calculateVedicChart({
    year: yr, month: mo, day: dy,
    hour: hr || 0, minute: mn || 0, second: sc || 0,
    latitude:        parseFloat(latitude)        || 20.59,
    longitude:       parseFloat(longitude)       || 78.96,
    timezone_offset: parseFloat(timezone_offset) || 5.5,
  });

  const remedies  = await generatePersonalizedRemedies(chart, { lang });
  const pdfBuffer = await buildRemedyPackagePdf({ name, date_of_birth, time_of_birth, place_of_birth, chart, remedies, lang });
  const pdfName   = `remedy-report-${String(name).toLowerCase().replace(/\s+/g, '-')}.pdf`;

  await sendEmail({
    to:       invoice.customer_email,
    template: 'remedy_report',
    data:     { name, lang },
    attachments: [{ filename: pdfName, content: pdfBuffer, contentType: 'application/pdf' }],
  });

  return ok(res, {}, `Remedy PDF re-sent to ${invoice.customer_email}`);
}));

// POST /admin/sales/:uuid/send-resubmit-link — email customer a link to re-submit birth details
router.post('/sales/:uuid/send-resubmit-link', ah(async (req, res) => {
  const invoice = await db('invoices').where({ uuid: req.params.uuid }).first();
  if (!invoice) return fail(res, 'Invoice not found', 404);
  if (!invoice.customer_email) return fail(res, 'Invoice has no customer email', 400);

  const user = await db('users').where({ id: invoice.user_id }).first();
  if (!user) return fail(res, 'Customer account not found', 404);

  const { randomToken } = require('../utils/token');
  const token   = randomToken();
  const expires = new Date(Date.now() + 72 * 3600_000);

  await db('users').where({ id: user.id }).update({
    resubmit_token:         token,
    resubmit_token_expires: expires,
  });

  const base        = process.env.APP_URL || 'https://jyotishstack.com';
  const resubmitUrl = `${base}/remedy-resubmit?token=${token}`;

  await sendEmail({
    to:       invoice.customer_email,
    template: 'remedy_resubmit',
    data:     { name: user.name, resubmitUrl },
  });

  return ok(res, {}, `Resubmit link sent to ${invoice.customer_email}`);
}));

// PATCH /admin/sales/:uuid — edit invoice tax type, customer state, GSTIN
router.patch('/sales/:uuid', ah(async (req, res) => {
  const invoice = await db('invoices').where({ uuid: req.params.uuid }).first();
  if (!invoice) return fail(res, 'Invoice not found', 404);

  const { tax_mode, customer_state, customer_gstin } = req.body;
  // tax_mode: 'igst' | 'cgst_sgst' | 'no_tax'

  const cfg       = await getBusinessConfig();
  const total     = Number(invoice.total_amount); // preserve what customer paid
  const gstRate   = Number(cfg.gst_rate) || 18;
  const inclusive = cfg.gst_inclusive !== false && String(cfg.gst_inclusive) !== 'false';

  let patch = {
    customer_state:  customer_state  !== undefined ? (customer_state  || null) : invoice.customer_state,
    customer_gstin:  customer_gstin  !== undefined ? (customer_gstin  || null) : invoice.customer_gstin,
    place_of_supply: customer_state  || invoice.place_of_supply,
  };

  if (tax_mode === 'no_tax') {
    // International / exempt — zero tax, bill of supply
    Object.assign(patch, {
      is_interstate:  false,
      document_type:  'bill_of_supply',
      gst_rate:       0,
      taxable_value:  total,
      cgst: 0, sgst: 0, igst: 0,
      total_tax:      0,
      total_amount:   total,
    });
  } else if (tax_mode === 'igst' || tax_mode === 'cgst_sgst') {
    const interstate = tax_mode === 'igst';
    const calc = computeGst({ total, rate: gstRate, inclusive, interstate });
    Object.assign(patch, {
      is_interstate:  interstate,
      document_type:  'tax_invoice',
      gst_rate:       gstRate,
      taxable_value:  calc.taxable_value,
      cgst:           calc.cgst,
      sgst:           calc.sgst,
      igst:           calc.igst,
      total_tax:      calc.total_tax,
      total_amount:   calc.total_amount,
    });
  }

  await db('invoices').where({ uuid: req.params.uuid }).update(patch);
  const updated = await db('invoices').where({ uuid: req.params.uuid }).first();
  return ok(res, { invoice: updated }, 'Invoice updated');
}));

// GET /admin/sales/business-config — current business/GST settings
router.get('/sales/business-config', ah(async (_req, res) => {
  const config = await getBusinessConfig();
  return ok(res, { config });
}));

// PUT /admin/sales/business-config — update business/GST settings
router.put('/sales/business-config', ah(async (req, res) => {
  const config = await saveBusinessConfig(req.body || {});
  return ok(res, { config }, 'Business settings saved');
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

  // Base query holds only joins + filters — NO .select(), so the cloned count query
  // stays a pure aggregate (mixing selected columns with count() breaks only_full_group_by).
  let qb = db('blog_posts as bp')
    .leftJoin('blog_categories as bc', 'bp.category_id', 'bc.id');

  if (status) qb = qb.where('bp.status', status);
  if (q)      qb = qb.where('bp.title', 'like', `%${q}%`);

  const [{ total }] = await qb.clone().count('bp.id as total');
  const posts = await qb
    .select('bp.id','bp.title','bp.slug','bp.excerpt','bp.cover_image','bp.status',
            'bp.author','bp.view_count','bp.published_at','bp.created_at',
            'bc.name as category_name','bc.color as category_color')
    .orderBy('bp.created_at', 'desc').limit(limit).offset(offset);

  return ok(res, {
    data: posts,
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
  return ok(res, { data: post });
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
  return ok(res, { data: rows });
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

  return ok(res, {
    data: rows,
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
  return ok(res, { data: { total: Number(total.c), new: Number(newCount.c), read: Number(read.c), replied: Number(replied.c) } });
}));

router.get('/inquiries/:id', ah(async (req, res) => {
  const row = await db('inquiries').where({ id: req.params.id }).first();
  if (!row) return fail(res, 'Not found', 404);
  // auto-mark as read
  if (row.status === 'new') await db('inquiries').where({ id: req.params.id }).update({ status: 'read', updated_at: new Date() });
  return ok(res, { data: row });
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
  return ok(res, { data: rows });
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
  return ok(res, {
    data: rows,
    pagination: { page, limit, total: Number(total), total_pages: Math.ceil(Number(total) / limit) },
  });
}));

// ─── ADMIN PROFILE ────────────────────────────────────────────────────────────
router.get('/profile', ah(async (req, res) => {
  const admin = await db('users').where({ id: req.user.id })
    .select('id','name','email','phone','role','plan','created_at').first();
  if (!admin) return fail(res, 'Not found', 404);
  return ok(res, { data: admin });
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

// ─── Jobs ─────────────────────────────────────────────────────────────────────
router.post('/jobs/daily-digest', ah(async (req, res) => {
  const { sendDailyDigestToAll, sendDailyDigestToUser } = require('../services/daily-email.service');
  const { user_id } = req.body;
  if (user_id) {
    const result = await sendDailyDigestToUser(user_id);
    return ok(res, result, 'Daily digest sent to user');
  }
  // Run in background — respond immediately so the HTTP request doesn't time out
  sendDailyDigestToAll()
    .then((summary) => console.log('[Admin] Manual daily digest done:', summary))
    .catch((err) => console.error('[Admin] Manual daily digest error:', err.message));
  return ok(res, { message: 'Daily digest job started in background' });
}));

module.exports = router;
