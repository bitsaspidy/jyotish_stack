'use strict';
// AstroAnsh Class 13 — Combustion (Asta) & Retrogression (Vakri) library.
// Single flexible content table (same pattern as jyotish_basics):
// categories: combust_planet, combust_house, retro_house, retro_rule,
// combust_rule, remedy, misconception, strength_rank

exports.up = async (knex) => {
  await knex.schema.createTable('asta_vakri_library', (t) => {
    t.increments('id').primary();
    t.string('category', 40).notNullable().index();
    t.string('item_key', 60).notNullable();
    t.string('title_en', 300);
    t.string('title_hi', 300);
    t.text('description_en');
    t.text('description_hi');
    t.json('effects_en');   // array of bullet strings
    t.json('effects_hi');
    t.json('extra_data');   // orbs, mantra/daan/yantra/gem/deity, stars etc.
    t.string('source', 200);
    t.integer('sort_order').defaultTo(0);
    t.timestamps(true, true);
    t.unique(['category', 'item_key']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('asta_vakri_library');
};
