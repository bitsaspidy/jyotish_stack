'use strict';
/**
 * Shared kundli helpers for the admin panel.
 * Mirrors the private helpers in kundli.routes.js but is independently
 * importable — avoids mounting the user router inside admin routes.
 */
const db = require('../config/db');
const { calculateVedicChart }   = require('./vedic-calc.service');
const { generateLifeGuidance }  = require('./helpers/life-guidance');
const { generateVarshphal, compactVarshphal } = require('./helpers/varshphal');
const { computeKundliStrength } = require('./helpers/kundli-strength');

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
    existing?.varga_analysis?.d60?.past_life_reading
  ) return existing;
  return calcAndSave(profile);
}

// ── DB enrichment helpers ─────────────────────────────────────────────────────
async function fetchNakshatraInsight(nakNum) {
  if (!nakNum) return null;
  try {
    const row = await db('nakshatras').where({ id: nakNum })
      .select('name','name_hi','deity_en','deity_hi','guna','general_nature',
              'characteristics_en','characteristics_hi',
              'negative_traits_en','negative_traits_hi',
              'professions_en','professions_hi',
              'health_issues_en','health_issues_hi',
              'health_root_cause_en','health_root_cause_hi',
              'health_guidance_en','health_guidance_hi')
      .first();
    if (!row) return null;
    ['professions_en','professions_hi'].forEach((k) => {
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
      const parse = (v) => { try { return JSON.parse(v); } catch { return []; } };
      return { ...r, mantras_en: parse(r.mantras_en), mantras_hi: parse(r.mantras_hi) };
    });
    return {
      dasha_planet: parsed.find((r) => r.planet === dashaLord) || null,
      lagna_planet: parsed.find((r) => r.planet === lagnaLord) || null,
      puja_sequence: pujaSteps,
    };
  } catch { return null; }
}

async function fetchChartEnrichment(ascRashiNum, moonRashiNum) {
  try {
    const rashiIds = [...new Set([ascRashiNum, moonRashiNum].filter(Boolean))];
    const signs    = rashiIds.length
      ? await db('zodiac_signs').whereIn('id', rashiIds)
          .select('id','name','name_hi','key_traits_en','key_traits_hi','detailed_description_en','detailed_description_hi')
      : [];
    const signMap    = Object.fromEntries(signs.map((s) => [s.id, s]));
    const planetRows = await db('planets')
      .select('id','name','name_hi','guna','guna_hi','varna','varna_hi','court_role','court_role_hi','deity','deity_hi','characteristics');
    const planet_meta = Object.fromEntries(planetRows.map((p) => [p.name, p]));
    const houses_meta = await db('houses')
      .select('id','name','name_hi','keywords_en','keywords_hi','topics_en','topics_hi',
              'health_organs_en','health_organs_hi','detailed_notes_en','detailed_notes_hi',
              'bhava_type','bhava_groups','bhava_nature_en','bhava_nature_hi',
              'is_kendra','is_trikona','is_dusthana','is_upachaya','is_maarak')
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

  const [nakshatra_insight, remedy_data, chart_enrichment, bhava_lord_readings] = await Promise.all([
    fetchNakshatraInsight(nakNum),
    fetchDashaRemedies(currentDasha?.lord, chart?.ascendant?.rashi_lord),
    fetchChartEnrichment(chart?.ascendant?.rashi_num, chart?.planets?.Moon?.rashi_num),
    fetchBhavaLordReadings(chart),
  ]);

  profile.nakshatra_insight  = nakshatra_insight;
  profile.remedy_data        = remedy_data;
  profile.chart_enrichment   = chart_enrichment;
  profile.bhava_lord_readings = bhava_lord_readings;
  profile.life_guidance      = generateLifeGuidance(chart);

  // Attach owning user info
  const owner = await db('users').where({ id: profile.user_id })
    .select('id','name','email','role','is_active').first();
  profile.owner = owner || null;

  return profile;
}

module.exports = {
  parseJsonMaybe,
  buildKundliListSummary,
  calcAndSave,
  ensureCalculatedChart,
  buildFullKundliResponse,
  generateVarshphal,
  compactVarshphal,
  computeKundliStrength,
};
