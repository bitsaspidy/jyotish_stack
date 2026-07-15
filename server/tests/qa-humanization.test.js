'use strict';
/**
 * Deterministic Q&A — humanization / answer-quality tests.
 *
 * Covers the 35 acceptance checks for the humanization upgrade: language quality,
 * evidence deduplication, domain specificity, Varga meaning, confidence reasons,
 * verdict alignment, the timing framework, safety, and regression of the 10 pilots.
 *
 * Pure-unit checks run everywhere. DB-backed checks skip gracefully when MySQL or
 * seed 037 is unavailable, matching the existing suite's contract.
 */

const test = require('node:test');
const assert = require('node:assert');
const { before, after } = require('node:test');

const db = require('../src/config/db');
const repo = require('../src/services/deterministic-qa/catalogue-repository');
const qa = require('../src/services/deterministic-qa');
const { houseLabel, houseLordLabel } = require('../src/services/deterministic-qa/house-label');
const { normalizeAnswerEvidence } = require('../src/services/deterministic-qa/evidence-normalizer');
const { resolveQuestionVerdict } = require('../src/services/deterministic-qa/verdict-resolver');
const { composeVargaMeaning } = require('../src/services/deterministic-qa/varga-meaning');
const { composeConfidenceReason } = require('../src/services/deterministic-qa/confidence-reason');
const { composeTimingOutlook } = require('../src/services/deterministic-qa/timing-outlook');
const { resolveDomain, DOMAINS, LIVE_DOMAINS } = require('../src/services/deterministic-qa/domains');
const domainData = require('../src/data/domain-answer-templates.data');

const PILOTS = ['Q001', 'Q012', 'Q021', 'Q031', 'Q041', 'Q051', 'Q061', 'Q071', 'Q081', 'Q093'];
const STATES6 = ['highly_favourable', 'favourable', 'moderately_favourable', 'mixed', 'challenging', 'highly_challenging'];

// A block lookup over the authored data (no DB needed) for content assertions.
const BLOCKS = new Map();
for (const b of domainData.buildDomainBlocks()) BLOCKS.set(`${b.block_key}|${b.lang}`, b.text);
const txt = (key, lang) => BLOCKS.get(`${key}|${lang}`);

let dbReady = false;
before(async () => {
  try {
    await db.raw('SELECT 1');
    dbReady = (await db.schema.hasTable('answer_shared_blocks'))
      && Number((await db('answer_shared_blocks').where('block_key', 'like', 'direct_answer.%').count('* as c').first()).c) > 0;
  } catch { dbReady = false; }
});
after(async () => { try { await db.destroy(); } catch { /* noop */ } });

function guard(t) {
  if (!dbReady) { t.skip('MySQL or seed 037 unavailable'); return false; }
  return true;
}

// ── Language quality (1–4) ───────────────────────────────────────────────────

test('LQ-01: no authored Hindi contains the broken ordinal "Nवें भाव"', () => {
  for (const [k, v] of BLOCKS) {
    if (!k.endsWith('|hi')) continue;
    assert.ok(!/\d+वें/.test(v), `${k} contains a numeric Hindi ordinal: ${v}`);
  }
  // and the helper itself never produces one, for every house
  for (let h = 1; h <= 12; h += 1) {
    assert.ok(!/\d/.test(houseLabel(h, 'hi')), `houseLabel(${h}) must not contain a digit`);
    assert.ok(!/\d/.test(houseLordLabel(h, 'hi')), `houseLordLabel(${h}) must not contain a digit`);
  }
  assert.strictEqual(houseLabel(1, 'hi'), 'प्रथम भाव');
  assert.strictEqual(houseLabel(11, 'hi'), 'एकादश भाव');
  assert.strictEqual(houseLabel(12, 'hi'), 'द्वादश भाव');
});

test('LQ-02/03: the retired robotic Hindi phrases appear in no authored block', () => {
  const forbidden = ['जल्दी हाँ या ना', 'वास्तविक ध्यान रखें', 'अपरिवर्तनीय', 'इस पर निर्माण करने', 'निश्चित निर्णय नहीं'];
  for (const [k, v] of BLOCKS) {
    if (!k.endsWith('|hi')) continue;
    for (const bad of forbidden) {
      assert.ok(!v.includes(bad), `${k} contains retired phrase "${bad}"`);
    }
  }
});

