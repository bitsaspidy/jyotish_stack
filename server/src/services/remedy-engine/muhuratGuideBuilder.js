'use strict';
/**
 * Static muhurat / timing guidance from "Remedy Class 1, 4th May 2026".
 * This data doesn't change per chart — it's universal practice guidance.
 */

const TIME_WINDOWS = [
  { name_en: 'Brahma Muhurat',         name_hi: 'ब्रह्म मुहूर्त',    time: '4:00 – 5:00 AM',  quality: 'best',    quality_en: 'Best time for all spiritual practice',          quality_hi: 'सभी आध्यात्मिक साधनाओं के लिए सर्वोत्तम समय' },
  { name_en: 'Morning Session',         name_hi: 'प्रातःकाल सत्र',   time: '8:00 – 9:00 AM',  quality: 'good',    quality_en: 'Good for daily mantras and puja',               quality_hi: 'दैनिक मंत्र और पूजा के लिए उत्तम' },
  { name_en: 'Abhijeet Muhurat',        name_hi: 'अभिजीत मुहूर्त',   time: '12:00 – 1:30 PM', quality: 'auspicious', quality_en: 'Midday auspicious window — very powerful',   quality_hi: 'मध्याह्न शुभ विंडो — अत्यंत शक्तिशाली' },
  { name_en: 'Evening / Sandhya Kaal',  name_hi: 'संध्या काल',        time: '6:00 – 7:30 PM',  quality: 'good',    quality_en: 'Good for evening prayers and devotional recitation', quality_hi: 'संध्या प्रार्थना और भक्ति पाठ के लिए उत्तम' },
];

const MUHURAT_PREFER = [
  { name_en: 'Brahma Muhurat',       name_hi: 'ब्रह्म मुहूर्त',        note_en: '~48 mins before sunrise — ideal for Vedic mantras', note_hi: 'सूर्योदय से ~48 मिनट पहले — वैदिक मंत्रों के लिए आदर्श' },
  { name_en: 'Abhijeet Muhurat',     name_hi: 'अभिजीत मुहूर्त',        note_en: 'Around midday — powerful for all planetary remedies', note_hi: 'मध्याह्न के आसपास — सभी ग्रह उपायों के लिए शक्तिशाली' },
  { name_en: 'Amrit Siddhi Yoga',    name_hi: 'अमृत सिद्धि योग',       note_en: 'When active — enhances sadhana results significantly', note_hi: 'सक्रिय होने पर — साधना परिणाम में उल्लेखनीय वृद्धि' },
  { name_en: 'Sarvartha Siddhi Yoga',name_hi: 'सर्वार्थ सिद्धि योग',   note_en: 'All-purpose auspicious yoga — good for starting sadhana', note_hi: 'सर्वउद्देशीय शुभ योग — साधना आरंभ के लिए उत्तम' },
];

const MUHURAT_AVOID = [
  { name_en: 'Rahu Kaal',   name_hi: 'राहु काल',    note_en: 'Daily inauspicious period — avoid starting any new practice', note_hi: 'दैनिक अशुभ काल — कोई भी नई साधना शुरू न करें' },
  { name_en: 'Gulika Kaal', name_hi: 'गुलिका काल',  note_en: 'Son of Saturn — avoid for new beginnings', note_hi: 'शनि का पुत्र — नए आरंभ के लिए टालें' },
  { name_en: 'Yamagandam',  name_hi: 'यमगंडम',      note_en: 'Controlled by Yama — best avoided for sadhana', note_hi: 'यम द्वारा नियंत्रित — साधना के लिए टालना उचित' },
];

const CHOGADIYA = {
  prefer:  ['Amrit', 'Shubh', 'Labh'],
  prefer_hi: ['अमृत', 'शुभ', 'लाभ'],
  neutral: ['Char'],
  neutral_hi: ['चर'],
  avoid:   ['Rog', 'Kaal', 'Udveg'],
  avoid_hi: ['रोग', 'काल', 'उद्वेग'],
};

const VEDIC_RULES = {
  direction_en: 'East',
  direction_hi: 'पूर्व',
  aasan_en: 'Sit on a red woollen aasan or kusha grass mat',
  aasan_hi: 'लाल ऊनी आसन या कुश घास की चटाई पर बैठें',
  aachman: false,
  aachman_note_en: 'Aachman (ritual sipping of water) is not required before each Vedic recitation',
  aachman_note_hi: 'प्रत्येक वैदिक पाठ से पहले आचमन (जल का अनुष्ठानिक सेवन) आवश्यक नहीं है',
};

const PAURANIK_RULES = {
  direction_en: 'Planet-specific (see planet remedy)',
  direction_hi: 'ग्रह-विशिष्ट (ग्रह उपाय देखें)',
  aasan_en: 'Sit on a red woollen aasan or kusha grass mat',
  aasan_hi: 'लाल ऊनी आसन या कुश घास की चटाई पर बैठें',
  aachman: true,
  aachman_note_en: 'Aachman is mandatory before each Pauranik recitation',
  aachman_note_hi: 'प्रत्येक पौराणिक पाठ से पहले आचमन अनिवार्य है',
};

function buildMuhuratGuide() {
  return {
    time_windows:   TIME_WINDOWS,
    muhurat_prefer: MUHURAT_PREFER,
    muhurat_avoid:  MUHURAT_AVOID,
    chogadiya:      CHOGADIYA,
    vedic_rules:    VEDIC_RULES,
    pauranik_rules: PAURANIK_RULES,
  };
}

module.exports = { buildMuhuratGuide };
