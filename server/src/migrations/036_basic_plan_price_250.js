exports.up = async (knex) => {
  await knex('subscription_plans')
    .whereRaw("LOWER(name) = 'basic'")
    .update({ price: 250 });
};

exports.down = async (knex) => {
  await knex('subscription_plans')
    .whereRaw("LOWER(name) = 'basic'")
    .update({ price: 200 });
};
