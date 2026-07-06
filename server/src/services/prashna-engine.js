'use strict';

const BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury']);
const CHALLENGING_PLANETS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu']);
const SUPPORTIVE_HOUSES = new Set([1, 4, 5, 7, 9, 10, 11]);
const CARE_HOUSES = new Set([6, 8, 12]);
const MOVABLE_SIGNS = new Set([1, 4, 7, 10]);
const FIXED_SIGNS = new Set([2, 5, 8, 11]);

const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु',
  Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const CATEGORY_CONFIG = {
  general: {
    house:1, titleEn:'General Direction', titleHi:'सामान्य दिशा',
    focusEn:'the overall direction of this matter', focusHi:'इस विषय की समग्र दिशा',
    adviceEn:'Define the decision you can control and avoid repeating the same question without a real change in circumstances.',
    adviceHi:'जिस निर्णय पर आपका नियंत्रण है उसे स्पष्ट करें और परिस्थिति बदले बिना एक ही प्रश्न बार-बार न पूछें।',
  },
  marriage: {
    house:7, titleEn:'Marriage & Partnership', titleHi:'विवाह और साझेदारी',
    focusEn:'marriage, commitment and partnership', focusHi:'विवाह, प्रतिबद्धता और साझेदारी',
    adviceEn:'Use honest communication and verify practical compatibility before making a commitment.',
    adviceHi:'प्रतिबद्धता से पहले स्पष्ट संवाद करें और व्यावहारिक अनुकूलता को भी जांचें।',
  },
  career: {
    house:10, titleEn:'Career & Job', titleHi:'करियर और नौकरी',
    focusEn:'career movement, work and professional direction', focusHi:'करियर, काम और पेशेवर दिशा',
    adviceEn:'Prepare the next concrete step—application, conversation, skill or deadline—instead of waiting only for circumstances.',
    adviceHi:'केवल परिस्थिति की प्रतीक्षा न करें; आवेदन, बातचीत, कौशल या समय-सीमा जैसा अगला ठोस कदम तैयार रखें।',
  },
  finance: {
    house:2, secondaryHouse:11, titleEn:'Money & Gains', titleHi:'धन और लाभ',
    focusEn:'money, income and expected gains', focusHi:'धन, आय और अपेक्षित लाभ',
    adviceEn:'Check the numbers, timing and downside before committing money; avoid decisions based only on urgency.',
    adviceHi:'धन लगाने से पहले आंकड़े, समय और संभावित नुकसान जांचें; केवल जल्दबाजी के आधार पर निर्णय न लें।',
  },
  health: {
    house:6, secondaryHouse:1, titleEn:'Health & Recovery', titleHi:'स्वास्थ्य और सुधार',
    focusEn:'health, recovery and practical care', focusHi:'स्वास्थ्य, सुधार और व्यावहारिक देखभाल',
    adviceEn:'Use this reading only as reflective guidance and consult a qualified medical professional for symptoms or treatment.',
    adviceHi:'इसे केवल चिंतनात्मक मार्गदर्शन मानें; लक्षण या उपचार के लिए योग्य चिकित्सक से सलाह लें।',
  },
  legal: {
    house:6, titleEn:'Dispute & Legal Matter', titleHi:'विवाद और कानूनी विषय',
    focusEn:'disputes, competition and legal process', focusHi:'विवाद, प्रतिस्पर्धा और कानूनी प्रक्रिया',
    adviceEn:'Preserve documents, timelines and professional legal advice; do not rely on astrology instead of counsel.',
    adviceHi:'दस्तावेज, समय-रेखा और पेशेवर कानूनी सलाह सुरक्षित रखें; ज्योतिष को कानूनी सलाह का विकल्प न बनाएं।',
  },
  travel: {
    house:9, secondaryHouse:3, titleEn:'Travel & Relocation', titleHi:'यात्रा और स्थान परिवर्तन',
    focusEn:'travel, movement and relocation', focusHi:'यात्रा, आवागमन और स्थान परिवर्तन',
    adviceEn:'Confirm documents, budget, route and backup arrangements before finalising travel.',
    adviceHi:'यात्रा तय करने से पहले दस्तावेज, बजट, मार्ग और वैकल्पिक व्यवस्था की पुष्टि करें।',
  },
  lost_object: {
    house:2, secondaryHouse:4, titleEn:'Lost Object', titleHi:'खोई हुई वस्तु',
    focusEn:'the recovery of a missing possession', focusHi:'खोई हुई वस्तु की प्राप्ति',
    adviceEn:'Retrace the last confirmed location, contact relevant people and check secure or enclosed places first.',
    adviceHi:'अंतिम निश्चित स्थान को दोबारा जांचें, संबंधित लोगों से संपर्क करें और पहले सुरक्षित या बंद स्थान देखें।',
  },
  property: {
    house:4, titleEn:'Property & Home', titleHi:'संपत्ति और घर',
    focusEn:'property, home and fixed assets', focusHi:'संपत्ति, घर और स्थायी साधन',
    adviceEn:'Verify ownership, documents, structural condition and total cost before proceeding.',
    adviceHi:'आगे बढ़ने से पहले स्वामित्व, दस्तावेज, संरचना और कुल लागत की जांच करें।',
  },
  education: {
    house:5, secondaryHouse:9, titleEn:'Education & Examination', titleHi:'शिक्षा और परीक्षा',
    focusEn:'education, examination and learning progress', focusHi:'शिक्षा, परीक्षा और सीखने की प्रगति',
    adviceEn:'Convert the reading into a study plan with measurable preparation and realistic deadlines.',
    adviceHi:'इस मार्गदर्शन को मापने योग्य तैयारी और यथार्थ समय-सीमा वाली अध्ययन योजना में बदलें।',
  },
  family: {
    house:4, secondaryHouse:2, titleEn:'Family & Home', titleHi:'परिवार और घर',
    focusEn:'family relationships and domestic stability', focusHi:'पारिवारिक संबंध और घरेलू स्थिरता',
    adviceEn:'Address the practical issue calmly and involve the people directly affected rather than relying on assumptions.',
    adviceHi:'व्यावहारिक विषय को शांति से संभालें और अनुमान लगाने के बजाय प्रभावित लोगों को बातचीत में शामिल करें।',
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function planetHouse(chart, planetName) {
  for (let house = 1; house <= 12; house += 1) {
    if ((chart?.houses?.[house]?.planets || []).includes(planetName)) return house;
  }
  return null;
}

function conditionAdjustment(planet, house) {
  if (!planet) return { score:-12, notes:['missing'] };
  let score = 0;
  const notes = [];
  const dignity = String(planet.dignity || '').toLowerCase();
  if (dignity.includes('exalt')) { score += 14; notes.push('exalted'); }
  else if (dignity.includes('mool')) { score += 11; notes.push('moolatrikona'); }
  else if (dignity.includes('own')) { score += 9; notes.push('own-sign'); }
  else if (dignity.includes('debil')) { score -= 13; notes.push('debilitated'); }

  if (SUPPORTIVE_HOUSES.has(house)) score += 5;
  if (CARE_HOUSES.has(house)) score -= 7;
  if (planet.is_combust) { score -= 6; notes.push('combust'); }
  if (planet.is_retrograde) notes.push('retrograde');
  return { score, notes };
}

function relationAdjustment(firstHouse, secondHouse) {
  if (!firstHouse || !secondHouse) return { score:-5, type:'unclear' };
  const distance = ((secondHouse - firstHouse + 12) % 12) + 1;
  if (distance === 1) return { score:15, type:'joined' };
  if (distance === 7) return { score:11, type:'opposite' };
  if (distance === 5 || distance === 9) return { score:8, type:'trine' };
  if (distance === 3 || distance === 11) return { score:4, type:'cooperative' };
  if (distance === 6 || distance === 8) return { score:-10, type:'friction' };
  if (distance === 2 || distance === 12) return { score:-5, type:'indirect' };
  return { score:0, type:'neutral' };
}

function toneFromScore(score, clarity) {
  if (clarity === 'low') return 'unclear';
  if (score >= 70) return 'supportive';
  if (score >= 52) return 'conditional';
  if (score >= 38) return 'mixed';
  return 'delayed';
}

function verdictText(tone, config) {
  const values = {
    supportive: {
      headlineEn:'The matter has meaningful support', headlineHi:'इस विषय को सार्थक सहयोग मिल रहा है',
      summaryEn:`The chart supports progress in ${config.focusEn}, especially when you act clearly and consistently.`,
      summaryHi:`कुंडली ${config.focusHi} में प्रगति का समर्थन करती है, विशेषकर जब आप स्पष्ट और नियमित कदम उठाते हैं।`,
    },
    conditional: {
      headlineEn:'Progress is possible with clear conditions', headlineHi:'स्पष्ट शर्तों के साथ प्रगति संभव है',
      summaryEn:`There is useful potential around ${config.focusEn}, but the result depends on timing and practical follow-through.`,
      summaryHi:`${config.focusHi} में उपयोगी संभावना है, लेकिन परिणाम समय और व्यावहारिक प्रयास पर निर्भर रहेगा।`,
    },
    mixed: {
      headlineEn:'The picture is mixed and needs careful handling', headlineHi:'स्थिति मिश्रित है और सावधानी से संभालने की जरूरत है',
      summaryEn:`The chart shows both support and resistance around ${config.focusEn}; avoid treating the situation as settled yet.`,
      summaryHi:`${config.focusHi} में सहयोग और रुकावट दोनों दिखाई देते हैं; अभी स्थिति को अंतिम न मानें।`,
    },
    delayed: {
      headlineEn:'Patience and revision are more useful than pressure', headlineHi:'दबाव से अधिक धैर्य और सुधार उपयोगी रहेंगे',
      summaryEn:`The present chart suggests delay or extra work around ${config.focusEn}, rather than an easy immediate result.`,
      summaryHi:`वर्तमान कुंडली ${config.focusHi} में आसान त्वरित परिणाम की बजाय देरी या अतिरिक्त प्रयास का संकेत देती है।`,
    },
    unclear: {
      headlineEn:'The situation is still forming', headlineHi:'स्थिति अभी बन रही है',
      summaryEn:'The question may be too early, too late, or dependent on facts that are still changing. Wait for a material change before judging again.',
      summaryHi:'प्रश्न बहुत जल्दी, बहुत देर से या बदलते तथ्यों पर आधारित हो सकता है। दोबारा विचार करने से पहले वास्तविक परिस्थिति बदलने दें।',
    },
  };
  return values[tone] || values.mixed;
}

function timingText(queryPlanet, tone, category) {
  if (tone === 'unclear') {
    return {
      windowEn:'No reliable timing window yet', windowHi:'अभी विश्वसनीय समय-सीमा नहीं',
      noteEn:'Ask again only after circumstances materially change.', noteHi:'परिस्थिति में वास्तविक बदलाव के बाद ही दोबारा पूछें।',
    };
  }
  const sign = Number(queryPlanet?.rashi_num || 0);
  const fastCategory = ['travel', 'lost_object', 'health'].includes(category);
  let windowEn;
  let windowHi;
  if (MOVABLE_SIGNS.has(sign)) {
    windowEn = fastCategory ? 'Several days to a few weeks' : 'Approximately 2–6 weeks';
    windowHi = fastCategory ? 'कुछ दिन से कुछ सप्ताह' : 'लगभग 2–6 सप्ताह';
  } else if (FIXED_SIGNS.has(sign)) {
    windowEn = fastCategory ? 'Several weeks to a few months' : 'Approximately 3–6 months';
    windowHi = fastCategory ? 'कुछ सप्ताह से कुछ महीने' : 'लगभग 3–6 महीने';
  } else {
    windowEn = fastCategory ? 'Approximately 2–8 weeks' : 'Approximately 1–3 months';
    windowHi = fastCategory ? 'लगभग 2–8 सप्ताह' : 'लगभग 1–3 महीने';
  }
  return {
    windowEn, windowHi,
    noteEn:'This is an indicative window rather than a promise of an event date.',
    noteHi:'यह संकेतात्मक समय-सीमा है, निश्चित घटना-तिथि नहीं।',
  };
}

function compactChart(chart) {
  const planets = Object.fromEntries(Object.entries(chart.planets || {}).map(([name, planet]) => [name, {
    longitude:planet.longitude,
    rashi_num:planet.rashi_num,
    rashi_en:planet.rashi_en,
    rashi_hi:planet.rashi_hi,
    degree_in_sign:planet.degree_in_sign,
    degree_in_sign_dms:planet.degree_in_sign_dms,
    dignity:planet.dignity,
    is_retrograde:planet.is_retrograde,
    is_combust:planet.is_combust,
  }]));
  return {
    ascendant:chart.ascendant,
    planets,
    houses:chart.houses,
    panchang:chart.panchang ? {
      tithi:chart.panchang.tithi,
      vara:chart.panchang.vara,
      yoga:chart.panchang.yoga,
      karana:chart.panchang.karana,
      moon_phase:chart.panchang.moon_phase,
    } : null,
  };
}

function generatePrashnaReading({ chart, question, category = 'general', askedAt, place }) {
  if (!chart?.ascendant || !chart?.planets || !chart?.houses) return null;
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
  const lagnaLord = chart.ascendant.rashi_lord;
  const queryLord = chart.houses?.[config.house]?.rashi_lord;
  const lagnaLordHouse = planetHouse(chart, lagnaLord);
  const queryLordHouse = planetHouse(chart, queryLord);
  const moonHouse = planetHouse(chart, 'Moon');
  const lagnaCondition = conditionAdjustment(chart.planets[lagnaLord], lagnaLordHouse);
  const queryCondition = conditionAdjustment(chart.planets[queryLord], queryLordHouse);
  const relation = relationAdjustment(lagnaLordHouse, queryLordHouse);
  const occupants = chart.houses?.[config.house]?.planets || [];
  const beneficOccupants = occupants.filter((name) => BENEFICS.has(name) || name === 'Moon');
  const challengingOccupants = occupants.filter((name) => CHALLENGING_PLANETS.has(name));
  const ascDegree = Number(chart.ascendant.degree_in_sign || 0);
  const clarity = ascDegree < 3 || ascDegree > 27 ? 'low' : 'normal';

  const moon = chart.planets.Moon;
  const sun = chart.planets.Sun;
  const moonPhaseAngle = ((Number(moon.longitude) - Number(sun.longitude) + 360) % 360);
  const moonWaxing = moonPhaseAngle > 0 && moonPhaseAngle < 180;
  let moonAdjustment = moonWaxing ? 4 : -1;
  if (SUPPORTIVE_HOUSES.has(moonHouse)) moonAdjustment += 5;
  if (CARE_HOUSES.has(moonHouse)) moonAdjustment -= 7;
  const moonConjunctions = (chart.houses?.[moonHouse]?.planets || []).filter((name) => name !== 'Moon');
  moonAdjustment += moonConjunctions.filter((name) => BENEFICS.has(name)).length * 3;
  moonAdjustment -= moonConjunctions.filter((name) => CHALLENGING_PLANETS.has(name)).length * 3;

  const occupancyAdjustment = beneficOccupants.length * 6 - challengingOccupants.length * 5;
  const rawScore = 50 + lagnaCondition.score + queryCondition.score + relation.score + moonAdjustment + occupancyAdjustment;
  const score = clamp(clarity === 'low' ? Math.min(rawScore, 59) : rawScore, 18, 88);
  const tone = toneFromScore(score, clarity);
  const verdict = verdictText(tone, config);
  const timing = timingText(chart.planets[queryLord], tone, category);

  const signals = [
    {
      key:'lagna', tone:lagnaCondition.score >= 4 ? 'support' : lagnaCondition.score <= -5 ? 'care' : 'balanced',
      titleEn:'Your ability to influence the matter', titleHi:'विषय को प्रभावित करने की आपकी क्षमता',
      summaryEn:`The Prashna ascendant is ${chart.ascendant.rashi_en}; its lord ${lagnaLord} is placed in house ${lagnaLordHouse || '—'}.`,
      summaryHi:`प्रश्न लग्न ${chart.ascendant.rashi_hi} है; इसके स्वामी ${PLANET_HI[lagnaLord] || lagnaLord} भाव ${lagnaLordHouse || '—'} में हैं।`,
    },
    {
      key:'matter', tone:queryCondition.score >= 4 ? 'support' : queryCondition.score <= -5 ? 'care' : 'balanced',
      titleEn:'Condition of the matter', titleHi:'विषय की स्थिति',
      summaryEn:`House ${config.house} represents this question. Its lord ${queryLord} is placed in house ${queryLordHouse || '—'}.`,
      summaryHi:`इस प्रश्न का प्रतिनिधित्व भाव ${config.house} करता है। इसके स्वामी ${PLANET_HI[queryLord] || queryLord} भाव ${queryLordHouse || '—'} में हैं।`,
    },
    {
      key:'moon', tone:moonAdjustment >= 5 ? 'support' : moonAdjustment <= -4 ? 'care' : 'balanced',
      titleEn:'Mind, movement and unfolding events', titleHi:'मन, गति और घटनाओं का विकास',
      summaryEn:`The Moon is in ${moon.rashi_en}, house ${moonHouse || '—'}, showing how the matter is likely to unfold emotionally and practically.`,
      summaryHi:`चंद्र ${moon.rashi_hi}, भाव ${moonHouse || '—'} में हैं, जो विषय के भावनात्मक और व्यावहारिक विकास को दर्शाते हैं।`,
    },
  ];

  const supportingFactors = [];
  const cautions = [];
  if (lagnaCondition.score >= 4) supportingFactors.push({ en:`${lagnaLord}, the ascendant lord, has usable support.`, hi:`लग्न स्वामी ${PLANET_HI[lagnaLord] || lagnaLord} को उपयोगी सहयोग प्राप्त है।` });
  else cautions.push({ en:'Your control over the situation may be limited or require more preparation.', hi:'स्थिति पर आपका नियंत्रण सीमित हो सकता है या अधिक तैयारी की जरूरत हो सकती है।' });
  if (queryCondition.score >= 4) supportingFactors.push({ en:`${queryLord}, the question lord, can help the matter develop.`, hi:`प्रश्न स्वामी ${PLANET_HI[queryLord] || queryLord} विषय को आगे बढ़ाने में सहायक हो सकते हैं।` });
  else cautions.push({ en:'The main matter may face delay, revision or dependency on another person.', hi:'मुख्य विषय में देरी, सुधार या किसी अन्य व्यक्ति पर निर्भरता हो सकती है।' });
  if (relation.score > 0) supportingFactors.push({ en:'The ascendant lord and question lord have a workable connection.', hi:'लग्न स्वामी और प्रश्न स्वामी के बीच उपयोगी संबंध है।' });
  if (relation.score < 0) cautions.push({ en:'Your intention and the matter are not fully aligned yet.', hi:'आपकी इच्छा और विषय की परिस्थिति अभी पूरी तरह अनुकूल नहीं हैं।' });
  if (beneficOccupants.length) supportingFactors.push({ en:`Supportive planets in the question house: ${beneficOccupants.join(', ')}.`, hi:`प्रश्न भाव में सहायक ग्रह: ${beneficOccupants.map((p) => PLANET_HI[p] || p).join(', ')}।` });
  if (challengingOccupants.length) cautions.push({ en:`Extra care is shown by ${challengingOccupants.join(', ')} in the question house.`, hi:`प्रश्न भाव में ${challengingOccupants.map((p) => PLANET_HI[p] || p).join(', ')} अतिरिक्त सावधानी का संकेत देते हैं।` });
  if (clarity === 'low') cautions.unshift({ en:'The ascendant is at an early or late degree, so the situation may still be changing.', hi:'लग्न आरंभिक या अंतिम अंश में है, इसलिए स्थिति अभी बदल रही हो सकती है।' });

  return {
    version:'prashna-v1',
    question:{ text:question, category, categoryTitleEn:config.titleEn, categoryTitleHi:config.titleHi, askedAt, place },
    chart:compactChart(chart),
    free:{
      tone,
      scoreBand:score >= 70 ? 'strong-support' : score >= 52 ? 'moderate-support' : score >= 38 ? 'mixed' : 'needs-time',
      ...verdict,
      visibleSignals:signals.slice(0, 2),
      noteEn:'Prashna shows tendencies and conditions; your choices and circumstances still matter.',
      noteHi:'प्रश्न कुंडली प्रवृत्तियां और परिस्थितियां दिखाती है; आपके निर्णय और हालात भी महत्वपूर्ण हैं।',
    },
    premium:{
      fullAnswerEn:verdict.summaryEn,
      fullAnswerHi:verdict.summaryHi,
      allSignals:signals,
      supportingFactors,
      cautions,
      timing,
      guidanceEn:config.adviceEn,
      guidanceHi:config.adviceHi,
      technicalDetails:{
        score,
        clarity,
        questionHouse:config.house,
        secondaryHouse:config.secondaryHouse || null,
        lagnaLord,
        lagnaLordHouse,
        questionLord:queryLord,
        questionLordHouse:queryLordHouse,
        moonHouse,
        moonWaxing,
        lordRelationship:relation.type,
        beneficOccupants,
        challengingOccupants,
      },
    },
    lockedSections:[
      { key:'full-answer', titleEn:'Complete judgement and reasoning', titleHi:'पूर्ण निर्णय और कारण' },
      { key:'timing', titleEn:'Likely timing window', titleHi:'संभावित समय-सीमा' },
      { key:'factors', titleEn:'Supporting and conflicting factors', titleHi:'सहायक और विरोधी संकेत' },
      { key:'guidance', titleEn:'Question-specific practical guidance', titleHi:'प्रश्न के अनुसार व्यावहारिक मार्गदर्शन' },
    ],
  };
}

function gatePrashnaReading(reading, isPaid) {
  if (!reading || isPaid) return reading;
  return { ...reading, premium:null };
}

module.exports = {
  CATEGORY_CONFIG,
  generatePrashnaReading,
  gatePrashnaReading,
  compactChart,
  planetHouse,
  toneFromScore,
};
