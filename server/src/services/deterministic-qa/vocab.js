'use strict';
/**
 * Deterministic Q&A vocabulary (Stage 1).
 * Single-word / short-phrase localization maps used to fill {{placeholders}}
 * inside DB-backed templates. Deliberately code-level: these are data terms
 * (planet names, chart statuses, ordinals), not user-facing paragraphs — all
 * paragraph content lives in answer_templates / answer_shared_blocks.
 */

const PLANET_HI = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
  Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

// varga_analysis.overall_status words (used inside factor labels like "D9 (challenging)")
const STATUS_HI = {
  very_favorable: 'अति अनुकूल', favorable: 'अनुकूल', supportive: 'सहायक',
  neutral: 'सामान्य', mixed: 'मिश्रित', challenging: 'चुनौतीपूर्ण', caution: 'सावधानी',
};

// House ordinals deliberately do NOT live here. `${n}वें` is not Hindi, and the
// classical names (प्रथम … द्वादश) are not derivable by suffixing a digit — see
// house-label.js, the single place allowed to name a house.

function planetName(name, lang) { return lang === 'hi' ? (PLANET_HI[name] || name) : name; }
function statusWord(status, lang) { return lang === 'hi' ? (STATUS_HI[status] || status) : String(status || '').replace(/_/g, ' '); }

// Join a list with a localized conjunction ("a and b" / "a और b").
function joinList(items, lang) {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] || '';
  const last = list[list.length - 1];
  return `${list.slice(0, -1).join(', ')} ${lang === 'hi' ? 'और' : 'and'} ${last}`;
}

module.exports = { PLANET_HI, STATUS_HI, planetName, statusWord, joinList };
