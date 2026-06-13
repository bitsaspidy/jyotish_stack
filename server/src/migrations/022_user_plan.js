'use strict';
// Adds plan tier column to users: basic (default, 200Rs) | premium (PDF export unlocked)
// Admin access is controlled by the existing role column — no plan change needed for admins.

exports.up = async (knex) => {
  await knex.schema.table('users', (t) => {
    t.enum('plan', ['basic', 'premium']).notNullable().defaultTo('basic').after('role');
  });
};

exports.down = async (knex) => {
  await knex.schema.table('users', (t) => {
    t.dropColumn('plan');
  });
};
