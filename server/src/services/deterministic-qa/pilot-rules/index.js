'use strict';
/**
 * Pilot-rule registry (Phase 3).
 *
 * Maps the 10 approved pilot question codes to a bilingual, no-LLM rule that
 * shapes the direct-answer headline + focus. Foundation (Q001, Q093) and the
 * timing-heavy questions (Q041, Q081) have dedicated modules; the remaining
 * non-timing pilots use the generic favourability rule. Only these 10 codes have
 * a rule — the remaining 90 questions are deliberately NOT implemented in Phase 3.
 */

const defaultRule = require('./default-rule');
const q001 = require('./q001');
const q093 = require('./q093');
const timingWindow = require('./timing-window');

// The 10 approved pilot codes (one per category).
const PILOT_CODES = ['Q001', 'Q012', 'Q021', 'Q031', 'Q041', 'Q051', 'Q061', 'Q071', 'Q081', 'Q093'];

const REGISTRY = {
  Q001: q001,
  Q093: q093,
  Q041: timingWindow('marriage'),
  Q081: timingWindow('property'),
  // Q012, Q021, Q031, Q051, Q061, Q071 → generic favourability
  Q012: defaultRule, Q021: defaultRule, Q031: defaultRule,
  Q051: defaultRule, Q061: defaultRule, Q071: defaultRule,
};

function hasRule(code) { return Object.prototype.hasOwnProperty.call(REGISTRY, code); }
function getRule(code) { return REGISTRY[code] || null; }

module.exports = { PILOT_CODES, hasRule, getRule, REGISTRY };
