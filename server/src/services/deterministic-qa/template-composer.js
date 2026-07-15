'use strict';
/**
 * Template composer — DB-backed answer assembly, domain-aware.
 *
 * Code evaluates evidence, resolves KEYS, and interpolates {{placeholders}}. Every
 * user-facing sentence is loaded from answer_templates (question-specific) or
 * answer_shared_blocks (shared sections / fragments / labels). The only text in
 * this file is the emergency fallback below, used when a row is unexpectedly
 * missing at runtime (readiness gating should stop that reaching an exposed
 * question).
 *
 * What changed with the humanization upgrade:
 *  • Sections are composed per DOMAIN, not per state alone. `mixed` finance and
 *    `mixed` health resolve to different blocks because they are different claims.
 *  • Evidence is normalized before rendering, so an entity appears once and its
 *    roles are stated together instead of duplicated.
 *  • A planet is rendered through its meaning IN THIS LIFE AREA — never as a bare
 *    name with a status word attached.
 *  • Divisional charts must contribute something, or they are omitted rather than
 *    padded with "confirms this analysis".
 *  • Confidence ships with the reason it holds.
 *  • Timing questions take the timing path (phases), not a transit dump.
 */

const defaultDb = require('../../config/db');
const { planetName, joinList } = require('./vocab');
const { houseLordLabel } = require('./house-label');
const { resolveDomain, disclaimerTypeFor } = require('./domains');
const { normalizeAnswerEvidence } = require('./evidence-normalizer');
const { describeFactor, roleKeyOf } = require('./planet-meaning');
const { composeVargaMeaning } = require('./varga-meaning');
const { composeConfidenceReason } = require('./confidence-reason');
const { composeTimingOutlook } = require('./timing-outlook');

// Minimal emergency fallback (owner-approved to remain in code).
const EMERGENCY = {
  en: 'The prepared answer content for this section is unavailable right now. Please try again later.',
  hi: 'इस अनुभाग की तैयार उत्तर-सामग्री अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
};

// ── Loading ──────────────────────────────────────────────────────────────────
async function loadTemplateSet(questionCode, dbOverride = null) {
  const db = dbOverride || defaultDb;
  const [templates, blocks] = await Promise.all([
    db('answer_templates').where({ question_code: questionCode, active: true })
      .select('section_key', 'answer_state', 'lang', 'condition_key', 'block_text', 'template_version'),
    db('answer_shared_blocks').where({ active: true })
      .select('block_key', 'lang', 'text', 'version'),
  ]);
  const tmap = new Map();
  for (const t of templates) tmap.set(`${t.section_key}|${t.answer_state}|${t.lang}|${t.condition_key}`, t);
  const bmap = new Map();
  for (const b of blocks) {
    const k = `${b.block_key}|${b.lang}`;
    const prev = bmap.get(k);
    if (!prev || b.version > prev.version) bmap.set(k, b);
  }
  return { tmap, bmap };
}

function pickTemplate(set, section, state, lang, condition = 'default') {
  return set.tmap.get(`${section}|${state}|${lang}|${condition}`)
    || set.tmap.get(`${section}|any|${lang}|${condition}`)
    || set.tmap.get(`${section}|${state}|${lang}|default`)
    || set.tmap.get(`${section}|any|${lang}|default`)
    || null;
}

function block(set, key, lang) {
  const row = set.bmap.get(`${key}|${lang}`);
  return row ? row.text : null;
}

function interpolate(text, vars) {
  return String(text || '').replace(/\{\{(\w+)\}\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : ''));
}

/**
 * Key-chain resolver handed to the sub-composers: first key that exists wins.
 * Returning null (rather than a placeholder) is deliberate — a section with
 * nothing true to say is omitted, never padded.
 */
function makeResolver(set, used) {
  return (keys, lang, vars = {}) => {
    for (const key of keys || []) {
      const text = block(set, key, lang);
      if (text != null) {
        if (used) used.push({ key, lang });
        return interpolate(text, vars);
      }
    }
    return null;
  };
}

// ── Factor rendering ─────────────────────────────────────────────────────────
/**
 * Render one merged factor as a sentence: role(s) + meaning-in-this-domain +
 * polarity frame. This is where "Venus is weak" becomes something actionable, and
 * where a planet holding two roles is stated once, with both roles named.
 */
