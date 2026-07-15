'use strict';
/**
 * Chart-cache freshness contract.
 *
 * ensureCalculatedChart() decides whether a stored chart can be served or must be
 * recalculated. Every condition it checks MUST be a field the calculation
 * actually produces — otherwise it is not a freshness check but a permanent cache
 * miss, and the endpoint recalculates the whole chart (and rewrites a large JSON
 * blob to MySQL) on every single request.
 *
 * That is not hypothetical: the admin copy of this function required
 * `judgement.version === 'judgement-priority-v2'`, which calculateVedicChart()
 * never emits, so the admin Kundli page never once hit its cache. Nothing failed
 * loudly — it was simply always slow. These tests make that class of bug fail.
 */

const test = require('node:test');
const assert = require('node:assert');

const { calculateVedicChart } = require('../src/services/vedic-calc.service');

// The exact field paths each ensureCalculatedChart() copy requires.
const REQUIRED_PATHS = [
  ['reports', 'planet_details'],
  ['reports', 'varga_matrix', 'rows'],
  ['reports', 'planet_assessments'],
  ['reports', 'yoga_dasha_report'],
  ['reports', 'event_timing', 'windows'],
  ['life_report', 'sections'],
  ['varga_analysis', 'd1', 'role_en'],
  ['varga_analysis', 'd60', 'past_life_reading'],
];

const dig = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);

let chart = null;
test('a freshly calculated chart is produced', () => {
  chart = calculateVedicChart({
    year: 1990, month: 6, day: 15, hour: 10, minute: 30, second: 0,
    timezone: 5.5, latitude: 28.6139, longitude: 77.209,
  });
  assert.ok(chart, 'calculateVedicChart must return a chart');
});

test('every field the cache check requires is actually produced by the calculation', () => {
  for (const path of REQUIRED_PATHS) {
    const value = dig(chart, path);
    assert.ok(value != null && value !== false,
      `cache check requires ${path.join('.')} but calculateVedicChart() does not produce it — `
      + 'that guarantees a permanent cache miss (recalculate + DB write on every request)');
  }
});

test('the cache check does NOT require a judgement — the calculation never emits one', () => {
  // The judgement is computed per response by buildFullKundliResponse() from
  // mutable profile fields (gender, marital_status), so it is deliberately not
  // part of the cached chart. Requiring it here can never be satisfied.
  assert.strictEqual(chart.judgement, undefined,
    'if calculateVedicChart() now emits a judgement, revisit whether the cache check should require it');

  const src = require('fs').readFileSync(require.resolve('../src/services/kundli-admin.service'), 'utf8');
  const check = src.slice(src.indexOf('async function ensureCalculatedChart'), src.indexOf('async function ensureCalculatedChart') + 700);
  assert.ok(!/judgement/.test(check),
    'ensureCalculatedChart must not gate on `judgement` — nothing persists it, so the cache would never hit');
});

test('the admin and user cache checks agree — drift between the two copies caused this bug', () => {
  const fs = require('fs');
  const grab = (file) => {
    const src = fs.readFileSync(require.resolve(file), 'utf8');
    const i = src.indexOf('async function ensureCalculatedChart');
    assert.ok(i > -1, `${file} should define ensureCalculatedChart`);
    const body = src.slice(i, src.indexOf('return calcAndSave(profile);', i));
    // normalise: the two copies differ only in comments and `&&` placement
    return body.replace(/\/\/.*$/gm, '').replace(/\s+/g, '').replace(/&&/g, '');
  };
  const admin = grab('../src/services/kundli-admin.service');
  const user = grab('../src/routes/kundli.routes');
  assert.strictEqual(admin, user,
    'the two ensureCalculatedChart() copies have drifted again — one caches and the other does not. '
    + 'Consider extracting a single shared helper.');
});
