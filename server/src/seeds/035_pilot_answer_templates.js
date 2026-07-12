'use strict';
/**
 * Seed 035 — pilot answer templates (Stage 1 of the no-LLM pivot).
 * Idempotent upserts of the user-facing Hindi/English answer content for the
 * 10 pilot questions into answer_templates, plus the shared section bodies,
 * fragments and labels into answer_shared_blocks. From this seed onward the
 * DB is the source of user-facing answer text; code only selects + interpolates.
 * Source of truth data: src/data/pilot-answer-templates.data.js.
 */

const data = require('../data/pilot-answer-templates.data');

exports.seed = async function (knex) {
  // shared section bodies / fragments / labels
  for (const b of data.SHARED_BLOCKS) {
    await knex('answer_shared_blocks')
      .insert({ block_key: b.block_key, type: b.type, lang: b.lang, text: b.text, version: b.version, active: true })
      .onConflict(['block_key', 'lang', 'version']).merge({ type: b.type, text: b.text, active: true });
  }

  // per-question templates (direct answers per state, headlines, practical guidance)
  for (const t of data.buildTemplates()) {
    await knex('answer_templates')
      .insert(t)
      .onConflict(['question_code', 'section_key', 'answer_state', 'lang', 'condition_key', 'template_version'])
      .merge({ block_text: t.block_text, display_order: t.display_order, active: true });
  }
};
