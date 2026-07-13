'use strict';
/**
 * Feature-flag routing (Stage 2 of the no-LLM pivot).
 *
 * There is NO generative answer path: the deterministic predefined-question
 * engine is the only Kundli answer system. This module centralises the two
 * TEMPORARY migration flags (see config for their documented removal points)
 * and keeps the invariant that the legacy question-bank and the DB catalogue
 * are never served simultaneously from the legacy endpoint.
 */

const cfg = require('../../config/deterministic-qa.config');

/** Which catalogue the LEGACY /question-bank endpoint serves — exactly one. */
function catalogueSource() {
  return cfg.FLAGS.dbCatalogue ? 'db' : 'legacy';
}

/**
 * The Kundli answer path. Always deterministic — there is no generative or
 * fallback result of any kind. Insufficient data yields the approved
 * deterministic insufficient-data response inside the engine, never a
 * fallback generator.
 */
function answerPath() {
  return 'deterministic';
}

function snapshot() {
  return {
    db_catalogue: cfg.FLAGS.dbCatalogue,
    deterministic_answer: cfg.FLAGS.deterministicAnswer,
    catalogue_source: catalogueSource(),
    answer_path: answerPath(),
  };
}

module.exports = { catalogueSource, answerPath, snapshot };
