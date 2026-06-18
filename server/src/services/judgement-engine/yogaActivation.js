'use strict';
/**
 * LAYER 5+6 — Yoga Detection + Conditional Activation
 * Each yoga is evaluated for actual activation strength based on:
 * supporting conditions, blocking conditions, dasha timing, and age.
 */
const {
  houseOf, normDignity, isStrongDignity, isWeakDignity, isDusthana,
  getAfflictions, afflictionPenalty, hasPaapKartari,
  dashaSupportsPlanet, clamp, pHi,
} = require('./helpers');

// ── Yoga-specific activation rules ───────────────────────────────────────────
// Each rule: { yogaPattern, evaluate(yoga, chart, lagnaResult, pillarResult) }
const YOGA_RULES = [

  {
    yogaPattern: /Gajakesari|Gaj.?Kesari/i,
    evaluate(yoga, chart, lagnaResult, pillarResult) {
      const planets = chart.planets || {};
      const lagna   = chart.ascendant?.rashi_num || 1;
      const moon    = planets.Moon;
      const jup     = planets.Jupiter;
      const moonAff = pillarResult?.moon?.afflictions || [];
      const moonScore = pillarResult?.moon?.score ?? 50;
      const grahanOnMoon = moonAff.includes('rahu_conjunct') || moonAff.includes('ketu_conjunct');
      const jupAff = getAfflictions('Jupiter', planets, lagna);
      const jupDebil = isWeakDignity(jup);
      const lagnaWeak = lagnaResult?.score < 45;
      const dashaJup = dashaSupportsPlanet('Jupiter', chart);
      const dashaMoon = dashaSupportsPlanet('Moon', chart);

      const blockers = [];
      const amplifiers = [];
      let reductionFactor = 1.0;

      if (grahanOnMoon) {
        blockers.push('Rahu/Ketu conjunct Moon (Grahan) reduces Gaj Kesari potency significantly');
        reductionFactor *= 0.5;
      }
      if (moonScore < 40) {
        blockers.push('Weak/afflicted Moon reduces Gaj Kesari strength');
        reductionFactor *= 0.65;
      }
      if (jupDebil) {
        blockers.push('Jupiter in debilitation weakens Gaj Kesari');
        reductionFactor *= 0.6;
      }
      if (jupAff.includes('rahu_conjunct') || jupAff.includes('ketu_conjunct')) {
        blockers.push('Rahu/Ketu with Jupiter reduces wisdom and fortune aspects of Gaj Kesari');
        reductionFactor *= 0.7;
      }
      if (lagnaWeak) {
        blockers.push('Weak Lagna lord reduces the person\'s ability to express Gaj Kesari results');
        reductionFactor *= 0.8;
      }
      if (isStrongDignity(jup)) {
        amplifiers.push('Jupiter in strong dignity amplifies Gaj Kesari wisdom and fortune');
        reductionFactor = Math.min(1.0, reductionFactor * 1.2);
      }
      if (dashaJup || dashaMoon) {
        amplifiers.push('Current dasha activates Gaj Kesari — good period for wisdom, guidance, and support');
        reductionFactor = Math.min(1.0, reductionFactor * 1.15);
      }

      const activation = reductionFactor >= 0.85 ? 'full'
        : reductionFactor >= 0.65 ? 'partial'
        : reductionFactor >= 0.4  ? 'weak'
        : 'blocked';

      const userEN = activation === 'full'
        ? 'Gaj Kesari Yoga is active — wisdom, reputation, and the ability to attract support and guidance are strong qualities in this chart.'
        : activation === 'partial'
        ? 'Gaj Kesari Yoga is present but partially reduced. Wisdom and support potential exist, but emotional instability or wrong decisions can reduce the result. Mindful choices and spiritual practice help activate this yoga more fully.'
        : activation === 'weak'
        ? 'Gaj Kesari Yoga exists in the chart but is significantly weakened. Cultivating calmness, wisdom practices, and right associations are needed to access its benefits.'
        : 'Gaj Kesari Yoga is present but heavily blocked by afflictions. Its results require serious effort, remedy, and a long-term disciplined approach.';

      const userHI = activation === 'full'
        ? 'गजकेसरी योग सक्रिय है — बुद्धिमत्ता, प्रतिष्ठा और सही मार्गदर्शन आकर्षित करने की शक्ति मजबूत है।'
        : activation === 'partial'
        ? 'गजकेसरी योग है लेकिन आंशिक रूप से कम हुआ है। बुद्धि और समर्थन की संभावना है, पर भावनात्मक अस्थिरता या गलत निर्णय परिणाम घटा सकते हैं। सही चुनाव और आध्यात्मिक अभ्यास इस योग को अधिक सक्रिय करने में मदद करते हैं।'
        : activation === 'weak'
        ? 'गजकेसरी योग मौजूद है पर काफी कमजोर है। शांति, ज्ञान अभ्यास और सही संगति इसके लाभ पाने में जरूरी है।'
        : 'गजकेसरी योग है लेकिन भारी पीड़ा से अवरुद्ध है। इसके परिणामों के लिए गंभीर प्रयास, उपाय और दीर्घकालिक अनुशासन जरूरी है।';

      return { activation, reductionFactor, blockers, amplifiers, userEN, userHI };
    },
  },

  {
    yogaPattern: /Raj.?Yog|Raja.?Yoga/i,
    evaluate(yoga, chart, lagnaResult, pillarResult) {
      const planets  = chart.planets || {};
      const lagna    = chart.ascendant?.rashi_num || 1;
      const lagnaScore = lagnaResult?.score ?? 50;
      const involvedPlanets = Array.isArray(yoga.planets_involved) ? yoga.planets_involved : [];
      const blockers = [];
      const amplifiers = [];
      let reductionFactor = 1.0;

      // Check each involved planet for weakness
      for (const pName of involvedPlanets) {
        const p = planets[pName];
        if (!p) continue;
        if (isWeakDignity(p)) {
          blockers.push(`${pName} in debilitation reduces this Raja Yoga's potency`);
          reductionFactor *= 0.65;
        }
        const aff = getAfflictions(pName, planets, lagna);
        const pen = afflictionPenalty(aff);
        if (pen > 20) {
          blockers.push(`${pName} heavily afflicted — Raja Yoga result delayed or partial`);
          reductionFactor *= 0.7;
        }
        if (hasPaapKartari(pName, planets, lagna)) {
          blockers.push(`${pName} in Paap Kartari — Raja Yoga result hemmed/restricted`);
          reductionFactor *= 0.75;
        }
        if (dashaSupportsPlanet(pName, chart)) {
          amplifiers.push(`${pName} dasha active — current period can manifest Raja Yoga results`);
          reductionFactor = Math.min(1.0, reductionFactor * 1.2);
        }
      }
      if (lagnaScore < 40) {
        blockers.push('Weak lagna lord reduces the person\'s ability to claim Raja Yoga results in society');
        reductionFactor *= 0.8;
      }
      if (pillarResult?.sun?.score < 40 || pillarResult?.moon?.score < 40) {
        blockers.push('Weak Sun or Moon reduces the expression of Raja Yoga in authority/social life');
        reductionFactor *= 0.85;
      }

      const activation = reductionFactor >= 0.82 ? 'full'
        : reductionFactor >= 0.6  ? 'partial'
        : reductionFactor >= 0.38 ? 'weak'
        : 'blocked';

      const userEN = activation === 'full'
        ? `${yoga.name} is active — leadership, achievement, and recognition potential are present in this chart.`
        : activation === 'partial'
        ? `${yoga.name} is present but partially activated. Recognition and achievement potential exists, but requires right timing (dasha), sustained effort, and addressing any planetary weaknesses.`
        : activation === 'weak'
        ? `${yoga.name} exists but its strength is reduced by planetary afflictions. Its results can emerge slowly through dedicated effort, remedy, and patience.`
        : `${yoga.name} is present but currently heavily blocked. Its potential is there, but significant effort and remedy are required before it can manifest.`;

      const userHI = activation === 'full'
        ? `${yoga.name_hi || yoga.name} सक्रिय है — नेतृत्व, उपलब्धि और सम्मान की संभावना मजबूत है।`
        : activation === 'partial'
        ? `${yoga.name_hi || yoga.name} आंशिक रूप से सक्रिय है। सफलता और सम्मान की संभावना है, लेकिन सही दशा टाइमिंग, लगातार प्रयास और ग्रह कमजोरी को दूर करना जरूरी है।`
        : activation === 'weak'
        ? `${yoga.name_hi || yoga.name} मौजूद है पर ग्रह पीड़ा से कमजोर है। धैर्य, उपाय और समर्पित प्रयास से इसके परिणाम धीरे-धीरे आ सकते हैं।`
        : `${yoga.name_hi || yoga.name} है लेकिन अभी भारी अवरोध में है। संभावना तो है, लेकिन प्रकट होने के लिए महत्वपूर्ण प्रयास और उपाय जरूरी हैं।`;

      return { activation, reductionFactor, blockers, amplifiers, userEN, userHI };
    },
  },

  {
    yogaPattern: /Dhan|Lakshmi|Dhana/i,
    evaluate(yoga, chart, lagnaResult, pillarResult) {
      const planets  = chart.planets || {};
      const lagna    = chart.ascendant?.rashi_num || 1;
      const involvedPlanets = Array.isArray(yoga.planets_involved) ? yoga.planets_involved : [];
      const blockers = [];
      const amplifiers = [];
      let reductionFactor = 1.0;

      // 2nd, 9th, 11th house lord strength is key for Dhan yogas
      const checkHouses = [2, 9, 11];
      for (const h of checkHouses) {
        const lordSign = ((lagna + h - 2) % 12) + 1;
        const { RASHI_LORD } = require('./helpers');
        const lordName = RASHI_LORD[lordSign];
        const lord = planets[lordName];
        if (lord && isWeakDignity(lord)) {
          blockers.push(`${h}th house lord (${lordName}) in debilitation weakens money potential`);
          reductionFactor *= 0.8;
        }
        if (lord && isDusthana(houseOf(lord, lagna))) {
          blockers.push(`${h}th house lord (${lordName}) in trik house — wealth results delayed or blocked`);
          reductionFactor *= 0.82;
        }
      }

      if (pillarResult?.sun?.score < 40) {
        blockers.push('Weak Sun reduces authority-based wealth and government income support');
        reductionFactor *= 0.85;
      }
      if (lagnaResult?.score < 40) {
        blockers.push('Weak lagna lord reduces ability to attract and retain wealth');
        reductionFactor *= 0.8;
      }

      const dashaActivated = involvedPlanets.some(n => dashaSupportsPlanet(n, chart));
      if (dashaActivated) {
        amplifiers.push('Current dasha activates Dhan yoga — this period has income growth potential');
        reductionFactor = Math.min(1.0, reductionFactor * 1.2);
      }

      const activation = reductionFactor >= 0.82 ? 'full'
        : reductionFactor >= 0.6  ? 'partial'
        : reductionFactor >= 0.38 ? 'weak'
        : 'blocked';

      const userEN = activation === 'full'
        ? `${yoga.name} is well-activated — financial growth, income, and wealth accumulation are supported in this chart.`
        : activation === 'partial'
        ? `${yoga.name} shows financial potential, but gains may require disciplined effort, right timing, and addressing income source stability.`
        : activation === 'weak'
        ? `${yoga.name} exists but wealth potential is partially blocked. Systematic savings, effort, and remedy can gradually improve financial stability.`
        : `${yoga.name} is present but financial results are currently blocked. Extra discipline, right profession alignment, and remedy are needed.`;

      const userHI = activation === 'full'
        ? `${yoga.name_hi || yoga.name} अच्छी तरह सक्रिय है — आर्थिक विकास, आय और संपत्ति संचय को समर्थन मिला है।`
        : activation === 'partial'
        ? `${yoga.name_hi || yoga.name} में आर्थिक संभावना है, लेकिन अनुशासित प्रयास, सही समय और आय स्रोत की स्थिरता पर ध्यान देना जरूरी है।`
        : activation === 'weak'
        ? `${yoga.name_hi || yoga.name} है लेकिन धन संभावना आंशिक रूप से अवरुद्ध है। व्यवस्थित बचत, प्रयास और उपाय से आर्थिक स्थिरता धीरे-धीरे सुधर सकती है।`
        : `${yoga.name_hi || yoga.name} मौजूद है लेकिन आर्थिक परिणाम अभी रुके हुए हैं। अतिरिक्त अनुशासन, सही व्यवसाय और उपाय जरूरी हैं।`;

      return { activation, reductionFactor, blockers, amplifiers, userEN, userHI };
    },
  },
];

