'use strict';
/**
 * Migration 010 — Add is_gandmool to nakshatras table
 * Source: AstroAnsh Class 8 — Nakshatra Table Sheet.pdf
 *
 * Gandmool nakshatras (6 of 27):
 *   Ketu's 3:    Ashwini (1), Magha (10), Mula (19)
 *   Mercury's 3: Ashlesha (9), Jyeshtha (18), Revati (27)
 */
exports.up = function (knex) {
  return knex.schema.table('nakshatras', (t) => {
    t.boolean('is_gandmool').defaultTo(false).notNullable()
      .comment('True for the 6 Gandmool nakshatras: Ashwini, Ashlesha, Magha, Jyeshtha, Mula, Revati');
  });
};

exports.down = function (knex) {
  return knex.schema.table('nakshatras', (t) => {
    t.dropColumn('is_gandmool');
  });
};
