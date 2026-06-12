'use strict';
// Part 2 of the "Cosmic Code" feature set:
//  5. Yuti (conjunction) pair narratives
//  6. Per-Antardasha narratives for every Mahadasha
//  7. Sacred remedy suite — Rudraksha / Yantra / Daan
//  8. Marriage timing windows (dasha-based)

const { NATURAL_FRIENDS } = require('./vedic-data');
const { HOUSE_THEME, P_HI } = require('./cosmic-insights');

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// ── 5. Yuti (Conjunction) analysis ────────────────────────────────────────────
const YUTI_ENERGY = {
  Sun:     { en:'authority and self-expression',      hi:'अधिकार और आत्म-अभिव्यक्ति' },
  Moon:    { en:'emotions and intuition',             hi:'भावनाएं और अंतर्ज्ञान' },
  Mars:    { en:'drive and aggression',               hi:'ऊर्जा और आक्रामकता' },
  Mercury: { en:'intellect and communication',        hi:'बुद्धि और संवाद' },
  Jupiter: { en:'wisdom and expansion',               hi:'ज्ञान और विस्तार' },
  Venus:   { en:'love and refinement',                hi:'प्रेम और सौंदर्यबोध' },
  Saturn:  { en:'discipline and karma',               hi:'अनुशासन और कर्म' },
  Rahu:    { en:'obsession and amplification',        hi:'जुनून और प्रवर्धन' },
  Ketu:    { en:'detachment and insight',             hi:'वैराग्य और अंतर्दृष्टि' },
};

