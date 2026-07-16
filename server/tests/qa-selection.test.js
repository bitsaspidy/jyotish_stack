'use strict';
/**
 * Intent-aware selection answers.
 *
 * The bug these pin: "which education field suits me?" was answered with
 * "education is workable for you". Domain was right, SHAPE was wrong — a
 * favourability verdict is a true sentence answering a question nobody asked.
 * A selection question must name the options.
 */

const test = require('node:test');
const assert = require('node:assert');

const { resolveIntent, resolveOutputSchema, INTENTS } = require('../src/services/deterministic-qa/intents');
const { taxonomyFor, hasSelector } = require('../src/services/deterministic-qa/selection');
const { rankOptions, fitLevel } = require('../src/services/deterministic-qa/selection/selection-ranker');
const { composeSelection, dominantPlanet } = require('../src/services/deterministic-qa/selection/selection-composer');
const { FIELDS } = require('../src/data/education-fields.data');
const selectionBlocks = require('../src/data/selection-blocks.data');

// ── Intent ──────────────────────────────────────────────────────────────────
test('INT-1: the education-field question resolves to `selection`', () => {
  assert.strictEqual(resolveIntent({ category_code: 'education', subcategory: 'field' }), 'selection');
  assert.strictEqual(resolveOutputSchema({ category_code: 'education', subcategory: 'field' }), 'ranked_selection');
});

test('INT-2: a stored intent_type overrides the derivation — the DB is the authority', () => {
  assert.strictEqual(resolveIntent({ category_code: 'education', subcategory: 'field', intent_type: 'yes_no' }), 'yes_no');
});

test('INT-3: timing questions still resolve to timing, not selection', () => {
  assert.strictEqual(resolveIntent({ category_code: 'marriage', subcategory: 'timing' }), 'timing');
  assert.strictEqual(resolveIntent({ category_code: 'property', subcategory: 'house_timing' }), 'timing');
  assert.strictEqual(resolveOutputSchema({ category_code: 'marriage', subcategory: 'timing' }), 'timing_outlook');
});

test('INT-4: a prospects question stays a yes/no verdict', () => {
  assert.strictEqual(resolveIntent({ category_code: 'business', subcategory: 'potential' }), 'yes_no');
  assert.strictEqual(resolveIntent({ category_code: 'money', subcategory: 'wealth' }), 'yes_no');
  assert.strictEqual(resolveOutputSchema({ category_code: 'money', subcategory: 'wealth' }), 'verdict_summary');
});

test('INT-5: every derived intent is a known intent', () => {
  const { INTENT_BY_SUBCATEGORY } = require('../src/services/deterministic-qa/intents');
  for (const [k, v] of Object.entries(INTENT_BY_SUBCATEGORY)) {
    assert.ok(INTENTS.includes(v), `${k} maps to unknown intent ${v}`);
  }
});

// ── Taxonomy ────────────────────────────────────────────────────────────────
test('TAX-1: education has a taxonomy; an unscoped domain does not', () => {
  assert.ok(hasSelector('education'));
  assert.ok(!hasSelector('marriage'), 'marriage has no option set yet — it must fall back, not fake a ranking');
  assert.ok(taxonomyFor('education').options.length >= 10);
});

test('TAX-2: every field declares planets that do its work, and is not a catch-all', () => {
  for (const f of FIELDS) {
    const planets = Object.keys(f.planets || {});
    assert.ok(planets.length >= 1, `${f.key} declares no planets`);
    assert.ok(planets.length <= 4, `${f.key} declares ${planets.length} planets — a field that matches everyone ranks for everyone and says nothing`);
    assert.ok((f.houses || []).length >= 1, `${f.key} declares no houses`);
    assert.ok(Object.values(f.planets).some((w) => w === 2), `${f.key} has no primary planet`);
  }
});

test('TAX-3: every field has bilingual title, reason and examples', () => {
  for (const f of FIELDS) {
    for (const lang of ['en', 'hi']) {
      assert.ok(f[lang]?.title, `${f.key} missing ${lang} title`);
      assert.ok(f[lang]?.reason, `${f.key} missing ${lang} reason`);
      assert.ok(f[lang]?.examples, `${f.key} missing ${lang} examples`);
    }
  }
});

test('TAX-4: field keys are unique and stable', () => {
  const keys = FIELDS.map((f) => f.key);
  assert.strictEqual(new Set(keys).size, keys.length, 'duplicate field key');
  for (const k of keys) assert.match(k, /^education\.[a-z_]+$/, `${k} is not a stable education key`);
});

