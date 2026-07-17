'use strict';
/**
 * Migration 052 — inquiries.department: ENUM → VARCHAR(20).
 *
 * Migration 028 created this as ENUM('sales','team','account','general'). Adding a
 * 'legal' department for the Grievance Officer address therefore required a schema
 * change, and any department added later would too — MySQL rejects an unlisted
 * ENUM value with "Data truncated for column", which surfaces as a failed contact
 * submission rather than anything obviously schema-shaped.
 *
 * This project already learned that lesson once: migration 029 converted
 * email_logs.template from ENUM to VARCHAR for exactly this reason, and
 * email_signatures.department / email_logs.department were both created as
 * VARCHAR(20) afterwards. inquiries.department was the last ENUM holdout, so it
 * is converted rather than extended — the next department needs no migration.
 *
 * The application owns the valid list (VALID_DEPARTMENTS in public.routes.js),
 * which validates before insert. Widening the column does not widen what is
 * accepted.
 *
 * Data-safe: every existing value is a short string that fits VARCHAR(20), so the
 * conversion cannot truncate. Reversible — down() restores the ENUM, but see the
 * note there.
 */

exports.up = async (knex) => {
  await knex.schema.alterTable('inquiries', (t) => {
    t.string('department', 20).notNullable().defaultTo('general').alter();
  });
};

exports.down = async (knex) => {
  // Any row already using a department outside the original four (e.g. 'legal')
  // cannot be represented by the old ENUM. Fold those back to 'general' first,
  // otherwise MySQL silently coerces them to '' and the rows become unroutable.
  await knex('inquiries').whereNotIn('department', ['sales', 'team', 'account', 'general']).update({ department: 'general' });
  await knex.schema.alterTable('inquiries', (t) => {
    t.enum('department', ['sales', 'team', 'account', 'general']).notNullable().defaultTo('general').alter();
  });
};
