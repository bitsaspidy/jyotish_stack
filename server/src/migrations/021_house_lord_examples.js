exports.up = async (knex) => {
  await knex.schema.table('house_lord_interpretations', (t) => {
    t.text('example_en').nullable();
    t.text('example_hi').nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.table('house_lord_interpretations', (t) => {
    t.dropColumn('example_en');
    t.dropColumn('example_hi');
  });
};
