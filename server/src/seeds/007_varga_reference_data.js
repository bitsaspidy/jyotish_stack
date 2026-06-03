// Seed 007 - Varga / Divisional Chart Reference Data
// Source: "Divisional Charts (Varga)" pasted PDF text.

const {
  SOURCE,
  VARGA_DEFINITIONS,
  MASTER_FAMILY_REFERENCES,
  VARGA_RELATIONSHIP_REFERENCES,
} = require('../data/varga-reference');

exports.seed = async function (knex) {
  await knex('varga_chart_relationships').del();
  await knex('varga_family_references').del();
  await knex('varga_charts').del();

  await knex('varga_charts').insert(VARGA_DEFINITIONS.map((chart) => ({
    id: chart.id,
    code: chart.code,
    slug: chart.key,
    division: chart.division,
    name_en: chart.name_en,
    name_hi: chart.name_hi || null,
    name_sanskrit: chart.name_sanskrit || null,
    primary_domain: chart.primary_domain,
    division_note: chart.division_note,
    signifies_en: chart.signifies_en,
    signifies_hi: chart.signifies_hi || null,
    description_en: chart.description_en,
    description_hi: chart.description_hi || null,
    key_uses_en: JSON.stringify(chart.key_uses_en || []),
    key_uses_hi: JSON.stringify(chart.key_uses_hi || []),
    calculation_rule: chart.calculation_rule,
    precision_note: chart.precision_note || null,
    is_high_precision: chart.division >= 16,
    source: SOURCE,
  })));

  await knex('varga_family_references').insert(MASTER_FAMILY_REFERENCES.map((row) => ({
    topic: row.topic,
    charts_houses_to_check: row.charts_houses_to_check,
    notes: row.notes || null,
    source: SOURCE,
  })));

  await knex('varga_chart_relationships').insert(VARGA_RELATIONSHIP_REFERENCES.map((row) => ({
    varga_chart_id: row.chart_id,
    relationship_topic: row.topic,
    house_or_karaka: row.house_or_karaka,
    how_to_read: row.how_to_read,
    source: SOURCE,
  })));
};
