'use strict';
/**
 * Template readiness validator (Stage 1).
 *
 * A question may be exposed to normal users ONLY when:
 *   - it is active in the catalogue,
 *   - a deterministic pilot rule implementation exists,
 *   - required English templates exist,
 *   - required Hindi templates exist (direct_answer covering all 6 evaluable
 *     states + practical_guidance; headline via template or shared labels),
 *   - the shared section blocks its answer_sections need are present,
 *   - its disclaimer + the insufficient-data block exist.
 *
 * NOTE (temporary approach, owner-approved): readiness is COMPUTED from these
 * checks rather than stored in a dedicated readiness column
 * (planned|pilot|under_review|ready|disabled). Until that column exists, the
 * catalogue `active` flag marks the pilot set and this validator gates
 * exposure; admins see the computed status per question.
 */

const db = require('../../config/db');
const pilot = require('./pilot-rules');
const cfg = require('../../config/deterministic-qa.config');

const STATES = ['highly_favourable', 'favourable', 'moderately_favourable', 'mixed', 'challenging', 'highly_challenging'];
const LANGS = ['en', 'hi'];

// answer_sections key → shared block keys that must exist (any-of groups).
const SECTION_BLOCK_GROUPS = {
  kundli_indicates: [['sec.kundli_indicates.support_and_caution', 'sec.kundli_indicates.support_only', 'sec.kundli_indicates.caution_only', 'sec.kundli_indicates.neutral']],
  dchart_indication: [['sec.dchart.supports', 'sec.dchart.contradicts', 'sec.dchart.mixed_signals', 'sec.dchart.agrees']],
  dasha_influence: [['sec.dasha.maha_antar', 'sec.dasha.maha_only']],
  transit_influence: [['sec.transit.default'], ['frag.transit_line']],
  positive: [['sec.positive.factors', 'sec.positive.no_factors']],
  caution: [['sec.caution.factors', 'sec.caution.no_factors']],
  timing_outlook: [['sec.timing_outlook.supportive', 'sec.timing_outlook.mixed', 'sec.timing_outlook.caution']],
};

async function loadCoverage(questionCode) {
  const [templates, blocks] = await Promise.all([
    db('answer_templates').where({ question_code: questionCode, active: true })
      .select('section_key', 'answer_state', 'lang', 'condition_key', 'template_version'),
    db('answer_shared_blocks').where({ active: true }).select('block_key', 'lang'),
  ]);
  const tset = new Set(templates.map((t) => `${t.section_key}|${t.answer_state}|${t.lang}`));
  const bset = new Set(blocks.map((b) => `${b.block_key}|${b.lang}`));
  return { tset, bset, templates };
}

/**
 * @param {object} question catalogue row (code, disclaimer_type, active)
 * @param {object} requirement normalized requirement (answer_sections)
 * @returns { ready:boolean, missing:string[], template_version:number|null }
 */
async function checkTemplateReadiness(question, requirement) {
  const missing = [];
  const { tset, bset, templates } = await loadCoverage(question.code);

  for (const lang of LANGS) {
    // direct answers must cover every evaluable state (or provide an 'any' row)
    for (const state of STATES) {
      if (!tset.has(`direct_answer|${state}|${lang}`) && !tset.has(`direct_answer|any|${lang}`)) {
        missing.push(`template:direct_answer:${state}:${lang}`);
      }
    }
    // practical guidance
    if ((requirement.answer_sections || []).includes('practical_guidance')
      && !tset.has(`practical_guidance|any|${lang}`)) {
      missing.push(`template:practical_guidance:${lang}`);
    }
    // headline: question template OR complete shared per-state labels
    const hasHeadlineTpl = tset.has(`headline|any|${lang}`);
    if (!hasHeadlineTpl) {
      for (const state of STATES) {
        if (!bset.has(`label.headline.${state}|${lang}`)) missing.push(`headline:${state}:${lang}`);
      }
    }
    // shared section bodies for this question's sections
    for (const sec of requirement.answer_sections || []) {
      const groups = SECTION_BLOCK_GROUPS[sec];
      if (!groups) continue;
      for (const group of groups) {
        if (!group.every((k) => bset.has(`${k}|${lang}`))) missing.push(`shared:${sec}:${lang}`);
      }
    }
    // disclaimer + insufficient-data blocks
    const dKey = cfg.DISCLAIMER_BLOCK[question.disclaimer_type] || cfg.DISCLAIMER_BLOCK.general;
    if (dKey && !bset.has(`${dKey}|${lang}`)) missing.push(`disclaimer:${question.disclaimer_type}:${lang}`);
    if (!bset.has(`insufficient_data|${lang}`)) missing.push(`shared:insufficient_data:${lang}`);
    // state + section labels
    for (const state of [...STATES, 'insufficient_data']) {
      if (!bset.has(`label.state.${state}|${lang}`)) missing.push(`label:state:${state}:${lang}`);
    }
  }

  const version = templates.length ? Math.max(...templates.map((t) => t.template_version)) : null;
  return { ready: missing.length === 0, missing: [...new Set(missing)], template_version: version };
}

/**
 * Computed readiness status for a catalogue question (temporary, in lieu of a
 * dedicated readiness column). 'pilot' = implemented + templates ready + active;
 * 'planned' = not yet implemented/ready; 'disabled' = explicitly inactive AND
 * implemented (kept off deliberately).
 */
async function readinessStatus(question, requirement) {
  const hasRule = pilot.hasRule(question.code);
  if (!hasRule) return { status: 'planned', has_rule: false, templates_ready: false };
  if (!requirement) return { status: 'planned', has_rule: true, templates_ready: false };
  const t = await checkTemplateReadiness(question, requirement);
  if (!t.ready) return { status: 'planned', has_rule: true, templates_ready: false, missing: t.missing };
  return { status: question.active ? 'pilot' : 'disabled', has_rule: true, templates_ready: true, template_version: t.template_version };
}

module.exports = { checkTemplateReadiness, readinessStatus, STATES };
