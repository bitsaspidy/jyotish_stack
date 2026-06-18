'use strict';
/**
 * LAYER 3 — House Lord Strength for Key Life Houses
 * Evaluates lords of houses 2, 4, 5, 7, 10, 11 for their placement, dignity,
 * and afflictions. Each lord's strength gates the results of its house.
 */
const {
  houseOf, houseLordName, normDignity, dignityScore,
  isStrongDignity, isWeakDignity, isDusthana, isKendra, isTrikona, isUpachaya,
  getAfflictions, afflictionPenalty, hasPaapKartari,
  dashaSupportsPlanet, maleficsAspecting, beneficsAspecting,
  clamp, statusFromScore, pHi,
} = require('./helpers');

const HOUSE_THEMES = {
  2:  { en:'Wealth, family, speech, and savings',             hi:'धन, परिवार, वाणी और बचत' },
  4:  { en:'Home, mother, property, vehicle, and peace',      hi:'घर, माता, संपत्ति, वाहन और शांति' },
  5:  { en:'Children, education, creativity, and wisdom',     hi:'संतान, शिक्षा, रचनात्मकता और बुद्धि' },
  7:  { en:'Marriage, partnership, and relationships',        hi:'विवाह, साझेदारी और रिश्ते' },
  10: { en:'Career, profession, authority, and reputation',   hi:'कैरियर, व्यवसाय, अधिकार और प्रतिष्ठा' },
  11: { en:'Income, gains, desires, and social network',      hi:'आय, लाभ, इच्छाएं और सामाजिक नेटवर्क' },
};

function evaluateHouseLords(chart, lagnaResult) {
  const planets = chart.planets || {};
  const lagna   = chart.ascendant?.rashi_num || 1;
  const lagnaScore = lagnaResult?.score ?? 50;

  const results = {};

  for (const houseNum of [2, 4, 5, 7, 10, 11]) {
    results[houseNum] = _evalHouseLord(houseNum, planets, lagna, chart, lagnaScore);
  }

  return results;
}

function _evalHouseLord(houseNum, planets, lagna, chart, lagnaScore) {
  const lordName  = houseLordName(lagna, houseNum);
  const lord      = planets[lordName];
  const theme     = HOUSE_THEMES[houseNum];

  if (!lord) {
    return {
      houseNum, lordName, score: 50, status: 'balanced',
      lordHouse: null, dignity: 'neutral', afflictions: [],
      blockers: [], amplifiers: [],
      noteEn: `${theme.en} — house lord data not available.`,
      noteHi: `${theme.hi} — भाव स्वामी डेटा उपलब्ध नहीं।`,
    };
  }

  const lordHouse = houseOf(lord, lagna);
  const dig       = normDignity(lord);
  const base      = dignityScore(lord);

  // House placement modifier
  let houseMod = 0;
  if (isKendra(lordHouse) || isTrikona(lordHouse)) {
    houseMod = lordHouse === houseNum ? 12 : 8; // lord in own house = excellent
  } else if (isUpachaya(lordHouse)) {
    houseMod = 5;
  } else if (isDusthana(lordHouse)) {
    houseMod = -15;
  }

  const aff    = getAfflictions(lordName, planets, lagna);
  const affPen = afflictionPenalty(aff);
  const ppk    = hasPaapKartari(lordName, planets, lagna);
  const ppkPen = ppk ? 10 : 0;

  const malsAsp  = maleficsAspecting(houseNum, planets, lagna);
  const benAsp   = beneficsAspecting(houseNum, planets, lagna);
  const benBonus = benAsp.length * 5;
  const malPen   = malsAsp.length * 5;

  const dashaSupport = dashaSupportsPlanet(lordName, chart);
  const dashaMod     = dashaSupport ? 8 : 0;

  // Lagna lord confidence: if lagna is very weak, reduce all house lord scores
  const lagnaModifier = lagnaScore >= 70 ? 1.0 : lagnaScore >= 50 ? 0.92 : lagnaScore >= 35 ? 0.82 : 0.72;

  const rawScore  = base + houseMod + benBonus + dashaMod - affPen - ppkPen - malPen;
  const finalScore = clamp(Math.round(rawScore * lagnaModifier), 0, 100);
  const status     = statusFromScore(finalScore);

  const blockers   = [];
  const amplifiers = [];
  const notes      = [];
  const notesHi    = [];

  // Build interpretation
  _buildNotes(houseNum, lordName, lord, lordHouse, aff, ppk, dashaSupport, benAsp, malsAsp,
              status, notes, notesHi, blockers, amplifiers);

  return {
    houseNum, lordName, lordHouse, dignity: dig,
    score: finalScore, status,
    afflictions: aff, hasPaapKartari: ppk,
    maleficsOnHouse: malsAsp, beneficsOnHouse: benAsp,
    dashaSupport, blockers, amplifiers,
    noteEn: notes.join(' '),
    noteHi: notesHi.join(' '),
    theme,
  };
}

