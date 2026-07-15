'use strict';
/**
 * Migration 050 — question_catalogue.domain.
 *
 * A question's CATEGORY is how the catalogue is browsed; its DOMAIN is the life
 * area whose language an answer must speak. The two are not the same: `family`
 * holds children, parents and siblings questions, and those need different
 * cautions, different evidence framing and different next steps. Until now the
 * humanizer had only the category, which is why every life area shared one voice.
 *
 * Storing the domain keeps the DB the single source of truth — the derivation in
 * domains.js is a fallback for rows written before this column, not the authority.
 *
 * Additive + fully reversible. No data backfill here (seed 037 owns content);
 * existing rows get the column with a NULL default and keep resolving via
 * domains.js until the seed populates them.
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('question_catalogue');
  if (!hasTable) return;

  if (!(await knex.schema.hasColumn('question_catalogue', 'domain'))) {
    await knex.schema.alterTable('question_catalogue', (t) => {
      // Nullable on purpose: a NULL domain resolves through domains.js rather than
      // blocking the row, so this migration can never make a question unanswerable.
      t.string('domain', 24).nullable().after('subcategory');
      t.index(['domain']);
    });
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('question_catalogue');
  if (!hasTable) return;

  if (await knex.schema.hasColumn('question_catalogue', 'domain')) {
    await knex.schema.alterTable('question_catalogue', (t) => {
      t.dropIndex(['domain']);
      t.dropColumn('domain');
    });
  }
};
