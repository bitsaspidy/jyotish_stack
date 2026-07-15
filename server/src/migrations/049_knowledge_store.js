'use strict';
/**
 * Migration 049 — database-first knowledge store (Stage 3).
 *
 * A reusable, normalized, versioned, multilingual knowledge architecture so that
 * ALL future user-facing knowledge lives in the database (single source of
 * truth) rather than hardcoded in JavaScript. Admin edits + approval take effect
 * without a code deployment.
 *
 *   knowledge_categories   — grouping (yoga, dosha, house, planet, remedy, …)
 *   knowledge_items        — one language-INDEPENDENT record per knowledge unit
 *                            (uuid + stable_key + status + priority + visibility …)
 *   knowledge_translations — per-item, per-language content (no duplicated text)
 *   knowledge_item_versions— immutable snapshots for history + rollback
 *   knowledge_tags         — search/filter dimensions (planet/house/yoga/keyword…)
 *
 * Additive + fully reversible. Text lives ONLY in knowledge_translations; the
 * version table stores JSON snapshots purely as history.
 */

exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('knowledge_categories'))) {
    await knex.schema.createTable('knowledge_categories', (t) => {
      t.increments('id').primary();
      t.string('code', 48).notNullable().unique();
      t.string('label_en', 160).notNullable();
      t.string('label_hi', 160).notNullable();
      t.text('description').nullable();
      t.integer('display_order').notNullable().defaultTo(0);
      t.boolean('active').notNullable().defaultTo(true);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('knowledge_items'))) {
    await knex.schema.createTable('knowledge_items', (t) => {
      t.increments('id').primary();
      t.uuid('uuid').notNullable().unique();
      t.string('stable_key', 96).notNullable().unique();      // never changes
      t.string('category_code', 48).notNullable()
        .references('code').inTable('knowledge_categories').onUpdate('CASCADE');
      t.enu('status', ['draft', 'review', 'approved', 'archived'], { useNative: false, enumName: null })
        .notNullable().defaultTo('draft');                    // only 'approved' is user-visible
      t.enu('visibility', ['public', 'admin', 'internal'], { useNative: false, enumName: null })
        .notNullable().defaultTo('public');
      t.integer('priority').notNullable().defaultTo(0);       // ordering / precedence
      t.integer('current_version').notNullable().defaultTo(0);
      t.string('source', 191).nullable();                     // provenance (book, class, expert)
      t.text('search_keywords').nullable();
      t.string('created_by', 96).nullable();
      t.string('updated_by', 96).nullable();
      t.string('approved_by', 96).nullable();
      t.timestamp('approved_at').nullable();
      t.timestamps(true, true);
      t.index(['category_code', 'status']);
      t.index(['status', 'visibility']);
    });
  }

  if (!(await knex.schema.hasTable('knowledge_translations'))) {
    await knex.schema.createTable('knowledge_translations', (t) => {
      t.increments('id').primary();
      t.integer('item_id').unsigned().notNullable()
        .references('id').inTable('knowledge_items').onDelete('CASCADE');
      t.string('lang', 5).notNullable();                      // en, hi, gu, mr, ta, te, pa …
      t.string('title', 240).nullable();
      t.text('body', 'mediumtext').notNullable();
      t.text('summary').nullable();
      t.timestamps(true, true);
      t.unique(['item_id', 'lang']);                          // one row per language
    });
  }

  if (!(await knex.schema.hasTable('knowledge_item_versions'))) {
    await knex.schema.createTable('knowledge_item_versions', (t) => {
      t.increments('id').primary();
      t.integer('item_id').unsigned().notNullable()
        .references('id').inTable('knowledge_items').onDelete('CASCADE');
      t.integer('version').notNullable();
      t.string('status_at_version', 16).notNullable();
      t.json('snapshot').notNullable();                       // full item + all translations + tags
      t.string('created_by', 96).nullable();
      t.text('note').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.unique(['item_id', 'version']);
      t.index(['item_id']);
    });
  }

  if (!(await knex.schema.hasTable('knowledge_tags'))) {
    await knex.schema.createTable('knowledge_tags', (t) => {
      t.increments('id').primary();
      t.integer('item_id').unsigned().notNullable()
        .references('id').inTable('knowledge_items').onDelete('CASCADE');
      t.string('tag_type', 24).notNullable();                 // planet | house | yoga | dosha | life_area | keyword
      t.string('tag_value', 96).notNullable();
      t.unique(['item_id', 'tag_type', 'tag_value']);
      t.index(['tag_type', 'tag_value']);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('knowledge_tags');
  await knex.schema.dropTableIfExists('knowledge_item_versions');
  await knex.schema.dropTableIfExists('knowledge_translations');
  await knex.schema.dropTableIfExists('knowledge_items');
  await knex.schema.dropTableIfExists('knowledge_categories');
};
