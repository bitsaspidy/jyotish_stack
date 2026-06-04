'use strict';
// Migration 017 — Bhava Classifications + EDOFEN Strength Data
// Source: "Name of Bhavas and EDOFEN.pdf" (3 pages)
// Page 1: Bhava type classifications (Kendra/Trikona/Upachaya/Dusthana/Maarak)
// Page 2: Exaltation 100% / Own 70% / Debilitation 10% + Rahu/Ketu dignity
// Page 3: Complete Naisargika Maitri (Permanent Friendship) 9×9 matrix

exports.up = async function (knex) {
  // ── houses: add bhava classification columns ─────────────────────────────
  await knex.schema.alterTable('houses', (t) => {
    t.string('bhava_type', 20).nullable();          // primary: kendra/trikona/dusthana/upachaya/maarak/neutral
    t.specificType('bhava_groups', 'JSON').nullable(); // all groups: ['kendra','trikona'] etc.
    t.string('bhava_nature_en', 80).nullable();     // "Very Auspicious" / "Auspicious" / "Grows with Age" / "Evil / Dusthana" / "Death Causing"
    t.string('bhava_nature_hi', 120).nullable();
    t.boolean('is_kendra').defaultTo(false);
    t.boolean('is_trikona').defaultTo(false);
    t.boolean('is_dusthana').defaultTo(false);
    t.boolean('is_upachaya').defaultTo(false);
    t.boolean('is_maarak').defaultTo(false);
  });

  // ── planet_dignity: add Rahu / Ketu exaltation & debilitation rows ────────
  // Rows inserted in seed 014 — no schema change needed for planet_dignity
  // (existing schema already supports all 9 planets via planet_id FK)

  // ── planet_naisargika_maitri: permanent friendship 9×9 matrix ────────────
  await knex.schema.createTable('planet_naisargika_maitri', (t) => {
    t.increments('id').primary();
    t.string('planet', 20).notNullable();          // 'Sun', 'Moon', …, 'Rahu', 'Ketu'
    t.specificType('friends', 'JSON').notNullable(); // array of planet names
    t.specificType('neutral', 'JSON').notNullable();
    t.specificType('enemies', 'JSON').notNullable();
    t.text('notes').nullable();
    t.unique('planet');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('planet_naisargika_maitri');
  await knex.schema.alterTable('houses', (t) => {
    ['bhava_type', 'bhava_groups', 'bhava_nature_en', 'bhava_nature_hi',
      'is_kendra', 'is_trikona', 'is_dusthana', 'is_upachaya', 'is_maarak']
      .forEach((col) => t.dropColumn(col));
  });
};
