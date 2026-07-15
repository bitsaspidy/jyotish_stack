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
const { resolveDomain, disclaimerTypeFor } = require('./domains');

const STATES = ['highly_favourable', 'favourable', 'moderately_favourable', 'mixed', 'challenging', 'highly_challenging'];
const LANGS = ['en', 'hi'];
const PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

/**
 * answer_sections key → shared block groups that must exist, given the question's
 * DOMAIN. Each inner array is an any-of group; every group must be satisfied.
 *
 * These are the blocks without which a section would render empty or generic. The
 * evidence section requires the full nine planet meanings for the domain on
 * purpose: a relevant house lord can be any planet, and a house lord is primary
 * evidence — so a domain missing even one meaning could show a reader a factor it
 * cannot explain. That is precisely the failure this gate exists to prevent, and
 * it is what keeps the nine unseeded domains correctly hidden.
 */
function sectionBlockGroups(domain) {
  return {
    kundli_indicates: [
      ['frag.factor.strong', 'frag.factor.moderate', 'frag.factor.weak'],
      ['frag.factor.multi_role.strong', 'frag.factor.multi_role.moderate', 'frag.factor.multi_role.weak'],
      ['frag.role.house_lord', 'frag.role.karaka'],
      PLANETS.map((p) => `meaning.${p}.${domain}`),
    ],
    dasha_influence: [['sec.dasha.maha_antar', 'sec.dasha.maha_only']],
    transit_influence: [['sec.transit.default'], ['frag.transit_line']],
    positive: [['sec.positive.no_factors']],
    caution: [[`caution.${domain}`]],
    // Mirrors the composer's fallback chain: a domain without its own timing voice
    // legitimately borrows the general one, so either satisfies the gate.
    timing_outlook: [
      [`timing.${domain}.current.supportive`, `timing.${domain}.current.mixed`, `timing.${domain}.current.caution`,
        'timing.general.current.supportive', 'timing.general.current.mixed', 'timing.general.current.caution'],
      ['timing.no_guarantee'],
    ],
    // dchart_indication is deliberately absent: the composer omits the divisional
    // section when no chart has something specific to contribute, which is correct
    // behaviour rather than an incomplete answer.
  };
}

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
  const domain = resolveDomain(question);
  const groupsBySection = sectionBlockGroups(domain);

  for (const lang of LANGS) {
    // Direct answers must cover every evaluable state, from EITHER a
    // question-specific row (Q001, Q093) or this question's domain family.
    // The domain block is required specifically — not `direct_answer.general` —
    // so a life area whose language has not been authored reads as 'planned'
    // rather than quietly shipping the generic answer.
    for (const state of STATES) {
      const hasTemplate = tset.has(`direct_answer|${state}|${lang}`) || tset.has(`direct_answer|any|${lang}`);
      const hasDomainBlock = bset.has(`direct_answer.${domain}.${state}|${lang}`);
      if (!hasTemplate && !hasDomainBlock) missing.push(`direct_answer:${state}:${lang}`);
    }
    // Next step: question-specific row or the domain action.
    if ((requirement.answer_sections || []).includes('practical_guidance')
      && !tset.has(`practical_guidance|any|${lang}`)
      && !bset.has(`action.${domain}|${lang}`)) {
      missing.push(`practical_guidance:${lang}`);
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
      const groups = groupsBySection[sec];
      if (!groups) continue;
      for (const group of groups) {
        if (!group.some((k) => bset.has(`${k}|${lang}`))) missing.push(`shared:${sec}:${lang}`);
      }
    }
    // Confidence never ships without its reason, so those blocks are required too.
    for (const key of ['confidence.high.default', 'confidence.medium.default', 'confidence.low.default']) {
      if (!bset.has(`${key}|${lang}`)) missing.push(`confidence:${key}:${lang}`);
    }
    // disclaimer (domain-aware) + insufficient-data blocks
    const dType = disclaimerTypeFor(domain, question.disclaimer_type);
    const dKey = cfg.DISCLAIMER_BLOCK[dType] || cfg.DISCLAIMER_BLOCK.general;
    if (dKey && !bset.has(`${dKey}|${lang}`)) missing.push(`disclaimer:${dType}:${lang}`);
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
