exports.up = async (knex) => {
  await knex.schema.createTable('team_members', (t) => {
    t.increments('id');
    t.string('name', 100).notNullable();
    t.string('role', 100).notNullable();
    t.text('bio').nullable();
    t.string('avatar', 500).nullable();
    t.string('linkedin', 300).nullable();
    t.string('twitter', 300).nullable();
    t.integer('sort_order').defaultTo(0);
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('team_members');
};
