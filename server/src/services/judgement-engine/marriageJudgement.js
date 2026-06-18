'use strict';
/**
 * LAYER — Marriage and Relationship Judgement
 * Evaluates 7th house, 7th lord, Venus, 4th house (domestic peace),
 * 2nd house (family), 8th house (marital depth), Navamsha, and Mangal Dosha.
 */
const {
  houseOf, houseLordName, normDignity, dignityScore,
  isStrongDignity, isWeakDignity, isDusthana, isKendra, isTrikona, isUpachaya,
  getAfflictions, afflictionPenalty, hasPaapKartari,
  dashaSupportsPlanet, occupantsOf, maleficsAspecting, beneficsAspecting,
  clamp, statusFromScore, pHi, estimateAge,
} = require('./helpers');

function evaluateMarriage(chart, lagnaResult, pillarResult, profile) {
  const planets  = chart.planets || {};
  const lagna    = chart.ascendant?.rashi_num || 1;
  const gender   = profile?.gender || null;
  const age      = estimateAge(profile);

  const sevLordName  = houseLordName(lagna, 7);
  const sevLord      = planets[sevLordName];
  const sevLordHouse = sevLord ? houseOf(sevLord, lagna) : null;
  const venus        = planets.Venus;
  const venusHouse   = venus ? houseOf(venus, lagna) : null;
  const mangalDosha  = chart.mangal_dosha;

  // ── 7th house assessment ──────────────────────────────────────────────────
  const seventh_occupants = occupantsOf(7, planets, lagna);
  const malInSeventh      = maleficsAspecting(7, planets, lagna);
  const benInSeventh      = beneficsAspecting(7, planets, lagna);
  const ppkOnSeventh      = hasPaapKartari(sevLordName, planets, lagna);

  // ── 7th lord score ────────────────────────────────────────────────────────
  const sevDig  = normDignity(sevLord);
  const sevBase = dignityScore(sevLord);
  let sevHouseMod = 0;
  if (sevLordHouse) {
    if (isKendra(sevLordHouse) || isTrikona(sevLordHouse)) sevHouseMod = 10;
    else if (isUpachaya(sevLordHouse))                      sevHouseMod = 5;
    else if (isDusthana(sevLordHouse))                      sevHouseMod = -15;
    if (sevLordHouse === 10)                                sevHouseMod += 3; // 7th in 10th: spouse from profession
  }
  const sevAff    = getAfflictions(sevLordName, planets, lagna);
  const sevAffPen = afflictionPenalty(sevAff);
  const sevPpk    = hasPaapKartari(sevLordName, planets, lagna);
  const sevPpkPen = sevPpk ? 12 : 0;

  // ── Venus score ───────────────────────────────────────────────────────────
  const venDig  = normDignity(venus);
  const venBase = dignityScore(venus);
  let venHouseMod = 0;
  if (venusHouse) {
    if (isKendra(venusHouse) || isTrikona(venusHouse)) venHouseMod = 8;
    else if (isDusthana(venusHouse))                    venHouseMod = -12;
  }
  const venAff    = getAfflictions('Venus', planets, lagna);
  const venAffPen = afflictionPenalty(venAff);
  const venPpk    = hasPaapKartari('Venus', planets, lagna);
  const venPpkPen = venPpk ? 10 : 0;

  // Venus activates at ~25+ years
  const venusActivated = age !== null ? age >= 25 : true;

  // ── 4th house for domestic peace post-marriage ────────────────────────────
  const fourthLordName = houseLordName(lagna, 4);
  const fourthLord     = planets[fourthLordName];
  const fourthLordHouse = fourthLord ? houseOf(fourthLord, lagna) : null;
  const fourthScore    = _houseLordScore(fourthLord, fourthLordHouse, lagna, planets);

  // ── Mangal Dosha impact ───────────────────────────────────────────────────
  const mangalImpact = mangalDosha?.has_dosha ? (mangalDosha.is_relieved ? 5 : 15) : 0;

  // ── Combined marriage score ───────────────────────────────────────────────
  const sevScore  = clamp(sevBase + sevHouseMod - sevAffPen - sevPpkPen, 0, 100);
  const venScore  = clamp(venBase + venHouseMod - venAffPen - venPpkPen, 0, 100);
  const domScore  = fourthScore;

  const dashaVenus = dashaSupportsPlanet('Venus', chart);
  const dashaSev   = dashaSupportsPlanet(sevLordName, chart);

  const combinedRaw = (sevScore * 0.40 + venScore * 0.35 + domScore * 0.25)
    + (dashaVenus || dashaSev ? 6 : 0)
    - mangalImpact
    - (malInSeventh.length > 1 ? 10 : 0)
    + (benInSeventh.length > 0 ? 5 : 0);

  const lagnaMultiplier = lagnaResult?.score >= 65 ? 1.0 : lagnaResult?.score >= 45 ? 0.92 : 0.82;
  const finalScore = clamp(Math.round(combinedRaw * lagnaMultiplier), 0, 100);
  const status     = statusFromScore(finalScore);

  const blockers   = [];
  const amplifiers = [];
  const notes      = [];
  const notesHi    = [];

  // ── 7th lord placement commentary ────────────────────────────────────────
  if (sevLordHouse === 10) {
    notes.push('The 7th lord in the 10th house suggests the spouse may come from the same profession or field of work, or marriage can support career growth when well-supported.');
    notesHi.push('7वें स्वामी का 10वें भाव में होना बताता है कि जीवनसाथी एक ही पेशे या कार्यक्षेत्र से आ सकता/सकती है, या विवाह कैरियर विकास को सहयोग दे सकता है।');
    amplifiers.push('7th lord in 10th: professional/career connection with spouse possible');
  }

  if (isDusthana(sevLordHouse)) {
    notes.push('The 7th lord in a trik house can indicate delays, emotional distance, or partnership challenges. Patience, communication, and mutual understanding are essential.');
    notesHi.push('7वें स्वामी का तृक भाव में होना देरी, भावनात्मक दूरी या साझेदारी की चुनौतियां ला सकता है। धैर्य, संवाद और परस्पर समझ बहुत जरूरी है।');
    blockers.push(`7th lord in ${sevLordHouse}th house: marriage/partnership challenges possible`);
  }

  // ── Venus commentary ──────────────────────────────────────────────────────
  if (isStrongDignity(venus)) {
    amplifiers.push('Venus in strong dignity: relationship harmony, affection, and comfort well-supported');
    notes.push('Venus in strong dignity supports relationship harmony, affection, and material comfort in partnerships.');
    notesHi.push('शुक्र बल में है — रिश्तों में सामंजस्य, स्नेह और भौतिक आराम को अच्छा समर्थन मिलता है।');
  } else if (isWeakDignity(venus)) {
    blockers.push('Venus debilitated: relationship expectations, comfort, and harmony themes need care');
    notes.push('Venus in debilitation can create expectations gaps, comfort issues, or harmony challenges in relationships. These improve with maturity and conscious communication after age 25+.');
    notesHi.push('शुक्र नीच में — रिश्तों में अपेक्षाओं का अंतर, आराम के मुद्दे या सामंजस्य की चुनौतियां हो सकती हैं। ये 25+ उम्र के बाद परिपक्वता और सचेत संवाद से बेहतर होती हैं।');
  }

  if (venPpk) {
    blockers.push('Venus in Paap Kartari: love, affection, and relationship comfort restricted/pressured');
    notes.push('Venus in Paap Kartari — relationship expectations and emotional comfort may face pressure. Extra mindfulness in choosing a partner and in communication is very important.');
    notesHi.push('शुक्र पाप कर्तरी में — रिश्ते की अपेक्षाएं और भावनात्मक आराम दबाव का सामना कर सकते हैं। जीवनसाथी चुनने और संवाद में extra सावधानी बहुत महत्वपूर्ण है।');
  }

  if (venAff.includes('rahu_conjunct') || venAff.includes('ketu_conjunct')) {
    blockers.push('Rahu/Ketu with Venus: unconventional relationship patterns or unpredictability in love/comfort');
    notes.push('Rahu/Ketu with Venus can create intense attractions, unconventional relationship patterns, or luxury/comfort instability. Maturity and grounded partnership choices help.');
    notesHi.push('शुक्र के साथ राहु/केतु — तीव्र आकर्षण, असामान्य संबंध पैटर्न, या विलासिता/आराम में अस्थिरता हो सकती है। परिपक्वता और संतुलित जीवनसाथी चुनाव सहायक है।');
  }

  // ── Domestic peace ────────────────────────────────────────────────────────
  if (domScore < 40) {
    notes.push('The 4th house (domestic peace) is somewhat stressed — post-marriage home harmony may need conscious effort, mutual respect, and clear family roles.');
    notesHi.push('चतुर्थ भाव (घर की शांति) कुछ दबाव में है — विवाह के बाद घरेलू सामंजस्य के लिए सचेत प्रयास, परस्पर सम्मान और स्पष्ट पारिवारिक भूमिकाएं जरूरी हो सकती हैं।');
  }

  // ── Mangal Dosha ──────────────────────────────────────────────────────────
  if (mangalDosha?.has_dosha && !mangalDosha.is_relieved) {
    notes.push('Mangal Dosha is present — compatibility checking with partner, patience in relationships, and Mangal remedies are recommended before marriage.');
    notesHi.push('मंगल दोष मौजूद है — विवाह से पहले साथी के साथ अनुकूलता जांच, रिश्तों में धैर्य और मंगल उपाय की सिफारिश की जाती है।');
    blockers.push('Mangal Dosha: compatibility and anger/health in marriage need careful attention');
  } else if (mangalDosha?.has_dosha && mangalDosha.is_relieved) {
    notes.push('Mangal Dosha is present but has classical cancellations — its effects are reduced. Standard care and compatibility check are still advised.');
    notesHi.push('मंगल दोष है लेकिन शास्त्रीय रद्दीकरण के साथ — प्रभाव कम हो जाता है। फिर भी सामान्य सावधानी और अनुकूलता जांच की सलाह दी जाती है।');
  }

  // ── Paap Kartari around 7th ───────────────────────────────────────────────
  if (sevPpk) {
    notes.push('The 7th lord is in Paap Kartari — there may be delays, restrictions, or pressure in forming or sustaining relationships. Patience and right timing in marriage are important.');
    notesHi.push('7वें स्वामी पर पाप कर्तरी — रिश्ते बनाने या बनाए रखने में देरी, प्रतिबंध या दबाव हो सकता है। विवाह में धैर्य और सही समय महत्वपूर्ण है।');
    blockers.push('Paap Kartari on 7th lord: delay/restriction in relationship formation');
  }

  // ── Dasha support ─────────────────────────────────────────────────────────
  if (dashaVenus || dashaSev) {
    amplifiers.push(`Current dasha (${dashaVenus ? 'Venus' : sevLordName}) activates relationship themes — this period has marriage/partnership potential`);
    notes.push(`Current dasha activates relationship themes — this is an important period for marriage, partnership decisions, and relationship evolution.`);
    notesHi.push(`वर्तमान दशा संबंध के विषयों को सक्रिय करती है — यह विवाह, साझेदारी निर्णयों और रिश्ते के विकास के लिए महत्वपूर्ण समय है।`);
  }

  // ── User-safe final summary ───────────────────────────────────────────────
  const summaryEn = _safeSummaryEn(finalScore, sevLordHouse, venScore, domScore, sevPpk);
  const summaryHi = _safeSummaryHi(finalScore, sevLordHouse, venScore, domScore, sevPpk);

  return {
    score: finalScore, status,
    sevenLordScore: sevScore, venusScore: venScore, domesticPeaceScore: domScore,
    sevenLordName: sevLordName, sevenLordHouse: sevLordHouse,
    venusHouse, venusActivated,
    mangalDosha: mangalDosha ? {
      hasDosha: mangalDosha.has_dosha,
      isRelieved: mangalDosha.is_relieved,
      type: mangalDosha.manglik_type,
    } : null,
    hasPaapKartariOnSeventh: sevPpk,
    dashaSupport: dashaVenus || dashaSev,
    blockers, amplifiers, notes, notesHi,
    summaryEn, summaryHi,
  };
}

