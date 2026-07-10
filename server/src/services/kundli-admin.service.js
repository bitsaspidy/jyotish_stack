'use strict';
/**
 * Shared kundli helpers for the admin panel.
 * Mirrors the private helpers in kundli.routes.js but is independently
 * importable — avoids mounting the user router inside admin routes.
 */
const db = require('../config/db');
const { calculateVedicChart }   = require('./vedic-calc.service');
const { generateLifeGuidance }  = require('./helpers/life-guidance');
const { computeFavouriteDays }  = require('./helpers/favourite-days');
const { computeCharaKarakas, computeSadeSatiJourney, computeDashaJourney, computeNumerology } = require('./helpers/cosmic-insights');
const { computeYutiAnalysis, computeAntardashaNarratives, computeRemedySuite, computeMarriageTiming } = require('./helpers/cosmic-extras');
const { buildPlacementNarratives } = require('./helpers/placement-narratives');
const { generateVarshphal, compactVarshphal } = require('./helpers/varshphal');
const { computeKundliStrength } = require('./helpers/kundli-strength');
const { generateJudgement }     = require('./judgement-engine');
const { generatePersonalizedRemedies } = require('./remedy-engine');
const { composeLifeReportUserFriendly } = require('./report-engine/life-report-humanizer');
const { regionalCols } = require('./helpers/lang-fields');

// BPHS house lordship (1=Aries lagna offset)
const RASHI_LORD = {
  1:'Mars', 2:'Venus', 3:'Mercury', 4:'Moon',   5:'Sun',     6:'Mercury',
  7:'Venus',8:'Mars',  9:'Jupiter',10:'Saturn', 11:'Saturn', 12:'Jupiter',
};

