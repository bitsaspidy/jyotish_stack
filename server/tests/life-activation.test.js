'use strict';
/**
 * Life-activation engine tests.
 *
 * Age is the part users check against their own birthday, so the boundaries get
 * the most attention: the day before, the birthday itself either side of the birth
 * TIME, leap-year births, and negative timezones. `now` is injected everywhere —
 * a test that reads the wall clock passes today and fails on someone's birthday.
 */

const test = require('node:test');
const assert = require('node:assert');

const { computeAge } = require('../src/services/life-activation/age');
const { computeMaturity, maturityStatus } = require('../src/services/life-activation/maturity');
const { generateLifeActivation } = require('../src/services/life-activation');
const CFG = require('../src/config/life-activation.config');

const IST = { date_of_birth: '1990-05-15', time_of_birth: '10:30:00', timezone_offset: '5.50' };
const at = (iso) => new Date(iso);

// ── Age ──────────────────────────────────────────────────────────────────────

test('LA-age: completedYears and runningYear are different and both correct', () => {
  const { age } = computeAge(IST, at('2026-07-17T12:00:00+05:30'));
  assert.strictEqual(age.completedYears, 36);
  assert.strictEqual(age.runningYear, 37, 'runningYear is the year in progress, not the completed one');
  assert.strictEqual(age.months, 2);
  assert.strictEqual(age.days, 2);
});

test('LA-age: the day before the birthday is still the previous year', () => {
  const { age } = computeAge(IST, at('2026-05-14T12:00:00+05:30'));
  assert.strictEqual(age.completedYears, 35);
  assert.strictEqual(age.runningYear, 36);
});

test('LA-age: on the birthday, birth TIME decides the year', () => {
  const before = computeAge(IST, at('2026-05-15T09:00:00+05:30')).age;
  const after = computeAge(IST, at('2026-05-15T11:00:00+05:30')).age;
  assert.strictEqual(before.completedYears, 35, 'before birth time the year is not complete');
  assert.strictEqual(after.completedYears, 36, 'after birth time it is');
});

test('LA-age: decimalAge never crosses completedYears (floor, not round)', () => {
  // 0.997 through the year would round to the NEXT integer and read as a 36-year-old
  const { age } = computeAge(IST, at('2026-05-14T12:00:00+05:30'));
  assert.strictEqual(age.completedYears, 35);
  assert.ok(age.decimalAge < 36, `decimalAge ${age.decimalAge} must stay below 36`);
  assert.strictEqual(age.decimalAge, 35.99);
});

test('LA-age: leap-year birthday matures on 28 Feb in a common year', () => {
  const leap = { date_of_birth: '2000-02-29', time_of_birth: '00:00:00', timezone_offset: '5.50' };
  assert.strictEqual(computeAge(leap, at('2026-02-27T12:00:00+05:30')).age.completedYears, 25, '27 Feb: not yet');
  assert.strictEqual(computeAge(leap, at('2026-02-28T12:00:00+05:30')).age.completedYears, 26, '28 Feb: anniversary clamps here');
  assert.strictEqual(computeAge(leap, at('2024-02-29T12:00:00+05:30')).age.completedYears, 24, 'leap year: the real date');
});

test('LA-age: birth timezone is applied, not the server timezone', () => {
  // born 00:30 IST — the same instant is the PREVIOUS day in UTC
  const b = { date_of_birth: '1990-01-01', time_of_birth: '00:30:00', timezone_offset: '5.50' };
  const { age } = computeAge(b, at('2026-01-01T00:00:00+05:30'));
  assert.strictEqual(age.completedYears, 35, 'still 35 — birth time has not been reached in the birth zone');
});

test('LA-age: negative offsets work', () => {
  const b = { date_of_birth: '1990-05-15', time_of_birth: '10:30:00', timezone_offset: '-5.00' };
  const { age } = computeAge(b, at('2026-05-15T11:00:00-05:00'));
  assert.strictEqual(age.completedYears, 36);
});

