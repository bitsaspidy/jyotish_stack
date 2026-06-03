exports.up = async (knex) => {
  // Planet → Ishta Devata + Mantras
  await knex.schema.createTable('remedy_planets', (t) => {
    t.increments('id');
    t.string('planet', 20).notNullable().unique();
    t.string('planet_hi', 40).notNullable();
    t.string('ishta_devata_en', 100).notNullable();
    t.string('ishta_devata_hi', 100).notNullable();
    t.text('mantras_en');        // JSON array of mantra names
    t.text('mantras_hi');        // JSON array of mantra names in Hindi
    t.text('special_notes_en');
    t.text('special_notes_hi');
    t.string('tradition', 20).defaultTo('both'); // vedic | pauranik | both
    t.timestamps(true, true);
  });

  // Problem → Prescribed Mantra (Section 7 of PDF)
  await knex.schema.createTable('remedy_problems', (t) => {
    t.increments('id');
    t.string('problem_en', 100).notNullable();
    t.string('problem_hi', 100).notNullable();
    t.string('planet', 20);
    t.string('devata_en', 100);
    t.string('devata_hi', 100);
    t.text('mantras_en');        // JSON array
    t.text('mantras_hi');        // JSON array
    t.text('notes_en');
    t.text('notes_hi');
    t.timestamps(true, true);
  });

  // Daily Puja Sequence (Section 6 of PDF)
  await knex.schema.createTable('remedy_puja_steps', (t) => {
    t.increments('id');
    t.string('step_key', 10).notNullable(); // '0','1','2','3','tc'
    t.integer('sort_order').defaultTo(0);
    t.string('action_en', 100).notNullable();
    t.string('action_hi', 100).notNullable();
    t.text('description_en').notNullable();
    t.text('description_hi').notNullable();
    t.boolean('is_conditional').defaultTo(false);
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('remedy_puja_steps');
  await knex.schema.dropTableIfExists('remedy_problems');
  await knex.schema.dropTableIfExists('remedy_planets');
};
