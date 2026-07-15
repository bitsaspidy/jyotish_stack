'use strict';
/**
 * Knowledge store (Stage 3) — DB-backed lifecycle tests. Skips when MySQL /
 * migration 049 are unavailable. Uses test.* stable keys and cleans them up.
 */

const test = require('node:test');
const assert = require('node:assert');
const { before, after, beforeEach } = require('node:test');

const db = require('../src/config/db');
const repo = require('../src/services/knowledge/knowledge-repository');

let ready = false;
const TEST_KEYS = ['test.k1', 'test.k1_clone', 'test.draft_only'];

async function cleanup() {
  try {
    const ids = await db('knowledge_items').whereIn('stable_key', TEST_KEYS).pluck('id');
    if (ids.length) await db('knowledge_items').whereIn('id', ids).del();   // cascades
  } catch { /* table may not exist */ }
}

before(async () => {
  try { await db.raw('SELECT 1'); ready = await db.schema.hasTable('knowledge_items'); } catch { ready = false; }
  if (ready) await cleanup();
});
after(async () => { if (ready) await cleanup(); try { await db.destroy(); } catch { /* noop */ } });
beforeEach(() => repo.invalidate());

function guard(t) { if (!ready) { t.skip('MySQL / migration 049 unavailable'); return false; } return true; }

test('seeded demo domain: approved items are readable, draft is hidden, bilingual', async (t) => {
  if (!guard(t)) return;
  const en = await repo.getApproved('life_area.career', 'en');
  const hi = await repo.getApproved('life_area.career', 'hi');
  assert.ok(en && en.title && en.body, 'approved EN present');
  assert.ok(hi && hi.lang === 'hi' && hi.title, 'approved HI present');
  assert.notStrictEqual(en.body, hi.body, 'languages differ');
  assert.strictEqual(await repo.getApproved('life_area.career_review_demo', 'en'), null, 'draft hidden from users');
  const cat = await repo.getApprovedByCategory('life_area_advice', 'en');
  assert.strictEqual(cat.length, 6, 'only the 6 approved items are listed');
});

test('language fallback: unknown language falls back to English', async (t) => {
  if (!guard(t)) return;
  const ta = await repo.getApproved('life_area.finance', 'ta');   // no Tamil translation seeded
  assert.ok(ta && ta.lang === 'en', 'falls back to en');
});

test('lifecycle: draft is hidden → approve makes it visible with a version', async (t) => {
  if (!guard(t)) return;
  await repo.createDraft({
    stableKey: 'test.k1', category: 'life_area_advice', priority: 5,
    translations: { en: { title: 'T', body: 'body-en-v1' }, hi: { title: 'ट', body: 'body-hi-v1' } },
    tags: [{ type: 'keyword', value: 'unit' }], by: 'tester',
  });
  assert.strictEqual(await repo.getApproved('test.k1', 'en'), null, 'draft not user-visible');
  await repo.submitForReview('test.k1', 'tester');
  await repo.approve('test.k1', 'tester');
  const vis = await repo.getApproved('test.k1', 'en');
  assert.ok(vis && vis.body === 'body-en-v1' && vis.version === 1, 'approved + visible at v1');
  const versions = await repo.listVersions('test.k1');
  assert.strictEqual(versions.length, 1);
});

test('admin edit is reflected immediately (cache invalidated on write)', async (t) => {
  if (!guard(t)) return;
  const before = await repo.getApproved('test.k1', 'en');   // warms the cache
  assert.strictEqual(before.body, 'body-en-v1');
  await repo.updateItem('test.k1', { translations: { en: { title: 'T', body: 'body-en-EDITED' } }, by: 'tester' });
  const afterEdit = await repo.getApproved('test.k1', 'en');
  assert.strictEqual(afterEdit.body, 'body-en-EDITED', 'edit visible with no stale cache');
});

test('stable key + uuid never change across edit/approve', async (t) => {
  if (!guard(t)) return;
  const a = await repo.getItem('test.k1');
  await repo.approve('test.k1', 'tester');       // v2
  await repo.updateItem('test.k1', { priority: 9, by: 'tester' });
  const b = await repo.getItem('test.k1');
  assert.strictEqual(a.stable_key, b.stable_key, 'stable_key stable');
  assert.strictEqual(a.uuid, b.uuid, 'uuid stable');
});

test('rollback restores a prior version as new append-only history', async (t) => {
  if (!guard(t)) return;
  // current body is body-en-EDITED (v2 snapshot). Roll back to v1 (body-en-v1).
  await repo.rollback('test.k1', 1, 'tester');
  const rolled = await repo.getApproved('test.k1', 'en');
  assert.strictEqual(rolled.body, 'body-en-v1', 'v1 content restored');
  const versions = await repo.listVersions('test.k1');
  assert.ok(versions[0].version > 2, 'rollback recorded as a NEW version (append-only)');
});

test('clone copies content into a new draft under a new key', async (t) => {
  if (!guard(t)) return;
  const cloned = await repo.clone('test.k1', 'test.k1_clone', 'tester');
  assert.strictEqual(cloned.status, 'draft');
  assert.strictEqual(cloned.stable_key, 'test.k1_clone');
  assert.ok(cloned.translations.find((tr) => tr.lang === 'en'));
});

test('archive removes an item from user-facing reads', async (t) => {
  if (!guard(t)) return;
  await repo.archive('test.k1', 'tester');
  assert.strictEqual(await repo.getApproved('test.k1', 'en'), null, 'archived item hidden');
  await assert.rejects(() => repo.updateItem('test.k1', { priority: 1, by: 'tester' }), /archived/);
});

test('search: by keyword, by tag, and by status', async (t) => {
  if (!guard(t)) return;
  const byTag = await repo.search({ tagType: 'life_area', tagValue: 'health' });
  assert.ok(byTag.some((r) => r.stable_key === 'life_area.health'));
  const byKeyword = await repo.search({ query: 'savings' });   // in finance search_keywords/body
  assert.ok(byKeyword.some((r) => r.stable_key === 'life_area.finance'));
  const drafts = await repo.search({ status: 'draft' });
  assert.ok(drafts.every((r) => r.status === 'draft'));
});