// ── Ranking ─────────────────────────────────────────────────────────────────
// A chart with strong Mercury/Mars and weak Venus — the analytical profile.
const ANALYTICAL = {
  strength: { planet_scores: { Mercury: 90, Mars: 82, Saturn: 60, Jupiter: 50, Venus: 22, Moon: 48, Sun: 55, Rahu: 55, Ketu: 45 } },
  factors: [
    { planet: 'Mercury', roles: [{ kind: 'house_lord', house: 5 }], score: 80 },
    { chart: 'd24', score: 45 },
  ],
  dasha: { maha: { lord: 'Mercury' }, antar: { lord: 'Mars' } },
};

test('RANK-1: a strong-Mercury chart ranks analytical fields at the top', () => {
  const r = rankOptions(FIELDS, ANALYTICAL);
  const top = r.primary.map((x) => x.key);
  assert.ok(top.some((k) => /software_it|data_analytics|engineering/.test(k)),
    `expected an analytical/technical field in the top 3, got ${top.join(', ')}`);
});

test('RANK-2: a weak blocker planet pushes its field down and marks it conditional', () => {
  const r = rankOptions(FIELDS, ANALYTICAL);
  const design = r.ranked.find((x) => x.key === 'education.design_uiux');   // blocker: Venus (22 → -56 signed)
  assert.ok(design.blocked, 'weak Venus must block design');
  assert.strictEqual(design.blockedBy, 'Venus');
  const software = r.ranked.find((x) => x.key === 'education.software_it');
  assert.ok(software.score > design.score, 'a blocked field must rank below an unblocked one');
});

test('RANK-3: ranking is deterministic — the same chart always gives the same order', () => {
  const a = rankOptions(FIELDS, ANALYTICAL).ranked.map((x) => x.key);
  const b = rankOptions(FIELDS, ANALYTICAL).ranked.map((x) => x.key);
  assert.deepStrictEqual(a, b);
});

test('RANK-4: the top of a weak field is not sold as a "best fit"', () => {
  assert.strictEqual(fitLevel(0, 0.9, false), 'best_fit');
  assert.strictEqual(fitLevel(0, 0.2, false), 'strong', 'a weak winner is the least bad, not the best fit');
  assert.strictEqual(fitLevel(0, -0.5, false), 'lower_fit');
  assert.strictEqual(fitLevel(1, 0.9, true), 'conditional', 'blocked always reads as conditional');
});

test('RANK-5: every option is scored and none silently vanish', () => {
  const r = rankOptions(FIELDS, ANALYTICAL);
  assert.strictEqual(r.ranked.length, FIELDS.length);
  assert.strictEqual(r.primary.length + r.secondary.length + r.discarded.length, FIELDS.length);
});

test('RANK-6: contributions explain every score — the admin audit trail', () => {
  const r = rankOptions(FIELDS, ANALYTICAL);
  const sw = r.ranked.find((x) => x.key === 'education.software_it');
  assert.ok(sw.contributions.length > 0);
  assert.ok(sw.contributions.some((c) => c.kind === 'karaka' && c.planet === 'Mercury'));
  assert.ok(sw.contributions.some((c) => c.kind === 'varga' && c.chart === 'd24'), 'D24 must contribute');
  assert.ok(sw.contributions.some((c) => c.kind === 'dasha'), 'running dasha must contribute');
  assert.ok(sw.contributions.some((c) => c.kind === 'house_lord'), '5th-lord Mercury must corroborate');
});

// ── Composition ─────────────────────────────────────────────────────────────
// Resolve against the real seeded content, so a missing block fails the test.
function makeResolver() {
  const map = new Map();
  for (const b of selectionBlocks.buildSelectionBlocks()) map.set(`${b.block_key}|${b.lang}`, b.text);
  return (keys, lang, vars = {}) => {
    for (const k of keys) {
      const t = map.get(`${k}|${lang}`);
      if (t != null) return t.replace(/\{\{(\w+)\}\}/g, (_, n) => (vars[n] != null ? String(vars[n]) : ''));
    }
    return null;
  };
}

function compose(lang) {
  const ranking = rankOptions(FIELDS, ANALYTICAL);
  return composeSelection({ ranking, domain: 'education', prefix: 'sel.education', lang, resolve: makeResolver() });
}

test('OUT-1: the answer names actual education fields', () => {
  const s = compose('en');
  assert.ok(s.options.length >= 3, 'at least three ranked fields');
  for (const o of s.options) {
    assert.ok(o.title && o.title.length > 3, 'each option is a named field');
    assert.ok(o.reason && o.reason.length > 20, 'each option explains why it ranked');
    assert.ok(o.fit_label, 'each option carries a fit label');
    assert.ok(typeof o.rank === 'number' && o.rank >= 1);
  }
});

