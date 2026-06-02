'use strict';
/**
 * Vedic Ephemeris Engine
 * Algorithms: Jean Meeus — "Astronomical Algorithms" 2nd Ed.
 *
 * Accuracy:
 *   Sun     ~0.01°   (Ch.25 – equation of center)
 *   Moon    ~0.1°    (Ch.47 – 60 main perturbation terms)
 *   Rahu    ~0.1°    (mean lunar node)
 *   Planets ~0.5–2°  (Ch.33 Keplerian elements + heliocentric→geocentric)
 *   Asc     ~0.1°    (LST + Ch.22 obliquity)
 *
 * All angles in degrees unless noted.
 */

// ─── Math helpers ────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const rad  = d => d * D2R;
const deg  = r => r * R2D;
const norm = d => ((d % 360) + 360) % 360;   // normalise to [0,360)

// ─── Julian Day Number ───────────────────────────────────────────────────────
/**
 * Convert a Gregorian UT date+time to Julian Day Number.
 * hour/minute/second are Universal Time (UT).
 */
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
  const T = jCent(JD);
  // Meeus eq. 12.4 — sidereal time of Greenwich at 0h UT
  const JD0 = Math.floor(JD - 0.5) + 0.5;       // JD at preceding midnight UT
  const T0  = jCent(JD0);
  let   st  = 6.697374558
              + 2400.0513369   * T0
              + 0.0000258622   * T0 * T0
              - T0 * T0 * T0 / 78710000.0;       // hours
  st = ((st % 24) + 24) % 24;
  const H = (JD - JD0) * 24;                     // UT hours since midnight
  st = ((st + H * 1.0027379093) % 24 + 24) % 24;
  return norm(st * 15);                           // hours → degrees
}

// Local Sidereal Time at longitude lonDeg (degrees)
const LST = (JD, lonDeg) => norm(GMST(JD) + lonDeg);

// ─── Sun  (Meeus Ch.25 — accuracy ~0.01°) ────────────────────────────────────
function sunTropicalLongitude(JD) {
  const T  = jCent(JD);
  const T2 = T * T;

  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;    // mean longitude
  let M  = 357.52911 + 35999.05029 * T - 0.0001537 * T2;    // mean anomaly
  M = norm(M);
  const Mr = rad(M);

  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          +  0.000289                 * Math.sin(3 * Mr);

  const sunLon = L0 + C;                                     // true longitude

  // Apparent longitude (nutation + aberration)
  const omega = 125.04 - 1934.136 * T;
  return norm(sunLon - 0.00569 - 0.00478 * Math.sin(rad(omega)));
}

