'use strict';
/**
 * Evidence builder (Phase 3).
 *
 * Turns the selectively-loaded Kundli data + the custom strength proxy + the
 * dated-transit result into the THREE scored evidence groups the state engine
 * consumes: natal, relevant divisional-chart, and current timing. Every group
 * score is in [-100, 100]; each carries individual `layers` so the state engine
 * can apply conflict + highly-challenging-safety rules on independent signals.
 *
 * The custom strength proxy (kundli-strength.js) is used explicitly — it is NOT
 * classical Shadbala, and that distinction is surfaced by the completeness
 * evaluator's enhancer block.
 */

// divisional-chart overall_status → signed score
const STATUS_SIGNED = {
  very_favorable: 80, favorable: 55, supportive: 45, neutral: 0,
  mixed: -10, challenging: -50, caution: -55,
};
// dated-transit classification → signed
const TRANSIT_SIGNED = { supportive: 40, mixed: 0, caution: -40 };

// category → strength life-domain key (falls back to overall when absent)
const CATEGORY_DOMAIN = {
  career: 'career', business: 'career', money: 'wealth', marriage: 'marriage',
  family: 'family', education: 'children', health: 'health', property: 'wealth',
  // personality + timing use the overall chart strength
};

const { planetName, statusWord, ORDINAL_HI, ordinalEn } = require('./vocab');

const clamp = (v) => Math.max(-100, Math.min(100, Math.round(v)));
const toSigned = (score0to100) => clamp((score0to100 - 50) * 2);

// ── Natal group ──────────────────────────────────────────────────────────────
function natalEvidence({ requirement, loaded, strength, category }) {
  if (!strength || !strength.planet_scores) return { score: 0, present: false, layers: [] };
  const layers = [];
  const ps = strength.planet_scores;

  // relevant house-lords
  for (const [h, info] of Object.entries(loaded.selected.house_lords || {})) {
    if (info && info.lord && ps[info.lord] != null) {
      layers.push({
        key: `lord${h}:${info.lord}`, score: toSigned(ps[info.lord]),
        label: `${ordinalEn(Number(h))}-lord ${info.lord}`,
        label_hi: `${ORDINAL_HI(Number(h))} भाव के स्वामी ${planetName(info.lord, 'hi')}`,
      });
    }
  }
  // relevant planets
  for (const p of requirement.planets || []) {
    if (ps[p] != null) layers.push({ key: `planet:${p}`, score: toSigned(ps[p]), label: p, label_hi: planetName(p, 'hi') });
  }
  // life-domain (or overall) anchor
  const domainKey = CATEGORY_DOMAIN[category];
  const domain = domainKey && strength.life_domains ? strength.life_domains[domainKey] : null;
  if (domain) layers.push({ key: `domain:${domainKey}`, score: toSigned(domain.score), label: domain.en, label_hi: domain.hi || domain.en, weight: 1.5 });
  else if (strength.overall_score != null) layers.push({ key: 'overall', score: toSigned(strength.overall_score), label: 'overall chart', label_hi: 'समग्र कुंडली', weight: 1.2 });

  if (!layers.length) return { score: 0, present: false, layers: [] };
  const wsum = layers.reduce((s, l) => s + (l.weight || 1), 0);
  const score = clamp(layers.reduce((s, l) => s + l.score * (l.weight || 1), 0) / wsum);
  return { score, present: true, layers };
}

// ── Divisional-chart group ───────────────────────────────────────────────────
function dchartEvidence({ loaded }) {
  const avail = loaded.chartLoad.available || {};
  const layers = [];
  for (const [slug, info] of Object.entries(avail)) {
    const s = STATUS_SIGNED[info.status];
    if (s != null) layers.push({
      key: `chart:${slug}`, score: s,
      label: `${slug.toUpperCase()} (${statusWord(info.status, 'en')})`,
      label_hi: `${slug.toUpperCase()} (${statusWord(info.status, 'hi')})`,
      weight: slug === 'd1' ? 1 : 1.3,
    });
  }
  if (!layers.length) return { score: 0, present: false, layers: [] };
  const wsum = layers.reduce((s, l) => s + (l.weight || 1), 0);
  const score = clamp(layers.reduce((s, l) => s + l.score * (l.weight || 1), 0) / wsum);
  return { score, present: true, layers };
}

// ── Current-timing group (Dasha + major transits) ────────────────────────────
function timingEvidence({ loaded, strength, transit }) {
  const layers = [];
  if (strength && strength.current_mahadasha) {
    layers.push({ key: 'dasha:maha', score: toSigned(strength.current_mahadasha.score), label: `${strength.current_mahadasha.planet} Mahadasha`, label_hi: `${planetName(strength.current_mahadasha.planet, 'hi')} महादशा`, weight: 1.4 });
  }
  if (strength && strength.current_antardasha) {
    layers.push({ key: 'dasha:antar', score: toSigned(strength.current_antardasha.score), label: `${strength.current_antardasha.planet} Antardasha`, label_hi: `${planetName(strength.current_antardasha.planet, 'hi')} अंतर्दशा`, weight: 1 });
  }
  if (transit && transit.available) {
    const s = TRANSIT_SIGNED[transit.summary.overall];
    if (s != null) layers.push({ key: 'transit:dated', score: s, label: `major transits (${statusWord(transit.summary.overall, 'en')})`, label_hi: `प्रमुख गोचर (${statusWord(transit.summary.overall, 'hi')})`, weight: 1.2 });
  }
  if (!layers.length) return { score: 0, present: false, layers: [] };
  const wsum = layers.reduce((s, l) => s + (l.weight || 1), 0);
  const score = clamp(layers.reduce((s, l) => s + l.score * (l.weight || 1), 0) / wsum);
  return { score, present: true, layers };
}

function buildEvidence({ requirement, loaded, strength, transit, category }) {
  return {
    natal:  natalEvidence({ requirement, loaded, strength, category }),
    dchart: dchartEvidence({ loaded }),
    timing: timingEvidence({ loaded, strength, transit }),
  };
}

module.exports = { buildEvidence, natalEvidence, dchartEvidence, timingEvidence, STATUS_SIGNED, TRANSIT_SIGNED, toSigned };
