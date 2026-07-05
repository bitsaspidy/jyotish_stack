'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { computePlanetPositions } = require('../src/services/helpers/planet-positions');

const EXPECTED_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

test('planet positions returns all nine grahas in stable order', () => {
  const result = computePlanetPositions('2026-07-05');
  assert.equal(result.date, '2026-07-05');
  assert.deepEqual(result.positions.map((position) => position.planet), EXPECTED_PLANETS);
});

test('every graha has chart-safe sign, longitude, nakshatra and pada values', () => {
  const { positions } = computePlanetPositions('2026-07-05');
  for (const position of positions) {
    assert.ok(position.longitude >= 0 && position.longitude < 360, `${position.planet} longitude`);
    assert.ok(position.rashi_num >= 1 && position.rashi_num <= 12, `${position.planet} rashi`);
    assert.ok(position.rashi_en && position.rashi_hi, `${position.planet} rashi labels`);
    assert.ok(position.nakshatra_en && position.nakshatra_hi, `${position.planet} nakshatra labels`);
    assert.ok(position.pada >= 1 && position.pada <= 4, `${position.planet} pada`);
    assert.match(position.degree_dms, /^\d{1,2}°\d{2}'\d{2}"$/);
  }
});

test('Rahu and Ketu are retrograde and remain opposite each other', () => {
  const { positions } = computePlanetPositions('2026-07-05');
  const rahu = positions.find((position) => position.planet === 'Rahu');
  const ketu = positions.find((position) => position.planet === 'Ketu');
  const separation = Math.abs((((rahu.longitude - ketu.longitude) % 360) + 360) % 360);

  assert.equal(rahu.is_retrograde, true);
  assert.equal(ketu.is_retrograde, true);
  assert.ok(Math.abs(separation - 180) < 0.001, `node separation was ${separation}`);
});

test('planet positions are deterministic for the same date', () => {
  assert.deepEqual(computePlanetPositions('2026-11-08'), computePlanetPositions('2026-11-08'));
});
