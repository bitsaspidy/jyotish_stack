'use strict';
const router = require('express').Router();
const db = require('../config/db');
const { ok, fail } = require('../utils/response');
const { calculateDailyPanchang } = require('../services/helpers/panchang');

// GET /api/panchang/daily?lat=&lon=&date=YYYY-MM-DD&tz=&place=
// Public — no authentication required
router.get('/daily', (req, res) => {
  try {
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
  } catch (e) {
    console.error('[PanchangRoute] Error:', e.message);
    return fail(res, 'Unable to compute panchang', 500);
  }
});

// ─── Occasion muhurat dates ───────────────────────────────────────────────────
const { findMuhuratDates, OCCASIONS } = require('../services/helpers/muhurat-finder');

const muhuratCache = new Map();

// GET /api/panchang/muhurat/:occasion?year=YYYY | ?months=N (default 3, max 6)
// Public — no authentication required
router.get('/muhurat/:occasion', (req, res) => {
  try {
    const slug = req.params.occasion;
    if (!OCCASIONS[slug]) return fail(res, 'Unknown occasion', 404);

    const year   = parseInt(req.query.year, 10) || null;
    const months = Math.min(Math.max(parseInt(req.query.months, 10) || 3, 1), 6);
    const now    = new Date();
    const validYear = year && year >= now.getUTCFullYear() && year <= now.getUTCFullYear() + 1 ? year : null;

    const key = `${slug}:${validYear || `m${months}`}:${now.toISOString().slice(0, 10)}`;
    let data = muhuratCache.get(key);
    if (!data) {
      data = findMuhuratDates(slug, { year: validYear, months });
      if (muhuratCache.size > 24) muhuratCache.clear();
      muhuratCache.set(key, data);
    }
    return ok(res, data);
  } catch (e) {
    console.error('[PanchangRoute:muhurat]', e.message);
    return fail(res, 'Unable to compute muhurat dates', 500);
  }
});

// ─── Festival calendar ────────────────────────────────────────────────────────
const { computeFestivals, availableYears } = require('../services/helpers/festival-finder');

// GET /api/panchang/festivals?year=YYYY (defaults to current year). Public.
router.get('/festivals', (req, res) => {
  try {
    const years = availableYears();
    let year = parseInt(req.query.year, 10);
    if (!years.includes(year)) year = years.includes(new Date().getUTCFullYear()) ? new Date().getUTCFullYear() : years[0];
    const data = computeFestivals(year);
    return ok(res, { ...data, available_years: years });
  } catch (e) {
    console.error('[PanchangRoute:festivals]', e.message);
    return fail(res, 'Unable to load festivals', 500);
  }
});

// ─── Daily planetary positions (Grah Gochar) ─────────────────────────────────
const { computePlanetPositions } = require('../services/helpers/planet-positions');
const ppCache = new Map();

