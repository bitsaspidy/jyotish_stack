exports.up = function (knex) {
  return knex.schema.createTable('app_settings', (t) => {
    t.increments('id').primary();
    t.string('key', 100).notNullable().unique();
    t.text('value').nullable();
    t.string('description', 500).nullable();
    t.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('app_settings');
};
