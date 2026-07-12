'use strict';
/**
 * Template composer (Stage 1) — DB-backed answer assembly.
 *
 * Replaces the code-generated paragraphs of the old answer-composer: code now
 * only evaluates evidence, derives condition keys, LOADS approved templates
 * from answer_templates (question-specific) and answer_shared_blocks (shared
 * section bodies / fragments / labels), interpolates {{placeholders}} and
 * assembles the structured sections. No user-facing paragraph text is generated
 * in code — only the minimal EMERGENCY fallback below, used when a template row
 * is unexpectedly missing at runtime (template readiness gating should prevent
 * that from ever happening for exposed questions).
 */

const defaultDb = require('../../config/db');
const { planetName, statusWord, joinList } = require('./vocab');

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

// ── Condition + variable derivation (evaluation only, no user text) ───────────
function layerLabel(layer, lang) { return lang === 'hi' ? (layer.label_hi || layer.label) : layer.label; }
function topLayers(layers, n, dir) {
  const sorted = [...(layers || [])].sort((a, b) => (dir === 'pos' ? b.score - a.score : a.score - b.score));
  return sorted.slice(0, n);
}

function kundliCondition(evidence, lang) {
  const pos = topLayers(evidence.natal.layers, 2, 'pos').filter((l) => l.score > 0);
  const neg = topLayers(evidence.natal.layers, 1, 'neg').filter((l) => l.score < 0);
  const condition = pos.length && neg.length ? 'support_and_caution'
    : pos.length ? 'support_only'
    : neg.length ? 'caution_only' : 'neutral';
  return {
    condition,
    vars: {
      support_factors: joinList(pos.map((l) => layerLabel(l, lang)), lang),
      caution_factor: neg.map((l) => layerLabel(l, lang)).join(', '),
    },
  };
}

function dchartCondition(evidence, lang) {
  const layers = evidence.dchart.layers.filter((l) => !l.key.endsWith(':d1'));
  const support = layers.filter((l) => l.score > 10);
  const against = layers.filter((l) => l.score < -10);
  const condition = support.length && against.length ? 'mixed_signals'
    : support.length ? 'supports'
    : against.length ? 'contradicts' : 'agrees';
  return {
    condition,
    vars: {
      dchart_support: joinList(support.map((l) => layerLabel(l, lang)), lang),
      dchart_against: joinList(against.map((l) => layerLabel(l, lang)), lang),
    },
  };
}

function transitLines(set, transit, lang) {
  if (!transit || !transit.available) return '';
  const rel = transit.transits.filter((t) => t.relevant_to_question);
  const scope = rel.length ? rel : transit.transits;
  const pattern = block(set, 'frag.transit_line', lang) || '';
  const untilPattern = block(set, 'frag.transit_until', lang) || '';
  const sep = lang === 'hi' ? '; ' : '; ';
  return scope.map((t) => interpolate(pattern, {
    planet: planetName(t.planet, lang),
    sign: lang === 'hi' ? t.transit_sign_hi : t.transit_sign_en,
    classification: block(set, `label.class.${t.classification}`, lang) || statusWord(t.classification, lang),
    until: t.transit_end ? interpolate(untilPattern, { date: t.transit_end }) : '',
  })).join(sep);
}

function windowLine(set, ruleVars, lang) {
  const win = ruleVars && ruleVars.timing_window;
  if (!win) return block(set, 'frag.no_window_line', lang) || '';
  const key = win.transit_end ? 'frag.window_line' : 'frag.window_line_open';
  return interpolate(block(set, key, lang) || '', {
    planet: planetName(win.planet, lang),
    sign: lang === 'hi' ? win.transit_sign_hi : win.transit_sign_en,
    date: win.transit_end || '',
  });
}

