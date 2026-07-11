'use strict';
/**
 * Ask-a-Question suggestion bank (Session 57).
 * ~90 common Kundli questions, bilingual (en/hi), grouped by category. Each has a
 * stable `key` used to cache the AI answer per kundli (kundli_ai_answers table).
 * The client shows these as tappable chips; taps hit the cache for instant answers.
 * WARM_KEYS are pre-generated in the background after a kundli opens.
 */

const q = (key, category, en, hi) => ({ key, category, en, hi });

const QUESTIONS = [
  // ── Career & work ─────────────────────────────────────────────────────────
  q('career_change', 'career', 'Should I change my job this year?', 'क्या मुझे इस साल नौकरी बदलनी चाहिए?'),
  q('career_offer', 'career', 'Should I accept this job offer?', 'क्या मुझे यह नौकरी का प्रस्ताव स्वीकार करना चाहिए?'),
  q('career_business', 'career', 'Is business better for me than a job?', 'क्या नौकरी से बेहतर मेरे लिए व्यवसाय है?'),
  q('career_promotion', 'career', 'When can I expect a promotion or a raise?', 'पदोन्नति या वेतन वृद्धि कब मिल सकती है?'),
  q('career_govt', 'career', 'Do I have a yoga for a government job?', 'क्या मेरी कुंडली में सरकारी नौकरी का योग है?'),
  q('career_field', 'career', 'Which career field suits my chart best?', 'मेरी कुंडली के अनुसार कौन सा करियर क्षेत्र सबसे अच्छा है?'),
  q('career_growth', 'career', 'How will my career grow in the coming years?', 'आने वाले वर्षों में मेरा करियर कैसे बढ़ेगा?'),
  q('career_startup', 'career', 'Is this a good time to start my own venture?', 'क्या अपना व्यवसाय शुरू करने का यह अच्छा समय है?'),
  q('career_stability', 'career', 'When will my career become stable?', 'मेरा करियर कब स्थिर होगा?'),
  q('career_abroad_job', 'career', 'Are there chances of a job abroad?', 'क्या विदेश में नौकरी की संभावना है?'),

  // ── Marriage & relationships ──────────────────────────────────────────────
  q('marriage_when', 'marriage', 'When will I get married?', 'मेरी शादी कब होगी?'),
  q('marriage_love_arranged', 'marriage', 'Will my marriage be love or arranged?', 'मेरी शादी प्रेम विवाह होगी या अरेंज्ड?'),
  q('marriage_life', 'marriage', 'How will my married life be?', 'मेरा वैवाहिक जीवन कैसा रहेगा?'),
  q('marriage_delay', 'marriage', 'Why is my marriage getting delayed?', 'मेरी शादी में देरी क्यों हो रही है?'),
  q('marriage_partner', 'marriage', 'What will my life partner be like?', 'मेरा जीवनसाथी कैसा होगा?'),
  q('marriage_compatibility', 'marriage', 'Is this relationship good for marriage?', 'क्या यह रिश्ता विवाह के लिए अच्छा है?'),
  q('marriage_manglik', 'marriage', 'Am I Manglik, and does it affect marriage?', 'क्या मैं मांगलिक हूँ, और क्या यह शादी को प्रभावित करता है?'),
  q('marriage_second', 'marriage', 'What do the stars say about a second chance in love?', 'प्रेम में दूसरे अवसर के बारे में ग्रह क्या कहते हैं?'),
  q('marriage_happiness', 'marriage', 'Will I find happiness and harmony with my spouse?', 'क्या मुझे जीवनसाथी के साथ सुख और सामंजस्य मिलेगा?'),

  // ── Love & romance ────────────────────────────────────────────────────────
  q('love_success', 'love', 'Will my love relationship be successful?', 'क्या मेरा प्रेम संबंध सफल होगा?'),
  q('love_reunite', 'love', 'Is there a chance to reunite with my ex?', 'क्या पुराने साथी से दोबारा मिलने की संभावना है?'),
  q('love_family_approval', 'love', 'Will my family accept my partner?', 'क्या मेरा परिवार मेरे साथी को स्वीकार करेगा?'),
  q('love_timing', 'love', 'When will love come into my life?', 'मेरे जीवन में प्रेम कब आएगा?'),

  // ── Finance & wealth ──────────────────────────────────────────────────────
  q('finance_growth', 'finance', 'How will my financial situation be this year?', 'इस साल मेरी आर्थिक स्थिति कैसी रहेगी?'),
  q('finance_wealth', 'finance', 'Do I have a yoga for wealth in my chart?', 'क्या मेरी कुंडली में धन योग है?'),
  q('finance_debt', 'finance', 'When will I become free of debts?', 'मैं कर्ज़ से कब मुक्त होऊंगा?'),
  q('finance_investment', 'finance', 'Is this a good time to invest?', 'क्या निवेश करने का यह अच्छा समय है?'),
  q('finance_savings', 'finance', 'Will I be able to save money going forward?', 'क्या मैं आगे पैसे बचा पाऊंगा?'),
  q('finance_sudden', 'finance', 'Are there chances of sudden financial gain?', 'क्या अचानक धन लाभ की संभावना है?'),
  q('finance_multiple_income', 'finance', 'Can I have multiple sources of income?', 'क्या मेरे पास आय के कई स्रोत हो सकते हैं?'),
  q('finance_loan', 'finance', 'Is it a favorable time to take a loan?', 'क्या ऋण लेने के लिए यह अनुकूल समय है?'),

  // ── Property & vehicle ────────────────────────────────────────────────────
  q('property_buy', 'property', 'Is this a good time to buy a home?', 'क्या यह घर खरीदने का अच्छा समय है?'),
  q('property_own_house', 'property', 'When will I own my own house?', 'मेरा अपना घर कब होगा?'),
  q('property_vehicle', 'property', 'When will I buy a new vehicle?', 'मैं नया वाहन कब खरीदूंगा?'),
  q('property_land', 'property', 'Do I have a yoga for land or property?', 'क्या मेरी कुंडली में भूमि या संपत्ति का योग है?'),
  q('property_sell', 'property', 'Is it a good time to sell my property?', 'क्या मेरी संपत्ति बेचने का यह अच्छा समय है?'),

  // ── Education & competition ───────────────────────────────────────────────
  q('education_higher', 'education', 'Will I pursue higher education successfully?', 'क्या मैं उच्च शिक्षा सफलतापूर्वक पूरी करूंगा?'),
  q('education_exam', 'education', 'How should I prepare for my examination?', 'मुझे अपनी परीक्षा की तैयारी कैसे करनी चाहिए?'),
  q('education_competition', 'education', 'Will I succeed in competitive exams?', 'क्या मुझे प्रतियोगी परीक्षाओं में सफलता मिलेगी?'),
  q('education_abroad', 'education', 'Are there chances of studying abroad?', 'क्या विदेश में पढ़ाई की संभावना है?'),
  q('education_focus', 'education', 'How can I improve my focus in studies?', 'मैं पढ़ाई में एकाग्रता कैसे बढ़ाऊं?'),

  // ── Health & wellbeing ────────────────────────────────────────────────────
  q('health_general', 'health', 'How will my health be in the coming period?', 'आने वाले समय में मेरा स्वास्थ्य कैसा रहेगा?'),
  q('health_care', 'health', 'Which areas of health should I be careful about?', 'मुझे स्वास्थ्य के किन क्षेत्रों में सावधान रहना चाहिए?'),
  q('health_mental', 'health', 'How can I improve my mental peace?', 'मैं अपनी मानसिक शांति कैसे बढ़ा सकता हूँ?'),
  q('health_energy', 'health', 'How can I keep my energy and vitality strong?', 'मैं अपनी ऊर्जा और जीवनशक्ति कैसे मजबूत रखूं?'),
  q('health_remedies', 'health', 'Which remedies can support my wellbeing?', 'कौन से उपाय मेरे स्वास्थ्य में सहायक हो सकते हैं?'),

  // ── Family & children ─────────────────────────────────────────────────────
  q('family_harmony', 'family', 'How will relations be within my family?', 'मेरे परिवार में संबंध कैसे रहेंगे?'),
  q('family_children', 'family', 'When will I be blessed with children?', 'मुझे संतान सुख कब प्राप्त होगा?'),
  q('family_child_future', 'family', "How will my child's future be?", 'मेरे बच्चे का भविष्य कैसा रहेगा?'),
  q('family_parents', 'family', "How can I support my parents' wellbeing?", 'मैं अपने माता-पिता के कल्याण में कैसे सहयोग करूं?'),
  q('family_disputes', 'family', 'Will ongoing family disputes get resolved?', 'क्या चल रहे पारिवारिक विवाद सुलझेंगे?'),

  // ── Foreign & travel ──────────────────────────────────────────────────────
  q('foreign_settlement', 'foreign', 'Do I have a yoga for settling abroad?', 'क्या मेरी कुंडली में विदेश में बसने का योग है?'),
  q('foreign_travel', 'foreign', 'Are there foreign travel opportunities ahead?', 'क्या आगे विदेश यात्रा के अवसर हैं?'),
  q('foreign_timing', 'foreign', 'When is a supportive period for going abroad?', 'विदेश जाने के लिए अनुकूल समय कब है?'),

  // ── Spirituality & self-growth ────────────────────────────────────────────
  q('spirit_growth', 'spirituality', 'How is my spiritual growth in this period?', 'इस समय मेरी आध्यात्मिक उन्नति कैसी है?'),
  q('spirit_practice', 'spirituality', 'Which spiritual practice suits me best?', 'कौन सी आध्यात्मिक साधना मेरे लिए सबसे उपयुक्त है?'),
  q('spirit_purpose', 'spirituality', 'What is my life purpose according to my chart?', 'मेरी कुंडली के अनुसार मेरे जीवन का उद्देश्य क्या है?'),
  q('spirit_obstacles', 'spirituality', 'What karmic lessons should I focus on now?', 'इस समय मुझे किन कर्म-पाठों पर ध्यान देना चाहिए?'),

  // ── Timing & general ──────────────────────────────────────────────────────
  q('general_year', 'general', 'How will this year be for me overall?', 'यह साल मेरे लिए कुल मिलाकर कैसा रहेगा?'),
  q('general_current_dasha', 'general', 'What does my current dasha mean for me?', 'मेरी वर्तमान दशा मेरे लिए क्या दर्शाती है?'),
  q('general_sade_sati', 'general', 'How is Sade Sati affecting me right now?', 'साढ़ेसाती इस समय मुझे कैसे प्रभावित कर रही है?'),
  q('general_strengths', 'general', 'What are my greatest strengths in this chart?', 'इस कुंडली में मेरी सबसे बड़ी शक्तियां क्या हैं?'),
  q('general_challenges', 'general', 'Which challenges should I prepare for?', 'मुझे किन चुनौतियों के लिए तैयार रहना चाहिए?'),
  q('general_lucky', 'general', 'What are my lucky areas and periods?', 'मेरे भाग्यशाली क्षेत्र और समय कौन से हैं?'),
  q('general_decision', 'general', 'Is this a good time for a major decision?', 'क्या यह किसी बड़े निर्णय के लिए अच्छा समय है?'),
  q('general_success', 'general', 'When will I achieve the success I am working for?', 'जिस सफलता के लिए मैं प्रयास कर रहा हूँ वह कब मिलेगी?'),
];

