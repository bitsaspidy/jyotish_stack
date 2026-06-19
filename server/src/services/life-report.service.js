'use strict';
/**
 * Life Report Service
 * Computes Atmakaraka, Isht Devata, per-Varga practical readings,
 * and a 5-section life report (Finance, Family, Health, Problems, Profile).
 * Source: AstroAnsh Class 1–12, BPHS, Parashara tradition
 */
const { computeVargaInsights, getChartRemedy } = require('./helpers/varga-insights');
const { applyPurposeFilter } = require('./helpers/varga-purpose-filter');

function norm(deg) { return ((deg % 360) + 360) % 360; }

function houseFrom(ascSign, planetSign) {
  return ((planetSign - ascSign + 12) % 12) + 1;
}

const SIGN_LORD = {
  1:'Mars', 2:'Venus', 3:'Mercury', 4:'Moon', 5:'Sun', 6:'Mercury',
  7:'Venus', 8:'Mars', 9:'Jupiter', 10:'Saturn', 11:'Saturn', 12:'Jupiter',
};

const P_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'बृहस्पति', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const H_EN = ['','Self/Body','Wealth/Family','Siblings/Courage','Home/Mother','Children/Intellect',
  'Enemies/Health','Marriage/Partner','Secrets/Longevity','Fortune/Father',
  'Career/Status','Income/Gains','Loss/Liberation'];
const H_HI = ['','स्व/काया','धन/परिवार','भाई/साहस','घर/माता','संतान/बुद्धि',
  'शत्रु/स्वास्थ्य','विवाह/साझेदार','रहस्य/आयु','भाग्य/पिता',
  'करियर/प्रतिष्ठा','आय/लाभ','व्यय/मोक्ष'];

function dignityScore(dignity) {
  if (!dignity) return 3;
  if (dignity.includes('Exaltation')) return 6;
  if (dignity.includes('Own'))        return 5;
  if (dignity.includes('Moola'))      return 4;
  if (dignity.includes('Neutral'))    return 3;
  if (dignity.includes('Debilitation')) return 1;
  return 3;
}

function dignityLabel(score) {
  if (score >= 6) return { en:'Excellent strength', hi:'अत्यंत बलवान' };
  if (score >= 5) return { en:'Good strength',      hi:'अच्छा बल' };
  if (score >= 4) return { en:'Stable strength',    hi:'स्थिर बल' };
  if (score >= 3) return { en:'Moderate',           hi:'सामान्य' };
  return                  { en:'Weak / challenged', hi:'निर्बल / कठिनाई' };
}

function houseFav(h) {
  if ([1,5,9,11].includes(h)) return 'very_favorable';
  if ([2,7,10].includes(h))   return 'favorable';
  if ([3,6].includes(h))      return 'neutral';
  return                             'challenging'; // 4,8,12 → hidden/difficult
}

// ─── 1. Atmakaraka ────────────────────────────────────────────────────────────
function calculateAtmakaraka(planets) {
  const order = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  let ak = null, maxDeg = -1;
  for (const name of order) {
    const p = planets[name];
    if (!p) continue;
    const deg = norm(p.longitude) % 30;
    if (deg > maxDeg) { maxDeg = deg; ak = name; }
  }
  return { planet: ak, degree: +maxDeg.toFixed(4) };
}

// ─── 2. Isht Devata ───────────────────────────────────────────────────────────
const DEVATA_MAP = {
  Sun:     { en:'Lord Rama / Surya Narayan',          hi:'भगवान राम / सूर्य नारायण',     mantra_en:'Surya Upanishad',           mantra_hi:'सूर्य उपनिषद' },
  Moon:    { en:'Lord Krishna / Shiva',               hi:'भगवान कृष्ण / शिव',             mantra_en:'Sri Rudram (Namakam & Chamakam)', mantra_hi:'श्री रुद्रम्' },
  Mars:    { en:'Hanuman / Kartikeya / Narsimha',     hi:'हनुमान / कार्तिकेय / नरसिंह',   mantra_en:'Hanuman Chalisa / Hanuman Bahuk', mantra_hi:'हनुमान चालीसा / हनुमान बाहुक' },
  Mercury: { en:'Lord Vishnu',                        hi:'भगवान विष्णु',                  mantra_en:'Vishnu Suktam / Narayan Suktam', mantra_hi:'विष्णु सूक्तम् / नारायण सूक्तम्' },
  Jupiter: { en:'Vishnu / Brihaspati / Dakshinamurthy', hi:'विष्णु / बृहस्पति / दक्षिणामूर्ति', mantra_en:'Navgraha Suktam (most powerful)', mantra_hi:'नवग्रह सूक्तम् (सर्वाधिक शक्तिशाली)' },
  Venus:   { en:'Lakshmi / Parvati / Tripura Sundari', hi:'लक्ष्मी / पार्वती / त्रिपुर सुंदरी', mantra_en:'Sri Suktam / Devi Suktam', mantra_hi:'श्री सूक्तम् / देवी सूक्तम्' },
  Saturn:  { en:'Shiva / Shani / Bhairava',           hi:'शिव / शनि / भैरव',             mantra_en:'Sri Rudram / Sri Rudram Chamakam', mantra_hi:'श्री रुद्रम् / चमकम्' },
  Rahu:    { en:'Durga / Kali',                       hi:'दुर्गा / काली',                 mantra_en:'Durga Suktam / Durga Kavach',   mantra_hi:'दुर्गा सूक्तम् / दुर्गा कवच' },
  Ketu:    { en:'Ganesha',                            hi:'गणेश',                          mantra_en:'Ganapati Atharva Sheersha',     mantra_hi:'गणपति अथर्वशीर्ष' },
};

function calculateIshtaDevata(akInfo, d9Chart) {
  if (!akInfo?.planet || !d9Chart) return null;
  const akInD9 = d9Chart.planets?.[akInfo.planet];
  if (!akInD9) return null;
  const d9SignLord = SIGN_LORD[akInD9.rashi_num];
  const devata = DEVATA_MAP[d9SignLord] || DEVATA_MAP.Jupiter;
  return {
    atmakaraka: akInfo.planet,
    atmakaraka_hi: P_HI[akInfo.planet] || akInfo.planet,
    atmakaraka_degree: akInfo.degree,
    d9_sign_en: akInD9.rashi_en,
    d9_sign_hi: akInD9.rashi_hi,
    d9_sign_num: akInD9.rashi_num,
    d9_sign_lord: d9SignLord,
    ishta_devata_en: devata.en,
    ishta_devata_hi: devata.hi,
    primary_mantra_en: devata.mantra_en,
    primary_mantra_hi: devata.mantra_hi,
    method_en: 'Atmakaraka in D9 Navamsha → sign lord → Ishta Devata (Parashara BPHS)',
    method_hi: 'आत्मकारक ग्रह का D9 में राशि → राशि स्वामी → इष्ट देवता (पाराशर BPHS)',
  };
}

// ─── 3. Varga Practical Readings ─────────────────────────────────────────────

const VARGA_KARAKA = {
  d1:  { lords: ['Lagna lord'], karakas: [], topic_en: 'Overall life and personality', topic_hi: 'समग्र जीवन और व्यक्तित्व' },
  d2:  { lords: ['2nd lord'], karakas: ['Venus'], topic_en: 'Wealth and financial strength', topic_hi: 'धन और आर्थिक बल' },
  d3:  { lords: ['3rd lord'], karakas: ['Mars'], topic_en: 'Siblings, courage, short travel', topic_hi: 'भाई-बहन, साहस, लघु यात्रा' },
  d4:  { lords: ['4th lord'], karakas: ['Moon'], topic_en: 'Property, vehicles, home happiness', topic_hi: 'संपत्ति, वाहन, घर की खुशी' },
  d5:  { lords: ['5th lord'], karakas: ['Mercury', 'Jupiter'], topic_en: 'Intelligence, creativity, past-life merit', topic_hi: 'बुद्धि, रचनात्मकता और पूर्व पुण्य' },
  d7:  { lords: ['5th lord'], karakas: ['Jupiter'], topic_en: 'Children and progeny', topic_hi: 'संतान और वंश' },
  d8:  { lords: ['8th lord'], karakas: ['Saturn', 'Mars', 'Ketu'], topic_en: 'Obstacles, sudden events, longevity challenges', topic_hi: 'बाधाएं, अचानक घटनाएं, दीर्घायु चुनौतियां' },
  d9:  { lords: ['7th lord'], karakas: ['Venus', 'Jupiter'], topic_en: 'Marriage, dharma, and soul path', topic_hi: 'विवाह, धर्म और आत्म मार्ग' },
  d10: { lords: ['10th lord'], karakas: ['Sun', 'Saturn'], topic_en: 'Career, profession, and status', topic_hi: 'करियर, पेशा और प्रतिष्ठा' },
  d12: { lords: ['4th lord', '9th lord'], karakas: ['Moon', 'Sun'], topic_en: 'Parents — mother (4H) and father (9H)', topic_hi: 'माता-पिता — माता (4H) और पिता (9H)' },
  d16: { lords: ['4th lord'], karakas: ['Venus'], topic_en: 'Vehicles, conveyances, and comforts', topic_hi: 'वाहन और सुख-सुविधाएं' },
  d20: { lords: ['12th lord', '9th lord'], karakas: ['Jupiter', 'Ketu'], topic_en: 'Spiritual growth and upasana', topic_hi: 'आध्यात्मिक विकास और उपासना' },
  d24: { lords: ['4th lord', '5th lord'], karakas: ['Mercury', 'Jupiter'], topic_en: 'Education, learning, and knowledge', topic_hi: 'शिक्षा, ज्ञान और विद्या' },
  d27: { lords: ['Lagna lord'], karakas: ['Moon'], topic_en: 'Strengths, weaknesses, and vitality', topic_hi: 'बल, दुर्बलता और जीवनशक्ति' },
  d30: { lords: ['6th lord', '8th lord'], karakas: ['Saturn', 'Mars'], topic_en: 'Misfortunes, troubles, and karmic challenges', topic_hi: 'दुर्भाग्य, कठिनाइयाँ और कर्मिक चुनौतियाँ' },
  d40: { lords: ['4th lord'], karakas: ['Moon'], topic_en: 'Maternal lineage and inherited traits', topic_hi: 'मातृ पक्ष और विरासत' },
  d45: { lords: ['9th lord'], karakas: ['Sun'], topic_en: 'Paternal lineage and ancestral blessings', topic_hi: 'पितृ पक्ष और पूर्वजों का आशीर्वाद' },
  d60: { lords: ['Lagna lord'], karakas: [], topic_en: 'Prarabdha karma and past life impressions', topic_hi: 'प्रारब्ध कर्म और पूर्व जन्म संस्कार' },
};

const IMPACT_TEXT = {
  very_favorable: { en:'Auspicious — strong support and natural flow', hi:'शुभ — मजबूत सहयोग और प्राकृतिक प्रवाह' },
  favorable:      { en:'Generally positive — some effort needed',      hi:'सामान्यतः अनुकूल — थोड़ा प्रयास आवश्यक' },
  neutral:        { en:'Mixed — variable results, balance required',   hi:'मिश्रित — परिवर्तनशील फल, संतुलन आवश्यक' },
  challenging:    { en:'Challenging — needs conscious attention and remedy', hi:'चुनौतीपूर्ण — सचेत ध्यान और उपाय आवश्यक' },
};

