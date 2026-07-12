'use strict';
/**
 * Selective divisional-chart loader (Phase 3, component 4).
 *
 * Loads ONLY the divisional charts a question requires — never the full varga
 * matrix. Enforces the owner's D3/D11 rule:
 *   - D3 (siblings) and D11 (gains) are NOT trusted charts for this engine.
 *   - When requested, they fall back to the D1 3rd / 11th house respectively.
 *   - A fallback is flagged internally (is_d1_fallback, requested vs actual),
 *     NEVER relabelled as D3/D11, and carries a limitation block key + a
 *     confidence penalty so the answer layer can note it and reduce confidence.
 *   - An unsupported chart that is NOT a defined fallback is reported as missing,
 *     never fabricated.
 */

const cfg = require('../../config/deterministic-qa.config');

const SUPPORTED = new Set(cfg.SUPPORTED_CHARTS);

/**
 * @param chart the natal chart object (chart.varga_charts / chart.varga_analysis)
 * @param requestedCharts array like ['d1','d9']
 * @returns {
 *   available: { d1:{ chart, analysis, status }, ... },
 *   fallbacks: [ { requested:'d3', actual:'d1', house:3, limitation_block, confidence_penalty } ],
 *   missing:   [ 'dX', ... ],
 *   requested: [...]
 * }
 */
function loadCharts(chart, requestedCharts = []) {
  const out = { available: {}, fallbacks: [], missing: [], requested: [...requestedCharts] };
  const varga = chart && chart.varga_charts ? chart.varga_charts : {};
  const analysis = chart && chart.varga_analysis ? chart.varga_analysis : {};

  for (const slug of requestedCharts) {
    if (SUPPORTED.has(slug) && varga[slug]) {
      out.available[slug] = {
        slug,
        chart: varga[slug],
        analysis: analysis[slug] || null,
        status: (analysis[slug] && analysis[slug].overall_status) || 'neutral',
      };
      continue;
    }
    // Defined D1 fallback (D3 → 3rd house, D11 → 11th house)?
    const fb = cfg.CHART_FALLBACK[slug];
    if (fb) {
      out.fallbacks.push({
        requested: slug,
        actual: fb.via,
        house: fb.house,
        limitation_block: fb.limitation_block,
        confidence_penalty: true,
      });
      // ensure the D1 base is available for the fallback house reading
      if (!out.available.d1 && varga.d1) {
        out.available.d1 = { slug: 'd1', chart: varga.d1, analysis: analysis.d1 || null, status: (analysis.d1 && analysis.d1.overall_status) || 'neutral' };
      }
      continue;
    }
    // Supported chart requested but not present in this chart payload, or an
    // unknown/unsupported chart with no fallback → missing, never fabricated.
    out.missing.push(slug);
  }
  return out;
}

module.exports = { loadCharts, SUPPORTED_CHARTS: cfg.SUPPORTED_CHARTS };
