'use strict';
/**
 * Tests for kundli-user-summary.service.js
 * Focus: structural correctness, leakage prevention, language purity
 */
const test   = require('node:test');
const assert = require('node:assert/strict');
const { composeKundliUserSummary } = require('../src/services/kundli-user-summary.service');

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_CHART = {
  ascendant: { rashi_num: 6, rashi_en: 'Virgo', rashi_hi: 'कन्या' },
  nakshatra: { en: 'Hasta', hi: 'हस्त', num: 13 },
  planets: {
    Sun:     { rashi_num: 4, rashi_en: 'Cancer',      rashi_hi: 'कर्क',    dignity: 'Neutral',     house_num: 11 },
    Moon:    { rashi_num: 10, rashi_en: 'Capricorn',  rashi_hi: 'मकर',     dignity: 'Debilitation',house_num: 5, nakshatra_en: 'Shravana', nakshatra_hi: 'श्रवण' },
    Mars:    { rashi_num: 7,  dignity: 'Neutral',     house_num: 2 },
    Mercury: { rashi_num: 6,  dignity: 'Exaltation',  house_num: 1 },
    Jupiter: { rashi_num: 9,  dignity: 'Own Sign',    house_num: 4 },
    Venus:   { rashi_num: 5,  dignity: 'Neutral',     house_num: 12 },
    Saturn:  { rashi_num: 3,  dignity: 'Neutral',     house_num: 10 },
    Rahu:    { rashi_num: 12, house_num: 7 },
    Ketu:    { rashi_num: 6,  house_num: 1 },
  },
  dasha: [
    { lord: 'Saturn', is_current: true, start: '2022-01-01', end: '2041-01-01',
      antardasha: [{ lord: 'Mercury', is_current: true, start: '2024-01-01', end: '2026-06-01' }] },
    { lord: 'Mercury', is_current: false, start: '2041-01-01', end: '2058-01-01' },
  ],
  houses: {},
  mangal_dosha: { has_dosha: false },
};

