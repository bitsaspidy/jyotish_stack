// Migration 033 — GST invoices
// Immutable billing records generated on successful payment. Stores the full
// tax break-up (CGST/SGST/IGST) plus snapshots of seller + customer details so
// a re-issued invoice always matches what was charged at the time of payment.
exports.up = function (knex) {
  return knex.schema.createTable('invoices', (t) => {
    t.increments('id').primary();
    t.string('uuid', 36).notNullable().unique();
    t.string('invoice_number', 60).notNullable().unique(); // e.g. JYS/2026-27/0001

    t.integer('subscription_id').unsigned().references('id').inTable('user_subscriptions').onDelete('SET NULL').nullable();
    t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable();
    t.integer('plan_id').unsigned().nullable();
    t.string('plan_name', 120).nullable();

    t.string('razorpay_order_id', 100).nullable();
    t.string('razorpay_payment_id', 100).nullable();
    t.string('currency', 8).defaultTo('INR');

    t.enum('document_type', ['tax_invoice', 'bill_of_supply']).defaultTo('tax_invoice');
    t.decimal('gst_rate', 5, 2).defaultTo(18);     // 0 for bill_of_supply
    t.boolean('gst_inclusive').defaultTo(true);
    t.string('hsn_sac', 20).nullable();

    t.decimal('taxable_value', 10, 2).notNullable().defaultTo(0);
    t.decimal('cgst', 10, 2).defaultTo(0);
    t.decimal('sgst', 10, 2).defaultTo(0);
    t.decimal('igst', 10, 2).defaultTo(0);
    t.decimal('total_tax', 10, 2).defaultTo(0);
    t.decimal('total_amount', 10, 2).notNullable().defaultTo(0); // gross amount paid
    t.boolean('is_interstate').defaultTo(false);
    t.string('place_of_supply', 120).nullable();

    // Customer snapshot
    t.string('customer_name', 200).nullable();
    t.string('customer_email', 255).nullable();
    t.string('customer_state', 120).nullable();
    t.string('customer_gstin', 20).nullable();

    // Seller snapshot (frozen at issue time for immutability)
    t.string('seller_name', 200).nullable();
    t.string('seller_gstin', 20).nullable();
    t.string('seller_state', 120).nullable();
    t.string('seller_address', 500).nullable();

    t.enum('status', ['paid', 'refunded', 'cancelled']).defaultTo('paid');
    t.timestamp('issued_at').defaultTo(knex.fn.now());
    t.text('notes').nullable();
    t.timestamps(true, true);

    t.index('user_id');
    t.index('created_at');
    t.index('status');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('invoices');
};
