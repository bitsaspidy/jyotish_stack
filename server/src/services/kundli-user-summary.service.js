'use strict';
/**
 * Kundli User Summary Composer
 * Produces human-friendly bilingual summary cards and life area cards
 * from existing chart + judgement data. Pure function — no DB calls.
 */

const RASHI_EN = ['','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const RASHI_HI = ['','मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];

const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'बृहस्पति',
  Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const LAGNA_NATURE = {
  1:  { en:'You are energetic, pioneering, and action-oriented — a natural initiator who leads from the front.',          hi:'आप ऊर्जावान, अग्रणी और कार्यशील हैं — एक स्वाभाविक पहल करने वाले जो आगे से नेतृत्व करते हैं।' },
  2:  { en:'You are patient, practical, and steady — you build strong foundations and value security and comfort.',       hi:'आप धैर्यवान, व्यावहारिक और स्थिर हैं — आप मजबूत नींव बनाते हैं और सुरक्षा को महत्व देते हैं।' },
  3:  { en:'You are curious, communicative, and adaptable — you connect ideas and people with ease.',                     hi:'आप जिज्ञासु, संवाद-कुशल और अनुकूलनशील हैं — आप विचारों और लोगों को आसानी से जोड़ते हैं।' },
  4:  { en:'You are nurturing, emotionally sensitive, and home-oriented — family and belonging give you strength.',       hi:'आप पोषणकारी, भावनात्मक रूप से संवेदनशील और घर-उन्मुख हैं — परिवार आपको शक्ति देता है।' },
  5:  { en:'You are confident, generous, and creative — you have a natural warmth that inspires those around you.',      hi:'आप आत्मविश्वासी, उदार और रचनात्मक हैं — आपमें एक स्वाभाविक उष्णता है जो दूसरों को प्रेरित करती है।' },
  6:  { en:'You are detail-oriented, service-focused, and analytical — you improve and refine whatever you touch.',      hi:'आप विवरण-उन्मुख, सेवा-केंद्रित और विश्लेषणात्मक हैं — आप जो भी छूते हैं उसे बेहतर बना देते हैं।' },
  7:  { en:'You are diplomatic, relationship-conscious, and fair-minded — you think naturally in terms of balance.',     hi:'आप राजनयिक, संबंध-जागरूक और निष्पक्ष विचारशील हैं — आप स्वाभाविक रूप से संतुलन में सोचते हैं।' },
  8:  { en:'You are deep, perceptive, and transformative — you see beneath the surface and grow through challenges.',    hi:'आप गहन, अंतर्ज्ञानी और परिवर्तनकारी हैं — आप सतह के नीचे देखते हैं और चुनौतियों से विकसित होते हैं।' },
  9:  { en:'You are philosophical, optimistic, and truth-seeking — you grow through learning and exploring new ideas.',  hi:'आप दार्शनिक, आशावादी और सत्य-खोजी हैं — आप सीखने और नए विचारों की खोज से बढ़ते हैं।' },
  10: { en:'You are disciplined, responsible, and long-term focused — you grow steadily and earn deep trust over time.', hi:'आप अनुशासित, जिम्मेदार और दीर्घकालिक दृष्टिकोण वाले हैं — आप धीरे-धीरे बढ़ते हैं और गहरा विश्वास अर्जित करते हैं।' },
  11: { en:'You are independent, innovative, and community-minded — you see the world differently and build networks.',  hi:'आप स्वतंत्र, अभिनव और समुदाय-उन्मुख हैं — आप दुनिया को अलग तरह से देखते हैं और नेटवर्क बनाते हैं।' },
  12: { en:'You are intuitive, compassionate, and spiritually inclined — you feel deeply and seek meaning beyond what is obvious.',hi:'आप अंतर्ज्ञानी, दयालु और आध्यात्मिक रूप से झुके हुए हैं — आप गहराई से अनुभव करते हैं और स्पष्ट से परे अर्थ खोजते हैं।' },
};

