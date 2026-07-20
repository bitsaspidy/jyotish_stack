'use strict';
/**
 * Public Grah Gochar (/planetary-positions) tests.
 *
 * The load-bearing constraint here is HONESTY: this endpoint has no birth chart,
 * so nothing it returns may claim to know anything about a specific reader.
 */

const test = require('node:test');
const assert = require('node:assert');

const { computePlanetPositions } = require('../src/services/helpers/planet-positions');
const CFG = require('../src/config/gochar-public.config');

const DATE = '2026-07-20';
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

test('PP-plain: the unenriched payload is unchanged for existing callers', () => {
  // The panchang/chart callers must keep the original shape and must not pay for
  // the sign-window scans.
  const r = computePlanetPositions(DATE);
  assert.strictEqual(r.positions.length, 9);
  for (const p of r.positions) {
    assert.ok(p.rashi_en && p.nakshatra_en && p.degree_dms);
    assert.strictEqual(p.effect, undefined, 'plain mode must not carry a reading');
    assert.strictEqual(p.transit_window, undefined);
  }
  assert.strictEqual(r.personal_gap, undefined);
});

test('PP-enrich: every planet gets a standing, a reading and a window', () => {
  const r = computePlanetPositions(DATE, { enrich: true });
  assert.strictEqual(r.positions.length, 9);
  for (const p of r.positions) {
    assert.ok(p.effect.en && p.effect.hi, `${p.planet} needs a bilingual reading`);
    assert.ok(['strong', 'neutral', 'weak'].includes(p.dignity_tone), `${p.planet} tone`);
    assert.ok(p.dignity_label && p.dignity_label.en && p.dignity_label.hi, `${p.planet} badge`);
    assert.ok(['dignity', 'relation', 'neutral'].includes(p.standing_source));
    assert.ok(p.transit_window, `${p.planet} window`);
  }
});

test('PP-astrology: dignity is the canonical engine result', () => {
  // Jupiter exalts in Cancer, Mercury owns Gemini — spot-check that the reading
  // agrees with the chart engine rather than a second, drifting table.
  const r = computePlanetPositions(DATE, { enrich: true });
  const jup = r.positions.find((p) => p.planet === 'Jupiter');
  if (jup.rashi_num === 4) assert.strictEqual(jup.dignity_key, 'exalted', 'Jupiter in Cancer is exalted');
  const mer = r.positions.find((p) => p.planet === 'Mercury');
  if (mer.rashi_num === 3 || mer.rashi_num === 6) assert.strictEqual(mer.dignity_key, 'own');
});

test('PP-nodes: Rahu/Ketu never get a fabricated sign-lord friendship', () => {
  // They rule no sign, so a friendship verdict would be invented.
  const r = computePlanetPositions(DATE, { enrich: true });
  for (const name of ['Rahu', 'Ketu']) {
    const p = r.positions.find((x) => x.planet === name);
    assert.strictEqual(p.sign_lord, null, `${name} must not claim a sign lord relation`);
    assert.strictEqual(p.retrograde_note, null, `${name} is always retrograde — daily flagging is noise`);
    assert.strictEqual(p.is_retrograde, true);
  }
});

test('PP-combust: the Sun is never combust, and orbs are respected', () => {
  const r = computePlanetPositions(DATE, { enrich: true });
  const sun = r.positions.find((p) => p.planet === 'Sun');
  assert.strictEqual(sun.is_combust, false, 'the Sun cannot be combust by itself');
  for (const p of r.positions) {
    if (p.is_combust) assert.ok(p.sun_separation != null && p.sun_separation < 20, `${p.planet} combust at ${p.sun_separation}°`);
  }
});

test('PP-window: transit dates are real and ordered', () => {
  const r = computePlanetPositions(DATE, { enrich: true });
  for (const p of r.positions) {
    const w = p.transit_window;
    if (w.entered_on) assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(w.entered_on), `${p.planet} entry date`);
    if (w.leaves_on) {
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(w.leaves_on), `${p.planet} exit date`);
      assert.ok(w.leaves_on >= DATE, `${p.planet} cannot leave in the past`);
      assert.ok(w.days_remaining >= 0, `${p.planet} days_remaining must not be negative`);
    }
    if (w.entered_on && w.leaves_on) assert.ok(w.entered_on < w.leaves_on);
  }
});

test('PP-honesty: nothing claims to know the anonymous reader', () => {
  // This page has no chart. A phrase like "your career" here would be a lie.
  const r = computePlanetPositions(DATE, { enrich: true });
  const blob = r.positions.map((p) => `${p.effect.en} ${p.effect.hi}`).join(' ');
  assert.ok(!/\byour (career|marriage|health|money|life|house|chart)\b/i.test(blob),
    'the sky reading must not address the reader\'s own life');
  assert.ok(!/आपक[ेीा] (करियर|विवाह|स्वास्थ्य|कुंडली|जीवन)/.test(blob),
    'same in Hindi');
  // …and the gap is stated explicitly instead.
  assert.ok(r.personal_gap && r.personal_gap.body.en && r.personal_gap.body.hi);
  assert.ok(/depends on/i.test(r.personal_gap.body.en));
});

