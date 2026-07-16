'use strict';
/**
 * Human Conversation layer — judgement composition.
 *
 * The bug: answers led with "The prospects here are mixed" — the state label, the
 * engine narrating its own internals. An answer must LEAD with a judgement (claim
 * first), then explain, and the judgement must reflect THIS chart's reasoning
 * rather than being looked up by state.
 */

const test = require('node:test');
const assert = require('node:assert');

const { composeJudgement, QUALIFIED } = require('../src/services/deterministic-qa/judgement-composer');
const judgementBlocks = require('../src/data/judgement-blocks.data');
const directBlocks = require('../src/data/domain-answer-templates.data');

// Resolve against the REAL seeded content, so a missing clause fails the test.
function makeResolver() {
  const map = new Map();
  const add = (rows) => rows.forEach((b) => map.set(`${b.block_key}|${b.lang}`, b.text));
  add(judgementBlocks.buildJudgementBlocks());
  add(directBlocks.buildDomainBlocks());
  return (keys, lang, vars = {}) => {
    for (const k of keys) {
      const t = map.get(`${k}|${lang}`);
      if (t != null) return t.replace(/\{\{(\w+)\}\}/g, (_, n) => (vars[n] != null ? String(vars[n]) : ''));
    }
    return null;
  };
}

const verdict = (alignment, reason = null) => ({ alignment, primary_reason: reason });

test('JG-1: the judgement leads with a claim, not a state label', () => {
  const j = composeJudgement({
    domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'),
    lang: 'en', resolve: makeResolver(),
  });
  assert.ok(j, 'a judgement must be produced');
  assert.ok(!/prospects here are mixed/i.test(j.headline), 'the headline is not the state label');
  assert.ok(/business is possible/i.test(j.headline), 'the headline is the claim');
});

test('JG-2: the headline equals the claim (the answer opens with the conclusion)', () => {
  const j = composeJudgement({ domain: 'finance', state: 'favourable', verdict: verdict('primary_agreement'), lang: 'en', resolve: makeResolver() });
  assert.strictEqual(j.headline, j.clauses.claim);
});

test('JG-3: a qualified alignment adds a "why it is not simple" clause', () => {
  const r = makeResolver();
  const j = composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'), lang: 'en', resolve: r });
  assert.ok(j.text.length > j.headline.length, 'the judgement continues past the claim');
  assert.ok(/side by side|divided/i.test(j.text), 'the mixed_primary qualifier is present');
  assert.ok(j.clauses.qualified);
});

test('JG-4: a clean alignment does NOT hedge — no manufactured "however"', () => {
  const j = composeJudgement({ domain: 'finance', state: 'favourable', verdict: verdict('primary_agreement'), lang: 'en', resolve: makeResolver() });
  assert.strictEqual(j.clauses.qualified, false, 'primary_agreement carries no qualifier');
  assert.ok(!QUALIFIED.has('primary_agreement'));
});

test('JG-5: the same state gives DIFFERENT judgements for different reasons', () => {
  const r = makeResolver();
  const divided = composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'), lang: 'en', resolve: r });
  const blocked = composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('primary_blocker', { planet: 'Venus' }), lang: 'en', resolve: r });
  assert.notStrictEqual(divided.text, blocked.text, 'mixed by conflict must read differently from mixed by a blocker');
  assert.ok(/Venus/.test(blocked.text), 'the blocker judgement names the actual blocking planet');
});

test('JG-6: the judgement ends with a condition — what would move the reading', () => {
  const j = composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'), lang: 'en', resolve: makeResolver() });
  assert.ok(/once it is producing steady paying customers/i.test(j.text),
    'a business judgement ends with the customer-traction condition');
});

test('JG-7: the approach is chosen by alignment, not by domain alone', () => {
  const r = makeResolver();
  const gap = composeJudgement({ domain: 'business', state: 'moderately_favourable', verdict: verdict('timing_gap'), lang: 'en', resolve: r });
  const plain = composeJudgement({ domain: 'business', state: 'favourable', verdict: verdict('primary_agreement'), lang: 'en', resolve: r });
  assert.ok(/quietly|when the period turns/i.test(gap.text), 'timing_gap gets the "build quietly now" approach');
  assert.notStrictEqual(gap.text, plain.text);
});

test('JG-8: both languages compose, and Hindi is Devanagari', () => {
  const r = makeResolver();
  const en = composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'), lang: 'en', resolve: r });
  const hi = composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'), lang: 'hi', resolve: r });
  assert.ok(en && hi);
  assert.ok(/[ऀ-ॿ]/.test(hi.text), 'Hindi judgement is in Devanagari');
  assert.notStrictEqual(en.text, hi.text);
});

test('JG-9: no judgement when there is no claim — never invent one', () => {
  // A resolver that knows no blocks must yield null, not a fabricated sentence.
  const empty = () => null;
  assert.strictEqual(composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'), lang: 'en', resolve: empty }), null);
  assert.strictEqual(composeJudgement({ domain: 'business', state: 'mixed', verdict: null, lang: 'en', resolve: makeResolver() }), null);
});

test('JG-10: no generic filler — every judgement clause is chart-specific', () => {
  const j = composeJudgement({ domain: 'business', state: 'mixed', verdict: verdict('mixed_primary'), lang: 'en', resolve: makeResolver() });
  for (const banned of [/careful effort helps/i, /results depend on effort/i, /strengthen your weak planet/i]) {
    assert.ok(!banned.test(j.text), `judgement must not contain generic filler: ${banned}`);
  }
});

test('JG-11: every judgement block is bilingual', () => {
  const rows = judgementBlocks.buildJudgementBlocks();
  const byKey = {};
  for (const r of rows) (byKey[r.block_key] ||= []).push(r.lang);
  const bad = Object.entries(byKey).filter(([, langs]) => !langs.includes('en') || !langs.includes('hi'));
  assert.deepStrictEqual(bad.map(([k]) => k), []);
});
