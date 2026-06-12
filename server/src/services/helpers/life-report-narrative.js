'use strict';
// Detailed "true understanding" narratives for the Life Report panel.
// Composes multi-paragraph readings per section from REAL chart factors:
// house-lord placements (144 BPHS interpretations from bhava_lord_readings),
// karaka planet conditions, active yogas/doshas and the running dasha.

const { P_HI, HOUSE_THEME } = require('./cosmic-insights');

const H_HI = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पांचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें'];
const ord = (n) => `${n}${[, 'st', 'nd', 'rd'][n % 10] && ![11, 12, 13].includes(n % 100) ? ([, 'st', 'nd', 'rd'][n % 10] || 'th') : 'th'}`;

function planetHouse(chart, name) {
  const p = chart?.planets?.[name];
  const ascR = chart?.ascendant?.rashi_num;
  return p?.rashi_num && ascR ? ((p.rashi_num - ascR + 12) % 12) + 1 : null;
}

function dignityTone(dignity) {
  const d = String(dignity || '').toLowerCase();
  if (d.includes('exalt') || d.includes('mool')) return 'strong';
  if (d.includes('own') || d.includes('friend')) return 'good';
  if (d.includes('debil') || d.includes('enemy')) return 'weak';
  return 'neutral';
}

const TONE_TXT = {
  strong:  { en:'is excellently placed and delivers its promises powerfully', hi:'उत्तम स्थिति में है और अपने फल प्रबलता से देता है' },
  good:    { en:'is comfortably placed and supports you reliably',            hi:'अनुकूल स्थिति में है और आपको विश्वसनीय समर्थन देता है' },
  neutral: { en:'is moderately placed — results come with consistent effort', hi:'मध्यम स्थिति में है — फल निरंतर प्रयास से मिलते हैं' },
  weak:    { en:'is under pressure and needs remedial support to give its best', hi:'दबाव में है और श्रेष्ठ फल के लिए उपाय-समर्थन चाहता है' },
};

// "{Planet}, the karaka of X, sits in your Nth house in dignity — tone"
function karakaPara(chart, name, role_en, role_hi) {
  const p = chart?.planets?.[name];
  if (!p) return null;
  const h = planetHouse(chart, name);
  const tone = TONE_TXT[dignityTone(p.dignity)];
  const ht = h ? HOUSE_THEME[h] : null;
  return {
    en: `${name}, the natural karaka of ${role_en}, sits in your ${ord(h)} house in ${p.rashi_en} (${p.dignity || 'neutral dignity'}${p.is_retrograde ? ', retrograde' : ''}${p.is_combust ? ', combust' : ''}). It ${tone.en}. ${ht ? `Through this position, ${role_en} in your life is deeply linked with ${ht.en}.` : ''}`,
    hi: `${role_hi} का नैसर्गिक कारक ${P_HI[name]} आपके ${H_HI[h] || h} भाव में ${p.rashi_hi} राशि में है${p.is_retrograde ? ' (वक्री)' : ''}। यह ग्रह ${tone.hi}। ${ht ? `इस स्थिति से आपके जीवन में ${role_hi} का गहरा संबंध ${ht.hi} से है।` : ''}`,
  };
}

// BPHS house-lord paragraph: framing + full classical interpretation
function lordPara(readings, houseNum, context_en, context_hi) {
  const rd = (readings || []).find((r) => r.house_number === houseNum);
  if (!rd?.interpretation_en) return null;
  return {
    en: `${context_en} The lord of your ${ord(houseNum)} house is ${rd.lord_planet}, placed in your ${ord(rd.placed_in_house)} house.${rd.forms_viparita_yoga ? ' This forms a Viparita Raja Yoga — difficulty turning into unexpected gain.' : ''} The classical (BPHS) reading: ${rd.interpretation_en}`,
    hi: `${context_hi} आपके ${H_HI[houseNum] || houseNum} भाव का स्वामी ${P_HI[rd.lord_planet] || rd.lord_planet} है, जो आपके ${H_HI[rd.placed_in_house] || rd.placed_in_house} भाव में स्थित है।${rd.forms_viparita_yoga ? ' इससे विपरीत राजयोग बनता है — कठिनाई अप्रत्याशित लाभ में बदलती है।' : ''} शास्त्रीय (BPHS) फल: ${rd.interpretation_hi || rd.interpretation_en}`,
  };
}

