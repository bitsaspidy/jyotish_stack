'use strict';
/**
 * Daily prediction / daily email regression tests.
 *
 * Every case here is a bug that actually shipped and was found by READING A
 * RENDERED EMAIL, not by reading code. None of them threw; they all produced
 * plausible-looking output that was wrong.
 */

const test = require('node:test');
const assert = require('node:assert');

const { generateTodayPrediction } = require('../src/services/helpers/today-prediction');

// Minimal real-shaped chart. Moon rashi + nakshatra drive the personal parts.
function chart(overrides = {}) {
  const planets = {};
  for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']) {
    planets[p] = { rashi_num: 1, dignity: 'Neutral', is_retrograde: false };
  }
  planets.Moon.rashi_num = 9;
  planets.Moon.nakshatra_num = 21;
  return {
    ascendant: { rashi_num: 4 },
    planets,
    dasha: [{
      lord: 'Rahu', start: '2011-12-08', end: '2029-12-08', is_current: true,
      antardasha: [{ lord: 'Sun', start: '2026-06-26', end: '2027-05-21', is_current: true }],
    }],
    yogas_doshas: { yogas: [] },
    varga_analysis: { d1: { overall_status: 'favorable' }, d9: { overall_status: 'mixed' } },
    ...overrides,
  };
}
const AT = new Date('2026-07-20T06:00:00+05:30');

test('DP-chips: the fields the email header reads actually exist', () => {
  // The template read meta.moon_rashi_en / meta.current_md_lord / dasha_guidance.lord —
  // none existed, so the Moon and Dasha chips silently vanished from every email.
  const m = generateTodayPrediction(chart(), AT).meta;
  assert.ok(m.moon_rashi && m.moon_rashi.en && m.moon_rashi.hi, 'moon_rashi must carry en+hi');
  assert.ok(m.dasha && m.dasha.maha, 'dasha.maha must exist for the Dasha chip');
  assert.ok(m.tara && m.tara.name, 'tara.name must exist');
});

test('DP-tara: an inauspicious tara can never be sold as an excellent day', () => {
  // Shipped bug: "🌟 Tara: Pratyak" (an obstacle tara) rendered beside ★★★★★ and
  // "the stars are aligned in your favour".
  const found = { fav: false, unfav: false };
  // Walk a year of dates so both tara polarities are exercised on a real engine.
  for (let d = 0; d < 300 && !(found.fav && found.unfav); d += 1) {
    const at = new Date(AT.getTime() + d * 86400000);
    const m = generateTodayPrediction(chart(), at).meta;
    if (!m.tara) continue;
    if (m.tara.is_favorable === false) {
      found.unfav = true;
      assert.ok(m.score <= 3, `unfavourable tara (${m.tara.name}) must cap the score at 3, got ${m.score}`);
      assert.ok(!/genuinely good day/i.test(m.advice.en), 'advice must not call it a good day');
    }
    if (m.tara.is_favorable === true) found.fav = true;
  }
  assert.ok(found.unfav, 'expected to encounter at least one unfavourable tara in 300 days');
});

test('DP-dupe: the dasha career text appears once, not twice', () => {
  // Shipped bug: the identical Rahu paragraph was printed in the body AND in the
  // Career card of the same email.
  const p = generateTodayPrediction(chart(), AT);
  const careerText = p.meta.dasha_guidance.career_en;
  const probe = careerText.slice(0, 60);
  assert.ok(!p.content_en.includes(probe), 'body must not repeat the Career dasha text');
  assert.ok(p.meta.areas.career.en.includes(probe), 'the Career card keeps it');
});

test('DP-antar: the antardasha is interpreted, not just named', () => {
  const m = generateTodayPrediction(chart(), AT).meta;
  assert.ok(m.dasha.antar, 'this fixture runs an antardasha');
  assert.ok(m.dasha_guidance.antar_note_en, 'an antardasha note must be produced');
  assert.ok(m.dasha_guidance.antar_note_hi, 'and in Hindi');
});

test('DP-grammar: no full stop immediately followed by a dash', () => {
  // Shipped bug: "themes of Soul, authority… and vitality. — this is a period of…"
  const p = generateTodayPrediction(chart(), AT);
  const blob = [p.content_en, p.content_hi, p.meta.dasha_guidance.antar_note_en, p.meta.dasha_guidance.antar_note_hi].join(' ');
  assert.ok(!/[.।]\s*—/.test(blob), `punctuation collision in: ${blob.match(/.{0,60}[.।]\s*—.{0,60}/)}`);
  // And the clause-as-noun-phrase bug: "so this is a period of X is where…"
  assert.ok(!/\bis\s+is\b|recognition is where/i.test(blob), 'broken clause splice');
});

