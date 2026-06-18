'use strict';
/**
 * LAYER 5 — Final Report Composer
 * Converts aggregated, conflict-resolved data into clean Hindi/Hinglish sections.
 * Every section here is user-facing: no house numbers, no tone words, no raw
 * planet-dasha strings. Soft, balanced, astrologer-style language only.
 */
const L = require('./lexicon');

const stripEnd = (s) => (s || '').replace(/[।\.\s]+$/u, '');

// ── Section 1: short life summary (4-6 lines) ───────────────────────────────────
function composeSummary(ctx, areas) {
  const lag = L.SIGN[ctx.lagna];
  const moon = L.SIGN[ctx.moonSign] || lag;
  const maha = L.PLANET[ctx.dasha];

  // best / needs-care areas (ignore the always-3 anchors by spreading scores)
  const ranked = Object.values(areas).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const weak = ranked[ranked.length - 1];

  const lines = [];
  lines.push(`आप ${lag.nature} स्वभाव के व्यक्ति हैं और ${moon.manas}।`);
  if (maha) lines.push(maha.dasha.theme);
  if (best && best.score >= 3.4) lines.push(`${L.AREA_LABEL[best.area]} — यह क्षेत्र इस समय आपके पक्ष में दिखता है।`);
  if (weak && weak.score <= 2.6 && weak.area !== best?.area) lines.push(`वहीं ${L.AREA_LABEL[weak.area]} — यहाँ थोड़ा धैर्य और सावधानी रखना अच्छा रहेगा।`);
  lines.push('जल्दबाज़ी से बचें — मेहनत और सही दिशा से जीवन में अच्छे परिणाम मिल सकते हैं।');
  return lines;
}

// ── Sections 2-12: one life area → a readable block ─────────────────────────────
function composeArea(key, data) {
  if (!data) {
    return { key, heading: L.AREA_LABEL[key], status: L.scoreLabel(3), text: '', points: [], advice: [], caution: [] };
  }
  const merged = data.merged || data.lines[0] || '';
  const points = data.lines.filter((ln) => ln && !merged.includes(stripEnd(ln)));
  const caution = [...(data.caution || [])];
  // Health must always carry a gentle non-diagnostic disclaimer
  if (key === 'health') caution.push('यह ज्योतिषीय संकेत हैं — कोई स्वास्थ्य समस्या हो तो डॉक्टर की सलाह जरूर लें।');
  return {
    key,
    heading: L.AREA_LABEL[key],
    status: data.label,
    text: merged,
    points,
    advice: data.advice || [],
    caution,
  };
}

// ── Section 13: current dasha → simple life events ──────────────────────────────
function composeDasha(ctx) {
  const m = L.PLANET[ctx.dasha];
  const a = ctx.antar ? L.PLANET[ctx.antar] : null;
  if (!m) {
    return { key: 'dasha', heading: L.AREA_LABEL.dasha, text: 'इस समय की ऊर्जा सामान्य रूप से जीवन को आगे बढ़ा रही है।', points: [], advice: [], caution: [] };
  }
  let text = m.dasha.theme;
  if (a && a !== m) {
    text += ` साथ ही इस समय ${a.hi} का प्रभाव भी मिल रहा है — ${a.energy}।`;
  }
  return {
    key: 'dasha',
    heading: L.AREA_LABEL.dasha,
    text,
    points: [`अच्छे पक्ष: ${m.dasha.good}`, `क्या करें: ${m.dasha.do}`],
    advice: [m.dasha.do],
    caution: [m.dasha.challenge, `इनसे बचें: ${m.dasha.avoid}`],
  };
}

// ── Section 15: active yogas, explained in plain words ──────────────────────────
function composeYogas(ctx) {
  const yogas = (ctx.chart?.yogas_doshas?.yogas || []).filter((y) => y && !y.is_cancelled);
  const seen = new Set();
  const points = [];
  for (const y of yogas) {
    const name = y.name_hi || y.name;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    points.push(`${name}: ${L.explainYoga(y.name || '')}`);
  }
  return {
    key: 'yogas',
    heading: L.AREA_LABEL.yogas,
    text: points.length ? 'आपकी कुंडली में कुछ शुभ योग बनते हैं, जिनका सरल अर्थ नीचे दिया है:' : 'आपकी कुंडली में सामान्य योग बनते हैं; मेहनत और सही दिशा से अच्छे परिणाम मिलते हैं।',
    points,
    advice: [],
    caution: [],
  };
}

