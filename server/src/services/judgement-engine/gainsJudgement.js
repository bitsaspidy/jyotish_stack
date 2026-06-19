'use strict';
/**
 * LAYER — 11th House Gains, Income, Desires, and Network
 * Deep evaluation of the 11th house for income stability and desire fulfillment.
 */
const {
  houseOf, houseLordName, normDignity, dignityScore,
  isStrongDignity, isWeakDignity, isDusthana, isKendra, isTrikona, isUpachaya,
  getAfflictions, afflictionPenalty, hasPaapKartari,
  dashaSupportsPlanet, occupantsOf, maleficsAspecting, beneficsAspecting,
  clamp, statusFromScore, pHi,
} = require('./helpers');

function evaluateGains(chart, lagnaResult) {
  const planets = chart.planets || {};
  const lagna   = chart.ascendant?.rashi_num || 1;

  const elevLordName  = houseLordName(lagna, 11);
  const elevLord      = planets[elevLordName];
  const elevLordHouse = elevLord ? houseOf(elevLord, lagna) : null;
  const dig           = normDignity(elevLord);
  const base          = dignityScore(elevLord);

  // 11th house occupants
  const occupants = occupantsOf(11, planets, lagna);
  const benInElev = occupants.filter(n => ['Jupiter','Venus','Mercury','Moon'].includes(n));
  const malInElev = occupants.filter(n => ['Saturn','Mars','Rahu','Ketu'].includes(n));

  // House placement of 11th lord
  let houseMod = 0;
  if (elevLordHouse) {
    if (isKendra(elevLordHouse) || isTrikona(elevLordHouse)) houseMod = 10;
    else if (isUpachaya(elevLordHouse))                       houseMod = 8;
    else if (isDusthana(elevLordHouse))                       houseMod = -18;
    if (elevLordHouse === 11)                                 houseMod += 12; // lord in own house
  }

  // Afflictions on 11th lord
  const aff    = getAfflictions(elevLordName, planets, lagna);
  const affPen = afflictionPenalty(aff);
  const ppk    = hasPaapKartari(elevLordName, planets, lagna);
  const ppkPen = ppk ? 10 : 0;

  // Aspects on 11th house
  const malAsp = maleficsAspecting(11, planets, lagna);
  const benAsp = beneficsAspecting(11, planets, lagna);

  const dashaSupport = dashaSupportsPlanet(elevLordName, chart);

  const lagnaMultiplier = lagnaResult?.score >= 65 ? 1.0
    : lagnaResult?.score >= 45 ? 0.9
    : 0.78;

  const rawScore = base + houseMod + benInElev.length * 7 + benAsp.length * 5
                 + (dashaSupport ? 8 : 0)
                 - affPen - ppkPen - malInElev.length * 6 - malAsp.length * 4;
  const gainPotentialScore    = clamp(Math.round(rawScore * lagnaMultiplier), 0, 100);
  const desireFulfillmentScore = clamp(gainPotentialScore - 5, 0, 100);
  const incomeStabilityScore  = elevLordHouse && isDusthana(elevLordHouse)
    ? clamp(gainPotentialScore - 12, 0, 100) : gainPotentialScore;
  const networkSupportScore   = clamp(gainPotentialScore + (benInElev.length > 0 ? 5 : -3), 0, 100);

  const status = statusFromScore(gainPotentialScore);
  const blockers = [];
  const amplifiers = [];
  const notes = [];
  const notesHi = [];

  // Build commentary
  if (isStrongDignity(elevLord)) {
    amplifiers.push(`${elevLordName} in ${dig}: strong 11th lord greatly supports gains and income`);
    notes.push(`The 11th lord ${elevLordName} is in ${dig === 'exalted' ? 'exaltation' : dig === 'moolatrikona' ? 'Moolatrikona' : 'own sign'} — income, gains, and desire fulfillment are strongly supported.`);
    notesHi.push(`11वें भाव का स्वामी ${pHi(elevLordName)} ${dig === 'exalted' ? 'उच्च' : dig === 'moolatrikona' ? 'मूलत्रिकोण' : 'स्वगृह'} में — आय, लाभ और इच्छापूर्ति को मजबूत समर्थन मिला है।`);
  } else if (isWeakDignity(elevLord)) {
    blockers.push(`${elevLordName} debilitated: 11th house gains significantly weakened`);
    notes.push(`The 11th lord ${elevLordName} is in debilitation — income potential exists but gains may require extra effort, smart strategy, and disciplined saving.`);
    notesHi.push(`11वें भाव का स्वामी ${pHi(elevLordName)} नीच में है — आय की संभावना है लेकिन लाभ के लिए विशेष प्रयास, चतुर रणनीति और अनुशासित बचत जरूरी हो सकती है।`);
  }

  if (elevLordHouse && isDusthana(elevLordHouse)) {
    if (isUpachaya(elevLordHouse)) {
      notes.push('The 11th lord in a dusthana-upachaya house suggests income may come through service, problem-solving, or competitive fields — gains improve with age and persistence.');
      notesHi.push('11वें स्वामी का दुस्थान-उपचय में होना बताता है कि आय सेवा, समस्या-समाधान या प्रतिस्पर्धी क्षेत्रों से आ सकती है — उम्र और दृढ़ता के साथ लाभ बेहतर होता है।');
    } else {
      notes.push('The 11th lord in a trik (6/8/12) house — incoming gains may come with struggle, delay, or through unconventional paths. Disciplined effort and right profession alignment help.');
      notesHi.push('11वें स्वामी का तृक (6/8/12) भाव में होना — आने वाले लाभ संघर्ष, देरी या असामान्य रास्तों से आ सकते हैं। अनुशासित प्रयास और सही व्यवसाय चुनाव सहायक होता है।');
      blockers.push(`11th lord in ${elevLordHouse}th: income may come with delay or struggle`);
    }
  } else if (elevLordHouse && (isKendra(elevLordHouse) || isTrikona(elevLordHouse))) {
    notes.push('The 11th lord in a kendra or trikona gives positive income potential and the ability to build stable networks and fulfill desires progressively.');
    notesHi.push('11वें स्वामी का केंद्र या त्रिकोण में होना सकारात्मक आय संभावना और स्थिर नेटवर्क बनाने की क्षमता देता है।');
    amplifiers.push(`11th lord in ${elevLordHouse}th (kendra/trikona): positive gains placement`);
  }

  if (ppk) {
    blockers.push('Paap Kartari on 11th lord: income and gains under pressure/restriction');
    notes.push('The 11th lord is in Paap Kartari — gains may come with significant pressure, delay, or instability. Careful financial planning and right income sources are very important.');
    notesHi.push('11वें स्वामी पर पाप कर्तरी — लाभ महत्वपूर्ण दबाव, देरी या अस्थिरता के साथ आ सकते हैं। सावधान वित्तीय योजना और सही आय स्रोत बहुत महत्वपूर्ण हैं।');
  }

  if (aff.includes('rahu_conjunct') || aff.includes('ketu_conjunct')) {
    blockers.push('Rahu/Ketu with 11th lord: gains may come through unusual means or with unpredictability');
    notes.push('Rahu/Ketu with the 11th lord — gains may come through unusual, foreign, or technology-related means, but income can also be unstable. Wise financial planning is key.');
    notesHi.push('11वें स्वामी के साथ राहु/केतु — लाभ असामान्य, विदेशी या प्रौद्योगिकी संबंधी माध्यमों से आ सकते हैं, लेकिन आय अस्थिर भी हो सकती है। सुबुद्ध वित्तीय योजना आवश्यक है।');
  }

  if (benInElev.length > 0) {
    amplifiers.push(`Benefics (${benInElev.join(', ')}) in 11th house: naturally supportive for income`);
    notes.push(`Benefic planets (${benInElev.join(', ')}) in the 11th house support income, social connections, and desire fulfillment.`);
    notesHi.push(`शुभ ग्रह (${benInElev.map(pHi).join(', ')}) 11वें भाव में — आय, सामाजिक संबंधों और इच्छापूर्ति को समर्थन मिलता है।`);
  }

  if (dashaSupport) {
    amplifiers.push(`${elevLordName} dasha active: current period highlights income and network themes`);
    notes.push(`Current dasha activates the 11th lord — this period has heightened potential for income growth, new networks, and fulfillment of goals.`);
    notesHi.push(`वर्तमान दशा 11वें स्वामी को सक्रिय करती है — इस अवधि में आय वृद्धि, नए नेटवर्क और लक्ष्य पूर्ति की बढ़ी हुई संभावना है।`);
  }

  // Final summary
  const summaryEn = gainPotentialScore >= 72
    ? 'Income and gains potential is strong in this chart. With the right profession and consistent effort, financial growth and desire fulfillment are well-supported.'
    : gainPotentialScore >= 52
    ? 'Moderate income potential exists. Gains come with consistent effort, right profession, and smart financial management. Network building is important.'
    : gainPotentialScore >= 35
    ? 'Income potential exists but needs extra care. Gains may come with delay, struggle, or instability. Disciplined saving and right income sources are critical.'
    : 'Incoming gains are significantly challenged. Careful financial planning, diverse income sources, and remedies are strongly recommended.';

  const summaryHi = gainPotentialScore >= 72
    ? 'इस कुंडली में आय और लाभ की संभावना मजबूत है। सही व्यवसाय और लगातार प्रयास से आर्थिक विकास और इच्छापूर्ति को अच्छा समर्थन मिलता है।'
    : gainPotentialScore >= 52
    ? 'मध्यम आय संभावना है। लाभ लगातार प्रयास, सही व्यवसाय और चतुर वित्तीय प्रबंधन से आते हैं। नेटवर्क निर्माण महत्वपूर्ण है।'
    : gainPotentialScore >= 35
    ? 'आय की संभावना है लेकिन विशेष सावधानी जरूरी है। लाभ देरी, संघर्ष या अस्थिरता के साथ आ सकते हैं। अनुशासित बचत और सही आय स्रोत बहुत जरूरी हैं।'
    : 'आने वाले लाभ काफी चुनौतीग्रस्त हैं। सावधान वित्तीय योजना, विविध आय स्रोत और उपाय की दृढ़ता से सिफारिश की जाती है।';

  return {
    houseNum: 11, lordName: elevLordName, lordHouse: elevLordHouse,
    dignity: dig, gainPotentialScore, desireFulfillmentScore,
    incomeStabilityScore, networkSupportScore,
    score: gainPotentialScore, status,
    occupants, beneficsInHouse: benInElev, maleficsInHouse: malInElev,
    hasPaapKartari: ppk, afflictions: aff, dashaSupport,
    blockers, amplifiers, notes, notesHi,
    summaryEn, summaryHi,
  };
}

module.exports = { evaluateGains };
