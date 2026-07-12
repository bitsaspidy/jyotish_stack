'use strict';
/**
 * Migration 048 — drop the Ollama answer-cache table (STAGED, Stage 2).
 *
 * ⚠️ This file lives in migrations-staged/ ON PURPOSE: it must NOT run during
 * Stage 1 (a `migrate:latest` on any environment would apply it). Move it into
 * src/migrations/ only when Stage 2 (application-level Ollama removal) begins,
 * AFTER the deterministic UI + pilot-template flow is approved and after
 * confirming no runtime code still reads/writes kundli_ai_answers.
 *
 * Knex-history compatible: standard up/down; down() recreates the exact
 * original schema from migration 045 (which is kept — never delete an applied
 * migration file).
 */

exports.up = async function (knex) {
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
