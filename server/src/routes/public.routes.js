'use strict';
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const { ok, fail } = require('../utils/response');
const { sendEmail, departmentInbox, DEPARTMENTS, DEPT_LABELS } = require('../services/email.service');
const { randomToken } = require('../utils/token');
const { getSeoSettings, gscFileBody } = require('../services/seo-settings.service');

// The application — not the column — decides what is accepted. inquiries.department
// is VARCHAR since migration 052, so adding to this list needs no schema change.
const VALID_DEPARTMENTS = ['sales', 'team', 'account', 'legal', 'general'];

// ─── Blog ─────────────────────────────────────────────────────────────────────

// GET /api/public/blog — published posts, paginated
router.get('/blog', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(24, parseInt(req.query.limit) || 9);
    const offset = (page - 1) * limit;
    const { category, search } = req.query;

    let q = db('blog_posts as p')
      .leftJoin('blog_categories as c', 'p.category_id', 'c.id')
      .where('p.status', 'published');

    if (category) q = q.where('c.slug', category);
    if (search)   q = q.where(function() {
      this.whereILike('p.title', `%${search}%`).orWhereILike('p.excerpt', `%${search}%`);
    });

    const [{ count }, posts] = await Promise.all([
      q.clone().count('p.id as count').first(),
      q.clone()
        .select(
          'p.id', 'p.title', 'p.slug', 'p.excerpt', 'p.cover_image',
          'p.author', 'p.tags', 'p.view_count', 'p.published_at',
          'c.name as category_name', 'c.slug as category_slug', 'c.color as category_color'
        )
        .orderBy('p.published_at', 'desc')
        .limit(limit).offset(offset),
    ]);

    const total = Number(count);
    return ok(res, { posts, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (e) {
    console.error('[public/blog]', e.message);
    return fail(res, 'Failed to load blog', 500);
  }
});

// GET /api/public/blog/categories
router.get('/blog-categories', async (_req, res) => {
  try {
    const cats = await db('blog_categories').select('id', 'name', 'slug', 'color').orderBy('name');
    return ok(res, { categories: cats });
  } catch (e) {
    return fail(res, 'Failed to load categories', 500);
  }
});

// GET /api/public/blog/:slug — single post (also bumps view_count)
router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await db('blog_posts as p')
      .leftJoin('blog_categories as c', 'p.category_id', 'c.id')
      .where({ 'p.slug': req.params.slug, 'p.status': 'published' })
      .select('p.*', 'c.name as category_name', 'c.slug as category_slug', 'c.color as category_color')
      .first();
    if (!post) return fail(res, 'Post not found', 404);

    db('blog_posts').where({ id: post.id }).increment('view_count', 1).catch(() => {});
    return ok(res, { post });
  } catch (e) {
    return fail(res, 'Failed to load post', 500);
  }
});

// ─── Testimonials ─────────────────────────────────────────────────────────────

router.get('/testimonials', async (_req, res) => {
  try {
    const testimonials = await db('testimonials')
      .where({ is_featured: true })
      .orderBy([{ column: 'sort_order', order: 'asc' }, { column: 'created_at', order: 'desc' }])
      .select('id', 'name', 'role', 'location', 'content', 'rating', 'avatar');
    return ok(res, { testimonials });
  } catch (e) {
    return fail(res, 'Failed to load testimonials', 500);
  }
});

// ─── Team ─────────────────────────────────────────────────────────────────────

router.get('/team', async (_req, res) => {
  try {
    const team = await db('team_members')
      .where({ is_active: true })
      .orderBy([{ column: 'sort_order', order: 'asc' }, { column: 'created_at', order: 'asc' }])
      .select('id', 'name', 'role', 'bio', 'avatar', 'linkedin', 'twitter');
    return ok(res, { team });
  } catch (e) {
    return fail(res, 'Failed to load team', 500);
  }
});

