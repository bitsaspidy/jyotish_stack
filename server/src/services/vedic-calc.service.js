'use strict';
/**
 * Vedic Astrology Calculation Service
 * Wraps ephemeris.service with Vedic-specific logic:
 *   • Lahiri Ayanamsa (Chitra-paksha sidereal system)
 *   • Rashi / Sign determination
 *   • Nakshatra + Pada from Moon's longitude
 *   • Whole-sign houses
 *   • Vimshottari Dasha periods
 *   • Planet dignity (Uccha/Neecha/Moolatrikona)
 */

const eph = require('./ephemeris.service');
const norm = eph.norm;

// ─── Lahiri Ayanamsa ─────────────────────────────────────────────────────────
// Reference: 23° 51' 11.4" at J2000.0; annual precession ~50.2796"
function lahiriAyanamsa(JD) {
  const yearsFromJ2000 = (JD - 2451545.0) / 365.25;
  return 23.85317 + (50.2796 / 3600) * yearsFromJ2000;
}

function toSidereal(tropDeg, JD) {
  return norm(tropDeg - lahiriAyanamsa(JD));
}

// ─── Rashi (Sign) data ───────────────────────────────────────────────────────
const RASHIS = [
  { num:1,  en:'Aries',       hi:'मेष',      lord:'Mars',    symbol:'♈', element:'Fire',  quality:'Cardinal' },
  { num:2,  en:'Taurus',      hi:'वृषभ',     lord:'Venus',   symbol:'♉', element:'Earth', quality:'Fixed'    },
  { num:3,  en:'Gemini',      hi:'मिथुन',    lord:'Mercury', symbol:'♊', element:'Air',   quality:'Mutable'  },
  { num:4,  en:'Cancer',      hi:'कर्क',     lord:'Moon',    symbol:'♋', element:'Water', quality:'Cardinal' },
  { num:5,  en:'Leo',         hi:'सिंह',     lord:'Sun',     symbol:'♌', element:'Fire',  quality:'Fixed'    },
  { num:6,  en:'Virgo',       hi:'कन्या',    lord:'Mercury', symbol:'♍', element:'Earth', quality:'Mutable'  },
  { num:7,  en:'Libra',       hi:'तुला',     lord:'Venus',   symbol:'♎', element:'Air',   quality:'Cardinal' },
  { num:8,  en:'Scorpio',     hi:'वृश्चिक',  lord:'Mars',    symbol:'♏', element:'Water', quality:'Fixed'    },
  { num:9,  en:'Sagittarius', hi:'धनु',      lord:'Jupiter', symbol:'♐', element:'Fire',  quality:'Mutable'  },
  { num:10, en:'Capricorn',   hi:'मकर',      lord:'Saturn',  symbol:'♑', element:'Earth', quality:'Cardinal' },
  { num:11, en:'Aquarius',    hi:'कुम्भ',    lord:'Saturn',  symbol:'♒', element:'Air',   quality:'Fixed'    },
  { num:12, en:'Pisces',      hi:'मीन',      lord:'Jupiter', symbol:'♓', element:'Water', quality:'Mutable'  },
];

function rashiFromDeg(siderealDeg) {
  const n   = norm(siderealDeg);
  const idx = Math.floor(n / 30);
  return { ...RASHIS[idx], degreeInSign: n % 30 };
}

