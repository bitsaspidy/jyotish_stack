'use strict';
/**
 * Converts technical planet data into safe, actionable user-facing language.
 * Safety rules from task spec:
 *   - No fear-based phrases (death, curse, divorce guaranteed, etc.)
 *   - No gemstone as default recommendation
 *   - Soft language: "needs support", "extra care recommended", etc.
 *   - English stays English, Hindi stays Hindi
 */

const IMPACT = {
  Sun:     { en: 'confidence, father, authority and career',             hi: 'आत्मविश्वास, पिता, अधिकार और करियर' },
  Moon:    { en: 'mind, emotions, mother and mental peace',              hi: 'मन, भावनाएं, माता और मानसिक शांति' },
  Mars:    { en: 'energy, courage, property and siblings',               hi: 'ऊर्जा, साहस, संपत्ति और भाई-बहन' },
  Mercury: { en: 'communication, intellect and business',                hi: 'संवाद, बुद्धि और व्यापार' },
  Jupiter: { en: 'wisdom, fortune, children and growth',                 hi: 'ज्ञान, भाग्य, संतान और समृद्धि' },
  Venus:   { en: 'love, relationships, beauty and finance',              hi: 'प्रेम, संबंध, सौंदर्य और वित्त' },
  Saturn:  { en: 'discipline, karma and long-term progress',             hi: 'अनुशासन, कर्म और दीर्घकालिक प्रगति' },
  Rahu:    { en: 'ambition, technology and foreign matters',             hi: 'महत्वाकांक्षा, तकनीक और विदेश' },
  Ketu:    { en: 'spirituality, past karma and inner wisdom',            hi: 'आध्यात्म, पूर्व कर्म और आंतरिक ज्ञान' },
};

const BENEFIT = {
  Sun:     { en: 'Greater confidence, clarity in career and improved relationships with authority figures.', hi: 'आत्मविश्वास में वृद्धि, करियर में स्पष्टता और अधिकारियों के साथ बेहतर संबंध।' },
  Moon:    { en: 'Mental peace, emotional stability and a better connection with the nurturing side of life.', hi: 'मानसिक शांति, भावनात्मक स्थिरता और जीवन के पोषण पक्ष से बेहतर जुड़ाव।' },
  Mars:    { en: 'Increased energy and courage, smoother property matters and better sibling harmony.', hi: 'ऊर्जा और साहस में वृद्धि, संपत्ति मामलों में सुधार और भाई-बहनों के साथ सौहार्द।' },
  Mercury: { en: 'Sharper communication and intellect, success in business and academic pursuits.', hi: 'तीक्ष्ण संवाद और बुद्धि, व्यापार और शैक्षिक प्रयासों में सफलता।' },
  Jupiter: { en: 'Enhanced wisdom and fortune, blessings for children and growth in all life areas.', hi: 'ज्ञान और भाग्य में वृद्धि, संतान के लिए आशीर्वाद और सभी जीवन क्षेत्रों में विकास।' },
  Venus:   { en: 'Harmonious relationships, improved finances, creativity and a more joyful life.', hi: 'सौहार्दपूर्ण संबंध, बेहतर वित्त, सृजनात्मकता और अधिक आनंदमय जीवन।' },
  Saturn:  { en: 'Reduced delays and obstacles, better discipline and steady long-term progress.', hi: 'विलंब और बाधाओं में कमी, बेहतर अनुशासन और स्थिर दीर्घकालिक प्रगति।' },
  Rahu:    { en: 'Clarity in goals, reduced confusion and anxiety, better results from efforts.', hi: 'लक्ष्यों में स्पष्टता, भ्रम और चिंता में कमी, प्रयासों से बेहतर परिणाम।' },
  Ketu:    { en: 'Spiritual progress, release from past burdens and enhanced inner intuition.', hi: 'आध्यात्मिक प्रगति, पुराने बोझ से मुक्ति और बढ़ी हुई आंतरिक अंतर्ज्ञान।' },
};

const MANTRA_COUNT = { critical: 108, high: 54, medium: 27, low: 11, healthy: 9 };

// Phrases banned from user mode — must never appear in en/hi user output
const FORBIDDEN_USER_PHRASES_EN = [
  'death', 'die', 'deadly', 'curse', 'cursed', 'divorce guaranteed',
  'no child', 'guaranteed disease', 'miscarriage will happen',
  'doomed', 'ruined', 'dangerous dosha', 'malefic curse',
];

function isSafe(text) {
  if (!text || typeof text !== 'string') return true;
  const lower = text.toLowerCase();
  return !FORBIDDEN_USER_PHRASES_EN.some(phrase => lower.includes(phrase));
}

/**
 * Build daily remedy text for a planet.
 */
