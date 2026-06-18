'use strict';
/**
 * LAYER 3 — Life Area Aggregator   |   LAYER 4 — Conflict Resolver
 * Language-aware: pulls each rule's wording from templates/<lang>.js and uses the
 * chosen lexicon's connectors. No runtime translation.
 */
const { getLexicon, scoreLabel } = require('./lexicon');
const { getTemplates } = require('./templates');
const { RULES } = require('./rules');

const TONE_WEIGHT = { strong: 5, positive: 4.2, mixed: 3, neutral: 3, caution: 2.2, challenging: 1.8 };
const POS = new Set(['strong', 'positive']);
const NEG = new Set(['caution', 'challenging']);

const resolve = (v, ctx, LEX) => (typeof v === 'function' ? v(ctx, LEX) : (v || ''));
const stripEnd = (s) => (s || '').replace(/[।\.\s]+$/u, '');
const statusKey = (score) => (score >= 3.5 ? 'strong' : score > 2.5 ? 'mid' : 'care');

function aggregate(ctx, lang = 'hi') {
  const LEX = getLexicon(lang);
  const TPL = getTemplates(lang);

  const matched = [];
  for (const rule of RULES) {
    let ok = false;
    try { ok = rule.test(ctx); } catch (_) { ok = false; }
    if (!ok) continue;
    const tpl = TPL[rule.id] || {};
    matched.push({
      id: rule.id,
      area: rule.area,
      tone: rule.tone,
      priority: rule.priority || 1,
      text: resolve(tpl.text, ctx, LEX),
      advice: resolve(tpl.advice, ctx, LEX) || null,
      caution: resolve(tpl.caution, ctx, LEX) || null,
    });
  }

  const byArea = {};
  for (const m of matched) (byArea[m.area] = byArea[m.area] || []).push(m);

  const areas = {};
  for (const [area, rules] of Object.entries(byArea)) {
    rules.sort((a, b) => b.priority - a.priority);

    const scored = rules.filter((r) => r.tone !== 'neutral');
    let score = 3;
    if (scored.length) {
      let wsum = 0, psum = 0;
      for (const r of scored) { const w = TONE_WEIGHT[r.tone] ?? 3; wsum += w * r.priority; psum += r.priority; }
      score = wsum / psum;
    }

    const positives = rules.filter((r) => POS.has(r.tone));
    const cautions = rules.filter((r) => NEG.has(r.tone));

    areas[area] = {
      area,
      score,
      statusKey: statusKey(score),
      label: scoreLabel(LEX, score),
      merged: resolveConflict(rules, positives, cautions, LEX),
      lines: rules.map((r) => r.text).filter(Boolean),
      advice: [...new Set(rules.map((r) => r.advice).filter(Boolean))],
      caution: [...new Set(rules.map((r) => r.caution).filter(Boolean))],
      rule_ids: rules.map((r) => r.id),
    };
  }
  return areas;
}

// LAYER 4 — merge a positive and a cautionary line into one realistic sentence
function resolveConflict(rules, positives, cautions, LEX) {
  const but = LEX.PHRASES.but || ', ';
  if (positives.length && cautions.length) return `${stripEnd(positives[0].text)}${but}${cautions[0].text}`;
  if (positives.length) return positives[0].text;
  if (cautions.length) return cautions[0].text;
  return rules[0]?.text || '';
}

module.exports = { aggregate, resolveConflict };
