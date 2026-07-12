'use strict';
/**
 * Q001 — "What is my basic nature and personality?"
 *
 * A descriptive question. Anchors on the Lagna sign, the Lagna lord, the Moon
 * (mind/emotions) and the Sun (self/ego), and names the dominant personality
 * planet from the strength proxy. The state reflects the overall balance of the
 * self-signifiers rather than a favourable/unfavourable outcome.
 */

const composer = require('../answer-composer');
const PLANET_HI = composer.PLANET_HI;

module.exports = function q001(ctx) {
  const stateHi = composer.STATE_FRAME[ctx.state] ? composer.STATE_FRAME[ctx.state].hi : ctx.state;
  const chart = ctx.loaded.chart;
  const ps = (ctx.strength && ctx.strength.planet_scores) || {};
  const lagnaEn = chart.ascendant && chart.ascendant.rashi_en;
  const lagnaHi = chart.ascendant && chart.ascendant.rashi_hi;
  const lagnaLord = chart.ascendant && chart.ascendant.rashi_lord;
  const moonEn = chart.planets && chart.planets.Moon ? chart.planets.Moon.rashi_en : null;
  const moonHi = chart.planets && chart.planets.Moon ? chart.planets.Moon.rashi_hi : null;

  // dominant personality planet: strongest among self-signifiers
  const candidates = [lagnaLord, 'Sun', 'Moon', 'Mars', 'Mercury'].filter(Boolean);
  let dominant = null;
  for (const p of candidates) if (ps[p] != null && (!dominant || ps[p] > ps[dominant])) dominant = p;

  const domEn = dominant ? `, with ${dominant} as the dominant influence on how you come across` : '';
  const domHi = dominant ? `, और ${PLANET_HI[dominant] || dominant} का आपके व्यक्तित्व पर प्रमुख प्रभाव` : '';

  return {
    rule_keys: ['qa.strength.v1', 'qa.lens.v1'],
    identified_planet: dominant,
    headline_en: 'Your core nature',
    headline_hi: 'आपका मूल स्वभाव',
    direct_en: `Your personality is shaped by ${lagnaEn || 'your'} ascendant (ruled by ${lagnaLord || 'its lord'})${moonEn ? ` and a ${moonEn} Moon guiding your emotional mind` : ''}${domEn}. Overall the self-signifiers are ${ctx.state.replace(/_/g, ' ')}.`,
    direct_hi: `आपका व्यक्तित्व ${lagnaHi || 'आपके'} लग्न (स्वामी ${PLANET_HI[lagnaLord] || lagnaLord || ''}) ${moonHi ? `और ${moonHi} राशि के चंद्र` : ''} से बनता है${domHi}। कुल मिलाकर आत्म-कारक ${stateHi} हैं।`,
    action_en: 'Lean into your natural strengths listed above, and consciously balance the one weaker trait rather than fighting your whole temperament.',
    action_hi: 'ऊपर बताई अपनी स्वाभाविक शक्तियों का उपयोग करें, और पूरे स्वभाव से लड़ने के बजाय एक कमजोर पक्ष को सचेत रूप से संतुलित करें।',
  };
};