// Canonical key = names joined in GRAHAS order
const YUTI_SPECIAL = {
  'Sun-Mercury':   { name:'Budhaditya Yoga', en:'Your intellect and identity work as one — sharp analysis, articulate speech and recognition through knowledge. Guard against mental restlessness when ego and logic argue.', hi:'आपकी बुद्धि और पहचान एक होकर काम करती हैं — तीक्ष्ण विश्लेषण, प्रभावी वाणी और ज्ञान से मिली पहचान। जब अहं और तर्क टकराएं तो मानसिक बेचैनी से बचें।' },
  'Sun-Moon':      { name:'Amavasya Yuti', en:'Mind and soul share one sign — intense focus but emotional self-reliance is tested. Build outlets to express feelings instead of absorbing them.', hi:'मन और आत्मा एक राशि में — गहरा फोकस, पर भावनात्मक आत्मनिर्भरता की परीक्षा होती है। भावनाओं को दबाने की बजाय व्यक्त करने के रास्ते बनाएं।' },
  'Sun-Saturn':    { name:'Pitru Chhaya', en:'Father-son energies face each other — authority comes only after struggle and proving yourself. Late but solid rise; respect hierarchy without losing self-worth.', hi:'पिता-पुत्र ऊर्जाएं आमने-सामने — अधिकार संघर्ष और स्वयं को सिद्ध करने के बाद मिलता है। देर से पर ठोस उत्थान; आत्मसम्मान खोए बिना व्यवस्था का सम्मान करें।' },
  'Moon-Mars':     { name:'Chandra-Mangal Yoga', en:'Emotional courage and earning power combine — strong wealth-generating instinct and protective nature, but quick emotional flare-ups need cooling routines.', hi:'भावनात्मक साहस और अर्जन शक्ति मिलती है — धन कमाने की प्रबल वृत्ति और रक्षक स्वभाव, पर भावनाओं के तीव्र उबाल को शांत रखने के अभ्यास जरूरी हैं।' },
  'Moon-Saturn':   { name:'Vish Yoga', en:'Feelings meet duty — seriousness, depth and reliability, but tendency toward melancholy or emotional suppression. Routine, sunlight and seva keep the mind light.', hi:'भावना और कर्तव्य का मिलन — गंभीरता, गहराई और विश्वसनीयता, पर उदासी या भावना-दमन की प्रवृत्ति। दिनचर्या, धूप और सेवा मन को हल्का रखते हैं।' },
  'Moon-Rahu':     { name:'Grahan Yoga (Moon)', en:'The mind is amplified and shadowed at once — vivid imagination and mass appeal, but anxiety and overthinking cycles. Meditation and grounding are non-negotiable.', hi:'मन एक साथ प्रवर्धित और छायाग्रस्त — तीव्र कल्पना और जन-आकर्षण, पर चिंता और अति-विचार के चक्र। ध्यान और ग्राउंडिंग अनिवार्य हैं।' },
  'Sun-Rahu':      { name:'Grahan Yoga (Sun)', en:'Identity hungers for extraordinary recognition — unconventional rise is possible, but ego illusions and authority clashes must be watched.', hi:'पहचान असाधारण मान्यता चाहती है — अपरंपरागत उत्थान संभव, पर अहं के भ्रम और सत्ता-टकराव पर नज़र रखें।' },
  'Mars-Saturn':   { name:'Agni-Vayu Friction', en:'Accelerator and brake pressed together — enormous capacity for disciplined hard work once channelled, but frustration and stop-start efforts when not. Physical exercise is the release valve.', hi:'एक्सीलेटर और ब्रेक साथ दबे हैं — दिशा मिलने पर अनुशासित कठोर परिश्रम की विशाल क्षमता, वरना झुंझलाहट और रुक-रुक कर प्रयास। शारीरिक व्यायाम ही निकास है।' },
  'Jupiter-Rahu':  { name:'Guru-Chandal Yoga', en:'Wisdom and ambition mix unconventionally — brilliant unorthodox thinking, but ethics and gurus must be respected or judgment clouds.', hi:'ज्ञान और महत्वाकांक्षा का अपरंपरागत मेल — शानदार मौलिक सोच, पर नैतिकता और गुरुओं का सम्मान न होने पर निर्णय धुंधला जाता है।' },
  'Moon-Jupiter':  { name:'Gajakesari Yuti', en:'Mind blessed by wisdom — optimism, public respect and protective grace. Generosity multiplies your fortune.', hi:'मन को ज्ञान का आशीर्वाद — आशावाद, जन-सम्मान और रक्षक कृपा। उदारता आपका भाग्य कई गुना करती है।' },
  'Venus-Saturn':  { name:'Shukra-Shani Yuti', en:'Love matures slowly — relationships and luxuries come through patience and commitment, not impulse. Loyalty once given is unshakeable.', hi:'प्रेम धीरे परिपक्व होता है — रिश्ते और सुख धैर्य व प्रतिबद्धता से मिलते हैं, आवेग से नहीं। एक बार दी गई निष्ठा अटूट होती है।' },
  'Venus-Mars':    { name:'Shukra-Mangal Yuti', en:'Passion and charm together — magnetic attraction and creative drive, but impulsiveness in love needs maturity.', hi:'जुनून और आकर्षण साथ — चुंबकीय आकर्षण और रचनात्मक ऊर्जा, पर प्रेम में आवेग को परिपक्वता चाहिए।' },
  'Mercury-Rahu':  { name:'Budh-Rahu Yuti', en:'Amplified cleverness — genius for technology, trade and strategy, but rumours and miscommunication can trap; verify before you speak.', hi:'प्रवर्धित चतुराई — तकनीक, व्यापार और रणनीति की प्रतिभा, पर अफवाहें और गलत संवाद फंसा सकते हैं; बोलने से पहले परखें।' },
};

