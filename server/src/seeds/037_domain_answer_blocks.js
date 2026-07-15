'use strict';
/**
 * Seed 037 — domain answer blocks + question_catalogue.domain backfill.
 *
 * Two jobs:
 *  1. Upsert the domain-specific answer content (direct answers, cautions, actions,
 *     planet meanings, Varga meanings, confidence reasons, timing language) into
 *     answer_shared_blocks. Source of truth: src/data/domain-answer-templates.data.js.
 *  2. Backfill question_catalogue.domain (migration 050) for all 100 questions, so
 *     the DB — not a code derivation — is the authority for which life area a
 *     question speaks in.
 *
 * Idempotent (upsert on the natural keys), FK-safe (touches no FK columns; the
 * catalogue rows already exist from seed 033), and additive — no existing block or
 * question row is deleted, and stable question codes are never renumbered.
 */

const data = require('../data/domain-answer-templates.data');
const catalogue = require('../data/question-catalogue.data');
const { resolveDomain } = require('../services/deterministic-qa/domains');

/**
 * Blocks superseded by the domain families. Seeds 034/035 already wrote these
 * rows, and an upsert-only seed cannot remove them — so they are explicitly
 * DEACTIVATED rather than deleted. Deactivating (not deleting) keeps the change
 * reversible: flipping active back restores the previous wording exactly.
 *
 * These keys are unreachable from the new composer, but leaving them active would
 * let a future key collision resurrect "जल्दी हाँ या ना" or "D10 इस विश्लेषण को
 * पुष्ट करता है" into a live answer.
 */
const SUPERSEDED_BLOCK_KEYS = [
  'sec.kundli_indicates.support_and_caution', 'sec.kundli_indicates.support_only',
  'sec.kundli_indicates.caution_only', 'sec.kundli_indicates.neutral',
  'sec.dchart.supports', 'sec.dchart.contradicts', 'sec.dchart.mixed_signals', 'sec.dchart.agrees',
  'sec.positive.factors', 'sec.caution.factors', 'sec.caution.no_factors',
  'sec.timing_outlook.supportive', 'sec.timing_outlook.mixed', 'sec.timing_outlook.caution',
  'frag.window_line', 'frag.window_line_open', 'frag.no_window_line', 'frag.dasha_line',
];

/**
 * Direct-answer template rows superseded by the domain families. The six
 * favourability questions plus the two timing questions all shared one per-state
 * phrase; their answers now come from `direct_answer.<domain>.<state>`.
 * Q001/Q093 keep their rows — theirs are genuinely question-specific.
 */
const SUPERSEDED_DIRECT_ANSWER_CODES = ['Q012', 'Q021', 'Q031', 'Q041', 'Q051', 'Q061', 'Q071', 'Q081'];

exports.seed = async function (knex) {
  // 1. domain answer content — same upsert contract as seeds 034/035
  for (const b of data.buildDomainBlocks()) {
    await knex('answer_shared_blocks')
      .insert({ block_key: b.block_key, type: b.type, lang: b.lang, text: b.text, version: b.version, active: true })
      .onConflict(['block_key', 'lang', 'version']).merge({ type: b.type, text: b.text, active: true });
  }

  // 2. retire the generic blocks + the generic direct-answer rows
  await knex('answer_shared_blocks').whereIn('block_key', SUPERSEDED_BLOCK_KEYS).update({ active: false });
  await knex('answer_templates')
    .whereIn('question_code', SUPERSEDED_DIRECT_ANSWER_CODES)
    .where({ section_key: 'direct_answer' })
    .update({ active: false });

  // 3. domain backfill — only if migration 050 has run, so seeding an older schema
  //    degrades to a no-op instead of throwing.
  if (!(await knex.schema.hasColumn('question_catalogue', 'domain'))) return;

  for (const q of catalogue.QUESTIONS) {
    const domain = resolveDomain({ category_code: q.category, subcategory: q.subcategory });
    await knex('question_catalogue').where({ code: q.code }).update({ domain });
  }
};
