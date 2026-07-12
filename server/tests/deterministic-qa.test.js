'use strict';
/**
 * Deterministic Q&A — Phase 3 unit tests (DB-FREE).
 *
 * Covers the pure engine logic with fixtures + dependency injection so it runs
 * under `node --test` with no MySQL. DB-backed catalogue behaviour (active/inactive
 * lookup, alias resolution, bilingual catalogue) lives in deterministic-qa-db.test.js
 * and skips when the DB is unreachable.
 */

const test = require('node:test');
const assert = require('node:assert');

const chartLoader = require('../src/services/deterministic-qa/selective-chart-loader');
const completeness = require('../src/services/deterministic-qa/completeness-evaluator');
const { resolveState, scoreToState } = require('../src/services/deterministic-qa/state-engine');
const routing = require('../src/services/deterministic-qa/routing');
const { loadKundliForQuestion } = require('../src/services/deterministic-qa/kundli-data-loader');
const requirementLoader = require('../src/services/deterministic-qa/requirement-loader');
const catalogueRepo = require('../src/services/deterministic-qa/catalogue-repository');
const qa = require('../src/services/deterministic-qa');
const cfg = require('../src/config/deterministic-qa.config');

// ── Fixtures ─────────────────────────────────────────────────────────────────
function fixtureChart(overrides = {}) {
  const planet = (rashi_num, extra = {}) => ({ rashi_num, dignity: 'Friend', is_retrograde: false, is_combust: false, combust_level: null, nakshatra_num: 5, ...extra });
  return {
    ascendant: { rashi_num: 1, rashi_en: 'Aries', rashi_hi: 'मेष', rashi_lord: 'Mars' },
    planets: {
      Sun: planet(5), Moon: planet(2), Mars: planet(1), Mercury: planet(6),
      Jupiter: planet(9), Venus: planet(7), Saturn: planet(11), Rahu: planet(11), Ketu: planet(5),
    },
    dasha: [{ is_current: true, lord: 'Jupiter', end: '2030-01-01',
      antardasha: [{ is_current: true, lord: 'Venus', end: '2027-01-01' }] }],
    yogas_doshas: { yogas: [], doshas: [] },
    varga_charts: { d1: {}, d9: {}, d10: {}, d2: {} },
    varga_analysis: {
      d1: { overall_status: 'favorable' }, d9: { overall_status: 'challenging' },
      d10: { overall_status: 'supportive' }, d2: { overall_status: 'neutral' },
    },
    ...overrides,
  };
}

function fakeDb(profiles) {
  return function () {
    const where = {};
    const qb = {
      where(obj) { Object.assign(where, obj); return qb; },
      select() { return qb; },
      async first() {
        return profiles.find((p) => Object.entries(where).every(([k, v]) => p[k] === v));
      },
    };
    return qb;
  };
}

const REQ = {
  question_code: 'Q001', houses: [1, 4, 10], house_lords: [1, 10],
  planets: ['Sun', 'Moon', 'Mars'], divisional_charts: ['d1', 'd9'],
  dasha_levels: ['maha', 'antar'], needs_current_transit: false, needs_dated_transit: false,
  needs_yoga: true, needs_remedy: false, shadbala_enhances: true, ashtakavarga_enhances: false,
  answer_sections: ['direct_answer', 'kundli_indicates', 'important_note'],
  required_fields: ['ascendant', 'planets', 'dasha'], missing_data_behaviour: 'degrade',
};

// ── Selective chart loading ──────────────────────────────────────────────────
test('selective chart loading returns only requested supported charts', () => {
  const res = chartLoader.loadCharts(fixtureChart(), ['d1', 'd9']);
  assert.deepStrictEqual(Object.keys(res.available).sort(), ['d1', 'd9']);
  assert.strictEqual(res.available.d9.status, 'challenging');
  assert.strictEqual(res.fallbacks.length, 0);
  assert.strictEqual(res.missing.length, 0);
});

test('missing supported chart is reported, never fabricated', () => {
  const res = chartLoader.loadCharts(fixtureChart({ varga_charts: { d1: {} }, varga_analysis: { d1: {} } }), ['d1', 'd10']);
  assert.ok(res.available.d1);
  assert.deepStrictEqual(res.missing, ['d10']);
  assert.ok(!res.available.d10);
});

