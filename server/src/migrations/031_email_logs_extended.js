exports.up = knex => knex.schema.table('email_logs', t => {
  t.string('department', 20).nullable().after('template');
  t.string('from_address', 255).nullable().after('department');
  t.text('html_body').nullable().after('from_address');
});

exports.down = knex => knex.schema.table('email_logs', t => {
  t.dropColumn('html_body');
  t.dropColumn('from_address');
  t.dropColumn('department');
});
