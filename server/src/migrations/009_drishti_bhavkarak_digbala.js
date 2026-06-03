'use strict';

/**
 * Migration 009 — Drishti, Bhav Karak, Digbala reference tables
 * Source: "Drishti, Bhav Karak and Digbala.pdf"
 */
exports.up = function (knex) {
  return knex.schema
    // ── Graha Drishti rules ──────────────────────────────────────────────────
    .createTable('graha_drishti_rules', (t) => {
      t.increments('id').primary();
      t.string('planet', 30).notNullable();        // Sun, Moon, Mars …
      t.integer('aspect_offset').notNullable();    // 3,4,5,7,8,9,10
      t.string('nature', 30).notNullable();        // auspicious, aggressive, karmic, neutral, restricting
      t.text('description_en').nullable();
      t.text('description_hi').nullable();
      t.timestamps(true, true);
      t.unique(['planet', 'aspect_offset']);
    })
    // ── Bhav Karak Grahas ────────────────────────────────────────────────────
    .createTable('bhav_karak', (t) => {
      t.increments('id').primary();
      t.integer('house_num').unsigned().notNullable();     // 1–12
      t.string('karaka_planet', 30).notNullable();         // Sun, Moon …
      t.integer('karaka_order').defaultTo(1);              // primary=1, secondary=2
      t.string('signification_en', 300).nullable();
      t.string('signification_hi', 300).nullable();
      t.text('notes_en').nullable();
      t.timestamps(true, true);
      t.unique(['house_num', 'karaka_planet']);
    })
    // ── Digbala rules ────────────────────────────────────────────────────────
    .createTable('digbala_rules', (t) => {
      t.increments('id').primary();
      t.string('planet', 30).notNullable().unique();
      t.integer('strong_house').unsigned().notNullable();  // 1, 4, 7, or 10
      t.string('direction_en', 20).notNullable();          // East, North, West, South
      t.string('direction_hi', 20).nullable();
      t.text('description_en').nullable();
      t.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('digbala_rules')
    .dropTableIfExists('bhav_karak')
    .dropTableIfExists('graha_drishti_rules');
};
