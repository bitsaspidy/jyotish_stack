'use strict';
/**
 * varga-insights.js — Deep planet-by-planet analysis for all 18 Varga charts.
 * For each chart: what every planet means in its domain context,
 * positive / negative aspects, and specific remedies.
 * Source: AstroAnsh Class notes, BPHS, Parashara tradition.
 */

const SIGN_LORD = {
  1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',6:'Mercury',
  7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Jupiter',
};

const P_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'बृहस्पति', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const PLANET_ICON = {
  Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃',
  Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋',
};

// ── House favorability ────────────────────────────────────────────────────────
function houseFav(h) {
  if ([1,5,9].includes(h)) return 'very_favorable';
  if ([2,10,11].includes(h)) return 'favorable';
  if ([3,6,7].includes(h)) return 'neutral';
  return 'challenging'; // 4,8,12
}

function dignityScore(d) {
  if (!d) return 3;
  if (d.includes('Exaltation')) return 6;
  if (d.includes('Own Sign') || d.includes('Moolatrikona')) return 5;
  if (d.includes('Friend')) return 4;
  if (d.includes('Enemy')) return 2;
  if (d.includes('Debilitation')) return 1;
  return 3;
}

// ── What each planet naturally represents ─────────────────────────────────────
const PLANET_KARAKATVA = {
  Sun:     { en:'authority, vitality, self-confidence, father, career',    hi:'अधिकार, ओज, आत्मविश्वास, पिता, करियर' },
  Moon:    { en:'mind, emotions, mother, happiness, nourishment',          hi:'मन, भावनाएं, माता, सुख, पोषण' },
  Mars:    { en:'energy, courage, property, siblings, drive',              hi:'ऊर्जा, साहस, संपत्ति, भाई-बहन, उत्साह' },
  Mercury: { en:'intellect, communication, trade, skills, discrimination', hi:'बुद्धि, संचार, व्यापार, कौशल, विवेक' },
  Jupiter: { en:'wisdom, grace, wealth, children, spirituality, fortune',  hi:'ज्ञान, कृपा, धन, संतान, आध्यात्म, भाग्य' },
  Venus:   { en:'beauty, love, luxury, arts, relationship, pleasures',     hi:'सौंदर्य, प्रेम, विलास, कला, संबंध, सुख' },
  Saturn:  { en:'discipline, longevity, karma, service, delay, justice',   hi:'अनुशासन, दीर्घायु, कर्म, सेवा, विलंब, न्याय' },
  Rahu:    { en:'ambition, innovation, foreign, unconventional, obsession',hi:'महत्वाकांक्षा, नवाचार, विदेश, असाधारण, जुनून' },
  Ketu:    { en:'spirituality, detachment, intuition, past karma, liberation', hi:'आध्यात्म, वैराग्य, अंतर्ज्ञान, पूर्व कर्म, मोक्ष' },
};

