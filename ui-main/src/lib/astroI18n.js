export const PLANET_HI = {
  Sun: 'सूर्य',
  Moon: 'चंद्र',
  Mars: 'मंगल',
  Mercury: 'बुध',
  Jupiter: 'गुरु',
  Venus: 'शुक्र',
  Saturn: 'शनि',
  Rahu: 'राहु',
  Ketu: 'केतु',
};

import { DICTS } from './i18nDicts';

export function t(lang, en, hi) {
  if (lang === 'hi') return hi || en;
  if (!lang || lang === 'en') return en;
  // Regional languages: dictionary lookup keyed by the English string,
  // graceful English fallback for anything untranslated.
  return DICTS[lang]?.[en] || en;
}

export function planetName(name, lang) {
  if (lang === 'hi') return PLANET_HI[name] || name;
  if (!lang || lang === 'en') return name;
  return DICTS[lang]?.[name] || name;
}

export function planetList(names = [], lang) {
  return names.map((name) => planetName(name, lang)).join(', ');
}

export function houseLabel(value, lang) {
  if (!value && value !== 0) return lang === 'hi' ? 'भाव' : 'House';
  return lang === 'hi' ? `भाव ${value}` : `H${value}`;
}

export function untilText(date, lang) {
  return lang === 'hi' ? `${date || '—'} तक` : `until ${date || '—'}`;
}

export function chartStyleLabel(style, lang) {
  if (style === 'south') return t(lang, 'South Indian', 'दक्षिण भारतीय');
  return t(lang, 'North Indian', 'उत्तर भारतीय');
}

export function strengthLabel(value, lang) {
  const labels = {
    strong: ['Strong', 'प्रबल'],
    moderate: ['Moderate', 'मध्यम'],
    weak: ['Weak', 'कमजोर'],
    mild: ['Mild', 'हल्का'],
    none: ['None', 'नहीं'],
  };
  const pair = labels[value] || [value || '—', value || '—'];
  return t(lang, pair[0], pair[1]);
}

export function outlookLabel(value, lang) {
  const labels = {
    positive: ['Positive', 'शुभ'],
    'deeply active': ['Deeply Active', 'बहुत सक्रिय'],
    mixed: ['Mixed', 'मिश्रित'],
    stable: ['Stable', 'स्थिर'],
    supported: ['Supported', 'सहायक'],
    challenging: ['Needs Attention', 'ध्यान चाहिए'],
    'needs attention': ['Needs Attention', 'ध्यान चाहिए'],
  };
  const pair = labels[value] || [value || '—', value || '—'];
  return t(lang, pair[0], pair[1]);
}

export function dignityLabel(value, lang) {
  if (!value) return '—';
  const base = value.split('(')[0].trim() || value;
  if (lang !== 'hi') return base;
  const labels = {
    Exaltation: 'उच्च',
    Moolatrikona: 'मूलत्रिकोण',
    'Own Sign': 'स्वगृह',
    Debilitation: 'नीच',
    Neutral: 'सामान्य',
    shadow: 'छाया ग्रह',
  };
  return labels[base] || base;
}

const NITYA_YOGA_HI = {
  Vishkambha: 'विष्कम्भ',
  Preeti: 'प्रीति',
  Ayushman: 'आयुष्मान',
  Saubhagya: 'सौभाग्य',
  Sobhana: 'शोभन',
  Atiganda: 'अतिगण्ड',
  Sukarma: 'सुकर्मा',
  Dhriti: 'धृति',
  Shula: 'शूल',
  Ganda: 'गण्ड',
  Vriddhi: 'वृद्धि',
  Dhruva: 'ध्रुव',
  Vyaghat: 'व्याघात',
  Harshana: 'हर्षण',
  Vajra: 'वज्र',
  Siddhi: 'सिद्धि',
  Vyatipata: 'व्यतीपात',
  Variyan: 'वरीयान',
  Parigha: 'परिघ',
  Shiva: 'शिव',
  Siddha: 'सिद्ध',
  Sadhya: 'साध्य',
  Shubha: 'शुभ',
  Shukla: 'शुक्ल',
  Brahma: 'ब्रह्म',
  Indra: 'इन्द्र',
  Vaidhriti: 'वैधृति',
};

const KARANA_HI = {
  Bava: 'बव',
  Balava: 'बालव',
  Kaulava: 'कौलव',
  Taitila: 'तैतिल',
  Gara: 'गर',
  Vanija: 'वणिज',
  Vishti: 'विष्टि',
  Kimstughna: 'किंस्तुघ्न',
  Shakuni: 'शकुनि',
  Chatushpada: 'चतुष्पद',
  Naga: 'नाग',
};

export function nityaYogaName(yoga, lang) {
  const name = yoga?.name || yoga;
  return lang === 'hi' ? (NITYA_YOGA_HI[name] || name || '—') : (name || '—');
}

export function karanaName(karana, lang) {
  const name = karana?.name || karana;
  return lang === 'hi' ? (KARANA_HI[name] || name || '—') : (name || '—');
}