function buildVars({ ctx, set, lang }) {
  const chart = ctx.loaded.chart;
  const dasha = ctx.loaded.selected.dasha.available;
  const rv = (ctx.ruleFacts && ctx.ruleFacts.vars) || {};
  const kundli = kundliCondition(ctx.evidence, lang);
  const dchart = dchartCondition(ctx.evidence, lang);
  const allLayers = [...ctx.evidence.natal.layers, ...ctx.evidence.dchart.layers, ...ctx.evidence.timing.layers];
  const posAll = topLayers(allLayers, 2, 'pos').filter((l) => l.score > 0);
  const negAll = topLayers([...ctx.evidence.natal.layers, ...ctx.evidence.timing.layers], 1, 'neg').filter((l) => l.score < 0);

  const roleKey = rv.active_role === 'maha' ? 'frag.role_maha' : rv.active_role === 'antar' ? 'frag.role_antar' : null;

  return {
    conditions: { kundli_indicates: kundli.condition, dchart_indication: dchart.condition },
    vars: {
      ...kundli.vars,
      ...dchart.vars,
      positive_factors: joinList(posAll.map((l) => layerLabel(l, lang)), lang),
      caution_factors: negAll.map((l) => layerLabel(l, lang)).join(', '),
      maha_lord: dasha.maha ? planetName(dasha.maha.lord, lang) : '',
      antar_lord: dasha.antar ? planetName(dasha.antar.lord, lang) : '',
      lagna_sign: lang === 'hi' ? (chart.ascendant.rashi_hi || chart.ascendant.rashi_en) : chart.ascendant.rashi_en,
      lagna_lord: planetName(chart.ascendant.rashi_lord, lang),
      moon_sign: chart.planets.Moon ? (lang === 'hi' ? chart.planets.Moon.rashi_hi : chart.planets.Moon.rashi_en) : '',
      dominant_planet: rv.dominant_planet ? planetName(rv.dominant_planet, lang) : '',
      planet: rv.planet ? planetName(rv.planet, lang) : '',
      active_role: roleKey ? (block(set, roleKey, lang) || '') : '',
      transit_lines: transitLines(set, ctx.transit, lang),
      window_line: ctx.requirement.needs_dated_transit ? windowLine(set, rv, lang) : '',
      dasha_line: dasha.maha && ctx.requirement.needs_dated_transit
        ? interpolate(block(set, 'frag.dasha_line', lang) || '', { maha_lord: planetName(dasha.maha.lord, lang) }) : '',
    },
  };
}

// ── Section assembly ─────────────────────────────────────────────────────────
function sectionTitle(set, key) {
  return {
    title_en: block(set, `label.sec.${key}`, 'en') || key.replace(/_/g, ' '),
    title_hi: block(set, `label.sec.${key}`, 'hi') || key.replace(/_/g, ' '),
  };
}

function renderTemplateSection({ set, key, state, condition, varsByLang, used }) {
  const out = {};
  for (const lang of ['en', 'hi']) {
    const t = pickTemplate(set, key, state, lang, condition);
    if (!t) return null;
    out[`text_${lang}`] = interpolate(t.block_text, varsByLang[lang].vars);
    used.push({ section: key, source: 'template', state: t.answer_state, condition: t.condition_key, lang, version: t.template_version });
  }
  return { key, ...sectionTitle(set, key), ...out };
}

function renderSharedSection({ set, key, blockKeyByLang, varsByLang, used }) {
  const out = {};
  for (const lang of ['en', 'hi']) {
    const blockKey = typeof blockKeyByLang === 'string' ? blockKeyByLang : blockKeyByLang[lang];
    const text = block(set, blockKey, lang);
    if (text == null) return null;
    out[`text_${lang}`] = interpolate(text, varsByLang[lang].vars);
    used.push({ section: key, source: 'shared', key: blockKey, lang });
  }
  return { key, ...sectionTitle(set, key), ...out };
}

/**
 * Compose the bilingual sectioned answer from DB templates.
 * ctx: { question, requirement, loaded, evidence, transit, state, confidence,
 *        ruleFacts, disclaimers, limitations }
 * @returns { state, state_label, confidence, headline, sections, limitations, meta }
 */
