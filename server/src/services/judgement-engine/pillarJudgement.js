'use strict';
/**
 * LAYER 2 — Sun + Moon Pillar Strength
 * Sun and Moon are the two pillars of every chart. Afflicted Sun/Moon
 * reduces the strength of yogas that depend on them.
 */
const {
  houseOf, normDignity, dignityScore, isStrongDignity, isWeakDignity,
  isKendra, isTrikona, isDusthana,
  getAfflictions, afflictionPenalty, hasPaapKartari, hasKemadruma,
  dashaSupportsPlanet, BENEFICS, pHi, clamp, statusFromScore,
} = require('./helpers');

function evaluatePillars(chart) {
  const planets = chart.planets || {};
  const lagna   = chart.ascendant?.rashi_num || 1;

  const sunResult  = _evaluateSun(planets, lagna, chart);
  const moonResult = _evaluateMoon(planets, lagna, chart);

  // Combined pillar status
  const avgScore = Math.round((sunResult.score + moonResult.score) / 2);
  const pillarStatus = statusFromScore(avgScore);

  // Yoga reducers based on pillar weakness
  const yogaReducers = [];
  if (sunResult.score < 40) {
    yogaReducers.push('sun_weak: Kuldeepak/authority/government yogas lose potency');
    yogaReducers.push('sun_weak: Father/Pitra related results may need extra care');
  }
  if (moonResult.score < 40) {
    yogaReducers.push('moon_weak: Gaj Kesari Yoga loses full potency');
    yogaReducers.push('moon_weak: Mind strength, emotional stability, and mother-related results need care');
  }
  if (sunResult.score < 40 && moonResult.score < 40) {
    yogaReducers.push('both_pillars_weak: Most raja/dhan yogas should be treated as partial at best');
  }

  return {
    sun:          sunResult,
    moon:         moonResult,
    pillarScore:  avgScore,
    pillarStatus,
    yogaReducers,
    // Multiplier applied to yogas involving Sun/Moon
    sunYogaMultiplier:  sunResult.score >= 65 ? 1.0 : sunResult.score >= 45 ? 0.8 : 0.55,
    moonYogaMultiplier: moonResult.score >= 65 ? 1.0 : moonResult.score >= 45 ? 0.8 : 0.55,
  };
}

function _evaluateSun(planets, lagna, chart) {
  const sun = planets.Sun;
  if (!sun) return _defaultPlanet('Sun');

  const sunHouse = houseOf(sun, lagna);
  const dig      = normDignity(sun);
  const base     = dignityScore(sun);

  // House modifier
  let houseMod = 0;
  if (sunHouse === 1 || sunHouse === 10)                    houseMod =  8;
  else if (isTrikona(sunHouse) || isKendra(sunHouse))       houseMod =  5;
  else if (isDusthana(sunHouse))                            houseMod = -10;

  // Sun is natural significator of 9th (father, luck, authority)
  if (sunHouse === 9) houseMod += 5;

  const aff    = getAfflictions('Sun', planets, lagna);
  const affPen = afflictionPenalty(aff);
  const ppk    = hasPaapKartari('Sun', planets, lagna);
  const ppkPen = ppk ? 10 : 0;

  // Pitra Dosh indicator: Sun afflicted in 9th house
  const pitraDosh = sunHouse === 9 && (aff.includes('rahu_conjunct') || aff.includes('rahu_aspect') ||
                    aff.includes('ketu_conjunct') || aff.includes('saturn_conjunct'));

  const dashaSupport = dashaSupportsPlanet('Sun', chart);
  const score = clamp(base + houseMod - affPen - ppkPen + (dashaSupport ? 6 : 0), 0, 100);
  const status = statusFromScore(score);

  const notes = [];
  const notesHi = [];
  const blockers = [];

  if (isStrongDignity(sun)) {
    notes.push('Sun is in strong dignity — self-confidence, authority, and father-related matters are well-supported.');
    notesHi.push('सूर्य उच्च बल में है — आत्मविश्वास, अधिकार और पिता से जुड़े मामले मजबूत हैं।');
  }
  if (isWeakDignity(sun)) {
    notes.push('Sun in debilitation can create challenges with authority, self-confidence, government matters, or father-related areas.');
    notesHi.push('सूर्य नीच में है — अधिकार, आत्मविश्वास, सरकारी मामलों या पिता से जुड़े क्षेत्रों में extra care की जरूरत हो सकती है।');
    blockers.push('Debilitated Sun reduces authority/government/self-confidence results');
  }
  if (aff.includes('rahu_conjunct') || aff.includes('ketu_conjunct')) {
    notes.push('Rahu/Ketu influence on Sun can create ego, father-relationship, or authority challenges. Grahan Dosha possibility.');
    notesHi.push('सूर्य पर राहु/केतु का प्रभाव अहंकार, पिता-संबंध या अधिकार में चुनौती ला सकता है। ग्रहण दोष की संभावना।');
    blockers.push('Rahu/Ketu on Sun: Grahan influence, authority/father themes weakened');
  }
  if (pitraDosh) {
    notes.push('Sun in the 9th house under Rahu/Saturn/Ketu influence may indicate Pitra Dosha — ancestral karma, father health, or lineage matters needing care.');
    notesHi.push('नवम भाव में सूर्य पर राहु/शनि/केतु का प्रभाव पितृ दोष संकेत हो सकता है — पूर्वज कर्म, पिता स्वास्थ्य या वंश के मामलों पर ध्यान जरूरी है।');
    blockers.push('Pitra Dosha indicator: Sun in 9H afflicted — ancestral karma may need remedy');
  }
  if (ppk) {
    notes.push('Sun in Paap Kartari — self-respect, health, and father matters need extra protection and care.');
    notesHi.push('सूर्य पाप कर्तरी में — आत्मसम्मान, स्वास्थ्य और पिता के मामलों पर विशेष सुरक्षा और देखभाल जरूरी है।');
    blockers.push('Sun in Paap Kartari weakens authority and health');
  }

  return { planet:'Sun', house:sunHouse, dignity:dig, score, status, afflictions:aff,
           pitraDoshIndicator:pitraDosh, hasPaapKartari:ppk, notes, notesHi, blockers };
}

