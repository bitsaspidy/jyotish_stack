'use strict';
/**
 * LAYER — 5th House: Children, Education, Creativity, and Love Life
 * Uses safe language: never says "no children" or "miscarriage will happen".
 */
const {
  houseOf, houseLordName, normDignity, dignityScore,
  isStrongDignity, isWeakDignity, isDusthana, isKendra, isTrikona, isUpachaya,
  getAfflictions, afflictionPenalty, hasPaapKartari, planetAspectsHouse,
  dashaSupportsPlanet, occupantsOf, maleficsAspecting, beneficsAspecting,
  clamp, statusFromScore, pHi, estimateAge,
} = require('./helpers');

function evaluateChildren(chart, profile = {}) {
  const planets = chart.planets || {};
  const lagna   = chart.ascendant?.rashi_num || 1;

  const fifthLordName  = houseLordName(lagna, 5);
  const fifthLord      = planets[fifthLordName];
  const fifthLordHouse = fifthLord ? houseOf(fifthLord, lagna) : null;
  const jupiter        = planets.Jupiter;
  const ketu           = planets.Ketu;
  const saturn         = planets.Saturn;

  // Ketu in 5th
  const ketuInFifth = ketu ? houseOf(ketu, lagna) === 5 : false;

  // Saturn aspects 5th house
  const saturnAspectsFifth = (() => {
    if (!saturn) return false;
    const satH = houseOf(saturn, lagna);
    return satH ? planetAspectsHouse('Saturn', satH, 5) : false;
  })();

  // 5th lord score
  const dig    = normDignity(fifthLord);
  const base   = dignityScore(fifthLord);
  let houseMod = 0;
  if (fifthLordHouse) {
    if (isKendra(fifthLordHouse) || isTrikona(fifthLordHouse)) houseMod = 10;
    else if (isUpachaya(fifthLordHouse))                        houseMod = 5;
    else if (isDusthana(fifthLordHouse))                        houseMod = -15;
    if (fifthLordHouse === 5)                                   houseMod += 12;
  }

  const aff    = getAfflictions(fifthLordName, planets, lagna);
  const affPen = afflictionPenalty(aff);
  const ppk    = hasPaapKartari(fifthLordName, planets, lagna);
  const ppkPen = ppk ? 10 : 0;

  // Jupiter strength (karaka for children and wisdom)
  const jupDig   = normDignity(jupiter);
  const jupBase  = dignityScore(jupiter);
  const jupAff   = getAfflictions('Jupiter', planets, lagna);
  const jupPen   = afflictionPenalty(jupAff);
  const jupScore = clamp(jupBase - jupPen, 0, 100);

  // Aspects on 5th house
  const malAsp       = maleficsAspecting(5, planets, lagna);
  const benAsp       = beneficsAspecting(5, planets, lagna);
  const fifthOccupants = occupantsOf(5, planets, lagna);
  const benInFifth   = fifthOccupants.filter(n => ['Jupiter','Venus','Mercury','Moon'].includes(n));
  const malInFifth   = fifthOccupants.filter(n => ['Saturn','Mars','Rahu','Ketu'].includes(n));

  const dashaSupport = dashaSupportsPlanet(fifthLordName, chart) || dashaSupportsPlanet('Jupiter', chart);

  const fifthLordBaseScore = clamp(base + houseMod - affPen - ppkPen, 0, 100);
  const rawScore = fifthLordBaseScore * 0.6 + jupScore * 0.4
    + benInFifth.length * 5 - malInFifth.length * 6
    + benAsp.length * 4   - malAsp.length * 4
    + (dashaSupport ? 6 : 0)
    - (ketuInFifth ? 12 : 0)
    - (saturnAspectsFifth ? 8 : 0);

  const finalScore = clamp(Math.round(rawScore), 0, 100);
  const status     = statusFromScore(finalScore);

  const blockers   = [];
  const amplifiers = [];
  const notes      = [];
  const notesHi    = [];

  // Ketu in 5th — safe language
  if (ketuInFifth) {
    blockers.push('Ketu in 5th: delay/extra care in children, unconventional education path, love-life maturity themes');
    notes.push('Ketu in the 5th house can indicate a need for extra care and patience regarding children matters, an unconventional or intuitive approach to education, and a preference for arranged or family-supported marriage in love matters. Medical guidance and proper timing are very important.');
    notesHi.push('5वें भाव में केतु — संतान के मामलों में extra care और धैर्य जरूरी हो सकता है, शिक्षा में असामान्य दृष्टिकोण हो सकता है, और प्रेम में परिवार-समर्थित विवाह बेहतर हो सकता है। चिकित्सा मार्गदर्शन और उचित समय बहुत महत्वपूर्ण है।');
  }

  // Saturn aspects 5th — safe language
  if (saturnAspectsFifth) {
    blockers.push('Saturn aspects 5th: delay/responsibility themes around children and education');
    notes.push("Saturn's aspect on the 5th house can bring delays and a sense of responsibility around children or education. Patience, right timing, and medical guidance are important. This does not deny children — it asks for extra care and preparation.");
    notesHi.push('शनि का 5वें भाव पर पहलू संतान या शिक्षा के आसपास देरी और जिम्मेदारी ला सकता है। धैर्य, सही समय और चिकित्सा मार्गदर्शन महत्वपूर्ण है। यह संतान से इनकार नहीं — यह extra care और तैयारी मांगता है।');
  }

  // 5th lord placement
  if (fifthLordHouse && isDusthana(fifthLordHouse)) {
    notes.push('The 5th lord in a trik house can indicate that education, children, or creative matters require extra effort and careful timing. Results come with perseverance.');
    notesHi.push('5वें स्वामी का तृक भाव में होना — शिक्षा, संतान या रचनात्मक मामलों में extra प्रयास और सावधान समय जरूरी हो सकता है। दृढ़ता से परिणाम आते हैं।');
    blockers.push(`5th lord in ${fifthLordHouse}th: children/education themes need extra care`);
  } else if (fifthLordHouse && (isKendra(fifthLordHouse) || isTrikona(fifthLordHouse))) {
    notes.push('The 5th lord is well-placed — children, education, and creative expression are naturally supported.');
    notesHi.push('5वें स्वामी अच्छे स्थान पर — संतान, शिक्षा और रचनात्मक अभिव्यक्ति को स्वाभाविक समर्थन मिला है।');
    amplifiers.push(`5th lord in kendra/trikona: positive for children and education`);
  }

  // Jupiter strength
  if (isStrongDignity(jupiter)) {
    amplifiers.push('Jupiter in strong dignity: children, wisdom, education well-supported');
    notes.push('Jupiter in strong dignity — a significant blessing for children, education, wisdom, and creative matters.');
    notesHi.push('गुरु बल में — संतान, शिक्षा, ज्ञान और रचनात्मक मामलों के लिए महत्वपूर्ण आशीर्वाद।');
  } else if (isWeakDignity(jupiter)) {
    blockers.push('Jupiter debilitated: karaka for children weakened — extra care and remedy recommended');
    notes.push('Jupiter, the natural significator of children, is in debilitation. This is not a denial but calls for extra care, medical guidance, proper timing, and Jupiter remedies.');
    notesHi.push('गुरु (संतान के नैसर्गिक कारक) नीच में है। यह इनकार नहीं — extra care, चिकित्सा मार्गदर्शन, उचित समय और गुरु उपाय बहुत सहायक होंगे।');
  }

  // Benefics in 5th
  if (benInFifth.length > 0) {
    amplifiers.push(`Benefics (${benInFifth.join(', ')}) in 5th: positive for children, creativity, education`);
    notes.push(`Benefic planets (${benInFifth.join(', ')}) in the 5th house are positive indicators for children, creative intelligence, and educational success.`);
    notesHi.push(`5वें भाव में शुभ ग्रह (${benInFifth.map(pHi).join(', ')}) — संतान, रचनात्मक बुद्धि और शैक्षिक सफलता के सकारात्मक संकेत।`);
  }

  // Dasha support
  if (dashaSupport) {
    amplifiers.push('5th lord/Jupiter dasha active: current period highlights children, creativity, education');
    notes.push('Current dasha activates 5th house themes — important period for education decisions, creativity, and children matters.');
    notesHi.push('वर्तमान दशा 5वें भाव को सक्रिय करती है — शिक्षा, रचनात्मकता और संतान के लिए महत्वपूर्ण समय।');
  }

  const summaryEn = finalScore >= 72
    ? 'Children, education, creativity, and love life have good support in this chart. Wisdom and creative expression come naturally.'
    : finalScore >= 52
    ? 'Children and education themes have moderate support. Consistent effort, right timing, and medical guidance ensure the best outcomes.'
    : finalScore >= 35
    ? 'Extra care, patience, and proper timing are needed in children and education matters. Medical guidance and remedies are recommended — this is a call for thoughtful preparation, not denial.'
    : 'Children and education matters need significant extra care, patience, medical guidance, Jupiter remedies, and right timing. This is a call for conscious preparation and family support.';

  const summaryHi = finalScore >= 72
    ? 'इस कुंडली में संतान, शिक्षा, रचनात्मकता और प्रेम जीवन को अच्छा समर्थन मिला है। बुद्धिमत्ता स्वाभाविक रूप से आती है।'
    : finalScore >= 52
    ? 'संतान और शिक्षा के विषयों को मध्यम समर्थन है। लगातार प्रयास, सही समय और चिकित्सा मार्गदर्शन सर्वोत्तम परिणाम सुनिश्चित करते हैं।'
    : finalScore >= 35
    ? 'संतान और शिक्षा के मामलों में extra care, धैर्य और उचित समय जरूरी है। चिकित्सा मार्गदर्शन और उपाय की सिफारिश — यह सोच-समझकर तैयारी की पुकार है, इनकार नहीं।'
    : 'संतान और शिक्षा के मामलों में महत्वपूर्ण extra care, धैर्य, चिकित्सा मार्गदर्शन, गुरु उपाय और सही समय जरूरी है। यह सचेत तैयारी और पारिवारिक समर्थन की पुकार है।';

  return {
    score: finalScore, status,
    fifthLordName, fifthLordHouse,
    jupiterScore: jupScore, ketuInFifth, saturnAspectsFifth,
    hasPaapKartari: ppk, dashaSupport,
    blockers, amplifiers, notes, notesHi,
    summaryEn, summaryHi,
  };
}

module.exports = { evaluateChildren };