// ── Per-chart domain context: what each house means in THIS chart ─────────────
const VARGA_HOUSE_DOMAIN = {
  d1: ['','Self & personality','Wealth & family speech','Siblings & courage','Home & mother','Intelligence & children','Health & enemies','Marriage & partnerships','Longevity & secrets','Fortune & dharma','Career & reputation','Income & gains','Spirituality & loss'],
  d2: ['','Wealth foundation','Cash & savings','Earned income','Property & land','Investment returns','Debts & rivals','Business wealth','Inherited wealth','Destined fortune','Career earnings','Gains & profit','Charitable giving'],
  d3: ['','Your courage & valour','Sibling bonds','Communication strength','Home stability','Creative talents','Health discipline','Partnership support','Risk & bold actions','Fortune & higher path','Professional drive','Social network gains','Hidden strength'],
  d4: ['','Comfort & happiness','Domestic wealth','Siblings in home life','Fixed property','Children & joy','Home rivals','Partnerships & property','Property secrets','Fortune through home','Career & property','Gains from assets','Losses & liberation'],
  d5: ['','Intelligence & power','Wealth through skill','Courage of mind','Emotional power','Creativity & authority','Service excellence','Intellectual partnerships','Hidden knowledge','Fortune & higher learning','Career brilliance','Gains through intellect','Spiritual intelligence'],
  d7: ['','Children & progeny','Child wealth','Child siblings','Child happiness','Child intelligence','Child health','Child marriage','Child longevity','Child fortune','Child career','Child gains','Child spirituality'],
  d8: ['','Longevity & obstacles','Inherited wealth','Courage in adversity','Home crises','Intelligence under pressure','Health crises','Longevity of partner','Hidden crises','Destined challenges','Career obstacles','Gains despite adversity','Spiritual liberation'],
  d9: ['','Soul quality & dharma','Family values of partner','Communication with partner','Emotional bonds in marriage','Children prospects','Obstacles in marriage','Partnership strength','Longevity of marriage','Fortune through marriage','Social standing via marriage','Gains from partner','Spiritual bond & sacrifice'],
  d10: ['','Self in career','Income from career','Effort & work skills','Work environment & support','Creative work expression','Service & competition','Business collaborations','Career transformation','Career fortune & reputation','Success & achievements','Income gains','Hidden work costs'],
  d12: ['','Relationship with parents','Parental wealth','Sibling of parents','Home of parents','Parents intelligence','Parents health','Parents relationships','Parents longevity','Parents fortune','Parents career','Parents gains','Parents liberation'],
  d16: ['','Comfort & vehicles','Wealth from luxury','Vehicle-related skills','Home comforts','Creative luxury','Service vehicles','Partner vehicle','Vehicle secrets','Fortune & travel','Status & vehicle','Gains from vehicle','Spiritual journey'],
  d20: ['','Spiritual nature','Devotional wealth','Spiritual communication','Inner peace','Spiritual intelligence','Service & spiritual discipline','Spiritual partnership','Hidden spiritual life','Fortune through dharma','Spiritual career','Spiritual gains','Liberation path'],
  d24: ['','Academic ability','Scholarly wealth','Study communication','Home of learning','Creative academics','Academic challenges','Academic partnerships','Research secrets','Fortune through education','Career via academics','Gains from education','Spiritual scholarship'],
  d27: ['','Physical strength','Dietary wealth','Siblings health','Home health','Healthy intelligence','Health service','Partner health','Longevity secrets','Fortune & strength','Career & vitality','Physical gains','Health spirituality'],
  d30: ['','Misfortunes & trials','Financial misfortunes','Sibling difficulties','Home troubles','Intellectual trials','Health misfortunes','Partnership misfortunes','Longevity challenges','Destined misfortunes','Career setbacks','Income challenges','Spiritual losses'],
  d40: ['','Maternal inheritance','Maternal wealth','Maternal siblings','Maternal home','Maternal intelligence','Maternal health','Maternal partnership','Maternal secrets','Maternal fortune','Maternal career','Maternal gains','Maternal liberation'],
  d45: ['','Paternal inheritance','Paternal wealth','Paternal siblings','Paternal home','Paternal intelligence','Paternal health','Paternal partnership','Paternal secrets','Paternal fortune','Paternal career','Paternal gains','Paternal liberation'],
  d60: ['','Past life self','Past life wealth','Past life siblings','Past life home','Past life intelligence','Past life health & service','Past life partnerships','Past life longevity','Past life fortune','Past life career','Past life gains','Past life liberation'],
};

