'use strict';
/**
 * Life-activation engine — "how switched on is this chart right now, and where?"
 *
 * Deterministic and rule-based. No LLM, no randomness, no placeholder percentages:
 * the same chart at the same instant always returns the same numbers.
 *
 * REUSE, NOT REIMPLEMENTATION. Every astrological quantity comes from a module
 * that already owns it:
 *   - helpers/kundli-strength.js   → planet_scores, life_domains, yoga_score,
 *                                    dasha_score, current maha/antar (custom
 *                                    proxy, NOT classical Shadbala)
 *   - helpers/gochar.js            → CURRENT transit (chart.gochar is a snapshot
 *                                    frozen at calculation time — it is stale and
 *                                    must never be used for "now")
 *   - chart.dasha                  → Vimshottari maha/antar
 *   - chart.yogas_doshas           → yogas
 *   - chart.varga_analysis         → divisional overall_status per chart
 * Nothing here recomputes a longitude, a dignity or a dasha.
 *
 * The single interpretation rule that governs all output: THE CHART IS ACTIVE FROM
 * BIRTH. A low score means "these areas are less prominent in the current period",
 * never "your chart is off".
 *
 * `business` honestly has no strength domain to lean on (kundli-strength exposes
 * career, not business, and the 10th house is not a proxy for trade). It is scored
 * from its houses and karakas alone and carries reduced confidence rather than
 * borrowing career's number — per "do not fabricate category scores".
 */

const CFG = require('../../config/life-activation.config');
const { computeAge } = require('./age');
const { computeMaturity, PLANET_HI } = require('./maturity');
const { computeKundliStrength } = require('../helpers/kundli-strength');
const { calculateTransitSummary } = require('../helpers/gochar');

const clamp01to100 = (v) => Math.max(0, Math.min(100, v));
const signedToPercent = (signed) => clamp01to100((signed + 100) / 2); // [-100,100] → [0,100]

const pick = (pair, lang) => (lang === 'hi' ? pair.hi : pair.en);

function bandFor(score) {
  return (CFG.ACTIVATION_BANDS.find((b) => score >= b.min) || CFG.ACTIVATION_BANDS[CFG.ACTIVATION_BANDS.length - 1]).status;
}

function insufficient(reason, lang) {
  return {
    available: false,
    reason,
    message: pick(CFG.INSUFFICIENT[reason] || CFG.INSUFFICIENT.calculation_failed, lang),
    rule_version: CFG.RULE_VERSION,
  };
}

/** whole-sign house of a natal planet */
function houseOf(chart, planet) {
  const p = chart?.planets?.[planet];
  const asc = chart?.ascendant?.rashi_num;
  if (!p?.rashi_num || !asc) return null;
  return ((p.rashi_num - asc + 12) % 12) + 1;
}

/** the planet ruling `house` (whole-sign), via the sign lord already in the chart */
const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
function lordOfHouse(chart, house) {
  const asc = chart?.ascendant?.rashi_num;
  if (!asc) return null;
  const sign = ((asc - 1 + (house - 1)) % 12) + 1;
  return SIGN_LORD[sign - 1];
}

// ── Factor 1: dasha activation ───────────────────────────────────────────────
// Weighted to the Mahadasha, which sets the chapter; the Antardasha colours it.
function dashaFactor(strength) {
  const maha = strength?.current_mahadasha;
  const antar = strength?.current_antardasha;
  if (!maha) return { value: null, reason: 'missing_dasha' };
  const mahaScore = clamp01to100(maha.score ?? 50);
  const antarScore = antar ? clamp01to100(antar.score ?? 50) : mahaScore;
  return {
    value: clamp01to100(Math.round(mahaScore * 0.6 + antarScore * 0.4)),
    maha: { planet: maha.planet, score: mahaScore, end: maha.end_date },
    antar: antar ? { planet: antar.planet, score: antarScore, end: antar.end_date } : null,
  };
}

