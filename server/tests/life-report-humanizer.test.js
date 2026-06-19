'use strict';
/**
 * Tests for life-report-humanizer — Session 54
 * Run: node --test tests/life-report-humanizer.test.js
 */
const test   = require('node:test');
const assert = require('node:assert/strict');
const { composeLifeReportUserFriendly } = require('../src/services/report-engine/life-report-humanizer');

// ─── Shared mock data (same as report-engine.test.js) ────────────────────────
const MOCK_CHART = {
  ascendant: { rashi_num: 6, rashi_en: 'Virgo', rashi_hi: 'कन्या' },
  nakshatra: { en: 'Hasta', hi: 'हस्त', num: 13 },
  planets: {
    Sun:     { rashi_num: 4,  dignity: 'Neutral',     house_num: 11 },
    Moon:    { rashi_num: 4,  dignity: 'Neutral',     house_num: 11, nakshatra_en: 'Pushya', nakshatra_num: 8 },
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
      antardasha: [{ lord: 'Mars', is_current: true, start: '2025-01-01', end: '2026-06-01' }] },
  ],
  houses: {},
  mangal_dosha: { has_dosha: false },
  yogas_doshas: {
    yogas: [
      { name: 'Budh-Aditya Yoga', name_hi: 'बुध-आदित्य योग', is_cancelled: false },
      { name: 'Chandra-Mangal Laxmi Yoga', name_hi: 'चंद्र-मंगल लक्ष्मी योग', is_cancelled: false },
    ],
  },
};

const MOCK_LIFE_REPORT = {
  sections: {
    profile: {
      ishta_devata: {
        atmakaraka: 'Mercury', atmakaraka_hi: 'बुध', atmakaraka_degree: '28.5',
        d9_sign_en: 'Virgo', d9_sign_hi: 'कन्या', d9_sign_lord: 'Mercury',
        ishta_devata_en: 'Vishnu', ishta_devata_hi: 'विष्णु',
        primary_mantra_en: 'Om Namo Narayanaya', primary_mantra_hi: 'ॐ नमो नारायणाय',
        method_en: 'Atmakaraka in D9 → sign lord → Ishta Devata (Parashara BPHS)',
        method_hi: 'D9 में आत्मकारक → राशि स्वामी → इष्ट देवता (पाराशर BPHS)',
      },
      lagna: { sign_en: 'Virgo', sign_hi: 'कन्या', lord: 'Mercury', summary_en: 'Practical and analytical.', summary_hi: 'व्यावहारिक और विश्लेषणात्मक।' },
    },
    finance: {
      indicators: [{ key: 'lord2', label_en: '2nd Lord', label_hi: 'द्वितीयेश', value_en: 'Venus in 12th', value_hi: 'शुक्र 12वें में' }],
      wealth_yogas: [{ name: 'Chandra-Mangal Yoga', name_hi: 'चंद्र-मंगल योग' }],
      problems: [{ en: 'Venus in 12th causes high expenses.', hi: 'शुक्र 12वें में अधिक खर्च करवाता है।' }],
    },
    family: {
      doshas_detected: [{ name: 'Paap Kartari', name_hi: 'पाप कर्तरी', severity: 'mild' }],
      problems: [{ en: 'Moon in enemy sign.', hi: 'चंद्र शत्रु राशि में।' }],
    },
    health: {
      indicators: [],
      problems: [{ en: 'Ketu in lagna may cause confusion.', hi: 'लग्न में केतु भ्रम दे सकता है।' }],
    },
    problems: {
      doshas_detected: [{ name: 'Paap Kartari', name_hi: 'पाप कर्तरी', severity: 'mild' }],
      problems: [{ en: 'Subtle karmic patterns.', hi: 'सूक्ष्म कर्मिक पैटर्न।' }],
    },
  },
};

const MOCK_JUDGEMENT = {
  version: 'judgement-priority-v2',
  overallScore: 55,
  areas: [
    { areaKey: 'lagna',    score: 60, status: 'balanced',    titleEn: 'Foundation',    titleHi: 'आधार',      userSummaryEn: 'Balanced.', userSummaryHi: 'संतुलित।' },
    { areaKey: 'children', score: 32, status: 'challenging', titleEn: 'Children',      titleHi: 'संतान',     userSummaryEn: 'Needs care.', userSummaryHi: 'देखभाल चाहिए।' },
    { areaKey: 'gains',    score: 70, status: 'strong',      titleEn: 'Income',        titleHi: 'आय',        userSummaryEn: 'Strong.', userSummaryHi: 'मजबूत।' },
  ],
};

