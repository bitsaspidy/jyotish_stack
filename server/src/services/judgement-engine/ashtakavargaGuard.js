'use strict';
/**
 * LAYER 10 — Ashtakavarga Guard
 * Ashtakavarga should NOT be used as a primary positive source for a planet
 * that is under major dosha (Paap Kartari, Grahan, heavy affliction, severe combust).
 */
const { getAfflictions, afflictionPenalty, hasPaapKartari, isWeakDignity, normDignity } = require('./helpers');

const PLANETS_9 = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

function evaluateAshtakavargaGuard(chart) {
  const planets  = chart.planets || {};
  const lagna    = chart.ascendant?.rashi_num || 1;
  const results  = {};

  for (const pName of PLANETS_9) {
    const p   = planets[pName];
    if (!p) { results[pName] = { reliable: true, reason: null }; continue; }

    const aff   = getAfflictions(pName, planets, lagna);
    const pen   = afflictionPenalty(aff);
    const ppk   = hasPaapKartari(pName, planets, lagna);
    const debil = isWeakDignity(p);

    const grahanInfluence = aff.includes('rahu_conjunct') || aff.includes('ketu_conjunct');
    const deepCombust     = p.combust_level === 'deep' || aff.includes('deep_combust');
    const heavyAffliction = pen >= 28;

    const majorDosha = grahanInfluence || deepCombust || heavyAffliction || (ppk && debil);

    const reasons = [];
    if (grahanInfluence) reasons.push('Rahu/Ketu conjunction (Grahan influence)');
    if (deepCombust)     reasons.push('Deep combustion (burnt out)');
    if (heavyAffliction) reasons.push(`Heavy total affliction penalty (${pen})`);
    if (ppk && debil)    reasons.push('Paap Kartari + Debilitation (dual weakness)');

    results[pName] = {
      planet: pName,
      reliable: !majorDosha,
      majorDosha,
      reasons,
      // Admin note — explains why AV is not reliable
      adminNote: majorDosha
        ? `Ashtakavarga for ${pName} is NOT reliable as a primary positive indicator: ${reasons.join('; ')}.`
        : `Ashtakavarga for ${pName} can be used normally — no major dosha detected.`,
      // User note (never technical)
      userNoteHi: majorDosha
        ? `इस ग्रह से जुड़े परिणामों में स्थिरता के लिए विशेष सावधानी और सही समय का चयन जरूरी है।`
        : null,
      userNoteEn: majorDosha
        ? `Results connected to this planet need extra care, right timing, and disciplined effort for stability.`
        : null,
    };
  }

  return results;
}

module.exports = { evaluateAshtakavargaGuard };
