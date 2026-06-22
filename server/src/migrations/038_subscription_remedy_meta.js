exports.up = function (knex) {
  return knex.schema.table('user_subscriptions', (t) => {
    t.json('remedy_meta').nullable(); // birth data + lang stored for resend
  });
};

exports.down = function (knex) {
  return knex.schema.table('user_subscriptions', (t) => {
    t.dropColumn('remedy_meta');
  });
};
