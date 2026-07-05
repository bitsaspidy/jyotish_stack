'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { composePredictionUserFriendly } = require('../src/services/report-engine/prediction-humanizer');

function chartFixture() {
  return {
    ascendant:{ rashi_num:10, rashi_en:'Capricorn', rashi_hi:'मकर' },
    planets:{ Moon:{ rashi_num:4, rashi_en:'Cancer', rashi_hi:'कर्क' } },
    nakshatra:{ en:'Pushya', hi:'पुष्य', lord:'Saturn', pada:2 },
    dasha:[{
      lord:'Saturn', is_current:true, end:'2031-08-12',
      antardasha:[{ lord:'Mercury', is_current:true, end:'2027-02-20' }],
    }],
    gochar:{ highlights:{
      sade_sati:{ active:true, phase:'rising' },
      jupiter_support:{ favorable:true, house_from_moon:9 },
      rahu_ketu_axis:'2-8',
    } },
    mangal_dosha:{ has_dosha:true, severity:'moderate' },
    predictions:{
      life_areas:{
        career:{ outlook:'positive', description_en:'Saturn Mahadasha opens long-term career progress.' },
        relationships:{ outlook:'needs attention', description_en:'Mangal Dosha needs care.' },
        health:{ outlook:'stable', description_en:'Health is steady.' },
        finance:{ outlook:'mixed', description_en:'Finances need planning.' },
        spirituality:{ outlook:'deeply active', description_en:'Inner growth is supported.' },
      },
      current_challenges:['Sade Sati needs patience'],
    },
  };
}

function visibleStrings(value, key = '') {
  if (key === 'technicalDetails') return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((item) => visibleStrings(item));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([childKey, child]) => visibleStrings(child, childKey));
}

test('prediction humanizer returns the complete user-friendly shape', () => {
  const result = composePredictionUserFriendly(chartFixture());
  assert.equal(result.version, 'prediction-friendly-v1');
  assert.ok(result.overview);
  assert.ok(result.currentPhase);
  assert.equal(result.lifeAreas.length, 5);
  assert.ok(result.opportunities.length >= 3);
  assert.ok(result.cautions.length >= 2);
  assert.equal(result.transits.items.length, 3);
});

test('overview explains personality without exaggerated claims', () => {
  const { overview } = composePredictionUserFriendly(chartFixture());
  assert.match(overview.summaryEn, /approach life/i);
  assert.equal(overview.strengthsEn.length, 2);
  assert.equal(overview.careEn.length, 2);
  assert.doesNotMatch(overview.summaryEn, /born to|most .* alive|unstoppable|kingly/i);
});

test('current phase uses plain labels while retaining the active planets', () => {
  const { currentPhase } = composePredictionUserFriendly(chartFixture());
  assert.equal(currentPhase.mainPlanet, 'Saturn');
  assert.equal(currentPhase.supportingPlanet, 'Mercury');
  assert.match(currentPhase.summaryEn, /bigger direction/i);
  assert.doesNotMatch(currentPhase.summaryEn, /Mahadasha|Antardasha/i);
});

test('life areas have safe status labels and practical advice', () => {
  const { lifeAreas } = composePredictionUserFriendly(chartFixture());
  const statuses = new Set(['supported', 'balanced', 'care']);
  for (const area of lifeAreas) {
    assert.ok(statuses.has(area.statusKey));
    assert.ok(area.summaryEn.length > 25);
    assert.ok(area.summaryHi.length > 15);
    assert.ok(area.adviceEn.length > 20);
    assert.ok(area.adviceHi.length > 15);
  }
  assert.equal(lifeAreas.find((area) => area.key === 'career').statusKey, 'supported');
  assert.equal(lifeAreas.find((area) => area.key === 'relationships').statusKey, 'care');
});

test('customer-visible prediction text contains no technical astrology jargon', () => {
  const result = composePredictionUserFriendly(chartFixture());
  const text = visibleStrings(result).join(' ');
  assert.doesNotMatch(text, /\b(?:Mahadasha|Antardasha|Sade Sati|Mangal Dosha|Gochar|Rahu-Ketu axis|Dusthana|Trik Sthan|Paap Kartari|Debilitation|Combustion|Affliction|Karmic|Moksha)\b/i);
});

test('customer-visible prediction text contains no fear-based language', () => {
  const result = composePredictionUserFriendly(chartFixture());
  const text = visibleStrings(result).join(' ');
  assert.doesNotMatch(text, /death|divorce is certain|ruin|cursed|disaster|no hope|fatal/i);
});

test('Hindi customer fields contain Devanagari', () => {
  const result = composePredictionUserFriendly(chartFixture());
  assert.match(result.overview.summaryHi, /[\u0900-\u097F]/);
  assert.match(result.currentPhase.summaryHi, /[\u0900-\u097F]/);
  assert.ok(result.lifeAreas.every((area) => /[\u0900-\u097F]/.test(area.summaryHi)));
  assert.ok(result.transits.items.every((item) => /[\u0900-\u097F]/.test(item.summaryHi)));
});

test('technical source data is preserved without mutation', () => {
  const chart = chartFixture();
  const before = JSON.stringify(chart.predictions);
  const result = composePredictionUserFriendly(chart);
  assert.equal(result.technicalDetails, chart.predictions);
  assert.equal(JSON.stringify(chart.predictions), before);
});

test('humanizer handles a minimal chart safely', () => {
  const result = composePredictionUserFriendly({});
  assert.ok(result);
  assert.equal(result.lifeAreas.length, 5);
  assert.equal(result.currentPhase.mainPlanet, 'Sun');
});

test('humanizer returns null when no chart is supplied', () => {
  assert.equal(composePredictionUserFriendly(null), null);
});
