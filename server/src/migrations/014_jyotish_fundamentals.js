'use strict';
// Source: AstroAnsh Class 1 Premium Notes — Vedas, Vedangas, Jyotish Angas,
//         Karma Theory, Hora System, Graha BPHS attributes

exports.up = async function (knex) {
  await knex.schema.createTable('jyotish_basics', (t) => {
    t.increments('id');
    t.string('category', 60).notNullable();
    // categories: veda | vedanga | jyotish_anga | jyotish_use | karma_type | hora_rule | graha_bphs
    t.string('item_key', 80).notNullable().unique();
    t.string('name_en', 200).notNullable();
    t.string('name_hi', 300).notNullable();
    t.text('description_en').nullable();
    t.text('description_hi').nullable();
    t.string('parent_key', 80).nullable();   // e.g. vedanga rows point to parent veda
    t.boolean('admin_only').defaultTo(true); // false = show in kundli UI
    t.integer('sort_order').defaultTo(0);
    t.json('extra_data').nullable();         // extra structured fields per category
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('jyotish_basics');
};