// ─── Moon  (Meeus Ch.47 — main 60 perturbation terms, accuracy ~0.1°) ───────
function moonTropicalLongitude(JD) {
  const T  = jCent(JD);
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  const E  = 1 - 0.002516 * T - 0.0000074 * T2;
  const E2 = E * E;

  const Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841    - T4 / 65194000);
  const D  = norm(297.8501921 + 445267.1114034  * T - 0.0018819 * T2 + T3 / 545868    - T4 / 113065000);
  const M  = norm(357.5291092 +  35999.0502909  * T - 0.0001536 * T2 + T3 / 24490000);
  const Mp = norm(134.9633964 + 477198.8675055  * T + 0.0087414 * T2 + T3 / 69699     - T4 / 14712000);
  const F  = norm( 93.2720950 + 483202.0175233  * T - 0.0036539 * T2 - T3 / 3526000   + T4 / 863310000);

  const Dr = rad(D), Mr = rad(M), Mpr = rad(Mp), Fr = rad(F);

  // [d, m, mp, f, coefficient×1e-6°]
  const LT = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],
    [0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],
    [2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
    [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],
    [4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
    [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],
    [2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],
    [0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
    [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
    [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],
    [2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],
    [4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,-381],
    [1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],[2,-1,2,0,327],
    [0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294],[2,0,-1,-2,0],
  ];

  let sl = 0;
  for (const [d, m, mp, f, c] of LT) {
    const angle = d * Dr + m * Mr + mp * Mpr + f * Fr;
    let cc = c;
    if (Math.abs(m) === 1) cc *= E;
    if (Math.abs(m) === 2) cc *= E2;
    sl += cc * Math.sin(angle);
  }

  return norm(Lp + sl / 1_000_000);
}

// ─── Rahu — Mean Lunar Ascending Node  (Meeus Ch.47) ────────────────────────
function rahuTropicalLongitude(JD) {
  const T = jCent(JD);
  return norm(125.04455 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
}

// ─── Planets — Keplerian Elements  (Meeus Table 33.a, J2000.0 epoch) ────────
// All rates are per Julian century (T).
const ORBITAL = {
  mercury: { L0: 252.250906, L1: 149472.6746358, a: 0.387098310, e0: 0.20563175,  e1:  0.000020407,  i0: 7.004986,  O0:  48.330893, w0:  77.456119 },
  venus:   { L0: 181.979801, L1:  58517.8156760, a: 0.723329820, e0: 0.00677192,  e1: -0.000047788,  i0: 3.394662,  O0:  76.679920, w0: 131.563703 },
  mars:    { L0: 355.433000, L1:  19140.2993313, a: 1.523679342, e0: 0.09340065,  e1:  0.000090484,  i0: 1.849726,  O0:  49.558093, w0: 336.060234 },
  jupiter: { L0:  34.351519, L1:   3034.9056606, a: 5.202603209, e0: 0.04849485,  e1:  0.000163244,  i0: 1.303270,  O0: 100.464441, w0:  14.331309 },
  saturn:  { L0:  50.077444, L1:   1222.1138488, a: 9.554909192, e0: 0.05550825,  e1: -0.000346641,  i0: 2.488878,  O0: 113.665524, w0:  93.056787 },
};

// Earth orbital elements — used for heliocentric→geocentric conversion
const EARTH = { L0: 100.464457, L1: 35999.3728565, a: 1.000001018, e0: 0.01671123, e1: -0.000041392, i0: 0.0, O0: 0.0, w0: 102.937348 };

/** Solve Kepler's equation E - e·sin(E) = M using Newton–Raphson. */
function keplerSolve(M_rad, e) {
  let E = M_rad;
  for (let i = 0; i < 100; i++) {
    const dE = (E - e * Math.sin(E) - M_rad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/** Heliocentric ecliptic XYZ for orbital elements at Julian centuries T. */
function helioXYZ(orb, T) {
  const L      = norm(orb.L0 + orb.L1 * T);
  const e      = orb.e0 + orb.e1 * T;
  const i_rad  = rad(orb.i0);
  const O_rad  = rad(norm(orb.O0));
  const wBar   = norm(orb.w0);                   // longitude of perihelion
  const omega  = rad(norm(wBar - orb.O0));        // argument of perihelion
  const M_deg  = norm(L - wBar);
  const E      = keplerSolve(rad(M_deg), e);
  const cosE   = Math.cos(E), sinE = Math.sin(E);
  const v      = Math.atan2(Math.sqrt(1 - e * e) * sinE, cosE - e);
  const r      = orb.a * (1 - e * cosE);
  const cosO   = Math.cos(O_rad), sinO = Math.sin(O_rad);
  const cosOv  = Math.cos(omega + v), sinOv = Math.sin(omega + v);
  const cosi   = Math.cos(i_rad), sini = Math.sin(i_rad);
  return {
    x: r * (cosO * cosOv - sinO * sinOv * cosi),
    y: r * (sinO * cosOv + cosO * sinOv * cosi),
    z: r * (sini * sinOv),
  };
}

/** Geocentric tropical ecliptic longitude of a planet. */
function planetTropicalLongitude(planet, JD) {
  const T = jCent(JD);
  const p = helioXYZ(ORBITAL[planet], T);
  const e = helioXYZ(EARTH, T);
  return norm(deg(Math.atan2(p.y - e.y, p.x - e.x)));
}

// ─── Ascendant  (LST + Meeus obliquity) ──────────────────────────────────────
function tropicalAscendant(JD, latDeg, lonDeg) {
  const lst   = LST(JD, lonDeg);
  const RAMC  = rad(lst);
  const eps   = rad(obliquity(JD));
  const phi   = rad(latDeg);

  // Standard ascendant formula
  const Y =  Math.cos(RAMC);
  const X = -(Math.sin(RAMC) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  let asc = norm(deg(Math.atan2(Y, X)));

  // Quadrant correction: ascendant must be in the eastern hemisphere
  const mc  = norm(deg(Math.atan2(Math.sin(RAMC), Math.cos(RAMC) * Math.cos(eps))));
  const diff = norm(asc - mc);
  if (diff > 180) asc = norm(asc + 180);

  return asc;
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
  tropicalAscendant,
  norm,
};
