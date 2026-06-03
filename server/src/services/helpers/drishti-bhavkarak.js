'use strict';
const { houseFromSign } = require('./core-helpers');
const { RASHIS } = require('./vedic-data');

// Source: Drishti, Bhav Karak and Digbala.pdf
const DRISHTI_OFFSETS = {
  Sun: [7], Moon: [7], Mercury: [7], Venus: [7],
  Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10],
  Rahu: [5, 7, 9], Ketu: [5, 7, 9],
};

const DRISHTI_NATURE = {
  Sun: { 7:'neutral' }, Moon: { 7:'neutral' }, Mercury: { 7:'neutral' }, Venus: { 7:'neutral' },
  Mars: { 4:'aggressive', 7:'aggressive', 8:'aggressive' },
  Jupiter: { 5:'auspicious', 7:'auspicious', 9:'auspicious' },
  Saturn: { 3:'restricting', 7:'restricting', 10:'restricting' },
  Rahu: { 5:'karmic', 7:'karmic', 9:'karmic' },
  Ketu: { 5:'karmic', 7:'karmic', 9:'karmic' },
};

const BHAV_KARAK = {
  1:['Sun'], 2:['Jupiter'], 3:['Mars','Mercury'], 4:['Moon','Venus'], 5:['Jupiter'],
  6:['Mars','Saturn'], 7:['Venus'], 8:['Saturn'], 9:['Sun','Jupiter'],
  10:['Sun','Saturn','Mercury'], 11:['Jupiter'], 12:['Saturn'],
};

const BHAV_KARAK_SIGNIFICATION = {
  1: { en:'Self, Soul, Vitality, Personality', hi:'आत्मा, स्वास्थ्य, व्यक्तित्व' },
  2: { en:'Wealth, Family, Speech, Values', hi:'धन, परिवार, वाणी, संस्कार' },
  3: { en:'Courage, Siblings, Communication, Efforts', hi:'साहस, भाई-बहन, संचार, पराक्रम' },
  4: { en:'Mother, Home, Property, Happiness', hi:'माता, घर, सुख, सम्पत्ति' },
  5: { en:'Children, Education, Intelligence, Punya', hi:'संतान, शिक्षा, बुद्धि, पूर्वपुण्य' },
  6: { en:'Enemies, Diseases, Service, Debts', hi:'शत्रु, रोग, ऋण, सेवा' },
  7: { en:'Marriage, Partnership, Relationships', hi:'विवाह, संबंध, साझेदारी' },
  8: { en:'Longevity, Death, Mysteries, Occult', hi:'आयु, रहस्य, गूढ़ विद्या' },
  9: { en:'Religion, Fortune, Father, Higher Knowledge', hi:'भाग्य, धर्म, पिता, उच्च ज्ञान' },
  10:{ en:'Career, Karma, Profession, Authority', hi:'कर्म, पेशा, अधिकार, करियर' },
  11:{ en:'Gains, Desires, Elder Siblings, Prosperity', hi:'लाभ, इच्छाएँ, बड़े भाई, समृद्धि' },
  12:{ en:'Loss, Moksha, Foreign Land, Bed Pleasures', hi:'हानि, मोक्ष, विदेश, त्याग' },
};

const DIGBALA_STRONG_HOUSE = { Jupiter:1, Mercury:1, Sun:10, Mars:10, Saturn:7, Moon:4, Venus:4 };

const DIGBALA_DIRECTION = {
  1:{ en:'East', hi:'पूर्व' }, 4:{ en:'North', hi:'उत्तर' },
  7:{ en:'West', hi:'पश्चिम' }, 10:{ en:'South', hi:'दक्षिण' },
};

