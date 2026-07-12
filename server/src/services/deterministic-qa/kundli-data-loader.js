'use strict';
/**
 * Ownership-safe, selective Kundli data loader (Phase 3, component 3).
 *
 * Reuses the SAME ownership rule the rest of the API uses
 * (kundli_profiles WHERE uuid = ? AND user_id = ?), and then loads ONLY the
 * slices a question needs — the requested planets, houses, house-lords, the
 * requested divisional charts (via the selective chart loader) and the requested
 * Dasha levels. It deliberately does NOT build the heavy enriched profile that
 * GET /api/kundli/:id assembles (bhava-lord readings, remedies, life guidance …)
 * so an answer never loads the full payload unnecessarily.
 *
 * Reasons returned on failure (mapped to HTTP by the caller):
 *   unauthenticated | invalid_id | not_found | forbidden | not_calculated
 */

const defaultDb = require('../../config/db');
const chartLoader = require('./selective-chart-loader');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RASHI_LORD = ['', 'Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

function parseChart(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

// A cached natal chart is "valid enough" for the deterministic engine if it has
// the natal fundamentals every pilot question relies on.
function chartIsUsable(chart) {
  return !!(chart && chart.ascendant && chart.ascendant.rashi_num
    && chart.planets && chart.planets.Moon && Array.isArray(chart.dasha));
}

function houseOfSign(ascNum, signNum) { return ((signNum - ascNum + 12) % 12) + 1; }

// ── Selective extractors ─────────────────────────────────────────────────────
function extractPlanets(chart, wanted) {
  const ascNum = chart.ascendant.rashi_num;
  const out = {};
  for (const name of wanted) {
    const pd = chart.planets[name];
    if (!pd) { out[name] = null; continue; }
    out[name] = {
      name,
      rashi_num: pd.rashi_num,
      house: pd.house || (pd.rashi_num ? houseOfSign(ascNum, pd.rashi_num) : null),
      dignity: pd.dignity || null,
      is_retrograde: !!pd.is_retrograde,
      is_combust: !!pd.is_combust,
      combust_level: pd.combust_level || null,
      nakshatra_num: pd.nakshatra_num || null,
    };
  }
  return out;
}

function extractHouses(chart, wanted) {
  const ascNum = chart.ascendant.rashi_num;
  // occupants per house
  const occupants = {};
  for (const [name, pd] of Object.entries(chart.planets || {})) {
    if (!pd || !pd.rashi_num) continue;
    const h = pd.house || houseOfSign(ascNum, pd.rashi_num);
    (occupants[h] = occupants[h] || []).push(name);
  }
  const out = {};
  for (const h of wanted) {
    const signNum = ((ascNum - 1 + h - 1) % 12) + 1;
    out[h] = { house: h, sign_num: signNum, sign_lord: RASHI_LORD[signNum], occupants: occupants[h] || [] };
  }
  return out;
}

function extractHouseLords(chart, wantedLordHouses) {
  const ascNum = chart.ascendant.rashi_num;
  const planetHouse = {};
  for (const [name, pd] of Object.entries(chart.planets || {})) {
    if (pd && pd.rashi_num) planetHouse[name] = pd.house || houseOfSign(ascNum, pd.rashi_num);
  }
  const out = {};
  for (const h of wantedLordHouses) {
    const signNum = ((ascNum - 1 + h - 1) % 12) + 1;
    const lord = RASHI_LORD[signNum];
    out[h] = { house: h, lord, placed_in_house: planetHouse[lord] || null };
  }
  return out;
}

function extractDasha(chart, wantedLevels) {
  const levels = new Set(wantedLevels);
  const maha = (chart.dasha || []).find((d) => d.is_current) || null;
  const antar = maha && Array.isArray(maha.antardasha)
    ? (maha.antardasha.find((a) => a.is_current) || null) : null;
  const pratyantar = antar && Array.isArray(antar.pratyantardasha)
    ? (antar.pratyantardasha.find((p) => p.is_current) || null) : null;
  const out = { requested: [...wantedLevels], available: {} };
  if (levels.has('maha'))  out.available.maha  = maha  ? { lord: maha.lord, end: maha.end } : null;
  if (levels.has('antar')) out.available.antar = antar ? { lord: antar.lord, end: antar.end } : null;
  if (levels.has('pratyantar')) out.available.pratyantar = pratyantar ? { lord: pratyantar.lord, end: pratyantar.end } : null;
  return out;
}

/**
 * @param {object} args
 * @param {string} args.uuid       kundli uuid
 * @param {number} args.userId     authenticated user id (falsy → unauthenticated)
 * @param {object} args.requirement normalized requirement spec (from requirement-loader)
 * @param {object} [args.deps]     { db, ensureChart } — injectable for tests
 * @returns {Promise<{ok:boolean, reason?:string, profile?, chart?, selected?, chartLoad?}>}
 */
async function loadKundliForQuestion({ uuid, userId, requirement, deps = {} }) {
  const db = deps.db || defaultDb;

  if (!userId) return { ok: false, reason: 'unauthenticated' };
  if (typeof uuid !== 'string' || !UUID_RE.test(uuid)) return { ok: false, reason: 'invalid_id' };

  const profile = await db('kundli_profiles')
    .where({ uuid, user_id: userId })
    .select('id', 'uuid', 'user_id', 'name', 'gender', 'marital_status', 'date_of_birth', 'calculated_data')
    .first();

  if (!profile) {
    // Classify cross-user vs non-existent for the internal trace only (the caller
    // maps BOTH to a 404 so existence is never leaked to the end user).
    const exists = await db('kundli_profiles').where({ uuid }).select('id').first();
    return { ok: false, reason: exists ? 'forbidden' : 'not_found' };
  }

  // Reuse cached calculated natal data when valid; optionally let the caller
  // supply a recompute function (route passes ensureCalculatedChart).
  let chart = parseChart(profile.calculated_data);
  if (!chartIsUsable(chart) && typeof deps.ensureChart === 'function') {
    chart = await deps.ensureChart(profile);
  }
  if (!chartIsUsable(chart)) return { ok: false, reason: 'not_calculated', profile: { uuid: profile.uuid, name: profile.name } };

  // Selective slices — only what the requirement asks for.
  const selected = {
    planets: extractPlanets(chart, requirement.planets || []),
    houses: extractHouses(chart, requirement.houses || []),
    house_lords: extractHouseLords(chart, requirement.house_lords || []),
    dasha: extractDasha(chart, requirement.dasha_levels || []),
  };
  const chartLoad = chartLoader.loadCharts(chart, requirement.divisional_charts || []);

  return {
    ok: true,
    profile: { id: profile.id, uuid: profile.uuid, name: profile.name, gender: profile.gender, marital_status: profile.marital_status },
    chart,
    selected,
    chartLoad,
  };
}

module.exports = { loadKundliForQuestion, chartIsUsable, UUID_RE };