test('LA-age: timezone_offset arrives from MySQL as a STRING and must still work', () => {
  const asString = computeAge({ ...IST, timezone_offset: '5.50' }, at('2026-07-17T12:00:00+05:30')).age;
  const asNumber = computeAge({ ...IST, timezone_offset: 5.5 }, at('2026-07-17T12:00:00+05:30')).age;
  assert.deepStrictEqual(asString, asNumber);
});

test('LA-age: never divides days by 365', () => {
  // 365-day division drifts a day per leap year; over 36 years that is ~9 days.
  const { age } = computeAge(IST, at('2026-05-15T11:00:00+05:30'));
  assert.strictEqual(age.days, 0, 'exactly on the birthday the day count is 0, not a drifted remainder');
  assert.strictEqual(age.months, 0);
});

test('LA-age: bad input returns a reason, never NaN', () => {
  for (const [birth, reason] of [
    [{ time_of_birth: '10:00:00', timezone_offset: '5.5' }, 'missing_birth_date'],
    [{ date_of_birth: '1990-05-15', timezone_offset: '5.5' }, 'missing_birth_time'],
    [{ date_of_birth: '1990-05-15', time_of_birth: '10:00:00', timezone_offset: '99' }, 'invalid_timezone'],
    [{ date_of_birth: '1990-05-15', time_of_birth: '10:00:00', timezone_offset: null }, 'invalid_timezone'],
    [{ date_of_birth: '2030-05-15', time_of_birth: '10:00:00', timezone_offset: '5.5' }, 'future_birth_date'],
    [{ date_of_birth: '1990-02-31', time_of_birth: '10:00:00', timezone_offset: '5.5' }, 'missing_birth_date'],
  ]) {
    const r = computeAge(birth, at('2026-07-17T12:00:00+05:30'));
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, reason);
  }
});

// ── Maturity ─────────────────────────────────────────────────────────────────

test('LA-maturity: statuses are correct at the boundary ages', () => {
  const m = CFG.MATURITY_AGES.Saturn; // 36
  assert.strictEqual(maturityStatus(m * 0.6 - 0.01, m), 'DEVELOPING');
  assert.strictEqual(maturityStatus(m * 0.6, m), 'EMERGING', 'exactly 0.6 has left DEVELOPING');
  assert.strictEqual(maturityStatus(m * 0.9 - 0.01, m), 'EMERGING');
  assert.strictEqual(maturityStatus(m * 0.9, m), 'MATURITY_WINDOW', 'exactly 0.9 opens the window');
  assert.strictEqual(maturityStatus(m - 0.01, m), 'MATURITY_WINDOW');
  assert.strictEqual(maturityStatus(m, m), 'MATURED', 'exactly the maturity age IS matured');
  assert.strictEqual(maturityStatus(m + 20, m), 'MATURED');
});

test('LA-maturity: every configured planet is reported, progress capped at 1', () => {
  const r = computeMaturity(80);
  assert.strictEqual(r.planets.length, Object.keys(CFG.MATURITY_AGES).length);
  assert.strictEqual(r.maturedPlanets.length, r.planets.length, 'at 80 every planet has matured');
  assert.strictEqual(r.nextMilestone, null, 'nothing left to mature');
  assert.ok(r.planets.every((p) => p.progress <= 1), 'progress must not exceed 1');
});

test('LA-maturity: Rahu/Ketu are the last milestone at 48', () => {
  const r = computeMaturity(36.17);
  assert.strictEqual(r.nextMilestone.planet, 'Rahu');
  assert.strictEqual(r.nextMilestone.maturityAge, 48);
  assert.ok(r.nextMilestone.yearsRemaining > 11 && r.nextMilestone.yearsRemaining < 12);
  assert.ok(r.maturedPlanets.includes('Saturn'), 'Saturn (36) has matured at 36.17');
  assert.ok(!r.maturedPlanets.includes('Rahu'));
});

