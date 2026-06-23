exports.up = function (knex) {
  return knex.schema.createTable('mantras', (t) => {
    t.increments('id').primary();
    t.string('slug', 100).unique().notNullable();
    t.string('deity', 100);
    t.enum('category', ['opening','planet','festival','general']).defaultTo('general');
    t.text('name_hi');
    t.text('name_en');
    t.text('description_hi');
    t.text('description_en');
    t.text('mantra_text_sanskrit');
    t.text('mantra_text_hindi');
    t.text('mantra_text_english');
    t.text('meaning_hi');
    t.text('meaning_en');
    t.text('benefits_hi');
    t.text('benefits_en');
    t.integer('jap_count').defaultTo(108);
    t.integer('display_order').defaultTo(0);
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('mantras');
};