function buildDailyRemedy(planet, priority, remedyRef, lang) {
  const count = MANTRA_COUNT[priority] || 27;
  const isEn  = lang !== 'hi';
  if (isEn) {
    // English: reference mantra by name only — Devanagari beeja mantra shown separately in ref card
    return remedyRef?.primary_text
      ? `Each morning after bath, recite the ${planet} Beeja Mantra × ${count} times. Also suitable: ${remedyRef.primary_text}.`
      : `Each morning after bath, recite the ${planet} Beeja Mantra × ${count} times.`;
  } else {
    return remedyRef?.beeja_mantra
      ? `स्नान के बाद प्रत्येक प्रातः "${remedyRef.beeja_mantra}" × ${count} बार जाप करें।`
      : `प्रत्येक प्रातः ${planet} बीज मंत्र × ${count} बार जाप करें।`;
  }
}

/**
 * Build weekly remedy text for a planet.
 */
function buildWeeklyRemedy(planet, priority, remedyRef, lang) {
  const isEn = lang !== 'hi';
  const day   = isEn ? remedyRef?.day_en   : remedyRef?.day_hi;
  const daan  = isEn ? remedyRef?.daan_en  : remedyRef?.daan_hi;
  const deity = isEn ? remedyRef?.ishta_devata_en : remedyRef?.ishta_devata_hi;
  if (isEn) {
    return daan
      ? `On ${day}, offer ${daan} as charity and worship ${deity || planet + "'s deity"}.`
      : `On ${day}, perform a simple puja for the deity of ${planet}.`;
  } else {
    return daan
      ? `${day} को ${daan} का दान करें और ${deity || planet} की पूजा करें।`
      : `${day} को ${planet} के देव की सरल पूजा करें।`;
  }
}

/**
 * Build advanced remedy list — gemstone is always marked advisory only.
 */
function buildAdvancedRemedy(planet, priority, remedyRef, lang) {
  const isEn = lang !== 'hi';
  const items = [];
  if (remedyRef?.primary_text) {
    items.push(isEn
      ? `Recite: ${remedyRef.primary_text} — as a sustained sadhana.`
      : `पाठ करें: ${remedyRef.primary_text} — एक निरंतर साधना के रूप में।`);
  }
  if (remedyRef?.yantra) {
    items.push(isEn
      ? `Yantra: Install a ${remedyRef.yantra} after proper energisation by a Jyotishi.`
      : `यंत्र: ज्योतिषी द्वारा उचित प्राण-प्रतिष्ठा के बाद ${remedyRef.yantra} स्थापित करें।`);
  }
  if (remedyRef?.gemstone_en) {
    // Gemstone always shown advisory only — never as a default recommendation
    items.push(isEn
      ? `Gemstone reference: ${remedyRef.gemstone_en} — consult a qualified Jyotishi before wearing any gemstone.`
      : `रत्न संदर्भ: ${remedyRef.gemstone_hi || remedyRef.gemstone_en} — कोई भी रत्न धारण करने से पहले योग्य ज्योतिषी से परामर्श करें।`);
  }
  return items;
}

/**
 * Build why-triggered text for a planet remedy (user mode — safe language).
 */
function buildWhyText(planet, priority, triggers, lagnaLord, atmakarak, mdLord, adLord, lang) {
  const isEn = lang !== 'hi';
  const impact = IMPACT[planet] || { en: 'its key life areas', hi: 'इसके मुख्य जीवन क्षेत्र' };
  const triggerTexts = triggers.slice(0, 2).map(t => isEn ? t.en : t.hi).join('; ');

  const roles = [];
  if (planet === lagnaLord) roles.push(isEn ? 'your Lagna lord' : 'आपके लग्न स्वामी');
  if (planet === atmakarak)  roles.push(isEn ? 'your Atmakaraka' : 'आपके आत्मकारक');
  if (planet === mdLord)     roles.push(isEn ? 'your current Mahadasha lord' : 'आपके वर्तमान महादशा स्वामी');
  if (planet === adLord)     roles.push(isEn ? 'your current Antardasha lord' : 'आपके वर्तमान अंतरदशा स्वामी');

  const roleText = roles.length ? (isEn ? ` As ${roles.join(' and ')}, it` : ` ${roles.join(' और ')} के रूप में, यह`) : (isEn ? ' It' : ' यह');

  if (isEn) {
    return `${planet} needs extra support at this time. ${triggerTexts}.${roleText} influences your ${impact.en}. Strengthening ${planet} can help bring better balance and results in these areas.`;
  } else {
    return `${planet} (${IMPACT[planet]?.hi?.split(',')[0] || planet}) को इस समय अतिरिक्त सहायता की आवश्यकता है। ${triggerTexts}। ${roleText} आपके ${impact.hi} को प्रभावित करता है। ${planet} को मजबूत करने से इन क्षेत्रों में बेहतर संतुलन और परिणाम मिल सकते हैं।`;
  }
}

module.exports = {
  buildDailyRemedy, buildWeeklyRemedy, buildAdvancedRemedy, buildWhyText,
  isSafe, IMPACT, BENEFIT, MANTRA_COUNT, FORBIDDEN_USER_PHRASES_EN,
};
