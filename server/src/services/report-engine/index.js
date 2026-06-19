'use strict';
/**
 * Human-friendly Life Guidance report engine — multi-language.
 *
 * generateLifeReport(chart, { lang, admin })
 *   lang: 'en' | 'hi' | 'hinglish'  (default 'hi'; unknown falls back to 'hi')
 *   - Output stays fully in the selected language. No runtime translation,
 *     no mixed languages. Content is authored per language (lexicon/ + templates/).
 *   - Normal users get soft text + a status label per area.
 *   - admin:true also returns the technical debug breakdown.
 */
const { getLexicon, SUPPORTED } = require('./lexicon');
const { buildContext } = require('./rules');
const { aggregate } = require('./aggregator');
const C = require('./composer');

const REPORT_ORDER = [
  'personality', 'family', 'career', 'money', 'marriage', 'children',
  'siblings', 'health', 'debt', 'property', 'spirituality', 'dasha', 'yogas', 'remedies',
];

// Judgement areaKey → life report section keys that it governs
const J_AREA_MAP = {
  lagna:    ['personality', 'health'],
  mind:     ['family'],
  gains:    ['career', 'money'],
  marriage: ['marriage'],
  children: ['children'],
  maturity: ['spirituality'],
};

// When judgement says challenging/needs-care but section is purely positive, add caution note
function applyJudgementOverrides(sections, judgement, LEX) {
  if (!judgement?.areas?.length) return sections;
  const statusByKey = {};
  for (const area of judgement.areas) {
    const keys = J_AREA_MAP[area.areaKey] || [];
    for (const k of keys) statusByKey[k] = area.status;
  }
  const { fill } = require('./lexicon');
  return sections.map((s) => {
    const jStatus = statusByKey[s.key];
    if (!jStatus) return s;
    const isStrongSection = s.statusKey === 'strong' || (!s.caution?.filter(Boolean).length && s.statusKey !== 'care');
    if ((jStatus === 'challenging' || jStatus === 'needs-care') && isStrongSection) {
      const note = jStatus === 'challenging'
        ? (LEX.PHRASES.jChallengeNote || 'This area may need extra patience and careful effort.')
        : (LEX.PHRASES.jCareNote || 'Give this area a little extra patience and attention.');
      return { ...s, statusKey: 'care', caution: [...(s.caution || []).filter(Boolean), note] };
    }
    return s;
  });
}

const normLang = (lang) => (SUPPORTED.includes(lang) ? lang : 'hi');

function buildDebug(ctx, areas, LEX) {
  const planets = {};
  for (const name of Object.keys(ctx.planets)) {
    planets[name] = { sign: ctx.planets[name]?.rashi_num, house: ctx.houseOf(name), dignity: ctx.dignity(name) };
  }
  return {
    lagna: { num: ctx.lagna, sign: getLexicon('en').SIGN[ctx.lagna]?.name },
    lagna_lord: { planet: ctx.lagnaLord, house: ctx.lagnaLordHouse },
    moon: { sign: ctx.moonSign, nakshatra: ctx.moonNak },
    dasha: { maha: ctx.dasha, antar: ctx.antar },
    yogas: ctx.yogaNames,
    areas: Object.values(areas).map((a) => ({
      area: a.area, score: Math.round(a.score * 100) / 100, label: a.label, status_key: a.statusKey, rule_ids: a.rule_ids,
    })),
  };
}

function generateLifeReport(chart, opts = {}) {
  const lang = normLang(opts.lang);
  const LEX = getLexicon(lang);
  const ctx = buildContext(chart || {});
  const areas = aggregate(ctx, lang);

  const sections = [];
  for (const key of REPORT_ORDER) {
    if (key === 'dasha') sections.push(C.composeDasha(ctx, LEX));
    else if (key === 'yogas') sections.push(C.composeYogas(ctx, LEX, lang, opts.judgement));
    else if (key === 'remedies') sections.push(C.composeRemedies(ctx, areas, LEX));
    else sections.push(C.composeArea(key, areas[key], LEX));
  }

  const resolvedSections = opts.judgement
    ? applyJudgementOverrides(sections, opts.judgement, LEX)
    : sections;

  const report = {
    lang,
    summary: { heading: LEX.AREA_LABEL.summary, lines: C.composeSummary(ctx, areas, LEX) },
    sections: resolvedSections,
    meta: { generated_at: new Date().toISOString() },
  };
  if (opts.admin) report.debug = buildDebug(ctx, areas, LEX);
  return report;
}

function generateDailyGuidance(chart, atDate = new Date(), opts = {}) {
  const lang = normLang(opts.lang);
  const LEX = getLexicon(lang);
  const ctx = buildContext(chart || {});
  let prediction = null;
  try {
    const { generateTodayPrediction } = require('../helpers/today-prediction');
    prediction = generateTodayPrediction(chart, atDate);
  } catch (_) { prediction = null; }

  const daily = C.composeDaily(prediction, ctx, LEX, lang);
  const out = { lang, ...daily };
  if (opts.admin) out.debug = { dasha: { maha: ctx.dasha, antar: ctx.antar }, tara: prediction?.meta?.tara?.name || null };
  return out;
}

module.exports = { generateLifeReport, generateDailyGuidance, buildContext, SUPPORTED, REPORT_ORDER };
