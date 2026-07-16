'use strict';
/**
 * Migration 051 — question_catalogue.intent_type / output_schema / selection_config.
 *
 * A question's DOMAIN says which life area it is about; its INTENT says what shape
 * of answer it asked for. Without intent, every question got the same
 * favourability verdict — so "which education field suits me?" was answered with
 * "education is workable for you", which is a true statement about a different
 * question.
 *
 * - intent_type      one of the ten answer shapes (see intents.js)
 * - output_schema    what the composer must produce ('verdict_summary',
 *                    'ranked_selection', 'timing_outlook')
 * - selection_config JSON for selection questions: which option taxonomy to rank
 *                    and any per-question tuning. NULL for every other intent.
 *
 * Additive + fully reversible. Nullable on purpose: a NULL intent resolves through
 * intents.js rather than blocking the row, so this migration cannot make any
 * question unanswerable.
 */

exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('question_catalogue'))) return;

  const hasIntent = await knex.schema.hasColumn('question_catalogue', 'intent_type');
  const hasSchema = await knex.schema.hasColumn('question_catalogue', 'output_schema');
  const hasConfig = await knex.schema.hasColumn('question_catalogue', 'selection_config');

  if (!hasIntent || !hasSchema || !hasConfig) {
    await knex.schema.alterTable('question_catalogue', (t) => {
      if (!hasIntent) t.string('intent_type', 24).nullable().after('domain');
      if (!hasSchema) t.string('output_schema', 32).nullable().after('intent_type');
      if (!hasConfig) t.json('selection_config').nullable().after('output_schema');
    });
  }

  // Indexed because the admin coverage view groups by intent, and because a
  // future readiness gate will need "every selection question has a taxonomy".
  if (!hasIntent) {
    await knex.schema.alterTable('question_catalogue', (t) => { t.index(['intent_type']); });
  }
};

exports.down = async function (knex) {
  if (!(await knex.schema.hasTable('question_catalogue'))) return;

  if (await knex.schema.hasColumn('question_catalogue', 'intent_type')) {
    await knex.schema.alterTable('question_catalogue', (t) => {
      t.dropIndex(['intent_type']);
      t.dropColumn('intent_type');
    });
  }
  for (const col of ['output_schema', 'selection_config']) {
    if (await knex.schema.hasColumn('question_catalogue', col)) {
      await knex.schema.alterTable('question_catalogue', (t) => { t.dropColumn(col); });
    }
  }
};
