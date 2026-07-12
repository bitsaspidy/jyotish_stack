'use strict';
/**
 * Q001 — "What is my basic nature and personality?"
 * Stage 1: evaluation only. Identifies the dominant personality planet among
 * the self-signifiers (Lagna lord, Sun, Moon, Mars, Mercury) via the custom
 * strength proxy. The user-facing text lives in answer_templates (seed 035);
 * the composer fills {{dominant_planet}} / {{lagna_sign}} / {{lagna_lord}} /
 * {{moon_sign}} from the chart.
 */

module.exports = function q001(ctx) {
  const chart = ctx.loaded.chart;
  const ps = (ctx.strength && ctx.strength.planet_scores) || {};
  const lagnaLord = chart.ascendant && chart.ascendant.rashi_lord;

  const candidates = [lagnaLord, 'Sun', 'Moon', 'Mars', 'Mercury'].filter(Boolean);
  let dominant = null;
  for (const p of candidates) if (ps[p] != null && (!dominant || ps[p] > ps[dominant])) dominant = p;

  return {
    rule_keys: ['qa.strength.v1', 'qa.lens.v1'],
    identified_planet: dominant,
    vars: { dominant_planet: dominant },
  };
};
