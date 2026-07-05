'use strict';

const { DASHA_LORD_MEANINGS, PLANET_NAME_HI } = require('../helpers/prediction-data');

const SIGN_STYLE = {
  1:  { outerEn:'directly, with courage and quick action', outerHi:'सीधे, साहस और तेज निर्णय के साथ', innerEn:'feelings are easier to handle when you can act or move', innerHi:'जब आप कुछ कर पाते हैं या सक्रिय रहते हैं तब भावनाएं संभालना आसान होता है', strengthEn:'initiative and courage', strengthHi:'पहल और साहस', careEn:'slow down before reacting', careHi:'प्रतिक्रिया देने से पहले थोड़ा रुकें' },
  2:  { outerEn:'steadily, practically and with patience', outerHi:'स्थिरता, व्यवहारिकता और धैर्य के साथ', innerEn:'you have comfort, trust and a stable routine', innerHi:'आपको आराम, भरोसा और स्थिर दिनचर्या मिलती है', strengthEn:'patience and reliability', strengthHi:'धैर्य और विश्वसनीयता', careEn:'stay open when change is necessary', careHi:'जरूरी बदलाव के लिए खुले रहें' },
  3:  { outerEn:'with curiosity, flexibility and communication', outerHi:'जिज्ञासा, लचीलापन और संवाद के साथ', innerEn:'you can talk, write or think things through', innerHi:'आप बात करके, लिखकर या सोचकर मन की बात समझ पाते हैं', strengthEn:'quick learning and communication', strengthHi:'तेज सीख और संवाद', careEn:'finish one priority before chasing the next', careHi:'अगली चीज से पहले एक प्राथमिकता पूरी करें' },
  4:  { outerEn:'with care, intuition and strong protective instincts', outerHi:'देखभाल, सहज समझ और सुरक्षा की भावना के साथ', innerEn:'home and close relationships feel emotionally safe', innerHi:'घर और करीबी संबंध भावनात्मक सुरक्षा देते हैं', strengthEn:'empathy and intuition', strengthHi:'सहानुभूति और सहज ज्ञान', careEn:'protect your emotional boundaries', careHi:'अपनी भावनात्मक सीमाएं बनाए रखें' },
  5:  { outerEn:'warmly, confidently and with a wish to make an impact', outerHi:'गरमजोशी, आत्मविश्वास और प्रभाव बनाने की इच्छा के साथ', innerEn:'your effort and affection are noticed and appreciated', innerHi:'आपके प्रयास और स्नेह को देखा और सराहा जाता है', strengthEn:'leadership and creative confidence', strengthHi:'नेतृत्व और रचनात्मक आत्मविश्वास', careEn:'share attention and listen fully', careHi:'दूसरों को भी महत्व दें और ध्यान से सुनें' },
  6:  { outerEn:'carefully, helpfully and with attention to detail', outerHi:'सावधानी, सेवा और बारीकियों पर ध्यान के साथ', innerEn:'life feels organised and useful', innerHi:'जीवन व्यवस्थित और उपयोगी महसूस होता है', strengthEn:'analysis and practical problem-solving', strengthHi:'विश्लेषण और व्यवहारिक समाधान', careEn:'do not turn every imperfection into a problem', careHi:'हर कमी को समस्या न बनाएं' },
  7:  { outerEn:'diplomatically, fairly and through cooperation', outerHi:'कूटनीति, निष्पक्षता और सहयोग के साथ', innerEn:'relationships are calm, fair and respectful', innerHi:'रिश्ते शांत, निष्पक्ष और सम्मानपूर्ण रहते हैं', strengthEn:'balance and partnership', strengthHi:'संतुलन और साझेदारी', careEn:'make clear decisions instead of pleasing everyone', careHi:'सबको खुश करने के बजाय स्पष्ट निर्णय लें' },
  8:  { outerEn:'deeply, privately and with strong determination', outerHi:'गहराई, निजता और मजबूत संकल्प के साथ', innerEn:'trust is strong and feelings can be processed privately', innerHi:'भरोसा मजबूत हो और भावनाओं को निजी रूप से समझने का समय मिले', strengthEn:'focus and resilience', strengthHi:'एकाग्रता और कठिन समय से उबरने की क्षमता', careEn:'speak openly before suspicion grows', careHi:'संदेह बढ़ने से पहले खुलकर बात करें' },
  9:  { outerEn:'optimistically, independently and with a search for meaning', outerHi:'आशावाद, स्वतंत्रता और अर्थ की खोज के साथ', innerEn:'you are learning, exploring or moving toward a meaningful goal', innerHi:'आप सीख रहे हों, खोज रहे हों या किसी अर्थपूर्ण लक्ष्य की ओर बढ़ रहे हों', strengthEn:'vision and optimism', strengthHi:'दूरदृष्टि और आशावाद', careEn:'turn big ideas into a practical plan', careHi:'बड़े विचारों को व्यवहारिक योजना में बदलें' },
  10: { outerEn:'responsibly, patiently and with long-term planning', outerHi:'जिम्मेदारी, धैर्य और लंबी योजना के साथ', innerEn:'there is structure, progress and a clear plan', innerHi:'व्यवस्था, प्रगति और स्पष्ट योजना हो', strengthEn:'discipline and endurance', strengthHi:'अनुशासन और धैर्य', careEn:'leave room for rest and enjoyment', careHi:'आराम और आनंद के लिए भी जगह रखें' },
  11: { outerEn:'independently, thoughtfully and with original ideas', outerHi:'स्वतंत्र सोच, समझ और नए विचारों के साथ', innerEn:'you can contribute to a useful idea, group or cause', innerHi:'आप किसी उपयोगी विचार, समूह या उद्देश्य में योगदान दे पाते हैं', strengthEn:'original thinking and social awareness', strengthHi:'नवीन सोच और सामाजिक समझ', careEn:'stay emotionally present with the people close to you', careHi:'करीबी लोगों के साथ भावनात्मक रूप से उपस्थित रहें' },
  12: { outerEn:'gently, intuitively and with imagination', outerHi:'कोमलता, सहज समझ और कल्पना के साथ', innerEn:'you have quiet time, creativity and healthy emotional space', innerHi:'आपको शांत समय, रचनात्मकता और स्वस्थ भावनात्मक दूरी मिलती है', strengthEn:'compassion and imagination', strengthHi:'करुणा और कल्पना', careEn:'keep practical boundaries around your time and energy', careHi:'अपने समय और ऊर्जा की व्यवहारिक सीमाएं रखें' },
};

