'use strict';
/**
 * Answer composer (Phase 3).
 *
 * Turns the deterministic evaluation into a HUMAN-READABLE, bilingual, sectioned
 * answer. It explains: the direct conclusion, the main Kundli reason, relevant
 * D-chart support/contradiction, current Dasha influence, current transit
 * influence (where available), positive potential, caution, practical action,
 * remedy (only when justified) and limitations.
 *
 * It NEVER returns raw scores or a dump of technical planet data as the user
 * answer — numeric scores stay in the (admin-only) trace.
 */

const PLANET_HI = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
  Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

// state → framing (deliberately non-alarming, especially for challenging states)
const STATE_FRAME = {
  highly_favourable:     { en: 'strongly supportive',   hi: 'अत्यधिक अनुकूल',  band: 'positive' },
  favourable:            { en: 'favourable',            hi: 'अनुकूल',          band: 'positive' },
  moderately_favourable: { en: 'moderately favourable', hi: 'सामान्यतः अनुकूल', band: 'positive' },
  mixed:                 { en: 'mixed',                 hi: 'मिश्रित',         band: 'mixed' },
  challenging:           { en: 'challenging',           hi: 'चुनौतीपूर्ण',     band: 'caution' },
  highly_challenging:    { en: 'demanding extra care',  hi: 'अधिक सावधानी वाला', band: 'caution' },
  insufficient_data:     { en: 'not yet determinable',  hi: 'अभी निर्धारित नहीं', band: 'none' },
};

