'use strict';

const VALID_CATEGORIES = new Set(['general','marriage','career','finance','health','legal','travel','lost_object','property','education','family']);
const VALID_MODES = new Set(['decision','timing','comparison','guidance']);

function fallbackAnalysis(question, selectedCategory = 'general') {
  const text = String(question || '').toLowerCase();
  const category = VALID_CATEGORIES.has(selectedCategory) ? selectedCategory : 'general';
  const jobOffer = /job\s*offer|offer\s*letter|accept.*offer|नौकरी.*प्रस्ताव|ऑफर.*स्वीकार/i.test(text);
  const understood = jobOffer
    ? { en:'whether to accept the job offer', hi:'नौकरी का प्रस्ताव स्वीकार करना चाहिए या नहीं', subtype:'job_offer', actionKey:'career_job_offer' }
    : { en:`the ${category.replace('_', ' ')} decision`, hi:'आपके चुने हुए विषय का निर्णय', subtype:'general', actionKey:`${category}_general` };
  return {
    version:'question-understanding-fallback-v1',
    detectedCategory:jobOffer ? 'career' : category,
    selectedCategory:category,
    subtype:understood.subtype,
    actionKey:understood.actionKey,
    decisionMode:/when|right time|कब|सही समय/i.test(text) ? 'timing' : 'decision',
    language:/[\u0900-\u097F]/.test(question || '') ? 'hi' : 'en',
    confidence:jobOffer ? 0.75 : 0.45,
    isAmbiguous:!jobOffer && String(question || '').trim().split(/\s+/).length < 5,
    understoodAsEn:understood.en,
    understoodAsHi:understood.hi,
    needsClarificationEn:'',
    needsClarificationHi:'',
    source:'fallback',
  };
}

function normalizeAnalysis(payload, question, selectedCategory) {
  if (!payload || typeof payload !== 'object') return fallbackAnalysis(question, selectedCategory);
  const category = VALID_CATEGORIES.has(payload.detected_category) ? payload.detected_category : selectedCategory;
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
    source:'python',
  };
}

async function analyzeQuestion(question, selectedCategory = 'general', options = {}) {
  const category = VALID_CATEGORIES.has(selectedCategory) ? selectedCategory : 'general';
  if (String(process.env.QUESTION_SERVICE_ENABLED || 'true').toLowerCase() === 'false') {
    return fallbackAnalysis(question, category);
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') return fallbackAnalysis(question, category);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.QUESTION_SERVICE_TIMEOUT_MS || 1800));
  try {
    const headers = { 'Content-Type':'application/json' };
    if (process.env.QUESTION_SERVICE_TOKEN) headers['X-Internal-Token'] = process.env.QUESTION_SERVICE_TOKEN;
    const response = await fetchImpl(`${process.env.QUESTION_SERVICE_URL || 'http://127.0.0.1:5100'}/analyze`, {
      method:'POST', headers, signal:controller.signal,
      body:JSON.stringify({ question, selected_category:category }),
    });
    if (!response.ok) throw new Error(`Question service returned ${response.status}`);
    return normalizeAnalysis(await response.json(), question, category);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') console.warn('[QuestionUnderstanding]', error.message);
    return fallbackAnalysis(question, category);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { analyzeQuestion, fallbackAnalysis, normalizeAnalysis };
