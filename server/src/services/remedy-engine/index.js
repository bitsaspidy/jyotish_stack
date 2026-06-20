'use strict';
/**
 * Personalized Remedy Engine — server-side orchestrator.
 * Source: "Vedic Jyotish Remedial Manual — Remedy Class 1, 4th May 2026"
 *
 * Input:  chart, { remedyManual, lang }
 * Output: full personalized remedy plan (both EN + HI stored; frontend selects by lang)
 */

const { PLANET_REMEDY_MAP, PLANET_ORDER }            = require('./planetRemedyMap');
const { PROBLEM_REMEDY_MAP }                         = require('./problemRemedyMap');
const { scorePlanets, detectAtmakaraka, detectLagnaLord, detectCurrentDasha } = require('./remedyDetector');
const { rankPlanets, bucketize, pickFocusPlanets }   = require('./remedyRanker');
const { buildPujaSequence }                          = require('./pujaSequenceBuilder');
const { buildSadhanaDuration }                       = require('./sadhanaDurationBuilder');
const { buildMuhuratGuide }                          = require('./muhuratGuideBuilder');
const {
  buildDailyRemedy, buildWeeklyRemedy, buildAdvancedRemedy, buildWhyText,
  isSafe, IMPACT, BENEFIT, MANTRA_COUNT, FORBIDDEN_USER_PHRASES_EN,
} = require('./remedyHumanizer');

// ── Detect problem-specific remedies from chart signals ───────────────────────
function detectProblems(chart, ascNum, scored) {
  const planets = chart.planets || {};
  const getHouse = (name) => scored[name]?.house;

  return Object.values(PROBLEM_REMEDY_MAP).map(prob => {
    // Determine relevance from chart signals
    let is_active = false;
    const evidence = [];

    // Check if the primary planet for this problem is weak/afflicted
    const primaryP = scored[prob.planet];
    if (primaryP && primaryP.priority !== 'healthy') {
      is_active = true;
      evidence.push(`Primary planet ${prob.planet} has priority: ${primaryP.priority} (score ${primaryP.score})`);
    }

    // Check trigger houses
    for (const h of prob.trigger_houses || []) {
      const occupants = Object.entries(scored).filter(([, p]) => p.house === h && p.priority !== 'healthy');
      if (occupants.length) {
        is_active = true;
        occupants.forEach(([name, p]) => evidence.push(`${name} in H${h} (score ${p.score})`));
      }
    }

    // Check trigger planets
    for (const pName of prob.trigger_planet_weak || []) {
      const p = scored[pName];
      if (p && p.score >= 45) {
        is_active = true;
        evidence.push(`${pName} score=${p.score} (trigger threshold 45)`);
      }
    }

    return {
      ...prob,
      is_active,
      admin_evidence: evidence,
    };
  });
}

// ── Build priority remedy cards (top 3 focus planets) ─────────────────────────
function buildPriorityRemedies(focusPlanets, scored, lagnaLord, atmakarak, mdLord, adLord) {
  return focusPlanets.map((p, idx) => {
    const r = p.remedyRef || PLANET_REMEDY_MAP[p.name];
    return {
      rank:     idx + 1,
      planet:   { name: p.name, name_hi: p.name_hi, icon: p.icon, house: p.house, score: p.score, priority: p.priority },
      why_en:   buildWhyText(p.name, p.priority, p.triggers, lagnaLord, atmakarak, mdLord, adLord, 'en'),
      why_hi:   buildWhyText(p.name, p.priority, p.triggers, lagnaLord, atmakarak, mdLord, adLord, 'hi'),
      benefit_en: BENEFIT[p.name]?.en || 'Improved planetary results.',
      benefit_hi: BENEFIT[p.name]?.hi || 'ग्रह फल में सुधार।',
      daily_en:   buildDailyRemedy(p.name, p.priority, r, 'en'),
      daily_hi:   buildDailyRemedy(p.name, p.priority, r, 'hi'),
      weekly_en:  buildWeeklyRemedy(p.name, p.priority, r, 'en'),
      weekly_hi:  buildWeeklyRemedy(p.name, p.priority, r, 'hi'),
      advanced_en: buildAdvancedRemedy(p.name, p.priority, r, 'en'),
      advanced_hi: buildAdvancedRemedy(p.name, p.priority, r, 'hi'),
      mantra_count: MANTRA_COUNT[p.priority] || 27,
      primary_text_en: r?.primary_text || '',
      primary_text_hi: r?.primary_text || '',
      ishta_devata_en: r?.ishta_devata_en || '',
      ishta_devata_hi: r?.ishta_devata_hi || '',
      day_en: r?.day_en || '',
      day_hi: r?.day_hi || '',
    };
  });
}

// ── Build optional (healthy) planet notes ─────────────────────────────────────
function buildOptionalRemedies(buckets) {
  return buckets.healthy.map(p => {
    const r = p.remedyRef || PLANET_REMEDY_MAP[p.name];
    return {
      name: p.name, name_hi: p.name_hi, icon: p.icon,
      status_en: 'Doing well — no specific remedy required at this time.',
      status_hi: 'ठीक स्थिति में — इस समय कोई विशेष उपाय आवश्यक नहीं।',
      optional_en: r ? `Optional: You may recite "${r.beeja_mantra}" on ${r.day_en} as a maintenance practice.` : '',
      optional_hi: r ? `वैकल्पिक: ${r.day_hi} को "${r.beeja_mantra}" का पाठ रखरखाव अभ्यास के रूप में किया जा सकता है।` : '',
    };
  });
}

