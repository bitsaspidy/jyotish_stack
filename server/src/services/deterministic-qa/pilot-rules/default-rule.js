'use strict';
/**
 * Default pilot rule — generic favourability evaluation for the pilot questions
 * shaped like "are the prospects for X favourable" (Q012, Q021, Q031, Q051,
 * Q061, Q071). Stage 1: rules return only rule keys + interpolation variables;
 * ALL user-facing text lives in answer_templates / answer_shared_blocks.
 */

module.exports = function defaultRule() {
  return {
    rule_keys: ['qa.lens.v1', 'qa.strength.v1', 'qa.state.v1'],
    vars: {},
  };
};
