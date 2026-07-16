'use strict';
/**
 * Question intent — what SHAPE of answer the question is asking for.
 *
 * Domain says which life area an answer speaks about. Intent says what the reader
 * actually asked for. They are independent, and conflating them is why
 * "which education field suits me?" was answered with "education is workable for
 * you": the domain was right (education) and the shape was wrong (a favourability
 * verdict instead of a list of fields). A verdict is not an answer to "which".
 *
 * Intent is resolved from stored metadata, never inferred at runtime and never by
 * a model. `question_catalogue.intent_type` (migration 051) is the authority; the
 * derivation below is the fallback for rows written before that column and the
 * source seed 038 backfills from.
 */

// The ten answer shapes. Only the ones with a composer today actually change
// behaviour; the rest resolve correctly and fall through to the favourability
// path, which is the right answer for most of them.
const INTENTS = Object.freeze([
  'yes_no',         // "do I have prospects for X?"          → favourability verdict
  'timing',         // "when will X happen?"                  → timing framework
  'selection',      // "which X suits me?"                    → ranked options
  'comparison',     // "X or Y?"                              → weighed pair
  'explanation',    // "what is my X like?"                   → descriptive
  'risk',           // "what should I avoid in X?"            → cautions first
  'current_status', // "how is X right now?"                  → present-tense read
  'guidance',       // "what should I do about X?"            → action-led
  'cause',          // "why does X keep happening?"           → causal
  'remedy',         // "what remedies for X?"                 → remedies
]);
const INTENT_SET = new Set(INTENTS);

// Output schema per intent — what the composer must produce.
const OUTPUT_SCHEMA = Object.freeze({
  selection: 'ranked_selection',
  comparison: 'ranked_selection',   // a comparison is a selection over 2 options
  timing: 'timing_outlook',
});
const DEFAULT_SCHEMA = 'verdict_summary';

/**
 * `category:subcategory` → intent, for the questions whose shape is not the
 * catalogue default. Keyed off the real subcategory values in
 * question-catalogue.data.js so all 100 resolve.
 *
 * Read these as the question text, not the category: Q061 "which field of
 * education is most suitable" is a selection; Q062 "what are my prospects for
 * higher education" is a yes/no. Same category, different questions.
 */
const INTENT_BY_SUBCATEGORY = Object.freeze({
  // selection — "which one?"
  'career:field': 'selection',
  'business:sector': 'selection',
  'education:field': 'selection',
  'education:path': 'selection',
  'education:skill': 'selection',
  'money:income': 'selection',
  'property:type': 'selection',
  'personality:planet': 'selection',
  'money:planet': 'selection',
  'health:planet': 'selection',
  'timing:favourable': 'selection',
  'timing:challenging': 'selection',
  'timing:spiritual': 'selection',
  'timing:muhurat': 'selection',
  'health:lifestyle': 'selection',

  // comparison — "this or that?"
  'career:job_business': 'comparison',
  'career:sector': 'comparison',
  'business:partnership': 'comparison',
  'marriage:type': 'comparison',

  // timing — "when?"
  'career:timing': 'timing',
  'business:timing': 'timing',
  'money:timing': 'timing',
  'marriage:timing': 'timing',
  'marriage:window': 'timing',
  'family:children_edu': 'timing',
  'family:peace_timing': 'timing',
  'education:timing': 'timing',
  'health:caution': 'timing',
  'health:recovery': 'timing',
  'property:house_timing': 'timing',
  'property:buy_sell': 'timing',
  'property:vehicle': 'timing',

  // cause — "why does this keep happening?"
  'career:obstacles': 'cause',
  'business:cashflow': 'cause',
  'money:savings': 'cause',
  'marriage:delay': 'cause',
  'marriage:conflict': 'cause',
  'family:tension': 'cause',
  'family:responsibility': 'cause',
  'family:children_delay': 'cause',
  'education:interruption': 'cause',
  'education:focus': 'cause',
  'health:energy': 'cause',
  'health:stress': 'cause',
  'health:sleep': 'cause',
  'property:disputes': 'cause',

  // risk — "what should I watch out for?"
  'business:risks': 'risk',
  'money:debt': 'risk',
  'marriage:challenges': 'risk',

  // explanation — "what am I like?"
  'personality:self': 'explanation',
  'personality:strengths': 'explanation',
  'personality:challenges': 'explanation',
  'personality:emotional': 'explanation',
  'personality:decisions': 'explanation',
  'personality:purpose': 'explanation',
  'marriage:spouse': 'explanation',
  'marriage:after': 'explanation',
  'family:children_bond': 'explanation',
  'health:tendencies': 'explanation',

  // current_status — "how is it right now / next N months?"
  'career:current_job': 'current_status',
  'career:outlook': 'current_status',
  'business:outlook': 'current_status',
  'money:outlook': 'current_status',
  'family:outlook': 'current_status',
  'education:outlook': 'current_status',
  'health:outlook': 'current_status',
  'health:period': 'current_status',
  'property:outlook': 'current_status',
  'timing:mahadasha': 'current_status',
  'timing:antardasha': 'current_status',
  'timing:next3': 'current_status',
  'timing:next6': 'current_status',
  'timing:next12': 'current_status',

  // remedy
  'marriage:remedy': 'remedy',
  'timing:remedy': 'remedy',
});

/** Everything else is a yes/no prospects question, which is the catalogue norm. */
const DEFAULT_INTENT = 'yes_no';

/**
 * Resolve a question's intent.
 * Prefers the stored column so the DB stays the source of truth; falls back to the
 * derivation so an unmigrated row still answers.
 */
function resolveIntent(question) {
  if (!question) return DEFAULT_INTENT;
  if (question.intent_type && INTENT_SET.has(question.intent_type)) return question.intent_type;
  const cat = question.category_code || question.category;
  const sub = question.subcategory;
  if (cat && sub) {
    const bySub = INTENT_BY_SUBCATEGORY[`${cat}:${sub}`];
    if (bySub) return bySub;
  }
  return DEFAULT_INTENT;
}

/** The output schema a question's answer must take. */
function resolveOutputSchema(question) {
  if (question && question.output_schema) return question.output_schema;
  return OUTPUT_SCHEMA[resolveIntent(question)] || DEFAULT_SCHEMA;
}

const isIntent = (v) => INTENT_SET.has(v);

module.exports = {
  INTENTS, OUTPUT_SCHEMA, DEFAULT_INTENT, DEFAULT_SCHEMA,
  INTENT_BY_SUBCATEGORY, resolveIntent, resolveOutputSchema, isIntent,
};
