'use strict';
// Migration 034 — Kundli Judgement Priority Engine rule tables
// NOTE: drops tables first so a previously-failed partial run is cleaned up safely.

exports.up = async (knex) => {
  // Drop in reverse-dependency order in case a prior failed run left partial tables
  await knex.schema.dropTableIfExists('astrology_special_planet_rules');
  await knex.schema.dropTableIfExists('astrology_house_lord_rules');
  await knex.schema.dropTableIfExists('astrology_yoga_activation_rules');
  await knex.schema.dropTableIfExists('astrology_judgement_rules');
  await knex.schema.dropTableIfExists('astrology_rule_categories');

  // 1. Rule categories
  await knex.schema.createTable('astrology_rule_categories', t => {
    t.increments('id');
    t.string('key', 80).notNullable().unique();
    t.string('name_en', 120).notNullable();
    t.string('name_hi', 120).notNullable();
    t.text('description').nullable();
    t.enum('status', ['active','inactive']).defaultTo('active');
    t.timestamps(true, true);
  });

  // 2. General judgement rules with JSON conditions
  await knex.schema.createTable('astrology_judgement_rules', t => {
    t.increments('id');
    t.string('rule_key', 120).notNullable().unique();
    t.string('category_key', 80).notNullable();
    t.string('applies_to', 80).notNullable()
      .comment('lagna_lord|sun|moon|yoga|dosha|house_lord|planet|ashtakavarga|rahu|navamsha|karaka|marriage|children|gains');
    t.json('condition_json').nullable();
    t.integer('priority').defaultTo(5);
    t.decimal('weight', 5, 2).defaultTo(1.0);
    t.enum('blocker_level', ['none','mild','medium','strong','severe']).defaultTo('none');
    t.enum('activation_type', ['full','partial','blocked','conditional']).defaultTo('full');
    t.text('output_en').nullable();
    t.text('output_hi').nullable();
    t.text('advice_en').nullable();
    t.text('advice_hi').nullable();
    t.text('caution_en').nullable();
    t.text('caution_hi').nullable();
    t.text('admin_reason_en').nullable();
    t.text('admin_reason_hi').nullable();
    t.enum('status', ['active','inactive']).defaultTo('active');
    t.timestamps(true, true);
  });

  // 3. Yoga activation rules
  await knex.schema.createTable('astrology_yoga_activation_rules', t => {
    t.increments('id');
    t.string('yoga_key', 120).notNullable().unique();
    t.json('required_conditions_json').nullable();
    t.json('blocking_conditions_json').nullable();
    t.json('reducer_conditions_json').nullable();
    t.json('amplifier_conditions_json').nullable();
    t.integer('activation_score_min').defaultTo(0);
    t.text('output_en').nullable();
    t.text('output_hi').nullable();
    t.text('admin_reason').nullable();
    t.enum('status', ['active','inactive']).defaultTo('active');
    t.timestamps(true, true);
  });

  // 4. House lord placement rules (supplements house_lord_interpretations)
  await knex.schema.createTable('astrology_house_lord_rules', t => {
    t.increments('id');
    t.integer('house_number').notNullable();
    t.integer('lord_placed_in_house').notNullable();
    t.string('strength_condition', 40).nullable()
      .comment('strong|weak|debilitated|afflicted|upachaya|any');
    t.text('output_en').nullable();
    t.text('output_hi').nullable();
    t.text('advice_en').nullable();
    t.text('advice_hi').nullable();
    t.text('caution_en').nullable();
    t.text('caution_hi').nullable();
    t.enum('status', ['active','inactive']).defaultTo('active');
    t.timestamps(true, true);
    // Explicit short name to stay within MySQL's 64-char identifier limit
    t.unique(['house_number', 'lord_placed_in_house', 'strength_condition'], { indexName: 'ahl_house_lord_strength_uq' });
  });

  // 5. Special planet placement rules (e.g., Rahu in houses)
  await knex.schema.createTable('astrology_special_planet_rules', t => {
    t.increments('id');
    t.string('planet', 20).notNullable();
    t.integer('house_number').notNullable();
    t.string('condition_key', 80).nullable();
    t.text('output_en').nullable();
    t.text('output_hi').nullable();
    t.text('advice_en').nullable();
    t.text('advice_hi').nullable();
    t.text('caution_en').nullable();
    t.text('caution_hi').nullable();
    t.enum('status', ['active','inactive']).defaultTo('active');
    t.timestamps(true, true);
    // Explicit short name to stay within MySQL's 64-char identifier limit
    t.unique(['planet', 'house_number', 'condition_key'], { indexName: 'aspr_planet_house_cond_uq' });
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('astrology_special_planet_rules');
  await knex.schema.dropTableIfExists('astrology_house_lord_rules');
  await knex.schema.dropTableIfExists('astrology_yoga_activation_rules');
  await knex.schema.dropTableIfExists('astrology_judgement_rules');
  await knex.schema.dropTableIfExists('astrology_rule_categories');
};
