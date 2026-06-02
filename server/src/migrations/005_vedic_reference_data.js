// Migration 005 — Vedic Astrology Reference Tables
// Source: mooltrikone-and-actual-ed-sign.pdf + classical texts

exports.up = function (knex) {
  return knex.schema

    // ── 12 Rashis (Zodiac Signs) ────────────────────────────────
    .createTable('zodiac_signs', (t) => {
      t.integer('id').primary();                    // 1–12
      t.string('name', 60).notNullable();           // Aries
      t.string('name_hi', 60).notNullable();        // मेष
      t.string('name_sanskrit', 60).nullable();     // Mesha
      t.string('symbol', 10).nullable();            // ♈
      t.enum('element', ['fire','earth','air','water']).notNullable();
      t.enum('quality', ['cardinal','fixed','mutable']).notNullable();
      t.enum('gender', ['masculine','feminine']).notNullable();
      t.string('lord_planet', 20).notNullable();    // planet abbreviation
      t.decimal('start_degree', 6, 2).notNullable();// absolute 0–360
      t.decimal('end_degree', 6, 2).notNullable();
      t.text('description').nullable();
      t.text('description_hi').nullable();
    })

    // ── 9 Grahas (Planets) ──────────────────────────────────────
    .createTable('planets', (t) => {
      t.integer('id').primary();                    // 1–9
      t.string('name', 60).notNullable();           // Sun
      t.string('name_hi', 60).notNullable();        // सूर्य
      t.string('name_sanskrit', 60).nullable();     // Surya
      t.string('abbreviation', 5).notNullable();    // SU
      t.string('symbol', 10).nullable();            // ☉
      t.enum('nature', ['benefic','malefic','neutral','shadow']).notNullable();
      t.enum('gender', ['masculine','feminine','neutral']).notNullable();
      t.string('element', 20).nullable();
      t.string('weekday', 20).nullable();
      t.string('color', 40).nullable();
      t.string('gemstone', 60).nullable();
      t.string('gemstone_hi', 60).nullable();
      t.string('metal', 30).nullable();
      t.string('direction', 20).nullable();
      t.string('body_part', 100).nullable();
      t.string('body_part_hi', 100).nullable();
      t.boolean('is_shadow_planet').defaultTo(false);
      t.integer('vimshottari_years').nullable();    // Maha Dasha years
      t.text('characteristics').nullable();
      t.text('characteristics_hi').nullable();
    })

    // ── Planet Dignity (Uccha / Neecha / Moolatrikona / Own Sign) ─
    // Source: mooltrikone-and-actual-ed-sign.pdf
    .createTable('planet_dignity', (t) => {
      t.increments('id').primary();
      t.integer('planet_id').references('id').inTable('planets').onDelete('CASCADE');
      t.enum('dignity_type', ['exaltation','debilitation','moolatrikona','own_sign','friend_sign','enemy_sign']).notNullable();
      t.integer('zodiac_sign_id').references('id').inTable('zodiac_signs').onDelete('CASCADE');
      t.decimal('exact_degree', 5, 2).nullable();  // for exalt/debil: exact point
      t.decimal('degree_from', 5, 2).nullable();   // for moolatrikona/own sign ranges
      t.decimal('degree_to', 5, 2).nullable();
      t.text('notes').nullable();
      t.text('notes_hi').nullable();
    })

    // ── 27 Nakshatras ───────────────────────────────────────────
    .createTable('nakshatras', (t) => {
      t.integer('id').primary();                    // 1–27
      t.string('name', 100).notNullable();          // Ashwini
      t.string('name_hi', 100).notNullable();       // अश्विनी
      t.string('name_sanskrit', 100).nullable();
      t.integer('lord_planet_id').references('id').inTable('planets');
      t.integer('zodiac_sign_id').references('id').inTable('zodiac_signs');
      t.decimal('start_degree_in_sign', 6, 4).notNullable(); // 0–30
      t.decimal('end_degree_in_sign', 6, 4).notNullable();
      t.decimal('absolute_start_degree', 7, 4).notNullable(); // 0–360
      t.decimal('absolute_end_degree', 7, 4).notNullable();
      t.string('symbol', 150).nullable();
      t.string('symbol_hi', 150).nullable();
      t.string('deity', 100).nullable();
      t.string('deity_hi', 100).nullable();
      t.enum('guna', ['sattva','rajas','tamas']).nullable();
      t.enum('gender', ['male','female','neutral']).nullable();
      t.string('caste', 30).nullable();
      t.enum('varna', ['brahmin','kshatriya','vaishya','shudra']).nullable();
      t.string('animal_symbol', 80).nullable();
      t.string('animal_symbol_hi', 80).nullable();
      t.string('tree', 80).nullable();
      t.string('bird', 80).nullable();
      t.decimal('vimshottari_years', 4, 1).nullable();
      // Pada navamsha signs (each nakshatra has 4 padas of 3°20' each)
      t.integer('pada1_navamsha_sign').nullable();
      t.integer('pada2_navamsha_sign').nullable();
      t.integer('pada3_navamsha_sign').nullable();
      t.integer('pada4_navamsha_sign').nullable();
      t.text('general_nature').nullable();
      t.text('general_nature_hi').nullable();
    })

    // ── 12 Astrological Houses ──────────────────────────────────
    .createTable('houses', (t) => {
      t.integer('id').primary();                    // 1–12
      t.string('name', 80).notNullable();           // First House / Ascendant
      t.string('name_hi', 80).notNullable();        // प्रथम भाव / लग्न
      t.string('sanskrit_name', 80).nullable();     // Tanu Bhava
      t.string('significations', 500).nullable();   // comma-separated
      t.string('significations_hi', 500).nullable();
      t.string('body_parts', 200).nullable();
      t.enum('quality', ['kendra','trikona','upachaya','dusthana','neutral']).nullable();
      t.string('karaka', 100).nullable();           // natural significator
      t.text('description').nullable();
      t.text('description_hi').nullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('nakshatras')
    .dropTableIfExists('planet_dignity')
    .dropTableIfExists('houses')
    .dropTableIfExists('planets')
    .dropTableIfExists('zodiac_signs');
};
