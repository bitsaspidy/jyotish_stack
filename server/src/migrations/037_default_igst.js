exports.up = async (knex) => {
  await knex('app_settings')
    .insert({ key: 'tax_split_mode', value: 'igst', description: 'Invoice / GST setting' })
    .onConflict('key')
    .merge({ value: 'igst' });
};

exports.down = async (knex) => {
  await knex('app_settings')
    .where({ key: 'tax_split_mode' })
    .update({ value: 'auto' });
};