// ─── Contact form ─────────────────────────────────────────────────────────────

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { success: false, message: 'Too many messages. Please try again in an hour.' },
  standardHeaders: true, legacyHeaders: false,
});

router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return fail(res, 'Name, email and message are required', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, 'Please enter a valid email address', 400);
    }
    if (message.trim().length < 10) {
      return fail(res, 'Message must be at least 10 characters', 400);
    }

    const department = VALID_DEPARTMENTS.includes(req.body.department) ? req.body.department : 'general';
    // req.ip is proxy-aware (app trusts one hop) and NOT spoofable. Reading the
    // raw X-Forwarded-For and taking [0] took the left-most entry, which is
    // entirely client-supplied — a forged header logged an attacker's chosen IP.
    const ip = req.ip || null;

    const cleaned = {
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   phone?.trim()   || null,
      subject: subject?.trim() || 'General Inquiry',
      message: message.trim(),
    };

    await db('inquiries').insert({
      ...cleaned,
      department,
      status:  'new',
      source:  'website',
      ip_address: ip || null,
    });

    // Route email to the right mailbox (sales@ / team@ / account@). Non-fatal — the
    // inquiry is already stored, so a mail failure must not fail the request.
    const inbox = departmentInbox(department);                  // 'sales' | 'team' | 'account'
    const label = DEPT_LABELS[department] || 'Support';
    const inboxAddress = DEPARTMENTS[inbox]?.address;

    if (inboxAddress) {
      // 1) Notify the internal department inbox, with Reply-To set to the customer
      sendEmail({
        to: inboxAddress, template: 'contact_notify', from: inbox,
        replyTo: cleaned.email,
        data: { ...cleaned, departmentLabel: label },
      }).catch(() => {});
      // 2) Acknowledge the customer, sent from that department mailbox
      sendEmail({
        to: cleaned.email, template: 'contact_ack', from: inbox,
        data: { name: cleaned.name, message: cleaned.message, departmentLabel: label },
      }).catch(() => {});
    }

    return ok(res, {}, 'Message sent! We\'ll get back to you soon.');
  } catch (e) {
    console.error('[public/contact]', e.message);
    return fail(res, 'Failed to send message. Please try again.', 500);
  }
});

// ─── Free Kundli (lead-magnet, no auth, nothing persisted) ───────────────────
//
// Returns a deliberately whitelisted payload: basic details, D1 chart and
// current dasha are free; dosha names/details are NEVER sent — only counts,
// severities and life-area hints, so the teaser cannot be bypassed from the
// browser network tab. Full analysis requires an account / remedy purchase.

const freeKundliLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many kundli requests. Please try again in an hour.' },
  standardHeaders: true, legacyHeaders: false,
});

// Maps detected dosha names to vague life-area hints (suspense without disclosure)
const DOSHA_AREA_HINTS = [
  [/manglik|mangal dosha/i,   { en: 'Marriage & Relationships', hi: 'विवाह और रिश्ते' }],
  [/kaal ?sarp/i,             { en: 'Career Growth & Delays',   hi: 'करियर और विलंब' }],
  [/pitru|pitra/i,            { en: 'Family & Ancestral Karma', hi: 'परिवार और पितृ कर्म' }],
  [/vish dosha/i,             { en: 'Health & Mental Peace',    hi: 'स्वास्थ्य और मानसिक शांति' }],
  [/angarak/i,                { en: 'Temper & Sudden Events',   hi: 'क्रोध और आकस्मिक घटनाएँ' }],
  [/shaapit/i,                { en: 'Obstacles & Delays',       hi: 'बाधाएँ और विलंब' }],
  [/chandaal/i,               { en: 'Wisdom & Reputation',      hi: 'बुद्धि और प्रतिष्ठा' }],
  [/grahan/i,                 { en: 'Mind & Emotions',          hi: 'मन और भावनाएँ' }],
  [/kemdrum/i,                { en: 'Wealth & Support',         hi: 'धन और सहयोग' }],
  [/kartari/i,                { en: 'Core Life Pillars',        hi: 'जीवन के मुख्य स्तंभ' }],
  [/amavasya/i,               { en: 'Vitality & Confidence',    hi: 'ऊर्जा और आत्मविश्वास' }],
];

