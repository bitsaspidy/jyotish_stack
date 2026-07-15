'use strict';
/**
 * Seed 036 — knowledge store demonstration domain (Stage 3).
 * Idempotently seeds the "life_area_advice" category and its items (6 approved +
 * 1 draft) into the normalized knowledge tables, proving the database-first
 * architecture end to end. Approved items also get an initial version snapshot
 * so rollback has history to work with. Source data: data/knowledge-seed.data.js.
 */

const data = require('../data/knowledge-seed.data');

exports.seed = async function (knex) {
  // categories
  for (const c of data.CATEGORIES) {
    await knex('knowledge_categories')
      .insert({ code: c.code, label_en: c.label_en, label_hi: c.label_hi, description: c.description || null, display_order: c.order, active: true })
      .onConflict('code').merge({ label_en: c.label_en, label_hi: c.label_hi, description: c.description || null, display_order: c.order });
  }

  for (const it of data.ITEMS) {
    const approved = it.status === 'approved';
    const version = approved ? 1 : 0;
    // item (upsert on stable_key)
    const existing = await knex('knowledge_items').where({ stable_key: it.stable_key }).first();
    let itemId;
    const base = {
      category_code: it.category, status: it.status, visibility: it.visibility, priority: it.priority,
      current_version: version, source: it.source, search_keywords: it.search_keywords,
      created_by: 'seed', updated_by: 'seed',
      approved_by: approved ? 'seed' : null, approved_at: approved ? knex.fn.now() : null,
    };
    if (existing) {
      itemId = existing.id;
      await knex('knowledge_items').where({ id: itemId }).update(base);
    } else {
      const [id] = await knex('knowledge_items').insert({ uuid: require('crypto').randomUUID(), stable_key: it.stable_key, ...base });
      itemId = id;
    }
    // translations
    for (const [lang, content] of Object.entries(it.translations)) {
      await knex('knowledge_translations')
        .insert({ item_id: itemId, lang, title: content.title, body: content.body, summary: content.summary })
        .onConflict(['item_id', 'lang']).merge({ title: content.title, body: content.body, summary: content.summary });
    }
    // tags (replace)
    await knex('knowledge_tags').where({ item_id: itemId }).del();
    for (const tag of it.tags) {
      await knex('knowledge_tags').insert({ item_id: itemId, tag_type: tag.type, tag_value: tag.value })
        .onConflict(['item_id', 'tag_type', 'tag_value']).ignore();
    }
    // initial version snapshot for approved items (enables rollback history).
    // Snapshot the PERSISTED row (plain values) — never the insert payload, which
    // carries knex.fn.now() raw objects that are not JSON-serialisable.
    if (approved) {
      const itemRow = await knex('knowledge_items').where({ id: itemId })
        .select('stable_key', 'category_code', 'status', 'visibility', 'priority', 'source', 'search_keywords').first();
      const translations = await knex('knowledge_translations').where({ item_id: itemId }).select('lang', 'title', 'body', 'summary');
      const tags = await knex('knowledge_tags').where({ item_id: itemId }).select('tag_type', 'tag_value');
      const snapshot = JSON.stringify({ item: itemRow, translations, tags });
      await knex('knowledge_item_versions')
        .insert({ item_id: itemId, version: 1, status_at_version: 'approved', snapshot, created_by: 'seed', note: 'seed baseline' })
        .onConflict(['item_id', 'version']).merge({ snapshot, note: 'seed baseline' });
    }
  }
};