// ── Utilities ────────────────────────────────────────────────────────────────
function parseJsonMaybe(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

function buildKundliListSummary(chart) {
  if (!chart) return { calculated: false };
  const currentDasha = Array.isArray(chart.dasha)
    ? (chart.dasha.find((p) => p.is_current) || chart.dasha[0] || null)
    : null;
  const currentAntardasha = Array.isArray(currentDasha?.antardasha)
    ? (currentDasha.antardasha.find((p) => p.is_current) || currentDasha.antardasha[0] || null)
    : null;
  return {
    calculated: true,
    lagna_en: chart.ascendant?.rashi_en || null,
    lagna_hi: chart.ascendant?.rashi_hi || null,
    nakshatra_en: chart.nakshatra?.en || null,
    dasha_lord:       currentDasha?.lord || null,
    dasha_end:        currentDasha?.end  || null,
    antardasha_lord:  currentAntardasha?.lord || null,
    antardasha_end:   currentAntardasha?.end  || null,
  };
}

// ── Chart calculation ─────────────────────────────────────────────────────────
async function calcAndSave(profile) {
  try {
    const rawDate = profile.date_of_birth;
    let dateStr;
    if (rawDate instanceof Date) {
      const tz = parseFloat(profile.timezone_offset) || 5.5;
      const adj = new Date(rawDate.getTime() + tz * 3600 * 1000);
      const Y = adj.getUTCFullYear();
      const M = String(adj.getUTCMonth() + 1).padStart(2, '0');
      const D = String(adj.getUTCDate()).padStart(2, '0');
      dateStr = `${Y}-${M}-${D}`;
    } else {
      dateStr = String(rawDate).slice(0, 10);
    }
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const [hr, mn, sc] = (profile.time_of_birth || '00:00:00').split(':').map(Number);
    const chart = calculateVedicChart({
      year: yr, month: mo, day: dy,
      hour: hr || 0, minute: mn || 0, second: sc || 0,
      timezone:  parseFloat(profile.timezone_offset) || 5.5,
      latitude:  parseFloat(profile.latitude),
      longitude: parseFloat(profile.longitude),
    });
    await db('kundli_profiles').where({ id: profile.id }).update({ calculated_data: JSON.stringify(chart) });
    return chart;
  } catch (e) {
    console.error('[AdminKundliCalc] Error:', e.message);
    return null;
  }
}

async function ensureCalculatedChart(profile) {
  const existing = parseJsonMaybe(profile.calculated_data);
  if (
    existing?.reports?.planet_details?.length &&
    existing?.reports?.varga_matrix?.rows?.length &&
    existing?.reports?.planet_assessments &&
    existing?.reports?.yoga_dasha_report &&
    existing?.reports?.event_timing?.windows?.length &&
    existing?.life_report?.sections &&
    existing?.varga_analysis?.d1?.role_en &&
    existing?.varga_analysis?.d60?.past_life_reading &&
    existing?.judgement?.version === 'judgement-priority-v2'
  ) return existing;
  return calcAndSave(profile);
}

// ── DB enrichment helpers ─────────────────────────────────────────────────────
async function fetchNakshatraInsight(nakNum) {
  if (!nakNum) return null;
  try {
    const row = await db('nakshatras').where({ id: nakNum })
      .select('name','name_hi','deity','deity_hi','guna','general_nature',
              'characteristics_en','characteristics_hi',
              'negative_traits_en','negative_traits_hi',
              'professions_en','professions_hi',
              'health_issues_en','health_issues_hi',
              'health_root_cause_en','health_root_cause_hi',
              'health_guidance_en','health_guidance_hi',
              ...regionalCols(['name','deity','characteristics','negative_traits','professions','health_issues','health_root_cause','health_guidance']))
      .first();
    if (!row) return null;
    ['professions_en','professions_hi', ...regionalCols(['professions'])].forEach((k) => {
      if (row[k] && typeof row[k] === 'string') {
        try { row[k] = JSON.parse(row[k]); } catch { row[k] = []; }
      }
    });
    return row;
  } catch { return null; }
}

async function fetchDashaRemedies(dashaLord, lagnaLord) {
  try {
    const planets   = [...new Set([dashaLord, lagnaLord].filter(Boolean))];
    const rows      = await db('remedy_planets').whereIn('planet', planets);
    const pujaSteps = await db('remedy_puja_steps').orderBy('sort_order');
    const parsed = rows.map((r) => {
      const parse = (v) => { try { return JSON.parse(v); } catch { return Array.isArray(v) ? v : []; } };
      const out = { ...r };
      for (const l of ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'pa', 'gu']) out[`mantras_${l}`] = parse(r[`mantras_${l}`]);
      return out;
    });
    return {
      dasha_planet: parsed.find((r) => r.planet === dashaLord) || null,
      lagna_planet: parsed.find((r) => r.planet === lagnaLord) || null,
      puja_sequence: pujaSteps,
    };
  } catch { return null; }
}

// Everything the designed PDF report needs beyond the chart itself
async function buildKundliReportExtras(chart, profile = null) {
  const curDasha = Array.isArray(chart?.dasha) ? chart.dasha.find((p) => p.is_current) || chart.dasha[0] : null;
  const [library, remedy, problems] = await Promise.all([
    fetchYogaDoshaLibrary(chart),
    fetchDashaRemedies(curDasha?.lord, chart?.ascendant?.rashi_lord),
    fetchProblemRemedies(),
  ]);
  return {
    asta_vakri:     await fetchAstaVakriAnalysis(chart),
    placement_narratives: buildPlacementNarratives(chart),
    strength:       computeKundliStrength(chart),
    life_guidance:  generateLifeGuidance(chart),
    favourite_days: computeFavouriteDays(chart),
    chara_karakas:  computeCharaKarakas(chart),
    sade_sati:      profile ? computeSadeSatiJourney(chart, profile) : null,
    dasha_journey:  computeDashaJourney(chart),
    numerology:     profile ? computeNumerology(profile) : null,
    yuti:           computeYutiAnalysis(chart),
    antar_narratives: computeAntardashaNarratives(chart),
    remedy_suite:   computeRemedySuite(chart),
    marriage_timing: computeMarriageTiming(chart),
    library,
    remedy,
    problems,
  };
}