function dashaPara(chart, relevantPlanets, area_en, area_hi) {
  const maha = Array.isArray(chart?.dasha) ? chart.dasha.find((d) => d.is_current) : null;
  const antar = maha?.antardasha?.find((a) => a.is_current);
  if (!maha) return null;
  const active = [maha.lord, antar?.lord].filter((l) => relevantPlanets.includes(l));
  if (active.length) {
    return {
      en: `Importantly, your running ${maha.lord} Mahadasha${antar ? ` with ${antar.lord} Antardasha` : ''} directly activates ${area_en} right now — events in this area are ripening in the current period (till ${String((antar || maha).end).slice(0, 10)}).`,
      hi: `महत्वपूर्ण: आपकी वर्तमान ${P_HI[maha.lord]} महादशा${antar ? ` और ${P_HI[antar.lord]} अंतर्दशा` : ''} इस समय ${area_hi} को सीधे सक्रिय करती है — इस क्षेत्र की घटनाएं वर्तमान अवधि (${String((antar || maha).end).slice(0, 10)} तक) में पक रही हैं।`,
    };
  }
  return {
    en: `Your running ${maha.lord} Mahadasha${antar ? `-${antar.lord} Antardasha` : ''} does not directly rule ${area_en}, so this area follows its base promise — steady, without dramatic dasha-triggered turns for now.`,
    hi: `वर्तमान ${P_HI[maha.lord]} महादशा${antar ? `-${P_HI[antar.lord]} अंतर्दशा` : ''} ${area_hi} पर सीधा अधिकार नहीं रखती, इसलिए यह क्षेत्र अभी अपने मूल वचन के अनुसार स्थिर चलता है।'`,
  };
}

function scorePara(score, area_en, area_hi) {
  if (score == null) return null;
  const s = +score;
  const band = s >= 4.5
    ? { en:`Overall, ${area_en} is one of the gifted areas of this chart — protect it with gratitude and it keeps growing.`, hi:`कुल मिलाकर, ${area_hi} इस कुंडली के वरदान-क्षेत्रों में से है — कृतज्ञता से इसकी रक्षा करें, यह बढ़ता रहेगा।` }
    : s >= 3.5
    ? { en:`Overall, ${area_en} is well supported — with conscious effort it rises clearly above average.`, hi:`कुल मिलाकर, ${area_hi} को अच्छा समर्थन है — सजग प्रयास से यह स्पष्ट रूप से औसत से ऊपर उठता है।` }
    : s >= 2.5
    ? { en:`Overall, ${area_en} shows mixed signals — strong patches alternate with testing phases, so timing decisions with good dasha periods matters.`, hi:`कुल मिलाकर, ${area_hi} में मिश्रित संकेत हैं — अच्छे दौर और परीक्षा के दौर बारी-बारी आते हैं, इसलिए निर्णय शुभ दशा में लेना महत्वपूर्ण है।` }
    : { en:`Overall, ${area_en} is the area this chart asks you to work on consciously — remedies, patience and disciplined timing convert this weakness into wisdom.`, hi:`कुल मिलाकर, ${area_hi} वह क्षेत्र है जिस पर यह कुंडली सजग कार्य मांगती है — उपाय, धैर्य और सही समय इस कमजोरी को समझ में बदल देते हैं।` };
  return band;
}

