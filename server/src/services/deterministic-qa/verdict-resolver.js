'use strict';
/**
 * Verdict alignment — make the headline and the evidence tell the same story.
 *
 * The state engine scores three evidence GROUPS and applies conflict overrides on
 * independent layers. That is correct as far as it goes, but it cannot see rank:
 * to it, a weak secondary planet and the relevant house lord are both just layers.
 * So a chart with a strong 11th lord, a favourable D2 and an active gains dasha
 * could still be forced to "mixed" by one unrelated weak planet — and the reader
 * would then see a verdict that flatly contradicts the evidence printed beneath it.
 *
 * This resolver runs AFTER the state engine and adjudicates using the approved
 * hierarchy — relevant house/lord → karaka → relevant Varga → dasha → transit →
 * yoga → secondary planets. It only ever moves a verdict when rank justifies it,
 * it records WHY, and that recorded reason is what the narrative and the
 * confidence explanation are then built from. One decision, one story.
 *
 * It never invents states: the seven remain exactly as they are, and the state
 * engine's safety rules (weak-natal ceiling, highly_challenging floor) are
 * respected rather than re-litigated. Keys and facts only — no user text.
 */

const cfg = require('../../config/deterministic-qa.config');
const { ORDER } = require('./state-engine');
const { PRIMARY_TIERS, TIER } = require('./evidence-normalizer');

const idx = (s) => ORDER.indexOf(s);
const isPositive = (s) => cfg.POSITIVE_STATES.has(s);

// A primary factor this negative caps the upside: real promise, real obstacle.
const PRIMARY_BLOCKER_AT = -45;
// A relevant Varga this negative contradicts a positive birth-chart reading.
const VARGA_CONTRADICTS_AT = -40;
// Secondary evidence below this magnitude cannot, alone, drag a verdict to mixed.
const SECONDARY_NOISE_AT = 45;

const capState = (state, cap) => (idx(state) > idx(cap) ? cap : state);

function partition(factors) {
  const primary = [];
  const secondary = [];
  for (const f of factors || []) {
    (PRIMARY_TIERS.has(f.tier) ? primary : secondary).push(f);
  }
  return { primary, secondary };
}

const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

/**
 * Resolve the final verdict and the single reason that explains it.
 *
 * @param {object} args
 * @param {object} args.decision   the state engine's decision (state, score, confidence, notes, conflicts)
 * @param {Array}  args.factors    merged factors across all groups (normalizeAnswerEvidence)
 * @param {object} [args.groups]   { natal, dchart, timing } — for the timing-gap read
 * @param {string} args.domain     resolved life area
 * @returns {{ state, changed_from, alignment, primary_reason, supports, blockers,
 *             timing_gap, confidence, notes }}
 */