// GET /api/panchang/planet-positions?date=YYYY-MM-DD (defaults today IST). Public.
router.get('/planet-positions', async (req, res) => {
  try {
    let date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10); // today IST
    }
    const [y] = date.split('-').map(Number);
    if (y < 1900 || y > 2100) return fail(res, 'Date out of range', 400);

    // Optional observer — place + local clock time the sky is read for. All are
    // clamped/validated; anything missing or malformed falls back to the New
    // Delhi / 12:00 IST default inside the helper.
    const num = (v, lo, hi) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n >= lo && n <= hi ? n : undefined;
    };
    const obsOpts = {
      lat: num(req.query.lat, -90, 90),
      lon: num(req.query.lon, -180, 180),
      tzOffset: num(req.query.tz, -14, 14),
      time: /^\d{1,2}:\d{2}$/.test(String(req.query.time || '')) ? String(req.query.time) : undefined,
      placeEn: req.query.place ? String(req.query.place).slice(0, 120) : undefined,
    };

    // The public Gochar page asks for the enriched payload (dignity, composed
    // effect, retrograde/combustion notes, transit window). Cached separately so a
    // plain caller never pays the ~66ms of sign-window scanning.
    const enrich = String(req.query.detail || '') === '1';
    const obsSig = `${obsOpts.lat ?? ''}|${obsOpts.lon ?? ''}|${obsOpts.tzOffset ?? ''}|${obsOpts.time ?? ''}`;
    const cacheKey = `${date}:${enrich ? 'd' : 'p'}:${obsSig}`;

    let data = ppCache.get(cacheKey);
    if (!data) {
      data = computePlanetPositions(date, { enrich, ...obsOpts });
      // Upagraha POSITIONS come from the ephemeris helper; their meaning lives in
      // the `upagrahas` master table (already bilingual + 6 regional languages).
      // Merged here so the helper stays synchronous. A DB hiccup drops the
      // descriptions, never the page.
      if (enrich && data.upagrahas?.length) {
        try {
          const masters = await db('upagrahas')
            .select('slug', 'name_en', 'name_hi', 'nature_en', 'nature_hi',
              'key_indication_en', 'key_indication_hi', 'is_malefic', 'is_benefic', 'display_order');
          const bySlug = Object.fromEntries(masters.map((m) => [m.slug, m]));
          data.upagrahas = data.upagrahas.map((u) => {
            const m = bySlug[u.slug] || {};
            return {
              ...u,
              name_en: m.name_en || u.slug,
              name_hi: m.name_hi || u.slug,
              nature: { en: m.nature_en || '', hi: m.nature_hi || '' },
              key_indication: { en: m.key_indication_en || '', hi: m.key_indication_hi || '' },
              is_malefic: !!m.is_malefic,
              is_benefic: !!m.is_benefic,
              display_order: m.display_order ?? 99,
            };
          }).sort((a, b) => a.display_order - b.display_order);
        } catch (dbErr) {
          console.error('[PanchangRoute:upagraha-content]', dbErr.message);
        }
      }
      if (ppCache.size > 60) ppCache.clear();
      ppCache.set(cacheKey, data);
    }
    return ok(res, data);
  } catch (e) {
    console.error('[PanchangRoute:planet-positions]', e.message);
    return fail(res, 'Unable to compute planetary positions', 500);
  }
});

// ─── Planet transit calendar (ingress dates per year) ────────────────────────
const { signIngresses, nakshatraIngresses, currentSign } = require('../services/helpers/planet-transits');
const TRANSIT_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const ptCache = new Map();

// GET /api/panchang/planet-transits?planet=Sun&year=2026&type=rashi|nakshatra&tz=5.5
router.get('/planet-transits', async (req, res) => {
  try {
    const planet = String(req.query.planet || 'Sun');
    if (!TRANSIT_PLANETS.includes(planet)) return fail(res, 'Unknown planet', 400);

    const nowY = new Date().getUTCFullYear();
    let year = parseInt(req.query.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) year = nowY;

    const type = req.query.type === 'nakshatra' ? 'nakshatra' : 'rashi';
    const tzN = parseFloat(req.query.tz);
    const tz = Number.isFinite(tzN) && tzN >= -14 && tzN <= 14 ? tzN : 5.5;

    const cacheKey = `${planet}:${year}:${type}:${tz}`;
    let data = ptCache.get(cacheKey);
    if (!data) {
      const ingresses = type === 'nakshatra'
        ? nakshatraIngresses(planet, year, tz)
        : signIngresses(planet, year, tz);
      data = { planet, year, type, tz, ingresses, current: currentSign(planet), computed_utc: new Date().toISOString() };
      if (ptCache.size > 120) ptCache.clear();
      ptCache.set(cacheKey, data);
    }
    return ok(res, data);
  } catch (e) {
    console.error('[PanchangRoute:planet-transits]', e.message);
    return fail(res, 'Unable to compute planet transits', 500);
  }
});

module.exports = router;
