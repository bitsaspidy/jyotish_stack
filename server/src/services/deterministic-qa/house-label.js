'use strict';
/**
 * House labels — one consistent style for every answer, in both languages.
 *
 * Hindi does not form house names by suffixing the digit: `1वें भाव` is not
 * Hindi, it is a numeral wearing a Hindi ending. Classical Jyotish already has
 * the words — प्रथम भाव … द्वादश भाव — and those are what a reader expects.
 * English keeps the ordinal form ("1st house") because that IS its natural style.
 *
 * These are data terms, not paragraphs, so they stay in code alongside planet
 * names (see vocab.js). Anything that composes a SENTENCE about a house belongs
 * in the database.
 */

// Classical Hindi house names, 1..12.
const HOUSE_HI = Object.freeze([
  null,
  'प्रथम', 'द्वितीय', 'तृतीय', 'चतुर्थ', 'पंचम', 'षष्ठ',
  'सप्तम', 'अष्टम', 'नवम', 'दशम', 'एकादश', 'द्वादश',
]);

function ordinalEn(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = Number(n) % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/**
 * Full house label: "5th house" / "पंचम भाव".
 * Out-of-range numbers degrade to a plain, still-grammatical form rather than
 * emitting the broken `Nवें` pattern.
 */
function houseLabel(n, lang) {
  const h = Number(n);
  if (lang === 'hi') {
    const word = HOUSE_HI[h];
    return word ? `${word} भाव` : `भाव ${h}`;
  }
  return `${ordinalEn(h)} house`;
}

/**
 * House-lord label: "5th lord" / "पंचम भाव के स्वामी".
 * The planet name is appended by the caller so the lord's ROLE and its identity
 * can be deduplicated independently (see evidence-normalizer.js).
 */
function houseLordLabel(n, lang) {
  const h = Number(n);
  if (lang === 'hi') {
    const word = HOUSE_HI[h];
    return word ? `${word} भाव के स्वामी` : `भाव ${h} के स्वामी`;
  }
  return `${ordinalEn(h)} lord`;
}

module.exports = { HOUSE_HI, houseLabel, houseLordLabel, ordinalEn };
