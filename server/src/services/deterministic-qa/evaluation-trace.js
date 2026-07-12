'use strict';
/**
 * Evaluation trace (Phase 3, component 7).
 *
 * Internal audit/preview structure — NEVER exposed to normal users (the route
 * only attaches it for admin/superadmin callers). Captures exactly what drove an
 * answer so a later admin preview + the qa_audit table stay reproducible.
 */

const cfg = require('../../config/deterministic-qa.config');

function buildTrace({
  question, requirement, loaded, completeness, evidence, decision, transit, versions, ruleKeys = [], durationMs = null,
}) {
  const chartLoad = loaded && loaded.chartLoad ? loaded.chartLoad : { available: {}, fallbacks: [], missing: [], requested: [] };
  const sel = loaded && loaded.selected ? loaded.selected : { dasha: { requested: [], available: {} }, houses: {}, planets: {} };

  return {
    question_code: question.code,
    calc_version: cfg.CALC_VERSION,
    rule_engine_version: cfg.RULE_ENGINE_VER,
    requirement_version: versions ? versions.rule_version : null,
    template_version: versions ? versions.template_version : null,

    charts_requested: chartLoad.requested,
    charts_available: Object.keys(chartLoad.available),
    fallback_charts_used: chartLoad.fallbacks.map((f) => ({ requested: f.requested, actual: f.actual, house: f.house })),
    charts_missing: chartLoad.missing,

    houses_used: Object.keys(sel.houses).map(Number),
    planets_used: Object.keys(sel.planets),

    dasha_levels_requested: sel.dasha.requested,
    dasha_levels_available: Object.keys(sel.dasha.available).filter((k) => sel.dasha.available[k] != null),

    transit_available: !!(transit && transit.available),
    transit_summary: transit && transit.available ? transit.summary : null,

    missing_inputs: completeness ? completeness.missing_required : [],
    missing_optional_enhancers: completeness ? completeness.missing_optional_enhancers : [],
    data_completeness: completeness ? completeness.data_completeness : null,
    enhancers: completeness ? completeness.enhancers : null,

    evidence_groups: evidence ? {
      natal: evidence.natal ? { score: evidence.natal.score, present: evidence.natal.present, layers: evidence.natal.layers } : null,
      dchart: evidence.dchart ? { score: evidence.dchart.score, present: evidence.dchart.present, layers: evidence.dchart.layers } : null,
      timing: evidence.timing ? { score: evidence.timing.score, present: evidence.timing.present, layers: evidence.timing.layers } : null,
    } : null,

    initial_state: decision ? decision.state : null,
    initial_score: decision ? decision.score : null,
    initial_confidence: decision ? decision.confidence : null,
    conflicts: decision ? decision.conflicts : [],
    conflict_notes: decision ? decision.notes : [],

    rule_keys_evaluated: ruleKeys,
    duration_ms: durationMs,
  };
}

module.exports = { buildTrace };
