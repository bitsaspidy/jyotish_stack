'use strict';

const REGIONAL_LANGS = ['ta', 'te', 'bn', 'mr', 'pa', 'gu'];

// Passes the 6 regional string columns through unchanged (name_ta, signifies_ta,
// description_ta, …) and parses the regional key_uses JSON arrays. en/hi are
// already handled explicitly above; this only appends the regional layer so
// vargaI18n.js can pick ta/te/bn/mr/pa/gu when the UI language is regional.
function regionalVargaFields(row) {
  const out = {};
  for (const lang of REGIONAL_LANGS) {
    out[`name_${lang}`] = row[`name_${lang}`] || null;
    out[`signifies_${lang}`] = row[`signifies_${lang}`] || null;
    out[`description_${lang}`] = row[`description_${lang}`] || null;
    out[`key_uses_${lang}`] = parseJsonArray(row[`key_uses_${lang}`]);
  }
  return out;
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeVargaReferenceRows({ charts = [], relationships = [], familyReferences = [] }) {
  const relationshipsByChart = relationships.reduce((acc, row) => {
    const chartId = row.varga_chart_id;
    if (!acc[chartId]) acc[chartId] = [];
    acc[chartId].push({
      id: row.id,
      topic: row.relationship_topic,
      house_or_karaka: row.house_or_karaka,
      how_to_read: row.how_to_read,
    });
    return acc;
  }, {});

  return {
    charts: charts.map((row) => ({
      id: row.id,
      code: row.code,
      slug: row.slug,
      division: row.division,
      name_en: row.name_en,
      name_hi: row.name_hi || null,
      name_sanskrit: row.name_sanskrit || null,
      primary_domain: row.primary_domain,
      division_note: row.division_note,
      signifies_en: row.signifies_en,
      signifies_hi: row.signifies_hi || null,
      description_en: row.description_en,
      description_hi: row.description_hi || null,
      key_uses_en: parseJsonArray(row.key_uses_en),
      key_uses_hi: parseJsonArray(row.key_uses_hi),
      ...regionalVargaFields(row),
      calculation_rule: row.calculation_rule,
      precision_note: row.precision_note || null,
      is_high_precision: Boolean(row.is_high_precision),
      relationships: relationshipsByChart[row.id] || [],
    })),
    family_references: familyReferences.map((row) => ({
      id: row.id,
      topic: row.topic,
      charts_houses_to_check: row.charts_houses_to_check,
      notes: row.notes || null,
    })),
  };
}

async function fetchVargaReferenceData(knex) {
  const [charts, relationships, familyReferences] = await Promise.all([
    knex('varga_charts').select('*').orderBy('division', 'asc'),
    knex('varga_chart_relationships').select('*').orderBy([
      { column: 'varga_chart_id', order: 'asc' },
      { column: 'relationship_topic', order: 'asc' },
    ]),
    knex('varga_family_references').select('*').orderBy('topic', 'asc'),
  ]);

  return normalizeVargaReferenceRows({ charts, relationships, familyReferences });
}

module.exports = {
  fetchVargaReferenceData,
  normalizeVargaReferenceRows,
  parseJsonArray,
};