test('LQ-04: English blocks carry no Devanagari and Hindi blocks are Devanagari-led', () => {
  const devanagari = /[ऀ-ॿ]/;
  for (const [k, v] of BLOCKS) {
    // Strip placeholders before judging script: a fragment like `{{house}}` is a
    // slot filled at runtime by an already-localized label, so it legitimately
    // carries no Devanagari of its own.
    const bare = v.replace(/\{\{\w+\}\}/g, '').trim();
    if (!bare) continue;

    if (k.endsWith('|en')) {
      assert.ok(!devanagari.test(bare), `English block ${k} contains Devanagari: ${v}`);
    } else {
      // Hindi may carry established loanwords (loan, EMI, D2, booking) but must be
      // substantially Devanagari — a Hindi block that is mostly Latin is a missed
      // translation, not a register choice.
      const latin = (bare.match(/[A-Za-z]/g) || []).length;
      const deva = (bare.match(/[ऀ-ॿ]/g) || []).length;
      assert.ok(deva > latin, `Hindi block ${k} is not predominantly Devanagari: ${v}`);
    }
  }
});

// ── Evidence dedup (5–7) ─────────────────────────────────────────────────────

const MARS_LORD = { key: 'lord11:Mars', planet: 'Mars', role: { kind: 'house_lord', house: 11 }, score: 60 };
const MARS_KARAKA = { key: 'planet:Mars', planet: 'Mars', role: { kind: 'karaka' }, score: 60 };

test('EV-05: duplicate planet evidence is merged into one factor', () => {
  const n = normalizeAnswerEvidence([MARS_LORD, MARS_KARAKA]);
  assert.strictEqual(n.factors.length, 1, 'Mars must appear once');
  assert.strictEqual(n.dropped_duplicates, 1);
  assert.strictEqual(n.factors[0].entity_id, 'planet:Mars');
});

test('EV-06: merging preserves both distinct roles and marks the factor multi-role', () => {
  const n = normalizeAnswerEvidence([MARS_LORD, MARS_KARAKA]);
  const f = n.factors[0];
  assert.strictEqual(f.multi_role, true);
  assert.deepStrictEqual(f.roles.map((r) => r.kind).sort(), ['house_lord', 'karaka']);
  assert.strictEqual(f.tier, 1, 'house_lord outranks karaka, so the merged tier is primary');
  assert.strictEqual(f.score, 60, 'the same planet must not be double-counted');
});

test('EV-07: normalization is idempotent — re-normalizing keeps roles and tier', () => {
  // The pipeline normalizes per group AND across groups; a second pass over merged
  // factors must not degrade them to `secondary`, which would silently strip all
  // primary evidence from the verdict resolver.
  const once = normalizeAnswerEvidence([MARS_LORD, MARS_KARAKA]);
  const twice = normalizeAnswerEvidence(once.factors);
  assert.strictEqual(twice.factors.length, 1);
  assert.strictEqual(twice.factors[0].tier, 1);
  assert.strictEqual(twice.factors[0].multi_role, true);
  assert.deepStrictEqual(twice.factors[0].roles.map((r) => r.kind).sort(), ['house_lord', 'karaka']);
});

test('EV-07b: user-facing evidence is capped at 3 supports and 2 blockers', () => {
  const many = [];
  for (let i = 0; i < 6; i += 1) many.push({ key: `p${i}`, planet: `P${i}`, role: { kind: 'karaka' }, score: 50 - i });
  for (let i = 0; i < 4; i += 1) many.push({ key: `n${i}`, planet: `N${i}`, role: { kind: 'karaka' }, score: -50 + i });
  const n = normalizeAnswerEvidence(many);
  assert.strictEqual(n.supports.length, 3);
  assert.strictEqual(n.blockers.length, 2);
});

// ── Domain specificity (8–11) ────────────────────────────────────────────────

test('DS-08: the same state produces a different sentence in every live domain', () => {
  for (const state of STATES6) {
    const seen = new Map();
    for (const domain of LIVE_DOMAINS) {
      for (const lang of ['en', 'hi']) {
        const t = txt(`direct_answer.${domain}.${state}`, lang);
        assert.ok(t, `missing direct_answer.${domain}.${state}.${lang}`);
        const prior = seen.get(`${t}|${lang}`);
        assert.ok(!prior, `direct_answer ${state} ${lang}: ${domain} reuses ${prior}'s sentence`);
        seen.set(`${t}|${lang}`, domain);
      }
    }
  }
  // the specific pairing the brief calls out
  assert.notStrictEqual(txt('direct_answer.finance.mixed', 'en'), txt('direct_answer.health.mixed', 'en'));
  assert.notStrictEqual(txt('direct_answer.finance.mixed', 'hi'), txt('direct_answer.health.mixed', 'hi'));
});

