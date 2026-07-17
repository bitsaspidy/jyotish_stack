'use strict';
/**
 * Planet maturity — classical maturation ages, read from config only.
 *
 * INTERPRETATION GUARD: maturity describes when a planet's traditional maturation
 * COMPLETES. It never means the planet was dormant beforehand, and this module
 * must not emit any wording that suggests it. The chart is active from birth.
 */

const { MATURITY_AGES, MATURITY_BANDS, MATURITY_STATUS } = require('../../config/life-activation.config');

const PLANET_HI = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
  Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

function maturityStatus(decimalAge, maturityAge) {
  if (decimalAge < maturityAge * MATURITY_BANDS.developing) return 'DEVELOPING';
  if (decimalAge < maturityAge * MATURITY_BANDS.emerging) return 'EMERGING';
  if (decimalAge < maturityAge) return 'MATURITY_WINDOW';
  return 'MATURED';
}

/**
 * @param {number} decimalAge
 * @returns {{planets:Array, maturedPlanets:string[], developingPlanets:string[], nextMilestone:object|null, maturityProgress:number}}
 */
function computeMaturity(decimalAge) {
  const planets = Object.entries(MATURITY_AGES).map(([planet, maturityAge]) => {
    const status = maturityStatus(decimalAge, maturityAge);
    return {
      planet,
      planet_hi: PLANET_HI[planet] || planet,
      maturityAge,
      status,
      status_label: MATURITY_STATUS[status],
      // progress is capped at 1 — a planet does not become "more matured" with age
      progress: Math.min(1, +(decimalAge / maturityAge).toFixed(4)),
      yearsRemaining: decimalAge >= maturityAge ? 0 : +(maturityAge - decimalAge).toFixed(2),
    };
  });

  const maturedPlanets = planets.filter((p) => p.status === 'MATURED').map((p) => p.planet);
  const developingPlanets = planets.filter((p) => p.status !== 'MATURED').map((p) => p.planet);

  // nearest un-matured planet by age
  const upcoming = planets
    .filter((p) => p.status !== 'MATURED')
    .sort((a, b) => a.maturityAge - b.maturityAge)[0] || null;

  // 0..1 — the share of the traditional maturity journey completed
  const maturityProgress = planets.reduce((sum, p) => sum + p.progress, 0) / planets.length;

  return {
    planets,
    maturedPlanets,
    developingPlanets,
    nextMilestone: upcoming
      ? { planet: upcoming.planet, planet_hi: upcoming.planet_hi, maturityAge: upcoming.maturityAge, yearsRemaining: upcoming.yearsRemaining }
      : null,
    maturityProgress: +maturityProgress.toFixed(4),
  };
}

module.exports = { computeMaturity, maturityStatus, PLANET_HI };
