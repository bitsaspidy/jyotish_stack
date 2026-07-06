'use strict';
/**
 * LAYER 9 — Navamsha (D9) Activation
 * D9 activates after ~36 years or after marriage.
 * Use D9 for marriage depth, post-marriage growth, and dharma.
 */
const {
  houseOf, houseLordName, normDignity, dignityScore,
  isStrongDignity, isWeakDignity, isDusthana, isKendra, isTrikona,
  getAfflictions, afflictionPenalty,
  clamp, statusFromScore, pHi, estimateAge,
} = require('./helpers');
const { hasMarriageOccurred, normalizeMaritalStatus } = require('../../utils/marital-status');

function evaluateNavamsha(chart, lagnaResult, profile = {}) {
  const age          = estimateAge(profile);
  const d9Chart      = chart?.varga_analysis?.d9 || null;
  const maritalStatus = normalizeMaritalStatus(profile.marital_status ?? profile.maritalStatus) ?? null;
  const activatedByMarriage = hasMarriageOccurred(profile);
  const activatedByAge = age !== null ? age >= 36 : false;
  const d9Activated  = activatedByMarriage || activatedByAge || age === null;
  const activationReason = activatedByMarriage ? 'marriage' : activatedByAge ? 'age-36' : age === null ? 'age-unknown' : 'not-yet-active';

  // If D9 data is not available, return a default
  if (!d9Chart || !chart.planets) {
    return _noD9Result(lagnaResult, d9Activated, age, {
      maritalStatus, activatedByMarriage, activatedByAge, activationReason,
    });
  }

  // Use main chart's planets since D9 positions are stored in varga_matrix
  // Access D9 lagna from varga_matrix if available
  const vagaMatrix   = chart?.reports?.varga_matrix;
  const d9Row        = vagaMatrix?.rows?.find(r => r.division === 'D9' || r.division_name === 'Navamsha');

  // Get D9 Lagna from the varga_analysis
  const d9LagnaRashi = chart?.varga_analysis?.d9?.lagna_rashi || null;

  // Assess main chart marriage indicators (already done in marriageJudgement)
  // Here we look at D9 supplementally
  const d9LordName   = d9LagnaRashi ? houseLordName(d9LagnaRashi, 1) : null;
  const d9LordInMain = d9LordName ? chart.planets[d9LordName] : null;

  // D9 strength is estimated from:
  // 1. D9 reading quality from varga_analysis
  // 2. Whether main-chart planets are strong in D9 (via guidance_en/hi from the varga analysis)
  const d9Guidance   = d9Chart?.guidance_en || d9Chart?.role_en || '';

  // Estimate D9 quality from keywords in guidance
  const d9Positive   = /well|strong|good|positive|support|benefit|exalt|own/i.test(d9Guidance);
  const d9Negative   = /weak|debil|challenge|difficult|afflict|struggle/i.test(d9Guidance);
  const d9Score      = d9Positive ? 70 : d9Negative ? 38 : 55;

  // Compare with main chart (from lagnaResult)
  const mainScore    = lagnaResult?.score ?? 50;

  const blockers     = [];
  const amplifiers   = [];
  const notes        = [];
  const notesHi      = [];

  if (!d9Activated) {
    notes.push(`D9 (Navamsha) chart activates more strongly after age 36 or after marriage. Currently (age ${age ?? 'unknown'}), the D1 (birth chart) is the primary guide. Keep the D9 chart in mind for future growth.`);
    notesHi.push(`D9 (नवांश) चार्ट 36 वर्ष की आयु या विवाह के बाद अधिक सक्रिय होता है। अभी D1 (जन्म कुंडली) प्राथमिक मार्गदर्शक है। भविष्य के विकास के लिए D9 को ध्यान में रखें।`);
  } else {
    const reasonEn = activatedByMarriage ? 'because marriage has occurred' : `from age ${age ?? '36+'}`;
    const reasonHi = activatedByMarriage ? 'विवाह होने के कारण' : `आयु ${age ?? '36+'} से`;
    notes.push(`D9 chart is now active ${reasonEn}. It refines the birth chart promise — especially for marriage, relationships, dharma, and post-marriage career growth.`);
    notesHi.push(`D9 चार्ट अब ${reasonHi} सक्रिय है। यह जन्म कुंडली के वचन को परिष्कृत करता है — विशेष रूप से विवाह, रिश्तों, धर्म और विवाह के बाद करियर विकास के लिए।`);
  }

  // D9 vs main chart comparison
  let combinedStatus;
  let summaryEn, summaryHi;

  if (mainScore >= 60 && d9Score >= 60) {
    combinedStatus = 'strong';
    summaryEn = 'Both the birth chart and Navamsha (D9) are positive — this is a strong indicator for stable marriage, relationship growth, and post-marriage career development.';
    summaryHi = 'जन्म कुंडली और नवांश (D9) दोनों सकारात्मक — यह स्थिर विवाह, रिश्ते के विकास और विवाह के बाद करियर विकास का मजबूत संकेत है।';
    amplifiers.push('Both D1 and D9 positive: strong promise for marriage and post-marriage growth');
  } else if (mainScore < 50 && d9Score >= 60) {
    combinedStatus = 'improving';
    summaryEn = 'The birth chart shows some challenges in marriage or relationship areas, but the Navamsha (D9) is more positive — this suggests improvement after maturity, post age 36, or after marriage. Patience and right choices lead to better outcomes.';
    summaryHi = 'जन्म कुंडली विवाह या संबंध क्षेत्रों में कुछ चुनौतियां दिखाती है, लेकिन नवांश (D9) अधिक सकारात्मक है — यह परिपक्वता के बाद, 36 वर्ष के बाद, या विवाह के बाद सुधार का सुझाव देता है। धैर्य और सही चुनाव बेहतर परिणाम देते हैं।';
    amplifiers.push('D9 stronger than D1: improvement in marriage/relationships expected with maturity');
  } else if (mainScore >= 60 && d9Score < 45) {
    combinedStatus = 'needs-depth';
    summaryEn = 'The birth chart shows marriage potential, but the Navamsha (D9) suggests that deeper relationship harmony and post-marriage growth may need conscious effort, communication, and emotional maturity.';
    summaryHi = 'जन्म कुंडली विवाह क्षमता दिखाती है, लेकिन नवांश (D9) बताता है कि गहरे रिश्ते सामंजस्य और विवाह के बाद विकास के लिए सचेत प्रयास, संवाद और भावनात्मक परिपक्वता जरूरी हो सकती है।';
    blockers.push('D9 weaker than D1: marriage depth and post-marriage harmony need extra conscious effort');
  } else if (mainScore < 50 && d9Score < 45) {
    combinedStatus = 'challenging';
    summaryEn = 'Both the birth chart and Navamsha show marriage and relationship challenges. Compatibility, communication, and family support are critically important. Serious remedies and wise life choices are strongly recommended.';
    summaryHi = 'जन्म कुंडली और नवांश दोनों में विवाह और रिश्ते की चुनौतियां हैं। अनुकूलता, संवाद और पारिवारिक समर्थन बहुत जरूरी है। गंभीर उपाय और सुबुद्ध जीवन चुनाव दृढ़ता से अनुशंसित हैं।';
    blockers.push('Both D1 and D9 weak in marriage areas: serious care and remedies needed');
  } else {
    combinedStatus = 'balanced';
    summaryEn = 'The chart shows a balanced marriage and relationship picture. With conscious effort, communication, and right timing, relationship growth and marriage stability are achievable.';
    summaryHi = 'कुंडली विवाह और रिश्ते की संतुलित तस्वीर दिखाती है। सचेत प्रयास, संवाद और सही समय से रिश्ते का विकास और विवाह की स्थिरता प्राप्त की जा सकती है।';
  }

  // Chara Karaka check (if available)
  const charaKarakas = chart._charaKarakas || profile.chara_karakas || null;
  if (charaKarakas) {
    _assessCharaKarakas(charaKarakas, notes, notesHi, blockers, amplifiers);
  }

  const score  = clamp(Math.round((mainScore * 0.5 + d9Score * 0.5) + (d9Activated ? 0 : -5)), 0, 100);
  const status = statusFromScore(score);

  return {
    score, status, combinedStatus,
    d9Activated, currentAge: age, d9ActivationAge: 36,
    maritalStatus, activatedByMarriage, activatedByAge, activationReason,
    mainChartScore: mainScore, d9Score,
    blockers, amplifiers, notes, notesHi,
    summaryEn, summaryHi,
  };
}

