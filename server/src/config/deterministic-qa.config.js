'use strict';
/**
 * Deterministic Q&A — central, versioned, configurable knobs (Phase 3).
 *
 * Everything the answer engine relies on that a domain expert may want to
 * recalibrate lives here, NOT inside controllers or scattered constants:
 *  - the 7-state score bands
 *  - confidence thresholds
 *  - completeness weights + block policy
 *  - the supported / fallback divisional-chart sets
 *  - the dated-transit pilot scope (slow planets, relevance house sets)
 *  - stable version stamps used in the evaluation trace + audit
 *
 * Each calibratable block carries its own `version` so a change is auditable
 * and reproducible (the trace records which config version produced an answer).
 */

// ── Version stamps (bumped when the meaning of a block changes) ───────────────
const CALC_VERSION      = 'calc-1.0';    // astronomy-engine sidereal pipeline (matches seed 034)
const RULE_ENGINE_VER   = 'qa-rules-3.0'; // Phase 3 deterministic answer engine
const STATE_BANDS_VER   = 1;
const CONFIDENCE_VER    = 1;
const COMPLETENESS_VER  = 1;
const TRANSIT_VER       = 1;

// ── No feature flags ─────────────────────────────────────────────────────────
// Stage 3 made the database catalogue and the deterministic answer engine
// UNCONDITIONAL. There are no QA feature-flag switches and no alternate path:
// the DB is the single source of truth and the deterministic engine is the only
// Kundli answer system.

// ── Divisional-chart support policy ──────────────────────────────────────────
// Charts the engine trusts for interpretation. D3 (siblings) and D11 (gains) are
// deliberately EXCLUDED: D11 is not computed at all, and D3, while a blob may
// exist, is not validated for this engine — both fall back to a clearly-labelled
// D1 house reading (3rd house for D3, 11th for D11). Never label a fallback as
// D3/D11 (owner rule).
const SUPPORTED_CHARTS = Object.freeze(['d1','d2','d4','d7','d9','d10','d12','d16','d20','d24','d27','d30']);
const CHART_FALLBACK = Object.freeze({
  d3:  { via: 'd1', house: 3,  limitation_block: 'limitation_d3'  },
  d11: { via: 'd1', house: 11, limitation_block: 'limitation_d11' },
});

// ── 7-state score bands (configurable + versioned) ───────────────────────────
// A composite evidence score in [-100, 100] maps to a state. `insufficient_data`
// is chosen upstream by the completeness gate, never by the band table.
const STATE_BANDS = Object.freeze({
  version: STATE_BANDS_VER,
  // ordered high → low; first band whose min<=score wins
  bands: [
    { state: 'highly_favourable',     min: 70,   max: 100 },
    { state: 'favourable',            min: 45,   max: 69 },
    { state: 'moderately_favourable', min: 20,   max: 44 },
    { state: 'mixed',                 min: -19,  max: 19 },
    { state: 'challenging',           min: -44,  max: -20 },
    { state: 'highly_challenging',    min: -100, max: -45 },
  ],
  insufficient: 'insufficient_data',
});

// The 7 canonical states (single source used across engine + tests).
const ANSWER_STATES = Object.freeze([
  'highly_favourable', 'favourable', 'moderately_favourable',
  'mixed', 'challenging', 'highly_challenging', 'insufficient_data',
]);

// States considered "positive", "caution" and "neutral" for conflict handling.
const POSITIVE_STATES = new Set(['highly_favourable', 'favourable', 'moderately_favourable']);
const CAUTION_STATES  = new Set(['challenging', 'highly_challenging']);

// ── Evidence-group weights (natal / divisional / current timing) ─────────────
// Three groups per the approved strategy. Timing weight rises for timing-heavy
// questions. Weights are normalised at use so missing groups don't skew.
const EVIDENCE_WEIGHTS = Object.freeze({
  version: STATE_BANDS_VER,
  base:   { natal: 0.45, dchart: 0.30, timing: 0.25 },
  timing: { natal: 0.30, dchart: 0.20, timing: 0.50 }, // needs_dated_transit questions
});

