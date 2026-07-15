'use strict';
/**
 * Answer routing (Stage 3 — database-first, unconditional).
 *
 * There is exactly ONE Kundli answer path: the database catalogue feeds the
 * deterministic engine, which produces the answer. No feature flags, no
 * generative path, no legacy question-bank, no alternate branch.
 *
 *   Database → Deterministic Engine → Answer
 */

/** The Kundli answer path is always deterministic — there is no alternate result. */
function answerPath() {
  return 'deterministic';
}

function snapshot() {
  return { answer_path: 'deterministic', catalogue_source: 'db' };
}

module.exports = { answerPath, snapshot };