export function localizeAstroText(text, lang) {
  if (!text || lang !== 'hi') return text || '';
  return text
    .replace(/\bSun\b/g, 'सूर्य')
    .replace(/\bMoon\b/g, 'चंद्र')
    .replace(/\bMars\b/g, 'मंगल')
    .replace(/\bMercury\b/g, 'बुध')
    .replace(/\bJupiter\b/g, 'गुरु')
    .replace(/\bVenus\b/g, 'शुक्र')
    .replace(/\bSaturn\b/g, 'शनि')
    .replace(/\bRahu\b/g, 'राहु')
    .replace(/\bKetu\b/g, 'केतु')
    .replace(/\bH(\d+)\b/g, 'भाव $1')
    .replace(/\bLagna\b/g, 'लग्न')
    .replace(/\bMoon\b/g, 'चंद्र')
    .replace(/\bMahadasha\b/g, 'महादशा')
    .replace(/\bAntardasha\b/g, 'अंतर्दशा')
    .replace(/\bSade Sati\b/g, 'साढ़ेसाती')
    .replace(/\bMangal Dosha\b/g, 'मंगल दोष')
    .replace(/\bDasha\b/g, 'दशा')
    .replace(/\bTriggers:/g, 'कारण:')
    .replace(/\bconjunct\b/g, 'युत')
    .replace(/\bin mutual aspect\b/g, 'परस्पर दृष्टि में')
    .replace(/\bhouse\b/g, 'भाव')
    .replace(/\bfrom Moon\b/g, 'चंद्र से')
    .replace(/\bfrom Lagna\b/g, 'लग्न से')
    .replace(/\bstrong\b/g, 'प्रबल')
    .replace(/\bmoderate\b/g, 'मध्यम')
    .replace(/\bmild\b/g, 'हल्का')
    .replace(/\bweak\b/g, 'कमजोर');
}

