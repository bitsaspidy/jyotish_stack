'use strict';
/**
 * Human-friendly Life Guidance report engine.
 *
 * Pipeline:  chart ─▶ buildContext (raw layer)
 *                  ─▶ aggregate (group + score + resolve conflicts)
 *                  ─▶ compose (clean Hindi/Hinglish sections)
 *                  ─▶ report { summary, sections, meta, (debug if admin) }
 *
 * Normal users get only soft Hindi text + a status label per area.
 * Admin mode (`{ admin: true }`) additionally returns the technical breakdown
 * (houses, planets, dignities, dasha lords, rule IDs, hidden 1-5 scores).
 */
const L = require('./lexicon');
const { buildContext } = require('./rules');
const { aggregate } = require('./aggregator');
const C = require('./composer');

function buildDebug(ctx, areas) {
  const planets = {};
  for (const name of Object.keys(ctx.planets)) {
    planets[name] = { sign: ctx.planets[name]?.rashi_num, house: ctx.houseOf(name), dignity: ctx.dignity(name) };
  }
  return {
    lagna: { num: ctx.lagna, sign: L.SIGN[ctx.lagna]?.en },
    lagna_lord: { planet: ctx.lagnaLord, house: ctx.lagnaLordHouse },
    moon: { sign: ctx.moonSign, nakshatra: ctx.moonNak },
    dasha: { maha: ctx.dasha, antar: ctx.antar },
    yogas: ctx.yogaNames,
    areas: Object.values(areas).map((a) => ({
      area: a.area, score: Math.round(a.score * 100) / 100, label: a.label, rule_ids: a.rule_ids,
    })),
  };
}

/**
 * Full natal life-guidance report.
 * @param {object} chart - kundli_profiles.calculated_data
 * @param {object} [opts] - { admin: boolean }
 */
function generateLifeReport(chart, opts = {}) {
  const ctx = buildContext(chart || {});
  const areas = aggregate(ctx);

  const sections = [];
  for (const key of L.REPORT_ORDER) {
    if (key === 'dasha') sections.push(C.composeDasha(ctx));
    else if (key === 'yogas') sections.push(C.composeYogas(ctx));
    else if (key === 'remedies') sections.push(C.composeRemedies(ctx, areas));
    else sections.push(C.composeArea(key, areas[key]));
  }

  const report = {
    summary: { heading: L.AREA_LABEL.summary, lines: C.composeSummary(ctx, areas) },
    sections,
    meta: {
      lagna_hi: L.SIGN[ctx.lagna]?.hi,
      moon_hi: L.SIGN[ctx.moonSign]?.hi || null,
      moon_nakshatra_hi: ctx.moonNak ? L.NAKSHATRA_HI[ctx.moonNak] : null,
      dasha_hi: ctx.dasha ? L.PLANET[ctx.dasha]?.hi : null,
      antar_hi: ctx.antar ? L.PLANET[ctx.antar]?.hi : null,
      generated_at: new Date().toISOString(),
    },
  };
  if (opts.admin) report.debug = buildDebug(ctx, areas);
  return report;
}

/**
 * Section 14 — daily guidance, humanized from the existing today-prediction.
 * Kept decoupled: the daily transit pipeline stays in today-prediction.js;
 * this only re-presents its output in clean Hindi.
 */
function generateDailyGuidance(chart, atDate = new Date(), opts = {}) {
  const ctx = buildContext(chart || {});
  let prediction = null;
  try {
    // lazy require to avoid a hard dependency when only the life report is used
    const { generateTodayPrediction } = require('../helpers/today-prediction');
    prediction = generateTodayPrediction(chart, atDate);
  } catch (_) { prediction = null; }

  const daily = C.composeDaily(prediction, ctx);
  const out = { heading: L.AREA_LABEL.daily, ...daily };
  if (opts.admin) out.debug = { dasha: { maha: ctx.dasha, antar: ctx.antar }, tara: prediction?.meta?.tara?.name || null };
  return out;
}

module.exports = { generateLifeReport, generateDailyGuidance, buildContext };