// ── Per-chart role of each planet ─────────────────────────────────────────────
const PLANET_CHART_ROLE = {
  d1:  { Sun:'vitality and authority of the self', Moon:'emotional nature and mental peace', Mars:'energy, ambition, and physical drive', Mercury:'intelligence and communication skills', Jupiter:'wisdom, fortune, and life blessings', Venus:'pleasures, relationships, and aesthetic sense', Saturn:'discipline, longevity, and karmic lessons', Rahu:'unconventional paths and worldly ambitions', Ketu:'spirituality and past-life karma' },
  d2:  { Sun:'earning through authority and government', Moon:'fluctuating but nurturing income', Mars:'earnings through property and energy', Mercury:'wealth through business and communication', Jupiter:'expansion of wealth and fortune', Venus:'wealth through beauty, arts, and luxury', Saturn:'slow but steady wealth accumulation', Rahu:'sudden or unconventional wealth gains', Ketu:'detachment from material wealth' },
  d3:  { Sun:'authority among siblings and courageous spirit', Moon:'emotional bond with siblings', Mars:'physical courage and sibling relations', Mercury:'communicative courage and skilled hands', Jupiter:'wisdom in tackling challenges bravely', Venus:'artistic courage and sibling harmony', Saturn:'disciplined courage with delays', Rahu:'unusual courage and bold risk-taking', Ketu:'spiritual courage and letting go of sibling competition' },
  d7:  { Sun:'children\'s authority and confidence', Moon:'children\'s emotional health', Mars:'children\'s vitality and drive', Mercury:'children\'s intelligence and communication', Jupiter:'blessings for children, multiple children possible', Venus:'children\'s artistic nature and happiness', Saturn:'delay in children but eventual stability', Rahu:'unconventional children or adoption', Ketu:'spiritual bond with children, fewer children' },
  d9:  { Sun:'soul alignment in marriage, authority of partner', Moon:'emotional depth in marriage, bond with partner', Mars:'passion and occasional conflict in marriage', Mercury:'communication and intellectual bond with partner', Jupiter:'grace, happiness, and dharmic blessings in marriage', Venus:'love, attraction, and harmony in marriage — KEY planet', Saturn:'longevity but challenges and karmic lessons in marriage', Rahu:'unconventional or foreign partner', Ketu:'spiritual but detached marital bond' },
  d10: { Sun:'authority and fame in career, government support', Moon:'public-facing career, emotional work', Mars:'energetic, competitive career — engineering, military, sports', Mercury:'communication, business, technology career', Jupiter:'teaching, advisory, administrative career with good fortune', Venus:'creative, artistic, hospitality career', Saturn:'hard-working, service-oriented career with eventual rise', Rahu:'unconventional, tech, or foreign career', Ketu:'research, spiritual, or investigative career' },
  d12: { Sun:'father\'s health, authority, and relationship with father', Moon:'mother\'s emotional health and bond', Mars:'parents\' energy and property', Mercury:'parents\' education and communication', Jupiter:'parents\' wisdom, fortune, and blessings', Venus:'parents\' happiness and relationships', Saturn:'parents\' longevity and karmic debts', Rahu:'unusual parental circumstances', Ketu:'spiritual connection with parents, past-life karmic bond' },
  d20: { Sun:'divine authority and connection to light', Moon:'devotional emotions and inner peace', Mars:'disciplined spiritual practice', Mercury:'scriptural learning and spiritual study', Jupiter:'highest spiritual grace and guru connection', Venus:'devotion through beauty, chanting, and ritual', Saturn:'austere spiritual practice and renunciation', Rahu:'unconventional spiritual path', Ketu:'deepest spiritual liberation and moksha potential' },
  d4:  { Sun:'vitality and authority related to home ownership and domestic comfort', Moon:'emotional relationship with home, property, and mother', Mars:'energy and drive in acquiring property and home security', Mercury:'intellect applied to home management and real estate', Jupiter:'fortune and blessings through home, property, and domestic happiness', Venus:'comfort, beauty, and pleasures of home and property', Saturn:'disciplined building of property over time; home-related delays', Rahu:'unconventional home situations or sudden property gains', Ketu:'spiritual detachment from home and property matters' },
  d5:  { Sun:'intellect, authority, and creative power of mind', Moon:'emotional intelligence and intuitive gifts', Mars:'courageous intellect and competitive mental edge', Mercury:'analytical skills and learning capacity', Jupiter:'wisdom, spiritual merit, and blessings for children', Venus:'creative intelligence and artistic gifts', Saturn:'disciplined study and intellectual endurance', Rahu:'innovative thinking and unconventional intelligence', Ketu:'intuitive knowledge and spiritual intelligence from past lives' },
  d8:  { Sun:'resilience of authority and life force under adversity', Moon:'emotional endurance through hidden challenges', Mars:'physical courage and survival instinct in obstacles', Mercury:'mental alertness and adaptability under hidden difficulties', Jupiter:'protective grace that reduces the intensity of longevity challenges', Venus:'comfort and relationships affected by hidden pressures', Saturn:'karmic longevity lessons, chronic challenges, and endurance', Rahu:'unexpected hidden crises and unconventional survival patterns', Ketu:'spiritual transformation through adversity and hidden realms' },
  d16: { Sun:'status and authority expressed through vehicles and comforts', Moon:'emotional comfort, domestic travel, and vehicle sensitivity', Mars:'energy and drive for vehicles, adventure, and conveyance', Mercury:'intellect applied to vehicles, gadgets, and commuting', Jupiter:'fortunate vehicle ownership and comfortable travel', Venus:'luxurious vehicles, comforts, and pleasures of travel', Saturn:'disciplined or delayed vehicle access; older vehicles', Rahu:'unconventional vehicles or foreign travel patterns', Ketu:'detachment from vehicles and material comforts' },
  d24: { Sun:'authority through education and academic achievement', Moon:'emotional connection to learning and the academic environment', Mars:'competitive academic drive and technical learning', Mercury:'sharp academic mind and communication skills in education', Jupiter:'excellent academic blessings, teaching ability, and higher education', Venus:'artistic and aesthetic education; learning through beauty', Saturn:'disciplined but methodical academic progress; structured study', Rahu:'unconventional education, foreign studies, or innovative learning paths', Ketu:'spiritual studies and detachment from conventional academic routes' },
  d27: { Sun:'physical vitality, stamina, and overall strength of constitution', Moon:'emotional resilience and health of the nervous system', Mars:'muscular strength, physical endurance, and fighting spirit', Mercury:'mental agility, coordination, and nervous system health', Jupiter:'robust health, physical protection, and strong immunity', Venus:'physical grace, sensory health, and dietary balance', Saturn:'structural strength and long-term endurance; slow but lasting health', Rahu:'unusual physical constitution or unconventional health patterns', Ketu:'past-life physical karma and spiritual resilience over illness' },
  d30: { Sun:'areas where ego, authority conflicts, or pride may attract misfortune', Moon:'emotional vulnerability patterns, mental stress tendencies, or health imbalances that need monitoring', Mars:'areas where aggression or impulsive action may attract accidents or conflicts — extra caution needed', Mercury:'nervous system stress or communication patterns that may create anxiety or difficulties', Jupiter:'protection against misfortune — Jupiter in D30 helps reduce the intensity of challenges and supports resilience', Venus:'areas where comfort expectations, luxury habits, or over-indulgence may become a source of trouble', Saturn:'karmic pressure areas, chronic stress patterns, and discipline challenges requiring patient perseverance', Rahu:'obsessive patterns, unconventional risks, or sudden disruptions that may cause unexpected difficulties', Ketu:'past-life karmic pressure points and deep vulnerabilities that benefit from spiritual practice' },
  d40: { Sun:'vitality and authority inherited through the maternal lineage', Moon:'emotional patterns and nurturing tendencies from the maternal side', Mars:'energy, property, and courage from the maternal family', Mercury:'intellectual inheritance and communication style from the maternal side', Jupiter:'wisdom, blessings, and fortune from the maternal lineage', Venus:'beauty, comfort, and happiness inherited from the maternal family', Saturn:'karmic obligations and disciplined patterns from maternal inheritance', Rahu:'unconventional or unusual patterns from the maternal lineage', Ketu:'spiritual inheritance and past-life connections through the maternal line' },
  d45: { Sun:'vitality and authority inherited through the paternal lineage', Moon:'emotional patterns and sensitivity from the paternal side', Mars:'energy, property, and courage from the paternal family', Mercury:'intellectual inheritance and communication style from the paternal side', Jupiter:'wisdom, blessings, and fortune from the paternal lineage', Venus:'beauty, comfort, and happiness inherited from the paternal family', Saturn:'karmic obligations and disciplined patterns from paternal inheritance', Rahu:'unconventional or unusual patterns from the paternal lineage', Ketu:'spiritual inheritance and past-life connections through the paternal line' },
  d60: { Sun:'past-life vitality, authority, and leadership karma', Moon:'past-life emotional patterns, relationship with mother, and inner life', Mars:'past-life courage, conflicts, and actions taken', Mercury:'past-life learning, communication, and karmic intellectual debts', Jupiter:'past-life wisdom, dharma, and accumulated spiritual merit', Venus:'past-life relationships, pleasures, and karmic bonds through love', Saturn:'past-life karmic debts, service, and accumulated discipline', Rahu:'past-life unconventional choices and karmic obsessions carried forward', Ketu:'past-life liberation attempts and spiritual achievements still resonating' },
};