const MOON_NATURE = {
  1:  { en:'Emotionally direct and quick to react — you feel things intensely and express them openly.',                   hi:'भावनात्मक रूप से सीधे और जल्दी प्रतिक्रिया देने वाले — आप चीजों को तीव्रता से महसूस करते हैं।' },
  2:  { en:'Emotionally steady and comfort-seeking — you need stability, beauty, and warmth to feel secure.',              hi:'भावनात्मक रूप से स्थिर और आराम-खोजी — सुरक्षित महसूस करने के लिए आपको स्थिरता और गर्मजोशी चाहिए।' },
  3:  { en:'Emotionally curious and restless — your mind needs variety, communication, and mental stimulation.',           hi:'भावनात्मक रूप से जिज्ञासु और बेचैन — आपके मन को विविधता और संवाद चाहिए।' },
  4:  { en:'Deeply nurturing and home-loving — family and belonging are your emotional foundation.',                       hi:'गहराई से पोषणकारी और घर-प्रेमी — परिवार और अपनेपन की भावना आपकी भावनात्मक नींव है।' },
  5:  { en:'Warm and expressive emotionally — you love deeply and need creative outlets to feel fulfilled.',               hi:'भावनाओं में उष्ण और अभिव्यंजक — आप गहराई से प्यार करते हैं और रचनात्मक अभिव्यक्ति चाहते हैं।' },
  6:  { en:'Analytical and service-oriented — you process feelings through practical action and problem-solving.',         hi:'विश्लेषणात्मक और सेवा-उन्मुख — आप व्यावहारिक कार्य और समस्या-समाधान से भावनाओं को संसाधित करते हैं।' },
  7:  { en:'Emotionally relationship-oriented — you need partnership, fairness, and harmony to feel balanced.',            hi:'भावनात्मक रूप से संबंध-उन्मुख — संतुलित महसूस करने के लिए आपको साझेदारी और सामंजस्य चाहिए।' },
  8:  { en:'Emotionally deep and private — you feel intensely but rarely show it; you seek emotional depth and trust.',   hi:'भावनात्मक रूप से गहरे और निजी — आप तीव्रता से महसूस करते हैं लेकिन शायद ही दिखाते हैं; भावनात्मक गहराई चाहते हैं।' },
  9:  { en:'Expansive and optimistic in emotions — you need freedom, learning, and meaning to feel truly fulfilled.',     hi:'भावनात्मक रूप से विस्तृत और आशावादी — पूर्ण महसूस करने के लिए आपको स्वतंत्रता, सीखना और अर्थ चाहिए।' },
  10: { en:'Disciplined and goal-oriented emotionally — you connect feelings with responsibility and long-term aims.',     hi:'भावनाओं में अनुशासित और लक्ष्य-उन्मुख — आप भावनाओं को जिम्मेदारी और दीर्घकालिक लक्ष्यों से जोड़ते हैं।' },
  11: { en:'Independent and idealistic emotionally — you need freedom, community, and mental space to thrive.',           hi:'भावनात्मक रूप से स्वतंत्र और आदर्शवादी — फलने-फूलने के लिए आपको स्वतंत्रता और मानसिक स्थान चाहिए।' },
  12: { en:'Compassionate and spiritual in emotions — you absorb others\' feelings easily and seek inner peace.',          hi:'भावनाओं में दयालु और आध्यात्मिक — आप दूसरों की भावनाओं को आसानी से अवशोषित करते हैं और आंतरिक शांति खोजते हैं।' },
};

const DASHA_MEANING = {
  Sun:     { en:'authority, confidence, career recognition, and father-related themes',      hi:'अधिकार, आत्मविश्वास, करियर पहचान, और पिता-संबंधित विषय' },
  Moon:    { en:'mind, emotions, home, mother, and public life themes',                      hi:'मन, भावनाएं, घर, माता और सार्वजनिक जीवन के विषय' },
  Mars:    { en:'action, energy, property, courage, and health themes',                      hi:'कार्य, ऊर्जा, संपत्ति, साहस और स्वास्थ्य के विषय' },
  Mercury: { en:'communication, business, learning, and sibling themes',                     hi:'संवाद, व्यापार, सीखना और भाई-बहन के विषय' },
  Jupiter: { en:'growth, wisdom, children, spirituality, and dharma themes',                 hi:'विकास, ज्ञान, संतान, आध्यात्मिकता और धर्म के विषय' },
  Venus:   { en:'love, relationships, beauty, creativity, and comfort themes',               hi:'प्रेम, रिश्ते, सौंदर्य, रचनात्मकता और आराम के विषय' },
  Saturn:  { en:'discipline, patience, hard work, karma, and building long-term results',    hi:'अनुशासन, धैर्य, कठिन परिश्रम, कर्म और दीर्घकालिक परिणाम' },
  Rahu:    { en:'ambition, foreign opportunities, technology, and unconventional growth',    hi:'महत्वाकांक्षा, विदेशी अवसर, प्रौद्योगिकी और असंगत विकास' },
  Ketu:    { en:'spiritual growth, detachment, intuition, and past karma resolution',        hi:'आध्यात्मिक विकास, वैराग्य, अंतर्ज्ञान और पूर्व कर्म समाधान' },
};

