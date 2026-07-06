'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateVedicChart } = require('../src/services/vedic-calc.service');
const { fallbackAnalysis, normalizeAnalysis } = require('../src/services/question-understanding.service');
const { buildKundliQuestionAnswer, toneFromScore, safetyNote } = require('../src/services/kundli-question.service');
const { parseKundliQuestion } = require('../src/routes/kundli.routes');

function chartFixture() {
  return calculateVedicChart({
    year:1990, month:5, day:15, hour:10, minute:30, second:0,
    timezone:5.5, latitude:28.6139, longitude:77.2090,
  });
}

test('builds a job-offer answer from the owned Kundli D1 and D10 lenses', () => {
  const chart = chartFixture();
  const analysis = fallbackAnalysis('Should I accept this job offer?', 'career', 'kundli');
  const result = buildKundliQuestionAnswer({
    chart,
    profile:{ uuid:'11111111-1111-4111-8111-111111111111', name:'Test User' },
    question:'Should I accept this job offer?',
    analysis,
  });
  assert.equal(result.version, 'kundli-question-v1');
  assert.equal(result.question.subtype, 'job_offer');
  assert.deepEqual(result.chartLenses.map((item) => item.slug), ['d1','d10']);
  assert.ok(result.answer.textEn.includes('job offer'));
  assert.match(result.nextSteps[0].en, /written role/i);
  assert.equal(result.technical, undefined);
});

test('routes education questions through D24 and returns the relevant timing window', () => {
  const chart = chartFixture();
  const analysis = normalizeAnalysis({
    detected_category:'education', selected_category:'general', subtype:'exam', action_key:'education_exam',
    decision_mode:'timing', confidence:0.9, understood_as_en:'the examination outcome',
    understood_as_hi:'परीक्षा का परिणाम', analysis_mode:'kundli', chart_slugs:['d1','d24'],
    focus_houses:[4,5,9], focus_planets:['Mercury','Jupiter'], timing_key:'education_spiritual', safety_note_key:'education',
  }, 'When will I clear this examination?', 'general', 'kundli');
  const result = buildKundliQuestionAnswer({ chart, profile:{ name:'Learner' }, question:'When will I clear this examination?', analysis });
  assert.deepEqual(result.chartLenses.map((item) => item.slug), ['d1','d24']);
  assert.ok(result.timing);
  assert.doesNotMatch(result.timing.textEn, /mahadasha|antardasha/i);
  assert.ok(result.nextSteps.length >= 3);
});

test('technical routing factors are exposed only when explicitly requested for admin', () => {
  const chart = chartFixture();
  const analysis = fallbackAnalysis('Should I accept this job offer?', 'career', 'kundli');
  const result = buildKundliQuestionAnswer({ chart, profile:{ name:'Admin Test' }, question:'Should I accept this job offer?', analysis, includeTechnical:true });
  assert.deepEqual(result.technical.focusHouses, [1,6,10,11]);
  assert.deepEqual(result.technical.focusPlanets, ['Sun','Saturn','Mercury']);
});

test('general career questions receive career-development steps instead of decision boilerplate', () => {
  const chart = chartFixture();
  const analysis = normalizeAnalysis({
    detected_category:'career', subtype:'general', action_key:'career_general', decision_mode:'guidance',
    confidence:0.82, understood_as_en:'career direction and suitable work', understood_as_hi:'करियर की दिशा और उपयुक्त कार्य',
    analysis_mode:'kundli', chart_slugs:['d1','d10'], timing_key:'career', safety_note_key:'career',
  }, 'What career is best for me?', 'general', 'kundli');
  const result = buildKundliQuestionAnswer({ chart, profile:{ name:'Career Test' }, question:'What career is best for me?', analysis });
  assert.match(result.nextSteps[0].en, /work you do well/i);
  assert.doesNotMatch(result.question.understoodAsEn, /change/i);
});

test('high-stakes topics include explicit safety boundaries', () => {
  assert.match(safetyNote('health')[0], /cannot diagnose/i);
  assert.match(safetyNote('legal')[0], /not legal advice/i);
  assert.match(safetyNote('finance')[0], /not investment advice/i);
  assert.equal(toneFromScore(70), 'supportive');
  assert.equal(toneFromScore(40), 'caution');
});

test('question route input trims whitespace and rejects invalid payloads', () => {
  assert.deepEqual(parseKundliQuestion({ question:'  Should   I change my job now?  ' }), {
    question:'Should I change my job now?', category:'general',
  });
  assert.match(parseKundliQuestion({ question:'Short' }).error, /between 8 and 500/);
  assert.match(parseKundliQuestion({ question:'Should I change my job now?', category:'unknown' }).error, /category/i);
});