// Today's personal prediction — generated once per day per kundli, persisted
// in the `predictions` table (type 'daily') so repeats are served from DB.
async function getOrCreateTodayPrediction(profile, chart) {
  const { v4: uuidv4 } = require('uuid');
  const { generateTodayPrediction } = require('./helpers/today-prediction');
  const now = new Date();

  const existing = await db('predictions')
    .where({ kundli_id: profile.id, type: 'daily' })
    .where('valid_until', '>=', now)
    .orderBy('id', 'desc')
    .first();
  if (existing) {
    if (typeof existing.meta === 'string') { try { existing.meta = JSON.parse(existing.meta); } catch { existing.meta = null; } }
    return { ...existing, from_cache: true };
  }

  const gen = generateTodayPrediction(chart, now);
  if (!gen) return null;

  const row = {
    uuid:        uuidv4(),
    kundli_id:   profile.id,
    user_id:     profile.user_id,
    type:        gen.type,
    title:       gen.title,
    content_en:  gen.content_en,
    content_hi:  gen.content_hi,
    meta:        JSON.stringify(gen.meta),
    valid_from:  gen.valid_from,
    valid_until: gen.valid_until,
  };
  const [id] = await db('predictions').insert(row);
  return { id, ...row, meta: gen.meta, from_cache: false };
}

// Stored prediction history for one kundli (admin log)
async function fetchPredictionHistory(kundliId, limit = 30) {
  const rows = await db('predictions')
    .where({ kundli_id: kundliId })
    .orderBy('id', 'desc')
    .limit(limit)
    .select('uuid', 'type', 'title', 'meta', 'valid_from', 'valid_until', 'created_at');
  return rows.map((r) => {
    let meta = r.meta;
    if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch { meta = null; } }
    return { ...r, meta };
  });
}

// Combustion & Retrogression analysis (Class 13 PDF — asta_vakri_library)
async function fetchAstaVakriAnalysis(chart) {
  if (!chart?.planets || !chart?.ascendant?.rashi_num) return null;
  try {
    const ascR = chart.ascendant.rashi_num;
    const houseOf = (p) => ((p.rashi_num - ascR + 12) % 12) + 1;
    const combustP = [], retroP = [];
    Object.entries(chart.planets).forEach(([name, p]) => {
      if (p.is_combust) combustP.push({ name, p });
      if (p.is_retrograde && !['Rahu', 'Ketu'].includes(name)) retroP.push({ name, p });
    });
    if (!combustP.length && !retroP.length) return { combust: [], retro: [], rules: [], misconceptions: [] };

    const rows = await db('asta_vakri_library').select('*');
    const parse = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
    const byCat = {};
    rows.forEach((r) => {
      r.effects_en = parse(r.effects_en); r.effects_hi = parse(r.effects_hi); r.extra_data = parse(r.extra_data);
      (byCat[r.category] = byCat[r.category] || {})[r.item_key] = r;
    });

    const BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
    const combust = combustP.map(({ name, p }) => ({
      planet: name, house: houseOf(p), rashi_en: p.rashi_en, rashi_hi: p.rashi_hi,
      level: p.combust_level || 'mild', sun_distance: p.sun_distance ?? null,
      also_retrograde: !!p.is_retrograde,
      planet_effects: byCat.combust_planet?.[name] || null,
      house_effect:   byCat.combust_house?.[`house_${houseOf(p)}`] || null,
      remedy:         byCat.remedy?.[name]?.extra_data || null,
    }));
    const retro = retroP.map(({ name, p }) => ({
      planet: name, house: houseOf(p), rashi_en: p.rashi_en, rashi_hi: p.rashi_hi,
      is_benefic: BENEFICS.includes(name),
      is_debilitated: /debil/i.test(p.dignity || ''),
      is_exalted: /exalt/i.test(p.dignity || ''),
      house_effect: byCat.retro_house?.[`house_${houseOf(p)}`] || null,
      remedy:       byCat.remedy?.[name]?.extra_data || null,
    }));
    return {
      combust, retro,
      retro_count: retro.length,
      rules: Object.values(byCat.retro_rule || {}).concat(Object.values(byCat.combust_rule || {})),
      special_remedies: [byCat.remedy?.combust_special, byCat.remedy?.retro_special].filter(Boolean),
      misconceptions: Object.values(byCat.misconception || {}),
      strength_ranks: Object.values(byCat.strength_rank || {}),
    };
  } catch (e) {
    console.error('[AstaVakri] Error:', e.message);
    return null;
  }
}