function statusFromScore(s) {
  if (s == null) return 'balanced';
  if (s >= 68) return 'strong';
  if (s >= 50) return 'balanced';
  if (s >= 35) return 'needs-care';
  return 'challenging';
}

function _buildSummaryCards(chart, judgement) {
  const planets    = chart?.planets || {};
  const lagna      = chart?.ascendant || {};
  const lagnaRashi = lagna.rashi_num || 1;

  const lagnaArea = (judgement?.areas || []).find(a => a.areaKey === 'lagna');
  const mindArea  = (judgement?.areas || []).find(a => a.areaKey === 'mind');
  const lagnaScore = judgement?.lagnaStrength?.score ?? lagnaArea?.score ?? 50;
  const moonScore  = judgement?.pillarStrength?.moonScore ?? mindArea?.score ?? 50;

  const moon      = planets.Moon || {};
  const moonRashi = moon.rashi_num || 0;

  const overallScore   = judgement?.overallScore ?? 55;
  const overallLabelEn = judgement?.overallLabel?.en || 'Balanced Chart';
  const overallLabelHi = judgement?.overallLabel?.hi || 'संतुलित कुंडली';

  const strongAreas  = (judgement?.areas || []).filter(a => a.status === 'strong').slice(0, 3);
  const carefulAreas = (judgement?.areas || []).filter(a => a.status === 'challenging' || a.status === 'needs-care').slice(0, 4);

  const dashaArr  = Array.isArray(chart?.dasha) ? chart.dasha : [];
  const curDasha  = dashaArr.find(d => d.is_current) || dashaArr[0] || null;
  const dashaLord = curDasha?.lord || curDasha?.planet || null;
  const dashaMeaning = dashaLord ? DASHA_MEANING[dashaLord] : null;

  const topAdviceEn = (judgement?.areas || []).flatMap(a => a.advice    || []).filter(Boolean).slice(0, 2);
  const topAdviceHi = (judgement?.areas || []).flatMap(a => a.adviceHi  || []).filter(Boolean).slice(0, 2);

  return [
    {
      cardKey: 'nature', icon: '🌟',
      titleEn: 'Your Nature',   titleHi: 'आपका स्वभाव',
      valueEn: `${RASHI_EN[lagnaRashi] || ''} Ascendant`, valueHi: `${RASHI_HI[lagnaRashi] || ''} लग्न`,
      descEn:  LAGNA_NATURE[lagnaRashi]?.en || 'Your ascendant shapes your outer personality and life approach.',
      descHi:  LAGNA_NATURE[lagnaRashi]?.hi || 'आपका लग्न आपके व्यक्तित्व और जीवन दृष्टिकोण को आकार देता है।',
      score:   lagnaScore, status: statusFromScore(lagnaScore),
    },
    {
      cardKey: 'mind', icon: '🌙',
      titleEn: 'Your Mind',   titleHi: 'आपका मन',
      valueEn: moonRashi ? `Moon in ${RASHI_EN[moonRashi]}` : 'Moon Placement',
      valueHi: moonRashi ? `${RASHI_HI[moonRashi]} में चंद्र` : 'चंद्र स्थिति',
      descEn:  MOON_NATURE[moonRashi]?.en || 'The Moon shapes your emotional world and mental patterns.',
      descHi:  MOON_NATURE[moonRashi]?.hi || 'चंद्र आपकी भावनात्मक दुनिया और मानसिक पैटर्न को आकार देता है।',
      score:   moonScore, status: statusFromScore(moonScore),
    },
    {
      cardKey: 'direction', icon: '🧭',
      titleEn: 'Life Direction',   titleHi: 'जीवन दिशा',
      valueEn: overallLabelEn, valueHi: overallLabelHi,
      descEn:  strongAreas.length
        ? `Strong support in: ${strongAreas.map(a => a.titleEn).join(', ')}.`
        : 'Your chart shows balanced potential. Consistent effort opens good opportunities.',
      descHi:  strongAreas.length
        ? `मजबूत समर्थन: ${strongAreas.map(a => a.titleHi).join(', ')} में।`
        : 'आपकी कुंडली संतुलित क्षमता दिखाती है। लगातार प्रयास से अच्छे अवसर खुलते हैं।',
      score:   overallScore, status: statusFromScore(overallScore),
    },
    {
      cardKey: 'period', icon: '⏳',
      titleEn: 'Current Period',   titleHi: 'वर्तमान दशा',
      valueEn: dashaLord ? `${dashaLord} Mahadasha` : 'Planetary Period',
      valueHi: dashaLord ? `${PLANET_HI[dashaLord] || dashaLord} महादशा` : 'ग्रह काल',
      descEn:  dashaMeaning ? `This period activates ${dashaMeaning.en}.` : 'Your current planetary period shapes the themes of this time.',
      descHi:  dashaMeaning ? `यह काल ${dashaMeaning.hi} को सक्रिय करता है।` : 'आपका वर्तमान ग्रह काल इस समय के विषयों को आकार देता है।',
      score:   null, status: null,
      metaEn:  curDasha?.end ? `Until ${curDasha.end}` : null,
      metaHi:  curDasha?.end ? `${curDasha.end} तक` : null,
    },
    {
      cardKey: 'guidance', icon: '🪔',
      titleEn: 'Key Guidance',   titleHi: 'मुख्य मार्गदर्शन',
      valueEn: 'For this period', valueHi: 'इस काल के लिए',
      descEn:  topAdviceEn.length ? topAdviceEn.join(' ') : 'Focus on your strengths and proceed with patience and awareness.',
      descHi:  topAdviceHi.length ? topAdviceHi.join(' ') : 'अपनी शक्तियों पर ध्यान दें और धैर्य व जागरूकता के साथ आगे बढ़ें।',
      score:   null, status: null,
    },
    {
      cardKey: 'strong', icon: '💪',
      titleEn: 'Strong Areas',   titleHi: 'मजबूत क्षेत्र',
      valueEn: strongAreas.length ? `${strongAreas.length} area${strongAreas.length > 1 ? 's' : ''}` : 'Balanced',
      valueHi: strongAreas.length ? `${strongAreas.length} क्षेत्र` : 'संतुलित',
      descEn:  strongAreas.length ? `Strong support in: ${strongAreas.map(a => a.titleEn).join(', ')}.` : 'Your chart shows steady balanced energy across all areas.',
      descHi:  strongAreas.length ? `${strongAreas.map(a => a.titleHi).join(', ')} में मजबूत समर्थन।` : 'आपकी कुंडली सभी क्षेत्रों में स्थिर संतुलित ऊर्जा दिखाती है।',
      items:   strongAreas.map(a => ({ titleEn: a.titleEn, titleHi: a.titleHi, status: a.status })),
      score:   null, status: null,
    },
    {
      cardKey: 'care', icon: '🌱',
      titleEn: 'Needs Attention',   titleHi: 'ध्यान जरूरी',
      valueEn: carefulAreas.length ? `${carefulAreas.length} area${carefulAreas.length > 1 ? 's' : ''}` : 'All clear',
      valueHi: carefulAreas.length ? `${carefulAreas.length} क्षेत्र` : 'सब ठीक',
      descEn:  carefulAreas.length ? 'These areas benefit from extra care, right timing, and conscious effort.' : 'No major challenge areas found. Keep up your current path.',
      descHi:  carefulAreas.length ? 'इन क्षेत्रों को विशेष सावधानी, सही समय और सचेत प्रयास से लाभ होता है।' : 'कोई बड़ी चुनौती का क्षेत्र नहीं मिला। अपने वर्तमान पथ पर जारी रखें।',
      items:   carefulAreas.map(a => ({
        titleEn: a.titleEn, titleHi: a.titleHi, status: a.status,
        adviceEn: (a.advice || [])[0] || '', adviceHi: (a.adviceHi || [])[0] || '',
      })),
      score:   null, status: null,
    },
  ];
}

