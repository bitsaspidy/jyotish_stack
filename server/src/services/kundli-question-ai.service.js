'use strict';
/**
 * Kundli Q&A — AI answer layer (Session 57).
 * Flow: MySQL kundli → Kundli Engine (chart) → rule-based answer (kundli-question
 * service) → THIS prompt builder → Ollama (Qwen3) → natural-language final answer.
 *
 * The rule-based engine stays the source of truth; the LLM only rephrases/expands
 * it warmly. We feed it explicit chart facts + the engine verdict and instruct it
 * to answer ONLY from those (no invented placements), so it can't hallucinate a chart.
 */

const ollama = require('./ollama.service');

const LANG_NAME = {
  en:'English', hi:'Hindi', ta:'Tamil', te:'Telugu',
  bn:'Bengali', mr:'Marathi', pa:'Punjabi', gu:'Gujarati',
};

const pick = (en, hi, lang) => (lang === 'hi' ? (hi || en) : en);

// Compact, factual snapshot the model is allowed to rely on.
function chartFacts(chart, lang) {
  const L = [];
  const asc = chart?.ascendant;
  if (asc) L.push(`Ascendant (Lagna): ${pick(asc.rashi_en, asc.rashi_hi, lang)}`);
  const moon = chart?.planets?.Moon;
  if (moon) L.push(`Moon sign: ${pick(moon.rashi_en, moon.rashi_hi, lang)}`);
  const nak = chart?.nakshatra;
  if (nak) L.push(`Birth nakshatra: ${pick(nak.en, nak.hi, lang)}${nak.pada ? ` (pada ${nak.pada})` : ''}`);
  const dasha = Array.isArray(chart?.dasha) ? chart.dasha.find((d) => d.is_current) : null;
  if (dasha) {
    const antar = dasha.antardasha?.find((a) => a.is_current);
    L.push(`Current period: ${dasha.lord} Mahadasha${antar ? ` / ${antar.lord} Antardasha` : ''}`);
  }
  return L.join('\n');
}

// Turn the rule-based answer into grounding evidence lines.
function verdictFacts(ruleAnswer, lang) {
  const a = ruleAnswer?.answer || {};
  const L = [];
  L.push(`Engine verdict: ${pick(a.headlineEn, a.headlineHi, lang)} (tone: ${a.tone}, confidence score ${a.score}/100).`);
  L.push(`Engine explanation: ${pick(a.textEn, a.textHi, lang)}`);
  (ruleAnswer?.reasons || []).forEach((r) => {
    L.push(`- ${pick(r.titleEn, r.titleHi, lang)}: ${pick(r.textEn, r.textHi, lang)}`);
  });
  if (ruleAnswer?.timing) {
    L.push(`- Timing: ${pick(ruleAnswer.timing.textEn, ruleAnswer.timing.textHi, lang)}`);
  }
  (ruleAnswer?.nextSteps || []).slice(0, 4).forEach((s) => {
    L.push(`- Suggested step: ${pick(s.en, s.hi, lang)}`);
  });
  return L.join('\n');
}

function buildPrompt({ chart, profile, question, analysis, ruleAnswer, lang }) {
  const langName = LANG_NAME[lang] || 'English';
  const name = profile?.name ? String(profile.name).split(' ')[0] : 'the seeker';
  const facts = chartFacts(chart, lang);
  const verdict = verdictFacts(ruleAnswer, lang);

  const system = [
    'You are a warm, grounded Vedic astrologer (Jyotish) answering a personal question.',
    'Rules:',
    '1. Use ONLY the chart facts and engine analysis provided. Never invent planetary placements, houses, dashas, or dates.',
    '2. Stay faithful to the engine verdict and tone — do not flip a cautious verdict into a confident yes, or vice versa.',
    '3. Be encouraging and practical, never fear-based or deterministic. Frame it as tendencies and guidance, not fixed fate.',
    `4. Answer in ${langName}. Warm, clear, second person. About 120–170 words. No headings, no markdown, no bullet symbols.`,
    '5. End with one short sentence reminding this is astrological guidance, not a guarantee or a substitute for professional advice.',
  ].join('\n');

  const user = [
    `Person: ${name}`,
    `Question: "${question}"`,
    analysis?.understoodAsEn ? `Understood as: ${pick(analysis.understoodAsEn, analysis.understoodAsHi, lang)}` : '',
    '',
    'CHART FACTS:',
    facts || '(limited chart data)',
    '',
    'ENGINE ANALYSIS (your source of truth):',
    verdict,
    '',
    `Now write the final answer for ${name} in ${langName}.`,
  ].filter(Boolean).join('\n');

  return { system, user };
}

/**
 * Returns { text, model } or null (on any failure / LLM unavailable).
 */
async function buildKundliAiAnswer({ chart, profile, question, analysis, ruleAnswer, lang = 'en' }) {
  if (!ruleAnswer) return null;
  const { system, user } = buildPrompt({ chart, profile, question, analysis, ruleAnswer, lang });
  const out = await ollama.generate(user, { system, temperature:0.6, num_predict:420 });
  if (!out.ok) {
    console.warn('[KundliQuestionAI] ollama unavailable:', out.error);
    return null;
  }
  return { text:out.text, model:out.model, lang };
}

module.exports = { buildKundliAiAnswer, buildPrompt };