const VARGA_PLAIN_TEXT = {
  d1:  { favorable_en:'Your overall life chart is strong. Your personality, health, and sense of direction have natural support. People see you as capable and confident. Build on this foundation by staying physically active and taking initiative.',favorable_hi:'आपकी समग्र जन्म कुंडली मजबूत है। आपके व्यक्तित्व, स्वास्थ्य और जीवन दिशा को स्वाभाविक समर्थन मिलता है।',mixed_en:'Your overall chart is balanced — real strengths exist alongside some areas needing more effort. Life direction is generally good, but health and vitality may have occasional dips that respond well to a disciplined daily routine.',mixed_hi:'आपकी समग्र कुंडली संतुलित है। जीवन दिशा आम तौर पर अच्छी है, लेकिन स्वास्थ्य में कभी-कभी उतार-चढ़ाव आ सकता है।',challenging_en:'Your overall chart shows some difficulty in health, self-confidence, or life direction. This does not prevent success — many accomplished people have challenging D1 charts because the pressure builds genuine resilience. Prioritising your physical health and mental clarity above all else is the key.',challenging_hi:'आपकी समग्र कुंडली में स्वास्थ्य, आत्मविश्वास या जीवन दिशा में कुछ कठिनाइयां हैं। शारीरिक स्वास्थ्य और मानसिक स्पष्टता को सर्वोच्च प्राथमिकता देना सबसे महत्वपूर्ण है।',benefit_en:'A strong overall chart gives you a natural edge in recovery, confidence, and personal presence. Stay physically active, maintain a steady routine, and lead in areas where you have natural authority.',benefit_hi:'मजबूत समग्र कुंडली आपको स्वास्थ्य लाभ और आत्मविश्वास में स्वाभाविक लाभ देती है।',watch_en:"When you feel out of energy or direction, check whether your Lagna lord's Dasha period is running — that is when your personal battery needs the most care.",watch_hi:'जब भी थका हुआ या दिशाहीन महसूस करें, देखें कि क्या लग्नेश की दशा चल रही है।',remedy_en:"Worship the Lagna lord's deity consistently. Early morning sunlight, physical exercise 5 days a week, and a regular sleep schedule do more for your chart strength than most other remedies combined.",remedy_hi:'लग्नेश के देवता की नियमित पूजा करें। सुबह की धूप, सप्ताह में 5 दिन व्यायाम और नियमित नींद अधिकांश उपायों से अधिक प्रभावी है।' },
  d2:  { favorable_en:'Your wealth chart shows good accumulation potential. Money can grow steadily when you invest and save consistently. You have the chart support to build real financial security — the key is discipline and starting early rather than waiting for the "right moment".',favorable_hi:'आपकी धन कुंडली अच्छी संचय क्षमता दिखाती है। नियमित निवेश और बचत से पैसा स्थिर रूप से बढ़ सकता है।',mixed_en:'Your financial chart is variable — periods of strong income will alternate with slower phases. A savings buffer and avoiding impulsive spending are especially important for you. With consistent financial habits, you can build solid security despite the fluctuations.',mixed_hi:'आपकी धन कुंडली परिवर्तनशील है। बचत का बफर रखना और आवेगपूर्ण खर्च से बचना विशेष रूप से महत्वपूर्ण है।',challenging_en:'Your wealth chart requires more deliberate effort. This does not mean financial struggle is inevitable — passive accumulation does not work for you. Proactive financial planning, diversified income, and avoiding risky speculation are essential habits.',challenging_hi:'आपकी धन कुंडली को अधिक जानबूझकर प्रयास की आवश्यकता है। आपके लिए निष्क्रिय संचय ठीक से काम नहीं करता — सक्रिय वित्तीय योजना जरूरी है।',benefit_en:'Your most reliable wealth-building phases are during Jupiter and Venus Dasha periods. Steady accumulation — savings, property, long-term investments — works far better for you than quick schemes.',benefit_hi:'गुरु और शुक्र दशा में बचत, संपत्ति, दीर्घकालिक निवेश सबसे अच्छे परिणाम देते हैं।',watch_en:'Avoid speculative investments especially during Saturn, Rahu, or challenging Dasha periods. Your chart rewards patient, consistent accumulation — not gambling.',watch_hi:'शनि, राहु या चुनौतीपूर्ण दशा में सट्टेबाजी वाले निवेशों से बचें।',remedy_en:'Lakshmi puja on Fridays, keeping your home clean and well-organised, and donating food or money on Fridays activate the wealth-giving side of this chart.',remedy_hi:'शुक्रवार को लक्ष्मी पूजा, घर साफ रखना और शुक्रवार को दान इस कुंडली के धन देने वाले पक्ष को सक्रिय करता है।' },
  d3:  { favorable_en:'Your D3 chart is positive — sibling relationships are generally supportive, and your personal courage and communication skills are real natural strengths. Short travel tends to bring good results. You have the ability to express yourself clearly and motivate others.',favorable_hi:'आपकी D3 कुंडली सकारात्मक है। भाई-बहन के संबंध आम तौर पर सहायक हैं, और संचार कौशल और साहस प्राकृतिक शक्तियां हैं।',mixed_en:'Sibling relationships show a mixed picture — genuine closeness alongside occasional friction. Your courage and communication are present but may need development in areas like public speaking or assertive negotiation.',mixed_hi:'भाई-बहन के संबंध मिश्रित हैं। साहस और संचार मौजूद है लेकिन कुछ क्षेत्रों में विकास की जरूरत है।',challenging_en:'Sibling relationships may require more effort and boundary-setting. Communication may sometimes cause misunderstandings even when well-intentioned. Focus on clear, direct expression and active listening — these skills become your strongest asset once developed.',challenging_hi:'भाई-बहन के संबंधों में अधिक प्रयास और सीमाओं की आवश्यकता हो सकती है। स्पष्ट, सीधी अभिव्यक्ति पर ध्यान दें।',benefit_en:'Writing, speaking, and hands-on skill-based work are strongly favoured by a positive D3. Building income around communication, teaching, or craftsmanship can be especially rewarding.',benefit_hi:'एक अच्छी D3 में लेखन, बोलना और कौशल-आधारित कार्य अत्यधिक अनुकूल है।',watch_en:"Mars rules courage and siblings — its Dasha can bring sibling-related events and tests of personal courage. Build your confidence proactively during calm times.",watch_hi:'मंगल दशा भाई-बहन से संबंधित घटनाएं और साहस की परीक्षाएं ला सकती है।',remedy_en:'Hanuman puja on Tuesdays and Saturdays helps sibling harmony. Regular physical discipline (exercise, martial arts, sports) activates the positive Mars energy of D3.',remedy_hi:'मंगलवार और शनिवार को हनुमान पूजा करें। नियमित शारीरिक अनुशासन D3 की मंगल ऊर्जा को सक्रिय करता है।' },
  d4:  { favorable_en:"Your property and home chart looks positive. Owning a comfortable home is well-supported. Vehicles typically come without major obstacles. Mother's health tends to be a source of emotional stability, and home happiness is genuinely achievable for you.",favorable_hi:'आपकी संपत्ति और घर की कुंडली सकारात्मक दिखती है। घर का स्वामित्व अच्छी तरह से समर्थित है।',mixed_en:"Home and property shows mixed indications — you can own property, but timing and financial planning matter more here. Domestic life will have both harmonious phases and friction. Working on communication within the home brings lasting improvement.",mixed_hi:'घर और संपत्ति में मिश्रित संकेत हैं। आप संपत्ति रख सकते हैं, लेकिन समय और वित्तीय योजना अधिक महत्वपूर्ण हैं।',challenging_en:"Property acquisition and stable home life may take longer or require more deliberate planning. Mother's health deserves regular attention. Sustained effort and grounded financial planning can still produce a secure, comfortable home.",challenging_hi:'संपत्ति अधिग्रहण और स्थिर घरेलू जीवन में अधिक समय लग सकता है। माँ के स्वास्थ्य पर नियमित ध्यान दें।',benefit_en:'Real estate is generally a good investment area for you — property tends to appreciate over your lifetime and delivers consistent results when you act during supportive Dasha periods.',benefit_hi:'रियल एस्टेट आपके लिए अच्छा निवेश क्षेत्र है — संपत्ति आपके जीवनकाल में मूल्यवृद्धि करती है।',watch_en:"When Moon's Dasha or a challenging transit pressures home life, domestic disputes or property complications tend to surface. Build emotional security within yourself first.",watch_hi:'चंद्रमा की कठिन दशा या गोचर के दौरान घरेलू विवाद या संपत्ति की जटिलताएं आ सकती हैं।',remedy_en:'Annapurna or Durga puja at home on Mondays or Fridays supports home peace. For property timing, act during Jupiter Dasha or when Jupiter transits your 4th house.',remedy_hi:'सोमवार या शुक्रवार को घर पर अन्नपूर्णा या दुर्गा पूजा करें।' },
  d5:  { favorable_en:'Your D5 chart shows strong past-life merit and creative intelligence. Your mind grasps complex ideas readily and spiritual practices give results faster for you than for most people. Creative pursuits — writing, art, music, invention — have strong chart support. This is one of your natural gifts.',favorable_hi:'आपकी D5 कुंडली मजबूत पूर्व जन्म पुण्य और रचनात्मक बुद्धि दिखाती है। आध्यात्मिक अभ्यास अधिकांश लोगों की तुलना में आपको तेज़ी से परिणाम देता है।',mixed_en:'Creative intelligence is present but may express inconsistently — some areas of thinking come with ease while others need more patience. Your past-life merit gives certain advantages, but some karmic debts here also need to be worked through.',mixed_hi:'रचनात्मक बुद्धि मौजूद है लेकिन असंगत रूप से व्यक्त हो सकती है। कुछ क्षेत्र आसानी से आते हैं जबकि अन्य को अधिक धैर्य की आवश्यकता है।',challenging_en:'Mental energy, creative output, and spiritual practice need more deliberate cultivation. This does not mean low intelligence — it means your gifts require more consistent activation. A daily learning or meditation routine is the most powerful step you can take.',challenging_hi:'मानसिक ऊर्जा, रचनात्मक उत्पादन और आध्यात्मिक अभ्यास को अधिक जानबूझकर विकास की जरूरत है। दैनिक सीखने या ध्यान की दिनचर्या सबसे शक्तिशाली कदम है।',benefit_en:'A good D5 is one of the strongest indicators for success in creative fields, education, and spiritual advancement. Make creative expression and continuous learning central to your identity — not just side hobbies.',benefit_hi:'एक अच्छी D5 रचनात्मक क्षेत्रों, शिक्षा और आध्यात्मिक प्रगति में सफलता का मजबूत संकेत है।',watch_en:'When Jupiter is weak or in a difficult Dasha phase, mental clarity and creative energy may drop. Use these periods for rest, study, and consolidation rather than launching major new projects.',watch_hi:'गुरु की कठिन दशा में मानसिक स्पष्टता और रचनात्मक ऊर्जा घट सकती है। इन अवधियों में आराम और अध्ययन करें।',remedy_en:'Saraswati mantra daily sharpens intelligence and creativity. Study sacred texts, keep a journal, or practise a creative art every day — even 15 minutes directly feeds this chart.',remedy_hi:'प्रतिदिन सरस्वती मंत्र और 15 मिनट का भी रचनात्मक अभ्यास D5 को सीधे ऊर्जा देता है।' },
  d7:  { favorable_en:"Your children's chart is generally positive. Having children is well-supported. If you already have children, they are likely to bring you genuine joy and grow into capable, well-adjusted individuals. The parent-child bond is a meaningful source of happiness.",favorable_hi:'आपकी संतान कुंडली आम तौर पर सकारात्मक है। बच्चे होना अच्छी तरह से समर्थित है। बच्चे आपको वास्तविक खुशी देने की संभावना रखते हैं।',mixed_en:"Children's matters show a mixed picture — conception or raising children may involve some delays or challenges, but the chart is not denying parenthood. Children may need more guidance and patience, but the relationship can still be deeply fulfilling.",mixed_hi:'संतान के मामले मिश्रित हैं। बच्चे होने में कुछ देरी या चुनौतियां हो सकती हैं, लेकिन कुंडली संतान को नकार नहीं रही है।',challenging_en:"Your children's chart shows areas of difficulty — there may be delays in having children, or children may face more challenges in life. If pregnancy is delayed beyond 2 years of trying, early consultation with a fertility specialist is recommended.",challenging_hi:'आपकी संतान कुंडली कठिनाइयों के क्षेत्र दिखाती है। 2 वर्षों के प्रयास के बाद देरी होने पर प्रजनन विशेषज्ञ से परामर्श लें।',benefit_en:'The best timing for having children is during Jupiter Mahadasha or Antardasha, or when Jupiter transits the 5th house from your natal Moon — this gives the best outcomes for conception and child health.',benefit_hi:'गुरु महादशा या अंतर्दशा में, या जन्म चंद्रमा से गुरु के 5वें भाव में गोचर पर बच्चे होने का सबसे अच्छा समय है।',watch_en:'Watch Rahu and Ketu transits through the 5th house carefully — these periods can bring unexpected events related to children. Keep communication with children open and honest.',watch_hi:'5वें भाव से राहु और केतु गोचर को ध्यान से देखें। इन अवधियों में बच्चों के साथ संचार खुला रखें।',remedy_en:'Worship Santana Gopala (Bal Gopal) for children\'s wellbeing. Jupiter-strengthening remedies — yellow food, Thursday fasting, Guru mantra, service to teachers — directly support D7.',remedy_hi:'संतान के कल्याण के लिए संतान गोपाल की पूजा करें। गुरुवार का व्रत, गुरु मंत्र D7 को सीधे सहारा देते हैं।' },
  d8:  { favorable_en:'Your D8 chart is relatively clear — major accidents, sudden reversals, or extreme longevity challenges are less prominent for you. Life disruptions exist for everyone, but yours tend to be more manageable and recoverable. Longevity has general support.',favorable_hi:'आपकी D8 कुंडली अपेक्षाकृत स्पष्ट है। बड़ी दुर्घटनाएं या गंभीर दीर्घायु चुनौतियां कम प्रमुख हैं। दीर्घायु को सामान्य समर्थन मिलता है।',mixed_en:'Your chart shows some susceptibility to unexpected disruptions, but not at an extreme level. Certain Dasha periods may bring sudden changes in health or finances. Health insurance, an emergency fund, and regular medical check-ups will handle most of what this chart brings.',mixed_hi:'आपकी कुंडली में अप्रत्याशित व्यवधानों के प्रति कुछ संवेदनशीलता है। स्वास्थ्य बीमा, आपातकालीन निधि और नियमित चिकित्सा जांच इसे संभाल सकती है।',challenging_en:'Your D8 chart shows a more active pattern of obstacles, sudden events, or health challenges. Extra caution during travel and physical activities is warranted. Regular medical check-ups, health insurance, an emergency fund, and not ignoring small warning signs are important safeguards for you.',challenging_hi:'आपकी D8 कुंडली बाधाओं और अचानक घटनाओं का अधिक सक्रिय पैटर्न दिखाती है। नियमित चिकित्सा जांच, स्वास्थ्य बीमा और आपातकालीन निधि महत्वपूर्ण है।',benefit_en:'D8 also rules research, occult knowledge, hidden assets, and inheritances. A challenging D8 often coincides with deep investigative or research ability — the capacity to find what is hidden. Use this as a career or spiritual strength.',benefit_hi:'D8 शोध, गुह्य ज्ञान और विरासत पर भी शासन करती है। चुनौतीपूर्ण D8 अक्सर गहरी खोजी क्षमता के साथ आती है।',watch_en:'Saturn, Mars, and Ketu Dasha periods activate D8 most strongly. Extra care in health decisions, travel, and financial risk-taking is most important during these periods. Do not skip routine medical check-ups.',watch_hi:'शनि, मंगल और केतु दशा D8 को सबसे अधिक सक्रिय करती है। इन अवधियों में स्वास्थ्य निर्णयों में अतिरिक्त सावधानी रखें।',remedy_en:'Mahamrityunjaya mantra recited daily is one of the most powerful protections for D8. Offering water at a Shiva temple on Mondays and avoiding ego-driven risk-taking are highly beneficial.',remedy_hi:'प्रतिदिन महामृत्युंजय मंत्र का जाप D8 के लिए सबसे शक्तिशाली सुरक्षाओं में से एक है। सोमवार को शिव मंदिर में जल चढ़ाएं।' },
  d9:  { favorable_en:"Your Navamsha (marriage) chart looks positive. Commitment, partnership, and building a life with someone are areas where your chart provides genuine support. Your marriage has the potential to be a source of growth, stability, and mutual elevation. Focus on communication and choosing a partner whose values match yours.",favorable_hi:'आपकी नवांश (विवाह) कुंडली सकारात्मक दिखती है। प्रतिबद्धता और साझेदारी को वास्तविक समर्थन मिलता है।',mixed_en:'Your Navamsha shows a mixed marriage picture — genuine connection and compatibility exist alongside some areas of friction. A good marriage is possible and achievable, but requires conscious effort from both partners, clear communication, and realistic expectations.',mixed_hi:'आपकी नवांश मिश्रित विवाह चित्र दिखाती है। एक अच्छा विवाह संभव है, लेकिन दोनों साझेदारों से सचेत प्रयास की आवश्यकता है।',challenging_en:"Your Navamsha points to a more challenging marriage path — there may be delays in finding the right partner, or the relationship may need sustained effort to maintain. This does not prevent a meaningful marriage. People who build the best marriages from a challenging D9 choose their partner consciously, communicate deeply, and treat the relationship as a spiritual practice.",challenging_hi:'आपकी नवांश अधिक चुनौतीपूर्ण विवाह पथ की ओर इशारा करती है। चुनौतीपूर्ण D9 से सर्वश्रेष्ठ विवाह बनाने वाले लोग साथी को सचेत रूप से चुनते हैं।',benefit_en:'The best marriage timing is during Venus or Jupiter Mahadasha, or when Jupiter transits your 7th house. For existing relationships, these same periods bring deepening and renewal.',benefit_hi:'सर्वश्रेष्ठ विवाह समय शुक्र या गुरु महादशा के दौरान होता है।',watch_en:'Rahu, Ketu, and Saturn Dasha periods can create instability in partnerships. Avoid major relationship decisions made from frustration during these periods — the pressure is temporary, but the decisions are permanent.',watch_hi:'राहु, केतु और शनि दशा में निराशा से लिए गए बड़े रिश्ते के फैसलों से बचें।',remedy_en:"Worship Lakshmi-Narayan together on Fridays. Venus strengthening (white offerings, beauty in the home, acts of love) directly supports D9. If single, Katyayani Devi mantra is prescribed for finding a worthy partner.",remedy_hi:'शुक्रवार को लक्ष्मी-नारायण की पूजा करें। यदि अविवाहित हैं, तो कात्यायनी देवी मंत्र योग्य साथी खोजने के लिए निर्धारित है।' },
  d10: { favorable_en:'Your career chart is strong. Professional recognition, authority, and status growth are supported. You have the potential to find a career where you genuinely lead or build something lasting. The most rewarding path for you will involve real responsibility — not just a job, but a role where you are taken seriously.',favorable_hi:'आपकी करियर कुंडली मजबूत है। व्यावसायिक पहचान, अधिकार और स्थिति वृद्धि समर्थित है।',mixed_en:'Your career chart shows mixed indications — productive phases and periods of stagnation or change will alternate. Multiple career directions are possible. Identify your core skill and build on it consistently across the changes.',mixed_hi:'आपकी करियर कुंडली मिश्रित है। उत्पादक चरण और ठहराव बारी-बारी आएंगे। मुख्य कौशल की पहचान करें।',challenging_en:'Your career chart requires sustained, disciplined effort over many years. Quick recognition is unlikely — your chart rewards mastery, persistence, and integrity. Authority and respect come later than peers but only through genuine competence. What you build this way is durable and real.',challenging_hi:'आपकी करियर कुंडली को कई वर्षों तक निरंतर, अनुशासित प्रयास की आवश्यकता है। महारत, दृढ़ता और ईमानदारी को पुरस्कृत करती है।',benefit_en:'Best career growth comes during Sun and Saturn Dasha periods — Sun brings visibility and authority, Saturn brings durable achievement. Time your major career moves to these periods.',benefit_hi:'सूर्य और शनि दशा में सर्वश्रेष्ठ करियर वृद्धि आती है। इन अवधियों में प्रमुख करियर कदम उठाएं।',watch_en:"Never compromise your professional ethics for short-term gains — for a D10 chart, reputation damage is extremely hard to recover from. Also avoid working so hard on career that health and family are neglected.",watch_hi:'अल्पकालिक लाभ के लिए व्यावसायिक नैतिकता से समझौता कभी न करें — D10 में प्रतिष्ठा को हुई क्षति से उबरना बेहद मुश्किल है।',remedy_en:'Surya Namaskar at sunrise daily and the Gayatri mantra are the most powerful D10 remedies. Mentor others in your field — giving knowledge amplifies career karma.',remedy_hi:'प्रतिदिन सूर्योदय पर सूर्य नमस्कार और गायत्री मंत्र D10 के सबसे शक्तिशाली उपाय हैं।' },
  d12: { favorable_en:"Your parents' chart shows generally positive indications — both parents are likely to have reasonable longevity and a supportive role in your life. The parental environment was relatively stable. Your relationship with parents is likely to be meaningful and emotionally connected.",favorable_hi:'आपकी माता-पिता की कुंडली आम तौर पर सकारात्मक संकेत दिखाती है। दोनों माता-पिता आपके जीवन में सहायक भूमिका के लिए संकेतित हैं।',mixed_en:'One parent may have faced more health challenges than the other. Your relationship with parents likely has both very close phases and periods of distance. Deliberate effort during family gatherings and keeping communication open is especially important.',mixed_hi:'एक माता-पिता को दूसरे की तुलना में अधिक चुनौतियों का सामना करना पड़ सकता है। माता-पिता के साथ संचार खुला रखना महत्वपूर्ण है।',challenging_en:"Your parents' chart shows challenges — there may be health concerns for one or both parents, or a relationship requiring significant navigation. Regular prayers and ancestral rituals (Pitru Tarpan, Shraddha) are especially beneficial here.",challenging_hi:'आपकी माता-पिता की कुंडली चुनौतियां दिखाती है। नियमित पितृ तर्पण और श्राद्ध विशेष रूप से लाभकारी हैं।',benefit_en:'Parental blessings from a positive D12 show up as timely help, protection in difficult moments, and an inner sense of being looked after even when circumstances are hard.',benefit_hi:'सकारात्मक D12 से माता-पिता के आशीर्वाद समय पर मदद और कठिन क्षणों में सुरक्षा के रूप में प्रकट होते हैं।',watch_en:"Sun rules the father, Moon rules the mother. When either runs in a difficult Dasha or receives a heavy transit, plan that parent's health check-ups proactively rather than waiting for a problem.",watch_hi:'सूर्य पिता और चंद्रमा माता पर शासन करता है। कठिन दशा में उस माता-पिता की स्वास्थ्य जांच पहले से योजना बनाएं।',remedy_en:'Pitru Tarpan on Amavasya and Shraddha during Pitru Paksha are the most powerful D12 remedies. Serving elderly people and feeding crows on Saturdays also helps significantly.',remedy_hi:'अमावस्या पर पितृ तर्पण और पितृ पक्ष में श्राद्ध D12 के सबसे शक्तिशाली उपाय हैं।' },
  d16: { favorable_en:'Material comforts, vehicles, and home conveniences come with relatively little struggle. You are likely to enjoy good quality of living, and vehicle acquisition tends to go smoothly. Your home environment tends to be pleasant and well-equipped.',favorable_hi:'आपकी कुंडली में भौतिक सुख-सुविधाएं और वाहन अपेक्षाकृत कम संघर्ष के साथ आते हैं।',mixed_en:'Material comforts are available but may require more deliberate planning and saving. Vehicles may have occasional maintenance issues — careful budgeting before major purchases helps.',mixed_hi:'भौतिक सुख-सुविधाएं उपलब्ध हैं लेकिन अधिक सुविचारित योजना की आवश्यकता है। वाहनों में कभी-कभी रखरखाव की समस्याएं हो सकती हैं।',challenging_en:'Accumulating good vehicles and luxury comforts may take longer or require more deliberate saving. Avoid emotionally-driven vehicle purchases — timing and careful selection matter more for you.',challenging_hi:'अच्छे वाहन और विलासिता जमा करने में अधिक समय लग सकता है। भावनात्मक रूप से प्रेरित वाहन खरीद से बचें।',benefit_en:"A positive D16 contributes significantly to your day-to-day happiness — good physical surroundings, comfortable transport, and a pleasant home environment directly support your mental peace and productivity.",benefit_hi:'एक सकारात्मक D16 आपकी दैनिक खुशी और मानसिक शांति में महत्वपूर्ण योगदान देती है।',watch_en:'During a difficult Venus Dasha or when Saturn or Rahu transits Venus, vehicle issues or unexpected household expenses tend to manifest. Keep an emergency maintenance fund for these periods.',watch_hi:'कठिन शुक्र दशा या शनि/राहु के शुक्र से गोचर में वाहन समस्याएं और खर्च आ सकते हैं।',remedy_en:'Venus strengthening — Lakshmi puja, white flowers, pleasant music, keeping your space clean and beautiful — directly activates D16.',remedy_hi:'लक्ष्मी पूजा, सफेद फूल, अपनी जगह साफ और सुंदर रखना D16 को सीधे सक्रिय करता है।' },
  d20: { favorable_en:'Your spiritual chart is strong — devotional or meditative practices produce results for you faster than for most people. You have a genuine inner calling that, when followed consistently, leads to real peace and spiritual progress. Mantras, puja, and service are highly effective for you.',favorable_hi:'आपकी आध्यात्मिक कुंडली मजबूत है। भक्ति या ध्यान अभ्यास आपके लिए तेज़ी से परिणाम देते हैं। मंत्र, पूजा और सेवा अत्यधिक प्रभावी हैं।',mixed_en:'Spiritual growth is present but may be inconsistent — some practices work well while others feel forced. Finding the right form of practice for your temperament matters more than following a fixed system.',mixed_hi:'आध्यात्मिक विकास मौजूद है लेकिन असंगत हो सकता है। अपने स्वभाव के लिए सही अभ्यास का रूप खोजना अधिक महत्वपूर्ण है।',challenging_en:"Formal spiritual disciplines may feel difficult to maintain. This is not a lack of spiritual capacity — it's an invitation to find simple, authentic practices that fit your daily life. Even 10 minutes of genuine prayer daily is more powerful than an elaborate practice you abandon after two weeks.",challenging_hi:'औपचारिक आध्यात्मिक अनुशासन बनाए रखना मुश्किल लग सकता है। प्रतिदिन 10 मिनट की वास्तविक प्रार्थना दो सप्ताह बाद छोड़े गए विस्तृत अभ्यास से अधिक शक्तिशाली है।',benefit_en:'A strong D20 is one of the clearest indicators of genuine moksha-seeking capacity — real inner peace, liberation from harmful patterns, and a deep sense of meaning. This is available to you in this lifetime.',benefit_hi:'एक मजबूत D20 वास्तविक मोक्ष-साधना क्षमता का स्पष्ट संकेत है — वास्तविक आंतरिक शांति इस जीवनकाल में आपके लिए उपलब्ध है।',watch_en:'The Ketu Dasha period is the most spiritually transformative — but it can bring confusion or purposelessness if you are not grounded in practice before it begins.',watch_hi:'केतु दशा आध्यात्मिक रूप से सबसे परिवर्तनकारी है। इससे पहले अपना अभ्यास शुरू कर लें।',remedy_en:"Whatever your tradition — mantra, dhyana, seva, or simple daily prayer — do it every single day without exception. Find your Ishta Devata from your Navamsha and worship that form exclusively.",remedy_hi:'मंत्र, ध्यान, सेवा या सरल दैनिक प्रार्थना — इसे हर दिन बिना अपवाद के करें।' },
  d24: { favorable_en:"Your education chart is strong — academic and professional learning produces concrete results for you. Knowledge accumulates and builds upon itself over time. You are well-supported to become genuinely expert in your field. The more you invest in learning, the greater the return.",favorable_hi:'आपकी शिक्षा कुंडली मजबूत है। शैक्षणिक और व्यावसायिक शिक्षा ठोस परिणाम देती है। आप अपने क्षेत्र में विशेषज्ञ बन सकते हैं।',mixed_en:"Education shows a mixed picture — some subjects come naturally while others need more effort. Practical, self-directed learning works far better for you than abstract theory. Real-world application of knowledge is where you shine.",mixed_hi:'शिक्षा मिश्रित चित्र दिखाती है। व्यावहारिक, स्व-निर्देशित शिक्षा आपके लिए अमूर्त सिद्धांत से बेहतर है।',challenging_en:'Building knowledge in a specialised field takes more time and deliberate effort. The approach that works best: patient, structured, methodical study — not cramming or shortcuts. Depth over breadth always works better for your D24.',challenging_hi:'एक विशेष क्षेत्र में ज्ञान बनाने में अधिक समय लगता है। धैर्यपूर्ण, संरचित अध्ययन — शॉर्टकट नहीं।',benefit_en:'Mercury and Jupiter Dasha periods are most productive for education and learning breakthroughs. Plan major study investments, degree programs, or professional certifications during these periods.',benefit_hi:'बुध और गुरु दशा शिक्षा और ज्ञान में सफलताओं के लिए सबसे उत्पादक हैं।',watch_en:'Maintaining focus in one learning direction matters more than exploring widely. Avoid switching between too many subjects simultaneously — depth produces results that breadth cannot.',watch_hi:'एक दिशा में सीखने में ध्यान बनाए रखना व्यापक अन्वेषण से अधिक महत्वपूर्ण है।',remedy_en:"Worship Saraswati daily and study something meaningful every single day — even 20 minutes of focused learning activates D24 more consistently than occasional marathon sessions.",remedy_hi:'प्रतिदिन सरस्वती की पूजा करें और प्रतिदिन 20 मिनट का केंद्रित अध्ययन करें।' },
  d27: { favorable_en:"Your core vitality and natural strengths chart is solid. You have real areas of innate excellence that, when consciously channeled, produce strong, reliable results. Physical resilience is generally good. Your body tends to recover well from illness or stress, and your natural gifts are a genuine competitive advantage.",favorable_hi:'आपकी मुख्य जीवनशक्ति की कुंडली ठोस है। जानबूझकर उपयोग करने पर आपकी सहज उत्कृष्टता मजबूत, विश्वसनीय परिणाम देती है।',mixed_en:"A mixed vitality chart means you have genuine strengths alongside some vulnerabilities. Your best areas of natural talent are clear but may be underused. Doubling down on these specific strengths — rather than trying to fix weaknesses — is the highest-value investment you can make.",mixed_hi:'मिश्रित जीवनशक्ति कुंडली का मतलब है कि आपके पास शक्तियों के साथ कुछ कमजोरियां भी हैं। अपनी विशिष्ट शक्तियों पर दोगुना ध्यान देना सबसे मूल्यवान निवेश है।',challenging_en:"Core vitality and physical resilience need deliberate, consistent building. Regular physical exercise is not optional for you — it is one of your most important remedies. Identify your actual strengths and work in those areas — this compensates more effectively than anything else.",challenging_hi:'मुख्य जीवनशक्ति को जानबूझकर, निरंतर निर्माण की जरूरत है। नियमित शारीरिक व्यायाम आपके लिए वैकल्पिक नहीं है।',benefit_en:'Knowing your natural strengths from D27 helps you stop wasting energy trying to be good at everything and instead go all-in on what the chart genuinely supports. This focus produces disproportionate results.',benefit_hi:'D27 से प्राकृतिक शक्तियों को जानना आपको उन पर ध्यान केंद्रित करने में मदद करता है जिन्हें कुंडली वास्तव में समर्थन करती है।',watch_en:'Track your energy levels through lunar cycles — you may find you are naturally more productive during certain moon phases. Align important work with your natural cycles rather than fighting them.',watch_hi:'चंद्र चक्रों के माध्यम से अपने ऊर्जा स्तरों को ट्रैक करें। महत्वपूर्ण कार्य को अपने प्राकृतिक चक्रों के साथ संरेखित करें।',remedy_en:'Build vitality through consistent daily practices: sleep before 11pm, 30 minutes of morning movement, reducing processed food. These do more for your chart strength than most remedies.',remedy_hi:'रात 11 बजे से पहले सोना, 30 मिनट की सुबह की गतिविधि, प्रसंस्कृत भोजन कम करना — ये अधिकांश उपायों से अधिक प्रभावी हैं।' },
  d30: { favorable_en:"Your D30 chart shows relatively lighter misfortune indications. Major calamities or heavy karmic debts from past lives are less dominant. Life difficulties exist for everyone, but yours tend to be more proportionate and recoverable with effort.",favorable_hi:'D30 कुंडली आपके लिए अपेक्षाकृत हल्के संकेत दिखाती है। बड़ी आपदाएं या भारी कर्म ऋण कम प्रमुख हैं।',mixed_en:"Some karmic challenges are clearly present — certain life periods will feel genuinely heavy or difficult. But the overall load is not extreme, and these challenges are specifically shown so you can address them through right action, spiritual practice, and service.",mixed_hi:'कुछ कर्मिक चुनौतियां स्पष्ट रूप से मौजूद हैं। लेकिन समग्र कर्मिक भार अत्यधिक नहीं है।',challenging_en:"Your D30 shows significant karmic weight — certain life areas may involve suffering that feels disproportionate. The tradition is clear: prayer, non-harming, service to others, and charitable giving measurably reduce the intensity of D30 challenges over time. This chart, worked consciously, produces deep wisdom.",challenging_hi:'आपकी D30 महत्वपूर्ण कर्मिक भार दिखाती है। प्रार्थना, अहिंसा, सेवा और दान D30 चुनौतियों की तीव्रता को समय के साथ मापनीय रूप से कम करते हैं।',benefit_en:"People with significant D30 challenges often develop extraordinary compassion, emotional depth, and wisdom — not despite the suffering, but because of it. This chart, worked consciously, produces a truly mature and wise person.",benefit_hi:'महत्वपूर्ण D30 चुनौतियों वाले लोग असाधारण करुणा, भावनात्मक गहराई और ज्ञान विकसित करते हैं।',watch_en:'Saturn and Mars running together in Dasha periods activate D30 most heavily. Avoid major legal risks, maintain health vigilantly, and increase spiritual practice during these periods.',watch_hi:'शनि और मंगल एक साथ दशा में D30 को सबसे अधिक सक्रिय करते हैं। आध्यात्मिक अभ्यास बढ़ाएं।',remedy_en:'Shani puja on Saturdays, service to the elderly and disadvantaged, and donating oil or black sesame are primary D30 remedies. Consistent charitable giving reduces karmic burden measurably.',remedy_hi:'शनिवार को शनि पूजा, बुजुर्गों की सेवा और तेल या काले तिल का दान प्राथमिक D30 उपाय हैं।' },
  d40: { favorable_en:"Your maternal lineage chart is positive — you carry helpful traits, karmic merit, and ancestral blessings from your mother's family. This shows up as inherited strengths in emotional intelligence, natural abilities, or qualities cultivated across generations on the maternal side.",favorable_hi:"आपकी मातृ वंश कुंडली सकारात्मक है। माँ के परिवार से सहायक गुण, कर्म पुण्य और पूर्वज आशीर्वाद मिलते हैं।",mixed_en:"Your maternal lineage carries a mix of helpful traits and karmic patterns needing more work. Some inherited emotional tendencies or health patterns from the maternal line may need conscious transformation rather than passive continuation.",mixed_hi:"मातृ वंश में सहायक गुणों और कर्मिक पैटर्न का मिश्रण है। माँ की ओर से कुछ भावनात्मक रुझानों को सचेत परिवर्तन की जरूरत है।",challenging_en:"Your maternal lineage chart shows more challenging inherited patterns. Recognising emotional, health-related, or behavioural patterns from the mother's side is the first step. Healing work focused on maternal relationships or ancestral clearing can break these cycles.",challenging_hi:"मातृ वंश कुंडली अधिक चुनौतीपूर्ण पैटर्न दिखाती है। माँ की ओर से भावनात्मक या स्वास्थ्य पैटर्न को पहचानना पहला कदम है।",benefit_en:"Positive maternal karma shows up as real natural gifts — often in emotional intelligence, nurturing ability, intuition, or a specific talent cultivated across generations in your mother's family.",benefit_hi:"सकारात्मक मातृ कर्म भावनात्मक बुद्धिमत्ता, पोषण क्षमता या सहज ज्ञान में प्रकट होता है।",watch_en:"Unhelpful patterns from the maternal line often surface most clearly in early adult life (before 35). If you find yourself repeating emotional or health tendencies from your mother's family, those are D40 signals worth addressing.",watch_hi:"मातृ पक्ष के अनुपयोगी पैटर्न 35 वर्ष से पहले सबसे स्पष्ट रूप से सामने आते हैं।",remedy_en:"Perform ancestral rituals for the maternal line specifically during new moons. Honour your mother or mother-figures tangibly. Chandra beej mantra and offerings to the Moon on Mondays strengthen this lineage.",remedy_hi:"नए चाँद पर मातृ पक्ष के लिए अनुष्ठान करें। सोमवार को चंद्र बीज मंत्र और चंद्रमा को भेंट इस वंश को मजबूत करती है।" },
  d45: { favorable_en:"Your paternal lineage chart shows positive inherited energy — ancestral blessings, dharmic merit, and helpful character traits from the father's side flow through to you. This often appears as natural authority, discipline, or a specific ability that runs in the paternal family line.",favorable_hi:"आपकी पितृ वंश कुंडली सकारात्मक विरासत ऊर्जा दिखाती है। पूर्वज आशीर्वाद और सहायक चरित्र गुण पिता की ओर से आते हैं।",mixed_en:"The paternal lineage carries both positive traits and some karmic debts. You may have inherited both genuine strengths and tendencies from the father's side that take more work to integrate or transform.",mixed_hi:"पितृ वंश में सकारात्मक गुण और कुछ कर्म ऋण दोनों हैं।",challenging_en:"Challenging D45 indicates heavier karmic debts or difficult patterns from the father's family. Father-relationship healing, Pitru Tarpan, and Sun/Saturn propitiations are specifically helpful. Building your own identity distinct from family burden is empowering.",challenging_hi:"चुनौतीपूर्ण D45 पिता के परिवार की ओर से भारी कर्म ऋण दर्शाती है। पितृ तर्पण और शनि/सूर्य की पूजा विशेष रूप से सहायक है।",benefit_en:"The positive gifts of D45 — discipline, authority, work ethic, or specific professional talent — become more available as you consciously honour and integrate the best of what your paternal line has built.",benefit_hi:"D45 के सकारात्मक उपहार — अनुशासन, अधिकार, कार्य नैतिकता — तब अधिक उपलब्ध होते हैं जब आप पितृ पक्ष के सर्वश्रेष्ठ को सचेत रूप से सम्मानित करते हैं।",watch_en:"Sun Dasha and transit challenges often activate D45 patterns — father-related events or a reckoning with inherited patterns. Use these periods as growth opportunities rather than crises.",watch_hi:"सूर्य दशा और गोचर चुनौतियां D45 पैटर्न को सक्रिय करती हैं। इन अवधियों को विकास के अवसरों के रूप में उपयोग करें।",remedy_en:"Pitru Tarpan on Amavasya and Pitru Paksha, Surya Namaskar daily, and the Gayatri mantra honour the Sun and activate positive paternal karma.",remedy_hi:"अमावस्या और पितृ पक्ष पर पितृ तर्पण, प्रतिदिन सूर्य नमस्कार और गायत्री मंत्र सकारात्मक पितृ कर्म को सक्रिय करते हैं।" },
  d60: { favorable_en:"Your Shashtiamsha (D60) shows positive past-life karma. The soul has carried forward more merit than debt. You may find that certain things come somewhat more naturally — as if remembered from before. Important opportunities may arrive at fortunate moments that seem like luck, but are actually past-life merit.",favorable_hi:"आपकी षष्ट्यंश (D60) सकारात्मक पूर्व जन्म कर्म दिखाती है। आत्मा ने ऋण से अधिक पुण्य आगे लाया है।",mixed_en:"Past-life karma is mixed — some life areas carry forward merit while others carry patterns that need working through. You may find certain areas flowing easily while others feel stuck or karmic. This chart shows exactly what needs healing and what has already been built.",mixed_hi:"पूर्व जन्म कर्म मिश्रित है। जीवन के कुछ क्षेत्र पुण्य और अन्य कर्म पैटर्न लेकर आते हैं।",challenging_en:"Significant karmic weight is carried from past lives — you are here for deep clearing, healing, and growth. People with challenging D60 who take up genuine spiritual practice often make remarkable progress — the depth of the challenge matches the depth of the transformation available.",challenging_hi:"पूर्व जीवन से महत्वपूर्ण कर्मिक भार लाया गया है। जो लोग वास्तविक आध्यात्मिक अभ्यास अपनाते हैं वे उल्लेखनीय प्रगति करते हैं।",benefit_en:"Past-life merit shows up as timely protection, natural gifts, and inner guidance that others may lack — the moments when everything works out 'by coincidence.' These are the reward of past good actions.",benefit_hi:"पूर्व जन्म पुण्य समय पर सुरक्षा, प्राकृतिक उपहारों और आंतरिक मार्गदर्शन के रूप में प्रकट होता है।",watch_en:"Karmic debts become most visible during their trigger planets' Dasha periods. Rather than resisting, treat these as the universe asking you to settle accounts through service, honesty, and compassion.",watch_hi:"कर्मिक ऋण दशा में अपने ट्रिगर ग्रहों के दौरान सबसे अधिक दिखाई देते हैं। सेवा, ईमानदारी और करुणा से खातों को निपटाएं।",remedy_en:"D60 responds most powerfully to authentic spiritual practice and anonymous charitable giving. The Navagrah Suktam and Mahamrityunjaya mantra recited with genuine feeling do more than any ritual alone.",remedy_hi:"D60 प्रामाणिक आध्यात्मिक अभ्यास और गुमनाम दान पर सबसे शक्तिशाली प्रतिक्रिया देती है। नवग्रह सूक्तम और महामृत्युंजय मंत्र वास्तविक भावना के साथ।" },
};

