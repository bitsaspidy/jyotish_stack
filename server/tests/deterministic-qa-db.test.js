'use strict';
/**
 * Deterministic Q&A — Phase 3 DB-backed integration tests.
 *
 * Exercises the catalogue repository + full pipeline against the real MySQL
 * catalogue (migrations 046/047 + seeds 033/034). SKIPS gracefully when the DB
 * is unreachable so the rest of the suite still runs in CI without a database.
 */

const test = require('node:test');
const assert = require('node:assert');
const { before, after } = require('node:test');

const db = require('../src/config/db');
const repo = require('../src/services/deterministic-qa/catalogue-repository');
const qa = require('../src/services/deterministic-qa');
const pilot = require('../src/services/deterministic-qa/pilot-rules');

let dbUp = false;
let catalogueReady = false;

before(async () => {
  try {
    await db.raw('SELECT 1');
    dbUp = true;
    catalogueReady = await db.schema.hasTable('question_catalogue');
  } catch { dbUp = false; }
});

after(async () => { try { await db.destroy(); } catch { /* noop */ } });

function guard(t) {
  if (!dbUp) { t.skip('MySQL unreachable'); return false; }
  if (!catalogueReady) { t.skip('catalogue not migrated (run migrate + seeds 033/034)'); return false; }
  return true;
}

test('active question lookup returns the catalogue row', async (t) => {
  if (!guard(t)) return;
  const q = await repo.getActiveQuestionByCode('Q001');
  assert.ok(q, 'Q001 should exist and be active');
  assert.strictEqual(q.code, 'Q001');
  assert.strictEqual(q.category_code, 'personality');
});

test('inactive question is hidden by getActiveQuestionByCode', async (t) => {
  if (!guard(t)) return;
  // insert a throwaway inactive row, assert it is hidden, then remove it
  await db('question_catalogue').where({ code: 'Q000' }).del();
  await db('question_catalogue').insert({
    code: 'Q000', category_code: 'personality', question_en: 'test', question_hi: 'परीक्षण',
    short_title_en: 'test', short_title_hi: 'परीक्षण', active: false, display_order: 999,
  });
  try {
    assert.strictEqual(await repo.getActiveQuestionByCode('Q000'), null, 'inactive must be hidden');
    const raw = await repo.getQuestionByCode('Q000');
    assert.ok(raw && raw.active === 0 || raw.active === false, 'raw lookup still sees it');
  } finally {
    await db('question_catalogue').where({ code: 'Q000' }).del();
  }
});

test('legacy alias resolves to the new question code', async (t) => {
  if (!guard(t)) return;
  const alias = await repo.resolveLegacyKey('marriage_when');
  assert.ok(alias, 'known alias should resolve');
  assert.strictEqual(alias.status, 'aliased');
  assert.strictEqual(alias.question_code, 'Q041');
});

test('retired legacy key is rejected (no forced home)', async (t) => {
  if (!guard(t)) return;
  const alias = await repo.resolveLegacyKey('love_reunite');
  assert.ok(alias);
  assert.strictEqual(alias.status, 'retired');
  assert.strictEqual(alias.question_code, null);
  // and the orchestrator surfaces it as a retired rejection
  const r = await qa.resolveQuestion({ legacyKey: 'love_reunite' });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'retired_legacy_key');
});

test('invalid / unknown question code is rejected', async (t) => {
  if (!guard(t)) return;
  assert.strictEqual(await repo.getActiveQuestionByCode('ZZZZ'), null);
  const r1 = await qa.resolveQuestion({ questionCode: 'not-a-code' });
  assert.strictEqual(r1.reason, 'invalid_question_code');
  const r2 = await qa.resolveQuestion({ questionCode: 'Q404' });
  assert.strictEqual(r2.reason, 'question_not_found');
});

