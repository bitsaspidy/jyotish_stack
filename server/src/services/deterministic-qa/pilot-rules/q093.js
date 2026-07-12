'use strict';
/**
 * Q093 — "Which planet is currently the most favourable for me?"
 * Stage 1: evaluation only. Combines the custom strength proxy with the current
 * Dasha lords (running periods get emphasis — they are "active") and the dated
 * slow-planet transits to identify the single most favourable active planet.
 * User-facing text lives in answer_templates; the composer fills {{planet}} and
 * the {{active_role}} fragment (frag.role_maha / frag.role_antar).
 */

const ALL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

module.exports = function q093(ctx) {
  const ps = (ctx.strength && ctx.strength.planet_scores) || {};
  const maha = ctx.loaded.selected.dasha.available.maha;
  const antar = ctx.loaded.selected.dasha.available.antar;
  const transitByPlanet = {};
  if (ctx.transit && ctx.transit.available) {
    for (const t of ctx.transit.transits) transitByPlanet[t.planet] = t.classification;
  }

  let best = null;
  for (const p of ALL) {
    if (ps[p] == null) continue;
    let score = ps[p];                             // base natal strength (0-100)
    if (maha && maha.lord === p) score += 18;      // currently running → active
    if (antar && antar.lord === p) score += 10;
    if (transitByPlanet[p] === 'supportive') score += 8;
    else if (transitByPlanet[p] === 'caution') score -= 6;
    if (!best || score > best.score) best = { planet: p, score };
  }

  const activeRole = best && maha && maha.lord === best.planet ? 'maha'
    : best && antar && antar.lord === best.planet ? 'antar' : null;

  return {
    rule_keys: ['qa.strength.v1', 'qa.timing.v1', 'qa.transit.v1'],
    identified_planet: best ? best.planet : null,
    vars: { planet: best ? best.planet : null, active_role: activeRole },
  };
};