function buildVargaGuidance(slug, info, findings, overall) {
  const positive    = findings.filter((f) => ['very_favorable', 'favorable'].includes(f.impact));
  const challenging = findings.filter((f) => f.impact === 'challenging');
  const chart       = VARGA_PLAIN_TEXT[slug] || {};
  const topic       = info.topic_en;
  const topicHi     = info.topic_hi;

  // Short verdict badge
  const verdict_en = overall === 'favorable' ? 'Looking Good' : overall === 'mixed' ? 'Mixed Picture' : 'Needs Attention';
  const verdict_hi = overall === 'favorable' ? 'अच्छा दिख रहा है' : overall === 'mixed' ? 'मिश्रित स्थिति' : 'ध्यान दें';

  const role_en = overall === 'favorable'
    ? `Your ${topic.toLowerCase()} chart looks supportive — you have natural strength here.`
    : overall === 'mixed'
    ? `Your ${topic.toLowerCase()} chart is balanced — effort and good timing matter more here.`
    : `Your ${topic.toLowerCase()} chart needs care — disciplined action and remedies are recommended.`;
  const role_hi = overall === 'favorable'
    ? `आपकी ${topicHi} कुंडली सकारात्मक दिखती है।`
    : overall === 'mixed'
    ? `आपकी ${topicHi} कुंडली संतुलित है।`
    : `आपकी ${topicHi} कुंडली में ध्यान चाहिए।`;

  // Use per-chart specific text, fall back to generic if slug not in lookup
  const user_summary_en = chart[`${overall}_en`] || (overall === 'favorable'
    ? `Your ${topic.toLowerCase()} chart shows supportive indicators. The key planets for this area are well-placed, giving you natural support to build on.`
    : overall === 'mixed'
    ? `Your ${topic.toLowerCase()} chart is mixed — some areas work in your favour while others need more conscious effort. Good outcomes are achievable with the right approach.`
    : `Your ${topic.toLowerCase()} chart points to areas needing deliberate care. This is not a denial of results — your chart is asking for more discipline, patience, and consistent remedies.`);
  const user_summary_hi = chart[`${overall}_hi`] || (overall === 'favorable'
    ? `आपकी ${topicHi} कुंडली में सहायक संकेत हैं।`
    : overall === 'mixed'
    ? `आपकी ${topicHi} कुंडली मिश्रित है।`
    : `आपकी ${topicHi} कुंडली में सचेत ध्यान की जरूरत है।`);

  const benefit_en = chart.benefit_en || (positive.length > 0
    ? `This area has chart support — focus your effort here and results will follow.`
    : `Consistent effort in this area can produce results even without strong initial support.`);
  const benefit_hi = chart.benefit_hi || (positive.length > 0
    ? `इस क्षेत्र को कुंडली का समर्थन मिलता है।`
    : `इस क्षेत्र में निरंतर प्रयास परिणाम दे सकता है।`);
  const watch_en = chart.watch_en || (challenging.length > 0
    ? `This area may have phases of delay or pressure. Patience and consistent remedies work better than forcing results.`
    : `Keep a steady approach here — confirm important decisions with your Dasha timing.`);
  const watch_hi = chart.watch_hi || (challenging.length > 0
    ? `इस क्षेत्र में विलंब या दबाव के दौर आ सकते हैं।`
    : `यहाँ स्थिर दृष्टिकोण रखें।`);
  const remedy_en = chart.remedy_en || (challenging.length > 0
    ? `Strengthen this area through regular mantra, acts of service, and disciplined daily habits. Consistent small actions compound into real improvement over 6–18 months.`
    : `Maintain positive energy here by staying grateful, acting with integrity, and not taking this area for granted.`);
  const remedy_hi = chart.remedy_hi || (challenging.length > 0
    ? `नियमित मंत्र, सेवा और अनुशासित दैनिक आदतों के माध्यम से इस क्षेत्र को मजबूत करें।`
    : `आभारी रहकर और ईमानदारी से कर्म करके सकारात्मक ऊर्जा बनाए रखें।`);

  return {
    role_en, role_hi, user_summary_en, user_summary_hi, verdict_en, verdict_hi,
    benefits:     [{ en: benefit_en, hi: benefit_hi }],
    watch_points: [
      { en: watch_en, hi: watch_hi },
      { en: 'Results of this chart are felt most strongly when its key planet runs in Mahadasha or Antardasha. Note those periods and act accordingly.', hi: 'इस वर्ग के परिणाम सबसे अधिक तब महसूस होते हैं जब इसका मुख्य ग्रह महादशा या अंतर्दशा में चले।' },
    ],
    remedies: [{ en: remedy_en, hi: remedy_hi }],
  };
}

