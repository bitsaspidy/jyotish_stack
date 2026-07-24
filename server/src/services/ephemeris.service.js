'use strict';
/**
 * Vedic Ephemeris Engine
 *
 * Planet positions: astronomy-engine (VSOP87 truncated / ELP2000)
 * Ascendant: Meeus GMST + Ch.22 obliquity
 * Rahu: Meeus Ch.47 mean lunar node
 * Sunrise/Sunset: astronomy-engine SearchRiseSet
 *
 * Accuracy:
 *   Sun     <1"  (astronomy-engine VSOP87)
 *   Moon    <1"  (astronomy-engine ELP2000)
 *   Planets <5"  (astronomy-engine VSOP87)
 *   Rahu    ~0.1° (Meeus mean node formula)
 *   Asc     ~0.1° (Meeus GMST + Ch.22 obliquity)
 *
 * All angles in degrees unless noted.
 */

const Astronomy = require('astronomy-engine');

// ─── Math helpers ────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const rad  = d => d * D2R;
const deg  = r => r * R2D;
const norm = d => ((d % 360) + 360) % 360;   // normalise to [0, 360)

// ─── Julian Day Number ───────────────────────────────────────────────────────
function julianDay(year, month, day, hour = 0, minute = 0, second = 0) {
  let Y = year, M = month;
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayF = day + (hour + minute / 60 + second / 3600) / 24;
  return Math.floor(365.25 * (Y + 4716))
       + Math.floor(30.6001 * (M + 1))
       + dayF + B - 1524.5;
}

// Julian centuries from J2000.0
const jCent = JD => (JD - 2451545.0) / 36525;

// JD 2440587.5 = 1970-01-01T00:00:00Z (Unix epoch)
const jdToDate = JD => new Date((JD - 2440587.5) * 86400000);

// ─── Obliquity of the Ecliptic  (Meeus Ch.22) ────────────────────────────────
function obliquity(JD) {
  const T = jCent(JD);
  return 23.439291111
       - 0.013004167 * T
       - 0.000000164 * T * T
       + 0.000000504 * T * T * T;
}

// ─── Greenwich Mean Sidereal Time  (degrees)  (Meeus Ch.12) ─────────────────
function GMST(JD) {
  const JD0 = Math.floor(JD - 0.5) + 0.5;
  const T0  = jCent(JD0);
  let   st  = 6.697374558
              + 2400.0513369   * T0
              + 0.0000258622   * T0 * T0
              - T0 * T0 * T0 / 78710000.0;
  st = ((st % 24) + 24) % 24;
  const H = (JD - JD0) * 24;
  st = ((st + H * 1.0027379093) % 24 + 24) % 24;
  return norm(st * 15);
}

// Local Sidereal Time at longitude lonDeg (degrees)
const LST = (JD, lonDeg) => norm(GMST(JD) + lonDeg);

// ─── Sun  (astronomy-engine SunPosition — apparent tropical longitude) ───────
function sunTropicalLongitude(JD) {
  return norm(Astronomy.SunPosition(jdToDate(JD)).elon);
}

// ─── Moon  (astronomy-engine GeoVector — geocentric J2000 ecliptic) ──────────
function moonTropicalLongitude(JD) {
  const gv = Astronomy.GeoVector(Astronomy.Body.Moon, jdToDate(JD), true);
  return norm(Astronomy.Ecliptic(gv).elon);
}