function computeYutiAnalysis(chart) {
  const ascR = chart?.ascendant?.rashi_num;
  if (!ascR || !chart.planets) return [];
  const bySign = {};
  GRAHAS.forEach((n) => {
    const p = chart.planets[n];
    if (p?.rashi_num) (bySign[p.rashi_num] = bySign[p.rashi_num] || []).push(n);
  });

  const result = [];
  Object.entries(bySign).forEach(([rashi, names]) => {
    if (names.length < 2) return;
    const house = ((+rashi - ascR + 12) % 12) + 1;
    const sample = chart.planets[names[0]];
    // pairwise narratives within the group
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const [a, b] = [names[i], names[j]];
        const key = `${a}-${b}`;
        const sp = YUTI_SPECIAL[key];
        const ht = HOUSE_THEME[house];
        const narrative_en = sp
          ? `${sp.en} Placed in your ${house}th house, this plays out through ${ht.en}.`
          : `When ${a} (${YUTI_ENERGY[a].en}) joins ${b} (${YUTI_ENERGY[b].en}) in your ${house}th house, these energies blend and color ${ht.en}. The stronger planet of the two sets the tone — read it with their dignities.`;
        const narrative_hi = sp
          ? `${sp.hi} यह युति आपके ${house}वें भाव में है, इसलिए इसका फल ${ht.hi} के माध्यम से मिलता है।`
          : `जब ${P_HI[a]} (${YUTI_ENERGY[a].hi}) और ${P_HI[b]} (${YUTI_ENERGY[b].hi}) आपके ${house}वें भाव में मिलते हैं, तो ये ऊर्जाएं ${ht.hi} को रंग देती हैं। दोनों में बलवान ग्रह सुर तय करता है।`;
        result.push({
          planets: [a, b],
          planets_hi: [P_HI[a], P_HI[b]],
          yoga_name: sp?.name || null,
          house,
          rashi_en: sample.rashi_en,
          rashi_hi: sample.rashi_hi,
          degrees: [chart.planets[a].degree_in_sign?.toFixed(1), chart.planets[b].degree_in_sign?.toFixed(1)],
          narrative_en, narrative_hi,
        });
      }
    }
  });
  return result;
}

// ── 6. Per-Antardasha narratives ──────────────────────────────────────────────
const ANTAR_EFFECT = {
  Sun:     { en:'brings focus on recognition, authority, government work and father — visibility rises, ego needs watching',
             hi:'पहचान, अधिकार, सरकारी कार्य और पिता पर ध्यान लाती है — दृश्यता बढ़ती है, अहं पर नज़र रखें' },
  Moon:    { en:'softens the period toward family, mind and home — emotional decisions dominate, rest matters',
             hi:'अवधि को परिवार, मन और घर की ओर मोड़ती है — भावनात्मक निर्णय हावी रहते हैं, विश्राम जरूरी है' },
  Mars:    { en:'injects action, property matters and competition — quick wins possible, conflicts and haste are the risk',
             hi:'एक्शन, संपत्ति के मामले और प्रतिस्पर्धा लाती है — त्वरित जीत संभव, टकराव और जल्दबाजी जोखिम हैं' },
  Mercury: { en:'activates business, study, writing and networking — communication opens doors, scattered focus closes them',
             hi:'व्यापार, अध्ययन, लेखन और नेटवर्किंग सक्रिय करती है — संवाद द्वार खोलता है, बिखरा ध्यान बंद करता है' },
  Jupiter: { en:'expands finances, learning, children and faith — guidance arrives, generosity multiplies the gains',
             hi:'धन, शिक्षा, संतान और श्रद्धा का विस्तार करती है — मार्गदर्शन मिलता है, उदारता लाभ बढ़ाती है' },
  Venus:   { en:'sweetens relationships, comforts, vehicles and arts — enjoyment peaks, overindulgence dilutes it',
             hi:'रिश्तों, सुख-सुविधाओं, वाहनों और कला में मिठास लाती है — आनंद चरम पर, अति उसे घटा देती है' },
  Saturn:  { en:'slows things to test patience — responsibilities pile up, but disciplined effort builds permanent assets',
             hi:'धैर्य परखने के लिए गति धीमी करती है — जिम्मेदारियां बढ़ती हैं, पर अनुशासित प्रयास स्थायी संपत्ति बनाता है' },
  Rahu:    { en:'amplifies ambition, foreign links and technology — sudden opportunities, but verify everything twice',
             hi:'महत्वाकांक्षा, विदेशी संबंध और तकनीक को बढ़ाती है — अचानक अवसर, पर हर चीज़ दो बार परखें' },
  Ketu:    { en:'detaches and redirects inward — spiritual growth and research deepen, material matters feel distant',
             hi:'विरक्त कर भीतर की ओर मोड़ती है — आध्यात्मिक विकास और शोध गहराते हैं, भौतिक मामले दूर लगते हैं' },
};

