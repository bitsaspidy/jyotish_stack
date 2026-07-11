'use strict';
/**
 * Migration 046 — deterministic Q&A catalogue foundation (Phase 2).
 * Tables: question_categories, question_catalogue (Q001–Q100),
 * question_requirements (1:1 astrology config), question_legacy_alias.
 * Answer templates + audit + rule registry live in migration 047.
 * Additive + fully reversible.
 */

exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('question_categories'))) {
    await knex.schema.createTable('question_categories', (t) => {
      t.increments('id').primary();
      t.string('code', 32).notNullable().unique();
      t.string('label_en', 120).notNullable();
      t.string('label_hi', 120).notNullable();
      t.integer('display_order').notNullable().defaultTo(0);
      t.boolean('active').notNullable().defaultTo(true);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('question_catalogue'))) {
    await knex.schema.createTable('question_catalogue', (t) => {
      t.increments('id').primary();
      t.string('code', 4).notNullable().unique();                 // Q001–Q100
      t.string('category_code', 32).notNullable()
        .references('code').inTable('question_categories').onUpdate('CASCADE');
      t.string('subcategory', 48).nullable();
      t.text('question_en').notNullable();
      t.text('question_hi').notNullable();
      t.string('short_title_en', 120).notNullable();
      t.string('short_title_hi', 120).notNullable();
      t.text('desc_en').nullable();
      t.text('desc_hi').nullable();
      t.integer('display_order').notNullable().defaultTo(0);
      t.boolean('active').notNullable().defaultTo(true);
      t.string('disclaimer_type', 24).notNullable().defaultTo('general');   // none|general|medical|financial|marriage
      t.string('min_data_policy', 16).notNullable().defaultTo('lenient');   // lenient|strict
      t.string('fallback_block_key', 64).nullable();
      t.integer('rule_version').notNullable().defaultTo(1);
      t.integer('template_version').notNullable().defaultTo(1);
      t.timestamps(true, true);
      t.index(['category_code', 'display_order']);
      t.index(['active']);
    });
  }

  if (!(await knex.schema.hasTable('question_requirements'))) {
    await knex.schema.createTable('question_requirements', (t) => {
      t.increments('id').primary();
      t.string('question_code', 4).notNullable().unique()
        .references('code').inTable('question_catalogue').onUpdate('CASCADE').onDelete('CASCADE');
      t.json('houses').notNullable();
      t.json('house_lords').notNullable();
      t.json('planets').notNullable();
      t.json('divisional_charts').notNullable();
      t.json('dasha_levels').notNullable();
      t.boolean('needs_current_transit').notNullable().defaultTo(false);
      t.boolean('needs_dated_transit').notNullable().defaultTo(false);
      t.boolean('needs_yoga').notNullable().defaultTo(true);
      t.boolean('needs_remedy').notNullable().defaultTo(false);
      t.boolean('shadbala_enhances').notNullable().defaultTo(false);
      t.boolean('ashtakavarga_enhances').notNullable().defaultTo(false);
      t.json('answer_sections').notNullable();
      t.json('required_fields').notNullable();
      t.string('missing_data_behaviour', 16).notNullable().defaultTo('degrade');   // degrade|block
      t.text('notes').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('question_legacy_alias'))) {
    await knex.schema.createTable('question_legacy_alias', (t) => {
      t.increments('id').primary();
      t.string('legacy_key', 64).notNullable().unique();
      t.string('question_code', 4).nullable()
        .references('code').inTable('question_catalogue').onUpdate('CASCADE').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('aliased');   // aliased|retired
      t.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('question_legacy_alias');
  await knex.schema.dropTableIfExists('question_requirements');
  await knex.schema.dropTableIfExists('question_catalogue');
  await knex.schema.dropTableIfExists('question_categories');
};