// ── Factor 3: transit support (computed FRESH — never chart.gochar) ──────────
function transitFactor(chart, now) {
  let transit;
  try {
    transit = calculateTransitSummary(chart, null, now);
  } catch {
    return { value: null, reason: 'missing_transit' };
  }
  if (!transit?.highlights) return { value: null, reason: 'missing_transit' };

  let v = 50;
  const notes = [];
  const h = transit.highlights;

  if (h.jupiter_support?.favorable) { v += 20; notes.push({ en: `Jupiter transits the ${h.jupiter_support.house_from_moon}th from Moon — supportive`, hi: `गुरु चंद्र से ${h.jupiter_support.house_from_moon}वें भाव में गोचर कर रहा है — सहायक` }); }
  else { v -= 5; notes.push({ en: `Jupiter transits the ${h.jupiter_support?.house_from_moon}th from Moon — not among the supportive houses`, hi: `गुरु चंद्र से ${h.jupiter_support?.house_from_moon}वें भाव में — सहायक भावों में नहीं` }); }

  if (h.sade_sati?.active) {
    const phase = h.sade_sati.phase;
    v -= phase === 'peak' ? 25 : 15;
    notes.push({ en: `Sade Sati is running (${phase} phase) — Saturn asks for patience`, hi: `साढ़े साती चल रही है (${phase} चरण) — शनि धैर्य माँगता है` });
  } else {
    const sh = h.sade_sati?.saturn_house_from_moon;
    if ([3, 6, 11].includes(sh)) { v += 10; notes.push({ en: `Saturn transits the ${sh}th from Moon — an upachaya, effort compounds`, hi: `शनि चंद्र से ${sh}वें (उपचय) भाव में — प्रयास फलदायी` }); }
  }

  return { value: clamp01to100(Math.round(v)), notes, transit };
}

// ── Factor 6: divisional-chart support ───────────────────────────────────────
function vargaFactor(chart, slugs) {
  const va = chart?.varga_analysis;
  if (!va) return { value: null, reason: 'missing_varga' };
  const present = slugs.filter((s) => va[s]?.overall_status);
  if (!present.length) return { value: null, reason: 'missing_varga' };
  const signed = present.map((s) => CFG.VARGA_STATUS_SIGNED[va[s].overall_status] ?? 0);
  const avg = signed.reduce((a, b) => a + b, 0) / signed.length;
  return {
    value: Math.round(signedToPercent(avg)),
    charts: present.map((s) => ({ slug: s, status: va[s].overall_status })),
  };
}

/**
 * Combine factors → 0–100.
 * A factor with no data is EXCLUDED and its weight redistributed across the
 * factors that do have data, so a missing transit cannot silently read as zero
 * support (an artificial 0% is exactly what the spec forbids).
 */
function combine(factors) {
  const usable = Object.entries(factors).filter(([, f]) => f && f.value != null);
  if (!usable.length) return null;
  const totalWeight = usable.reduce((s, [k]) => s + CFG.FACTOR_WEIGHTS[k], 0);
  const contributions = {};
  let acc = 0;
  for (const [k, f] of usable) {
    const weight = CFG.FACTOR_WEIGHTS[k];
    const contribution = (f.value / 100) * weight;
    contributions[k] = +contribution.toFixed(2);
    acc += contribution;
  }
  const score = Math.round((acc / totalWeight) * 100);
  return {
    score: clamp01to100(score),
    contributions,
    usedWeight: totalWeight,
    missing: Object.keys(factors).filter((k) => !contributions[k]),
  };
}

