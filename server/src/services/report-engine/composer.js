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

function composeYogas(ctx, LEX, lang, judgement) {
  const yogas = (ctx.chart?.yogas_doshas?.yogas || []).filter((y) => y && !y.is_cancelled);

  // Build activation map from judgement yogas area
  const activationMap = {};
  const jYogaList = (judgement?.areas || []).find((a) => a.areaKey === 'yogas')?.yogas || [];
  for (const jy of jYogaList) { if (jy.name) activationMap[jy.name] = jy.activation || 'partial'; }

  const ACTLABEL = {
    en: { full: 'Full', partial: 'Partial', weak: 'Weak', blocked: 'Blocked' },
    hi: { full: 'पूर्ण', partial: 'आंशिक', weak: 'कमज़ोर', blocked: 'अवरुद्ध' },
    hinglish: { full: 'Full', partial: 'Partial', weak: 'Weak', blocked: 'Blocked' },
  };
  const aL = ACTLABEL[lang] || ACTLABEL.hi;
  const blockedNote = LEX.PHRASES.jBlockedYogaNote || 'Present in chart but may not fully activate in the current phase.';

  const seen = new Set();
  const points = [];
  const caution = [];
  for (const y of yogas) {
    const name = lang === 'en' ? (y.name || y.name_hi) : (y.name_hi || y.name);
    const nameKey = y.name || '';
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const activation = activationMap[nameKey] || 'partial';
    const label = aL[activation] || aL.partial;
    const explanation = explainYoga(LEX, nameKey);
    if (activation === 'blocked') {
      caution.push(`${name} (${label}) — ${blockedNote}`);
    } else {
      points.push(`${name} (${label}) — ${explanation}`);
    }
  }

  const hasActivation = jYogaList.length > 0;
  const introText = (points.length || caution.length)
    ? (hasActivation
        ? (lang === 'en'
            ? 'These combinations are present in your chart. Their results depend on activation, current dasha and planet strength:'
            : lang === 'hi'
              ? 'ये योग आपकी कुंडली में हैं। इनका फल सक्रियता, दशा और ग्रह बल पर निर्भर करता है:'
              : 'Yeh yog aapki kundli me hain. Inke results activation, dasha aur planet strength par depend karte hain:')
        : LEX.PHRASES.yogasIntro)
    : LEX.PHRASES.yogasNone;

  return {
    key: 'yogas',
    heading: LEX.AREA_LABEL.yogas,
    status: null, statusKey: null,
    text: introText,
    points, advice: [], caution,
  };
}

function composeRemedies(ctx, areas, LEX) {
  const R = LEX.REMEDIES;
  const list = [...R.base];
  const weak = (k) => areas[k] && areas[k].score <= 2.6;

  // Dasha-specific remedy (most important — unique to this person's current phase)
  if (ctx.dasha && R.dasha?.[ctx.dasha]) list.push(R.dasha[ctx.dasha]);
  // Antardasha remedy (only if different planet and has a specific entry)
  if (ctx.antar && ctx.antar !== ctx.dasha && R.antar?.[ctx.antar]) list.push(R.antar[ctx.antar]);

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

  const sentEnd = LEX.lang === 'en' ? '.' : '।';
  const mood = [moon ? `${moon.manas}${sentEnd}` : null, taraLine].filter(Boolean).join(' ') || P.dailyMood;
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