test('PP-neutral-copy: planet significations carry no verdict', () => {
  // They are composed under strong AND weak standings.
  const banned = /\b(good|bad|lucky|unlucky|blessed|suffer)\b|शुभ|अशुभ|कष्ट/i;
  for (const [p, m] of Object.entries(CFG.PLANET_SIGNIFIES)) {
    assert.ok(!banned.test(m.en), `${p} EN carries a verdict`);
    assert.ok(!banned.test(m.hi), `${p} HI carries a verdict`);
  }
});

test('PP-hindi: the composed sentence has a verb and no word collision', () => {
  const r = computePlanetPositions(DATE, { enrich: true });
  for (const p of r.positions) {
    assert.ok(/प्रकट हो रहे हैं/.test(p.effect.hi), `${p.planet} Hindi needs its verb`);
    assert.ok(!/प्रकट[^।]*प्रकट हो रहे/.test(p.effect.hi), `${p.planet} repeats प्रकट`);
    assert.ok(!/[.।]\s*—/.test(p.effect.hi), `${p.planet} punctuation collision`);
  }
});

test('PP-upagraha: all five are computed, from the Sun alone', () => {
  const r = computePlanetPositions(DATE, { enrich: true });
  const slugs = r.upagrahas.map((u) => u.slug);
  assert.deepStrictEqual(slugs.sort(), ['dhuma', 'indrachapa', 'parivesha', 'upaketu', 'vyatipata']);
  for (const u of r.upagrahas) {
    assert.ok(u.rashi_num >= 1 && u.rashi_num <= 12, `${u.slug} sign`);
    assert.ok(u.rashi_en && u.rashi_hi && u.degree_dms, `${u.slug} position`);
    assert.ok(u.nakshatra_en && u.pada >= 1 && u.pada <= 4, `${u.slug} nakshatra`);
  }
});

test('PP-upagraha: positions follow the classical Sun-derived formulae', () => {
  // Dhuma = Sun + 133°20'; Vyatipata = 360 − Dhuma; Parivesha = Vyatipata + 180;
  // Indrachapa = 360 − Parivesha; Upaketu = Indrachapa + 16°40'.
  const r = computePlanetPositions(DATE, { enrich: true });
  const sun = r.positions.find((p) => p.planet === 'Sun').longitude;
  const by = Object.fromEntries(r.upagrahas.map((u) => [u.slug, u.longitude]));
  const mod = (v) => ((v % 360) + 360) % 360;
  const near = (a, b) => assert.ok(Math.abs(mod(a - b)) < 0.02 || Math.abs(mod(a - b) - 360) < 0.02,
    `expected ${b.toFixed(4)}, got ${a.toFixed(4)}`);
  near(by.dhuma, mod(sun + 133 + 20 / 60));
  near(by.vyatipata, mod(360 - by.dhuma));
  near(by.parivesha, mod(by.vyatipata + 180));
  near(by.indrachapa, mod(360 - by.parivesha));
  near(by.upaketu, mod(by.indrachapa + 16 + 40 / 60));
});

test('PP-upagraha: absent from the plain payload', () => {
  // They belong to the enriched public reading, not to the panchang/chart callers.
  assert.strictEqual(computePlanetPositions(DATE).upagrahas, undefined);
});

test('PP-upagraha: no house placement is claimed without a Lagna', () => {
  // Houses need an ascendant, which a public page does not have.
  const r = computePlanetPositions(DATE, { enrich: true });
  for (const u of r.upagrahas) {
    assert.strictEqual(u.house, undefined, `${u.slug} must not claim a house`);
    assert.strictEqual(u.house_num, undefined);
  }
});

test('PP-safety: no NaN or undefined reaches the page', () => {
  const r = computePlanetPositions(DATE, { enrich: true });
  assert.ok(!/NaN|undefined/.test(JSON.stringify(r)));
});

test('PP-determinism: the same date always gives the same reading', () => {
  const a = computePlanetPositions(DATE, { enrich: true });
  const b = computePlanetPositions(DATE, { enrich: true });
  assert.deepStrictEqual(
    a.positions.map((p) => [p.planet, p.dignity_key, p.effect.en]),
    b.positions.map((p) => [p.planet, p.dignity_key, p.effect.en]),
  );
});

test('PP-coverage: all 12 signs and 9 planets have content', () => {
  for (let s = 1; s <= 12; s += 1) {
    const st = CFG.SIGN_STYLE[s];
    assert.ok(st && st.manner.en && st.manner.hi && st.wants.en && st.wants.hi, `sign ${s}`);
  }
  for (const p of PLANETS) assert.ok(CFG.PLANET_SIGNIFIES[p], `planet ${p}`);
});