test('DS-09: property caution carries legal / document / loan context', () => {
  const en = txt('caution.property', 'en').toLowerCase();
  assert.ok(/title/.test(en) && /loan/.test(en) && /(document|construction)/.test(en), en);
  const hi = txt('caution.property', 'hi');
  assert.ok(/मालिकाना हक़|क़ानूनी/.test(hi) && /loan/.test(hi), hi);
});

test('DS-10: health caution carries doctor / symptom / routine context', () => {
  const en = txt('caution.health', 'en').toLowerCase();
  assert.ok(/doctor/.test(en) && /symptom/.test(en) && /(sleep|self-medication)/.test(en), en);
  const hi = txt('caution.health', 'hi');
  assert.ok(/डॉक्टर/.test(hi) && /लक्षण/.test(hi) && /नींद/.test(hi), hi);
});

test('DS-11: business action carries demand / capital / risk context', () => {
  const en = txt('action.business', 'en').toLowerCase();
  assert.ok(/demand/.test(en) && /capital/.test(en) && /(stop-loss|risk)/.test(en), en);
  const hi = txt('action.business', 'hi');
  assert.ok(/माँग/.test(hi) && /पूँजी/.test(hi) && /हानि/.test(hi), hi);
});

test('DS-11b: every live domain has a distinct caution and a distinct action', () => {
  for (const bucket of ['caution', 'action']) {
    const seen = new Map();
    for (const domain of LIVE_DOMAINS) {
      const t = txt(`${bucket}.${domain}`, 'en');
      assert.ok(t, `missing ${bucket}.${domain}`);
      assert.ok(!seen.has(t), `${bucket}.${domain} duplicates ${bucket}.${seen.get(t)}`);
      seen.set(t, domain);
    }
  }
});

// ── Varga (12–15) ────────────────────────────────────────────────────────────

const resolverFor = (map) => (keys, lang) => {
  for (const k of keys) if (map[`${k}|${lang}`]) return map[`${k}|${lang}`];
  return null;
};
const blockResolver = (keys, lang, vars = {}) => {
  for (const k of keys) {
    const t = txt(k, lang);
    if (t) return t.replace(/\{\{(\w+)\}\}/g, (_, n) => (vars[n] != null ? String(vars[n]) : ''));
  }
  return null;
};

test('VG-12: D2 explanation speaks about earning / resources', () => {
  const en = txt('varga.d2.finance.supports', 'en').toLowerCase();
  assert.ok(/earning/.test(en) && /(resource|saving)/.test(en), en);
});

test('VG-13: D10 explanation speaks about profession / business', () => {
  assert.ok(/professional/i.test(txt('varga.d10.career.supports', 'en')));
  assert.ok(/business|independen/i.test(txt('varga.d10.business.supports', 'en')));
});

test('VG-14: D30 explanation speaks about vulnerability / preventive care', () => {
  const en = txt('varga.d30.health.challenges', 'en').toLowerCase();
  assert.ok(/vulnerabilit/.test(en) && /(preventive|recovery)/.test(en), en);
});

test('VG-15: no Varga block is a bare "confirms this analysis" restatement', () => {
  for (const [k, v] of BLOCKS) {
    if (!k.startsWith('varga.')) continue;
    assert.ok(!/^(the )?d\d+ (is |confirms|reinforces)/i.test(v.trim()) || v.length > 60,
      `${k} restates rather than explains: ${v}`);
    assert.ok(!/confirms this analysis/i.test(v), `${k} is a restatement`);
    assert.ok(!/इस विश्लेषण को पुष्ट करता है/.test(v), `${k} is a restatement`);
  }
});