// ─── Nakshatra data ──────────────────────────────────────────────────────────
const NAKSHATRAS = [
  { num:1,  en:'Ashwini',          hi:'अश्विनी',        lord:'Ketu',    years:7  },
  { num:2,  en:'Bharani',          hi:'भरणी',           lord:'Venus',   years:20 },
  { num:3,  en:'Krittika',         hi:'कृत्तिका',       lord:'Sun',     years:6  },
  { num:4,  en:'Rohini',           hi:'रोहिणी',         lord:'Moon',    years:10 },
  { num:5,  en:'Mrigashira',       hi:'मृगशीर्षा',      lord:'Mars',    years:7  },
  { num:6,  en:'Ardra',            hi:'आर्द्रा',         lord:'Rahu',    years:18 },
  { num:7,  en:'Punarvasu',        hi:'पुनर्वसु',        lord:'Jupiter', years:16 },
  { num:8,  en:'Pushya',           hi:'पुष्य',           lord:'Saturn',  years:19 },
  { num:9,  en:'Ashlesha',         hi:'आश्लेषा',         lord:'Mercury', years:17 },
  { num:10, en:'Magha',            hi:'मघा',             lord:'Ketu',    years:7  },
  { num:11, en:'Purva Phalguni',   hi:'पूर्वा फाल्गुनी', lord:'Venus',   years:20 },
  { num:12, en:'Uttara Phalguni',  hi:'उत्तरा फाल्गुनी', lord:'Sun',     years:6  },
  { num:13, en:'Hasta',            hi:'हस्त',            lord:'Moon',    years:10 },
  { num:14, en:'Chitra',           hi:'चित्रा',          lord:'Mars',    years:7  },
  { num:15, en:'Swati',            hi:'स्वाती',          lord:'Rahu',    years:18 },
  { num:16, en:'Vishakha',         hi:'विशाखा',          lord:'Jupiter', years:16 },
  { num:17, en:'Anuradha',         hi:'अनुराधा',         lord:'Saturn',  years:19 },
  { num:18, en:'Jyeshtha',         hi:'ज्येष्ठा',        lord:'Mercury', years:17 },
  { num:19, en:'Mula',             hi:'मूल',             lord:'Ketu',    years:7  },
  { num:20, en:'Purva Ashadha',    hi:'पूर्वाषाढ़ा',     lord:'Venus',   years:20 },
  { num:21, en:'Uttara Ashadha',   hi:'उत्तराषाढ़ा',     lord:'Sun',     years:6  },
  { num:22, en:'Shravana',         hi:'श्रवण',           lord:'Moon',    years:10 },
  { num:23, en:'Dhanishtha',       hi:'धनिष्ठा',         lord:'Mars',    years:7  },
  { num:24, en:'Shatabhisha',      hi:'शतभिषा',          lord:'Rahu',    years:18 },
  { num:25, en:'Purva Bhadrapada', hi:'पूर्वा भाद्रपद',  lord:'Jupiter', years:16 },
  { num:26, en:'Uttara Bhadrapada',hi:'उत्तरा भाद्रपद',  lord:'Saturn',  years:19 },
  { num:27, en:'Revati',           hi:'रेवती',           lord:'Mercury', years:17 },
];
const NAK_SPAN = 360 / 27;     // 13.333...°

function nakshatraFromDeg(siderealDeg) {
  const n    = norm(siderealDeg);
  const idx  = Math.floor(n / NAK_SPAN);
  const degN = n - idx * NAK_SPAN;
  return {
    ...NAKSHATRAS[idx],
    degree_in_nakshatra: +degN.toFixed(4),
    pada: Math.floor(degN / (NAK_SPAN / 4)) + 1,
  };
}

// ─── Planet Dignity ──────────────────────────────────────────────────────────
// Source: seed 004_planet_dignity.js (mooltrikone-and-actual-ed-sign.pdf)
const DIGNITY_MAP = {
  Sun:     { exalt:1, exaltD:10, debil:7, debilD:10, mool:5, moolF:0,  moolT:20, own:[5]     },
  Moon:    { exalt:2, exaltD:3,  debil:8, debilD:3,  mool:2, moolF:4,  moolT:20, own:[4]     },
  Mars:    { exalt:10,exaltD:28, debil:4, debilD:28, mool:1, moolF:0,  moolT:12, own:[1,8]   },
  Mercury: { exalt:6, exaltD:15, debil:12,debilD:15, mool:6, moolF:16, moolT:20, own:[3,6]   },
  Jupiter: { exalt:4, exaltD:5,  debil:10,debilD:5,  mool:9, moolF:0,  moolT:10, own:[9,12]  },
  Venus:   { exalt:12,exaltD:27, debil:6, debilD:27, mool:7, moolF:0,  moolT:15, own:[2,7]   },
  Saturn:  { exalt:7, exaltD:20, debil:1, debilD:20, mool:11,moolF:0,  moolT:20, own:[10,11] },
};