function getVargaReadings(slug, vargaChart, birthChart) {
  if (!vargaChart || !birthChart?.ascendant) return null;
  const info = VARGA_KARAKA[slug];
  if (!info) return null;

  const ascNum = vargaChart.ascendant?.rashi_num || birthChart.ascendant.rashi_num;
  const findings = [];

  // Lagna reading
  const lagnaSign = vargaChart.ascendant;
  if (lagnaSign) {
    const lagnaLord = SIGN_LORD[lagnaSign.rashi_num];
    const llInVarga = vargaChart.planets?.[lagnaLord];
    if (llInVarga) {
      const h = houseFrom(ascNum, llInVarga.rashi_num);
      const fav = houseFav(h);
      const ds = dignityScore(llInVarga.dignity);
      findings.push({
        label_en: `${info.topic_en} — Lagna Lord (${lagnaLord})`,
        label_hi: `${info.topic_hi} — लग्नेश (${P_HI[lagnaLord] || lagnaLord})`,
        value_en: `${lagnaLord} in ${llInVarga.rashi_en} (house ${h}) · ${llInVarga.dignity || 'Neutral'}`,
        value_hi: `${P_HI[lagnaLord] || lagnaLord} ${llInVarga.rashi_hi || llInVarga.rashi_en} में (भाव ${h}) · ${llInVarga.dignity || 'सामान्य'}`,
        impact: fav,
        impact_en: IMPACT_TEXT[fav].en,
        impact_hi: IMPACT_TEXT[fav].hi,
        strength_en: dignityLabel(ds).en,
        strength_hi: dignityLabel(ds).hi,
      });
    }
  }

  // Key karaka readings
  for (const karaka of (info.karakas || [])) {
    const kp = vargaChart.planets?.[karaka];
    if (!kp) continue;
    const h = houseFrom(ascNum, kp.rashi_num);
    const fav = houseFav(h);
    const ds = dignityScore(kp.dignity);
    findings.push({
      label_en: `Key significator — ${karaka}`,
      label_hi: `मुख्य कारक — ${P_HI[karaka] || karaka}`,
      value_en: `${karaka} in ${kp.rashi_en} (house ${h}) · ${kp.dignity || 'Neutral'}`,
      value_hi: `${P_HI[karaka] || karaka} ${kp.rashi_hi || kp.rashi_en} में (भाव ${h}) · ${kp.dignity || 'सामान्य'}`,
      impact: fav,
      impact_en: IMPACT_TEXT[fav].en,
      impact_hi: IMPACT_TEXT[fav].hi,
      strength_en: dignityLabel(ds).en,
      strength_hi: dignityLabel(ds).hi,
    });
  }

  // D2 special: Sun Hora / Moon Hora analysis
  if (slug === 'd2') {
    const lagnaInD2 = vargaChart.ascendant?.rashi_num;
    // In D2 only 2 signs exist: Cancer (Moon Hora) or Leo (Sun Hora)
    if (lagnaInD2) {
      const horaType = lagnaInD2 === 4 ? 'Moon Hora' : lagnaInD2 === 5 ? 'Sun Hora' : `Sign ${lagnaInD2}`;
      const horaHi = lagnaInD2 === 4 ? 'चंद्र होरा' : lagnaInD2 === 5 ? 'सूर्य होरा' : `राशि ${lagnaInD2}`;
      findings.push({
        label_en: 'D2 Lagna Type',
        label_hi: 'D2 लग्न प्रकार',
        value_en: `${horaType} — ${lagnaInD2 === 5 ? 'Paternal/earned wealth, career-driven income' : 'Maternal/inherited wealth, nurturing abundance'}`,
        value_hi: `${horaHi} — ${lagnaInD2 === 5 ? 'पैतृक/अर्जित धन, करियर आधारित आय' : 'मातृ/विरासत धन, पोषण आधारित प्रचुरता'}`,
        impact: 'favorable',
        impact_en: IMPACT_TEXT.favorable.en,
        impact_hi: IMPACT_TEXT.favorable.hi,
      });
    }
  }

  // D9 special: AK planet if available
  if (slug === 'd9' && birthChart._atmakaraka) {
    const ak = birthChart._atmakaraka.planet;
    const akInD9 = vargaChart.planets?.[ak];
    if (akInD9) {
      const h = houseFrom(ascNum, akInD9.rashi_num);
      const fav = houseFav(h);
      findings.push({
        label_en: `Atmakaraka (${ak}) in D9`,
        label_hi: `आत्मकारक (${P_HI[ak] || ak}) D9 में`,
        value_en: `${ak} in ${akInD9.rashi_en} (house ${h}) — soul purpose house in Navamsha`,
        value_hi: `${P_HI[ak] || ak} ${akInD9.rashi_hi || akInD9.rashi_en} में (भाव ${h}) — नवांश में आत्म-उद्देश्य भाव`,
        impact: fav,
        impact_en: IMPACT_TEXT[fav].en,
        impact_hi: IMPACT_TEXT[fav].hi,
        is_atmakaraka: true,
      });
    }
  }

  // Overall summary
  const allImpacts = findings.map((f) => f.impact);
  const favorableCount = allImpacts.filter((i) => i === 'very_favorable' || i === 'favorable').length;
  const overall = findings.length === 0
    ? 'mixed'
    : favorableCount >= findings.length * 0.6 ? 'favorable' : favorableCount >= findings.length * 0.4 ? 'mixed' : 'challenging';
  const guidance = buildVargaGuidance(slug, info, findings, overall);

  return {
    slug,
    topic_en: info.topic_en,
    topic_hi: info.topic_hi,
    findings,
    ...guidance,
    overall_en: overall === 'favorable' ? 'This chart area shows positive trends' : overall === 'mixed' ? 'Mixed results — conscious effort needed' : 'Challenges present — use remedies',
    overall_hi: overall === 'favorable' ? 'यह वर्ग क्षेत्र सकारात्मक संकेत दिखाता है' : overall === 'mixed' ? 'मिश्रित फल — सचेत प्रयास आवश्यक' : 'चुनौतियाँ हैं — उपाय करें',
    overall_status: overall,
  };
}

// ─── 5. D60 Past-Life Analysis ────────────────────────────────────────────────

function signOfHouse(ascNum, h) { return ((ascNum - 1 + h - 1) % 12) + 1; }

function planetsInHouseList(planets, ascNum, h) {
  const hs = signOfHouse(ascNum, h);
  return Object.entries(planets).filter(([, p]) => p.rashi_num === hs).map(([n]) => n);
}

function primaryPlanetForHouse(planets, ascNum, h) {
  const lord = SIGN_LORD[signOfHouse(ascNum, h)];
  const inHouse = planetsInHouseList(planets, ascNum, h);
  if (!inHouse.length) return lord;
  const PRIO = ['Jupiter','Venus','Moon','Sun','Mercury','Mars','Saturn','Rahu','Ketu'];
  return inHouse.slice().sort((a, b) => PRIO.indexOf(a) - PRIO.indexOf(b))[0];
}