// ── Confidence ───────────────────────────────────────────────────────────────
function assessConfidence({ hasTime, varga, dasha, transit, supporting, contradicting }) {
  const reasons = [];
  let level = 'HIGH';

  if (!hasTime) { level = 'LIMITED'; reasons.push({ en: 'Birth time is unavailable, so house- and varga-dependent findings cannot be relied on.', hi: 'जन्म समय उपलब्ध नहीं है, इसलिए भाव और वर्ग आधारित निष्कर्ष विश्वसनीय नहीं हैं।' }); }
  if (!varga || varga.value == null) {
    level = level === 'LIMITED' ? 'LIMITED' : 'MEDIUM';
    reasons.push({ en: 'Divisional-chart support is unavailable for this area.', hi: 'इस क्षेत्र के लिए वर्ग कुंडली का आधार उपलब्ध नहीं है।' });
  }
  if (!dasha || dasha.value == null) {
    level = 'LIMITED';
    reasons.push({ en: 'Dasha data is unavailable, so current timing cannot be judged.', hi: 'दशा डेटा उपलब्ध नहीं है, इसलिए वर्तमान समय का आकलन नहीं हो सकता।' });
  }
  if (!transit || transit.value == null) {
    level = level === 'HIGH' ? 'MEDIUM' : level;
    reasons.push({ en: 'Transit data is unavailable.', hi: 'गोचर डेटा उपलब्ध नहीं है।' });
  }
  // evidence pulling both ways lowers confidence even when everything is present
  if (level === 'HIGH' && contradicting >= supporting && contradicting > 0) {
    level = 'MEDIUM';
    reasons.push({ en: 'Supporting and contradicting factors are close to balanced.', hi: 'समर्थक और विरोधी कारक लगभग बराबर हैं।' });
  }
  if (!reasons.length) reasons.push({ en: 'Natal, dasha, transit and divisional evidence all agree.', hi: 'जन्म कुंडली, दशा, गोचर और वर्ग — सभी आधार सहमत हैं।' });
  return { level, reasons };
}