// Validates public birth-detail input. Returns { error } or { params } for calculateVedicChart.
function parseBirthInput(body, { requireName = true } = {}) {
  const { name, date_of_birth, time_of_birth, latitude, longitude, timezone_offset } = body || {};
  if (requireName && !name?.trim()) return { error: 'Name is required' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date_of_birth || '')))
    return { error: 'Valid date of birth (YYYY-MM-DD) is required' };
  if (!/^\d{2}:\d{2}/.test(String(time_of_birth || '')))
    return { error: 'Valid time of birth (HH:MM) is required' };
  const lat = parseFloat(latitude), lon = parseFloat(longitude);
  const tz  = parseFloat(timezone_offset);
  if (!Number.isFinite(lat) || lat < -90  || lat > 90)  return { error: 'Valid latitude is required' };
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return { error: 'Valid longitude is required' };
  if (!Number.isFinite(tz)  || tz  < -12  || tz  > 14)  return { error: 'Valid timezone offset is required' };
  const [yr, mo, dy] = String(date_of_birth).split('-').map(Number);
  const [hr, mn]     = String(time_of_birth).split(':').map(Number);
  if (yr < 1900 || yr > new Date().getFullYear()) return { error: 'Year of birth out of range' };
  return {
    params: {
      year: yr, month: mo, day: dy, hour: hr || 0, minute: mn || 0, second: 0,
      timezone: tz, latitude: lat, longitude: lon,
    },
  };
}