const REL_LINE = {
  friend:  { en:'The two lords are natural friends, so this sub-period flows smoothly and supports the mahadasha agenda.',
             hi:'दोनों स्वामी नैसर्गिक मित्र हैं, इसलिए यह अवधि सहज बहती है और महादशा के लक्ष्य का समर्थन करती है।' },
  enemy:   { en:'The two lords are natural enemies, so expect friction — progress comes through adjustment and patience.',
             hi:'दोनों स्वामी नैसर्गिक शत्रु हैं, इसलिए घर्षण रहेगा — प्रगति समायोजन और धैर्य से मिलती है।' },
  neutral: { en:'The two lords are neutral to each other — results follow your own effort and the houses they rule.',
             hi:'दोनों स्वामी परस्पर सम हैं — फल आपके प्रयास और उनके भावों के अनुसार मिलता है।' },
};

function _relation(mahaLord, antarLord) {
  if (mahaLord === antarLord) return 'friend';
  const nf = NATURAL_FRIENDS[mahaLord];
  if (nf?.friends?.includes(antarLord)) return 'friend';
  if (nf?.enemies?.includes(antarLord)) return 'enemy';
  return 'neutral';
}

function computeAntardashaNarratives(chart) {
  if (!Array.isArray(chart?.dasha)) return null;
  const ascR = chart.ascendant?.rashi_num || 1;
  const out = {};
  chart.dasha.forEach((maha) => {
    out[maha.lord] = (maha.antardasha || []).map((ad) => {
      const eff = ANTAR_EFFECT[ad.lord] || {};
      const rel = REL_LINE[_relation(maha.lord, ad.lord)];
      const p = chart.planets?.[ad.lord];
      const house = p?.rashi_num ? ((p.rashi_num - ascR + 12) % 12) + 1 : null;
      const ht = house ? HOUSE_THEME[house] : null;
      return {
        lord: ad.lord, lord_hi: P_HI[ad.lord],
        start: String(ad.start).slice(0, 10), end: String(ad.end).slice(0, 10),
        is_current: !!ad.is_current,
        narrative_en: `${maha.lord}-${ad.lord}: This sub-period ${eff.en}. ${rel.en}${ht ? ` With ${ad.lord} in your ${house}th house, ${ht.en} get specially activated.` : ''}`,
        narrative_hi: `${P_HI[maha.lord]}-${P_HI[ad.lord]}: यह अंतर्दशा ${eff.hi}। ${rel.hi}${ht ? ` ${P_HI[ad.lord]} आपके ${house}वें भाव में है, इसलिए ${ht.hi} विशेष सक्रिय रहते हैं।` : ''}`,
      };
    });
  });
  return out;
}

