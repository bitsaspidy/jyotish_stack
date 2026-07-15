'use strict';
/**
 * Shared timing-window rule for the timing-heavy pilots (Q041 marriage timing,
 * Q081 house-purchase timing). Evaluation only — finds the nearest supportive
 * slow-planet window (a PERIOD OF EMPHASIS, never a guaranteed event date).
 *
 * The window it returns is now surfaced through the timing framework
 * (timing-outlook.js), which builds a real outlook — current phase, caution
 * window, supportive window, triggers — from the full transit set. This rule's
 * facts remain part of the trace and the rule-key audit.
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
