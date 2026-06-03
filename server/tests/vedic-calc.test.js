const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateVedicChart,
  calculateAshtakoot,
  calculateTransitSummary,
  calculateVargaChart,
  dailyMotionForPlanet,
  isRetrogradePlanet,
  navamshaFromDeg,
  rashiFromDeg,
  nakshatraFromDeg,
  SUPPORTED_VARGA_DIVISIONS,
  vargaPlacementFromDeg,
  vimshottariDasha,
} = require('../src/services/vedic-calc.service');
const { kundliReportPdf, matchmakingReportPdf } = require('../src/services/report.service');
const {
  VARGA_DEFINITIONS,
  MASTER_FAMILY_REFERENCES,
  VARGA_RELATIONSHIP_REFERENCES,
} = require('../src/data/varga-reference');

const rahulSharmaBirth = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  minute: 30,
  second: 0,
  timezone: 5.5,
  latitude: 28.6139,
  longitude: 77.2090,
};

function expectClose(actual, expected, tolerance, label) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

test('calculates the documented Rahul Sharma reference chart', () => {
  const chart = calculateVedicChart(rahulSharmaBirth);

  assert.equal(chart.meta.system, 'Lahiri (Chitra-paksha)');
  assert.equal(chart.ascendant.rashi_en, 'Cancer');
  assert.equal(chart.nakshatra.en, 'Uttara Ashadha');
  assert.equal(chart.nakshatra.pada, 1);

  expectClose(chart.ascendant.longitude, 99.89, 0.15, 'ascendant longitude');
  expectClose(chart.planets.Sun.longitude, 30.4, 0.15, 'Sun sidereal longitude');
  expectClose(chart.planets.Moon.longitude, 269.83, 0.2, 'Moon sidereal longitude');
  expectClose(chart.planets.Venus.longitude, 348.9, 0.2, 'Venus sidereal longitude');
  expectClose(chart.planets.Saturn.longitude, 271.72, 0.2, 'Saturn sidereal longitude');

  assert.equal(chart.planets.Sun.rashi_en, 'Taurus');
  assert.equal(chart.planets.Moon.rashi_en, 'Sagittarius');
  assert.equal(chart.planets.Venus.rashi_en, 'Pisces');
  assert.equal(chart.planets.Saturn.rashi_en, 'Capricorn');
});

test('sets retrograde status and daily motion from apparent sidereal motion', () => {
  const chart = calculateVedicChart(rahulSharmaBirth);

  assert.equal(chart.planets.Sun.is_retrograde, false);
  assert.equal(chart.planets.Moon.is_retrograde, false);
  assert.equal(chart.planets.Mercury.is_retrograde, true);
  assert.equal(chart.planets.Saturn.is_retrograde, true);
  assert.equal(chart.planets.Rahu.is_retrograde, true);
  assert.equal(chart.planets.Ketu.is_retrograde, true);

  assert.ok(chart.planets.Sun.daily_motion > 0);
  assert.ok(chart.planets.Moon.daily_motion > 0);
  assert.ok(chart.planets.Mercury.daily_motion < 0);
  assert.ok(chart.planets.Saturn.daily_motion < 0);
  assert.ok(chart.planets.Rahu.daily_motion < 0);
  assert.ok(chart.planets.Ketu.daily_motion < 0);
});

test('retrograde helpers agree with chart output', () => {
  const chart = calculateVedicChart(rahulSharmaBirth);
  const JD = chart.meta.julian_day;

  for (const planet of Object.keys(chart.planets)) {
    expectClose(
      dailyMotionForPlanet(planet, JD),
      chart.planets[planet].daily_motion,
      0.0001,
      `${planet} daily motion`
    );
    assert.equal(isRetrogradePlanet(planet, JD), chart.planets[planet].is_retrograde);
  }
});

test('maps sidereal longitude to rashi and nakshatra boundaries', () => {
  assert.equal(rashiFromDeg(0).en, 'Aries');
  assert.equal(rashiFromDeg(29.9999).en, 'Aries');
  assert.equal(rashiFromDeg(30).en, 'Taurus');
  assert.equal(rashiFromDeg(359.9999).en, 'Pisces');

  assert.equal(nakshatraFromDeg(0).en, 'Ashwini');
  assert.equal(nakshatraFromDeg(13.3334).en, 'Bharani');
  assert.equal(nakshatraFromDeg(359.9999).en, 'Revati');
});

test('calculates D9 Navamsha placements for the reference chart', () => {
  const chart = calculateVedicChart(rahulSharmaBirth);

  assert.equal(chart.navamsha.ascendant.rashi_en, 'Virgo');
  assert.equal(chart.navamsha.planets.Sun.rashi_en, 'Capricorn');
  assert.equal(chart.navamsha.planets.Moon.rashi_en, 'Sagittarius');
  assert.equal(chart.navamsha.houses[1].rashi_en, 'Virgo');
  assert.equal(chart.divisional_charts.d9.ascendant.rashi_en, 'Virgo');

  assert.equal(navamshaFromDeg(0).rashi_en, 'Aries');
  assert.equal(navamshaFromDeg(3.3334).rashi_en, 'Taurus');
  assert.equal(navamshaFromDeg(30).rashi_en, 'Capricorn');
});

