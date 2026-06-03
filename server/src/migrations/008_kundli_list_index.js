'use strict';

exports.up = function (knex) {
  return knex.schema.table('kundli_profiles', (t) => {
    // Covers the list query: WHERE user_id = ? ORDER BY created_at DESC
    t.index(['user_id', 'created_at'], 'idx_kundli_user_created');
  });
};

exports.down = function (knex) {
  return knex.schema.table('kundli_profiles', (t) => {
    t.dropIndex(['user_id', 'created_at'], 'idx_kundli_user_created');
  });
};