// Generic role for charts without specific definitions
function getPlanetRole(planet, slug) {
  const specific = PLANET_CHART_ROLE[slug]?.[planet];
  if (specific) return specific;
  const chart = VARGA_HOUSE_DOMAIN[slug];
  const k = PLANET_KARAKATVA[planet]?.en || planet;
  const domain = (chart?.[1] || '').split('&')[0].trim().toLowerCase();
  return `${k} in the context of ${domain}`;
}

// ── Remedies per planet (for challenging placements) ─────────────────────────
const PLANET_REMEDY = {
  Sun: {
    en: 'Offer water to the Sun at sunrise daily (Arghya). Chant Aditya Hridayam or Gayatri Mantra 108 times. Fast on Sundays. Donate wheat, jaggery, and copper on Sunday. Wear Ruby (consult astrologer). Respect your father and authority figures.',
    hi: 'प्रतिदिन सूर्योदय पर जल अर्घ्य दें। आदित्य हृदयम् या गायत्री मंत्र 108 बार जपें। रविवार को उपवास रखें। गेहूं, गुड़ और तांबा दान करें। पिता और गुरुजनों का सम्मान करें।',
  },
  Moon: {
    en: 'Chant Om Chandraya Namaha 108 times daily. Offer milk to the Shivling on Mondays. Drink water from a silver vessel. Fast on Mondays. Wear Pearl (in silver, consult astrologer). Respect your mother and nurture others.',
    hi: 'ॐ चंद्राय नमः 108 बार जपें। सोमवार को शिवलिंग पर दूध चढ़ाएं। चांदी के बर्तन में पानी पिएं। सोमवार उपवास करें। माता का सम्मान करें और दूसरों की देखभाल करें।',
  },
  Mars: {
    en: 'Recite Hanuman Chalisa on Tuesdays. Fast on Tuesdays. Donate red lentils (masoor dal) and red cloth on Tuesday. Practice physical exercise daily. Wear Red Coral (consult astrologer). Avoid aggression and channel energy constructively.',
    hi: 'मंगलवार को हनुमान चालीसा पढ़ें। मंगलवार उपवास करें। मसूर दाल और लाल कपड़ा दान करें। प्रतिदिन व्यायाम करें। आक्रामकता से बचें और ऊर्जा को सकारात्मक दिशा में लगाएं।',
  },
  Mercury: {
    en: 'Chant Om Budhaya Namaha 108 times daily. Fast on Wednesdays. Donate green vegetables, moong dal, and books on Wednesday. Practice clear communication and honesty in speech. Wear Emerald (consult astrologer). Read and study regularly.',
    hi: 'ॐ बुधाय नमः 108 बार जपें। बुधवार को उपवास करें। हरी सब्जियां, मूंग दाल और किताबें दान करें। स्पष्ट संवाद और सत्य बोलें। नियमित अध्ययन करें।',
  },
  Jupiter: {
    en: 'Chant Om Brihaspataye Namaha or Guru Mantra 108 times daily. Fast on Thursdays. Donate yellow cloth, turmeric, chana dal, and books on Thursday. Respect teachers and elders. Wear Yellow Sapphire (consult astrologer). Practice gratitude and share knowledge generously.',
    hi: 'ॐ बृहस्पतये नमः 108 बार जपें। गुरुवार उपवास करें। पीला कपड़ा, हल्दी, चना दाल और पुस्तकें दान करें। गुरु और बड़ों का सम्मान करें। ज्ञान बांटें और कृतज्ञ रहें।',
  },
  Venus: {
    en: 'Chant Om Shukraya Namaha 108 times daily. Fast on Fridays. Donate white sweets, white rice, and perfume on Friday. Practice beauty and gratitude rituals. Wear Diamond or White Sapphire (consult astrologer). Cultivate harmony in relationships and avoid excess indulgence.',
    hi: 'ॐ शुक्राय नमः 108 बार जपें। शुक्रवार उपवास करें। सफेद मिठाई, चावल और इत्र दान करें। संबंधों में सामंजस्य बनाएं। अत्यधिक भोग से बचें।',
  },
  Saturn: {
    en: 'Chant Om Shanaischaraya Namaha or Shani Mantra 108 times on Saturdays. Fast on Saturdays. Donate black sesame, mustard oil, and iron on Saturday. Feed the poor and serve the needy consistently. Wear Blue Sapphire (ONLY after thorough consultation). Cultivate patience, discipline, and integrity in all actions.',
    hi: 'ॐ शनैश्चराय नमः शनिवार को 108 बार जपें। शनिवार उपवास करें। काले तिल, सरसों का तेल और लोहा दान करें। गरीबों की सेवा करें। धैर्य, अनुशासन और ईमानदारी रखें।',
  },
  Rahu: {
    en: 'Chant Durga Mantra or Kali Mantra 108 times daily. Donate black sesame, blue cloth, and coconut on Saturdays. Avoid obsessive or compulsive behaviour. Meditate daily for mental clarity. Wear Hessonite Garnet (consult astrologer). Stay grounded and avoid shortcuts.',
    hi: 'दुर्गा मंत्र या काली मंत्र 108 बार जपें। काले तिल, नीला कपड़ा और नारियल दान करें। जुनूनी व्यवहार से बचें। प्रतिदिन ध्यान करें। जमीन से जुड़े रहें।',
  },
  Ketu: {
    en: 'Chant Ganapati Atharva Sheersha or Om Ketave Namaha 108 times daily. Donate blankets, sesame, and coloured cloth on Tuesdays. Practice meditation and detachment regularly. Wear Cat\'s Eye (consult astrologer). Study spiritual texts and let go of past attachments.',
    hi: 'गणपति अथर्वशीर्ष या ॐ केतवे नमः 108 बार जपें। कंबल, तिल और रंगीन कपड़ा दान करें। नियमित ध्यान करें। अध्यात्म ग्रंथ पढ़ें। भूतकाल की आसक्ति छोड़ें।',
  },
};

