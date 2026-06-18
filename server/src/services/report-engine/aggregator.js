'use strict';
/**
 * LAYER 3 — Life Area Aggregator
 * LAYER 4 — Conflict Resolver
 *
 * Runs every rule against the context, groups matches by life area, computes a
 * hidden 1-5 score per area, and merges positive + cautionary signals into one
 * realistic, balanced sentence (e.g. "growth की संभावना है, लेकिन जल्दबाज़ी से बचें").
 */
const L = require('./lexicon');
const { RULES } = require('./rules');

const POS = new Set(['strong', 'positive']);
const NEG = new Set(['caution', 'challenging']);

function asText(rule, ctx) {
  const v = rule.hi;
  const text = typeof v === 'function' ? v(ctx) : v;
  return (text || '').trim();
}

function stripEnd(s) {
  return (s || '').replace(/[।\.\s]+$/u, '');
}

// LAYER 3 — evaluate + group + score
function aggregate(ctx) {
  const matched = [];
  for (const rule of RULES) {
    let ok = false;
    try { ok = rule.test(ctx); } catch (_) { ok = false; }
    if (!ok) continue;
    matched.push({
      id: rule.id,
      area: rule.area,
      tone: rule.tone,
      priority: rule.priority || 1,
      text: asText(rule, ctx),
      advice: typeof rule.advice === 'function' ? rule.advice(ctx) : rule.advice || null,
      caution: typeof rule.caution === 'function' ? rule.caution(ctx) : rule.caution || null,
    });
  }

  const byArea = {};
  for (const m of matched) {
    (byArea[m.area] = byArea[m.area] || []).push(m);
  }

  const areas = {};
  for (const [area, rules] of Object.entries(byArea)) {
    rules.sort((a, b) => b.priority - a.priority);

    // Hidden score: average tone weight over signal rules (ignore the neutral
    // base anchors), weighted by priority. Defaults to 3 (balanced) if no signal.
    const scored = rules.filter((r) => r.tone !== 'neutral');
    let score = 3;
    if (scored.length) {
      let wsum = 0, psum = 0;
      for (const r of scored) {
        const w = L.TONE_WEIGHT[r.tone] ?? 3;
        wsum += w * r.priority;
        psum += r.priority;
      }
      score = wsum / psum;
    }

    const positives = rules.filter((r) => POS.has(r.tone));
    const cautions = rules.filter((r) => NEG.has(r.tone));

    areas[area] = {
      area,
      score,                                   // internal only
      label: L.scoreLabel(score),              // what the user sees
      merged: resolveConflict(rules, positives, cautions),
      lines: rules.map((r) => r.text).filter(Boolean),
      advice: [...new Set(rules.map((r) => r.advice).filter(Boolean))],
      caution: [...new Set(rules.map((r) => r.caution).filter(Boolean))],
      rule_ids: rules.map((r) => r.id),        // admin/debug only
    };
  }
  return areas;
}

// LAYER 4 — merge good + challenging into one realistic line
function resolveConflict(rules, positives, cautions) {
  if (positives.length && cautions.length) {
    return `${stripEnd(positives[0].text)}, लेकिन ${cautions[0].text}`;
  }
  if (positives.length) return positives[0].text;
  if (cautions.length) return cautions[0].text;
  // only neutral/mixed → lead with the highest-priority (base) line
  return rules[0]?.text || '';
}

module.exports = { aggregate, resolveConflict };
