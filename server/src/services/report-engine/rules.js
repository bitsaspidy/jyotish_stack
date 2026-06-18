'use strict';
/**
 * LAYER 1 — Raw Astrology Data extractor (buildContext)
 * LAYER 2 — Interpretation Rule layer (RULES)
 *
 * Rules are plain data objects:
 *   { id, area, priority, tone, test(ctx), hi, advice?, caution? }
 *
 * `test(ctx)` is the condition. `tone` drives scoring + soft connectors.
 * `hi` is user-facing simple Hindi (no technical tokens). The composer
 * (layer 5) never reads the chart directly — only these rule outputs + lexicon.
 *
 * The rule set below is representative and intentionally data-driven: add more
 * objects to deepen any area without touching the engine.
 */
const L = require('./lexicon');

const RASHI_LORD = { 1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',6:'Mercury',7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Jupiter' };
const BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
const MALEFICS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun']);
const STRONG_DIGNITY = new Set(['exalted', 'moolatrikona', 'own', 'great_friend', 'friend']);
const WEAK_DIGNITY = new Set(['debilitated', 'great_enemy', 'enemy']);

// ── LAYER 1: turn a raw chart into a clean, queryable context ────────────────────
function buildContext(chart = {}) {
  const planets = chart.planets || {};
  const lagna = chart?.ascendant?.rashi_num || 1;

  const houseOf = (name) => {
    const p = planets[name];
    if (!p) return null;
    if (p.house_num) return p.house_num;
    if (p.rashi_num) return ((p.rashi_num - lagna + 12) % 12) + 1;
    return null;
  };

  const ctx = {
    chart,
    lagna,
    lagnaSign: lagna,
    lagnaLord: RASHI_LORD[lagna],
    moonSign: planets.Moon?.rashi_num || null,
    sunSign: planets.Sun?.rashi_num || null,
    moonNak: planets.Moon?.nakshatra_num || chart?.nakshatra?.num || null,
    planets,
    houseOf,
    dignity: (name) => planets[name]?.dignity || 'neutral',
    isStrong: (name) => STRONG_DIGNITY.has(planets[name]?.dignity),
    isWeak: (name) => WEAK_DIGNITY.has(planets[name]?.dignity),
    inHouse: (name, h) => houseOf(name) === h,
    occupants: (h) => Object.keys(planets).filter((n) => houseOf(n) === h),
    beneficsIn: (h) => Object.keys(planets).filter((n) => houseOf(n) === h && BENEFICS.has(n)),
    maleficsIn: (h) => Object.keys(planets).filter((n) => houseOf(n) === h && MALEFICS.has(n)),
    yogaNames: ((chart.yogas_doshas?.yogas) || []).filter((y) => y && !y.is_cancelled).map((y) => y.name || ''),
    hasYoga: (re) => ((chart.yogas_doshas?.yogas) || []).some((y) => y && !y.is_cancelled && re.test(y.name || '')),
    mangal: chart.mangal_dosha || null,
    dasha: null,
    antar: null,
  };

  const maha = Array.isArray(chart.dasha) ? (chart.dasha.find((d) => d.is_current) || chart.dasha[0]) : null;
  ctx.dasha = maha?.lord || null;
  ctx.antar = maha?.antardasha?.find((a) => a.is_current)?.lord || null;
  ctx.lagnaLordHouse = houseOf(ctx.lagnaLord);
  return ctx;
}

const benefic = (n) => BENEFICS.has(n);