// Phrases that must NEVER appear in normal user mode
const FORBIDDEN_USER = [
  /loss\s+of\s+self/i, /loss\s+of\s+wealth/i, /chronic\s+health\s+issues/i,
  /miscarriage\s+will/i, /spouse\s+death/i, /divorce\s+guaranteed/i,
  /no\s+child(ren)?/i, /you\s+are\s+cursed/i, /severe\s+dosha/i,
  /dangerous\s+dosha/i, /financial\s+ruin/i, /identity\s+struggle/i,
  /Kumbh\s+Vivah/i,
  /मृत्यु\s+होगी/i, /बाँझपन/i, /श्राप/i,
];

// ─── LH-1: Output shape ──────────────────────────────────────────────────────
test('LH-1: composeLifeReportUserFriendly returns correct shape', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  assert.ok(Array.isArray(out.sections), 'sections is array');
  assert.equal(out.sections.length, 5, 'returns 5 sections');
  assert.ok(out.advancedRemedies?.en?.length > 0, 'advancedRemedies.en present');
  assert.ok(out.advancedRemedies?.hi?.length > 0, 'advancedRemedies.hi present');
  assert.equal(out.technicalAvailable, true, 'technicalAvailable is true');
});

// ─── LH-2: Section keys ──────────────────────────────────────────────────────
test('LH-2: sections have correct keys in order', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const keys = out.sections.map((s) => s.key);
  assert.deepEqual(keys, ['soul', 'money', 'family', 'health', 'challenges']);
});

// ─── LH-3: Tab titles (renamed correctly) ────────────────────────────────────
test('LH-3: "challenges" section has correct bilingual titles', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const ch = out.sections.find((s) => s.key === 'challenges');
  assert.ok(ch, 'challenges section exists');
  assert.equal(ch.titleEn, 'Challenges & Solutions', 'EN title correct');
  assert.equal(ch.titleHi, 'सावधानी और समाधान', 'HI title correct');
});

test('LH-3b: "soul" section is titled "Soul Direction" / "आत्मिक दिशा"', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const s = out.sections.find((s) => s.key === 'soul');
  assert.equal(s.titleEn, 'Soul Direction');
  assert.equal(s.titleHi, 'आत्मिक दिशा');
});

test('LH-3c: "family" section is titled "Family & Relationships" / "परिवार और रिश्ते"', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const s = out.sections.find((s) => s.key === 'family');
  assert.equal(s.titleEn, 'Family & Relationships');
  assert.equal(s.titleHi, 'परिवार और रिश्ते');
});

// ─── LH-4: No forbidden phrases in normal content ────────────────────────────
test('LH-4a: EN output has no forbidden fear phrases', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const allText = out.sections.flatMap((s) => [
    s.summaryEn, ...s.goodPointsEn, ...s.challengesEn, ...s.adviceEn, ...s.simpleRemediesEn,
  ]).filter(Boolean).join(' ');
  for (const pat of FORBIDDEN_USER) {
    assert.ok(!pat.test(allText), `EN output contains forbidden phrase ${pat}: "${allText.match(pat)?.[0]}"`);
  }
});

test('LH-4b: HI output has no forbidden fear phrases', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const allText = out.sections.flatMap((s) => [
    s.summaryHi, ...s.goodPointsHi, ...s.challengesHi, ...s.adviceHi, ...s.simpleRemediesHi,
  ]).filter(Boolean).join(' ');
  for (const pat of FORBIDDEN_USER) {
    assert.ok(!pat.test(allText), `HI output contains forbidden phrase ${pat}: "${allText.match(pat)?.[0]}"`);
  }
});

// ─── LH-5: Language purity ───────────────────────────────────────────────────
test('LH-5a: EN summaries contain no Hindi danda (।)', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const allText = out.sections.flatMap((s) => [s.summaryEn, ...s.goodPointsEn, ...s.adviceEn]).filter(Boolean).join(' ');
  assert.ok(!allText.includes('।'), `EN content contains Hindi danda: "${allText.slice(0,200)}"`);
});

test('LH-5b: HI summaries contain Devanagari', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const DEVA = /[ऀ-ॿ]/;
  const allText = out.sections.flatMap((s) => [s.summaryHi, ...s.simpleRemediesHi]).filter(Boolean).join(' ');
  assert.ok(DEVA.test(allText), `HI content contains no Devanagari: "${allText.slice(0,200)}"`);
});

// ─── LH-6: Technical details exist but are nested (not leading) ──────────────
test('LH-6a: soul section technicalDetails contains ishta_devata', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const soul = out.sections.find((s) => s.key === 'soul');
  assert.ok(soul.technicalDetails?.ishta_devata?.atmakaraka === 'Mercury', 'Atmakaraka in technicalDetails');
});

test('LH-6b: money section technicalDetails contains wealth_yogas', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const mon = out.sections.find((s) => s.key === 'money');
  assert.ok(Array.isArray(mon.technicalDetails?.wealth_yogas), 'wealth_yogas in technicalDetails');
});

