'use strict';
/**
 * No-LLM guards (Stage 2 of the no-LLM pivot — strict).
 *
 * Fails if active runtime code contains any Ollama/Qwen/LLM remnant:
 *  - ollama/qwen/11434//api/generate//api/tags/ai-stream/prewarm/QA_OLLAMA_ANSWER
 *    references anywhere in server/src outside the two NARROW historical
 *    whitelist entries (migrations 045 + 048 — intentional schema history);
 *  - the deleted LLM service files must not exist or be importable;
 *  - the kundli router must expose no ask-question route, and must expose the
 *    deterministic endpoints;
 *  - requiring the deterministic engine must not load any LLM module;
 *  - the question panel must be deterministic-only;
 *  - active configuration (.env.example) must not mention Ollama/Qwen.
 * Runtime proof that deterministic execution needs no network (poisoned fetch)
 * lives in deterministic-qa.test.js.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SERVER = path.join(__dirname, '..');
const SRC = path.join(SERVER, 'src');
const LLM_PATTERN = /ollama|qwen|11434|\/api\/generate|\/api\/tags|ask-question\/ai-stream|ask-question\/prewarm|QA_OLLAMA_ANSWER/i;

// NARROW historical whitelist — intentional migration history ONLY. No runtime
// file may be whitelisted.
const HISTORICAL_WHITELIST = new Map([
  ['migrations/045_kundli_ai_answers.js', 'applied migration history — never deleted'],
  ['migrations/048_drop_kundli_ai_answers.js', 'drops the LLM cache table — name/schema history is intentional'],
]);

const DELETED_FILES = [
  'src/services/ollama.service.js',
  'src/services/kundli-question-ai.service.js',
  'src/services/kundli-ai-cache.service.js',
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.js')) out.push(p);
  }
  return out;
}

test('no LLM reference exists in server/src outside the two historical migrations', () => {
  const offenders = [];
  for (const file of walk(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    const content = fs.readFileSync(file, 'utf8');
    if (LLM_PATTERN.test(content) && !HISTORICAL_WHITELIST.has(rel)) {
      offenders.push(rel);
    }
  }
  assert.deepStrictEqual(offenders, [], `LLM remnants found: ${offenders.join(', ')}`);
});

test('the deleted Ollama files no longer exist and are not importable', () => {
  for (const rel of DELETED_FILES) {
    const abs = path.join(SERVER, rel);
    assert.ok(!fs.existsSync(abs), `${rel} must be deleted`);
    assert.throws(() => require(abs), { code: 'MODULE_NOT_FOUND' });
  }
});

test('no remaining runtime import points at a deleted LLM module', () => {
  const banned = /require\(['"][^'"]*(ollama\.service|kundli-question-ai\.service|kundli-ai-cache\.service)['"]\)/;
  for (const file of walk(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    assert.ok(!banned.test(fs.readFileSync(file, 'utf8')), `${rel} imports a deleted LLM module`);
  }
});

test('kundli router: no ask-question routes remain; deterministic endpoints exist', () => {
  const router = require('../src/routes/kundli.routes.js');
  const paths = router.stack.filter((l) => l.route).map((l) => l.route.path);
  const askQuestion = paths.filter((p) => String(p).includes('ask-question'));
  assert.deepStrictEqual(askQuestion, [], `legacy routes still registered: ${askQuestion.join(', ')}`);
  assert.ok(paths.includes('/qa/catalogue'), 'deterministic catalogue endpoint registered');
  assert.ok(paths.includes('/:id/qa/deterministic'), 'deterministic answer endpoint registered');
});

test('requiring the deterministic engine loads no LLM module into require.cache', () => {
  require('../src/services/deterministic-qa');
  const loaded = Object.keys(require.cache).map((p) => p.split(path.sep).join('/'));
  for (const banned of ['ollama.service.js', 'kundli-question-ai.service.js', 'kundli-ai-cache.service.js']) {
    assert.ok(!loaded.some((p) => p.endsWith(banned)), `${banned} in require.cache`);
  }
});

test('the question panel is deterministic-only (no stream, prewarm, free text, heartbeat, model info)', () => {
  const panel = fs.readFileSync(
    path.join(SERVER, '..', 'ui-main', 'src', 'components', 'KundliQuestionPanel.jsx'), 'utf8');
  for (const banned of ['ai-stream', 'prewarm', 'ask-question', 'fromCharCode(1)', 'getReader', 'Ollama', 'ollama', 'qwen', 'CircleTimer', '<textarea', 'thinking', '11434']) {
    assert.ok(!panel.includes(banned), `panel must not contain "${banned}"`);
  }
  assert.ok(panel.includes('/qa/deterministic'), 'panel calls the deterministic answer endpoint');
  assert.ok(panel.includes('/kundli/qa/catalogue'), 'panel loads the DB catalogue endpoint');
  assert.ok(panel.includes('questionCode'), 'panel submits a predefined question code');
});

test('active configuration mentions no Ollama/Qwen (env example + config)', () => {
  const envExample = fs.readFileSync(path.join(SERVER, '.env.example'), 'utf8');
  assert.ok(!/ollama|qwen|11434/i.test(envExample), '.env.example must not mention Ollama/Qwen');
  // temporary flags are present AND documented with removal points
  assert.ok(envExample.includes('QA_DETERMINISTIC_ANSWER'), 'temporary flag documented');
  assert.ok(envExample.includes('QA_DB_CATALOGUE'), 'temporary flag documented');
  assert.ok(/removed/i.test(envExample), 'flag removal points documented');
});

test('routing has no llm/ollama/ai_fallback result', () => {
  const routing = require('../src/services/deterministic-qa/routing');
  assert.strictEqual(routing.answerPath(), 'deterministic');
  const src = fs.readFileSync(path.join(SRC, 'services', 'deterministic-qa', 'routing.js'), 'utf8');
  assert.ok(!/'llm'|"llm"|ai_fallback/.test(src), 'no llm/ai_fallback branch in routing source');
});

test('seed data files contain no LLM references', () => {
  for (const f of ['question-catalogue.data.js', 'pilot-answer-templates.data.js']) {
    const content = fs.readFileSync(path.join(SRC, 'data', f), 'utf8');
    assert.ok(!LLM_PATTERN.test(content), `${f} references the LLM stack`);
  }
});
