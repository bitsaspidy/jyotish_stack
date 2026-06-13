exports.up = async (knex) => {
  await knex.schema.createTable('testimonials', (t) => {
    t.increments('id');
    t.string('name', 100).notNullable();
    t.string('role', 100).nullable();
    t.string('location', 100).nullable();
    t.text('content').notNullable();
    t.integer('rating').defaultTo(5);
    t.string('avatar', 500).nullable();
    t.boolean('is_featured').defaultTo(false);
    t.integer('sort_order').defaultTo(0);
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('testimonials');
};