function _assessCharaKarakas(karakas, notes, notesHi, blockers, amplifiers) {
  if (!karakas || !Array.isArray(karakas)) return;

  const ak  = karakas.find(k => k.role === 'AK' || k.role === 'Atmakaraka');
  const amk = karakas.find(k => k.role === 'AMK' || k.role === 'Amatyakaraka');
  const dk  = karakas.find(k => k.role === 'DK' || k.role === 'Darakaraka');
  const gk  = karakas.find(k => k.role === 'GK' || k.role === 'Gnatikaraka' || k.role === 'Natikaraka');

  // AK + AMK connection — supports career direction
  if (ak && amk && ak.planet !== amk.planet) {
    amplifiers.push(`Atmakaraka (${ak.planet}) and Amatyakaraka (${amk.planet}) — soul and career are distinct: balance between personal calling and professional duty`);
  }

  // Darakaraka spouse indication
  if (dk) {
    notes.push(`Darakaraka is ${dk.planet} — this planet represents spouse energy. Its strength and placement influence the quality of partnership.`);
    notesHi.push(`दाराकारक ${pHi(dk.planet)} है — यह ग्रह जीवनसाथी की ऊर्जा का प्रतिनिधित्व करता है। इसकी शक्ति और स्थान साझेदारी की गुणवत्ता को प्रभावित करते हैं।`);
  }

  // Gnatikaraka safety rules (never say "spouse death")
  if (gk && (dk || ak)) {
    const gkPlanet = gk.planet;
    if (gkPlanet === 'Mars') {
      // Use safe language only
      notes.push('In Chara Karaka analysis, the Gnatikaraka (Mars) connecting with the Darakaraka or Atmakaraka suggests extra care is needed in matters of safety, health, anger management, and impulsive decisions in relationships and partnerships.');
      notesHi.push('चर कारक विश्लेषण में ज्ञाति/नाति कारक (मंगल) का दाराकारक या आत्मकारक से संबंध — जीवनसाथी या वैवाहिक जीवन से जुड़े मामलों में सुरक्षा, स्वास्थ्य, क्रोध प्रबंधन और आवेगशील निर्णयों पर विशेष सावधानी की जरूरत हो सकती है।');
    } else if (gkPlanet) {
      notes.push(`Gnatikaraka (${gkPlanet}) in the chart — matters related to competition, jealousy, or friction in close relationships need mindful attention.`);
      notesHi.push(`ज्ञाति/नाति कारक (${pHi(gkPlanet)}) कुंडली में — प्रतिस्पर्धा, ईर्ष्या या करीबी रिश्तों में घर्षण के मामलों पर सचेत ध्यान जरूरी है।`);
    }
  }
}

