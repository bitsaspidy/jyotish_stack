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

module.exports = router;
