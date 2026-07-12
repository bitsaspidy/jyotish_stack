'use strict';
/**
 * Shared timing-window rule for the timing-heavy pilots (Q041 marriage timing,
 * Q081 house-purchase timing). Stage 1: evaluation only — finds the nearest
 * supportive slow-planet window (a PERIOD OF EMPHASIS, never a guaranteed event
 * date). User-facing text lives in answer_templates; the composer renders
 * {{window_line}} / {{dasha_line}} from shared fragments.
 */

function bestSupportiveWindow(transit) {
  if (!transit || !transit.available) return null;
  const rel = transit.transits.filter((t) => t.relevant_to_question && t.classification === 'supportive');
  const scope = rel.length ? rel : transit.transits.filter((t) => t.classification === 'supportive');
  if (!scope.length) return null;
  // earliest-ending supportive window = the nearest actionable emphasis
  return scope.sort((a, b) => String(a.transit_end).localeCompare(String(b.transit_end)))[0];
}

module.exports = function timingWindow() {
  return function rule(ctx) {
    const win = bestSupportiveWindow(ctx.transit);
    return {
      rule_keys: ['qa.timing.v1', 'qa.transit.v1', 'qa.state.v1'],
      timing_window: win || null,
      vars: { timing_window: win || null },
    };
  };
};