// ── Config integrity ─────────────────────────────────────────────────────────

test('LA-config: factor weights total exactly 100', () => {
  const total = Object.values(CFG.FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, 100);
});

test('LA-config: maturity ages are single-sourced', () => {
  assert.deepStrictEqual(CFG.MATURITY_AGES, {
    Jupiter: 16, Sun: 22, Moon: 24, Venus: 25, Mars: 28, Mercury: 32, Saturn: 36, Rahu: 48, Ketu: 48,
  });
});

test('LA-config: every band maps to a bilingual label', () => {
  for (const b of CFG.ACTIVATION_BANDS) {
    const l = CFG.ACTIVATION_STATUS_LABELS[b.status];
    assert.ok(l && l.en && l.hi, `${b.status} needs en+hi labels`);
  }
});

test('LA-config: the sentence form is an adjective, not the noun label', () => {
  // The frame already says "सक्रियता" / "activation". A noun label dropped into it
  // renders "सक्रियता मध्यम सक्रियता है" and "is moderate activation" — found by
  // rendering, invisible in the code.
  for (const status of Object.keys(CFG.ACTIVATION_STATUS_LABELS)) {
    const short = CFG.ACTIVATION_STATUS_SHORT[status];
    assert.ok(short && short.en && short.hi, `${status} needs a short form in both languages`);
    assert.ok(!/सक्रियता$/.test(short.hi), `${status} short form "${short.hi}" repeats the noun the frame supplies`);
    assert.ok(!/\bactivation\b/i.test(short.en), `${status} short form "${short.en}" repeats the noun the frame supplies`);
  }
});

test('LA-engine: the rendered activation sentence never doubles the noun', () => {
  const r = generateLifeActivation(fakeChart(), IST, { now: at('2026-07-17T12:00:00+05:30') });
  const hi = `इस समय आपकी जीवन-फल सक्रियता ${r.overallActivation.status_short.hi} है।`;
  const en = `Your current life activation is ${r.overallActivation.status_short.en}.`;
  assert.ok(!/सक्रियता\s+\S+\s+सक्रियता/.test(hi), `doubled noun: ${hi}`);
  assert.ok(!/activation is .*activation/i.test(en), `doubled noun: ${en}`);
});

test('LA-config: the chart is never described as inactive', () => {
  const all = JSON.stringify(CFG.ACTIVATION_COPY);
  assert.ok(/जन्म से सक्रिय/.test(all), 'must state the chart is active from birth');
  assert.ok(!/निष्क्रिय है/.test(all), 'must never say the chart IS inactive');
});

// ── Engine ───────────────────────────────────────────────────────────────────

// Minimal but REAL chart shape — same keys the calculator emits.
function fakeChart(overrides = {}) {
  const planets = {};
  for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']) {
    planets[p] = { rashi_num: 1, dignity: 'Neutral', is_retrograde: false, is_combust: false, longitude: 10 };
  }
  return {
    ascendant: { rashi_num: 1 },
    planets,
    dasha: [
      { lord: 'Rahu', start: '2011-12-08', end: '2029-12-08', is_current: true, antardasha: [{ lord: 'Sun', start: '2026-06-26', end: '2027-05-21', is_current: true }] },
      { lord: 'Jupiter', start: '2029-12-08', end: '2045-12-08', is_current: false, antardasha: [] },
    ],
    yogas_doshas: { yogas: [] },
    varga_analysis: { d1: { overall_status: 'favorable' }, d9: { overall_status: 'mixed' }, d10: { overall_status: 'favorable' }, d2: { overall_status: 'favorable' } },
    ...overrides,
  };
}