function _houseLordScore(lord, lordHouse, lagna, planets) {
  if (!lord || !lordHouse) return 50;
  const base = dignityScore(lord);
  let mod = 0;
  if (isKendra(lordHouse) || isTrikona(lordHouse)) mod = 8;
  else if (isDusthana(lordHouse)) mod = -12;
  const aff = getAfflictions(
    Object.entries(planets).find(([,p]) => p === lord)?.[0] || '',
    planets, lagna
  );
  return clamp(base + mod - afflictionPenalty(aff), 0, 100);
}

function _safeSummaryEn(score, sevLordHouse, venScore, domScore, sevPpk) {
  if (score >= 72) {
    return 'Marriage and relationship potential is well-supported in this chart. Love, harmony, and partnership growth are positive themes.';
  } else if (score >= 52) {
    return 'Relationships have good potential with conscious effort. Mutual communication, ego management, and family support are important for lasting harmony.';
  } else if (score >= 35) {
    return 'Relationships may need extra care, patience, and maturity. Communication, family involvement, and ego management require attention. With effort and right choices, relationships can be meaningful and fulfilling.';
  } else {
    return 'Relationship and marriage themes require significant care and attention. Compatibility checking, communication skills, family support, and patience are very important. Remedies and right timing can help improve outcomes.';
  }
}