// Classical reference for detected yogas/doshas (Class 11 & 12 PDF library tables)
async function fetchYogaDoshaLibrary(chart) {
  const yd = chart?.yogas_doshas;
  if (!yd) return null;
  try {
    const yogaNames  = (yd.yogas  || []).map((y) => y.name).filter(Boolean);
    const doshaNames = (yd.doshas || []).map((d) => d.name).filter(Boolean);
    const fields = ['name','name_hi','category','definition_en','definition_hi','formation_en','formation_hi',
                    'symptoms_en','symptoms_hi','effects_en','effects_hi','source',
                    ...regionalCols(['name','definition','symptoms','effects'])];
    const [yogaRows, doshaRows] = await Promise.all([
      yogaNames.length  ? db('yogas_library').whereIn('name', yogaNames)
          .select([...fields, 'cancellation_en', 'cancellation_hi', ...regionalCols(['cancellation'])]) : [],
      doshaNames.length ? db('doshas_library').whereIn('name', doshaNames)
          .select([...fields, 'technical_note_en', 'technical_note_hi', ...regionalCols(['technical_note'])]) : [],
    ]);
    return {
      yogas:  Object.fromEntries(yogaRows.map((r) => [r.name, r])),
      doshas: Object.fromEntries(doshaRows.map((r) => [r.name, r])),
    };
  } catch (e) {
    console.error('[YogaDoshaLibrary] Error:', e.message);
    return null;
  }
}

// Problem-based remedies (Remedy Class 1 PDF — remedy_problems table)
async function fetchProblemRemedies() {
  try {
    const rows = await db('remedy_problems').orderBy('id');
    const parse = (v) => { try { return JSON.parse(v); } catch { return Array.isArray(v) ? v : []; } };
    return rows.map((r) => {
      const out = { ...r };
      for (const l of ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'pa', 'gu']) out[`mantras_${l}`] = parse(r[`mantras_${l}`]);
      return out;
    });
  } catch { return null; }
}

// Remedy Manual — Ishta Devata per planet + puja sequence + sadhana guidance (Remedy Class 1 PDF)
async function fetchRemedyManual() {
  try {
    const parseEd = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };

    const [planetRows, remedyLibRows, pujaSeq, sadhanaGuidance] = await Promise.all([
      db('planets').select(
        'name', 'name_hi',
        'ishta_devata_en', 'ishta_devata_hi',
        'primary_suktam_en', 'primary_suktam_hi',
        'gemstone', 'gemstone_hi'
      ).orderBy('id'),
      db('asta_vakri_library')
        .where({ category: 'remedy' })
        .whereNotIn('item_key', ['combust_special', 'retro_special'])
        .select('item_key', 'title_en', 'title_hi', 'extra_data'),
      db('asta_vakri_library').where({ category: 'puja_sequence' }).orderBy('sort_order').select('*'),
      db('asta_vakri_library').where({ category: 'sadhana_guidance' }).orderBy('sort_order').select('*'),
    ]);

    const remedyMap = Object.fromEntries(
      remedyLibRows.map((r) => [r.item_key, parseEd(r.extra_data)])
    );

    const planet_deities = planetRows.map((p) => {
      const lib = remedyMap[p.name] || {};
      return {
        name: p.name,
        name_hi: p.name_hi,
        ishta_devata_en: p.ishta_devata_en,
        ishta_devata_hi: p.ishta_devata_hi,
        primary_suktam_en: p.primary_suktam_en,
        primary_suktam_hi: p.primary_suktam_hi,
        gemstone: p.gemstone,
        gemstone_hi: p.gemstone_hi,
        beeja_mantra: lib.mantra || null,
        yantra: lib.yantra || null,
        daan_en: lib.daan_en || null,
        daan_hi: lib.daan_hi || null,
      };
    });

    return {
      planet_deities,
      puja_sequence: pujaSeq.map((r) => ({ ...r, extra_data: parseEd(r.extra_data) })),
      sadhana_guidance: sadhanaGuidance.map((r) => ({ ...r, extra_data: parseEd(r.extra_data) })),
    };
  } catch (e) {
    console.error('[RemedyManual] Error:', e.message);
    return null;
  }
}

