exports.up = function (knex) {
  return knex.schema
    .createTable('subscription_plans', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.string('name_hi', 100).nullable();
      t.text('description').nullable();
      t.decimal('price', 10, 2).notNullable();
      t.enum('currency', ['INR', 'USD']).defaultTo('INR');
      t.integer('duration_days').notNullable();
      t.json('features').nullable();
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    })
    .createTable('user_subscriptions', (t) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      t.integer('plan_id').unsigned().references('id').inTable('subscription_plans').onDelete('RESTRICT');
      t.string('razorpay_order_id', 100).nullable();
      t.string('razorpay_payment_id', 100).nullable();
      t.string('razorpay_signature', 500).nullable();
      t.enum('status', ['pending', 'active', 'expired', 'cancelled', 'failed']).defaultTo('pending');
      t.decimal('amount_paid', 10, 2).nullable();
      t.timestamp('starts_at').nullable();
      t.timestamp('expires_at').nullable();
      t.timestamps(true, true);
    })
    .createTable('newsletter_subscribers', (t) => {
      t.increments('id').primary();
      t.string('email', 255).notNullable().unique();
      t.string('name', 150).nullable();
      t.enum('preferred_language', ['hi', 'en']).defaultTo('en');
      t.boolean('is_active').defaultTo(true);
      t.string('unsubscribe_token', 100).nullable();
      t.timestamp('subscribed_at').defaultTo(knex.fn.now());
      t.timestamp('unsubscribed_at').nullable();
    })
    .createTable('notifications', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable(); // null = broadcast
      t.string('title', 300).notNullable();
      t.text('body').notNullable();
      t.enum('type', ['info', 'success', 'warning', 'promo', 'prediction']).defaultTo('info');
      t.boolean('is_read').defaultTo(false);
      t.string('action_url', 500).nullable();
      t.timestamp('sent_at').nullable();
      t.timestamps(true, true);
    })
    .createTable('email_logs', (t) => {
      t.increments('id').primary();
      t.string('to_email', 255).notNullable();
      t.string('subject', 500).notNullable();
      t.enum('template', ['welcome', 'verify_email', 'reset_password', 'subscription_confirm', 'newsletter', 'custom']).notNullable();
      t.enum('status', ['queued', 'sent', 'failed']).defaultTo('queued');
      t.text('error_message').nullable();
      t.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('email_logs')
    .dropTableIfExists('notifications')
    .dropTableIfExists('newsletter_subscribers')
    .dropTableIfExists('user_subscriptions')
    .dropTableIfExists('subscription_plans');
};