test('VG-15b: composeVargaMeaning picks the strongest relevant chart and skips D1', () => {
  const factors = [
    { chart: 'd1', score: 80, entity_id: 'chart:d1' },
    { chart: 'd2', score: 55, entity_id: 'chart:d2' },
  ];
  const out = composeVargaMeaning({ state: 'favourable', domain: 'finance', factors, lang: 'en', resolve: blockResolver });
  assert.ok(out, 'a divisional perspective should be produced');
  assert.deepStrictEqual(out.charts, ['d2'], 'D1 is the birth chart and must not be echoed here');
  assert.ok(/earning/i.test(out.text));
});

test('VG-15c: an unseeded (chart, domain) pair yields nothing rather than filler', () => {
  const out = composeVargaMeaning({
    state: 'mixed', domain: 'siblings',
    factors: [{ chart: 'd27', score: 40, entity_id: 'chart:d27' }],
    lang: 'en', resolve: blockResolver,
  });
  assert.strictEqual(out, null);
});

// ── Confidence (16–18) ───────────────────────────────────────────────────────

test('CF-16: high confidence explains the agreement, naming the evidence', () => {
  const out = composeConfidenceReason({
    level: 'high',
    verdict: { alignment: 'primary_agreement' },
    factors: [{ chart: 'd2', score: 50, roles: [{ kind: 'varga', chart: 'd2' }] },
      { planet: 'Jupiter', score: 60, roles: [{ kind: 'house_lord', house: 2 }] }],
    resolve: blockResolver,
  }, 'en');
  assert.ok(out, 'a reason must be produced');
  assert.strictEqual(out.kind, 'agreement');
  assert.ok(/same direction/i.test(out.text), out.text);
  assert.ok(/D2/.test(out.text), 'the reason should name the chart the reader can check');
});

test('CF-17: medium confidence explains the conflict', () => {
  const out = composeConfidenceReason({
    level: 'medium',
    verdict: { alignment: 'varga_contradiction' },
    factors: [{ chart: 'd30', score: -50, roles: [{ kind: 'varga', chart: 'd30' }] }],
    resolve: blockResolver,
  }, 'hi');
  assert.strictEqual(out.kind, 'conflict');
  assert.ok(/सावधानी|विरोध|सहमत नहीं/.test(out.text), out.text);
});

test('CF-17b: low confidence distinguishes thin data from contradiction', () => {
  const thin = composeConfidenceReason({
    level: 'low', verdict: { alignment: 'balanced' }, factors: [], groupsPresent: 1, resolve: blockResolver,
  }, 'en');
  assert.strictEqual(thin.kind, 'thin');
  assert.ok(/birth time/i.test(thin.text), thin.text);

  const clash = composeConfidenceReason({
    level: 'low', verdict: { alignment: 'varga_contradiction' }, factors: [], groupsPresent: 3, completeness: 90, resolve: blockResolver,
  }, 'en');
  assert.strictEqual(clash.kind, 'contradiction');
});

test('CF-18: confidence reasons never leak scores, weights or rule keys', () => {
  // The concern is exposing INTERNALS, not the English word "weight" — "the
  // indicators carry similar weight" is ordinary prose and exactly the kind of
  // plain explanation this feature is for. What must never appear is a number a
  // reader cannot interpret, or an identifier from the engine.
  for (const [k, v] of BLOCKS) {
    if (!k.startsWith('confidence.')) continue;
    assert.ok(!/\d/.test(v), `${k} exposes a raw number: ${v}`);
    assert.ok(!/rule_key|template|entity_id|\btier\b|_score|\bscore of\b|\bweighting\b/i.test(v),
      `${k} exposes engine internals: ${v}`);
  }
});

// ── Verdict alignment (19–21) ────────────────────────────────────────────────

const decisionOf = (state, extra = {}) => ({ state, score: 30, confidence: 'medium', notes: [], conflicts: [], ...extra });

test('VD-19: several strong primary supports are not overridden by one weak secondary', () => {
  const factors = normalizeAnswerEvidence([
    { key: 'lord11:Mars', planet: 'Mars', role: { kind: 'house_lord', house: 11 }, score: 70 },
    { key: 'lord2:Jupiter', planet: 'Jupiter', role: { kind: 'house_lord', house: 2 }, score: 60 },
    { key: 'chart:d2', chart: 'd2', role: { kind: 'varga', chart: 'd2' }, score: 55 },
    { key: 'planet:Ketu', planet: 'Ketu', role: { kind: 'secondary' }, score: -20 },  // lone weak secondary
  ]).factors;

  const v = resolveQuestionVerdict({
    decision: decisionOf('mixed', { notes: ['conflicting_evidence_forced_mixed'], score: 50 }),
    factors, groups: {}, domain: 'finance',
  });
  assert.notStrictEqual(v.state, 'mixed', 'primary evidence agrees; a weak secondary must not force mixed');
  assert.strictEqual(v.alignment, 'secondary_only_conflict');
  assert.ok(v.notes.includes('primary_evidence_restored_verdict'));
});

