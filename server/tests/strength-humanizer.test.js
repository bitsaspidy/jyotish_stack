'use strict';
/**
 * Tests for strength-humanizer — Session 55
 * Run: node --test tests/strength-humanizer.test.js
 */
const test   = require('node:test');
const assert = require('node:assert/strict');
const { composeStrengthUserFriendly } = require('../src/services/report-engine/strength-humanizer');

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_STRENGTH = {
  overall_score: 62,
  label: { en:'Above Average', hi:'औसत से बेहतर', color:'#84CC16' },
  planet_scores: {
    Sun:     78,
    Moon:    65,
    Mars:    35,
    Mercury: 82,
    Jupiter: 72,
    Venus:   38,
    Saturn:  55,
    Rahu:    50,
    Ketu:    48,
  },
  planet_avg:   58,
  yoga_score:   71,
  yoga_count:   2,
  dosha_count:  1,
  domain_avg:   60,
  dasha_score:  67,
  life_domains: {
    wealth:       { key:'wealth',       en:'Wealth & Income',       hi:'धन और आय',            score:72, label:{ en:'Excellent',     hi:'उत्कृष्ट',   color:'#10B981' } },
    career:       { key:'career',       en:'Career & Fame',          hi:'करियर और प्रतिष्ठा', score:65, label:{ en:'Good',          hi:'अच्छा',       color:'#22C55E' } },
    health:       { key:'health',       en:'Health & Longevity',     hi:'स्वास्थ्य और आयु',   score:55, label:{ en:'Average',       hi:'सामान्य',     color:'#F59E0B' } },
    marriage:     { key:'marriage',     en:'Marriage & Love',        hi:'विवाह और प्रेम',      score:48, label:{ en:'Average',       hi:'सामान्य',     color:'#F59E0B' } },
    family:       { key:'family',       en:'Family & Happiness',     hi:'परिवार और सुख',       score:61, label:{ en:'Good',          hi:'अच्छा',       color:'#22C55E' } },
    children:     { key:'children',     en:'Children & Intellect',   hi:'संतान और बुद्धि',    score:50, label:{ en:'Average',       hi:'सामान्य',     color:'#F59E0B' } },
    fortune:      { key:'fortune',      en:'Fortune & Dharma',       hi:'भाग्य और धर्म',       score:68, label:{ en:'Good',          hi:'अच्छा',       color:'#22C55E' } },
    spirituality: { key:'spirituality', en:'Spirituality & Moksha',  hi:'आध्यात्म और मोक्ष',  score:42, label:{ en:'Needs Attention',hi:'सुधार चाहिए', color:'#EF4444' } },
  },
  life_domain_list: [],
  strengths_en:  ['Mercury (Exaltation) in the 1st house — strongly supports intellect, communication, trade, education, skills.'],
  strengths_hi:  ['बुध (उच्च) 1वें भाव में — बुद्धि, संवाद, व्यापार, शिक्षा, कौशल को बल देता है।'],
  challenges_en: ['Mars (Debilitation) in the 2nd house — the area of wealth, family speech, and savings requires remedies and mindful effort.'],
  challenges_hi: ['मंगल (नीच) 2वें भाव में — धन, परिवार क्षेत्र में उपाय आवश्यक।'],
  verdict_en:    'Overall Kundli strength: 62/100 (Above Average). Chart has 2 positive yogas and 1 dosha. Current Saturn Mahadasha rates 67/100.',
  verdict_hi:    'समग्र कुंडली बल: 62/100 (औसत से बेहतर)। 2 शुभ योग और 1 दोष। वर्तमान शनि महादशा इस कुंडली के लिए 67/100।',
  current_mahadasha:  { planet:'Saturn', planet_hi:'शनि', score:55, end_date:'2041-01-01' },
  current_antardasha: { planet:'Mercury', planet_hi:'बुध', score:82, end_date:'2026-08-01' },
};

const MOCK_JUDGEMENT_WITH_YOGAS = {
  areas: [
    {
      areaKey: 'yogas',
      yogas: [
        { name:'Budh-Aditya Yoga', activation:'full'    },
        { name:'Gaja Kesari Yoga', activation:'partial' },
        { name:'Neecha Bhanga',    activation:'weak'    },
        { name:'Kemdrum Dosha',    activation:'blocked' },
      ],
    },
  ],
};

