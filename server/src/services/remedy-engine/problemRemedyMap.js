'use strict';
// Problem → Remedy mapping — "Remedy Class 1, 4th May 2026"

const PROBLEM_REMEDY_MAP = {
  disease: {
    key: 'disease',
    icon: '🏥',
    label_en: 'Diseases & Health Challenges',
    label_hi: 'रोग और स्वास्थ्य समस्याएं',
    planet: 'Mars',
    deity_en: 'Hanuman / Narsimha',
    deity_hi: 'हनुमान / नरसिंह',
    mantras_en: ['Hanuman Bahuk', 'Rog Nivaran Suktam'],
    mantras_hi: ['हनुमान बाहुक', 'रोग निवारण सूक्तम'],
    action_en:
      'Recite Hanuman Bahuk or Rog Nivaran Suktam daily. Tuesday worship of Hanuman is especially beneficial.',
    action_hi:
      'हनुमान बाहुक या रोग निवारण सूक्तम का दैनिक पाठ करें। मंगलवार को हनुमान जी की विशेष पूजा लाभकारी होती है।',
    duration_en: '43 days minimum — 90 days recommended for serious conditions',
    duration_hi: 'न्यूनतम 43 दिन — गंभीर स्थिति में 90 दिन अनुशंसित',
    safety_en:
      'Mantra recitation is a complementary spiritual practice. Always consult a qualified medical doctor for health conditions.',
    safety_hi:
      'मंत्र जाप एक पूरक आध्यात्मिक साधना है। स्वास्थ्य समस्याओं के लिए हमेशा योग्य चिकित्सक से परामर्श लें।',
    trigger_houses: [6],
    trigger_planet_weak: ['Mars', 'Saturn'],
    force_90_days: false,
  },
  debt: {
    key: 'debt',
    icon: '💸',
    label_en: 'Financial Burden & Debts',
    label_hi: 'ऋण और वित्तीय बोझ',
    planet: 'Mars',
    deity_en: 'Hanuman / Mangal Dev',
    deity_hi: 'हनुमान / मंगल देव',
    mantras_en: ['Rinn Mochan Mangal Stotra'],
    mantras_hi: ['ऋण मोचन मंगल स्तोत्र'],
    action_en:
      'Recite Rinn Mochan Mangal Stotra on Tuesdays. Chanting 108 times during financial difficulty brings relief.',
    action_hi:
      'मंगलवार को ऋण मोचन मंगल स्तोत्र का पाठ करें। आर्थिक कठिनाई में 108 बार जाप से राहत मिलती है।',
    duration_en: '43 days',
    duration_hi: '43 दिन',
    safety_en: '',
    safety_hi: '',
    trigger_houses: [6, 8, 12],
    trigger_planet_weak: ['Mars', 'Jupiter'],
    force_90_days: false,
  },
  pregnancy: {
    key: 'pregnancy',
    icon: '🤱',
    label_en: 'Pregnancy Care & Child Wellbeing',
    label_hi: 'गर्भावस्था और शिशु कल्याण',
    planet: 'Mars',
    deity_en: 'Narsimha / Hanuman',
    deity_hi: 'नरसिंह / हनुमान',
    mantras_en: ['Pragya Vivardhan Stotra'],
    mantras_hi: ['प्रज्ञा विवर्धन स्तोत्र'],
    action_en:
      'Recite Pragya Vivardhan Stotra for pregnancy protection, child wellbeing, and emotional balance during this period.',
    action_hi:
      'गर्भ रक्षा, शिशु कल्याण और इस अवधि में भावनात्मक संतुलन के लिए प्रज्ञा विवर्धन स्तोत्र का पाठ करें।',
    duration_en: '90 days recommended',
    duration_hi: '90 दिन अनुशंसित',
    safety_en:
      'Always consult your doctor for pregnancy-related health matters. This is a complementary spiritual practice, not a medical treatment.',
    safety_hi:
      'गर्भावस्था संबंधी स्वास्थ्य विषयों के लिए हमेशा अपने डॉक्टर से सलाह लें। यह चिकित्सा उपचार नहीं, एक पूरक आध्यात्मिक साधना है।',
    trigger_houses: [5],
    trigger_planet_weak: ['Mars', 'Jupiter'],
    force_90_days: true,
  },
  anger: {
    key: 'anger',
    icon: '🌊',
    label_en: 'Anger & Emotional Imbalance',
    label_hi: 'क्रोध और भावनात्मक असंतुलन',
    planet: 'Mars',
    deity_en: 'Narsimha / Hanuman',
    deity_hi: 'नरसिंह / हनुमान',
    mantras_en: ['Pragya Vivardhan Stotra', 'Hanuman Bahuk'],
    mantras_hi: ['प्रज्ञा विवर्धन स्तोत्र', 'हनुमान बाहुक'],
    action_en:
      'Recite Pragya Vivardhan Stotra daily for inner patience and clarity. Hanuman Bahuk provides strength and grounding.',
    action_hi:
      'आंतरिक धैर्य और स्पष्टता के लिए प्रतिदिन प्रज्ञा विवर्धन स्तोत्र का पाठ करें। हनुमान बाहुक शक्ति और स्थिरता प्रदान करता है।',
    duration_en: '43 days',
    duration_hi: '43 दिन',
    safety_en: '',
    safety_hi: '',
    trigger_houses: [],
    trigger_planet_weak: ['Mars', 'Rahu'],
    force_90_days: false,
  },
  vastu: {
    key: 'vastu',
    icon: '🏠',
    label_en: 'Vastu & Home Harmony',
    label_hi: 'वास्तु और गृह सौहार्द',
    planet: 'Moon',
    deity_en: 'Lord Shiva / Moon',
    deity_hi: 'भगवान शिव / चंद्र',
    mantras_en: ['1001 Vastu Suktam', 'Sri Rudram Namakam & Chamakam'],
    mantras_hi: ['1001 वास्तु सूक्तम', 'श्री रुद्रम नमकम और चमकम'],
    action_en:
      'Recite 1001 Vastu Suktam facing East for 90 days. A Parad (mercury) or Narmadeshwar Shiv Linga may be installed in the home after consulting a qualified Jyotishi.',
    action_hi:
      'पूर्व दिशा की ओर मुखकर 90 दिनों तक 1001 वास्तु सूक्तम का पाठ करें। योग्य ज्योतिषी से परामर्श के बाद घर में पारद या नर्मदेश्वर शिव लिंग स्थापित किया जा सकता है।',
    duration_en: '90 days (full cycle — cannot be shortened)',
    duration_hi: '90 दिन (पूर्ण चक्र — संक्षिप्त नहीं किया जा सकता)',
    safety_en:
      'Consult a qualified Vastu expert and Jyotishi before making structural or physical changes to the home.',
    safety_hi:
      'घर में संरचनात्मक या भौतिक परिवर्तन से पहले योग्य वास्तु विशेषज्ञ और ज्योतिषी से परामर्श लें।',
    direction: 'East',
    special_items_en: 'Parad Shiv Linga or Narmadeshwar Shiv Linga (after Jyotishi consultation)',
    special_items_hi: 'पारद शिव लिंग या नर्मदेश्वर शिव लिंग (ज्योतिषी परामर्श के बाद)',
    trigger_houses: [4],
    trigger_planet_weak: ['Moon', 'Saturn', 'Rahu'],
    force_90_days: true,
  },
  wealth: {
    key: 'wealth',
    icon: '💰',
    label_en: 'Wealth & Prosperity',
    label_hi: 'धन और समृद्धि',
    planet: 'Venus',
    deity_en: 'Goddess Lakshmi',
    deity_hi: 'देवी लक्ष्मी',
    mantras_en: ['Sri Suktam'],
    mantras_hi: ['श्री सूक्तम'],
    action_en:
      'Recite Sri Suktam daily, especially on Fridays. Light a ghee lamp while reciting for enhanced results.',
    action_hi:
      'श्री सूक्तम का प्रतिदिन, विशेषकर शुक्रवार को, पाठ करें। पाठ के दौरान घी का दीपक जलाने से परिणाम और बेहतर होते हैं।',
    duration_en: '43 days',
    duration_hi: '43 दिन',
    safety_en: '',
    safety_hi: '',
    trigger_houses: [2, 11],
    trigger_planet_weak: ['Venus', 'Jupiter'],
    force_90_days: false,
  },
  learning: {
    key: 'learning',
    icon: '📚',
    label_en: 'Intelligence & Learning',
    label_hi: 'बुद्धि और शिक्षा',
    planet: 'Jupiter',
    deity_en: 'Lord Vishnu / Brihaspati',
    deity_hi: 'भगवान विष्णु / बृहस्पति',
    mantras_en: ['Medha Suktam', 'Navgraha Suktam'],
    mantras_hi: ['मेधा सूक्तम', 'नवग्रह सूक्तम'],
    action_en:
      'Recite Medha Suktam daily for memory, learning, and sharp intellect. Navgraha Suktam provides overall planetary harmony.',
    action_hi:
      'स्मृति, अध्ययन और तीक्ष्ण बुद्धि के लिए प्रतिदिन मेधा सूक्तम का पाठ करें। नवग्रह सूक्तम समग्र ग्रह सौहार्द प्रदान करता है।',
    duration_en: '43 days',
    duration_hi: '43 दिन',
    safety_en: '',
    safety_hi: '',
    trigger_houses: [5],
    trigger_planet_weak: ['Jupiter', 'Mercury'],
    force_90_days: false,
  },
};

module.exports = { PROBLEM_REMEDY_MAP };