test('VD-20: a challenging Varga meaningfully reduces overly positive output', () => {
  const factors = normalizeAnswerEvidence([
    { key: 'lord1:Moon', planet: 'Moon', role: { kind: 'house_lord', house: 1 }, score: 40 },
    { key: 'chart:d30', chart: 'd30', role: { kind: 'varga', chart: 'd30' }, score: -60 },
  ]).factors;
  const v = resolveQuestionVerdict({ decision: decisionOf('highly_favourable'), factors, groups: {}, domain: 'health' });
  assert.strictEqual(v.state, 'moderately_favourable', 'an adverse D30 must cap health optimism');
  assert.strictEqual(v.alignment, 'varga_contradiction');
  assert.ok(v.notes.includes('varga_contradiction_capped_upside'));
});

test('VD-20b: a strong primary blocker caps a favourable verdict ("supportive with conditions")', () => {
  const factors = normalizeAnswerEvidence([
    { key: 'chart:d10', chart: 'd10', role: { kind: 'varga', chart: 'd10' }, score: 60 },
    { key: 'lord10:Saturn', planet: 'Saturn', role: { kind: 'house_lord', house: 10 }, score: -55 },
  ]).factors;
  const v = resolveQuestionVerdict({ decision: decisionOf('favourable'), factors, groups: {}, domain: 'career' });
  assert.strictEqual(v.state, 'moderately_favourable');
  assert.strictEqual(v.alignment, 'primary_blocker');
  assert.strictEqual(v.primary_reason.planet, 'Saturn');
});

test('VD-21: the verdict always carries the reason it stands, for the narrative to agree with', () => {
  const factors = normalizeAnswerEvidence([
    { key: 'lord4:Venus', planet: 'Venus', role: { kind: 'house_lord', house: 4 }, score: 50 },
  ]).factors;
  const v = resolveQuestionVerdict({ decision: decisionOf('favourable'), factors, groups: {}, domain: 'property' });
  assert.strictEqual(v.alignment, 'primary_agreement');
  assert.ok(v.primary_reason && v.primary_reason.planet === 'Venus');
});

test('VD-21b: promise with inactive timing is flagged rather than forced into a new state', () => {
  const factors = normalizeAnswerEvidence([
    { key: 'lord4:Venus', planet: 'Venus', role: { kind: 'house_lord', house: 4 }, score: 55 },
  ]).factors;
  const v = resolveQuestionVerdict({
    decision: decisionOf('favourable'), factors, domain: 'property',
    groups: { natal: { present: true, score: 55 }, timing: { present: true, score: -40 } },
  });
  assert.strictEqual(v.timing_gap, true);
  assert.ok(v.notes.includes('promise_present_timing_inactive'));
  assert.ok(STATES6.includes(v.state), 'no invented state — the seven remain the seven');
});

// ── Timing framework (22–24) ─────────────────────────────────────────────────

const transitFixture = (transits, overall) => ({
  available: true, as_of: '2026-07-15', transits,
  summary: { overall, supportive_count: 0, caution_count: 0, relevant_count: transits.length },
});

test('TM-22: a timing answer gives a current phase and an outlook, not a transit list', () => {
  const out = composeTimingOutlook({
    transit: transitFixture([
      { planet: 'Saturn', transit_sign_en: 'Pisces', transit_sign_hi: 'मीन', transit_end: '2027-06-02', classification: 'caution', relevant_to_question: true },
    ], 'caution'),
    dasha: { maha: { lord: 'Mercury' } }, domain: 'property', lang: 'en', resolve: blockResolver,
  });
  assert.ok(out, 'an outlook must be produced');
  const phases = out.sections.map((s) => s.phase);
  assert.ok(phases.some((p) => p.startsWith('current')), 'current phase present');
  assert.ok(phases.includes('preparation'), 'preparation/caution window present');
  assert.ok(phases.includes('trigger'), 'trigger conditions present');
  assert.ok(phases.includes('no_guarantee'), 'no-guarantee disclaimer present');
});

