'use strict';
// Source: AstroAnsh Class 2 Premium Notes — Nine Grahas bilingual study guide
// Adds season, health conditions, professions, key relations, physical manifestations

exports.up = async function (knex) {
  await knex.schema.alterTable('planets', (t) => {
    t.string('season', 200).nullable();
    t.string('season_hi', 300).nullable();
    t.specificType('health_conditions_en', 'LONGTEXT').nullable();
    t.specificType('health_conditions_hi', 'LONGTEXT').nullable();
    t.specificType('professions_en', 'LONGTEXT').nullable();
    t.specificType('professions_hi', 'LONGTEXT').nullable();
    t.specificType('key_relations_en', 'LONGTEXT').nullable();
    t.specificType('key_relations_hi', 'LONGTEXT').nullable();
    t.specificType('physical_manifestations_en', 'LONGTEXT').nullable();
    t.specificType('physical_manifestations_hi', 'LONGTEXT').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('planets', (t) => {
    t.dropColumn('season');
    t.dropColumn('season_hi');
    t.dropColumn('health_conditions_en');
    t.dropColumn('health_conditions_hi');
    t.dropColumn('professions_en');
    t.dropColumn('professions_hi');
    t.dropColumn('key_relations_en');
    t.dropColumn('key_relations_hi');
    t.dropColumn('physical_manifestations_en');
    t.dropColumn('physical_manifestations_hi');
  });
};