// ── 7. Sacred remedy suite: Rudraksha / Yantra / Daan ─────────────────────────
const RUDRAKSHA = {
  Sun:     { mukhi:'1 Mukhi / 12 Mukhi', en:'strengthens confidence, leadership and bond with father; relieves heart and eye troubles', hi:'आत्मविश्वास, नेतृत्व और पिता से संबंध मजबूत करता है; हृदय व नेत्र कष्ट घटाता है' },
  Moon:    { mukhi:'2 Mukhi',  en:'calms the mind, heals relationships and emotional swings; improves sleep', hi:'मन शांत करता है, रिश्ते और भावनात्मक उतार-चढ़ाव संतुलित करता है; नींद सुधारता है' },
  Mars:    { mukhi:'3 Mukhi',  en:'burns past karma, controls anger and gives courage in disputes', hi:'पूर्व कर्म शुद्ध करता है, क्रोध नियंत्रित करता है और विवादों में साहस देता है' },
  Mercury: { mukhi:'4 Mukhi',  en:'sharpens intellect, speech and learning power', hi:'बुद्धि, वाणी और अध्ययन शक्ति तीव्र करता है' },
  Jupiter: { mukhi:'5 Mukhi',  en:'the universal bead — wisdom, health and peace; safe for everyone', hi:'सर्वसुलभ मनका — ज्ञान, स्वास्थ्य और शांति; सभी के लिए सुरक्षित' },
  Venus:   { mukhi:'6 Mukhi',  en:'enhances charm, creativity, vehicles and marital harmony', hi:'आकर्षण, रचनात्मकता, वाहन सुख और वैवाहिक सामंजस्य बढ़ाता है' },
  Saturn:  { mukhi:'7 Mukhi / 14 Mukhi', en:'eases Saturn\'s pressure — steady finances, protection from misfortune', hi:'शनि का दबाव कम करता है — स्थिर धन, दुर्भाग्य से रक्षा' },
  Rahu:    { mukhi:'8 Mukhi',  en:'removes obstacles and Rahu\'s illusions; steadies sudden ups and downs', hi:'बाधाएं और राहु के भ्रम दूर करता है; अचानक उतार-चढ़ाव स्थिर करता है' },
  Ketu:    { mukhi:'9 Mukhi',  en:'grants fearlessness and spiritual energy; pacifies Ketu', hi:'निर्भयता और आध्यात्मिक ऊर्जा देता है; केतु शांत करता है' },
};
const YANTRA = {
  Sun:     { name:'Surya Yantra',    en:'for authority, vitality and government favour', hi:'अधिकार, ओज और राजकीय कृपा के लिए' },
  Moon:    { name:'Chandra Yantra',  en:'for mental peace and emotional stability',      hi:'मानसिक शांति और भावनात्मक स्थिरता के लिए' },
  Mars:    { name:'Mangal Yantra',   en:'for courage, property and protection from disputes', hi:'साहस, संपत्ति और विवादों से रक्षा के लिए' },
  Mercury: { name:'Budh Yantra',     en:'for business growth, speech and intellect',     hi:'व्यापार वृद्धि, वाणी और बुद्धि के लिए' },
  Jupiter: { name:'Guru Yantra',     en:'for wisdom, wealth, children and dharma',       hi:'ज्ञान, धन, संतान और धर्म के लिए' },
  Venus:   { name:'Shukra Yantra / Shri Yantra', en:'for love, luxury, arts and prosperity', hi:'प्रेम, वैभव, कला और समृद्धि के लिए' },
  Saturn:  { name:'Shani Yantra',    en:'for relief from Saturn periods and steady karma', hi:'शनि की दशाओं में राहत और स्थिर कर्म के लिए' },
  Rahu:    { name:'Rahu Yantra',     en:'for protection from illusion, addiction and hidden enemies', hi:'भ्रम, व्यसन और गुप्त शत्रुओं से रक्षा के लिए' },
  Ketu:    { name:'Ketu Yantra',     en:'for spiritual focus and freedom from confusion', hi:'आध्यात्मिक एकाग्रता और उलझन से मुक्ति के लिए' },
};
const DAAN = {
  Sun:     { day:'Sunday',    day_hi:'रविवार',  en:'wheat, jaggery, copper, red cloth',            hi:'गेहूं, गुड़, तांबा, लाल वस्त्र' },
  Moon:    { day:'Monday',    day_hi:'सोमवार',  en:'milk, rice, white cloth, silver',              hi:'दूध, चावल, सफेद वस्त्र, चांदी' },
  Mars:    { day:'Tuesday',   day_hi:'मंगलवार', en:'red lentils (masoor), red cloth, sweets to brothers/soldiers', hi:'मसूर दाल, लाल वस्त्र, भाइयों/सैनिकों को मिठाई' },
  Mercury: { day:'Wednesday', day_hi:'बुधवार',  en:'green moong, green vegetables, books to students', hi:'हरा मूंग, हरी सब्जियां, विद्यार्थियों को पुस्तकें' },
  Jupiter: { day:'Thursday',  day_hi:'गुरुवार', en:'chana dal, yellow cloth, turmeric, books to teachers', hi:'चना दाल, पीला वस्त्र, हल्दी, गुरुओं को पुस्तकें' },
  Venus:   { day:'Friday',    day_hi:'शुक्रवार', en:'curd, white sweets, clothes to young women',  hi:'दही, सफेद मिठाई, कन्याओं को वस्त्र' },
  Saturn:  { day:'Saturday',  day_hi:'शनिवार',  en:'black sesame, mustard oil, iron, blankets to the needy', hi:'काले तिल, सरसों का तेल, लोहा, जरूरतमंदों को कंबल' },
  Rahu:    { day:'Saturday',  day_hi:'शनिवार',  en:'coal, blue/black blankets, feeding sweepers',  hi:'कोयला, नीले/काले कंबल, सफाईकर्मियों को भोजन' },
  Ketu:    { day:'Thursday',  day_hi:'गुरुवार', en:'multi-coloured blanket, feeding dogs, sesame', hi:'बहुरंगी कंबल, कुत्तों को भोजन, तिल' },
};

