'use strict';
/**
 * Requirement loader + validator (Phase 3, component 2).
 *
 * Loads the stored question_requirements row for a question code and validates
 * every JSON-configured field BEFORE the engine relies on it. Invalid stored
 * config is rejected loudly (RequirementValidationError) rather than silently
 * producing a wrong answer.
 */

const repo = require('./catalogue-repository');

const VALID_PLANETS = new Set(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']);
const KNOWN_CHARTS   = new Set(['d1','d2','d3','d4','d7','d9','d10','d11','d12','d16','d20','d24','d27','d30']);
const VALID_DASHA    = new Set(['maha','antar','pratyantar','sookshma']);
const VALID_SECTIONS = new Set(['direct_answer','kundli_indicates','dchart_indication','dasha_influence','transit_influence','positive','caution','timing_outlook','practical_guidance','remedy','important_note']);
const VALID_BEHAVIOUR = new Set(['degrade','block']);

class RequirementValidationError extends Error {
  constructor(code, field, detail) {
    super(`Invalid requirement config for ${code}: ${field} — ${detail}`);
    this.name = 'RequirementValidationError';
    this.code = code;
    this.field = field;
  }
}

// JSON columns come back either already-parsed (mysql2 JSON) or as strings.
function asArray(value, code, field) {
  let v = value;
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch { throw new RequirementValidationError(code, field, 'not valid JSON'); }
  }
  if (!Array.isArray(v)) throw new RequirementValidationError(code, field, 'expected a JSON array');
  return v;
}

function validateHouses(arr, code) {
  for (const h of arr) {
    if (!Number.isInteger(h) || h < 1 || h > 12) throw new RequirementValidationError(code, 'houses', `bad house ${h}`);
  }
  return arr;
}

/**
 * Load + validate the requirement spec for a question code.
 * @returns normalized spec, or null if no requirement row exists.
 * @throws RequirementValidationError on malformed stored config.
 */
async function loadRequirement(code) {
  if (!repo.isValidCode(code)) throw new RequirementValidationError(code, 'question_code', 'malformed code');
  const row = await repo.getRequirementsRow(code);
  if (!row) return null;

  const houses          = validateHouses(asArray(row.houses, code, 'houses'), code);
  const houseLords      = validateHouses(asArray(row.house_lords, code, 'house_lords'), code);
  const planets         = asArray(row.planets, code, 'planets');
  const divisionalCharts = asArray(row.divisional_charts, code, 'divisional_charts');
  const dashaLevels     = asArray(row.dasha_levels, code, 'dasha_levels');
  const answerSections  = asArray(row.answer_sections, code, 'answer_sections');
  const requiredFields  = asArray(row.required_fields, code, 'required_fields');

  for (const p of planets) if (!VALID_PLANETS.has(p)) throw new RequirementValidationError(code, 'planets', `unknown planet ${p}`);
  for (const c of divisionalCharts) if (!KNOWN_CHARTS.has(c)) throw new RequirementValidationError(code, 'divisional_charts', `unknown chart ${c}`);
  for (const d of dashaLevels) if (!VALID_DASHA.has(d)) throw new RequirementValidationError(code, 'dasha_levels', `unknown dasha level ${d}`);
  for (const s of answerSections) if (!VALID_SECTIONS.has(s)) throw new RequirementValidationError(code, 'answer_sections', `unknown section ${s}`);
  if (!answerSections.length) throw new RequirementValidationError(code, 'answer_sections', 'must not be empty');

  const behaviour = String(row.missing_data_behaviour || 'degrade');
  if (!VALID_BEHAVIOUR.has(behaviour)) throw new RequirementValidationError(code, 'missing_data_behaviour', behaviour);

  return {
    question_code: code,
    houses,
    house_lords: houseLords,
    planets,
    divisional_charts: divisionalCharts,
    dasha_levels: dashaLevels,
    needs_current_transit: !!row.needs_current_transit,
    needs_dated_transit:   !!row.needs_dated_transit,
    needs_yoga:            !!row.needs_yoga,
    needs_remedy:          !!row.needs_remedy,
    shadbala_enhances:     !!row.shadbala_enhances,
    ashtakavarga_enhances: !!row.ashtakavarga_enhances,
    answer_sections: answerSections,
    required_fields: requiredFields,
    missing_data_behaviour: behaviour,
  };
}

module.exports = { loadRequirement, RequirementValidationError, VALID_PLANETS, KNOWN_CHARTS };
