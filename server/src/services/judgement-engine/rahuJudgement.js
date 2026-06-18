'use strict';
/**
 * LAYER — Rahu Special Placement Rules
 * Rahu gives better results in 3rd, 6th, 10th, 11th.
 * In 11th: needs maturity (42+), dasha support, and strong house lord.
 */
const {
  houseOf, houseLordName, normDignity, dignityScore,
  isStrongDignity, isWeakDignity,
  getAfflictions, afflictionPenalty, dashaSupportsPlanet,
  clamp, statusFromScore, pHi, estimateAge,
} = require('./helpers');

const RAHU_HOUSE_THEMES = {
  1:  { potential:'medium', en:'Rahu in the 1st house brings ambition, unconventional personality, and intense drive. The person may have unusual life experiences and a magnetic personality.', hi:'लग्न में राहु महत्वाकांक्षा, असामान्य व्यक्तित्व और तीव्र उत्साह लाता है। व्यक्ति में असामान्य जीवन अनुभव और आकर्षक व्यक्तित्व हो सकता है।', caution:'Self-identity, health, and ego management need extra care.', cautionHi:'स्व-पहचान, स्वास्थ्य और अहंकार प्रबंधन पर extra care जरूरी है।' },
  2:  { potential:'challenging', en:'Rahu in the 2nd house can create unconventional speech, financial instability, or complex family situations. Mindful financial management is very important.', hi:'दूसरे भाव में राहु असामान्य वाणी, आर्थिक अस्थिरता या जटिल पारिवारिक स्थितियां ला सकता है। सावधान वित्तीय प्रबंधन बहुत जरूरी है।', caution:'Family communication and financial discipline need mindful attention.', cautionHi:'पारिवारिक संवाद और वित्तीय अनुशासन पर सचेत ध्यान जरूरी है।' },
  3:  { potential:'good', en:'Rahu in the 3rd house gives courage, ambition, communication skills, and the ability to excel in competitive or unconventional fields. A strong placement for initiative and siblings.', hi:'तीसरे भाव में राहु साहस, महत्वाकांक्षा, संचार कौशल और प्रतिस्पर्धी या असामान्य क्षेत्रों में उत्कृष्टता की क्षमता देता है।', caution:'Be mindful of over-ambitious communication or rivalry with siblings.', cautionHi:'अत्यधिक महत्वाकांक्षी संवाद या भाई-बहन के साथ प्रतिद्वंद्विता के प्रति सावधान रहें।' },
  4:  { potential:'challenging', en:'Rahu in the 4th house can create unconventional home environments, mother-related complexity, or property concerns. Peace at home may need conscious effort.', hi:'चौथे भाव में राहु असामान्य घर का माहौल, माता-संबंधी जटिलता या संपत्ति की चिंताएं ला सकता है। घर पर शांति के लिए सचेत प्रयास जरूरी हो सकता है।', caution:'Home peace, mother relationship, and property matters need care.', cautionHi:'घर की शांति, माता संबंध और संपत्ति के मामलों पर ध्यान जरूरी है।' },
  5:  { potential:'mixed', en:'Rahu in the 5th house can create unusual creative talent, unconventional romance, or complex children situations. Extra care and right timing in all 5th house matters is important.', hi:'5वें भाव में राहु असामान्य रचनात्मक प्रतिभा, असामान्य रोमांस या जटिल संतान स्थिति ला सकता है। 5वें भाव के सभी मामलों में extra care और सही समय महत्वपूर्ण है।', caution:'Children, love, and speculative activities need extra care and right timing.', cautionHi:'संतान, प्रेम और सट्टेबाजी गतिविधियों में extra care और सही समय जरूरी है।' },
  6:  { potential:'good', en:'Rahu in the 6th house is a strong placement for overcoming enemies, health challenges, debts, and competition. With the right strategy, this position supports victory in disputes and service-oriented fields.', hi:'6वें भाव में राहु शत्रुओं, स्वास्थ्य चुनौतियों, ऋणों और प्रतिस्पर्धा पर काबू पाने के लिए मजबूत स्थान है। सही रणनीति से यह स्थिति विवादों में विजय और सेवा-उन्मुख क्षेत्रों का समर्थन करती है।', caution:'Watch for hidden enemies, chronic health issues, and legal matters.', cautionHi:'छिपे दुश्मनों, दीर्घकालिक स्वास्थ्य समस्याओं और कानूनी मामलों पर नजर रखें।' },
  7:  { potential:'challenging', en:'Rahu in the 7th house can create unconventional or unusual partnership situations, foreign spouse possibility, or relationship intensity. Communication, patience, and right compatibility are very important.', hi:'7वें भाव में राहु असामान्य साझेदारी स्थिति, विदेशी जीवनसाथी की संभावना या रिश्ते में तीव्रता ला सकता है। संवाद, धैर्य और सही अनुकूलता बहुत जरूरी है।', caution:'Partnership choices and relationship communication need very careful attention.', cautionHi:'साझेदारी चुनाव और रिश्ते के संवाद पर बहुत सावधान ध्यान देना जरूरी है।' },
  8:  { potential:'mixed', en:'Rahu in the 8th house brings interest in occult, research, hidden knowledge, and transformation. Life may have intense experiences but also deep insight and regenerative capacity.', hi:'8वें भाव में राहु रहस्य, अनुसंधान, छिपे ज्ञान और परिवर्तन में रुचि लाता है। जीवन में तीव्र अनुभव हो सकते हैं लेकिन गहरी अंतर्दृष्टि और पुनर्जन्म की क्षमता भी।', caution:'Health, longevity, and sudden changes need mindful attention.', cautionHi:'स्वास्थ्य, दीर्घायु और अचानक परिवर्तनों पर सचेत ध्यान जरूरी है।' },
  9:  { potential:'mixed', en:'Rahu in the 9th house creates unconventional or non-traditional spiritual/philosophical views and complex father or mentor relationships. Fortune and dharma may come through unusual paths.', hi:'9वें भाव में राहु असामान्य आध्यात्मिक/दार्शनिक विचार और जटिल पिता या गुरु संबंध बनाता है। भाग्य और धर्म असामान्य रास्तों से आ सकता है।', caution:'Father relationship, spiritual path, and luck require mindful navigation.', cautionHi:'पिता संबंध, आध्यात्मिक पथ और भाग्य पर सचेत नेविगेशन जरूरी है।' },
  10: { potential:'good', en:'Rahu in the 10th house gives strong career ambition, desire for recognition, and the drive to reach unusual heights in profession. Technology, foreign fields, or unconventional careers can be very successful.', hi:'10वें भाव में राहु मजबूत करियर महत्वाकांक्षा, पहचान की इच्छा और पेशे में असामान्य ऊंचाइयों तक पहुंचने का जोश देता है। प्रौद्योगिकी, विदेशी क्षेत्र या असामान्य करियर बहुत सफल हो सकते हैं।', caution:'Watch for shortcuts, ethics in profession, and authority conflicts.', cautionHi:'शॉर्टकट, पेशे में नैतिकता और अधिकार संघर्षों के प्रति सावधान रहें।' },
  11: { potential:'conditional', en:'Rahu in the 11th house has significant income and network potential, but this potential matures around age 42 and requires a strong 11th lord, supportive dasha, and disciplined effort. Gains may come through unusual, technology, or foreign sources.', hi:'11वें भाव में राहु में महत्वपूर्ण आय और नेटवर्क क्षमता है, लेकिन यह क्षमता लगभग 42 वर्ष की उम्र में परिपक्व होती है और मजबूत 11वें स्वामी, सहायक दशा और अनुशासित प्रयास की जरूरत होती है।', caution:'Income can be unstable; wise financial planning and right network are essential.', cautionHi:'आय अस्थिर हो सकती है; सुबुद्ध वित्तीय योजना और सही नेटवर्क आवश्यक है।' },
  12: { potential:'mixed', en:'Rahu in the 12th house can create foreign travel or settlement opportunities, spiritual interest, and liberation themes, but can also bring hidden expenses, isolation, or unusual losses.', hi:'12वें भाव में राहु विदेश यात्रा या बसने के अवसर, आध्यात्मिक रुचि और मोक्ष के विषय ला सकता है, लेकिन छिपे खर्च, अकेलापन या असामान्य नुकसान भी हो सकते हैं।', caution:'Hidden expenses, sleep issues, and overseas opportunities need careful management.', cautionHi:'छिपे खर्च, नींद की समस्याएं और विदेशी अवसरों का सावधानी से प्रबंधन जरूरी है।' },
};

