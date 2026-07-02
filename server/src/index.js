require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const db = require('./config/db');
const maintenanceGuard = require('./middleware/maintenance');
const { ok, fail } = require('./utils/response');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const kundliRoutes = require('./routes/kundli.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const newsletterRoutes = require('./routes/newsletter.routes');
const settingsRoutes = require('./routes/settings.routes');
const horoscopeRoutes  = require('./routes/horoscope.routes');
const panchangRoutes   = require('./routes/panchang.routes');
const publicRoutes     = require('./routes/public.routes');
const { initDailyDigestJob } = require('./jobs/daily-digest');
const { initDailyPushJob }   = require('./jobs/daily-push');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many auth requests, please try again later.' } });
app.use(globalLimiter);

// ─── Maintenance guard (applies to all non-auth/admin routes) ─────────────────
app.use(maintenanceGuard);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    return res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    return res.status(503).json({ success: false, status: 'db_error', error: e.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kundli', kundliRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/horoscope', horoscopeRoutes);
app.use('/api/panchang', panchangRoutes);
app.use('/api/public',   publicRoutes);
app.use('/api/remedy',   require('./routes/remedy-package.routes'));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => fail(res, 'Route not found', 404));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  if (err.message?.startsWith('CORS')) return fail(res, err.message, 403);
  return fail(res, 'Internal server error', 500);
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  try {
    await db.raw('SELECT 1');
    console.log(`\n🪐  Jyotish Stack API running on http://localhost:${PORT}`);
    console.log(`    ENV  : ${process.env.NODE_ENV}`);
    console.log(`    DB   : ${process.env.DB_NAME}@${process.env.DB_HOST}\n`);
    initDailyDigestJob();
    initDailyPushJob();
  } catch (e) {
    console.error('❌  DB connection failed:', e.message);
    process.exit(1);
  }
});

module.exports = app;
