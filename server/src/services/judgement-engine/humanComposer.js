'use strict';
/**
 * Human Composer — produces the final structured area-wise output
 * in both English and Hindi, safe for users and detailed for admins.
 */
const { sanitizeForUser, resolveConflict } = require('./conflictResolver');
const { statusFromScore } = require('./helpers');

/**
 * Build a standard area result card from raw judgement data
 * @param {object} opts
 */
function composeArea({ areaKey, titleEn, titleHi, score, notesEn = [], notesHi = [],
                        blockers = [], amplifiers = [], remedies = [], adminData = {},
                        lang = 'en', isAdmin = false }) {
  const status = statusFromScore(score);

  // Separate good points from challenges from notes
  const goodPointsEn = notesEn.filter((_, i) => !blockers.includes(notesEn[i]));
  const goodPointsHi = notesHi.filter((_, i) => !blockers.includes(notesHi[i]));

  // Compose user-facing summary
  const userSummaryEn = resolveConflict(notesEn.slice(0, 3), [], 'en') || _defaultSummaryEn(status, areaKey);
  const userSummaryHi = resolveConflict(notesHi.slice(0, 3), [], 'hi') || _defaultSummaryHi(status, areaKey);

  const result = {
    areaKey,
    titleEn,
    titleHi,
    score,
    status,
    userSummaryEn: sanitizeForUser(userSummaryEn),
    userSummaryHi: sanitizeForUser(userSummaryHi),
    goodPoints:  sanitizeForUser(notesEn.slice(0, 4)),
    goodPointsHi: sanitizeForUser(notesHi.slice(0, 4)),
    challenges:  blockers.map(b => _blockerToUserEn(b)),
    challengesHi: blockers.map(b => _blockerToUserHi(b)),
    advice:      _buildAdvice(areaKey, score, 'en'),
    adviceHi:    _buildAdvice(areaKey, score, 'hi'),
    remedies,
    technical: isAdmin ? {
      visibleOnlyInAdmin: true,
      rulesApplied: amplifiers,
      blockers,
      amplifiers,
      rawScore: score,
      rawFactors: adminData,
    } : { visibleOnlyInAdmin: true },
  };

  return result;
}

/**
 * Compose the complete judgement report from all sub-module results
 */
