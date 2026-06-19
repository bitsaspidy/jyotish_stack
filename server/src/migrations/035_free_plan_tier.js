'use strict';
// Adds 'free' as the lowest plan tier and makes it the default for new registrations.
// Existing users who already have 'basic'/'premium'/'yearly' keep their current plan.
// 'free' users can create a Kundli profile but cannot view the full analysis until they upgrade.

exports.up = async (knex) => {
  await knex.raw(`
    ALTER TABLE users
    MODIFY COLUMN plan ENUM('free','basic','premium','yearly') NOT NULL DEFAULT 'free'
  `);
};

exports.down = async (knex) => {
  // Remove 'free' users first (set them to 'basic') so the ENUM shrink doesn't fail
  await knex('users').where({ plan: 'free' }).update({ plan: 'basic' });
  await knex.raw(`
    ALTER TABLE users
    MODIFY COLUMN plan ENUM('basic','premium','yearly') NOT NULL DEFAULT 'basic'
  `);
};