function _safeSummaryHi(score, sevLordHouse, venScore, domScore, sevPpk) {
  if (score >= 72) {
    return 'इस कुंडली में विवाह और रिश्तों की संभावना अच्छी तरह समर्थित है। प्रेम, सामंजस्य और साझेदारी का विकास सकारात्मक विषय हैं।';
  } else if (score >= 52) {
    return 'सचेत प्रयास से रिश्तों में अच्छी संभावना है। स्थायी सामंजस्य के लिए परस्पर संवाद, अहंकार प्रबंधन और पारिवारिक समर्थन महत्वपूर्ण है।';
  } else if (score >= 35) {
    return 'रिश्तों में extra care, धैर्य और परिपक्वता की जरूरत हो सकती है। संवाद, पारिवारिक सहभागिता और अहंकार प्रबंधन पर ध्यान देना जरूरी है। प्रयास और सही चुनाव से रिश्ते सार्थक और संतोषजनक हो सकते हैं।';
  } else {
    return 'रिश्तों और विवाह के विषयों पर महत्वपूर्ण देखभाल और ध्यान जरूरी है। अनुकूलता जांच, संवाद कौशल, पारिवारिक समर्थन और धैर्य बहुत महत्वपूर्ण है। उपाय और सही समय परिणामों में सुधार कर सकते हैं।';
  }
}

module.exports = { evaluateMarriage };