const MOCK_CHART = {};

// ─── Tests ────────────────────────────────────────────────────────────────────

test('ST-01: returns non-null for valid strength input', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.notEqual(result, null);
});

test('ST-02: returns null when strength is null', () => {
  const result = composeStrengthUserFriendly(null, null, MOCK_CHART);
  assert.equal(result, null);
});

test('ST-03: overall.score equals strength.overall_score', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.equal(result.overall.score, MOCK_STRENGTH.overall_score);
});

test('ST-04: overall.labelEn is one of the 5 user-friendly labels (no fear words)', () => {
  const FRIENDLY_LABELS = ['Strong support', 'Supportive', 'Balanced with effort', 'Needs extra care', 'Handle carefully'];
  const FORBIDDEN_LABELS = ['Exceptional', 'Challenging', 'Needs Remedies', 'Strong', 'Above Average', 'Average'];
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(FRIENDLY_LABELS.includes(result.overall.labelEn), `labelEn '${result.overall.labelEn}' not in friendly set`);
  for (const bad of FORBIDDEN_LABELS) {
    assert.notEqual(result.overall.labelEn, bad, `labelEn should not be '${bad}'`);
  }
});

test('ST-05: overall.simpleMeaningEn is a non-empty string', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(typeof result.overall.simpleMeaningEn === 'string' && result.overall.simpleMeaningEn.length > 10);
});

test('ST-06: overall.simpleMeaningHi is a non-empty string in Hindi', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(typeof result.overall.simpleMeaningHi === 'string' && result.overall.simpleMeaningHi.length > 5);
  // Hindi text should contain Devanagari
  assert.ok(/[ऀ-ॿ]/.test(result.overall.simpleMeaningHi), 'simpleMeaningHi should contain Devanagari');
});

test('ST-07: scoreBreakdownCards has exactly 4 items', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.equal(result.scoreBreakdownCards.length, 4);
});

test('ST-08: scoreBreakdownCards has correct keys in correct order', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  const keys = result.scoreBreakdownCards.map(c => c.key);
  assert.deepEqual(keys, ['planets', 'yogas', 'domains', 'dasha']);
});

test('ST-09: each scoreBreakdownCard has simpleMeaningEn and simpleMeaningHi', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  for (const card of result.scoreBreakdownCards) {
    assert.ok(card.simpleMeaningEn?.length > 5, `card ${card.key} missing simpleMeaningEn`);
    assert.ok(card.simpleMeaningHi?.length > 5, `card ${card.key} missing simpleMeaningHi`);
  }
});

test('ST-10: yogaSummaryEn is a non-empty string', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(typeof result.yogaSummaryEn === 'string' && result.yogaSummaryEn.length > 10);
});

test('ST-11: yogaSummaryHi is a non-empty Hindi string', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(typeof result.yogaSummaryHi === 'string' && result.yogaSummaryHi.length > 5);
  assert.ok(/[ऀ-ॿ]/.test(result.yogaSummaryHi), 'yogaSummaryHi should contain Devanagari');
});

test('ST-12: topStrengths is an array', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(Array.isArray(result.topStrengths));
});

test('ST-13: topStrengths items have required fields', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  for (const item of result.topStrengths) {
    assert.ok(item.planet,              'topStrengths item missing planet');
    assert.ok(item.planetHi,            'topStrengths item missing planetHi');
    assert.ok(typeof item.score === 'number', 'topStrengths item score must be number');
    assert.ok(item.simpleMeaningEn?.length > 5, 'topStrengths item missing simpleMeaningEn');
    assert.ok(item.simpleMeaningHi?.length > 5, 'topStrengths item missing simpleMeaningHi');
  }
});

test('ST-14: needsCare items have required fields', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  for (const item of result.needsCare) {
    assert.ok(item.planet,              'needsCare item missing planet');
    assert.ok(item.planetHi,            'needsCare item missing planetHi');
    assert.ok(typeof item.score === 'number', 'needsCare item score must be number');
    assert.ok(item.simpleMeaningEn?.length > 5, 'needsCare item missing simpleMeaningEn');
    assert.ok(item.simpleMeaningHi?.length > 5, 'needsCare item missing simpleMeaningHi');
  }
});

test('ST-15: lifeDomains has 8 items for full strength object', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.equal(result.lifeDomains.length, 8);
});