async function compose(ctx, dbOverride = null) {
  const set = await loadTemplateSet(ctx.question.code, dbOverride);
  const used = [];
  const varsByLang = {
    en: buildVars({ ctx, set, lang: 'en' }),
    hi: buildVars({ ctx, set, lang: 'hi' }),
  };
  const state = ctx.state;
  const sections = [];

  // headline: question-specific template row, else shared per-state label
  let headline = null;
  const hTpl = pickTemplate(set, 'headline', state, 'en') && pickTemplate(set, 'headline', state, 'hi');
  if (hTpl) {
    headline = {
      en: interpolate(pickTemplate(set, 'headline', state, 'en').block_text, varsByLang.en.vars),
      hi: interpolate(pickTemplate(set, 'headline', state, 'hi').block_text, varsByLang.hi.vars),
    };
    used.push({ section: 'headline', source: 'template' });
  } else {
    headline = {
      en: block(set, `label.headline.${state}`, 'en') || '',
      hi: block(set, `label.headline.${state}`, 'hi') || '',
    };
    used.push({ section: 'headline', source: 'shared', key: `label.headline.${state}` });
  }

  for (const key of ctx.requirement.answer_sections || []) {
    let section = null;
    switch (key) {
      case 'direct_answer':
        section = renderTemplateSection({ set, key, state, condition: 'default', varsByLang, used });
        if (!section) section = { key, ...sectionTitle(set, key), text_en: EMERGENCY.en, text_hi: EMERGENCY.hi };
        break;
      case 'kundli_indicates':
        section = renderSharedSection({
          set, key,
          blockKeyByLang: {
            en: `sec.kundli_indicates.${varsByLang.en.conditions.kundli_indicates}`,
            hi: `sec.kundli_indicates.${varsByLang.hi.conditions.kundli_indicates}`,
          },
          varsByLang, used,
        });
        break;
      case 'dchart_indication': {
        const cond = varsByLang.en.conditions.dchart_indication;
        // suppress the section entirely when there is no divisional signal at all
        if (cond === 'agrees' && !ctx.evidence.dchart.layers.some((l) => !l.key.endsWith(':d1'))) break;
        section = renderSharedSection({
          set, key,
          blockKeyByLang: { en: `sec.dchart.${cond}`, hi: `sec.dchart.${varsByLang.hi.conditions.dchart_indication}` },
          varsByLang, used,
        });
        break;
      }
      case 'dasha_influence': {
        const d = ctx.loaded.selected.dasha.available;
        if (!d.maha) break;
        section = renderSharedSection({
          set, key, blockKeyByLang: d.antar ? 'sec.dasha.maha_antar' : 'sec.dasha.maha_only', varsByLang, used,
        });
        break;
      }
      case 'transit_influence':
        if (!ctx.transit || !ctx.transit.available) break;
        section = renderSharedSection({ set, key, blockKeyByLang: 'sec.transit.default', varsByLang, used });
        break;
      case 'positive':
        section = renderSharedSection({
          set, key,
          blockKeyByLang: varsByLang.en.vars.positive_factors ? 'sec.positive.factors' : 'sec.positive.no_factors',
          varsByLang, used,
        });
        break;
      case 'caution':
        section = renderSharedSection({
          set, key,
          blockKeyByLang: varsByLang.en.vars.caution_factors ? 'sec.caution.factors' : 'sec.caution.no_factors',
          varsByLang, used,
        });
        break;
      case 'timing_outlook':
        if (!ctx.transit || !ctx.transit.available) break;
        section = renderSharedSection({ set, key, blockKeyByLang: `sec.timing_outlook.${ctx.transit.summary.overall}`, varsByLang, used });
        break;
      case 'practical_guidance':
        section = renderTemplateSection({ set, key, state, condition: 'default', varsByLang, used });
        if (!section) section = { key, ...sectionTitle(set, key), text_en: EMERGENCY.en, text_hi: EMERGENCY.hi };
        break;
      case 'remedy':
        // No pilot question requires remedies; remedy templates arrive with the
        // question set that needs them (never generated in code).
        break;
      case 'important_note': {
        const lim_en = (ctx.limitations || []).map((l) => l.en).filter(Boolean);
        const lim_hi = (ctx.limitations || []).map((l) => l.hi).filter(Boolean);
        section = {
          key, ...sectionTitle(set, key),
          text_en: [ctx.disclaimers ? ctx.disclaimers.en : '', ...lim_en].filter(Boolean).join(' '),
          text_hi: [ctx.disclaimers ? ctx.disclaimers.hi : '', ...lim_hi].filter(Boolean).join(' '),
        };
        used.push({ section: key, source: 'shared', key: 'disclaimer+limitations' });
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
      used.push({ section: 'review_period', source: 'shared', key: 'note.challenging_review' });
    }
  }

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
    },
    headline,
    sections,
    limitations: ctx.limitations || [],
    meta: { templates_used: used },
  };
}

module.exports = { compose, loadTemplateSet, pickTemplate, interpolate, EMERGENCY };
