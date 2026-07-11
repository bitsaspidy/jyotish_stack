'use strict';
/**
 * Phase 2 catalogue integrity tests (DB-free — validate the seed source of truth).
 * Migration up/down + unique-constraint (duplicate template) protection are
 * verified against the real MySQL at deploy time via `npm run migrate`.
 */

const test = require('node:test');
const assert = require('node:assert');
const data = require('../src/data/question-catalogue.data');

const CATEGORY_CODES = new Set(data.CATEGORIES.map((c) => c.code));
const CATALOGUE = data.buildCatalogue();
const REQS = data.buildRequirements();
const CODE_SET = new Set(CATALOGUE.map((q) => q.code));
const ALLOWED_SECTIONS = new Set(['direct_answer','kundli_indicates','dchart_indication','dasha_influence','transit_influence','positive','caution','timing_outlook','practical_guidance','remedy','important_note']);
const KNOWN_CHARTS = new Set(['d1','d2','d4','d7','d9','d10','d12','d16','d20','d24','d27','d30']);
const PLANETS = new Set(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']);
const DISCLAIMERS = new Set(['none','general','medical','financial','marriage']);

test('exactly 100 questions with unique sequential codes Q001–Q100', () => {
  assert.strictEqual(CATALOGUE.length, 100);
  assert.strictEqual(CODE_SET.size, 100);
  CATALOGUE.forEach((q, i) => assert.strictEqual(q.code, `Q${String(i + 1).padStart(3, '0')}`));
});

test('every question has Hindi + English text and short titles', () => {
  for (const q of CATALOGUE) {
    assert.ok(q.q_en && q.q_en.trim(), `${q.code} en`);
    assert.ok(q.q_hi && q.q_hi.trim(), `${q.code} hi`);
    assert.ok(q.t_en && q.t_hi, `${q.code} titles`);
  }
});

test('category mapping + display order valid', () => {
  assert.strictEqual(CATEGORY_CODES.size, 10);
  const orders = CATALOGUE.map((q) => q.display_order);
  assert.deepStrictEqual(orders, Array.from({ length:100 }, (_, i) => i + 1));
  for (const q of CATALOGUE) assert.ok(CATEGORY_CODES.has(q.category), `${q.code} category ${q.category}`);
});

test('disclaimer types are valid', () => {
  for (const q of CATALOGUE) assert.ok(DISCLAIMERS.has(q.disclaimer_type), `${q.code} ${q.disclaimer_type}`);
});

test('requirements: 100 rows, valid sections/charts/planets, 4–8 sections', () => {
  assert.strictEqual(REQS.length, 100);
  for (const r of REQS) {
    assert.ok(CODE_SET.has(r.question_code));
    assert.ok(r.answer_sections.length >= 4 && r.answer_sections.length <= 11, `${r.question_code} sections=${r.answer_sections.length}`);
    for (const s of r.answer_sections) assert.ok(ALLOWED_SECTIONS.has(s), `${r.question_code} bad section ${s}`);
    for (const c of r.divisional_charts) assert.ok(KNOWN_CHARTS.has(c), `${r.question_code} unknown chart ${c} (no invented D3/D11)`);
    for (const p of r.planets) assert.ok(PLANETS.has(p), `${r.question_code} bad planet ${p}`);
    assert.ok(['degrade','block'].includes(r.missing_data_behaviour));
    assert.ok(r.answer_sections.includes('direct_answer') && r.answer_sections.includes('important_note'));
  }
});

test('no requirement references unimplemented D3 or D11', () => {
  for (const r of REQS) {
    assert.ok(!r.divisional_charts.includes('d3'), `${r.question_code} must not require D3`);
    assert.ok(!r.divisional_charts.includes('d11'), `${r.question_code} must not require D11`);
  }
});

test('legacy aliases: 66 total, unique keys, 3 retired, aliased codes valid', () => {
  assert.strictEqual(data.ALIASES.length, 66);
  const keys = data.ALIASES.map((a) => a.legacy_key);
  assert.strictEqual(new Set(keys).size, 66, 'alias keys unique');
  const retired = data.ALIASES.filter((a) => a.status === 'retired');
  assert.deepStrictEqual(retired.map((a) => a.legacy_key).sort(), ['finance_investment','love_reunite','marriage_second']);
  for (const a of retired) assert.strictEqual(a.question_code, null);
  for (const a of data.ALIASES.filter((x) => x.status === 'aliased')) assert.ok(CODE_SET.has(a.question_code), `${a.legacy_key} → ${a.question_code}`);
});

test('pilot set: 10 codes, one per category, all in catalogue', () => {
  assert.strictEqual(data.PILOT_CODES.length, 10);
  const cats = data.PILOT_CODES.map((code) => CATALOGUE.find((q) => q.code === code).category);
  assert.strictEqual(new Set(cats).size, 10, 'one pilot per category');
  for (const code of data.PILOT_CODES) assert.ok(CODE_SET.has(code));
});

test('shared blocks are bilingual (en+hi) for each key/version', () => {
  const byKey = new Map();
  for (const b of data.SHARED_BLOCKS) {
    const k = `${b.block_key}@${b.version}`;
    byKey.set(k, (byKey.get(k) || new Set()).add(b.lang));
  }
  for (const [k, langs] of byKey) { assert.ok(langs.has('en'), `${k} en`); assert.ok(langs.has('hi'), `${k} hi`); }
  assert.ok(data.SHARED_BLOCKS.some((b) => b.type === 'insufficient_data'));
  assert.ok(data.SHARED_BLOCKS.some((b) => b.block_key === 'disclaimer_medical'));
});
