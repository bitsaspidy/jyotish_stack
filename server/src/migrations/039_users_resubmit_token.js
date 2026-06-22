exports.up = function (knex) {
  return knex.schema.table('users', (t) => {
    t.string('resubmit_token', 100).nullable();
    t.timestamp('resubmit_token_expires').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table('users', (t) => {
    t.dropColumn('resubmit_token');
    t.dropColumn('resubmit_token_expires');
  });
};
