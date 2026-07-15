'use strict';
/**
 * Planet → practical meaning, per life area.
 *
 * "Venus is weak" tells a reader nothing they can act on. What Venus governs
 * depends entirely on what was asked: in finance it is spending, comfort and
 * lifestyle cost; in marriage it is harmony, attraction and expectation; in
 * business it is branding, partnership and customer appeal. The planet is the
 * same, the meaning is not — so the mapping must be keyed by (planet, domain),
 * never by planet alone.
 *
 * This module resolves the KEY of the theme to load and the KEY of the frame that
 * puts it in the right polarity. Every string comes from answer_shared_blocks:
 *
 *   meaning.venus.finance        → "spending, comfort and lifestyle costs"   (theme)
 *   frag.factor.weak             → "{{planet}} is comparatively weak here, so
 *                                   {{theme}} need conscious discipline."     (frame)
 *
 * Composed, that is the sentence the brief asks for — and the same theme block is
 * reused by the strong frame, so the two readings can never drift apart.
 */

const { PRIMARY_TIERS } = require('./evidence-normalizer');

// Strength bands over the signed [-100,100] factor score. `moderate` exists so a
// mildly-placed planet is not oversold as a strength nor written off as a problem.
const STRONG_AT = 25;
const WEAK_AT = -25;

function polarityOf(score) {
  if (score >= STRONG_AT) return 'strong';
  if (score <= WEAK_AT) return 'weak';
  return 'moderate';
}

/**
 * Theme key chain for a planet in a life area, most specific first.
 * Falls back to the planet's general significations so a house lord that is not
 * one of the domain's karakas — which can be any of the nine — still renders a
 * real meaning instead of a bare name.
 */
function planetMeaningKeys(planet, domain) {
  const p = String(planet || '').toLowerCase();
  if (!p) return [];
  const keys = [];
  if (domain) keys.push(`meaning.${p}.${domain}`);
  keys.push(`meaning.${p}.general`);
  return keys;
}

/**
 * Frame key for how a factor should be phrased.
 * A planet filling two roles gets its own frame: that is a stronger, more specific
 * claim ("supports this both as 11th lord and as karaka") and is the sentence that
 * replaces the duplicate "Mars and Mars" the normalizer merged away.
 */
function factorFrameKey(factor) {
  const polarity = polarityOf(factor.score);
  if (factor.multi_role) return `frag.factor.multi_role.${polarity}`;
  return `frag.factor.${polarity}`;
}

/** Block key naming a single role, e.g. "as the 11th lord" / "as karaka". */
function roleKeyOf(role) {
  if (!role) return null;
  if (role.kind === 'house_lord') return 'frag.role.house_lord';
  if (role.kind === 'karaka') return 'frag.role.karaka';
  if (role.kind === 'domain_anchor') return 'frag.role.domain_anchor';
  if (role.kind === 'overall') return 'frag.role.overall';
  if (role.kind === 'varga') return 'frag.role.varga';
  if (role.kind === 'dasha') return role.level === 'antar' ? 'frag.role.antar' : 'frag.role.maha';
  if (role.kind === 'transit') return 'frag.role.transit';
  return null;
}

/**
 * Everything the composer needs to render one merged factor, as keys + facts.
 * No text — the composer resolves these against the DB and interpolates.
 *
 * @param {object} factor  a merged factor from normalizeAnswerEvidence
 * @param {string} domain  resolved life area
 * @returns {{ planet, polarity, primary, multi_role, meaning_keys, frame_key, role_keys, houses }}
 */
function describeFactor(factor, domain) {
  return {
    planet: factor.planet || null,
    chart: factor.chart || null,
    polarity: polarityOf(factor.score),
    primary: PRIMARY_TIERS.has(factor.tier),
    multi_role: !!factor.multi_role,
    meaning_keys: factor.planet ? planetMeaningKeys(factor.planet, domain) : [],
    frame_key: factorFrameKey(factor),
    role_keys: (factor.roles || []).map(roleKeyOf).filter(Boolean),
    houses: (factor.roles || []).filter((r) => r.kind === 'house_lord').map((r) => r.house),
  };
}

module.exports = {
  polarityOf, planetMeaningKeys, factorFrameKey, roleKeyOf, describeFactor,
  STRONG_AT, WEAK_AT,
};
