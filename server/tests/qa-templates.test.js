'use strict';
/**
 * Stage 1 — pilot template + visibility tests (DB-backed).
 * Verifies the DB-backed template flow end-to-end: readiness of all 10 pilot
 * questions, per-state/per-language template coverage, pilot-only user
 * catalogue (90 hidden), bilingual rendered answers, and the admin readiness
 * view. Skips gracefully when MySQL / seed 035 are unavailable.
 */

const test = require('node:test');
const assert = require('node:assert');
const { before, after } = require('node:test');

const db = require('../src/config/db');
const repo = require('../src/services/deterministic-qa/catalogue-repository');
const { loadRequirement } = require('../src/services/deterministic-qa/requirement-loader');
const readiness = require('../src/services/deterministic-qa/template-readiness');
const { resolveDomain } = require('../src/services/deterministic-qa/domains');
const qa = require('../src/services/deterministic-qa');

const PILOTS = ['Q001', 'Q012', 'Q021', 'Q031', 'Q041', 'Q051', 'Q061', 'Q071', 'Q081', 'Q093'];
const STATES6 = ['highly_favourable', 'favourable', 'moderately_favourable', 'mixed', 'challenging', 'highly_challenging'];

let ready = false;
before(async () => {
  try {
    await db.raw('SELECT 1');
    ready = (await db.schema.hasTable('answer_templates'))
      && Number((await db('answer_templates').count('* as c').first()).c) > 0;
  } catch { ready = false; }
});
after(async () => { try { await db.destroy(); } catch { /* noop */ } });

function guard(t) {
  if (!ready) { t.skip('MySQL or seed 035 unavailable'); return false; }
  return true;
}

test('all 10 pilot questions pass template-readiness (en + hi, all states)', async (t) => {
  if (!guard(t)) return;
  for (const code of PILOTS) {
    const q = await repo.getQuestionByCode(code);
    const requirement = await loadRequirement(code);
    const r = await readiness.checkTemplateReadiness(q, requirement);
    assert.ok(r.ready, `${code} not template-ready: ${JSON.stringify(r.missing)}`);
    assert.ok(r.template_version >= 1, `${code} template version traceable`);
  }
});

test('direct answers cover every state in both languages for each pilot', async (t) => {
  if (!guard(t)) return;
  // Coverage may now come from EITHER source: a question-specific template row
  // (Q001 names your lagna; Q093 names a planet) or the question's domain family.
  // The six favourability pilots and the two timing pilots intentionally lost
  // their template rows — those shared one generic per-state phrase between eight
  // unrelated life areas, which is exactly what the domain families replaced.
  for (const code of PILOTS) {
    const q = await repo.getQuestionByCode(code);
    const domain = resolveDomain(q);
    const rows = await db('answer_templates')
      .where({ question_code: code, section_key: 'direct_answer', active: true })
      .select('answer_state', 'lang');
    const tmpl = new Set(rows.map((r) => `${r.answer_state}|${r.lang}`));
    const blocks = await db('answer_shared_blocks')
      .where({ active: true }).where('block_key', 'like', `direct_answer.${domain}.%`)
      .select('block_key', 'lang');
    const dom = new Set(blocks.map((b) => `${b.block_key}|${b.lang}`));

    for (const state of STATES6) {
      for (const lang of ['en', 'hi']) {
        const covered = tmpl.has(`${state}|${lang}`) || tmpl.has(`any|${lang}`)
          || dom.has(`direct_answer.${domain}.${state}|${lang}`);
        assert.ok(covered, `${code} (${domain}) direct_answer ${state} ${lang}`);
      }
    }
  }
});

test('user catalogue exposes exactly the 10 pilot questions; the other 90 are hidden', async (t) => {
  if (!guard(t)) return;
  const cats = await qa.getUserFacingCatalogue();
  const codes = cats.flatMap((c) => c.questions.map((q) => q.code)).sort();
  assert.deepStrictEqual(codes, [...PILOTS].sort());
  // categories contain only available questions
  for (const c of cats) assert.ok(c.questions.length > 0, `category ${c.code} has questions`);
  // a non-pilot question is not exposed anywhere in the payload
  const payload = JSON.stringify(cats);
  for (const hiddenCode of ['Q002', 'Q050', 'Q100']) assert.ok(!payload.includes(hiddenCode), `${hiddenCode} hidden`);
});

test('non-pilot questions cannot be answered (hidden = not found)', async (t) => {
  if (!guard(t)) return;
  const r = await qa.resolveQuestion({ questionCode: 'Q002' });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'question_not_found');
});

test('admin catalogue lists all 100 with computed readiness', async (t) => {
  if (!guard(t)) return;
  const adminView = await qa.getAdminCatalogue();
  assert.strictEqual(adminView.questions.length, 100);
  const pilotRows = adminView.questions.filter((q) => q.readiness === 'pilot');
  const plannedRows = adminView.questions.filter((q) => q.readiness === 'planned');
  assert.strictEqual(pilotRows.length, 10);
  assert.strictEqual(plannedRows.length, 90);
  assert.deepStrictEqual(pilotRows.map((q) => q.code).sort(), [...PILOTS].sort());
});

test('rendered pilot answers are bilingual, template-sourced and score-free', async (t) => {
  if (!guard(t)) return;
  const p = await db('kundli_profiles').whereNotNull('calculated_data').whereNotNull('user_id')
    .select('uuid', 'user_id').first();
  if (!p) { t.skip('no owned calculated Kundli'); return; }
  for (const code of ['Q001', 'Q093', 'Q041']) {
    const r = await qa.answerQuestion({ questionCode: code, kundliUuid: p.uuid, userId: p.user_id, atDate: new Date('2026-07-12') });
    assert.ok(r.ok, `${code}: ${r.reason}`);
    // Hindi and English render for every section
    for (const s of r.answer.sections) {
      assert.ok(s.text_en && s.text_en.trim(), `${code}/${s.key} en`);
      assert.ok(s.text_hi && s.text_hi.trim(), `${code}/${s.key} hi`);
      assert.ok(!/\{\{\w+\}\}/.test(s.text_en + s.text_hi), `${code}/${s.key} no unfilled placeholders`);
    }
    // headline + state label + confidence bilingual
    assert.ok(r.answer.headline.en && r.answer.headline.hi);
    assert.ok(r.answer.state_label.en && r.answer.state_label.hi);
    // provenance in trace only
    assert.ok(r.trace.templates_used.length > 0);
    assert.ok(!JSON.stringify(r.answer).includes('templates_used'));
  }
});
