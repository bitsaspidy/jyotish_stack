exports.up = function (knex) {
  return knex.schema
    .createTable('users', (t) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('name', 150).notNullable();
      t.string('email', 255).notNullable().unique();
      t.string('phone', 20).nullable();
      t.string('password_hash', 255).notNullable();
      t.enum('role', ['user', 'admin', 'superadmin']).defaultTo('user');
      t.boolean('is_active').defaultTo(true);
      t.boolean('email_verified').defaultTo(false);
      t.string('email_verification_token', 100).nullable();
      t.string('password_reset_token', 100).nullable();
      t.timestamp('password_reset_expires').nullable();
      t.string('avatar_url', 500).nullable();
      t.enum('preferred_language', ['hi', 'en']).defaultTo('en');
      t.json('meta').nullable();
      t.timestamps(true, true);
    })
    .createTable('user_sessions', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      t.string('refresh_token', 500).notNullable();
      t.string('device_info', 500).nullable();
      t.string('ip_address', 45).nullable();
      t.timestamp('expires_at').notNullable();
      t.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_sessions').dropTableIfExists('users');
};