const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु',
  Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const PLANET_REMEDY = {
  Sun: { en:'Offer water to the rising Sun and keep promises with father, seniors, and authority figures.', hi:'उगते सूर्य को जल दें और पिता, वरिष्ठों तथा अधिकार से जुड़े वचनों को निभाएं।' },
  Moon: { en:'Keep a steady sleep rhythm, serve mother figures, and use Monday water or milk donation when needed.', hi:'नींद और दिनचर्या स्थिर रखें, माता तुल्य लोगों की सेवा करें और सोमवार को जल या दूध दान करें।' },
  Mars: { en:'Channel heat into disciplined exercise, Hanuman worship, and calm handling of disputes.', hi:'ऊर्जा को अनुशासित व्यायाम, हनुमान उपासना और विवादों में संयम से लगाएं।' },
  Mercury: { en:'Use writing, study, Vishnu worship, and clean communication before important decisions.', hi:'महत्वपूर्ण निर्णयों से पहले लेखन, अध्ययन, विष्णु उपासना और स्पष्ट संवाद अपनाएं।' },
  Jupiter: { en:'Honor teachers, study dharma, donate yellow food on Thursdays, and seek wise counsel.', hi:'गुरुजनों का सम्मान करें, धर्म अध्ययन करें, गुरुवार को पीला अन्न दान करें और सद्गुरु सलाह लें।' },
  Venus: { en:'Keep relationships respectful, preserve cleanliness and beauty, and offer Friday Lakshmi prayers.', hi:'संबंधों में सम्मान रखें, स्वच्छता और सौंदर्य बनाए रखें और शुक्रवार को लक्ष्मी उपासना करें।' },
  Saturn: { en:'Build routine, serve elders or workers, donate sesame or oil on Saturdays, and avoid shortcuts.', hi:'दिनचर्या बनाएं, बुजुर्गों या श्रमिकों की सेवा करें, शनिवार को तिल या तेल दान करें और शॉर्टकट से बचें।' },
  Rahu: { en:'Use grounding habits, Durga worship, fact checking, and avoid obsessive or risky leaps.', hi:'ग्राउंडिंग आदतें, दुर्गा उपासना, तथ्य जांच और अति जोखिम भरे कदमों से बचाव रखें।' },
  Ketu: { en:'Use Ganesha worship, meditation, simplicity, and avoid cutting people off impulsively.', hi:'गणेश उपासना, ध्यान, सरलता अपनाएं और आवेश में संबंध न तोड़ें।' },
};

function signForHouse(ascendantRashiNum, house) {
  return RASHIS[((ascendantRashiNum - 1 + house - 1) % 12)] || null;
}

function planetHi(planet) {
  return PLANET_HI[planet] || planet || 'ग्रह';
}

function names(list) {
  return list.filter(Boolean).join(', ');
}

function namesHi(list) {
  return list.filter(Boolean).map(planetHi).join(', ');
}

function natureLabel(nature) {
  return {
    auspicious: { en:'supportive', hi:'सहायक' },
    aggressive: { en:'forceful', hi:'तीव्र' },
    restricting: { en:'serious', hi:'गंभीर' },
    karmic: { en:'karmic', hi:'कर्मिक' },
    neutral: { en:'neutral', hi:'सामान्य' },
  }[nature] || { en:'mixed', hi:'मिश्रित' };
}

