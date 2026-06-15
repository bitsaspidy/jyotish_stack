'use strict';
// Extends users.plan to a third tier: 'yearly' — full features (incl. PDF) +
// raised Kundli-profile cap (50), same as 'premium' for feature gating purposes.

exports.up = async (knex) => {
  await knex.raw("ALTER TABLE users MODIFY COLUMN plan ENUM('basic','premium','yearly') NOT NULL DEFAULT 'basic'");
};

exports.down = async (knex) => {
  await knex.raw("UPDATE users SET plan = 'premium' WHERE plan = 'yearly'");
  await knex.raw("ALTER TABLE users MODIFY COLUMN plan ENUM('basic','premium') NOT NULL DEFAULT 'basic'");
};
