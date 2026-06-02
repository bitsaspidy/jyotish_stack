// Migration 006 — House Lord Interpretations
// Source: "Lord of every house in 12 houses.pdf" (to be fully seeded from PDF content)

exports.up = function (knex) {
  return knex.schema.createTable('house_lord_interpretations', (t) => {
    t.increments('id').primary();
    t.integer('house_lord').unsigned().notNullable();   // 1–12: which house's lord (e.g., 5th lord)
    t.integer('placed_in_house').unsigned().notNullable(); // 1–12: house where lord is sitting
    t.string('title', 300).nullable();
    t.string('title_hi', 300).nullable();
    t.text('interpretation_en').notNullable();
    t.text('interpretation_hi').nullable();
    t.json('key_results_en').nullable();               // array of bullet points
    t.json('key_results_hi').nullable();
    t.enum('overall_effect', ['highly_positive','positive','neutral','negative','highly_negative']).defaultTo('neutral');
    t.string('source', 200).nullable();                // e.g., "Lord of every house in 12 houses.pdf"
    t.timestamps(true, true);

    t.unique(['house_lord', 'placed_in_house']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('house_lord_interpretations');
};
