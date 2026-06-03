'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { calculateVedicChart, calculateAshtakoot } = require('../services/vedic-calc.service');
const { kundliReportPdf, matchmakingReportPdf } = require('../services/report.service');
const { fetchVargaReferenceData } = require('../services/varga-reference.service');

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

function parseJsonMaybe(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildKundliListSummary(chart) {
  if (!chart) return { calculated: false };
  const currentDasha = Array.isArray(chart.dasha)
    ? (chart.dasha.find((period) => period.is_current) || chart.dasha[0] || null)
    : null;
  const currentAntardasha = Array.isArray(currentDasha?.antardasha)
    ? (currentDasha.antardasha.find((period) => period.is_current) || currentDasha.antardasha[0] || null)
    : null;

  return {
    calculated: true,
    lagna_en: chart.ascendant?.rashi_en || null,
    lagna_hi: chart.ascendant?.rashi_hi || null,
    nakshatra_en: chart.nakshatra?.en || null,
    nakshatra_hi: chart.nakshatra?.hi || null,
    nakshatra_pada: chart.nakshatra?.pada || null,
    dasha_lord: currentDasha?.lord || null,
    dasha_end: currentDasha?.end || null,
    antardasha_lord: currentAntardasha?.lord || null,
    antardasha_end: currentAntardasha?.end || null,
  };
}

async function ensureCalculatedChart(profile) {
  const existing = parseJsonMaybe(profile.calculated_data);
  if (
    existing?.reports?.planet_details?.length
    && existing?.reports?.varga_matrix?.rows?.length
    && existing?.reports?.planet_assessments
    && existing?.reports?.yoga_dasha_report
    && existing?.reports?.event_timing?.windows?.length
    && existing?.life_report?.sections
    && existing?.varga_analysis?.d1?.role_en              // Session 26: plain-language Varga fields
    && existing?.varga_analysis?.d60?.past_life_reading   // Session 27: D60 past-life reading
  ) return existing;
  return calcAndSave(profile);
}

function fileSafe(value) {
  return String(value || 'report').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'report';
}

// Fetch remedy data from DB for the current Mahadasha lord + Lagna lord
async function fetchDashaRemedies(dashaLord, lagnaLord) {
  try {
    const planets = [...new Set([dashaLord, lagnaLord].filter(Boolean))];
    const rows = await db('remedy_planets').whereIn('planet', planets);
    const pujaSteps = await db('remedy_puja_steps').orderBy('sort_order');

    const parsed = rows.map((r) => {
      const parse = (v) => { try { return JSON.parse(v); } catch { return []; } };
      return { ...r, mantras_en: parse(r.mantras_en), mantras_hi: parse(r.mantras_hi) };
    });
    const stepsOut = pujaSteps.map((s) => ({ ...s }));

    return {
      dasha_planet: parsed.find((r) => r.planet === dashaLord) || null,
      lagna_planet: parsed.find((r) => r.planet === lagnaLord) || null,
      puja_sequence: stepsOut,
    };
  } catch { return null; }
}

// Fetch chart enrichment from DB — zodiac sign descriptions, planet classification,
// and house detailed notes (added in Session 20 — Class 3 & 4 PDF data)
async function fetchChartEnrichment(ascRashiNum, moonRashiNum) {
  try {
    const rashiIds = [...new Set([ascRashiNum, moonRashiNum].filter(Boolean))];
    const signs = rashiIds.length
      ? await db('zodiac_signs')
          .whereIn('id', rashiIds)
          .select('id','name','name_hi','key_traits_en','key_traits_hi',
                  'detailed_description_en','detailed_description_hi')
      : [];
    const signMap = Object.fromEntries(signs.map((s) => [s.id, s]));

    const planetRows = await db('planets')
      .select('id','name','name_hi','guna','guna_hi','varna','varna_hi',
              'court_role','court_role_hi','deity','deity_hi','characteristics');
    const planet_meta = Object.fromEntries(planetRows.map((p) => [p.name, p]));

    const houses_meta = await db('houses')
      .select('id','name','name_hi','keywords_en','keywords_hi',
              'topics_en','topics_hi','health_organs_en','health_organs_hi',
              'detailed_notes_en','detailed_notes_hi')
      .orderBy('id');

    return {
      lagna_sign: signMap[ascRashiNum] || null,
      moon_sign:  signMap[moonRashiNum] || null,
      planet_meta,
      houses_meta,
    };
  } catch (e) {
    console.error('[ChartEnrichment] Error:', e.message);
    return null;
  }
}

// Fetch detailed nakshatra insight from DB for a given nakshatra number (1-27)
async function fetchNakshatraInsight(nakNum) {
  if (!nakNum) return null;
  try {
    const row = await db('nakshatras')
      .where({ id: nakNum })
      .select(
        'name','name_hi','deity_en','deity_hi','guna','general_nature',
        'characteristics_en','characteristics_hi',
        'negative_traits_en','negative_traits_hi',
        'professions_en','professions_hi',
        'health_issues_en','health_issues_hi',
        'health_root_cause_en','health_root_cause_hi',
        'health_guidance_en','health_guidance_hi'
      )
      .first();
    if (!row) return null;
    // professions are stored as JSON strings
    if (row.professions_en && typeof row.professions_en === 'string') {
      try { row.professions_en = JSON.parse(row.professions_en); } catch { row.professions_en = []; }
    }
    if (row.professions_hi && typeof row.professions_hi === 'string') {
      try { row.professions_hi = JSON.parse(row.professions_hi); } catch { row.professions_hi = []; }
    }
    return row;
  } catch { return null; }
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
// Exclude calculated_data (large JSON blob) — callers fetch it via GET /:id
router.get('/', async (req, res) => {
  const profiles = await db('kundli_profiles')
    .where({ user_id: req.user.id })
    .select('id','uuid','user_id','name','date_of_birth','time_of_birth',
            'place_of_birth','latitude','longitude','timezone_offset',
            'gender','is_public','created_at','updated_at')
    .orderBy('created_at', 'desc');

  const chartRows = profiles.length
    ? await db('kundli_profiles')
        .whereIn('id', profiles.map((profile) => profile.id))
        .select('id', 'calculated_data')
    : [];
  const summaryById = new Map(
    chartRows.map((row) => [row.id, buildKundliListSummary(parseJsonMaybe(row.calculated_data))])
  );
  const profilesWithSummary = profiles.map((profile) => ({
    ...profile,
    chart_summary: summaryById.get(profile.id) || { calculated: false },
  }));
  return ok(res, { profiles: profilesWithSummary });
});

// ── POST /api/kundli/matchmaking/request ──
router.post('/matchmaking/request', async (req, res) => {
  try {
    const { boy_kundli_id, girl_kundli_id } = req.body;
    if (!boy_kundli_id || !girl_kundli_id) {
      return fail(res, 'boy_kundli_id and girl_kundli_id required', 400);
    }
    if (boy_kundli_id === girl_kundli_id) {
      return fail(res, 'Boy and girl Kundli profiles must be different', 400);
    }

    const boy = await db('kundli_profiles')
      .where({ uuid: boy_kundli_id, user_id: req.user.id })
      .first();
    const girl = await db('kundli_profiles')
      .where({ uuid: girl_kundli_id, user_id: req.user.id })
      .first();
    if (!boy || !girl) return fail(res, 'One or both Kundli profiles not found', 404);

    const boyChart = await ensureCalculatedChart(boy);
    const girlChart = await ensureCalculatedChart(girl);
    if (!boyChart || !girlChart) {
      return fail(res, 'Unable to calculate one or both Kundli profiles', 500);
    }

    const result = calculateAshtakoot(boyChart, girlChart);
    const requestUuid = uuidv4();
    const [id] = await db('matchmaking_requests').insert({
      uuid: requestUuid,
      user_id: req.user.id,
      kundli_boy_id: boy.id,
      kundli_girl_id: girl.id,
      result: JSON.stringify(result),
      status: 'completed',
    });

    return ok(res, {
      request: {
        id,
        uuid: requestUuid,
        status: 'completed',
        boy_name: boy.name,
        girl_name: girl.name,
        boy_uuid: boy.uuid,
        girl_uuid: girl.uuid,
        result,
      },
      result,
    }, 'Matchmaking calculated successfully', 201);
  } catch (e) {
    console.error('[Matchmaking] Error:', e.message);
    return fail(res, 'Unable to calculate matchmaking', 500);
  }
});

// ── GET /api/kundli/matchmaking/list ──
router.get('/matchmaking/list', async (req, res) => {
  const rows = await db('matchmaking_requests as mr')
    .join('kundli_profiles as boy',  'mr.kundli_boy_id',  'boy.id')
    .join('kundli_profiles as girl', 'mr.kundli_girl_id', 'girl.id')
    .where({ 'mr.user_id': req.user.id })
    .select(
      'mr.*',
      'boy.name as boy_name',
      'boy.uuid as boy_uuid',
      'girl.name as girl_name',
      'girl.uuid as girl_uuid'
    )
    .orderBy('mr.created_at', 'desc');

  const requests = rows.map((row) => ({
    ...row,
    result: parseJsonMaybe(row.result),
  }));

  return ok(res, { requests });
});

// ── GET /api/kundli/matchmaking/:id/report.pdf ──
router.get('/matchmaking/:id/report.pdf', async (req, res) => {
  try {
    const request = await db('matchmaking_requests as mr')
      .join('kundli_profiles as boy', 'mr.kundli_boy_id', 'boy.id')
      .join('kundli_profiles as girl', 'mr.kundli_girl_id', 'girl.id')
      .where({ 'mr.uuid': req.params.id, 'mr.user_id': req.user.id })
      .select(
        'mr.*',
        'boy.name as boy_name',
        'boy.uuid as boy_uuid',
        'boy.calculated_data as boy_calculated_data',
        'girl.name as girl_name',
        'girl.uuid as girl_uuid',
        'girl.calculated_data as girl_calculated_data'
      )
      .first();
    if (!request) return fail(res, 'Matchmaking request not found', 404);

    let result = parseJsonMaybe(request.result);
    if (!result) {
      const boy = await db('kundli_profiles').where({ uuid: request.boy_uuid, user_id: req.user.id }).first();
      const girl = await db('kundli_profiles').where({ uuid: request.girl_uuid, user_id: req.user.id }).first();
      const boyChart = await ensureCalculatedChart(boy);
      const girlChart = await ensureCalculatedChart(girl);
      if (!boyChart || !girlChart) return fail(res, 'Unable to calculate matchmaking report', 500);

      result = calculateAshtakoot(boyChart, girlChart);
      request.status = 'completed';
      await db('matchmaking_requests')
        .where({ id: request.id })
        .update({ result: JSON.stringify(result), status: 'completed' });
    }

    const pdf = matchmakingReportPdf(request, result);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileSafe(`${request.boy_name}-${request.girl_name}-match`)}.pdf"`);
    return res.send(pdf);
  } catch (e) {
    console.error('[MatchmakingReport] Error:', e.message);
    return fail(res, 'Unable to generate matchmaking report', 500);
  }
});

// GET /api/kundli/reference/varga - seeded divisional chart reference for UI
router.get('/reference/varga', async (req, res) => {
  try {
    const reference = await fetchVargaReferenceData(db);
    if (!reference.charts.length) {
      return fail(res, 'Varga reference data has not been seeded', 404);
    }
    return ok(res, { reference });
  } catch (e) {
    console.error('[VargaReference] Error:', e.message);
    return fail(res, 'Unable to load Varga reference data', 500);
  }
});

// GET /api/kundli/:id/report.pdf
router.get('/:id/report.pdf', async (req, res) => {
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate Kundli report', 500);

    const pdf = kundliReportPdf(profile, chart);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileSafe(`${profile.name}-kundli`)}.pdf"`);
    return res.send(pdf);
  } catch (e) {
    console.error('[KundliReport] Error:', e.message);
    return fail(res, 'Unable to generate Kundli report', 500);
  }
});