const CONF_LABEL = {
  high:   { en: 'High',   hi: 'उच्च' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  low:    { en: 'Low',    hi: 'निम्न' },
};

function pName(name, lang) { return lang === 'hi' ? (PLANET_HI[name] || name) : name; }
function topLayers(layers, n, dir) {
  const s = [...(layers || [])].sort((a, b) => dir === 'pos' ? b.score - a.score : a.score - b.score);
  return s.slice(0, n);
}

// ── Section builders — each returns {title_en,title_hi,text_en,text_hi}|null ──
function sec_direct(ctx) {
  const f = ctx.ruleFacts || {};
  const frame = STATE_FRAME[ctx.state];
  const text_en = f.direct_en || `Regarding "${ctx.question.short_title_en}", your chart's overall indication is ${frame.en}. Treat this as a tendency and direction, not a fixed outcome.`;
  const text_hi = f.direct_hi || `"${ctx.question.short_title_hi}" के संबंध में, आपकी कुंडली का समग्र संकेत ${frame.hi} है। इसे एक प्रवृत्ति व दिशा मानें, निश्चित परिणाम नहीं।`;
  return { title_en: f.headline_en || 'Direct answer', title_hi: f.headline_hi || 'सीधा उत्तर', text_en, text_hi };
}

function sec_kundli(ctx) {
  const pos = topLayers(ctx.evidence.natal.layers, 2, 'pos');
  const neg = topLayers(ctx.evidence.natal.layers, 1, 'neg');
  if (!pos.length && !neg.length) return null;
  const strongEn = pos.filter((l) => l.score > 0).map((l) => l.label).join(' and ');
  const weakEn = neg.filter((l) => l.score < 0).map((l) => l.label).join(', ');
  let en = 'In your birth chart, ';
  en += strongEn ? `${strongEn} give the main support here.` : 'the relevant factors are moderate.';
  if (weakEn) en += ` ${weakEn} is comparatively weaker and needs conscious effort.`;
  let hi = 'आपकी जन्म कुंडली में ';
  hi += strongEn ? `${strongEn} इस विषय में मुख्य सहारा देते हैं।` : 'संबंधित कारक सामान्य हैं।';
  if (weakEn) hi += ` ${weakEn} तुलनात्मक रूप से कमजोर है और सचेत प्रयास चाहता है।`;
  return { title_en: 'What your Kundli indicates', title_hi: 'आपकी कुंडली क्या दर्शाती है', text_en: en, text_hi: hi };
}

function sec_dchart(ctx) {
  const layers = ctx.evidence.dchart.layers.filter((l) => !l.key.endsWith(':d1'));
  const fb = ctx.loaded.chartLoad.fallbacks;
  if (!layers.length && !fb.length) return null;
  const support = layers.filter((l) => l.score > 10).map((l) => l.label);
  const against = layers.filter((l) => l.score < -10).map((l) => l.label);
  let en = '', hi = '';
  if (support.length) { en += `The divisional chart(s) ${support.join(', ')} reinforce the reading. `; hi += `विभाजन चार्ट ${support.join(', ')} इस विश्लेषण को पुष्ट करते हैं। `; }
  if (against.length) { en += `However, ${against.join(', ')} points the other way, so the picture is not one-sided. `; hi += `किंतु ${against.join(', ')} विपरीत संकेत देते हैं, इसलिए स्थिति एकतरफा नहीं है। `; }
  if (!en) { en = 'The relevant divisional chart broadly agrees with the birth chart. '; hi = 'संबंधित विभाजन चार्ट मोटे तौर पर जन्म कुंडली से सहमत है। '; }
  return { title_en: 'Divisional-chart view', title_hi: 'विभाजन चार्ट का दृष्टिकोण', text_en: en.trim(), text_hi: hi.trim() };
}

function sec_dasha(ctx) {
  const d = ctx.loaded.selected.dasha.available;
  if (!d || (!d.maha && !d.antar)) return null;
  const maha = d.maha ? d.maha.lord : null;
  const antar = d.antar ? d.antar.lord : null;
  let en = maha ? `You are currently in the ${maha} major period` : 'Your current period';
  if (antar) en += ` with a ${antar} sub-period`;
  en += ', which shapes how these tendencies express right now.';
  let hi = maha ? `वर्तमान में आप ${pName(maha, 'hi')} की महादशा` : 'वर्तमान दशा';
  if (antar) hi += ` और ${pName(antar, 'hi')} की अंतर्दशा`;
  hi += ' में हैं, जो इन प्रवृत्तियों की वर्तमान अभिव्यक्ति तय करती है।';
  return { title_en: 'Current Dasha influence', title_hi: 'वर्तमान दशा प्रभाव', text_en: en, text_hi: hi };
}

function sec_transit(ctx) {
  if (!ctx.transit || !ctx.transit.available) return null;
  const rel = ctx.transit.transits.filter((t) => t.relevant_to_question);
  const scope = rel.length ? rel : ctx.transit.transits;
  const parts_en = scope.map((t) => `${t.planet} in ${t.transit_sign_en} (${t.classification}${t.transit_end ? `, until ~${t.transit_end}` : ''})`);
  const parts_hi = scope.map((t) => `${pName(t.planet, 'hi')} ${t.transit_sign_hi} में (${t.classification}${t.transit_end ? `, ~${t.transit_end} तक` : ''})`);
  const en = `Major slow-planet transits now: ${parts_en.join('; ')}. These mark periods of emphasis, not guaranteed dated events.`;
  const hi = `प्रमुख धीमे ग्रहों का वर्तमान गोचर: ${parts_hi.join('; ')}। ये बल के समय दर्शाते हैं, निश्चित तिथि की घटनाएँ नहीं।`;
  return { title_en: 'Current transit influence', title_hi: 'वर्तमान गोचर प्रभाव', text_en: en, text_hi: hi };
}

function sec_positive(ctx) {
  const pos = topLayers([...ctx.evidence.natal.layers, ...ctx.evidence.dchart.layers, ...ctx.evidence.timing.layers], 2, 'pos').filter((l) => l.score > 0);
  const drivers_en = pos.map((l) => l.label).join(', ') || 'your steady, workable base in this area';
  const drivers_hi = pos.map((l) => l.label).join(', ') || 'इस क्षेत्र में आपका स्थिर आधार';
  return {
    title_en: 'Positive potential', title_hi: 'सकारात्मक संभावना',
    text_en: `Your strongest support comes from ${drivers_en}. Building deliberately on this raises the odds in your favour.`,
    text_hi: `आपका सबसे बड़ा सहारा ${drivers_hi} से आता है। इस पर सोच-समझकर निर्माण करने से संभावना आपके पक्ष में बढ़ती है।`,
  };
}

function sec_caution(ctx) {
  const neg = topLayers([...ctx.evidence.natal.layers, ...ctx.evidence.timing.layers], 1, 'neg').filter((l) => l.score < 0);
  const en = neg.length
    ? `Keep a realistic watch on ${neg.map((l) => l.label).join(', ')}; avoid rushed, irreversible commitments in this area.`
    : 'No single factor is strongly adverse; the main caution is simply to avoid over-confidence and verify facts before big steps.';
  const hi = neg.length
    ? `${neg.map((l) => l.label).join(', ')} पर वास्तविक ध्यान रखें; इस क्षेत्र में जल्दबाजी में अपरिवर्तनीय निर्णय न लें।`
    : 'कोई एक कारक अत्यधिक प्रतिकूल नहीं है; मुख्य सावधानी यही है कि अति-आत्मविश्वास से बचें और बड़े कदम से पहले तथ्य जांचें।';
  return { title_en: 'Caution', title_hi: 'सावधानी', text_en: en, text_hi: hi };
}

function sec_timing_outlook(ctx) {
  if (!ctx.transit || !ctx.transit.available) return null;
  const s = ctx.transit.summary.overall;
  const en = s === 'supportive'
    ? 'The current slow-planet window is broadly supportive — a reasonable period to prepare and act deliberately.'
    : s === 'caution'
      ? 'The current slow-planet window asks for patience — use it to prepare rather than to force outcomes.'
      : 'The current window is mixed — progress is realistic through steady preparation and follow-up.';
  const hi = s === 'supportive'
    ? 'वर्तमान धीमे-ग्रह अवधि मोटे तौर पर सहायक है — तैयारी और सोच-समझकर कार्य के लिए उपयुक्त समय।'
    : s === 'caution'
      ? 'वर्तमान धीमे-ग्रह अवधि धैर्य मांगती है — परिणाम को मजबूर करने के बजाय तैयारी में इसका उपयोग करें।'
      : 'वर्तमान अवधि मिश्रित है — निरंतर तैयारी और अनुवर्तन से प्रगति संभव है।';
  return { title_en: 'Timing outlook', title_hi: 'समय का दृष्टिकोण', text_en: en, text_hi: hi };
}

function sec_practical(ctx) {
  const f = ctx.ruleFacts || {};
  return {
    title_en: 'Practical next step', title_hi: 'व्यावहारिक अगला कदम',
    text_en: f.action_en || 'Take one small, reversible step this month, compare it against real-world facts, and consult a trusted professional before any major or irreversible decision.',
    text_hi: f.action_hi || 'इस महीने एक छोटा, वापस लिया जा सकने वाला कदम उठाएं, उसे वास्तविक तथ्यों से मिलाएं, और किसी बड़े या अपरिवर्तनीय निर्णय से पहले विश्वसनीय विशेषज्ञ से सलाह लें।',
  };
}

function sec_remedy(ctx) {
  // Only when justified (question needs remedy AND state is not positive).
  if (!ctx.requirement.needs_remedy) return null;
  const r = ctx.remedy;
  if (!r) return null;
  return { title_en: 'Suggested remedy', title_hi: 'सुझाया गया उपाय', text_en: r.en, text_hi: r.hi };
}

function sec_important(ctx) {
  const limNotes_en = (ctx.limitations || []).map((l) => l.en);
  const limNotes_hi = (ctx.limitations || []).map((l) => l.hi);
  const en = ctx.disclaimers ? ctx.disclaimers.en : '';
  const hi = ctx.disclaimers ? ctx.disclaimers.hi : '';
  return {
    title_en: 'Important note', title_hi: 'महत्वपूर्ण सूचना',
    text_en: [en, ...limNotes_en].filter(Boolean).join(' '),
    text_hi: [hi, ...limNotes_hi].filter(Boolean).join(' '),
  };
}

const SECTION_FN = {
  direct_answer: sec_direct,
  kundli_indicates: sec_kundli,
  dchart_indication: sec_dchart,
  dasha_influence: sec_dasha,
  transit_influence: sec_transit,
  positive: sec_positive,
  caution: sec_caution,
  timing_outlook: sec_timing_outlook,
  practical_guidance: sec_practical,
  remedy: sec_remedy,
  important_note: sec_important,
};

// Extra safety wrapper for the two caution states (owner rule): append a
// realistic review period + reassurance, avoid certainty-of-loss language.
function applyChallengingSafety(sections, ctx) {
  if (ctx.state !== 'challenging' && ctx.state !== 'highly_challenging') return sections;
  const note = {
    en: 'This points to a demanding phase, not a fixed negative outcome. Review the situation again in about 3 months, focus on what you can control, and seek qualified guidance for any major decision.',
    hi: 'यह एक कठिन चरण दर्शाता है, कोई निश्चित नकारात्मक परिणाम नहीं। लगभग 3 महीने बाद स्थिति की पुनः समीक्षा करें, जो नियंत्रण में है उस पर ध्यान दें, और किसी बड़े निर्णय के लिए योग्य मार्गदर्शन लें।',
  };
  const idx = sections.findIndex((s) => s.key === 'caution');
  const wrapped = { key: 'review_period', title_en: 'Perspective & review', title_hi: 'दृष्टिकोण व समीक्षा', text_en: note.en, text_hi: note.hi };
  if (idx >= 0) sections.splice(idx + 1, 0, wrapped); else sections.push(wrapped);
  return sections;
}

/**
 * @returns {
 *   state, confidence:{level,label_en,label_hi},
 *   sections:[{key,title_en,title_hi,text_en,text_hi}],
 *   disclaimers, limitations
 * }
 */
function compose(ctx) {
  const order = ctx.requirement.answer_sections || ['direct_answer', 'important_note'];
  const sections = [];
  for (const key of order) {
    const fn = SECTION_FN[key];
    if (!fn) continue;
    const s = fn(ctx);
    if (s) sections.push({ key, ...s });
  }
  applyChallengingSafety(sections, ctx);

  return {
    state: ctx.state,
    state_label: { en: STATE_FRAME[ctx.state].en, hi: STATE_FRAME[ctx.state].hi },
    confidence: { level: ctx.confidence, ...CONF_LABEL[ctx.confidence] },
    sections,
    limitations: ctx.limitations || [],
  };
}

module.exports = { compose, STATE_FRAME, PLANET_HI };