test('calculates the complete supported Varga chart set', () => {
  const chart = calculateVedicChart(rahulSharmaBirth);

  assert.deepEqual(
    Object.keys(chart.varga_charts),
    ['d1','d2','d3','d4','d5','d7','d8','d9','d10','d12','d16','d20','d24','d27','d30','d40','d45','d60']
  );
  assert.deepEqual(Object.keys(chart.divisional_charts), Object.keys(chart.varga_charts));
  assert.equal(SUPPORTED_VARGA_DIVISIONS.length, 18);

  assert.equal(chart.varga_charts.d2.planets.Sun.rashi_en, 'Cancer');
  assert.equal(chart.varga_charts.d10.planets.Sun.rashi_en, 'Capricorn');
  assert.equal(chart.varga_charts.d30.planets.Sun.section_lord, 'Venus');
  assert.equal(chart.varga_charts.d60.planets.Sun.varga_part, 1);

  const d9 = calculateVargaChart(9, chart.ascendant, chart.planets);
  assert.equal(d9.ascendant.rashi_en, chart.navamsha.ascendant.rashi_en);
});

test('maps special Varga boundary rules', () => {
  assert.equal(vargaPlacementFromDeg(0, 2).rashi_en, 'Leo');
  assert.equal(vargaPlacementFromDeg(15, 2).rashi_en, 'Cancer');
  assert.equal(vargaPlacementFromDeg(30, 2).rashi_en, 'Cancer');

  assert.equal(vargaPlacementFromDeg(0, 30).section_lord, 'Mars');
  assert.equal(vargaPlacementFromDeg(6, 30).rashi_en, 'Aquarius');
  assert.equal(vargaPlacementFromDeg(30, 30).section_lord, 'Venus');
  assert.equal(vargaPlacementFromDeg(36, 30).rashi_en, 'Virgo');
});

test('ships Varga reference data for database seeding', () => {
  assert.equal(VARGA_DEFINITIONS.length, 18);
  assert.equal(MASTER_FAMILY_REFERENCES.length, 15);
  assert.ok(VARGA_RELATIONSHIP_REFERENCES.length >= 50);
  assert.equal(VARGA_DEFINITIONS.find((item) => item.code === 'D9').primary_domain, 'Marriage, Spouse, Dharma, Planet Strength');
  assert.equal(VARGA_DEFINITIONS.find((item) => item.code === 'D60').division, 60);
});

test('adds Vimshottari Antardasha periods with deterministic current marking', () => {
  const chart = calculateVedicChart(rahulSharmaBirth);
  const birthDate = new Date(1990, 4, 15, 10, 30, 0);
  const dasha = vimshottariDasha(
    chart.planets.Moon.longitude,
    birthDate,
    new Date('2026-06-02T00:00:00Z')
  );

  assert.equal(dasha.length, 9);
  assert.equal(dasha[0].lord, 'Sun');
  assert.equal(dasha[0].is_birth_balance, true);
  assert.equal(dasha[0].antardasha.length, 9);

  const current = dasha.find((period) => period.is_current);
  assert.equal(current.lord, 'Rahu');
  const antardasha = current.antardasha.find((period) => period.is_current);
  assert.equal(antardasha.lord, 'Venus');
});

test('calculates Mangal Dosha and transit-backed prediction sections', () => {
  const chart = calculateVedicChart(rahulSharmaBirth);
  const gochar = calculateTransitSummary(chart, undefined, new Date('2026-06-02T00:00:00Z'));

  assert.equal(chart.mangal_dosha.has_dosha, true);
  assert.equal(chart.mangal_dosha.severity, 'moderate');
  assert.equal(chart.mangal_dosha.checks.length, 3);

  assert.equal(Object.keys(gochar.planets).length, 9);
  assert.equal(gochar.date, '2026-06-02');
  assert.ok(gochar.highlights.sade_sati);
  assert.ok(gochar.highlights.jupiter_support);

  assert.ok(Array.isArray(chart.predictions.summary_en));
  assert.ok(chart.predictions.summary_en.length >= 5);
  assert.ok(chart.predictions.categories.relationships.length > 0);
});

test('calculates Ashtakoot Guna Milan with Mangal compatibility', () => {
  const boyChart = calculateVedicChart(rahulSharmaBirth);
  const girlChart = calculateVedicChart({
    year: 1992,
    month: 11,
    day: 22,
    hour: 18,
    minute: 15,
    second: 0,
    timezone: 5.5,
    latitude: 19.0760,
    longitude: 72.8777,
  });

  const result = calculateAshtakoot(boyChart, girlChart);

  assert.equal(result.system, 'Ashtakoot Guna Milan');
  assert.equal(result.kootas.length, 8);
  assert.equal(result.max, 36);
  assert.equal(result.total, 17.5);
  assert.equal(result.verdict, 'caution');
  assert.equal(result.mangal_compatible, true);
});

test('generates PDF report buffers for Kundli and Matchmaking exports', () => {
  const boyChart = calculateVedicChart(rahulSharmaBirth);
  const girlChart = calculateVedicChart({
    year: 1992,
    month: 11,
    day: 22,
    hour: 18,
    minute: 15,
    second: 0,
    timezone: 5.5,
    latitude: 19.0760,
    longitude: 72.8777,
  });
  const result = calculateAshtakoot(boyChart, girlChart);

  const kundliPdf = kundliReportPdf({
    name: 'Rahul Sharma',
    date_of_birth: '1990-05-15',
    time_of_birth: '10:30:00',
    place_of_birth: 'New Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone_offset: 5.5,
  }, boyChart);
  const matchPdf = matchmakingReportPdf({
    boy_name: 'Rahul Sharma',
    girl_name: 'Anita Verma',
    status: 'completed',
  }, result);

  assert.ok(Buffer.isBuffer(kundliPdf));
  assert.ok(Buffer.isBuffer(matchPdf));
  assert.equal(kundliPdf.subarray(0, 8).toString(), '%PDF-1.4');
  assert.equal(matchPdf.subarray(0, 8).toString(), '%PDF-1.4');
  assert.ok(kundliPdf.length > 1000);
  assert.ok(matchPdf.length > 1000);
});
