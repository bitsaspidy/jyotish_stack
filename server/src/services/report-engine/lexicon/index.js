'use strict';
// Language selector for the humanizer. NO runtime translation — each language is
// authored separately. Unknown languages fall back to Hindi.
const en = require('./en');
const hi = require('./hi');
const hinglish = require('./hinglish');

const LEXICONS = { en, hi, hinglish };

function getLexicon(lang) {
  return LEXICONS[lang] || hi;
}

// Helpers that read from a chosen lexicon
function scoreLabel(LEX, score) {
  const s = Math.max(1, Math.min(5, Math.round(score)));
  return LEX.SCORE_LABEL[s];
}

function explainYoga(LEX, name = '') {
  const r = (LEX.YOGA_RULES || []).find((y) => y.match.test(name));
  return r ? r.text : LEX.YOGA_DEFAULT;
}

// {placeholder} interpolation for PHRASES
function fill(tpl, vars = {}) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
}

module.exports = { getLexicon, scoreLabel, explainYoga, fill, SUPPORTED: Object.keys(LEXICONS) };
