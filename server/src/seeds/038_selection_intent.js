'use strict';
/**
 * Seed 038 — selection content + intent backfill.
 *
 *  1. Upsert the selection answer content (fit labels, primary directions, the
 *     education field taxonomy, the Varga note, the practical plan) and the
 *     per-domain `potential.*` blocks into answer_shared_blocks.
 *  2. Backfill question_catalogue.intent_type / output_schema (migration 051) for
 *     all 100 questions, so the DB — not a code derivation — decides what shape of
 *     answer each question gets.
 *
 * Idempotent, FK-safe (touches no FK columns), additive. Stable question codes are
 * never renumbered.
 */

const selection = require('../data/selection-blocks.data');
const catalogue = require('../data/question-catalogue.data');
const { resolveIntent, resolveOutputSchema } = require('../services/deterministic-qa/intents');
const { resolveDomain } = require('../services/deterministic-qa/domains');
const { hasSelector } = require('../services/deterministic-qa/selection');

exports.seed = async function (knex) {
  // 1. selection + potential content — same upsert contract as seeds 034/035/037
  for (const b of selection.buildSelectionBlocks()) {
    await knex('answer_shared_blocks')
      .insert({ block_key: b.block_key, type: b.type, lang: b.lang, text: b.text, version: b.version, active: true })
      .onConflict(['block_key', 'lang', 'version']).merge({ type: b.type, text: b.text, active: true });
  }

  // 2. intent backfill — no-op on a schema without migration 051, so seeding an
  //    older DB degrades rather than throwing.
  if (!(await knex.schema.hasColumn('question_catalogue', 'intent_type'))) return;

  for (const q of catalogue.QUESTIONS) {
    const shaped = { category_code: q.category, subcategory: q.subcategory };
    const intent = resolveIntent(shaped);
    const domain = resolveDomain(shaped);

    // output_schema must state what this question can ACTUALLY deliver today, not
    // what its intent would like. Both `selection` and `comparison` want a ranked
    // answer, but neither can produce one without a taxonomy for their domain — so
    // a question whose domain has no option set is recorded honestly as a verdict
    // answer. It upgrades by itself the moment its taxonomy lands, with no
    // migration and no edit here.
    const wantsRanked = intent === 'selection' || intent === 'comparison';
    const rankable = wantsRanked && hasSelector(domain);
    const schema = rankable
      ? 'ranked_selection'
      : (resolveOutputSchema({ ...shaped, intent_type: intent }) === 'timing_outlook' ? 'timing_outlook' : 'verdict_summary');

    await knex('question_catalogue').where({ code: q.code }).update({
      intent_type: intent,
      output_schema: schema,
      selection_config: rankable ? JSON.stringify({ taxonomy: domain, top: 3, secondary: 2 }) : null,
    });
  }
};
