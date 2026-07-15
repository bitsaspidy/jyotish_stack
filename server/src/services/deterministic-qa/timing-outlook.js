'use strict';
/**
 * Timing outlook — an answer to "when", not a list of transits.
 *
 * "Jupiter in Taurus (supportive, until ~2026-05-14); Saturn in Pisces (caution)"
 * is data, not guidance. Someone asking when they can buy a house needs to know
 * what this period is FOR, what to be careful of, when the pressure eases, and
 * what would actually have to switch on for the event to become likely. That is a
 * different shape from a favourability answer, so timing questions get their own
 * path:
 *
 *   current phase → preparation/caution window → next supportive window
 *   → stronger later window (only if one exists) → trigger conditions → no-guarantee
 *
 * Dates are printed ONLY where the transit engine actually resolved a boundary.
 * A window whose end lies beyond the search horizon (window_open_end) is described
 * without a date rather than given a fabricated one — an invented date is the one
 * error a timing answer must never make.
 *
 * When nothing supportive is in view, this says so plainly and redirects to
 * preparation. Silence would read as "no answer"; a vague date would be a lie.
 *
 * NOTE — no "stronger later window" section. The approved shape lists one, but the
 * transit engine only resolves the CURRENT sign window per slow planet; it does not
 * model future dasha activation. The only later moment derivable from this data is
 * the end of the pressure already described in `preparation`, so a later-window
 * section could either restate that date or invent one. It restates nothing and
 * invents nothing. `trigger` carries what would actually have to activate instead.
 */

const { planetName } = require('./vocab');

// Fallback chain: a domain without its own timing language borrows the general
// phrasing rather than emitting filler.
function timingKeys(domain, phase) {
  const keys = [];
  if (domain) keys.push(`timing.${domain}.${phase}`);
  keys.push(`timing.general.${phase}`);
  return keys;
}

/** Transits that bear on the question, falling back to all slow-planet transits. */
function scopeOf(transit) {
  const rel = (transit.transits || []).filter((t) => t.relevant_to_question);
  return rel.length ? rel : (transit.transits || []);
}

/** A date is printable only when the engine actually resolved that boundary. */
const endDateOf = (t) => (t && t.transit_end && !t.window_open_end ? t.transit_end : null);

/**
 * Compose the timing outlook.
 *
 * @param {object}   args
 * @param {object}   args.transit   evaluateDatedTransits() result
 * @param {object}   [args.dasha]   { maha, antar } — current dasha, for trigger wording
 * @param {object}   [args.verdict] resolveQuestionVerdict() output (timing_gap drives emphasis)
 * @param {string}   args.domain
 * @param {string}   args.lang
 * @param {Function} args.resolve   (keys[], lang, vars) => text|null
 * @returns {{ sections, has_window, dates_used, keys_used }|null}
 */
function composeTimingOutlook({ transit, dasha = {}, verdict = null, domain, lang, resolve }) {
  if (!transit || !transit.available) return null;

  const scope = scopeOf(transit);
  if (!scope.length) return null;

  const supportive = scope.filter((t) => t.classification === 'supportive');
  const caution = scope.filter((t) => t.classification === 'caution');

  const sections = [];
  const keysUsed = [];
  const datesUsed = [];

  const push = (phase, vars) => {
    const keys = timingKeys(domain, phase);
    const text = resolve(keys, lang, vars || {});
    if (!text) return false;
    sections.push({ phase, text });
    keysUsed.push({ phase, keys });
    return true;
  };

  const overall = transit.summary ? transit.summary.overall : 'mixed';

  // 1. Current phase — what this period is for.
  push(`current.${overall}`, { as_of: transit.as_of || '' }) || push('current', { as_of: transit.as_of || '' });

  // 2. Preparation / caution window — the pressure, and when it lifts (if known).
  //    The lead is the caution transit that binds LONGEST, since that is the one
  //    that actually governs when this phase ends. Picking any other would let the
  //    outlook name a date earlier than the pressure it just described.
  if (caution.length) {
    const lead = caution.reduce((a, b) => {
      if (!a) return b;
      const ae = endDateOf(a);
      const be = endDateOf(b);
      if (ae && be) return be > ae ? b : a;
      return ae ? a : b;
    }, null);
    const until = endDateOf(lead);
    if (until) datesUsed.push(until);
    push('preparation', {
      planet: planetName(lead.planet, lang),
      sign: lang === 'hi' ? lead.transit_sign_hi : lead.transit_sign_en,
      until: until || '',
    });
  }

  // 3. Next supportive window — named only when a supportive transit is genuinely present.
  if (supportive.length) {
    const lead = supportive[0];
    const until = endDateOf(lead);
    if (until) datesUsed.push(until);
    push(until ? 'supportive_window' : 'supportive_window_open', {
      planet: planetName(lead.planet, lang),
      sign: lang === 'hi' ? lead.transit_sign_hi : lead.transit_sign_en,
      until: until || '',
    });
  }

  // 4. Trigger conditions — what would actually have to activate.
  const mahaLord = dasha.maha ? (dasha.maha.lord || dasha.maha.planet || '') : '';
  push('trigger', { maha_lord: mahaLord ? planetName(mahaLord, lang) : '' });

  // 5. No supportive window at all: say so, and redirect to preparation rather
  //    than manufacturing a date to fill the section.
  if (!supportive.length && !caution.length) push('no_window', {});

  // 7. Never a promise.
  const noGuarantee = resolve(['timing.no_guarantee'], lang, {});
  if (noGuarantee) {
    sections.push({ phase: 'no_guarantee', text: noGuarantee });
    keysUsed.push({ phase: 'no_guarantee', keys: ['timing.no_guarantee'] });
  }

  if (!sections.length) return null;

  return {
    sections,
    text: sections.map((s) => s.text).join(' '),
    has_window: supportive.length > 0,
    timing_gap: !!(verdict && verdict.timing_gap),
    dates_used: datesUsed,
    keys_used: keysUsed,
  };
}

module.exports = { composeTimingOutlook, timingKeys, scopeOf, endDateOf };