// ── Category activation ──────────────────────────────────────────────────────
function categoryActivation({ chart, strength, def, maturity, transitF, lang }) {
  const supporting = [];
  const contradicting = [];

  // natal: reuse the existing life_domains score when this category maps to one
  let natal = null;
  if (def.strengthDomain && strength?.life_domains?.[def.strengthDomain]) {
    natal = { value: clamp01to100(strength.life_domains[def.strengthDomain].score) };
  } else {
    // no domain (business): fall back to the category's own house lords + karakas,
    // scored with planet_scores that already exist — never borrow another domain
    const ps = strength?.planet_scores || {};
    const relevant = [
      ...def.houses.map((h) => lordOfHouse(chart, h)),
      ...def.karakas,
    ].filter((p) => p && ps[p] != null);
    if (relevant.length) {
      const uniq = [...new Set(relevant)];
      natal = { value: clamp01to100(Math.round(uniq.reduce((s, p) => s + ps[p], 0) / uniq.length)) };
    }
  }

  // dasha: is the running lord relevant to THIS category?
  const ps = strength?.planet_scores || {};
  const relevantSet = new Set([...def.houses.map((h) => lordOfHouse(chart, h)), ...def.karakas].filter(Boolean));
  const maha = strength?.current_mahadasha;
  const antar = strength?.current_antardasha;
  let dasha = null;
  if (maha) {
    const mahaRelevant = relevantSet.has(maha.planet);
    const antarRelevant = antar ? relevantSet.has(antar.planet) : false;
    // a relevant lord carries its own strength; an unrelated lord is neutral for
    // this area rather than negative — it is simply running someone else's chapter
    const mahaVal = mahaRelevant ? clamp01to100(ps[maha.planet] ?? maha.score ?? 50) : 45;
    const antarVal = antar ? (antarRelevant ? clamp01to100(ps[antar.planet] ?? antar.score ?? 50) : 45) : mahaVal;
    dasha = { value: Math.round(mahaVal * 0.6 + antarVal * 0.4) };
    if (mahaRelevant) supporting.push({ en: `${maha.planet} Mahadasha directly rules this area`, hi: `${PLANET_HI[maha.planet] || maha.planet} महादशा इस क्षेत्र से सीधे जुड़ी है` });
    if (antarRelevant && antar) supporting.push({ en: `${antar.planet} Antardasha touches this area`, hi: `${PLANET_HI[antar.planet] || antar.planet} अंतर्दशा इस क्षेत्र को स्पर्श करती है` });
  }

  const varga = vargaFactor(chart, [def.varga]);
  if (varga.value != null) {
    const st = varga.charts[0].status;
    const entry = { en: `${def.varga.toUpperCase()} reads ${st}`, hi: `${def.varga.toUpperCase()} की स्थिति ${st === 'favorable' ? 'अनुकूल' : st === 'challenging' ? 'चुनौतीपूर्ण' : 'मिश्रित'} है` };
    (varga.value >= 50 ? supporting : contradicting).push(entry);
  }

  // karaka maturity for this category only
  const karakaMat = maturity.planets.filter((p) => def.karakas.includes(p.planet));
  const maturityF = karakaMat.length
    ? { value: Math.round((karakaMat.reduce((s, p) => s + p.progress, 0) / karakaMat.length) * 100) }
    : null;

  const yogaF = strength?.yoga_score != null ? { value: clamp01to100(strength.yoga_score) } : null;

  if (natal && natal.value >= 60) supporting.push({ en: 'Natal strength supports this area', hi: 'जन्म कुंडली का बल इस क्षेत्र का समर्थन करता है' });
  if (natal && natal.value < 45) contradicting.push({ en: 'Natal strength for this area is limited', hi: 'इस क्षेत्र के लिए जन्म कुंडली का बल सीमित है' });
  if (transitF?.value != null && transitF.value < 45) contradicting.push({ en: 'Current transits are not supportive', hi: 'वर्तमान गोचर सहायक नहीं हैं' });

  const combined = combine({
    dashaActivation: dasha,
    natalStrength: natal,
    transitSupport: transitF,
    planetMaturity: maturityF,
    yogaActivation: yogaF,
    divisionalChartSupport: varga,
  });

  // Not enough to stand on: say so rather than invent a number.
  if (!combined || (natal == null && dasha == null)) {
    return {
      category: def.key,
      label: { en: def.en, hi: def.hi },
      available: false,
      status: 'INSUFFICIENT_DATA',
      reason: 'insufficient_category_evidence',
      message: pick(CFG.INSUFFICIENT.insufficient_category_evidence, lang),
    };
  }

  const confidence = assessConfidence({
    hasTime: true,
    varga,
    dasha,
    transit: transitF,
    supporting: supporting.length,
    contradicting: contradicting.length,
  });
  // business has no natal domain of its own — never claim HIGH confidence for it
  if (!def.strengthDomain && confidence.level === 'HIGH') {
    confidence.level = 'MEDIUM';
    confidence.reasons.push({
      en: 'Business is scored from its houses and karakas only — this chart set has no dedicated business strength domain.',
      hi: 'व्यवसाय का आकलन केवल उसके भावों और कारकों से किया गया है — इसके लिए अलग बल-क्षेत्र उपलब्ध नहीं है।',
    });
  }

  return {
    category: def.key,
    label: { en: def.en, hi: def.hi },
    available: true,
    score: combined.score,
    status: bandFor(combined.score),
    status_label: CFG.ACTIVATION_STATUS_LABELS[bandFor(combined.score)],
    confidence: confidence.level,
    confidence_label: CFG.CONFIDENCE_LABELS[confidence.level],
    supportingFactors: supporting,
    contradictingFactors: contradicting,
    evidence: {
      contributions: combined.contributions,
      usedWeight: combined.usedWeight,
      missingFactors: combined.missing,
      houses: def.houses,
      houseLords: def.houses.map((h) => ({ house: h, lord: lordOfHouse(chart, h) })),
      karakas: def.karakas,
      varga: varga.charts || null,
    },
  };
}

/**
 * @param {object} chart    kundli_profiles.calculated_data
 * @param {object} profile  { date_of_birth, time_of_birth, timezone_offset }
 * @param {object} opts     { lang='hi', admin=false, now=new Date() }
 */