function drishtiHouseReading(house, sign, aspects, occupants) {
  const theme = BHAV_KARAK_SIGNIFICATION[house];
  const aspectPlanets = aspects.map((a) => a.planet);
  const hasAspects = aspects.length > 0;
  const hasOccupants = occupants.length > 0;
  const dominantNature = aspects.find((a) => a.nature === 'auspicious')?.nature
    || aspects.find((a) => a.nature === 'aggressive' || a.nature === 'restricting')?.nature
    || aspects[0]?.nature
    || 'neutral';
  const label = natureLabel(dominantNature);

  if (!hasAspects && !hasOccupants) {
    return {
      plain_effect_en: `House ${house} (${theme.en}) is quiet: no planet is sitting here and no major graha drishti is falling here. Read this area mainly through its lord and divisional charts.`,
      plain_effect_hi: `भाव ${house} (${theme.hi}) शांत है: यहाँ कोई ग्रह नहीं बैठा और कोई प्रमुख ग्रह दृष्टि भी नहीं पड़ रही। इस क्षेत्र को मुख्यतः इसके स्वामी और वर्ग कुंडली से पढ़ें।`,
      benefit_en: 'No heavy direct pressure is visible on this house.',
      benefit_hi: 'इस भाव पर सीधा भारी दबाव नहीं दिखता।',
      watch_en: 'Results depend more on the house lord, dasha, and transits.',
      watch_hi: 'फल अधिकतर भाव स्वामी, दशा और गोचर पर निर्भर रहेंगे।',
    };
  }

  if (hasAspects && hasOccupants) {
    return {
      plain_effect_en: `${names(aspectPlanets)} aspect house ${house} (${sign?.en || 'sign'}), where ${names(occupants)} is placed. This means the aspect directly influences the planet(s) sitting here, so those planets express ${theme.en} through a ${label.en} tone.`,
      plain_effect_hi: `${namesHi(aspectPlanets)} भाव ${house} (${sign?.hi || sign?.en || 'राशि'}) पर दृष्टि दे रहे हैं, जहाँ ${namesHi(occupants)} बैठा है। इसका अर्थ है कि दृष्टि बैठे हुए ग्रहों पर भी असर कर रही है; इसलिए वे ग्रह ${theme.hi} को ${label.hi} रंग में व्यक्त करेंगे।`,
      benefit_en: dominantNature === 'auspicious' ? 'Supportive aspects can protect the house and improve the planets placed there.' : 'The house receives active energy, which can create movement and visible results.',
      benefit_hi: dominantNature === 'auspicious' ? 'शुभ दृष्टि इस भाव और यहाँ बैठे ग्रहों को संरक्षण देकर फल सुधार सकती है।' : 'भाव में सक्रिय ऊर्जा आती है, जिससे गति और दिखाई देने वाले परिणाम बनते हैं।',
      watch_en: dominantNature === 'aggressive' ? 'Forceful aspects can create impatience, conflict, or sudden pressure in this house.' : dominantNature === 'restricting' ? 'Serious aspects can delay results but make them mature through responsibility.' : 'Balance the house themes instead of overreacting to one planet.',
      watch_hi: dominantNature === 'aggressive' ? 'तीव्र दृष्टि इस भाव में अधीरता, टकराव या अचानक दबाव दे सकती है।' : dominantNature === 'restricting' ? 'गंभीर दृष्टि फल में देरी दे सकती है, पर जिम्मेदारी से परिपक्वता भी देती है।' : 'एक ग्रह के कारण अति प्रतिक्रिया न करें; भाव के विषयों को संतुलित रखें।',
    };
  }

  if (hasAspects) {
    return {
      plain_effect_en: `${names(aspectPlanets)} aspect empty house ${house} (${theme.en}) in ${sign?.en || 'this sign'}. Because no natal planet is sitting here, the aspect mainly activates the house and sign themes: events, responsibilities, opportunities, or lessons related to this area become more noticeable.`,
      plain_effect_hi: `${namesHi(aspectPlanets)} खाली भाव ${house} (${theme.hi}) पर ${sign?.hi || sign?.en || 'इस राशि'} में दृष्टि दे रहे हैं। यहाँ कोई जन्म ग्रह नहीं बैठा, इसलिए दृष्टि मुख्यतः भाव और राशि के विषयों को सक्रिय करती है: इस क्षेत्र की घटनाएँ, जिम्मेदारियाँ, अवसर या सीख अधिक स्पष्ट हो सकती हैं।`,
      benefit_en: dominantNature === 'auspicious' ? 'Good guidance and protection can come into this life area.' : 'The house is not dormant; effort can produce visible movement here.',
      benefit_hi: dominantNature === 'auspicious' ? 'इस जीवन क्षेत्र में संरक्षण और अच्छी दिशा मिल सकती है।' : 'यह भाव निष्क्रिय नहीं है; प्रयास से यहाँ परिणाम दिख सकते हैं।',
      watch_en: dominantNature === 'karmic' ? 'Karmic aspects can bring unusual desires, detachment, or sudden changes.' : 'Avoid ignoring this house during the current dasha or major transit.',
      watch_hi: dominantNature === 'karmic' ? 'कर्मिक दृष्टि असामान्य इच्छाएँ, विरक्ति या अचानक बदलाव ला सकती है।' : 'वर्तमान दशा या बड़े गोचर में इस भाव को अनदेखा न करें।',
    };
  }

  return {
    plain_effect_en: `${names(occupants)} sits in house ${house} (${theme.en}), but no major graha drishti falls here. The planet placed here has a cleaner, more self-driven expression.`,
    plain_effect_hi: `${namesHi(occupants)} भाव ${house} (${theme.hi}) में बैठा है, लेकिन यहाँ कोई प्रमुख ग्रह दृष्टि नहीं पड़ रही। इसलिए यहाँ बैठे ग्रह का फल अधिक सीधा और अपने स्वभाव से चलेगा।`,
    benefit_en: 'Placed planets can work without heavy outside aspect pressure.',
    benefit_hi: 'यहाँ बैठे ग्रह भारी बाहरी दृष्टि दबाव के बिना काम कर सकते हैं।',
    watch_en: 'Still judge the planet by dignity, house lord, dasha, and divisional support.',
    watch_hi: 'फिर भी ग्रह की राशि बल, भाव स्वामी, दशा और वर्ग समर्थन से पुष्टि करें।',
  };
}