// ── Admin technical details ───────────────────────────────────────────────────
function buildAdminDetails(scored, sorted, lagnaLord, atmakarak, md, ad, sadhanaDuration, detectedProblems) {
  const planet_scores = {};
  PLANET_ORDER.forEach(name => {
    if (scored[name]) planet_scores[name] = { score: scored[name].score, priority: scored[name].priority };
  });

  const trigger_log = sorted.flatMap(p =>
    (p.adminTriggers || []).map(t => ({ planet: p.name, ...t }))
  );

  const priority_logic = sorted.slice(0, 5).map((p, i) => ({
    rank: i + 1,
    planet: p.name,
    score:  p.score,
    priority: p.priority,
    is_lagna_lord: p.name === lagnaLord,
    is_atmakarak:  p.name === atmakarak,
    is_md_lord:    p.name === md?.lord,
    is_ad_lord:    p.name === ad?.lord,
    selection_reason: [
      p.name === lagnaLord && 'Lagna Lord',
      p.name === atmakarak  && 'Atmakaraka',
      p.name === md?.lord   && 'Mahadasha Lord',
      p.name === ad?.lord   && 'Antardasha Lord',
      `Score: ${p.score}`,
    ].filter(Boolean).join(', '),
  }));

  return {
    source: 'PDF Remedy Class 1 — 4th May 2026 (Vedic Jyotish Remedial Manual)',
    planet_scores,
    trigger_log,
    priority_logic,
    sadhana_reason_technical: sadhanaDuration.reason_en,
    detected_problems: detectedProblems.map(p => ({
      key: p.key, is_active: p.is_active, evidence: p.admin_evidence,
    })),
    lagna_lord: lagnaLord,
    atmakarak,
    current_md: md?.lord || null,
    current_ad: ad?.lord || null,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * generatePersonalizedRemedies(chart, opts)
 * @param {object} chart — from kundli.calculated_data
 * @param {object} opts  — { remedyManual } (optional — used for reference library enrichment)
 * @returns full remedy plan object
 */
function generatePersonalizedRemedies(chart, opts = {}) {
  if (!chart?.planets || !chart?.ascendant) return null;

  const ascNum    = chart.ascendant?.rashi_num || 1;
  const lagnaLord = detectLagnaLord(ascNum);
  const atmakarak = detectAtmakaraka(chart.planets);
  const { md, ad } = detectCurrentDasha(chart.dasha);

  // Score all planets
  const scored = scorePlanets(chart);

  // Rank and bucket
  const sorted  = rankPlanets(scored, lagnaLord, atmakarak, md?.lord, ad?.lord);
  const buckets = bucketize(sorted);
  const focusPlanets = pickFocusPlanets(sorted);

  // Detect problems from chart signals
  const detectedProblems = detectProblems(chart, ascNum, scored);

  // Puja sequence
  const priorityPlanet = focusPlanets[0]?.name || null;
  const { steps: pujaSteps, shaktiCovered } = buildPujaSequence(priorityPlanet, lagnaLord, atmakarak, scored);

  // Sadhana duration
  const sadhanaDuration = buildSadhanaDuration(buckets, detectedProblems);

  // Muhurat guide (static PDF data)
  const muhuratGuide = buildMuhuratGuide();

  // Priority remedy cards
  const priorityRemedies = buildPriorityRemedies(
    focusPlanets, scored, lagnaLord, atmakarak, md?.lord, ad?.lord
  );

  // Optional (healthy) planet notes
  const optionalRemedies = buildOptionalRemedies(buckets);

  // Admin technical details
  const adminTechnicalDetails = buildAdminDetails(
    scored, sorted, lagnaLord, atmakarak, md, ad, sadhanaDuration, detectedProblems
  );

  // Planetary health list (all 9, sorted by need)
  const planetaryHealth = sorted.map(p => ({
    name:         p.name,
    name_hi:      p.name_hi,
    icon:         p.icon,
    house:        p.house,
    rashi_en:     p.rashi_en,
    dignity:      p.dignity,
    is_retrograde: p.is_retrograde,
    is_combust:   p.is_combust,
    score:        p.score,
    priority:     p.priority,
    triggers_en:  p.triggers.map(t => t.en),
    triggers_hi:  p.triggers.map(t => t.hi),
    adminTriggers: p.adminTriggers,
    impact_en:    IMPACT[p.name]?.en || '',
    impact_hi:    IMPACT[p.name]?.hi || '',
    benefit_en:   BENEFIT[p.name]?.en || '',
    benefit_hi:   BENEFIT[p.name]?.hi || '',
  }));

  return {
    meta: {
      lagna_lord:     lagnaLord,
      lagna_lord_hi:  (PLANET_REMEDY_MAP[lagnaLord]?.name_hi) || lagnaLord,
      atmakarak,
      atmakarak_hi:   (PLANET_REMEDY_MAP[atmakarak]?.name_hi)  || atmakarak,
      lagna_rashi_en: chart.ascendant?.rashi_en || '',
      current_md_lord: md?.lord  || null,
      current_ad_lord: ad?.lord  || null,
      focus_count:    focusPlanets.length,
      sadhana_days:   sadhanaDuration.days,
      generated_at:   new Date().toISOString(),
      source:         'Remedy Class 1 — 4th May 2026',
    },
    planetaryHealth,
    priorityRemedies,
    optionalRemedies,
    dailyPujaSequence: pujaSteps,
    shaktiCovered,
    sadhanaDuration,
    bestTimeWindows: muhuratGuide,
    problemSpecificRemedies: detectedProblems,
    adminTechnicalDetails,
    // Problem lookup by key for frontend quick access
    problemRemedyMap: PROBLEM_REMEDY_MAP,
  };
}

module.exports = { generatePersonalizedRemedies };