function renderFactor(factor, { domain, set, lang, resolve }) {
  if (!factor.planet) return null;
  const desc = describeFactor(factor, domain);
  const theme = resolve(desc.meaning_keys, lang);
  if (!theme) return null;                      // no meaning seeded → say nothing

  // Resolve each role's key directly. Indexing into desc.role_keys would be wrong:
  // that list is filtered, so an unmappable role would silently shift every
  // subsequent role onto the wrong label.
  const roleTexts = (factor.roles || []).map((role) => {
    const key = roleKeyOf(role);
    if (!key) return null;
    const houseVar = role.kind === 'house_lord' ? houseLordLabel(role.house, lang) : '';
    return resolve([key], lang, { house: houseVar });
  }).filter(Boolean);

  const frame = resolve([desc.frame_key], lang, {
    planet: planetName(factor.planet, lang),
    theme,
    roles: joinList(roleTexts, lang),
  });
  return frame || null;
}

function renderFactorList(factors, ctx) {
  return (factors || []).map((f) => renderFactor(f, ctx)).filter(Boolean);
}

// ── Legacy variable derivation (dasha / transit sections keep their shape) ────
function layerLabel(layer, lang) { return lang === 'hi' ? (layer.label_hi || layer.label) : layer.label; }

function transitLines(set, transit, lang) {
  if (!transit || !transit.available) return '';
  const rel = transit.transits.filter((t) => t.relevant_to_question);
  const scope = rel.length ? rel : transit.transits;
  const pattern = block(set, 'frag.transit_line', lang) || '';
  const untilPattern = block(set, 'frag.transit_until', lang) || '';
  return scope.map((t) => interpolate(pattern, {
    planet: planetName(t.planet, lang),
    sign: lang === 'hi' ? t.transit_sign_hi : t.transit_sign_en,
    classification: block(set, `label.class.${t.classification}`, lang) || t.classification,
    until: t.transit_end ? interpolate(untilPattern, { date: t.transit_end }) : '',
  })).join('; ');
}

function buildVars({ ctx, set, lang }) {
  const chart = ctx.loaded.chart;
  const dasha = ctx.loaded.selected.dasha.available;
  const rv = (ctx.ruleFacts && ctx.ruleFacts.vars) || {};
  const roleKey = rv.active_role === 'maha' ? 'frag.role_maha' : rv.active_role === 'antar' ? 'frag.role_antar' : null;

  return {
    maha_lord: dasha.maha ? planetName(dasha.maha.lord, lang) : '',
    antar_lord: dasha.antar ? planetName(dasha.antar.lord, lang) : '',
    lagna_sign: lang === 'hi' ? (chart.ascendant.rashi_hi || chart.ascendant.rashi_en) : chart.ascendant.rashi_en,
    lagna_lord: planetName(chart.ascendant.rashi_lord, lang),
    moon_sign: chart.planets.Moon ? (lang === 'hi' ? chart.planets.Moon.rashi_hi : chart.planets.Moon.rashi_en) : '',
    dominant_planet: rv.dominant_planet ? planetName(rv.dominant_planet, lang) : '',
    planet: rv.planet ? planetName(rv.planet, lang) : '',
    active_role: roleKey ? (block(set, roleKey, lang) || '') : '',
    transit_lines: transitLines(set, ctx.transit, lang),
  };
}

function sectionTitle(set, key) {
  return {
    title_en: block(set, `label.sec.${key}`, 'en') || key.replace(/_/g, ' '),
    title_hi: block(set, `label.sec.${key}`, 'hi') || key.replace(/_/g, ' '),
  };
}

function bilingual(key, set, fn) {
  const en = fn('en');
  const hi = fn('hi');
  if (en == null || hi == null) return null;    // never ship a half-translated section
  return { key, ...sectionTitle(set, key), text_en: en, text_hi: hi };
}

/**
 * Compose the bilingual sectioned answer from DB templates.
 * ctx: { question, requirement, loaded, evidence, transit, state, confidence,
 *        verdict, normalized, domain, ruleFacts, disclaimers, limitations }
 */
