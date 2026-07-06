'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeQuestion, fallbackAnalysis, normalizeAnalysis } = require('../src/services/question-understanding.service');
const { buildPersonalQuestionContext } = require('../src/services/prashna-personal-context.service');
const { calculateVedicChart } = require('../src/services/vedic-calc.service');

test('normalizes the Python job-offer analysis into the Node contract', async () => {
  const fetchImpl = async () => ({
    ok:true,
    json:async () => ({
      version:'question-understanding-v1', detected_category:'career', selected_category:'career',
      subtype:'job_offer', action_key:'career_job_offer', decision_mode:'timing', language:'en',
      confidence:0.91, is_ambiguous:false, understood_as_en:'whether to accept the job offer',
      understood_as_hi:'नौकरी का प्रस्ताव स्वीकार करना चाहिए या नहीं',
      analysis_mode:'kundli', chart_slugs:['d1','d10'], focus_houses:[1,6,10,11],
      focus_planets:['Sun','Saturn','Mercury'], timing_key:'career', safety_note_key:'career',
    }),
  });
  const result = await analyzeQuestion('Is this the right time to accept the job offer?', 'career', { fetchImpl, mode:'kundli' });
  assert.equal(result.source, 'python');
  assert.equal(result.subtype, 'job_offer');
  assert.equal(result.actionKey, 'career_job_offer');
  assert.equal(result.decisionMode, 'timing');
  assert.equal(result.confidence, 0.91);
  assert.deepEqual(result.chartSlugs, ['d1','d10']);
  assert.equal(result.analysisMode, 'kundli');
});

test('uses a safe deterministic fallback when Python is unavailable', async () => {
  const result = await analyzeQuestion('Should I accept this job offer?', 'career', {
    mode:'kundli',
    fetchImpl:async () => { throw new Error('offline'); },
  });
  assert.equal(result.source, 'fallback');
  assert.equal(result.detectedCategory, 'career');
  assert.equal(result.actionKey, 'career_job_offer');
  assert.deepEqual(result.chartSlugs, ['d1','d10']);
});

test('drops unsafe or unknown chart-routing values from Python', () => {
  const result = normalizeAnalysis({
    detected_category:'education', chart_slugs:['d1','d24','d99','../../secret'],
    focus_houses:[4,5,9,99], focus_planets:['Mercury','Jupiter','Pluto'],
  }, 'Will I clear this examination?', 'general', 'kundli');
  assert.deepEqual(result.chartSlugs, ['d1','d24']);
  assert.deepEqual(result.focusHouses, [4,5,9]);
  assert.deepEqual(result.focusPlanets, ['Mercury','Jupiter']);
});

test('rejects unknown Python enum values during normalization', () => {
  const result = normalizeAnalysis({ detected_category:'invalid', decision_mode:'invalid' }, 'A valid question here', 'finance');
  assert.equal(result.detectedCategory, 'finance');
  assert.equal(result.decisionMode, 'guidance');
});

test('personal context uses the saved Kundli friendly prediction layer', () => {
  const chart = calculateVedicChart({
    year:1990, month:1, day:15, hour:10, minute:30, second:0,
    timezone:5.5, latitude:28.6139, longitude:77.2090,
  });
  const analysis = fallbackAnalysis('Should I accept this job offer?', 'career');
  const context = buildPersonalQuestionContext({
    uuid:'11111111-1111-4111-8111-111111111111', name:'Test User', calculated_data:chart,
  }, 'career', analysis, false);
  assert.equal(context.profileName, 'Test User');
  assert.equal(context.areaKey, 'career');
  assert.ok(context.summaryEn.length > 20);
  assert.ok(context.summaryHi.length > 15);
  assert.equal(context.technical, undefined);
});