async function fetchChartEnrichment(ascRashiNum, moonRashiNum) {
  try {
    const rashiIds = [...new Set([ascRashiNum, moonRashiNum].filter(Boolean))];
    const signs    = rashiIds.length
      ? await db('zodiac_signs').whereIn('id', rashiIds)
          .select('id','name','name_hi','key_traits_en','key_traits_hi','detailed_description_en','detailed_description_hi',
                  ...regionalCols(['name','key_traits','detailed_description']))
      : [];
    const signMap    = Object.fromEntries(signs.map((s) => [s.id, s]));
    const planetRows = await db('planets')
      .select('id','name','name_hi','guna','guna_hi','varna','varna_hi','court_role','court_role_hi','deity','deity_hi','characteristics','characteristics_hi',
              ...regionalCols(['name','guna','varna','court_role','deity','characteristics']));
    const planet_meta = Object.fromEntries(planetRows.map((p) => [p.name, p]));
    const houses_meta = await db('houses')
      .select('id','name','name_hi','keywords_en','keywords_hi','topics_en','topics_hi',
              'health_organs_en','health_organs_hi','detailed_notes_en','detailed_notes_hi',
              'bhava_type','bhava_groups','bhava_nature_en','bhava_nature_hi',
              'is_kendra','is_trikona','is_dusthana','is_upachaya','is_maarak',
              ...regionalCols(['name','keywords','topics','health_organs','detailed_notes','bhava_nature']))
      .orderBy('id');
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
    console.error('[AdminChartEnrichment] Error:', e.message);
    return null;
  }
}

async function fetchBhavaLordReadings(chart) {
  if (!chart?.ascendant?.rashi_num || !chart?.planets) return null;
  try {
    const lagnaRashi = chart.ascendant.rashi_num;
    const planetHouse = {};
    for (const [pName, pData] of Object.entries(chart.planets)) {
      if (pData?.rashi_num) planetHouse[pName] = ((pData.rashi_num - lagnaRashi + 12) % 12) + 1;
    }
    const lookups = [];
    for (let h = 1; h <= 12; h++) {
      const houseSign = ((lagnaRashi + h - 2) % 12) + 1;
      const lordPlanet = RASHI_LORD[houseSign];
      const placedIn   = planetHouse[lordPlanet] || null;
      if (placedIn) lookups.push({ house_lord: h, placed_in_house: placedIn, lord_planet: lordPlanet });
    }
    if (!lookups.length) return [];
    const pairs = lookups.map((l) => [l.house_lord, l.placed_in_house]);
    const rows  = await db('house_lord_interpretations')
      .where(function () { pairs.forEach(([hl, ph]) => this.orWhere({ house_lord: hl, placed_in_house: ph })); })
      .select('house_lord','placed_in_house','title','title_hi','lord_name_en','lord_name_hi',
              'house_signification_en','house_signification_hi','interpretation_en','interpretation_hi',
              'overall_effect','forms_viparita_yoga');
    const rowMap = Object.fromEntries(rows.map((r) => [`${r.house_lord}_${r.placed_in_house}`, r]));
    return lookups.map((l) => {
      const row = rowMap[`${l.house_lord}_${l.placed_in_house}`] || {};
      return {
        house_number: l.house_lord, lord_planet: l.lord_planet, placed_in_house: l.placed_in_house,
        title_en: row.title || `${l.house_lord}th Lord in ${l.placed_in_house}th House`,
        title_hi: row.title_hi || null,
        lord_name_en: row.lord_name_en || null, lord_name_hi: row.lord_name_hi || null,
        house_signification_en: row.house_signification_en || null,
        house_signification_hi: row.house_signification_hi || null,
        interpretation_en: row.interpretation_en || null,
        interpretation_hi: row.interpretation_hi || null,
        overall_effect: row.overall_effect || 'neutral',
        forms_viparita_yoga: row.forms_viparita_yoga || false,
      };
    });
  } catch (e) {
    console.error('[AdminBhavaLordReadings] Error:', e.message);
    return null;
  }
}

