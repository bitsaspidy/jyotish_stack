'use strict';
/**
 * Builds the personalized daily puja sequence (Steps 0–4).
 * PDF Rule (Remedy Class 1):
 *   Step 0 — Always Ganesh Invocation (Ganapati Prarthna × 9)
 *   Step 1 — Highest priority afflicted planet deity
 *   Step 2 — Lagna Lord deity
 *   Step 3 — Atmakaraka deity
 *   Step 4 — Conditional Shakti Pujan (only if Shakti not in Steps 1–3)
 */
const { PLANET_REMEDY_MAP, SHAKTI_PLANETS } = require('./planetRemedyMap');

const GANESH_STEP = {
  step: 0,
  planet: null,
  label_en: 'Ganesh Invocation',
  label_hi: 'गणेश आवाहन',
  deity_en: 'Lord Ganesha',
  deity_hi: 'भगवान गणेश',
  action_en: 'Recite Ganapati Prarthna or Ganapati Gayatri Mantra 9 times to remove all obstacles before beginning.',
  action_hi: 'प्रारंभ करने से पहले सभी बाधाओं को दूर करने के लिए गणपति प्रार्थना या गणपति गायत्री मंत्र 9 बार पढ़ें।',
  mantra_en: 'Ganapati Prarthna | Ganapati Gayatri Mantra (× 9)',
  mantra_hi: 'गणपति प्रार्थना | गणपति गायत्री मंत्र (× 9)',
  mandatory: true,
  conditional: false,
};

const SHAKTI_STEP = {
  step: 4,
  planet: null,
  label_en: 'Shakti Pujan',
  label_hi: 'शक्ति पूजन',
  deity_en: 'Goddess Durga / Devi',
  deity_hi: 'देवी दुर्गा / देवी',
  action_en: 'Perform Shakti Pujan with Durga Suktam or Devi Suktam to invoke the Divine Feminine energy.',
  action_hi: 'देवी शक्ति का आह्वान करने के लिए दुर्गा सूक्तम या देवी सूक्तम के साथ शक्ति पूजन करें।',
  mantra_en: 'Durga Suktam | Durga Kavach | Devi Suktam',
  mantra_hi: 'दुर्गा सूक्तम | दुर्गा कवच | देवी सूक्तम',
  mandatory: false,
  conditional: true,
};

function buildPujaStep(planet, scored, stepNum, roleEn, roleHi) {
  if (!planet) return null;
  const p = scored[planet];
  if (!p) return null;
  const r = PLANET_REMEDY_MAP[planet];
  if (!r) return null;

  const countMap = { critical: 108, high: 54, medium: 27, low: 11, healthy: 9 };
  const count = countMap[p.priority] || 27;

  return {
    step: stepNum,
    planet,
    label_en: `${planet} (${roleEn}) — ${r.ishta_devata_en}`,
    label_hi: `${r.name_hi || planet} (${roleHi}) — ${r.ishta_devata_hi}`,
    deity_en: r.ishta_devata_en,
    deity_hi: r.ishta_devata_hi,
    action_en: `Recite Beeja Mantra: ${r.beeja_mantra} × ${count} times, or recite ${r.primary_text}.`,
    action_hi: `बीज मंत्र जाप: ${r.beeja_mantra} × ${count} बार, या ${r.primary_text} का पाठ करें।`,
    mantra_en: `${r.beeja_mantra} | ${r.primary_text}`,
    mantra_hi: `${r.beeja_mantra} | ${r.primary_text}`,
    count,
    mandatory: true,
    conditional: false,
  };
}

/**
 * buildPujaSequence — returns ordered steps array.
 * @param {string} priorityPlanet — highest-need planet name (Step 1)
 * @param {string} lagnaLord
 * @param {string} atmakarak
 * @param {object} scored — keyed by planet name from remedyDetector
 */
function buildPujaSequence(priorityPlanet, lagnaLord, atmakarak, scored) {
  const steps = [];
  const usedPlanets = new Set();

  // Step 0 — always Ganesha
  steps.push({ ...GANESH_STEP, step: 0 });
  usedPlanets.add('Ketu'); // Ketu's deity is also Ganesha — avoid duplicate

  // Steps 1–3: priority → lagna lord → atmakaraka (deduplicated)
  const slots = [
    { planet: priorityPlanet, roleEn: 'Main Focus',   roleHi: 'मुख्य फोकस'  },
    { planet: lagnaLord,      roleEn: 'Lagna Lord',   roleHi: 'लग्न स्वामी' },
    { planet: atmakarak,      roleEn: 'Atmakaraka',   roleHi: 'आत्मकारक'    },
  ];

  let stepNum = 1;
  for (const { planet, roleEn, roleHi } of slots) {
    if (!planet || usedPlanets.has(planet)) continue;
    const s = buildPujaStep(planet, scored, stepNum, roleEn, roleHi);
    if (!s) continue;
    steps.push(s);
    usedPlanets.add(planet);
    stepNum++;
  }

  // Step 4 — Conditional Shakti Pujan: only if no Shakti planet appeared above
  const shaktiCovered = [...usedPlanets].some(p => SHAKTI_PLANETS.has(p));
  if (!shaktiCovered) {
    steps.push({ ...SHAKTI_STEP, step: stepNum });
  }

  return { steps, shaktiCovered };
}

module.exports = { buildPujaSequence, GANESH_STEP, SHAKTI_STEP };
