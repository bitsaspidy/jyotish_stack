// Migration 018 — Bhava Lord Enhancements (AstroAnsh Class 7 PDF)
// Adds lord metadata + house signification columns to house_lord_interpretations

exports.up = function (knex) {
  return knex.schema.alterTable('house_lord_interpretations', (t) => {
    t.string('lord_name_en', 120).nullable();           // e.g. "Lagna Pati"
    t.string('lord_name_hi', 200).nullable();           // e.g. "लग्नेश"
    t.text('house_signification_en').nullable();        // what the lord's own house governs
    t.text('house_signification_hi').nullable();
    t.boolean('forms_viparita_yoga').defaultTo(false);  // 6→8/12, 8→6/12, 12→6/8
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('house_lord_interpretations', (t) => {
    t.dropColumn('lord_name_en');
    t.dropColumn('lord_name_hi');
    t.dropColumn('house_signification_en');
    t.dropColumn('house_signification_hi');
    t.dropColumn('forms_viparita_yoga');
  });
};
