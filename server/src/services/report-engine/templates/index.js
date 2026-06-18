'use strict';
// Language selector for rule templates. Unknown languages fall back to Hindi.
const en = require('./en');
const hi = require('./hi');
const hinglish = require('./hinglish');

const TEMPLATES = { en, hi, hinglish };

function getTemplates(lang) {
  return TEMPLATES[lang] || hi;
}

module.exports = { getTemplates };
