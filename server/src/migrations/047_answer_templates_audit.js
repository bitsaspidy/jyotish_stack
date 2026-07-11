'use strict';
/**
 * Migration 047 — answer template store, shared blocks, rule registry, audit.
 * Applies the approved Phase-2 corrections:
 *  - answer_templates.condition_key + answer_state are NOT NULL (defaults) so the
 *    uniqueness index stays deterministic (MySQL allows duplicate NULLs in UNIQUE).
 *  - qa_audit stores primary_rule_group + matched_rule_groups(JSON) +
 *    conflicting_rule_groups(JSON), and separate data_completeness + confidence_level.
 *  - rule_registry gives every rule group a stable key + version + calc/source for
 *    reproducibility even while pilot rules are code-based.
 * No answer template ROWS are seeded here (pilot phase only). Additive + reversible.
 */

exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('answer_shared_blocks'))) {
    await knex.schema.createTable('answer_shared_blocks', (t) => {
      t.increments('id').primary();
      t.string('block_key', 64).notNullable();
      t.string('type', 32).notNullable();          // disclaimer_*/insufficient_data/remedy_generic
      t.string('lang', 5).notNullable();
      t.text('text', 'mediumtext').notNullable();
      t.integer('version').notNullable().defaultTo(1);
      t.boolean('active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['block_key', 'lang', 'version']);
    });
  }

  if (!(await knex.schema.hasTable('answer_templates'))) {
    await knex.schema.createTable('answer_templates', (t) => {
      t.increments('id').primary();
      t.string('question_code', 4).notNullable()
        .references('code').inTable('question_catalogue').onUpdate('CASCADE').onDelete('CASCADE');
      t.string('section_key', 32).notNullable();                       // direct_answer, kundli_indicates, …
      t.string('answer_state', 24).notNullable().defaultTo('any');     // 7 states or 'any' (non-null → deterministic unique)
      t.string('lang', 5).notNullable();
      t.string('condition_key', 48).notNullable().defaultTo('default'); // non-null default (correction #1)
      t.text('block_text', 'mediumtext').notNullable();
      t.integer('display_order').notNullable().defaultTo(0);
      t.integer('template_version').notNullable().defaultTo(1);
      t.boolean('active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['question_code', 'section_key', 'answer_state', 'lang', 'condition_key', 'template_version'], { indexName:'uq_answer_template' });
      t.index(['question_code', 'active', 'template_version']);
    });
  }

  if (!(await knex.schema.hasTable('rule_registry'))) {
    await knex.schema.createTable('rule_registry', (t) => {
      t.increments('id').primary();
      t.string('rule_key', 64).notNullable();       // stable identifier
      t.integer('rule_version').notNullable().defaultTo(1);
      t.string('calc_version', 32).notNullable();
      t.string('source', 191).notNullable();        // e.g. 'code:kundli-question.service' or a config ref
      t.json('definition').nullable();              // historical config when config-based
      t.text('description').nullable();
      t.boolean('active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['rule_key', 'rule_version']);
    });
  }

  if (!(await knex.schema.hasTable('qa_audit'))) {
    await knex.schema.createTable('qa_audit', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      t.integer('kundli_id').unsigned().nullable()
        .references('id').inTable('kundli_profiles').onDelete('SET NULL');
      t.string('question_code', 4).notNullable();
      t.string('lang', 5).notNullable();
      t.string('answer_state', 24).nullable();
      t.json('charts_used').nullable();
      t.json('dasha_levels_used').nullable();
      t.date('transit_date').nullable();
      t.tinyint('data_completeness').notNullable().defaultTo(0);   // 0–100 (correction #3)
      t.string('confidence_level', 8).nullable();                  // high|medium|low (correction #3)
      t.string('primary_rule_group', 64).nullable();               // correction #2
      t.json('matched_rule_groups').nullable();                    // correction #2
      t.json('conflicting_rule_groups').nullable();                // correction #2
      t.json('missing_inputs').nullable();
      t.integer('rule_version').nullable();
      t.integer('template_version').nullable();
      t.string('calc_version', 32).nullable();
      t.integer('duration_ms').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['question_code', 'created_at']);
      t.index(['user_id', 'created_at']);
      t.index(['kundli_id']);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('qa_audit');
  await knex.schema.dropTableIfExists('rule_registry');
  await knex.schema.dropTableIfExists('answer_templates');
  await knex.schema.dropTableIfExists('answer_shared_blocks');
};
