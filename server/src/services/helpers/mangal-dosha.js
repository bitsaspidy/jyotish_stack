'use strict';
const { houseFromSign } = require('./core-helpers');

function analyzeMangalDosha(chart) {
  const mars = chart.planets?.Mars;
  if (!mars) return { has_dosha: false, severity: 'none', score: 0, checks: [], cancellations: [], summary_en: 'Mars data unavailable.' };

  const doshaHouses = [1, 4, 7, 8, 12];
  const checks = [
    { basis: 'Lagna', house: houseFromSign(chart.ascendant.rashi_num, mars.rashi_num) },
    { basis: 'Moon',  house: houseFromSign(chart.planets.Moon.rashi_num,  mars.rashi_num) },
    { basis: 'Venus', house: houseFromSign(chart.planets.Venus.rashi_num, mars.rashi_num) },
  ].map((check) => ({ ...check, has_dosha: doshaHouses.includes(check.house) }));

  const active = checks.filter((check) => check.has_dosha);
  const cancellations = [];
  if ([1, 8, 10].includes(mars.rashi_num)) cancellations.push('Mars is in own sign or exalted sign, reducing dosha strength.');
  if (mars.dignity?.startsWith('Exaltation') || mars.dignity?.startsWith('Own Sign')) cancellations.push('Mars dignity is strong, reducing harmful expression.');

  let severity = 'none';
  if (active.length === 1) severity = 'mild';
  if (active.length === 2) severity = 'moderate';
  if (active.length >= 3) severity = 'strong';
  if (active.length && cancellations.length) severity = severity === 'strong' ? 'moderate' : 'mild';

  return {
    has_dosha: active.length > 0,
    severity,
    score: Math.max(0, active.length * 2 - cancellations.length),
    checked_houses: doshaHouses,
    checks,
    cancellations,
    summary_en: active.length
      ? `Mangal Dosha is indicated from ${active.map((c) => `${c.basis} H${c.house}`).join(', ')}. Severity: ${severity}.`
      : 'No classical Mangal Dosha is indicated from Lagna, Moon, or Venus.',
    summary_hi: active.length
      ? `Mangal Dosha ${active.map((c) => `${c.basis} bhav ${c.house}`).join(', ')} se dikhta hai. Prabhav: ${severity}.`
      : 'Lagna, Chandra aur Shukra se samanya Mangal Dosha nahi dikhta.',
  };
}

module.exports = { analyzeMangalDosha };
