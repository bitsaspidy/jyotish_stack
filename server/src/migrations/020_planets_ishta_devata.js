'use strict';
// Remedy Class 1 — adds Ishta Devata + Primary Suktam columns to planets.
// Source: "Vedic Jyotish Remedial Manual" by Saiansh Arya, 4th May 2026.

exports.up = async (knex) => {
  await knex.schema.table('planets', (t) => {
    t.string('ishta_devata_en', 250).nullable();
    t.string('ishta_devata_hi', 250).nullable();
    t.text('primary_suktam_en').nullable();   // pipe-separated list of suktam/stotra names
    t.text('primary_suktam_hi').nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.table('planets', (t) => {
    t.dropColumn('ishta_devata_en');
    t.dropColumn('ishta_devata_hi');
    t.dropColumn('primary_suktam_en');
    t.dropColumn('primary_suktam_hi');
  });
};