// ── Per-chart quick remedies (for overall chart challenges) ───────────────────
const CHART_OVERALL_REMEDY = {
  d1:  { en:'Chant the Maha Mrityunjaya Mantra for overall vitality and protection.', hi:'समग्र जीवनशक्ति और सुरक्षा के लिए महामृत्युंजय मंत्र का जाप करें।' },
  d2:  { en:'Donate food (annadaan) regularly. Offer yellow flowers to Lakshmi on Fridays.', hi:'नियमित अन्नदान करें। शुक्रवार को लक्ष्मी जी को पीले फूल चढ़ाएं।' },
  d3:  { en:'Respect siblings. Donate on Tuesdays. Practice physical courage through service.', hi:'भाई-बहनों का सम्मान करें। मंगलवार को दान करें। सेवा के माध्यम से साहस बढ़ाएं।' },
  d4:  { en:'Keep your home clean and positive. Light a diya daily. Respect your mother.', hi:'घर को स्वच्छ और सकारात्मक रखें। प्रतिदिन दीया जलाएं। माता का सम्मान करें।' },
  d7:  { en:'Pray to Lord Krishna for children. Feed children sweets on Thursdays.', hi:'संतान के लिए भगवान कृष्ण की प्रार्थना करें। गुरुवार को बच्चों को मिठाई खिलाएं।' },
  d9:  { en:'Chant Hanuman Chalisa on Tuesdays. Both spouses should respect each other\'s spiritual path.', hi:'मंगलवार को हनुमान चालीसा पढ़ें। दोनों जीवनसाथी एक-दूसरे के आध्यात्मिक मार्ग का सम्मान करें।' },
  d10: { en:'Chant Surya mantra for career. Do not waste working hours. Offer water to the Sun daily.', hi:'करियर के लिए सूर्य मंत्र जपें। कार्यसमय का सदुपयोग करें। प्रतिदिन सूर्य को जल दें।' },
  d12: { en:'Respect both parents daily. Serve the elderly. Perform Pitru Tarpan on Amavasya.', hi:'माता-पिता का प्रतिदिन सम्मान करें। वृद्धों की सेवा करें। अमावस्या पर पितृ तर्पण करें।' },
  d20: { en:'Meditate 20 minutes daily. Visit a temple or sacred place weekly. Chant your Ishta Devata\'s mantra.', hi:'प्रतिदिन 20 मिनट ध्यान करें। साप्ताहिक मंदिर जाएं। इष्ट देवता का मंत्र जपें।' },
  d24: { en:'Study daily without fail. Respect teachers and Saraswati. Donate books.', hi:'प्रतिदिन अध्ययन करें। शिक्षकों और सरस्वती का सम्मान करें। पुस्तकें दान करें।' },
  d30: { en:'Chant the Maha Mrityunjaya Mantra. Perform Navagraha Shanti puja. Stay resilient.', hi:'महामृत्युंजय मंत्र जपें। नवग्रह शांति पूजा करें। विपरीत परिस्थिति में धैर्य रखें।' },
};

