'use strict';
/**
 * LAYER 1 — Lagna + Lagna Lord Strength
 * The foundation of every chart judgement. A strong Lagna lord amplifies
 * positive yogas; a weak/afflicted one reduces confidence in many results.
 */
const {
  houseOf, houseLordName, normDignity, dignityScore, isStrongDignity, isWeakDignity,
  isDusthana, isKendra, isTrikona, isUpachaya,
  getAfflictions, afflictionPenalty, hasPaapKartari,
  BENEFICS, getCurrentDasha, dashaSupportsPlanet,
  clamp, statusFromScore, pHi,
} = require('./helpers');

function evaluateLagna(chart, profile = {}) {
  const planets  = chart.planets || {};
  const lagna    = chart.ascendant?.rashi_num || 1;
  const lagnaLordName = houseLordName(lagna, 1);
  const lagnaLord = planets[lagnaLordName];

  if (!lagnaLord) {
    return _defaultResult(lagnaLordName, lagna);
  }

  const lagnaLordHouse = houseOf(lagnaLord, lagna);
  const dig  = normDignity(lagnaLord);
  const base = dignityScore(lagnaLord);       // 15–92 from dignity

  // House placement bonus / penalty
  let houseMod = 0;
  let houseTone = 'neutral';
  if (isKendra(lagnaLordHouse) || isTrikona(lagnaLordHouse)) {
    houseMod   = lagnaLordHouse === 1 ? 15 : 10; // own house is excellent
    houseTone  = 'positive';
  } else if (isUpachaya(lagnaLordHouse)) {
    houseMod   = 5;
    houseTone  = 'positive';
  } else if (isDusthana(lagnaLordHouse)) {
    houseMod   = -12;
    houseTone  = 'trik';
  }

  // Affliction penalty
  const aff = getAfflictions(lagnaLordName, planets, lagna);
  const affPen = afflictionPenalty(aff);

  // Paap Kartari
  const ppk = hasPaapKartari(lagnaLordName, planets, lagna);
  const ppkPen = ppk ? 10 : 0;

  // Benefic support bonus
  const beneficConjunct = Object.entries(planets)
    .filter(([n]) => BENEFICS.has(n) && n !== lagnaLordName && houseOf(planets[n], lagna) === lagnaLordHouse)
    .map(([n]) => n);
  const beneficBonus = beneficConjunct.length > 0 ? 8 : 0;

  // Dasha support
  const dashaSupport = dashaSupportsPlanet(lagnaLordName, chart);
  const dashaBonus   = dashaSupport ? 8 : 0;

  const finalScore = clamp(base + houseMod + beneficBonus + dashaBonus - affPen - ppkPen, 0, 100);
  const status     = statusFromScore(finalScore);

  // Interpretation
  const notes  = [];
  const notesHi = [];
  const blockers = [];

  if (isDusthana(lagnaLordHouse)) {
    if (finalScore >= 55 && isUpachaya(lagnaLordHouse)) {
      notes.push(`${lagnaLordName} is in the ${lagnaLordHouse}th house (upachaya/dusthana) — challenges can be converted into growth with effort.`);
      notesHi.push(`${pHi(lagnaLordName)} ${lagnaLordHouse}वें भाव (उपचय/दुस्थान) में है — प्रयास से बाधाएं विकास में बदल सकती हैं।`);
    } else {
      notes.push(`${lagnaLordName} in the ${lagnaLordHouse}th house creates health, dispute, or service themes that need mindful navigation.`);
      notesHi.push(`${pHi(lagnaLordName)} ${lagnaLordHouse}वें भाव में है, स्वास्थ्य, विवाद या सेवा के क्षेत्रों में सावधानी जरूरी है।`);
      blockers.push(`Lagna lord in trik house (${lagnaLordHouse}) reduces overall chart strength`);
    }
  } else if (isKendra(lagnaLordHouse) || isTrikona(lagnaLordHouse)) {
    notes.push(`${lagnaLordName} is well-placed in the ${lagnaLordHouse}th house — a strong foundation for life results.`);
    notesHi.push(`${pHi(lagnaLordName)} ${lagnaLordHouse}वें भाव में शुभ स्थान पर है — जीवन परिणामों के लिए मजबूत आधार।`);
  }

  if (isStrongDignity(lagnaLord)) {
    notes.push(`${lagnaLordName} in ${dig} dignity greatly supports personality, health, and the ability to activate positive yogas.`);
    notesHi.push(`${pHi(lagnaLordName)} ${dig === 'exalted' ? 'उच्च' : dig === 'moolatrikona' ? 'मूलत्रिकोण' : 'स्वगृह'} में — व्यक्तित्व, स्वास्थ्य और शुभ योगों की सक्रियता को बल मिलता है।`);
  }

  if (isWeakDignity(lagnaLord)) {
    notes.push(`${lagnaLordName} in debilitation weakens self-confidence and reduces the strength of dependent yogas.`);
    notesHi.push(`${pHi(lagnaLordName)} नीच में है — आत्मविश्वास कम होता है और इस पर निर्भर योगों की शक्ति घटती है।`);
    blockers.push('Debilitated lagna lord reduces confidence of many positive yogas');
  }

  if (aff.includes('rahu_conjunct') || aff.includes('ketu_conjunct')) {
    blockers.push('Rahu/Ketu conjunction on lagna lord adds unpredictability to personality and results');
    notes.push('Rahu/Ketu influence on the lagna lord can add ambition or confusion to the personality.');
    notesHi.push('लग्नेश पर राहु/केतु का प्रभाव व्यक्तित्व में महत्वाकांक्षा या अनिश्चितता जोड़ सकता है।');
  }

  if (ppk) {
    blockers.push('Paap Kartari on lagna lord restricts self-expression and health');
    notes.push('Lagna lord is in Paap Kartari (hemmed between malefics) — extra care is needed for health and personal growth.');
    notesHi.push('लग्नेश पाप कर्तरी में है (दो क्रूर ग्रहों के बीच) — स्वास्थ्य और व्यक्तिगत विकास पर विशेष ध्यान जरूरी है।');
  }

  if (dashaSupport) {
    notes.push(`Current ${lagnaLordName} dasha/antardasha activates the lagna lord — this is a significant period for self-development.`);
    notesHi.push(`वर्तमान ${pHi(lagnaLordName)} दशा/अंतर्दशा लग्नेश को सक्रिय करती है — यह आत्म-विकास के लिए महत्वपूर्ण समय है।`);
  }

  return {
    lagnaLordName,
    lagnaLordHouse,
    lagnaRashi: lagna,
    score: finalScore,
    status,
    dignityLabel: dig,
    afflictions: aff,
    hasPaapKartari: ppk,
    dashaSupport,
    beneficConjunct,
    notes,
    notesHi,
    blockers,
    // Yoga confidence multiplier: strong lagna lord = 1.0, weak = 0.6, very weak = 0.4
    yogaConfidenceMultiplier: finalScore >= 70 ? 1.0 : finalScore >= 50 ? 0.8 : finalScore >= 35 ? 0.6 : 0.4,
  };
}

function _defaultResult(lordName, lagna) {
  return {
    lagnaLordName: lordName, lagnaLordHouse: null, lagnaRashi: lagna,
    score: 50, status: 'balanced', dignityLabel: 'neutral',
    afflictions: [], hasPaapKartari: false, dashaSupport: false,
    beneficConjunct: [], notes: [], notesHi: [], blockers: [],
    yogaConfidenceMultiplier: 0.7,
  };
}

module.exports = { evaluateLagna };
