'use strict';
/**
 * Migration 011 — Nakshatra Detailed Notes
 * Adds 12 new TEXT/JSON columns for detailed nakshatra data:
 * characteristics, negative traits, professions, health info
 * Source: AstroAnsh Class 9 — Detailed Nakshatra Notes (EN + HI)
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('nakshatras', (table) => {
    table.text('characteristics_en').nullable();
    table.text('characteristics_hi').nullable();
    table.text('negative_traits_en').nullable();
    table.text('negative_traits_hi').nullable();
    table.longText('professions_en').nullable();  // JSON array of {category, roles[]}
    table.longText('professions_hi').nullable();
    table.text('health_issues_en').nullable();
    table.text('health_issues_hi').nullable();
    table.text('health_root_cause_en').nullable();
    table.text('health_root_cause_hi').nullable();
    table.text('health_guidance_en').nullable();
    table.text('health_guidance_hi').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('nakshatras', (table) => {
    table.dropColumn('characteristics_en');
    table.dropColumn('characteristics_hi');
    table.dropColumn('negative_traits_en');
    table.dropColumn('negative_traits_hi');
    table.dropColumn('professions_en');
    table.dropColumn('professions_hi');
    table.dropColumn('health_issues_en');
    table.dropColumn('health_issues_hi');
    table.dropColumn('health_root_cause_en');
    table.dropColumn('health_root_cause_hi');
    table.dropColumn('health_guidance_en');
    table.dropColumn('health_guidance_hi');
  });
};