router.post('/free-kundli', freeKundliLimiter, async (req, res) => {
  try {
    const { name, gender, date_of_birth, time_of_birth, place_of_birth } = req.body || {};

    const parsed = parseBirthInput(req.body);
    if (parsed.error) return fail(res, parsed.error, 400);

    const { calculateVedicChart } = require('../services/vedic-calc.service');
    const chart = calculateVedicChart(parsed.params);

    // ── Whitelisted free payload ──
    const asc  = chart.ascendant || {};
    const moon = chart.planets?.Moon || {};
    const sun  = chart.planets?.Sun || {};

    const planets = {};
    for (const [pName, pd] of Object.entries(chart.planets || {})) {
      planets[pName] = {
        rashi_num: pd.rashi_num, rashi_en: pd.rashi_en, rashi_hi: pd.rashi_hi,
        degree_in_sign_dms: pd.degree_in_sign_dms,
        house: ((pd.rashi_num - asc.rashi_num + 12) % 12) + 1,
        nakshatra_en: pd.nakshatra_en, nakshatra_hi: pd.nakshatra_hi,
        is_retrograde: !!pd.is_retrograde, is_combust: !!pd.is_combust,
      };
    }
    const houses = {};
    for (const [hNum, hd] of Object.entries(chart.houses || {})) {
      houses[hNum] = { rashi_num: hd.rashi_num, planets: hd.planets || [] };
    }

    const currentMaha  = Array.isArray(chart.dasha)
      ? (chart.dasha.find((d) => d.is_current) || null) : null;
    const currentAntar = Array.isArray(currentMaha?.antardasha)
      ? (currentMaha.antardasha.find((a) => a.is_current) || null) : null;

    // ── Yogas: 2 free highlights, rest counted but locked ──
    const allYogas = chart.yogas_doshas?.yogas || [];
    const yogaHighlights = allYogas.slice(0, 2).map((y) => ({ name: y.name, name_hi: y.name_hi }));

    // ── Doshas: counts + hints ONLY. Names and details never leave the server. ──
    const doshaList = [...(chart.yogas_doshas?.doshas || [])];
    if (chart.mangal_dosha?.has_dosha && !doshaList.some((d) => /mangal|manglik/i.test(d.name))) {
      doshaList.push({ name: 'Manglik Dosha', severity: chart.mangal_dosha.severity || 'moderate' });
    }
    const areaHints = [];
    for (const d of doshaList) {
      const hit = DOSHA_AREA_HINTS.find(([re]) => re.test(d.name || ''));
      if (hit && !areaHints.some((a) => a.en === hit[1].en)) areaHints.push(hit[1]);
    }

    return ok(res, {
      name: name.trim(),
      gender: gender || null,
      birth: {
        date: date_of_birth, time: time_of_birth,
        place: (place_of_birth || '').trim() || null,
      },
      basic: {
        lagna: {
          rashi_num: asc.rashi_num, rashi_en: asc.rashi_en, rashi_hi: asc.rashi_hi,
          degree_in_sign_dms: asc.degree_in_sign_dms, rashi_lord: asc.rashi_lord,
        },
        moon_sign: { rashi_en: moon.rashi_en, rashi_hi: moon.rashi_hi, rashi_num: moon.rashi_num },
        sun_sign:  { rashi_en: sun.rashi_en,  rashi_hi: sun.rashi_hi,  rashi_num: sun.rashi_num },
        nakshatra: {
          en: chart.nakshatra?.en, hi: chart.nakshatra?.hi,
          lord: chart.nakshatra?.lord, pada: chart.nakshatra?.pada,
        },
        panchang: {
          tithi_en:  chart.panchang?.tithi?.display_en || null,
          tithi_hi:  chart.panchang?.tithi?.display_hi || null,
          vara_en:   chart.panchang?.vara?.day_en || null,
          vara_hi:   chart.panchang?.vara?.day_hi || null,
          yoga:      chart.panchang?.yoga?.name || null,
          karana:    chart.panchang?.karana?.name || null,
        },
      },
      chart: { ascendant: { rashi_num: asc.rashi_num, rashi_en: asc.rashi_en, rashi_hi: asc.rashi_hi }, planets, houses },
      dasha: {
        current_mahadasha:  currentMaha  ? { lord: currentMaha.lord,  end: currentMaha.end }  : null,
        current_antardasha: currentAntar ? { lord: currentAntar.lord, end: currentAntar.end } : null,
      },
      yogas: {
        total: allYogas.length,
        highlights: yogaHighlights,
        locked: Math.max(0, allYogas.length - yogaHighlights.length),
      },
      doshas: {
        detected: doshaList.length,
        strong:   doshaList.filter((d) => d.severity === 'strong').length,
        moderate: doshaList.filter((d) => d.severity === 'moderate').length,
        mild:     doshaList.filter((d) => d.severity === 'mild').length,
        area_hints: areaHints.slice(0, 4),
      },
      locked_features: [
        'dosha_details', 'remedies', 'judgement', 'life_report', 'strength',
        'varshphal', 'upagrahas', 'drishti', 'varga', 'ai_reading', 'pdf_report',
      ],
    });
  } catch (e) {
    console.error('[public/free-kundli]', e.message);
    return fail(res, 'Unable to calculate kundli. Please check the birth details.', 500);
  }
});