const MOCK_JUDGEMENT = {
  version: 'judgement-priority-v2',
  overallScore: 62,
  overallStatus: 'balanced',
  overallLabel: { en: 'Balanced Chart with Good Potential', hi: 'अच्छी संभावना वाली संतुलित कुंडली' },
  areas: [
    {
      areaKey: 'lagna', titleEn: 'Chart Foundation & Personality', titleHi: 'कुंडली आधार और व्यक्तित्व',
      score: 65, status: 'balanced',
      userSummaryEn: 'The ascendant and lagna lord show steady support.',
      userSummaryHi: 'लग्न और लग्नेश स्थिर समर्थन दिखाते हैं।',
      goodPoints: ['Lagna lord well-placed.'], goodPointsHi: ['लग्नेश अच्छी स्थिति में।'],
      challenges: [], challengesHi: [], advice: ['Focus on regular routines.'], adviceHi: ['नियमित दिनचर्या पर ध्यान दें।'],
    },
    {
      areaKey: 'mind', titleEn: 'Mind, Emotions & Mental Stability', titleHi: 'मन, भावनाएं और मानसिक स्थिरता',
      score: 42, status: 'needs-care',
      userSummaryEn: 'Emotional balance needs conscious attention.',
      userSummaryHi: 'भावनात्मक संतुलन के लिए सचेत ध्यान जरूरी है।',
      goodPoints: [], goodPointsHi: [], challenges: ['Extra effort for stability.'], challengesHi: ['स्थिरता के लिए विशेष प्रयास।'],
      advice: ['Moon remedies help.'], adviceHi: ['चंद्र उपाय सहायक है।'],
    },
    {
      areaKey: 'gains', titleEn: 'Income, Gains & Desire Fulfillment', titleHi: 'आय, लाभ और इच्छापूर्ति',
      score: 71, status: 'strong',
      userSummaryEn: 'Income and gains show strong support from the 11th house.',
      userSummaryHi: '11वें भाव से आय और लाभ में मजबूत समर्थन।',
      goodPoints: ['Strong 11th lord.'], goodPointsHi: ['मजबूत 11वें स्वामी।'],
      challenges: [], challengesHi: [], advice: [], adviceHi: [],
    },
    {
      areaKey: 'marriage', titleEn: 'Marriage, Relationships & Partnership', titleHi: 'विवाह, रिश्ते और साझेदारी',
      score: 55, status: 'balanced',
      userSummaryEn: 'Relationships have good potential with conscious effort.',
      userSummaryHi: 'सचेत प्रयास से रिश्तों में अच्छी संभावना है।',
      goodPoints: [], goodPointsHi: [], challenges: [], challengesHi: [],
      advice: ['Right timing and communication are key.'], adviceHi: ['सही समय और संवाद महत्वपूर्ण हैं।'],
    },
    {
      areaKey: 'children', titleEn: 'Children, Education & Creativity', titleHi: 'संतान, शिक्षा और रचनात्मकता',
      score: 58, status: 'balanced',
      userSummaryEn: 'Education and creativity are well-supported.',
      userSummaryHi: 'शिक्षा और रचनात्मकता को अच्छा समर्थन।',
      goodPoints: [], goodPointsHi: [], challenges: [], challengesHi: [], advice: [], adviceHi: [],
    },
    {
      areaKey: 'maturity', titleEn: 'Maturity, Post-Marriage Growth & Dharma', titleHi: 'परिपक्वता, विवाह के बाद विकास और धर्म',
      score: 60, status: 'balanced',
      userSummaryEn: 'Spiritual growth and dharma show balanced support.',
      userSummaryHi: 'आध्यात्मिक विकास और धर्म में संतुलित समर्थन।',
      goodPoints: [], goodPointsHi: [], challenges: [], challengesHi: [], advice: [], adviceHi: [],
    },
  ],
  lagnaStrength:  { score: 65, status: 'balanced', label: 'Balanced' },
  pillarStrength: { sunScore: 60, moonScore: 42, status: 'needs-care' },
  yogaReducers:   [],
  rahuPlacement:  { house: 7, potential: 'challenging', score: 38 },
  ashtakavargaGuard: { Moon: { majorDosha: true, totalScore: 22 } },
};

const HOUSE_CODE_RE  = /\bH\d{1,2}\b/;
const SCORE_LABEL_RE = /[Ss]core[:\s]+\d+|[Ss]trength[:\s]+\d+|\b\d{2,3}\/100\b/;
const FORBIDDEN_RE   = [
  /spouse\s+death/i, /divorce\s+guaranteed/i, /no\s+child(ren)?/i,
  /miscarriage\s+will/i, /disease\s+confirm/i, /you\s+are\s+cursed/i,
  /definitely\s+become\s+rich/i, /dosha\s+confirm/i,
  /मृत्यु\s+होगी/i, /बाँझपन\s+है/i, /श्राप/i,
];
const DEVANAGARI_RE  = /[ऀ-ॿ]/;
const VALID_STATUSES = new Set(['strong','balanced','needs-care','challenging',null,undefined]);
const EXPECTED_KEYS  = ['career','money','family','home','marriage','children','health','disputes','luck','foreign'];

// ─── CAT-U1: Structure ────────────────────────────────────────────────────────
test('CAT-U1a: returns summaryCards with exactly 7 cards', () => {
  const result = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  assert.equal(result.summaryCards.length, 7, `expected 7, got ${result.summaryCards.length}`);
});

test('CAT-U1b: returns lifeAreaCards with exactly 10 cards', () => {
  const result = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  assert.equal(result.lifeAreaCards.length, 10, `expected 10, got ${result.lifeAreaCards.length}`);
});

test('CAT-U1c: each summary card has required bilingual text fields', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const card of summaryCards) {
    assert.ok(card.cardKey, `card missing cardKey`);
    assert.equal(typeof card.titleEn, 'string', `${card.cardKey}: titleEn not string`);
    assert.equal(typeof card.titleHi, 'string', `${card.cardKey}: titleHi not string`);
    assert.equal(typeof card.descEn,  'string', `${card.cardKey}: descEn not string`);
    assert.equal(typeof card.descHi,  'string', `${card.cardKey}: descHi not string`);
  }
});