function resolveQuestionVerdict({ decision, factors, groups = {}, domain }) {
  const { primary, secondary } = partition(factors);
  const notes = [...(decision.notes || [])];
  let state = decision.state;
  let confidence = decision.confidence;
  const changedFrom = decision.state;

  const primarySupports = primary.filter((f) => f.score > 0).sort((a, b) => a.tier - b.tier || b.score - a.score);
  const primaryBlockers = primary.filter((f) => f.score < 0).sort((a, b) => a.tier - b.tier || a.score - b.score);
  const vargas = (factors || []).filter((f) => f.chart && f.chart !== 'd1');
  const worstVarga = vargas.reduce((a, b) => (!a || b.score < a.score ? b : a), null);

  let alignment = 'balanced';
  let reasonFactor = null;

  // (1) A conflict forced 'mixed', but the primary evidence is unanimous and the
  //     dissent is secondary noise. Rank says follow the primary evidence, and the
  //     verdict returns to what the score actually supports.
  const forcedMixed = notes.includes('conflicting_evidence_forced_mixed');
  if (forcedMixed && primarySupports.length >= 2 && !primaryBlockers.length) {
    const dissentIsSecondary = secondary.every((f) => f.score >= 0 || Math.abs(f.score) < SECONDARY_NOISE_AT);
    if (dissentIsSecondary) {
      const banded = require('./state-engine').scoreToState(decision.score);
      // Respect the weak-natal ceiling — restoring must never re-open an upside
      // the engine deliberately closed.
      const restored = notes.includes('weak_natal_capped_upside')
        ? capState(banded, cfg.CONFLICT.weakNatalMaxState) : banded;
      if (idx(restored) > idx(state)) {
        state = restored;
        alignment = 'secondary_only_conflict';
        reasonFactor = primarySupports[0];
        notes.push('primary_evidence_restored_verdict');
      }
    }
  }

  // (2) A primary blocker must never be papered over. Strong promise plus a real
  //     obstacle is "supportive with conditions", not "favourable".
  const hardBlocker = primaryBlockers.find((f) => f.score <= PRIMARY_BLOCKER_AT);
  if (hardBlocker && isPositive(state)) {
    const capped = capState(state, 'moderately_favourable');
    if (capped !== state) {
      state = capped;
      notes.push('primary_blocker_capped_upside');
    }
    alignment = 'primary_blocker';
    reasonFactor = hardBlocker;
  }

  // (3) The relevant divisional chart contradicting a positive birth chart is a
  //     genuine caveat — health especially must not read as reassurance when D30
  //     is adverse.
  if (worstVarga && worstVarga.score <= VARGA_CONTRADICTS_AT && isPositive(state)) {
    const capped = capState(state, 'moderately_favourable');
    if (capped !== state) {
      state = capped;
      notes.push('varga_contradiction_capped_upside');
    }
    if (alignment !== 'primary_blocker') {
      alignment = 'varga_contradiction';
      reasonFactor = worstVarga;
    }
  }

  // (4) Promise present but not currently switched on. The verdict stays honest
  //     about the potential; the timing section carries the "not yet" — which is
  //     how "strong D4 but adverse dasha" becomes "potential exists, timing delayed"
  //     without inventing a `delayed` state the engine cannot support.
  const natalPositive = groups.natal && groups.natal.present && groups.natal.score > 20;
  const timingNegative = groups.timing && groups.timing.present && groups.timing.score < -20;
  const timingGap = !!(natalPositive && timingNegative);
  if (timingGap) {
    notes.push('promise_present_timing_inactive');
    if (alignment === 'balanced') {
      alignment = 'timing_gap';
      reasonFactor = primarySupports[0] || null;
    }
  }

  // (5) Nothing moved the verdict: name the reason it stands where it does, so the
  //     narrative always has something true to open with.
  if (alignment === 'balanced') {
    if (primaryBlockers.length && primarySupports.length) {
      alignment = 'mixed_primary';
      reasonFactor = primarySupports[0];
    } else if (primarySupports.length) {
      alignment = 'primary_agreement';
      reasonFactor = primarySupports[0];
    } else if (primaryBlockers.length) {
      alignment = 'primary_caution';
      reasonFactor = primaryBlockers[0];
    }
  }

  return {
    state,
    changed_from: changedFrom,
    changed: state !== changedFrom,
    alignment,
    primary_reason: reasonFactor
      ? { entity_id: reasonFactor.entity_id, planet: reasonFactor.planet, chart: reasonFactor.chart,
          tier: reasonFactor.tier, score: reasonFactor.score, roles: reasonFactor.roles }
      : null,
    supports: primarySupports,
    blockers: primaryBlockers,
    timing_gap: timingGap,
    confidence,
    notes,
    hierarchy_version: cfg.STATE_BANDS_VER,
    domain,
  };
}

module.exports = {
  resolveQuestionVerdict,
  PRIMARY_BLOCKER_AT, VARGA_CONTRADICTS_AT, SECONDARY_NOISE_AT, TIER,
};