function _noD9Result(lagnaResult, d9Activated, age, activation = {}) {
  const mainScore = lagnaResult?.score ?? 50;
  return {
    score: mainScore, status: statusFromScore(mainScore),
    combinedStatus: 'data-unavailable', d9Activated, currentAge: age, d9ActivationAge: 36,
    maritalStatus:activation.maritalStatus ?? null,
    activatedByMarriage:!!activation.activatedByMarriage,
    activatedByAge:!!activation.activatedByAge,
    activationReason:activation.activationReason || 'data-unavailable',
    mainChartScore: mainScore, d9Score: null,
    blockers: [], amplifiers: [],
    notes: ['Navamsha (D9) detailed data not available. Birth chart indicators are used for marriage and relationship assessment.'],
    notesHi: ['नवांश (D9) विस्तृत डेटा उपलब्ध नहीं। विवाह और रिश्ते के मूल्यांकन के लिए जन्म कुंडली संकेतकों का उपयोग किया जाता है।'],
    summaryEn: 'Birth chart analysis is the primary guide. Navamsha data will improve accuracy when available.',
    summaryHi: 'जन्म कुंडली विश्लेषण प्राथमिक मार्गदर्शक है। नवांश डेटा उपलब्ध होने पर सटीकता बेहतर होगी।',
  };
}

module.exports = { evaluateNavamsha };
