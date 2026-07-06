'use strict';

const VALID_CATEGORIES = new Set(['general','marriage','career','finance','health','legal','travel','lost_object','property','education','family']);
const VALID_MODES = new Set(['decision','timing','comparison','guidance']);
const VALID_CHARTS = new Set(['d1','d2','d3','d4','d5','d7','d8','d9','d10','d12','d16','d20','d24','d27','d30','d40','d45','d60']);
const VALID_PLANETS = new Set(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']);
const FALLBACK_ROUTES = {
  general:{ charts:['d1','d9'], houses:[1,5,9], planets:['Sun','Moon','Jupiter'], timingKey:'education_spiritual', safetyNoteKey:'general' },
  career:{ charts:['d1','d10'], houses:[1,6,10,11], planets:['Sun','Saturn','Mercury'], timingKey:'career', safetyNoteKey:'career' },
  marriage:{ charts:['d1','d9'], houses:[1,5,7,11], planets:['Venus','Jupiter'], timingKey:'relationships', safetyNoteKey:'relationships' },
  finance:{ charts:['d1','d2'], houses:[2,5,8,11], planets:['Jupiter','Mercury','Venus'], timingKey:'finance', safetyNoteKey:'finance' },
  health:{ charts:['d1','d27','d30'], houses:[1,6,8,12], planets:['Sun','Moon','Mars'], timingKey:'health', safetyNoteKey:'health' },
  legal:{ charts:['d1','d30'], houses:[6,7,8], planets:['Mars','Saturn','Jupiter'], timingKey:'finance', safetyNoteKey:'legal' },
  travel:{ charts:['d1','d4','d9'], houses:[3,4,9,12], planets:['Moon','Rahu'], timingKey:'career', safetyNoteKey:'travel' },
  lost_object:{ charts:['d1'], houses:[2,4,11,12], planets:['Moon','Mercury'], timingKey:'finance', safetyNoteKey:'general' },
  property:{ charts:['d1','d4','d16'], houses:[4,8,11], planets:['Mars','Venus','Moon'], timingKey:'finance', safetyNoteKey:'finance' },
  education:{ charts:['d1','d24'], houses:[4,5,9], planets:['Mercury','Jupiter'], timingKey:'education_spiritual', safetyNoteKey:'education' },
  family:{ charts:['d1','d12'], houses:[2,4,9], planets:['Moon','Sun','Jupiter'], timingKey:'relationships', safetyNoteKey:'family' },
};

const FALLBACK_INTENTS = [
  {
    category:'property', subtype:'property_purchase', actionKey:'property_purchase',
    pattern:/(?:buy|purchase|बुक|खरीद).*(?:home|house|property|flat|apartment|land|real\s*estate|घर|मकान|संपत्ति|फ्लैट|जमीन)|(?:home|house|property|flat|apartment|land|real\s*estate|घर|मकान|संपत्ति|फ्लैट|जमीन).*(?:buy|purchase|बुक|खरीद)/i,
    en:'whether this is a suitable period to buy a home or property',
    hi:'घर या संपत्ति खरीदने के लिए यह समय उपयुक्त है या नहीं',
  },
  {
    category:'career', subtype:'job_offer', actionKey:'career_job_offer',
    pattern:/job\s*offer|offer\s*letter|accept.*offer|नौकरी.*प्रस्ताव|ऑफर.*स्वीकार/i,
    en:'whether to accept the job offer', hi:'नौकरी का प्रस्ताव स्वीकार करना चाहिए या नहीं',
  },
  {
    category:'marriage', subtype:'marriage_timing', actionKey:'marriage_timing',
    pattern:/(?:when|period|time|timing).*(?:marriage|marry|wedding)|(?:marriage|marry|wedding).*(?:when|period|time|timing)|(?:कब|समय).*(?:शादी|विवाह)|(?:शादी|विवाह).*(?:कब|समय)/i,
    en:'the likely timing of marriage', hi:'विवाह का संभावित समय',
  },
  {
    category:'education', subtype:'exam', actionKey:'education_exam',
    pattern:/exam|examination|admission|परीक्षा|एग्जाम|प्रवेश/i,
    en:'the examination outcome and preparation decision', hi:'परीक्षा के परिणाम और तैयारी का निर्णय',
  },
];

function detectFallbackCategory(text, selectedCategory) {
  if (selectedCategory !== 'general') return selectedCategory;
  const patterns = [
    ['career', /job|career|promotion|business|salary|नौकरी|करियर|प्रमोशन|व्यवसाय/i],
    ['marriage', /marriage|relationship|partner|wedding|शादी|विवाह|रिश्ता/i],
    ['finance', /money|invest|loan|income|wealth|पैसा|निवेश|ऋण|धन/i],
    ['property', /property|home|house|land|flat|apartment|real\s*estate|संपत्ति|मकान|जमीन|फ्लैट|घर खरीद/i],
    ['education', /exam|study|education|admission|परीक्षा|पढ़ाई|शिक्षा|प्रवेश/i],
    ['health', /health|recover|treatment|illness|स्वास्थ्य|सेहत|इलाज/i],
    ['travel', /travel|abroad|visa|relocat|यात्रा|विदेश|स्थान बदल/i],
    ['legal', /legal|court|dispute|case|कानूनी|कोर्ट|विवाद/i],
    ['family', /child|children|parent|family|संतान|बच्च|माता|पिता|परिवार/i],
  ];
  return patterns.find(([, pattern]) => pattern.test(text))?.[0] || 'general';
}

function fallbackAnalysis(question, selectedCategory = 'general', analysisMode = 'prashna') {
  const text = String(question || '').toLowerCase();
  const category = VALID_CATEGORIES.has(selectedCategory) ? selectedCategory : 'general';
  const specificIntent = FALLBACK_INTENTS.find((intent) => intent.pattern.test(text));
  const detectedCategory = specificIntent?.category || detectFallbackCategory(text, category);
  const understood = specificIntent || {
    en:`the ${detectedCategory.replace('_', ' ')} question`, hi:'आपके प्रश्न से जुड़े जीवन क्षेत्र की दिशा',
    subtype:'general', actionKey:`${detectedCategory}_general`,
  };
  const routing = FALLBACK_ROUTES[detectedCategory] || FALLBACK_ROUTES.general;
  return {
    version:'question-understanding-fallback-v1',
    detectedCategory,
    selectedCategory:category,
    subtype:understood.subtype,
    actionKey:understood.actionKey,
    decisionMode:/when|right time|good period|suitable period|कब|सही समय/i.test(text) ? 'timing' : 'decision',
    language:/[\u0900-\u097F]/.test(question || '') ? 'hi' : 'en',
    confidence:specificIntent ? 0.78 : 0.45,
    isAmbiguous:!specificIntent && String(question || '').trim().split(/\s+/).length < 5,
    understoodAsEn:understood.en,
    understoodAsHi:understood.hi,
    needsClarificationEn:'',
    needsClarificationHi:'',
    analysisMode:analysisMode === 'kundli' ? 'kundli' : 'prashna',
    chartSlugs:routing.charts,
    focusHouses:routing.houses,
    focusPlanets:routing.planets,
    timingKey:routing.timingKey,
    safetyNoteKey:routing.safetyNoteKey,
    source:'fallback',
  };
}

function normalizeAnalysis(payload, question, selectedCategory, analysisMode = 'prashna') {
  if (!payload || typeof payload !== 'object') return fallbackAnalysis(question, selectedCategory, analysisMode);
  const category = VALID_CATEGORIES.has(payload.detected_category) ? payload.detected_category : selectedCategory;
  const fallbackRoute = FALLBACK_ROUTES[category] || FALLBACK_ROUTES.general;
  const chartSlugs = Array.isArray(payload.chart_slugs)
    ? [...new Set(payload.chart_slugs.filter((slug) => VALID_CHARTS.has(slug)))].slice(0, 4)
    : fallbackRoute.charts;
  const focusHouses = Array.isArray(payload.focus_houses)
    ? [...new Set(payload.focus_houses.map(Number).filter((house) => Number.isInteger(house) && house >= 1 && house <= 12))].slice(0, 6)
    : fallbackRoute.houses;
  const focusPlanets = Array.isArray(payload.focus_planets)
    ? [...new Set(payload.focus_planets.filter((planet) => VALID_PLANETS.has(planet)))].slice(0, 5)
    : fallbackRoute.planets;
  return {
    version:String(payload.version || 'question-understanding-v1').slice(0, 60),
    detectedCategory:category,
    selectedCategory:VALID_CATEGORIES.has(payload.selected_category) ? payload.selected_category : selectedCategory,
    subtype:String(payload.subtype || 'general').slice(0, 60),
    actionKey:String(payload.action_key || `${category}_general`).slice(0, 80),
    decisionMode:VALID_MODES.has(payload.decision_mode) ? payload.decision_mode : 'guidance',
    language:payload.language === 'hi' ? 'hi' : 'en',
    confidence:Math.max(0, Math.min(1, Number(payload.confidence) || 0)),
    isAmbiguous:!!payload.is_ambiguous,
    understoodAsEn:String(payload.understood_as_en || '').slice(0, 240),
    understoodAsHi:String(payload.understood_as_hi || '').slice(0, 240),
    needsClarificationEn:String(payload.needs_clarification_en || '').slice(0, 240),
    needsClarificationHi:String(payload.needs_clarification_hi || '').slice(0, 240),
    analysisMode:payload.analysis_mode === 'kundli' || analysisMode === 'kundli' ? 'kundli' : 'prashna',
    chartSlugs:chartSlugs.length ? chartSlugs : fallbackRoute.charts,
    focusHouses,
    focusPlanets,
    timingKey:String(payload.timing_key || fallbackRoute.timingKey).slice(0, 40),
    safetyNoteKey:String(payload.safety_note_key || fallbackRoute.safetyNoteKey).slice(0, 40),
    source:'python',
  };
}

async function analyzeQuestion(question, selectedCategory = 'general', options = {}) {
  const category = VALID_CATEGORIES.has(selectedCategory) ? selectedCategory : 'general';
  const analysisMode = options.mode === 'kundli' ? 'kundli' : 'prashna';
  if (String(process.env.QUESTION_SERVICE_ENABLED || 'true').toLowerCase() === 'false') {
    return fallbackAnalysis(question, category, analysisMode);
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') return fallbackAnalysis(question, category, analysisMode);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.QUESTION_SERVICE_TIMEOUT_MS || 1800));
  try {
    const headers = { 'Content-Type':'application/json' };
    if (process.env.QUESTION_SERVICE_TOKEN) headers['X-Internal-Token'] = process.env.QUESTION_SERVICE_TOKEN;
    const response = await fetchImpl(`${process.env.QUESTION_SERVICE_URL || 'http://127.0.0.1:5100'}/analyze`, {
      method:'POST', headers, signal:controller.signal,
      body:JSON.stringify({ question, selected_category:category, analysis_mode:analysisMode }),
    });
    if (!response.ok) throw new Error(`Question service returned ${response.status}`);
    return normalizeAnalysis(await response.json(), question, category, analysisMode);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') console.warn('[QuestionUnderstanding]', error.message);
    return fallbackAnalysis(question, category, analysisMode);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { analyzeQuestion, fallbackAnalysis, normalizeAnalysis };
