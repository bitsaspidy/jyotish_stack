'use strict';

const { composePredictionUserFriendly } = require('./report-engine/prediction-humanizer');

const CATEGORY_AREA = {
  career:'career', finance:'finance', health:'health', marriage:'relationships', family:'relationships',
  education:'career', property:'finance', travel:'career', legal:'finance', lost_object:'balanced',
  general:'spirituality',
};

function parseChart(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

function buildPersonalQuestionContext(profile, category, questionAnalysis, includeTechnical = false) {
  const chart = parseChart(profile?.calculated_data);
  if (!profile || !chart) return null;
  const friendly = composePredictionUserFriendly(chart, chart.predictions);
  if (!friendly) return null;
  const areaKey = CATEGORY_AREA[category] || 'spirituality';
  const area = friendly.lifeAreas?.find((item) => item.key === areaKey)
    || friendly.lifeAreas?.find((item) => item.key === 'career')
    || friendly.lifeAreas?.[0];
  const name = String(profile.name || 'this person').slice(0, 150);
  const context = {
    profileUuid:profile.uuid,
    profileName:name,
    understoodAsEn:questionAnalysis?.understoodAsEn || '',
    understoodAsHi:questionAnalysis?.understoodAsHi || '',
    areaKey:area?.key || areaKey,
    areaTitleEn:area?.titleEn || 'Personal pattern',
    areaTitleHi:area?.titleHi || 'व्यक्तिगत संकेत',
    summaryEn:area?.summaryEn || `${name}'s saved chart adds personal context to this question.`,
    summaryHi:area?.summaryHi || `${name} की सुरक्षित कुंडली इस प्रश्न में व्यक्तिगत संदर्भ जोड़ती है।`,
    adviceEn:area?.adviceEn || 'Use the Prashna answer together with the practical facts of the decision.',
    adviceHi:area?.adviceHi || 'प्रश्न फल को निर्णय की वास्तविक जानकारी के साथ मिलाकर देखें।',
    currentPhaseEn:friendly.currentPhase?.summaryEn || '',
    currentPhaseHi:friendly.currentPhase?.summaryHi || '',
  };
  if (includeTechnical) {
    context.technical = {
      areaKey:context.areaKey,
      ascendant:chart.ascendant?.rashi_en || null,
      currentMainPeriod:friendly.currentPhase?.mainPlanet || null,
      currentSupportingPeriod:friendly.currentPhase?.supportingPlanet || null,
    };
  }
  return context;
}

module.exports = { buildPersonalQuestionContext, parseChart, CATEGORY_AREA };