// POST /api/public/free-kundli/email — subscribe to newsletter + email the
// kundli summary (lead capture from the free funnel). Nothing else persisted.
router.post('/free-kundli/email', freeKundliLimiter, async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name?.trim()) return fail(res, 'Name is required', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) return fail(res, 'A valid email is required', 400);

    const parsed = parseBirthInput(req.body);
    if (parsed.error) return fail(res, parsed.error, 400);

    const { calculateVedicChart } = require('../services/vedic-calc.service');
    const chart = calculateVedicChart(parsed.params);
    const asc = chart.ascendant || {}, moon = chart.planets?.Moon || {}, sun = chart.planets?.Sun || {};

    // dosha count (mirror the teaser logic)
    const doshaList = [...(chart.yogas_doshas?.doshas || [])];
    if (chart.mangal_dosha?.has_dosha && !doshaList.some((d) => /mangal|manglik/i.test(d.name))) doshaList.push({ name: 'Manglik' });
    const currentMaha = Array.isArray(chart.dasha) ? (chart.dasha.find((d) => d.is_current) || null) : null;

    // upsert newsletter subscriber
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName  = name.trim();
    const lang = req.body.lang === 'hi' ? 'hi' : 'en';
    let unsubscribeToken;
    const existing = await db('newsletter_subscribers').where({ email: cleanEmail }).first();
    if (existing) {
      unsubscribeToken = existing.unsubscribe_token;
      if (!existing.is_active) {
        await db('newsletter_subscribers').where({ email: cleanEmail })
          .update({ is_active: true, unsubscribed_at: null, name: existing.name || cleanName });
      }
    } else {
      unsubscribeToken = randomToken(16);
      await db('newsletter_subscribers').insert({
        email: cleanEmail, name: cleanName, preferred_language: lang,
        is_active: true, unsubscribe_token: unsubscribeToken,
      });
    }

    // send summary email (non-fatal)
    const base = process.env.APP_URL || 'https://jyotishstack.com';
    sendEmail({
      to: cleanEmail, template: 'free_kundli', from: 'sales',
      data: {
        name: cleanName, lang,
        lagna: asc.rashi_en, moonSign: moon.rashi_en, sunSign: sun.rashi_en,
        nakshatra: chart.nakshatra?.en ? `${chart.nakshatra.en} (Pada ${chart.nakshatra.pada || '—'})` : null,
        dasha: currentMaha ? `${currentMaha.lord} (until ${String(currentMaha.end).slice(0, 10)})` : null,
        doshaCount: doshaList.length,
        registerUrl: `${base}/register?ref=free-kundli`,
        unsubscribeUrl: `${base}/newsletter/unsubscribe?token=${unsubscribeToken}`,
      },
    }).catch((e) => console.error('[free-kundli/email] send failed:', e.message));

    return ok(res, {}, lang === 'hi' ? 'आपकी कुंडली सारांश आपके ईमेल पर भेज दी गई है!' : 'Your kundli summary has been emailed to you!');
  } catch (e) {
    console.error('[public/free-kundli/email]', e.message);
    return fail(res, 'Unable to send your kundli. Please try again.', 500);
  }
});

// ─── Free calculators (SEO lead magnets — gated results, nothing persisted) ──
//
// Each calculator answers its ONE headline question for free; depth
// (severity, cancellations, timelines, breakdowns, remedies) stays locked.

