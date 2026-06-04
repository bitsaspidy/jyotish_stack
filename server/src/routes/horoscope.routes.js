'use strict';
const router = require('express').Router();
const { ok, fail } = require('../utils/response');
const { generateDailyHoroscope } = require('../services/helpers/daily-horoscope');

// In-memory cache: regenerate horoscope at most once per hour per date
const cache = new Map();
function getCached(dateStr) {
  const entry = cache.get(dateStr);
  if (entry && Date.now() - entry.cachedAt < 60 * 60 * 1000) return entry.data;
  return null;
}
function setCache(dateStr, data) {
  // Keep cache small — only today and yesterday
  if (cache.size > 3) cache.clear();
  cache.set(dateStr, { data, cachedAt: Date.now() });
}

// GET /api/horoscope/daily
// Optional ?date=YYYY-MM-DD (defaults to today UTC)
// Optional ?rashi=1-12 to get a single rashi
router.get('/daily', (req, res) => {
  try {
    let atDate = new Date();
    if (req.query.date) {
      const parsed = new Date(req.query.date + 'T00:00:00Z');
      if (!isNaN(parsed)) atDate = parsed;
    }
    const dateStr = atDate.toISOString().slice(0, 10);

    let data = getCached(dateStr);
    if (!data) {
      data = generateDailyHoroscope(atDate);
      if (!data) return fail(res, 'Unable to generate horoscope', 500);
      setCache(dateStr, data);
    }

    // Filter to single rashi if requested
    const rashiParam = parseInt(req.query.rashi, 10);
    if (rashiParam >= 1 && rashiParam <= 12) {
      const single = data.rashis.find((r) => r.rashi_num === rashiParam);
      return ok(res, { date: data.date, moon_sign: data.moon_sign, transit_summary: data.transit_summary, rashi: single || null });
    }

    return ok(res, data);
  } catch (e) {
    console.error('[HoroscopeRoute] Error:', e.message);
    return fail(res, 'Unable to generate horoscope', 500);
  }
});

module.exports = router;
