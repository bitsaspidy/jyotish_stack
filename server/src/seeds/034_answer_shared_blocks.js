'use strict';
/**
 * Seed 034 — shared answer blocks + rule registry (Phase 2).
 * - answer_shared_blocks: disclaimers (medical/financial/general/marriage),
 *   insufficient-data, and D3/D11 limitation notes (bilingual).
 * - rule_registry: stable identifiers + versions + calc/source for each rule group
 *   so audits stay reproducible while pilot rules remain code-based.
 * No per-question answer templates are seeded (pilot phase only). Idempotent.
 */

const data = require('../data/question-catalogue.data');

const CALC_VERSION = 'calc-1.0';   // astronomy-engine sidereal chart pipeline

// Stable rule-group registry (code-based for the pilot, but versioned + traceable).
const RULES = [
  { rule_key:'qa.lens.v1',     source:'code:services/kundli-question.service.js',            description:'Divisional-chart lens status scoring (per-question chart evidence).' },
  { rule_key:'qa.strength.v1', source:'code:services/helpers/kundli-strength.js',            description:'Custom planetary-strength proxy (dignity+house+yoga+dasha). NOT classical Shadbala.' },
  { rule_key:'qa.state.v1',    source:'code:services/kundli-question.service.js#toneFromScore', description:'Answer-state selection thresholds (supportive/balanced/caution → 7 states, pending pilot calibration).' },
  { rule_key:'qa.timing.v1',   source:'code:services/kundli-question.service.js#timingWindow',  description:'Dasha-based timing windows; dated-transit windows pending minimal evaluator.' },
  { rule_key:'qa.transit.v1',  source:'code:services/helpers/gochar.js',                     description:'Current transit evaluation (Sade Sati, Jupiter support, Rahu/Ketu axis). Dated windows pending.' },
  { rule_key:'qa.remedy.v1',   source:'code:services/remedy-engine/index.js',                description:'Remedy selection from the verified remedy engine (justified only).' },
];

exports.seed = async function (knex) {
  // shared blocks
  for (const b of data.SHARED_BLOCKS) {
    await knex('answer_shared_blocks')
      .insert({ block_key:b.block_key, type:b.type, lang:b.lang, text:b.text, version:b.version, active:true })
      .onConflict(['block_key', 'lang', 'version']).merge({ type:b.type, text:b.text, active:true });
  }

  // rule registry (version 1)
  for (const r of RULES) {
    await knex('rule_registry')
      .insert({ rule_key:r.rule_key, rule_version:1, calc_version:CALC_VERSION, source:r.source, definition:null, description:r.description, active:true })
      .onConflict(['rule_key', 'rule_version']).merge({ calc_version:CALC_VERSION, source:r.source, description:r.description, active:true });
  }
};