function digbalaReading(planet, strongHouse, planetHouse, oppositeHouse, strengthPercent) {
  if (planetHouse === strongHouse) {
    return {
      status:'directionally_strong',
      effect_en:`${planet} has Digbala in house ${planetHouse}. Its natural results become easier to express and more visible in the kundli.`,
      effect_hi:`${planetHi(planet)} को भाव ${planetHouse} में दिग्बल मिला है। इसके स्वाभाविक फल कुंडली में अधिक आसानी से और स्पष्ट रूप से व्यक्त होते हैं।`,
      benefit_en:`Use ${planet} confidently for its healthy qualities; it can support decisions, timing, and practical results.`,
      benefit_hi:`${planetHi(planet)} के स्वस्थ गुणों का भरोसे से उपयोग करें; यह निर्णय, समय और व्यावहारिक परिणामों में सहारा दे सकता है।`,
      watch_en:'Even strong planets need discipline; overuse can turn strength into ego, attachment, or pressure.',
      watch_hi:'मजबूत ग्रह को भी अनुशासन चाहिए; अति उपयोग से बल अहंकार, आसक्ति या दबाव बन सकता है।',
      remedy_en:PLANET_REMEDY[planet]?.en,
      remedy_hi:PLANET_REMEDY[planet]?.hi,
    };
  }

  if (planetHouse === oppositeHouse) {
    return {
      status:'directionally_weak',
      effect_en:`${planet} is opposite its Digbala house, so its directional strength is reduced. Its results may require more patience, structure, and remedy.`,
      effect_hi:`${planetHi(planet)} अपने दिग्बल भाव के सामने है, इसलिए दिशा बल घटता है। इसके फल में धैर्य, संरचना और उपाय अधिक चाहिए।`,
      benefit_en:'Weak directional strength is workable when the person uses conscious habits and does not rush the planet area.',
      benefit_hi:'दिशा बल कमजोर हो तो भी सचेत आदतों और जल्दबाजी से बचकर फल सुधरते हैं।',
      watch_en:`Watch the house ${planetHouse} themes carefully; stress can show up when ${planet} is active in dasha or transit.`,
      watch_hi:`भाव ${planetHouse} के विषयों पर ध्यान रखें; ${planetHi(planet)} की दशा या गोचर में तनाव दिख सकता है।`,
      remedy_en:PLANET_REMEDY[planet]?.en,
      remedy_hi:PLANET_REMEDY[planet]?.hi,
    };
  }

  return {
    status:'moderate',
    effect_en:`${planet} has ${strengthPercent}% directional strength. It is neither fully empowered nor fully weakened, so results depend on dignity, house ownership, and current dasha.`,
    effect_hi:`${planetHi(planet)} का दिशा बल ${strengthPercent}% है। यह न पूर्ण बलवान है न पूर्ण कमजोर; फल राशि बल, भाव स्वामित्व और वर्तमान दशा पर निर्भर रहेंगे।`,
    benefit_en:'This is a balanced placement: improvements come through steady use of the planet quality.',
    benefit_hi:'यह संतुलित स्थिति है: ग्रह के गुणों का स्थिर उपयोग करने से सुधार आता है।',
    watch_en:'Avoid judging by Digbala alone; combine it with the planet report and Varga support.',
    watch_hi:'केवल दिग्बल से निर्णय न लें; ग्रह रिपोर्ट और वर्ग समर्थन के साथ पढ़ें।',
    remedy_en:PLANET_REMEDY[planet]?.en,
    remedy_hi:PLANET_REMEDY[planet]?.hi,
  };
}

