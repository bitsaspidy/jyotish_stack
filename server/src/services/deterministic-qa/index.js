'use strict';
/**
 * Deterministic Q&A orchestrator (Phase 3).
 *
 * Public entry point: answerQuestion(). Ties the pipeline together —
 *   catalogue → requirement → ownership-safe selective load → strength proxy →
 *   dated transit → completeness gate → evidence → 7-state + conflict + confidence
 *   → bilingual human-readable composition → internal trace + audit payload.
 *
 * NO LLM is involved anywhere in this path. Reproducible: the same chart + config
 * versions always yield the same answer.
 */

const repo = require('./catalogue-repository');
const { loadRequirement, RequirementValidationError } = require('./requirement-loader');
const { loadKundliForQuestion } = require('./kundli-data-loader');
const { computeKundliStrength } = require('../helpers/kundli-strength');
const { evaluateDatedTransits } = require('./dated-transit');
const completeness = require('./completeness-evaluator');
const { buildEvidence } = require('./evidence-builder');
const { resolveState } = require('./state-engine');
const composer = require('./answer-composer');
const pilot = require('./pilot-rules');
const { buildTrace } = require('./evaluation-trace');
const cfg = require('../../config/deterministic-qa.config');

// Resolve a request to a live, active question code (handles legacy aliases).
async function resolveQuestion({ questionCode, legacyKey }) {
  if (legacyKey && !questionCode) {
    const alias = await repo.resolveLegacyKey(legacyKey);
    if (!alias) return { ok: false, reason: 'unknown_legacy_key' };
    if (alias.status === 'retired' || !alias.question_code) return { ok: false, reason: 'retired_legacy_key' };
    questionCode = alias.question_code;
  }
  if (!repo.isValidCode(questionCode)) return { ok: false, reason: 'invalid_question_code' };
  const question = await repo.getActiveQuestionByCode(questionCode);
  if (!question) return { ok: false, reason: 'question_not_found' };   // unknown OR inactive (hidden)
  return { ok: true, question };
}

async function fetchDisclaimers(disclaimerType) {
  const key = cfg.DISCLAIMER_BLOCK[disclaimerType] || cfg.DISCLAIMER_BLOCK.general;
  if (!key) return { en: '', hi: '' };
  const [en, hi] = await Promise.all([repo.getSharedBlock(key, 'en'), repo.getSharedBlock(key, 'hi')]);
  return { en: en || '', hi: hi || '' };
}

async function fetchLimitations(fallbacks) {
  const out = [];
  for (const f of fallbacks) {
    const [en, hi] = await Promise.all([repo.getSharedBlock(f.limitation_block, 'en'), repo.getSharedBlock(f.limitation_block, 'hi')]);
    if (en || hi) out.push({ en: en || '', hi: hi || '', requested: f.requested });
  }
  return out;
}

async function insufficientAnswer(question, requirement, comp, versions, loaded, transit, startedAt) {
  const [insufEn, insufHi] = await Promise.all([repo.getSharedBlock('insufficient_data', 'en'), repo.getSharedBlock('insufficient_data', 'hi')]);
  const disclaimers = await fetchDisclaimers(question.disclaimer_type);
  const answer = {
    state: 'insufficient_data',
    state_label: { en: 'not yet determinable', hi: 'अभी निर्धारित नहीं' },
    confidence: { level: 'low', en: 'Low', hi: 'निम्न' },
    sections: [
      { key: 'direct_answer', title_en: 'Direct answer', title_hi: 'सीधा उत्तर', text_en: insufEn, text_hi: insufHi },
      { key: 'important_note', title_en: 'Important note', title_hi: 'महत्वपूर्ण सूचना', text_en: disclaimers.en, text_hi: disclaimers.hi },
    ],
    limitations: [],
  };
  const trace = buildTrace({ question, requirement, loaded, completeness: comp, evidence: null, decision: null, transit, versions, ruleKeys: [], durationMs: Date.now() - startedAt });
  return { ok: true, path: 'deterministic', answer, trace, audit: buildAudit(question, answer, comp, trace, null) };
}

function buildAudit(question, answer, comp, trace, decision) {
  return {
    question_code: question.code,
    answer_state: answer.state,
    charts_used: trace.charts_available,
    dasha_levels_used: trace.dasha_levels_available,
    data_completeness: comp ? comp.data_completeness : 0,
    confidence_level: answer.confidence.level,
    primary_rule_group: decision ? 'qa.state.v1' : null,
    matched_rule_groups: trace.rule_keys_evaluated,
    conflicting_rule_groups: decision ? decision.conflicts.map((c) => c.type) : [],
    missing_inputs: trace.missing_inputs,
    rule_version: trace.requirement_version,
    template_version: trace.template_version,
    calc_version: cfg.CALC_VERSION,
    duration_ms: trace.duration_ms,
  };
}