async function compose(ctx, dbOverride = null) {
  const set = await loadTemplateSet(ctx.question.code, dbOverride);
  const used = [];
  const resolve = makeResolver(set, used);
  const domain = ctx.domain || resolveDomain(ctx.question);
  const state = ctx.state;

  const norm = ctx.normalized || normalizeAnswerEvidence([
    ...(ctx.evidence.natal.factors || []),
    ...(ctx.evidence.dchart.factors || []),
    ...(ctx.evidence.timing.factors || []),
  ]);
  const groupDuplicates = ['natal', 'dchart', 'timing'].reduce((sum, g) => {
    const grp = ctx.evidence[g];
    return sum + (grp && grp.normalized ? grp.normalized.dropped_duplicates : 0);
  }, 0);

  const varsByLang = { en: buildVars({ ctx, set, lang: 'en' }), hi: buildVars({ ctx, set, lang: 'hi' }) };
  const factorCtx = (lang) => ({ domain, set, lang, resolve });
  const sections = [];

  // Record a question-specific template hit, so provenance covers BOTH sources —
  // question templates and shared blocks. Admin needs the full picture of which
  // rows produced an answer; a half-recorded trace is not auditable.
  const useTemplate = (section, t, lang) => {
    if (!t) return null;
    used.push({ section, source: 'template', state: t.answer_state, condition: t.condition_key, lang, version: t.template_version });
    return t;
  };

  // headline — question-specific row, else the shared per-state label
  const hEn = useTemplate('headline', pickTemplate(set, 'headline', state, 'en'), 'en');
  const hHi = useTemplate('headline', pickTemplate(set, 'headline', state, 'hi'), 'hi');
  const headline = (hEn && hHi)
    ? { en: interpolate(hEn.block_text, varsByLang.en), hi: interpolate(hHi.block_text, varsByLang.hi) }
    : { en: block(set, `label.headline.${state}`, 'en') || '', hi: block(set, `label.headline.${state}`, 'hi') || '' };

  for (const key of ctx.requirement.answer_sections || []) {
    let section = null;
    switch (key) {
      // ── Direct answer — question-specific text if this question genuinely has
      //    its own (Q001 names your lagna; Q093 names a planet). Otherwise the
      //    DOMAIN answer for this state: finance-mixed and health-mixed are
      //    different sentences, which is the whole point.
      case 'direct_answer': {
        section = bilingual(key, set, (lang) => {
          const t = useTemplate('direct_answer', pickTemplate(set, 'direct_answer', state, lang), lang);
          if (t) return interpolate(t.block_text, varsByLang[lang]);
          return resolve([`direct_answer.${domain}.${state}`, `direct_answer.general.${state}`], lang, varsByLang[lang]);
        });
        if (!section) section = { key, ...sectionTitle(set, key), text_en: EMERGENCY.en, text_hi: EMERGENCY.hi };
        break;
      }

      // ── What the chart indicates — merged factors, each rendered through its
      //    meaning in this life area.
      case 'kundli_indicates': {
        section = bilingual(key, set, (lang) => {
          const parts = [
            ...renderFactorList(norm.supports, factorCtx(lang)),
            ...renderFactorList(norm.blockers, factorCtx(lang)),
          ];
          return parts.length ? parts.join(' ') : null;
        });
        break;
      }

      // ── Divisional charts — only when they contribute something.
      case 'dchart_indication': {
        section = bilingual(key, set, (lang) => {
          const v = composeVargaMeaning({ state, domain, factors: norm.factors, lang, resolve });
          return v ? v.text : null;
        });
        break;
      }

      case 'dasha_influence': {
        const d = ctx.loaded.selected.dasha.available;
        if (!d.maha) break;
        const bk = d.antar ? 'sec.dasha.maha_antar' : 'sec.dasha.maha_only';
        section = bilingual(key, set, (lang) => resolve([bk], lang, varsByLang[lang]));
        break;
      }

      case 'transit_influence': {
        if (!ctx.transit || !ctx.transit.available) break;
        section = bilingual(key, set, (lang) => resolve(['sec.transit.default'], lang, varsByLang[lang]));
        break;
      }

      case 'positive': {
        section = bilingual(key, set, (lang) => {
          const parts = renderFactorList(norm.supports.slice(0, 2), factorCtx(lang));
          if (parts.length) return parts.join(' ');
          return resolve(['sec.positive.no_factors'], lang, varsByLang[lang]);
        });
        break;
      }

      // ── Caution — per life area. A property caution talks about title and loan
      //    terms; a health caution talks about symptoms and doctors. One shared
      //    caution sentence for both is what we are removing.
      case 'caution': {
        section = bilingual(key, set, (lang) => resolve([`caution.${domain}`, 'caution.general'], lang, varsByLang[lang]));
        break;
      }

      // ── Timing — phases, windows and triggers, not a list of transit dates.
      case 'timing_outlook': {
        if (!ctx.transit || !ctx.transit.available) break;
        section = bilingual(key, set, (lang) => {
          const t = composeTimingOutlook({
            transit: ctx.transit,
            dasha: ctx.loaded.selected.dasha.available,
            verdict: ctx.verdict,
            domain, lang, resolve,
          });
          return t ? t.text : null;
        });
        break;
      }

      // ── Next step — question-specific if authored, else the domain action.
      case 'practical_guidance': {
        section = bilingual(key, set, (lang) => {
          const t = useTemplate('practical_guidance', pickTemplate(set, 'practical_guidance', state, lang), lang);
          if (t) return interpolate(t.block_text, varsByLang[lang]);
          return resolve([`action.${domain}`, 'action.general'], lang, varsByLang[lang]);
        });
        if (!section) section = { key, ...sectionTitle(set, key), text_en: EMERGENCY.en, text_hi: EMERGENCY.hi };
        break;
      }

      case 'remedy':
        break;   // remedy templates arrive with the question set that needs them

      case 'important_note': {
        const lim_en = (ctx.limitations || []).map((l) => l.en).filter(Boolean);
        const lim_hi = (ctx.limitations || []).map((l) => l.hi).filter(Boolean);
        section = {
          key, ...sectionTitle(set, key),
          text_en: [ctx.disclaimers ? ctx.disclaimers.en : '', ...lim_en].filter(Boolean).join(' '),
          text_hi: [ctx.disclaimers ? ctx.disclaimers.hi : '', ...lim_hi].filter(Boolean).join(' '),
        };
        break;
      }

      default:
        break;
    }
    if (section) sections.push(section);
  }

  // challenging-state review note (owner safety rule)
  if (state === 'challenging' || state === 'highly_challenging') {
    const note_en = block(set, 'note.challenging_review', 'en');
    const note_hi = block(set, 'note.challenging_review', 'hi');
    if (note_en && note_hi) {
      const idx = sections.findIndex((s) => s.key === 'caution');
      const noteSection = { key: 'review_period', ...sectionTitle(set, 'review_period'), text_en: note_en, text_hi: note_hi };
      if (idx >= 0) sections.splice(idx + 1, 0, noteSection); else sections.push(noteSection);
    }
  }

  // confidence + the reason it holds (Part 12 keeps this a field, not a section)
  const reasonFor = (lang) => composeConfidenceReason({
    level: ctx.confidence,
    verdict: ctx.verdict,
    factors: norm.factors,
    groupsPresent: ['natal', 'dchart', 'timing'].filter((g) => ctx.evidence[g] && ctx.evidence[g].present).length,
    completeness: ctx.completeness,
    resolve,
  }, lang);
  const reasonEn = reasonFor('en');
  const reasonHi = reasonFor('hi');

  return {
    state,
    state_label: {
      en: block(set, `label.state.${state}`, 'en') || state.replace(/_/g, ' '),
      hi: block(set, `label.state.${state}`, 'hi') || state.replace(/_/g, ' '),
    },
    confidence: {
      level: ctx.confidence,
      en: block(set, `label.conf.${ctx.confidence}`, 'en') || ctx.confidence,
      hi: block(set, `label.conf.${ctx.confidence}`, 'hi') || ctx.confidence,
      reason_en: reasonEn ? reasonEn.text : null,
      reason_hi: reasonHi ? reasonHi.text : null,
    },
    headline,
    sections,
    limitations: ctx.limitations || [],
    meta: {
      // Admin-only detail. index.js strips this off the user payload and files it
      // in the trace — nothing here may reach a normal user.
      domain,
      templates_used: used,
      confidence_reason_kind: reasonEn ? reasonEn.kind : null,
      evidence_normalization: {
        merged_count: norm.merged_count,
        // Duplicates are mostly collapsed by the per-group pass, so the
        // cross-group count alone reads as "nothing was deduplicated" even when a
        // planet held three roles. Report both, totalled, or admin cannot audit
        // the very thing this section exists to show.
        dropped_duplicates: groupDuplicates + norm.dropped_duplicates,
        dropped_duplicates_within_groups: groupDuplicates,
        dropped_duplicates_across_groups: norm.dropped_duplicates,
        supports: norm.supports.map((f) => ({ entity_id: f.entity_id, tier: f.tier, roles: f.roles, multi_role: f.multi_role })),
        blockers: norm.blockers.map((f) => ({ entity_id: f.entity_id, tier: f.tier, roles: f.roles, multi_role: f.multi_role })),
      },
    },
  };
}

module.exports = {
  compose, loadTemplateSet, pickTemplate, interpolate, makeResolver,
  renderFactor, EMERGENCY,
};
