'use strict';

exports.up = async function up(knex) {
  const exists = await knex.schema.hasColumn('kundli_profiles', 'marital_status');
  if (!exists) {
    await knex.schema.alterTable('kundli_profiles', (table) => {
      table.string('marital_status', 20).nullable().after('gender');
    });
  }
};

exports.down = async function down(knex) {
  const exists = await knex.schema.hasColumn('kundli_profiles', 'marital_status');
  if (exists) {
    await knex.schema.alterTable('kundli_profiles', (table) => {
      table.dropColumn('marital_status');
    });
  }
};