router.post('/calculator/:type', freeKundliLimiter, async (req, res) => {
  const type = req.params.type;
  try {
    const { calculateVedicChart } = require('../services/vedic-calc.service');

    // ── Kundli Milan takes two birth inputs ──
    if (type === 'kundli-milan') {
      const boyIn  = parseBirthInput(req.body?.boy  || {});
      const girlIn = parseBirthInput(req.body?.girl || {});
      if (boyIn.error)  return fail(res, `Boy: ${boyIn.error}`, 400);
      if (girlIn.error) return fail(res, `Girl: ${girlIn.error}`, 400);

      const { calculateAshtakoot } = require('../services/helpers/ashtakoot');
      const boyChart  = calculateVedicChart(boyIn.params);
      const girlChart = calculateVedicChart(girlIn.params);
      const milan = calculateAshtakoot(boyChart, girlChart);

      // FREE: score + verdict. LOCKED: koota breakdown, rajju/vedha, mangal comparison.
      return ok(res, {
        boy_name:  (req.body?.boy?.name  || '').trim() || null,
        girl_name: (req.body?.girl?.name || '').trim() || null,
        total: milan.total, max: milan.max, percentage: milan.percentage,
        verdict: milan.verdict, verdict_en: milan.verdict_en, verdict_hi: milan.verdict_hi,
        koota_count: Array.isArray(milan.kootas) ? milan.kootas.length : 8,
        issues_detected: (milan.active_dosha_count || 0) + (milan.mangal_compatible ? 0 : 1),
        locked: ['koota_breakdown', 'rajju_vedha', 'mangal_comparison', 'dosha_details', 'remedies', 'full_summary'],
      });
    }

    // ── Single-chart calculators ──
    const parsed = parseBirthInput(req.body, { requireName: false });
    if (parsed.error) return fail(res, parsed.error, 400);
    const chart = calculateVedicChart(parsed.params);

    if (type === 'mangal-dosha') {
      const md = chart.mangal_dosha || {};
      // FREE: yes/no + type. LOCKED: severity, triggers, cancellations, remedies.
      return ok(res, {
        has_dosha:       !!md.has_dosha,
        manglik_type:    md.manglik_type    || null,
        manglik_type_hi: md.manglik_type_hi || null,
        cancellations_found: Array.isArray(md.cancellations) ? md.cancellations.length : 0,
        locked: ['severity', 'house_triggers', 'cancellation_details', 'remedies', 'marriage_guidance'],
      });
    }

    if (type === 'sade-sati') {
      const { computeSadeSatiJourney } = require('../services/helpers/cosmic-insights');
      const ss = computeSadeSatiJourney(chart, { date_of_birth: req.body.date_of_birth });
      if (!ss) return fail(res, 'Unable to compute Sade Sati', 500);
      // FREE: active now? current phase + end date. LOCKED: full journey + meanings + remedies.
      return ok(res, {
        active: ss.active,
        moon_rashi_en: ss.moon_rashi_en, moon_rashi_hi: ss.moon_rashi_hi,
        current: ss.current ? {
          phase_en: ss.current.phase_en, phase_hi: ss.current.phase_hi,
          start: ss.current.start, end: ss.current.end,
        } : null,
        next_start: !ss.active
          ? (ss.phases.find((p) => !p.is_past && !p.is_current)?.start || null)
          : null,
        lifetime_phase_count: ss.phases.length,
        locked: ['full_timeline', 'phase_meanings', 'peak_periods', 'remedies'],
      });
    }

    if (type === 'mahadasha') {
      const seq = Array.isArray(chart.dasha) ? chart.dasha : [];
      const cur = seq.find((d) => d.is_current) || null;
      const curAntar = Array.isArray(cur?.antardasha)
        ? (cur.antardasha.find((a) => a.is_current) || null) : null;
      const idx  = cur ? seq.indexOf(cur) : -1;
      const next = idx >= 0 ? (seq[idx + 1] || null) : null;
      // FREE: current maha + antar + next lord. LOCKED: full timeline + interpretations.
      return ok(res, {
        current_mahadasha:  cur      ? { lord: cur.lord, start: cur.start, end: cur.end } : null,
        current_antardasha: curAntar ? { lord: curAntar.lord, end: curAntar.end } : null,
        next_mahadasha:     next     ? { lord: next.lord, start: next.start } : null,
        total_periods: seq.length,
        locked: ['full_timeline', 'period_interpretations', 'antardasha_details', 'favorable_periods', 'remedies'],
      });
    }

    return fail(res, 'Unknown calculator', 404);
  } catch (e) {
    console.error(`[public/calculator/${type}]`, e.message);
    return fail(res, 'Unable to calculate. Please check the birth details.', 500);
  }
});

// ─── Web push (PWA notifications) ────────────────────────────────────────────

const pushLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
});

// GET /api/public/push/vapid-key — public VAPID key for client subscribe
router.get('/push/vapid-key', (_req, res) => {
  const { publicKey } = require('../services/push.service');
  const key = publicKey();
  if (!key) return fail(res, 'Push notifications not configured', 503);
  return ok(res, { key });
});