function getPlanetDignity(planet, siderealDeg) {
  const d   = DIGNITY_MAP[planet];
  if (!d) return 'shadow';
  const n   = norm(siderealDeg);
  const s   = Math.floor(n / 30) + 1;
  const deg = n % 30;
  if (s === d.exalt)                                          return 'Exaltation (उच्च)';
  if (s === d.debil)                                          return 'Debilitation (नीच)';
  if (s === d.mool && deg >= d.moolF && deg <= d.moolT)      return 'Moolatrikona (मूलत्रिकोण)';
  if (d.own.includes(s))                                      return 'Own Sign (स्वगृह)';
  return 'Neutral';
}

// ─── Vimshottari Dasha ───────────────────────────────────────────────────────
const DASHA_SEQ = [
  { lord:'Ketu',    years:7  },
  { lord:'Venus',   years:20 },
  { lord:'Sun',     years:6  },
  { lord:'Moon',    years:10 },
  { lord:'Mars',    years:7  },
  { lord:'Rahu',    years:18 },
  { lord:'Jupiter', years:16 },
  { lord:'Saturn',  years:19 },
  { lord:'Mercury', years:17 },
];
const LORD_IDX = { Ketu:0, Venus:1, Sun:2, Moon:3, Mars:4, Rahu:5, Jupiter:6, Saturn:7, Mercury:8 };

function vimshottariDasha(siderealMoonDeg, birthDate) {
  const nak  = nakshatraFromDeg(siderealMoonDeg);
  const idx0 = LORD_IDX[nak.lord];

  // Fraction of current nakshatra already elapsed at birth
  const fracDone    = nak.degree_in_nakshatra / NAK_SPAN;
  const curDasha    = DASHA_SEQ[idx0];
  const balanceYrs  = (1 - fracDone) * curDasha.years;

  const addYears = (d, yrs) => {
    const ms = d.getTime() + yrs * 365.25 * 24 * 3600 * 1000;
    return new Date(ms);
  };

  const periods = [];
  let cursor = new Date(birthDate);

  // First period — balance
  const end0 = addYears(cursor, balanceYrs);
  periods.push({
    lord:       curDasha.lord,
    full_years: curDasha.years,
    balance:    +balanceYrs.toFixed(2),
    start:      cursor.toISOString().slice(0, 10),
    end:        end0.toISOString().slice(0, 10),
    is_current: true,
  });
  cursor = end0;

  // Subsequent 8 dashas
  for (let i = 1; i <= 8; i++) {
    const d   = DASHA_SEQ[(idx0 + i) % 9];
    const end = addYears(cursor, d.years);
    periods.push({
      lord:       d.lord,
      full_years: d.years,
      balance:    d.years,
      start:      cursor.toISOString().slice(0, 10),
      end:        end.toISOString().slice(0, 10),
      is_current: false,
    });
    cursor = end;
  }

  return periods;
}

// ─── DMS formatter ───────────────────────────────────────────────────────────
function toDMS(deg) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round(((deg - d) * 60 - m) * 60);
  return `${d}°${String(m).padStart(2,'0')}'${String(s).padStart(2,'0')}"`;
}

// ─── Main chart calculation ───────────────────────────────────────────────────
/**
 * Calculate a complete Vedic horoscope.
 * @param {object} p – birth parameters
 * @param {number} p.year        – Gregorian year
 * @param {number} p.month       – 1–12
 * @param {number} p.day         – 1–31
 * @param {number} p.hour        – local hour (0–23)
 * @param {number} p.minute      – 0–59
 * @param {number} p.second      – 0–59  (default 0)
 * @param {number} p.timezone    – UTC offset in decimal hours (IST = 5.5)
 * @param {number} p.latitude    – decimal degrees (N positive)
 * @param {number} p.longitude   – decimal degrees (E positive)
 */