function composeFullReport({
  lagnaResult, pillarResult, yogaResults, houseLordResults,
  gainsResult, marriageResult, navamshaResult, childrenResult,
  rahuResult, avGuardResult, lang = 'hi', isAdmin = false,
}) {
  const areas = [];

  // ── AREA 1: Lagna & Personality ──────────────────────────────────────────
  if (lagnaResult) {
    areas.push(composeArea({
      areaKey: 'lagna',
      titleEn: 'Chart Foundation & Personality',
      titleHi: 'कुंडली आधार और व्यक्तित्व',
      score: lagnaResult.score,
      notesEn: lagnaResult.notes,
      notesHi: lagnaResult.notesHi,
      blockers: lagnaResult.blockers,
      amplifiers: [],
      adminData: { lagnaLordName: lagnaResult.lagnaLordName, house: lagnaResult.lagnaLordHouse, dignity: lagnaResult.dignityLabel, afflictions: lagnaResult.afflictions },
      lang, isAdmin,
    }));
  }

  // ── AREA 2: Mind & Emotions (Moon pillar) ─────────────────────────────────
  if (pillarResult?.moon) {
    const moon = pillarResult.moon;
    areas.push(composeArea({
      areaKey: 'mind',
      titleEn: 'Mind, Emotions & Mental Stability',
      titleHi: 'मन, भावनाएं और मानसिक स्थिरता',
      score: moon.score,
      notesEn: moon.notes,
      notesHi: moon.notesHi,
      blockers: moon.blockers,
      adminData: { house: moon.house, dignity: moon.dignity, afflictions: moon.afflictions, kemadruma: moon.kemadruma, grahanInfluence: moon.grahanInfluence },
      lang, isAdmin,
    }));
  }

  // ── AREA 3: Soul & Authority (Sun pillar) ─────────────────────────────────
  if (pillarResult?.sun) {
    const sun = pillarResult.sun;
    areas.push(composeArea({
      areaKey: 'soul',
      titleEn: 'Self-Confidence, Authority & Father',
      titleHi: 'आत्मविश्वास, अधिकार और पिता',
      score: sun.score,
      notesEn: sun.notes,
      notesHi: sun.notesHi,
      blockers: sun.blockers,
      adminData: { house: sun.house, dignity: sun.dignity, afflictions: sun.afflictions, pitraDosh: sun.pitraDoshIndicator },
      lang, isAdmin,
    }));
  }

  // ── AREA 4: Yogas ─────────────────────────────────────────────────────────
  if (yogaResults?.length) {
    const activatedYogas = yogaResults.filter(y => y.activation !== 'blocked');
    const blockedYogas   = yogaResults.filter(y => y.activation === 'blocked');
    const avgYogaScore   = activatedYogas.length
      ? Math.round(activatedYogas.reduce((s, y) => s + y.effectiveStrength, 0) / activatedYogas.length)
      : 45;

    areas.push({
      areaKey: 'yogas',
      titleEn: 'Yogas & Special Chart Combinations',
      titleHi: 'योग और विशेष कुंडली संयोजन',
      score: avgYogaScore,
      status: statusFromScore(avgYogaScore),
      userSummaryEn: _yogasSummaryEn(yogaResults),
      userSummaryHi: _yogasSummaryHi(yogaResults),
      yogas: yogaResults.map(y => ({
        name:        y.name,
        nameHi:      y.nameHi,
        activation:  y.activation,
        effectiveStrength: y.effectiveStrength,
        descEn:      sanitizeForUser(y.userEN),
        descHi:      sanitizeForUser(y.userHI),
        blockers:    isAdmin ? y.blockers : undefined,
        amplifiers:  isAdmin ? y.amplifiers : undefined,
        adminReason: isAdmin ? y.adminReason : undefined,
      })),
      technical: isAdmin ? { visibleOnlyInAdmin: true, totalDetected: yogaResults.length, activated: activatedYogas.length, blocked: blockedYogas.length } : { visibleOnlyInAdmin: true },
    });
  }

  // ── AREA 5: Income & Gains ────────────────────────────────────────────────
  if (gainsResult) {
    areas.push(composeArea({
      areaKey: 'gains',
      titleEn: 'Income, Gains & Desire Fulfillment',
      titleHi: 'आय, लाभ और इच्छापूर्ति',
      score: gainsResult.score,
      notesEn: [...gainsResult.notes, gainsResult.summaryEn].filter(Boolean),
      notesHi: [...gainsResult.notesHi, gainsResult.summaryHi].filter(Boolean),
      blockers: gainsResult.blockers,
      amplifiers: gainsResult.amplifiers,
      adminData: { lordName: gainsResult.lordName, lordHouse: gainsResult.lordHouse, gainPotential: gainsResult.gainPotentialScore, incomeStability: gainsResult.incomeStabilityScore },
      lang, isAdmin,
    }));
  }

  // ── AREA 6: Marriage & Relationships ──────────────────────────────────────
  if (marriageResult) {
    areas.push(composeArea({
      areaKey: 'marriage',
      titleEn: 'Marriage, Relationships & Partnership',
      titleHi: 'विवाह, रिश्ते और साझेदारी',
      score: marriageResult.score,
      notesEn: [...marriageResult.notes, marriageResult.summaryEn].filter(Boolean),
      notesHi: [...marriageResult.notesHi, marriageResult.summaryHi].filter(Boolean),
      blockers: marriageResult.blockers,
      amplifiers: marriageResult.amplifiers,
      adminData: { sevenLordScore: marriageResult.sevenLordScore, venusScore: marriageResult.venusScore, domesticScore: marriageResult.domesticPeaceScore },
      lang, isAdmin,
    }));
  }

  // ── AREA 7: Children & Education ──────────────────────────────────────────
  if (childrenResult) {
    areas.push(composeArea({
      areaKey: 'children',
      titleEn: 'Children, Education & Creativity',
      titleHi: 'संतान, शिक्षा और रचनात्मकता',
      score: childrenResult.score,
      notesEn: [...childrenResult.notes, childrenResult.summaryEn].filter(Boolean),
      notesHi: [...childrenResult.notesHi, childrenResult.summaryHi].filter(Boolean),
      blockers: childrenResult.blockers,
      amplifiers: childrenResult.amplifiers,
      adminData: { fifthLordName: childrenResult.fifthLordName, jupiterScore: childrenResult.jupiterScore, ketuInFifth: childrenResult.ketuInFifth },
      lang, isAdmin,
    }));
  }

  // ── AREA 8: Navamsha Maturity ─────────────────────────────────────────────
  if (navamshaResult) {
    areas.push(composeArea({
      areaKey: 'maturity',
      titleEn: 'Maturity, Post-Marriage Growth & Dharma',
      titleHi: 'परिपक्वता, विवाह के बाद विकास और धर्म',
      score: navamshaResult.score,
      notesEn: [...navamshaResult.notes, navamshaResult.summaryEn].filter(Boolean),
      notesHi: [...navamshaResult.notesHi, navamshaResult.summaryHi].filter(Boolean),
      blockers: navamshaResult.blockers,
      amplifiers: navamshaResult.amplifiers,
      adminData: { d9Activated: navamshaResult.d9Activated, combinedStatus: navamshaResult.combinedStatus },
      lang, isAdmin,
    }));
  }

  // ── Lagna Strength summary ────────────────────────────────────────────────
  const overallScore = _computeOverall({ lagnaResult, pillarResult, gainsResult, marriageResult, childrenResult });

  return {
    overallScore,
    overallStatus: statusFromScore(overallScore),
    overallLabel: {
      en: _overallLabelEn(overallScore),
      hi: _overallLabelHi(overallScore),
    },
    areas,
    lagnaStrength:     lagnaResult ? { score: lagnaResult.score, status: lagnaResult.status, label: lagnaResult.dignityLabel } : null,
    pillarStrength:    pillarResult ? { sunScore: pillarResult.sun.score, moonScore: pillarResult.moon.score, status: pillarResult.pillarStatus } : null,
    yogaReducers:      pillarResult?.yogaReducers || [],
    rahuPlacement:     rahuResult ? { house: rahuResult.house, potential: rahuResult.potential, score: rahuResult.score } : null,
    ashtakavargaGuard: avGuardResult || null,
  };
}