const PLANET_THEME = {
  Sun:     { en:'confidence, leadership and visibility', hi:'आत्मविश्वास, नेतृत्व और पहचान', focusEn:['Take responsible leadership', 'Be visible without forcing recognition', 'Protect your energy and confidence'], focusHi:['जिम्मेदारी के साथ नेतृत्व करें', 'मान्यता के लिए दबाव डाले बिना अपना काम दिखाएं', 'अपनी ऊर्जा और आत्मविश्वास की रक्षा करें'] },
  Moon:    { en:'emotions, home and personal security', hi:'भावनाएं, घर और व्यक्तिगत सुरक्षा', focusEn:['Keep a steady emotional routine', 'Stay connected with trusted people', 'Make space for rest and reflection'], focusHi:['भावनात्मक दिनचर्या स्थिर रखें', 'विश्वसनीय लोगों से जुड़े रहें', 'आराम और चिंतन के लिए समय रखें'] },
  Mars:    { en:'action, courage and competition', hi:'कर्म, साहस और प्रतिस्पर्धा', focusEn:['Use energy in a planned way', 'Act firmly without becoming reactive', 'Choose constructive challenges'], focusHi:['ऊर्जा का योजनाबद्ध उपयोग करें', 'उत्तेजित हुए बिना दृढ़ता से काम करें', 'रचनात्मक चुनौतियां चुनें'] },
  Mercury: { en:'learning, communication and business decisions', hi:'सीख, संवाद और व्यापारिक निर्णय', focusEn:['Communicate clearly', 'Check details before deciding', 'Use writing, learning and networking'], focusHi:['स्पष्ट संवाद करें', 'निर्णय से पहले विवरण जांचें', 'लेखन, सीख और संपर्कों का उपयोग करें'] },
  Jupiter: { en:'growth, knowledge and wise expansion', hi:'विकास, ज्ञान और समझदारी से विस्तार', focusEn:['Learn from capable mentors', 'Choose growth that is sustainable', 'Share knowledge generously'], focusHi:['योग्य मार्गदर्शकों से सीखें', 'स्थायी विकास चुनें', 'ज्ञान उदारता से साझा करें'] },
  Venus:   { en:'relationships, comfort and creativity', hi:'रिश्ते, सुख और रचनात्मकता', focusEn:['Invest in respectful relationships', 'Create balance between pleasure and responsibility', 'Use creativity productively'], focusHi:['सम्मानपूर्ण रिश्तों में निवेश करें', 'सुख और जिम्मेदारी में संतुलन रखें', 'रचनात्मकता का उपयोग करें'] },
  Saturn:  { en:'responsibility, discipline and long-term results', hi:'जिम्मेदारी, अनुशासन और दीर्घकालीन परिणाम', focusEn:['Build through a steady routine', 'Finish delayed responsibilities', 'Choose lasting progress over quick rewards'], focusHi:['स्थिर दिनचर्या से निर्माण करें', 'लंबित जिम्मेदारियां पूरी करें', 'जल्दी लाभ के बजाय स्थायी प्रगति चुनें'] },
  Rahu:    { en:'ambition, change and unfamiliar opportunities', hi:'महत्वाकांक्षा, बदलाव और नए अवसर', focusEn:['Explore without rushing', 'Verify exciting opportunities carefully', 'Stay grounded while trying something new'], focusHi:['जल्दबाजी के बिना खोज करें', 'आकर्षक अवसरों को ध्यान से जांचें', 'नया करते समय जमीन से जुड़े रहें'] },
  Ketu:    { en:'reflection, release and inner clarity', hi:'चिंतन, छोड़ना और आंतरिक स्पष्टता', focusEn:['Reduce unnecessary distractions', 'Complete unfinished inner work', 'Use quiet time for clear decisions'], focusHi:['अनावश्यक भटकाव कम करें', 'अधूरा आंतरिक काम पूरा करें', 'स्पष्ट निर्णय के लिए शांत समय लें'] },
};