test('OUT-2: the answer leads with a primary direction, not a verdict', () => {
  const en = compose('en');
  const hi = compose('hi');
  assert.ok(en.primary_direction && en.primary_direction.length > 10);
  assert.ok(hi.primary_direction && hi.primary_direction.length > 10);
  // The exact failure reported: a selection answer must not open by telling the
  // reader whether education is achievable.
  assert.ok(!/achievable|workable for you/i.test(en.primary_direction));
  assert.ok(!hi.primary_direction.includes('साध्य है'), 'must not answer "is education achievable"');
});

test('OUT-3: D24 is explained for what it contributes to education', () => {
  const s = compose('en');
  assert.ok(/D24/.test(s.varga_note));
  assert.ok(/formal learning|complete|qualification/i.test(s.varga_note), 'D24 must be explained, not just named');
});

test('OUT-4: a practical test plan is always included', () => {
  for (const lang of ['en', 'hi']) {
    const s = compose(lang);
    assert.ok(s.test_plan && s.test_plan.length > 40, `${lang} test plan missing`);
  }
  assert.ok(/course/i.test(compose('en').test_plan));
});

test('OUT-5: the direction summarises the ranking rather than contradicting it', () => {
  const ranking = rankOptions(FIELDS, ANALYTICAL);
  const lead = dominantPlanet(ranking.primary);
  // The analytical chart's top fields are Mercury-led, so the direction must be too.
  assert.ok(['Mercury', 'Mars'].includes(lead), `direction planet ${lead} should reflect the top options`);
});

test('OUT-6: a blocked option is labelled, not silently promoted', () => {
  const ranking = rankOptions(FIELDS, ANALYTICAL, { top: 20, secondary: 0 });
  const s = composeSelection({ ranking, domain: 'education', prefix: 'sel.education', lang: 'en', resolve: makeResolver() });
  const design = s.options.find((o) => o.key === 'education.design_uiux');
  assert.ok(design.caution, 'a blocked option must carry its caveat');
  assert.ok(/Venus/.test(design.caution));
});

// ── Safety ──────────────────────────────────────────────────────────────────
test('SAFE-1: no option promises success', () => {
  const s = compose('en');
  const all = [s.primary_direction, s.test_plan, ...s.options.map((o) => `${o.reason} ${o.caution || ''}`)].join(' ');
  assert.ok(!/\b(guarantee|guaranteed|will succeed|certain success|assured)\b/i.test(all));
});

test('SAFE-2: the reading is stated as a leaning, not an aptitude test', () => {
  const r = makeResolver();
  for (const lang of ['en', 'hi']) {
    const d = r(['sel.disclaimer.education'], lang);
    assert.ok(d, `${lang} selection disclaimer missing`);
  }
  assert.ok(/not an aptitude test/i.test(r(['sel.disclaimer.education'], 'en')));
  assert.ok(/career counselling|counselling/i.test(r(['sel.disclaimer.education'], 'en')));
  assert.ok(r(['sel.test_plan.education'], 'en').includes('cannot measure your aptitude'));
});

test('SAFE-3: no raw scores reach the composed answer', () => {
  const dump = JSON.stringify(compose('en'));
  assert.ok(!/"score"|"fitScore"|"contributions"|"delta"/.test(dump), 'user payload must carry no scores');
});

// ── Language ────────────────────────────────────────────────────────────────
test('LANG-1: Hindi and English both render, and differ', () => {
  const en = compose('en');
  const hi = compose('hi');
  assert.strictEqual(en.options.length, hi.options.length);
  for (let i = 0; i < en.options.length; i += 1) {
    assert.notStrictEqual(en.options[i].reason, hi.options[i].reason, 'Hindi must not fall back to English');
  }
  assert.ok(/[ऀ-ॿ]/.test(hi.primary_direction), 'Hindi direction must be in Devanagari');
  assert.ok(/[ऀ-ॿ]/.test(hi.test_plan), 'Hindi plan must be in Devanagari');
});

test('LANG-2: every seeded selection block exists in both languages', () => {
  const rows = selectionBlocks.buildSelectionBlocks();
  const byKey = {};
  for (const r of rows) (byKey[r.block_key] ||= []).push(r.lang);
  const bad = Object.entries(byKey).filter(([, langs]) => !langs.includes('en') || !langs.includes('hi'));
  assert.deepStrictEqual(bad.map(([k]) => k), [], 'these blocks are missing a language');
});

test('LANG-3: no internal keys leak into user-facing text', () => {
  const dump = JSON.stringify(compose('hi'));
  assert.ok(!/sel\.education\.|sel\.fit\.|sel\.direction\./.test(dump.replace(/"key":"[^"]*"/g, '')),
    'block keys must not appear in rendered text');
});