const YOGA_DETAILS = {
  'Gajakesari Yoga': {
    category: 'power',
    formation_en: 'Jupiter and Moon are placed in Kendra from one another.',
    formation_hi: 'गुरु और चंद्र एक-दूसरे से केंद्र भाव में स्थित होते हैं।',
    result_en: 'Supports wisdom, reputation, protection, emotional steadiness, and public respect.',
    result_hi: 'बुद्धि, प्रतिष्ठा, सुरक्षा, भावनात्मक स्थिरता और सामाजिक सम्मान को बल देता है।',
    guidance_en: 'Its promise becomes stronger when Moon and Jupiter are unafflicted and placed in good houses.',
    guidance_hi: 'चंद्र और गुरु शुभ, बलवान और कम पीड़ित हों तो इसका फल अधिक स्पष्ट होता है।',
  },
  'Budh-Aditya Yoga': {
    category: 'intellect',
    formation_en: 'Sun and Mercury combine in one sign or house.',
    formation_hi: 'सूर्य और बुध एक ही राशि या भाव में मिलते हैं।',
    result_en: 'Improves intelligence, speech, analysis, administration, and business judgment.',
    result_hi: 'बुद्धि, वाणी, विश्लेषण, प्रशासन और व्यापारिक निर्णय क्षमता बढ़ाता है।',
    guidance_en: 'If Mercury is too close to the Sun, the yoga still exists but needs calm communication and focus.',
    guidance_hi: 'बुध सूर्य के बहुत निकट हो तो योग रहता है, लेकिन शांत वाणी और एकाग्रता जरूरी होती है।',
  },
  'Neech Bhanga Raj Yoga': {
    category: 'power',
    formation_en: 'A debilitated planet receives cancellation through its dispositor, exaltation lord, or Kendra support.',
    formation_hi: 'नीच ग्रह को उसके स्वामी, उच्च ग्रह या केंद्र समर्थन से नीच भंग मिलता है।',
    result_en: 'Shows rise after struggle: weakness converts into maturity, authority, and resilience.',
    result_hi: 'संघर्ष के बाद उन्नति दिखाता है: कमजोरी परिपक्वता, अधिकार और धैर्य में बदलती है।',
    guidance_en: 'Results mature with age, discipline, and during the related planet periods.',
    guidance_hi: 'फल उम्र, अनुशासन और संबंधित ग्रहों की दशा में अधिक परिपक्व होता है।',
  },
  'Saraswati Yoga': {
    category: 'wisdom',
    formation_en: 'Jupiter, Venus, and Mercury occupy supportive houses and are mutually connected.',
    formation_hi: 'गुरु, शुक्र और बुध शुभ भावों में होकर परस्पर संबंध बनाते हैं।',
    result_en: 'Favors learning, arts, teaching, writing, refined speech, and spiritual knowledge.',
    result_hi: 'विद्या, कला, लेखन, शिक्षण, मधुर वाणी और आध्यात्मिक ज्ञान को बल देता है।',
    guidance_en: 'Use the gift through study, writing, teaching, music, mantra, or sincere mentorship.',
    guidance_hi: 'इसे अध्ययन, लेखन, शिक्षण, संगीत, मंत्र या सच्चे मार्गदर्शन में लगाएं।',
  },
  'Kalaneedhi Yoga': {
    category: 'wealth',
    formation_en: 'Venus or Jupiter connects with Mercury in wealth or talent houses.',
    formation_hi: 'शुक्र या गुरु का बुध से धन या प्रतिभा भावों में संबंध बनता है।',
    result_en: 'Brings artistic intelligence, refined taste, financial skill, and cultured expression.',
    result_hi: 'कलात्मक बुद्धि, refined रुचि, धन कौशल और सुसंस्कृत अभिव्यक्ति देता है।',
    guidance_en: 'Best results come through creative work, education, advisory roles, and disciplined skill-building.',
    guidance_hi: 'श्रेष्ठ फल रचनात्मक कार्य, शिक्षा, सलाह और नियमित कौशल साधना से आता है।',
  },
  'Chandra-Mangal Laxmi Yoga': {
    category: 'wealth',
    formation_en: 'Moon and Mars are conjunct or mutually aspect one another.',
    formation_hi: 'चंद्र और मंगल युति या परस्पर दृष्टि में होते हैं।',
    result_en: 'Creates financial drive, enterprise, property focus, and quick action in money matters.',
    result_hi: 'धन कमाने की प्रेरणा, उद्यम, संपत्ति रुचि और आर्थिक मामलों में तेज क्रिया देता है।',
    guidance_en: 'Control impulsive spending and emotional reactions; the yoga is strongest when action has planning.',
    guidance_hi: 'आवेगपूर्ण खर्च और भावनात्मक प्रतिक्रिया पर संयम रखें; योजना के साथ कर्म करने पर योग मजबूत होता है।',
  },
  'Dhan Yoga': {
    category: 'wealth',
    formation_en: 'Lords of wealth houses connect through conjunction, aspect, exchange, or strength.',
    formation_hi: 'धन भावों के स्वामी युति, दृष्टि, परिवर्तन या बल से जुड़े होते हैं।',
    result_en: 'Supports income, savings, assets, opportunity, and prosperity through effort and timing.',
    result_hi: 'आय, बचत, संपत्ति, अवसर और प्रयास व समय से समृद्धि को सहयोग देता है।',
    guidance_en: 'Look at the operating dasha and dignity of involved planets before judging full wealth potential.',
    guidance_hi: 'पूर्ण धनफल देखने से पहले संबंधित ग्रहों की दशा और बल अवश्य देखें।',
  },
  'Laxmi Yoga': {
    category: 'wealth',
    formation_en: 'The 9th lord is powerful and the Lagna lord has strength.',
    formation_hi: 'नवमेश बलवान होता है और लग्नेश भी मजबूत रहता है।',
    result_en: 'Brings grace, fortune, prosperity, comfort, and support from past merit.',
    result_hi: 'भाग्य, कृपा, समृद्धि, सुविधा और पूर्व पुण्य का सहयोग देता है।',
    guidance_en: 'Respect dharma, teachers, and ethical earning; that unlocks the higher promise.',
    guidance_hi: 'धर्म, गुरु और नैतिक कमाई का सम्मान करें; इससे उच्च फल खुलता है।',
  },
  'Adhi Yoga': {
    category: 'power',
    formation_en: 'Benefics occupy supportive houses from the Moon.',
    formation_hi: 'शुभ ग्रह चंद्र से सहायक भावों में होते हैं।',
    result_en: 'Gives protection, dignity, advisory power, and capacity to handle pressure.',
    result_hi: 'सुरक्षा, गरिमा, सलाह देने की शक्ति और दबाव संभालने की क्षमता देता है।',
    guidance_en: 'Mental steadiness is the key; nourish the Moon through routine and emotional clarity.',
    guidance_hi: 'मानसिक स्थिरता कुंजी है; दिनचर्या और भावनात्मक स्पष्टता से चंद्र को पोषित करें।',
  },
  'Raj Yoga': {
    category: 'power',
    formation_en: 'Kendra and Trikona lords form a mutual relationship.',
    formation_hi: 'केंद्र और त्रिकोण भावों के स्वामी परस्पर संबंध बनाते हैं।',
    result_en: 'Indicates authority, success, rise in status, leadership, and important responsibilities.',
    result_hi: 'अधिकार, सफलता, पद-वृद्धि, नेतृत्व और महत्वपूर्ण जिम्मेदारी का संकेत देता है।',
    guidance_en: 'The exact result depends on house placement, dignity, and the dasha of involved planets.',
    guidance_hi: 'वास्तविक फल भाव स्थिति, ग्रह बल और संबंधित ग्रहों की दशा पर निर्भर करता है।',
  },
  'Vipreet Raj Yoga': {
    category: 'power',
    formation_en: 'A Dusthana lord occupies another Dusthana, turning difficulty against itself.',
    formation_hi: 'दुष्थान भाव का स्वामी दूसरे दुष्थान में जाकर कठिनाई को ही अवसर बनाता है।',
    result_en: 'Success comes after conflict, debt, disease, loss, litigation, or hidden pressure.',
    result_hi: 'संघर्ष, ऋण, रोग, हानि, विवाद या छिपे दबाव के बाद सफलता देता है।',
    guidance_en: 'Do not fear obstacles; handle them methodically and they can become the doorway to rise.',
    guidance_hi: 'बाधाओं से डरें नहीं; व्यवस्थित ढंग से सामना करने पर वही उन्नति का द्वार बन सकती हैं।',
  },
  'Parivartan Yoga': {
    category: 'general',
    formation_en: 'Two planets occupy each other’s signs, creating a powerful sign exchange.',
    formation_hi: 'दो ग्रह एक-दूसरे की राशि में बैठकर शक्तिशाली राशि परिवर्तन बनाते हैं।',
    result_en: 'The two houses become tightly linked; outcomes depend on whether the exchange is auspicious or difficult.',
    result_hi: 'दोनों भाव गहराई से जुड़ जाते हैं; फल शुभ या कठिन होने पर निर्भर करता है।',
    guidance_en: 'Read both houses together because events in one area will repeatedly affect the other.',
    guidance_hi: 'दोनों भावों को साथ पढ़ें, क्योंकि एक क्षेत्र की घटना दूसरे को बार-बार प्रभावित करेगी।',
  },
  'Guru-Aditya Yoga': {
    category: 'wisdom',
    formation_en: 'Sun and Jupiter join in one sign or house.',
    formation_hi: 'सूर्य और गुरु एक राशि या भाव में मिलते हैं।',
    result_en: 'Supports wisdom, dharma, authority, mentorship, ethics, and respected leadership.',
    result_hi: 'ज्ञान, धर्म, अधिकार, मार्गदर्शन, नैतिकता और सम्मानित नेतृत्व को बल देता है।',
    guidance_en: 'Use authority with humility; the yoga becomes brighter through ethical conduct.',
    guidance_hi: 'अधिकार का प्रयोग विनम्रता से करें; नैतिक आचरण से योग अधिक चमकता है।',
  },
  'Shatru Hanta Yoga': {
    category: 'victory',
    formation_en: 'The 6th-house conflict indicators become strong enough to defeat opposition.',
    formation_hi: 'छठे भाव के संघर्ष संकेतक इतने मजबूत होते हैं कि विरोध को हराया जा सके।',
    result_en: 'Gives competitive ability, litigation strength, disease resistance, and victory over enemies.',
    result_hi: 'प्रतिस्पर्धा क्षमता, मुकदमे में शक्ति, रोग प्रतिरोध और शत्रु-विजय देता है।',
    guidance_en: 'Use this strength for disciplined service, courage, and fair competition.',
    guidance_hi: 'इस शक्ति को अनुशासित सेवा, साहस और न्यायपूर्ण प्रतिस्पर्धा में लगाएं।',
  },
};

