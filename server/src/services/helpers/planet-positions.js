'use strict';
/**
 * Daily planetary positions (Grah Gochar) for any date — each of the 9 grahas'
 * sidereal sign, degree, nakshatra + pada and retrograde status, computed from
 * the Lahiri panchang engine at 12:00 IST of the given day.
 *
 * Also returns, for the PUBLIC page, an honest reading of each transit: the
 * planet's dignity in the sign it occupies, a composed effect line, retrograde and
 * combustion notes, and the dates the transit began and ends.
 *
 * ⚠️ Everything here is a statement about THE SKY, never about a reader. This
 * endpoint has no birth chart — the visitor is anonymous — so it must not claim to
 * know which part of anyone's life is affected. See gochar-public.config.js.
 */
const eph = require('../ephemeris.service');
const {
  siderealLongitudeForPlanet, rashiFromDeg, nakshatraFromDeg,
  isRetrogradePlanet, toDMS, lahiriAyanamsa, getPlanetDignity, getPlanetRelation,
} = require('./core-helpers');
const { signWindow } = require('../deterministic-qa/dated-transit');
const CFG = require('../../config/gochar-public.config');

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// Classical combustion orbs (degrees from the Sun), simplified to one value per
// planet. Rahu/Ketu are shadow points and are never treated as combust.
const COMBUST_ORB = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };

// Sign → ruling planet, 1..12. Rahu/Ketu rule no sign, so their placement falls
// back to the neutral reading rather than a fabricated friendship.
const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

/**
 * The planet's standing in this sign.
 *
 * getPlanetDignity() only distinguishes exalted / debilitated / moolatrikona /
 * own; everything else comes back 'Neutral', which on a typical day made six of
 * nine planets read identically. When it is none of those, fall through to the
 * planet's natural friendship WITH THE SIGN LORD, which is the classical next
 * test and is what makes the reading specific.
 */
function standing(planet, lon, rashiNum) {
  // `raw` is getPlanetDignity's own string ("Exaltation (उच्च)" / "Neutral"); the
  // config entries carry their own `label` object, so the two are kept in separate
  // fields — spreading one over the other silently turned the string into an object.
  const raw = getPlanetDignity(planet, lon);
  if (raw !== 'Neutral') {
    const eff = CFG.DIGNITY_EFFECT[raw] || CFG.DIGNITY_EFFECT.Neutral;
    return { source: 'dignity', raw, ...eff };
  }
  const lord = SIGN_LORD[rashiNum - 1];
  if (!lord || planet === 'Rahu' || planet === 'Ketu' || lord === planet) {
    return { source: 'neutral', raw, ...CFG.RELATION_EFFECT.neutral };
  }
  const rel = getPlanetRelation(planet, lord); // 'friend' | 'enemy' | 'neutral' | 'self'
  const eff = CFG.RELATION_EFFECT[rel] || CFG.RELATION_EFFECT.neutral;
  return { source: 'relation', raw, relation: rel, sign_lord: lord, ...eff };
}

const iso = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null);

/** Shortest angular separation in degrees. */
function separation(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/**
 * Compose the effect line from planet nature × sign temperament × dignity.
 * Written as a statement about the transit, not about the reader.
 */
function composeEffect(planet, rashiNum, stand, lang) {
  const sig = CFG.PLANET_SIGNIFIES[planet];
  const style = CFG.SIGN_STYLE[rashiNum];
  if (!sig || !style) return '';
  return lang === 'hi'
    ? `${sig.hi} से जुड़े विषय इस समय ${style.manner.hi} प्रकट हो रहे हैं। ${style.wants.hi} ग्रह ${stand.hi}।`
    : `Matters of ${sig.en} are being expressed ${style.manner.en}. ${style.wants.en} The planet ${stand.en}.`;
}

function computePlanetPositions(dateStr, opts = {}) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const JD = eph.julianDay(y, m, d, 6, 30, 0); // 12:00 IST (06:30 UTC)
  // `enrich` is opt-in so the panchang/chart callers keep their original payload.
  const enrich = opts.enrich === true;
  const at = new Date(Date.UTC(y, m - 1, d, 6, 30, 0));

  const sunLon = ((siderealLongitudeForPlanet('Sun', JD) % 360) + 360) % 360;

  const positions = PLANETS.map((name) => {
    const lon   = ((siderealLongitudeForPlanet(name, JD) % 360) + 360) % 360;
    const rashi = rashiFromDeg(lon);
    const nak   = nakshatraFromDeg(lon);
    // Rahu/Ketu (mean lunar nodes) are always retrograde.
    const retro = (name === 'Rahu' || name === 'Ketu') ? true : isRetrogradePlanet(name, JD);
    const base = {
      planet: name,
      longitude: +lon.toFixed(4),
      degree_dms: toDMS(lon % 30),
      rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi,
      nakshatra_en: nak.en, nakshatra_hi: nak.hi, nakshatra_lord: nak.lord, pada: nak.pada,
      is_retrograde: !!retro,
    };
    if (!enrich) return base;

    const stand = standing(name, lon, rashi.num);

    // Combustion — only for the true planets, and never for the Sun itself.
    const orb = COMBUST_ORB[name];
    const sep = orb ? separation(lon, sunLon) : null;
    const isCombust = !!(orb && sep <= orb);

    // Sign entry/exit. Guarded: a scan failure must not take the page down.
    let window = { start: null, end: null, open_start: true, open_end: true };
    try { window = signWindow(name, at); } catch { /* keep the open window */ }
    const endIso = iso(window.end);
    const daysLeft = endIso
      ? Math.max(0, Math.round((new Date(`${endIso}T00:00:00Z`) - at) / 86400000))
      : null;

    return {
      ...base,
      dignity: stand.raw,               // canonical engine string
      dignity_key: stand.key,           // exalted | own | debilitated | friend | enemy | neutral …
      dignity_tone: stand.tone,         // strong | weak | neutral — drives the UI colour
      dignity_label: stand.label,       // { en, hi } badge text
      standing_source: stand.source,    // 'dignity' | 'relation' | 'neutral'
      sign_lord: stand.sign_lord || null,
      sign_lord_relation: stand.relation || null,
      // Rahu/Ketu are perpetually retrograde — flagging it daily is noise.
      retrograde_note: (retro && !CFG.ALWAYS_RETROGRADE.includes(name))
        ? { en: CFG.RETROGRADE.en, hi: CFG.RETROGRADE.hi } : null,
      is_combust: isCombust,
      combust_note: isCombust ? { en: CFG.COMBUST_NOTE.en, hi: CFG.COMBUST_NOTE.hi } : null,
      sun_separation: sep == null ? null : +sep.toFixed(2),
      effect: {
        en: composeEffect(name, rashi.num, stand, 'en'),
        hi: composeEffect(name, rashi.num, stand, 'hi'),
      },
      transit_window: {
        entered_on: iso(window.start),
        leaves_on: endIso,
        days_remaining: daysLeft,
        open_start: !!window.open_start,
        open_end: !!window.open_end,
      },
    };
  });

  let ayanamsa = null;
  try { ayanamsa = +lahiriAyanamsa(JD).toFixed(4); } catch { /* optional */ }

  const out = { date: dateStr, ayanamsa, positions };
  if (enrich) {
    out.rule_version = CFG.RULE_VERSION;
    // Stated on every enriched response so the "this is not personalised" framing
    // travels with the data rather than living only in the page markup.
    out.personal_gap = CFG.PERSONAL_GAP;
  }
  return out;
}

module.exports = { computePlanetPositions };
