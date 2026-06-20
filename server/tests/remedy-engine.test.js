'use strict';
/**
 * Tests for the server-side Personalized Remedy Engine.
 * 14 tests covering all PDF rules from "Remedy Class 1, 4th May 2026".
 */
const test   = require('node:test');
const assert = require('node:assert/strict');

const { generatePersonalizedRemedies }  = require('../src/services/remedy-engine');
const { PROBLEM_REMEDY_MAP }            = require('../src/services/remedy-engine/problemRemedyMap');
const { FORBIDDEN_USER_PHRASES_EN }     = require('../src/services/remedy-engine/remedyHumanizer');
const { buildPujaSequence }             = require('../src/services/remedy-engine/pujaSequenceBuilder');
const { SHAKTI_PLANETS }                = require('../src/services/remedy-engine/planetRemedyMap');

// ── Shared test fixtures ──────────────────────────────────────────────────────

// Aries lagna → Lagna Lord = Mars.  Mars debilitated in Cancer H4.
// Current Mahadasha = Mars → score 50 (debil) + 20 (LL) + 30 (MD) = 100
// Saturn has highest degree_in_sign → Atmakaraka = Saturn
const ariesChart = {
  ascendant: { rashi_num: 1, rashi_en: 'Aries', rashi_hi: 'मेष' },
  planets: {
    Sun:     { rashi_num: 7,  rashi_en: 'Libra',    dignity: 'Debilitation (Neech)', house: 7,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '10°00\'00"' },
    Moon:    { rashi_num: 2,  rashi_en: 'Taurus',   dignity: 'Exaltation (Uchch)',   house: 2,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '5°00\'00"' },
    Mars:    { rashi_num: 4,  rashi_en: 'Cancer',   dignity: 'Debilitation (Neech)', house: 4,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '8°00\'00"' },
    Mercury: { rashi_num: 7,  rashi_en: 'Libra',    dignity: 'Friend',               house: 7,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '15°00\'00"' },
    Jupiter: { rashi_num: 4,  rashi_en: 'Cancer',   dignity: 'Exaltation (Uchch)',   house: 4,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '20°00\'00"' },
    Venus:   { rashi_num: 8,  rashi_en: 'Scorpio',  dignity: 'Enemy',                house: 8,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '12°00\'00"' },
    Saturn:  { rashi_num: 1,  rashi_en: 'Aries',    dignity: 'Enemy',                house: 1,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '25°00\'00"' },
    Rahu:    { rashi_num: 6,  rashi_en: 'Virgo',    dignity: 'Neutral',              house: 6,  is_retrograde: true,  is_combust: false, degree_in_sign_dms: '18°00\'00"' },
    Ketu:    { rashi_num: 12, rashi_en: 'Pisces',   dignity: 'Neutral',              house: 12, is_retrograde: true,  is_combust: false, degree_in_sign_dms: '18°00\'00"' },
  },
  dasha: [{
    lord: 'Mars', start: '2020-01-01', end: '2027-01-01', is_current: true,
    antardasha: [{
      lord: 'Saturn', start: '2024-01-01', end: '2025-06-01', is_current: true,
      pratyantardasha: [],
    }],
  }],
  yogas_doshas: { yogas: [], doshas: [] },
  mangal_dosha: { has_dosha: false },
};

