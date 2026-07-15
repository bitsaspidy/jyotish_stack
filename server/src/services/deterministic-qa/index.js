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
const { normalizeAnswerEvidence } = require('./evidence-normalizer');
const { resolveQuestionVerdict } = require('./verdict-resolver');
const { resolveDomain, disclaimerTypeFor } = require('./domains');
const composer = require('./template-composer');
const readiness = require('./template-readiness');
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
  // All user-facing text (including titles and labels) comes from shared blocks.
  const [insufEn, insufHi, dTitleEn, dTitleHi, nTitleEn, nTitleHi, sEn, sHi, cEn, cHi] = await Promise.all([
    repo.getSharedBlock('insufficient_data', 'en'), repo.getSharedBlock('insufficient_data', 'hi'),
    repo.getSharedBlock('label.sec.direct_answer', 'en'), repo.getSharedBlock('label.sec.direct_answer', 'hi'),
    repo.getSharedBlock('label.sec.important_note', 'en'), repo.getSharedBlock('label.sec.important_note', 'hi'),
    repo.getSharedBlock('label.state.insufficient_data', 'en'), repo.getSharedBlock('label.state.insufficient_data', 'hi'),
    repo.getSharedBlock('label.conf.low', 'en'), repo.getSharedBlock('label.conf.low', 'hi'),
  ]);
  // Even with too little data to answer, the disclaimer must match the life area —
  // a health question that cannot be answered still needs the medical warning.
  const disclaimers = await fetchDisclaimers(disclaimerTypeFor(resolveDomain(question), question.disclaimer_type));
  const answer = {
    state: 'insufficient_data',
    state_label: { en: sEn || 'not yet determinable', hi: sHi || 'अभी निर्धारित नहीं' },
    confidence: { level: 'low', en: cEn || 'Low', hi: cHi || 'निम्न' },
    headline: { en: sEn || 'not yet determinable', hi: sHi || 'अभी निर्धारित नहीं' },
    sections: [
      { key: 'direct_answer', title_en: dTitleEn || 'Direct answer', title_hi: dTitleHi || 'सीधा उत्तर', text_en: insufEn, text_hi: insufHi },
      { key: 'important_note', title_en: nTitleEn || 'Important note', title_hi: nTitleHi || 'महत्वपूर्ण सूचना', text_en: disclaimers.en, text_hi: disclaimers.hi },
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

  // 8. domain + verdict alignment. The state engine ranks nothing; this re-reads
  //    its decision through the evidence hierarchy so the headline cannot end up
  //    contradicting the evidence printed under it, and records WHY it stands.
  const domain = resolveDomain(question);
  const normalized = normalizeAnswerEvidence([
    ...(evidence.natal.factors || []),
    ...(evidence.dchart.factors || []),
    ...(evidence.timing.factors || []),
  ]);
  const verdict = resolveQuestionVerdict({ decision, factors: normalized.factors, groups: evidence, domain });

  // 9. pilot rule → evaluation facts + interpolation variables (no user text)
  const rule = pilot.getRule(question.code);
  const ruleFacts = rule ? rule({ question, requirement, loaded, strength, transit, evidence, state: verdict.state, confidence: verdict.confidence }) : null;

  // 10. disclaimers + limitations. The disclaimer follows the DOMAIN: a property
  //     answer needs the legal warning, not the financial one.
  const [disclaimers, limitations] = await Promise.all([
    fetchDisclaimers(disclaimerTypeFor(domain, question.disclaimer_type)),
    fetchLimitations(loaded.chartLoad.fallbacks),
  ]);

  // 11. compose the human-readable answer from DB-backed templates
  const answer = await composer.compose({
    question, requirement, loaded, strength, transit,
    evidence, state: verdict.state, confidence: verdict.confidence,
    verdict, normalized, domain, completeness: comp.data_completeness,
    ruleFacts, disclaimers, limitations,
  }, deps.db || null);
  const composerMeta = answer.meta || {};
  delete answer.meta;   // internal detail — belongs in the trace, not the user answer

  const ruleKeys = (ruleFacts && ruleFacts.rule_keys) || ['qa.state.v1'];
  const trace = buildTrace({ question, requirement, loaded, completeness: comp, evidence, decision, transit, versions, ruleKeys, durationMs: Date.now() - startedAt });
  trace.templates_used = composerMeta.templates_used || [];

  // Admin-only evidence view (Part 15). Everything here is inspectable by an admin
  // and reaches a normal user through no path: the route attaches `trace` only for
  // admin/superadmin, and `answer` carries none of it.
  trace.domain = domain;
  trace.verdict = {
    state: verdict.state,
    changed_from: verdict.changed_from,
    changed: verdict.changed,
    alignment: verdict.alignment,
    primary_reason: verdict.primary_reason,
    timing_gap: verdict.timing_gap,
    notes: verdict.notes,
  };
  trace.primary_supports = verdict.supports.map((f) => ({ entity_id: f.entity_id, planet: f.planet, tier: f.tier, score: f.score, roles: f.roles }));
  trace.primary_blockers = verdict.blockers.map((f) => ({ entity_id: f.entity_id, planet: f.planet, tier: f.tier, score: f.score, roles: f.roles }));
  trace.evidence_normalization = composerMeta.evidence_normalization || null;
  trace.confidence_reason_kind = composerMeta.confidence_reason_kind || null;

  return { ok: true, path: 'deterministic', answer, trace, audit: buildAudit(question, answer, comp, trace, decision) };
}

/**
 * User-facing catalogue (Stage 1): ONLY questions that are active, have a
 * deterministic rule implementation AND complete bilingual templates are
 * returned. The 90 non-pilot questions are fully hidden from normal users.
 */
async function getUserFacingCatalogue() {
  const grouped = await repo.getActiveCatalogueGrouped();
  const out = [];
  for (const cat of grouped) {
    const questions = [];
    for (const q of cat.questions) {
      if (!pilot.hasRule(q.code)) continue;
      let requirement;
      try { requirement = await loadRequirement(q.code); } catch { continue; }
      if (!requirement) continue;
      const t = await readiness.checkTemplateReadiness(q, requirement);
      if (!t.ready) continue;
      questions.push({
        code: q.code, category_code: q.category_code,
        question_en: q.question_en, question_hi: q.question_hi,
        short_title_en: q.short_title_en, short_title_hi: q.short_title_hi,
      });
    }
    if (questions.length) out.push({ code: cat.code, label_en: cat.label_en, label_hi: cat.label_hi, questions });
  }
  return out;
}

/**
 * Admin catalogue: all 100 questions with computed readiness status
 * (temporary computed readiness in lieu of a dedicated column).
 */
async function getAdminCatalogue() {
  // Read through the repository so `subcategory` and `domain` come along: readiness
  // is domain-dependent, and a question whose domain silently defaulted to its
  // category would be graded against the wrong content (Q051 is `children`, not
  // `family`) and wrongly reported as not ready.
  const [cats, questions] = await Promise.all([
    repo.getActiveCategories(),
    repo.getAllQuestions(),
  ]);
  const rows = [];
  for (const q of questions) {
    let requirement = null;
    try { requirement = await loadRequirement(q.code); } catch { /* surfaced as planned */ }
    const r = await readiness.readinessStatus(q, requirement);
    rows.push({
      ...q,
      domain: resolveDomain(q),
      readiness: r.status,
      has_rule: r.has_rule,
      templates_ready: r.templates_ready,
      missing: r.missing || undefined,
    });
  }
  return { categories: cats, questions: rows };
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

module.exports = { answerQuestion, resolveQuestion, persistAudit, getUserFacingCatalogue, getAdminCatalogue };
