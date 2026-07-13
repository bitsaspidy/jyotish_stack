'use strict';
/**
 * Migration 048 — drop the Ollama answer-cache table (Stage 2 of the no-LLM
 * pivot; activated after the Stage 1 deterministic UI was approved and all
 * runtime readers/writers of kundli_ai_answers were deleted).
 *
 * The table held only regenerable cached LLM text (no authoritative data), so
 * nothing is migrated. up() logs the pre-drop status for the deploy record.
 * down() recreates the exact original schema from migration 045 (which is kept
 * forever — an applied migration file is never deleted).
 */

exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('kundli_ai_answers');
  if (exists) {
    const { c } = await knex('kundli_ai_answers').count('* as c').first();
    console.log(`[048] dropping kundli_ai_answers (cached LLM answers only; rows=${c})`);
  } else {
    console.log('[048] kundli_ai_answers does not exist — nothing to drop');
  }
  await knex.schema.dropTableIfExists('kundli_ai_answers');
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('kundli_ai_answers');
  if (exists) return;
  await knex.schema.createTable('kundli_ai_answers', (t) => {
    t.increments('id').primary();
    t.integer('kundli_id').unsigned().notNullable()
      .references('id').inTable('kundli_profiles').onDelete('CASCADE');
    t.string('question_key', 80).notNullable();
    t.string('lang', 5).notNullable().defaultTo('en');
    t.text('answer', 'mediumtext').notNullable();
    t.string('model', 64).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['kundli_id', 'question_key', 'lang']);
    t.index(['kundli_id']);
  });
};
