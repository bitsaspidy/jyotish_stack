const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateVedicChart } = require('../src/services/vedic-calc.service');
const {
  CATEGORY_CONFIG,
  generatePrashnaReading,
  gatePrashnaReading,
} = require('../src/services/prashna-engine');
const { parseInput, paidAccessFor, isPrashnaMemberPlan } = require('../src/routes/prashna.routes');
const { optionalAuthenticate } = require('../src/middleware/auth');

function sampleChart() {
  return calculateVedicChart({
    year:2026, month:7, day:6, hour:12, minute:0, second:0,
    timezone:5.5, latitude:28.6139, longitude:77.2090,
  });
}

function sampleReading(category = 'career', chart = sampleChart()) {
  return generatePrashnaReading({
    chart,
    question:'Is this the right time to move forward with this opportunity?',
    category,
    askedAt:'2026-07-06T06:30:00.000Z',
    place:'New Delhi, India',
  });
}

test('Prashna reading returns free, paid and chart sections', () => {
  const reading = sampleReading();
  assert.equal(reading.version, 'prashna-v1');
  assert.equal(reading.question.category, 'career');
  assert.equal(reading.free.visibleSignals.length, 2);
  assert.equal(reading.premium.allSignals.length, 3);
  assert.equal(reading.lockedSections.length, 4);
  assert.ok(reading.chart.ascendant);
  assert.equal(Object.keys(reading.chart.planets).length, 9);
});

test('free access removes premium details on the server', () => {
  const reading = sampleReading();
  const free = gatePrashnaReading(reading, false);
  const paid = gatePrashnaReading(reading, true);
  assert.equal(free.premium, null);
  assert.ok(paid.premium?.technicalDetails);
  assert.ok(free.free.headlineEn);
  assert.ok(free.chart.houses);
});

test('compact Prashna chart does not leak full reports or predictions', () => {
  const reading = sampleReading();
  assert.equal(reading.chart.reports, undefined);
  assert.equal(reading.chart.predictions, undefined);
  assert.equal(reading.chart.life_report, undefined);
  assert.equal(reading.chart.varga_charts, undefined);
});

test('all supported question categories map to a valid house', () => {
  assert.ok(Object.keys(CATEGORY_CONFIG).length >= 10);
  for (const config of Object.values(CATEGORY_CONFIG)) {
    assert.ok(config.house >= 1 && config.house <= 12);
    assert.ok(config.titleEn && config.titleHi && config.adviceEn && config.adviceHi);
  }
});

test('early ascendant marks the situation as unclear', () => {
  const chart = sampleChart();
  chart.ascendant.degree_in_sign = 1.2;
  const reading = sampleReading('general', chart);
  assert.equal(reading.free.tone, 'unclear');
  assert.equal(reading.premium.technicalDetails.clarity, 'low');
});

test('health reading includes a medical-professional safeguard', () => {
  const reading = sampleReading('health');
  assert.match(reading.premium.guidanceEn, /medical professional/i);
  assert.match(reading.premium.guidanceHi, /चिकित्सक/);
});

test('user-facing Prashna language avoids fatalistic promises', () => {
  const reading = sampleReading('marriage');
  const visible = JSON.stringify({ free:reading.free, premium:reading.premium });
  for (const phrase of ['guaranteed', 'certain to happen', 'unavoidable fate', 'definitely yes', 'definitely no']) {
    assert.equal(visible.toLowerCase().includes(phrase), false, `found forbidden phrase: ${phrase}`);
  }
});

test('Prashna gives a direct plain-language answer and category checklist', () => {
  const reading = sampleReading('career');
  assert.match(reading.free.headlineEn, /move forward|check|rush|wait|pause|not yet/i);
  assert.match(reading.free.headlineHi, /आगे बढ़ें|जांचें|जल्दबाज़ी|निर्णय|रुकें|अभी नहीं/);
  assert.equal(reading.premium.nextSteps.length, 3);
  assert.match(reading.premium.nextSteps[0].en, /role|salary|location/i);
  assert.match(reading.premium.nextSteps[0].hi, /भूमिका|वेतन|स्थान/);
});

test('visible Prashna signals explain meaning without house-lord jargon', () => {
  const reading = sampleReading('career');
  const plainSignals = JSON.stringify(reading.premium.allSignals.map(({ titleEn, titleHi, summaryEn, summaryHi }) => ({ titleEn, titleHi, summaryEn, summaryHi })));
  assert.equal(/ascendant lord|question lord|house \d/i.test(plainSignals), false);
  assert.equal(/लग्न स्वामी|प्रश्न स्वामी|भाव \d/.test(plainSignals), false);
  assert.ok(reading.premium.allSignals.every((signal) => signal.technicalEn && signal.technicalHi));
});

test('Prashna input accepts current time and validates required fields', () => {
  const valid = parseInput({
    question:'Will this matter move forward?', category:'general',
    place:'New Delhi, India', latitude:28.6139, longitude:77.2090,
    timezone_offset:5.5, asked_at:new Date().toISOString(),
  });
  assert.ok(valid.values);
  assert.equal(valid.values.category, 'general');

  assert.match(parseInput({}).error, /Question/);
  assert.match(parseInput({
    question:'Will this matter move forward?', category:'invalid', place:'New Delhi',
    latitude:28, longitude:77, timezone_offset:5.5, asked_at:new Date().toISOString(),
  }).error, /category/);
});

test('optional authentication lets stale credentials use the free reading', async () => {
  let nextCalls = 0;
  const next = () => { nextCalls += 1; };
  const res = {
    status() { throw new Error('Optional authentication must not reject a public request.'); },
  };

  await optionalAuthenticate({ headers:{ authorization:'Basic stale-token' } }, res, next);
  await optionalAuthenticate({ headers:{ authorization:'Bearer expired-token' } }, res, next);

  assert.equal(nextCalls, 2);
});

test('only Premium and Yearly plans unlock the complete Prashna reading', () => {
  assert.equal(isPrashnaMemberPlan('Premium'), true);
  assert.equal(isPrashnaMemberPlan('premium'), true);
  assert.equal(isPrashnaMemberPlan('Yearly'), true);
  assert.equal(isPrashnaMemberPlan(' yearly '), true);
  assert.equal(isPrashnaMemberPlan('Basic'), false);
  assert.equal(isPrashnaMemberPlan('Free'), false);
  assert.equal(isPrashnaMemberPlan(null), false);
});

test('authenticated Premium and Yearly user records unlock Prashna without a subscription row', async () => {
  const premium = await paidAccessFor({ id:101, role:'user', plan:'premium' });
  const yearly = await paidAccessFor({ id:102, role:'user', plan:'Yearly' });

  assert.deepEqual(premium, { isPaid:true, planName:'Premium', expiresAt:null });
  assert.deepEqual(yearly, { isPaid:true, planName:'Yearly', expiresAt:null });
});
