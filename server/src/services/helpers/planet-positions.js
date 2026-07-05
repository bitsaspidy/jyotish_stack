'use strict';
/**
 * Daily planetary positions (Grah Gochar) for any date — each of the 9 grahas'
 * sidereal sign, degree, nakshatra + pada and retrograde status, computed from
 * the Lahiri panchang engine at 12:00 IST of the given day.
 */
const eph = require('../ephemeris.service');
const {
  siderealLongitudeForPlanet, rashiFromDeg, nakshatraFromDeg,
  isRetrogradePlanet, toDMS, lahiriAyanamsa,
} = require('./core-helpers');

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function computePlanetPositions(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const JD = eph.julianDay(y, m, d, 6, 30, 0); // 12:00 IST (06:30 UTC)

  const positions = PLANETS.map((name) => {
    const lon   = ((siderealLongitudeForPlanet(name, JD) % 360) + 360) % 360;
    const rashi = rashiFromDeg(lon);
    const nak   = nakshatraFromDeg(lon);
    // Rahu/Ketu (mean lunar nodes) are always retrograde.
    const retro = (name === 'Rahu' || name === 'Ketu') ? true : isRetrogradePlanet(name, JD);
    return {
      planet: name,
      longitude: +lon.toFixed(4),
      degree_dms: toDMS(lon % 30),
      rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi,
      nakshatra_en: nak.en, nakshatra_hi: nak.hi, nakshatra_lord: nak.lord, pada: nak.pada,
      is_retrograde: !!retro,
    };
  });

  let ayanamsa = null;
  try { ayanamsa = +lahiriAyanamsa(JD).toFixed(4); } catch { /* optional */ }

  return { date: dateStr, ayanamsa, positions };
}

module.exports = { computePlanetPositions };
