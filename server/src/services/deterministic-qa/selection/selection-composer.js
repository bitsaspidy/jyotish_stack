'use strict';
/**
 * Ranked-selection composer.
 *
 * Builds the answer to "which X suits me?" — a direction, then named options in
 * order, each with the reason it earned its place.
 *
 * The shape is the point. A favourability verdict ("education is workable for
 * you") is a true sentence that answers a question nobody asked; the reader wanted
 * a list of fields. So this path never emits a verdict as its headline, and the
 * evidence is SYNTHESISED INTO the options rather than restated beside them.
 *
 * Keys only — every string resolves from answer_shared_blocks (seed 038).
 */

const { planetName } = require('../vocab');

/**
 * The primary direction: what the top options have in common.
 *
 * Derived from the planet that carries the most weight across the highest-ranked
 * options, so it is a genuine summary of the ranking rather than a separate
 * opinion that could contradict it.
 */
function dominantPlanet(primary) {
  const tally = {};
  primary.forEach((r, i) => {
    const rankWeight = 1 / (i + 1);        // the top option shapes the direction most
    for (const [planet, w] of Object.entries(r.option.planets || {})) {
      tally[planet] = (tally[planet] || 0) + w * rankWeight;
    }
  });
  const best = Object.entries(tally).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return best ? best[0] : null;
}

/**
 * Compose the ranked answer.
 *
 * @param {object}   args
 * @param {object}   args.ranking   rankOptions() output
 * @param {string}   args.domain
 * @param {string}   args.prefix    taxonomy block prefix (e.g. 'sel.education')
 * @param {string}   args.lang
 * @param {Function} args.resolve   (keys[], lang, vars) => text|null
 * @returns {{ primary_direction, options, secondary, lower, varga_note, test_plan, meta }|null}
 */
function composeSelection({ ranking, domain, prefix, lang, resolve }) {
  if (!ranking || !ranking.primary || !ranking.primary.length) return null;

  const title = (r) => resolve([`${prefix}.${r.key}.title`], lang);
  const reason = (r) => resolve([`${prefix}.${r.key}.reason`], lang);
  const examples = (r) => resolve([`${prefix}.${r.key}.examples`], lang);
  const fitLabel = (r) => resolve([`sel.fit.${r.fit}`], lang);

  // An option we cannot name is an option we must not recommend.
  const usable = ranking.primary.filter((r) => title(r) && reason(r));
  if (!usable.length) return null;

  const lead = dominantPlanet(usable);
  const primary_direction = lead
    ? resolve([`sel.direction.${domain}.${lead.toLowerCase()}`, `sel.direction.${domain}.default`], lang)
    : resolve([`sel.direction.${domain}.default`], lang);

  const options = usable.map((r) => ({
    rank: r.rank + 1,
    key: r.key,
    title: title(r),
    fit: r.fit,
    fit_label: fitLabel(r),
    reason: reason(r),
    examples: examples(r),
    // Named so the reader can tell a caveat from a recommendation.
    caution: r.blocked
      ? resolve([`sel.blocked.${domain}`, 'sel.blocked.default'], lang, { planet: planetName(r.blockedBy, lang) })
      : null,
  }));

  const secondary = ranking.secondary
    .filter((r) => title(r))
    .map((r) => ({ rank: r.rank + 1, key: r.key, title: title(r), fit: r.fit, fit_label: fitLabel(r) }));

  const lower = ranking.lower
    .filter((r) => title(r))
    .map((r) => ({ key: r.key, title: title(r), fit_label: fitLabel(r) }));

  // What the confirming Varga contributes to THIS kind of study, not to the
  // question in general.
  const varga_note = resolve([`sel.varga.${domain}`], lang);

  // Astrology is not an aptitude test. The plan is how a reader converts a
  // tendency into a decision they can defend on evidence.
  const test_plan = resolve([`sel.test_plan.${domain}`, 'sel.test_plan.default'], lang);

  return {
    primary_direction,
    options,
    secondary,
    lower,
    varga_note,
    test_plan,
    meta: { dominant_planet: lead, option_count: options.length },
  };
}

module.exports = { composeSelection, dominantPlanet };
