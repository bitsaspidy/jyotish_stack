'use strict';
/**
 * Conflict Resolver — merges contradictory good/bad signals into coherent output
 * "If 7th lord in 10th is good but Venus is afflicted → smart merged message"
 */

function resolveConflict(positives = [], negatives = [], lang = 'en') {
  if (!positives.length && !negatives.length) return null;
  if (!negatives.length) return _joinSentences(positives, lang);
  if (!positives.length) return _cautionWrap(negatives, lang);

  // Both exist — merge with connector
  const connector = lang === 'hi'
    ? ', लेकिन इसके साथ '
    : ', but ';

  const posText = _joinSentences(positives, lang);
  const negText = _cautionWrap(negatives, lang);

  return posText + connector + negText;
}

// Merge an array of scored results (goodPoints, challenges) into final summaries
function mergeAreaResult({ areaKey, titleEn, titleHi, score, goodPoints = [], challenges = [], advice = [], remedies = [], technical = {}, lang = 'en' }) {
  const status = _statusFromScore(score);

  const userSummaryEn = resolveConflict(goodPoints, challenges, 'en');
  const userSummaryHi = resolveConflict(
    goodPoints.map(p => p.hi || p.en || p),
    challenges.map(c => c.hi || c.en || c),
    'hi'
  );

  return {
    areaKey,
    titleEn,
    titleHi,
    score,
    status,
    userSummaryEn,
    userSummaryHi,
    goodPoints: goodPoints.map(p => typeof p === 'string' ? p : (lang === 'hi' ? p.hi : p.en)),
    challenges:  challenges.map(c => typeof c === 'string' ? c : (lang === 'hi' ? c.hi : c.en)),
    advice:     advice.map(a => typeof a === 'string' ? a : (lang === 'hi' ? a.hi : a.en)),
    remedies,
    technical,
  };
}

// Safe language filters — remove forbidden phrases before output
const FORBIDDEN_USER = [
  /spouse\s+death/i,
  /divorce\s+guaranteed/i,
  /no\s+child(ren)?/i,
  /miscarriage\s+will/i,
  /disease\s+confirm/i,
  /definitely\s+become\s+rich/i,
  /you\s+are\s+cursed/i,
  /dosha\s+confirm/i,
  /पति.{0,10}मृत्यु/,
  /तलाक\s+होगा/,
  /संतान\s+नहीं\s+होगी/,
  /मिसकैरेज\s+होगा/,
];

function sanitizeUserText(text) {
  if (!text) return text;
  let t = text;
  for (const pattern of FORBIDDEN_USER) {
    if (pattern.test(t)) {
      // Replace with safe alternative
      t = t.replace(pattern, '[careful attention needed]');
    }
  }
  return t;
}

function sanitizeForUser(obj) {
  if (typeof obj === 'string') return sanitizeUserText(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeForUser);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'technical') result[k] = v; // preserve admin data
      else result[k] = sanitizeForUser(v);
    }
    return result;
  }
  return obj;
}

// ── Private helpers ───────────────────────────────────────────────────────────
function _joinSentences(sentences, lang) {
  return sentences
    .filter(Boolean)
    .map(s => typeof s === 'string' ? s : (lang === 'hi' ? s.hi : s.en))
    .join(' ');
}

function _cautionWrap(challenges, lang) {
  const text = _joinSentences(challenges, lang);
  if (!text) return '';
  // Ensure caution language is not fatalistic
  return sanitizeUserText(text);
}

function _statusFromScore(score) {
  if (score >= 72) return 'strong';
  if (score >= 52) return 'balanced';
  if (score >= 35) return 'needs-care';
  return 'challenging';
}

module.exports = { resolveConflict, mergeAreaResult, sanitizeForUser, sanitizeUserText, FORBIDDEN_USER };
