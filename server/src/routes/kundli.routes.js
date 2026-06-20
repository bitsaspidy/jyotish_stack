'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { calculateVedicChart, calculateAshtakoot } = require('../services/vedic-calc.service');
const { kundliReportPdf, matchmakingReportPdf } = require('../services/report.service');
const { fetchVargaReferenceData } = require('../services/varga-reference.service');
const { generateLifeGuidance }  = require('../services/helpers/life-guidance');
const { computeFavouriteDays }  = require('../services/helpers/favourite-days');
const { fetchYogaDoshaLibrary, fetchProblemRemedies, getOrCreateTodayPrediction, buildKundliReportExtras, fetchAstaVakriAnalysis, fetchRemedyManual } = require('../services/kundli-admin.service');
const { generatePersonalizedRemedies } = require('../services/remedy-engine');
const { computeCharaKarakas, computeSadeSatiJourney, computeDashaJourney, computeNumerology } = require('../services/helpers/cosmic-insights');
const { computeYutiAnalysis, computeRemedySuite, computeMarriageTiming, computeAntardashaNarratives } = require('../services/helpers/cosmic-extras');
const { buildLifeReportNarratives }  = require('../services/helpers/life-report-narrative');
const { generateAIPrediction }        = require('../services/ai-prediction.service');
const { buildPlacementNarratives }  = require('../services/helpers/placement-narratives');
const { generateVarshphal, compactVarshphal } = require('../services/helpers/varshphal');
const { computeKundliStrength }               = require('../services/helpers/kundli-strength');
const { generateLifeReport, generateDailyGuidance } = require('../services/report-engine');
const { generateJudgement } = require('../services/judgement-engine');
const { composeKundliUserSummary } = require('../services/kundli-user-summary.service');
const { composeLifeReportUserFriendly } = require('../services/report-engine/life-report-humanizer');
const { composeStrengthUserFriendly }   = require('../services/report-engine/strength-humanizer');

router.use(authenticate);

// Max Kundli profiles a user may create, by plan tier
const PLAN_PROFILE_LIMITS = { free: 1, basic: 1, premium: 5, yearly: 50 };

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
              'detailed_notes_en','detailed_notes_hi',
              'bhava_type','bhava_groups','bhava_nature_en','bhava_nature_hi',
              'is_kendra','is_trikona','is_dusthana','is_upachaya','is_maarak')
      .orderBy('id');

    // parse bhava_groups JSON string
    const housesWithGroups = houses_meta.map((h) => {
      let groups = [];
      try { groups = typeof h.bhava_groups === 'string' ? JSON.parse(h.bhava_groups) : (h.bhava_groups || []); } catch {}
      return { ...h, bhava_groups: groups };
    });

    return {
      lagna_sign: signMap[ascRashiNum] || null,
      moon_sign:  signMap[moonRashiNum] || null,
      planet_meta,
      houses_meta: housesWithGroups,
    };
  } catch (e) {
    console.error('[ChartEnrichment] Error:', e.message);
    return null;
  }
}

// ── Bhava Lord Readings ───────────────────────────────────────────────────────
// For each house 1-12, determines which planet is its lord, where that planet
// is placed, and fetches the BPHS interpretation from DB.
const RASHI_LORD = {
  1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',6:'Mercury',
  7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Jupiter',
};
const PLANET_NAME_MAP = {
  Sun:'Sun',Moon:'Moon',Mars:'Mars',Mercury:'Mercury',Jupiter:'Jupiter',
  Venus:'Venus',Saturn:'Saturn',Rahu:'Rahu',Ketu:'Ketu',
};