test('LH-6c: challenges technicalDetails contains doshas_detected', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const ch = out.sections.find((s) => s.key === 'challenges');
  assert.ok(Array.isArray(ch.technicalDetails?.doshas_detected), 'doshas_detected in technicalDetails');
  // Dosha names must NOT be in the main text
  const mainText = [...ch.challengesEn, ...ch.summaryEn].join(' ');
  const doshaName = 'Paap Kartari';
  assert.ok(!mainText.includes(doshaName), `Dosha name "${doshaName}" leaked into main user text`);
});

test('LH-6d: challenges judgementChallenging populated when judgement has challenging areas', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const ch = out.sections.find((s) => s.key === 'challenges');
  assert.ok(ch.technicalDetails.judgementChallenging.length > 0, 'judgementChallenging populated');
  assert.ok(ch.technicalDetails.judgementChallenging.some((a) => a.keyEn === 'Children'), 'Children area in challenging');
});

// ─── LH-7: Remedies structure ─────────────────────────────────────────────────
test('LH-7a: Each section has simpleRemediesEn + simpleRemediesHi arrays', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  for (const s of out.sections) {
    assert.ok(Array.isArray(s.simpleRemediesEn), `${s.key} missing simpleRemediesEn`);
    assert.ok(Array.isArray(s.simpleRemediesHi), `${s.key} missing simpleRemediesHi`);
    assert.ok(s.simpleRemediesEn.length > 0, `${s.key} simpleRemediesEn is empty`);
  }
});

test('LH-7b: soul section simple remedy includes Saturn dasha-specific text (mock chart = Saturn mahadasha)', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const soul = out.sections.find((s) => s.key === 'soul');
  const remedyText = soul.simpleRemediesEn.join(' ');
  assert.ok(/Saturday|discipline|elderly|hard-working/i.test(remedyText),
    `Expected Saturn dasha remedy in soul simpleRemediesEn: "${remedyText.slice(0,300)}"`);
});

test('LH-7c: advancedRemedies contains Sri Rudram (Level B)', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const enText = out.advancedRemedies.en.join(' ');
  assert.ok(/Rudram/i.test(enText), 'Sri Rudram in advanced remedies EN');
  const hiText = out.advancedRemedies.hi.join(' ');
  assert.ok(/रुद्रम्/.test(hiText), 'Rudram in advanced remedies HI');
});

test('LH-7d: advancedRemedies is NOT in section-level content (it stays separate)', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  for (const s of out.sections) {
    const mainText = [...s.simpleRemediesEn].join(' ');
    assert.ok(!/Rudram|Navgraha\s+Suktam|Santana\s+Gopala/i.test(mainText),
      `Advanced remedy leaked into section ${s.key} simpleRemediesEn`);
  }
});

// ─── LH-8: Health section has doctor disclaimer ───────────────────────────────
test('LH-8: Health section adviceEn contains doctor disclaimer', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const hea = out.sections.find((s) => s.key === 'health');
  const adviceText = hea.adviceEn.join(' ');
  assert.ok(/doctor|consult/i.test(adviceText), `Expected doctor disclaimer in health adviceEn: "${adviceText}"`);
});

// ─── LH-9: Family section has marriage disclaimer ────────────────────────────
test('LH-9: Family section adviceEn recommends qualified astrologer for marriage', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const fam = out.sections.find((s) => s.key === 'family');
  const adviceText = fam.adviceEn.join(' ');
  assert.ok(/astrologer|matching/i.test(adviceText), `Expected marriage advice in family adviceEn: "${adviceText}"`);
});

// ─── LH-10: Works gracefully without optional arguments ──────────────────────
test('LH-10a: Works when lifeReport is null', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, null, MOCK_JUDGEMENT, {});
  assert.equal(out.sections.length, 5, 'returns 5 sections even when lifeReport is null');
});

test('LH-10b: Works when judgement is null', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, null, {});
  assert.equal(out.sections.length, 5, 'returns 5 sections even when judgement is null');
});

test('LH-10c: Works when chart dasha array is missing', () => {
  const chartNoDasha = { ...MOCK_CHART, dasha: [] };
  const out = composeLifeReportUserFriendly(chartNoDasha, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  assert.equal(out.sections.length, 5, 'handles empty dasha array');
});

// ─── LH-11: statusKey is a valid value ───────────────────────────────────────
test('LH-11: All sections have a valid statusKey', () => {
  const out = composeLifeReportUserFriendly(MOCK_CHART, MOCK_LIFE_REPORT, MOCK_JUDGEMENT, {});
  const valid = new Set(['strong', 'mid', 'care']);
  for (const s of out.sections) {
    assert.ok(valid.has(s.statusKey), `${s.key} has invalid statusKey: "${s.statusKey}"`);
  }
});
