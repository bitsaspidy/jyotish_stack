'use strict';
// Migration 016 — AstroAnsh Class 3 & 4 Data Enhancements
// Source: "AstroAnsh Class 3,4 and characteristics of Bhavas Premium Notes.pdf"
// Adds: Planet classification (guna/varna/court_role/deity),
//        Zodiac sign key traits + detailed descriptions,
//        House keywords, topics, health organs, detailed notes

exports.up = async function (knex) {
  // ── planets: add BPHS classification fields ─────────────────────────────
  await knex.schema.alterTable('planets', (t) => {
    t.string('guna', 20).nullable();          // Satvik / Rajsik / Tamsik
    t.string('guna_hi', 40).nullable();
    t.string('varna', 30).nullable();         // Kshatriya / Vaishya / Brahmin / Shudra / Malechha
    t.string('varna_hi', 60).nullable();
    t.string('court_role', 40).nullable();    // King / Queen / Commander / Prince / Minister / Servant / Army
    t.string('court_role_hi', 60).nullable();
    t.string('deity', 120).nullable();
    t.string('deity_hi', 200).nullable();
  });

  // ── zodiac_signs: add detailed trait fields ──────────────────────────────
  await knex.schema.alterTable('zodiac_signs', (t) => {
    t.string('key_traits_en', 300).nullable();
    t.string('key_traits_hi', 400).nullable();
    t.specificType('detailed_description_en', 'LONGTEXT').nullable();
    t.specificType('detailed_description_hi', 'LONGTEXT').nullable();
  });

  // ── houses: add keywords, topics, health organs, detailed notes ──────────
  await knex.schema.alterTable('houses', (t) => {
    t.string('keywords_en', 300).nullable();
    t.string('keywords_hi', 400).nullable();
    t.specificType('topics_en', 'TEXT').nullable();
    t.specificType('topics_hi', 'TEXT').nullable();
    t.string('health_organs_en', 350).nullable();
    t.string('health_organs_hi', 450).nullable();
    t.specificType('detailed_notes_en', 'LONGTEXT').nullable();
    t.specificType('detailed_notes_hi', 'LONGTEXT').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('planets', (t) => {
    ['guna', 'guna_hi', 'varna', 'varna_hi', 'court_role', 'court_role_hi', 'deity', 'deity_hi']
      .forEach((col) => t.dropColumn(col));
  });
  await knex.schema.alterTable('zodiac_signs', (t) => {
    ['key_traits_en', 'key_traits_hi', 'detailed_description_en', 'detailed_description_hi']
      .forEach((col) => t.dropColumn(col));
  });
  await knex.schema.alterTable('houses', (t) => {
    ['keywords_en', 'keywords_hi', 'topics_en', 'topics_hi',
      'health_organs_en', 'health_organs_hi', 'detailed_notes_en', 'detailed_notes_hi']
      .forEach((col) => t.dropColumn(col));
  });
};
