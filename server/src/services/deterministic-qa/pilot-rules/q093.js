'use strict';
/**
 * Q093 — "Which planet is currently the most favourable for me?"
 *
 * A planet-IDENTIFICATION question. Combines the custom strength proxy with the
 * current Dasha (Maha/Antar lord get emphasis — they are "active") and the
 * dated slow-planet transits, to name the single most favourable active planet.
 * The answer STATE then reflects HOW favourable that planet currently is.
 */

const PLANET_HI = require('../answer-composer').PLANET_HI;
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

  if (!best) {
    return { rule_keys: ['qa.strength.v1', 'qa.timing.v1'], headline_en: 'Most favourable planet', headline_hi: 'सर्वाधिक अनुकूल ग्रह' };
  }

  const active = (maha && maha.lord === best.planet) ? ' (also your running Mahadasha lord)'
    : (antar && antar.lord === best.planet) ? ' (your running Antardasha lord)' : '';
  const activeHi = (maha && maha.lord === best.planet) ? ' (जो आपकी वर्तमान महादशा स्वामी भी है)'
    : (antar && antar.lord === best.planet) ? ' (आपकी वर्तमान अंतर्दशा स्वामी)' : '';

  return {
    rule_keys: ['qa.strength.v1', 'qa.timing.v1', 'qa.transit.v1'],
    identified_planet: best.planet,
    headline_en: `Currently most favourable planet: ${best.planet}`,
    headline_hi: `वर्तमान में सर्वाधिक अनुकूल ग्रह: ${PLANET_HI[best.planet] || best.planet}`,
    direct_en: `Right now, ${best.planet}${active} is the most favourable planet for you. Aligning important efforts with its significations, days and remedies gives the best current support.`,
    direct_hi: `इस समय ${PLANET_HI[best.planet] || best.planet}${activeHi} आपके लिए सबसे अनुकूल ग्रह है। महत्वपूर्ण प्रयासों को इसकी विशेषताओं, दिनों और उपायों से जोड़ना वर्तमान में सबसे अच्छा सहारा देता है।`,
  };
};
