'use strict';
/**
 * Report-engine i18n helper (Session 57).
 * The report/strength/judgement humanizers emit BOTH-language payloads that the
 * client picks from. Historically that was en/hi only (flat `xxxEn`/`xxxHi`
 * fields). This helper extends it to the 6 regional languages WITHOUT breaking
 * the admin views, which still read the flat En/Hi fields.
 *
 * Pattern:
 *   - Curated string constants become language-keyed: { en, hi, ta, te, bn, mr, pa, gu }.
 *   - langFields('simpleMeaning', pair) spreads → { simpleMeaningEn, simpleMeaningHi,
 *     simpleMeaningTa, … } so admin keeps its En/Hi and the client reads its lang suffix.
 *   - Client picks with pickLang(obj, 'simpleMeaning', lang) (see ui-main report-i18n).
 * Any language missing from a pair falls back to English.
 */

const REGIONAL_LANGS = ['ta', 'te', 'bn', 'mr', 'pa', 'gu'];
const ALL_LANGS = ['en', 'hi', ...REGIONAL_LANGS];

// lang code → PascalCase field suffix used in the emitted payload
const SUFFIX = { en: 'En', hi: 'Hi', ta: 'Ta', te: 'Te', bn: 'Bn', mr: 'Mr', pa: 'Pa', gu: 'Gu' };

// Resolve one language-keyed pair to a string, English fallback.
function L(pair, lang) {
  if (!pair) return '';
  if (typeof pair === 'string') return pair;
  return pair[lang] ?? pair.en ?? '';
}

// Spread a language-keyed pair into flat suffixed fields for the payload.
// base='simpleMeaning', pair={en,hi,ta,…} → { simpleMeaningEn, …, simpleMeaningGu }.
function langFields(base, pair) {
  const out = {};
  for (const lang of ALL_LANGS) out[`${base}${SUFFIX[lang]}`] = L(pair, lang);
  return out;
}

module.exports = { REGIONAL_LANGS, ALL_LANGS, SUFFIX, L, langFields };