// ── Core analysis function ────────────────────────────────────────────────────

function analyzeOnePlanet(planet, pd, ascNum, slug) {
  const house = ((pd.rashi_num - ascNum + 12) % 12) + 1;
  const fav   = houseFav(house);
  const ds    = dignityScore(pd.dignity);

  const houseDomain  = (VARGA_HOUSE_DOMAIN[slug] || [])[house] || `House ${house}`;
  const planetRole   = getPlanetRole(planet, slug);
  const karakatva    = PLANET_KARAKATVA[planet] || { en: planet, hi: planet };
  const dignity      = pd.dignity || 'Neutral';

  const isPositive   = fav === 'very_favorable' || fav === 'favorable';
  const isStrong     = ds >= 5;
  const isWeak       = ds <= 2;
  const isChallenged = fav === 'challenging' || isWeak;

  // Build positives
  const positives_en = [], positives_hi = [];
  const negatives_en = [], negatives_hi = [];

  if (isPositive && isStrong) {
    positives_en.push(`${planet} is ${dignity} in the ${houseDomain} zone — peak strength here. Its energy for ${planetRole} flows with minimal obstruction.`);
    positives_hi.push(`${P_HI[planet] || planet} ${houseDomain} क्षेत्र में ${dignity} है — यहाँ सर्वोच्च बल। ${karakatva.hi} का प्रवाह सहज है।`);
  } else if (isPositive) {
    positives_en.push(`${planet} in the ${houseDomain} zone is favourably placed. It supports ${planetRole} in a steady, reliable way.`);
    positives_hi.push(`${P_HI[planet] || planet} ${houseDomain} क्षेत्र में अनुकूल है। ${karakatva.hi} को स्थिर समर्थन मिलता है।`);
  }

  if (house === 1 || house === 5 || house === 9) {
    positives_en.push(`${planet} in a Trikona house (H${house}) gives natural support in the ${houseDomain} area — a well-supported placement in this chart.`);
    positives_hi.push(`${P_HI[planet] || planet} त्रिकोण भाव (H${house}) में है — ${houseDomain} क्षेत्र में स्वाभाविक सहयोग।`);
  }
  if (house === 1 || house === 4 || house === 7 || house === 10) {
    if (isPositive || isStrong) {
      positives_en.push(`Kendra placement (H${house}) gives ${planet} strong projective power — its influence on ${planetRole} is clearly felt.`);
      positives_hi.push(`केंद्र भाव (H${house}) में ${P_HI[planet] || planet} को प्रबल प्रक्षेपण शक्ति मिलती है।`);
    }
  }
  if (isStrong && !isPositive) {
    positives_en.push(`Even in a difficult house, ${planet}'s ${dignity} dignity means personal effort and character can overcome the challenge in ${planetRole}.`);
    positives_hi.push(`कठिन भाव में भी ${P_HI[planet] || planet} की ${dignity} स्थिति कहती है — मेहनत और चरित्र से ${karakatva.hi} सुधरेगा।`);
  }

  if (isChallenged) {
    if (isWeak) {
      negatives_en.push(`${planet} is ${dignity} — its ability to deliver results for ${planetRole} is reduced. Extra effort and remedies are needed.`);
      negatives_hi.push(`${P_HI[planet] || planet} ${dignity} है — ${karakatva.hi} के परिणाम देने की क्षमता घटती है। प्रयास और उपाय जरूरी हैं।`);
    }
    if (house === 8) {
      negatives_en.push(`H8 placement creates hidden pressure on ${planetRole}. Unexpected events, delays, or transformations may affect this area.`);
      negatives_hi.push(`8वें भाव की स्थिति ${houseDomain} में छुपा दबाव बनाती है। अप्रत्याशित घटनाएं या विलंब संभव।`);
    }
    if (house === 12) {
      negatives_en.push(`H12 placement means ${planet}'s energy for ${planetRole} is spent outwardly or hidden — results come through hidden effort and spiritual practice.`);
      negatives_hi.push(`12वें भाव में ${P_HI[planet] || planet} की ऊर्जा ${houseDomain} में बाहर जाती है — परिणाम आध्यात्मिक प्रयास से मिलते हैं।`);
    }
    if (house === 6 && ['Jupiter','Venus','Moon'].includes(planet)) {
      negatives_en.push(`Benefic ${planet} in H6 can indicate health-related sacrifices or service linked to ${planetRole}. Requires conscious management.`);
      negatives_hi.push(`शुभ ${P_HI[planet] || planet} 6वें भाव में ${houseDomain} से जुड़ी स्वास्थ्य या सेवा चुनौती दे सकता है।`);
    }
  }

  // Neutral insights
  if (house === 11) {
    positives_en.push(`H11 placement means ${planet} contributes to gains and fulfillment of desires linked to ${planetRole}. Goals are achievable here.`);
    positives_hi.push(`11वें भाव में ${P_HI[planet] || planet} ${houseDomain} से जुड़े लाभ और इच्छापूर्ति में योगदान करता है।`);
  }
  if (house === 10 && isPositive) {
    positives_en.push(`H10 (${houseDomain}) gives ${planet} strong visibility and projective power in ${planetRole}.`);
    positives_hi.push(`10वें भाव (${houseDomain}) में ${P_HI[planet] || planet} को ${planetRole} में प्रबल प्रक्षेपण शक्ति मिलती है।`);
  }

  // Fallback if nothing generated
  if (!positives_en.length && !negatives_en.length) {
    if (isPositive) {
      positives_en.push(`${planet} in H${house} of this chart supports ${planetRole} — proceed with confidence in this area.`);
      positives_hi.push(`${P_HI[planet] || planet} इस चार्ट के भाव ${house} में ${karakatva.hi} को समर्थन देता है।`);
    } else {
      negatives_en.push(`${planet} in H${house} requires more effort and awareness in ${planetRole}. Consistent discipline brings results.`);
      negatives_hi.push(`${P_HI[planet] || planet} भाव ${house} में ${karakatva.hi} के लिए अधिक प्रयास मांगता है।`);
    }
  }

  return {
    planet,
    planet_hi: P_HI[planet] || planet,
    icon: PLANET_ICON[planet] || '●',
    house,
    house_domain_en: houseDomain,
    house_domain_hi: (VARGA_HOUSE_DOMAIN[slug] || [])[house] || `भाव ${house}`,
    rashi_en: pd.rashi_en || '',
    rashi_hi: pd.rashi_hi || pd.rashi_en || '',
    dignity: pd.dignity || 'Neutral',
    dignity_score: ds,
    planet_role_en: planetRole,
    planet_role_hi: PLANET_KARAKATVA[planet]?.hi || planetRole,
    impact: fav,
    is_challenged: isChallenged,
    is_strong: isStrong,
    positives_en,
    positives_hi,
    negatives_en,
    negatives_hi,
    remedy: isChallenged ? PLANET_REMEDY[planet] : null,
  };
}

