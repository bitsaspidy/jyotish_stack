'use strict';
/**
 * Divisional-chart meaning — what the Varga actually contributes.
 *
 * "D10 (favourable) confirms this analysis" is not an explanation; it is a
 * restatement wearing a chart name. A divisional chart earns its place in an
 * answer only by adding something the birth chart did not already say — D2 speaks
 * to how resources accumulate rather than whether they are earned; D4 to whether
 * ownership settles cleanly; D30 to vulnerability and recovery. That contribution
 * is specific to (chart, domain), so the key is too.
 *
 * Keys resolve against answer_shared_blocks; nothing is written in code:
 *   varga.d2.finance.supports
 *   varga.d30.health.challenges
 *   varga.d4.property.mixed
 *
 * D1 is excluded on purpose — it is the birth chart, already covered by the
 * kundli_indicates section. Repeating it here is the duplication we are removing.
 */

// A divisional signal must clear this to count as agreeing/disagreeing rather
// than simply being present. Matches the threshold the composer already used.
const SIGNAL_AT = 10;

function vargaPolarity(score) {
  if (score > SIGNAL_AT) return 'supports';
  if (score < -SIGNAL_AT) return 'challenges';
  return 'mixed';
}

/**
 * Key chain for one chart in one life area, most specific first.
 * The `.general` fallback keeps an unseeded (chart, domain) pair renderable — it
 * still says what the chart governs, just not domain-tuned.
 */
function vargaMeaningKeys(chart, domain, polarity) {
  const c = String(chart || '').toLowerCase();
  if (!c) return [];
  const keys = [];
  if (domain) keys.push(`varga.${c}.${domain}.${polarity}`);
  keys.push(`varga.${c}.general.${polarity}`);
  return keys;
}

/**
 * The divisional charts worth speaking about, strongest signal first.
 * D1 is dropped, and the list is capped: two Vargas is a perspective, five is a
 * data dump the reader will skip.
 */
function relevantVargas(factors, limit = 2) {
  return (factors || [])
    .filter((f) => f.chart && f.chart !== 'd1')
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, limit);
}

/**
 * Compose the divisional-chart perspective.
 *
 * @param {object}   args
 * @param {string}   [args.chartKey]  force a specific chart; otherwise the most
 *                                    significant relevant Varga is chosen
 * @param {string}   args.state       resolved answer state (carried for callers
 *                                    that key text off it; see keys_used)
 * @param {string}   args.domain      resolved life area
 * @param {Array}    args.factors     merged factors (from normalizeAnswerEvidence)
 * @param {string}   args.lang        'en' | 'hi'
 * @param {Function} args.resolve     (keys[], lang) => text|null — DB block lookup
 * @returns {{ text, parts, charts, keys_used }|null}  null when no Varga speaks
 */
function composeVargaMeaning({ chartKey, state, domain, factors, lang, resolve }) {
  const chosen = chartKey
    ? (factors || []).filter((f) => f.chart === chartKey)
    : relevantVargas(factors);
  if (!chosen.length) return null;

  const parts = [];
  const keysUsed = [];
  for (const f of chosen) {
    const polarity = vargaPolarity(f.score);
    const keys = vargaMeaningKeys(f.chart, domain, polarity);
    const text = resolve(keys, lang);
    if (!text) continue;                       // unseeded pair: say nothing rather than say filler
    parts.push(text);
    keysUsed.push({ chart: f.chart, polarity, keys, state });
  }
  if (!parts.length) return null;

  return {
    text: parts.join(' '),
    parts,
    charts: keysUsed.map((k) => k.chart),
    keys_used: keysUsed,
  };
}

module.exports = { composeVargaMeaning, vargaMeaningKeys, vargaPolarity, relevantVargas, SIGNAL_AT };