const DIGNITY_RANK = { exalted:6, moolatrikona:5, own:4, friend:3, neutral:2, enemy:1, debilitated:0 };
function _dignityRank(p) {
  const d = String(p?.dignity || '').toLowerCase();
  for (const k of Object.keys(DIGNITY_RANK)) if (d.includes(k.slice(0, 5))) return DIGNITY_RANK[k];
  return 2;
}

function computeRemedySuite(chart) {
  if (!chart?.planets) return null;
  const maha = Array.isArray(chart.dasha) ? chart.dasha.find((d) => d.is_current) || chart.dasha[0] : null;
  // weakest graha by dignity (prefer real grahas with data)
  let weakest = null, minRank = 99;
  GRAHAS.forEach((n) => {
    const p = chart.planets[n];
    if (!p) return;
    const rk = _dignityRank(p) - (p.is_combust ? 1 : 0);
    if (rk < minRank) { minRank = rk; weakest = n; }
  });
  const focus = [...new Set([maha?.lord, weakest].filter(Boolean))];
  const pack = (n, reason_en, reason_hi) => ({
    planet: n, planet_hi: P_HI[n],
    reason_en, reason_hi,
    rudraksha: RUDRAKSHA[n], yantra: YANTRA[n], daan: DAAN[n],
  });
  const items = [];
  if (maha?.lord) items.push(pack(maha.lord,
    `${maha.lord} rules your current Mahadasha — strengthening it improves the whole period.`,
    `${P_HI[maha.lord]} आपकी वर्तमान महादशा का स्वामी है — इसे बल देने से पूरी अवधि सुधरती है।`));
  if (weakest && weakest !== maha?.lord) items.push(pack(weakest,
    `${weakest} is the most challenged planet in your chart (${chart.planets[weakest]?.dignity || ''}) — its remedies remove the biggest friction.`,
    `${P_HI[weakest]} आपकी कुंडली का सबसे कमजोर ग्रह है — इसके उपाय सबसे बड़ी रुकावट हटाते हैं।`));
  return {
    focus,
    items,
    wearing_en: 'Wear Rudraksha on Monday morning after a bath, energised with the planet\'s mantra; keep it clean and personal. Place the Yantra in your puja space facing East, light a diya daily. Give Daan with your own hands on the planet\'s weekday, ideally before noon.',
    wearing_hi: 'रुद्राक्ष सोमवार सुबह स्नान के बाद, ग्रह मंत्र से अभिमंत्रित कर धारण करें; इसे स्वच्छ और व्यक्तिगत रखें। यंत्र पूजा स्थान में पूर्वमुखी रखें, प्रतिदिन दीपक जलाएं। दान ग्रह के वार पर, दोपहर से पहले, अपने हाथों से दें।',
  };
}