/**
 * Main export: compute detailed planet-by-planet analysis for a Varga chart.
 * Returns an array of 9 planet readings, sorted: benefics first, then neutrals, then challenged.
 */
function computeVargaInsights(slug, vargaChart, birthChart) {
  if (!vargaChart?.ascendant || !vargaChart?.planets) return [];

  const ascNum = vargaChart.ascendant.rashi_num;
  const readings = [];

  for (const [planet, pd] of Object.entries(vargaChart.planets)) {
    if (!pd?.rashi_num) continue;
    try {
      readings.push(analyzeOnePlanet(planet, pd, ascNum, slug));
    } catch (_) { /* skip malformed planet */ }
  }

  // Sort: very_favorable → favorable → neutral → challenging
  const ORDER = { very_favorable:0, favorable:1, neutral:2, challenging:3 };
  readings.sort((a, b) => (ORDER[a.impact] ?? 4) - (ORDER[b.impact] ?? 4));

  return readings;
}

/**
 * Get overall chart remedy (generic per slug, fallback to Saturn/Maha Mrityunjaya)
 */
function getChartRemedy(slug) {
  return CHART_OVERALL_REMEDY[slug] || {
    en: 'Chant the Maha Mrityunjaya Mantra daily. Perform Navagraha Puja on Saturdays for overall chart balance.',
    hi: 'प्रतिदिन महामृत्युंजय मंत्र जपें। शनिवार को नवग्रह पूजा करें।',
  };
}

module.exports = { computeVargaInsights, getChartRemedy };
