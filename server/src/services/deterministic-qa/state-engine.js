'use strict';
/**
 * Answer-state + confidence engine (Phase 3, component 5 / approved 7-state strategy).
 *
 * Combines THREE evidence groups — natal, relevant divisional-chart, current
 * timing (Dasha + major transits) — into one of 7 states via configurable,
 * versioned score bands, then applies explicit conflict-override rules so a raw
 * number is NEVER the sole state selector. Confidence (high/medium/low) is kept
 * INDEPENDENT of the state.
 *
 * Every evidence group score is in [-100, 100]. `insufficient_data` is decided
 * by the completeness gate upstream, not here.
 */

const cfg = require('../../config/deterministic-qa.config');

// severity order low(negative) → high(positive), for capping/softening
const ORDER = ['highly_challenging', 'challenging', 'mixed', 'moderately_favourable', 'favourable', 'highly_favourable'];
const idx = (s) => ORDER.indexOf(s);

function scoreToState(score) {
  for (const b of cfg.STATE_BANDS.bands) {
    if (score >= b.min && score <= b.max) return b.state;
  }
  return score > 0 ? 'highly_favourable' : 'highly_challenging';
}

function normaliseWeights(groups, weights) {
  const present = Object.keys(weights).filter((k) => groups[k] && groups[k].present);
  const total = present.reduce((s, k) => s + weights[k], 0) || 1;
  const out = {};
  for (const k of present) out[k] = weights[k] / total;
  return out;
}

function dropConfidence(level) {
  const order = cfg.CONFIDENCE.levels; // ['high','medium','low']
  const i = order.indexOf(level);
  return i < 0 ? 'low' : order[Math.min(order.length - 1, i + 1)];
}

/**
 * @param {object} args
 * @param {object} args.groups  { natal:{score,present,layers[]}, dchart:{...}, timing:{...} }
 * @param {boolean} [args.timingHeavy] use the timing-weighted profile
 * @param {string} [args.suggestedConfidence] from completeness ('high'|'medium'|'low')
 * @returns { state, score, confidence, band_version, conflicts, notes[] }
 */
function resolveState({ groups, timingHeavy = false, suggestedConfidence = 'medium' }) {
  const weightProfile = timingHeavy ? cfg.EVIDENCE_WEIGHTS.timing : cfg.EVIDENCE_WEIGHTS.base;
  const w = normaliseWeights(groups, weightProfile);

  const presentKeys = Object.keys(w);
  const composite = Math.round(presentKeys.reduce((s, k) => s + w[k] * (groups[k].score || 0), 0));

  let state = scoreToState(composite);
  const notes = [];
  const conflicts = [];
  let confidence = suggestedConfidence;

  // Collect group scores for conflict analysis
  const natal = groups.natal && groups.natal.present ? groups.natal.score : null;
  const scores = presentKeys.map((k) => ({ group: k, score: groups[k].score }));
  const maxG = scores.reduce((a, b) => (b.score > a.score ? b : a), scores[0] || { score: 0 });
  const minG = scores.reduce((a, b) => (b.score < a.score ? b : a), scores[0] || { score: 0 });

  // (a) strong split between a positive and a caution layer → prefer mixed
  if (scores.length >= 2 && (maxG.score - minG.score) >= cfg.CONFLICT.strongSplitDelta
      && maxG.score > 0 && minG.score < 0) {
    conflicts.push({ type: 'strong_split', high: maxG, low: minG, delta: maxG.score - minG.score });
    if (cfg.POSITIVE_STATES.has(state) || cfg.CAUTION_STATES.has(state)) {
      state = 'mixed';
      notes.push('conflicting_evidence_forced_mixed');
    }
    confidence = dropConfidence(confidence);
  }

  // (b) weak natal promise must not become a guaranteed-favourable answer
  if (natal != null && natal <= cfg.CONFLICT.weakNatalCeiling && cfg.POSITIVE_STATES.has(state)) {
    const cap = cfg.CONFLICT.weakNatalMaxState;
    if (idx(state) > idx(cap)) {
      state = cap;
      notes.push('weak_natal_capped_upside');
      conflicts.push({ type: 'weak_natal_ceiling', natal_score: natal });
    }
  }

  // (c) highly_challenging safety — needs multiple independent strongly-negative layers
  if (state === 'highly_challenging') {
    const allLayers = presentKeys.flatMap((k) => (groups[k].layers || []).map((l) => l.score));
    const strongNeg = allLayers.filter((s) => s <= cfg.CONFLICT.highlyChallengingLayerScore).length;
    if (strongNeg < cfg.CONFLICT.highlyChallengingMinLayers) {
      state = 'challenging';
      notes.push('highly_challenging_softened_insufficient_layers');
    }
  }

  // confidence floor when material data is thin (only one evidence group present)
  if (presentKeys.length < 2 && confidence === 'high') confidence = 'medium';

  return {
    state,
    score: composite,
    confidence,
    band_version: cfg.STATE_BANDS.version,
    conflict_version: cfg.CONFLICT.version,
    weights_used: w,
    conflicts,
    notes,
  };
}

module.exports = { resolveState, scoreToState, ORDER, dropConfidence };