// ── 8. Marriage timing windows ────────────────────────────────────────────────
const RASHI_LORD = { 1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',6:'Mercury',7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Jupiter' };

function computeMarriageTiming(chart, horizonYears = 16) {
  if (!Array.isArray(chart?.dasha) || !chart.ascendant?.rashi_num) return null;
  const ascR = chart.ascendant.rashi_num;
  const seventhLord = RASHI_LORD[((ascR + 5) % 12) + 1];
  const now = Date.now();
  const limit = now + horizonYears * 365.25 * 86400e3;

  const planetHouse = (n) => {
    const p = chart.planets?.[n];
    return p?.rashi_num ? ((p.rashi_num - ascR + 12) % 12) + 1 : null;
  };

  const windows = [];
  chart.dasha.forEach((maha) => {
    (maha.antardasha || []).forEach((ad) => {
      const s = new Date(ad.start).getTime(), e = new Date(ad.end).getTime();
      if (e < now || s > limit) return;
      let score = 0;
      const why_en = [], why_hi = [];
      if (ad.lord === 'Venus') { score += 2; why_en.push('Venus (marriage karaka) antardasha'); why_hi.push('शुक्र (विवाह कारक) की अंतर्दशा'); }
      if (ad.lord === 'Jupiter') { score += 2; why_en.push('Jupiter (blessing karaka) antardasha'); why_hi.push('गुरु (आशीर्वाद कारक) की अंतर्दशा'); }
      if (ad.lord === seventhLord) { score += 2; why_en.push(`7th lord ${seventhLord} antardasha`); why_hi.push(`सप्तमेश ${P_HI[seventhLord]} की अंतर्दशा`); }
      if (planetHouse(ad.lord) === 7) { score += 1; why_en.push(`${ad.lord} sits in the 7th house`); why_hi.push(`${P_HI[ad.lord]} सप्तम भाव में स्थित`); }
      if (['Venus', 'Jupiter', seventhLord].includes(maha.lord)) { score += 1; why_en.push(`supportive ${maha.lord} mahadasha`); why_hi.push(`सहायक ${P_HI[maha.lord]} महादशा`); }
      if (score >= 2) {
        windows.push({
          start: String(ad.start).slice(0, 10), end: String(ad.end).slice(0, 10),
          maha: maha.lord, maha_hi: P_HI[maha.lord], antar: ad.lord, antar_hi: P_HI[ad.lord],
          rating: score >= 4 ? 'high' : score === 3 ? 'good' : 'moderate',
          rating_en: score >= 4 ? 'Very Strong' : score === 3 ? 'Strong' : 'Moderate',
          rating_hi: score >= 4 ? 'अति प्रबल' : score === 3 ? 'प्रबल' : 'मध्यम',
          reason_en: why_en.join('; '), reason_hi: why_hi.join('; '),
          is_current: s <= now && now <= e,
        });
      }
    });
  });
  windows.sort((a, b) => new Date(a.start) - new Date(b.start));
  return { seventh_lord: seventhLord, seventh_lord_hi: P_HI[seventhLord], windows: windows.slice(0, 8) };
}

module.exports = { computeYutiAnalysis, computeAntardashaNarratives, computeRemedySuite, computeMarriageTiming };
