'use strict';
/**
 * LAYER 5 — Final Report Composer (language-aware)
 * Builds clean sections in the SELECTED language only (no mixing). All wording
 * comes from the chosen lexicon (LEX) + already-localized rule text in `areas`.
 */
const { explainYoga, fill } = require('./lexicon');

const stripEnd = (s) => (s || '').replace(/[।\.\s]+$/u, '');

function composeSummary(ctx, areas, LEX) {
  const lag = LEX.SIGN[ctx.lagna];
  const moon = LEX.SIGN[ctx.moonSign] || lag;
  const maha = LEX.PLANET[ctx.dasha];
  const P = LEX.PHRASES;

  const ranked = Object.values(areas).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const weak = ranked[ranked.length - 1];

  const lines = [];
  lines.push(fill(P.sumNature, { nature: lag.nature, manas: moon.manas }));
  if (maha) lines.push(maha.dasha.theme);
  if (best && best.score >= 3.4) lines.push(fill(P.sumBest, { area: LEX.AREA_LABEL[best.area] }));
  if (weak && weak.score <= 2.6 && weak.area !== best?.area) lines.push(fill(P.sumWeak, { area: LEX.AREA_LABEL[weak.area] }));
  lines.push(P.sumClose);
  return lines;
}

function composeArea(key, data, LEX) {
  if (!data) return { key, heading: LEX.AREA_LABEL[key], status: null, statusKey: null, text: '', points: [], advice: [], caution: [] };
  const merged = data.merged || data.lines[0] || '';
  const points = data.lines.filter((ln) => ln && !merged.includes(stripEnd(ln)));
  const caution = [...(data.caution || [])];
  if (key === 'health') caution.push(LEX.PHRASES.healthDisclaimer);
  return { key, heading: LEX.AREA_LABEL[key], status: data.label, statusKey: data.statusKey, text: merged, points, advice: data.advice || [], caution };
}

function composeDasha(ctx, LEX) {
  const m = LEX.PLANET[ctx.dasha];
  const a = ctx.antar ? LEX.PLANET[ctx.antar] : null;
  const P = LEX.PHRASES;
  if (!m) return { key: 'dasha', heading: LEX.AREA_LABEL.dasha, status: null, statusKey: null, text: P.dashaGeneric, points: [], advice: [], caution: [] };
  let text = m.dasha.theme;
  if (a && a !== m) text += fill(P.dashaAlso, { focus: a.focus });
  return {
    key: 'dasha',
    heading: LEX.AREA_LABEL.dasha,
    status: null, statusKey: null,
    text,
    points: [fill(P.goodSide, { x: m.dasha.good }), fill(P.whatToDo, { x: m.dasha.do })],
    advice: [m.dasha.do],
    caution: [m.dasha.challenge, fill(P.avoidThese, { x: m.dasha.avoid })],
  };
}

function composeYogas(ctx, LEX, lang) {
  const yogas = (ctx.chart?.yogas_doshas?.yogas || []).filter((y) => y && !y.is_cancelled);
  const seen = new Set();
  const points = [];
  for (const y of yogas) {
    const name = lang === 'en' ? (y.name || y.name_hi) : (y.name_hi || y.name);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    points.push(`${name}: ${explainYoga(LEX, y.name || '')}`);
  }
  return {
    key: 'yogas',
    heading: LEX.AREA_LABEL.yogas,
    status: null, statusKey: null,
    text: points.length ? LEX.PHRASES.yogasIntro : LEX.PHRASES.yogasNone,
    points, advice: [], caution: [],
  };
}

function composeRemedies(ctx, areas, LEX) {
  const R = LEX.REMEDIES;
  const list = [...R.base];
  const weak = (k) => areas[k] && areas[k].score <= 2.6;

  if (weak('money') || ctx.inHouse('Rahu', 2)) list.push(R.money);
  if (weak('health') || ctx.isWeak('Moon')) list.push(R.health);
  if (weak('career') || ctx.lagnaLord === 'Saturn') list.push(R.career);
  if (weak('marriage')) list.push(R.marriage);
  if (weak('children')) list.push(R.children);
  if (weak('spirituality')) list.push(R.spirituality);

  return { key: 'remedies', heading: LEX.AREA_LABEL.remedies, status: null, statusKey: null, text: LEX.PHRASES.remediesIntro, points: [...new Set(list)], advice: [], caution: [] };
}

function composeDaily(prediction, ctx, LEX, lang) {
  const meta = prediction?.meta || {};
  const moon = LEX.SIGN[ctx?.moonSign] || null;
  const maha = ctx?.dasha ? LEX.PLANET[ctx.dasha] : null;
  const P = LEX.PHRASES;
  const taraLine = meta.tara?.name ? LEX.TARA[meta.tara.name] : null;

  const mood = [moon ? `${moon.manas}।` : null, taraLine].filter(Boolean).join(' ') || P.dailyMood;
  const work = maha ? fill(P.dailyWork, { x: maha.dasha.theme }) : P.dailyWorkFallback;

  const pick = (v, fallback) => {
    if (!v) return fallback;
    if (typeof v === 'string') return v;
    return v[lang] || v.hi || v.en || fallback;
  };
  const advice = pick(meta.advice, P.dailyAdvice);
  const caution = pick(meta.caution, P.dailyCaution);
  const lucky = meta.lucky ? [lang === 'en' ? meta.lucky.color : (meta.lucky.color_hi || meta.lucky.color), meta.lucky.number].filter(Boolean).join(' · ') : null;

  return {
    key: 'daily',
    heading: LEX.AREA_LABEL.daily,
    text: mood,
    points: [work, P.dailyRel, P.dailyHealth],
    advice: [advice],
    caution: [caution],
    lucky,
  };
}

module.exports = { composeSummary, composeArea, composeDasha, composeYogas, composeRemedies, composeDaily };
