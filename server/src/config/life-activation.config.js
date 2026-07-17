'use strict';
/**
 * Life-activation configuration — the ONLY source for every tunable in this feature.
 *
 * Maturity ages, factor weights, score bands and category definitions live here so
 * the admin system can change them later without hunting through services. Nothing
 * below may be re-declared in a service, a route or a component.
 *
 * INTERPRETATION RULE (load-bearing, not a style note): a Kundli is active FROM
 * BIRTH. Maturity ages describe when a planet's traditional maturation completes —
 * they never mean the planet, or the chart, was switched off before that age. Any
 * wording implying an inactive chart is a bug. See ACTIVATION_COPY below.
 */

const RULE_VERSION = 'life-activation-v1';

// ── Planet maturity ages (classical) ─────────────────────────────────────────
// Configurable on purpose. Rahu/Ketu at 48 close the traditional maturity journey.
const MATURITY_AGES = {
  Jupiter: 16,
  Sun: 22,
  Moon: 24,
  Venus: 25,
  Mars: 28,
  Mercury: 32,
  Saturn: 36,
  Rahu: 48,
  Ketu: 48,
};

// age thresholds as a FRACTION of the planet's maturity age
const MATURITY_BANDS = { developing: 0.6, emerging: 0.9 };

const MATURITY_STATUS = {
  DEVELOPING: { en: 'Developing', hi: 'विकसित हो रहा' },
  EMERGING: { en: 'Emerging', hi: 'उभरता हुआ' },
  MATURITY_WINDOW: { en: 'Maturity window', hi: 'परिपक्वता काल' },
  MATURED: { en: 'Matured', hi: 'परिपक्व' },
};

// ── Activation factor weights — MUST total 100 ───────────────────────────────
const FACTOR_WEIGHTS = {
  dashaActivation: 30,
  natalStrength: 20,
  transitSupport: 20,
  planetMaturity: 10,
  yogaActivation: 10,
  divisionalChartSupport: 10,
};

const WEIGHT_TOTAL = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
if (WEIGHT_TOTAL !== 100) {
  throw new Error(`life-activation: FACTOR_WEIGHTS must total 100, got ${WEIGHT_TOTAL}`);
}

// ── Score bands (inclusive lower bound, ordered high → low) ──────────────────
const ACTIVATION_BANDS = [
  { min: 90, status: 'PEAK' },
  { min: 80, status: 'HIGHLY_ACTIVE' },
  { min: 65, status: 'STRONG' },
  { min: 45, status: 'MODERATE' },
  { min: 25, status: 'DEVELOPING' },
  { min: 0, status: 'LIMITED' },
];

const ACTIVATION_STATUS_LABELS = {
  LIMITED: { en: 'Limited activation', hi: 'सीमित सक्रियता' },
  DEVELOPING: { en: 'Developing activation', hi: 'विकसित होती सक्रियता' },
  MODERATE: { en: 'Moderate activation', hi: 'मध्यम सक्रियता' },
  STRONG: { en: 'Strong activation', hi: 'मजबूत सक्रियता' },
  HIGHLY_ACTIVE: { en: 'Highly active', hi: 'अत्यधिक सक्रिय' },
  PEAK: { en: 'Peak activation period', hi: 'चरम सक्रियता काल' },
};

/**
 * SHORT adjective forms, for use inside a sentence.
 *
 * ACTIVATION_STATUS_LABELS are noun phrases ("मध्यम सक्रियता") and belong on a
 * badge. Dropped into the sentence frame they produce "आपकी ... सक्रियता मध्यम
 * सक्रियता है" — the noun twice. The frame supplies "सक्रियता"; the label must
 * supply only the adjective. Same trap in English: "is moderate activation".
 */