test('unsupported D3/D11 fall back to D1 house, labelled, never as D3/D11', () => {
  const res = chartLoader.loadCharts(fixtureChart(), ['d3', 'd11']);
  const reqd = res.fallbacks.map((f) => f.requested).sort();
  assert.deepStrictEqual(reqd, ['d11', 'd3']);
  const d3 = res.fallbacks.find((f) => f.requested === 'd3');
  assert.strictEqual(d3.actual, 'd1');
  assert.strictEqual(d3.house, 3);
  assert.strictEqual(d3.limitation_block, 'limitation_d3');
  assert.ok(d3.confidence_penalty);
  // D3/D11 must never appear as available "d3"/"d11" charts
  assert.ok(!res.available.d3 && !res.available.d11);
  // the D1 base is made available for the fallback house reading
  assert.ok(res.available.d1);
});

// ── Completeness ─────────────────────────────────────────────────────────────
test('completeness: full data → 100 and answer decision', async () => {
  const loaded = await loadKundliForQuestion({
    uuid: '11111111-1111-1111-1111-111111111111', userId: 7, requirement: REQ,
    deps: { db: fakeDb([{ id: 1, uuid: '11111111-1111-1111-1111-111111111111', user_id: 7, name: 'X', calculated_data: fixtureChart() }]) },
  });
  assert.ok(loaded.ok);
  const comp = completeness.evaluate({ requirement: REQ, loaded, minDataPolicy: 'lenient' });
  assert.strictEqual(comp.data_completeness, 100);
  assert.strictEqual(comp.decision, 'answer');
  assert.strictEqual(comp.suggested_confidence, 'high');
  // enhancer honesty
  assert.strictEqual(comp.enhancers.classical_shadbala, 'unavailable');
  assert.strictEqual(comp.enhancers.custom_strength_proxy, 'available');
  assert.ok(comp.missing_optional_enhancers.includes('classical_shadbala'));
});

test('completeness: block behaviour when a required chart is missing under strict/block', async () => {
  const chart = fixtureChart({ varga_charts: { d1: {} }, varga_analysis: { d1: {} } });
  const req = { ...REQ, divisional_charts: ['d1', 'd9', 'd10', 'd2'], missing_data_behaviour: 'block' };
  const loaded = await loadKundliForQuestion({
    uuid: '22222222-2222-2222-2222-222222222222', userId: 7, requirement: req,
    deps: { db: fakeDb([{ id: 2, uuid: '22222222-2222-2222-2222-222222222222', user_id: 7, name: 'Y', calculated_data: chart }]) },
  });
  const comp = completeness.evaluate({ requirement: req, loaded, minDataPolicy: 'strict' });
  assert.strictEqual(comp.decision, 'block');
  assert.ok(comp.missing_required.some((m) => m.startsWith('chart:')));
});

test('completeness: degrade behaviour when data partial but not blocking', async () => {
  const chart = fixtureChart({ varga_charts: { d1: {}, d9: {} }, varga_analysis: { d1: {}, d9: {} } });
  const req = { ...REQ, divisional_charts: ['d1', 'd9', 'd10', 'd2'], missing_data_behaviour: 'degrade' };
  const loaded = await loadKundliForQuestion({
    uuid: '33333333-3333-3333-3333-333333333333', userId: 7, requirement: req,
    deps: { db: fakeDb([{ id: 3, uuid: '33333333-3333-3333-3333-333333333333', user_id: 7, name: 'Z', calculated_data: chart }]) },
  });
  const comp = completeness.evaluate({ requirement: req, loaded, minDataPolicy: 'lenient' });
  assert.strictEqual(comp.decision, 'degrade');
  assert.ok(comp.data_completeness < 100 && comp.data_completeness >= 50);
});

// ── State bands + conflict overrides + confidence ────────────────────────────
test('score bands map correctly across the 7 states', () => {
  assert.strictEqual(scoreToState(85), 'highly_favourable');
  assert.strictEqual(scoreToState(50), 'favourable');
  assert.strictEqual(scoreToState(30), 'moderately_favourable');
  assert.strictEqual(scoreToState(0), 'mixed');
  assert.strictEqual(scoreToState(-30), 'challenging');
  assert.strictEqual(scoreToState(-70), 'highly_challenging');
});

test('conflict: strong positive/negative split is forced to mixed and drops confidence', () => {
  const groups = {
    natal:  { present: true, score: 70, layers: [{ key: 'a', score: 70 }] },
    dchart: { present: true, score: -60, layers: [{ key: 'b', score: -60 }] },
    timing: { present: false, score: 0, layers: [] },
  };
  const d = resolveState({ groups, suggestedConfidence: 'high' });
  assert.strictEqual(d.state, 'mixed');
  assert.ok(d.conflicts.some((c) => c.type === 'strong_split'));
  assert.notStrictEqual(d.confidence, 'high');   // lowered
});

