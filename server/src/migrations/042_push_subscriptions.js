'use strict';
/** Web push subscriptions (PWA daily horoscope notifications). */

exports.up = async function (knex) {
  await knex.schema.createTable('push_subscriptions', (t) => {
    t.increments('id').primary();
    t.string('endpoint', 500).notNullable().unique();
    t.string('p256dh', 255).notNullable();
    t.string('auth', 255).notNullable();
    t.tinyint('rashi_num').unsigned().nullable();        // moon sign for daily horoscope targeting
    t.integer('user_id').unsigned().nullable();          // set when subscribed while logged in
    t.string('lang', 5).notNullable().defaultTo('en');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('fail_count').unsigned().notNullable().defaultTo(0);
    t.timestamp('last_sent_at').nullable();
    t.timestamps(true, true);
    t.index(['is_active', 'rashi_num']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('push_subscriptions');
};