function _evaluateMoon(planets, lagna, chart) {
  const moon = planets.Moon;
  if (!moon) return _defaultPlanet('Moon');

  const moonHouse = houseOf(moon, lagna);
  const dig       = normDignity(moon);
  const base      = dignityScore(moon);

  let houseMod = 0;
  if (isKendra(moonHouse) || isTrikona(moonHouse))  houseMod =  8;
  else if (isDusthana(moonHouse))                    houseMod = -10;

  const aff     = getAfflictions('Moon', planets, lagna);
  const affPen  = afflictionPenalty(aff);
  const ppk     = hasPaapKartari('Moon', planets, lagna);
  const ppkPen  = ppk ? 10 : 0;
  const kema    = hasKemadruma(planets, lagna);
  const kemaPen = kema ? 12 : 0;

  // Grahan influence: Rahu/Ketu conjunct Moon
  const grahanInfluence = aff.includes('rahu_conjunct') || aff.includes('ketu_conjunct');

  const dashaSupport = dashaSupportsPlanet('Moon', chart);
  const score = clamp(base + houseMod - affPen - ppkPen - kemaPen + (dashaSupport ? 6 : 0), 0, 100);
  const status = statusFromScore(score);

  const notes = [];
  const notesHi = [];
  const blockers = [];

  if (isStrongDignity(moon)) {
    notes.push('Moon in strong dignity — emotional stability, mind clarity, and mother-related areas are well-supported.');
    notesHi.push('चंद्रमा बल में है — भावनात्मक स्थिरता, मानसिक स्पष्टता और माता से जुड़े क्षेत्र मजबूत हैं।');
  }
  if (isWeakDignity(moon)) {
    notes.push('Moon in debilitation can create emotional sensitivity, mood fluctuations, or mother-related care areas.');
    notesHi.push('चंद्रमा नीच में — भावनात्मक संवेदनशीलता, मन में उतार-चढ़ाव या माता से जुड़े क्षेत्रों में extra care की जरूरत हो सकती है।');
    blockers.push('Debilitated Moon: mind, emotional stability, and mother themes weakened');
  }
  if (grahanInfluence) {
    notes.push('Rahu or Ketu with Moon (Grahan Yoga) can create emotional intensity, imagination, anxiety, or unusual life experiences. Mindfulness and grounding practices are very helpful.');
    notesHi.push('चंद्र के साथ राहु या केतु (ग्रहण योग) भावनात्मक तीव्रता, कल्पना, चिंता या असामान्य जीवन अनुभव दे सकता है। माइंडफुलनेस और स्थिरता के अभ्यास बहुत सहायक हैं।');
    blockers.push('Grahan (Rahu/Ketu on Moon): emotional instability, Gaj Kesari and Moon-dependent yogas weakened');
  }
  if (kema) {
    notes.push('Kemadruma condition (Moon without neighboring planets) can create a sense of isolation, instability, or struggle for emotional support — but strong willpower and remedy can overcome this.');
    notesHi.push('केमद्रुम स्थिति (चंद्रमा के पड़ोस में कोई ग्रह नहीं) अकेलेपन, अस्थिरता या भावनात्मक समर्थन की कमी की अनुभूति दे सकती है — लेकिन दृढ़ इच्छाशक्ति और उपाय से इसे पार किया जा सकता है।');
    blockers.push('Kemadruma: Moon isolated, mental strength and emotional support themes need special attention');
  }
  if (ppk) {
    notes.push('Moon in Paap Kartari — emotional wellbeing, mind peace, and mother relationship need extra protection.');
    notesHi.push('चंद्रमा पाप कर्तरी में — भावनात्मक स्वास्थ्य, मन की शांति और माता संबंध को विशेष सुरक्षा की जरूरत है।');
    blockers.push('Moon in Paap Kartari: emotional/mind results restricted');
  }

  return { planet:'Moon', house:moonHouse, dignity:dig, score, status, afflictions:aff,
           grahanInfluence, kemadruma:kema, hasPaapKartari:ppk, notes, notesHi, blockers };
}

function _defaultPlanet(name) {
  return { planet:name, house:null, dignity:'neutral', score:50, status:'balanced',
           afflictions:[], hasPaapKartari:false, notes:[], notesHi:[], blockers:[] };
}

module.exports = { evaluatePillars };
