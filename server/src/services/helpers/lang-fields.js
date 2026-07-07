'use strict';
// Shared list of the 6 regional language column suffixes added by migration
// 043, plus a helper to expand base field names (e.g. 'title', 'effects')
// into their full en/hi/ta/te/bn/mr/pa/gu column names for .select() calls.

const REGIONAL_LANGS = ['ta', 'te', 'bn', 'mr', 'pa', 'gu'];
const ALL_LANGS = ['en', 'hi', ...REGIONAL_LANGS];

// expandLangFields(['definition', 'effects']) →
//   ['definition_en','definition_hi','definition_ta',...,'effects_en',...]
function expandLangFields(bases) {
  const out = [];
  for (const base of bases) {
    for (const lang of ALL_LANGS) out.push(`${base}_${lang}`);
  }
  return out;
}

// regionalCols(['name','effects']) → ['name_ta',...,'name_gu','effects_ta',...,'effects_gu']
// (only the 6 new regional columns — use when en/hi are already listed separately)
function regionalCols(bases) {
  const out = [];
  for (const base of bases) {
    for (const lang of REGIONAL_LANGS) out.push(`${base}_${lang}`);
  }
  return out;
}

module.exports = { REGIONAL_LANGS, ALL_LANGS, expandLangFields, regionalCols };
