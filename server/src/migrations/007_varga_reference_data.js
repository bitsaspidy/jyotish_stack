// Migration 007 - Varga / Divisional Chart Reference Data
// Source: "Divisional Charts (Varga)" pasted PDF text.

exports.up = function (knex) {
  return knex.schema
    .createTable('varga_charts', (t) => {
      t.integer('id').unsigned().primary();           // 1,2,3,4,5,7,8,9...
      t.string('code', 10).notNullable().unique();    // D1, D9, D60
      t.string('slug', 30).notNullable().unique();    // d1, d9, d60
      t.integer('division').unsigned().notNullable().unique();
      t.string('name_en', 120).notNullable();
      t.string('name_hi', 120).nullable();
      t.string('name_sanskrit', 120).nullable();
      t.string('primary_domain', 250).notNullable();
      t.string('division_note', 250).notNullable();
      t.string('signifies_en', 250).notNullable();
      t.text('signifies_hi').nullable();
      t.text('description_en').notNullable();
      t.text('description_hi').nullable();
      t.json('key_uses_en').nullable();
      t.json('key_uses_hi').nullable();
      t.text('calculation_rule').notNullable();
      t.text('precision_note').nullable();
      t.boolean('is_high_precision').defaultTo(false);
      t.string('source', 200).notNullable();
      t.timestamps(true, true);
    })
    .createTable('varga_family_references', (t) => {
      t.increments('id').primary();
      t.string('topic', 160).notNullable().unique();
      t.text('charts_houses_to_check').notNullable();
      t.text('notes').nullable();
      t.string('source', 200).notNullable();
      t.timestamps(true, true);
    })
    .createTable('varga_chart_relationships', (t) => {
      t.increments('id').primary();
      t.integer('varga_chart_id').unsigned().notNullable()
        .references('id').inTable('varga_charts').onDelete('CASCADE');
      t.string('relationship_topic', 160).notNullable();
      t.text('house_or_karaka').notNullable();
      t.text('how_to_read').notNullable();
      t.string('source', 200).notNullable();
      t.timestamps(true, true);

      t.index(['varga_chart_id'], 'idx_varga_rel_chart');
      t.unique(['varga_chart_id', 'relationship_topic'], 'uq_varga_rel_chart_topic');
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('varga_chart_relationships')
    .dropTableIfExists('varga_family_references')
    .dropTableIfExists('varga_charts');
};