// ─── Rahu — Mean Lunar Ascending Node  (Meeus Ch.47 — ~0.1°) ────────────────
// astronomy-engine does not expose the mean node longitude directly
function rahuTropicalLongitude(JD) {
  const T = jCent(JD);
  return norm(125.04455 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
}

// ─── Planets  (astronomy-engine GeoVector — geocentric J2000 ecliptic) ───────
const _PLANET_BODY = {
  mercury: Astronomy.Body.Mercury,
  venus:   Astronomy.Body.Venus,
  mars:    Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn:  Astronomy.Body.Saturn,
  // Outer planets — not part of classical navagraha, but Drik-style position pages
  // list them. astronomy-engine carries VSOP87/Pluto ephemerides for all three.
  uranus:  Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto:   Astronomy.Body.Pluto,
};

function planetTropicalLongitude(planet, JD) {
  const body = _PLANET_BODY[planet.toLowerCase()];
  if (!body) throw new Error(`Unknown planet: ${planet}`);
  const gv = Astronomy.GeoVector(body, jdToDate(JD), true);
  return norm(Astronomy.Ecliptic(gv).elon);
}

// ─── Geocentric equatorial coordinates + ecliptic latitude (Shara) ───────────
// For a real body: RA/Dec are apparent, of-date, geocentric (the convention Drik
// Panchang prints). We take the aberration-corrected J2000 geo vector, read its
// J2000 ecliptic latitude (β / Shara — unchanged to the arc-second between J2000
// and of-date), then precess the vector to the equinox of date for RA/Dec.
const _GEO_BODY = {
  Sun: Astronomy.Body.Sun, Moon: Astronomy.Body.Moon, Mars: Astronomy.Body.Mars,
  Mercury: Astronomy.Body.Mercury, Jupiter: Astronomy.Body.Jupiter, Venus: Astronomy.Body.Venus,
  Saturn: Astronomy.Body.Saturn, Uranus: Astronomy.Body.Uranus, Neptune: Astronomy.Body.Neptune,
  Pluto: Astronomy.Body.Pluto,
};

function bodyEquatorial(name, JD) {
  const body = _GEO_BODY[name];
  if (!body) throw new Error(`Unknown body: ${name}`);
  const date = jdToDate(JD);
  const gv  = Astronomy.GeoVector(body, date, true);   // aberration-corrected, J2000 equatorial
  const ecl = Astronomy.Ecliptic(gv);                  // J2000 ecliptic lon/lat
  const eqd = Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(date), gv); // → equinox of date
  const eq  = Astronomy.EquatorFromVector(eqd);        // ra in sidereal hours, dec in degrees
  return { latitude: ecl.elat, ra: norm(eq.ra * 15), dec: eq.dec };
}

// Convert an ecliptic position (tropical longitude, latitude, both of-date) to
// equatorial RA/Dec. Used for the mean lunar nodes, which have no physical body
// but lie exactly on the ecliptic (β = 0).
function eclipticToEquatorial(lonDeg, latDeg, JD) {
  const eps = rad(obliquity(JD));
  const lam = rad(lonDeg), bet = rad(latDeg);
  const dec = Math.asin(Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam));
  const ra  = Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam));
  return { ra: norm(deg(ra)), dec: deg(dec) };
}

// ─── Ascendant  (LST + Meeus obliquity) ──────────────────────────────────────
function tropicalAscendant(JD, latDeg, lonDeg) {
  const lst   = LST(JD, lonDeg);
  const RAMC  = rad(lst);
  const eps   = rad(obliquity(JD));
  const phi   = rad(latDeg);

  const Y =  Math.cos(RAMC);
  const X = -(Math.sin(RAMC) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  let asc = norm(deg(Math.atan2(Y, X)));

  const mc  = norm(deg(Math.atan2(Math.sin(RAMC), Math.cos(RAMC) * Math.cos(eps))));
  const diff = norm(asc - mc);
  if (diff > 180) asc = norm(asc + 180);

  return asc;
}

// ─── Sunrise / Sunset  (astronomy-engine — accurate to ±30s) ─────────────────
function sunriseSunset(lat, lon, year, month, day, tzOffsetHrs) {
  const observer = new Astronomy.Observer(lat, lon, 0);
  // Start search from local midnight converted to UTC; window 1.5 days covers edge cases
  const startUtc = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0) - Math.round(tzOffsetHrs * 3600000)
  );
  const riseTime = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, startUtc, 1.5);
  const setTime  = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, startUtc, 1.5);

  const toLocalMins = (t) => {
    if (!t) return null;
    const localMin = Math.round(t.date.getTime() / 60000) + Math.round(tzOffsetHrs * 60);
    return ((localMin % 1440) + 1440) % 1440;
  };
  const fmtHHMM = (mins) => {
    if (mins === null) return null;
    const h = Math.floor(mins / 60), m = mins % 60;
    const ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`;
  };

  const sunriseMins = toLocalMins(riseTime);
  const sunsetMins  = toLocalMins(setTime);
  return {
    sunrise:      fmtHHMM(sunriseMins),
    sunset:       fmtHHMM(sunsetMins),
    sunrise_mins: sunriseMins,
    sunset_mins:  sunsetMins,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = {
  julianDay,
  jCent,
  obliquity,
  GMST,
  LST,
  sunTropicalLongitude,
  moonTropicalLongitude,
  rahuTropicalLongitude,
  planetTropicalLongitude,
  bodyEquatorial,
  eclipticToEquatorial,
  tropicalAscendant,
  sunriseSunset,
  norm,
};
