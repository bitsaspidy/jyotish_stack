'use strict';
/**
 * Data-completeness evaluator (Phase 3, component 5).
 *
 * Deterministically reports what a question needs, what is available, what is
 * missing (required vs optional enhancers), a 0-100 completeness score, whether
 * the answer should block or degrade, and a suggested confidence level.
 *
 * Optional enhancers are NEVER treated as required unless a question explicitly
 * requires them. The admin/debug block distinguishes:
 *   - classical Shadbala: unavailable (not computed in this stack)
 *   - real Ashtakavarga: unavailable (only an affliction heuristic exists)
 *   - custom strength proxy: available (kundli-strength.js)
 */

const cfg = require('../../config/deterministic-qa.config');

// These capabilities are stack-wide facts, surfaced honestly to admins.
const ENHANCER_STATUS = Object.freeze({
  classical_shadbala: 'unavailable',
  real_ashtakavarga: 'unavailable',
  custom_strength_proxy: 'available',
});

function frac(available, total) { return total === 0 ? 1 : available / total; }

/**
 * @param {object} args
 * @param {object} args.requirement normalized requirement spec
 * @param {object} args.loaded      result of kundli-data-loader (selected + chartLoad)
 * @param {string} [args.minDataPolicy] 'lenient' | 'strict' (from the catalogue row)
 * @param {object} [args.transit]   dated-transit result (for transit-needing questions)
 */
function evaluate({ requirement, loaded, minDataPolicy = 'lenient', transit = null }) {
  const w = cfg.COMPLETENESS.weights;
  const chart = loaded.chart;
  const sel = loaded.selected;
  const chartLoad = loaded.chartLoad;

  // ── required_fields ──
  const reqFields = requirement.required_fields || [];
  const fieldPresent = reqFields.filter((f) => chart && chart[f] != null
    && (!Array.isArray(chart[f]) || chart[f].length));
  const missingFields = reqFields.filter((f) => !fieldPresent.includes(f));

  // ── charts ── (fallbacks count as HALF; missing count as 0)
  const reqCharts = requirement.divisional_charts || [];
  const availCharts = Object.keys(chartLoad.available).filter((s) => reqCharts.includes(s)).length;
  const fbCharts = chartLoad.fallbacks.length;
  const chartScore = reqCharts.length ? (availCharts + 0.5 * fbCharts) / reqCharts.length : 1;

  // ── dasha ──
  const reqDasha = requirement.dasha_levels || [];
  const availDasha = reqDasha.filter((lvl) => sel.dasha.available[lvl] != null).length;

  // ── planets ──
  const reqPlanets = requirement.planets || [];
  const availPlanets = reqPlanets.filter((p) => sel.planets[p] != null).length;

  // ── houses ── (derivable whenever ascendant present)
  const reqHouses = requirement.houses || [];
  const housesOk = chart && chart.ascendant && chart.ascendant.rashi_num;
  const availHouses = housesOk ? reqHouses.length : 0;

  // transit requirement (dated) counts within charts-availability spirit but is
  // reported separately as a required input when needs_dated_transit is set.
  const transitRequired = !!requirement.needs_dated_transit;
  const transitAvailable = transitRequired ? !!(transit && transit.available) : true;

  const completeness = Math.round(100 * (
    w.required_fields * frac(fieldPresent.length, reqFields.length) +
    w.charts          * chartScore +
    w.dasha           * frac(availDasha, reqDasha.length) +
    w.planets         * frac(availPlanets, reqPlanets.length) +
    w.houses          * frac(availHouses, reqHouses.length)
  ));

  // ── missing lists ──
  const missingRequired = [];
  for (const f of missingFields) missingRequired.push(`field:${f}`);
  for (const s of chartLoad.missing) missingRequired.push(`chart:${s}`);
  for (const lvl of reqDasha) if (sel.dasha.available[lvl] == null) missingRequired.push(`dasha:${lvl}`);
  for (const p of reqPlanets) if (sel.planets[p] == null) missingRequired.push(`planet:${p}`);
  if (transitRequired && !transitAvailable) missingRequired.push('transit:dated');

  // optional enhancers the question WANTS but that aren't available
  const missingEnhancers = [];
  if (requirement.shadbala_enhances) missingEnhancers.push('classical_shadbala');
  if (requirement.ashtakavarga_enhances) missingEnhancers.push('real_ashtakavarga');

  // ── block / degrade decision ──
  const behaviour = requirement.missing_data_behaviour || 'degrade';
  const threshold = minDataPolicy === 'strict' ? cfg.COMPLETENESS.strictBlockBelow : cfg.COMPLETENESS.blockBelow;
  // Required inputs that are genuinely absent (not optional enhancers). Missing
  // natal fields are catastrophic; missing required charts / dated-transit are
  // material but respect the question's block-vs-degrade behaviour.
  const missingRequiredCharts = chartLoad.missing.length > 0;
  const materialMissing = missingRequiredCharts || (transitRequired && !transitAvailable);
  let decision = 'answer';
  if (missingFields.length > 0) {
    decision = 'block';                                   // cannot answer without natal fundamentals
  } else if (behaviour === 'block' && (materialMissing || completeness < threshold)) {
    decision = 'block';                                   // block-question with material gaps
  } else if (materialMissing || completeness < 100) {
    decision = 'degrade';                                 // answer, but flagged as not fully complete
  }

  // ── suggested confidence (completeness-driven; state engine may lower it) ──
  let suggestedConfidence = 'low';
  if (completeness >= cfg.CONFIDENCE.highMinCompleteness) suggestedConfidence = 'high';
  else if (completeness >= cfg.CONFIDENCE.mediumMinCompleteness) suggestedConfidence = 'medium';

  return {
    version: cfg.COMPLETENESS.version,
    required: {
      fields: reqFields, charts: reqCharts, dasha_levels: reqDasha,
      planets: reqPlanets, houses: reqHouses, dated_transit: transitRequired,
    },
    available: {
      fields: fieldPresent, charts: Object.keys(chartLoad.available),
      fallback_charts: chartLoad.fallbacks.map((f) => f.requested),
      dasha_levels: reqDasha.filter((l) => sel.dasha.available[l] != null),
      planets: reqPlanets.filter((p) => sel.planets[p] != null),
      houses: availHouses, dated_transit: transitAvailable,
    },
    missing_required: missingRequired,
    missing_optional_enhancers: missingEnhancers,
    data_completeness: Math.max(0, Math.min(100, completeness)),
    decision,                         // answer | degrade | block
    suggested_confidence: suggestedConfidence,
    enhancers: ENHANCER_STATUS,
  };
}

module.exports = { evaluate, ENHANCER_STATUS };