function bhavKarakReading(house, positions) {
  const sig = BHAV_KARAK_SIGNIFICATION[house];
  const strong = positions.filter((kp) => ['trikona', 'kendra'].includes(kp.placement_quality) && !kp.is_in_own_karak_house);
  const ownHouse = positions.filter((kp) => kp.is_in_own_karak_house);
  const dusthana = positions.filter((kp) => [6, 8, 12].includes(kp.house));
  const weak = positions.filter((kp) => String(kp.dignity || '').includes('Debilitation'));
  const problemPlanets = [...new Set([...ownHouse, ...dusthana, ...weak].map((kp) => kp.planet))];
  const supportPlanets = strong.map((kp) => kp.planet);
  const status = problemPlanets.length ? 'needs_care' : supportPlanets.length ? 'supported' : 'mixed';

  return {
    overall_status: status,
    benefit_en: supportPlanets.length
      ? `${names(supportPlanets)} supports this house's natural matters: ${sig.en}.`
      : `This house is mainly read through its karakas and lord; results can improve with steady attention to ${sig.en}.`,
    benefit_hi: supportPlanets.length
      ? `${namesHi(supportPlanets)} इस भाव के प्राकृतिक विषयों (${sig.hi}) को सहारा देता है।`
      : `यह भाव अपने कारक ग्रह और स्वामी से पढ़ा जाएगा; ${sig.hi} पर स्थिर ध्यान देने से फल सुधर सकते हैं।`,
    danger_en: problemPlanets.length
      ? `${names(problemPlanets)} needs care here. Own karak-house placement, dusthana placement, or weak dignity can reduce ease and create pressure.`
      : 'No major karak warning is visible from the natural significators.',
    danger_hi: problemPlanets.length
      ? `${namesHi(problemPlanets)} को यहाँ सावधानी चाहिए। कारक का अपने ही भाव में होना, कठिन भाव या कमजोर राशि बल फल को दबा सकता है।`
      : 'प्राकृतिक कारकों से कोई बड़ा सावधानी संकेत नहीं दिखता।',
    remedy_en: problemPlanets.length
      ? (PLANET_REMEDY[problemPlanets[0]]?.en || 'Use simple mantra, service, and disciplined habits for the weak karaka.')
      : 'Keep the house theme active through right action; no heavy remedial pressure is indicated.',
    remedy_hi: problemPlanets.length
      ? (PLANET_REMEDY[problemPlanets[0]]?.hi || 'कमजोर कारक के लिए सरल मंत्र, सेवा और अनुशासन अपनाएं।')
      : 'सही कर्म से भाव के विषयों को सक्रिय रखें; भारी उपाय दबाव नहीं दिखता।',
  };
}

