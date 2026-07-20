'use strict';
const router = require('express').Router();
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
router.get('/planet-positions', (req, res) => {
  try {
    let date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10); // today IST
    }
    const [y] = date.split('-').map(Number);
    if (y < 1900 || y > 2100) return fail(res, 'Date out of range', 400);

    // The public Gochar page asks for the enriched payload (dignity, composed
    // effect, retrograde/combustion notes, transit window). Cached separately so a
    // plain caller never pays the ~66ms of sign-window scanning.
    const enrich = String(req.query.detail || '') === '1';
    const cacheKey = enrich ? `${date}:d` : date;

    let data = ppCache.get(cacheKey);
    if (!data) {
      data = computePlanetPositions(date, { enrich });
      if (ppCache.size > 60) ppCache.clear();
      ppCache.set(cacheKey, data);
    }
    return ok(res, data);
  } catch (e) {
    console.error('[PanchangRoute:planet-positions]', e.message);
    return fail(res, 'Unable to compute planetary positions', 500);
  }
});

module.exports = router;