const DOSHA_DETAILS = {
  'Pitru Dosha': {
    category: 'karmic',
    formation_en: 'Ancestor and father indicators, especially the 9th house or Sun, are afflicted.',
    formation_hi: 'पितृ और पिता के संकेतक, विशेषकर नवम भाव या सूर्य, पीड़ित होते हैं।',
    result_en: 'Can show ancestral obligations, blocked blessings, family duty, or karmic lessons through father-line themes.',
    result_hi: 'पितृ ऋण, आशीर्वाद में रुकावट, पारिवारिक जिम्मेदारी या पिता-पक्ष से कर्म पाठ दिखा सकता है।',
    guidance_en: 'Respect elders, serve family lineage, perform sincere charity, and consult a qualified astrologer for remedies.',
    guidance_hi: 'बड़ों का सम्मान, कुल सेवा, सच्चा दान और योग्य ज्योतिषी से उपाय लेना उपयोगी है।',
  },
  'Surya-Shani Vish Dosha': {
    category: 'vish',
    formation_en: 'Sun and Saturn combine, mixing authority with pressure and delay.',
    formation_hi: 'सूर्य और शनि मिलकर अधिकार को दबाव और देरी से जोड़ते हैं।',
    result_en: 'May create father/authority tension, self-confidence tests, career pressure, and duty-heavy growth.',
    result_hi: 'पिता/अधिकारी तनाव, आत्मविश्वास परीक्षा, करियर दबाव और कर्तव्य-प्रधान विकास दे सकता है।',
    guidance_en: 'Practice humility with authority, build routine, and avoid ego battles.',
    guidance_hi: 'अधिकार के साथ विनम्रता, नियमित दिनचर्या और अहंकार संघर्ष से बचना जरूरी है।',
  },
  'Mangal-Shani Vish Dosha': {
    category: 'vish',
    formation_en: 'Mars and Saturn join, combining speed with obstruction.',
    formation_hi: 'मंगल और शनि मिलकर गति को अवरोध से जोड़ते हैं।',
    result_en: 'Can produce frustration, anger under pressure, accidents, delayed property matters, or harsh effort.',
    result_hi: 'दबाव में क्रोध, निराशा, दुर्घटना जोखिम, संपत्ति में देरी या कठोर परिश्रम दे सकता है।',
    guidance_en: 'Channel energy through disciplined physical work and avoid impulsive reactions.',
    guidance_hi: 'ऊर्जा को अनुशासित शारीरिक कार्य में लगाएं और आवेगपूर्ण प्रतिक्रिया से बचें।',
  },
  'Moon-Shani Vish Dosha': {
    category: 'vish',
    formation_en: 'Moon and Saturn join, putting the mind under Saturn’s weight.',
    formation_hi: 'चंद्र और शनि मिलकर मन पर शनि का भार डालते हैं।',
    result_en: 'May indicate emotional heaviness, loneliness, slow healing, mother-related responsibility, or maturity through hardship.',
    result_hi: 'मानसिक भारीपन, अकेलापन, धीमी healing, माता से जिम्मेदारी या कठिनाई से परिपक्वता दिखा सकता है।',
    guidance_en: 'Prioritize sleep, emotional support, steady routine, and compassionate self-discipline.',
    guidance_hi: 'नींद, भावनात्मक सहयोग, स्थिर दिनचर्या और करुणामय अनुशासन को प्राथमिकता दें।',
  },
  'Amavasya Dosha': {
    category: 'luminary',
    formation_en: 'Sun and Moon are very close around the dark Moon phase.',
    formation_hi: 'अमावस्या के निकट सूर्य और चंद्र बहुत पास होते हैं।',
    result_en: 'Can reduce emotional clarity, create inner conflict, and make self-expression more private.',
    result_hi: 'भावनात्मक स्पष्टता कम कर सकता है, भीतर संघर्ष दे सकता है और अभिव्यक्ति को निजी बना सकता है।',
    guidance_en: 'Strengthen the Moon with calm routine, hydration, motherly care, and lunar practices.',
    guidance_hi: 'शांत दिनचर्या, जल, मातृ भाव और चंद्र साधना से चंद्र को मजबूत करें।',
  },
  'Angarak Dosha': {
    category: 'vish',
    formation_en: 'Mars joins Rahu, amplifying heat, urgency, and desire.',
    formation_hi: 'मंगल राहु से मिलकर गर्मी, जल्दबाजी और इच्छा को बढ़ाता है।',
    result_en: 'Can bring aggression, accidents, sudden conflict, bold ambition, and volatile decisions.',
    result_hi: 'आक्रामकता, दुर्घटना जोखिम, अचानक विवाद, तेज महत्वाकांक्षा और अस्थिर निर्णय दे सकता है।',
    guidance_en: 'Use exercise, breath control, and careful timing before major actions.',
    guidance_hi: 'व्यायाम, श्वास नियंत्रण और बड़े निर्णयों से पहले सही समय का विचार करें।',
  },
  'Shaapit Dosha': {
    category: 'karmic',
    formation_en: 'Saturn joins Rahu, creating deep karmic pressure and unusual delays.',
    formation_hi: 'शनि राहु से मिलकर गहरा कर्म दबाव और असामान्य देरी बनाता है।',
    result_en: 'Can show repeated obstacles, fear patterns, social pressure, and karmic responsibilities.',
    result_hi: 'बार-बार बाधा, भय पैटर्न, सामाजिक दबाव और कर्म जिम्मेदारियां दिखा सकता है।',
    guidance_en: 'Long-term discipline, service, Saturn remedies, and patient ethical work are essential.',
    guidance_hi: 'दीर्घकालिक अनुशासन, सेवा, शनि उपाय और धैर्यपूर्ण नैतिक कर्म आवश्यक हैं।',
  },
  'Surya Grahan Dosha': {
    category: 'grahan',
    formation_en: 'Sun is joined by Rahu or Ketu, creating eclipse influence on solar significations.',
    formation_hi: 'सूर्य राहु या केतु से युत होकर सूर्य कारकत्व पर ग्रहण प्रभाव बनाता है।',
    result_en: 'Can affect confidence, father themes, authority, vitality, and clarity of purpose.',
    result_hi: 'आत्मविश्वास, पिता विषय, अधिकार, vitality और जीवन उद्देश्य की स्पष्टता को प्रभावित कर सकता है।',
    guidance_en: 'Support the Sun through sunrise discipline, truthfulness, and respect for fatherly guides.',
    guidance_hi: 'सूर्योदय अनुशासन, सत्य और पिता/गुरु समान व्यक्तियों के सम्मान से सूर्य को बल दें।',
  },
  'Chandra Grahan Dosha': {
    category: 'grahan',
    formation_en: 'Moon is joined by Rahu or Ketu, creating eclipse influence on the mind.',
    formation_hi: 'चंद्र राहु या केतु से युत होकर मन पर ग्रहण प्रभाव बनाता है।',
    result_en: 'Can affect emotions, mother themes, mental peace, sleep, and intuitive clarity.',
    result_hi: 'भावनाओं, माता विषय, मानसिक शांति, नींद और अंतर्ज्ञान की स्पष्टता को प्रभावित कर सकता है।',
    guidance_en: 'Support the Moon with rest, emotional processing, water rituals, and gentle devotion.',
    guidance_hi: 'आराम, भावनात्मक processing, जल साधना और कोमल भक्ति से चंद्र को बल दें।',
  },
  'Guru Chandaal Dosha': {
    category: 'karmic',
    formation_en: 'Jupiter joins Rahu or Ketu, disturbing wisdom and guru principles.',
    formation_hi: 'गुरु राहु या केतु से युत होकर ज्ञान और गुरु तत्व को विचलित करता है।',
    result_en: 'Can show unconventional beliefs, teacher issues, moral confusion, or sharp nontraditional intelligence.',
    result_hi: 'अपरंपरागत विचार, गुरु से चुनौती, नैतिक भ्रम या तीखी असामान्य बुद्धि दिखा सकता है।',
    guidance_en: 'Choose teachers carefully and keep ethics stronger than ambition.',
    guidance_hi: 'गुरु का चुनाव सावधानी से करें और महत्वाकांक्षा से अधिक नैतिकता को मजबूत रखें।',
  },
  'Venus-Mangal Vish Dosha': {
    category: 'vish',
    formation_en: 'Venus and Mars combine, intensifying passion and desire.',
    formation_hi: 'शुक्र और मंगल मिलकर passion और इच्छा को तीव्र बनाते हैं।',
    result_en: 'Can create magnetic attraction, relationship volatility, creative fire, and sensual impatience.',
    result_hi: 'आकर्षण, संबंधों में उतार-चढ़ाव, रचनात्मक अग्नि और इंद्रिय अधीरता दे सकता है।',
    guidance_en: 'Practice patience, consent, emotional maturity, and creative channeling.',
    guidance_hi: 'धैर्य, सहमति, भावनात्मक परिपक्वता और रचनात्मक दिशा जरूरी है।',
  },
  'Venus-Rahu Vish Dosha': {
    category: 'vish',
    formation_en: 'Venus and Rahu combine, amplifying pleasure, glamour, and attachment.',
    formation_hi: 'शुक्र और राहु मिलकर सुख, glamour और आसक्ति को बढ़ाते हैं।',
    result_en: 'Can bring unconventional attraction, luxury cravings, relationship confusion, or artistic intensity.',
    result_hi: 'अपरंपरागत आकर्षण, विलास इच्छा, संबंध भ्रम या कलात्मक तीव्रता दे सकता है।',
    guidance_en: 'Keep relationships transparent and avoid chasing fantasy over real compatibility.',
    guidance_hi: 'संबंधों में स्पष्टता रखें और वास्तविक compatibility से ऊपर कल्पना का पीछा न करें।',
  },
  'Kemdrum Dosha': {
    category: 'luminary',
    formation_en: 'Moon lacks planetary support in the 2nd and 12th signs from it.',
    formation_hi: 'चंद्र से दूसरे और बारहवें भाव में ग्रह समर्थन नहीं होता।',
    result_en: 'Can show emotional isolation, unstable support, simplicity, or periods of self-made effort.',
    result_hi: 'भावनात्मक अकेलापन, समर्थन में अस्थिरता, सरलता या self-made प्रयास के समय दिखा सकता है।',
    guidance_en: 'Benefic aspects and strong Kendras reduce this dosha; nurture the Moon through community and routine.',
    guidance_hi: 'शुभ दृष्टि और मजबूत केंद्र इसे घटाते हैं; समुदाय और दिनचर्या से चंद्र को पोषित करें।',
  },
  'Paap Kartari Dosha': {
    category: 'general',
    formation_en: 'A house is hemmed between malefics on both sides.',
    formation_hi: 'कोई भाव दोनों ओर से पाप ग्रहों के बीच घिर जाता है।',
    result_en: 'Can restrict the house, create pressure, and make results arrive after effort or delay.',
    result_hi: 'उस भाव को सीमित कर सकता है, दबाव देता है और फल प्रयास या देरी के बाद देता है।',
    guidance_en: 'Look for benefic aspects, house lord strength, and dasha timing before final judgment.',
    guidance_hi: 'अंतिम निर्णय से पहले शुभ दृष्टि, भावेश बल और दशा समय जरूर देखें।',
  },
};