// POST /api/public/push/subscribe — { subscription, rashi_num?, lang? }
router.post('/push/subscribe', pushLimiter, async (req, res) => {
  try {
    const { saveSubscription } = require('../services/push.service');
    await saveSubscription({
      subscription: req.body?.subscription,
      rashi_num: parseInt(req.body?.rashi_num, 10) || null,
      lang: req.body?.lang,
      user_id: null,
    });
    return ok(res, {}, 'Subscribed to daily horoscope notifications');
  } catch (e) {
    return fail(res, e.message === 'Invalid subscription' ? e.message : 'Unable to subscribe', 400);
  }
});

// POST /api/public/push/unsubscribe — { endpoint }
router.post('/push/unsubscribe', pushLimiter, async (req, res) => {
  try {
    const { removeSubscription } = require('../services/push.service');
    await removeSubscription(req.body?.endpoint);
    return ok(res, {}, 'Unsubscribed');
  } catch {
    return fail(res, 'Unable to unsubscribe', 400);
  }
});

// ─── Mantras ──────────────────────────────────────────────────────────────────

// GET /api/public/mantras — active mantras, optionally filtered by category
router.get('/mantras', async (req, res) => {
  try {
    const { category } = req.query;
    let q = db('mantras').where('is_active', true).orderBy('display_order');
    if (category) q = q.where('category', category);
    const rows = await q;
    return ok(res, { mantras: rows });
  } catch (e) {
    console.error('[public/mantras]', e.message);
    return fail(res, 'Failed to load mantras', 500);
  }
});

// ─── SEO (admin-controlled, read at runtime) ──────────────────────────────────

/**
 * GET /api/public/seo/config — what the browser needs to boot analytics.
 *
 * Deliberately tiny and public: a GA4 measurement ID is visible in the page source
 * of every site that uses one, so this exposes nothing. It is a separate endpoint
 * from the sitemap overrides so the client fetch stays cheap.
 */
router.get('/seo/config', async (_req, res) => {
  try {
    const { gaMeasurementId } = await getSeoSettings();
    return ok(res, { gaMeasurementId });
  } catch (e) {
    console.error('[public/seo/config]', e.message);
    // Analytics must never be able to break a page render.
    return ok(res, { gaMeasurementId: '' });
  }
});

/**
 * GET /api/public/seo/sitemap-overrides — per-route admin overrides + any routes
 * the admin added on top of the catalogue.
 *
 * The route CATALOGUE is not here on purpose: it lives in the frontend
 * (lib/seoRoutes.js) so a build with this API down still emits a correct sitemap
 * from the defaults rather than an empty one. Extras degrade the same way — they
 * are additions, so losing them briefly costs coverage, never correctness.
 */
router.get('/seo/sitemap-overrides', async (_req, res) => {
  try {
    const { sitemapOverrides, sitemapExtraRoutes } = await getSeoSettings();
    return ok(res, { overrides: sitemapOverrides, extras: sitemapExtraRoutes });
  } catch (e) {
    console.error('[public/seo/sitemap-overrides]', e.message);
    return ok(res, { overrides: {}, extras: [] });
  }
});

/**
 * GET /api/public/seo/gsc/:file — Google Search Console HTML verification.
 *
 * next.config.js rewrites /google<token>.html here, so the file appears at the
 * site root where Google demands it, while the token stays admin-editable with no
 * rebuild. Serves ONLY the exact configured filename — otherwise 404, so this
 * cannot be used to echo an arbitrary verification token for someone else's
 * property.
 */
router.get('/seo/gsc/:file', async (req, res) => {
  try {
    const body = await gscFileBody(req.params.file);
    if (!body) return res.status(404).type('text/plain').send('Not found');
    res.set('Cache-Control', 'public, max-age=300');
    return res.type('text/html').send(body);
  } catch (e) {
    console.error('[public/seo/gsc]', e.message);
    return res.status(404).type('text/plain').send('Not found');
  }
});

module.exports = router;