test('CAT-U1d: each life area card has required bilingual text fields', () => {
  const { lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const area of lifeAreaCards) {
    assert.ok(area.areaKey, `area missing areaKey`);
    assert.equal(typeof area.titleEn,   'string', `${area.areaKey}: titleEn not string`);
    assert.equal(typeof area.titleHi,   'string', `${area.areaKey}: titleHi not string`);
    assert.equal(typeof area.summaryEn, 'string', `${area.areaKey}: summaryEn not string`);
    assert.equal(typeof area.summaryHi, 'string', `${area.areaKey}: summaryHi not string`);
  }
});

test('CAT-U1e: returns empty arrays when chart is null', () => {
  const empty = composeKundliUserSummary(null, null);
  assert.equal(empty.summaryCards.length, 0);
  assert.equal(empty.lifeAreaCards.length, 0);
});

// ─── CAT-U2: Life area keys ───────────────────────────────────────────────────
test('CAT-U2a: contains all 10 expected life area keys', () => {
  const { lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const keys = lifeAreaCards.map(a => a.areaKey);
  for (const k of EXPECTED_KEYS) {
    assert.ok(keys.includes(k), `missing area key: ${k}`);
  }
});

test('CAT-U2b: no duplicate life area keys', () => {
  const { lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const keys = lifeAreaCards.map(a => a.areaKey);
  assert.equal(new Set(keys).size, keys.length, 'duplicate area keys found');
});

// ─── CAT-U3: No raw house number codes in user text ──────────────────────────
test('CAT-U3a: summaryCards desc contains no H1/H7 codes', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const card of summaryCards) {
    if (card.descEn) assert.ok(!HOUSE_CODE_RE.test(card.descEn), `${card.cardKey} descEn has house code`);
    if (card.descHi) assert.ok(!HOUSE_CODE_RE.test(card.descHi), `${card.cardKey} descHi has house code`);
  }
});

test('CAT-U3b: lifeAreaCards summary contains no H1/H7 codes', () => {
  const { lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const area of lifeAreaCards) {
    assert.ok(!HOUSE_CODE_RE.test(area.summaryEn), `${area.areaKey} summaryEn has house code`);
    assert.ok(!HOUSE_CODE_RE.test(area.summaryHi), `${area.areaKey} summaryHi has house code`);
  }
});

// ─── CAT-U4: No raw score labels in user text ─────────────────────────────────
test('CAT-U4: no raw score/strength labels in user-facing text', () => {
  const { summaryCards, lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const card of summaryCards) {
    if (card.descEn)  assert.ok(!SCORE_LABEL_RE.test(card.descEn), `${card.cardKey} descEn has raw score`);
    if (card.valueEn) assert.ok(!SCORE_LABEL_RE.test(card.valueEn),`${card.cardKey} valueEn has raw score`);
  }
  for (const area of lifeAreaCards) {
    assert.ok(!SCORE_LABEL_RE.test(area.summaryEn), `${area.areaKey} summaryEn has raw score`);
  }
});