test('ST-16: lifeDomains items have key, titleEn, titleHi, labelEn, labelHi, simpleMeaningEn, simpleMeaningHi', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  for (const d of result.lifeDomains) {
    assert.ok(d.key,              `domain missing key`);
    assert.ok(d.titleEn,          `domain ${d.key} missing titleEn`);
    assert.ok(d.titleHi,          `domain ${d.key} missing titleHi`);
    assert.ok(d.labelEn,          `domain ${d.key} missing labelEn`);
    assert.ok(d.labelHi,          `domain ${d.key} missing labelHi`);
    assert.ok(d.simpleMeaningEn,  `domain ${d.key} missing simpleMeaningEn`);
    assert.ok(d.simpleMeaningHi,  `domain ${d.key} missing simpleMeaningHi`);
  }
});

test('ST-17: lifeDomains items do NOT use legacy labels (Excellent/Good/Average/Needs Attention)', () => {
  const LEGACY_LABELS = ['Excellent', 'Good', 'Average', 'Needs Attention', 'उत्कृष्ट', 'अच्छा', 'सामान्य', 'सुधार चाहिए'];
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  for (const d of result.lifeDomains) {
    for (const bad of LEGACY_LABELS) {
      assert.notEqual(d.labelEn, bad, `domain ${d.key} labelEn should not be '${bad}'`);
    }
  }
});

test('ST-18: dashaSummary is present when current_mahadasha is set', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(result.dashaSummary !== null, 'dashaSummary should be present');
  assert.ok(result.dashaSummary.mahaLord, 'dashaSummary missing mahaLord');
  assert.ok(result.dashaSummary.simpleMeaningEn?.length > 10, 'dashaSummary missing simpleMeaningEn');
});

test('ST-19: dashaSummary.supportLevel is one of strong/balanced/needs-care', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(['strong','balanced','needs-care'].includes(result.dashaSummary.supportLevel));
});

test('ST-20: technicalDetails is present and preserves planet_scores', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  assert.ok(result.technicalDetails, 'technicalDetails should be present');
  assert.deepEqual(result.technicalDetails.planet_scores, MOCK_STRENGTH.planet_scores);
  assert.equal(result.technicalDetails.overall_score, MOCK_STRENGTH.overall_score);
});

const FORBIDDEN = [
  'dangerous dosha', 'guaranteed success', 'bad planet', 'ruined', 'cursed',
  'no marriage', 'no child', 'disease confirmed', 'weak planet', 'evil planet',
];

test('ST-21: no forbidden phrases in topStrengths simpleMeaningEn', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  for (const item of result.topStrengths) {
    const text = (item.simpleMeaningEn || '').toLowerCase();
    for (const bad of FORBIDDEN) {
      assert.ok(!text.includes(bad), `topStrengths item contains forbidden phrase '${bad}': ${item.simpleMeaningEn}`);
    }
  }
});

test('ST-22: no forbidden phrases in needsCare simpleMeaningEn', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, null, MOCK_CHART);
  for (const item of result.needsCare) {
    const text = (item.simpleMeaningEn || '').toLowerCase();
    for (const bad of FORBIDDEN) {
      assert.ok(!text.includes(bad), `needsCare item contains forbidden phrase '${bad}': ${item.simpleMeaningEn}`);
    }
    // Should not use the word "weak" as a label (soft language)
    assert.ok(!text.startsWith('weak'), `needsCare item starts with 'weak': ${item.simpleMeaningEn}`);
  }
});

test('ST-23: yogaSummary uses activation counts when judgement has yoga activations', () => {
  const result = composeStrengthUserFriendly(MOCK_STRENGTH, MOCK_JUDGEMENT_WITH_YOGAS, MOCK_CHART);
  // Should mention "4 auspicious combinations" (total from mock)
  assert.ok(result.yogaSummaryEn.includes('4'), `yogaSummaryEn should mention count 4: ${result.yogaSummaryEn}`);
  // Should mention "fully active" or similar activation language
  assert.ok(
    result.yogaSummaryEn.toLowerCase().includes('fully active') ||
    result.yogaSummaryEn.toLowerCase().includes('partially active') ||
    result.yogaSummaryEn.toLowerCase().includes('building'),
    `yogaSummaryEn should mention activation status: ${result.yogaSummaryEn}`
  );
});
