'use strict';
/**
 * No-LLM guards (Stage 1 — enforced now, tightened at Stage 2).
 *
 * Static + runtime proof that the deterministic path has zero LLM involvement:
 *  - the deterministic-qa module tree never imports the Ollama client;
 *  - every ollama/qwen/11434 reference in server/src sits in an EXPLICITLY
 *    whitelisted file (each listed with its Stage-2 fate — no broad globs);
 *  - the new question panel makes no ai-stream/prewarm/free-text/heartbeat use;
 *  - the deterministic pipeline runs with global.fetch poisoned (any HTTP —
 *    including :11434 — would throw), covered in deterministic-qa.test.js.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'src');
const LLM_PATTERN = /ollama|qwen|11434/i;

// Stage-1 whitelist: files that may still reference Ollama, each with the
// reason + its fate. Anything NOT here that mentions Ollama fails the test.
const STAGE1_WHITELIST = new Map([
  ['services/ollama.service.js',            'legacy LLM client — DELETED in Stage 2'],
  ['services/kundli-question-ai.service.js','legacy prompt builder — DELETED in Stage 2'],
  ['services/kundli-ai-cache.service.js',   'legacy answer cache — DELETED in Stage 2'],
  ['routes/kundli.routes.js',               'legacy ai-stream/prewarm routes retained for reversibility — REMOVED in Stage 2'],
  ['migrations/045_kundli_ai_answers.js',   'applied migration history — file kept forever; table dropped by staged 048'],
  ['migrations-staged/048_drop_kundli_ai_answers.js', 'prepared drop migration — activated in Stage 2'],
  ['config/deterministic-qa.config.js',     'QA_OLLAMA_ANSWER flag — REMOVED in Stage 2'],
  ['services/deterministic-qa/routing.js',  'llm routing branch behind the flag — REMOVED in Stage 2'],
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.js')) out.push(p);
  }
  return out;
}

test('every Ollama/Qwen/11434 reference in server/src is explicitly whitelisted', () => {
  const offenders = [];
  for (const file of walk(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    const content = fs.readFileSync(file, 'utf8');
    if (LLM_PATTERN.test(content) && !STAGE1_WHITELIST.has(rel)) offenders.push(rel);
  }
  assert.deepStrictEqual(offenders, [], `unwhitelisted LLM references: ${offenders.join(', ')}`);
});

test('the deterministic-qa module tree never imports the Ollama client', () => {
  // static: no deterministic-qa file mentions ollama/qwen except the flagged
  // routing branch (whitelisted above, removed in Stage 2)
  const dir = path.join(SRC, 'services', 'deterministic-qa');
  for (const file of walk(dir)) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    if (rel === 'services/deterministic-qa/routing.js') continue;
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(!LLM_PATTERN.test(content), `${rel} references the LLM stack`);
  }
  // runtime: requiring the engine must not load the Ollama client module
  require('../src/services/deterministic-qa');
  const loaded = Object.keys(require.cache).map((p) => p.split(path.sep).join('/'));
  for (const banned of ['services/ollama.service.js', 'services/kundli-question-ai.service.js', 'services/kundli-ai-cache.service.js']) {
    assert.ok(!loaded.some((p) => p.endsWith(banned)), `${banned} was loaded by the deterministic engine`);
  }
});

test('the new question panel is deterministic-only (no stream, prewarm, free text, heartbeat, model info)', () => {
  const panel = fs.readFileSync(
    path.join(__dirname, '..', '..', 'ui-main', 'src', 'components', 'KundliQuestionPanel.jsx'), 'utf8');
  for (const banned of ['ai-stream', 'prewarm', 'ask-question', 'fromCharCode(1)', 'getReader', 'Ollama', 'ollama', 'qwen', 'CircleTimer', '<textarea', 'thinking']) {
    assert.ok(!panel.includes(banned), `panel must not contain "${banned}"`);
  }
  // it must call ONLY the deterministic endpoints
  assert.ok(panel.includes('/qa/deterministic'), 'panel calls the deterministic answer endpoint');
  assert.ok(panel.includes('/kundli/qa/catalogue'), 'panel loads the DB catalogue endpoint');
  assert.ok(panel.includes('questionCode'), 'panel submits a predefined question code');
});

test('seed data files contain no LLM references', () => {
  for (const f of ['question-catalogue.data.js', 'pilot-answer-templates.data.js']) {
    const content = fs.readFileSync(path.join(SRC, 'data', f), 'utf8');
    assert.ok(!LLM_PATTERN.test(content), `${f} references the LLM stack`);
  }
});
