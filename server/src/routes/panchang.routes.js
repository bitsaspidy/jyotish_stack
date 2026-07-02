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

module.exports = router;