const CATEGORY_LABELS = {
  power: ['Power', 'शक्ति'],
  wealth: ['Wealth', 'धन'],
  intellect: ['Intellect', 'बुद्धि'],
  wisdom: ['Wisdom', 'ज्ञान'],
  victory: ['Victory', 'विजय'],
  karmic: ['Karmic', 'कर्मिक'],
  vish: ['Vish', 'विष'],
  grahan: ['Grahan', 'ग्रहण'],
  luminary: ['Luminary', 'चंद्र-सूर्य'],
  general: ['General', 'सामान्य'],
};

function detailKey(name, details) {
  if (details[name]) return name;
  if (name?.includes('Parivartan')) return 'Parivartan Yoga';
  if (name?.includes('Vipreet')) return 'Vipreet Raj Yoga';
  if (name?.includes('Dhan')) return 'Dhan Yoga';
  return name;
}

export function getYogaDoshaDetail(item, type) {
  const details = type === 'dosha' ? DOSHA_DETAILS : YOGA_DETAILS;
  const key = detailKey(item?.name, details);
  return details[key] || {
    category: 'general',
    formation_en: 'Detected from live chart rules.',
    formation_hi: 'लाइव कुंडली नियमों से पहचाना गया।',
    result_en: 'Read this together with the involved planets, house placement, dignity, and dasha.',
    result_hi: 'इसे संबंधित ग्रह, भाव स्थिति, ग्रह बल और दशा के साथ पढ़ें।',
    guidance_en: 'Use this as a signal for deeper interpretation, not as a standalone verdict.',
    guidance_hi: 'इसे स्वतंत्र निर्णय नहीं, बल्कि गहरे विश्लेषण का संकेत मानें।',
  };
}

