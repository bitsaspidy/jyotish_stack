'use strict';
/**
 * Prashna regression (Stage 2 of the no-LLM pivot).
 * The Kundli free-text routes were removed, but Prashna (horary) is a separate
 * non-LLM feature that SHARES question-understanding.service.js and
 * kundli-question.service.js. This suite proves Prashna still works after the
 * removal: its route module registers, its shared services answer, and no LLM
 * module is pulled in anywhere on its require path.
 */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

test('prashna routes module loads and registers its endpoints', () => {
  const router = require('../src/routes/prashna.routes.js');
  const paths = router.stack.filter((l) => l.route).map((l) => l.route.path);
  assert.ok(paths.length > 0, 'prashna routes registered');
});

test('shared question-understanding fallback still analyses a Prashna question', async () => {
  process.env.QUESTION_SERVICE_ENABLED = 'false';   // force the pure-JS fallback
  const { analyzeQuestion } = require('../src/services/question-understanding.service');
  const analysis = await analyzeQuestion('Should I accept this job offer?', 'career', { mode: 'prashna' });
  assert.strictEqual(analysis.detectedCategory, 'career');
  assert.strictEqual(analysis.analysisMode, 'prashna');
  assert.ok(Array.isArray(analysis.chartSlugs) && analysis.chartSlugs.includes('d10'));
  delete process.env.QUESTION_SERVICE_ENABLED;
});

test('prashna engine produces a reading (no LLM involved)', () => {
  const { calculateVedicChart } = require('../src/services/vedic-calc.service');
  const { generatePrashnaReading, CATEGORY_CONFIG } = require('../src/services/prashna-engine');
  assert.ok(CATEGORY_CONFIG.career, 'category config intact');
  const chart = calculateVedicChart({
    year: 2026, month: 7, day: 12, hour: 10, minute: 0, second: 0,
    timezone: 5.5, latitude: 28.6139, longitude: 77.209,
  });
  const reading = generatePrashnaReading({
    chart, question: 'Should I accept this job offer?', category: 'career',
    askedAt: new Date('2026-07-12T10:00:00+05:30'),
  });
  assert.ok(reading, 'reading produced');
});

test('prashna require path loads no LLM module', () => {
  require('../src/routes/prashna.routes.js');
  const loaded = Object.keys(require.cache).map((p) => p.split(path.sep).join('/'));
  for (const banned of ['ollama.service.js', 'kundli-question-ai.service.js', 'kundli-ai-cache.service.js']) {
    assert.ok(!loaded.some((p) => p.endsWith(banned)), `${banned} loaded via Prashna`);
  }
});