function generateLifeActivation(chart, profile = {}, opts = {}) {
  const lang = opts.lang === 'en' ? 'en' : 'hi';
  const admin = opts.admin === true;
  const now = opts.now instanceof Date ? opts.now : new Date();

  try {
    if (!chart?.planets || !chart?.ascendant) return insufficient('missing_chart', lang);

    const ageRes = computeAge(profile, now);
    if (!ageRes.ok) return insufficient(ageRes.reason, lang);
    const age = ageRes.age;

    const strength = computeKundliStrength(chart);
    if (!strength) return insufficient('missing_chart', lang);

    const maturity = computeMaturity(age.decimalAge);

    const dasha = dashaFactor(strength);
    const transitF = transitFactor(chart, now);
    const natal = { value: clamp01to100(strength.overall_score) };
    const maturityF = { value: Math.round(maturity.maturityProgress * 100) };
    const yogaF = strength.yoga_score != null ? { value: clamp01to100(strength.yoga_score) } : null;
    // overall divisional view: the classical "big four" that are present
    const vargaF = vargaFactor(chart, ['d9', 'd10', 'd2', 'd1']);

    const combined = combine({
      dashaActivation: dasha,
      natalStrength: natal,
      transitSupport: transitF,
      planetMaturity: maturityF,
      yogaActivation: yogaF,
      divisionalChartSupport: vargaF,
    });
    if (!combined) return insufficient('calculation_failed', lang);

    const supportingFactors = [];
    const contradictingFactors = [];
    if (dasha.value != null && dasha.value >= 55) supportingFactors.push({ en: `${dasha.maha.planet} Mahadasha rates ${dasha.maha.score}/100 in this chart`, hi: `${PLANET_HI[dasha.maha.planet] || dasha.maha.planet} महादशा इस कुंडली में ${dasha.maha.score}/100 है` });
    if (dasha.value != null && dasha.value < 45) contradictingFactors.push({ en: `${dasha.maha.planet} Mahadasha is not strongly placed in this chart`, hi: `${PLANET_HI[dasha.maha.planet] || dasha.maha.planet} महादशा इस कुंडली में विशेष बलवान नहीं है` });
    if (transitF.notes) for (const n of transitF.notes) (transitF.value >= 50 ? supportingFactors : contradictingFactors).push(n);
    if (natal.value >= 60) supportingFactors.push({ en: `Overall natal strength is ${natal.value}/100`, hi: `समग्र जन्म-बल ${natal.value}/100 है` });
    if (natal.value < 45) contradictingFactors.push({ en: `Overall natal strength is ${natal.value}/100`, hi: `समग्र जन्म-बल ${natal.value}/100 है` });

    const confidence = assessConfidence({
      hasTime: true,
      varga: vargaF,
      dasha,
      transit: transitF,
      supporting: supportingFactors.length,
      contradicting: contradictingFactors.length,
    });

    const status = bandFor(combined.score);

    const categoryScores = CFG.CATEGORY_DEF.map((def) =>
      categoryActivation({ chart, strength, def, maturity, transitF, lang }));

    // active life areas = the categories actually standing out, never a fixed list
    const activeLifeAreas = categoryScores
      .filter((c) => c.available && c.score >= 65)
      .sort((a, b) => b.score - a.score)
      .map((c) => ({ category: c.category, label: c.label, score: c.score, status: c.status }));

    // active planets = running dasha lords + matured karakas of the active areas
    const activePlanets = [];
    if (dasha.maha) activePlanets.push({ planet: dasha.maha.planet, planet_hi: PLANET_HI[dasha.maha.planet], role: { en: 'Mahadasha lord', hi: 'महादशा स्वामी' }, score: dasha.maha.score, until: dasha.maha.end });
    if (dasha.antar) activePlanets.push({ planet: dasha.antar.planet, planet_hi: PLANET_HI[dasha.antar.planet], role: { en: 'Antardasha lord', hi: 'अंतर्दशा स्वामी' }, score: dasha.antar.score, until: dasha.antar.end });

    // upcoming periods: ONLY real dates already in the chart's dasha tree, plus the
    // next real maturity milestone. Nothing is projected or invented.
    const upcomingPeriods = [];
    if (Array.isArray(chart.dasha)) {
      const curIdx = chart.dasha.findIndex((d) => d.is_current);
      const next = curIdx > -1 ? chart.dasha[curIdx + 1] : null;
      if (next) upcomingPeriods.push({ type: 'mahadasha', planet: next.lord, planet_hi: PLANET_HI[next.lord], start: next.start, end: next.end });
      const cur = curIdx > -1 ? chart.dasha[curIdx] : null;
      const nextAntar = cur?.antardasha?.[(cur.antardasha || []).findIndex((a) => a.is_current) + 1];
      if (nextAntar) upcomingPeriods.push({ type: 'antardasha', planet: nextAntar.lord, planet_hi: PLANET_HI[nextAntar.lord], start: nextAntar.start, end: nextAntar.end });
    }
    if (maturity.nextMilestone) {
      upcomingPeriods.push({
        type: 'maturity',
        planet: maturity.nextMilestone.planet,
        planet_hi: maturity.nextMilestone.planet_hi,
        maturityAge: maturity.nextMilestone.maturityAge,
        yearsRemaining: maturity.nextMilestone.yearsRemaining,
      });
    }

    const result = {
      available: true,
      rule_version: CFG.RULE_VERSION,
      calculated_at: now.toISOString(),
      age: {
        completedYears: age.completedYears,
        months: age.months,
        days: age.days,
        runningYear: age.runningYear,
        decimalAge: age.decimalAge,
      },
      lifeStage: (() => {
        const s = CFG.LIFE_STAGES.find((st) => age.decimalAge >= st.min) || CFG.LIFE_STAGES[CFG.LIFE_STAGES.length - 1];
        return { key: s.key, label: { en: s.en, hi: s.hi } };
      })(),
      maturity: {
        planets: maturity.planets,
        maturedPlanets: maturity.maturedPlanets,
        developingPlanets: maturity.developingPlanets,
        nextMilestone: maturity.nextMilestone,
      },
      overallActivation: {
        score: combined.score,
        status,
        status_label: CFG.ACTIVATION_STATUS_LABELS[status],
        // adjective form for the sentence frame — the noun label reads
        // "सक्रियता मध्यम सक्रियता है" when dropped into a sentence
        status_short: CFG.ACTIVATION_STATUS_SHORT[status],
        confidence: confidence.level,
        confidence_label: CFG.CONFIDENCE_LABELS[confidence.level],
      },
      activePlanets,
      activeLifeAreas,
      categoryScores,
      upcomingPeriods,
      // the two sentences that must never drift into "your chart is inactive"
      copy: {
        chartAlwaysActive: CFG.ACTIVATION_COPY.chartAlwaysActive,
        maturityMilestone: CFG.ACTIVATION_COPY.maturityMilestone,
      },
      confidenceReasons: confidence.reasons,
    };

    if (admin) {
      result.evidence = {
        dashaActivation: combined.contributions.dashaActivation ?? null,
        natalStrength: combined.contributions.natalStrength ?? null,
        transitSupport: combined.contributions.transitSupport ?? null,
        planetMaturity: combined.contributions.planetMaturity ?? null,
        yogaActivation: combined.contributions.yogaActivation ?? null,
        divisionalChartSupport: combined.contributions.divisionalChartSupport ?? null,
        factorValues: {
          dashaActivation: dasha.value, natalStrength: natal.value, transitSupport: transitF.value,
          planetMaturity: maturityF.value, yogaActivation: yogaF ? yogaF.value : null,
          divisionalChartSupport: vargaF.value,
        },
        weights: CFG.FACTOR_WEIGHTS,
        usedWeight: combined.usedWeight,
        missingFactors: combined.missing,
        totalScore: combined.score,
        activeMahadasha: dasha.maha || null,
        activeAntardasha: dasha.antar || null,
        relevantPlanets: activePlanets.map((p) => p.planet),
        relevantHouses: [...new Set(CFG.CATEGORY_DEF.flatMap((d) => d.houses))].sort((a, b) => a - b),
        planetHouses: Object.keys(chart.planets || {}).reduce((acc, p) => { acc[p] = houseOf(chart, p); return acc; }, {}),
        supportingFactors,
        contradictingFactors,
        confidenceReason: confidence.reasons,
        vargaCharts: vargaF.charts || [],
        strengthSource: 'helpers/kundli-strength.js (custom proxy — NOT classical Shadbala)',
        transitSource: 'helpers/gochar.js calculateTransitSummary (computed fresh; chart.gochar is a stale snapshot)',
      };
    } else {
      result.supportingFactors = supportingFactors;
      result.contradictingFactors = contradictingFactors;
    }

    return result;
  } catch (err) {
    return { ...insufficient('calculation_failed', lang), error: admin ? String(err && err.message) : undefined };
  }
}

module.exports = { generateLifeActivation };
