exports.up = function (knex) {
  return knex.schema
    .createTable('kundli_profiles', (t) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable();
      t.string('name', 150).notNullable();
      t.date('date_of_birth').notNullable();
      t.time('time_of_birth').notNullable();
      t.string('place_of_birth', 300).notNullable();
      t.decimal('latitude', 10, 7).notNullable();
      t.decimal('longitude', 10, 7).notNullable();
      t.decimal('timezone_offset', 5, 2).notNullable();
      t.enum('gender', ['male', 'female', 'other']).notNullable();
      t.json('calculated_data').nullable();   // stores full chart data
      t.boolean('is_public').defaultTo(false);
      t.timestamps(true, true);
    })
    .createTable('matchmaking_requests', (t) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable();
      t.integer('kundli_boy_id').unsigned().references('id').inTable('kundli_profiles').onDelete('CASCADE');
      t.integer('kundli_girl_id').unsigned().references('id').inTable('kundli_profiles').onDelete('CASCADE');
      t.json('result').nullable();            // guna milan, compatibility scores
      t.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
      t.timestamps(true, true);
    })
    .createTable('predictions', (t) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('kundli_id').unsigned().references('id').inTable('kundli_profiles').onDelete('CASCADE');
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable();
      t.enum('type', ['daily', 'weekly', 'monthly', 'yearly', 'dasha', 'transit', 'custom']).notNullable();
      t.string('title', 300).nullable();
      t.text('content_en').nullable();
      t.text('content_hi').nullable();
      t.json('meta').nullable();
      t.timestamp('valid_from').nullable();
      t.timestamp('valid_until').nullable();
      t.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('predictions')
    .dropTableIfExists('matchmaking_requests')
    .dropTableIfExists('kundli_profiles');
};
