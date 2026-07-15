'use strict';
/**
 * Knowledge repository (Stage 3) — the single database-driven access layer for
 * all managed knowledge. User-facing reads return ONLY approved + public items,
 * are multilingual (with English fallback) and are cached with TTL + explicit
 * invalidation on every admin write. Admin operations cover the full lifecycle:
 * search, create draft, edit, clone, submit for review, approve (snapshots a
 * version), deactivate/archive, list versions, preview draft and rollback.
 *
 *   draft → review → approved → archived      (only `approved` reaches users)
 *
 * No user-facing text is generated in code — text lives in knowledge_translations.
 */

const defaultDb = require('../../config/db');

const STATUSES = ['draft', 'review', 'approved', 'archived'];
const CACHE_TTL_MS = Number(process.env.KNOWLEDGE_CACHE_TTL_MS) || 5 * 60 * 1000;

// ── Cache (TTL + invalidation; never cached forever) ─────────────────────────
let _cache = new Map();          // key → { value, expires }
let _cacheStamp = Date.now();    // bumped on every invalidation
function _get(key) {
  const e = _cache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expires) { _cache.delete(key); return undefined; }
  return e.value;
}
function _set(key, value) { _cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS }); }
function invalidate() { _cache = new Map(); _cacheStamp = Date.now(); }
function cacheInfo() { return { entries: _cache.size, stamp: _cacheStamp, ttl_ms: CACHE_TTL_MS }; }

function pickTranslation(rows, lang) {
  return rows.find((r) => r.lang === lang) || rows.find((r) => r.lang === 'en') || rows[0] || null;
}

// ── User-facing reads (approved + public only; cached) ───────────────────────
async function getApproved(stableKey, lang = 'en', deps = {}) {
  const db = deps.db || defaultDb;
  const key = `item:${stableKey}|${lang}`;
  const cached = _get(key);
  if (cached !== undefined) return cached;

  const item = await db('knowledge_items')
    .where({ stable_key: stableKey, status: 'approved', visibility: 'public' })
    .first();
  if (!item) { _set(key, null); return null; }
  const translations = await db('knowledge_translations').where({ item_id: item.id });
  const tr = pickTranslation(translations, lang);
  const value = tr ? {
    stable_key: item.stable_key, category: item.category_code, version: item.current_version,
    priority: item.priority, lang: tr.lang, title: tr.title, body: tr.body, summary: tr.summary,
  } : null;
  _set(key, value);
  return value;
}

async function getApprovedByCategory(categoryCode, lang = 'en', deps = {}) {
  const db = deps.db || defaultDb;
  const key = `cat:${categoryCode}|${lang}`;
  const cached = _get(key);
  if (cached !== undefined) return cached;

  const items = await db('knowledge_items')
    .where({ category_code: categoryCode, status: 'approved', visibility: 'public' })
    .orderBy([{ column: 'priority', order: 'desc' }, { column: 'stable_key', order: 'asc' }]);
  const out = [];
  for (const item of items) {
    const translations = await db('knowledge_translations').where({ item_id: item.id });
    const tr = pickTranslation(translations, lang);
    if (tr) out.push({ stable_key: item.stable_key, priority: item.priority, version: item.current_version, lang: tr.lang, title: tr.title, body: tr.body, summary: tr.summary });
  }
  _set(key, out);
  return out;
}

// ── Admin: full item load (any status) ───────────────────────────────────────
async function _loadFull(db, stableKey) {
  const item = await db('knowledge_items').where({ stable_key: stableKey }).first();
  if (!item) return null;
  const [translations, tags] = await Promise.all([
    db('knowledge_translations').where({ item_id: item.id }).select('lang', 'title', 'body', 'summary'),
    db('knowledge_tags').where({ item_id: item.id }).select('tag_type', 'tag_value'),
  ]);
  return { item, translations, tags };
}

async function getItem(stableKey, deps = {}) {
  const db = deps.db || defaultDb;
  const full = await _loadFull(db, stableKey);
  if (!full) return null;
  return {
    ...full.item,
    translations: full.translations,
    tags: full.tags,
  };
}

/** Admin preview: current draft/any-status content in the requested language. */
async function previewDraft(stableKey, lang = 'en', deps = {}) {
  const db = deps.db || defaultDb;
  const full = await _loadFull(db, stableKey);
  if (!full) return null;
  const tr = pickTranslation(full.translations, lang);
  return tr ? { stable_key: stableKey, status: full.item.status, lang: tr.lang, title: tr.title, body: tr.body, summary: tr.summary } : null;
}

