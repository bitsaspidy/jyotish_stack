'use strict';
// Adds a routing column to inquiries so contact-form submissions are directed to the
// right mailbox: sales@ (sales), team@ (support/general), account@ (billing/account).

exports.up = async (knex) => {
  await knex.schema.alterTable('inquiries', (t) => {
    t.enum('department', ['sales', 'team', 'account', 'general'])
      .notNullable().defaultTo('general').after('subject');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('inquiries', (t) => {
    t.dropColumn('department');
  });
};