export function categoryLabel(category, lang) {
  const pair = CATEGORY_LABELS[category] || CATEGORY_LABELS.general;
  return t(lang, pair[0], pair[1]);
}

export function detailText(detail, key, lang) {
  return lang === 'hi' ? detail[`${key}_hi`] : detail[`${key}_en`];
}

function hasDetailedHindiText(text, minLength = 90) {
  return typeof text === 'string'
    && text.length >= minLength
    && /[\u0900-\u097F]/.test(text);
}

export function portraitText(portrait, key, chart, lang) {
  if (lang !== 'hi') return portrait?.[`${key}_en`] || '';
  if (hasDetailedHindiText(portrait?.[`${key}_hi`])) return portrait[`${key}_hi`];

  const asc = chart?.ascendant?.rashi_hi || chart?.ascendant?.rashi_en || '';
  const ascLord = planetName(chart?.ascendant?.rashi_lord, 'hi');
  const moon = chart?.planets?.Moon;
  const moonSign = moon?.rashi_hi || moon?.rashi_en || '';
  const nak = chart?.nakshatra;
  const nakName = nak?.hi || nak?.en || '';
  const nakLord = planetName(nak?.lord, 'hi');

  if (key === 'lagna') {
    return `${asc} लग्न आपके बाहरी व्यक्तित्व, निर्णय शैली और जीवन की दिशा को दिखाता है। इसका स्वामी ${ascLord} है, इसलिए इस ग्रह की शक्ति आपके आत्मविश्वास, कर्म शैली और दुनिया से व्यवहार को गहराई से प्रभावित करती है।`;
  }
  if (key === 'moon') {
    return `चंद्र ${moonSign} राशि में होने से आपकी भावनात्मक प्रकृति, मन की प्रतिक्रिया और आंतरिक सुरक्षा की जरूरतें इसी राशि के स्वभाव से रंगती हैं। चंद्र की स्थिति मानसिक शांति, स्मृति और संबंधों में संवेदनशीलता को दिखाती है।`;
  }
  if (key === 'nakshatra') {
    return `आपका जन्म नक्षत्र ${nakName} है, जिसका स्वामी ${nakLord} है और चरण ${nak?.pada || 1} है। यह नक्षत्र आपकी सहज प्रवृत्ति, मन की मूल गुणवत्ता और आत्मिक प्रतिक्रिया शैली को आकार देता है।`;
  }
  return `आप ${asc} लग्न और ${moonSign} चंद्र राशि वाले जातक हैं। ${nakName} नक्षत्र आपके भीतर ${nakLord} की सूक्ष्म ऊर्जा जोड़ता है; बाहरी कर्म लग्न से और आंतरिक भावनाएं चंद्र से संचालित होती हैं।`;
}

export function currentPeriodText(period, chart, lang) {
  if (lang !== 'hi') return period?.combined_en || '';
  if (hasDetailedHindiText(period?.combined_hi, 120)) return period.combined_hi;
  const md = period?.mahadasha?.lord || chart?.dasha?.find((d) => d.is_current)?.lord || '—';
  const ad = period?.antardasha?.lord || chart?.dasha?.find((d) => d.is_current)?.antardasha?.find((a) => a.is_current)?.lord || '—';
  const mdHi = planetName(md, 'hi');
  const adHi = planetName(ad, 'hi');
  if (md === ad) {
    return `आप ${mdHi}-${mdHi} की अवधि में हैं। यह ${mdHi} ग्रह की ऊर्जा को बहुत केंद्रित रूप से सक्रिय करता है, इसलिए उसी ग्रह के शुभ और चुनौतीपूर्ण दोनों फल अधिक स्पष्ट हो सकते हैं।`;
  }
  return `आप ${mdHi} महादशा और ${adHi} अंतर्दशा में हैं। महादशा जीवन की बड़ी दिशा देती है, जबकि अंतर्दशा दैनिक घटनाओं और अनुभवों का रंग बदलती है। इसलिए इस समय ${mdHi} के मुख्य विषयों में ${adHi} की सूक्ष्म भूमिका भी जुड़ रही है।`;
}

