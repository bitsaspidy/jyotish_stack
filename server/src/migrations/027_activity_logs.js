exports.up = async (knex) => {
  await knex.schema.createTable('activity_logs', (t) => {
    t.increments('id');
    t.integer('admin_id').unsigned().nullable();
    t.string('admin_name', 100).nullable();
    t.string('action', 60).notNullable();   // create | update | delete | login | logout
    t.string('entity', 60).notNullable();   // blog_post | testimonial | user | kundli | ...
    t.string('entity_id', 60).nullable();
    t.text('detail').nullable();
    t.string('ip_address', 50).nullable();
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('activity_logs');
};
