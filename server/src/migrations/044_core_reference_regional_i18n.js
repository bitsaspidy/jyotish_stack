'use strict';
// Adds ta/te/bn/mr/pa/gu columns to the 4 core Vedic reference tables
// (zodiac_signs, planets, nakshatras, houses) — these feed KundliInsightPanel
// and are viewed on every single kundli, making them the highest-traffic
// EN/HI-only content in the app. Continuation of migration 043's regional
// i18n work; see server/src/services/helpers/lang-fields.js for the shared
// language-suffix list.

const { REGIONAL_LANGS } = require('../services/helpers/lang-fields');

function addLangCols(t, fields) {
  for (const f of fields) {
    for (const lang of REGIONAL_LANGS) {
      const col = `${f.base}_${lang}`;
      if (f.type === 'string') t.string(col, f.size || 300).nullable();
      else if (f.type === 'json') t.json(col).nullable();
      else t.text(col).nullable();
    }
  }
}

const TABLE_FIELDS = {
  zodiac_signs: [
    { base: 'name', type: 'string', size: 100 },
    { base: 'description', type: 'text' },
    { base: 'key_traits', type: 'text' },
    { base: 'detailed_description', type: 'text' },
  ],
  planets: [
    { base: 'name', type: 'string', size: 100 },
    { base: 'gemstone', type: 'string', size: 100 },
    { base: 'body_part', type: 'string', size: 150 },
    { base: 'characteristics', type: 'text' },
    { base: 'season', type: 'text' },
    { base: 'health_conditions', type: 'text' },
    { base: 'professions', type: 'text' },
    { base: 'key_relations', type: 'text' },
    { base: 'physical_manifestations', type: 'text' },
    { base: 'guna', type: 'string', size: 100 },
    { base: 'varna', type: 'string', size: 100 },
    { base: 'court_role', type: 'string', size: 150 },
    { base: 'deity', type: 'string', size: 150 },
    { base: 'ishta_devata', type: 'string', size: 150 },
    { base: 'primary_suktam', type: 'string', size: 200 },
  ],
  nakshatras: [
    { base: 'name', type: 'string', size: 150 },
    { base: 'symbol', type: 'string', size: 200 },
    { base: 'deity', type: 'string', size: 150 },
    { base: 'animal_symbol', type: 'string', size: 100 },
    { base: 'general_nature', type: 'text' },
    { base: 'characteristics', type: 'text' },
    { base: 'negative_traits', type: 'text' },
    { base: 'professions', type: 'text' },
    { base: 'health_issues', type: 'text' },
    { base: 'health_root_cause', type: 'text' },
    { base: 'health_guidance', type: 'text' },
  ],
  houses: [
    { base: 'name', type: 'string', size: 150 },
    { base: 'significations', type: 'string', size: 600 },
    { base: 'description', type: 'text' },
    { base: 'keywords', type: 'text' },
    { base: 'topics', type: 'text' },
    { base: 'health_organs', type: 'text' },
    { base: 'detailed_notes', type: 'text' },
    { base: 'bhava_nature', type: 'text' },
  ],
};

exports.up = async function (knex) {
  for (const [table, fields] of Object.entries(TABLE_FIELDS)) {
    await knex.schema.alterTable(table, (t) => addLangCols(t, fields));
  }
};

exports.down = async function (knex) {
  for (const [table, fields] of Object.entries(TABLE_FIELDS)) {
    await knex.schema.alterTable(table, (t) => {
      for (const f of fields) {
        for (const lang of REGIONAL_LANGS) t.dropColumn(`${f.base}_${lang}`);
      }
    });
  }
};
