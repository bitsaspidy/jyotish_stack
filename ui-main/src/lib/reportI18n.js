/**
 * Client picker for report/strength/judgement humanizer payloads (Session 57).
 * The server emits flat suffixed fields (simpleMeaningEn, simpleMeaningHi,
 * simpleMeaningTa, …) via server report-i18n langFields(). pickLang reads the
 * field for the active language, falling back to English.
 *
 * Usage: pickLang(card, 'simpleMeaning', lang)  → card.simpleMeaningTa (etc.)
 */

const SUFFIX = { en: 'En', hi: 'Hi', ta: 'Ta', te: 'Te', bn: 'Bn', mr: 'Mr', pa: 'Pa', gu: 'Gu' };

export function pickLang(obj, base, lang) {
  if (!obj) return '';
  const suf = SUFFIX[lang] || 'En';
  return obj[`${base}${suf}`] || obj[`${base}En`] || '';
}
