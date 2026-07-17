'use strict';
/**
 * Gochar (transit) engine tests.
 *
 * The astrology that matters most is the FROM-MOON favourability verdict, so the
 * classical table gets the most attention. `now` is injected everywhere — a test
 * that read the clock would give different transits every day.
 */

const test = require('node:test');
const assert = require('node:assert');

const { generateTransit, favourFromMoon } = require('../src/services/transit');
const CFG = require('../src/config/transit.config');

// A real-shaped chart. Only Moon rashi + Lagna rashi drive the house counts, so
// the transit result is deterministic for a fixed `now`.
function chart(overrides = {}) {
  const planets = {};
  for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']) {
    planets[p] = { rashi_num: 1, dignity: 'Neutral', is_retrograde: false };
  }
  planets.Moon.rashi_num = 9;   // Sagittarius Moon
  return { ascendant: { rashi_num: 4 }, planets, ...overrides };
}
const at = (iso) => new Date(iso);
const NOW = at('2026-07-17T12:00:00+05:30');

// ── Classical favourability ──────────────────────────────────────────────────

test('TR-favour: matches the classical Gochar table', () => {
  // Saturn is good from the Moon in 3, 6, 11 and challenging elsewhere.
  assert.strictEqual(favourFromMoon('Saturn', 3), 'favorable');
  assert.strictEqual(favourFromMoon('Saturn', 6), 'favorable');
  assert.strictEqual(favourFromMoon('Saturn', 11), 'favorable');
  assert.strictEqual(favourFromMoon('Saturn', 7), 'challenging');
  // Jupiter: 2,5,7,9,11 favourable.
  assert.strictEqual(favourFromMoon('Jupiter', 5), 'favorable');
  assert.strictEqual(favourFromMoon('Jupiter', 6), 'challenging');
});

test('TR-favour: every planet has a favourability list', () => {
  for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']) {
    assert.ok(Array.isArray(CFG.GOCHAR_FAVORABLE[p]) && CFG.GOCHAR_FAVORABLE[p].length, `${p} needs favourable houses`);
  }
});

// ── Config integrity ─────────────────────────────────────────────────────────

test('TR-config: 12 house areas and 9 planet meanings, all bilingual', () => {
  for (let h = 1; h <= 12; h += 1) {
    const a = CFG.HOUSE_AREA[h];
    assert.ok(a && a.en && a.hi && a.area, `house ${h} needs en/hi/area`);
  }
  for (const p of Object.keys(CFG.GOCHAR_FAVORABLE)) {
    const m = CFG.PLANET_TRANSIT[p];
    assert.ok(m && m.en && m.hi, `${p} needs a bilingual transit meaning`);
  }
});

test('TR-config: planet meanings are valence-neutral (no verdict words)', () => {
  // The same phrase is dropped into favourable AND challenging frames, so it must
  // not carry its own verdict. Catch the obvious offenders.
  const banned = /\b(good|bad|lucky|unlucky|blessed|cursed|suffer|reward)\b|शुभ|अशुभ|कष्ट|पीड़ा/i;
  for (const [p, m] of Object.entries(CFG.PLANET_TRANSIT)) {
    assert.ok(!banned.test(m.en), `${p} EN meaning carries a verdict: ${m.en}`);
    assert.ok(!banned.test(m.hi), `${p} HI meaning carries a verdict: ${m.hi}`);
  }
});

// ── Engine ───────────────────────────────────────────────────────────────────

test('TR-engine: deterministic for a fixed instant', () => {
  const a = generateTransit(chart(), { now: NOW });
  const b = generateTransit(chart(), { now: NOW });
  assert.deepStrictEqual(a.planets.map((p) => [p.planet, p.favour, p.house_from_moon]),
    b.planets.map((p) => [p.planet, p.favour, p.house_from_moon]));
});

test('TR-engine: reports all nine planets with both house counts', () => {
  const r = generateTransit(chart(), { now: NOW });
  assert.strictEqual(r.available, true);
  assert.strictEqual(r.planets.length, 9);
  for (const p of r.planets) {
    assert.ok(p.house_from_lagna >= 1 && p.house_from_lagna <= 12);
    assert.ok(p.house_from_moon >= 1 && p.house_from_moon <= 12);
    assert.ok(['favorable', 'neutral', 'challenging'].includes(p.favour));
    assert.ok(p.summary && p.summary.length > 0);
  }
});

