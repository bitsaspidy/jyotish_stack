'use strict';
/**
 * Seed 033 — deterministic Q&A catalogue (Phase 2).
 * Idempotent upserts of the 10 categories, 100 questions (Q001–Q100), their 1:1
 * astrology requirements, and the 66 legacy aliases (incl. 3 retired). Source of
 * truth data lives in src/data/question-catalogue.data.js (kept out of controllers).
 * Order respects FKs: categories → catalogue → requirements → aliases.
 */

const data = require('../data/question-catalogue.data');

const J = (v) => JSON.stringify(v);

exports.seed = async function (knex) {
  // 1. categories
  for (const c of data.CATEGORIES) {
    await knex('question_categories')
      .insert({ code:c.code, label_en:c.label_en, label_hi:c.label_hi, display_order:c.order, active:true })
      .onConflict('code').merge({ label_en:c.label_en, label_hi:c.label_hi, display_order:c.order });
  }

  // 2. catalogue
  for (const q of data.buildCatalogue()) {
    await knex('question_catalogue')
      .insert({
        code:q.code, category_code:q.category, subcategory:q.subcategory || null,
        question_en:q.q_en, question_hi:q.q_hi, short_title_en:q.t_en, short_title_hi:q.t_hi,
        desc_en:null, desc_hi:null, display_order:q.display_order, active:q.active,
        disclaimer_type:q.disclaimer_type, min_data_policy:q.min_data_policy,
        fallback_block_key:q.fallback_block_key, rule_version:q.rule_version, template_version:q.template_version,
      })
      .onConflict('code').merge({
        category_code:q.category, subcategory:q.subcategory || null,
        question_en:q.q_en, question_hi:q.q_hi, short_title_en:q.t_en, short_title_hi:q.t_hi,
        display_order:q.display_order, active:q.active, disclaimer_type:q.disclaimer_type,
        min_data_policy:q.min_data_policy, fallback_block_key:q.fallback_block_key,
      });
  }

  // 3. requirements (1:1). JSON columns explicitly stringified for mysql2.
  for (const r of data.buildRequirements()) {
    const row = {
      question_code:r.question_code,
      houses:J(r.houses), house_lords:J(r.house_lords), planets:J(r.planets),
      divisional_charts:J(r.divisional_charts), dasha_levels:J(r.dasha_levels),
      needs_current_transit:r.needs_current_transit, needs_dated_transit:r.needs_dated_transit,
      needs_yoga:r.needs_yoga, needs_remedy:r.needs_remedy,
      shadbala_enhances:r.shadbala_enhances, ashtakavarga_enhances:r.ashtakavarga_enhances,
      answer_sections:J(r.answer_sections), required_fields:J(r.required_fields),
      missing_data_behaviour:r.missing_data_behaviour,
    };
    await knex('question_requirements').insert(row).onConflict('question_code').merge(row);
  }

  // 4. legacy aliases (approved reconciliation)
  for (const a of data.ALIASES) {
    await knex('question_legacy_alias')
      .insert({ legacy_key:a.legacy_key, question_code:a.question_code, status:a.status })
      .onConflict('legacy_key').merge({ question_code:a.question_code, status:a.status });
  }
};
