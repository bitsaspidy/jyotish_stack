'use strict';
/**
 * Feature-flag routing (Phase 3, component 6).
 *
 * Three INDEPENDENT switches (see config): dbCatalogue, deterministicAnswer,
 * ollamaAnswer. This module centralises the routing decisions so controllers
 * never branch on env vars directly, and it enforces the invariant that the
 * legacy question-bank and the new DB catalogue are NEVER served simultaneously.
 */

const cfg = require('../../config/deterministic-qa.config');

/** Which catalogue the suggestion UI should be served from — exactly one. */
function catalogueSource() {
  return cfg.FLAGS.dbCatalogue ? 'db' : 'legacy';
}

/**
 * Which answer path to use for a Kundli question.
 * @param {object} opts { hasPilotRule:boolean }
 * @returns 'deterministic' | 'llm' | 'legacy_rule'
 *
 * - deterministic: new no-LLM engine (only when its flag is ON and a pilot rule
 *   exists for the resolved question). Enabling the DB catalogue for testing does
 *   NOT force this path — deterministicAnswer is a separate switch.
 * - llm: existing Ollama "Final Answer" streaming (when its flag is ON).
 * - legacy_rule: the existing rule-based structured answer (always available).
 */
function answerPath({ hasPilotRule = false } = {}) {
  if (cfg.FLAGS.deterministicAnswer && hasPilotRule) return 'deterministic';
  if (cfg.FLAGS.ollamaAnswer) return 'llm';
  return 'legacy_rule';
}

function snapshot() {
  return {
    db_catalogue: cfg.FLAGS.dbCatalogue,
    deterministic_answer: cfg.FLAGS.deterministicAnswer,
    ollama_answer: cfg.FLAGS.ollamaAnswer,
    catalogue_source: catalogueSource(),
  };
}

module.exports = { catalogueSource, answerPath, snapshot };
