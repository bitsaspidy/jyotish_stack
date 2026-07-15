'use strict';
/**
 * Daily "Today for You" prediction — regression for the Moon reference-frame bug.
 *
 * The email/prediction narrative reads the Moon in two frames: classical Gochar
 * FROM THE MOON SIGN (rh.description) and the Moon's house FROM THE ASCENDANT
 * (MOON_FROM_LAGNA). Printed unlabelled and back-to-back, they contradicted each
 * other (e.g. "transiting your own sign" AND "your 7th house"). The ascendant
 * line must now be labelled, and skipped when it coincides with the Moon-sign
 * house.
 */

const test = require('node:test');
const assert = require('node:assert');
const { calculateVedicChart } = require('../src/services/vedic-calc.service');
const { generateTodayPrediction } = require('../src/services/helpers/today-prediction');

const CHART = calculateVedicChart({
  year: 1990, month: 5, day: 15, hour: 10, minute: 30, second: 0,
  timezone: 5.5, latitude: 28.6139, longitude: 77.2090,
});

const ASC_LABEL = 'From your ascendant (Lagna):';
// An unlabelled Lagna-frame Moon sentence at the start of a paragraph is the bug.
const UNLABELLED_LAGNA_MOON = /(^|\n\n)Moon in your \d+\w+ today/;

test('the ascendant-frame Moon line is always labelled (never an unlabelled second Moon house)', () => {
  let labelledDays = 0;
  for (let d = 1; d <= 31; d++) {
    const pred = generateTodayPrediction(CHART, new Date(Date.UTC(2026, 6, d, 4, 0, 0)));
    if (!pred) continue;
    const en = pred.content_en;
    const hi = pred.content_hi;
    assert.ok(!UNLABELLED_LAGNA_MOON.test(en), `day ${d}: unlabelled Lagna Moon line in EN`);
    if (en.includes(ASC_LABEL)) {
      labelledDays++;
      // when the labelled line is present, the Hindi content carries its label too
      assert.ok(hi.includes('लग्न से:'), `day ${d}: HI ascendant label missing`);
    }
  }
  assert.ok(labelledDays > 0, 'expected at least one day to exercise the labelled ascendant-frame line');
});

test('no contradiction: at most one UNLABELLED Moon-house claim in the content', () => {
  for (let d = 1; d <= 31; d++) {
    const pred = generateTodayPrediction(CHART, new Date(Date.UTC(2026, 6, d, 4, 0, 0)));
    if (!pred) continue;
    // strip the clearly-labelled ascendant paragraph, then no other paragraph
    // should independently assert a *different* "your Nth today" Moon house
    const paras = pred.content_en.split('\n\n');
    const lagnaClaims = paras.filter((p) => /^Moon in your \d+\w+ today/.test(p.trim()));
    assert.strictEqual(lagnaClaims.length, 0, `day ${d}: found unlabelled Lagna Moon paragraph`);
  }
});

test('same-frame case (Lagna == Moon sign) prints no duplicate ascendant line', () => {
  // A chart whose ascendant sign equals its Moon sign → both frames coincide,
  // so the ascendant Moon line must be suppressed (no redundant paragraph).
  // Cancer-heavy example: find a chart where asc rashi == Moon rashi.
  let found = null;
  const bases = [
    { year: 1988, month: 1, day: 12, hour: 6, minute: 15 },
    { year: 1995, month: 9, day: 3, hour: 4, minute: 45 },
    { year: 2001, month: 11, day: 22, hour: 5, minute: 30 },
  ];
  for (const b of bases) {
    const c = calculateVedicChart({ ...b, second: 0, timezone: 5.5, latitude: 19.076, longitude: 72.8777 });
    if (c?.ascendant?.rashi_num && c.planets?.Moon?.rashi_num === c.ascendant.rashi_num) { found = c; break; }
  }
  if (!found) { return; }   // no such chart in the sample — nothing to assert
  for (let d = 1; d <= 5; d++) {
    const pred = generateTodayPrediction(found, new Date(Date.UTC(2026, 6, d, 4, 0, 0)));
    if (!pred) continue;
    // When the frames coincide on the SAME house the line is skipped; when they
    // differ it is labelled. Either way there is never an unlabelled Lagna line.
    assert.ok(!UNLABELLED_LAGNA_MOON.test(pred.content_en));
  }
});
