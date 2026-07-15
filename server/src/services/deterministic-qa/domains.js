'use strict';
/**
 * Answer domains — the life-area vocabulary the humanizer speaks in.
 *
 * A question's CATEGORY is a catalogue/navigation concept (10 groups shown in the
 * UI). Its DOMAIN is a narrative concept: the life area whose language, cautions,
 * evidence framing and next steps an answer must use. They are deliberately not
 * the same thing —
 *   • one category can hold several domains  (family → children | parents | siblings)
 *   • a "timing" question keeps its subject domain (Q041 = marriage, not timing);
 *     timing is a question SHAPE (needs_dated_transit), not a life area.
 *
 * Same answer state must never mean the same sentence: `mixed` for finance and
 * `mixed` for health are different claims about the world. Everything downstream
 * keys off the domain resolved here.
 *
 * This module resolves KEYS ONLY. Every user-facing string lives in the database
 * (answer_templates / answer_shared_blocks) — see domain-answer-templates.data.js.
 */

// The 19 supported domains. Machinery works for all of them; authored content
// currently exists for the 10 that have a live pilot question (see LIVE_DOMAINS).
const DOMAINS = Object.freeze([
  'finance', 'business', 'career', 'health', 'marriage', 'relationships',
  'children', 'education', 'property', 'vehicle', 'family', 'parents',
  'siblings', 'debt', 'disputes', 'foreign', 'spirituality', 'timing', 'general',
]);

const DOMAIN_SET = new Set(DOMAINS);

// Domains reachable today (one live pilot question each). The other 9 resolve and
// compose correctly but have no seeded content until their questions are scoped.
const LIVE_DOMAINS = Object.freeze([
  'general', 'career', 'business', 'finance', 'marriage',
  'children', 'education', 'health', 'property', 'timing',
]);

// category → domain (the default when no subcategory rule applies)
const DOMAIN_BY_CATEGORY = Object.freeze({
  personality: 'general',
  career: 'career',
  business: 'business',
  money: 'finance',
  marriage: 'marriage',
  family: 'family',
  education: 'education',
  health: 'health',
  property: 'property',
  timing: 'timing',
});

// `category:subcategory` → domain, for the questions whose life area is narrower
// than their catalogue category. Keyed off the real subcategory values in
// question-catalogue.data.js so every one of the 100 questions resolves.
const DOMAIN_BY_SUBCATEGORY = Object.freeze({
  'personality:purpose': 'spirituality',
  'money:debt': 'debt',
  'marriage:relationship': 'relationships',
  'family:children': 'children',
  'family:children_delay': 'children',
  'family:children_bond': 'children',
  'family:children_edu': 'children',
  'family:parents': 'parents',
  'family:siblings': 'siblings',
  'property:vehicle': 'vehicle',
  'property:relocation': 'foreign',
  'property:travel': 'foreign',
  'property:settlement': 'foreign',
  'property:disputes': 'disputes',
  'timing:spiritual': 'spirituality',
});

/**
 * Resolve the narrative domain for a catalogue question.
 * Prefers the question's stored `domain` column (migration 050) so the DB stays
 * the source of truth; falls back to the category/subcategory derivation for rows
 * seeded before the column existed.
 * @returns {string} one of DOMAINS (never null — 'general' is the floor)
 */
function resolveDomain(question) {
  if (!question) return 'general';
  if (question.domain && DOMAIN_SET.has(question.domain)) return question.domain;
  const cat = question.category_code || question.category;
  const sub = question.subcategory;
  if (cat && sub) {
    const bySub = DOMAIN_BY_SUBCATEGORY[`${cat}:${sub}`];
    if (bySub) return bySub;
  }
  return DOMAIN_BY_CATEGORY[cat] || 'general';
}

function isDomain(value) { return DOMAIN_SET.has(value); }

// Disclaimer family per domain. Part 13: the disclaimer must match the life area,
// not the catalogue category — `debt` is financial even though a sibling question
// in the same category is not. `null` means "use the question's own type".
const DISCLAIMER_BY_DOMAIN = Object.freeze({
  finance: 'financial',
  business: 'financial',
  debt: 'financial',
  health: 'medical',
  marriage: 'marriage',
  relationships: 'marriage',
  children: 'marriage',      // non-fatalistic family language, not medical
  property: 'legal',
  disputes: 'legal',
  vehicle: 'legal',
});

/**
 * Domain-aware disclaimer type. Falls back to the question's catalogue
 * disclaimer_type, then 'general', so a question can always be answered safely.
 */
function disclaimerTypeFor(domain, questionDisclaimerType) {
  return DISCLAIMER_BY_DOMAIN[domain] || questionDisclaimerType || 'general';
}

module.exports = {
  DOMAINS, LIVE_DOMAINS, DOMAIN_BY_CATEGORY, DOMAIN_BY_SUBCATEGORY,
  DISCLAIMER_BY_DOMAIN, resolveDomain, isDomain, disclaimerTypeFor,
};
