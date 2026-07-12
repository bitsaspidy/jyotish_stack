'use strict';
/**
 * Dated-transit evaluator — pilot scope (Phase 3, approved).
 *
 * SLOW planets only (Jupiter, Saturn, Rahu, Ketu), evaluated from natal Lagna AND
 * natal Moon. For each, it reports the current transit sign, the start/end dates
 * of that sign window (located by a coarse scan refined with bisection), the
 * house from Lagna and from Moon, whether it is relevant to the selected
 * question's houses, a supportive / mixed / caution classification, and whether
 * the transiting planet coincides with the current Mahadasha / Antardasha lord.
 *
 * It NEVER produces guaranteed event dates — a window is the span a slow planet
 * occupies a sign, framed as a period of emphasis, not a dated event.
 */

const eph = require('../ephemeris.service');
const { siderealLongitudeForPlanet, rashiFromDeg, houseFromSign } = require('../helpers/core-helpers');
const cfg = require('../../config/deterministic-qa.config');

const DAY_MS = 24 * 3600 * 1000;

function jdFor(date) {
  return eph.julianDay(
    date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(),
  );
}
function signNumAt(planet, date) {
  return rashiFromDeg(siderealLongitudeForPlanet(planet, jdFor(date))).num;
}
function fmt(date) { return date ? date.toISOString().slice(0, 10) : null; }

// Bisect between a date known to be IN `sign` and one known to be OUT, to ~1 day.
function refineBoundary(planet, sign, inside, outside) {
  let lo = inside.getTime(), hi = outside.getTime();
  while (Math.abs(hi - lo) > DAY_MS) {
    const mid = new Date((lo + hi) / 2);
    if (signNumAt(planet, mid) === sign) lo = mid.getTime();
    else hi = mid.getTime();
  }
  // boundary = midpoint of the last 1-day bracket
  return new Date((lo + hi) / 2);
}

// Find the contiguous sign window around `atDate` for `planet`.
function signWindow(planet, atDate) {
  const sign = signNumAt(planet, atDate);
  const step = cfg.DATED_TRANSIT.sampleStepDays * DAY_MS;

  // scan backward for entry
  let start = null, prev = atDate;
  const backLimit = atDate.getTime() - cfg.DATED_TRANSIT.lookbackDays * DAY_MS;
  for (let t = atDate.getTime() - step; t >= backLimit; t -= step) {
    const d = new Date(t);
    if (signNumAt(planet, d) !== sign) { start = refineBoundary(planet, sign, prev, d); break; }
    prev = d;
  }
  // scan forward for exit
  let end = null; prev = atDate;
  const fwdLimit = atDate.getTime() + cfg.DATED_TRANSIT.lookaheadDays * DAY_MS;
  for (let t = atDate.getTime() + step; t <= fwdLimit; t += step) {
    const d = new Date(t);
    if (signNumAt(planet, d) !== sign) { end = refineBoundary(planet, sign, prev, d); break; }
    prev = d;
  }
  return { sign, start, end, open_start: !start, open_end: !end };
}

function classify(planet, houseFromLagna, houseFromMoon) {
  const sup = cfg.DATED_TRANSIT.supportiveHouses[planet] || [];
  const cau = cfg.DATED_TRANSIT.cautionHouses[planet] || [];
  // Transit doctrine is classically read from the Moon; we weight Moon but also
  // consider Lagna. Supportive from Moon → supportive; caution from Moon → caution;
  // disagreement between the two frames → mixed.
  const moonSup = sup.includes(houseFromMoon);
  const moonCau = cau.includes(houseFromMoon);
  const lagSup = sup.includes(houseFromLagna);
  if (moonSup && !moonCau) return lagSup ? 'supportive' : 'mixed';
  if (moonCau && !moonSup) return 'caution';
  return 'mixed';
}

function currentDashaLords(chart) {
  const maha = (chart.dasha || []).find((d) => d.is_current) || null;
  const antar = maha && Array.isArray(maha.antardasha) ? (maha.antardasha.find((a) => a.is_current) || null) : null;
  return { maha: maha ? maha.lord : null, antar: antar ? antar.lord : null };
}

/**
 * @param {object} args
 * @param {object} args.chart       natal chart (needs ascendant + planets.Moon + dasha)
 * @param {Date}   [args.atDate]    evaluation date (default now)
 * @param {number[]} [args.relevantHouses] houses the question cares about
 * @param {string[]} [args.planets] override slow-planet set (defaults to config)
 * @returns { calc_version, transit_version, as_of, transits:[...], summary }
 */
function evaluateDatedTransits({ chart, atDate = new Date(), relevantHouses = [], planets } = {}) {
  if (!chart || !chart.ascendant || !chart.planets || !chart.planets.Moon) {
    return { available: false, reason: 'missing_natal_reference' };
  }
  const ascNum = chart.ascendant.rashi_num;
  const moonNum = chart.planets.Moon.rashi_num;
  const dashaLords = currentDashaLords(chart);
  const relevant = new Set(relevantHouses);
  const list = planets || cfg.DATED_TRANSIT.planets;

  const transits = list.map((planet) => {
    const win = signWindow(planet, atDate);
    const rashi = rashiFromDeg(siderealLongitudeForPlanet(planet, jdFor(atDate)));
    const houseFromLagna = houseFromSign(ascNum, win.sign);
    const houseFromMoon = houseFromSign(moonNum, win.sign);
    const classification = classify(planet, houseFromLagna, houseFromMoon);
    const relevantHouseHits = [houseFromLagna, houseFromMoon].filter((h) => relevant.has(h));
    return {
      planet,
      transit_sign_num: win.sign,
      transit_sign_en: rashi.en,
      transit_sign_hi: rashi.hi,
      transit_start: fmt(win.start),
      transit_end: fmt(win.end),
      window_open_start: win.open_start,
      window_open_end: win.open_end,
      house_from_lagna: houseFromLagna,
      house_from_moon: houseFromMoon,
      classification,                                  // supportive | mixed | caution
      relevant_to_question: relevantHouseHits.length > 0,
      relevant_houses_matched: relevantHouseHits,
      overlaps_mahadasha: dashaLords.maha === planet,
      overlaps_antardasha: dashaLords.antar === planet,
    };
  });

  // summary — the most relevant transit drives the timing evidence
  const relevantTransits = transits.filter((t) => t.relevant_to_question);
  const scope = relevantTransits.length ? relevantTransits : transits;
  const supportive = scope.filter((t) => t.classification === 'supportive').length;
  const caution = scope.filter((t) => t.classification === 'caution').length;
  let overall = 'mixed';
  if (supportive > caution) overall = 'supportive';
  else if (caution > supportive) overall = 'caution';

  return {
    available: true,
    calc_version: cfg.DATED_TRANSIT.calc_version,
    transit_version: cfg.DATED_TRANSIT.version,
    as_of: fmt(atDate),
    dasha_lords: dashaLords,
    transits,
    summary: { overall, supportive_count: supportive, caution_count: caution, relevant_count: relevantTransits.length },
  };
}

module.exports = { evaluateDatedTransits, signWindow, _signNumAt: signNumAt };