// ── Admin: search / filter ───────────────────────────────────────────────────
async function search(params = {}, deps = {}) {
  const db = deps.db || defaultDb;
  const { query, category, status, tagType, tagValue, limit = 50, offset = 0 } = params;
  let q = db('knowledge_items as ki').distinct('ki.id', 'ki.uuid', 'ki.stable_key', 'ki.category_code', 'ki.status', 'ki.visibility', 'ki.priority', 'ki.current_version', 'ki.updated_at');
  if (category) q = q.where('ki.category_code', category);
  if (status) q = q.where('ki.status', status);
  if (tagType || tagValue) {
    q = q.join('knowledge_tags as kt', 'kt.item_id', 'ki.id');
    if (tagType) q = q.where('kt.tag_type', tagType);
    if (tagValue) q = q.where('kt.tag_value', tagValue);
  }
  if (query) {
    const like = `%${query}%`;
    q = q.where(function () {
      this.where('ki.stable_key', 'like', like)
        .orWhere('ki.search_keywords', 'like', like)
        .orWhereIn('ki.id', db('knowledge_translations').select('item_id')
          .where('title', 'like', like).orWhere('body', 'like', like));
    });
  }
  return q.orderBy([{ column: 'ki.priority', order: 'desc' }, { column: 'ki.stable_key', order: 'asc' }])
    .limit(Math.min(Number(limit) || 50, 200)).offset(Number(offset) || 0);
}

// ── Admin: write operations (all invalidate the cache) ───────────────────────
function _uuid() { return require('crypto').randomUUID(); }

async function _replaceTranslations(trx, itemId, translations) {
  if (!translations) return;
  for (const [lang, content] of Object.entries(translations)) {
    if (!content || !content.body) continue;
    await trx('knowledge_translations')
      .insert({ item_id: itemId, lang, title: content.title || null, body: content.body, summary: content.summary || null })
      .onConflict(['item_id', 'lang']).merge({ title: content.title || null, body: content.body, summary: content.summary || null });
  }
}
async function _replaceTags(trx, itemId, tags) {
  if (!tags) return;
  await trx('knowledge_tags').where({ item_id: itemId }).del();
  for (const tag of tags) {
    if (!tag || !tag.type || !tag.value) continue;
    await trx('knowledge_tags').insert({ item_id: itemId, tag_type: tag.type, tag_value: tag.value })
      .onConflict(['item_id', 'tag_type', 'tag_value']).ignore();
  }
}

async function createDraft(input, deps = {}) {
  const db = deps.db || defaultDb;
  const { stableKey, category, priority = 0, visibility = 'public', source = null, searchKeywords = null, translations, tags, by = null } = input;
  if (!stableKey || !category) throw new Error('createDraft requires stableKey and category');
  await db.transaction(async (trx) => {
    const [id] = await trx('knowledge_items').insert({
      uuid: _uuid(), stable_key: stableKey, category_code: category, status: 'draft',
      visibility, priority, current_version: 0, source, search_keywords: searchKeywords,
      created_by: by, updated_by: by,
    });
    await _replaceTranslations(trx, id, translations);
    await _replaceTags(trx, id, tags);
  });
  invalidate();
  return getItem(stableKey, deps);
}

async function updateItem(stableKey, patch, deps = {}) {
  const db = deps.db || defaultDb;
  await db.transaction(async (trx) => {
    const item = await trx('knowledge_items').where({ stable_key: stableKey }).first();
    if (!item) throw new Error(`unknown knowledge item ${stableKey}`);
    if (item.status === 'archived') throw new Error('cannot edit an archived item; clone or restore it first');
    const fields = { updated_by: patch.by || null };
    for (const k of ['priority', 'visibility', 'source']) if (patch[k] !== undefined) fields[k] = patch[k];
    if (patch.searchKeywords !== undefined) fields.search_keywords = patch.searchKeywords;
    await trx('knowledge_items').where({ id: item.id }).update(fields);
    await _replaceTranslations(trx, item.id, patch.translations);
    if (patch.tags !== undefined) await _replaceTags(trx, item.id, patch.tags);
  });
  invalidate();
  return getItem(stableKey, deps);
}