// ── LAYER 2: the rule set ───────────────────────────────────────────────────────
const RULES = [
  // ───────── PERSONALITY ─────────
  {
    id: 'pers.base', area: 'personality', priority: 10, tone: 'neutral',
    test: () => true,
    hi: (c) => {
      const lag = L.SIGN[c.lagna], moon = L.SIGN[c.moonSign] || lag;
      const nak = c.moonNak ? L.NAKSHATRA[c.moonNak] : null;
      let s = `स्वभाव से आप ${lag.nature} व्यक्ति हैं। ${moon.manas}।`;
      if (nak) s += ` भीतर से आप ${nak} हैं।`;
      return s;
    },
  },
  {
    id: 'pers.lagnalord.strong', area: 'personality', priority: 7, tone: 'positive',
    test: (c) => c.isStrong(c.lagnaLord),
    hi: () => 'आपके अंदर आत्म-नियंत्रण, दृढ़ता और खुद को संभालने की अच्छी क्षमता दिखती है।',
  },
  {
    id: 'pers.lagnalord.weak', area: 'personality', priority: 7, tone: 'caution',
    test: (c) => c.isWeak(c.lagnaLord),
    hi: () => 'कभी-कभी आत्मविश्वास और मन की स्थिरता में उतार-चढ़ाव आ सकता है; खुद पर भरोसा बढ़ाने पर काम करें।',
    advice: 'रोज़ थोड़ा समय खुद को समझने और शांत रहने में दें।',
  },
  {
    id: 'pers.sun.strong', area: 'personality', priority: 5, tone: 'positive',
    test: (c) => c.isStrong('Sun'),
    hi: () => 'नेतृत्व, आत्मसम्मान और जिम्मेदारी उठाने का गुण आपमें मजबूत है।',
  },
  {
    id: 'pers.saturn.lagna', area: 'personality', priority: 5, tone: 'mixed',
    test: (c) => c.inHouse('Saturn', 1),
    hi: () => 'आप गंभीर, जिम्मेदार और व्यावहारिक हैं, पर कभी-कभी जरूरत से ज्यादा सोचने या खुद पर सख्ती से बचें।',
  },

  // ───────── FAMILY ─────────
  {
    id: 'fam.base', area: 'family', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'परिवार और घर आपके जीवन में भावनात्मक सहारे की तरह हैं। समय के साथ जिम्मेदारियां और बंधन दोनों बढ़ते हैं।',
  },
  {
    id: 'fam.benefic4', area: 'family', priority: 7, tone: 'positive',
    test: (c) => c.beneficsIn(4).length > 0,
    hi: () => 'घर में आम तौर पर सुख-शांति और अपनों का सहयोग बना रहता है।',
  },
  {
    id: 'fam.malefic4', area: 'family', priority: 6, tone: 'caution',
    test: (c) => c.maleficsIn(4).length > 0,
    hi: () => 'घर या माता से जुड़ी कुछ जिम्मेदारियां आप पर रह सकती हैं; धैर्य से निभाने पर माहौल अच्छा रहता है।',
    advice: 'घर के बड़ों का ध्यान रखें, इससे मन और माहौल दोनों अच्छे रहेंगे।',
  },
  {
    id: 'fam.jupiter.strong', area: 'family', priority: 5, tone: 'positive',
    test: (c) => c.isStrong('Jupiter'),
    hi: () => 'बड़ों और गुरुजनों का आशीर्वाद व सहयोग आपको मिलता रहता है।',
  },
  {
    id: 'fam.rahuketu2', area: 'family', priority: 6, tone: 'caution',
    test: (c) => c.inHouse('Rahu', 2) || c.inHouse('Ketu', 2),
    hi: () => 'परिवार में पैसे या बातचीत को लेकर कभी-कभी गलतफहमी हो सकती है; वाणी में संयम रखें।',
    caution: 'पैसे के लेन-देन और तीखी बातों से परिवार में दूरी न आने दें।',
  },

  // ───────── CAREER ─────────
  {
    id: 'car.base', area: 'career', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'करियर में आगे बढ़ने की क्षमता आपमें है; सही दिशा और निरंतर मेहनत से पहचान बनती है।',
  },
  {
    id: 'car.benefic10', area: 'career', priority: 7, tone: 'positive',
    test: (c) => c.occupants(10).some((p) => benefic(p) || c.isStrong(p)),
    hi: () => 'काम में तरक्की और अच्छे अवसर मिलने की अच्छी संभावना है।',
  },
  {
    id: 'car.saturn', area: 'career', priority: 6, tone: 'mixed',
    test: (c) => c.lagnaLord === 'Saturn' || c.isStrong('Saturn'),
    hi: () => 'नौकरी और जिम्मेदारी वाले काम आपको सूट करते हैं; सफलता धीरे पर मजबूत और टिकाऊ मिलती है।',
    advice: 'जल्दबाज़ी की जगह धैर्य और लगातार मेहनत रखें।',
  },
  {
    id: 'car.sun', area: 'career', priority: 5, tone: 'positive',
    test: (c) => c.isStrong('Sun') || c.inHouse('Sun', 10),
    hi: () => 'नेतृत्व, प्रशासन या सरकारी/जिम्मेदारी वाले क्षेत्र आपके लिए अच्छे रहते हैं।',
  },
  {
    id: 'car.mercury', area: 'career', priority: 5, tone: 'positive',
    test: (c) => c.isStrong('Mercury') || c.hasYoga(/budh.?aditya|bhadra/i),
    hi: () => 'बुद्धि, संवाद, व्यापार, लेखन या सलाह से जुड़े काम में आप अच्छा कर सकते हैं।',
  },
  {
    id: 'car.rajyoga', area: 'career', priority: 6, tone: 'positive',
    test: (c) => c.hasYoga(/raj/i),
    hi: () => 'सही अवसर मिलने पर अच्छी position और सम्मान पाने की क्षमता आपमें है।',
  },
  {
    id: 'car.rahu10', area: 'career', priority: 5, tone: 'caution',
    test: (c) => c.inHouse('Rahu', 10),
    hi: () => 'करियर में अचानक उतार-चढ़ाव आ सकता है; शॉर्टकट से बचकर मेहनत पर भरोसा रखें।',
    caution: 'जल्दी सफलता के लालच में गलत रास्ता न चुनें।',
  },
  {
    id: 'car.ego', area: 'career', priority: 4, tone: 'caution',
    test: (c) => c.isStrong('Sun') || c.inHouse('Sun', 10) || c.inHouse('Mars', 10),
    hi: () => 'सीनियर या अधिकारियों से अहं की टक्कर से बचें — इससे बने काम बिगड़ सकते हैं।',
    caution: 'गुस्से और अहंकार में नौकरी/काम का नुकसान न करें।',
  },

  // ───────── MONEY / BUSINESS ─────────
  {
    id: 'mon.base', area: 'money', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'पैसा कमाने की समझ आपमें है; आमदनी के साथ बचत और सही योजना पर ध्यान देना फायदेमंद रहेगा।',
  },
  {
    id: 'mon.jupiter.venus', area: 'money', priority: 7, tone: 'positive',
    test: (c) => c.isStrong('Jupiter') || c.isStrong('Venus'),
    hi: () => 'धन और सुख-सुविधा के साधन समय के साथ बढ़ने की अच्छी संभावना है।',
  },
  {
    id: 'mon.gain11', area: 'money', priority: 6, tone: 'positive',
    test: (c) => c.beneficsIn(11).length > 0 || c.occupants(11).some((p) => c.isStrong(p)),
    hi: () => 'आय के एक से ज्यादा स्रोत और मित्रों/संपर्कों से लाभ के योग बनते हैं।',
  },
  {
    id: 'mon.lakshmi', area: 'money', priority: 6, tone: 'positive',
    test: (c) => c.hasYoga(/lakshmi|laxmi|dhana|dhan/i),
    hi: () => 'धन जोड़ने और समृद्धि बढ़ाने की अच्छी क्षमता आपकी कुंडली में दिखती है।',
  },
  {
    id: 'mon.chandramangal', area: 'money', priority: 5, tone: 'mixed',
    test: (c) => c.hasYoga(/chandra.?mangal/i),
    hi: () => 'कमाई के व्यावहारिक मौके बनते हैं, पर खर्च और जल्दबाज़ी पर नियंत्रण रखना जरूरी है।',
    advice: 'कमाई का एक हिस्सा हर महीने बचत में डालें।',
  },
  {
    id: 'mon.rahu2', area: 'money', priority: 5, tone: 'caution',
    test: (c) => c.inHouse('Rahu', 2),
    hi: () => 'पैसा कभी अचानक भी आ सकता है, पर बिना सोचे निवेश या उधारी से बचें।',
    caution: 'लालच में आकर जल्दी पैसे वाले जोखिम भरे सौदों से दूर रहें।',
  },
  {
    id: 'mon.saturn2', area: 'money', priority: 4, tone: 'mixed',
    test: (c) => c.inHouse('Saturn', 2),
    hi: () => 'शुरुआत में पैसों को लेकर थोड़ी सख्ती रहती है, पर अनुशासन से बाद में अच्छी बचत बनती है।',
  },

  // ───────── MARRIAGE ─────────
  {
    id: 'mar.base', area: 'marriage', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'विवाह और साझेदारी आपके जीवन का अहम हिस्सा रहेंगे; समझदारी और बातचीत से रिश्ते मजबूत बनते हैं।',
  },
  {
    id: 'mar.benefic7', area: 'marriage', priority: 8, tone: 'positive',
    test: (c) => c.beneficsIn(7).length > 0,
    hi: () => 'जीवनसाथी का स्वभाव अच्छा और सहयोगी रहने की संभावना है; वैवाहिक जीवन में प्रेम और समझ बनी रहती है।',
  },
  {
    id: 'mar.jupiter7', area: 'marriage', priority: 6, tone: 'positive',
    test: (c) => c.inHouse('Jupiter', 7) || c.isStrong('Jupiter'),
    hi: () => 'जीवनसाथी समझदार, संस्कारी और मार्गदर्शक जैसा हो सकता है — रिश्ते में परिपक्वता रहती है।',
  },
  {
    id: 'mar.venus.weak', area: 'marriage', priority: 5, tone: 'caution',
    test: (c) => c.isWeak('Venus'),
    hi: () => 'रिश्तों में थोड़ी अधिक मेहनत और समझ की जरूरत पड़ सकती है; भावनाओं को खुलकर साझा करें।',
    advice: 'जीवनसाथी को समय दें और छोटी बातों को बड़ा न बनने दें।',
  },
  {
    id: 'mar.mars7', area: 'marriage', priority: 6, tone: 'caution',
    test: (c) => c.inHouse('Mars', 7) || c.mangal?.has_dosha,
    hi: () => 'जीवनसाथी ऊर्जावान और स्पष्टवादी हो सकता है; रिश्ते में धैर्य और एक-दूसरे को समझना जरूरी रहेगा।',
    caution: 'छोटी बात पर बहस को बढ़ने न दें; गुस्से में कही बात रिश्ते को चोट देती है।',
  },
  {
    id: 'mar.rahuketu7', area: 'marriage', priority: 5, tone: 'caution',
    test: (c) => c.inHouse('Rahu', 7) || c.inHouse('Ketu', 7),
    hi: () => 'रिश्ते में कभी दूरी या गलतफहमी आ सकती है; भरोसा और साफ़ बातचीत सबसे जरूरी है।',
  },

  // ───────── CHILDREN ─────────
  {
    id: 'chl.base', area: 'children', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'संतान और बच्चों से जुड़ा सुख आपके जीवन का सुंदर हिस्सा रहेगा।',
  },
  {
    id: 'chl.jupiter5', area: 'children', priority: 7, tone: 'positive',
    test: (c) => c.inHouse('Jupiter', 5) || c.beneficsIn(5).length > 0 || c.isStrong('Jupiter'),
    hi: () => 'संतान सुख और बच्चों से खुशियों की अच्छी संभावना दिखती है।',
  },
  {
    id: 'chl.delay', area: 'children', priority: 6, tone: 'caution',
    test: (c) => c.maleficsIn(5).length > 0 && c.beneficsIn(5).length === 0 && !c.isStrong('Jupiter'),
    hi: () => 'संतान सुख में थोड़ी देरी या अधिक प्रयास की संभावना दिखती है। सही समय, चिकित्सा सलाह और आध्यात्मिक उपाय दोनों साथ लेकर चलना बेहतर रहेगा।',
    advice: 'धैर्य रखें और जरूरत हो तो समय पर अच्छी चिकित्सा सलाह लें।',
  },

  // ───────── SIBLINGS / FRIENDS ─────────
  {
    id: 'sib.base', area: 'siblings', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'भाई-बहन और मित्र आपके जीवन में सहयोग और संपर्क का जरिया रहेंगे।',
  },
  {
    id: 'sib.mars3', area: 'siblings', priority: 6, tone: 'positive',
    test: (c) => c.inHouse('Mars', 3) || c.beneficsIn(3).length > 0,
    hi: () => 'आपमें साहस और पहल करने की अच्छी क्षमता है; भाई-बहन से बंधन सहयोगी रहता है।',
  },
  {
    id: 'sib.saturn3', area: 'siblings', priority: 5, tone: 'mixed',
    test: (c) => c.inHouse('Saturn', 3),
    hi: () => 'मेहनत और अनुशासन से आपका साहस बढ़ता है; भाई-बहन से कभी थोड़ी दूरी या जिम्मेदारी रह सकती है।',
  },

  // ───────── HEALTH ─────────
  {
    id: 'hea.base', area: 'health', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'कुल मिलाकर सेहत संभाली जा सकती है; अच्छी दिनचर्या और संतुलित जीवनशैली सबसे बड़ा उपाय है।',
  },
  {
    id: 'hea.lagnalord.strong', area: 'health', priority: 6, tone: 'positive',
    test: (c) => c.isStrong(c.lagnaLord),
    hi: () => 'शरीर में रोगों से लड़ने की अच्छी क्षमता दिखती है।',
  },
  {
    id: 'hea.weak', area: 'health', priority: 6, tone: 'caution',
    test: (c) => c.isWeak(c.lagnaLord) || c.maleficsIn(1).length > 0,
    hi: () => 'ऊर्जा और सेहत में कभी-कभी उतार-चढ़ाव रह सकता है; थकान और तनाव को नज़रअंदाज़ न करें।',
    advice: 'नींद, खानपान और थोड़े व्यायाम का नियम बनाएं।',
  },
  {
    id: 'hea.mind', area: 'health', priority: 5, tone: 'caution',
    test: (c) => c.isWeak('Moon') || c.moonNak === 9,
    hi: () => 'मन कभी ज्यादा सोचने या भावुक होने लगता है; मानसिक शांति का खास ध्यान रखें।',
    advice: 'रोज़ कुछ मिनट गहरी सांस या ध्यान करें।',
  },

  // ───────── DEBT / ENEMIES ─────────
  {
    id: 'deb.base', area: 'debt', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'मुश्किलों और प्रतियोगिता का सामना करने की क्षमता आपमें है; समझदारी से चलें तो परेशानियां संभलती हैं।',
  },
  {
    id: 'deb.win6', area: 'debt', priority: 6, tone: 'positive',
    test: (c) => c.inHouse('Mars', 6) || c.inHouse('Saturn', 6) || c.occupants(6).some((p) => c.isStrong(p)),
    hi: () => 'प्रतियोगिता और विरोधियों पर भारी पड़ने की अच्छी क्षमता है — मेहनत से जीत मिलती है।',
  },
  {
    id: 'deb.caution', area: 'debt', priority: 5, tone: 'caution',
    test: (c) => c.inHouse('Rahu', 6) || c.inHouse('Rahu', 8) || c.inHouse('Saturn', 8),
    hi: () => 'कर्ज, कानूनी मामलों और छिपे विरोधियों के मामले में सावधानी रखें; कागज़ात साफ़ रखें।',
    caution: 'बिना सोचे गारंटी या बड़ा उधार लेने से बचें।',
  },

  // ───────── PROPERTY ─────────
  {
    id: 'pro.base', area: 'property', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'समय के साथ घर, वाहन और सुख-सुविधा के साधन जुटने की संभावना है।',
  },
  {
    id: 'pro.benefic4', area: 'property', priority: 6, tone: 'positive',
    test: (c) => c.beneficsIn(4).length > 0 || c.isStrong('Venus') || c.isStrong('Moon'),
    hi: () => 'घर और वाहन का सुख तथा माता का स्नेह अच्छा रहने की संभावना है।',
  },
  {
    id: 'pro.mars4', area: 'property', priority: 5, tone: 'mixed',
    test: (c) => c.inHouse('Mars', 4),
    hi: () => 'संपत्ति मेहनत से मिलती है; घर में बहस को बढ़ने न दें।',
  },
  {
    id: 'pro.saturn4', area: 'property', priority: 5, tone: 'caution',
    test: (c) => c.inHouse('Saturn', 4),
    hi: () => 'घर/संपत्ति में थोड़ी देरी या जिम्मेदारी रह सकती है, पर धैर्य से चीज़ें बनती हैं।',
  },

  // ───────── LUCK / SPIRITUALITY ─────────
  {
    id: 'spi.base', area: 'spirituality', priority: 10, tone: 'neutral',
    test: () => true,
    hi: () => 'भाग्य और मेहनत दोनों का साथ आपके जीवन को आगे बढ़ाते हैं; धर्म-कर्म में रुचि मन को शांति देती है।',
  },
  {
    id: 'spi.jupiter9', area: 'spirituality', priority: 6, tone: 'positive',
    test: (c) => c.inHouse('Jupiter', 9) || c.isStrong('Jupiter') || c.beneficsIn(9).length > 0,
    hi: () => 'भाग्य का साथ और बड़ों/गुरु का मार्गदर्शन समय-समय पर मिलता रहता है।',
  },
  {
    id: 'spi.ketu', area: 'spirituality', priority: 5, tone: 'positive',
    test: (c) => c.inHouse('Ketu', 12) || c.inHouse('Jupiter', 12) || c.inHouse('Ketu', 9),
    hi: () => 'आपमें आध्यात्म, साधना और गहरी समझ की ओर स्वाभाविक रुझान है।',
  },
];

module.exports = { buildContext, RULES, RASHI_LORD, BENEFICS, MALEFICS };
