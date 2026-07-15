'use strict';
/**
 * Evidence normalization — one entity, one voice.
 *
 * The evidence builder emits a layer per ROLE, so a planet that rules a relevant
 * house AND is that domain's karaka arrives twice. Rendered naively that becomes
 * "11th lord Mars and Mars", and — worse — Mars gets counted twice in the group
 * average, quietly doubling its influence on the verdict.
 *
 * This module merges layers by entity while PRESERVING each distinct role, so the
 * humanizer can say the true and more useful thing: Mars supports this area in two
 * ways, as 11th lord and as a natural karaka. That is a stronger claim than either
 * layer alone, and it is now stated once.
 *
 * Ranking follows the Part 10 hierarchy: a relevant house lord outranks a karaka,
 * which outranks a divisional chart, which outranks dasha, transit, yoga, and
 * finally secondary planets. Ties break on absolute score.
 *
 * Keys and structure only — no user-facing text is produced here.
 */

// Importance hierarchy (lower = more primary). Mirrors the approved order:
// house/lord → karaka → varga → dasha → transit → yoga → secondary.
const TIER = Object.freeze({
  house_lord: 1,
  karaka: 2,
  domain_anchor: 2,
  varga: 3,
  dasha: 4,
  transit: 5,
  yoga: 6,
  overall: 6,
  secondary: 7,
});

const PRIMARY_TIERS = new Set([TIER.house_lord, TIER.karaka, TIER.domain_anchor]);

function tierOf(role) {
  return TIER[role && role.kind] != null ? TIER[role.kind] : TIER.secondary;
}

/**
 * Identity used for merging. Two layers describing the same planet merge; a
 * planet and a divisional chart never do.
 */
function entityIdOf(layer) {
  if (layer.entity_id) return layer.entity_id;
  if (layer.planet) return `planet:${layer.planet}`;
  if (layer.chart) return `chart:${layer.chart}`;
  return `key:${layer.key}`;
}

/**
 * Roles carried by an input, whether it is a RAW layer (`role`, singular) or an
 * already-merged factor (`roles`, plural).
 *
 * This function is why normalization is idempotent, and it has to be: evidence is
 * normalized once per group (so each group's score counts an entity once) and
 * again across groups (so a planet that is both a house lord and a dasha signal is
 * stated once). Without this, the second pass would find no `role` on a merged
 * factor, quietly re-tag every factor as `secondary`, and the verdict resolver —
 * which decides by rank — would see no primary evidence at all and never move a
 * verdict. The failure is silent: answers still render, they just stop being
 * ranked.
 */
function rolesOf(input) {
  if (Array.isArray(input.roles) && input.roles.length) return input.roles;
  return [input.role || { kind: 'secondary' }];
}

const sameRole = (a, b) => a.kind === b.kind && a.house === b.house && a.chart === b.chart && a.level === b.level;

/**
 * Merge duplicate entities, union their roles, and rank the result.
 *
 * @param {Array<object>} layers  evidence layers; structured ones carry
 *        { planet|chart, role:{kind,...}, score, weight }
 * @param {object} [opts]
 * @param {number} [opts.maxSupports=3]  cap on user-facing supporting factors
 * @param {number} [opts.maxBlockers=2]  cap on user-facing blocking factors
 * @returns {{ factors, supports, blockers, merged_count, dropped_duplicates }}
 */
function normalizeAnswerEvidence(layers, opts = {}) {
  const maxSupports = opts.maxSupports != null ? opts.maxSupports : 3;
  const maxBlockers = opts.maxBlockers != null ? opts.maxBlockers : 2;

  const byEntity = new Map();
  let duplicates = 0;

  for (const layer of layers || []) {
    if (!layer) continue;
    const id = entityIdOf(layer);
    const roles = rolesOf(layer);
    const existing = byEntity.get(id);

    if (!existing) {
      byEntity.set(id, {
        entity_id: id,
        kind: layer.planet ? 'planet' : layer.chart ? 'chart' : (layer.kind || 'other'),
        planet: layer.planet || null,
        chart: layer.chart || null,
        roles: [...roles],
        score: layer.score,
        weight: layer.weight || 1,
        tier: Math.min(...roles.map(tierOf)),
        keys: [...(layer.keys || [layer.key])],
      });
      continue;
    }

    // Same entity seen again: keep any genuinely new role, and let the strongest
    // role decide the entity's tier and weight. The score is NOT summed — both
    // inputs describe the same planet's condition, so summing would be
    // double-counting, which is exactly the bug this module exists to remove.
    duplicates += 1;
    for (const role of roles) {
      if (!existing.roles.some((r) => sameRole(r, role))) existing.roles.push(role);
    }
    existing.tier = Math.min(existing.tier, ...roles.map(tierOf));
    existing.weight = Math.max(existing.weight, layer.weight || 1);
    existing.keys.push(...(layer.keys || [layer.key]));
    // Prefer the more extreme reading when two roles disagree (defensive: for
    // strength-derived layers they agree by construction).
    if (Math.abs(layer.score) > Math.abs(existing.score)) existing.score = layer.score;
  }

  const factors = [...byEntity.values()].map((f) => ({
    ...f,
    multi_role: f.roles.length > 1,
    primary: PRIMARY_TIERS.has(f.tier),
  }));

  // Rank: primary evidence first, then by how strongly it speaks.
  const rank = (a, b) => (a.tier - b.tier) || (Math.abs(b.score) - Math.abs(a.score));

  const supports = factors.filter((f) => f.score > 0).sort(rank).slice(0, maxSupports);
  const blockers = factors.filter((f) => f.score < 0).sort(rank).slice(0, maxBlockers);

  return {
    factors: factors.sort(rank),
    supports,
    blockers,
    merged_count: factors.length,
    dropped_duplicates: duplicates,
  };
}

/**
 * Group-score recomputation over merged factors — each entity contributes once.
 * Returns null when nothing is present so callers can keep `present:false`.
 */
function weightedScore(factors) {
  if (!factors || !factors.length) return null;
  const wsum = factors.reduce((s, f) => s + (f.weight || 1), 0) || 1;
  const raw = factors.reduce((s, f) => s + f.score * (f.weight || 1), 0) / wsum;
  return Math.max(-100, Math.min(100, Math.round(raw)));
}

module.exports = { normalizeAnswerEvidence, weightedScore, TIER, PRIMARY_TIERS, entityIdOf, rolesOf };