const D60_LAGNA_PAST_LIFE = {
  1:  { en:'In your past life you were a bold, courageous person — likely a warrior, soldier, pioneer, or leader who acted first and thought later. Raw courage, uncompromising initiative, and physical action defined you.', hi:'पूर्व जन्म में आप साहसी, निर्भीक थे — योद्धा, सैनिक, या अग्रदूत जो पहले कर्म करते और बाद में सोचते थे।' },
  2:  { en:'In your past life you were a stable, patient, material-minded person — a farmer, merchant, or skilled artisan who valued land, family, and security. Persistence and reliability were your hallmarks.', hi:'पूर्व जन्म में आप स्थिर, धैर्यवान थे — किसान, व्यापारी या कारीगर जो भूमि, धन और परिवार को महत्व देते थे।' },
  3:  { en:'In your past life you were an intelligent, communicative person — a trader, scribe, scholar, or messenger who thrived on information, versatility, and clever speech.', hi:'पूर्व जन्म में आप बुद्धिमान और वाकपटु थे — व्यापारी, लेखक, विद्वान या दूत।' },
  4:  { en:'In your past life you were deeply nurturing and protective — strongly connected to home, family, and community welfare. Emotional depth, loyalty, and care were your defining qualities.', hi:'पूर्व जन्म में आप पोषण और सुरक्षा देने वाले थे — घर, परिवार और समाज से गहरे जुड़े हुए।' },
  5:  { en:'In your past life you were a person of authority and dignity — a king, noble, regional chieftain, or respected leader who commanded attention. Recognition and prestige defined your identity.', hi:'पूर्व जन्म में आप अधिकार और गरिमा के व्यक्ति थे — राजा, अमीर, या सम्मानित नेता।' },
  6:  { en:'In your past life you were a skilled, service-oriented person — a healer, craftsperson, priest, or analyst who found meaning in precision and doing everything correctly. Humility and dedication were your qualities.', hi:'पूर्व जन्म में आप कुशल और सेवाभावी थे — वैद्य, कारीगर, पुजारी या विश्लेषक।' },
  7:  { en:'In your past life you were a diplomatic, refined person — a judge, mediator, artist, or merchant dealing in beautiful goods. Partnership, fairness, and harmonious relationships defined your character.', hi:'पूर्व जन्म में आप कूटनीतिज्ञ और परिष्कृत थे — न्यायाधीश, मध्यस्थ, कलाकार या व्यापारी।' },
  8:  { en:'In your past life you were an intense, investigative person — drawn to hidden knowledge, medicine, occult practices, or deep transformation. You navigated the unseen undercurrents of life that most people avoided.', hi:'पूर्व जन्म में आप गहरे, रहस्यमय थे — गुह्य ज्ञान, चिकित्सा, तंत्र या रूपांतरण में संलग्न।' },
  9:  { en:'In your past life you were a philosophical, freedom-loving person — a teacher, priest, sage, or long-distance traveller. Wisdom, dharma, and the search for truth guided your every action.', hi:'पूर्व जन्म में आप दार्शनिक और स्वतंत्रचित्त थे — शिक्षक, पुजारी, संत या दूरयात्री।' },
  10: { en:'In your past life you were a disciplined, hardworking person — an administrator, builder, government official, or methodical achiever who understood that real things take time and built structures to last.', hi:'पूर्व जन्म में आप अनुशासित और परिश्रमी थे — प्रशासक, निर्माता, सरकारी अधिकारी।' },
  11: { en:'In your past life you were a visionary, community-minded person — a social reformer, innovator, or collective thinker who worked for the progress of many. You were often ahead of your era.', hi:'पूर्व जन्म में आप दूरदर्शी और समाजमुखी थे — सुधारक या अपने समय से आगे सोचने वाले।' },
  12: { en:'In your past life you were a sensitive, spiritual person — a mystic, hermit, healer, or devotee living between visible and invisible worlds. Your soul was naturally drawn to the divine and the unseen.', hi:'पूर्व जन्म में आप संवेदनशील और आध्यात्मिक थे — संत, वैरागी, वैद्य या भक्त।' },
};

const D60_PLANET_PROFESSION = {
  Sun:     { en:'Government service, royal court, administration, or a position of authority — court official, military commander, or king\'s representative. Visible power and public recognition defined your professional identity.', hi:'सरकारी सेवा, राज दरबार, प्रशासन या अधिकार का पद — दरबारी, सेनापति या राजा के प्रतिनिधि।' },
  Moon:    { en:'Trade, agriculture, water-related work, healing, or public-facing service — grain merchant, water-keeper, farmer, midwife, or community service worker.', hi:'व्यापार, कृषि, जल संबंधित कार्य, चिकित्सा या जन सेवा — अनाज व्यापारी, किसान या दाई।' },
  Mars:    { en:'Military, police, construction, blacksmithing, surgery, or land management. You likely carried a weapon or built physical structures. Courage and physical action defined your work.', hi:'सेना, पुलिस, निर्माण, लुहारगिरी, शल्य चिकित्सा या भूमि प्रबंधन। साहस और कर्म आपकी पहचान थे।' },
  Mercury: { en:'Scribe, accountant, merchant, teacher, astrologer, mathematician, or communicator. Your profession required intelligence, literacy, and skilled use of words and numbers.', hi:'लेखक, मुनीम, व्यापारी, शिक्षक, ज्योतिषी, गणितज्ञ या संचारकर्ता।' },
  Jupiter: { en:'Priest, scholar, guru, judge, minister, astrologer, or royal advisor. You were a respected authority in sacred or administrative knowledge — people came to you for wisdom and counsel.', hi:'पुजारी, विद्वान, गुरु, न्यायाधीश, मंत्री, ज्योतिषी या राजसलाहकार। आप ज्ञान के क्षेत्र में सम्मानित थे।' },
  Venus:   { en:'Artist, musician, poet, jeweller, textile merchant, or dealer in luxury goods. Beauty, refinement, and aesthetic skill defined your work and what you created or traded.', hi:'कलाकार, संगीतज्ञ, कवि, जौहरी, कपड़े का व्यापारी या विलासिता वस्तुओं का कारोबारी।' },
  Saturn:  { en:'Agricultural labour, construction, mining, masonry, or social service. Your work demanded endurance and patience — often in humble conditions serving the land or the disadvantaged.', hi:'कृषि मजदूरी, निर्माण, खनन, राजमिस्त्री या सामाजिक सेवा। कठोर परिश्रम और धैर्य आपकी पहचान थे।' },
  Rahu:    { en:'An unconventional, foreign, or unusual profession for the era — perhaps a long-distance trader, spy, dealer in exotic goods, or someone whose work crossed social or geographic boundaries.', hi:'उस युग के लिए असामान्य या विदेशी व्यवसाय — दूर व्यापारी, जासूस या विदेशी वस्तुओं का व्यापारी।' },
  Ketu:    { en:'Spiritual teacher, wandering healer, mystic, or one who renounced conventional work for inner development. Your professional identity was spiritually oriented or intentionally detached from the ordinary world.', hi:'आध्यात्मिक शिक्षक, भटकता वैद्य, संत, या वह जिसने सांसारिक काम त्याग कर आंतरिक विकास चुना।' },
};

const D60_PLANET_FATHER = {
  Sun:     { en:'Your past-life father was a man of authority — respected, formal, and often in a position of prestige or power. The bond was significant but possibly stern; deep respect defined it more than warmth.', hi:'पूर्व जन्म में पिता अधिकारी थे — सम्मानित और प्रतिष्ठित। रिश्ता गहरा पर औपचारिक था।' },
  Moon:    { en:'Your past-life father was emotionally present, nurturing, and publicly known — often in trade or public service. The bond was warm and emotionally rich; you genuinely felt cared for.', hi:'पूर्व जन्म में पिता भावनात्मक रूप से उपस्थित और पोषक थे। बंधन भावनाओं से भरपूर था।' },
  Mars:    { en:'Your past-life father was strong-willed, courageous, and sometimes short-tempered — perhaps a military man, landowner, or builder. The relationship had intensity: deep respect for strength alongside occasional conflict.', hi:'पूर्व जन्म में पिता दृढ़ इच्छाशक्ति और साहसी थे, पर कभी-कभी क्रोधी। संबंध में गहरा सम्मान और कभी-कभी संघर्ष था।' },
  Mercury: { en:'Your past-life father was educated, communicative, and business-minded — a teacher, merchant, or scribe. Intellectual exchange and sharing of ideas were the foundation of your bond.', hi:'पूर्व जन्म में पिता शिक्षित, वाकपटु या व्यापारी थे। बौद्धिक संवाद आपके जुड़ाव की नींव था।' },
  Jupiter: { en:'You were blessed with a wise, dharmic, guru-like father in your past life — your first teacher. Patient, generous, and deeply respected, this relationship brought knowledge, protection, and genuine spiritual blessings that carry across lifetimes.', hi:'पूर्व जन्म में पिता बुद्धिमान, धर्मपरायण और गुरु जैसे थे — आपके पहले शिक्षक। उनका आशीर्वाद जन्मों तक साथ रहता है।' },
  Venus:   { en:'Your past-life father was a refined, artistic, or prosperous man who valued beauty and comfort. The relationship was relatively warm and affectionate; he gave you access to resources and cultivated your appreciation of beauty.', hi:'पूर्व जन्म में पिता परिष्कृत, कलात्मक या धनी थे। संबंध स्नेहपूर्ण था।' },
  Saturn:  { en:'Your past-life father was strict, hardworking, or heavily burdened. There may have been emotional distance, duty without warmth, or prolonged absence. Karmic lessons about responsibility and discipline came through this relationship.', hi:'पूर्व जन्म में पिता कठोर, परिश्रमी या बोझ से दबे थे। दूरी या कर्तव्य बिना स्नेह की स्थिति थी।' },
  Rahu:    { en:'Your past-life father was unconventional, foreign-influenced, or frequently absent — perhaps from a different background or region. The relationship was unpredictable and intensely karmic in nature.', hi:'पूर्व जन्म में पिता अपरंपरागत, विदेशी प्रभाव वाले या अनुपस्थित थे। संबंध अप्रत्याशित और कर्मिक था।' },
  Ketu:    { en:'Your past-life father was spiritually inclined, detached, or absent from a young age — through early death, renunciation, or inward focus. This relationship was incomplete; it remains a karmic thread that still seeks resolution.', hi:'पूर्व जन्म में पिता आध्यात्मिक, विरक्त, या कम उम्र से अनुपस्थित थे। संबंध अधूरा था।' },
};

const D60_PLANET_MOTHER = {
  Sun:     { en:'Your past-life mother was strong, respected, and authoritative in the community — formal in expression but a source of confidence and dignity. The home was well-structured and proud.', hi:'पूर्व जन्म में माँ मजबूत और सम्मानित थीं। उन्होंने आत्मविश्वास और गरिमा दी।' },
  Moon:    { en:'You had a deeply loving, nurturing mother in your past life — emotionally available and devoted. Home was a sanctuary of genuine care. This is one of the most blessed maternal karma configurations.', hi:'पूर्व जन्म में माँ गहरी प्यार करने वाली और पोषक थीं। घर प्रेम का अभयारण्य था।' },
  Mars:    { en:'Your past-life mother was a fighter — strong-willed, sometimes aggressive or stressed by circumstances. She protected fiercely, though the relationship had intensity rather than tenderness.', hi:'पूर्व जन्म में माँ संघर्षशील थीं — दृढ़ इच्छाशक्ति, कभी-कभी आक्रामक।' },
  Mercury: { en:'Your past-life mother was educated, communicative, and active — perhaps a healer, businesswoman, or teacher in her own right. She encouraged your intellect and took genuine interest in your development.', hi:'पूर्व जन्म में माँ शिक्षित और सक्रिय थीं। उन्होंने आपकी बौद्धिक वृद्धि को प्रोत्साहित किया।' },
  Jupiter: { en:'You had a wise, deeply religious, and devoted mother — your first spiritual teacher. Home was imbued with prayer, ritual, and dharma. Her blessings travel across lifetimes and you still feel her protection.', hi:'पूर्व जन्म में माँ बुद्धिमान, धर्मपरायण और भक्तिमयी थीं। उनका आशीर्वाद जन्मों तक साथ रहता है।' },
  Venus:   { en:'Your past-life mother was beautiful, artistic, or materially prosperous — she created a warm and aesthetically pleasant home. Love, beauty, and care for comfort defined the environment she built.', hi:'पूर्व जन्म में माँ सुंदर, कलात्मक या संपन्न थीं। उन्होंने आरामदायक और सुंदर घर बनाया।' },
  Saturn:  { en:'Your past-life mother faced hardship or heavy duties — perhaps strict, emotionally restrained, or worn down by burden. Love was present but rarely expressed warmly. Significant growth came through navigating this relationship.', hi:'पूर्व जन्म में माँ कठिनाइयों या भारी कर्तव्यों का सामना करती थीं — कठोर या भावनात्मक रूप से संयमित।' },
  Rahu:    { en:'Your past-life mother was unusual or from a different community — the home environment was unstable or unconventional. The maternal bond holds karmic patterns that benefit from conscious healing work.', hi:'पूर्व जन्म में माँ असामान्य या अलग समुदाय से थीं। मातृ संबंध में कर्मिक पैटर्न हैं जिन्हें उपचार की जरूरत है।' },
  Ketu:    { en:'Separation from your mother was a defining theme — through early loss, renunciation, or emotional unavailability. This absence created a spiritual longing that may still be active; healing the mother-archetype brings deep liberation.', hi:'पूर्व जन्म में माँ से बिछड़न का विषय था — जल्दी मृत्यु, वैराग्य या भावनात्मक अनुपलब्धता।' },
};

const D60_PLANET_SPOUSE = {
  Sun:     { en:'Your past-life spouse was dignified, authoritative, or publicly known. The relationship carried mutual respect alongside possible ego clashes — pride was both a strength and a challenge in that marriage.', hi:'पूर्व जन्म में जीवनसाथी गरिमामय और अधिकारी था। सम्मान था पर अहंकार की टकराहट भी हो सकती थी।' },
  Moon:    { en:'You had an emotionally devoted, nurturing spouse — the marriage was rich with feeling, mutual care, and deep connection to home and family. A loving and emotionally bonded partnership.', hi:'पूर्व जन्म में जीवनसाथी भावनात्मक रूप से समर्पित और पोषक था। विवाह भावनाओं और देखभाल से भरपूर था।' },
  Mars:    { en:'Your past-life spouse was courageous, energetic, and at times aggressive. The marriage had passion and intensity — sometimes loving, sometimes conflicted. Shared physical energy and boldness were the bonds.', hi:'पूर्व जन्म में जीवनसाथी साहसी और ऊर्जावान था। विवाह में जुनून और तीव्रता थी।' },
  Mercury: { en:'Your past-life spouse was intelligent, communicative, and mentally stimulating. The marriage was built on intellectual companionship, shared learning, and lively exchange of ideas.', hi:'पूर्व जन्म में जीवनसाथी बुद्धिमान और वाकपटु था। विवाह बौद्धिक साहचर्य पर बना था।' },
  Jupiter: { en:'You had a blessed, wise, and spiritually inclined spouse in your past life — a sacred marriage in which your partner elevated your dharma and brought genuine grace. This auspicious marital karma carries grace forward into the present life.', hi:'पूर्व जन्म में जीवनसाथी बुद्धिमान और धर्मपरायण था। यह पवित्र विवाह था जिसकी कृपा इस जन्म में भी आती है।' },
  Venus:   { en:'Your past-life marriage was loving, aesthetically rich, and harmonious. Your spouse was beautiful, refined, or artistic. This is one of the most favourable past-life marital configurations — genuine happiness defined that union.', hi:'पूर्व जन्म में विवाह प्रेममय, सुंदर और सामंजस्यपूर्ण था। जीवनसाथी कलात्मक और परिष्कृत था।' },
  Saturn:  { en:'Marriage in your past life was karmic and dutiful — perhaps arranged or loveless but enduring. Your spouse was hardworking but emotionally restrained. The relationship taught patience and a deep understanding of responsibility.', hi:'पूर्व जन्म में विवाह कर्मिक और कर्तव्यपूर्ण था। जीवनसाथी परिश्रमी पर भावनात्मक रूप से संयमित था।' },
  Rahu:    { en:'Your past-life marriage was intensely karmic, unconventional, or at times destabilizing. Your spouse may have been from a different background, class, or region — the relationship was magnetically compelling but often turbulent.', hi:'पूर्व जन्म में विवाह तीव्र कर्मिक और अपरंपरागत था। जीवनसाथी अलग पृष्ठभूमि से हो सकता था।' },
  Ketu:    { en:'Separation or spiritual detachment marked your past-life marriage — early loss, renunciation, or deep inward focus made your spouse emotionally or physically absent. This incompleteness is a karmic thread that carries into the present life and needs conscious resolution.', hi:'पूर्व जन्म में विवाह में बिछड़न या विरक्ति का विषय था। जीवनसाथी की जल्दी मृत्यु, वैराग्य या भावनात्मक अनुपस्थिति हो सकती थी।' },
};