const AREA_HI = {
  career: 'करियर',
  relationships: 'संबंध',
  health: 'स्वास्थ्य',
  finance: 'धन',
  spirituality: 'आध्यात्मिकता',
};

export function areaLabel(areaKey, lang) {
  const en = {
    career: 'Career',
    relationships: 'Relationships',
    health: 'Health',
    finance: 'Finance',
    spirituality: 'Spirituality',
  }[areaKey] || areaKey;
  return t(lang, en, AREA_HI[areaKey]);
}

export function lifeAreaText(areaKey, area, chart, lang) {
  if (lang !== 'hi') return area?.description_en || '';
  if (area?.description_hi) return area.description_hi;
  const dasha = chart?.dasha?.find((d) => d.is_current) || chart?.dasha?.[0];
  const antar = dasha?.antardasha?.find((d) => d.is_current) || dasha?.antardasha?.[0];
  const md = planetName(dasha?.lord, 'hi');
  const ad = planetName(antar?.lord, 'hi');
  const label = AREA_HI[areaKey] || 'जीवन क्षेत्र';
  const base = {
    career: `${md} महादशा करियर में उसके स्वभाव के अनुसार अवसर, जिम्मेदारी और सीख लेकर आती है। ${ad} अंतर्दशा इस क्षेत्र में दैनिक घटनाओं का रंग बदलती है, इसलिए निर्णय लेते समय धैर्य और स्पष्ट योजना रखें।`,
    relationships: `${md} महादशा संबंधों में परिपक्वता, संवाद और कर्मिक सीख को सक्रिय करती है। ${ad} अंतर्दशा भावनात्मक प्रतिक्रिया और निकट संबंधों की दिशा को प्रभावित कर रही है।`,
    health: `${md} महादशा में स्वास्थ्य का ध्यान उसी ग्रह के कारकत्व के अनुसार रखना चाहिए। ${ad} अंतर्दशा शरीर और मन की छोटी-छोटी जरूरतों को सामने ला सकती है, इसलिए दिनचर्या, नींद और संतुलन जरूरी हैं।`,
    finance: `${md} महादशा धन और संसाधनों में ग्रह के स्वभाव के अनुसार वृद्धि, देरी या पुनर्गठन ला सकती है। ${ad} अंतर्दशा खर्च, निवेश और आय के निर्णयों में अतिरिक्त सावधानी मांगती है।`,
    spirituality: `${md} महादशा आंतरिक विकास और साधना की दिशा खोलती है। ${ad} अंतर्दशा इस समय की भक्ति, अध्ययन और आत्मचिंतन को विशेष रंग दे रही है।`,
  }[areaKey];
  return base || `${label} पर ${md} महादशा और ${ad} अंतर्दशा का संयुक्त प्रभाव चल रहा है।`;
}

const KEYWORD_HI = {
  'Career recognition': 'करियर पहचान',
  'Leadership roles': 'नेतृत्व भूमिका',
  'Government connections': 'सरकारी संबंध',
  'Father-child healing': 'पिता-संतान सुधार',
  'Authority and respect': 'अधिकार और सम्मान',
  'Public recognition': 'जन पहचान',
  'Creative breakthroughs': 'रचनात्मक सफलता',
  'Emotional healing': 'भावनात्मक उपचार',
  'Maternal connections': 'मातृ संबंध',
  'Popularity growth': 'लोकप्रियता',
  'Property and real estate gains': 'संपत्ति लाभ',
  'Career bold moves': 'साहसी करियर कदम',
  'Physical and athletic performance': 'शारीरिक प्रदर्शन',
  'Courageous leadership': 'साहसी नेतृत्व',
  'Competitive success': 'प्रतिस्पर्धी सफलता',
  'Business expansion': 'व्यापार विस्तार',
  'Learning breakthroughs': 'सीख में प्रगति',
  'Communication influence': 'वाणी प्रभाव',
  'Multiple income streams': 'अनेक आय स्रोत',
  'Educational advancement': 'शैक्षिक उन्नति',
  'Career and income expansion': 'करियर और आय विस्तार',
  'Wealth and financial growth': 'धन वृद्धि',
  'Marriage or children': 'विवाह या संतान',
  'Guru or mentor connection': 'गुरु संबंध',
  'Wisdom and higher knowledge': 'उच्च ज्ञान',
  'Artistic success': 'कलात्मक सफलता',
  'Marriage and partnership': 'विवाह और साझेदारी',
  'Luxury and comfort': 'सुख-सुविधा',
  'Creative abundance': 'रचनात्मक समृद्धि',
  'Disciplined and lasting growth': 'स्थायी अनुशासित वृद्धि',
  'Karma clearing and resolution': 'कर्म शुद्धि',
  'Building enduring foundations': 'मजबूत आधार',
  'Professional credibility and seniority': 'व्यावसायिक विश्वसनीयता',
  'Service-oriented impact': 'सेवा प्रभाव',
  'Unconventional and sudden success': 'असामान्य सफलता',
  'Foreign connections and travel': 'विदेश संबंध',
  'Technology and innovation breakthroughs': 'तकनीकी नवाचार',
  'Rapid worldly expansion': 'तेज सांसारिक विस्तार',
  'Karmic completion through experience': 'अनुभव से कर्म पूर्णता',
  'Spiritual awakening and depth': 'आध्यात्मिक जागरण',
  'Research and specialized mastery': 'विशेषज्ञता',
  'Inner clarity and self-knowledge': 'आंतरिक स्पष्टता',
  'Karmic completion': 'कर्म पूर्णता',
  'Moksha-oriented living': 'मोक्षमुखी जीवन',
  'Emotional depth': 'भावनात्मक गहराई',
  Commitment: 'प्रतिबद्धता',
  Communication: 'संवाद',
  'Consistent effort': 'नियमित प्रयास',
  Planning: 'योजना',
  Patience: 'धैर्य',
  Practice: 'साधना',
  Devotion: 'भक्ति',
  'Inner growth': 'आंतरिक विकास',
};