function _buildLifeAreaCards(chart, judgement) {
  const areas       = judgement?.areas || [];
  const findArea    = key => areas.find(a => a.areaKey === key);
  const rahuHouse   = judgement?.rahuPlacement?.house ?? null;
  const rahuScore   = judgement?.rahuPlacement?.score ?? 52;

  const lagna_area    = findArea('lagna');
  const mind_area     = findArea('mind');
  const gains_area    = findArea('gains');
  const marriage_area = findArea('marriage');
  const children_area = findArea('children');
  const maturity_area = findArea('maturity');

  const fromArea = (area, overrideEn, overrideHi) => {
    if (!area) return { score: 52, status: 'balanced', summaryEn: overrideEn || 'Balanced picture.', summaryHi: overrideHi || 'संतुलित स्थिति।', goodPoints: [], goodPointsHi: [], challenges: [], challengesHi: [], adviceEn: '', adviceHi: '' };
    return {
      score:        area.score,
      status:       area.status,
      summaryEn:    overrideEn || area.userSummaryEn || '',
      summaryHi:    overrideHi || area.userSummaryHi || '',
      goodPoints:   area.goodPoints   || [],
      goodPointsHi: area.goodPointsHi || [],
      challenges:   area.challenges   || [],
      challengesHi: area.challengesHi || [],
      adviceEn:     (area.advice    || [])[0] || '',
      adviceHi:     (area.adviceHi  || [])[0] || '',
    };
  };

  return [
    {
      areaKey: 'career', icon: '💼', titleEn: 'Career & Job', titleHi: 'करियर और नौकरी',
      ...fromArea(gains_area,
        gains_area ? gains_area.userSummaryEn : 'Career growth comes through consistent effort, right timing, and building on your strengths.',
        gains_area ? gains_area.userSummaryHi : 'करियर विकास लगातार प्रयास, सही समय और अपनी शक्तियों पर निर्माण के माध्यम से आता है।',
      ),
    },
    {
      areaKey: 'money', icon: '💰', titleEn: 'Business & Money', titleHi: 'व्यापार और धन',
      ...fromArea(gains_area, null, null),
    },
    {
      areaKey: 'family', icon: '🏡', titleEn: 'Family & Happiness', titleHi: 'परिवार और सुख',
      ...fromArea(mind_area,
        mind_area ? mind_area.userSummaryEn : 'Family harmony and emotional well-being depend on clear communication and mutual support.',
        mind_area ? mind_area.userSummaryHi : 'पारिवारिक सामंजस्य और भावनात्मक कल्याण स्पष्ट संवाद और परस्पर समर्थन पर निर्भर करता है।',
      ),
    },
    {
      areaKey: 'home', icon: '🌿', titleEn: 'Mother, Home & Property', titleHi: 'माता, घर और संपत्ति',
      ...fromArea(mind_area,
        mind_area
          ? (mind_area.score >= 60 ? 'Home stability, mother relationship, and property matters are generally well-supported in your chart.' : 'Home and property matters benefit from careful planning, patience, and nurturing family harmony.')
          : 'Home stability and property matters grow through careful planning and right timing.',
        mind_area
          ? (mind_area.score >= 60 ? 'घर की स्थिरता, माता संबंध और संपत्ति के मामले आम तौर पर आपकी कुंडली में अच्छी तरह समर्थित हैं।' : 'घर और संपत्ति के मामलों को सावधानीपूर्वक योजना, धैर्य और पारिवारिक सामंजस्य से लाभ होता है।')
          : 'घर की स्थिरता और संपत्ति के मामले सावधानीपूर्वक योजना और सही समय से बढ़ते हैं।',
      ),
    },
    {
      areaKey: 'marriage', icon: '💑', titleEn: 'Marriage & Relationship', titleHi: 'विवाह और रिश्ते',
      ...fromArea(marriage_area, null, null),
    },
    {
      areaKey: 'children', icon: '🌸', titleEn: 'Children & Education', titleHi: 'संतान और शिक्षा',
      ...fromArea(children_area, null, null),
    },
    {
      areaKey: 'health', icon: '❤️', titleEn: 'Health & Body', titleHi: 'स्वास्थ्य और शरीर',
      ...fromArea(lagna_area,
        lagna_area
          ? (lagna_area.score >= 65 ? 'Your vitality and physical resilience show good strength in your chart. Maintain healthy routines.' : lagna_area.score >= 45 ? 'Health is generally balanced. Regular care, good habits, and mindful lifestyle keep you well.' : 'Health and vitality benefit from regular attention, healthy habits, and timely care.')
          : 'Health is shaped by your Lagna strength and lifestyle choices.',
        lagna_area
          ? (lagna_area.score >= 65 ? 'आपकी जीवन शक्ति और शारीरिक लचीलापन अच्छी ताकत दिखाते हैं। स्वस्थ दिनचर्या बनाए रखें।' : lagna_area.score >= 45 ? 'स्वास्थ्य आम तौर पर संतुलित है। नियमित देखभाल, अच्छी आदतें और सचेत जीवनशैली आपको ठीक रखती है।' : 'स्वास्थ्य और जीवन शक्ति को नियमित ध्यान, स्वस्थ आदतों और समय पर देखभाल से लाभ होता है।')
          : 'स्वास्थ्य आपके लग्न बल और जीवनशैली के चुनावों द्वारा आकारित है।',
      ),
    },
    {
      areaKey: 'disputes', icon: '⚖️', titleEn: 'Debt & Disputes', titleHi: 'ऋण और विवाद',
      score: 52, status: 'balanced',
      summaryEn: 'Legal matters, debts, and disputes benefit from clear financial planning, discipline, and early conflict resolution.',
      summaryHi: 'कानूनी मामले, ऋण और विवाद स्पष्ट वित्तीय योजना, अनुशासन और शीघ्र विवाद समाधान से लाभान्वित होते हैं।',
      goodPoints: [], goodPointsHi: [], challenges: [], challengesHi: [],
      adviceEn: 'Maintain clear financial records and avoid unnecessary debts. Resolve conflicts through respectful dialogue.',
      adviceHi: 'स्पष्ट वित्तीय रिकॉर्ड रखें और अनावश्यक ऋण से बचें। सम्मानजनक संवाद के माध्यम से विवाद सुलझाएं।',
    },
    {
      areaKey: 'luck', icon: '🙏', titleEn: 'Luck & Spirituality', titleHi: 'भाग्य और आध्यात्मिकता',
      ...fromArea(maturity_area,
        maturity_area
          ? (maturity_area.score >= 60 ? 'Your chart shows good spiritual potential and fortune. Right conduct and dharmic living amplify your luck and wellbeing.' : 'Luck and spiritual growth come through patience, right conduct, and service. Fortune favors consistent, honest effort.')
          : 'Your fortune and spiritual path grow through right action, learning, and dharmic living.',
        maturity_area
          ? (maturity_area.score >= 60 ? 'आपकी कुंडली अच्छी आध्यात्मिक क्षमता और भाग्य दिखाती है। सही आचरण और धर्मिक जीवन आपके भाग्य को बढ़ाते हैं।' : 'भाग्य और आध्यात्मिक विकास धैर्य, सही आचरण और सेवा के माध्यम से आते हैं। भाग्य ईमानदार, लगातार प्रयास का पक्ष लेता है।')
          : 'आपका भाग्य और आध्यात्मिक पथ सही कार्य, सीखने और धर्मिक जीवन के माध्यम से बढ़ता है।',
      ),
    },
    {
      areaKey: 'foreign', icon: '✈️', titleEn: 'Foreign & Expenses', titleHi: 'विदेश और व्यय',
      score: rahuHouse === 12 ? rahuScore : 52,
      status: rahuHouse === 12 ? statusFromScore(rahuScore) : 'balanced',
      summaryEn: rahuHouse === 12
        ? 'Rahu in the 12th house suggests foreign connections, travel opportunities, and spiritual growth — alongside mindful expense management.'
        : 'Foreign opportunities and expenses are shaped by your chart. International connections can open meaningful doors with careful planning.',
      summaryHi: rahuHouse === 12
        ? '12वें भाव में राहु विदेशी संबंध, यात्रा के अवसर और आध्यात्मिक विकास का सुझाव देता है — साथ ही सचेत व्यय प्रबंधन भी जरूरी है।'
        : 'विदेशी अवसर और व्यय आपकी कुंडली द्वारा आकारित हैं। सावधान योजना से अंतरराष्ट्रीय संबंध अर्थपूर्ण द्वार खोल सकते हैं।',
      goodPoints: [], goodPointsHi: [], challenges: [], challengesHi: [],
      adviceEn: 'Track expenses mindfully. Foreign travel and overseas opportunities benefit from planning during supportive dasha periods.',
      adviceHi: 'खर्च को सचेत रूप से ट्रैक करें। विदेश यात्रा और विदेशी अवसर सहायक दशा काल के दौरान योजना से लाभान्वित होते हैं।',
    },
  ];
}

/**
 * Main composer — bilingual, no DB calls.
 * @param {object} chart     - calculated chart data (from calculated_data)
 * @param {object} judgement - judgement engine output (profile.judgement)
 * @returns {{ summaryCards: object[], lifeAreaCards: object[] }}
 */
function composeKundliUserSummary(chart, judgement) {
  if (!chart) return { summaryCards: [], lifeAreaCards: [] };
  return {
    summaryCards:  _buildSummaryCards(chart, judgement),
    lifeAreaCards: _buildLifeAreaCards(chart, judgement),
  };
}

module.exports = { composeKundliUserSummary };
