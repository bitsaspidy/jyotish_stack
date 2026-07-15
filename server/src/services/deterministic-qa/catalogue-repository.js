'use strict';
/**
 * Catalogue repository (Phase 3, component 1).
 *
 * The DB catalogue (question_categories / question_catalogue /
 * question_requirements / question_legacy_alias / answer_shared_blocks /
 * rule_registry) is the single source of truth for Kundli questions. This
 * module is the ONLY place that reads those tables for the deterministic engine.
 * There is no other catalogue (the legacy JS bank was removed in Stage 3).
 *
 * All reads are parameterised; codes are validated against /^Q\d{3}$/ before use.
 */

const db = require('../../config/db');

const CODE_RE = /^Q\d{3}$/;
function isValidCode(code) { return typeof code === 'string' && CODE_RE.test(code); }

// ── Categories ───────────────────────────────────────────────────────────────
async function getActiveCategories() {
  return db('question_categories')
    .where({ active: true })
    .orderBy('display_order')
    .select('code', 'label_en', 'label_hi', 'display_order');
}

// ── Questions ────────────────────────────────────────────────────────────────
const QUESTION_COLS = [
  'code', 'category_code', 'subcategory', 'question_en', 'question_hi',
  'short_title_en', 'short_title_hi', 'desc_en', 'desc_hi', 'display_order',
  'active', 'disclaimer_type', 'min_data_policy', 'fallback_block_key',
  'rule_version', 'template_version',
];

async function getActiveQuestions() {
  return db('question_catalogue')
    .where({ active: true })
    .orderBy(['category_code', 'display_order'])
    .select(QUESTION_COLS);
}

/** Active questions grouped by active category — for the suggestion catalogue UI. */
async function getActiveCatalogueGrouped() {
  const [cats, qs] = await Promise.all([getActiveCategories(), getActiveQuestions()]);
  const byCat = new Map(cats.map((c) => [c.code, { ...c, questions: [] }]));
  for (const q of qs) {
    const bucket = byCat.get(q.category_code);
    if (bucket) bucket.questions.push(q);
  }
  return Array.from(byCat.values()).filter((c) => c.questions.length);
}

/** A single question by stable code. Returns null for unknown / malformed codes. */
async function getQuestionByCode(code) {
  if (!isValidCode(code)) return null;
  return (await db('question_catalogue').where({ code }).select(QUESTION_COLS).first()) || null;
}

/** Only returns the question if it is ACTIVE (inactive questions are hidden). */
async function getActiveQuestionByCode(code) {
  const q = await getQuestionByCode(code);
  return q && q.active ? q : null;
}

// ── Requirements (raw row; JSON parsing/validation done in requirement-loader) ─
async function getRequirementsRow(code) {
  if (!isValidCode(code)) return null;
  return (await db('question_requirements').where({ question_code: code }).first()) || null;
}

// ── Legacy alias resolution ──────────────────────────────────────────────────
/**
 * Resolve a legacy key to the new catalogue.
 * @returns {{ legacy_key, question_code, status }} or null if unknown.
 *   status 'aliased'  → question_code is a live Q-code.
 *   status 'retired'  → question_code is null (deliberately no home).
 */
async function resolveLegacyKey(legacyKey) {
  if (typeof legacyKey !== 'string' || !legacyKey.trim()) return null;
  const row = await db('question_legacy_alias')
    .where({ legacy_key: legacyKey.trim() })
    .select('legacy_key', 'question_code', 'status')
    .first();
  return row || null;
}

// ── Version stamps for a question (from the catalogue row) ────────────────────
async function getVersions(code) {
  const q = await getQuestionByCode(code);
  if (!q) return null;
  return { rule_version: q.rule_version, template_version: q.template_version };
}

// ── Shared answer blocks (disclaimers / insufficient-data / limitation notes) ─
async function getSharedBlock(blockKey, lang, version = null) {
  if (!blockKey) return null;
  const q = db('answer_shared_blocks').where({ block_key: blockKey, lang, active: true });
  if (version) q.andWhere({ version });
  const row = await q.orderBy('version', 'desc').first();
  return row ? row.text : null;
}

// ── Rule registry (current active rule versions, for the trace) ──────────────
async function getRuleRegistry() {
  return db('rule_registry').where({ active: true }).select('rule_key', 'rule_version', 'calc_version', 'source');
}

module.exports = {
  isValidCode,
  getActiveCategories,
  getActiveQuestions,
  getActiveCatalogueGrouped,
  getQuestionByCode,
  getActiveQuestionByCode,
  getRequirementsRow,
  resolveLegacyKey,
  getVersions,
  getSharedBlock,
  getRuleRegistry,
};
