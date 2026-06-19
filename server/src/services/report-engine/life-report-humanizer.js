'use strict';
/**
 * Life Report Humanizer — Session 54
 *
 * Converts the 14-section report-engine output + raw life-report.service data
 * into 5 user-friendly bilingual sections for normal users.
 *
 * Returns: { sections[5], advancedRemedies{en,hi}, technicalAvailable:true }
 *
 * Section mapping:
 *   soul       ← personality + spirituality + dasha
 *   money      ← money + career + property
 *   family     ← family + marriage + children + siblings
 *   health     ← health
 *   challenges ← debt + doshas/problems (technical only)
 */
const { generateLifeReport } = require('./index');
const { getLexicon } = require('./lexicon');

// ─── Advanced remedies (Level B) — always collapsed, for astrologer consult ──
const ADVANCED_B = {
  en: [
    'Sri Rudram (Namakam & Chamakam) — for deep karmic clearing and Shiva grace.',
    'Navgraha Suktam — a comprehensive remedy for all nine planets simultaneously.',
    'Santana Gopala Mantra — for blessings related to children and family lineage.',
    'Ganapati Atharva Sheersha — for clearing obstacles at the root.',
    'For marriage or children rituals: always consult a qualified astrologer before performing any advanced ritual.',
  ],
  hi: [
    'श्री रुद्रम् (नमकम् और चमकम्) — गहरी कर्मिक शुद्धि और शिव कृपा के लिए।',
    'नवग्रह सूक्तम् — एक साथ सभी नौ ग्रहों का व्यापक उपाय।',
    'संतान गोपाल मंत्र — संतान और परिवार की कृपा के लिए।',
    'गणपति अथर्वशीर्ष — जड़ से बाधाएं हटाने के लिए।',
    'विवाह या संतान से जुड़े अनुष्ठान के लिए: कोई भी उन्नत अनुष्ठान करने से पहले किसी योग्य ज्योतिषी से परामर्श जरूर लें।',
  ],
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function secMap(sections) {
  const m = {};
  for (const s of sections) m[s.key] = s;
  return m;
}

function pts(section) {
  if (!section) return [];
  const arr = [];
  if (section.text) arr.push(section.text);
  if (Array.isArray(section.points)) arr.push(...section.points);
  return arr.filter(Boolean);
}

function caut(section) {
  return section ? (section.caution || []).filter(Boolean) : [];
}

function adv(section) {
  return section ? (section.advice || []).filter(Boolean) : [];
}

function worstStatus(keys, map) {
  const order = { care: 0, mid: 1, strong: 2 };
  let worst = 'strong';
  for (const k of keys) {
    const s = map[k];
    if (s && (order[s.statusKey] ?? 3) < (order[worst] ?? 3)) worst = s.statusKey;
  }
  return worst;
}

function remedies(LEX, dashaKey, extraKeys) {
  const R = LEX.REMEDIES;
  const out = [...R.base];
  if (dashaKey && R.dasha?.[dashaKey]) out.push(R.dasha[dashaKey]);
  for (const k of (extraKeys || [])) {
    if (R[k]) out.push(R[k]);
  }
  return out;
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildSoul(enMap, hiMap, lifeReport, LEX_EN, LEX_HI, dashaKey) {
  const persEn = enMap.personality, persHi = hiMap.personality;
  const spirEn = enMap.spirituality, spirHi = hiMap.spirituality;
  const dashEn = enMap.dasha,        dashHi = hiMap.dasha;

  const summaryEn = [persEn?.text, spirEn?.text].filter(Boolean).join(' ');
  const summaryHi = [persHi?.text, spirHi?.text].filter(Boolean).join(' ');

  const goodPointsEn = [
    ...pts(persEn).slice(0, 2),
    ...pts(dashEn).slice(0, 1),
    ...pts(spirEn).slice(0, 1),
  ].filter(Boolean);
  const goodPointsHi = [
    ...pts(persHi).slice(0, 2),
    ...pts(dashHi).slice(0, 1),
    ...pts(spirHi).slice(0, 1),
  ].filter(Boolean);

  const challengesEn = [...caut(persEn), ...caut(spirEn)].slice(0, 2);
  const challengesHi = [...caut(persHi), ...caut(spirHi)].slice(0, 2);

  const adviceEn = [...adv(persEn), ...adv(dashEn)].filter(Boolean).slice(0, 2);
  const adviceHi = [...adv(persHi), ...adv(dashHi)].filter(Boolean).slice(0, 2);

  // Current dasha narrative (from report-engine, already user-friendly)
  const dashaTextEn = dashEn?.text || '';
  const dashaTextHi = dashHi?.text || '';

  const rawProf = lifeReport?.sections?.profile || {};
  const technicalDetails = {
    ishta_devata: rawProf.ishta_devata || null,
    lagna: rawProf.lagna || null,
    moon_sign: rawProf.moon_sign || null,
    nakshatra: rawProf.nakshatra || null,
    current_dasha: rawProf.current_dasha || null,
  };

  return {
    key: 'soul', titleEn: 'Soul Direction', titleHi: 'आत्मिक दिशा',
    statusKey: worstStatus(['personality', 'spirituality'], enMap),
    summaryEn: summaryEn || 'Your chart reveals a unique personality shaped by your ascendant and moon sign.',
    summaryHi: summaryHi || 'आपकी कुंडली एक अनूठे व्यक्तित्व को दर्शाती है।',
    goodPointsEn, goodPointsHi,
    challengesEn, challengesHi,
    adviceEn, adviceHi,
    dashaTextEn, dashaTextHi,
    simpleRemediesEn: remedies(LEX_EN, dashaKey, ['spirituality']),
    simpleRemediesHi: remedies(LEX_HI, dashaKey, ['spirituality']),
    technicalDetails,
  };
}

function buildMoney(enMap, hiMap, lifeReport, LEX_EN, LEX_HI) {
  const monEn = enMap.money, monHi = hiMap.money;
  const carEn = enMap.career, carHi = hiMap.career;
  const propEn = enMap.property, propHi = hiMap.property;

  const summaryEn = [monEn?.text, carEn?.text].filter(Boolean).join(' ');
  const summaryHi = [monHi?.text, carHi?.text].filter(Boolean).join(' ');

  const goodPointsEn = [...pts(monEn), ...pts(carEn)].filter(Boolean).slice(0, 3);
  const goodPointsHi = [...pts(monHi), ...pts(carHi)].filter(Boolean).slice(0, 3);
  if (propEn?.text) goodPointsEn.push(propEn.text);
  if (propHi?.text) goodPointsHi.push(propHi.text);

  const challengesEn = [...caut(monEn), ...caut(carEn)].slice(0, 2);
  const challengesHi = [...caut(monHi), ...caut(carHi)].slice(0, 2);

  const adviceEn = [...adv(monEn), ...adv(carEn)].filter(Boolean).slice(0, 2);
  const adviceHi = [...adv(monHi), ...adv(carHi)].filter(Boolean).slice(0, 2);

  const rawFin = lifeReport?.sections?.finance || {};
  const technicalDetails = {
    indicators: rawFin.indicators || [],
    wealth_yogas: rawFin.wealth_yogas || [],
    rawProblems: (rawFin.problems || []).map((p) => ({ en: p.en, hi: p.hi })),
  };

  return {
    key: 'money', titleEn: 'Money', titleHi: 'धन',
    statusKey: worstStatus(['money', 'career'], enMap),
    summaryEn: summaryEn || 'Your chart indicates practical money-making abilities and work opportunities.',
    summaryHi: summaryHi || 'आपकी कुंडली व्यावहारिक धन-अर्जन क्षमता और कार्य-अवसरों की ओर संकेत करती है।',
    goodPointsEn: goodPointsEn.filter(Boolean),
    goodPointsHi: goodPointsHi.filter(Boolean),
    challengesEn, challengesHi,
    adviceEn: adviceEn.filter(Boolean),
    adviceHi: adviceHi.filter(Boolean),
    simpleRemediesEn: remedies(LEX_EN, null, ['money', 'career']),
    simpleRemediesHi: remedies(LEX_HI, null, ['money', 'career']),
    technicalDetails,
  };
}

function buildFamily(enMap, hiMap, lifeReport, LEX_EN, LEX_HI) {
  const famEn = enMap.family,   famHi = hiMap.family;
  const marEn = enMap.marriage, marHi = hiMap.marriage;
  const chlEn = enMap.children, chlHi = hiMap.children;

  const summaryEn = [famEn?.text, marEn?.text].filter(Boolean).join(' ');
  const summaryHi = [famHi?.text, marHi?.text].filter(Boolean).join(' ');

  const goodPointsEn = [
    ...pts(famEn).slice(0, 2),
    ...pts(marEn).slice(0, 1),
    ...pts(chlEn).slice(0, 1),
  ].filter(Boolean);
  const goodPointsHi = [
    ...pts(famHi).slice(0, 2),
    ...pts(marHi).slice(0, 1),
    ...pts(chlHi).slice(0, 1),
  ].filter(Boolean);

  const challengesEn = [...caut(famEn), ...caut(marEn), ...caut(chlEn)].slice(0, 3);
  const challengesHi = [...caut(famHi), ...caut(marHi), ...caut(chlHi)].slice(0, 3);

  const adviceEn = [...adv(famEn), ...adv(marEn)].filter(Boolean).slice(0, 2);
  const adviceHi = [...adv(famHi), ...adv(marHi)].filter(Boolean).slice(0, 2);
  if (!adviceEn.some((a) => /astrologer|matching/i.test(a))) {
    adviceEn.push('Before marriage, proper kundli matching and guidance from a qualified astrologer is recommended.');
  }
  if (!adviceHi.some((a) => /ज्योतिषी|मिलान/.test(a))) {
    adviceHi.push('विवाह से पहले सही कुंडली मिलान और किसी योग्य ज्योतिषी का मार्गदर्शन अनुशंसित है।');
  }

  const rawFam = lifeReport?.sections?.family || {};
  const technicalDetails = {
    doshas_detected: rawFam.doshas_detected || [],
    rawProblems: (rawFam.problems || []).map((p) => ({ en: p.en, hi: p.hi })),
  };

  return {
    key: 'family', titleEn: 'Family & Relationships', titleHi: 'परिवार और रिश्ते',
    statusKey: worstStatus(['family', 'marriage'], enMap),
    summaryEn: summaryEn || 'Your chart shows family bonds and relationship patterns shaped by multiple factors.',
    summaryHi: summaryHi || 'आपकी कुंडली पारिवारिक बंधन और रिश्तों के पैटर्न को कई कारकों के रूप में दिखाती है।',
    goodPointsEn, goodPointsHi,
    challengesEn, challengesHi,
    adviceEn: adviceEn.filter(Boolean),
    adviceHi: adviceHi.filter(Boolean),
    simpleRemediesEn: remedies(LEX_EN, null, ['marriage', 'children']),
    simpleRemediesHi: remedies(LEX_HI, null, ['marriage', 'children']),
    technicalDetails,
  };
}

function buildHealth(enMap, hiMap, lifeReport, LEX_EN, LEX_HI) {
  const heaEn = enMap.health, heaHi = hiMap.health;

  const summaryEn = heaEn?.text || 'Your chart suggests that consistent routine, adequate rest and stress management support good health.';
  const summaryHi = heaHi?.text || 'आपकी कुंडली बताती है कि नियमित दिनचर्या, पर्याप्त आराम और तनाव प्रबंधन स्वास्थ्य को बेहतर बनाते हैं।';

  const goodPointsEn = pts(heaEn).slice(0, 2);
  const goodPointsHi = pts(heaHi).slice(0, 2);

  const challengesEn = caut(heaEn).slice(0, 2);
  const challengesHi = caut(heaHi).slice(0, 2);

  const adviceEn = adv(heaEn).slice(0, 2);
  const adviceHi = adv(heaHi).slice(0, 2);
  const dnEn = 'These are astrological indications only. For any health concern, always consult a qualified doctor.';
  const dnHi = 'ये ज्योतिषीय संकेत मात्र हैं। किसी भी स्वास्थ्य समस्या के लिए डॉक्टर से अवश्य परामर्श लें।';
  if (!adviceEn.includes(dnEn)) adviceEn.push(dnEn);
  if (!adviceHi.includes(dnHi)) adviceHi.push(dnHi);

  const rawHea = lifeReport?.sections?.health || {};
  const technicalDetails = {
    indicators: rawHea.indicators || [],
    rawProblems: (rawHea.problems || []).map((p) => ({ en: p.en, hi: p.hi })),
  };

  return {
    key: 'health', titleEn: 'Health', titleHi: 'स्वास्थ्य',
    statusKey: enMap.health?.statusKey || 'mid',
    summaryEn, summaryHi,
    goodPointsEn: goodPointsEn.filter(Boolean),
    goodPointsHi: goodPointsHi.filter(Boolean),
    challengesEn: challengesEn.filter(Boolean),
    challengesHi: challengesHi.filter(Boolean),
    adviceEn, adviceHi,
    simpleRemediesEn: remedies(LEX_EN, null, ['health']),
    simpleRemediesHi: remedies(LEX_HI, null, ['health']),
    technicalDetails,
  };
}

function buildChallenges(enMap, hiMap, lifeReport, LEX_EN, LEX_HI, judgement) {
  const debtEn = enMap.debt, debtHi = hiMap.debt;

  const summaryEn = 'Some chart factors may bring occasional emotional pressure or responsibilities that need patience. A steady routine, open communication with trusted people, and regular spiritual practice help significantly.';
  const summaryHi = 'कुछ कुंडली कारक कभी-कभी भावनात्मक दबाव या जिम्मेदारियाँ ला सकते हैं जिनके लिए धैर्य जरूरी है। एक स्थिर दिनचर्या, विश्वसनीय लोगों से खुली बातचीत और नियमित आध्यात्मिक साधना इसमें काफी मदद करती है।';

  const goodPointsEn = pts(debtEn).slice(0, 1);
  const goodPointsHi = pts(debtHi).slice(0, 1);

  const challengesEn = [
    'Certain periods may bring extra responsibilities or emotional weight — a daily routine keeps the mind balanced.',
    'Some areas may need more disciplined planning and correct timing for results.',
    ...caut(debtEn).slice(0, 1),
  ].filter(Boolean);
  const challengesHi = [
    'कुछ समय पर अतिरिक्त जिम्मेदारी या भावनात्मक भार आ सकता है — दैनिक दिनचर्या मन को संतुलित रखती है।',
    'कुछ क्षेत्रों में परिणाम के लिए अधिक अनुशासित योजना और सही समय की जरूरत हो सकती है।',
    ...caut(debtHi).slice(0, 1),
  ].filter(Boolean);

  const adviceEn = ['Routine, open communication, prayer, family support and patient effort are the most effective solutions.'];
  const adviceHi = ['दिनचर्या, खुली बातचीत, पूजा, पारिवारिक सहयोग और धैर्यपूर्ण प्रयास सबसे प्रभावी समाधान हैं।'];

  const rawProb = lifeReport?.sections?.problems || {};
  const judgementChallenging = (judgement?.areas || [])
    .filter((a) => a.status === 'challenging' || a.status === 'needs-care');

  const technicalDetails = {
    doshas_detected: rawProb.doshas_detected || [],
    judgementChallenging: judgementChallenging.map((a) => ({
      keyEn: a.titleEn || a.areaKey,
      keyHi: a.titleHi || a.areaKey,
      status: a.status,
      summaryEn: a.userSummaryEn || '',
      summaryHi: a.userSummaryHi || '',
    })),
    rawProblems: (rawProb.problems || []).map((p) => ({ en: p.en, hi: p.hi })),
  };

  return {
    key: 'challenges', titleEn: 'Challenges & Solutions', titleHi: 'सावधानी और समाधान',
    statusKey: enMap.debt?.statusKey || 'mid',
    summaryEn, summaryHi,
    goodPointsEn: goodPointsEn.filter(Boolean),
    goodPointsHi: goodPointsHi.filter(Boolean),
    challengesEn, challengesHi,
    adviceEn, adviceHi,
    simpleRemediesEn: remedies(LEX_EN, null, ['spirituality']),
    simpleRemediesHi: remedies(LEX_HI, null, ['spirituality']),
    technicalDetails,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

function composeLifeReportUserFriendly(chart, lifeReport, judgement, opts = {}) {
  // Call report-engine in both languages to get soft humanized text
  const repEn = generateLifeReport(chart || {}, { lang: 'en', judgement });
  const repHi = generateLifeReport(chart || {}, { lang: 'hi', judgement });

  const LEX_EN = getLexicon('en');
  const LEX_HI = getLexicon('hi');

  const enMap = secMap(repEn.sections);
  const hiMap = secMap(repHi.sections);

  // Current dasha planet key for targeted remedies
  const dashaKey = Array.isArray(chart?.dasha)
    ? (chart.dasha.find((d) => d.is_current) || chart.dasha[0])?.lord || null
    : null;

  const sections = [
    buildSoul(enMap, hiMap, lifeReport, LEX_EN, LEX_HI, dashaKey),
    buildMoney(enMap, hiMap, lifeReport, LEX_EN, LEX_HI),
    buildFamily(enMap, hiMap, lifeReport, LEX_EN, LEX_HI),
    buildHealth(enMap, hiMap, lifeReport, LEX_EN, LEX_HI),
    buildChallenges(enMap, hiMap, lifeReport, LEX_EN, LEX_HI, judgement),
  ];

  return {
    sections,
    advancedRemedies: { en: ADVANCED_B.en, hi: ADVANCED_B.hi },
    technicalAvailable: true,
  };
}

module.exports = { composeLifeReportUserFriendly };
