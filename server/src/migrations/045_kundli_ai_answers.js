'use strict';
/**
 * Migration 045 — kundli_ai_answers
 * Per-kundli cache of the AI "Final Answer" for Ask-a-Question, keyed by the
 * question-bank key + language. Lets tapped suggestion chips (and repeat asks)
 * return instantly instead of re-running the local LLM. A background warmer
 * pre-fills the top questions after a kundli is opened.
 */

exports.up = async function (knex) {
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

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('kundli_ai_answers');
};