test('DP-parity: Hindi carries the same substance as English', () => {
  // Hindi used to stop at "आप X महादशा में हैं।" while English got a full paragraph.
  const p = generateTodayPrediction(chart(), AT);
  assert.ok(p.content_hi.length > p.content_en.length * 0.4,
    `Hindi body is far shorter than English (${p.content_hi.length} vs ${p.content_en.length})`);
  assert.ok(/महादशा/.test(p.content_hi));
});

test('DP-caution: caution is specific, never the old generic filler', () => {
  const m = generateTodayPrediction(chart(), AT).meta;
  assert.ok(m.caution.en && m.caution.hi, 'caution must be bilingual');
  assert.ok(!/quality over quantity/i.test(m.caution.en), 'the generic filler must be gone');
});

test('DP-advice: advice band always matches the personalised score', () => {
  for (let d = 0; d < 40; d += 1) {
    const m = generateTodayPrediction(chart(), new Date(AT.getTime() + d * 86400000)).meta;
    if (m.score >= 4) assert.ok(/genuinely good/i.test(m.advice.en), `score ${m.score} needs positive advice`);
    else if (m.score <= 2) assert.ok(/patience/i.test(m.advice.en), `score ${m.score} needs cautious advice`);
    assert.strictEqual(m.stars, '★'.repeat(m.score) + '☆'.repeat(5 - m.score));
  }
});

test('DP-planets: planetary positions are attached with both house counts', () => {
  const pp = generateTodayPrediction(chart(), AT).meta.planet_positions;
  assert.ok(pp && Array.isArray(pp.list), 'planet_positions must be present');
  assert.strictEqual(pp.list.length, 9);
  for (const p of pp.list) {
    assert.ok(p.house_from_lagna >= 1 && p.house_from_lagna <= 12, `${p.planet} lagna house out of range`);
    assert.ok(p.house_from_moon >= 1 && p.house_from_moon <= 12, `${p.planet} moon house out of range`);
    assert.ok(['favorable', 'neutral', 'challenging'].includes(p.favour));
    assert.ok(p.rashi_en && p.rashi_hi, 'sign name in both languages');
    assert.ok(p.area_en && p.area_hi, 'life area in both languages');
  }
});

test('DP-hindi-ordinals: house names use classical words, never "2वें भाव"', () => {
  // Hindi ordinals 1–4 are irregular (पहला/दूसरा/तीसरा/चौथा), so "2वें भाव" is not
  // a word. Sweep a month so several Moon houses are exercised.
  for (let d = 0; d < 30; d += 1) {
    const p = generateTodayPrediction(chart(), new Date(AT.getTime() + d * 86400000));
    const blob = [p.content_hi, JSON.stringify(p.meta.planet_positions), JSON.stringify(p.meta.areas)].join(' ');
    const bad = blob.match(/\b[1-4](वें|वाँ|वां|वे)\s*भाव/);
    assert.ok(!bad, `broken Hindi ordinal "${bad && bad[0]}" on day +${d}`);
  }
});

test('DP-hindi-planets: planet names are translated in the Hindi payload', () => {
  // The Dasha chip rendered "दशा: Rahu / Sun" — lords left in English.
  const pp = generateTodayPrediction(chart(), AT).meta.planet_positions;
  for (const p of pp.list) {
    assert.ok(p.planet_hi && p.planet_hi !== p.planet, `${p.planet} needs a Hindi name`);
  }
});

test('DP-safety: no NaN or undefined leaks into the reader-visible text', () => {
  const p = generateTodayPrediction(chart(), AT);
  const blob = JSON.stringify({ c: p.content_en, h: p.content_hi, m: p.meta.advice, k: p.meta.caution, pp: p.meta.planet_positions });
  assert.ok(!/NaN|undefined/.test(blob), 'reader-visible text must be clean');
});

test('DP-missing-moon: a chart without a Moon returns null, never a broken email', () => {
  const c = chart();
  delete c.planets.Moon.rashi_num;
  assert.strictEqual(generateTodayPrediction(c, AT), null);
});
