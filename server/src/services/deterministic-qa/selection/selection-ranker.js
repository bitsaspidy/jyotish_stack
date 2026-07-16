'use strict';
/**
 * Deterministic option ranker.
 *
 * Generic over any option taxonomy — education fields today, career fields or
 * business sectors tomorrow. An option declares which planets do its work, which
 * houses carry it, and which Varga confirms it; this scores every option against
 * one chart and ranks them.
 *
 * The scoring is a weighted sum of evidence the engine already computes. It
 * invents no astrology: planet strength comes from the strength proxy, house-lord
 * roles and Varga status come from the normalized evidence, dasha activation from
 * the timing group. What this file adds is only the arithmetic of comparison.
 *
 * Scores never reach a user. They exist to ORDER options and to pick a fit label;
 * the reader gets the order and the reason, which is the part they can act on.
 */

const { polarityOf } = require('../planet-meaning');

// ── Weights ─────────────────────────────────────────────────────────────────
// Deliberately flat and few. A ranker with twenty tuned coefficients is not more
// accurate, it is only harder to explain — and every one of these has to be
// defensible to an astrologer reading the trace.
const W = Object.freeze({
  karaka: 1.0,        // per-planet strength × the option's declared weight
  house_lord: 0.6,    // a relevant house lord that is also this option's planet
  varga: 0.8,         // the option's confirming Varga (D24 for education)
  dasha: 0.5,         // the running period activating one of the option's planets
  blocker: 1.2,       // penalty when a planet the option CANNOT work without is weak
});

// An option cannot be recommended when a planet it depends on is this weak.
const BLOCKER_AT = -25;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Score one option against the chart.
 * @returns {{score, contributions, blocked, blockedBy}}  contributions are for the
 *          admin trace — they are the audit trail for why an option ranked where it did.
 */
function scoreOption(option, ctx) {
  const { planetScore, houseLordPlanets, vargaScore, dashaPlanets } = ctx;
  const contributions = [];
  let score = 0;

  // 1. The planets that do this option's work.
  for (const [planet, weight] of Object.entries(option.planets || {})) {
    const s = planetScore(planet);
    if (s == null) continue;
    const delta = (s / 100) * weight * W.karaka;
    score += delta;
    contributions.push({ kind: 'karaka', planet, weight, planet_score: s, delta: round(delta) });

    // 2. That planet also ruling a relevant education house is real corroboration,
    //    not a second copy of the same fact: ownership is a different claim from
    //    natural signification.
    const houses = (houseLordPlanets[planet] || []).filter((h) => (option.houses || []).includes(h));
    if (houses.length) {
      const d = (s / 100) * W.house_lord * houses.length;
      score += d;
      contributions.push({ kind: 'house_lord', planet, houses, delta: round(d) });
    }
  }

  // 3. The Varga that confirms this kind of study.
  for (const chart of option.vargas || []) {
    const v = vargaScore(chart);
    if (v == null) continue;
    const d = (v / 100) * W.varga;
    score += d;
    contributions.push({ kind: 'varga', chart, chart_score: v, delta: round(d) });
  }

  // 4. Is the period currently switching this option's planets on?
  for (const [level, planet] of Object.entries(dashaPlanets || {})) {
    if (!planet || !(option.planets || {})[planet]) continue;
    const s = planetScore(planet);
    if (s == null) continue;
    const d = (s / 100) * W.dasha * (level === 'maha' ? 1 : 0.6);
    score += d;
    contributions.push({ kind: 'dasha', level, planet, delta: round(d) });
  }

  // 5. A weak planet the option cannot do without. Not a tiebreak — a veto with a
  //    price: the option stays visible as "conditional" rather than vanishing,
  //    because a reader is entitled to know it was considered and why it lost.
  let blockedBy = null;
  for (const planet of option.blockers || []) {
    const s = planetScore(planet);
    if (s != null && s <= BLOCKER_AT) {
      const d = (Math.abs(s) / 100) * W.blocker;
      score -= d;
      blockedBy = planet;
      contributions.push({ kind: 'blocker', planet, planet_score: s, delta: round(-d) });
    }
  }

  return { score: round(score), contributions, blocked: !!blockedBy, blockedBy };
}