test('TM-23: exact dates appear only when the transit engine resolved a boundary', () => {
  const dated = composeTimingOutlook({
    transit: transitFixture([
      { planet: 'Jupiter', transit_sign_en: 'Taurus', transit_sign_hi: 'वृषभ', transit_end: '2026-05-14', classification: 'supportive', relevant_to_question: true },
    ], 'supportive'),
    dasha: {}, domain: 'property', lang: 'en', resolve: blockResolver,
  });
  assert.deepStrictEqual(dated.dates_used, ['2026-05-14']);
  assert.ok(dated.text.includes('2026-05-14'));

  // an unresolved boundary must never be printed as a date
  const open = composeTimingOutlook({
    transit: transitFixture([
      { planet: 'Jupiter', transit_sign_en: 'Taurus', transit_sign_hi: 'वृषभ', transit_end: '2026-05-14', window_open_end: true, classification: 'supportive', relevant_to_question: true },
    ], 'supportive'),
    dasha: {}, domain: 'property', lang: 'en', resolve: blockResolver,
  });
  assert.deepStrictEqual(open.dates_used, []);
  assert.ok(!/\d{4}-\d{2}-\d{2}/.test(open.text), `unresolved window must not print a date: ${open.text}`);
});

test('TM-24: no supportive window returns preparation guidance rather than silence', () => {
  const out = composeTimingOutlook({
    transit: transitFixture([
      { planet: 'Saturn', transit_sign_en: 'Pisces', transit_sign_hi: 'मीन', transit_end: null, classification: 'mixed', relevant_to_question: true },
    ], 'mixed'),
    dasha: {}, domain: 'property', lang: 'en', resolve: blockResolver,
  });
  assert.ok(out);
  assert.strictEqual(out.has_window, false);
  assert.ok(/preparation|verify/i.test(out.text), out.text);
});

test('TM-24b: the caution window named is the one that binds longest', () => {
  const out = composeTimingOutlook({
    transit: transitFixture([
      { planet: 'Rahu', transit_sign_en: 'Aquarius', transit_sign_hi: 'कुंभ', transit_end: '2026-12-05', classification: 'caution', relevant_to_question: true },
      { planet: 'Saturn', transit_sign_en: 'Pisces', transit_sign_hi: 'मीन', transit_end: '2027-06-02', classification: 'caution', relevant_to_question: true },
    ], 'caution'),
    dasha: {}, domain: 'property', lang: 'en', resolve: blockResolver,
  });
  // Naming the earlier date would promise relief while the later pressure still runs.
  assert.ok(out.text.includes('2027-06-02'), out.text);
  assert.ok(!out.text.includes('2026-12-05'), 'must not name a date earlier than the pressure it describes');
});

// ── Safety (25–28) ───────────────────────────────────────────────────────────

test('SF-25: no authored block promises a guaranteed outcome', () => {
  // Only ASSERTED guarantees are unsafe. "not a guaranteed event date" and
  // "किसी निश्चित घटना-तिथि की गारंटी नहीं" are the disclaimers themselves —
  // matching the bare word would flag the safety language for being about safety.
  for (const [k, v] of BLOCKS) {
    assert.ok(!/\b(is|are|will be)\s+guaranteed\b/i.test(v), `${k} asserts a guarantee: ${v}`);
    assert.ok(!/\b(we|this)\s+guarantees?\b/i.test(v), `${k} asserts a guarantee: ${v}`);
    assert.ok(!/\b(will definitely|certain to (happen|occur)|assured of)\b/i.test(v), `${k} promises an outcome: ${v}`);
    assert.ok(!/निश्चित रूप से होगा|की गारंटी है/.test(v), `${k} promises an outcome: ${v}`);
  }
});

test('SF-26: health language never diagnoses and always defers to a doctor', () => {
  for (const [k, v] of BLOCKS) {
    if (!/health|d30/.test(k)) continue;
    assert.ok(!/\b(you have|diagnos|disease|cure)\b/i.test(v), `${k} reads as diagnosis: ${v}`);
  }
  assert.ok(/doctor/i.test(txt('caution.health', 'en')));
  assert.ok(/medical/i.test(txt('action.health', 'en')));
});