test('TR-engine: Hindi uses classical house words, never the "1वें" pattern', () => {
  // This bug shipped once elsewhere; house-label.js is reused to prevent it.
  const r = generateTransit(chart(), { lang: 'hi', now: NOW });
  const joined = r.planets.map((p) => p.summary).join(' ');
  assert.ok(!/\d+वें भाव/.test(joined), `broken ordinal in: ${joined}`);
  assert.ok(/(प्रथम|द्वितीय|नवम|दशम|द्वादश) भाव/.test(joined), 'expected classical house words');
});

test('TR-engine: only admin gets the technical evidence', () => {
  assert.strictEqual(generateTransit(chart(), { admin: false, now: NOW }).evidence, undefined);
  const ev = generateTransit(chart(), { admin: true, now: NOW }).evidence;
  assert.ok(ev && Array.isArray(ev.rows) && ev.rows.length === 9);
  assert.ok(ev.rows[0].rule, 'each row states the rule applied');
  assert.ok(ev.favourability_table, 'the classical table is exposed for audit');
});

test('TR-engine: Sade Sati is flagged when Saturn is 12/1/2 from the Moon', () => {
  // Moon rashi 9 → Saturn in rashi 8/9/10 gives house-from-moon 12/1/2.
  const c = chart();
  c.planets.Saturn.rashi_num = 9; // same as Moon → 1st from Moon → peak
  // The transit engine computes Saturn's CURRENT sky position, not the natal one,
  // so we cannot force it via natal rashi. Instead assert the classifier directly.
  const r = generateTransit(c, { admin: true, now: NOW });
  assert.strictEqual(r.available, true);
  // Whatever the live sky is, a Saturn-from-Moon of 12/1/2 must produce a sade_sati
  // special, and 4/8 a dhaiyya — verify the branch via the evidence row.
  const satMoon = r.evidence.rows.find((x) => x.planet === 'Saturn').house_from_moon;
  const hasSade = r.special.some((s) => s.key === 'sade_sati');
  const hasDhaiyya = r.special.some((s) => s.key === 'dhaiyya');
  if ([12, 1, 2].includes(satMoon)) assert.ok(hasSade, `Saturn at ${satMoon} from Moon must flag Sade Sati`);
  else if ([4, 8].includes(satMoon)) assert.ok(hasDhaiyya, `Saturn at ${satMoon} from Moon must flag Dhaiyya`);
  else assert.ok(!hasSade && !hasDhaiyya, `Saturn at ${satMoon} from Moon must flag neither`);
});

test('TR-engine: never says the chart is inactive', () => {
  const r = generateTransit(chart(), { lang: 'hi', now: NOW });
  assert.ok(r.disclaimer.hi.includes('सदैव सक्रिय'), 'disclaimer must state the chart is always active');
  assert.ok(!/निष्क्रिय है/.test(JSON.stringify(r)));
});

test('TR-engine: missing chart / Moon returns a message, not NaN', () => {
  for (const [c, reason] of [
    [null, 'missing_chart'],
    [{ ascendant: { rashi_num: 1 } }, 'missing_chart'],           // no planets key at all
    [{ planets: {}, ascendant: {} }, 'missing_moon'],             // planets present but no Moon rashi
    [{ planets: { Moon: {} }, ascendant: { rashi_num: 1 } }, 'missing_moon'],
  ]) {
    const r = generateTransit(c, { now: NOW });
    assert.strictEqual(r.available, false);
    assert.strictEqual(r.reason, reason);
    assert.ok(r.message && r.message.length > 0);
    assert.ok(!/NaN|undefined/.test(JSON.stringify(r)));
  }
});

test('TR-engine: user and admin agree on the astrology', () => {
  const u = generateTransit(chart(), { admin: false, now: NOW });
  const a = generateTransit(chart(), { admin: true, now: NOW });
  assert.deepStrictEqual(
    u.planets.map((p) => [p.planet, p.favour, p.house_from_lagna, p.house_from_moon]),
    a.planets.map((p) => [p.planet, p.favour, p.house_from_lagna, p.house_from_moon]),
  );
});
