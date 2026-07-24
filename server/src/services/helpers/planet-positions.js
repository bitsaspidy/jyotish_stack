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
  siderealLongitudeForPlanet, tropicalLongitudeForPlanet, rashiFromDeg, nakshatraFromDeg,
  nakshatraSubLord, isRetrogradePlanet, dailyMotionForPlanet, signedAngleDelta,
  toDMS, lahiriAyanamsa, getPlanetDignity, getPlanetRelation, norm,
} = require('./core-helpers');
const { signWindow } = require('../deterministic-qa/dated-transit');
const { computePositions: computeUpagrahaPositions } = require('./upagrahas');
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

// ── Drik-style detail fields ────────────────────────────────────────────────
// The Ascendant is location + time dependent; the rest of this page is location-
// less "sky at noon IST", so the Lagna is anchored to one fixed reference —
// New Delhi at 12:00 IST — and labelled as such rather than pretending to be the
// reader's own rising sign.
const NEW_DELHI = { lat: 28.6139, lon: 77.2090 };
const OUTER = ['Uranus', 'Neptune', 'Pluto'];
const NODES = new Set(['Rahu', 'Ketu']);

// Combustion state (Asta = too close to the Sun to be seen; Udita = risen/visible).
const STATE_LABEL = {
  never: { key: 'never', en: 'Never Asta',      hi: 'अस्त रहित' },
  asta:  { key: 'asta',  en: 'Asta (Combust)',  hi: 'अस्त' },
  udita: { key: 'udita', en: 'Udita (Risen)',   hi: 'उदित' },
};
// The planet's standing WITH THE LORD of the sign it sits in ("residing in").
const RESIDING_LABEL = {
  own:     { key: 'own',     en: 'Own House',            hi: 'स्वगृह' },
  friend:  { key: 'friend',  en: "Friend's House",       hi: 'मित्र गृह' },
  enemy:   { key: 'enemy',   en: "Enemy's House",        hi: 'शत्रु गृह' },
  neutral: { key: 'neutral', en: 'Neutral with Landlord', hi: 'सम गृह' },
};

// "05° S 12′ 20″" — signed ecliptic latitude, hemisphere as N/S like Drik.
function latDMS(latDeg) {
  const hemi = latDeg >= 0 ? 'N' : 'S';
  const a = Math.abs(latDeg);
  const d = Math.floor(a);
  const mF = (a - d) * 60;
  const mm = Math.floor(mF);
  const ss = Math.round((mF - mm) * 60);
  return `${String(d).padStart(2, '0')}° ${hemi} ${String(mm).padStart(2, '0')}′ ${String(ss).padStart(2, '0')}″`;
}

// The astronomical block shared by planets, nodes and the ascendant: ecliptic
// latitude (Shara), daily speed, geocentric of-date RA/Dec, KP sub-lord, motion.
// ⚠️ astronomy-engine's Pluto model can differ from Drik's by ~0.3–0.4°, enough
// to shift Pluto's nakshatra near a boundary. Every value here is internally
// consistent (one ephemeris throughout); only Pluto disagrees with Drik.
function astroBlock(name, lon, JD) {
  const speed = dailyMotionForPlanet(name, JD);
  const eq = NODES.has(name)
    ? { latitude: 0, ...eph.eclipticToEquatorial(tropicalLongitudeForPlanet(name, JD), 0, JD) }
    : eph.bodyEquatorial(name, JD);
  return {
    raw_longitude: +lon.toFixed(2),
    latitude: +eq.latitude.toFixed(2),
    latitude_dms: latDMS(eq.latitude),
    speed: +speed.toFixed(2),
    right_ascension: +eq.ra.toFixed(2),
    declination: +eq.dec.toFixed(2),
    nakshatra_sub_lord: nakshatraSubLord(lon),
    motion: speed < 0 ? 'retrograde' : 'forward',
  };
}

function residingIn(planet, rashiNum) {
  if (NODES.has(planet)) return null; // nodes rule no sign — do not fabricate a friendship
  const lord = SIGN_LORD[rashiNum - 1];
  if (!lord) return null;
  if (lord === planet) return RESIDING_LABEL.own;
  return RESIDING_LABEL[getPlanetRelation(planet, lord)] || RESIDING_LABEL.neutral;
}