test('LA-engine: score stays within 0–100 and matches its status band', () => {
  const r = generateLifeActivation(fakeChart(), IST, { now: at('2026-07-17T12:00:00+05:30') });
  assert.strictEqual(r.available, true);
  assert.ok(r.overallActivation.score >= 0 && r.overallActivation.score <= 100);
  const band = CFG.ACTIVATION_BANDS.find((b) => r.overallActivation.score >= b.min);
  assert.strictEqual(r.overallActivation.status, band.status);
});

test('LA-engine: no factor contributes more than its configured weight', () => {
  const r = generateLifeActivation(fakeChart(), IST, { admin: true, now: at('2026-07-17T12:00:00+05:30') });
  for (const [factor, weight] of Object.entries(CFG.FACTOR_WEIGHTS)) {
    const contribution = r.evidence[factor];
    if (contribution == null) continue;
    assert.ok(contribution <= weight, `${factor} contributed ${contribution}, above its ${weight} ceiling`);
    assert.ok(contribution >= 0, `${factor} contributed a negative ${contribution}`);
  }
});

test('LA-engine: user and admin get the SAME base calculation', () => {
  const now = at('2026-07-17T12:00:00+05:30');
  const user = generateLifeActivation(fakeChart(), IST, { admin: false, now });
  const adm = generateLifeActivation(fakeChart(), IST, { admin: true, now });
  assert.deepStrictEqual(user.age, adm.age);
  assert.strictEqual(user.overallActivation.score, adm.overallActivation.score);
  assert.deepStrictEqual(user.categoryScores.map((c) => c.score), adm.categoryScores.map((c) => c.score));
});

test('LA-engine: only admin receives the evidence block', () => {
  const now = at('2026-07-17T12:00:00+05:30');
  assert.strictEqual(generateLifeActivation(fakeChart(), IST, { admin: false, now }).evidence, undefined);
  const adm = generateLifeActivation(fakeChart(), IST, { admin: true, now }).evidence;
  assert.ok(adm.weights && adm.totalScore != null && adm.activeMahadasha);
  assert.ok(Array.isArray(adm.supportingFactors) && Array.isArray(adm.contradictingFactors));
});

test('LA-engine: deterministic — same chart + same instant = same score', () => {
  const now = at('2026-07-17T12:00:00+05:30');
  const a = generateLifeActivation(fakeChart(), IST, { now });
  const b = generateLifeActivation(fakeChart(), IST, { now });
  assert.strictEqual(a.overallActivation.score, b.overallActivation.score);
  assert.deepStrictEqual(a.categoryScores, b.categoryScores);
});

test('LA-engine: missing data returns a message, never NaN/undefined/0%', () => {
  const now = at('2026-07-17T12:00:00+05:30');
  const cases = [
    [null, IST, 'missing_chart'],
    [fakeChart(), { ...IST, date_of_birth: null }, 'missing_birth_date'],
    [fakeChart(), { ...IST, time_of_birth: null }, 'missing_birth_time'],
    [fakeChart(), { ...IST, timezone_offset: 'abc' }, 'invalid_timezone'],
    [fakeChart(), { ...IST, date_of_birth: '2030-01-01' }, 'future_birth_date'],
  ];
  for (const [chart, profile, reason] of cases) {
    const r = generateLifeActivation(chart, profile, { now });
    assert.strictEqual(r.available, false, `${reason} must not report available`);
    assert.strictEqual(r.reason, reason);
    assert.ok(r.message && r.message.length > 0, 'a human-readable message is required');
    assert.ok(!/NaN|undefined/.test(JSON.stringify(r)), 'no NaN/undefined may reach the client');
    assert.strictEqual(r.overallActivation, undefined, 'no fabricated 0% score');
  }
});

test('LA-engine: a missing factor redistributes weight instead of scoring 0', () => {
  const now = at('2026-07-17T12:00:00+05:30');
  const noVarga = fakeChart({ varga_analysis: undefined });
  const r = generateLifeActivation(noVarga, IST, { admin: true, now });
  assert.strictEqual(r.available, true, 'a missing varga must not kill the whole result');
  assert.ok(r.evidence.missingFactors.includes('divisionalChartSupport'));
  assert.ok(r.evidence.usedWeight < 100, 'weight is redistributed across present factors');
  assert.ok(r.overallActivation.score > 0, 'an absent factor is not an artificial zero');
});

