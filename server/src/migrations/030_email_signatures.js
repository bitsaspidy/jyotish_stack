exports.up = knex => knex.schema.createTable('email_signatures', t => {
  t.increments('id');
  t.string('department', 20).notNullable().unique();
  t.text('signature_html').nullable();
  t.boolean('include_logo').defaultTo(true);
  t.boolean('is_active').defaultTo(false);
  t.timestamp('updated_at').defaultTo(knex.fn.now());
});

exports.down = knex => knex.schema.dropTableIfExists('email_signatures');