test('catalogue response is bilingual (Hindi + English) and single-sourced', async (t) => {
  if (!guard(t)) return;
  const grouped = await repo.getActiveCatalogueGrouped();
  assert.strictEqual(grouped.length, 10, '10 active categories');
  // Stage 1 (temporary approach): only the 10 pilot questions are ACTIVE; the
  // other 90 stay in the catalogue but inactive and fully hidden from users.
  const totalQs = grouped.reduce((s, c) => s + c.questions.length, 0);
  assert.strictEqual(totalQs, 10, '10 active (pilot) questions');
  const totalRows = Number((await db('question_catalogue').count('* as c').first()).c);
  assert.strictEqual(totalRows, 100, 'all 100 questions remain in the catalogue');
  const inactive = Number((await db('question_catalogue').where({ active: false }).count('* as c').first()).c);
  assert.strictEqual(inactive, 90, '90 non-pilot questions are inactive');
  for (const c of grouped) {
    assert.ok(c.label_en && c.label_hi, `category ${c.code} bilingual label`);
    for (const q of c.questions) {
      assert.ok(q.question_en && q.question_en.trim(), `${q.code} en`);
      assert.ok(q.question_hi && q.question_hi.trim(), `${q.code} hi`);
      assert.ok(/^Q\d{3}$/.test(q.code));
    }
  }
});

test('no duplicate catalogues: DB grouped set is the Q-code catalogue, distinct from legacy keys', async (t) => {
  if (!guard(t)) return;
  const grouped = await repo.getActiveCatalogueGrouped();
  const dbCodes = new Set(grouped.flatMap((c) => c.questions.map((q) => q.code)));
  // every DB code is a Q-code; the legacy question-bank uses non-Q string keys —
  // the two never overlap, so a merged/duplicated catalogue is impossible.
  for (const code of dbCodes) assert.ok(/^Q\d{3}$/.test(code));
  const legacy = require('../src/services/question-bank');
  const legacyKeys = legacy.grouped().flatMap((c) => (c.questions || []).map((q) => q.key || q.id || ''));
  const overlap = legacyKeys.filter((k) => dbCodes.has(k));
  assert.strictEqual(overlap.length, 0, 'legacy keys and DB Q-codes must not overlap');
});

test('full deterministic pipeline answers Q001 + Q093 for an owned calculated Kundli', async (t) => {
  if (!guard(t)) return;
  const p = await db('kundli_profiles').whereNotNull('calculated_data').whereNotNull('user_id')
    .select('uuid', 'user_id').first();
  if (!p) { t.skip('no owned calculated Kundli in this DB'); return; }

  for (const code of ['Q001', 'Q093']) {
    assert.ok(pilot.hasRule(code), `${code} is a pilot question`);
    const r = await qa.answerQuestion({ questionCode: code, kundliUuid: p.uuid, userId: p.user_id, atDate: new Date('2026-07-12') });
    assert.ok(r.ok, `${code} answered`);
    assert.strictEqual(r.path, 'deterministic');
    // 7 valid states only
    assert.ok(['highly_favourable', 'favourable', 'moderately_favourable', 'mixed', 'challenging', 'highly_challenging', 'insufficient_data'].includes(r.answer.state));
    // bilingual, human-readable, no raw scores in the user answer
    const direct = r.answer.sections.find((s) => s.key === 'direct_answer');
    assert.ok(direct.text_en && direct.text_hi, 'bilingual direct answer');
    assert.ok(!/"score"|rawScore/.test(JSON.stringify(r.answer)), 'no raw scores to users');
    // admin trace carries the numeric detail + calc version
    assert.strictEqual(typeof r.trace.data_completeness, 'number');
    assert.ok(r.trace.calc_version);
  }
});

test('cross-user denial through the full pipeline', async (t) => {
  if (!guard(t)) return;
  const p = await db('kundli_profiles').whereNotNull('user_id').select('uuid', 'user_id').first();
  if (!p) { t.skip('no Kundli'); return; }
  const wrongUser = p.user_id + 100000;   // definitely not the owner
  const r = await qa.answerQuestion({ questionCode: 'Q001', kundliUuid: p.uuid, userId: wrongUser });
  assert.strictEqual(r.ok, false);
  assert.ok(['forbidden', 'not_found'].includes(r.reason));
});