test('LA-engine: missing dasha lowers confidence rather than inventing timing', () => {
  const now = at('2026-07-17T12:00:00+05:30');
  const r = generateLifeActivation(fakeChart({ dasha: [] }), IST, { admin: true, now });
  assert.strictEqual(r.available, true);
  assert.strictEqual(r.overallActivation.confidence, 'LIMITED');
  assert.strictEqual(r.evidence.activeMahadasha, null);
});

test('LA-engine: every required category is reported', () => {
  const r = generateLifeActivation(fakeChart(), IST, { now: at('2026-07-17T12:00:00+05:30') });
  const got = r.categoryScores.map((c) => c.category).sort();
  assert.deepStrictEqual(got, ['business', 'career', 'education', 'finance', 'health', 'marriage', 'spirituality']);
  for (const c of r.categoryScores) {
    if (!c.available) { assert.ok(c.message, `${c.category} must explain itself`); continue; }
    assert.ok(c.score >= 0 && c.score <= 100, `${c.category} score ${c.score} out of range`);
    assert.ok(['HIGH', 'MEDIUM', 'LIMITED'].includes(c.confidence));
    assert.ok(Array.isArray(c.supportingFactors) && Array.isArray(c.contradictingFactors));
  }
});

test('LA-engine: business never claims HIGH confidence (no dedicated strength domain)', () => {
  const r = generateLifeActivation(fakeChart(), IST, { now: at('2026-07-17T12:00:00+05:30') });
  const biz = r.categoryScores.find((c) => c.category === 'business');
  assert.notStrictEqual(biz.confidence, 'HIGH', 'business is scored from houses/karakas only — it must say so');
});

test('LA-engine: upcoming periods carry only REAL dates from the dasha tree', () => {
  const r = generateLifeActivation(fakeChart(), IST, { now: at('2026-07-17T12:00:00+05:30') });
  const maha = r.upcomingPeriods.find((u) => u.type === 'mahadasha');
  assert.strictEqual(maha.planet, 'Jupiter');
  assert.strictEqual(maha.start, '2029-12-08', 'the date must come from the chart, not be projected');
  for (const u of r.upcomingPeriods) {
    if (u.type === 'maturity') continue;
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(u.start) && /^\d{4}-\d{2}-\d{2}$/.test(u.end));
  }
});

test('LA-engine: the interpretation copy travels with the payload', () => {
  const r = generateLifeActivation(fakeChart(), IST, { now: at('2026-07-17T12:00:00+05:30') });
  assert.ok(r.copy.chartAlwaysActive.hi.includes('जन्म से सक्रिय'));
  assert.ok(r.copy.maturityMilestone.hi.includes('48'));
  assert.ok(!/निष्क्रिय है/.test(JSON.stringify(r)), 'nothing may say the chart is inactive');
});

test('LA-engine: life stage boundaries follow the maturity ages', () => {
  const now = at('2026-07-17T12:00:00+05:30');
  const stageAt = (dob) => generateLifeActivation(fakeChart(), { ...IST, date_of_birth: dob }, { now }).lifeStage.key;
  assert.strictEqual(stageAt('2016-01-01'), 'FORMATIVE');   // ~10
  assert.strictEqual(stageAt('2006-01-01'), 'LEARNING');    // ~20  (Jupiter 16)
  assert.strictEqual(stageAt('1996-01-01'), 'ESTABLISHMENT'); // ~30 (Moon 24)
  assert.strictEqual(stageAt('1986-01-01'), 'CONSOLIDATION'); // ~40 (Saturn 36)
  assert.strictEqual(stageAt('1970-01-01'), 'INTEGRATION');   // ~56 (Rahu 48)
});