async function fetchBhavaLordReadings(chart) {
  if (!chart?.ascendant?.rashi_num || !chart?.planets) return null;
  try {
    const lagnaRashi = chart.ascendant.rashi_num;

    // Build map: planet → house number (whole-sign)
    const planetHouse = {};
    for (const [pName, pData] of Object.entries(chart.planets)) {
      if (pData?.rashi_num) {
        planetHouse[pName] = ((pData.rashi_num - lagnaRashi + 12) % 12) + 1;
      }
    }

    // For each house, find its lord and its placement
    const lookups = []; // [{house_lord, placed_in_house, lord_planet, lord_house}]
    for (let h = 1; h <= 12; h++) {
      const houseSign = ((lagnaRashi + h - 2) % 12) + 1;
      const lordPlanet = RASHI_LORD[houseSign];
      const placedIn = planetHouse[lordPlanet] || null;
      if (placedIn) {
        lookups.push({ house_lord: h, placed_in_house: placedIn, lord_planet: lordPlanet });
      }
    }

    if (!lookups.length) return [];

    // Batch DB fetch
    const pairs = lookups.map((l) => [l.house_lord, l.placed_in_house]);
    const rows = await db('house_lord_interpretations')
      .where(function () {
        pairs.forEach(([hl, ph]) => {
          this.orWhere({ house_lord: hl, placed_in_house: ph });
        });
      })
      .select(
        'house_lord','placed_in_house','title','title_hi',
        'lord_name_en','lord_name_hi',
        'house_signification_en','house_signification_hi',
        'interpretation_en','interpretation_hi',
        'overall_effect','forms_viparita_yoga'
      );

    const rowMap = {};
    for (const r of rows) rowMap[`${r.house_lord}_${r.placed_in_house}`] = r;

    return lookups.map((l) => {
      const row = rowMap[`${l.house_lord}_${l.placed_in_house}`] || {};
      return {
        house_number:         l.house_lord,
        lord_planet:          l.lord_planet,
        placed_in_house:      l.placed_in_house,
        title_en:             row.title || `${l.house_lord}th Lord in ${l.placed_in_house}th House`,
        title_hi:             row.title_hi || null,
        lord_name_en:         row.lord_name_en || null,
        lord_name_hi:         row.lord_name_hi || null,
        house_signification_en: row.house_signification_en || null,
        house_signification_hi: row.house_signification_hi || null,
        interpretation_en:    row.interpretation_en || null,
        interpretation_hi:    row.interpretation_hi || null,
        overall_effect:       row.overall_effect || 'neutral',
        forms_viparita_yoga:  row.forms_viparita_yoga || false,
      };
    });
  } catch (e) {
    console.error('[BhavaLordReadings] Error:', e.message);
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

  if (req.user.role !== 'admin') {
    const limit = PLAN_PROFILE_LIMITS[req.user.plan] || PLAN_PROFILE_LIMITS.basic;
    const { count } = await db('kundli_profiles').where({ user_id: req.user.id }).count('id as count').first();
    if (Number(count) >= limit) {
      return fail(res, `Your plan allows up to ${limit} Kundli profile${limit > 1 ? 's' : ''}. Please upgrade to add more.`, 403);
    }
  }

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

// GET /api/kundli/:id/report.pdf  (premium / admin only)
router.get('/:id/report.pdf', async (req, res) => {
  if (req.user.role !== 'admin' && (req.user.plan === 'free' || req.user.plan === 'basic')) {
    return fail(res, 'PDF export requires a Premium or Yearly plan. Please upgrade to download reports.', 403, { upgrade_required: true, required_plan: 'premium' });
  }
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate Kundli report', 500);

    const extras = await buildKundliReportExtras(chart, profile);
    const pdf = kundliReportPdf(profile, chart, extras);
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

  // Free-plan gate: return basic metadata so the paywall UI can show the person's name
  if (req.user.role !== 'admin' && req.user.plan === 'free') {
    return fail(res, 'Viewing Kundli analysis requires a Basic or higher plan. Please upgrade to continue.', 403, {
      upgrade_required: true,
      required_plan: 'basic',
      kundli_name: profile.name,
      date_of_birth: String(profile.date_of_birth).slice(0, 10),
      place_of_birth: profile.place_of_birth,
    });
  }

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

  // Attach bhava lord readings (Session 32 — Class 7 PDF: 144 BPHS interpretations)
  profile.bhava_lord_readings = await fetchBhavaLordReadings(cd);

  // Attach life guidance (Session 33: career, work location, business timing, relationships, marriage, parents, children, remedies)
  profile.life_guidance   = generateLifeGuidance(cd);
  profile.favourite_days  = computeFavouriteDays(cd);
  profile.yoga_dosha_library = await fetchYogaDoshaLibrary(cd);
  if (profile.remedy_data) profile.remedy_data.problems = await fetchProblemRemedies();
  profile.chara_karakas     = computeCharaKarakas(cd);
  profile.sade_sati_journey = computeSadeSatiJourney(cd, profile);
  profile.yuti_analysis     = computeYutiAnalysis(cd);
  profile.marriage_timing   = computeMarriageTiming(cd);
  profile.dasha_journey     = computeDashaJourney(cd);
  profile.antar_narratives  = computeAntardashaNarratives(cd);
  profile.life_report_narratives = buildLifeReportNarratives(cd, profile.bhava_lord_readings);
  profile.placement_narratives   = buildPlacementNarratives(cd);
  profile.asta_vakri        = await fetchAstaVakriAnalysis(cd);
  if (profile.remedy_data) profile.remedy_data.suite = computeRemedySuite(cd);
  profile.judgement    = generateJudgement(cd, profile, { lang: 'hi', admin: false });
  profile.user_summary = composeKundliUserSummary(cd, profile.judgement);
  profile.life_report_friendly = composeLifeReportUserFriendly(cd, cd.life_report, profile.judgement, {});
  profile.remedy_manual        = await fetchRemedyManual();
  profile.personalized_remedies = generatePersonalizedRemedies(cd, { remedyManual: profile.remedy_manual });

  return ok(res, { profile });
});

// ── POST /api/kundli/:id/recalculate — force fresh calculation ────────────────
router.post('/:id/recalculate', async (req, res) => {
  const profile = await db('kundli_profiles')
    .where({ uuid: req.params.id, user_id: req.user.id })
    .first();
  if (!profile) return fail(res, 'Kundli not found', 404);

  if (req.user.role !== 'admin' && req.user.plan === 'free') {
    return fail(res, 'Recalculation requires a Basic or higher plan.', 403, { upgrade_required: true });
  }

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

  // Attach bhava lord readings
  freshProfile.bhava_lord_readings = await fetchBhavaLordReadings(chart);

  // Attach life guidance
  freshProfile.life_guidance  = generateLifeGuidance(chart);
  freshProfile.favourite_days = computeFavouriteDays(chart);
  freshProfile.yoga_dosha_library = await fetchYogaDoshaLibrary(chart);
  if (freshProfile.remedy_data) freshProfile.remedy_data.problems = await fetchProblemRemedies();
  freshProfile.chara_karakas     = computeCharaKarakas(chart);
  freshProfile.sade_sati_journey = computeSadeSatiJourney(chart, freshProfile);
  freshProfile.yuti_analysis     = computeYutiAnalysis(chart);
  freshProfile.marriage_timing   = computeMarriageTiming(chart);
  freshProfile.dasha_journey     = computeDashaJourney(chart);
  freshProfile.antar_narratives  = computeAntardashaNarratives(chart);
  freshProfile.life_report_narratives = buildLifeReportNarratives(chart, freshProfile.bhava_lord_readings);
  freshProfile.placement_narratives   = buildPlacementNarratives(chart);
  freshProfile.asta_vakri        = await fetchAstaVakriAnalysis(chart);
  if (freshProfile.remedy_data) freshProfile.remedy_data.suite = computeRemedySuite(chart);
  freshProfile.judgement    = generateJudgement(chart, { date_of_birth: freshProfile.date_of_birth, gender: freshProfile.gender }, { lang: 'hi', admin: false });
  freshProfile.user_summary = composeKundliUserSummary(chart, freshProfile.judgement);
  freshProfile.life_report_friendly = composeLifeReportUserFriendly(chart, chart.life_report, freshProfile.judgement, {});
  freshProfile.remedy_manual        = await fetchRemedyManual();
  freshProfile.personalized_remedies = generatePersonalizedRemedies(chart, { remedyManual: freshProfile.remedy_manual });

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

// ── GET /api/kundli/:id/varshphal — Annual Solar Return chart ────────────────
router.get('/:id/varshphal', async (req, res) => {
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate Kundli', 500);

    const targetYear = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
    const varshphal  = generateVarshphal(chart, profile, targetYear);
    if (!varshphal) return fail(res, 'Unable to generate Varshphal', 500);

    return ok(res, { varshphal });
  } catch (e) {
    console.error('[Varshphal] Route error:', e.message);
    return fail(res, 'Unable to generate Varshphal', 500);
  }
});

// ── GET /api/kundli/:id/varshphal-years — 5-year compact forecast ─────────────
router.get('/:id/varshphal-years', async (req, res) => {
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate chart', 500);

    const from  = parseInt(req.query.from, 10) || new Date().getUTCFullYear();
    const count = Math.min(Math.max(parseInt(req.query.count, 10) || 5, 1), 10);

    const years = [];
    for (let y = from; y < from + count; y++) {
      const full = generateVarshphal(chart, profile, y);
      years.push(compactVarshphal(full));
    }

    return ok(res, { years, from, count });
  } catch (e) {
    console.error('[VarshphalYears] Error:', e.message);
    return fail(res, 'Unable to generate multi-year forecast', 500);
  }
});

// ── GET /api/kundli/:id/strength — Overall Kundli strength report ─────────────
router.get('/:id/strength', async (req, res) => {
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate chart', 500);

    const strength = computeKundliStrength(chart);
    if (!strength) return fail(res, 'Unable to compute strength', 500);

    const strength_friendly = composeStrengthUserFriendly(strength, null, chart, {});

    return ok(res, { strength, strength_friendly });
  } catch (e) {
    console.error('[Strength] Error:', e.message);
    return fail(res, 'Unable to generate strength report', 500);
  }
});

// ── GET /api/kundli/:id/guidance — simple Hindi/Hinglish life-guidance report ──
// User mode: only soft language + status labels (no houses/tones/dasha tokens).
router.get('/:id/guidance', async (req, res) => {
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate chart', 500);

    const lang = req.query.lang;
    // Generate judgement so contradictions between sections and scores are resolved
    const judgement = generateJudgement(chart, {}, { lang: lang || 'hi', admin: false });
    const report = generateLifeReport(chart, { lang, judgement });
    const daily  = generateDailyGuidance(chart, new Date(), { lang });
    return ok(res, { report, daily });
  } catch (e) {
    console.error('[Guidance] Error:', e.message);
    return fail(res, 'Unable to generate guidance report', 500);
  }
});

// ── GET /api/kundli/:id/today — personal daily prediction (persisted) ─────────
router.get('/:id/today', async (req, res) => {
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate chart', 500);

    const prediction = await getOrCreateTodayPrediction(profile, chart);
    if (!prediction) return fail(res, 'Unable to generate today prediction', 500);

    return ok(res, { prediction });
  } catch (e) {
    console.error('[TodayPrediction] Error:', e.message);
    return fail(res, 'Unable to generate today prediction', 500);
  }
});

// ── POST /api/kundli/:id/ai-reading — Claude-powered personalised reading ────
router.post('/:id/ai-reading', async (req, res) => {
  try {
    const profile = await db('kundli_profiles')
      .where({ uuid: req.params.id, user_id: req.user.id })
      .first();
    if (!profile) return fail(res, 'Kundli not found', 404);

    const chart = await ensureCalculatedChart(profile);
    if (!chart) return fail(res, 'Unable to calculate chart', 500);

    const result = await generateAIPrediction(chart);
    return ok(res, result);
  } catch (e) {
    console.error('[AI Reading]', e.message);
    return fail(res, 'AI reading failed', 500);
  }
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