// ── GET /api/kundli/:id — fetch single (auto-calculates if needed) ────────────
router.get('/:id', async (req, res) => {
  const profile = await db('kundli_profiles')
    .where({ uuid: req.params.id, user_id: req.user.id })
    .first();
  if (!profile) return fail(res, 'Kundli not found', 404);

  const chart = await ensureCalculatedChart(profile);
  if (!chart) return fail(res, 'Unable to calculate Kundli', 500);
  profile.calculated_data = chart;

  // Attach nakshatra insight from DB (Moon nakshatra detailed notes)
  const nakNum = profile.calculated_data?.nakshatra?.num;
  profile.nakshatra_insight = await fetchNakshatraInsight(nakNum);

  // Attach remedy data — current Mahadasha lord + Lagna lord
  const cd = profile.calculated_data;
  const currentDasha = Array.isArray(cd?.dasha) ? cd.dasha.find((d) => d.is_current) || cd.dasha[0] : null;
  profile.remedy_data = await fetchDashaRemedies(currentDasha?.lord, cd?.ascendant?.rashi_lord);

  // Attach chart enrichment (Session 20 — Class 3&4 PDF: guna/varna/deity + house notes)
  profile.chart_enrichment = await fetchChartEnrichment(
    cd?.ascendant?.rashi_num,
    cd?.planets?.Moon?.rashi_num
  );

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

  freshProfile.calculated_data = chart;

  // Attach nakshatra insight from DB
  const nakNum = chart?.nakshatra?.num;
  freshProfile.nakshatra_insight = await fetchNakshatraInsight(nakNum);

  // Attach remedy data
  const currentDasha = Array.isArray(chart?.dasha) ? chart.dasha.find((d) => d.is_current) || chart.dasha[0] : null;
  freshProfile.remedy_data = await fetchDashaRemedies(currentDasha?.lord, chart?.ascendant?.rashi_lord);

  // Attach chart enrichment
  freshProfile.chart_enrichment = await fetchChartEnrichment(
    chart?.ascendant?.rashi_num,
    chart?.planets?.Moon?.rashi_num
  );

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

module.exports = router;
