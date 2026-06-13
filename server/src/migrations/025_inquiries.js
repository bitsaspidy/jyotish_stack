exports.up = async (knex) => {
  await knex.schema.createTable('inquiries', (t) => {
    t.increments('id');
    t.string('name', 100).notNullable();
    t.string('email', 150).notNullable();
    t.string('phone', 30).nullable();
    t.string('subject', 200).nullable();
    t.text('message').notNullable();
    t.enum('status', ['new', 'read', 'replied']).defaultTo('new');
    t.text('admin_note').nullable();
    t.string('source', 50).defaultTo('contact_form'); // contact_form | website | other
    t.string('ip_address', 50).nullable();
    t.timestamp('replied_at').nullable();
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('inquiries');
};
