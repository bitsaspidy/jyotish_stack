exports.up = function (knex) {
  return knex.schema
    .createTable('upagrahas', (t) => {
      t.increments('id').primary();
      t.string('slug', 50).unique().notNullable();
      t.string('name_en', 100).notNullable();
      t.string('name_hi', 100);
      t.text('literal_meaning_en');
      t.text('literal_meaning_hi');
      t.text('nature_en');
      t.text('nature_hi');
      t.text('symbolism_en');
      t.text('symbolism_hi');
      t.text('positive_traits_en');
      t.text('positive_traits_hi');
      t.text('negative_traits_en');
      t.text('negative_traits_hi');
      t.text('psychological_en');
      t.text('psychological_hi');
      t.text('spiritual_en');
      t.text('spiritual_hi');
      t.text('formula_en');
      t.text('formula_hi');
      t.text('key_indication_en');
      t.text('key_indication_hi');
      t.boolean('is_malefic').defaultTo(false);
      t.boolean('is_benefic').defaultTo(false);
      t.integer('display_order').defaultTo(0);
    })
    .createTable('upagraha_house_effects', (t) => {
      t.increments('id').primary();
      t.string('upagraha_slug', 50).notNullable();
      t.integer('house_number').notNullable();
      t.text('effect_en');
      t.text('effect_hi');
      t.unique(['upagraha_slug', 'house_number']);
    })
    .createTable('upagraha_planet_conjunctions', (t) => {
      t.increments('id').primary();
      t.string('upagraha_slug', 50).notNullable();
      t.string('planet_slug', 30).notNullable();
      t.text('effect_en');
      t.text('effect_hi');
      t.unique(['upagraha_slug', 'planet_slug']);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('upagraha_planet_conjunctions')
    .dropTableIfExists('upagraha_house_effects')
    .dropTableIfExists('upagrahas');
};