function calculateGrahaDrishti(ascendantRashiNum, planets) {
  const byPlanet = {};
  const byHouse = {};
  const occupantsByHouse = {};
  for (let h = 1; h <= 12; h += 1) {
    byHouse[h] = [];
    occupantsByHouse[h] = [];
  }

  for (const [planet, pd] of Object.entries(planets)) {
    const house = houseFromSign(ascendantRashiNum, pd.rashi_num);
    occupantsByHouse[house].push(planet);
  }

  for (const [planet, pd] of Object.entries(planets)) {
    const fromHouse = houseFromSign(ascendantRashiNum, pd.rashi_num);
    const offsets = DRISHTI_OFFSETS[planet] || [7];
    const aspectedHouses = offsets.map((offset) => {
      const h = ((fromHouse - 1 + offset - 1) % 12) + 1;
      return { house: h, offset, nature: DRISHTI_NATURE[planet]?.[offset] || 'neutral' };
    });
    byPlanet[planet] = { from_house: fromHouse, aspects: aspectedHouses };
    for (const { house } of aspectedHouses) byHouse[house].push(planet);
  }

  const byHouseDetail = {};
  for (let house = 1; house <= 12; house += 1) {
    const sign = signForHouse(ascendantRashiNum, house);
    const aspects = [];
    for (const [planet, info] of Object.entries(byPlanet)) {
      for (const aspect of info.aspects) {
        if (aspect.house === house) aspects.push({ planet, from_house: info.from_house, ...aspect });
      }
    }
    byHouseDetail[house] = {
      house,
      sign_en: sign?.en || null,
      sign_hi: sign?.hi || null,
      theme_en: BHAV_KARAK_SIGNIFICATION[house]?.en || '',
      theme_hi: BHAV_KARAK_SIGNIFICATION[house]?.hi || '',
      occupants: occupantsByHouse[house],
      aspects,
      ...drishtiHouseReading(house, sign, aspects, occupantsByHouse[house]),
    };
  }

  return { by_planet: byPlanet, by_house: byHouse, by_house_detail: byHouseDetail };
}

function calculateBhavKarak(ascendantRashiNum, planets) {
  const result = {};
  for (let h = 1; h <= 12; h += 1) {
    const karakas = BHAV_KARAK[h] || [];
    const sig = BHAV_KARAK_SIGNIFICATION[h];
    const karakaPositions = karakas.map((planet) => {
      const pd = planets[planet];
      if (!pd) return { planet, house: null, rashi_en: null, rashi_hi: null, dignity: null, is_in_own_karak_house: false, placement_quality: 'missing' };
      const planetHouse = houseFromSign(ascendantRashiNum, pd.rashi_num);
      return {
        planet,
        house: planetHouse,
        rashi_en: pd.rashi_en,
        rashi_hi: pd.rashi_hi,
        dignity: pd.dignity,
        is_in_own_karak_house: planetHouse === h,
        placement_quality: [1, 5, 9].includes(planetHouse) ? 'trikona' : [1, 4, 7, 10].includes(planetHouse) ? 'kendra' : 'other',
      };
    });
    result[h] = {
      house: h,
      karakas,
      signification_en: sig.en,
      signification_hi: sig.hi,
      karaka_positions: karakaPositions,
      ...bhavKarakReading(h, karakaPositions),
    };
  }
  return result;
}

function calculateDigbala(ascendantRashiNum, planets) {
  const result = {};
  for (const [planet, strongHouse] of Object.entries(DIGBALA_STRONG_HOUSE)) {
    const pd = planets[planet];
    if (!pd) continue;
    const planetHouse = houseFromSign(ascendantRashiNum, pd.rashi_num);
    const oppositeHouse = ((strongHouse - 1 + 6) % 12) + 1;
    const direction = DIGBALA_DIRECTION[strongHouse] || { en:'-', hi:'-' };
    const distFromStrong = Math.abs(((planetHouse - strongHouse + 12) % 12));
    const distNorm = distFromStrong > 6 ? 12 - distFromStrong : distFromStrong;
    const strengthPercent = Math.round((1 - distNorm / 6) * 100);
    result[planet] = {
      planet,
      strong_house: strongHouse,
      strong_direction: direction,
      planet_house: planetHouse,
      opposite_house: oppositeHouse,
      has_digbala: planetHouse === strongHouse,
      has_digbala_loss: planetHouse === oppositeHouse,
      strength_percent: strengthPercent,
      rashi_en: pd.rashi_en,
      rashi_hi: pd.rashi_hi,
      ...digbalaReading(planet, strongHouse, planetHouse, oppositeHouse, strengthPercent),
    };
  }
  return result;
}

module.exports = {
  DRISHTI_OFFSETS,
  BHAV_KARAK,
  DIGBALA_STRONG_HOUSE,
  calculateGrahaDrishti,
  calculateBhavKarak,
  calculateDigbala,
};