const ACTIVATION_STATUS_SHORT = {
  LIMITED: { en: 'limited', hi: 'सीमित' },
  DEVELOPING: { en: 'developing', hi: 'विकसित हो रही' },
  MODERATE: { en: 'moderate', hi: 'मध्यम' },
  STRONG: { en: 'strong', hi: 'मजबूत' },
  HIGHLY_ACTIVE: { en: 'highly active', hi: 'अत्यधिक' },
  PEAK: { en: 'at its peak', hi: 'चरम पर' },
};

const CONFIDENCE_LABELS = {
  HIGH: { en: 'High', hi: 'उच्च' },
  MEDIUM: { en: 'Medium', hi: 'मध्यम' },
  LIMITED: { en: 'Limited', hi: 'सीमित' },
};

// ── Divisional-chart status → signed contribution ────────────────────────────
// Vocabulary matches varga-insights `overall_status` and mirrors the signed scale
// already used by deterministic-qa/evidence-builder.js — kept consistent on purpose.
const VARGA_STATUS_SIGNED = {
  very_favorable: 80, favorable: 55, supportive: 45, neutral: 0,
  mixed: -10, challenging: -50, caution: -55,
};

/**
 * Category definitions.
 *
 * `strengthDomain` maps to a life_domains key already produced by
 * helpers/kundli-strength.js — we consume that score rather than recomputing it.
 * `varga` is the divisional chart classically read for the category.
 *
 * `business` has NO strengthDomain: kundli-strength.js exposes no business domain,
 * and career is not a stand-in for it (10th = profession/status, business =
 * 7th trade + 3rd initiative). It is scored from houses/karakas only and reports
 * reduced confidence rather than borrowing career's number. See README note in
 * services/life-activation/index.js.
 */
const CATEGORY_DEF = [
  {
    key: 'career', en: 'Career', hi: 'करियर',
    houses: [10, 6], karakas: ['Sun', 'Saturn'], varga: 'd10', strengthDomain: 'career',
  },
  {
    key: 'finance', en: 'Finance', hi: 'धन',
    houses: [2, 11], karakas: ['Jupiter', 'Venus'], varga: 'd2', strengthDomain: 'wealth',
  },
  {
    key: 'marriage', en: 'Marriage & Relationships', hi: 'विवाह और संबंध',
    houses: [7], karakas: ['Venus'], varga: 'd9', strengthDomain: 'marriage',
  },
  {
    key: 'health', en: 'Health', hi: 'स्वास्थ्य',
    houses: [1, 6, 8], karakas: ['Sun', 'Moon'], varga: 'd30', strengthDomain: 'health',
  },
  {
    key: 'education', en: 'Education', hi: 'शिक्षा',
    houses: [5, 4], karakas: ['Jupiter', 'Mercury'], varga: 'd24', strengthDomain: 'children',
  },
  {
    key: 'business', en: 'Business', hi: 'व्यवसाय',
    houses: [7, 3, 10], karakas: ['Mercury', 'Mars'], varga: 'd10', strengthDomain: null,
  },
  {
    key: 'spirituality', en: 'Spirituality', hi: 'आध्यात्म',
    houses: [12, 9], karakas: ['Ketu', 'Jupiter'], varga: 'd20', strengthDomain: 'spirituality',
  },
];

/**
 * Life stages — boundaries are the MATURITY AGES themselves, not invented age
 * brackets: Jupiter 16 (learning), Moon 24 (establishing), Saturn 36
 * (consolidating), Rahu/Ketu 48 (maturity journey complete). Derived from
 * MATURITY_AGES so changing a maturity age moves the stage with it.
 */