function planetState(name, isCombust, isOuter) {
  if (name === 'Sun' || NODES.has(name)) return STATE_LABEL.never;
  if (isOuter) return STATE_LABEL.udita; // outside the classical combustion scheme
  return isCombust ? STATE_LABEL.asta : STATE_LABEL.udita;
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
      ...astroBlock(name, lon, JD),     // latitude/shara, speed, RA/Dec, sub-lord, motion
      state: planetState(name, isCombust, false),   // Asta / Udita / Never Asta
      residing_in: residingIn(name, rashi.num),      // Own / Friend's / Enemy's / Neutral house
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
    /**
     * Ascendant (Lagna) — anchored to New Delhi at 12:00 IST. Unlike the planets,
     * the rising sign depends on place and time, so this is a fixed reference the
     * page labels honestly, never the anonymous reader's own Lagna.
     */
    try {
      const ascTrop = eph.tropicalAscendant(JD, NEW_DELHI.lat, NEW_DELHI.lon);
      const ascLon  = norm(ascTrop - lahiriAyanamsa(JD));
      const ascRashi = rashiFromDeg(ascLon);
      const ascNak   = nakshatraFromDeg(ascLon);
      const ascEq    = eph.eclipticToEquatorial(ascTrop, 0, JD);
      // Instantaneous rising rate: central difference of the ascendant over ±1 min.
      const dt = 1 / 1440;
      const ascSpeed = signedAngleDelta(
        eph.tropicalAscendant(JD - dt, NEW_DELHI.lat, NEW_DELHI.lon),
        eph.tropicalAscendant(JD + dt, NEW_DELHI.lat, NEW_DELHI.lon),
      ) / (2 * dt);
      out.ascendant = {
        planet: 'Ascendant',
        longitude: +ascLon.toFixed(4),
        degree_dms: toDMS(ascLon % 30),
        rashi_num: ascRashi.num, rashi_en: ascRashi.en, rashi_hi: ascRashi.hi,
        nakshatra_en: ascNak.en, nakshatra_hi: ascNak.hi, nakshatra_lord: ascNak.lord, pada: ascNak.pada,
        nakshatra_sub_lord: nakshatraSubLord(ascLon),
        is_retrograde: false,
        raw_longitude: +ascLon.toFixed(2),
        latitude: 0, latitude_dms: latDMS(0),
        speed: +ascSpeed.toFixed(2),
        right_ascension: +ascEq.ra.toFixed(2),
        declination: +ascEq.dec.toFixed(2),
        motion: 'forward',
        state: STATE_LABEL.never,
        residing_in: null,
        location: { en: 'New Delhi, India', hi: 'नई दिल्ली, भारत' },
        computed_at: '12:00 IST',
      };
    } catch { /* the ascendant is optional; the planets carry the page without it */ }

    /**
     * Outer planets — Uranus, Neptune, Pluto. Not part of the navagraha, so they
     * carry no dignity/effect reading, only their measured position. Listed after
     * the nodes exactly as Drik-style position pages do.
     */
    out.outer_positions = OUTER.map((name) => {
      const lon   = norm(siderealLongitudeForPlanet(name, JD));
      const rashi = rashiFromDeg(lon);
      const nak   = nakshatraFromDeg(lon);
      const retro = isRetrogradePlanet(name, JD);
      return {
        planet: name,
        is_outer: true,
        longitude: +lon.toFixed(4),
        degree_dms: toDMS(lon % 30),
        rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi,
        nakshatra_en: nak.en, nakshatra_hi: nak.hi, nakshatra_lord: nak.lord, pada: nak.pada,
        is_retrograde: !!retro,
        ...astroBlock(name, lon, JD),
        state: planetState(name, false, true),
        residing_in: null,
      };
    });

    /**
     * Upagrahas (sub-planets).
     *
     * This project's five — Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu —
     * are derived ARITHMETICALLY FROM THE SUN'S LONGITUDE alone, so they need no
     * birth time and no location and belong on a public page just as much as the
     * planets do. (Gulika/Mandi would need sunrise and a place; they are not
     * implemented here and are not faked.)
     *
     * The formula is imported from helpers/upagrahas.js rather than repeated —
     * two copies of an astrological constant is exactly how the two halves of a
     * product start disagreeing.
     *
     * Positions only. Their master content (nature, key indication, malefic or
     * benefic) lives in the `upagrahas` table and is merged by the route, so this
     * helper stays synchronous and DB-free at call time.
     */
    try {
      const up = computeUpagrahaPositions(sunLon);
      out.upagrahas = ['dhuma', 'vyatipata', 'parivesha', 'indrachapa', 'upaketu']
        .filter((slug) => Number.isFinite(up[slug]))
        .map((slug) => {
          const lon = ((up[slug] % 360) + 360) % 360;
          const rashi = rashiFromDeg(lon);
          const nak = nakshatraFromDeg(lon);
          return {
            slug,
            longitude: +lon.toFixed(4),
            degree_dms: toDMS(lon % 30),
            rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi,
            nakshatra_en: nak.en, nakshatra_hi: nak.hi, pada: nak.pada,
          };
        });
    } catch {
      out.upagrahas = [];
    }

    out.rule_version = CFG.RULE_VERSION;
    // Stated on every enriched response so the "this is not personalised" framing
    // travels with the data rather than living only in the page markup.
    out.personal_gap = CFG.PERSONAL_GAP;
  }
  return out;
}

module.exports = { computePlanetPositions };
