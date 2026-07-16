'use strict';
/**
 * Human Conversation layer — the fourth layer of the pipeline.
 *
 *   Raw astrology  →  Evidence  →  Judgement  →  Human conversation
 *
 * The first three layers were already sound: the chart is computed, the evidence
 * is scored and normalized, and the verdict resolver decides a state and records
 * WHY it stands. What was missing is the layer that speaks — the one that opens
 * with a conclusion the way an astrologer sitting across from someone would,
 * instead of a state label.
 *
 * A judgement here is not looked up by state. It is ASSEMBLED from what this
 * chart's reasoning actually found, in four clauses:
 *
 *   claim      what is true         "Business is possible for you."
 *   qualifier  why it is not simple "But your chart does not favour an impulsive start."
 *   approach   what to do about it  "A gradual, low-risk start alongside a stable income suits you better."
 *   condition  what would change it "Once it is producing steady paying customers, the odds improve markedly."
 *
 * The qualifier and approach are chosen by the verdict's ALIGNMENT — the reason
 * the state stands — so two charts in the same state get different judgements
 * when they are in that state for different reasons. That is the difference
 * between a reading and a lookup table.
 *
 * Deterministic and DB-backed: this file picks keys, the database holds the words.
 */

const { planetName } = require('./vocab');

/**
 * Does this reading need a qualifier at all?
 *
 * An unqualified judgement is the right answer when the evidence genuinely agrees
 * — adding "however…" to a clean chart is hedging, and hedging is what makes an
 * engine sound like an engine. Only these alignments carry a real "but".
 */
const QUALIFIED = new Set(['primary_blocker', 'varga_contradiction', 'mixed_primary', 'timing_gap', 'primary_caution']);

/**
 * Compose the judgement.
 *
 * @param {object}   args
 * @param {string}   args.domain
 * @param {string}   args.state
 * @param {object}   args.verdict    resolveQuestionVerdict() output
 * @param {string}   args.lang
 * @param {Function} args.resolve    (keys[], lang, vars) => text|null
 * @returns {{ text, headline, clauses, keys_used }|null}
 */
function composeJudgement({ domain, state, verdict, lang, resolve }) {
  if (!verdict) return null;

  const alignment = verdict.alignment || 'balanced';
  const reason = verdict.primary_reason || null;
  const vars = {
    planet: reason && reason.planet ? planetName(reason.planet, lang) : '',
    varga: reason && reason.chart ? reason.chart.toUpperCase() : '',
  };

  // 1. The claim — what is actually true, said plainly and first.
  //    Falls through to `direct_answer.<domain>.<state>`: those blocks are already
  //    written as claims ("Business is possible but not effortless for you"), so
  //    re-authoring them under a second key would duplicate the content and let
  //    the two copies drift into contradicting each other.
  const claimKeys = [
    `judgement.${domain}.${state}`,
    `direct_answer.${domain}.${state}`,
    `direct_answer.general.${state}`,
  ];
  const claim = resolve(claimKeys, lang, vars);
  if (!claim) return null;                 // no claim, no judgement — never guess

  const clauses = [claim];
  const keys = [...claimKeys];

  // 2. The qualifier — why it is not simple. Only when the chart actually says so.
  if (QUALIFIED.has(alignment)) {
    const q = resolve([`judgement.qualifier.${domain}.${alignment}`, `judgement.qualifier.${alignment}`], lang, vars);
    if (q) { clauses.push(q); keys.push(`judgement.qualifier.${alignment}`); }
  }

  // 3. The approach — what to do given THIS pattern, not given this domain.
  //    An impulsive start is wrong for a chart with a real blocker; it is not
  //    wrong for a chart whose evidence simply agrees.
  const approach = resolve(
    [`judgement.${domain}.approach.${alignment}`, `judgement.${domain}.approach.default`],
    lang, vars,
  );
  if (approach) { clauses.push(approach); keys.push(`judgement.${domain}.approach.${alignment}`); }

  // 4. The condition — what would move this reading. This is the sentence that
  //    turns a verdict into guidance: it tells the reader what is in their hands.
  const condition = resolve([`judgement.${domain}.condition`], lang, vars);
  if (condition) { clauses.push(condition); keys.push(`judgement.${domain}.condition`); }

  return {
    text: clauses.join(' '),
    // The headline is the CLAIM, never the state label. "The prospects here are
    // mixed" is the engine describing its own internals; "Business is possible for
    // you, but it will reward patience" is an answer.
    headline: claim,
    clauses: { claim, qualified: QUALIFIED.has(alignment), alignment },
    keys_used: keys,
  };
}

module.exports = { composeJudgement, QUALIFIED };