// Generic fallback evaluator for yogas without specific rules
function _genericActivation(yoga, chart, lagnaResult) {
  const planets = chart.planets || {};
  const lagna   = chart.ascendant?.rashi_num || 1;
  const involved = Array.isArray(yoga.planets_involved) ? yoga.planets_involved : [];
  const blockers = [];
  const amplifiers = [];
  let reductionFactor = 1.0;

  for (const pName of involved) {
    const p = planets[pName];
    if (!p) continue;
    if (isWeakDignity(p)) { reductionFactor *= 0.7; blockers.push(`${pName} in debilitation`); }
    const aff = getAfflictions(pName, planets, lagna);
    if (afflictionPenalty(aff) > 18) { reductionFactor *= 0.75; blockers.push(`${pName} heavily afflicted`); }
    if (isDusthana(houseOf(p, lagna))) { reductionFactor *= 0.82; blockers.push(`${pName} in trik house`); }
    if (isStrongDignity(p)) { amplifiers.push(`${pName} in strong dignity`); reductionFactor = Math.min(1.0, reductionFactor * 1.15); }
    if (dashaSupportsPlanet(pName, chart)) { amplifiers.push(`${pName} dasha active`); reductionFactor = Math.min(1.0, reductionFactor * 1.15); }
  }

  // Apply lagna lord confidence multiplier
  if (lagnaResult?.yogaConfidenceMultiplier) {
    reductionFactor *= lagnaResult.yogaConfidenceMultiplier;
    reductionFactor = Math.min(1.0, reductionFactor);
  }

  return {
    activation: reductionFactor >= 0.82 ? 'full' : reductionFactor >= 0.6 ? 'partial' : reductionFactor >= 0.38 ? 'weak' : 'blocked',
    reductionFactor,
    blockers,
    amplifiers,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
function evaluateYogas(chart, lagnaResult, pillarResult) {
  const rawYogas = chart?.yogas_doshas?.yogas || [];
  const lagna    = chart.ascendant?.rashi_num || 1;
  const planets  = chart.planets || {};

  return rawYogas.map(yoga => {
    if (!yoga) return null;

    // Find matching specific rule
    const rule = YOGA_RULES.find(r => r.yogaPattern.test(yoga.name || ''));
    let activation, reductionFactor, blockers, amplifiers, userEN, userHI;

    if (rule) {
      ({ activation, reductionFactor, blockers, amplifiers, userEN, userHI } =
        rule.evaluate(yoga, chart, lagnaResult, pillarResult));
    } else {
      ({ activation, reductionFactor, blockers, amplifiers } =
        _genericActivation(yoga, chart, lagnaResult));
    }

    // Combine with existing yoga cancellation status
    if (yoga.is_cancelled) {
      activation = 'blocked';
      blockers.push('Yoga is cancelled by classical cancellation rules');
    } else if (yoga.cancellation_status === 'modified') {
      if (activation === 'full') activation = 'partial';
    }

    // Yoga strength from detection engine affects result
    const yogaStrengthMod = yoga.strength === 'strong' ? 1.1 : yoga.strength === 'weak' ? 0.8 : 1.0;
    const effectiveStrength = clamp(Math.round(reductionFactor * yogaStrengthMod * 100), 0, 100);

    // Default EN/HI if rule didn't provide
    if (!userEN) {
      userEN = activation === 'full'
        ? `${yoga.name} is active in this chart.`
        : activation === 'partial'
        ? `${yoga.name} is present but partially activated — results come with effort and right timing.`
        : activation === 'weak'
        ? `${yoga.name} exists but weakened — consistent effort and remedy can gradually unlock its potential.`
        : `${yoga.name} is present but currently blocked — significant effort and remedy are needed to activate it.`;
    }
    if (!userHI) {
      userHI = activation === 'full'
        ? `${yoga.name_hi || yoga.name} इस कुंडली में सक्रिय है।`
        : activation === 'partial'
        ? `${yoga.name_hi || yoga.name} मौजूद है लेकिन आंशिक रूप से सक्रिय — परिणाम प्रयास और सही समय से आते हैं।`
        : activation === 'weak'
        ? `${yoga.name_hi || yoga.name} है लेकिन कमजोर — लगातार प्रयास और उपाय से इसकी संभावना खुल सकती है।`
        : `${yoga.name_hi || yoga.name} है लेकिन अभी अवरुद्ध है — सक्रिय करने के लिए महत्वपूर्ण प्रयास और उपाय जरूरी हैं।`;
    }

    return {
      name:           yoga.name,
      nameHi:         yoga.name_hi,
      strength:       yoga.strength,
      area:           _yogaArea(yoga.name),
      activation,
      effectiveStrength,
      reductionFactor: +reductionFactor.toFixed(2),
      blockers,
      amplifiers,
      supportingConditions: amplifiers,
      blockingConditions:   blockers,
      userEN,
      userHI,
      adminReason: blockers.length
        ? `Blockers: ${blockers.join('; ')}. Amplifiers: ${amplifiers.join('; ') || 'none'}.`
        : `No major blockers. ${amplifiers.join('; ')}`,
      rawYoga: yoga,
    };
  }).filter(Boolean);
}

function _yogaArea(name = '') {
  if (/Gaj|Kesari|Hamsa|Sasha|Ruchaka|Bhadra|Malavya|Shasha|Panchm/i.test(name)) return 'personality';
  if (/Dhan|Lakshmi|Kubera|Dhana/i.test(name)) return 'wealth';
  if (/Raj|Raja/i.test(name)) return 'career';
  if (/Guru.?Chandal|Grahan/i.test(name)) return 'challenges';
  if (/Vish|Kala.?Sarpa|Sarpa/i.test(name)) return 'challenges';
  if (/Neech.?Bhanga/i.test(name)) return 'transformation';
  if (/Budhaditya/i.test(name)) return 'intellect';
  return 'general';
}

module.exports = { evaluateYogas };