test('SF-27: finance language never gives investment advice and defers to a professional', () => {
  for (const [k, v] of BLOCKS) {
    if (!k.startsWith('direct_answer.finance') && !k.startsWith('caution.finance')) continue;
    assert.ok(!/\b(invest in|buy shares|guaranteed return|you should invest)\b/i.test(v), `${k} reads as advice: ${v}`);
  }
  assert.ok(/regulated professional/i.test(txt('action.finance', 'en')));
});

test('SF-28: children and marriage language is non-fatalistic', () => {
  // Fatalism is a claim about the READER's future ("you will never have
  // children"), not the word "never". "tendencies, never certainty" is the
  // opposite of fatalism — it is the hedge that makes the section safe.
  const fatal = [
    /\bnever (have|get|be able|happen|marry)\b/i,
    /\b(is|are) impossible\b/i,
    /\bcannot have\b/i,
    /\bno chance\b/i,
    /\bdoomed\b/i,
    /\bwill not (have|marry)\b/i,
    /कभी नहीं होगा/,
    /संभव नहीं है/,
  ];
  for (const [k, v] of BLOCKS) {
    if (!/^(direct_answer|caution|action)\.(children|marriage)/.test(k)) continue;
    for (const re of fatal) assert.ok(!re.test(v), `${k} is fatalistic: ${v}`);
  }
  // the hardest state must still defer rather than pronounce
  assert.ok(/medical/i.test(txt('direct_answer.children.highly_challenging', 'en')));
  assert.ok(/counselling|qualified/i.test(txt('direct_answer.marriage.highly_challenging', 'en')));
});

// ── Domain resolution ────────────────────────────────────────────────────────

test('DR: domains resolve from the stored column, then category/subcategory', () => {
  assert.strictEqual(resolveDomain({ domain: 'finance', category_code: 'money' }), 'finance');
  assert.strictEqual(resolveDomain({ category_code: 'money', subcategory: 'wealth' }), 'finance');
  assert.strictEqual(resolveDomain({ category_code: 'money', subcategory: 'debt' }), 'debt');
  assert.strictEqual(resolveDomain({ category_code: 'family', subcategory: 'children' }), 'children');
  assert.strictEqual(resolveDomain({ category_code: 'family', subcategory: 'siblings' }), 'siblings');
  assert.strictEqual(resolveDomain({ category_code: 'property', subcategory: 'vehicle' }), 'vehicle');
  assert.strictEqual(resolveDomain({ category_code: 'property', subcategory: 'settlement' }), 'foreign');
  assert.strictEqual(resolveDomain({}), 'general', 'general is the floor — a question is always answerable');
  for (const d of LIVE_DOMAINS) assert.ok(DOMAINS.includes(d));
});

// ── Regression: the 10 pilots, end to end (29–35) ────────────────────────────

const OWNED = { uuid: '27ded65b-5cef-4740-b7ac-2270bb56525a', userId: 6 };

async function answerOrSkip(t, code) {
  const r = await qa.answerQuestion({ questionCode: code, kundliUuid: OWNED.uuid, userId: OWNED.userId });
  if (!r.ok) { t.skip(`fixture kundli unavailable (${r.reason})`); return null; }
  return r;
}

test('RG-29/30: all 10 pilot questions render in both languages', async (t) => {
  if (!guard(t)) return;
  for (const code of PILOTS) {
    const r = await answerOrSkip(t, code);
    if (!r) return;
    assert.ok(r.answer.sections.length > 0, `${code} produced no sections`);
    for (const s of r.answer.sections) {
      assert.ok(s.text_en && s.text_en.trim(), `${code}/${s.key} missing English`);
      assert.ok(s.text_hi && s.text_hi.trim(), `${code}/${s.key} missing Hindi`);
      assert.ok(!s.text_en.includes('{{') && !s.text_hi.includes('{{'), `${code}/${s.key} has an unfilled placeholder`);
    }
    assert.ok(r.answer.confidence.reason_en, `${code} confidence must explain itself`);
    assert.ok(r.answer.confidence.reason_hi, `${code} confidence must explain itself in Hindi`);
  }
});