// ─── CAT-U5: Forbidden phrases absent ────────────────────────────────────────
test('CAT-U5: no forbidden phrases in any user-facing text', () => {
  const { summaryCards, lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const allText = [
    ...summaryCards.flatMap(c => [c.descEn, c.descHi, c.valueEn, c.valueHi].filter(Boolean)),
    ...lifeAreaCards.flatMap(a => [a.summaryEn, a.summaryHi, a.adviceEn, a.adviceHi].filter(Boolean)),
  ].join(' ');
  for (const pat of FORBIDDEN_RE) {
    assert.ok(!pat.test(allText), `forbidden pattern found: ${pat}`);
  }
});

// ─── CAT-U6: Language purity ─────────────────────────────────────────────────
test('CAT-U6a: titleHi fields contain Devanagari', () => {
  const { summaryCards, lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const card of summaryCards) {
    assert.ok(DEVANAGARI_RE.test(card.titleHi), `summaryCard ${card.cardKey} titleHi lacks Devanagari`);
  }
  for (const area of lifeAreaCards) {
    assert.ok(DEVANAGARI_RE.test(area.titleHi), `lifeArea ${area.areaKey} titleHi lacks Devanagari`);
  }
});

test('CAT-U6b: summaryHi for life areas contains Devanagari', () => {
  const { lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const area of lifeAreaCards) {
    assert.ok(DEVANAGARI_RE.test(area.summaryHi), `${area.areaKey} summaryHi lacks Devanagari`);
  }
});

test('CAT-U6c: titleEn fields have no Devanagari (no cross-language leak)', () => {
  const { summaryCards, lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const card of summaryCards) {
    assert.ok(!DEVANAGARI_RE.test(card.titleEn), `summaryCard ${card.cardKey} titleEn has Devanagari`);
  }
  for (const area of lifeAreaCards) {
    assert.ok(!DEVANAGARI_RE.test(area.titleEn), `lifeArea ${area.areaKey} titleEn has Devanagari`);
  }
});

// ─── CAT-U7: Status enum validity ────────────────────────────────────────────
test('CAT-U7: all status fields are valid enum values', () => {
  const { summaryCards, lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const card of summaryCards) {
    assert.ok(VALID_STATUSES.has(card.status), `${card.cardKey} has invalid status: ${card.status}`);
  }
  for (const area of lifeAreaCards) {
    assert.ok(VALID_STATUSES.has(area.status), `${area.areaKey} has invalid status: ${area.status}`);
  }
});

// ─── CAT-U8: Period card reflects current dasha ───────────────────────────────
test('CAT-U8a: period card valueEn contains current dasha lord (Saturn)', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const period = summaryCards.find(c => c.cardKey === 'period');
  assert.ok(period, 'period card missing');
  assert.ok(period.valueEn.includes('Saturn'), `expected Saturn, got: ${period.valueEn}`);
});

test('CAT-U8b: period card valueHi contains Saturn Hindi name', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const period = summaryCards.find(c => c.cardKey === 'period');
  assert.ok(period.valueHi.includes('शनि'), `expected शनि, got: ${period.valueHi}`);
});

test('CAT-U8c: period card descEn mentions dasha themes', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const period = summaryCards.find(c => c.cardKey === 'period');
  assert.ok(/discipline|karma|patience|hard\s+work/i.test(period.descEn), `unexpected desc: ${period.descEn}`);
});

// ─── CAT-U9: Strong/care cards reflect judgement data ────────────────────────
test('CAT-U9a: strong card includes the strong-status area (gains/Income)', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const strong = summaryCards.find(c => c.cardKey === 'strong');
  assert.ok(strong, 'strong card missing');
  const text = JSON.stringify(strong);
  assert.ok(/Income|Gains|आय|लाभ/i.test(text), `gains area not in strong card: ${text.slice(0,200)}`);
});

test('CAT-U9b: care card includes the needs-care area (mind/Emotions)', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  const care = summaryCards.find(c => c.cardKey === 'care');
  assert.ok(care, 'care card missing');
  const text = JSON.stringify(care);
  assert.ok(/Mind|Emotions|मन|भावनाएं/i.test(text), `mind area not in care card: ${text.slice(0,200)}`);
});

// ─── CAT-U10: Icons and completeness ────────────────────────────────────────
test('CAT-U10a: all summary cards have icon strings', () => {
  const { summaryCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const card of summaryCards) {
    assert.ok(card.icon && typeof card.icon === 'string', `${card.cardKey} missing icon`);
  }
});

test('CAT-U10b: all life area cards have icon strings', () => {
  const { lifeAreaCards } = composeKundliUserSummary(MOCK_CHART, MOCK_JUDGEMENT);
  for (const area of lifeAreaCards) {
    assert.ok(area.icon && typeof area.icon === 'string', `${area.areaKey} missing icon`);
  }
});