// ── Private helpers ───────────────────────────────────────────────────────────
function _computeOverall({ lagnaResult, pillarResult, gainsResult, marriageResult, childrenResult }) {
  const scores = [
    lagnaResult?.score,
    pillarResult?.sun?.score,
    pillarResult?.moon?.score,
    gainsResult?.score,
    marriageResult?.score,
    childrenResult?.score,
  ].filter(s => s != null);
  if (!scores.length) return 55;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function _defaultSummaryEn(status, area) {
  if (status === 'strong')     return `${area} shows strong support in this chart.`;
  if (status === 'balanced')   return `${area} shows a balanced picture — consistent effort supports good outcomes.`;
  if (status === 'needs-care') return `${area} needs extra care and mindful attention. Right timing and effort help.`;
  return `${area} requires significant care and planning. Remedies and patience are recommended.`;
}

function _defaultSummaryHi(status, area) {
  if (status === 'strong')     return `${area} इस कुंडली में मजबूत समर्थन दिखाता है।`;
  if (status === 'balanced')   return `${area} एक संतुलित तस्वीर दिखाता है — लगातार प्रयास से अच्छे परिणाम मिलते हैं।`;
  if (status === 'needs-care') return `${area} में extra care और सावधान ध्यान जरूरी है। सही समय और प्रयास सहायक है।`;
  return `${area} में महत्वपूर्ण देखभाल और योजना जरूरी है। उपाय और धैर्य की सिफारिश की जाती है।`;
}

function _blockerToUserEn(blocker) {
  // Translate technical blockers to user-friendly language
  if (/debilitat/i.test(blocker)) return 'Extra effort and right timing are needed for full results.';
  if (/trik|dusthana/i.test(blocker)) return 'This area may come with delays or require extra perseverance.';
  if (/Rahu|Ketu/i.test(blocker)) return 'Unpredictability and intensity in this area need mindful management.';
  if (/Paap Kartari/i.test(blocker)) return 'Pressure or restriction in this area needs extra care and patience.';
  if (/combust/i.test(blocker)) return 'Some reduction in this area\'s power — remedy and right timing help.';
  if (/Kemadruma/i.test(blocker)) return 'Emotional or mental support may need conscious cultivation.';
  return 'Extra care and mindful effort are needed in this area.';
}

function _blockerToUserHi(blocker) {
  if (/debilitat/i.test(blocker)) return 'पूर्ण परिणाम के लिए extra प्रयास और सही समय जरूरी है।';
  if (/trik|dusthana/i.test(blocker)) return 'इस क्षेत्र में देरी हो सकती है या extra दृढ़ता जरूरी हो सकती है।';
  if (/Rahu|Ketu/i.test(blocker)) return 'इस क्षेत्र में अनिश्चितता और तीव्रता के लिए सचेत प्रबंधन जरूरी है।';
  if (/Paap Kartari/i.test(blocker)) return 'इस क्षेत्र में दबाव या प्रतिबंध के लिए extra care और धैर्य जरूरी है।';
  if (/combust/i.test(blocker)) return 'इस क्षेत्र की शक्ति में कुछ कमी — उपाय और सही समय सहायक है।';
  if (/Kemadruma/i.test(blocker)) return 'भावनात्मक या मानसिक समर्थन को सचेत रूप से विकसित करने की जरूरत हो सकती है।';
  return 'इस क्षेत्र में extra care और सचेत प्रयास जरूरी है।';
}

function _yogasSummaryEn(yogaResults) {
  const full    = yogaResults.filter(y => y.activation === 'full').length;
  const partial = yogaResults.filter(y => y.activation === 'partial').length;
  const weak    = yogaResults.filter(y => y.activation === 'weak').length;
  const blocked = yogaResults.filter(y => y.activation === 'blocked').length;
  const total   = yogaResults.length;

  if (!total) return 'No significant yogas detected in this chart.';
  if (full > total / 2) return `This chart has strong yogas — ${full} are fully active. These support life quality, recognition, and growth when their dasha is running.`;
  if (partial > 0) return `This chart has ${total} yogas: ${full} fully active, ${partial} partially active, ${weak} weak, and ${blocked} currently blocked. Each yoga gives results based on its activation strength and dasha timing.`;
  return `This chart has ${total} yogas detected. Their actual results depend on activation strength, dasha timing, and supporting conditions. Results come with effort and right timing.`;
}

function _yogasSummaryHi(yogaResults) {
  const full    = yogaResults.filter(y => y.activation === 'full').length;
  const partial = yogaResults.filter(y => y.activation === 'partial').length;
  const weak    = yogaResults.filter(y => y.activation === 'weak').length;
  const blocked = yogaResults.filter(y => y.activation === 'blocked').length;
  const total   = yogaResults.length;

  if (!total) return 'इस कुंडली में कोई महत्वपूर्ण योग नहीं मिला।';
  if (full > total / 2) return `इस कुंडली में मजबूत योग हैं — ${full} पूरी तरह सक्रिय हैं। ये जीवन गुणवत्ता, पहचान और विकास का समर्थन करते हैं जब उनकी दशा चल रही हो।`;
  return `इस कुंडली में ${total} योग मिले: ${full} पूरी तरह सक्रिय, ${partial} आंशिक, ${weak} कमजोर, ${blocked} अभी अवरुद्ध। हर योग अपनी सक्रियता शक्ति और दशा समय के आधार पर परिणाम देता है।`;
}

function _buildAdvice(areaKey, score, lang) {
  const hi = lang === 'hi';
  const advice = [];
  if (score < 52) {
    const remedy = hi
      ? 'संबंधित ग्रह के उपाय, मंत्र और सही दशा-समय पर ध्यान दें।'
      : 'Focus on remedies for the relevant planet, mantras, and right dasha timing.';
    advice.push(remedy);
  }
  if (areaKey === 'marriage' && score < 60) {
    advice.push(hi
      ? 'विवाह के लिए शुक्र और सप्तमेश की दशा में अनुकूल मुहूर्त चुनें।'
      : 'Choose an auspicious muhurta during Venus or 7th lord dasha for marriage.');
  }
  if (areaKey === 'children' && score < 60) {
    advice.push(hi
      ? 'गुरु ग्रह के उपाय और सही समय बच्चों के मामलों में सहायक होंगे।'
      : 'Jupiter remedies and right timing are recommended for children-related matters.');
  }
  if (areaKey === 'gains' && score < 52) {
    advice.push(hi
      ? '11वें भाव को मजबूत करने के लिए शनि/शुक्र उपाय और नेटवर्किंग पर ध्यान दें।'
      : 'Strengthen the 11th house via Saturn/Venus remedies and conscious networking.');
  }
  return advice;
}

function _overallLabelEn(score) {
  if (score >= 75) return 'Strong & Well-Supported Chart';
  if (score >= 60) return 'Balanced Chart with Good Potential';
  if (score >= 45) return 'Chart with Growth Opportunities';
  if (score >= 32) return 'Chart Needing Extra Care & Planning';
  return 'Chart Requiring Significant Attention & Remedy';
}

function _overallLabelHi(score) {
  if (score >= 75) return 'मजबूत और अच्छी तरह समर्थित कुंडली';
  if (score >= 60) return 'अच्छी संभावना वाली संतुलित कुंडली';
  if (score >= 45) return 'विकास अवसरों वाली कुंडली';
  if (score >= 32) return 'extra care और योजना की जरूरत वाली कुंडली';
  return 'महत्वपूर्ण ध्यान और उपाय की जरूरत वाली कुंडली';
}

module.exports = { composeArea, composeFullReport };
