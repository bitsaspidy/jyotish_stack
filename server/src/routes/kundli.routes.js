'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { calculateVedicChart } = require('../services/vedic-calc.service');

router.use(authenticate);

// ── Helper: run calculation and persist ──────────────────────────────────────
async function calcAndSave(profile) {
  try {
    // date_of_birth may arrive as a JS Date object (MySQL2 without typeCast)
    // or as a string "YYYY-MM-DD" (with typeCast). Handle both.
    const rawDate = profile.date_of_birth;
    let dateStr;
    if (rawDate instanceof Date) {
      // Use UTC date components to avoid timezone shifts
      const tz = parseFloat(profile.timezone_offset) || 5.5;
      const adjusted = new Date(rawDate.getTime() + tz * 3600 * 1000);
      const Y = adjusted.getUTCFullYear();
      const M = String(adjusted.getUTCMonth() + 1).padStart(2, '0');
      const D = String(adjusted.getUTCDate()).padStart(2, '0');
      dateStr = `${Y}-${M}-${D}`;
    } else {
      // Already a string like "1990-05-15"
      dateStr = String(rawDate).slice(0, 10);
    }

    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const [hr, mn, sc] = (profile.time_of_birth || '00:00:00').split(':').map(Number);

    const chart = calculateVedicChart({
      year:      yr,
      month:     mo,
      day:       dy,
      hour:      hr || 0,
      minute:    mn || 0,
      second:    sc || 0,
      timezone:  parseFloat(profile.timezone_offset) || 5.5,
      latitude:  parseFloat(profile.latitude),
      longitude: parseFloat(profile.longitude),
    });

    await db('kundli_profiles')
      .where({ id: profile.id })
      .update({ calculated_data: JSON.stringify(chart) });

    return chart;
  } catch (e) {
    console.error('[KundliCalc] Error:', e.message);
    return null;
  }
}

// ── POST /api/kundli — create ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, date_of_birth, time_of_birth, place_of_birth,
          latitude, longitude, timezone_offset, gender } = req.body;

  if (!name || !date_of_birth || !time_of_birth || !place_of_birth
      || latitude == null || longitude == null || timezone_offset == null || !gender)
    return fail(res, 'All birth details are required', 400);

  const [id] = await db('kundli_profiles').insert({
    uuid: uuidv4(), user_id: req.user.id,
    name, date_of_birth, time_of_birth, place_of_birth,
    latitude, longitude, timezone_offset, gender,
  });

  // Trigger async calculation
  const profile = await db('kundli_profiles').where({ id }).first();
  calcAndSave(profile);   // fire-and-forget; result saved to DB

  return ok(res, { profile }, 'Kundli profile created. Chart calculation started.', 201);
});

// ── GET /api/kundli — list ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const profiles = await db('kundli_profiles')
    .where({ user_id: req.user.id })
    .orderBy('created_at', 'desc');
  return ok(res, { profiles });
});

// ── GET /api/kundli/:id — fetch single (auto-calculates if needed) ────────────
router.get('/:id', async (req, res) => {
  const profile = await db('kundli_profiles')
    .where({ uuid: req.params.id, user_id: req.user.id })
    .first();
  if (!profile) return fail(res, 'Kundli not found', 404);

  // Auto-calculate if data is missing
  if (!profile.calculated_data) {
    const chart = await calcAndSave(profile);
    profile.calculated_data = chart ? JSON.stringify(chart) : null;
  }

  // Parse JSON if stored as string
  if (typeof profile.calculated_data === 'string') {
    try { profile.calculated_data = JSON.parse(profile.calculated_data); } catch {}
  }

  return ok(res, { profile });
});

// ── POST /api/kundli/:id/recalculate — force fresh calculation ────────────────
router.post('/:id/recalculate', async (req, res) => {
  const profile = await db('kundli_profiles')
    .where({ uuid: req.params.id, user_id: req.user.id })
    .first();
  if (!profile) return fail(res, 'Kundli not found', 404);

  await db('kundli_profiles').where({ id: profile.id }).update({ calculated_data: null });
  const freshProfile = await db('kundli_profiles').where({ id: profile.id }).first();
  const chart = await calcAndSave(freshProfile);

  if (typeof freshProfile.calculated_data === 'string') {
    try { freshProfile.calculated_data = JSON.parse(freshProfile.calculated_data); } catch {}
  }
  freshProfile.calculated_data = chart;

  return ok(res, { profile: freshProfile }, 'Chart recalculated successfully');
});

// ── PATCH /api/kundli/:id — update ───────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const profile = await db('kundli_profiles')
    .where({ uuid: req.params.id, user_id: req.user.id })
    .first();
  if (!profile) return fail(res, 'Kundli not found', 404);

  const allowed = ['name','date_of_birth','time_of_birth','place_of_birth',
                   'latitude','longitude','timezone_offset','gender','is_public'];
  const update = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

  if (Object.keys(update).length) {
    update.calculated_data = null;   // invalidate old chart
    await db('kundli_profiles').where({ id: profile.id }).update(update);
  }

  const updated = await db('kundli_profiles').where({ id: profile.id }).first();
  // Trigger recalculation
  calcAndSave(updated);

  return ok(res, { profile: updated }, 'Kundli updated. Chart is being recalculated.');
});

// ── DELETE /api/kundli/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const profile = await db('kundli_profiles')
    .where({ uuid: req.params.id, user_id: req.user.id })
    .first();
  if (!profile) return fail(res, 'Kundli not found', 404);
  await db('kundli_profiles').where({ id: profile.id }).del();
  return ok(res, {}, 'Kundli deleted');
});

// ── POST /api/kundli/matchmaking/request ─────────────────────────────────────
router.post('/matchmaking/request', async (req, res) => {
  const { boy_kundli_id, girl_kundli_id } = req.body;
  if (!boy_kundli_id || !girl_kundli_id)
    return fail(res, 'boy_kundli_id and girl_kundli_id required', 400);

  const boy  = await db('kundli_profiles').where({ uuid: boy_kundli_id }).first();
  const girl = await db('kundli_profiles').where({ uuid: girl_kundli_id }).first();
  if (!boy || !girl) return fail(res, 'One or both Kundli profiles not found', 404);

  const [id] = await db('matchmaking_requests').insert({
    uuid: uuidv4(), user_id: req.user.id,
    kundli_boy_id: boy.id, kundli_girl_id: girl.id, status: 'pending',
  });
  return ok(res, { id }, 'Matchmaking request created', 201);
});

// ── GET /api/kundli/matchmaking/list ─────────────────────────────────────────
router.get('/matchmaking/list', async (req, res) => {
  const requests = await db('matchmaking_requests as mr')
    .join('kundli_profiles as boy',  'mr.kundli_boy_id',  'boy.id')
    .join('kundli_profiles as girl', 'mr.kundli_girl_id', 'girl.id')
    .where({ 'mr.user_id': req.user.id })
    .select('mr.*', 'boy.name as boy_name', 'girl.name as girl_name')
    .orderBy('mr.created_at', 'desc');
  return ok(res, { requests });
});

module.exports = router;