function buildLifeReportNarratives(chart, readings) {
  if (!chart?.planets || !chart?.ascendant) return null;
  const lr = chart.life_report?.sections || {};
  const out = {};

  // ── Soul Profile ──
  {
    const paras = [];
    const asc = chart.ascendant;
    paras.push({
      en: `You were born with ${asc.rashi_en} rising — this is the lens through which your entire chart expresses itself: your body, instincts, and the first impression you leave. Your Moon rests in ${chart.planets.Moon?.rashi_en || ''} in the nakshatra of ${chart.nakshatra?.en || ''} (pada ${chart.nakshatra?.pada || ''}), which shapes the private, emotional self that only close ones see.`,
      hi: `आपका जन्म ${asc.rashi_hi} लग्न में हुआ है — यही वह दृष्टि है जिससे आपकी पूरी कुंडली व्यक्त होती है: आपका शरीर, स्वभाव और पहली छाप। आपका चंद्रमा ${chart.planets.Moon?.rashi_hi || ''} राशि में ${chart.nakshatra?.hi || chart.nakshatra?.en || ''} नक्षत्र (चरण ${chart.nakshatra?.pada || ''}) में है, जो आपका निजी, भावनात्मक रूप गढ़ता है।`,
    });
    const p1 = lordPara(readings, 1,
      'The most personal indicator is where your Lagna lord goes — it shows where your life energy naturally flows.',
      'सबसे व्यक्तिगत संकेत है लग्नेश की स्थिति — यह बताता है कि आपकी जीवन-ऊर्जा स्वाभाविक रूप से कहाँ बहती है।');
    if (p1) paras.push(p1);
    const ak = chart._atmakaraka;
    if (ak?.planet) {
      const dev = chart._ishtaDevata;
      paras.push({
        en: `Your Atmakaraka (soul planet) is ${ak.planet} at ${(+ak.degree).toFixed(2)}° — the deepest desire of this birth is the lesson of ${ak.planet}.${dev ? ` From its Navamsha position, your Isht Devata is ${dev.ishta_devata_en} — worship aligned with this deity steadies the soul's path.` : ''}`,
        hi: `आपका आत्मकारक ${P_HI[ak.planet]} है (${(+ak.degree).toFixed(2)}°) — इस जन्म की गहरी अभिलाषा ${P_HI[ak.planet]} का पाठ है।${dev ? ` नवांश स्थिति से आपके इष्ट देवता ${dev.ishta_devata_hi || dev.ishta_devata_en} हैं — इनकी उपासना आत्मा के मार्ग को स्थिर करती है।` : ''}`,
      });
    }
    const dp = dashaPara(chart, [chart.ascendant.rashi_lord, 'Moon'], 'your personality and self-image', 'आपके व्यक्तित्व और आत्म-छवि');
    if (dp) paras.push(dp);
    out.profile = paras;
  }

  // ── Finance ──
  {
    const paras = [];
    const p2 = lordPara(readings, 2,
      'Your earning capacity and accumulated wealth are ruled by the 2nd house.',
      'आपकी कमाई की क्षमता और संचित धन दूसरे भाव से शासित हैं।');
    if (p2) paras.push(p2);
    const p11 = lordPara(readings, 11,
      'Gains, income streams and the fulfilment of desires come from the 11th house.',
      'लाभ, आय के स्रोत और इच्छाओं की पूर्ति ग्यारहवें भाव से आती है।');
    if (p11) paras.push(p11);
    const kj = karakaPara(chart, 'Jupiter', 'wealth and expansion', 'धन और विस्तार');
    if (kj) paras.push(kj);
    const yogas = lr.finance?.wealth_yogas;
    if (Array.isArray(yogas) && yogas.length) {
      paras.push({
        en: `This chart carries active wealth combinations: ${yogas.map((y) => y.name || y).join(', ')}. These are not just labels — each one is a working circuit that pays out when its planets run in dasha or are strengthened by remedy.`,
        hi: `इस कुंडली में सक्रिय धन योग हैं: ${yogas.map((y) => y.name_hi || y.name || y).join(', ')}। ये केवल नाम नहीं — हर योग एक कार्यरत परिपथ है जो अपनी दशा में या उपाय से बल पाकर फल देता है।`,
      });
    }
    const dp = dashaPara(chart, ['Jupiter', 'Venus', (readings || []).find((r) => r.house_number === 2)?.lord_planet, (readings || []).find((r) => r.house_number === 11)?.lord_planet].filter(Boolean), 'wealth and income', 'धन और आय');
    if (dp) paras.push(dp);
    const sp = scorePara(lr.finance?.overall_score, 'finance', 'वित्त');
    if (sp) paras.push(sp);
    out.finance = paras;
  }

  // ── Family ──
  {
    const paras = [];
    const p4 = lordPara(readings, 4,
      'Home, mother and inner contentment live in the 4th house.',
      'घर, माता और आंतरिक संतोष चौथे भाव में बसते हैं।');
    if (p4) paras.push(p4);
    const km = karakaPara(chart, 'Moon', 'mother and emotional nourishment', 'माता और भावनात्मक पोषण');
    if (km) paras.push(km);
    const ks = karakaPara(chart, 'Sun', 'father and lineage', 'पिता और वंश');
    if (ks) paras.push(ks);
    const p3 = lordPara(readings, 3,
      'Siblings and your own courage are read from the 3rd house.',
      'भाई-बहन और आपका साहस तीसरे भाव से देखा जाता है।');
    if (p3) paras.push(p3);
    const sp = scorePara(lr.family?.overall_score, 'family life', 'पारिवारिक जीवन');
    if (sp) paras.push(sp);
    out.family = paras;
  }

  // ── Health ──
  {
    const paras = [];
    const p1 = lordPara(readings, 1,
      'Vitality begins with the Lagna and its lord — the strength of the body itself.',
      'जीवनी-शक्ति लग्न और लग्नेश से शुरू होती है — स्वयं शरीर का बल।');
    if (p1) paras.push(p1);
    const p6 = lordPara(readings, 6,
      'Disease, debts and daily resistance are governed by the 6th house.',
      'रोग, ऋण और दैनिक प्रतिरोध छठे भाव से शासित हैं।');
    if (p6) paras.push(p6);
    const p8 = lordPara(readings, 8,
      'Chronic patterns and longevity flow from the 8th house.',
      'दीर्घकालिक प्रवृत्तियां और आयु आठवें भाव से जुड़ी हैं।');
    if (p8) paras.push(p8);
    const sat = chart.planets.Saturn, mars = chart.planets.Mars;
    if (sat || mars) {
      const satH = planetHouse(chart, 'Saturn'), marsH = planetHouse(chart, 'Mars');
      paras.push({
        en: `The two natural malefics set your body's stress points: Saturn in your ${ord(satH)} house slowly tests ${HOUSE_THEME[satH]?.en || 'its house themes'}, while Mars in your ${ord(marsH)} house brings heat and urgency to ${HOUSE_THEME[marsH]?.en || 'its house themes'}. Routines that respect both — discipline without burnout — are your real health insurance.`,
        hi: `दो नैसर्गिक पाप ग्रह आपके शरीर के दबाव-बिंदु तय करते हैं: शनि ${H_HI[satH] || satH} भाव में ${HOUSE_THEME[satH]?.hi || ''} की धीमी परीक्षा लेता है, और मंगल ${H_HI[marsH] || marsH} भाव में ${HOUSE_THEME[marsH]?.hi || ''} में गर्मी और तीव्रता लाता है। दोनों का सम्मान करती दिनचर्या — बिना थकान का अनुशासन — ही आपका असली स्वास्थ्य-बीमा है।`,
      });
    }
    const sp = scorePara(lr.health?.overall_score, 'health', 'स्वास्थ्य');
    if (sp) paras.push(sp);
    out.health = paras;
  }

  // ── Problems & Solutions ──
  {
    const paras = [];
    [6, 8, 12].forEach((h) => {
      const ctx = {
        6:  ['The 6th house shows the battles you are built to win.', 'छठा भाव वे संघर्ष दिखाता है जिन्हें जीतने के लिए आप बने हैं।'],
        8:  ['The 8th house shows sudden turns and hidden tests.', 'आठवां भाव अचानक मोड़ और गुप्त परीक्षाएं दिखाता है।'],
        12: ['The 12th house shows losses, foreign lands and final liberation.', 'बारहवां भाव हानि, विदेश और अंतिम मुक्ति दिखाता है।'],
      }[h];
      const p = lordPara(readings, h, ctx[0], ctx[1]);
      if (p) paras.push(p);
    });
    const doshas = chart.yogas_doshas?.doshas || [];
    if (doshas.length) {
      paras.push({
        en: `Active doshas in this chart: ${doshas.map((d) => `${d.name} (${d.severity})`).join(', ')}. Read each one as a karmic assignment rather than a curse — ${doshas.filter((d) => d.is_cancelled).length ? 'note that some already stand relieved by protective placements, ' : ''}and the targeted remedies in this report directly address them.`,
        hi: `इस कुंडली के सक्रिय दोष: ${doshas.map((d) => `${d.name_hi || d.name}`).join(', ')}। हर दोष को अभिशाप नहीं, कर्म का सौंपा कार्य समझें — ${doshas.filter((d) => d.is_cancelled).length ? 'कुछ दोष रक्षक स्थितियों से पहले ही शांत हैं, ' : ''}और इस रिपोर्ट के लक्षित उपाय इन्हें सीधे संबोधित करते हैं।`,
      });
    } else {
      paras.push({
        en: 'No major dosha is active in this chart — the obstacles you face are ordinary life friction, not karmic blockages, and respond quickly to effort.',
        hi: 'इस कुंडली में कोई बड़ा दोष सक्रिय नहीं है — आपकी बाधाएं सामान्य जीवन-घर्षण हैं, कर्मगत अवरोध नहीं, और प्रयास से शीघ्र हल होती हैं।',
      });
    }
    out.problems = paras;
  }

  return out;
}

module.exports = { buildLifeReportNarratives };