const D60_PLANET_PAST_MOKSHA = {
  Sun:     { en:'Spiritual merit came through dharmic action, upright authority, and service to the community. You lived with visible integrity and contributed to society\'s order — solar karma that brings natural leadership and protection in this life.', hi:'धर्म, ईमानदार अधिकार और समाज सेवा से पुण्य मिला। सौर कर्म इस जन्म में नेतृत्व और सुरक्षा लाता है।' },
  Moon:    { en:'Spiritual merit came through devotional heart, caring for others, and natural empathy. Prayer, caring for family, and nurturing the community were your acts of worship — this carries as emotional intelligence and inner peace in this life.', hi:'भक्ति, दूसरों की देखभाल और करुणा से पुण्य मिला। यह कर्म इस जन्म में भावनात्मक बुद्धि लाता है।' },
  Mars:    { en:'Spiritual merit came through courageous action, protecting the innocent, and fearless pursuit of dharma. The warrior\'s path of righteousness — this carries as physical vitality and moral courage in this life.', hi:'साहसी कर्म, निर्दोषों की रक्षा और सत्य के लिए संघर्ष से पुण्य मिला।' },
  Mercury: { en:'Spiritual growth came through learning, teaching, sharing knowledge truthfully, and using the mind in service of truth. The intellect as a tool of dharma — this carries as quick learning and communicative gifts in this life.', hi:'सीखने, पढ़ाने और सत्य संचार से आध्यात्मिक विकास हुआ।' },
  Jupiter: { en:'Strong dharmic merit — service to teachers, Vedic learning, living generously and wisely. Jupiter\'s blessings flow across lifetimes; this carries as wisdom, protective grace, and natural spiritual depth in this life.', hi:'गुरु सेवा, वैदिक ज्ञान और उदार जीवन से मजबूत धर्मिक पुण्य मिला। यह इस जन्म में ज्ञान और कृपा के रूप में आता है।' },
  Venus:   { en:'Spiritual growth came through devotion, beauty, and acts of creative love — recognising the divine in harmony and beauty. This carries as refined aesthetic taste, loving relationships, and receptivity to grace in this life.', hi:'भक्ति, सौंदर्य और प्रेम के माध्यम से आध्यात्मिक विकास हुआ।' },
  Saturn:  { en:'Karma was cleared through patient service, endurance of difficulty, and disciplined long-term effort. Saturn\'s path — slow, thorough, and real. This carries as resilience, work ethic, and the ability to build lasting things in this life.', hi:'धैर्यपूर्ण सेवा और अनुशासित प्रयास से कर्म मुक्त हुए। यह इस जन्म में सहनशीलता और दृढ़ता के रूप में आता है।' },
  Rahu:    { en:'Past-life liberation path was unconventional — intense experiences, confrontation with illusion, and karmic encounters that forced growth. This carries as unusual talents and a drive to break boundaries in this life.', hi:'मुक्ति का मार्ग अपरंपरागत था — तीव्र अनुभव और भ्रम का सामना। यह असाधारण प्रतिभा के रूप में आता है।' },
  Ketu:    { en:'Moksha karma is very strong — renunciation, deep meditation, and liberation-seeking were central themes of your past life. Ketu here is one of the strongest indicators of near-moksha karma; spiritual practices in this life can yield profound liberation.', hi:'वैराग्य, गहरा ध्यान और मोक्ष की खोज प्रमुख थे। यह इस जन्म में शीघ्र आध्यात्मिक सफलता का सबसे शक्तिशाली संकेत है।' },
};

function generateD60PastLifeReading(d60Chart) {
  if (!d60Chart?.ascendant || !d60Chart?.planets) return null;
  const asc = d60Chart.ascendant;
  const ascNum = asc.rashi_num;
  const planets = d60Chart.planets;

  const lagnaScore = (() => {
    const lord = SIGN_LORD[ascNum];
    return planets[lord] ? dignityScore(planets[lord].dignity) : 3;
  })();
  const karmaQuality = lagnaScore >= 5 ? 'positive' : lagnaScore >= 3 ? 'mixed' : 'challenging';
  const KARMA_LABEL = {
    positive:    { en:'Strong past-life karma — more merit than debt carried into this life', hi:'मजबूत पूर्व जन्म कर्म — ऋण से अधिक पुण्य इस जन्म में लाया है' },
    mixed:       { en:'Mixed past-life karma — merit and karmic debts both carried forward', hi:'मिश्रित पूर्व जन्म कर्म — पुण्य और कर्म ऋण दोनों आगे लाए हैं' },
    challenging: { en:'Heavier karmic weight — this lifetime is primarily for clearing and healing', hi:'भारी कर्मिक भार — यह जीवन मुख्यतः सफाई और उपचार के लिए है' },
  };

  const personality = D60_LAGNA_PAST_LIFE[ascNum] || D60_LAGNA_PAST_LIFE[1];

  function houseReading(houseNum, lookup) {
    const primary  = primaryPlanetForHouse(planets, ascNum, houseNum);
    const inHouse  = planetsInHouseList(planets, ascNum, houseNum);
    const lord     = SIGN_LORD[signOfHouse(ascNum, houseNum)];
    const lordP    = planets[lord];
    const text     = lookup[primary] || lookup['Jupiter'];
    return {
      house: houseNum, lord_planet: lord, lord_planet_hi: P_HI[lord] || lord,
      primary_influence: primary, primary_influence_hi: P_HI[primary] || primary,
      planets_in_house: inHouse, lord_dignity: lordP?.dignity || 'Neutral',
      reading_en: text.en, reading_hi: text.hi,
    };
  }

  return {
    karma_quality:    karmaQuality,
    karma_label_en:   KARMA_LABEL[karmaQuality].en,
    karma_label_hi:   KARMA_LABEL[karmaQuality].hi,
    d60_lagna_en:     asc.rashi_en,
    d60_lagna_hi:     asc.rashi_hi,
    personality_en:   personality.en,
    personality_hi:   personality.hi,
    profession:       houseReading(10, D60_PLANET_PROFESSION),
    father:           houseReading(9,  D60_PLANET_FATHER),
    mother:           houseReading(4,  D60_PLANET_MOTHER),
    spouse:           houseReading(7,  D60_PLANET_SPOUSE),
    past_moksha:      houseReading(12, D60_PLANET_PAST_MOKSHA),
  };
}

// ─── 6. D20 Spiritual Path Analysis ──────────────────────────────────────────

const D20_LAGNA_SPIRITUAL = {
  1:  { en:'Your spiritual nature is active, dynamic, and direct. Bhakti through fierce mantra, energetic devotion, and warrior-like surrender suit you best. Your sadhana must have fire — slow, passive spirituality does not resonate.', hi:'आपकी आध्यात्मिक प्रकृति सक्रिय और प्रत्यक्ष है। शक्तिशाली मंत्र जाप और ऊर्जावान भक्ति आपके लिए उपयुक्त है।' },
  2:  { en:'Your spiritual nature is grounded, steady, and sensory. Temple puja with flowers and fragrances, devotional music, and nature-based practices work powerfully. Consistency over intensity is your spiritual strength.', hi:'आपकी आध्यात्मिक प्रकृति स्थिर और इंद्रिय-प्रसन्न है। मंदिर पूजा, फूल, सुगंध और संगीत आपके लिए शक्तिशाली है।' },
  3:  { en:'Your spiritual nature is intellectual and communicative. Jnana Yoga, sacred text study, chanting mantras aloud, and spiritual discourse are your most natural practices. The spoken and written word is your spiritual vehicle.', hi:'आपकी आध्यात्मिक प्रकृति बौद्धिक है। ज्ञान योग, शास्त्र अध्ययन और मंत्र उच्चारण आपके स्वाभाविक अभ्यास हैं।' },
  4:  { en:'Your spiritual nature is deeply devotional and emotionally rich. Bhakti Yoga — heartfelt prayer, devotion to the Divine Mother, worship with genuine feeling — is your most powerful path. Home puja and mantra from the heart are your forms.', hi:'आपकी आध्यात्मिक प्रकृति गहरी भक्तिमयी है। भक्ति योग — हृदय से प्रार्थना और दिव्य माँ की पूजा — आपका सबसे शक्तिशाली मार्ग है।' },
  5:  { en:'Your spiritual nature is radiant, creative, and inspiring. You are meant to express the divine through leadership, creative worship, and spiritually inspiring others. Surya sadhana and dignified ritual are your forms.', hi:'आपकी आध्यात्मिक प्रकृति प्रकाशमान और प्रेरणादायक है। सूर्य साधना और दूसरों को आध्यात्मिक रूप से प्रेरित करना आपके रूप हैं।' },
  6:  { en:'Your spiritual nature is precise, service-oriented, and methodical. Karma Yoga — serving with perfection and genuine humility — is your highest path. Systematic mantra, daily healing service, and practical acts of charity activate you.', hi:'आपकी आध्यात्मिक प्रकृति सटीक और सेवाभावी है। कर्म योग — परिपूर्णता और विनम्रता से सेवा — आपका सर्वोच्च मार्ग है।' },
  7:  { en:'Your spiritual nature is relational, harmonious, and aesthetic. Devotion through beauty — sacred music, temple puja, worship of paired deities (Radha-Krishna, Sita-Ram, Lakshmi-Narayan) — works powerfully. Partnership sadhana deepens you.', hi:'आपकी आध्यात्मिक प्रकृति संबंध-उन्मुख है। पवित्र संगीत और जोड़े देवताओं की पूजा (राधा-कृष्ण, सीता-राम) शक्तिशाली है।' },
  8:  { en:'Your spiritual nature is deep, intense, and transformative. You are drawn to the hidden face of the divine. Shiva worship, deep meditation, kundalini practices, and confronting the inner shadow are your most powerful paths.', hi:'आपकी आध्यात्मिक प्रकृति गहरी, तीव्र और परिवर्तनकारी है। शिव पूजा, गहरा ध्यान और कुंडलिनी अभ्यास आपके शक्तिशाली मार्ग हैं।' },
  9:  { en:'Your spiritual nature is expansive, philosophical, and knowledge-driven. Pilgrimage, scripture study, guru devotion, and dharmic living are your most natural forms. The pursuit of ultimate truth is itself your sadhana.', hi:'आपकी आध्यात्मिक प्रकृति विस्तृत और दार्शनिक है। तीर्थयात्रा, शास्त्र अध्ययन और गुरु भक्ति आपके स्वाभाविक रूप हैं।' },
  10: { en:'Your spiritual nature is disciplined, structured, and long-term. Shiva worship, Shani puja, and Karma Yoga through patient responsible service build your spiritual strength slowly but permanently.', hi:'आपकी आध्यात्मिक प्रकृति अनुशासित है। शिव पूजा, शनि पूजा और जिम्मेदार सेवा आपकी शक्ति को धीरे पर स्थायी रूप से बनाते हैं।' },
  11: { en:'Your spiritual nature is universal and community-oriented. Service to humanity, practices that transcend narrow rituals, and social upliftment as worship are your path. You worship through collective benefit.', hi:'आपकी आध्यात्मिक प्रकृति सार्वभौमिक है। मानवता की सेवा और सामाजिक उत्थान आपकी पूजा के रूप हैं।' },
  12: { en:'Your spiritual nature is mystical, surrendered, and dissolution-oriented. Deep meditation, complete surrender to a guru or deity, silent prayer, and practices that dissolve the ego are your highest path.', hi:'आपकी आध्यात्मिक प्रकृति रहस्यमय और समर्पणशील है। गहरा ध्यान, गुरु के प्रति पूर्ण समर्पण और मौन प्रार्थना आपका सर्वोच्च मार्ग है।' },
};

const D20_PLANET_PRACTICE = {
  Sun:     { en:'Surya Namaskar, Gayatri mantra, and practices centred on light, integrity, and dharma. Spiritual growth comes through aligning with divine order and living with authentic purpose.', hi:'सूर्य नमस्कार, गायत्री मंत्र। दिव्य व्यवस्था के साथ संरेखण आध्यात्मिक विकास देता है।' },
  Moon:    { en:'Chandra mantra, full moon meditations, and devotion to the Divine Mother. Emotional surrender and inner receptivity are the doorways to your spiritual growth.', hi:'चंद्र मंत्र, पूर्णिमा ध्यान और दिव्य माँ की भक्ति। भावनात्मक समर्पण आपका आध्यात्मिक द्वार है।' },
  Mars:    { en:'Active practices: energetic mantra, physical sadhana, Hanuman bhakti. You grow spiritually through vigorous, disciplined effort that channels passion into devotion.', hi:'ऊर्जावान मंत्र, शारीरिक साधना, हनुमान भक्ति। जुनून को भक्ति में बदलना आपका मार्ग है।' },
  Mercury: { en:'Jnana Yoga, mantra with correct Sanskrit pronunciation, sacred text study, and sharing spiritual knowledge. The spoken and written word are your most powerful spiritual instruments.', hi:'ज्ञान योग, सही उच्चारण के साथ मंत्र, शास्त्र अध्ययन। बोला शब्द आपका आध्यात्मिक साधन है।' },
  Jupiter: { en:'Guru devotion, Navgraha Suktam, pilgrimage, and expansion of dharmic understanding. Jupiter is the natural karaka of D20 — a highly auspicious placement for genuine spiritual growth.', hi:'गुरु भक्ति, नवग्रह सूक्तम, तीर्थयात्रा। गुरु D20 का स्वाभाविक कारक है — अत्यंत शुभ स्थान।' },
  Venus:   { en:'Bhakti through beauty — devotional music, Lakshmi puja, Sri Suktam, and creating sacred spaces. Love and beauty are your spiritual vehicles; recognising divinity in harmony is your path.', hi:'सौंदर्य के माध्यम से भक्ति — भजन, लक्ष्मी पूजा, श्री सूक्तम। प्रेम और सौंदर्य आपके आध्यात्मिक माध्यम हैं।' },
  Saturn:  { en:'Karma Yoga — rigorous long-term service without expectation. Shani puja, service to the elderly and disadvantaged, and sustained commitment are your spiritual forms.', hi:'कर्म योग — बिना अपेक्षा के दीर्घकालिक सेवा। शनि पूजा और बुजुर्गों की सेवा आपके रूप हैं।' },
  Rahu:    { en:'Transformative, non-traditional practices — confronting the ego directly, meditation on impermanence. Ground yourself in a genuine tradition; Rahu can bring sudden breakthroughs but also confusion without an anchor.', hi:'परिवर्तनकारी, गैर-पारंपरिक अभ्यास। किसी प्रामाणिक परंपरा में जड़ें रखें।' },
  Ketu:    { en:'Deep inward, moksha-oriented practices — extended meditation, silent mantra, complete renunciation of results, Ganesha devotion. Ketu is the natural moksha karaka — one of the strongest indicators of genuine liberation capacity.', hi:'गहरे अंतर्मुखी अभ्यास — विस्तारित ध्यान, मौन मंत्र, गणेश भक्ति। केतु मुक्ति का स्वाभाविक कारक है।' },
};

function generateD20SpiritualReading(d20Chart, ishtaDevata) {
  if (!d20Chart?.ascendant || !d20Chart?.planets) return null;
  const asc    = d20Chart.ascendant;
  const ascNum = asc.rashi_num;
  const planets = d20Chart.planets;

  const temperament = D20_LAGNA_SPIRITUAL[ascNum] || D20_LAGNA_SPIRITUAL[9];

  const jupInD20  = planets['Jupiter'];
  const ketuInD20 = planets['Ketu'];
  const jupHouse  = jupInD20  ? houseFrom(ascNum, jupInD20.rashi_num)  : null;
  const ketuHouse = ketuInD20 ? houseFrom(ascNum, ketuInD20.rashi_num) : null;

  const jupScore  = jupHouse  ? ([1,5,9,11].includes(jupHouse)  ? 6 : [2,7,10].includes(jupHouse)  ? 5 : [3,6].includes(jupHouse)  ? 3 : 2) : 3;
  const ketuScore = ketuHouse ? ([1,5,9,12].includes(ketuHouse) ? 6 : [4,8].includes(ketuHouse)    ? 5 : 3) : 3;
  const spiritScore = (jupScore + ketuScore) / 2;

  const spiritVerdict = spiritScore >= 5 ? 'strong' : spiritScore >= 3.5 ? 'moderate' : 'developing';
  const VERDICT_TEXT = {
    strong:     { en:'Strong spiritual inclination — genuine moksha-seeking capacity in this lifetime', hi:'मजबूत आध्यात्मिक झुकाव — इस जीवनकाल में वास्तविक मोक्ष-साधना की क्षमता' },
    moderate:   { en:'Moderate spiritual inclination — consistent practice brings real and steady progress', hi:'सामान्य आध्यात्मिक झुकाव — नियमित अभ्यास से वास्तविक और स्थिर प्रगति होगी' },
    developing: { en:'Spiritual path is being developed — this life lays the foundation for future lifetimes', hi:'आध्यात्मिक मार्ग विकसित हो रहा है — यह जीवन भविष्य के जन्मों की नींव रखता है' },
  };

  const lagnaLord    = SIGN_LORD[ascNum];
  const practicePlanet = D20_PLANET_PRACTICE[lagnaLord] ? lagnaLord : 'Jupiter';
  const practice     = D20_PLANET_PRACTICE[practicePlanet];

  const ninth       = primaryPlanetForHouse(planets, ascNum, 9);
  const ninthPractice = D20_PLANET_PRACTICE[ninth] || D20_PLANET_PRACTICE['Jupiter'];

  const twelfth     = primaryPlanetForHouse(planets, ascNum, 12);

  return {
    spirit_verdict:      spiritVerdict,
    verdict_en:          VERDICT_TEXT[spiritVerdict].en,
    verdict_hi:          VERDICT_TEXT[spiritVerdict].hi,
    d20_lagna_en:        asc.rashi_en,
    d20_lagna_hi:        asc.rashi_hi,
    temperament_en:      temperament.en,
    temperament_hi:      temperament.hi,
    primary_practice_en: practice.en,
    primary_practice_hi: practice.hi,
    grace_path_en:       ninthPractice.en,
    grace_path_hi:       ninthPractice.hi,
    jupiter: jupInD20 ? {
      sign_en: jupInD20.rashi_en, sign_hi: jupInD20.rashi_hi,
      house: jupHouse, dignity: jupInD20.dignity || 'Neutral', favorable: jupScore >= 5,
    } : null,
    ketu: ketuInD20 ? {
      sign_en: ketuInD20.rashi_en, sign_hi: ketuInD20.rashi_hi,
      house: ketuHouse, dignity: ketuInD20.dignity || 'Neutral', favorable: ketuScore >= 5,
    } : null,
    ishta_devata: ishtaDevata ? {
      en: ishtaDevata.ishta_devata_en, hi: ishtaDevata.ishta_devata_hi,
      mantra_en: ishtaDevata.primary_mantra_en, mantra_hi: ishtaDevata.primary_mantra_hi,
    } : null,
    moksha_indicator: twelfth,
    moksha_indicator_hi: P_HI[twelfth] || twelfth,
  };
}

