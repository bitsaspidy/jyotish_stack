'use strict';
/**
 * Selection registry — which option taxonomy a selection question ranks over.
 *
 * A question is routed here by INTENT (selection), and the taxonomy is chosen by
 * DOMAIN. Adding "which career field?" or "which business sector?" later means
 * adding a taxonomy and one line here — the ranker, the composer, the UI and the
 * admin trace are already generic.
 *
 * A selection question whose domain has no taxonomy resolves to null and falls
 * back to the ordinary favourability answer. That is a real answer, just not a
 * ranked one — which is strictly better than an empty section.
 */

const { FIELDS } = require('../../../data/education-fields.data');

// domain → { options, blockPrefix }
// blockPrefix namespaces the taxonomy's DB content, so two domains can both have
// an option called `.research` without colliding.
const TAXONOMIES = Object.freeze({
  education: { options: FIELDS, blockPrefix: 'sel.education' },
});

/** The taxonomy for a domain, or null when this domain has no option set yet. */
function taxonomyFor(domain) {
  return TAXONOMIES[domain] || null;
}

/** Can this question actually be answered as a ranked selection? */
function hasSelector(domain) {
  return !!TAXONOMIES[domain];
}

module.exports = { TAXONOMIES, taxonomyFor, hasSelector };