/**
 * @param {object} args
 * @param {string} [args.questionCode]  a Q-code (Q001…Q100)
 * @param {string} [args.legacyKey]     a legacy question key (resolved via alias)
 * @param {string} args.kundliUuid
 * @param {number} args.userId
 * @param {Date}   [args.atDate]
 * @param {object} [args.deps]          { db, ensureChart } (injectable for tests)
 * @returns {Promise<{ok, reason?, path?, answer?, trace?, audit?}>}
 */
async function answerQuestion({ questionCode, legacyKey, kundliUuid, userId, atDate = new Date(), deps = {} }) {
  const startedAt = Date.now();

  // 1. resolve question (+ legacy alias)
  const resolved = await resolveQuestion({ questionCode, legacyKey });
  if (!resolved.ok) return { ok: false, reason: resolved.reason };
  const question = resolved.question;

  // 2. requirement (validate stored JSON)
  let requirement;
  try {
    requirement = await loadRequirement(question.code);
  } catch (e) {
    if (e instanceof RequirementValidationError) return { ok: false, reason: 'invalid_requirements', detail: e.message };
    throw e;
  }
  if (!requirement) return { ok: false, reason: 'missing_requirements' };

  const versions = { rule_version: question.rule_version, template_version: question.template_version };

  // 3. ownership-safe selective load
  const loaded = await loadKundliForQuestion({ uuid: kundliUuid, userId, requirement, deps });
  if (!loaded.ok) return { ok: false, reason: loaded.reason };

  // 4. strength proxy (custom, NOT Shadbala)
  const strength = computeKundliStrength(loaded.chart);

  // 5. dated transit (only when the question needs current/dated transit)
  let transit = null;
  if (requirement.needs_dated_transit || requirement.needs_current_transit) {
    transit = evaluateDatedTransits({ chart: loaded.chart, atDate, relevantHouses: requirement.houses });
  }

  // 6. completeness gate
  const comp = completeness.evaluate({ requirement, loaded, minDataPolicy: question.min_data_policy, transit });
  if (comp.decision === 'block') {
    return insufficientAnswer(question, requirement, comp, versions, loaded, transit, startedAt);
  }

  // 7. evidence → state → confidence
  const evidence = buildEvidence({ requirement, loaded, strength, transit, category: question.category_code });
  const decision = resolveState({
    groups: evidence,
    timingHeavy: requirement.needs_dated_transit,
    suggestedConfidence: comp.suggested_confidence,
  });

  // 8. pilot rule → question-specific facts
  const rule = pilot.getRule(question.code);
  const ruleFacts = rule ? rule({ question, requirement, loaded, strength, transit, evidence, state: decision.state, confidence: decision.confidence }) : null;

  // 9. disclaimers + limitations
  const [disclaimers, limitations] = await Promise.all([
    fetchDisclaimers(question.disclaimer_type),
    fetchLimitations(loaded.chartLoad.fallbacks),
  ]);

  // 10. compose human-readable answer
  const answer = composer.compose({
    question, requirement, loaded, strength, transit,
    evidence, state: decision.state, confidence: decision.confidence,
    ruleFacts, disclaimers, limitations, remedy: null,
  });

  const ruleKeys = (ruleFacts && ruleFacts.rule_keys) || ['qa.state.v1'];
  const trace = buildTrace({ question, requirement, loaded, completeness: comp, evidence, decision, transit, versions, ruleKeys, durationMs: Date.now() - startedAt });

  return { ok: true, path: 'deterministic', answer, trace, audit: buildAudit(question, answer, comp, trace, decision) };
}

// Optional audit persistence (fire-and-forget from the route).
async function persistAudit(db, { userId, kundliId, lang, audit, transitDate = null }) {
  try {
    await db('qa_audit').insert({
      user_id: userId || null,
      kundli_id: kundliId || null,
      question_code: audit.question_code,
      lang,
      answer_state: audit.answer_state,
      charts_used: JSON.stringify(audit.charts_used || []),
      dasha_levels_used: JSON.stringify(audit.dasha_levels_used || []),
      transit_date: transitDate,
      data_completeness: audit.data_completeness || 0,
      confidence_level: audit.confidence_level || null,
      primary_rule_group: audit.primary_rule_group || null,
      matched_rule_groups: JSON.stringify(audit.matched_rule_groups || []),
      conflicting_rule_groups: JSON.stringify(audit.conflicting_rule_groups || []),
      missing_inputs: JSON.stringify(audit.missing_inputs || []),
      rule_version: audit.rule_version || null,
      template_version: audit.template_version || null,
      calc_version: audit.calc_version || null,
      duration_ms: audit.duration_ms || null,
    });
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') console.warn('[deterministic-qa:audit]', e.message);
  }
}

module.exports = { answerQuestion, resolveQuestion, persistAudit };