test('RG-29b: rendered pilot answers contain no broken ordinal and no duplicated planet', async (t) => {
  if (!guard(t)) return;
  for (const code of PILOTS) {
    const r = await answerOrSkip(t, code);
    if (!r) return;
    const hi = r.answer.sections.map((s) => s.text_hi).join(' ');
    const en = r.answer.sections.map((s) => s.text_en).join(' ');
    assert.ok(!/\d+वें/.test(hi), `${code} Hindi contains a numeric ordinal`);
    for (const p of ['Mars', 'Venus', 'Moon', 'Saturn', 'Jupiter', 'Mercury', 'Sun']) {
      assert.ok(!new RegExp(`\\b${p} and ${p}\\b`).test(en), `${code} repeats "${p} and ${p}"`);
    }
    for (const p of ['मंगल', 'शुक्र', 'चंद्र', 'शनि', 'गुरु', 'बुध', 'सूर्य']) {
      assert.ok(!new RegExp(`${p} और ${p}`).test(hi), `${code} repeats "${p} और ${p}"`);
    }
  }
});

test('RG-31: Q031 keeps the financial disclaimer', async (t) => {
  if (!guard(t)) return;
  const r = await answerOrSkip(t, 'Q031');
  if (!r) return;
  const note = r.answer.sections.find((s) => s.key === 'important_note');
  assert.ok(/financial advice/i.test(note.text_en), note.text_en);
});

test('RG-32: Q071 keeps the medical disclaimer', async (t) => {
  if (!guard(t)) return;
  const r = await answerOrSkip(t, 'Q071');
  if (!r) return;
  const note = r.answer.sections.find((s) => s.key === 'important_note');
  assert.ok(/medical professional/i.test(note.text_en), note.text_en);
});

test('RG-32b: Q081 gets the legal disclaimer, matching its property domain', async (t) => {
  if (!guard(t)) return;
  const r = await answerOrSkip(t, 'Q081');
  if (!r) return;
  const note = r.answer.sections.find((s) => s.key === 'important_note');
  assert.ok(/legal advice/i.test(note.text_en), `property answers need the legal warning, not the financial one: ${note.text_en}`);
});

test('RG-33: Q041 still produces a timing outlook with a real structure', async (t) => {
  if (!guard(t)) return;
  const r = await answerOrSkip(t, 'Q041');
  if (!r) return;
  const timing = r.answer.sections.find((s) => s.key === 'timing_outlook');
  assert.ok(timing, 'Q041 must carry a timing outlook');
  assert.ok(/not a guaranteed event date/i.test(timing.text_en), timing.text_en);
  assert.ok(timing.text_en.length > 120, 'a real outlook, not one line');
});

test('RG-34: the user payload carries no trace, scores, rule keys or template keys', async (t) => {
  if (!guard(t)) return;
  for (const code of PILOTS) {
    const r = await answerOrSkip(t, code);
    if (!r) return;
    const dump = JSON.stringify(r.answer);
    assert.ok(!/"score"/.test(dump), `${code} leaks a score`);
    assert.ok(!/rule_key|templates_used|template_key|matched_rule|"tier"|"weight"/.test(dump), `${code} leaks internals`);
    assert.ok(!/entity_id|alignment|primary_reason|evidence_normalization/.test(dump), `${code} leaks evidence internals`);
    assert.ok(r.answer.meta === undefined, `${code} must not carry composer meta`);
  }
});

test('RG-34b: admin trace DOES carry the evidence view the user must not see', async (t) => {
  if (!guard(t)) return;
  const r = await answerOrSkip(t, 'Q031');
  if (!r) return;
  assert.strictEqual(r.trace.domain, 'finance');
  assert.ok(r.trace.verdict && r.trace.verdict.alignment, 'admin sees the alignment');
  assert.ok(Array.isArray(r.trace.primary_supports), 'admin sees primary supports');
  assert.ok(Array.isArray(r.trace.primary_blockers), 'admin sees primary blockers');
  assert.ok(r.trace.evidence_normalization, 'admin sees the dedup result');
  assert.ok(r.trace.confidence_reason_kind, 'admin sees why confidence landed where it did');
  assert.ok(Array.isArray(r.trace.templates_used) && r.trace.templates_used.length > 0, 'admin sees selected template keys');
});

test('RG-35: no LLM/network call happens on the humanized path', async (t) => {
  if (!guard(t)) return;
  const savedFetch = global.fetch;
  global.fetch = () => { throw new Error('network call attempted in deterministic path'); };
  try {
    const r = await answerOrSkip(t, 'Q081');
    if (!r) return;
    assert.strictEqual(r.path, 'deterministic');
  } finally {
    global.fetch = savedFetch;
  }
});