function _buildNotes(houseNum, lordName, lord, lordHouse, aff, ppk, dashaSupport,
                     benAsp, malsAsp, status, notes, notesHi, blockers, amplifiers) {
  const dig = normDignity(lord);

  // Placement quality
  if (isDusthana(lordHouse)) {
    if (isUpachaya(lordHouse) && (isStrongDignity(lord) || isKendra(lordHouse))) {
      notes.push(`${lordName} (${houseNum}th lord) is in the ${lordHouse}th house — this can indicate challenges that convert into growth through sustained effort.`);
      notesHi.push(`${pHi(lordName)} (${houseNum}वें भाव का स्वामी) ${lordHouse}वें भाव में है — चुनौतियां लगातार प्रयास से विकास में बदल सकती हैं।`);
      amplifiers.push(`${lordName} in upachaya dusthana — challenges can convert to growth`);
    } else {
      notes.push(`${lordName} (${houseNum}th lord) is in the ${lordHouse}th house — ${HOUSE_THEMES[houseNum].en.toLowerCase()} themes need extra care and perseverance.`);
      notesHi.push(`${pHi(lordName)} (${houseNum}वें भाव का स्वामी) ${lordHouse}वें भाव में है — ${HOUSE_THEMES[houseNum].hi} से जुड़े विषयों में extra care और दृढ़ता जरूरी है।`);
      blockers.push(`${houseNum}th lord in trik house (${lordHouse}): results delayed/restricted`);
    }
  } else if (isKendra(lordHouse) || isTrikona(lordHouse)) {
    notes.push(`${lordName} (${houseNum}th lord) is well-placed — ${HOUSE_THEMES[houseNum].en.toLowerCase()} are generally supported.`);
    notesHi.push(`${pHi(lordName)} (${houseNum}वें भाव का स्वामी) अच्छे स्थान पर है — ${HOUSE_THEMES[houseNum].hi} को समर्थन मिला है।`);
    amplifiers.push(`${houseNum}th lord in kendra/trikona: positive placement`);
  }

  // Dignity commentary
  if (isStrongDignity(lord)) {
    const digLabel = dig === 'exalted' ? 'exaltation' : dig === 'moolatrikona' ? 'Moolatrikona' : 'own sign';
    notes.push(`${lordName} in ${digLabel} strengthens ${HOUSE_THEMES[houseNum].en.split(',')[0].toLowerCase()} considerably.`);
    notesHi.push(`${pHi(lordName)} ${dig === 'exalted' ? 'उच्च' : dig === 'moolatrikona' ? 'मूलत्रिकोण' : 'स्वगृह'} में है — ${HOUSE_THEMES[houseNum].hi.split(',')[0]} को काफी बल मिलता है।`);
    amplifiers.push(`${lordName} in ${dig}: strong dignity supports ${houseNum}th house results`);
  } else if (isWeakDignity(lord)) {
    notes.push(`${lordName} in debilitation weakens ${HOUSE_THEMES[houseNum].en.split(',')[0].toLowerCase()} — extra effort and remedy are needed.`);
    notesHi.push(`${pHi(lordName)} नीच में है — ${HOUSE_THEMES[houseNum].hi.split(',')[0]} के लिए extra प्रयास और उपाय जरूरी हैं।`);
    blockers.push(`${lordName} debilitated: ${houseNum}th house results significantly weakened`);
  }

  // Afflictions
  if (aff.includes('rahu_conjunct') || aff.includes('ketu_conjunct')) {
    notes.push(`Rahu/Ketu influence on ${lordName} adds unpredictability and intensity to ${HOUSE_THEMES[houseNum].en.split(',')[0].toLowerCase()} themes.`);
    notesHi.push(`${pHi(lordName)} पर राहु/केतु का प्रभाव ${HOUSE_THEMES[houseNum].hi.split(',')[0]} के विषयों में अनिश्चितता और तीव्रता जोड़ता है।`);
    blockers.push(`Rahu/Ketu on ${houseNum}th lord: intensity/unpredictability in results`);
  }
  if (ppk) {
    notes.push(`${lordName} in Paap Kartari restricts ${HOUSE_THEMES[houseNum].en.split(',')[0].toLowerCase()} — results come through pressure or delay.`);
    notesHi.push(`${pHi(lordName)} पाप कर्तरी में — ${HOUSE_THEMES[houseNum].hi.split(',')[0]} के परिणाम दबाव या देरी से आते हैं।`);
    blockers.push(`Paap Kartari on ${houseNum}th lord: pressure/delay in ${HOUSE_THEMES[houseNum].en.split(',')[0].toLowerCase()}`);
  }
  if (benAsp.length > 0) {
    amplifiers.push(`Benefics (${benAsp.join(', ')}) aspecting ${houseNum}th house: positive influence`);
  }
  if (malsAsp.length > 1) {
    blockers.push(`Multiple malefics (${malsAsp.join(', ')}) aspecting ${houseNum}th house: additional pressure`);
  }
  if (dashaSupport) {
    notes.push(`Current dasha activates ${lordName} — ${HOUSE_THEMES[houseNum].en.split(',')[0].toLowerCase()} themes are highlighted in this period.`);
    notesHi.push(`वर्तमान दशा ${pHi(lordName)} को सक्रिय करती है — ${HOUSE_THEMES[houseNum].hi.split(',')[0]} के विषय इस अवधि में विशेष रूप से उजागर हैं।`);
    amplifiers.push(`${lordName} dasha active: current period highlights ${houseNum}th house themes`);
  }
}

module.exports = { evaluateHouseLords };
