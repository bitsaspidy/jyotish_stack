'use strict';
/**
 * Confidence, explained.
 *
 * "Reliability: high" asks the reader to trust a number they cannot inspect. What
 * makes confidence high is not a score — it is agreement: the birth chart, the
 * relevant house lord and the relevant divisional chart saying the same thing.
 * What makes it medium is usually a specific disagreement, and the reader is
 * entitled to know which one. So confidence ships with the reason it holds.
 *
 * The reason is derived from the SAME verdict alignment that chose the state, so
 * the two can never contradict each other — if the Varga is why the verdict was
 * capped, the Varga is also why confidence dropped.
 *
 * Keys resolve against answer_shared_blocks:
 *   confidence.high.agreement · confidence.medium.conflict
 *   confidence.medium.partial · confidence.low.thin · confidence.low.contradiction
 *
 * Raw scores, weights and rule keys never appear in the output — only the names of
 * the evidence that a reader could look up in their own chart.
 */

const { houseLordLabel } = require('./house-label');

// verdict alignment → the reason a reader would actually give
const KIND_BY_ALIGNMENT = Object.freeze({
  primary_agreement: 'agreement',
  secondary_only_conflict: 'agreement',
  varga_contradiction: 'conflict',
  primary_blocker: 'conflict',
  mixed_primary: 'conflict',
  primary_caution: 'conflict',
  timing_gap: 'partial',
  balanced: 'partial',
});

/**
 * Choose the reason kind for a level.
 * `low` is never described as a disagreement when the truth is thin data — those
 * are different problems and only one of them is fixable by the user (a precise
 * birth time).
 */
function reasonKind({ level, alignment, groupsPresent, completeness }) {
  if (level === 'low') {
    if (groupsPresent < 2 || (completeness != null && completeness < 55)) return 'thin';
    return alignment === 'varga_contradiction' || alignment === 'mixed_primary' ? 'contradiction' : 'thin';
  }
  if (level === 'high') return 'agreement';
  return KIND_BY_ALIGNMENT[alignment] || 'partial';
}

function confidenceReasonKeys(level, kind) {
  return [`confidence.${level}.${kind}`, `confidence.${level}.default`];
}

/**
 * Compose the one-sentence confidence explanation.
 *
 * @param {object}   evidence
 * @param {string}   evidence.level         'high' | 'medium' | 'low'
 * @param {object}   evidence.verdict       resolveQuestionVerdict() output
 * @param {Array}    evidence.factors       merged factors
 * @param {number}   [evidence.groupsPresent]
 * @param {number}   [evidence.completeness]
 * @param {Function} evidence.resolve       (keys[], lang) => text|null
 * @param {string}   lang
 * @returns {{ text, level, kind, keys_used, vars }|null}
 */
function composeConfidenceReason(evidence, lang) {
  const { level, verdict, factors, resolve } = evidence;
  if (!level || typeof resolve !== 'function') return null;

  const kind = reasonKind({
    level,
    alignment: verdict ? verdict.alignment : 'balanced',
    groupsPresent: evidence.groupsPresent != null ? evidence.groupsPresent : 3,
    completeness: evidence.completeness,
  });

  // Name the evidence, never the numbers.
  const varga = (factors || []).find((f) => f.chart && f.chart !== 'd1');
  const lordFactor = (factors || []).find((f) => (f.roles || []).some((r) => r.kind === 'house_lord'));
  const lordRole = lordFactor ? (lordFactor.roles || []).find((r) => r.kind === 'house_lord') : null;

  const vars = {
    varga: varga ? varga.chart.toUpperCase() : '',
    house_lord: lordRole ? houseLordLabel(lordRole.house, lang) : '',
  };

  const keys = confidenceReasonKeys(level, kind);
  const text = resolve(keys, lang, vars);
  if (!text) return null;

  return { text, level, kind, keys_used: keys, vars };
}

module.exports = { composeConfidenceReason, confidenceReasonKeys, reasonKind, KIND_BY_ALIGNMENT };