// ── Master: fetch fully enriched profile (no ownership check) ─────────────────
async function buildFullKundliResponse(uuid) {
  const profile = await db('kundli_profiles').where({ uuid }).first();
  if (!profile) return null;

  const chart = await ensureCalculatedChart(profile);
  if (!chart) return null;
  profile.calculated_data = chart;

  const nakNum        = chart?.nakshatra?.num;
  const currentDasha  = Array.isArray(chart?.dasha) ? chart.dasha.find((d) => d.is_current) || chart.dasha[0] : null;

  const [nakshatra_insight, remedy_data, chart_enrichment, bhava_lord_readings, yoga_dosha_library, problem_remedies, remedy_manual] = await Promise.all([
    fetchNakshatraInsight(nakNum),
    fetchDashaRemedies(currentDasha?.lord, chart?.ascendant?.rashi_lord),
    fetchChartEnrichment(chart?.ascendant?.rashi_num, chart?.planets?.Moon?.rashi_num),
    fetchBhavaLordReadings(chart),
    fetchYogaDoshaLibrary(chart),
    fetchProblemRemedies(),
    fetchRemedyManual(),
  ]);

  profile.nakshatra_insight  = nakshatra_insight;
  profile.remedy_data        = remedy_data;
  if (profile.remedy_data && problem_remedies) profile.remedy_data.problems = problem_remedies;
  profile.remedy_manual      = remedy_manual;
  profile.chart_enrichment   = chart_enrichment;
  profile.bhava_lord_readings = bhava_lord_readings;
  profile.yoga_dosha_library = yoga_dosha_library;
  profile.life_guidance      = generateLifeGuidance(chart);
  profile.favourite_days     = computeFavouriteDays(chart);
  profile.chara_karakas      = computeCharaKarakas(chart);
  profile.sade_sati_journey  = computeSadeSatiJourney(chart, profile);
  profile.yuti_analysis      = computeYutiAnalysis(chart);
  profile.marriage_timing    = computeMarriageTiming(chart);
  profile.dasha_journey      = computeDashaJourney(chart);
  profile.antar_narratives   = computeAntardashaNarratives(chart);
  profile.life_report_narratives = require('./helpers/life-report-narrative').buildLifeReportNarratives(chart, profile.bhava_lord_readings);
  profile.placement_narratives   = buildPlacementNarratives(chart);
  profile.asta_vakri         = await fetchAstaVakriAnalysis(chart);
  if (profile.remedy_data) profile.remedy_data.suite = computeRemedySuite(chart);
  profile.judgement = generateJudgement(chart, {
    date_of_birth:profile.date_of_birth,
    gender:profile.gender,
    marital_status:profile.marital_status,
  }, { lang: 'hi', admin: true });
  profile.life_report_friendly = composeLifeReportUserFriendly(chart, chart.life_report, profile.judgement, {});
  profile.personalized_remedies = generatePersonalizedRemedies(chart, { remedyManual: remedy_manual });

  // Attach owning user info
  const owner = await db('users').where({ id: profile.user_id })
    .select('id','name','email','role','is_active').first();
  profile.owner = owner || null;

  return profile;
}

module.exports = {
  parseJsonMaybe,
  buildKundliListSummary,
  fetchYogaDoshaLibrary,
  fetchProblemRemedies,
  fetchRemedyManual,
  getOrCreateTodayPrediction,
  fetchPredictionHistory,
  buildKundliReportExtras,
  fetchAstaVakriAnalysis,
  calcAndSave,
  ensureCalculatedChart,
  buildFullKundliResponse,
  generateVarshphal,
  compactVarshphal,
  computeKundliStrength,
};
