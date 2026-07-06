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

const PRACTICAL_CHECKLISTS = {
  general: [
    { en:'Write down the exact decision that must be made.', hi:'जिस निर्णय की जरूरत है, उसे एक वाक्य में लिखें।' },
    { en:'Separate confirmed facts from assumptions or fears.', hi:'पक्की जानकारी को अनुमान और डर से अलग करें।' },
    { en:'Choose one small action that gives you better information.', hi:'ऐसा एक छोटा कदम चुनें जिससे बेहतर जानकारी मिले।' },
  ],
  marriage: [
    { en:'Discuss expectations, commitment and timelines openly.', hi:'अपेक्षाओं, प्रतिबद्धता और समय-सीमा पर खुलकर बात करें।' },
    { en:'Check practical compatibility around family, money and lifestyle.', hi:'परिवार, धन और जीवनशैली की व्यावहारिक अनुकूलता जांचें।' },
    { en:'Do not decide under emotional pressure or an ultimatum.', hi:'भावनात्मक दबाव या अल्टीमेटम में निर्णय न लें।' },
  ],
  career: [
    { en:'Confirm role, salary, location, joining date and probation in writing.', hi:'भूमिका, वेतन, स्थान, जॉइनिंग तिथि और प्रोबेशन लिखित में पक्का करें।' },
    { en:'Compare growth, stability and work culture with your current option.', hi:'मौजूदा विकल्प से विकास, स्थिरता और कार्य-संस्कृति की तुलना करें।' },
    { en:'Ask for clarification or time before accepting if any key term is unclear.', hi:'कोई मुख्य शर्त अस्पष्ट हो तो स्वीकार करने से पहले जानकारी या समय मांगें।' },
  ],
  finance: [
    { en:'Verify the total amount, return, fees and worst-case loss.', hi:'कुल राशि, लाभ, शुल्क और सबसे बड़े संभावित नुकसान की जांच करें।' },
    { en:'Keep an emergency buffer before committing money.', hi:'धन लगाने से पहले आपातकालीन बचत अलग रखें।' },
    { en:'Get independent advice for a large or unfamiliar commitment.', hi:'बड़े या अनजान निवेश पर स्वतंत्र विशेषज्ञ की सलाह लें।' },
  ],
  health: [
    { en:'Note symptoms, duration and any recent changes.', hi:'लक्षण, उनकी अवधि और हाल के बदलाव लिखें।' },
    { en:'Consult a qualified medical professional for diagnosis or treatment.', hi:'जांच और उपचार के लिए योग्य चिकित्सक से सलाह लें।' },
    { en:'Seek urgent care if symptoms are severe or worsening.', hi:'लक्षण गंभीर हों या बढ़ रहे हों तो तुरंत चिकित्सा सहायता लें।' },
  ],
  legal: [
    { en:'Preserve documents, messages, dates and payment records.', hi:'दस्तावेज, संदेश, तारीखें और भुगतान रिकॉर्ड सुरक्षित रखें।' },
    { en:'Write down the outcome you want and the deadline involved.', hi:'अपेक्षित परिणाम और संबंधित समय-सीमा लिखें।' },
    { en:'Use a qualified legal professional before taking action.', hi:'कार्रवाई से पहले योग्य कानूनी विशेषज्ञ की सलाह लें।' },
  ],
  travel: [
    { en:'Confirm documents, bookings, budget and local requirements.', hi:'दस्तावेज, बुकिंग, बजट और स्थानीय नियम पक्के करें।' },
    { en:'Keep a backup route, date or accommodation option.', hi:'वैकल्पिक मार्ग, तारीख या ठहरने की व्यवस्था रखें।' },
    { en:'Check the practical impact on work and family before finalising.', hi:'अंतिम निर्णय से पहले काम और परिवार पर प्रभाव जांचें।' },
  ],
  lost_object: [
    { en:'Return to the last place where the item was definitely seen.', hi:'उस अंतिम स्थान पर दोबारा देखें जहां वस्तु निश्चित रूप से थी।' },
    { en:'Check bags, drawers, vehicles and secure or enclosed places.', hi:'बैग, दराज, वाहन और सुरक्षित या बंद स्थान जांचें।' },
    { en:'Contact the people and places involved without delay.', hi:'संबंधित लोगों और स्थानों से तुरंत संपर्क करें।' },
  ],
  property: [
    { en:'Verify title, approvals, dues and ownership documents.', hi:'स्वामित्व, अनुमति, बकाया और सभी दस्तावेज जांचें।' },
    { en:'Inspect condition, neighbourhood and total ownership cost.', hi:'स्थिति, आसपास का क्षेत्र और कुल लागत जांचें।' },
    { en:'Use independent legal and technical checks before payment.', hi:'भुगतान से पहले स्वतंत्र कानूनी और तकनीकी जांच कराएं।' },
  ],
  education: [
    { en:'List the syllabus, remaining preparation and important dates.', hi:'पाठ्यक्रम, बाकी तैयारी और महत्वपूर्ण तारीखें लिखें।' },
    { en:'Use a realistic daily plan with measurable targets.', hi:'मापने योग्य लक्ष्यों वाली यथार्थ दैनिक योजना बनाएं।' },
    { en:'Review weak areas with a teacher or reliable mentor.', hi:'कमजोर विषयों की शिक्षक या विश्वसनीय मार्गदर्शक से समीक्षा करें।' },
  ],
  family: [
    { en:'Speak directly with the people affected by the decision.', hi:'निर्णय से प्रभावित लोगों से सीधे बात करें।' },
    { en:'Separate the practical issue from old emotional conflicts.', hi:'व्यावहारिक विषय को पुराने भावनात्मक विवादों से अलग रखें।' },
    { en:'Agree on one fair next step and a time to review it.', hi:'एक उचित अगला कदम और उसकी समीक्षा का समय तय करें।' },
  ],
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
      headlineEn:'Favourable — move forward thoughtfully', headlineHi:'अनुकूल — सोच-समझकर आगे बढ़ें',
      summaryEn:`The present conditions support progress in ${config.focusEn}. Confirm the practical details, then take a clear next step.`,
      summaryHi:`अभी ${config.focusHi} में आगे बढ़ने के संकेत अनुकूल हैं। व्यावहारिक बातें पक्की करके स्पष्ट अगला कदम लें।`,
    },
    conditional: {
      headlineEn:'Possible — check the conditions before saying yes', headlineHi:'संभावना है — हाँ कहने से पहले शर्तें जांचें',
      summaryEn:`There is useful potential around ${config.focusEn}, but a good outcome depends on timing, clear terms and your follow-through.`,
      summaryHi:`${config.focusHi} में संभावना है, लेकिन अच्छा परिणाम सही समय, स्पष्ट शर्तों और आपके प्रयास पर निर्भर करेगा।`,
    },
    mixed: {
      headlineEn:'Do not rush — the answer is mixed', headlineHi:'जल्दबाज़ी न करें — संकेत मिले-जुले हैं',
      summaryEn:`There are both opportunities and concerns around ${config.focusEn}. Gather the missing facts and compare the risks before deciding.`,
      summaryHi:`${config.focusHi} में अवसर और चिंताएं दोनों हैं। निर्णय से पहले बाकी जानकारी लें और जोखिमों की तुलना करें।`,
    },
    delayed: {
      headlineEn:'Not yet — improve the situation before deciding', headlineHi:'अभी नहीं — निर्णय से पहले परिस्थिति सुधारें',
      summaryEn:`An immediate result around ${config.focusEn} may bring delay or extra difficulty. Prepare, renegotiate or wait for better conditions.`,
      summaryHi:`${config.focusHi} में तुरंत आगे बढ़ने पर देरी या अतिरिक्त कठिनाई हो सकती है। तैयारी करें, शर्तों पर दोबारा बात करें या बेहतर परिस्थिति की प्रतीक्षा करें।`,
    },
    unclear: {
      headlineEn:'Pause — this is not the right moment for a firm answer', headlineHi:'रुकें — अभी पक्का निर्णय लेने का सही समय नहीं है',
      summaryEn:'Important facts still appear unsettled. Do not decide from urgency alone; get clarity on the real-world conditions first.',
      summaryHi:'कुछ महत्वपूर्ण बातें अभी स्पष्ट या स्थिर नहीं हैं। केवल जल्दबाज़ी में निर्णय न लें; पहले वास्तविक शर्तों और परिस्थितियों को साफ करें।',
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
      titleEn:'What is in your control', titleHi:'आपके हाथ में क्या है',
      summaryEn:lagnaCondition.score >= 4
        ? 'You have useful influence here. Clear communication and a timely practical step can improve the outcome.'
        : lagnaCondition.score <= -5
          ? 'Your control is limited right now. Prepare carefully and do not depend on effort alone to fix every uncertainty.'
          : 'You can influence part of the outcome, but other people or circumstances will also matter.',
      summaryHi:lagnaCondition.score >= 4
        ? 'इस विषय में आपका प्रभाव उपयोगी है। स्पष्ट बातचीत और समय पर लिया गया व्यावहारिक कदम परिणाम बेहतर कर सकता है।'
        : lagnaCondition.score <= -5
          ? 'अभी स्थिति पर आपका नियंत्रण सीमित है। पूरी तैयारी करें और यह न मानें कि केवल प्रयास से हर अनिश्चितता दूर हो जाएगी।'
          : 'आप परिणाम के कुछ हिस्से को प्रभावित कर सकते हैं, लेकिन दूसरे लोग और परिस्थितियां भी महत्वपूर्ण रहेंगी।',
      technicalEn:`Prashna ascendant: ${chart.ascendant.rashi_en}; ascendant lord ${lagnaLord} in house ${lagnaLordHouse || '—'}.`,
      technicalHi:`प्रश्न लग्न: ${chart.ascendant.rashi_hi}; लग्न स्वामी ${PLANET_HI[lagnaLord] || lagnaLord} भाव ${lagnaLordHouse || '—'} में।`,
    },
    {
      key:'matter', tone:queryCondition.score >= 4 ? 'support' : queryCondition.score <= -5 ? 'care' : 'balanced',
      titleEn:'What the situation is showing', titleHi:'परिस्थिति क्या बता रही है',
      summaryEn:queryCondition.score >= 4
        ? 'The external conditions can support progress, provided the practical terms are acceptable.'
        : queryCondition.score <= -5
          ? 'The matter may involve delay, revision or dependence on another person. Verify the terms before committing.'
          : 'The opportunity is neither fully blocked nor fully settled. More information will make the decision safer.',
      summaryHi:queryCondition.score >= 4
        ? 'बाहरी परिस्थितियां आगे बढ़ने में सहयोग कर सकती हैं, यदि व्यावहारिक शर्तें आपके लिए सही हों।'
        : queryCondition.score <= -5
          ? 'विषय में देरी, बदलाव या किसी दूसरे व्यक्ति पर निर्भरता हो सकती है। प्रतिबद्ध होने से पहले शर्तें जांचें।'
          : 'अवसर न पूरी तरह रुका है, न पूरी तरह तय है। अधिक जानकारी मिलने पर निर्णय सुरक्षित होगा।',
      technicalEn:`Question house: ${config.house}; its lord ${queryLord} is in house ${queryLordHouse || '—'}.`,
      technicalHi:`प्रश्न भाव: ${config.house}; इसके स्वामी ${PLANET_HI[queryLord] || queryLord} भाव ${queryLordHouse || '—'} में।`,
    },
    {
      key:'moon', tone:moonAdjustment >= 5 ? 'support' : moonAdjustment <= -4 ? 'care' : 'balanced',
      titleEn:'How the situation may develop', titleHi:'आगे स्थिति कैसे बन सकती है',
      summaryEn:moonAdjustment >= 5
        ? 'Momentum can improve as the conversation or process moves forward.'
        : moonAdjustment <= -4
          ? 'Stress or changing details may affect judgement. Give yourself enough time to review the facts.'
          : 'Progress is likely to be gradual. Watch what changes before making a final commitment.',
      summaryHi:moonAdjustment >= 5
        ? 'बातचीत या प्रक्रिया आगे बढ़ने पर स्थिति बेहतर हो सकती है।'
        : moonAdjustment <= -4
          ? 'तनाव या बदलती जानकारी निर्णय को प्रभावित कर सकती है। तथ्यों की समीक्षा के लिए पर्याप्त समय लें।'
          : 'प्रगति धीरे-धीरे होने की संभावना है। अंतिम प्रतिबद्धता से पहले बदलती बातों पर ध्यान दें।',
      technicalEn:`Moon: ${moon.rashi_en}, house ${moonHouse || '—'}.`,
      technicalHi:`चंद्र: ${moon.rashi_hi}, भाव ${moonHouse || '—'}।`,
    },
  ];

  const supportingFactors = [];
  const cautions = [];
  if (lagnaCondition.score >= 4) supportingFactors.push({ en:'Your actions and communication can meaningfully influence the result.', hi:'आपके कदम और बातचीत परिणाम को सार्थक रूप से प्रभावित कर सकते हैं।' });
  else cautions.push({ en:'Your control over the situation may be limited or require more preparation.', hi:'स्थिति पर आपका नियंत्रण सीमित हो सकता है या अधिक तैयारी की जरूरत हो सकती है।' });
  if (queryCondition.score >= 4) supportingFactors.push({ en:'The surrounding conditions can help the matter move forward.', hi:'आसपास की परिस्थितियां विषय को आगे बढ़ाने में सहयोग कर सकती हैं।' });
  else cautions.push({ en:'The main matter may face delay, revision or dependency on another person.', hi:'मुख्य विषय में देरी, सुधार या किसी अन्य व्यक्ति पर निर्भरता हो सकती है।' });
  if (relation.score > 0) supportingFactors.push({ en:'What you want and what the situation offers can work together.', hi:'आपकी जरूरत और परिस्थिति में उपलब्ध अवसर एक साथ काम कर सकते हैं।' });
  if (relation.score < 0) cautions.push({ en:'What you want and what the situation currently offers are not fully aligned.', hi:'आपकी जरूरत और परिस्थिति में अभी उपलब्ध अवसर पूरी तरह मेल नहीं खाते।' });
  if (beneficOccupants.length) supportingFactors.push({ en:'There are additional signs of support around the matter.', hi:'इस विषय के आसपास कुछ अतिरिक्त सहायक संकेत भी हैं।' });
  if (challengingOccupants.length) cautions.push({ en:'There are extra signs of delay, pressure or complications that need checking.', hi:'देरी, दबाव या उलझन के अतिरिक्त संकेत हैं, जिन्हें जांचना जरूरी है।' });
  if (clarity === 'low') cautions.unshift({ en:'Important facts still appear unsettled, so a firm answer would be premature.', hi:'कुछ महत्वपूर्ण बातें अभी स्थिर नहीं हैं, इसलिए पक्का निर्णय लेना जल्दबाज़ी होगा।' });

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
      nextSteps:PRACTICAL_CHECKLISTS[category] || PRACTICAL_CHECKLISTS.general,
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
