'use strict';
// Adds ta/te/bn/mr/pa/gu columns alongside every existing _en/_hi (or bare
// name/title) field in the static reference tables that feed user-facing
// reports (bhava lord, yoga/dosha library, remedies, asta-vakri, upagrahas,
// varga charts). UI + horoscope engines were already fully 8-language;
// this is the last EN/HI-only content layer. Columns are nullable text/json —
// existing behaviour is unaffected until content is backfilled per language.
//
// Excluded (verified unused anywhere in server/ or ui-main/ — dead seed data,
// not worth translating): astrology_judgement_rules, astrology_yoga_activation_rules,
// astrology_house_lord_rules, astrology_special_planet_rules, astrology_rule_categories
// (migration 034), varga_reference_data (migration 007 name was never an actual
// table — the real varga table is varga_charts, included below).

const LANGS = ['ta', 'te', 'bn', 'mr', 'pa', 'gu'];

// field: { base, type: 'string'|'text'|'json', size? }
function addLangCols(t, fields) {
  for (const f of fields) {
    for (const lang of LANGS) {
      const col = `${f.base}_${lang}`;
      if (f.type === 'string') t.string(col, f.size || 300).nullable();
      else if (f.type === 'json') t.json(col).nullable();
      else t.text(col).nullable();
    }
  }
}

exports.up = async function (knex) {
  await knex.schema.alterTable('house_lord_interpretations', (t) => addLangCols(t, [
    { base: 'title', type: 'string', size: 300 },
    { base: 'interpretation', type: 'text' },
    { base: 'key_results', type: 'json' },
    { base: 'lord_name', type: 'string', size: 200 },
    { base: 'house_signification', type: 'text' },
    { base: 'example', type: 'text' },
  ]));

  await knex.schema.alterTable('yogas_library', (t) => addLangCols(t, [
    { base: 'name', type: 'string', size: 300 },
    { base: 'definition', type: 'text' },
    { base: 'formation', type: 'text' },
    { base: 'symptoms', type: 'text' },
    { base: 'effects', type: 'text' },
    { base: 'cancellation', type: 'text' },
  ]));

  await knex.schema.alterTable('doshas_library', (t) => addLangCols(t, [
    { base: 'name', type: 'string', size: 300 },
    { base: 'definition', type: 'text' },
    { base: 'formation', type: 'text' },
    { base: 'symptoms', type: 'text' },
    { base: 'effects', type: 'text' },
    { base: 'technical_note', type: 'text' },
  ]));

  await knex.schema.alterTable('remedy_planets', (t) => addLangCols(t, [
    { base: 'planet', type: 'string', size: 40 },
    { base: 'ishta_devata', type: 'string', size: 150 },
    { base: 'mantras', type: 'text' },
    { base: 'special_notes', type: 'text' },
  ]));

  await knex.schema.alterTable('remedy_problems', (t) => addLangCols(t, [
    { base: 'problem', type: 'string', size: 150 },
    { base: 'devata', type: 'string', size: 150 },
    { base: 'mantras', type: 'text' },
    { base: 'notes', type: 'text' },
  ]));

  await knex.schema.alterTable('remedy_puja_steps', (t) => addLangCols(t, [
    { base: 'action', type: 'string', size: 150 },
    { base: 'description', type: 'text' },
  ]));

  await knex.schema.alterTable('asta_vakri_library', (t) => addLangCols(t, [
    { base: 'title', type: 'string', size: 300 },
    { base: 'description', type: 'text' },
    { base: 'effects', type: 'json' },
  ]));

  await knex.schema.alterTable('upagrahas', (t) => addLangCols(t, [
    { base: 'name', type: 'string', size: 150 },
    { base: 'literal_meaning', type: 'text' },
    { base: 'nature', type: 'text' },
    { base: 'symbolism', type: 'text' },
    { base: 'positive_traits', type: 'text' },
    { base: 'negative_traits', type: 'text' },
    { base: 'psychological', type: 'text' },
    { base: 'spiritual', type: 'text' },
    { base: 'formula', type: 'text' },
    { base: 'key_indication', type: 'text' },
  ]));

  await knex.schema.alterTable('upagraha_house_effects', (t) => addLangCols(t, [
    { base: 'effect', type: 'text' },
  ]));

  await knex.schema.alterTable('upagraha_planet_conjunctions', (t) => addLangCols(t, [
    { base: 'effect', type: 'text' },
  ]));

  await knex.schema.alterTable('varga_charts', (t) => addLangCols(t, [
    { base: 'name', type: 'string', size: 200 },
    { base: 'signifies', type: 'text' },
    { base: 'description', type: 'text' },
    { base: 'key_uses', type: 'json' },
  ]));
};

exports.down = async function (knex) {
  const TABLES_FIELDS = {
    house_lord_interpretations: ['title', 'interpretation', 'key_results', 'lord_name', 'house_signification', 'example'],
    yogas_library: ['name', 'definition', 'formation', 'symptoms', 'effects', 'cancellation'],
    doshas_library: ['name', 'definition', 'formation', 'symptoms', 'effects', 'technical_note'],
    remedy_planets: ['planet', 'ishta_devata', 'mantras', 'special_notes'],
    remedy_problems: ['problem', 'devata', 'mantras', 'notes'],
    remedy_puja_steps: ['action', 'description'],
    asta_vakri_library: ['title', 'description', 'effects'],
    upagrahas: ['name', 'literal_meaning', 'nature', 'symbolism', 'positive_traits', 'negative_traits', 'psychological', 'spiritual', 'formula', 'key_indication'],
    upagraha_house_effects: ['effect'],
    upagraha_planet_conjunctions: ['effect'],
    varga_charts: ['name', 'signifies', 'description', 'key_uses'],
  };
  for (const [table, bases] of Object.entries(TABLES_FIELDS)) {
    await knex.schema.alterTable(table, (t) => {
      for (const base of bases) {
        for (const lang of LANGS) t.dropColumn(`${base}_${lang}`);
      }
    });
  }
};
