const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const chartModuleUrl = pathToFileURL(
  path.resolve(__dirname, '../../ui-main/src/lib/planetaryChart.mjs')
).href;

test('planetary chart style accepts only north or south', async () => {
  const { normalizePlanetaryChartStyle } = await import(chartModuleUrl);

  assert.equal(normalizePlanetaryChartStyle('north'), 'north');
  assert.equal(normalizePlanetaryChartStyle('south'), 'south');
  assert.equal(normalizePlanetaryChartStyle('unknown'), 'south');
});

test('planet positions are grouped into all twelve Rashis', async () => {
  const { groupPlanetPositionsByRashi } = await import(chartModuleUrl);
  const positions = [
    { planet:'Sun', rashi_num:1 },
    { planet:'Moon', rashi_num:1 },
    { planet:'Jupiter', rashi_num:9 },
    { planet:'Invalid', rashi_num:13 },
  ];
  const grouped = groupPlanetPositionsByRashi(positions);

  assert.equal(Object.keys(grouped).length, 12);
  assert.deepEqual(grouped[1].map((item) => item.planet), ['Sun', 'Moon']);
  assert.deepEqual(grouped[9].map((item) => item.planet), ['Jupiter']);
  assert.equal(Object.values(grouped).flat().some((item) => item.planet === 'Invalid'), false);
});

test('north Indian transit layout has twelve unique non-zero sign regions', async () => {
  const { NORTH_TRANSIT_SIGN_SLOTS } = await import(chartModuleUrl);
  const polygonArea = (points) => Math.abs(points.reduce((sum, [x1, y1], index) => {
    const [x2, y2] = points[(index + 1) % points.length];
    return sum + x1 * y2 - x2 * y1;
  }, 0) / 2);

  assert.deepEqual(NORTH_TRANSIT_SIGN_SLOTS.map((slot) => slot.sign), [1,2,3,4,5,6,7,8,9,10,11,12]);
  assert.equal(new Set(NORTH_TRANSIT_SIGN_SLOTS.map((slot) => JSON.stringify(slot.points))).size, 12);
  assert.equal(NORTH_TRANSIT_SIGN_SLOTS.every((slot) => polygonArea(slot.points) > 0), true);
});