// ─── 7. Varga Analysis (wires all D-chart readings together) ─────────────────

function generateVargaAnalysis(chart) {
  const out = {};
  const slugs = ['d1','d2','d3','d4','d5','d7','d8','d9','d10','d12','d16','d20','d24','d27','d30','d40','d45','d60'];
  const vargaCharts = chart.varga_charts || {};
  for (const slug of slugs) {
    const vc = slug === 'd1' ? chart : vargaCharts[slug];
    if (!vc) continue;
    const reading = getVargaReadings(slug, vc, chart);
    if (!reading) continue;
    if (slug === 'd60') reading.past_life_reading = generateD60PastLifeReading(vc);
    if (slug === 'd20') reading.spiritual_reading  = generateD20SpiritualReading(vc, chart._ishtaDevata);
    // Attach deep planet-by-planet insights + chart-level remedy (purpose-filtered)
    reading.planet_readings = applyPurposeFilter(slug, computeVargaInsights(slug, vc, chart));
    reading.chart_remedy    = getChartRemedy(slug);
    out[slug] = reading;
  }
  return out;
}

// ─── 4. Life Report (5 sections) ─────────────────────────────────────────────

function buildFinanceSection(chart) {
  const asc = chart.ascendant;
  const planets = chart.planets;
  const houses = chart.houses;
  const ascNum = asc.rashi_num;
  const yogas = chart.yogas_doshas?.yogas || [];

  const lord2 = SIGN_LORD[((ascNum + 0) % 12) + 1]; // 2nd house sign lord
  const lord11 = SIGN_LORD[((ascNum + 9) % 12) + 1]; // 11th house sign lord
  const lord2Planet = planets[lord2];
  const lord11Planet = planets[lord11];
  const venus = planets.Venus;
  const jupiter = planets.Jupiter;

  const lord2House = lord2Planet ? houseFrom(ascNum, lord2Planet.rashi_num) : null;
  const lord11House = lord11Planet ? houseFrom(ascNum, lord11Planet.rashi_num) : null;

  const wealthYogas = yogas.filter((y) =>
    ['Dhan', 'Lakshmi', 'Adhi', 'Gajakesari', 'Chandra-Mangal'].some((k) => y.name?.includes(k))
  );

  const d2Chart = chart.varga_charts?.d2;
  const d2Lagna = d2Chart?.ascendant?.rashi_num;
  const horaType = d2Lagna === 5 ? 'Sun Hora (earned/paternal wealth)' : d2Lagna === 4 ? 'Moon Hora (inherited/passive wealth)' : 'Mixed Hora';
  const horaTypeHi = d2Lagna === 5 ? 'सूर्य होरा (अर्जित/पैतृक धन)' : d2Lagna === 4 ? 'चंद्र होरा (विरासत/निष्क्रिय धन)' : 'मिश्रित होरा';

  const lord2Strength = lord2Planet ? dignityScore(lord2Planet.dignity) : 3;
  const venusStrength = venus ? dignityScore(venus.dignity) : 3;
  const overallScore = (lord2Strength + venusStrength) / 2;

  const problems = [];
  const solutions = [];

  if (lord2House && [6, 8, 12].includes(lord2House)) {
    problems.push({
      en: `2nd lord (${lord2}) placed in house ${lord2House} — wealth house lord in hidden/challenging house causes financial obstacles`,
      hi: `2nd लग्नेश (${P_HI[lord2] || lord2}) भाव ${lord2House} में — धन भाव का स्वामी कठिन भाव में आर्थिक बाधाएं देता है`,
    });
    solutions.push({
      en: `Worship ${DEVATA_MAP[lord2]?.en || 'Lord Vishnu'} — recite ${DEVATA_MAP[lord2]?.mantra_en || 'Vishnu Suktam'} every ${lord2 === 'Sun' ? 'Sunday' : lord2 === 'Moon' ? 'Monday' : lord2 === 'Mars' ? 'Tuesday' : lord2 === 'Mercury' ? 'Wednesday' : lord2 === 'Jupiter' ? 'Thursday' : lord2 === 'Venus' ? 'Friday' : 'Saturday'}`,
      hi: `${DEVATA_MAP[lord2]?.hi || 'भगवान विष्णु'} की आराधना करें — ${DEVATA_MAP[lord2]?.mantra_hi || 'विष्णु सूक्तम्'} का पाठ करें`,
    });
  }

  if (lord2Planet?.is_retrograde) {
    problems.push({
      en: `2nd lord (${lord2}) is retrograde — delays in wealth accumulation, review of financial decisions needed`,
      hi: `2nd लग्नेश (${P_HI[lord2] || lord2}) वक्री है — धन संचय में विलंब, वित्तीय निर्णयों की समीक्षा आवश्यक`,
    });
    solutions.push({
      en: 'Avoid impulsive financial decisions during retrograde periods; focus on consistent savings',
      hi: 'वक्री काल में आवेगपूर्ण वित्तीय निर्णयों से बचें; नियमित बचत पर ध्यान दें',
    });
  }

  if (wealthYogas.length > 0) {
    solutions.push({
      en: `Active wealth yoga(s): ${wealthYogas.map((y) => y.name).join(', ')} — activate by strengthening ${wealthYogas[0]?.planets_involved?.[0] || 'key planets'}`,
      hi: `सक्रिय धन योग: ${wealthYogas.map((y) => y.name_hi || y.name).join(', ')} — ${P_HI[wealthYogas[0]?.planets_involved?.[0]] || 'मुख्य ग्रहों'} को मजबूत करके सक्रिय करें`,
    });
  }

  solutions.push({
    en: 'Recite Sri Suktam on Fridays — universal Vedic remedy for wealth and Lakshmi blessings',
    hi: 'शुक्रवार को श्री सूक्तम् का पाठ करें — धन और लक्ष्मी आशीर्वाद का सार्वभौमिक वैदिक उपाय',
  });

  return {
    section: 'finance',
    title_en: 'Finance & Wealth Analysis',
    title_hi: 'वित्त और धन विश्लेषण',
    indicators: [
      { key: '2nd_lord', label_en: `2nd House Lord (${lord2})`, label_hi: `2nd भाव स्वामी (${P_HI[lord2] || lord2})`,
        value_en: lord2Planet ? `In ${lord2Planet.rashi_en}, house ${lord2House}, ${lord2Planet.dignity || 'Neutral'}` : 'Not found',
        value_hi: lord2Planet ? `${lord2Planet.rashi_hi || lord2Planet.rashi_en} में, भाव ${lord2House}, ${lord2Planet.dignity || 'सामान्य'}` : 'उपलब्ध नहीं',
        strength_score: lord2Strength,
      },
      { key: '11th_lord', label_en: `11th House Lord (${lord11})`, label_hi: `11th भाव स्वामी (${P_HI[lord11] || lord11})`,
        value_en: lord11Planet ? `In ${lord11Planet.rashi_en}, house ${lord11House}, ${lord11Planet.dignity || 'Neutral'}` : 'Not found',
        value_hi: lord11Planet ? `${lord11Planet.rashi_hi || lord11Planet.rashi_en} में, भाव ${lord11House}, ${lord11Planet.dignity || 'सामान्य'}` : 'उपलब्ध नहीं',
        strength_score: lord11Planet ? dignityScore(lord11Planet.dignity) : 3,
      },
      { key: 'venus', label_en: 'Venus (natural wealth/luxury indicator)', label_hi: 'शुक्र (नैसर्गिक धन/विलासिता कारक)',
        value_en: venus ? `In ${venus.rashi_en}, house ${houseFrom(ascNum, venus.rashi_num)}, ${venus.dignity || 'Neutral'}` : 'Not found',
        value_hi: venus ? `${venus.rashi_hi || venus.rashi_en} में, भाव ${houseFrom(ascNum, venus.rashi_num)}, ${venus.dignity || 'सामान्य'}` : 'उपलब्ध नहीं',
        strength_score: venusStrength,
      },
      { key: 'd2_hora', label_en: 'D2 Hora Chart (wealth type)', label_hi: 'D2 होरा कुंडली (धन प्रकार)',
        value_en: horaType,
        value_hi: horaTypeHi,
      },
    ],
    wealth_yogas: wealthYogas.map((y) => ({ name: y.name, name_hi: y.name_hi, trigger_en: y.trigger_en, trigger_hi: y.trigger_hi })),
    problems,
    solutions,
    overall_score: overallScore,
    summary_en: overallScore >= 4.5
      ? 'Strong financial indicators — wealth accumulation supported. Focus on D2 and 2nd/11th house strengthening for amplified results.'
      : overallScore >= 3
      ? 'Moderate financial strength — steady income possible with effort. Address 2nd lord placement for better wealth flow.'
      : 'Financial challenges indicated — systematic remedies and disciplined effort essential. Avoid risky investments.',
    summary_hi: overallScore >= 4.5
      ? 'मजबूत आर्थिक संकेतक — धन संचय का सहयोग है। D2 और 2nd/11th भाव को मजबूत करने पर ध्यान दें।'
      : overallScore >= 3
      ? 'सामान्य आर्थिक बल — प्रयास से स्थिर आय संभव। 2nd लग्नेश की स्थिति सुधारने के उपाय करें।'
      : 'आर्थिक चुनौतियाँ संकेतित — व्यवस्थित उपाय और अनुशासित प्रयास आवश्यक। जोखिम भरे निवेश से बचें।',
  };
}

function buildFamilySection(chart) {
  const asc = chart.ascendant;
  const planets = chart.planets;
  const ascNum = asc.rashi_num;
  const mangal = chart.mangal_dosha;
  const yogas = chart.yogas_doshas?.yogas || [];

  const lord4 = SIGN_LORD[((ascNum + 2) % 12) + 1];
  const lord7 = SIGN_LORD[((ascNum + 5) % 12) + 1];
  const lord5 = SIGN_LORD[((ascNum + 3) % 12) + 1];
  const lord9 = SIGN_LORD[((ascNum + 7) % 12) + 1];

  const p4 = planets[lord4], p7 = planets[lord7], p5 = planets[lord5], p9 = planets[lord9];
  const moon = planets.Moon, jupiter = planets.Jupiter, venus = planets.Venus;

  const h4 = p4 ? houseFrom(ascNum, p4.rashi_num) : null;
  const h7 = p7 ? houseFrom(ascNum, p7.rashi_num) : null;
  const h5 = p5 ? houseFrom(ascNum, p5.rashi_num) : null;

  const problems = [];
  const solutions = [];

  if (mangal?.has_dosha) {
    problems.push({
      en: `Mangal Dosha present (severity: ${mangal.severity}) — may cause delays or friction in marriage`,
      hi: `मंगल दोष उपस्थित (गंभीरता: ${mangal.severity}) — विवाह में विलंब या तनाव संभव`,
    });
    solutions.push({
      en: 'Recite Mangal Stotra every Tuesday. Worship Hanuman or Narsimha. Consider Kumbh Vivah if severity is high.',
      hi: 'प्रतिमंगलवार मंगल स्तोत्र पाठ करें। हनुमान या नरसिंह की उपासना करें। गंभीरता अधिक हो तो कुंभ विवाह पर विचार करें।',
    });
  }

  if (h7 && [6, 8, 12].includes(h7)) {
    problems.push({
      en: `7th lord (${lord7}) in house ${h7} — relationship with spouse may face obstacles; need patience`,
      hi: `7th लग्नेश (${P_HI[lord7] || lord7}) भाव ${h7} में — जीवनसाथी से संबंध में बाधाएं; धैर्य आवश्यक`,
    });
    solutions.push({
      en: `Strengthen ${lord7} planet — worship ${DEVATA_MAP[lord7]?.en || 'Lord Vishnu'}`,
      hi: `${P_HI[lord7] || lord7} ग्रह को शक्तिशाली बनाएं — ${DEVATA_MAP[lord7]?.hi || 'भगवान विष्णु'} की आराधना`,
    });
  }

  if (h5 && [6, 8, 12].includes(h5)) {
    problems.push({
      en: `5th lord (${lord5}) in house ${h5} — children matters need attention; possible delays in progeny`,
      hi: `5th लग्नेश (${P_HI[lord5] || lord5}) भाव ${h5} में — संतान विषय में ध्यान आवश्यक; संतान प्राप्ति में विलंब संभव`,
    });
    solutions.push({
      en: 'Worship Jupiter and Lord Vishnu. Recite Santana Gopala Mantra for progeny blessings.',
      hi: 'बृहस्पति और भगवान विष्णु की पूजा करें। संतान गोपाल मंत्र का जाप करें।',
    });
  }

  solutions.push({
    en: 'For family harmony: Recite Navgraha Suktam regularly and light a ghee lamp at home each evening',
    hi: 'परिवार में सौहार्द के लिए: नियमित नवग्रह सूक्तम् पाठ और प्रतिदिन शाम घी का दीपक जलाएं',
  });

  return {
    section: 'family',
    title_en: 'Family, Marriage & Relationships',
    title_hi: 'परिवार, विवाह और संबंध',
    indicators: [
      { key: '4th_lord', label_en: `4th Lord (${lord4}) — Home/Mother`, label_hi: `4th स्वामी (${P_HI[lord4] || lord4}) — घर/माता`,
        value_en: p4 ? `In ${p4.rashi_en}, house ${h4}, ${p4.dignity || 'Neutral'}` : 'N/A',
        value_hi: p4 ? `${p4.rashi_hi || p4.rashi_en} में, भाव ${h4}` : 'N/A',
        strength_score: p4 ? dignityScore(p4.dignity) : 3,
      },
      { key: '7th_lord', label_en: `7th Lord (${lord7}) — Marriage/Spouse`, label_hi: `7th स्वामी (${P_HI[lord7] || lord7}) — विवाह`,
        value_en: p7 ? `In ${p7.rashi_en}, house ${h7}, ${p7.dignity || 'Neutral'}` : 'N/A',
        value_hi: p7 ? `${p7.rashi_hi || p7.rashi_en} में, भाव ${h7}` : 'N/A',
        strength_score: p7 ? dignityScore(p7.dignity) : 3,
      },
      { key: '5th_lord', label_en: `5th Lord (${lord5}) — Children`, label_hi: `5th स्वामी (${P_HI[lord5] || lord5}) — संतान`,
        value_en: p5 ? `In ${p5.rashi_en}, house ${h5}, ${p5.dignity || 'Neutral'}` : 'N/A',
        value_hi: p5 ? `${p5.rashi_hi || p5.rashi_en} में, भाव ${h5}` : 'N/A',
        strength_score: p5 ? dignityScore(p5.dignity) : 3,
      },
      { key: 'mangal_dosha', label_en: 'Mangal Dosha', label_hi: 'मंगल दोष',
        value_en: mangal?.has_dosha ? `Present — ${mangal.severity}` : 'Not present',
        value_hi: mangal?.has_dosha ? `उपस्थित — ${mangal.severity}` : 'अनुपस्थित',
      },
    ],
    problems,
    solutions,
    summary_en: mangal?.has_dosha || [h7,h5].some((h) => [6,8,12].includes(h))
      ? 'Family relationships need conscious effort and specific remedies. Marriage timing and child matters require attention.'
      : 'Family life shows stable indicators. Relationships supported by planetary positions.',
    summary_hi: mangal?.has_dosha || [h7,h5].some((h) => [6,8,12].includes(h))
      ? 'पारिवारिक संबंधों में सचेत प्रयास और उपाय आवश्यक। विवाह समय और संतान विषय पर ध्यान दें।'
      : 'पारिवारिक जीवन के संकेत स्थिर हैं। ग्रह स्थिति संबंधों का समर्थन करती है।',
  };
}