// Category display labels (en/hi) for the chip groups.
const CATEGORIES = [
  { key:'career',       en:'Career & Work',        hi:'करियर और काम' },
  { key:'marriage',     en:'Marriage',             hi:'विवाह' },
  { key:'love',         en:'Love & Romance',       hi:'प्रेम' },
  { key:'finance',      en:'Money & Wealth',       hi:'धन' },
  { key:'property',     en:'Property & Vehicle',   hi:'संपत्ति और वाहन' },
  { key:'education',    en:'Education',            hi:'शिक्षा' },
  { key:'health',       en:'Health',               hi:'स्वास्थ्य' },
  { key:'family',       en:'Family & Children',    hi:'परिवार और संतान' },
  { key:'foreign',      en:'Foreign & Travel',     hi:'विदेश और यात्रा' },
  { key:'spirituality', en:'Spirituality',         hi:'आध्यात्म' },
  { key:'general',      en:'Timing & General',     hi:'समय और सामान्य' },
];

// Top questions warmed in the background right after a kundli opens.
const WARM_KEYS = [
  'general_year', 'career_change', 'career_offer', 'marriage_when', 'marriage_life',
  'finance_growth', 'finance_wealth', 'property_buy', 'general_current_dasha',
  'general_sade_sati', 'health_general', 'education_exam', 'career_growth',
  'marriage_delay', 'general_success', 'general_strengths', 'career_business',
  'family_children', 'finance_investment', 'general_decision',
];

const BY_KEY = new Map(QUESTIONS.map((item) => [item.key, item]));

function getByKey(key) { return BY_KEY.get(key) || null; }
function isValidKey(key) { return BY_KEY.has(key); }

// Bank grouped for the client (categories in order, each with its questions).
function grouped() {
  return CATEGORIES
    .map((c) => ({ ...c, questions: QUESTIONS.filter((item) => item.category === c.key).map(({ key, en, hi }) => ({ key, en, hi })) }))
    .filter((c) => c.questions.length);
}

module.exports = { QUESTIONS, CATEGORIES, WARM_KEYS, getByKey, isValidKey, grouped };