function calculateVedicChart(p) {
  const { year, month, day, hour = 0, minute = 0, second = 0,
          timezone = 5.5, latitude, longitude } = p;

  // Convert local birth time → UTC using JS Date
  const localMs = Date.UTC(year, month - 1, day, hour, minute, second)
                  - timezone * 3600 * 1000;
  const ut = new Date(localMs);

  const JD = eph.julianDay(
    ut.getUTCFullYear(), ut.getUTCMonth() + 1, ut.getUTCDate(),
    ut.getUTCHours(),    ut.getUTCMinutes(),    ut.getUTCSeconds()
  );

  // ── Tropical positions ──
  const trop = {
    Sun:     eph.sunTropicalLongitude(JD),
    Moon:    eph.moonTropicalLongitude(JD),
    Mars:    eph.planetTropicalLongitude('mars',    JD),
    Mercury: eph.planetTropicalLongitude('mercury', JD),
    Jupiter: eph.planetTropicalLongitude('jupiter', JD),
    Venus:   eph.planetTropicalLongitude('venus',   JD),
    Saturn:  eph.planetTropicalLongitude('saturn',  JD),
    Rahu:    eph.rahuTropicalLongitude(JD),
    Ketu:    norm(eph.rahuTropicalLongitude(JD) + 180),
  };
  const tropAsc = eph.tropicalAscendant(JD, latitude, longitude);

  // ── Ayanamsa & Sidereal conversion ──
  const ayanamsa = lahiriAyanamsa(JD);
  const sid = Object.fromEntries(
    Object.entries(trop).map(([k, v]) => [k, toSidereal(v, JD)])
  );
  const sidAsc = toSidereal(tropAsc, JD);

  // ── Planet details ──
  const planetDetails = {};
  for (const [name, lon] of Object.entries(sid)) {
    const rashi = rashiFromDeg(lon);
    planetDetails[name] = {
      longitude:         +lon.toFixed(4),
      longitude_dms:     toDMS(lon),
      rashi_num:         rashi.num,
      rashi_en:          rashi.en,
      rashi_hi:          rashi.hi,
      rashi_symbol:      rashi.symbol,
      rashi_lord:        rashi.lord,
      degree_in_sign:    +rashi.degreeInSign.toFixed(4),
      degree_in_sign_dms:toDMS(rashi.degreeInSign),
      dignity:           getPlanetDignity(name, lon),
      is_retrograde:     false,   // TODO: compute from previous day position
    };
  }

  // ── Ascendant rashi ──
  const ascRashi = rashiFromDeg(sidAsc);

  // ── Nakshatra from Moon ──
  const nakshatra = nakshatraFromDeg(sid.Moon);

  // ── Whole-sign houses ──
  const houses = {};
  for (let h = 1; h <= 12; h++) {
    const signIdx  = ((ascRashi.num - 1 + h - 1) % 12);
    const rashi    = RASHIS[signIdx];
    const planetsIn = Object.entries(planetDetails)
      .filter(([, pd]) => pd.rashi_num === rashi.num)
      .map(([n]) => n);
    houses[h] = {
      house_num:   h,
      rashi_num:   rashi.num,
      rashi_en:    rashi.en,
      rashi_hi:    rashi.hi,
      rashi_lord:  rashi.lord,
      planets:     planetsIn,
    };
  }

  // ── Dasha ──
  const birthDate = new Date(year, month - 1, day, hour, minute, second);
  const dasha = vimshottariDasha(sid.Moon, birthDate);

  return {
    meta: {
      julian_day:      +JD.toFixed(5),
      ayanamsa:        +ayanamsa.toFixed(6),
      ayanamsa_dms:    toDMS(ayanamsa),
      system:          'Lahiri (Chitra-paksha)',
      calculation:     'Meeus Astronomical Algorithms 2nd Ed.',
      accuracy:        'Sun ~0.01°, Moon ~0.1°, Planets ~0.5–2°',
    },
    ascendant: {
      longitude:          +sidAsc.toFixed(4),
      longitude_dms:      toDMS(sidAsc),
      rashi_num:          ascRashi.num,
      rashi_en:           ascRashi.en,
      rashi_hi:           ascRashi.hi,
      rashi_symbol:       ascRashi.symbol,
      rashi_lord:         ascRashi.lord,
      degree_in_sign:     +ascRashi.degreeInSign.toFixed(4),
      degree_in_sign_dms: toDMS(ascRashi.degreeInSign),
    },
    planets:   planetDetails,
    nakshatra,
    houses,
    dasha,
  };
}

module.exports = {
  calculateVedicChart,
  lahiriAyanamsa,
  rashiFromDeg,
  nakshatraFromDeg,
  vimshottariDasha,
  getPlanetDignity,
  RASHIS,
  NAKSHATRAS,
  toDMS,
};