function buildHealthSection(chart) {
  const asc = chart.ascendant;
  const planets = chart.planets;
  const ascNum = asc.rashi_num;

  const lagnaLord = SIGN_LORD[ascNum];
  const lord6 = SIGN_LORD[((ascNum + 4) % 12) + 1];
  const ll = planets[lagnaLord];
  const p6 = planets[lord6];
  const moon = planets.Moon;
  const sun = planets.Sun;

  const llHouse = ll ? houseFrom(ascNum, ll.rashi_num) : null;
  const p6House = p6 ? houseFrom(ascNum, p6.rashi_num) : null;

  const nakHealth = chart._nakshatra_health || null;

  const problems = [];
  const solutions = [];

  const llScore = ll ? dignityScore(ll.dignity) : 3;
  if (llScore <= 2) {
    problems.push({
      en: `Lagna lord (${lagnaLord}) is weak (${ll?.dignity || 'debilitated'}) — general vitality and immunity may be compromised`,
      hi: `लग्नेश (${P_HI[lagnaLord] || lagnaLord}) निर्बल है (${ll?.dignity || 'नीच'}) — सामान्य जीवनशक्ति और प्रतिरोधक क्षमता प्रभावित`,
    });
    solutions.push({
      en: `Strengthen Lagna lord ${lagnaLord}: worship ${DEVATA_MAP[lagnaLord]?.en}, recite ${DEVATA_MAP[lagnaLord]?.mantra_en}`,
      hi: `लग्नेश ${P_HI[lagnaLord] || lagnaLord} को बलवान बनाएं: ${DEVATA_MAP[lagnaLord]?.hi} की पूजा, ${DEVATA_MAP[lagnaLord]?.mantra_hi} पाठ`,
    });
  }

  if (p6House && [1, 4, 7, 10].includes(p6House)) {
    problems.push({
      en: `6th lord (${lord6}) in angular house ${p6House} — disease/health issues may be more visible and recurring`,
      hi: `6th लग्नेश (${P_HI[lord6] || lord6}) केंद्र भाव ${p6House} में — रोग/स्वास्थ्य समस्याएं अधिक प्रकट हो सकती हैं`,
    });
  }

  const moonScore = moon ? dignityScore(moon.dignity) : 3;
  if (moonScore <= 2) {
    problems.push({
      en: 'Moon is weak — mental health, sleep quality, and emotional regulation need attention',
      hi: 'चंद्र निर्बल है — मानसिक स्वास्थ्य, नींद की गुणवत्ता और भावनात्मक नियंत्रण पर ध्यान दें',
    });
    solutions.push({
      en: 'Recite Sri Rudram on Mondays. Wear white on Mondays. Offer water to Moon (Arghya) at sunrise.',
      hi: 'सोमवार को श्री रुद्रम् का पाठ करें। सोमवार को सफेद वस्त्र धारण करें। सूर्योदय पर चंद्र को अर्घ्य दें।',
    });
  }

  solutions.push({
    en: 'Recite Rog Nivaran Suktam for disease relief. Hanuman Bahuk for chronic ailments. Daily yoga and pranayama.',
    hi: 'रोग निवारण के लिए रोग निवारण सूक्तम् पाठ करें। पुराने रोगों के लिए हनुमान बाहुक। दैनिक योग और प्राणायाम।',
  });
  solutions.push({
    en: 'Follow the 5-step daily puja sequence: Ganesh → Ishta Devata → Lagna Lord → Atmakaraka → Shakti',
    hi: 'दैनिक 5-चरण पूजा क्रम: गणेश → इष्ट देवता → लग्नेश → आत्मकारक → शक्ति',
  });

  return {
    section: 'health',
    title_en: 'Health & Vitality Analysis',
    title_hi: 'स्वास्थ्य और जीवनशक्ति विश्लेषण',
    indicators: [
      { key: 'lagna_lord', label_en: `Lagna Lord (${lagnaLord}) — overall vitality`, label_hi: `लग्नेश (${P_HI[lagnaLord] || lagnaLord}) — समग्र जीवनशक्ति`,
        value_en: ll ? `In ${ll.rashi_en}, house ${llHouse}, ${ll.dignity || 'Neutral'}` : 'N/A',
        value_hi: ll ? `${ll.rashi_hi || ll.rashi_en} में, भाव ${llHouse}` : 'N/A',
        strength_score: llScore,
      },
      { key: '6th_lord', label_en: `6th Lord (${lord6}) — disease indicator`, label_hi: `6th स्वामी (${P_HI[lord6] || lord6}) — रोग कारक`,
        value_en: p6 ? `In ${p6.rashi_en}, house ${p6House}, ${p6.dignity || 'Neutral'}` : 'N/A',
        value_hi: p6 ? `${p6.rashi_hi || p6.rashi_en} में, भाव ${p6House}` : 'N/A',
        strength_score: p6 ? dignityScore(p6.dignity) : 3,
      },
      { key: 'moon', label_en: 'Moon — mental health & emotions', label_hi: 'चंद्र — मानसिक स्वास्थ्य',
        value_en: moon ? `In ${moon.rashi_en}, house ${houseFrom(ascNum, moon.rashi_num)}, ${moon.dignity || 'Neutral'}` : 'N/A',
        value_hi: moon ? `${moon.rashi_hi || moon.rashi_en} में` : 'N/A',
        strength_score: moonScore,
      },
      { key: 'sun', label_en: 'Sun — immunity and father\'s health', label_hi: 'सूर्य — प्रतिरोधक क्षमता',
        value_en: sun ? `In ${sun.rashi_en}, house ${houseFrom(ascNum, sun.rashi_num)}, ${sun.dignity || 'Neutral'}` : 'N/A',
        value_hi: sun ? `${sun.rashi_hi || sun.rashi_en} में` : 'N/A',
        strength_score: sun ? dignityScore(sun.dignity) : 3,
      },
    ],
    nakshatra_health: nakHealth || null,
    problems,
    solutions,
    summary_en: llScore >= 4 && moonScore >= 3
      ? 'Good constitutional strength. Maintain balance through regular spiritual practice and diet.'
      : llScore <= 2 || moonScore <= 2
      ? 'Health needs active attention. Specific remedies for Lagna lord and Moon will bring improvement.'
      : 'Moderate health constitution. Consistent healthy habits and mantra practice will strengthen vitality.',
    summary_hi: llScore >= 4 && moonScore >= 3
      ? 'अच्छी संवैधानिक शक्ति। नियमित आध्यात्मिक अभ्यास और आहार से संतुलन बनाए रखें।'
      : llScore <= 2 || moonScore <= 2
      ? 'स्वास्थ्य पर सक्रिय ध्यान आवश्यक। लग्नेश और चंद्र के उपाय सुधार लाएंगे।'
      : 'सामान्य स्वास्थ्य संरचना। नियमित स्वस्थ आदतें और मंत्र अभ्यास जीवनशक्ति मजबूत करेंगे।',
  };
}

function buildProblemsSection(chart) {
  const doshas = chart.yogas_doshas?.doshas || [];
  const asc = chart.ascendant;
  const planets = chart.planets;
  const ascNum = asc.rashi_num;
  const gochar = chart.gochar;

  const problems = [];
  const solutions = [];

  for (const d of doshas) {
    problems.push({
      en: `${d.name} — ${d.trigger_en || d.definition_en || ''}`,
      hi: `${d.name_hi || d.name} — ${d.trigger_hi || d.definition_hi || ''}`,
      severity: d.severity,
      category: d.category,
    });
    if (d.balancing_en || d.guidance_en) {
      solutions.push({
        en: d.balancing_en || d.guidance_en || `Address ${d.name} through regular prayer and mantra`,
        hi: d.balancing_hi || d.guidance_hi || `${d.name_hi || d.name} के निवारण के लिए नियमित प्रार्थना और मंत्र करें`,
        for_dosha: d.name,
      });
    }
  }

  // Sade Sati / Saturn transit
  if (gochar?.sade_sati?.active) {
    problems.push({
      en: `Sade Sati active (${gochar.sade_sati.phase || 'current phase'}) — Saturn transit over Moon sign brings tests of patience, health, finances`,
      hi: `साढ़ेसाती सक्रिय (${gochar.sade_sati.phase || 'वर्तमान चरण'}) — चंद्र राशि पर शनि का गोचर धैर्य, स्वास्थ्य, वित्त की परीक्षा लेता है`,
      severity: 'moderate',
    });
    solutions.push({
      en: 'For Sade Sati: Recite Sri Rudram daily. Feed oil and black sesame to Shani on Saturdays. Serve elderly and disabled.',
      hi: 'साढ़ेसाती के लिए: प्रतिदिन श्री रुद्रम् का पाठ करें। शनिवार को तेल और काले तिल अर्पित करें। वृद्ध और दिव्यांगों की सेवा करें।',
    });
  }

  // General remedy for all problems
  solutions.push({
    en: 'Universal remedy: Navgraha Suktam recitation covers all planetary afflictions. Most powerful among all Vedic suktams.',
    hi: 'सार्वभौमिक उपाय: नवग्रह सूक्तम् पाठ सभी ग्रह दोषों को संबोधित करता है। सभी वैदिक सूक्तमों में सर्वाधिक शक्तिशाली।',
  });

  if (problems.length === 0) {
    problems.push({
      en: 'No major doshas detected in the current chart analysis',
      hi: 'वर्तमान कुंडली विश्लेषण में कोई प्रमुख दोष नहीं मिला',
    });
  }

  return {
    section: 'problems',
    title_en: 'Problem Areas & Solutions',
    title_hi: 'समस्या क्षेत्र और समाधान',
    dosha_count: doshas.length,
    doshas_detected: doshas.map((d) => ({
      name: d.name, name_hi: d.name_hi, severity: d.severity, category: d.category,
      trigger_en: d.trigger_en, trigger_hi: d.trigger_hi,
    })),
    problems,
    solutions,
    sade_sati_active: gochar?.sade_sati?.active || false,
    summary_en: doshas.length === 0
      ? 'No major karmic challenges indicated. Maintain spiritual practice for continued protection.'
      : `${doshas.length} dosha(s) detected — systematic remedies and daily spiritual practice will mitigate their effects over time.`,
    summary_hi: doshas.length === 0
      ? 'कोई प्रमुख कर्मिक चुनौती नहीं। निरंतर सुरक्षा के लिए आध्यात्मिक अभ्यास जारी रखें।'
      : `${doshas.length} दोष मिले — व्यवस्थित उपाय और दैनिक आध्यात्मिक अभ्यास समय के साथ इनके प्रभाव को कम करेंगे।`,
  };
}

function buildProfileSection(chart, akInfo, ishtaDevataInfo) {
  const asc = chart.ascendant;
  const moon = chart.planets?.Moon;
  const nak = chart.nakshatra;
  const currentDasha = chart.dasha?.find((d) => d.is_current) || chart.dasha?.[0];
  const currentAD = currentDasha?.antardasha?.find((a) => a.is_current) || currentDasha?.antardasha?.[0];

  return {
    section: 'profile',
    title_en: 'Basic Profile & Soul Purpose',
    title_hi: 'मूल प्रोफाइल और आत्म उद्देश्य',
    lagna: {
      sign_en: asc?.rashi_en, sign_hi: asc?.rashi_hi,
      lord: asc?.rashi_lord,
      summary_en: `${asc?.rashi_en} ascendant — your outer personality, physical body, and approach to life reflect ${asc?.rashi_en} qualities governed by ${asc?.rashi_lord}`,
      summary_hi: `${asc?.rashi_hi} लग्न आपका बाहरी व्यक्तित्व, शरीर की बनावट, निर्णय शैली और जीवन को देखने का तरीका दिखाता है। इस लग्न का स्वामी ${P_HI[asc?.rashi_lord] || asc?.rashi_lord} है, इसलिए इस ग्रह की स्थिति आपके आत्मविश्वास, कर्म शैली और लोगों के सामने आपकी अभिव्यक्ति को गहराई से प्रभावित करती है। ${asc?.rashi_hi} गुण आपको परिस्थिति संभालने का अपना विशेष ढंग देते हैं।`,
    },
    moon_sign: {
      sign_en: moon?.rashi_en, sign_hi: moon?.rashi_hi,
      summary_en: `Moon in ${moon?.rashi_en} — inner emotional nature, relationship with mother, and subconscious mind`,
      summary_hi: `${moon?.rashi_hi || moon?.rashi_en} में चंद्र आपके मन, भावनात्मक प्रतिक्रिया, माता से संबंध, स्मृति और भीतर की सुरक्षा भावना को दर्शाता है। जब जीवन में दबाव आता है तो चंद्र की यही राशि बताती है कि मन कैसे प्रतिक्रिया देगा, किस प्रकार के वातावरण से शांति मिलेगी और संबंधों में संवेदनशीलता कैसे व्यक्त होगी।`,
    },
    nakshatra: {
      name_en: nak?.en, name_hi: nak?.hi,
      lord: nak?.lord, pada: nak?.pada,
      deity_en: nak?.deity_en, deity_hi: nak?.deity_hi,
      summary_en: `${nak?.en} Nakshatra, Pada ${nak?.pada} — soul qualities and dharmic purpose channelled through ${nak?.lord}'s energy, deity ${nak?.deity_en}`,
      summary_hi: `${nak?.hi || nak?.en} नक्षत्र, पाद ${nak?.pada}, आपके स्वाभाविक मन, आत्म-प्रवृत्ति और कर्म करने की सूक्ष्म शैली को दिखाता है। इसका स्वामी ${P_HI[nak?.lord] || nak?.lord} है और देवता ${nak?.deity_hi || nak?.deity_en} हैं, इसलिए इस नक्षत्र की ऊर्जा जीवन में सहज आकर्षण, भीतर की प्रेरणा और धर्म-अनुभव को रंग देती है।`,
    },
    current_dasha: currentDasha ? {
      lord: currentDasha.lord,
      lord_hi: P_HI[currentDasha.lord] || currentDasha.lord,
      start: currentDasha.start, end: currentDasha.end,
      antardasha_lord: currentAD?.lord,
      summary_en: `Currently in ${currentDasha.lord} Mahadasha / ${currentAD?.lord || '—'} Antardasha — themes of ${currentDasha.lord} are dominant in your life`,
      summary_hi: `वर्तमान में ${P_HI[currentDasha.lord] || currentDasha.lord} महादशा और ${P_HI[currentAD?.lord] || currentAD?.lord || '—'} अंतर्दशा चल रही है। महादशा जीवन की बड़ी दिशा और प्रमुख सीख दिखाती है, जबकि अंतर्दशा दैनिक घटनाओं, रिश्तों, निर्णयों और अवसरों का रंग बदलती है। इसलिए अभी ${P_HI[currentDasha.lord] || currentDasha.lord} के विषय मुख्य हैं और ${P_HI[currentAD?.lord] || currentAD?.lord || '—'} उन्हें व्यावहारिक रूप में सामने ला रहा है।`,
    } : null,
    atmakaraka: akInfo ? {
      planet: akInfo.planet,
      planet_hi: P_HI[akInfo.planet] || akInfo.planet,
      degree: akInfo.degree,
      summary_en: `Your Atmakaraka is ${akInfo.planet} at ${akInfo.degree}° — this planet represents your soul's deepest learning and karmic direction`,
      summary_hi: `आपका आत्मकारक ${P_HI[akInfo.planet] || akInfo.planet} ${akInfo.degree}° पर है। यह ग्रह आत्मा की सबसे गहरी सीख, अधूरी परिपक्वता और कर्मिक दिशा को दिखाता है। जीवन में बार-बार आने वाले बड़े पाठ इसी ग्रह के स्वभाव से जुड़े होते हैं, इसलिए इसके अच्छे गुणों को जागृत करना आत्मिक प्रगति का मुख्य उपाय है।`,
    } : null,
    ishta_devata: ishtaDevataInfo || null,
  };
}

// ─── Main entry points ────────────────────────────────────────────────────────

function generateLifeReport(chart) {
  const akInfo = calculateAtmakaraka(chart.planets);
  const ishtaDevataInfo = calculateIshtaDevata(akInfo, chart.varga_charts?.d9);

  // Stash on chart so generateVargaAnalysis can use them
  chart._atmakaraka  = akInfo;
  chart._ishtaDevata = ishtaDevataInfo;

  return {
    atmakaraka: akInfo,
    ishta_devata: ishtaDevataInfo,
    sections: {
      profile:  buildProfileSection(chart, akInfo, ishtaDevataInfo),
      finance:  buildFinanceSection(chart),
      family:   buildFamilySection(chart),
      health:   buildHealthSection(chart),
      problems: buildProblemsSection(chart),
    },
  };
}

module.exports = {
  calculateAtmakaraka,
  calculateIshtaDevata,
  generateVargaAnalysis,
  generateLifeReport,
  DEVATA_MAP,
};