const AREA_META = {
  career:        { titleEn:'Work & Career', titleHi:'काम और करियर', actionEn:{ supported:'Use this momentum to take one clear career step.', balanced:'Choose steady progress over sudden job changes.', care:'Avoid rushed career decisions; strengthen skills and planning first.' }, actionHi:{ supported:'इस गति का उपयोग करियर में एक स्पष्ट कदम के लिए करें।', balanced:'अचानक नौकरी बदलने के बजाय स्थिर प्रगति चुनें।', care:'जल्दबाजी में करियर निर्णय न लें; पहले कौशल और योजना मजबूत करें।' } },
  relationships: { titleEn:'Love & Relationships', titleHi:'प्रेम और रिश्ते', actionEn:{ supported:'Make time for honest conversation and shared plans.', balanced:'Keep expectations clear and listen before reacting.', care:'Slow down serious decisions and resolve misunderstandings calmly.' }, actionHi:{ supported:'ईमानदार संवाद और साझा योजना के लिए समय दें।', balanced:'अपेक्षाएं स्पष्ट रखें और प्रतिक्रिया से पहले सुनें।', care:'गंभीर निर्णय धीरे लें और गलतफहमियां शांति से सुलझाएं।' } },
  health:        { titleEn:'Health & Energy', titleHi:'स्वास्थ्य और ऊर्जा', actionEn:{ supported:'Protect the routines that keep your energy stable.', balanced:'Sleep, movement and regular meals matter more than quick fixes.', care:'Reduce strain and seek qualified medical advice for persistent symptoms.' }, actionHi:{ supported:'ऊर्जा स्थिर रखने वाली दिनचर्या बनाए रखें।', balanced:'त्वरित उपायों से अधिक नींद, व्यायाम और नियमित भोजन पर ध्यान दें।', care:'तनाव कम करें और लगातार लक्षणों के लिए योग्य चिकित्सक की सलाह लें।' } },
  finance:       { titleEn:'Money & Planning', titleHi:'धन और योजना', actionEn:{ supported:'Use the supportive period for planned saving and sensible growth.', balanced:'Keep spending measured and review important financial decisions.', care:'Avoid speculation, large impulsive purchases and unclear commitments.' }, actionHi:{ supported:'इस सहायक समय में योजनाबद्ध बचत और समझदार वृद्धि करें।', balanced:'खर्च नियंत्रित रखें और महत्वपूर्ण धन निर्णय जांचें।', care:'सट्टे, बड़े आवेगी खर्च और अस्पष्ट आर्थिक वादों से बचें।' } },
  spirituality:  { titleEn:'Inner Growth', titleHi:'आंतरिक विकास', actionEn:{ supported:'Continue the practice that gives you calm and clarity.', balanced:'A short, regular practice will help more than occasional intensity.', care:'Keep spiritual practice simple, grounded and consistent.' }, actionHi:{ supported:'जो साधना शांति और स्पष्टता देती है उसे जारी रखें।', balanced:'कभी-कभी तीव्र साधना से अधिक छोटी नियमित साधना सहायक होगी।', care:'आध्यात्मिक अभ्यास सरल, व्यवहारिक और नियमित रखें।' } },
};

