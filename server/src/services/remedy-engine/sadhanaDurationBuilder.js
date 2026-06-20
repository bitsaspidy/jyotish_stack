'use strict';
/**
 * Determines sadhana duration based on PDF rules (Remedy Class 1):
 *   90 days — Vastu Dosh OR any Critical planet OR 2+ dusthana-placed afflicted planets
 *   43 days — Any High priority planet OR 3+ Medium planets
 *   21 days — Low/mild support only
 */
const { PROBLEM_REMEDY_MAP } = require('./problemRemedyMap');

function buildSadhanaDuration(buckets, detectedProblems) {
  const hasVastu   = detectedProblems.some(p => p.key === 'vastu' && p.is_active);
  const hasCritical = buckets.critical.length > 0;
  const hasHigh     = buckets.high.length > 0;
  const hasManyMed  = buckets.medium.length >= 3;
  const hasProblem90 = detectedProblems.some(p => p.is_active && PROBLEM_REMEDY_MAP[p.key]?.force_90_days);

  let days, reason_en, reason_hi;

  if (hasCritical || hasVastu || hasProblem90) {
    days      = 90;
    reason_en = hasCritical
      ? 'One or more planets require deep, lasting support. A full 90-day cycle (3 Mandalas) is essential for lasting transformation.'
      : 'A complex condition (Vastu Dosh or deep planetary pressure) requires the full 90-day Mandala cycle.';
    reason_hi = hasCritical
      ? 'एक या अधिक ग्रहों को गहरी, स्थायी सहायता की आवश्यकता है। स्थायी परिवर्तन के लिए पूर्ण 90-दिवसीय चक्र (3 मंडल) आवश्यक है।'
      : 'एक जटिल स्थिति (वास्तु दोष या गहरा ग्रह दबाव) के लिए पूर्ण 90-दिवसीय मंडल चक्र आवश्यक है।';
  } else if (hasHigh || hasManyMed) {
    days      = 43;
    reason_en = 'Your planets need sustained, focused support. A 43-day Purna Mandala creates the necessary energetic foundation.';
    reason_hi = 'आपके ग्रहों को निरंतर, केंद्रित सहायता की आवश्यकता है। 43-दिवसीय पूर्ण मंडल आवश्यक ऊर्जावान आधार बनाता है।';
  } else {
    days      = 21;
    reason_en = 'Planets need minor balancing. A 21-day Mandala (one lunar cycle) will create the needed energetic shift.';
    reason_hi = 'ग्रहों को थोड़े संतुलन की जरूरत है। 21-दिवसीय मंडल (एक चंद्र चक्र) आवश्यक ऊर्जावान बदलाव लाएगा।';
  }

  const start_day_en = 'Begin on a Sunday, Monday, or on the planet\'s own day. Avoid starting on Rahu Kaal.';
  const start_day_hi = 'रविवार, सोमवार, या ग्रह के अपने दिन से प्रारंभ करें। राहु काल में शुरू करने से बचें।';

  return { days, reason_en, reason_hi, start_day_en, start_day_hi };
}

module.exports = { buildSadhanaDuration };