test('conflict: favourable timing must NOT override weak natal into guaranteed favourable', () => {
  const groups = {
    natal:  { present: true, score: 5, layers: [{ key: 'n', score: 5 }] },       // weak natal promise
    dchart: { present: true, score: 40, layers: [{ key: 'd', score: 40 }] },
    timing: { present: true, score: 90, layers: [{ key: 't', score: 90 }] },     // strong favourable timing
  };
  const d = resolveState({ groups, timingHeavy: true, suggestedConfidence: 'high' });
  // must be capped at moderately_favourable at best (never highly_favourable/favourable)
  assert.ok(['moderately_favourable', 'mixed'].includes(d.state), `got ${d.state}`);
  assert.ok(d.notes.includes('weak_natal_capped_upside') || d.state === 'mixed');
});

test('safety: highly_challenging requires multiple strong negative layers, else softened', () => {
  const single = {
    natal:  { present: true, score: -80, layers: [{ key: 'n', score: -80 }] },
    dchart: { present: true, score: -10, layers: [{ key: 'd', score: -10 }] },
    timing: { present: false, score: 0, layers: [] },
  };
  const d1 = resolveState({ groups: single, suggestedConfidence: 'medium' });
  assert.strictEqual(d1.state, 'challenging');   // softened — only one strong-negative layer
  assert.ok(d1.notes.includes('highly_challenging_softened_insufficient_layers'));

  const many = {
    natal:  { present: true, score: -80, layers: [{ key: 'n1', score: -80 }, { key: 'n2', score: -60 }] },
    dchart: { present: true, score: -70, layers: [{ key: 'd', score: -70 }] },
    timing: { present: false, score: 0, layers: [] },
  };
  const d2 = resolveState({ groups: many, suggestedConfidence: 'medium' });
  assert.strictEqual(d2.state, 'highly_challenging');   // genuinely supported
});

test('confidence is independent of state (single evidence group caps high→medium)', () => {
  const groups = {
    natal:  { present: true, score: 80, layers: [{ key: 'n', score: 80 }] },
    dchart: { present: false, score: 0, layers: [] },
    timing: { present: false, score: 0, layers: [] },
  };
  const d = resolveState({ groups, suggestedConfidence: 'high' });
  assert.strictEqual(d.state, 'highly_favourable');
  assert.strictEqual(d.confidence, 'medium');   // thin evidence → confidence lowered, state untouched
});

// ── Ownership (fake db) ──────────────────────────────────────────────────────
const OWN_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ownerProfiles = [{ id: 9, uuid: OWN_UUID, user_id: 42, name: 'Owner', calculated_data: fixtureChart() }];

test('authenticated owner can access their own Kundli', async () => {
  const r = await loadKundliForQuestion({ uuid: OWN_UUID, userId: 42, requirement: REQ, deps: { db: fakeDb(ownerProfiles) } });
  assert.ok(r.ok);
  assert.strictEqual(r.profile.uuid, OWN_UUID);
});

test('unauthenticated access is rejected', async () => {
  const r = await loadKundliForQuestion({ uuid: OWN_UUID, userId: null, requirement: REQ, deps: { db: fakeDb(ownerProfiles) } });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'unauthenticated');
});

test('invalid Kundli identifier is rejected', async () => {
  const r = await loadKundliForQuestion({ uuid: 'not-a-uuid', userId: 42, requirement: REQ, deps: { db: fakeDb(ownerProfiles) } });
  assert.strictEqual(r.reason, 'invalid_id');
});

test('cross-user access is denied (another user cannot read this Kundli)', async () => {
  const r = await loadKundliForQuestion({ uuid: OWN_UUID, userId: 999, requirement: REQ, deps: { db: fakeDb(ownerProfiles) } });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'forbidden');   // exists but not owned → mapped to 404 by the route
});

// ── Requirement validation ───────────────────────────────────────────────────
test('invalid requirements JSON is rejected loudly', async () => {
  const orig = catalogueRepo.getRequirementsRow;
  catalogueRepo.getRequirementsRow = async () => ({
    question_code: 'Q001', houses: '{ not json', house_lords: '[1]', planets: '["Sun"]',
    divisional_charts: '["d1"]', dasha_levels: '["maha"]', answer_sections: '["direct_answer"]',
    required_fields: '["ascendant"]', missing_data_behaviour: 'degrade',
  });
  try {
    await assert.rejects(() => requirementLoader.loadRequirement('Q001'), /RequirementValidationError|Invalid requirement/);
  } finally { catalogueRepo.getRequirementsRow = orig; }
});

test('requirement with unknown planet is rejected', async () => {
  const orig = catalogueRepo.getRequirementsRow;
  catalogueRepo.getRequirementsRow = async () => ({
    question_code: 'Q001', houses: '[1]', house_lords: '[1]', planets: '["Pluto"]',
    divisional_charts: '["d1"]', dasha_levels: '["maha"]', answer_sections: '["direct_answer"]',
    required_fields: '["ascendant"]', missing_data_behaviour: 'degrade',
  });
  try {
    await assert.rejects(() => requirementLoader.loadRequirement('Q001'), /unknown planet/);
  } finally { catalogueRepo.getRequirementsRow = orig; }
});