const LIFE_STAGES = [
  { min: MATURITY_AGES.Rahu, key: 'INTEGRATION', en: 'Integration — the traditional maturity journey is complete', hi: 'एकीकरण — पारंपरिक परिपक्वता यात्रा पूर्ण' },
  { min: MATURITY_AGES.Saturn, key: 'CONSOLIDATION', en: 'Consolidation — responsibility and structure', hi: 'सुदृढ़ीकरण — उत्तरदायित्व और संरचना' },
  { min: MATURITY_AGES.Moon, key: 'ESTABLISHMENT', en: 'Establishment — building and commitment', hi: 'स्थापना — निर्माण और प्रतिबद्धता' },
  { min: MATURITY_AGES.Jupiter, key: 'LEARNING', en: 'Learning — study, direction and early work', hi: 'अध्ययन — शिक्षा, दिशा और आरंभिक कार्य' },
  { min: 0, key: 'FORMATIVE', en: 'Formative — foundation years', hi: 'आधार — नींव के वर्ष' },
];

// ── Interpretation copy that must never drift ────────────────────────────────
// These sentences exist because the WRONG version of them is a real risk: never
// say the chart is inactive, never say it "switches on" at 48.
const ACTIVATION_COPY = {
  chartAlwaysActive: {
    hi: 'आपकी जन्म कुंडली जन्म से सक्रिय है। अलग-अलग दशाओं, गोचरों और जीवन चरणों में उसके विभिन्न ग्रह, भाव और योग अधिक प्रमुख रूप से फलित होते हैं।',
    en: 'Your birth chart is active from birth. Across different dashas, transits and life stages, its various planets, houses and yogas express more prominently at different times.',
  },
  maturityMilestone: {
    hi: 'सभी प्रमुख ग्रहों की पारंपरिक परिपक्वता यात्रा लगभग 48 वर्ष की आयु तक पूर्ण मानी जाती है। इसका अर्थ यह नहीं है कि कुंडली इससे पहले निष्क्रिय थी।',
    en: 'The traditional maturity journey of all major planets is considered complete by around age 48. This does not mean the chart was inactive before then.',
  },
};

// ── Insufficient-data reasons (never render NaN / 0% / a fabricated date) ────
const INSUFFICIENT = {
  missing_birth_date: { hi: 'जन्म तिथि उपलब्ध नहीं है, इसलिए आयु और सक्रियता की गणना नहीं की जा सकती।', en: 'Birth date is unavailable, so age and activation cannot be calculated.' },
  missing_birth_time: { hi: 'जन्म समय उपलब्ध नहीं है, इसलिए सक्रियता की गणना नहीं की जा सकती।', en: 'Birth time is unavailable, so activation cannot be calculated.' },
  invalid_timezone: { hi: 'जन्म का समय-क्षेत्र मान्य नहीं है, इसलिए आयु की सही गणना नहीं की जा सकती।', en: 'The birth timezone is invalid, so age cannot be calculated reliably.' },
  future_birth_date: { hi: 'जन्म तिथि भविष्य में है, इसलिए आयु की गणना नहीं की जा सकती।', en: 'The birth date is in the future, so age cannot be calculated.' },
  missing_chart: { hi: 'कुंडली गणना उपलब्ध नहीं है। कृपया कुंडली को पुनः गणना करें।', en: 'Chart calculation is unavailable. Please recalculate the kundli.' },
  calculation_failed: { hi: 'गणना पूरी नहीं हो सकी। कृपया कुंडली को पुनः गणना करें।', en: 'The calculation could not be completed. Please recalculate the kundli.' },
  insufficient_category_evidence: { hi: 'इस क्षेत्र के लिए पर्याप्त ज्योतिषीय आधार उपलब्ध नहीं है।', en: 'Insufficient astrological evidence is available for this area.' },
};

module.exports = {
  RULE_VERSION,
  MATURITY_AGES,
  MATURITY_BANDS,
  MATURITY_STATUS,
  FACTOR_WEIGHTS,
  ACTIVATION_BANDS,
  ACTIVATION_STATUS_LABELS,
  ACTIVATION_STATUS_SHORT,
  CONFIDENCE_LABELS,
  VARGA_STATUS_SIGNED,
  CATEGORY_DEF,
  LIFE_STAGES,
  ACTIVATION_COPY,
  INSUFFICIENT,
};