// ── Section 16: simple, safe, low-cost remedies ─────────────────────────────────
const BASE_REMEDIES = [
  'सूर्य को जल चढ़ाएं और सुबह जल्दी उठने की आदत बनाएं।',
  'रोज़ थोड़ी देर ध्यान या गहरी सांस लें — मन शांत और स्थिर रहेगा।',
  'माता-पिता और बड़ों का आदर करें — यह सबसे प्रभावी उपाय है।',
  'जरूरतमंद को अन्न/भोजन का दान करें।',
  'गुस्से और जल्दबाज़ी से बचें, सच और ईमानदारी से चलें।',
];

function composeRemedies(ctx, areas) {
  const list = [...BASE_REMEDIES];
  const weak = (k) => areas[k] && areas[k].score <= 2.6;

  if (weak('money') || ctx.inHouse('Rahu', 2)) list.push('मंगलवार/शनिवार को हनुमान चालीसा का पाठ करें; बिना सोचे उधार या जोखिम भरे निवेश से बचें।');
  if (weak('health') || ctx.isWeak('Moon')) list.push('सोमवार को सफेद वस्तु (दूध/चावल) का दान करें और दिनचर्या नियमित रखें।');
  if (weak('career') || ctx.lagnaLord === 'Saturn') list.push('शनिवार को मेहनतकश और बुजुर्ग लोगों की मदद करें; अनुशासन बनाए रखें।');
  if (weak('marriage')) list.push('जीवनसाथी के साथ संवाद बढ़ाएं; शुक्रवार को सफेद/सुगंधित वस्तु का दान शुभ रहेगा।');
  if (weak('children')) list.push('गुरुवार को पीली वस्तु/चने की दाल का दान करें और गुरु/बड़ों का आशीर्वाद लें।');
  if (weak('spirituality')) list.push('गुरुवार को गायत्री मंत्र का जाप और थोड़ा सेवा-कार्य मन को शक्ति देगा।');

  return {
    key: 'remedies',
    heading: L.AREA_LABEL.remedies,
    text: 'ये उपाय सरल, सुरक्षित और बिना खर्च के हैं — डर के लिए नहीं, बल्कि मन और जीवन में संतुलन के लिए:',
    points: [...new Set(list)],
    advice: [],
    caution: [],
  };
}

// ── Section 14: humanize an existing daily prediction (from today-prediction.js) ─
function composeDaily(prediction, ctx) {
  const meta = prediction?.meta || {};
  const moon = L.SIGN[ctx?.moonSign] || null;
  const maha = ctx?.dasha ? L.PLANET[ctx.dasha] : null;
  const taraLine = meta.tara?.name ? L.TARA_SIMPLE[meta.tara.name] : null;

  const mood = [moon ? `${moon.manas}।` : null, taraLine].filter(Boolean).join(' ')
    || 'आज मन सामान्य रहेगा।';
  const work = maha ? `${maha.dasha.theme}` : 'काम पर ध्यान देने का दिन है।';

  // relationship / money / health pulled from humanized area lines if present
  const advice = meta.advice?.hi || meta.advice || 'आज जो भी करें, शांत मन और धैर्य से करें।';
  const caution = meta.caution?.hi || meta.caution || 'जल्दबाज़ी और गुस्से से बचें।';

  const lucky = meta.lucky
    ? [meta.lucky.color_hi || meta.lucky.color, meta.lucky.number].filter(Boolean).join(' · ')
    : null;

  return {
    key: 'daily',
    heading: L.AREA_LABEL.daily,
    text: mood,
    points: [
      `कामकाज: ${work}`,
      'रिश्ते: आज अपनों के साथ बातचीत में नरमी रखें।',
      'सेहत: समय पर भोजन और थोड़ा आराम जरूरी है।',
    ],
    advice: [typeof advice === 'string' ? advice : ''],
    caution: [typeof caution === 'string' ? caution : ''],
    lucky,
  };
}

module.exports = { composeSummary, composeArea, composeDasha, composeYogas, composeRemedies, composeDaily };
