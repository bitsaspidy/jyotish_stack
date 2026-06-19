'use strict';
/**
 * Strength Tab Humanizer — Session 55
 * Transforms raw computeKundliStrength() output into bilingual, user-friendly
 * content without fear-based language. Technical data is preserved in
 * technicalDetails for admin/collapsed views.
 */

const PLANET_NAME_HI = {
  Sun:'सूर्य', Moon:'चन्द्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'बृहस्पति', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

// Score → user-friendly label (no "Exceptional", "Challenging", "Needs Remedies")
function friendlyLabel(s) {
  if (s >= 75) return { en:'Strong support',      hi:'मजबूत साथ',              color:'#10B981' };
  if (s >= 60) return { en:'Supportive',           hi:'सहायक',                  color:'#22C55E' };
  if (s >= 45) return { en:'Balanced with effort', hi:'प्रयास से संतुलित',     color:'#F59E0B' };
  if (s >= 30) return { en:'Needs extra care',     hi:'अतिरिक्त ध्यान जरूरी',  color:'#F97316' };
  return             { en:'Handle carefully',      hi:'सावधानी से संभालें',    color:'#EF4444' };
}

// What each planet means for the person's practical life when well-placed
const PLANET_LIFE_SUPPORT = {
  Sun:     { en:'Your career, self-confidence, and authority are well-supported.',      hi:'आपका करियर, आत्मविश्वास और अधिकार अनुकूल हैं।' },
  Moon:    { en:'Your mind, emotional wellbeing, and domestic life are in a good place.',hi:'आपका मन, भावनात्मक सुख और घरेलू जीवन अनुकूल है।' },
  Mars:    { en:'Your energy, courage, and drive to achieve are working in your favor.', hi:'आपकी ऊर्जा, साहस और महत्वाकांक्षा आपके पक्ष में है।' },
  Mercury: { en:'Communication skills, learning, and business acumen support you.',      hi:'संवाद कौशल, शिक्षा और व्यावसायिक बुद्धि आपके साथ है।' },
  Jupiter: { en:'Fortune, wisdom, and prosperity have positive cosmic support.',         hi:'भाग्य, ज्ञान और समृद्धि को सकारात्मक ग्रहीय समर्थन है।' },
  Venus:   { en:'Relationships, creativity, and financial wellbeing flow well.',         hi:'रिश्ते, रचनात्मकता और वित्तीय सुख अच्छे हैं।' },
  Saturn:  { en:'Discipline, longevity, and steady career growth support your path.',    hi:'अनुशासन, दीर्घायु और करियर में स्थिरता आपके मार्ग को सहारा देती है।' },
  Rahu:    { en:'Ambition, technology, and new opportunities are activated for you.',    hi:'महत्वाकांक्षा, तकनीक और नए अवसर आपके लिए सक्रिय हैं।' },
  Ketu:    { en:'Intuition, spiritual depth, and inner wisdom are heightened.',          hi:'अंतर्ज्ञान, आध्यात्मिक गहराई और आंतरिक ज्ञान बढ़ा हुआ है।' },
};

// Soft, constructive language for planets needing support (no fear words)
const PLANET_NEEDS_CARE = {
  Sun:     { en:'Give extra attention to confidence-building, career steps, and your relationship with authority figures.', hi:'आत्मविश्वास बढ़ाने, करियर के कदमों और अधिकारियों के साथ संबंध पर विशेष ध्यान दें।' },
  Moon:    { en:'Nurturing your mental peace and emotional balance will be especially rewarding.',                          hi:'मानसिक शांति और भावनात्मक संतुलन को पोषित करना विशेष रूप से फलदायी होगा।' },
  Mars:    { en:'Channel your energy mindfully — patience and steady effort will serve you better than urgency.',           hi:'अपनी ऊर्जा को सोच-समझकर लगाएं — तत्परता से अधिक धैर्य और स्थिर प्रयास लाभकारी होगा।' },
  Mercury: { en:'Be thoughtful in communication and decisions — careful choices yield better outcomes.',                    hi:'संवाद और निर्णयों में सोच-समझकर आगे बढ़ें — सावधान चुनाव बेहतर परिणाम देते हैं।' },
  Jupiter: { en:'Be patient with growth in fortune and family matters — good things are building.',                        hi:'भाग्य और पारिवारिक मामलों में धैर्य रखें — अच्छी बातें बन रही हैं।' },
  Venus:   { en:'Give thoughtful care to relationships and finances — small daily actions make a lasting difference.',      hi:'रिश्तों और वित्त में सोच-समझकर ध्यान दें — छोटी दैनिक क्रियाएं स्थायी अंतर बनाती हैं।' },
  Saturn:  { en:'Take a steady, step-by-step approach to long-term goals — consistent effort is your strength here.',      hi:'दीर्घकालिक लक्ष्यों के लिए स्थिर, कदम-दर-कदम दृष्टिकोण अपनाएं — यहां निरंतर प्रयास आपकी ताकत है।' },
  Rahu:    { en:'Stay grounded — ambition and new opportunities need discernment to bring lasting benefit.',                hi:'जमीन पर रहें — महत्वाकांक्षा और नए अवसरों में विवेक स्थायी लाभ लाता है।' },
  Ketu:    { en:'Grounding practices and clear focus will help you harness this energy productively.',                      hi:'स्थिरता के अभ्यास और स्पष्ट फोकस से इस ऊर्जा का उत्पादक उपयोग होगा।' },
};

const DOMAIN_MEANINGS = {
  wealth: {
    good: { en:'Income and wealth-building are in a favorable phase.',      hi:'आय और धन-संचय अनुकूल चरण में है।' },
    mid:  { en:'Steady effort supports financial stability and growth.',     hi:'स्थिर प्रयास से वित्तीय स्थिरता और विकास मिलता है।' },
    care: { en:'Give focused attention to savings and financial planning.',  hi:'बचत और वित्त योजना पर ध्यान दें।' },
  },
  career: {
    good: { en:'Career, reputation, and professional recognition are strong.',  hi:'करियर, प्रतिष्ठा और पेशेवर मान्यता मजबूत है।' },
    mid:  { en:'Consistent effort brings steady career progress.',             hi:'निरंतर प्रयास से करियर में धीरे-धीरे प्रगति मिलती है।' },
    care: { en:'Extra patience and persistence will advance your career.',      hi:'करियर के लिए अतिरिक्त धैर्य और दृढ़ता सहायक है।' },
  },
  health: {
    good: { en:'Physical vitality and overall health are well-supported.',    hi:'शारीरिक ऊर्जा और संपूर्ण स्वास्थ्य अनुकूल हैं।' },
    mid:  { en:'Maintaining healthy routines supports sustained wellbeing.',  hi:'नियमित जीवनशैली बनाए रखने से स्वास्थ्य अच्छा रहता है।' },
    care: { en:'Pay mindful attention to health habits and preventive care.', hi:'स्वास्थ्य आदतों और निवारक देखभाल पर ध्यान दें।' },
  },
  marriage: {
    good: { en:'Relationships and love life have strong cosmic support.',          hi:'रिश्तों और प्रेम जीवन को मजबूत ग्रहीय समर्थन है।' },
    mid:  { en:'Open communication keeps relationships harmonious and growing.',   hi:'खुले संवाद से रिश्ते सुखद और विकासशील रहते हैं।' },
    care: { en:'Give care and patience to relationship dynamics.',                 hi:'रिश्तों में धैर्य और देखभाल रखें।' },
  },
  family: {
    good: { en:'Family bonds and domestic happiness are well-favored.',     hi:'परिवार के रिश्ते और घरेलू सुख अनुकूल हैं।' },
    mid:  { en:'Family harmony grows through warmth and understanding.',    hi:'गर्मजोशी और समझ से पारिवारिक सद्भाव बढ़ता है।' },
    care: { en:'Nurture family relationships with patience and love.',      hi:'परिवार के रिश्तों को धैर्य और प्रेम से पोषित करें।' },
  },
  children: {
    good: { en:'Intellect, creativity, and children-related matters are positive.', hi:'बुद्धि, रचनात्मकता और संतान विषय सकारात्मक हैं।' },
    mid:  { en:'Education and creative pursuits reward consistent effort.',         hi:'शिक्षा और रचनात्मक कार्य निरंतर प्रयास से फल देते हैं।' },
    care: { en:'Be patient and supportive with educational and creative goals.',    hi:'शिक्षा और रचनात्मक लक्ष्यों में धैर्य और सहयोग रखें।' },
  },
  fortune: {
    good: { en:'Fortune, higher learning, and dharma are flowing well.',              hi:'भाग्य, उच्च शिक्षा और धर्म अनुकूल हैं।' },
    mid:  { en:'Fortune grows through righteous effort and the right guidance.',      hi:'सत्कर्म और सही मार्गदर्शन से भाग्य बढ़ता है।' },
    care: { en:'Seek guidance, act ethically, and trust the process of growth.',     hi:'मार्गदर्शन लें, नैतिक रहें और विकास की प्रक्रिया पर भरोसा रखें।' },
  },
  spirituality: {
    good: { en:'Spiritual growth and inner peace are naturally supported.',         hi:'आध्यात्मिक विकास और आंतरिक शांति स्वाभाविक रूप से मिलती है।' },
    mid:  { en:'Regular spiritual practice deepens your inner life meaningfully.',  hi:'नियमित आध्यात्मिक अभ्यास आंतरिक जीवन को सार्थक रूप से गहरा करता है।' },
    care: { en:'Mindfulness and spiritual practice can bring steadiness and clarity.',hi:'सचेतनता और आध्यात्मिक अभ्यास से स्थिरता और स्पष्टता मिलती है।' },
  },
};

function domainFriendlyLabel(score) {
  if (score >= 65) return { en:'Flowing',       hi:'अनुकूल',       color:'#10B981' };
  if (score >= 50) return { en:'Balanced',       hi:'संतुलित',      color:'#22C55E' };
  if (score >= 36) return { en:'With care',      hi:'ध्यान रखें',  color:'#F59E0B' };
  return                   { en:'Needs nurture', hi:'पोषण जरूरी',  color:'#F97316' };
}

function domainMeaning(key, score) {
  const m = DOMAIN_MEANINGS[key];
  if (!m) return { en:'This area of life is active.', hi:'जीवन का यह क्षेत्र सक्रिय है।' };
  if (score >= 65) return m.good;
  if (score >= 42) return m.mid;
  return m.care;
}

function buildYogaSummary(strength, judgement) {
  const yogaArea = (judgement?.areas || []).find(a => a.areaKey === 'yogas');
  const activated = yogaArea?.yogas || [];

  if (!activated.length) {
    const count = strength.yoga_count || 0;
    return {
      en: count > 0
        ? `${count} auspicious combination${count !== 1 ? 's' : ''} found in the chart — these can be further activated through dedicated practice.`
        : 'No specific yoga combinations were detected in this chart.',
      hi: count > 0
        ? `कुंडली में ${count} शुभ संयोजन मिले — समर्पित साधना से इन्हें और सक्रिय किया जा सकता है।`
        : 'इस कुंडली में कोई विशेष योग संयोजन नहीं मिला।',
    };
  }

  const full    = activated.filter(y => y.activation === 'full').length;
  const partial = activated.filter(y => y.activation === 'partial').length;
  const weak    = activated.filter(y => y.activation === 'weak').length;
  const blocked = activated.filter(y => y.activation === 'blocked').length;
  const total   = activated.length;

  const parts_en = [], parts_hi = [];
  if (full)    { parts_en.push(`${full} fully active`);       parts_hi.push(`${full} पूर्ण सक्रिय`);       }
  if (partial) { parts_en.push(`${partial} partially active`);parts_hi.push(`${partial} आंशिक सक्रिय`);  }
  if (weak)    { parts_en.push(`${weak} building`);           parts_hi.push(`${weak} निर्माणाधीन`);       }
  if (blocked) { parts_en.push(`${blocked} not yet active`);  parts_hi.push(`${blocked} अभी सक्रिय नहीं`);}

  const activeNote_en = full > 0
    ? 'Active combinations are directly blessing your current life phase.'
    : 'Consistent practice helps unlock deeper potential.';
  const activeNote_hi = full > 0
    ? 'सक्रिय संयोजन वर्तमान जीवन चरण में सीधे आशीर्वाद दे रहे हैं।'
    : 'निरंतर साधना से गहरी संभावनाएं सक्रिय होती हैं।';

  return {
    en: `${total} auspicious combination${total !== 1 ? 's' : ''} found: ${parts_en.join(', ')}. ${activeNote_en}`,
    hi: `${total} शुभ संयोजन मिले: ${parts_hi.join(', ')}। ${activeNote_hi}`,
  };
}

function dashaLevel(score) {
  if (score >= 65) return 'strong';
  if (score >= 45) return 'balanced';
  return 'needs-care';
}

function buildDashaSummary(strength) {
  const maha  = strength.current_mahadasha;
  const antar = strength.current_antardasha;
  if (!maha) return null;

  const mahaScore  = maha.score || 50;
  const antarScore = antar?.score || 50;
  const support    = dashaLevel(strength.dasha_score || 50);

  const mahaEn  = maha.planet;
  const mahaHi  = maha.planet_hi;
  const antarEn = antar?.planet || null;
  const antarHi = antar?.planet_hi || null;

  const periodEn = antar ? `${mahaEn} Mahadasha / ${antarEn} Antardasha` : `${mahaEn} Mahadasha`;
  const periodHi = antar ? `${mahaHi} महादशा / ${antarHi} अंतर्दशा`     : `${mahaHi} महादशा`;

  let simpleMeaningEn, simpleMeaningHi, adviceEn, adviceHi;

  if (support === 'strong') {
    simpleMeaningEn = `Your current ${periodEn} is a supportive period — this is a good time to pursue your goals with confidence.`;
    simpleMeaningHi = `आपकी वर्तमान ${periodHi} एक अनुकूल अवधि है — इस समय आत्मविश्वास के साथ अपने लक्ष्यों का पीछा करें।`;
    adviceEn = 'Make the most of this favorable period — take initiative and build lasting foundations.';
    adviceHi = 'इस अनुकूल अवधि का पूरा लाभ उठाएं — पहल करें और मजबूत नींव बनाएं।';
  } else if (support === 'balanced') {
    simpleMeaningEn = `The current ${periodEn} is a balanced period — results come with steady, focused effort.`;
    simpleMeaningHi = `वर्तमान ${periodHi} एक संतुलित अवधि है — स्थिर, केंद्रित प्रयास से परिणाम आते हैं।`;
    adviceEn = 'Stay consistent and patient — this period rewards preparation and persistence.';
    adviceHi = 'निरंतर और धैर्यवान रहें — यह अवधि तैयारी और दृढ़ता को पुरस्कृत करती है।';
  } else {
    simpleMeaningEn = `The current ${periodEn} calls for extra patience and mindfulness — this is a time for inner work and careful choices.`;
    simpleMeaningHi = `वर्तमान ${periodHi} में अतिरिक्त धैर्य और सचेतनता की जरूरत है — यह आंतरिक कार्य और सावधान निर्णयों का समय है।`;
    adviceEn = 'Focus on inner resilience, daily spiritual practices, and gradual steady progress.';
    adviceHi = 'आंतरिक दृढ़ता, दैनिक आध्यात्मिक अभ्यास और धीरे-धीरे स्थिर प्रगति पर ध्यान दें।';
  }

  return {
    mahaLord:    mahaEn,
    mahaLordHi:  mahaHi,
    mahaScore,
    mahaEndDate: maha.end_date || null,
    antarLord:    antarEn,
    antarLordHi:  antarHi,
    antarScore:   antar ? antarScore : null,
    antarEndDate: antar?.end_date || null,
    simpleMeaningEn,
    simpleMeaningHi,
    adviceEn,
    adviceHi,
    supportLevel: support,
  };
}

function buildScoreBreakdownCards(strength) {
  const MEANINGS = {
    planets: {
      good: { en:'Your planets are well-placed and supporting key areas of life.',            hi:'आपके ग्रह अच्छी स्थिति में हैं और जीवन के मुख्य क्षेत्रों को सहारा देते हैं।' },
      mid:  { en:'Most planets support you — some areas reward mindful attention.',           hi:'अधिकांश ग्रह आपका समर्थन करते हैं — कुछ क्षेत्रों में सचेत ध्यान फायदेमंद है।' },
      care: { en:'Some planetary positions suggest spiritual support and extra care will help.',hi:'कुछ ग्रह स्थितियां संकेत देती हैं कि आध्यात्मिक समर्थन और अतिरिक्त ध्यान सहायक होगा।' },
    },
    yogas: {
      good: { en:'Auspicious combinations in your chart are actively working in your favor.',hi:'आपकी कुंडली में शुभ संयोजन सक्रिय रूप से आपके पक्ष में काम कर रहे हैं।' },
      mid:  { en:'Beneficial combinations are present — regular practice helps activate them.', hi:'शुभ संयोजन मौजूद हैं — नियमित अभ्यास से इन्हें सक्रिय करने में मदद मिलती है।' },
      care: { en:'The chart shows some patterns that benefit from remedies and guidance.',    hi:'कुंडली में कुछ पैटर्न हैं जिन्हें उपाय और मार्गदर्शन से लाभ होता है।' },
    },
    domains: {
      good: { en:'Most life areas are flowing well — enjoy and build on this foundation.',   hi:'अधिकांश जीवन क्षेत्र अच्छे से चल रहे हैं — इस नींव पर निर्माण करें।' },
      mid:  { en:'Life areas are reasonably balanced — focused attention on weaker areas helps.', hi:'जीवन के क्षेत्र उचित रूप से संतुलित हैं — कमजोर क्षेत्रों पर ध्यान देना फायदेमंद है।' },
      care: { en:'Some life areas need nurturing and patient effort to reach their potential.', hi:'कुछ जीवन क्षेत्रों को उनकी क्षमता तक पहुंचने के लिए पोषण और धैर्यपूर्ण प्रयास की जरूरत है।' },
    },
    dasha: {
      good: { en:'The current planetary period is favorable — timing is on your side.',     hi:'वर्तमान ग्रह काल अनुकूल है — समय आपके पक्ष में है।' },
      mid:  { en:'The current period rewards steady effort — consistency will bring results.', hi:'वर्तमान काल स्थिर प्रयास को पुरस्कृत करता है — निरंतरता से परिणाम मिलेंगे।' },
      care: { en:'The current period calls for patience and inner strength.',                hi:'वर्तमान काल में धैर्य और आंतरिक शक्ति की जरूरत है।' },
    },
  };

  return [
    { key:'planets', score:strength.planet_avg,  titleEn:'Planet Support',          titleHi:'ग्रह समर्थन'          },
    { key:'yogas',   score:strength.yoga_score,  titleEn:'Auspicious Combinations', titleHi:'शुभ संयोजन'           },
    { key:'domains', score:strength.domain_avg,  titleEn:'Life Areas',              titleHi:'जीवन क्षेत्र'         },
    { key:'dasha',   score:strength.dasha_score, titleEn:'Current Life Phase',      titleHi:'वर्तमान जीवन चरण'    },
  ].map(card => {
    const m = MEANINGS[card.key];
    const meaning = card.score >= 65 ? m.good : card.score >= 45 ? m.mid : m.care;
    return { ...card, simpleMeaningEn: meaning.en, simpleMeaningHi: meaning.hi };
  });
}

/**
 * Main export.
 * @param {object} strength   — output of computeKundliStrength()
 * @param {object} judgement  — output of generateJudgement() (may be null)
 * @param {object} chart      — raw chart (reserved for future use)
 * @param {object} opts       — { lang } (unused; both languages always generated)
 */
function composeStrengthUserFriendly(strength, judgement, chart, opts = {}) {
  if (!strength) return null;

  const s = strength.overall_score || 0;
  const overallLabel = friendlyLabel(s);

  let simpleMeaningEn, simpleMeaningHi, adviceEn, adviceHi;

  if (s >= 75) {
    simpleMeaningEn = 'Your Kundli shows strong planetary support across key life areas. This is a foundation you can build on with confidence.';
    simpleMeaningHi = 'आपकी कुंडली में मुख्य जीवन क्षेत्रों में मजबूत ग्रहीय समर्थन है। यह एक ऐसी नींव है जिस पर आप आत्मविश्वास के साथ निर्माण कर सकते हैं।';
    adviceEn = 'Focus on aligned action — your chart supports your efforts well right now.';
    adviceHi = 'संरेखित कार्य पर ध्यान दें — आपकी कुंडली अभी आपके प्रयासों का अच्छा समर्थन करती है।';
  } else if (s >= 60) {
    simpleMeaningEn = 'Your Kundli is supportive overall. Most life areas have planetary backing — with focused effort, results come steadily.';
    simpleMeaningHi = 'आपकी कुंडली कुल मिलाकर सहायक है। अधिकांश जीवन क्षेत्रों में ग्रहीय समर्थन है — केंद्रित प्रयास से परिणाम स्थिरता से आते हैं।';
    adviceEn = 'Keep going — your chart is an ally. Stay consistent in your efforts.';
    adviceHi = 'आगे बढ़ते रहें — आपकी कुंडली आपकी सहयोगी है। अपने प्रयासों में निरंतर रहें।';
  } else if (s >= 45) {
    simpleMeaningEn = 'Your Kundli is balanced — strengths and growth areas exist side by side. Conscious effort and right guidance unlock your potential.';
    simpleMeaningHi = 'आपकी कुंडली संतुलित है — शक्तियां और विकास के क्षेत्र दोनों मौजूद हैं। सचेत प्रयास और सही मार्गदर्शन आपकी क्षमता को खोलते हैं।';
    adviceEn = 'Work with your strengths and give gentle attention to areas that need care.';
    adviceHi = 'अपनी शक्तियों के साथ काम करें और जिन क्षेत्रों में ध्यान की जरूरत है उन्हें कोमलता से संभालें।';
  } else if (s >= 30) {
    simpleMeaningEn = 'Your Kundli shows some areas that need extra care and support. With patience and the right approach, steady growth is very possible.';
    simpleMeaningHi = 'आपकी कुंडली कुछ ऐसे क्षेत्र दिखाती है जिन्हें अतिरिक्त देखभाल और समर्थन की जरूरत है। धैर्य और सही दृष्टिकोण से स्थिर विकास बिल्कुल संभव है।';
    adviceEn = 'Seek guidance, practice daily remedies, and trust that steady effort builds the life you deserve.';
    adviceHi = 'मार्गदर्शन लें, दैनिक उपाय करें और विश्वास रखें कि स्थिर प्रयास आपका जीवन बनाता है।';
  } else {
    simpleMeaningEn = 'This chart calls for compassionate self-care and dedicated daily practice. Each step forward is meaningful.';
    simpleMeaningHi = 'यह कुंडली करुणामय आत्म-देखभाल और समर्पित दैनिक अभ्यास की मांग करती है। हर कदम आगे सार्थक है।';
    adviceEn = 'Focus on daily practice, health, and seeking support — transformation comes step by step.';
    adviceHi = 'दैनिक अभ्यास, स्वास्थ्य और सहयोग पर ध्यान दें — परिवर्तन कदम-कदम से आता है।';
  }

  // Top strengths — planets with score >= 70
  const planetScores = strength.planet_scores || {};
  const topStrengths = Object.entries(planetScores)
    .filter(([, sc]) => sc >= 70)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([planet, score]) => ({
      planet,
      planetHi: PLANET_NAME_HI[planet] || planet,
      score,
      simpleMeaningEn: PLANET_LIFE_SUPPORT[planet]?.en || `${planet} is well-placed and supportive in your chart.`,
      simpleMeaningHi: PLANET_LIFE_SUPPORT[planet]?.hi || `${PLANET_NAME_HI[planet] || planet} आपकी कुंडली में अनुकूल है।`,
    }));

  // Needs care — planets with score <= 40, soft language only
  const needsCare = Object.entries(planetScores)
    .filter(([, sc]) => sc <= 40)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([planet, score]) => ({
      planet,
      planetHi: PLANET_NAME_HI[planet] || planet,
      score,
      simpleMeaningEn: PLANET_NEEDS_CARE[planet]?.en || `${planet} benefits from extra attention and spiritual support.`,
      simpleMeaningHi: PLANET_NEEDS_CARE[planet]?.hi || `${PLANET_NAME_HI[planet] || planet} को अतिरिक्त ध्यान और आध्यात्मिक समर्थन से लाभ होता है।`,
    }));

  // Life domains
  const DOMAIN_ORDER = ['wealth','career','health','marriage','family','children','fortune','spirituality'];
  const lifeDomains = DOMAIN_ORDER.map(key => {
    const d = (strength.life_domains?.[key]) || (strength.life_domain_list || []).find(x => x?.key === key);
    if (!d) return null;
    const label   = domainFriendlyLabel(d.score);
    const meaning = domainMeaning(key, d.score);
    return {
      key,
      titleEn: d.en,
      titleHi: d.hi,
      score:   d.score,
      labelEn: label.en,
      labelHi: label.hi,
      color:   label.color,
      simpleMeaningEn: meaning.en,
      simpleMeaningHi: meaning.hi,
    };
  }).filter(Boolean);

  return {
    overall: {
      score:          s,
      labelEn:        overallLabel.en,
      labelHi:        overallLabel.hi,
      color:          overallLabel.color,
      simpleMeaningEn,
      simpleMeaningHi,
      adviceEn,
      adviceHi,
    },
    scoreBreakdownCards: buildScoreBreakdownCards(strength),
    yogaSummaryEn: buildYogaSummary(strength, judgement).en,
    yogaSummaryHi: buildYogaSummary(strength, judgement).hi,
    topStrengths,
    needsCare,
    lifeDomains,
    dashaSummary:    buildDashaSummary(strength),
    technicalDetails: { ...strength },
  };
}

module.exports = { composeStrengthUserFriendly };
