'use strict';
// Source: AstroAnsh Class 11 and 12 Premium Notes — Yogas and Doshas.pdf (BPHS-based)

exports.up = async function (knex) {
  await knex.schema.createTable('yogas_library', (t) => {
    t.increments('id');
    t.string('name', 120).notNullable();
    t.string('name_hi', 300).notNullable();
    t.string('category', 60).notNullable().defaultTo('general');
    t.text('definition_en');
    t.text('definition_hi');
    t.text('formation_en');
    t.text('formation_hi');
    t.text('symptoms_en');
    t.text('symptoms_hi');
    t.text('effects_en');
    t.text('effects_hi');
    t.text('cancellation_en');
    t.text('cancellation_hi');
    t.string('source', 100).defaultTo('BPHS');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('doshas_library', (t) => {
    t.increments('id');
    t.string('name', 120).notNullable();
    t.string('name_hi', 300).notNullable();
    t.string('category', 60).notNullable().defaultTo('general');
    t.text('definition_en');
    t.text('definition_hi');
    t.text('formation_en');
    t.text('formation_hi');
    t.text('symptoms_en');
    t.text('symptoms_hi');
    t.text('effects_en');
    t.text('effects_hi');
    t.text('technical_note_en');
    t.text('technical_note_hi');
    t.string('source', 100).defaultTo('BPHS');
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('doshas_library');
  await knex.schema.dropTableIfExists('yogas_library');
};