export function keywordLabel(keyword, lang) {
  return lang === 'hi' ? (KEYWORD_HI[keyword] || localizeAstroText(keyword, lang)) : keyword;
}

export function gocharText(key, item, chart, lang) {
  if (lang !== 'hi') return item?.description_en || '';
  if (item?.description_hi) return item.description_hi;
  if (key === 'sade_sati') {
    return item?.active
      ? `साढ़ेसाती का ${item.phase || ''} चरण सक्रिय है। यह समय धैर्य, जिम्मेदारी, नियमित दिनचर्या और कर्म की परिपक्वता मांगता है।`
      : 'चंद्र राशि से साढ़ेसाती सक्रिय नहीं है, इसलिए शनि का यह विशेष दबाव अभी कम है।';
  }
  if (key === 'jupiter') {
    return item?.favorable
      ? 'गोचर गुरु चंद्र से सहायक स्थिति में है। गुरु, शिक्षा, मार्गदर्शन, विस्तार और आशावाद के अवसरों को बढ़ा सकता है।'
      : 'गोचर गुरु अभी चंद्र से सर्वाधिक सहायक स्थिति में नहीं है। विकास संभव है, लेकिन धैर्य, गुणवत्ता और नियमित प्रयास की जरूरत है।';
  }
  if (key === 'rahu_ketu') {
    return `वर्तमान राहु-केतु अक्ष ${item?.axis || chart?.gochar?.highlights?.rahu_ketu_axis || '—'} है। राहु नई इच्छाएं और संसारिक खिंचाव दिखाता है, जबकि केतु छोड़ने, पूर्णता और आध्यात्मिक अंतर्दृष्टि का क्षेत्र दिखाता है।`;
  }
  return '';
}

export function gocharOverallText(gochar, lang) {
  if (lang !== 'hi') return gochar?.overall_en || '';
  if (gochar?.overall_hi) return gochar.overall_hi;
  return gochar?.sade_sati?.active
    ? 'कुल मिलाकर गोचर चित्र जिम्मेदारी और धैर्य मांगता है। शनि के पाठों को नियमित अभ्यास, सत्यनिष्ठा और स्थिर कर्म से संभालें।'
    : 'कुल मिलाकर गोचर संभालने योग्य है। नियमित साधना, धैर्य और स्पष्ट निर्णय इस अवधि में अच्छे परिणाम देंगे।';
}

export function translatedListItem(text, lang) {
  if (lang !== 'hi') return text;
  return localizeAstroText(text, lang)
    .replace(/Mahadasha opens:/g, 'महादशा में अवसर:')
    .replace(/watch for:/g, 'सावधान रहें:')
    .replace(/relationship and property decisions need careful review/g, 'संबंध और संपत्ति निर्णयों में सावधानी चाहिए')
    .replace(/Jupiter transit supports mentors, learning, and expansion — act on it now/g, 'गुरु गोचर मार्गदर्शन, सीख और विस्तार का समर्थन करता है')
    .replace(/No Sade Sati pressure — a clearer window for building and planning/g, 'साढ़ेसाती दबाव नहीं है — निर्माण और योजना के लिए स्पष्ट समय');
}

export function predictionSummaryLines(chart, lang) {
  const pred = chart?.predictions;
  if (!pred) return [];
  if (lang !== 'hi') return pred.summary_en || [];
  const hasRichHindiSummary = pred.summary_hi?.length > 2
    && pred.summary_hi.every((line) => hasDetailedHindiText(line, 70));
  if (hasRichHindiSummary) {
    return pred.summary_hi;
  }
  const period = pred.current_period;
  const dasha = chart?.dasha?.find((d) => d.is_current) || chart?.dasha?.[0];
  const antar = dasha?.antardasha?.find((d) => d.is_current) || dasha?.antardasha?.[0];
  const mangal = chart?.mangal_dosha;
  const sade = chart?.gochar?.highlights?.sade_sati;
  return [
    portraitText(pred.portrait, 'combined', chart, 'hi'),
    `वर्तमान विंशोत्तरी केंद्र: ${planetName(dasha?.lord, 'hi')} महादशा और ${planetName(antar?.lord, 'hi')} अंतर्दशा।`,
    currentPeriodText(period, chart, 'hi'),
    sade?.active ? `साढ़ेसाती सक्रिय है (${sade.phase || ''} चरण) — अनुशासन और स्थिर दिनचर्या बहुत महत्वपूर्ण हैं।` : 'चंद्र से साढ़ेसाती सक्रिय नहीं है — शनि का अतिरिक्त गोचर दबाव कम है।',
    mangal?.has_dosha ? `मंगल दोष (${strengthLabel(mangal.severity, 'hi')}) दिखता है — संबंध निर्णयों में सावधानी लाभदायक है।` : 'लग्न, चंद्र और शुक्र से प्रमुख मंगल दोष नहीं दिखता।',
  ];
}