// ── Feature-flag routing ─────────────────────────────────────────────────────
test('feature flags route to exactly one catalogue source (never both)', () => {
  const prev = process.env.QA_DB_CATALOGUE;
  process.env.QA_DB_CATALOGUE = 'true';
  assert.strictEqual(routing.catalogueSource(), 'db');
  process.env.QA_DB_CATALOGUE = 'false';
  assert.strictEqual(routing.catalogueSource(), 'legacy');
  // exactly one, never both
  assert.ok(['db', 'legacy'].includes(routing.catalogueSource()));
  if (prev === undefined) delete process.env.QA_DB_CATALOGUE; else process.env.QA_DB_CATALOGUE = prev;
});

test('deterministic answer path is a separate switch from the DB catalogue', () => {
  const savedDet = process.env.QA_DETERMINISTIC_ANSWER;
  const savedLlm = process.env.QA_OLLAMA_ANSWER;
  process.env.QA_DETERMINISTIC_ANSWER = 'false';
  process.env.QA_OLLAMA_ANSWER = 'true';
  assert.strictEqual(routing.answerPath({ hasPilotRule: true }), 'llm');      // det off → not deterministic
  process.env.QA_DETERMINISTIC_ANSWER = 'true';
  assert.strictEqual(routing.answerPath({ hasPilotRule: true }), 'deterministic');
  assert.strictEqual(routing.answerPath({ hasPilotRule: false }), 'llm');     // non-pilot never deterministic
  process.env.QA_DETERMINISTIC_ANSWER = savedDet ?? '';
  process.env.QA_OLLAMA_ANSWER = savedLlm ?? '';
});

// ── No LLM in the deterministic path + repeatability ─────────────────────────
test('deterministic answer makes NO network/LLM call and is repeatable', async () => {
  const req = { ...REQ };
  // stub the two DB-reading repo functions the orchestrator uses
  const repo = require('../src/services/deterministic-qa/catalogue-repository');
  const saved = {
    getActiveQuestionByCode: repo.getActiveQuestionByCode,
    getRequirementsRow: repo.getRequirementsRow,
    getSharedBlock: repo.getSharedBlock,
    resolveLegacyKey: repo.resolveLegacyKey,
  };
  repo.getActiveQuestionByCode = async (code) => ({ code, category_code: 'personality', short_title_en: 'Basic personality', short_title_hi: 'मूल व्यक्तित्व', disclaimer_type: 'general', min_data_policy: 'lenient', rule_version: 1, template_version: 1, active: true });
  repo.getRequirementsRow = async () => ({
    question_code: 'Q001', houses: JSON.stringify(req.houses), house_lords: JSON.stringify(req.house_lords),
    planets: JSON.stringify(req.planets), divisional_charts: JSON.stringify(req.divisional_charts),
    dasha_levels: JSON.stringify(req.dasha_levels), answer_sections: JSON.stringify(req.answer_sections),
    required_fields: JSON.stringify(req.required_fields), needs_current_transit: false, needs_dated_transit: false,
    needs_yoga: true, needs_remedy: false, shadbala_enhances: true, ashtakavarga_enhances: false,
    missing_data_behaviour: 'degrade',
  });
  repo.getSharedBlock = async (key, lang) => `[${key}:${lang}]`;

  // Any network attempt during the deterministic path must fail the test.
  const savedFetch = global.fetch;
  global.fetch = () => { throw new Error('LLM/network call attempted in deterministic path'); };

  try {
    const args = {
      questionCode: 'Q001', kundliUuid: OWN_UUID, userId: 42,
      deps: { db: fakeDb(ownerProfiles) },
    };
    const a = await qa.answerQuestion(args);
    const b = await qa.answerQuestion(args);
    assert.ok(a.ok, `answer failed: ${a.reason}`);
    assert.strictEqual(a.path, 'deterministic');
    // repeatable
    assert.deepStrictEqual(a.answer.sections, b.answer.sections);
    assert.strictEqual(a.answer.state, b.answer.state);
    // user answer contains NO raw scores
    const dump = JSON.stringify(a.answer);
    assert.ok(!/"score"/.test(dump), 'user answer must not expose raw scores');
    // trace (admin-only) DOES carry the numeric detail
    assert.ok(typeof a.trace.initial_score === 'number');
  } finally {
    global.fetch = savedFetch;
    Object.assign(repo, saved);
  }
});