async function clone(stableKey, newKey, by = null, deps = {}) {
  const db = deps.db || defaultDb;
  const full = await _loadFull(db, stableKey);
  if (!full) throw new Error(`unknown knowledge item ${stableKey}`);
  const translations = Object.fromEntries(full.translations.map((t) => [t.lang, { title: t.title, body: t.body, summary: t.summary }]));
  const tags = full.tags.map((t) => ({ type: t.tag_type, value: t.tag_value }));
  return createDraft({
    stableKey: newKey, category: full.item.category_code, priority: full.item.priority,
    visibility: full.item.visibility, source: full.item.source, searchKeywords: full.item.search_keywords,
    translations, tags, by,
  }, deps);
}

async function setStatus(stableKey, status, by, deps = {}) {
  const db = deps.db || defaultDb;
  if (!STATUSES.includes(status)) throw new Error(`invalid status ${status}`);
  await db('knowledge_items').where({ stable_key: stableKey }).update({ status, updated_by: by || null });
  invalidate();
  return getItem(stableKey, deps);
}
const submitForReview = (k, by, deps) => setStatus(k, 'review', by, deps);
const archive         = (k, by, deps) => setStatus(k, 'archived', by, deps);

async function approve(stableKey, by = null, deps = {}) {
  const db = deps.db || defaultDb;
  let result;
  await db.transaction(async (trx) => {
    const full = await _loadFull(trx, stableKey);
    if (!full) throw new Error(`unknown knowledge item ${stableKey}`);
    const nextVersion = (full.item.current_version || 0) + 1;
    const snapshot = { item: full.item, translations: full.translations, tags: full.tags };
    await trx('knowledge_item_versions').insert({
      item_id: full.item.id, version: nextVersion, status_at_version: 'approved',
      snapshot: JSON.stringify(snapshot), created_by: by, note: 'approved',
    });
    await trx('knowledge_items').where({ id: full.item.id }).update({
      status: 'approved', current_version: nextVersion, approved_by: by, approved_at: trx.fn.now(), updated_by: by,
    });
    result = nextVersion;
  });
  invalidate();
  return { stable_key: stableKey, approved_version: result };
}

async function listVersions(stableKey, deps = {}) {
  const db = deps.db || defaultDb;
  const item = await db('knowledge_items').where({ stable_key: stableKey }).first();
  if (!item) return [];
  return db('knowledge_item_versions').where({ item_id: item.id })
    .orderBy('version', 'desc').select('version', 'status_at_version', 'created_by', 'note', 'created_at');
}

async function rollback(stableKey, toVersion, by = null, deps = {}) {
  const db = deps.db || defaultDb;
  await db.transaction(async (trx) => {
    const item = await trx('knowledge_items').where({ stable_key: stableKey }).first();
    if (!item) throw new Error(`unknown knowledge item ${stableKey}`);
    const vrow = await trx('knowledge_item_versions').where({ item_id: item.id, version: toVersion }).first();
    if (!vrow) throw new Error(`version ${toVersion} not found for ${stableKey}`);
    const snap = typeof vrow.snapshot === 'string' ? JSON.parse(vrow.snapshot) : vrow.snapshot;
    // restore content from the snapshot
    const translations = Object.fromEntries((snap.translations || []).map((t) => [t.lang, { title: t.title, body: t.body, summary: t.summary }]));
    await _replaceTranslations(trx, item.id, translations);
    await _replaceTags(trx, item.id, (snap.tags || []).map((t) => ({ type: t.tag_type, value: t.tag_value })));
    // record the rollback as a NEW approved version (history stays append-only)
    const nextVersion = (item.current_version || 0) + 1;
    await trx('knowledge_item_versions').insert({
      item_id: item.id, version: nextVersion, status_at_version: 'approved',
      snapshot: JSON.stringify({ ...snap, rolled_back_from: toVersion }), created_by: by, note: `rollback to v${toVersion}`,
    });
    await trx('knowledge_items').where({ id: item.id }).update({
      status: 'approved', current_version: nextVersion, updated_by: by,
    });
  });
  invalidate();
  return getItem(stableKey, deps);
}

module.exports = {
  STATUSES,
  // reads
  getApproved, getApprovedByCategory, getItem, previewDraft,
  // search
  search,
  // lifecycle
  createDraft, updateItem, clone, submitForReview, approve, archive, setStatus, listVersions, rollback,
  // cache
  invalidate, cacheInfo,
};