// ── Conflict-override policy ─────────────────────────────────────────────────
const CONFLICT = Object.freeze({
  version: STATE_BANDS_VER,
  // A strong split between a positive layer and a caution layer (|delta| in the
  // 0-100 group-score space) forces the state toward 'mixed' rather than a
  // forced positive/negative, and lowers confidence.
  strongSplitDelta: 55,
  // Favourable current timing must not override weak natal promise into a
  // guaranteed favourable — cap the state when natal group is below this.
  weakNatalCeiling: 15,     // natal group score (−100..100) at/below → cap upside
  weakNatalMaxState: 'moderately_favourable',
  // 'highly_challenging' requires at least this many independent caution layers
  // strongly negative, else it is softened to 'challenging'.
  highlyChallengingMinLayers: 2,
  highlyChallengingLayerScore: -45,
});

// ── Confidence model (independent of state) ──────────────────────────────────
const CONFIDENCE = Object.freeze({
  version: CONFIDENCE_VER,
  // completeness thresholds
  highMinCompleteness: 80,
  mediumMinCompleteness: 55,
  // a strong evidence split drops confidence one notch
  conflictPenaltyDelta: CONFLICT.strongSplitDelta,
  levels: ['high', 'medium', 'low'],
});

// ── Completeness policy ──────────────────────────────────────────────────────
const COMPLETENESS = Object.freeze({
  version: COMPLETENESS_VER,
  // relative weight of each required-input family in the 0-100 score
  weights: { required_fields: 0.40, charts: 0.20, dasha: 0.20, planets: 0.10, houses: 0.10 },
  // if completeness < blockBelow AND behaviour is 'block' → insufficient_data
  blockBelow: 50,
  // strict questions (min_data_policy='strict') block below this instead
  strictBlockBelow: 70,
});

// ── Dated-transit pilot scope (approved) ─────────────────────────────────────
// Slow planets only, evaluated from natal Lagna and natal Moon. No fast planets
// in the first pilot; no guaranteed event dates.
const DATED_TRANSIT = Object.freeze({
  version: TRANSIT_VER,
  calc_version: CALC_VERSION,
  planets: ['Jupiter', 'Saturn', 'Rahu', 'Ketu'],
  // horizon + sampling for locating the current sign window boundaries
  lookbackDays: 900,
  lookaheadDays: 900,
  sampleStepDays: 5,       // coarse scan; boundaries refined by bisection to ~1 day
  // houses (from Lagna or Moon) considered supportive / caution per slow planet.
  // Classical Jupiter/Saturn transit doctrine (from Moon), applied generically.
  supportiveHouses: { Jupiter: [2,5,7,9,11], Saturn: [3,6,11], Rahu: [3,6,11], Ketu: [3,6,11] },
  cautionHouses:    { Jupiter: [1,3,4,6,8,10,12], Saturn: [1,2,4,5,7,8,9,10,12], Rahu: [1,2,4,5,7,8,9,10,12], Ketu: [1,2,4,5,7,8,9,10,12] },
});

// ── Shared-block keys for disclaimers (map disclaimer_type → block_key) ───────
const DISCLAIMER_BLOCK = Object.freeze({
  medical: 'disclaimer_medical',
  financial: 'disclaimer_financial',
  marriage: 'disclaimer_marriage',
  general: 'disclaimer_general',
  none: null,
});

module.exports = {
  CALC_VERSION, RULE_ENGINE_VER,
  STATE_BANDS_VER, CONFIDENCE_VER, COMPLETENESS_VER, TRANSIT_VER,
  SUPPORTED_CHARTS, CHART_FALLBACK,
  STATE_BANDS, ANSWER_STATES, POSITIVE_STATES, CAUTION_STATES,
  EVIDENCE_WEIGHTS, CONFLICT, CONFIDENCE, COMPLETENESS,
  DATED_TRANSIT, DISCLAIMER_BLOCK,
};