const STATUS = {
  supported: { labelEn:'Supportive', labelHi:'सहायक' },
  balanced:  { labelEn:'Steady with effort', labelHi:'प्रयास से स्थिर' },
  care:      { labelEn:'Needs extra care', labelHi:'अतिरिक्त ध्यान चाहिए' },
};

const FORBIDDEN_USER_TERMS = /\b(?:mahadasha|antardasha|sade sati|mangal dosha|gochar|dusthana|trik sthan|paap kartari|debilitat(?:ed|ion)?|combust(?:ion)?|affliction|karmic|moksha)\b/gi;

function activePeriods(chart) {
  const main = Array.isArray(chart?.dasha) ? chart.dasha.find((item) => item.is_current) || chart.dasha[0] : null;
  const supporting = main?.antardasha?.find((item) => item.is_current) || main?.antardasha?.[0] || null;
  return { main, supporting };
}

function sentenceSummary(text, count = 2) {
  if (!text || typeof text !== 'string') return '';
  const cleaned = text
    .replace(FORBIDDEN_USER_TERMS, '')
    .replace(/\s+([,.;:।])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const sentences = cleaned.match(/[^.!?।]+[.!?।]?/g) || [cleaned];
  return sentences.map((item) => item.trim()).filter(Boolean).slice(0, count).join(' ');
}

function statusFromOutlook(outlook) {
  if (['positive', 'supported', 'deeply active'].includes(outlook)) return 'supported';
  if (['challenging', 'needs attention'].includes(outlook)) return 'care';
  return 'balanced';
}

function signStyle(num) {
  return SIGN_STYLE[num] || SIGN_STYLE[1];
}

function planetTheme(name) {
  return PLANET_THEME[name] || PLANET_THEME.Sun;
}

function composeOverview(chart) {
  const asc = signStyle(chart?.ascendant?.rashi_num);
  const moon = signStyle(chart?.planets?.Moon?.rashi_num);
  const ascNameEn = chart?.ascendant?.rashi_en || 'your rising sign';
  const ascNameHi = chart?.ascendant?.rashi_hi || ascNameEn;
  const moonNameEn = chart?.planets?.Moon?.rashi_en || 'your Moon sign';
  const moonNameHi = chart?.planets?.Moon?.rashi_hi || moonNameEn;
  const nakEn = chart?.nakshatra?.en || 'your birth star';
  const nakHi = chart?.nakshatra?.hi || nakEn;

  return {
    chartLineEn:`Outer style: ${ascNameEn} · Emotional style: ${moonNameEn} · Birth star: ${nakEn}`,
    chartLineHi:`बाहरी स्वभाव: ${ascNameHi} · भावनात्मक स्वभाव: ${moonNameHi} · जन्म नक्षत्र: ${nakHi}`,
    summaryEn:`You usually approach life ${asc.outerEn}. Emotionally, you feel safest when ${moon.innerEn}.`,
    summaryHi:`आप जीवन का सामना आमतौर पर ${asc.outerHi} करते हैं। भावनात्मक रूप से तब सबसे सुरक्षित महसूस करते हैं जब ${moon.innerHi}।`,
    strengthsEn:[asc.strengthEn, moon.strengthEn],
    strengthsHi:[asc.strengthHi, moon.strengthHi],
    careEn:[asc.careEn, moon.careEn],
    careHi:[asc.careHi, moon.careHi],
  };
}

function composeCurrentPhase(chart) {
  const { main, supporting } = activePeriods(chart);
  const mainPlanet = main?.lord || 'Sun';
  const supportingPlanet = supporting?.lord || mainPlanet;
  const mainTheme = planetTheme(mainPlanet);
  const supportTheme = planetTheme(supportingPlanet);
  const mainHi = PLANET_NAME_HI[mainPlanet] || mainPlanet;
  const supportHi = PLANET_NAME_HI[supportingPlanet] || supportingPlanet;

  return {
    mainPlanet,
    supportingPlanet,
    mainEnd: main?.end?.slice?.(0, 10) || null,
    supportingEnd: supporting?.end?.slice?.(0, 10) || null,
    headlineEn:`Your current life chapter is about ${mainTheme.en}.`,
    headlineHi:`आपके जीवन का वर्तमान अध्याय ${mainTheme.hi} से जुड़ा है।`,
    summaryEn:`${mainPlanet} sets the bigger direction, while ${supportingPlanet} shapes day-to-day choices through ${supportTheme.en}. Use this period to make steady, well-considered progress.`,
    summaryHi:`${mainHi} जीवन की बड़ी दिशा देता है, जबकि ${supportHi} रोजमर्रा के निर्णयों में ${supportTheme.hi} का प्रभाव जोड़ता है। इस समय का उपयोग स्थिर और सोच-समझकर प्रगति के लिए करें।`,
    focusEn:mainTheme.focusEn,
    focusHi:mainTheme.focusHi,
  };
}

function composeLifeAreas(chart, rawPredictions) {
  const { main } = activePeriods(chart);
  const dashaMeaning = DASHA_LORD_MEANINGS[main?.lord] || DASHA_LORD_MEANINGS.Sun;
  const rawAreas = rawPredictions?.life_areas || {};

  return Object.entries(AREA_META).map(([key, meta]) => {
    const raw = rawAreas[key] || {};
    const statusKey = statusFromOutlook(raw.outlook);
    const englishSource = dashaMeaning?.[`${key}_en`] || raw.description_en;
    const hindiSource = dashaMeaning?.[`${key}_hi`];
    return {
      key,
      titleEn:meta.titleEn,
      titleHi:meta.titleHi,
      statusKey,
      labelEn:STATUS[statusKey].labelEn,
      labelHi:STATUS[statusKey].labelHi,
      summaryEn:sentenceSummary(englishSource) || `${meta.titleEn} can improve through steady, practical effort.`,
      summaryHi:sentenceSummary(hindiSource) || `${meta.titleHi} में स्थिर और व्यवहारिक प्रयास से सुधार संभव है।`,
      adviceEn:meta.actionEn[statusKey],
      adviceHi:meta.actionHi[statusKey],
    };
  });
}

function composeOpportunities(chart) {
  const { main } = activePeriods(chart);
  const meaning = DASHA_LORD_MEANINGS[main?.lord] || DASHA_LORD_MEANINGS.Sun;
  const items = (meaning.opportunities || []).slice(0, 3).map((en, index) => ({
    en,
    hi:meaning.opportunities_hi?.[index] || en,
  }));
  if (chart?.gochar?.highlights?.jupiter_support?.favorable) {
    items.push({
      en:'Learning, guidance and well-planned growth receive extra support.',
      hi:'सीख, मार्गदर्शन और योजनाबद्ध विकास को अतिरिक्त समर्थन मिलता है।',
    });
  }
  return items.slice(0, 4);
}

function composeCautions(chart) {
  const { main } = activePeriods(chart);
  const meaning = DASHA_LORD_MEANINGS[main?.lord] || DASHA_LORD_MEANINGS.Sun;
  const items = (meaning.cautions || []).slice(0, 2).map((en, index) => ({
    en,
    hi:meaning.cautions_hi?.[index] || 'इस क्षेत्र में अतिरिक्त सावधानी रखें।',
  }));
  if (chart?.gochar?.highlights?.sade_sati?.active) {
    items.push({ en:'Keep routines stable and avoid rushing major decisions.', hi:'दिनचर्या स्थिर रखें और बड़े निर्णयों में जल्दबाजी न करें।' });
  }
  if (chart?.mangal_dosha?.has_dosha) {
    items.push({ en:'Take extra time with serious relationship or property decisions.', hi:'गंभीर संबंध या संपत्ति निर्णयों में अतिरिक्त समय लें।' });
  }
  return items.slice(0, 4);
}

function composeTransits(chart) {
  const sade = chart?.gochar?.highlights?.sade_sati;
  const jupiter = chart?.gochar?.highlights?.jupiter_support;
  return {
    headlineEn:sade?.active
      ? 'This phase rewards patience, structure and realistic planning.'
      : jupiter?.favorable
        ? 'This phase supports learning, guidance and steady expansion.'
        : 'This phase is manageable when you stay consistent and practical.',
    headlineHi:sade?.active
      ? 'यह समय धैर्य, व्यवस्था और व्यवहारिक योजना को महत्व देता है।'
      : jupiter?.favorable
        ? 'यह समय सीख, मार्गदर्शन और स्थिर विस्तार का समर्थन करता है।'
        : 'नियमित और व्यवहारिक रहने पर यह समय संभालने योग्य है।',
    items:[
      {
        key:'saturn', titleEn:'Responsibility & patience', titleHi:'जिम्मेदारी और धैर्य',
        summaryEn:sade?.active ? 'Responsibilities may feel heavier than usual. A simple routine and patient decisions will protect your progress.' : 'There is no extra Saturn pressure from this cycle. Continue building through a steady routine.',
        summaryHi:sade?.active ? 'जिम्मेदारियां सामान्य से भारी लग सकती हैं। सरल दिनचर्या और धैर्यपूर्ण निर्णय आपकी प्रगति बचाएंगे।' : 'इस चक्र से शनि का अतिरिक्त दबाव नहीं है। स्थिर दिनचर्या से निर्माण जारी रखें।',
      },
      {
        key:'jupiter', titleEn:'Learning & growth', titleHi:'सीख और विकास',
        summaryEn:jupiter?.favorable ? 'Guidance, education and sensible growth have helpful momentum. Use it with a clear plan.' : 'Growth is still possible, but quality and patience matter more than speed.',
        summaryHi:jupiter?.favorable ? 'मार्गदर्शन, शिक्षा और समझदार विकास को सहायक गति मिलती है। स्पष्ट योजना से इसका उपयोग करें।' : 'विकास संभव है, लेकिन गति से अधिक गुणवत्ता और धैर्य महत्वपूर्ण हैं।',
      },
      {
        key:'change', titleEn:'Change & release', titleHi:'बदलाव और छोड़ना',
        summaryEn:'You may feel drawn toward something new while losing interest in an old pattern. Explore carefully and avoid impulsive commitments.',
        summaryHi:'आप किसी नई चीज की ओर खिंच सकते हैं और पुराने ढर्रे से रुचि कम हो सकती है। सावधानी से खोज करें और आवेगी वादों से बचें।',
      },
    ],
  };
}

function composePredictionUserFriendly(chart, rawPredictions = chart?.predictions) {
  if (!chart) return null;
  return {
    version:'prediction-friendly-v1',
    overview:composeOverview(chart),
    currentPhase:composeCurrentPhase(chart),
    lifeAreas:composeLifeAreas(chart, rawPredictions),
    opportunities:composeOpportunities(chart),
    cautions:composeCautions(chart),
    transits:composeTransits(chart),
    technicalDetails:rawPredictions || null,
  };
}

module.exports = {
  composePredictionUserFriendly,
  sentenceSummary,
  statusFromOutlook,
};