// Taurus lagna → Lagna Lord = Venus (a Shakti planet)
// Venus debilitated → should appear in puja as Lagna Lord → no Shakti step needed
const taurusChart = {
  ascendant: { rashi_num: 2, rashi_en: 'Taurus', rashi_hi: 'वृष' },
  planets: {
    Sun:     { rashi_num: 1,  rashi_en: 'Aries',    dignity: 'Exaltation (Uchch)',   house: 12, is_retrograde: false, is_combust: false, degree_in_sign_dms: '10°00\'00"' },
    Moon:    { rashi_num: 2,  rashi_en: 'Taurus',   dignity: 'Exaltation (Uchch)',   house: 1,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '3°00\'00"' },
    Mars:    { rashi_num: 8,  rashi_en: 'Scorpio',  dignity: 'Own Sign',             house: 7,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '2°00\'00"' },
    Mercury: { rashi_num: 2,  rashi_en: 'Taurus',   dignity: 'Enemy',                house: 1,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '5°00\'00"' },
    Jupiter: { rashi_num: 9,  rashi_en: 'Sagittarius', dignity: 'Own Sign',          house: 8,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '14°00\'00"' },
    Venus:   { rashi_num: 6,  rashi_en: 'Virgo',    dignity: 'Debilitation (Neech)', house: 5,  is_retrograde: false, is_combust: false, degree_in_sign_dms: '27°00\'00"' }, // AK
    Saturn:  { rashi_num: 11, rashi_en: 'Aquarius', dignity: 'Own Sign',             house: 10, is_retrograde: false, is_combust: false, degree_in_sign_dms: '16°00\'00"' },
    Rahu:    { rashi_num: 4,  rashi_en: 'Cancer',   dignity: 'Neutral',              house: 3,  is_retrograde: true,  is_combust: false, degree_in_sign_dms: '11°00\'00"' },
    Ketu:    { rashi_num: 10, rashi_en: 'Capricorn',dignity: 'Neutral',              house: 9,  is_retrograde: true,  is_combust: false, degree_in_sign_dms: '11°00\'00"' },
  },
  dasha: [{ lord: 'Moon', start: '2022-01-01', end: '2032-01-01', is_current: true, antardasha: [] }],
  yogas_doshas: { yogas: [], doshas: [] },
  mangal_dosha: { has_dosha: false },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function collectAllStrings(obj, out = []) {
  if (typeof obj === 'string') { out.push(obj); return out; }
  if (Array.isArray(obj)) { obj.forEach(v => collectAllStrings(v, out)); return out; }
  if (obj && typeof obj === 'object') Object.values(obj).forEach(v => collectAllStrings(v, out));
  return out;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// RM-01: Weak Lagna lord (Mars debilitated) triggers Lagna lord remedy
test('RM-01 weak Lagna lord triggers Lagna lord remedy', () => {
  const plan = generatePersonalizedRemedies(ariesChart);
  assert.ok(plan, 'plan must not be null');
  assert.equal(plan.meta.lagna_lord, 'Mars', 'Lagna lord of Aries must be Mars');

  // Mars should appear in priorityRemedies
  const marsRemedy = plan.priorityRemedies.find(r => r.planet.name === 'Mars');
  assert.ok(marsRemedy, 'Mars must appear in priorityRemedies when it is Lagna Lord + debilitated');
  assert.equal(marsRemedy.rank, 1, 'Mars (debil+LL+MD lord) must be Priority 1');
});

// RM-02: Current afflicted dasha planet becomes high priority
test('RM-02 current Mahadasha planet (afflicted) becomes high priority', () => {
  const plan = generatePersonalizedRemedies(ariesChart);
  // Mars is current MD lord + debilitated → must be critical (score ≥ 85)
  const marsHealth = plan.planetaryHealth.find(p => p.name === 'Mars');
  assert.ok(marsHealth, 'Mars must be in planetaryHealth');
  assert.ok(['critical','high'].includes(marsHealth.priority),
    `Mars (debil+MD lord) must be critical or high priority, got: ${marsHealth.priority}`);
  assert.ok(marsHealth.score >= 65,
    `Mars score must be ≥65, got: ${marsHealth.score}`);
});

// RM-03: Atmakaraka remedy appears in puja sequence
test('RM-03 Atmakaraka planet appears in puja sequence', () => {
  const plan = generatePersonalizedRemedies(ariesChart);
  // Saturn has degree 25° (highest) → Atmakaraka
  assert.equal(plan.meta.atmakarak, 'Saturn', 'Atmakaraka must be Saturn (highest degree)');

  const pujaContainsSaturn = plan.dailyPujaSequence.some(s => s.planet === 'Saturn');
  assert.ok(pujaContainsSaturn, 'Saturn (Atmakaraka) must appear in dailyPujaSequence');
});

// RM-04: Ganesha is always Step 0
test('RM-04 Ganesha is always Step 0 in puja sequence', () => {
  const plan1 = generatePersonalizedRemedies(ariesChart);
  const plan2 = generatePersonalizedRemedies(taurusChart);

  const step0a = plan1.dailyPujaSequence.find(s => s.step === 0);
  const step0b = plan2.dailyPujaSequence.find(s => s.step === 0);

  assert.ok(step0a, 'Step 0 must exist for ariesChart');
  assert.ok(step0b, 'Step 0 must exist for taurusChart');
  assert.ok(step0a.deity_en.includes('Ganesha'), `Step 0 deity must include Ganesha, got: ${step0a.deity_en}`);
  assert.ok(step0b.deity_en.includes('Ganesha'), `Step 0 deity must include Ganesha, got: ${step0b.deity_en}`);
  assert.equal(step0a.planet, null, 'Step 0 must have no planet (Ganesha, not a graha)');
  assert.equal(step0a.mandatory, true, 'Step 0 must be mandatory');
});

// RM-05: Shakti Pujan appears only when Shakti is not already covered
test('RM-05 Shakti Pujan appears only when Shakti not in steps 1–3', () => {
  // ariesChart: Lagna Lord=Mars (not Shakti), Atmakarak=Saturn (not Shakti)
  // Priority planet=Mars (not Shakti) → Shakti NOT covered → step 4 should appear
  const plan1 = generatePersonalizedRemedies(ariesChart);
  assert.equal(plan1.shaktiCovered, false, 'Shakti must NOT be covered in ariesChart');
  const hasShaktiStep1 = plan1.dailyPujaSequence.some(s => s.conditional === true);
  assert.ok(hasShaktiStep1, 'Shakti Pujan conditional step must appear when not covered in ariesChart');

  // taurusChart: Lagna Lord=Venus (IS Shakti planet) → Shakti IS covered → no step 4
  const plan2 = generatePersonalizedRemedies(taurusChart);
  assert.equal(plan2.shaktiCovered, true, 'Shakti must be covered when Venus (Lagna Lord) is in puja');
  const hasShaktiStep2 = plan2.dailyPujaSequence.some(s => s.conditional === true);
  assert.equal(hasShaktiStep2, false, 'No Shakti Pujan when Venus already appears in puja sequence');
});

// RM-06: Vastu problem map → Moon/Shiva + 1001 Vastu Suktam + 90 days + East
test('RM-06 Vastu problem → Moon/Shiva + 1001 Vastu Suktam + 90 days + East', () => {
  const vastu = PROBLEM_REMEDY_MAP.vastu;
  assert.ok(vastu, 'vastu must be in PROBLEM_REMEDY_MAP');
  assert.equal(vastu.planet, 'Moon', 'Vastu primary planet must be Moon');
  assert.ok(vastu.deity_en.toLowerCase().includes('shiva'), `Vastu deity must include Shiva, got: ${vastu.deity_en}`);
  assert.ok(vastu.mantras_en.some(m => m.includes('Vastu Suktam')),
    `Vastu mantras must include 1001 Vastu Suktam, got: ${JSON.stringify(vastu.mantras_en)}`);
  assert.ok(vastu.duration_en.includes('90'), `Vastu duration must say 90 days, got: ${vastu.duration_en}`);
  assert.equal(vastu.direction, 'East', 'Vastu direction must be East');
  assert.equal(vastu.force_90_days, true, 'Vastu must force 90 days');
});

// RM-07: Debt problem → Mars/Hanuman + Rinn Mochan Mangal Stotra
test('RM-07 Debt problem → Mars/Hanuman + Rinn Mochan Mangal Stotra', () => {
  const debt = PROBLEM_REMEDY_MAP.debt;
  assert.ok(debt, 'debt must be in PROBLEM_REMEDY_MAP');
  assert.equal(debt.planet, 'Mars', 'Debt primary planet must be Mars');
  assert.ok(debt.deity_en.toLowerCase().includes('hanuman'), `Debt deity must include Hanuman, got: ${debt.deity_en}`);
  assert.ok(debt.mantras_en.some(m => m.includes('Rinn Mochan')),
    `Debt mantras must include Rinn Mochan Mangal Stotra, got: ${JSON.stringify(debt.mantras_en)}`);
});

// RM-08: Wealth problem → Venus/Lakshmi + Sri Suktam
test('RM-08 Wealth problem → Venus/Lakshmi + Sri Suktam', () => {
  const wealth = PROBLEM_REMEDY_MAP.wealth;
  assert.ok(wealth, 'wealth must be in PROBLEM_REMEDY_MAP');
  assert.equal(wealth.planet, 'Venus', 'Wealth primary planet must be Venus');
  assert.ok(wealth.deity_en.toLowerCase().includes('lakshmi'), `Wealth deity must include Lakshmi, got: ${wealth.deity_en}`);
  assert.ok(wealth.mantras_en.includes('Sri Suktam'),
    `Wealth mantras must include Sri Suktam, got: ${JSON.stringify(wealth.mantras_en)}`);
});

// RM-09: Learning problem → Jupiter/Brihaspati + Medha Suktam
test('RM-09 Learning problem → Jupiter/Brihaspati + Medha Suktam', () => {
  const learning = PROBLEM_REMEDY_MAP.learning;
  assert.ok(learning, 'learning must be in PROBLEM_REMEDY_MAP');
  assert.equal(learning.planet, 'Jupiter', 'Learning primary planet must be Jupiter');
  assert.ok(
    learning.deity_en.toLowerCase().includes('brihaspati') || learning.deity_en.toLowerCase().includes('vishnu'),
    `Learning deity must include Brihaspati or Vishnu, got: ${learning.deity_en}`
  );
  assert.ok(learning.mantras_en.includes('Medha Suktam'),
    `Learning mantras must include Medha Suktam, got: ${JSON.stringify(learning.mantras_en)}`);
});

// RM-10: User mode does NOT recommend gemstone as a default remedy
test('RM-10 user mode does not recommend gemstone as default', () => {
  const plan = generatePersonalizedRemedies(ariesChart);

  // Daily and weekly remedy text must NOT contain gemstone advice
  for (const r of plan.priorityRemedies) {
    const combined = [r.daily_en, r.daily_hi, r.weekly_en, r.weekly_hi].join(' ').toLowerCase();
    assert.ok(!combined.includes('gemstone') && !combined.includes('रत्न'),
      `Daily/weekly remedy must not mention gemstone: "${combined.slice(0,120)}..."`);
  }

  // Gemstone may appear in advanced section but with advisory language
  for (const r of plan.priorityRemedies) {
    for (const adv of r.advanced_en) {
      if (adv.toLowerCase().includes('gemstone')) {
        assert.ok(
          adv.toLowerCase().includes('consult') || adv.toLowerCase().includes('advice') || adv.toLowerCase().includes('after'),
          `Gemstone in advanced must include advisory: "${adv}"`
        );
      }
    }
  }
});

// RM-11: Admin mode shows technical evidence (adminTriggers in planetaryHealth)
test('RM-11 admin mode shows technical evidence in planetaryHealth', () => {
  const plan = generatePersonalizedRemedies(ariesChart);
  const mars = plan.planetaryHealth.find(p => p.name === 'Mars');

  assert.ok(mars, 'Mars must be in planetaryHealth');
  assert.ok(Array.isArray(mars.adminTriggers), 'adminTriggers must be an array');
  assert.ok(mars.adminTriggers.length > 0, 'Mars must have at least one adminTrigger');

  const debilTrigger = mars.adminTriggers.find(t => t.rule.toLowerCase().includes('debil'));
  assert.ok(debilTrigger, 'Mars must have Debilitation trigger');
  assert.ok(debilTrigger.pts > 0, 'Debilitation trigger must have pts > 0');
  assert.ok(debilTrigger.evidence && debilTrigger.evidence.length > 0, 'Trigger must have evidence string');

  const adminDetails = plan.adminTechnicalDetails;
  assert.ok(adminDetails, 'adminTechnicalDetails must exist');
  assert.ok(adminDetails.planet_scores, 'adminTechnicalDetails must have planet_scores');
  assert.ok(adminDetails.trigger_log.length > 0, 'trigger_log must be non-empty');
  assert.ok(adminDetails.source.includes('Remedy Class 1'), 'Source must reference Remedy Class 1');
});

// RM-12: English text in en fields is actual English (no Devanagari)
test('RM-12 English fields contain English text', () => {
  const plan = generatePersonalizedRemedies(ariesChart);
  const devanagariPattern = /[ऀ-ॿ]/;

  // Meta fields
  assert.ok(!devanagariPattern.test(plan.meta.lagna_lord), 'lagna_lord must be English');

  // Priority remedies english fields
  for (const r of plan.priorityRemedies) {
    assert.ok(!devanagariPattern.test(r.why_en),     `why_en must be English, got: "${r.why_en.slice(0,60)}..."`);
    assert.ok(!devanagariPattern.test(r.daily_en),   `daily_en must be English`);
    assert.ok(!devanagariPattern.test(r.weekly_en),  `weekly_en must be English`);
    assert.ok(!devanagariPattern.test(r.benefit_en), `benefit_en must be English`);
  }
});

// RM-13: Hindi fields contain Devanagari text
test('RM-13 Hindi fields contain Devanagari text', () => {
  const plan = generatePersonalizedRemedies(ariesChart);
  const devanagariPattern = /[ऀ-ॿ]/;

  for (const r of plan.priorityRemedies) {
    assert.ok(devanagariPattern.test(r.why_hi),    `why_hi must contain Devanagari`);
    assert.ok(devanagariPattern.test(r.daily_hi),  `daily_hi must contain Devanagari`);
    assert.ok(devanagariPattern.test(r.weekly_hi), `weekly_hi must contain Devanagari`);
  }
  for (const p of plan.dailyPujaSequence) {
    if (p.label_hi) assert.ok(devanagariPattern.test(p.label_hi), `puja label_hi must contain Devanagari`);
  }
});

// RM-14: No fear-based phrases in user-facing text
test('RM-14 no fear-based phrases in user-facing output', () => {
  const plan = generatePersonalizedRemedies(ariesChart);

  // Collect all user-facing English text (not adminTriggers)
  const safeFields = [
    ...plan.priorityRemedies.flatMap(r => [r.why_en, r.daily_en, r.weekly_en, r.benefit_en, ...r.advanced_en]),
    ...plan.dailyPujaSequence.map(s => s.action_en),
    ...plan.optionalRemedies.map(o => o.status_en),
    plan.sadhanaDuration.reason_en,
  ];

  const allUserText = safeFields.filter(Boolean).join(' ').toLowerCase();

  for (const forbidden of FORBIDDEN_USER_PHRASES_EN) {
    assert.ok(!allUserText.includes(forbidden),
      `User-facing text must not contain "${forbidden}"`);
  }
});