const round = (n) => Math.round(n * 1000) / 1000;

/**
 * Build the lookup context once, so every option is scored against exactly the
 * same reading of the chart.
 */
function buildContext({ strength, factors, dasha }) {
  const ps = (strength && strength.planet_scores) || {};

  // Strength proxy is 0..100; the engine's signed space is -100..100. Convert once
  // here so weights read naturally (a 50/100 planet contributes nothing, not half).
  const planetScore = (p) => (ps[p] == null ? null : clamp((ps[p] - 50) * 2, -100, 100));

  const houseLordPlanets = {};
  for (const f of factors || []) {
    if (!f.planet) continue;
    for (const role of f.roles || []) {
      if (role.kind !== 'house_lord') continue;
      (houseLordPlanets[f.planet] ||= []).push(role.house);
    }
  }

  const vargaByChart = {};
  for (const f of factors || []) if (f.chart) vargaByChart[f.chart] = f.score;
  const vargaScore = (c) => (vargaByChart[c] == null ? null : vargaByChart[c]);

  const dashaPlanets = {
    maha: dasha && dasha.maha ? (dasha.maha.lord || dasha.maha.planet || null) : null,
    antar: dasha && dasha.antar ? (dasha.antar.lord || dasha.antar.planet || null) : null,
  };

  return { planetScore, houseLordPlanets, vargaScore, dashaPlanets };
}

// Fit label by rank + score. Rank alone is not enough: if every option scores
// poorly, the top one is still not a "best fit" — it is merely the least bad, and
// saying otherwise would manufacture a recommendation the chart does not support.
function fitLevel(rank, score, blocked) {
  if (blocked) return 'conditional';
  if (score <= 0) return 'lower_fit';
  if (rank === 0 && score >= 0.8) return 'best_fit';
  if (rank === 0) return 'strong';           // top of a weak field
  if (rank <= 2 && score >= 0.5) return 'strong';
  if (score >= 0.3) return 'supportive';
  return 'conditional';
}

/**
 * Rank a taxonomy against one chart.
 *
 * @param {Array}  options   taxonomy entries ({ key, planets, houses, vargas, blockers })
 * @param {object} args      { strength, factors, dasha }
 * @param {object} [opts]    { top = 3, secondary = 2 }
 * @returns {{ ranked, primary, secondary, lower, discarded, context }}
 */
function rankOptions(options, args, opts = {}) {
  const top = opts.top != null ? opts.top : 3;
  const secondaryCount = opts.secondary != null ? opts.secondary : 2;
  const ctx = buildContext(args);

  const scored = (options || []).map((o) => {
    const r = scoreOption(o, ctx);
    return { key: o.key, option: o, ...r };
  });

  // Ties are broken by key so the same chart always produces the same order —
  // reproducibility is the whole promise of a deterministic engine.
  scored.sort((a, b) => (b.score - a.score) || a.key.localeCompare(b.key));

  const ranked = scored.map((s, i) => ({ ...s, rank: i, fit: fitLevel(i, s.score, s.blocked) }));

  return {
    ranked,
    primary: ranked.slice(0, top),
    secondary: ranked.slice(top, top + secondaryCount),
    // Options that actively do not suit — worth naming, because "not this" is
    // useful guidance and stops a reader assuming an unlisted field is fine.
    lower: ranked.filter((r) => r.fit === 'lower_fit').slice(-2),
    discarded: ranked.slice(top + secondaryCount).map((r) => ({
      key: r.key, score: r.score, fit: r.fit, blocked_by: r.blockedBy,
    })),
    context: { blocker_at: BLOCKER_AT, weights: W },
  };
}

module.exports = { rankOptions, scoreOption, buildContext, fitLevel, W, BLOCKER_AT, polarityOf };