function evaluateRahu(chart, profile = {}) {
  const planets = chart.planets || {};
  const lagna   = chart.ascendant?.rashi_num || 1;
  const rahu    = planets.Rahu;
  const age     = estimateAge(profile);

  if (!rahu) {
    return { house: null, score: 50, status: 'balanced', notes: [], notesHi: [], blockers: [], amplifiers: [] };
  }

  const rahuHouse = houseOf(rahu, lagna);
  const theme     = RAHU_HOUSE_THEMES[rahuHouse] || RAHU_HOUSE_THEMES[1];

  // House lord of Rahu's position
  const houseLordN = houseLordName(lagna, rahuHouse);
  const houseLord  = planets[houseLordN];
  const lordScore  = houseLord ? clamp(dignityScore(houseLord) - afflictionPenalty(getAfflictions(houseLordN, planets, lagna)), 0, 100) : 50;

  // Rahu maturity factor
  const rahuMaturAge = 42;
  const ageBonus     = age !== null && age >= rahuMaturAge ? 10 : age !== null && age >= 35 ? 5 : 0;

  // Dasha support
  const dashaSupport = dashaSupportsPlanet('Rahu', chart);

  // Base score by house potential
  const potentialBase = { good:72, conditional:58, mixed:52, medium:50, challenging:38 }[theme.potential] ?? 50;

  // Adjust by house lord strength
  const lordBonus = lordScore >= 70 ? 10 : lordScore >= 50 ? 3 : -8;

  const score = clamp(potentialBase + lordBonus + ageBonus + (dashaSupport ? 10 : 0), 0, 100);
  const status = statusFromScore(score);

  const blockers   = [];
  const amplifiers = [];
  const notes      = [theme.en];
  const notesHi    = [theme.hi];

  // 11th house special conditions
  if (rahuHouse === 11) {
    if (age !== null && age < rahuMaturAge) {
      notes.push(`Rahu in 11th house gives better income potential after age ${rahuMaturAge} (Rahu maturity age). Before that, gains may be present but unstable.`);
      notesHi.push(`11वें भाव में राहु ${rahuMaturAge} वर्ष की आयु (राहु परिपक्वता) के बाद बेहतर आय संभावना देता है। उससे पहले, लाभ मौजूद हो सकते हैं लेकिन अस्थिर हो सकते हैं।`);
    } else if (age !== null && age >= rahuMaturAge) {
      amplifiers.push(`Rahu in 11th, age ${age} — past Rahu maturity age: income potential can now manifest more concretely`);
      notes.push('Rahu in the 11th house after age 42 — the income and network potential of this placement can now express more concretely with disciplined effort.');
      notesHi.push('42 वर्ष के बाद 11वें भाव में राहु — इस स्थान की आय और नेटवर्क क्षमता अब अनुशासित प्रयास के साथ अधिक ठोस रूप से व्यक्त हो सकती है।');
    }
    if (lordScore < 45) {
      blockers.push('11th house lord is weak — Rahu in 11th cannot express its full gain potential without strong house lord support');
      notes.push('For Rahu in 11th to give strong income results, the 11th house lord must be strong. Currently the lord is somewhat weak, so income may be unstable or require more disciplined effort.');
      notesHi.push('11वें भाव में राहु से मजबूत आय परिणाम के लिए 11वें भाव का स्वामी मजबूत होना जरूरी है। अभी स्वामी कुछ कमजोर है, इसलिए आय अस्थिर हो सकती है या अधिक अनुशासित प्रयास की जरूरत हो सकती है।');
    } else {
      amplifiers.push(`Strong 11th lord (${houseLordN}) supports Rahu's gain potential in 11th`);
    }
    if (dashaSupport) {
      amplifiers.push('Rahu dasha active: significant potential for income and network expansion now');
    }
  }

  // Good house commentary
  if (['good'].includes(theme.potential)) {
    amplifiers.push(`Rahu in ${rahuHouse}th: favorable position for ${rahuHouse === 3 ? 'initiative/communication' : rahuHouse === 6 ? 'overcoming obstacles' : 'career ambition'}`);
  }

  // Caution
  notes.push(`Caution: ${theme.caution}`);
  notesHi.push(`सावधानी: ${theme.cautionHi}`);

  return {
    house: rahuHouse, score, status,
    potential: theme.potential,
    houseLordName: houseLordN, houseLordScore: lordScore,
    dashaSupport, rahuMaturityAge: rahuMaturAge, currentAge: age,
    pastMaturityAge: age !== null && age >= rahuMaturAge,
    blockers, amplifiers, notes, notesHi,
    themeEn: theme.en, themeHi: theme.hi,
  };
}

module.exports = { evaluateRahu };
