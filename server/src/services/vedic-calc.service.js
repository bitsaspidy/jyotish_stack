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
const { VARGA_DEFINITIONS } = require('../data/varga-reference');
const norm = eph.norm;
const VARGA_BY_DIVISION = new Map(VARGA_DEFINITIONS.map((item) => [item.division, item]));
const SUPPORTED_VARGA_DIVISIONS = VARGA_DEFINITIONS.map((item) => item.division);

// ─── Lahiri Ayanamsa ─────────────────────────────────────────────────────────
// Reference: 23° 51' 11.4" at J2000.0; annual precession ~50.2796"
function lahiriAyanamsa(JD) {
  const yearsFromJ2000 = (JD - 2451545.0) / 365.25;
  return 23.85317 + (50.2796 / 3600) * yearsFromJ2000;
}

function toSidereal(tropDeg, JD) {
  return norm(tropDeg - lahiriAyanamsa(JD));
}

function tropicalLongitudeForPlanet(name, JD) {
  switch (name) {
    case 'Sun':
      return eph.sunTropicalLongitude(JD);
    case 'Moon':
      return eph.moonTropicalLongitude(JD);
    case 'Rahu':
      return eph.rahuTropicalLongitude(JD);
    case 'Ketu':
      return norm(eph.rahuTropicalLongitude(JD) + 180);
    case 'Mars':
    case 'Mercury':
    case 'Jupiter':
    case 'Venus':
    case 'Saturn':
      return eph.planetTropicalLongitude(name.toLowerCase(), JD);
    default:
      throw new Error(`Unsupported planet: ${name}`);
  }
}

function siderealLongitudeForPlanet(name, JD) {
  return toSidereal(tropicalLongitudeForPlanet(name, JD), JD);
}

function signedAngleDelta(fromDeg, toDeg) {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

function dailyMotionForPlanet(name, JD) {
  const previous = siderealLongitudeForPlanet(name, JD - 0.5);
  const next = siderealLongitudeForPlanet(name, JD + 0.5);
  return signedAngleDelta(previous, next);
}

function isRetrogradePlanet(name, JD) {
  if (name === 'Sun' || name === 'Moon') return false;
  return dailyMotionForPlanet(name, JD) < -0.00001;
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
// Source: AstroAnsh Class 8 — Nakshatra Table Sheet.pdf
// Gandmool nakshatras (6): Ketu's 3 (1,10,19) + Mercury's 3 (9,18,27)
const NAKSHATRAS = [
  { num:1,  en:'Ashwini',          hi:'अश्विनी',          lord:'Ketu',    years:7,  deity_en:'Ashwini Kumars',     deity_hi:'अश्विनी कुमार',    is_gandmool:true  },
  { num:2,  en:'Bharani',          hi:'भरणी',             lord:'Venus',   years:20, deity_en:'Yama',               deity_hi:'यम',               is_gandmool:false },
  { num:3,  en:'Krittika',         hi:'कृत्तिका',         lord:'Sun',     years:6,  deity_en:'Agni',               deity_hi:'अग्नि',            is_gandmool:false },
  { num:4,  en:'Rohini',           hi:'रोहिणी',           lord:'Moon',    years:10, deity_en:'Brahma',             deity_hi:'ब्रह्मा',          is_gandmool:false },
  { num:5,  en:'Mrigashira',       hi:'मृगशीर्षा',        lord:'Mars',    years:7,  deity_en:'Soma / Chandra',     deity_hi:'सोम / चंद्र',      is_gandmool:false },
  { num:6,  en:'Ardra',            hi:'आर्द्रा',           lord:'Rahu',    years:18, deity_en:'Rudra',              deity_hi:'रुद्र',            is_gandmool:false },
  { num:7,  en:'Punarvasu',        hi:'पुनर्वसु',          lord:'Jupiter', years:16, deity_en:'Aditi',              deity_hi:'अदिति',            is_gandmool:false },
  { num:8,  en:'Pushya',           hi:'पुष्य',             lord:'Saturn',  years:19, deity_en:'Brihaspati',         deity_hi:'बृहस्पति',         is_gandmool:false },
  { num:9,  en:'Ashlesha',         hi:'आश्लेषा',           lord:'Mercury', years:17, deity_en:'Nagas',              deity_hi:'नाग',              is_gandmool:true  },
  { num:10, en:'Magha',            hi:'मघा',               lord:'Ketu',    years:7,  deity_en:'Pitris (Ancestors)', deity_hi:'पितृ',             is_gandmool:true  },
  { num:11, en:'Purva Phalguni',   hi:'पूर्वा फाल्गुनी',   lord:'Venus',   years:20, deity_en:'Bhaga',              deity_hi:'भग',               is_gandmool:false },
  { num:12, en:'Uttara Phalguni',  hi:'उत्तरा फाल्गुनी',   lord:'Sun',     years:6,  deity_en:'Aryaman',            deity_hi:'अर्यमन',           is_gandmool:false },
  { num:13, en:'Hasta',            hi:'हस्त',              lord:'Moon',    years:10, deity_en:'Savitar',            deity_hi:'सवितार',           is_gandmool:false },
  { num:14, en:'Chitra',           hi:'चित्रा',            lord:'Mars',    years:7,  deity_en:'Tvashtar / Vishwakarma', deity_hi:'त्वष्टा / विश्वकर्मा', is_gandmool:false },
  { num:15, en:'Swati',            hi:'स्वाती',            lord:'Rahu',    years:18, deity_en:'Vayu',               deity_hi:'वायु',             is_gandmool:false },
  { num:16, en:'Vishakha',         hi:'विशाखा',            lord:'Jupiter', years:16, deity_en:'Indra & Agni',       deity_hi:'इंद्र और अग्नि',   is_gandmool:false },
  { num:17, en:'Anuradha',         hi:'अनुराधा',           lord:'Saturn',  years:19, deity_en:'Mitra',              deity_hi:'मित्र',            is_gandmool:false },
  { num:18, en:'Jyeshtha',         hi:'ज्येष्ठा',          lord:'Mercury', years:17, deity_en:'Indra',              deity_hi:'इंद्र',            is_gandmool:true  },
  { num:19, en:'Mula',             hi:'मूल',               lord:'Ketu',    years:7,  deity_en:'Nirriti',            deity_hi:'निर्ऋति',          is_gandmool:true  },
  { num:20, en:'Purva Ashadha',    hi:'पूर्वाषाढ़ा',       lord:'Venus',   years:20, deity_en:'Apas (Water)',       deity_hi:'आपः / जल',         is_gandmool:false },
  { num:21, en:'Uttara Ashadha',   hi:'उत्तराषाढ़ा',       lord:'Sun',     years:6,  deity_en:'Vishwadeva',         deity_hi:'विश्वदेव',         is_gandmool:false },
  { num:22, en:'Shravana',         hi:'श्रवण',             lord:'Moon',    years:10, deity_en:'Vishnu',             deity_hi:'विष्णु',           is_gandmool:false },
  { num:23, en:'Dhanishtha',       hi:'धनिष्ठा',           lord:'Mars',    years:7,  deity_en:'Vasus',              deity_hi:'वसु',              is_gandmool:false },
  { num:24, en:'Shatabhisha',      hi:'शतभिषा',            lord:'Rahu',    years:18, deity_en:'Varuna',             deity_hi:'वरुण',             is_gandmool:false },
  { num:25, en:'Purva Bhadrapada', hi:'पूर्वा भाद्रपद',    lord:'Jupiter', years:16, deity_en:'Aja Ekapada',        deity_hi:'अज एकपाद',         is_gandmool:false },
  { num:26, en:'Uttara Bhadrapada',hi:'उत्तरा भाद्रपद',    lord:'Saturn',  years:19, deity_en:'Ahirbudhnya',        deity_hi:'अहिर्बुध्न्य',     is_gandmool:false },
  { num:27, en:'Revati',           hi:'रेवती',             lord:'Mercury', years:17, deity_en:'Pushan',             deity_hi:'पूषन',             is_gandmool:true  },
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

function houseFromSign(referenceSignNum, targetSignNum) {
  return ((targetSignNum - referenceSignNum + 12) % 12) + 1;
}

function wrapSign(signNum, offset = 0) {
  return ((signNum - 1 + offset) % 12) + 1;
}

function rashiSummary(signNum) {
  const rashi = RASHIS[signNum - 1];
  return {
    rashi_num: rashi.num,
    rashi_en: rashi.en,
    rashi_hi: rashi.hi,
    rashi_symbol: rashi.symbol,
    rashi_lord: rashi.lord,
  };
}

function startSignByQuality(quality, starts) {
  if (quality === 'Cardinal') return starts.cardinal;
  if (quality === 'Fixed') return starts.fixed;
  return starts.mutable;
}

function startSignByElement(element) {
  if (element === 'Fire') return 1;
  if (element === 'Earth') return 4;
  if (element === 'Air') return 7;
  return 10;
}

function trimshamshaFromDegree(signNum, degreeInSign) {
  const sections = signNum % 2 === 1
    ? [
        { limit: 5,  sign: 1,  lord: 'Mars' },
        { limit: 10, sign: 11, lord: 'Saturn' },
        { limit: 18, sign: 9,  lord: 'Jupiter' },
        { limit: 25, sign: 3,  lord: 'Mercury' },
        { limit: 30, sign: 7,  lord: 'Venus' },
      ]
    : [
        { limit: 5,  sign: 2,  lord: 'Venus' },
        { limit: 12, sign: 6,  lord: 'Mercury' },
        { limit: 20, sign: 12, lord: 'Jupiter' },
        { limit: 25, sign: 10, lord: 'Saturn' },
        { limit: 30, sign: 8,  lord: 'Mars' },
      ];
  const index = sections.findIndex((section) => degreeInSign < section.limit);
  const sectionIndex = index === -1 ? sections.length - 1 : index;
  return { ...sections[sectionIndex], part: sectionIndex + 1 };
}

function vargaPlacementFromDeg(siderealDeg, division) {
  if (!SUPPORTED_VARGA_DIVISIONS.includes(division)) {
    throw new Error(`Unsupported Varga division: D${division}`);
  }

  const source = rashiFromDeg(siderealDeg);
  const degreeInSign = source.degreeInSign;
  const definition = VARGA_BY_DIVISION.get(division);
  let part = 1;
  let targetSignNum = source.num;
  let sectionLord = null;
  let degreeInPart = degreeInSign;

  if (division === 1) {
    part = 1;
  } else if (division === 30) {
    const section = trimshamshaFromDegree(source.num, degreeInSign);
    part = section.part;
    targetSignNum = section.sign;
    sectionLord = section.lord;
    const previousLimit = part === 1
      ? 0
      : (source.num % 2 === 1 ? [5, 10, 18, 25] : [5, 12, 20, 25])[part - 2];
    degreeInPart = degreeInSign - previousLimit;
  } else {
    const partSize = 30 / division;
    const partIndex = Math.min(division - 1, Math.floor(degreeInSign / partSize));
    part = partIndex + 1;
    degreeInPart = degreeInSign - partIndex * partSize;

    switch (division) {
      case 2:
        targetSignNum = source.num % 2 === 1
          ? (partIndex === 0 ? 5 : 4)
          : (partIndex === 0 ? 4 : 5);
        break;
      case 3:
        targetSignNum = wrapSign(source.num, partIndex * 4);
        break;
      case 4:
        targetSignNum = wrapSign(source.num, partIndex * 3);
        break;
      case 7: {
        const start = source.num % 2 === 1 ? source.num : wrapSign(source.num, 6);
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 9: {
        const startOffset = source.quality === 'Cardinal' ? 0 : source.quality === 'Fixed' ? 8 : 4;
        targetSignNum = wrapSign(source.num, startOffset + partIndex);
        break;
      }
      case 10: {
        const start = source.num % 2 === 1 ? source.num : wrapSign(source.num, 8);
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 12:
        targetSignNum = wrapSign(source.num, partIndex);
        break;
      case 16: {
        const start = startSignByQuality(source.quality, { cardinal: 1, fixed: 5, mutable: 9 });
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 20: {
        const start = startSignByQuality(source.quality, { cardinal: 1, fixed: 9, mutable: 5 });
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 24: {
        const start = source.num % 2 === 1 ? 5 : 4;
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 27: {
        const start = startSignByElement(source.element);
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 40: {
        const start = source.num % 2 === 1 ? 1 : 7;
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 45: {
        const start = startSignByQuality(source.quality, { cardinal: 1, fixed: 5, mutable: 9 });
        targetSignNum = wrapSign(start, partIndex);
        break;
      }
      case 60:
      default:
        targetSignNum = wrapSign(source.num, partIndex);
        break;
    }
  }

  return {
    division,
    code: definition?.code || `D${division}`,
    name_en: definition?.name_en || `D${division}`,
    varga_part: part,
    section_lord: sectionLord,
    ...rashiSummary(targetSignNum),
    source_rashi_num: source.num,
    source_rashi_en: source.en,
    source_rashi_hi: source.hi,
    source_degree_in_sign: +degreeInSign.toFixed(4),
    degree_in_part: +degreeInPart.toFixed(4),
    calculation_rule: definition?.calculation_rule || null,
  };
}

function navamshaFromDeg(siderealDeg) {
  const placement = vargaPlacementFromDeg(siderealDeg, 9);
  return {
    ...placement,
    navamsha_part: placement.varga_part,
  };
}

function buildWholeSignHouses(ascendantSignNum, planetsBySign) {
  const houses = {};
  for (let h = 1; h <= 12; h++) {
    const signIdx = (ascendantSignNum - 1 + h - 1) % 12;
    const rashi = RASHIS[signIdx];
    const planets = Object.entries(planetsBySign)
      .filter(([, pd]) => pd.rashi_num === rashi.num)
      .map(([name]) => name);

    houses[h] = {
      house_num: h,
      rashi_num: rashi.num,
      rashi_en: rashi.en,
      rashi_hi: rashi.hi,
      rashi_lord: rashi.lord,
      planets,
    };
  }
  return houses;
}

function calculateVargaChart(division, ascendant, planets) {
  const definition = VARGA_BY_DIVISION.get(division);
  const vargaAsc = division === 1
    ? { ...ascendant, division, code: 'D1', name_en: 'Lagna / Birth Chart', varga_part: 1 }
    : {
        ...vargaPlacementFromDeg(ascendant.longitude, division),
        longitude: ascendant.longitude,
        longitude_dms: ascendant.longitude_dms,
      };
  const vargaPlanets = {};

  for (const [name, pd] of Object.entries(planets)) {
    if (division === 1) {
      vargaPlanets[name] = { ...pd, division, code: 'D1', varga_part: 1 };
      continue;
    }

    const placement = vargaPlacementFromDeg(pd.longitude, division);
    vargaPlanets[name] = {
      ...placement,
      longitude: pd.longitude,
      source_longitude: pd.longitude,
      source_longitude_dms: pd.longitude_dms,
      source_degree_in_sign_dms: pd.degree_in_sign_dms,
      dignity: pd.dignity,
      is_retrograde: pd.is_retrograde,
    };
    if (division === 9) {
      vargaPlanets[name].navamsha_part = placement.varga_part;
    }
  }

  if (division === 9) {
    vargaAsc.navamsha_part = vargaAsc.varga_part;
  }

  return {
    code: definition?.code || `D${division}`,
    division,
    name_en: definition?.name_en || `D${division}`,
    name_sanskrit: definition?.name_sanskrit || null,
    primary_domain: definition?.primary_domain || null,
    calculation_rule: definition?.calculation_rule || null,
    precision_note: definition?.precision_note || null,
    ascendant: vargaAsc,
    planets: vargaPlanets,
    houses: buildWholeSignHouses(vargaAsc.rashi_num, vargaPlanets),
  };
}

function calculateNavamshaChart(ascendant, planets) {
  return calculateVargaChart(9, ascendant, planets);
}

function calculateAllVargaCharts(ascendant, planets) {
  return Object.fromEntries(
    SUPPORTED_VARGA_DIVISIONS.map((division) => {
      const definition = VARGA_BY_DIVISION.get(division);
      return [definition.key, calculateVargaChart(division, ascendant, planets)];
    })
  );
}

function analyzeMangalDosha(chart) {
  const mars = chart.planets?.Mars;
  if (!mars) {
    return { has_dosha: false, severity: 'none', score: 0, checks: [], cancellations: [], summary_en: 'Mars data unavailable.' };
  }

  const doshaHouses = [1, 4, 7, 8, 12];
  const checks = [
    { basis: 'Lagna', house: houseFromSign(chart.ascendant.rashi_num, mars.rashi_num) },
    { basis: 'Moon', house: houseFromSign(chart.planets.Moon.rashi_num, mars.rashi_num) },
    { basis: 'Venus', house: houseFromSign(chart.planets.Venus.rashi_num, mars.rashi_num) },
  ].map((check) => ({ ...check, has_dosha: doshaHouses.includes(check.house) }));

  const active = checks.filter((check) => check.has_dosha);
  const cancellations = [];
  if ([1, 8, 10].includes(mars.rashi_num)) {
    cancellations.push('Mars is in own sign or exalted sign, reducing dosha strength.');
  }
  if (mars.dignity?.startsWith('Exaltation') || mars.dignity?.startsWith('Own Sign')) {
    cancellations.push('Mars dignity is strong, reducing harmful expression.');
  }

  let severity = 'none';
  if (active.length === 1) severity = 'mild';
  if (active.length === 2) severity = 'moderate';
  if (active.length >= 3) severity = 'strong';
  if (active.length && cancellations.length) severity = severity === 'strong' ? 'moderate' : 'mild';

  return {
    has_dosha: active.length > 0,
    severity,
    score: Math.max(0, active.length * 2 - cancellations.length),
    checked_houses: doshaHouses,
    checks,
    cancellations,
    summary_en: active.length
      ? `Mangal Dosha is indicated from ${active.map((c) => `${c.basis} H${c.house}`).join(', ')}. Severity: ${severity}.`
      : 'No classical Mangal Dosha is indicated from Lagna, Moon, or Venus.',
    summary_hi: active.length
      ? `Mangal Dosha ${active.map((c) => `${c.basis} bhav ${c.house}`).join(', ')} se dikhta hai. Prabhav: ${severity}.`
      : 'Lagna, Chandra aur Shukra se samanya Mangal Dosha nahi dikhta.',
  };
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

function legacyVimshottariDasha(siderealMoonDeg, birthDate) {
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

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function addYears(d, yrs) {
  return new Date(d.getTime() + yrs * 365.25 * 24 * 3600 * 1000);
}

function buildAntardasha(mahadasha, currentDate = new Date()) {
  const startDate = new Date(mahadasha.start);
  const endDate = new Date(mahadasha.end);
  const totalMs = endDate.getTime() - startDate.getTime();
  const idx0 = LORD_IDX[mahadasha.lord];
  const periods = [];
  let cursor = startDate;

  for (let i = 0; i < 9; i++) {
    const d = DASHA_SEQ[(idx0 + i) % 9];
    const durationMs = totalMs * (d.years / 120);
    const end = i === 8 ? endDate : new Date(cursor.getTime() + durationMs);
    periods.push({
      lord: d.lord,
      start: formatDate(cursor),
      end: formatDate(end),
      is_current: currentDate >= cursor && currentDate < end,
    });
    cursor = end;
  }

  return periods;
}

function vimshottariDasha(siderealMoonDeg, birthDate, currentDate = new Date()) {
  const nak = nakshatraFromDeg(siderealMoonDeg);
  const idx0 = LORD_IDX[nak.lord];
  const fracDone = nak.degree_in_nakshatra / NAK_SPAN;
  const curDasha = DASHA_SEQ[idx0];
  const balanceYrs = (1 - fracDone) * curDasha.years;

  const periods = [];
  let cursor = new Date(birthDate);

  const end0 = addYears(cursor, balanceYrs);
  periods.push({
    lord: curDasha.lord,
    full_years: curDasha.years,
    balance: +balanceYrs.toFixed(2),
    start: formatDate(cursor),
    end: formatDate(end0),
    is_current: currentDate >= cursor && currentDate < end0,
    is_birth_balance: true,
  });
  cursor = end0;

  for (let i = 1; i <= 8; i++) {
    const d = DASHA_SEQ[(idx0 + i) % 9];
    const end = addYears(cursor, d.years);
    periods.push({
      lord: d.lord,
      full_years: d.years,
      balance: d.years,
      start: formatDate(cursor),
      end: formatDate(end),
      is_current: currentDate >= cursor && currentDate < end,
      is_birth_balance: false,
    });
    cursor = end;
  }

  return periods.map((period) => ({
    ...period,
    antardasha: buildAntardasha(period, currentDate),
  }));
}

// ─── DMS formatter ───────────────────────────────────────────────────────────
const NAK_EXTRA = [
  null,
  { gana:'deva',     nadi:'adi',    yoni:'horse' },
  { gana:'manushya', nadi:'madhya', yoni:'elephant' },
  { gana:'rakshasa', nadi:'antya',  yoni:'sheep' },
  { gana:'manushya', nadi:'antya',  yoni:'serpent' },
  { gana:'deva',     nadi:'madhya', yoni:'serpent' },
  { gana:'manushya', nadi:'adi',    yoni:'dog' },
  { gana:'deva',     nadi:'adi',    yoni:'cat' },
  { gana:'deva',     nadi:'madhya', yoni:'sheep' },
  { gana:'rakshasa', nadi:'antya',  yoni:'cat' },
  { gana:'rakshasa', nadi:'antya',  yoni:'rat' },
  { gana:'manushya', nadi:'madhya', yoni:'rat' },
  { gana:'manushya', nadi:'adi',    yoni:'cow' },
  { gana:'deva',     nadi:'adi',    yoni:'buffalo' },
  { gana:'rakshasa', nadi:'madhya', yoni:'tiger' },
  { gana:'deva',     nadi:'antya',  yoni:'buffalo' },
  { gana:'rakshasa', nadi:'antya',  yoni:'tiger' },
  { gana:'deva',     nadi:'madhya', yoni:'deer' },
  { gana:'rakshasa', nadi:'adi',    yoni:'deer' },
  { gana:'rakshasa', nadi:'adi',    yoni:'dog' },
  { gana:'manushya', nadi:'madhya', yoni:'monkey' },
  { gana:'manushya', nadi:'antya',  yoni:'mongoose' },
  { gana:'deva',     nadi:'antya',  yoni:'monkey' },
  { gana:'rakshasa', nadi:'madhya', yoni:'lion' },
  { gana:'rakshasa', nadi:'adi',    yoni:'horse' },
  { gana:'manushya', nadi:'adi',    yoni:'lion' },
  { gana:'manushya', nadi:'madhya', yoni:'cow' },
  { gana:'deva',     nadi:'antya',  yoni:'elephant' },
];

const NATURAL_FRIENDS = {
  Sun:     { friends:['Moon','Mars','Jupiter'], neutral:['Mercury'], enemies:['Venus','Saturn'] },
  Moon:    { friends:['Sun','Mercury'], neutral:['Mars','Jupiter','Venus','Saturn'], enemies:[] },
  Mars:    { friends:['Sun','Moon','Jupiter'], neutral:['Venus','Saturn'], enemies:['Mercury'] },
  Mercury: { friends:['Sun','Venus'], neutral:['Mars','Jupiter','Saturn'], enemies:['Moon'] },
  Jupiter: { friends:['Sun','Moon','Mars'], neutral:['Saturn'], enemies:['Mercury','Venus'] },
  Venus:   { friends:['Mercury','Saturn'], neutral:['Mars','Jupiter'], enemies:['Sun','Moon'] },
  Saturn:  { friends:['Mercury','Venus'], neutral:['Jupiter'], enemies:['Sun','Moon','Mars'] },
};

function nakExtra(nakNum) {
  return NAK_EXTRA[nakNum] || { gana:'unknown', nadi:'unknown', yoni:'unknown' };
}

function inclusiveNakDistance(fromNum, toNum) {
  return ((toNum - fromNum + 27) % 27) + 1;
}

function varnaForRashi(signNum) {
  if ([4, 8, 12].includes(signNum)) return { name:'Brahmin', rank:4 };
  if ([1, 5, 9].includes(signNum)) return { name:'Kshatriya', rank:3 };
  if ([2, 6, 10].includes(signNum)) return { name:'Vaishya', rank:2 };
  return { name:'Shudra', rank:1 };
}

function vashyaForRashi(signNum) {
  if ([1, 2, 9, 10].includes(signNum)) return 'chatushpada';
  if ([3, 6, 7, 11].includes(signNum)) return 'manava';
  if ([4, 12].includes(signNum)) return 'jalachara';
  if (signNum === 5) return 'vanachara';
  return 'keeta';
}

function relationScore(lordA, lordB) {
  if (lordA === lordB) return 5;
  const a = NATURAL_FRIENDS[lordA];
  const b = NATURAL_FRIENDS[lordB];
  if (!a || !b) return 2.5;
  const aFriend = a.friends.includes(lordB);
  const bFriend = b.friends.includes(lordA);
  const aEnemy = a.enemies.includes(lordB);
  const bEnemy = b.enemies.includes(lordA);
  if (aFriend && bFriend) return 5;
  if (aEnemy || bEnemy) return 0;
  if (aFriend || bFriend) return 4;
  return 3;
}

function calculateAshtakoot(boyChart, girlChart) {
  const boyMoon = boyChart.planets.Moon;
  const girlMoon = girlChart.planets.Moon;
  const boyNak = boyChart.nakshatra;
  const girlNak = girlChart.nakshatra;
  const boyExtra = nakExtra(boyNak.num);
  const girlExtra = nakExtra(girlNak.num);
  const boyVarna = varnaForRashi(boyMoon.rashi_num);
  const girlVarna = varnaForRashi(girlMoon.rashi_num);
  const varna = boyVarna.rank >= girlVarna.rank ? 1 : 0;
  const boyVashya = vashyaForRashi(boyMoon.rashi_num);
  const girlVashya = vashyaForRashi(girlMoon.rashi_num);
  const vashya = boyVashya === girlVashya ? 2 : 1;
  const taraBoyToGirl = inclusiveNakDistance(boyNak.num, girlNak.num) % 9;
  const taraGirlToBoy = inclusiveNakDistance(girlNak.num, boyNak.num) % 9;
  const goodTara = (n) => [0, 2, 4, 6, 8].includes(n);
  const tara = (goodTara(taraBoyToGirl) ? 1.5 : 0) + (goodTara(taraGirlToBoy) ? 1.5 : 0);
  const enemyYoni = new Set(['cat:rat','rat:cat','serpent:mongoose','mongoose:serpent','dog:deer','deer:dog','cow:tiger','tiger:cow','elephant:lion','lion:elephant','horse:buffalo','buffalo:horse']);
  const yoniKey = `${boyExtra.yoni}:${girlExtra.yoni}`;
  const yoni = boyExtra.yoni === girlExtra.yoni ? 4 : enemyYoni.has(yoniKey) ? 0 : 2;
  const graha = relationScore(boyMoon.rashi_lord, girlMoon.rashi_lord);
  let gana = 0;
  if (boyExtra.gana === girlExtra.gana) gana = 6;
  else if ([boyExtra.gana, girlExtra.gana].includes('rakshasa') && [boyExtra.gana, girlExtra.gana].includes('deva')) gana = 0;
  else if ([boyExtra.gana, girlExtra.gana].includes('rakshasa')) gana = 1;
  else gana = 5;
  const boyToGirlSign = houseFromSign(boyMoon.rashi_num, girlMoon.rashi_num);
  const girlToBoySign = houseFromSign(girlMoon.rashi_num, boyMoon.rashi_num);
  const badBhakootPairs = new Set(['2:12','12:2','5:9','9:5','6:8','8:6']);
  const bhakoot = badBhakootPairs.has(`${boyToGirlSign}:${girlToBoySign}`) ? 0 : 7;
  const nadi = boyExtra.nadi === girlExtra.nadi ? 0 : 8;
  const kootas = [
    { name:'Varna', score:varna, max:1, details:`${boyVarna.name} / ${girlVarna.name}` },
    { name:'Vashya', score:vashya, max:2, details:`${boyVashya} / ${girlVashya}` },
    { name:'Tara', score:tara, max:3, details:`Tara remainders ${taraBoyToGirl}, ${taraGirlToBoy}` },
    { name:'Yoni', score:yoni, max:4, details:`${boyExtra.yoni} / ${girlExtra.yoni}` },
    { name:'Graha Maitri', score:graha, max:5, details:`${boyMoon.rashi_lord} / ${girlMoon.rashi_lord}` },
    { name:'Gana', score:gana, max:6, details:`${boyExtra.gana} / ${girlExtra.gana}` },
    { name:'Bhakoot', score:bhakoot, max:7, details:`${boyToGirlSign}/${girlToBoySign}` },
    { name:'Nadi', score:nadi, max:8, details:`${boyExtra.nadi} / ${girlExtra.nadi}` },
  ];
  const total = +kootas.reduce((sum, k) => sum + k.score, 0).toFixed(2);
  const mangal = {
    boy: boyChart.mangal_dosha || analyzeMangalDosha(boyChart),
    girl: girlChart.mangal_dosha || analyzeMangalDosha(girlChart),
  };
  const mangalCompatible = mangal.boy.has_dosha === mangal.girl.has_dosha || mangal.boy.severity === mangal.girl.severity;
  return {
    system: 'Ashtakoot Guna Milan',
    note: 'Rule-based classical implementation with simplified yoni/vashya compatibility tables. Verify against an approved Panchang before production decisions.',
    total,
    max: 36,
    percentage: +((total / 36) * 100).toFixed(1),
    verdict: total >= 28 ? 'excellent' : total >= 22 ? 'good' : total >= 18 ? 'average' : 'caution',
    kootas,
    mangal,
    mangal_compatible: mangalCompatible,
    summary_en: `Guna score is ${total}/36 (${total >= 18 ? 'generally acceptable' : 'needs careful review'}). Mangal compatibility: ${mangalCompatible ? 'balanced' : 'requires remedies or expert review'}.`,
  };
}

function calculateTransitSummary(natalChart, p, atDate = new Date()) {
  const JD = eph.julianDay(
    atDate.getUTCFullYear(), atDate.getUTCMonth() + 1, atDate.getUTCDate(),
    atDate.getUTCHours(), atDate.getUTCMinutes(), atDate.getUTCSeconds()
  );
  const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const planets = {};
  for (const name of planetNames) {
    const lon = siderealLongitudeForPlanet(name, JD);
    const rashi = rashiFromDeg(lon);
    planets[name] = {
      longitude: +lon.toFixed(4),
      rashi_num: rashi.num,
      rashi_en: rashi.en,
      rashi_hi: rashi.hi,
      house_from_lagna: houseFromSign(natalChart.ascendant.rashi_num, rashi.num),
      house_from_moon: houseFromSign(natalChart.planets.Moon.rashi_num, rashi.num),
      is_retrograde: isRetrogradePlanet(name, JD),
    };
  }
  const saturnMoonHouse = planets.Saturn.house_from_moon;
  const sadeSati = [12, 1, 2].includes(saturnMoonHouse);
  const jupiterFavorable = [2, 5, 7, 9, 11].includes(planets.Jupiter.house_from_moon);
  return {
    date: formatDate(atDate),
    julian_day: +JD.toFixed(5),
    planets,
    highlights: {
      sade_sati: {
        active: sadeSati,
        phase: saturnMoonHouse === 12 ? 'rising' : saturnMoonHouse === 1 ? 'peak' : saturnMoonHouse === 2 ? 'setting' : 'none',
        saturn_house_from_moon: saturnMoonHouse,
      },
      jupiter_support: {
        favorable: jupiterFavorable,
        house_from_moon: planets.Jupiter.house_from_moon,
      },
      rahu_ketu_axis: `${planets.Rahu.rashi_en}-${planets.Ketu.rashi_en}`,
    },
  };
}

// ─── Prediction Reference Data ────────────────────────────────────────────────

const LAGNA_PORTRAIT = {
  1:  { en: 'You are a natural pioneer with Aries Lagna, ruled by Mars. You carry fierce energy, raw courage, and an unstoppable drive to initiate. People around you sense your confidence before you even speak. You are at your best when there is a challenge to overcome or a new trail to blaze. Your weakness is impatience — you want things done immediately. The world needs your fire; balance it with wisdom and patience.' },
  2:  { en: 'Taurus Lagna, ruled by Venus, gives you a grounded, reliable, and deeply sensory nature. You build things that last — relationships, wealth, and reputation. You move steadily, and once your mind is set, very little can move you. You have a natural appreciation for beauty and the finer things in life. Your gift is persistence; your challenge is releasing stubborn attachment.' },
  3:  { en: 'With Gemini Lagna, ruled by Mercury, you are sharp, curious, and endlessly adaptable. Your mind connects ideas, people, and possibilities that others miss. You communicate naturally and can hold multiple perspectives at once. You thrive in variety and wither in monotony. Your challenge is scattered energy — depth requires slowing the restless mind and committing fully.' },
  4:  { en: 'Cancer Lagna, ruled by the Moon, makes you deeply intuitive, emotionally perceptive, and profoundly nurturing. You carry the world in your heart and feel things that words cannot reach. Home, family, and belonging are your anchors. Your sensitivity is your superpower, but it can cause you to absorb others\' pain. Learning to set emotional boundaries is your lifelong practice.' },
  5:  { en: 'Leo Lagna, ruled by the Sun, gives you a natural radiance that draws people in. You were born to lead, create, and inspire. There is a kingly quality to your presence — warm and generous when secure, proud when not. You need recognition because your soul genuinely wants to make an impact. Your challenge is the ego: when the self becomes too large, it blocks the very light you were born to share.' },
  6:  { en: 'Virgo Lagna, ruled by Mercury, makes you one of the most perceptive and service-oriented souls in the zodiac. You see the details others miss. Your analytical mind, love of order, and dedication to craft make you excellent in any precision field. You genuinely care about doing things right. Your growth edge: imperfection is not failure, and you too deserve rest and self-compassion.' },
  7:  { en: 'Libra Lagna, ruled by Venus, gives you a diplomatic, fair-minded, and relationship-oriented nature. You instinctively seek balance and harmony — in yourself, in relationships, and in the world around you. You work best in partnership. Your challenge is decision-making: the scales can tip endlessly without a strong inner anchor of conviction.' },
  8:  { en: 'Scorpio Lagna, ruled by Mars and Ketu, makes you one of the most intense, perceptive, and transformative souls alive. Nothing is surface-level for you — you sense what lies beneath every word and silence. You have an extraordinary capacity for regeneration: you destroy what no longer serves and rise stronger. Your challenge is trust; vulnerability is the path to your greatest power.' },
  9:  { en: 'Sagittarius Lagna, ruled by Jupiter, gives you an expansive, philosophical, and freedom-loving spirit. You see the big picture when others see only fragments. Truth, wisdom, and meaning are your north stars. You are generous and magnetic in your optimism. Your challenge is commitment: the horizon is always more exciting than the destination.' },
  10: { en: 'Capricorn Lagna, ruled by Saturn, gives you an extraordinary capacity for discipline, long-term vision, and patient achievement. You understand that real things take time, and you are willing to do the work. Authority and responsibility sit naturally with you. Your reputation is built slowly but endures. Your challenge: allow joy and playfulness into the serious architecture of your life.' },
  11: { en: 'Aquarius Lagna, ruled by Saturn and Rahu, makes you a visionary, humanitarian, and natural innovator. You think in systems, often ahead of your time, and may feel misunderstood — because you are seeing what others have not yet imagined. You care deeply about collective progress. Your challenge is connecting that grand vision to the human beings right in front of you.' },
  12: { en: 'Pisces Lagna, ruled by Jupiter and Ketu, gives you boundless compassion, deep intuition, and a natural connection to the unseen. You live in two worlds — the visible and the mystical. You feel music in silence, meaning in symbols, and the divine in ordinary moments. You are deeply creative and spiritually sensitive. Your challenge: grounding your gifts in the practical world.' },
};

const MOON_SIGN_PORTRAIT = {
  1:  { en: 'Your Moon in Aries makes your emotional world fiery and immediate. You feel and react quickly — sometimes before thinking. You need action as emotional release. When you are sad, moving helps. When you are happy, you want to share it right away. You heal through courage and initiative.' },
  2:  { en: 'Your Moon in Taurus gives you an emotional world rooted in comfort, beauty, and stability. You are calmed by nature, good food, music, and physical touch. You are deeply loyal once you trust someone, but change unsettles your inner landscape. Patience is your emotional superpower.' },
  3:  { en: 'Your Moon in Gemini makes your emotional world quick, curious, and communicative. You process feelings through conversation and ideas. Your mood can shift in moments — not from instability, but because your mind needs constant stimulation. Writing, talking, and connecting are how you heal.' },
  4:  { en: 'Your Moon in Cancer is in its own sign — you are emotionally rich, deeply intuitive, and powerfully connected to home and family. Your feelings run very deep even when your face shows composure. You need a safe sanctuary. When loved ones are well, you are well.' },
  5:  { en: 'Your Moon in Leo gives you a warm, expressive emotional nature. You feel with a big heart and want your feelings to matter. You are generous with affection and need appreciation in return. Creative expression — art, performance, or leadership — is how your emotional energy flows best.' },
  6:  { en: 'Your Moon in Virgo means you process emotions analytically — you think through your feelings before expressing them. You care deeply about being useful and doing things right. Anxiety can arise when things feel out of control. Serving others is genuinely healing for you.' },
  7:  { en: 'Your Moon in Libra creates an emotional world oriented around relationship, fairness, and beauty. You are most at peace in harmonious partnership. Conflict genuinely troubles you. You need beauty around you — in your space, your relationships, and your daily rhythms — to feel emotionally well.' },
  8:  { en: 'Your Moon in Scorpio gives you an intense, private emotional world. You feel everything deeply but share very little until you fully trust. You are drawn to the hidden and the transformative. You have extraordinary resilience — you have survived things that would break others, and emerged wiser.' },
  9:  { en: 'Your Moon in Sagittarius gives you an emotionally optimistic, free-spirited nature. You feel best when learning, traveling, or expanding your horizons. Your mood lifts when you see meaning in events. You cannot thrive in emotionally suffocating environments — freedom is your emotional oxygen.' },
  10: { en: 'Your Moon in Capricorn gives you a reserved, self-contained emotional world. You may feel more than you show. You find emotional security in achievement and structure — having a plan makes you feel safe. Learning to receive support, not just give it, is your growth edge.' },
  11: { en: 'Your Moon in Aquarius makes your emotional world intellectual, idealistic, and group-oriented. You care about humanity but may struggle with one-on-one emotional intimacy. You feel best when contributing to something larger than yourself. Friendship is as meaningful to you as romantic love.' },
  12: { en: 'Your Moon in Pisces gives you the most empathic, boundless emotional nature of all signs. You absorb the feelings of everyone around you — regularly clearing this energy is essential. You are deeply creative and spiritually attuned. Solitude, water, and music restore your soul.' },
};

const DASHA_LORD_MEANINGS = {
  Sun: {
    nature: 'Soul, authority, father, government, and vitality.',
    career_en: 'This is a period of authority and recognition. Careers in government, leadership, administration, and public life are highlighted. Your confidence shines — people see and respect your abilities. Work that puts you in a position of responsibility is strongly favored. Push forward on goals that require courage and visibility.',
    relationships_en: 'Your relationship with father figures, authorities, and mentors comes to the fore. You may feel a stronger need to express your individuality in relationships. The soul-level purpose of partnerships deepens. Be careful not to let ego create unnecessary distance with those you love.',
    health_en: 'Heart, eyes, spine, and bone health need attention this period. Avoid overexertion and ego-driven stress. Pitta imbalances can affect vitality. Morning sunlight, Surya Namaskar, and time in nature support your system. Do not ignore signals from your heart and spine.',
    finance_en: 'Income through government, authority, or established organizations is favored. Investments in stable assets are appropriate. Steady dignified effort brings reward — speculation and shortcuts are not aligned with Sun\'s energy.',
    spiritual_en: 'This is a time to develop personal integrity and dharma-aligned purpose. Gayatri mantra, Surya Namaskar at sunrise, and practices that cultivate the authentic Self serve you deeply. Offer water to the Sun every morning.',
    opportunities: ['Career recognition', 'Leadership roles', 'Government connections', 'Father-child healing', 'Authority and respect'],
    cautions: ['Ego conflicts with superiors', 'Heart or eye strain', 'Arrogance in relationships', 'Overwork and burnout'],
  },
  Moon: {
    nature: 'Mind, mother, emotions, public life, and fluctuations.',
    career_en: 'Public-facing work, creative arts, hospitality, healthcare, and fields requiring emotional intelligence are highlighted. Careers connected to the public, water, or nurturing roles are especially supported. Your public image and popularity can grow significantly this period.',
    relationships_en: 'Emotional bonds deepen and become central. Your relationship with mother or maternal figures is especially significant. You seek deeper nurturing and emotional security. Sensitivity rises — practice active listening without losing yourself in others\' emotions.',
    health_en: 'Mind and emotional balance are paramount. The digestive system, lungs, and fluid balance need care. Prioritize sleep, mental peace, and emotional processing. Evening walks, cool foods, and meditation under the night sky are restorative. Do not suppress feelings — they need expression.',
    finance_en: 'Finances may fluctuate like the waxing and waning Moon. Income through creative or public-facing work is possible. Avoid emotionally-driven financial decisions — wait for mental clarity before making major commitments.',
    spiritual_en: 'This is a time for emotional healing and lunar practices. Chandra mantra, full moon meditations, and devotion to the Divine Mother are powerful. Let yourself feel fully — the Moon rewards authentic emotional honesty.',
    opportunities: ['Public recognition', 'Creative breakthroughs', 'Emotional healing', 'Maternal connections', 'Popularity growth'],
    cautions: ['Mood swings and instability', 'Overthinking', 'Digestive sensitivity', 'Emotional dependency', 'Financial fluctuations'],
  },
  Mars: {
    nature: 'Energy, courage, property, siblings, and competitive spirit.',
    career_en: 'Mars dasha ignites ambition and raw action. Careers in engineering, medicine, military, real estate, sports, law enforcement, and any field requiring courage and physical effort are strongly supported. This is the time to fight for your goals — bold, decisive moves are rewarded. Do not hesitate when opportunity knocks.',
    relationships_en: 'Passion and conflict both intensify. Relationships with siblings and competitive peers need balanced communication. Romantic relationships gain fire and intensity. Channel Mars energy into productive passion rather than reactive conflict — the line between the two is important to watch.',
    health_en: 'Blood, muscles, inflammation, and accidents require careful attention. Avoid rash physical decisions and overheating the body. Regular, vigorous physical exercise is essential — it channels Mars energy safely. Time any surgical procedures carefully if needed.',
    finance_en: 'Real estate, property investments, and bold business ventures can bring significant gains. Focused and decisive action on clear financial goals pays off. Avoid purely impulsive financial risks — calculated boldness is very different from gambling.',
    spiritual_en: 'Channel your Mars energy into disciplined spiritual practice. Hanuman devotion, physical sadhana, martial arts with conscious intention, and serving in protective or healing roles transform Mars into dharmic fire.',
    opportunities: ['Property and real estate gains', 'Career bold moves', 'Physical and athletic performance', 'Courageous leadership', 'Competitive success'],
    cautions: ['Anger and impatience', 'Accident risk', 'Sibling or peer conflicts', 'Inflammation and blood-related issues'],
  },
  Mercury: {
    nature: 'Intelligence, communication, business, and analytical ability.',
    career_en: 'Mercury\'s dasha is excellent for business, writing, teaching, accounting, data, media, and any communication-intensive field. Your quick mind and adaptability open doors rapidly. Multiple income streams and business partnerships are favored. This is a time when your words and ideas carry unusual weight and influence.',
    relationships_en: 'Intellectual compatibility becomes the foundation of meaningful relationships. Conversations, shared ideas, and mental rapport are the glue in your closest bonds. Avoid analyzing relationships to death — remember that feeling is also a form of knowing, and presence matters as much as understanding.',
    health_en: 'The nervous system, skin, and respiratory health need attention. Mental overload and anxiety can surface this period. Ground yourself through physical activity, nature walks, and creative expression. Limit mental multitasking and excessive screen time.',
    finance_en: 'Business acumen is sharp. Multiple income streams, trade, and smart investments are favored. Keep accounts, agreements, and financial records clear and transparent. Mercury rewards those who are both clever and deeply honest.',
    spiritual_en: 'Study of sacred texts, mantras, and astrology is deeply supported. Vishnu devotion, learning from teachers, and using your voice and writing in service of truth are aligned practices for this period.',
    opportunities: ['Business expansion', 'Learning breakthroughs', 'Communication influence', 'Multiple income streams', 'Educational advancement'],
    cautions: ['Scattered energy', 'Overthinking and indecision', 'Nervous tension and anxiety', 'Over-commitment to too many things'],
  },
  Jupiter: {
    nature: 'Wisdom, grace, expansion, children, guru, and higher knowledge.',
    career_en: 'Jupiter\'s dasha is among the most blessed for career growth. Teaching, counseling, law, finance, philosophy, and any field requiring wisdom and leadership are strongly favored. Mentors, senior figures, and institutions open doors. This is a period of genuine, lasting growth — the kind that comes from doing meaningful work with wisdom and integrity.',
    relationships_en: 'Relationships are blessed with wisdom and growth. Marriage, commitment, and starting a family are all favored. Children and the role of teacher-student become important themes. Your relationships expand your world philosophically and spiritually — look for connections that make you a better person.',
    health_en: 'Generally excellent vitality during Jupiter dasha. The liver, fat tissue, and weight may need monitoring — overindulgence can become a comfortable habit. Move the body regularly and avoid excess in eating and comfort. Overall, Jupiter protects health and actively promotes healing.',
    finance_en: 'Financial expansion, inheritance, and wealth multiplication are strongly indicated. This is one of the most auspicious periods for material prosperity. Investments in education, growth-oriented ventures, and long-term assets are especially rewarding. Share your abundance generously — it returns multiplied.',
    spiritual_en: 'This is THE great spiritual expansion period. Guru connection, pilgrimages, higher learning, scripture study, and philosophical seeking are powerfully supported. Jupiter is the great benefic — your spiritual life flourishes when you seek sincerely and give generously.',
    opportunities: ['Career and income expansion', 'Wealth and financial growth', 'Marriage or children', 'Guru or mentor connection', 'Wisdom and higher knowledge'],
    cautions: ['Overconfidence and complacency', 'Weight gain', 'Liver health', 'Overextension across too many goals', 'Laziness in the abundance'],
  },
  Venus: {
    nature: 'Love, beauty, luxury, art, marriage, and material pleasures.',
    career_en: 'Venus dasha illuminates creative fields — arts, design, music, fashion, beauty, luxury goods, entertainment, and relationship-based work. Even in non-creative fields, your social grace and aesthetic sense become career assets. Partnerships and collaborations flourish. This is a time when your personal charisma opens doors that raw competence might not.',
    relationships_en: 'This is THE relationship dasha. Marriage, romantic love, deep partnerships, and all forms of intimacy are strongly favored. Comfort, beauty, and harmony become the central themes of your closest bonds. Relationships that begin now carry lasting significance. Existing partnerships deepen with new appreciation and warmth.',
    health_en: 'Kidneys, reproductive system, throat, and blood sugar need attention. Overindulgence in sweets, rich food, and luxurious living can create imbalance over time. Regular gentle movement, hydration, and beauty in your physical environment support your wellbeing.',
    finance_en: 'Material abundance increases noticeably. Income through beauty, luxury, creative work, and partnerships rises. This is a time to enjoy life — while continuing to save wisely. Investments in aesthetics, property, and beauty-related ventures are favored.',
    spiritual_en: 'Lakshmi devotion, artistic expression as spiritual practice, and recognizing beauty as a face of the divine are the paths for Venus dasha. Beauty is not separate from the sacred — it is one of its clearest, most accessible expressions.',
    opportunities: ['Love and romantic connections', 'Creative and artistic recognition', 'Material abundance and luxury', 'Business partnerships', 'Marriage and commitment'],
    cautions: ['Overindulgence in pleasures', 'Kidney and reproductive health', 'Sugar and dietary imbalance', 'Attachment to luxury', 'Laziness in abundance'],
  },
  Saturn: {
    nature: 'Discipline, karma, delay, patience, service, and structured achievement.',
    career_en: 'Saturn dasha demands sustained, disciplined effort over time. Careers in law, agriculture, social service, engineering, labor management, and structured organizations gain traction — slowly but durably. This is not a period of quick wins; it is a period of building something that will last a lifetime. Be patient: Saturn always rewards genuine, consistent effort.',
    relationships_en: 'Relationships face a test of commitment, responsibility, and maturity. Saturn delays but does not permanently deny — relationships that survive this period are built to last a lifetime. Older or more experienced partners may enter your life. Karmic relationship patterns surface for honest resolution.',
    health_en: 'Joints, bones, teeth, skin, and the nervous system (from accumulated fatigue) all need care this period. Chronic patterns from past habits may surface to be addressed directly. Prioritize consistent sleep, regular routine, warm nourishing food, and moderate daily exercise. Do not ignore early signals from your body — Saturn rewards those who listen early.',
    finance_en: 'Finances require patient management and careful planning. Quick gains are rare in Saturn dasha; slow, steady accumulation is the rewarded path. Avoid unnecessary debt and impulsive expenditures. The financial seeds planted during this period take time to bear fruit — but when they do, they are lasting and solid.',
    spiritual_en: 'Saturn dasha is one of the most profound for karma-clearing and spiritual maturation. Service to the less fortunate, Shani devotion on Saturdays, accepting responsibility gracefully, and building lasting dharmic foundations are the practices of this period. Saturn rewards sincere effort and genuine humility over time.',
    opportunities: ['Disciplined and lasting growth', 'Karma clearing and resolution', 'Building enduring foundations', 'Professional credibility and seniority', 'Service-oriented impact'],
    cautions: ['Delays and frustrations requiring patience', 'Depressive or heavy episodes', 'Joint and bone issues', 'Pessimism or isolation', 'Fatigue from sustained effort'],
  },
  Rahu: {
    nature: 'Ambition, foreign connections, technology, illusion, and sudden transformation.',
    career_en: 'Rahu opens unconventional and ambitious career paths. Technology, media, foreign organizations, research, and anything outside the norm for your background are especially active. Sudden career leaps — both upward and occasionally sideways — are possible. Unusual experiences expand your worldview in ways planned effort never could.',
    relationships_en: 'Relationships can feel intense, karmic, and sometimes destabilizing in Rahu dasha. Foreign or unconventional connections may form with compelling force. Old karmic relationship patterns surface urgently for resolution. If a new relationship arrives with overwhelming intensity, examine it carefully before surrendering completely.',
    health_en: 'Mysterious or difficult-to-diagnose issues, unusual allergies, and mental confusion can arise. Addictive tendencies and obsessive patterns need watching. Rahu amplifies whatever it touches — excess of any kind creates imbalance. Grounding practices, clean diet, and regular time in nature are essential stabilizers.',
    finance_en: 'Sudden financial gains and equally sudden losses are possible. Foreign income, speculative ventures, and unconventional income sources may arise. Keep one foot firmly grounded in financial reality — Rahu\'s promises can be spectacular, but also illusory. Diversify rather than bet everything on a single opportunity.',
    spiritual_en: 'Rahu dasha is a time to confront illusion, work through deep material desires, and recognize the karmic currents running beneath your life. The worldly experiences of this period carry spiritual lessons — often disguised as challenges. This dasha frequently leads to genuine awakening, reached through experience rather than philosophy alone.',
    opportunities: ['Unconventional and sudden success', 'Foreign connections and travel', 'Technology and innovation breakthroughs', 'Rapid worldly expansion', 'Karmic completion through experience'],
    cautions: ['Illusion and self-deception', 'Obsessive patterns and addictions', 'Health mysteries and chronic issues', 'Sudden reversals of fortune', 'Overambition and overreach'],
  },
  Ketu: {
    nature: 'Spirituality, detachment, past-life karma, and inner awakening.',
    career_en: 'Ketu naturally draws focus inward and away from worldly ambition. Research, healing, spiritual work, technology (especially deep specialization, software, or AI), and anything requiring solitary focused effort are supported. Worldly career ambition may feel less compelling — and this is not failure, but an invitation to go deeper into your unique mastery.',
    relationships_en: 'Ketu creates a natural pull toward solitude and inner work. Old karmic relationships may complete or close gracefully in this period. New relationships tend to be spiritually oriented, often bringing unexpected insight. This is a time to understand what you truly need from connection, versus what you were conditioned to seek.',
    health_en: 'Mysterious or sudden health events, fevers, and healing crises can mark Ketu periods — what was hidden beneath the surface may come up to be cleared. Ayurvedic treatments, spiritual healing, and reducing toxic inputs (food, relationships, environment) support you greatly. Trust intuition about your body.',
    finance_en: 'Financial focus naturally decreases during Ketu dasha. Some gains arrive through unexpected or research-oriented channels. A genuine detachment from money can paradoxically attract what you genuinely need. This is not the time for aggressive wealth-building — consolidate, conserve, and trust.',
    spiritual_en: 'Ketu dasha is the most powerful period for moksha-seeking, inner awakening, and past-life resolution. Ganesha practices, deep meditation, study of non-dual philosophy, and silent retreats carry immense power. The inner life is where the real action of this period lives — give it the attention it deserves fully.',
    opportunities: ['Spiritual awakening and depth', 'Research and specialized mastery', 'Inner clarity and self-knowledge', 'Karmic completion', 'Moksha-oriented living'],
    cautions: ['Detachment from life and people', 'Isolation and withdrawal', 'Mysterious health events', 'Loss of worldly direction or ambition'],
  },
};

const SADE_SATI_DESC = {
  rising:  'You are in the Rising phase of Sade Sati — Saturn transits the 12th house from your natal Moon. This is a time of internal preparation, gradual release of old patterns, and sometimes increased expenses or travel. Dreams become vivid; hidden things surface. This phase asks you to let go of what no longer serves your deeper purpose.',
  peak:    'You are in the Peak phase of Sade Sati — Saturn transits directly over your natal Moon sign. This is the most intense phase: reality, responsibility, and karmic lessons arrive with full weight. Challenges in health, relationships, or career may arise together. But those who meet this period with discipline, humility, and consistent effort emerge with their most durable achievements and deepest character.',
  setting: 'You are in the Setting phase of Sade Sati — Saturn transits the 2nd house from your natal Moon. The heaviest weight is gradually lifting. Speech, finances, and family dynamics come into focus. This phase rewards the discipline maintained during the peak — slow consolidation and steady recovery are the themes now.',
  none:    'Saturn is not currently in Sade Sati from your Moon sign. This is an easier period in terms of Saturnine pressure from transit.',
};

function generateRuleBasedPredictions(chart) {
  const currentDasha = chart.dasha.find((d) => d.is_current) || chart.dasha[0];
  const currentAntardasha = currentDasha?.antardasha?.find((d) => d.is_current) || currentDasha?.antardasha?.[0];
  const sadeSati = chart.gochar?.highlights?.sade_sati;
  const jupiter = chart.gochar?.highlights?.jupiter_support;
  const mangal = chart.mangal_dosha;

  const ascNum = chart.ascendant?.rashi_num || 1;
  const moonNum = chart.planets?.Moon?.rashi_num || 1;
  const dashaLord = currentDasha?.lord || 'Sun';
  const antarLord = currentAntardasha?.lord || 'Sun';
  const dm = DASHA_LORD_MEANINGS[dashaLord] || DASHA_LORD_MEANINGS.Sun;
  const am = DASHA_LORD_MEANINGS[antarLord] || DASHA_LORD_MEANINGS.Sun;
  const lagnaPortrait = LAGNA_PORTRAIT[ascNum] || LAGNA_PORTRAIT[1];
  const moonPortrait = MOON_SIGN_PORTRAIT[moonNum] || MOON_SIGN_PORTRAIT[1];
  const sadeSatiPhase = sadeSati?.active ? sadeSati.phase : 'none';
  const sadeSatiText = SADE_SATI_DESC[sadeSatiPhase] || SADE_SATI_DESC.none;

  // Who you are — narrative portrait
  const portrait = {
    lagna_en: lagnaPortrait.en,
    moon_en: moonPortrait.en,
    nakshatra_en: `Your birth Nakshatra is ${chart.nakshatra?.en || 'unknown'}, ruled by ${chart.nakshatra?.lord || 'unknown'}, in Pada ${chart.nakshatra?.pada || 1}. This Nakshatra shapes your instinctive nature, the quality of your mind in its most natural state, and the flavor of your emotional responses.`,
    combined_en: `You are a ${chart.ascendant?.rashi_en || ''} ascendant with Moon in ${chart.planets?.Moon?.rashi_en || ''}. Born under ${chart.nakshatra?.en || ''} Nakshatra, you carry the energy of ${chart.nakshatra?.lord || ''} in your soul-nature. Your outer world is shaped by ${chart.ascendant?.rashi_lord || ''} energy, while your inner emotional world moves with the Moon in ${chart.planets?.Moon?.rashi_en || ''}.`,
  };

  // Current dasha analysis
  const dashaEnd = currentDasha?.end ? currentDasha.end.slice(0, 10) : 'unknown';
  const antarEnd = currentAntardasha?.end ? currentAntardasha.end.slice(0, 10) : 'unknown';
  const isSameLord = dashaLord === antarLord;
  const periodCombined = isSameLord
    ? `You are running ${dashaLord}–${dashaLord} — the purest and most concentrated expression of ${dashaLord} energy. All qualities of ${dashaLord} — both its gifts and its challenges — are amplified at this time.`
    : `You are running ${dashaLord} Mahadasha with ${antarLord} Antardasha. The broad ${dashaLord} themes (${dm.nature}) are currently colored by ${antarLord} energy (${am.nature}). This combination creates a unique blend — ${dashaLord} sets the overarching direction, while ${antarLord} influences the texture and events of day-to-day life right now.`;

  const current_period = {
    mahadasha: { lord: dashaLord, end: dashaEnd, nature: dm.nature },
    antardasha: { lord: antarLord, end: antarEnd, nature: am.nature },
    combined_en: periodCombined,
  };

  // Life areas — primary dasha meanings, with antardasha modifier notes
  const asterLordNote = isSameLord ? '' : ` ${antarLord} Antardasha adds its own flavor — expect themes of ${am.nature} to weave through this area as well.`;

  const life_areas = {
    career: {
      outlook: jupiter?.favorable ? 'positive' : (sadeSati?.active ? 'challenging' : 'mixed'),
      description_en: dm.career_en + (jupiter?.favorable ? ' Jupiter\'s transit is currently supportive — mentors, growth, and learning are accessible.' : ' Jupiter\'s transit asks for patient, steady effort rather than quick leaps right now.') + asterLordNote,
      keywords: dm.opportunities.slice(0, 3),
    },
    relationships: {
      outlook: mangal?.has_dosha ? 'needs attention' : (dashaLord === 'Venus' ? 'positive' : 'mixed'),
      description_en: dm.relationships_en + (mangal?.has_dosha ? ` Note: Mangal Dosha (${mangal.severity} severity) is present in your chart — use patience and thorough compatibility review before major relationship commitments.${asterLordNote}` : ' Mangal Dosha is not prominent from Lagna, Moon, or Venus — the energy flow in relationships is relatively balanced from that standpoint.' + asterLordNote),
      keywords: ['Emotional depth', 'Commitment', 'Communication'],
    },
    health: {
      outlook: sadeSati?.active ? 'needs attention' : 'stable',
      description_en: dm.health_en + (sadeSati?.active ? ` Additionally, ${sadeSatiText} Pay particular attention to consistent routine, sleep, and stress management.${asterLordNote}` : ' Saturn is not in Sade Sati from your Moon — no compounding Saturnine health pressure from transit at this time.' + asterLordNote),
      keywords: dm.cautions.slice(-2),
    },
    finance: {
      outlook: (dashaLord === 'Jupiter' || dashaLord === 'Venus') ? 'positive' : (sadeSati?.active ? 'challenging' : 'mixed'),
      description_en: dm.finance_en + asterLordNote,
      keywords: ['Consistent effort', 'Planning', 'Patience'],
    },
    spirituality: {
      outlook: (dashaLord === 'Ketu' || dashaLord === 'Jupiter' || dashaLord === 'Saturn') ? 'deeply active' : 'supported',
      description_en: dm.spiritual_en + (dashaLord === 'Ketu' || dashaLord === 'Jupiter' ? ' The inner and spiritual dimensions of life are especially alive and responsive right now.' : '') + asterLordNote,
      keywords: ['Practice', 'Devotion', 'Inner growth'],
    },
  };

  // Transit summary
  const gochar_narrative = {
    sade_sati: { active: sadeSati?.active, phase: sadeSatiPhase, description_en: sadeSatiText },
    jupiter: {
      favorable: jupiter?.favorable,
      description_en: jupiter?.favorable
        ? `Transit Jupiter is currently in a favorable position from your Moon (${planets_house_desc(jupiter?.house_from_moon)}). This supports expansion, learning, guidance from mentors, and overall optimism. Make use of this window.`
        : `Transit Jupiter is not in its most favorable position from your Moon right now (${planets_house_desc(jupiter?.house_from_moon)}). Growth is still possible, but it requires more conscious effort and patience. Quality over speed.`,
    },
    rahu_ketu: {
      axis: chart.gochar?.highlights?.rahu_ketu_axis || 'unknown',
      description_en: `The current Rahu-Ketu transit axis is ${chart.gochar?.highlights?.rahu_ketu_axis || 'unknown'}. Rahu\'s sign brings new karmic desires and worldly pull; Ketu\'s sign shows where release, completion, and spiritual insight are available.`,
    },
    overall_en: sadeSati?.active
      ? `The overall transit picture is demanding. Sade Sati (${sadeSatiPhase} phase) adds weight to Saturn\'s life lessons. This is not the time for shortcuts — integrity, patience, and consistent daily practice are your strongest tools.`
      : `The overall transit picture is manageable. ${jupiter?.favorable ? 'Jupiter\'s support from transit is a genuine asset this period.' : 'While Jupiter is not in peak support, daily practice and consistent effort continue to bear fruit.'} Stay grounded and deliberate.`,
  };

  // Challenges and opportunities
  const current_challenges = [
    ...dm.cautions.slice(0, 2).map((c) => `${dashaLord} Mahadasha — watch for: ${c}`),
    sadeSati?.active ? `Sade Sati (${sadeSatiPhase}) — ${sadeSatiPhase === 'peak' ? 'maximum Saturn pressure; patience and routine are essential' : 'Saturn transition phase; release and consolidation needed'}` : null,
    mangal?.has_dosha ? `Mangal Dosha (${mangal.severity}) — relationship and property decisions need careful review` : null,
  ].filter(Boolean);

  const current_opportunities = [
    ...dm.opportunities.slice(0, 3).map((o) => `${dashaLord} Mahadasha opens: ${o}`),
    jupiter?.favorable ? 'Jupiter transit supports mentors, learning, and expansion — act on it now' : null,
    !sadeSati?.active ? 'No Sade Sati pressure — a clearer window for building and planning' : null,
  ].filter(Boolean);

  // Remedies — placeholder structure (will be populated from PDF when provided)
  const base_remedies = sadeSati?.active
    ? ['Saturday service and discipline — donate black sesame and mustard oil', 'Shani Chalisa or Shani mantra recitation', 'Regular routine: fixed sleep, meals, and exercise', 'Avoid major impulsive decisions during peak Sade Sati']
    : dashaLord === 'Sun'
    ? ['Daily Surya Arghya at sunrise — offer water to the Sun', 'Gayatri mantra japa — 108 times in the morning', 'Practice authentic self-expression in all areas of life', 'Honor your father and father figures']
    : dashaLord === 'Moon'
    ? ['Offer water to the Moon on Purnima (full moon nights)', 'Chandra mantra for mental peace — "Om Som Somaya Namah"', 'Reduce stimulating food; favor cooling, calming diet', 'Regular journaling or creative expression to process emotions']
    : dashaLord === 'Mars'
    ? ['Hanuman Chalisa recitation on Tuesdays', 'Donate red lentils or jaggery on Tuesdays', 'Channel aggression into vigorous daily exercise', 'Practice patience consciously in difficult moments']
    : dashaLord === 'Mercury'
    ? ['Vishnu Sahasranama or Budh mantra on Wednesdays', 'Green moong donation on Wednesdays', 'Meditate on clarity and stillness to balance mental restlessness', 'Write — journal, letters, or your thoughts — to process Mercury energy']
    : dashaLord === 'Jupiter'
    ? ['Guru Vandana — honor teachers and elders in your life', 'Yellow sapphire or yellow topaz (consult qualified astrologer)', 'Donate yellow food (turmeric, dal) on Thursdays', 'Deepen your study of sacred knowledge — philosophy, scriptures, or wisdom traditions']
    : dashaLord === 'Venus'
    ? ['Friday fasting or Lakshmi puja on Fridays', 'Donate white food (rice, sugar, white flowers) on Fridays', 'Create beauty in your home and environment consciously', 'Practice gratitude for the abundance already present']
    : dashaLord === 'Saturn'
    ? ['Shani puja on Saturdays — mustard oil lamp at Shani temple', 'Donate black sesame, black cloth, or mustard oil on Saturdays', 'Dedicated service to the elderly or underprivileged', 'Iron discipline in daily routine — consistent sleep, exercise, and diet']
    : dashaLord === 'Rahu'
    ? ['Rahu mantra: "Om Raam Rahave Namah" — 108 times on Saturdays', 'Donate blue or black items on Saturdays', 'Grounding practices — barefoot in nature, deep breathing', 'Develop discernment: question intense new desires carefully before acting']
    : ['Ganesha puja — Om Gam Ganapataye Namah, especially on Tuesdays', 'Donate colored items (multi-colored) to the needy', 'Meditation and inner silence — Ketu responds to stillness', 'Reduce physical and digital noise; create space for insight to arise'];

  // Legacy-compatible fields
  const summary_en = [
    portrait.combined_en,
    `Current Vimshottari focus: ${dashaLord} Mahadasha (until ${dashaEnd}) and ${antarLord} Antardasha (until ${antarEnd}).`,
    current_period.combined_en,
    sadeSati?.active ? `Sade Sati is active (${sadeSatiPhase} phase) — discipline and steady routine matter deeply.` : 'Saturn is not in Sade Sati from your Moon — no compounding transit pressure.',
    mangal?.has_dosha ? `Mangal Dosha (${mangal.severity} severity) — relationship decisions benefit from careful review.` : 'Mangal Dosha is not prominent from Lagna, Moon, or Venus.',
  ];

  return {
    portrait,
    current_period,
    life_areas,
    gochar_narrative,
    current_challenges,
    current_opportunities,
    remedies: base_remedies,
    summary_en,
    summary_hi: [
      `${chart.ascendant?.rashi_en || ''} lagna aur ${chart.nakshatra?.en || ''} nakshatra vyakti ke mool swabhav ko dikhate hain.`,
      `Vartaman dasha: ${dashaLord} mahadasha (${dashaEnd} tak), ${antarLord} antardasha.`,
    ],
    categories: {
      career: life_areas.career.description_en,
      relationships: life_areas.relationships.description_en,
      health: life_areas.health.description_en,
      remedies: base_remedies,
    },
  };
}

function planets_house_desc(n) {
  if (!n) return 'current position';
  const ord = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  return `${ord[n] || n} house from Moon`;
}

function toDMS(deg) {
  const abs = Math.abs(deg);
  let d = Math.floor(abs);
  let m = Math.floor((abs - d) * 60);
  let s = Math.round(((abs - d) * 60 - m) * 60);
  // Carry-over: rounding can push s to 60 or m to 60
  if (s >= 60) { s -= 60; m += 1; }
  if (m >= 60) { m -= 60; d += 1; }
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

// ─── Graha Drishti (Planetary Aspects) ───────────────────────────────────────
// Source: Drishti, Bhav Karak and Digbala.pdf
// Every planet has a 7th-house aspect. Mars, Jupiter, Saturn, Rahu, Ketu have extra.
const DRISHTI_OFFSETS = {
  Sun:     [7],
  Moon:    [7],
  Mercury: [7],
  Venus:   [7],
  Mars:    [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn:  [3, 7, 10],
  Rahu:    [5, 7, 9],
  Ketu:    [5, 7, 9],
};

// Nature of each aspect type for display
const DRISHTI_NATURE = {
  Sun:     { 7: 'neutral' },
  Moon:    { 7: 'neutral' },
  Mercury: { 7: 'neutral' },
  Venus:   { 7: 'neutral' },
  Mars:    { 4: 'aggressive', 7: 'aggressive', 8: 'aggressive' },
  Jupiter: { 5: 'auspicious', 7: 'auspicious', 9: 'auspicious' },
  Saturn:  { 3: 'restricting', 7: 'restricting', 10: 'restricting' },
  Rahu:    { 5: 'karmic', 7: 'karmic', 9: 'karmic' },
  Ketu:    { 5: 'karmic', 7: 'karmic', 9: 'karmic' },
};

/**
 * Compute which houses (and which planets in those houses) each planet aspects,
 * and which planets aspect each house.
 */
function calculateGrahaDrishti(ascendantRashiNum, planets) {
  const byPlanet = {};
  const byHouse  = {};
  for (let h = 1; h <= 12; h++) byHouse[h] = [];

  for (const [planet, pd] of Object.entries(planets)) {
    const fromHouse = houseFromSign(ascendantRashiNum, pd.rashi_num);
    const offsets   = DRISHTI_OFFSETS[planet] || [7];

    const aspectedHouses = offsets.map((offset) => {
      const h = ((fromHouse - 1 + offset - 1) % 12) + 1;
      return {
        house:   h,
        offset,
        nature:  DRISHTI_NATURE[planet]?.[offset] || 'neutral',
      };
    });

    byPlanet[planet] = {
      from_house: fromHouse,
      aspects:    aspectedHouses,
    };

    for (const { house } of aspectedHouses) {
      byHouse[house].push(planet);
    }
  }

  return { by_planet: byPlanet, by_house: byHouse };
}

// ─── Bhav Karak Grahas (Natural House Significators) ─────────────────────────
// Source: Drishti, Bhav Karak and Digbala.pdf
const BHAV_KARAK = {
  1:  ['Sun'],
  2:  ['Jupiter'],
  3:  ['Mars', 'Mercury'],
  4:  ['Moon', 'Venus'],
  5:  ['Jupiter'],
  6:  ['Mars', 'Saturn'],
  7:  ['Venus'],
  8:  ['Saturn'],
  9:  ['Sun', 'Jupiter'],
  10: ['Sun', 'Saturn', 'Mercury'],
  11: ['Jupiter'],
  12: ['Saturn'],
};

const BHAV_KARAK_SIGNIFICATION = {
  1:  { en: 'Self, Soul, Vitality, Personality',         hi: 'आत्मा, स्वास्थ्य, व्यक्तित्व' },
  2:  { en: 'Wealth, Family, Speech, Values',            hi: 'धन, परिवार, वाणी, संस्कार' },
  3:  { en: 'Courage, Siblings, Communication, Efforts', hi: 'साहस, भाई-बहन, संचार, पराक्रम' },
  4:  { en: 'Mother, Home, Property, Happiness',         hi: 'माता, घर, सुख, सम्पत्ति' },
  5:  { en: 'Children, Education, Intelligence, Punya',  hi: 'संतान, शिक्षा, बुद्धि, पूर्वपुण्य' },
  6:  { en: 'Enemies, Diseases, Service, Debts',         hi: 'शत्रु, रोग, ऋण, सेवा' },
  7:  { en: 'Marriage, Partnership, Relationships',      hi: 'विवाह, संबंध, साझेदारी' },
  8:  { en: 'Longevity, Death, Mysteries, Occult',       hi: 'आयु, मृत्यु, रहस्य, गूढ़ विद्या' },
  9:  { en: 'Religion, Fortune, Father, Higher Knowledge',hi: 'भाग्य, धर्म, पिता, उच्च ज्ञान' },
  10: { en: 'Career, Karma, Profession, Authority',      hi: 'कर्म, पेशा, अधिकार, करियर' },
  11: { en: 'Gains, Desires, Elder Siblings, Prosperity',hi: 'लाभ, इच्छाएँ, बड़े भाई, समृद्धि' },
  12: { en: 'Loss, Moksha, Foreign Land, Bed Pleasures', hi: 'हानि, मोक्ष, विदेश, त्याग' },
};

/**
 * For each house in the chart, return its Bhav Karak planets and
 * check whether those karaka planets are placed well (in that house or in trine/kendra).
 */
function calculateBhavKarak(ascendantRashiNum, planets) {
  const result = {};
  for (let h = 1; h <= 12; h++) {
    const karakas = BHAV_KARAK[h] || [];
    const sig     = BHAV_KARAK_SIGNIFICATION[h];

    result[h] = {
      house:         h,
      karakas,
      signification_en: sig.en,
      signification_hi: sig.hi,
      karaka_positions: karakas.map((planet) => {
        const pd = planets[planet];
        if (!pd) return { planet, house: null, rashi_en: null };
        const planetHouse = houseFromSign(ascendantRashiNum, pd.rashi_num);
        // karaka in own karak house is considered "karako bhava nashaya" (complex) —
        // flag it; placement in kendra/trikona = strong
        const kendras  = [1, 4, 7, 10];
        const trikonas = [1, 5, 9];
        const isInOwnHouse  = planetHouse === h;
        const isInKendra    = kendras.includes(planetHouse);
        const isInTrikona   = trikonas.includes(planetHouse);
        return {
          planet,
          house:       planetHouse,
          rashi_en:    pd.rashi_en,
          rashi_hi:    pd.rashi_hi,
          dignity:     pd.dignity,
          is_in_own_karak_house: isInOwnHouse,
          placement_quality: isInTrikona ? 'trikona' : isInKendra ? 'kendra' : 'other',
        };
      }),
    };
  }
  return result;
}

// ─── Digbala (Directional Strength) ──────────────────────────────────────────
// Source: Drishti, Bhav Karak and Digbala.pdf
// A planet gets maximum Digbala when in its directional house.
const DIGBALA_STRONG_HOUSE = {
  Jupiter:  1,   // East / Lagna
  Mercury:  1,   // East / Lagna
  Sun:     10,   // South / 10th
  Mars:    10,   // South / 10th
  Saturn:   7,   // West / 7th
  Moon:     4,   // North / 4th
  Venus:    4,   // North / 4th
};

const DIGBALA_DIRECTION = {
  1:  { en: 'East',  hi: 'पूर्व' },
  4:  { en: 'North', hi: 'उत्तर' },
  7:  { en: 'West',  hi: 'पश्चिम' },
  10: { en: 'South', hi: 'दक्षिण' },
};

/**
 * Calculate Digbala (directional strength) for all planets.
 * A planet has Digbala when its house = its strong direction house.
 * It loses Digbala when it is in the opposite house (180° away).
 */
function calculateDigbala(ascendantRashiNum, planets) {
  const result = {};

  for (const [planet, strongHouse] of Object.entries(DIGBALA_STRONG_HOUSE)) {
    const pd = planets[planet];
    if (!pd) continue;
    const planetHouse  = houseFromSign(ascendantRashiNum, pd.rashi_num);
    const oppositeHouse = ((strongHouse - 1 + 6) % 12) + 1;  // 180° = 6 houses away
    const direction     = DIGBALA_DIRECTION[strongHouse] || { en: '—', hi: '—' };

    // Strength score 0–100: 100 = exact digbala, 0 = opposite (digbala lost)
    // Linear interpolation by house distance
    const distFromStrong   = Math.abs(((planetHouse - strongHouse + 12) % 12));
    const distNormalized   = distFromStrong > 6 ? 12 - distFromStrong : distFromStrong;
    const strength_percent = Math.round((1 - distNormalized / 6) * 100);

    result[planet] = {
      planet,
      strong_house:     strongHouse,
      strong_direction: direction,
      planet_house:     planetHouse,
      opposite_house:   oppositeHouse,
      has_digbala:      planetHouse === strongHouse,
      has_digbala_loss: planetHouse === oppositeHouse,
      strength_percent,
      rashi_en:         pd.rashi_en,
    };
  }

  return result;
}

// ─── Hindu Lunar Month (Masa) ─────────────────────────────────────────────────
const MASA_NAMES = [
  'Chaitra','Vaishakha','Jyeshtha','Ashadha',
  'Shravana','Bhadrapada','Ashwin','Kartika',
  'Margashirsha','Pausa','Magha','Phalguna',
];
const MASA_NAMES_HI = [
  'चैत्र','वैशाख','ज्येष्ठ','आषाढ़',
  'श्रावण','भाद्रपद','आश्विन','कार्तिक',
  'मार्गशीर्ष','पौष','माघ','फाल्गुन',
];
function hinduMasa(sunSiderealDeg) {
  const idx = Math.floor(norm(sunSiderealDeg) / 30);
  return { name: MASA_NAMES[idx], name_hi: MASA_NAMES_HI[idx], num: idx + 1 };
}

// ─── Nitya Yoga (27 Yogas from Sun+Moon) ─────────────────────────────────────
const NITYA_YOGA_NAMES = [
  'Vishkambha','Preeti','Ayushman','Saubhagya','Sobhana','Atiganda',
  'Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghat',
  'Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Shiva',
  'Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti',
];
const YOGA_AUSPICIOUS = new Set([
  'Preeti','Ayushman','Saubhagya','Sobhana','Sukarma','Dhriti',
  'Vriddhi','Dhruva','Harshana','Siddhi','Shiva','Siddha','Sadhya',
  'Shubha','Shukla','Brahma','Indra',
]);
function calculateNityaYoga(sunSiderealLon, moonSiderealLon) {
  const combined = norm(sunSiderealLon + moonSiderealLon);
  const idx  = Math.floor(combined / (360 / 27)) % 27;
  const name = NITYA_YOGA_NAMES[idx];
  return { num: idx + 1, name, is_auspicious: YOGA_AUSPICIOUS.has(name) };
}

// ─── Tithi (Lunar Day) ────────────────────────────────────────────────────────
const TITHI_NAMES_EN = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi',
];
const TITHI_NAMES_HI = [
  'प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी',
  'षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी',
  'एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी',
];
function calculateTithi(sunSidLon, moonSidLon) {
  const diff     = norm(moonSidLon - sunSidLon);
  const tithiN30 = Math.floor(diff / 12) + 1;            // 1-30
  const isShukla = tithiN30 <= 15;
  const halfNum  = isShukla ? tithiN30 : tithiN30 - 15;  // 1-15
  const paksha   = isShukla ? 'Shukla' : 'Krishna';
  const nameEn   = halfNum <= 14 ? TITHI_NAMES_EN[halfNum - 1] : (isShukla ? 'Purnima' : 'Amavasya');
  const nameHi   = halfNum <= 14 ? TITHI_NAMES_HI[halfNum - 1] : (isShukla ? 'पूर्णिमा' : 'अमावस्या');
  return {
    num: tithiN30, half_num: halfNum,
    paksha, name_en: nameEn, name_hi: nameHi,
    display_en: `${paksha} ${nameEn}`,
    display_hi: `${paksha === 'Shukla' ? 'शुक्ल' : 'कृष्ण'} ${nameHi}`,
  };
}

// ─── Karana (half-tithi) ──────────────────────────────────────────────────────
const MOVABLE_KARANAS = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
function calculateKarana(sunSidLon, moonSidLon) {
  const diff = norm(moonSidLon - sunSidLon);
  const slot = Math.floor(diff / 6);  // 0-59
  let name;
  if (slot === 0)  name = 'Kimstughna';
  else if (slot === 57) name = 'Shakuni';
  else if (slot === 58) name = 'Chatushpada';
  else if (slot === 59) name = 'Naga';
  else name = MOVABLE_KARANAS[(slot - 1) % 7];
  return { name, slot: slot + 1 };
}

// ─── Vara (Day of week) ───────────────────────────────────────────────────────
const VARA_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const VARA_HI = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
function calculateVara(year, month, day, hour, minute, tzOffsetHrs) {
  const localMs = Date.UTC(year, month - 1, day, hour, minute) - tzOffsetHrs * 3600000;
  const dayNum  = new Date(localMs).getUTCDay();  // 0=Sun
  return { day_en: VARA_EN[dayNum], day_hi: VARA_HI[dayNum], day_num: dayNum };
}

// ─── Pahar (3-hour watch) ─────────────────────────────────────────────────────
function calculatePahar(birthHour, birthMinute, sunriseMinsFromMidnight) {
  const birthMins = birthHour * 60 + birthMinute;
  const diff = birthMins - sunriseMinsFromMidnight;
  if (diff < 0) {
    // Night pahar (before sunrise, i.e., last night)
    const nightDiff = diff + 720; // 12h night = 4 pahars × 3h
    return Math.max(1, Math.floor(nightDiff / 180) + 5);
  }
  return Math.min(4, Math.floor(diff / 180) + 1);
}

// ─── Sunrise / Sunset ─────────────────────────────────────────────────────────
function sunriseSunset(lat, lon, year, month, day, tzOffsetHrs) {
  // NOAA-based simplified solar algorithm
  const JD = eph.julianDay(year, month, day, 12, 0, 0);
  const n   = JD - 2451545.0;
  const L   = norm(280.46 + 0.9856474 * n);
  const g   = norm(357.528 + 0.9856003 * n) * Math.PI / 180;
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const eps = (23.439 - 0.0000004 * n) * Math.PI / 180;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));

  const latR  = lat * Math.PI / 180;
  const cosH  = (Math.sin(-0.8333 * Math.PI / 180) - Math.sin(latR) * Math.sin(dec))
                / (Math.cos(latR) * Math.cos(dec));

  if (cosH > 1 || cosH < -1) return { sunrise: null, sunset: null, sunrise_mins: null, sunset_mins: null };

  const H = Math.acos(cosH) * 180 / Math.PI;  // degrees

  // Equation of time (minutes) — simplified
  const B    = (360 / 365) * (n + 10) * Math.PI / 180;
  const EoT  = -7.655 * Math.sin(B) + 9.873 * Math.sin(2 * B + 3.588) + 0.439 * Math.sin(4 * B + 0.072);
  const noon = 720 - 4 * lon - EoT;   // minutes from UTC midnight

  const sunriseMins = Math.round(noon - H * 4 + tzOffsetHrs * 60);
  const sunsetMins  = Math.round(noon + H * 4 + tzOffsetHrs * 60);

  const toHHMM = (m) => {
    const mm  = ((m % 1440) + 1440) % 1440;
    const h   = Math.floor(mm / 60);
    const mn  = mm % 60;
    const ap  = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(mn).padStart(2,'0')} ${ap}`;
  };

  return {
    sunrise:      toHHMM(sunriseMins),
    sunset:       toHHMM(sunsetMins),
    sunrise_mins: sunriseMins,
    sunset_mins:  sunsetMins,
  };
}

// ─── Nakshatra Naam Akshar (Name syllable by pada) ────────────────────────────
// Standard syllables for 27 nakshatras × 4 padas
const NAK_AKSHAR = [
  null, // index 0 unused
  ['Chu','Che','Cho','La'],   // 1 Ashwini
  ['Li','Lu','Le','Lo'],      // 2 Bharani
  ['A','I','U','E'],          // 3 Krittika
  ['O','Va','Vi','Vu'],       // 4 Rohini
  ['Ve','Vo','Ka','Ki'],      // 5 Mrigashira
  ['Ku','Gha','Na','Cha'],    // 6 Ardra
  ['Ke','Ko','Ha','Hi'],      // 7 Punarvasu
  ['Hu','He','Ho','Da'],      // 8 Pushya
  ['Di','Du','De','Do'],      // 9 Ashlesha
  ['Ma','Mi','Mu','Me'],      // 10 Magha
  ['Mo','Ta','Ti','Tu'],      // 11 Purva Phalguni
  ['Te','To','Pa','Pi'],      // 12 Uttara Phalguni
  ['Pu','Sha','Na','Tha'],    // 13 Hasta
  ['Pe','Po','Ra','Ri'],      // 14 Chitra
  ['Ru','Re','Ro','Ta'],      // 15 Swati
  ['Ti','Tu','Te','To'],      // 16 Vishakha
  ['Na','Ni','Nu','Ne'],      // 17 Anuradha
  ['No','Ya','Yi','Yu'],      // 18 Jyeshtha
  ['Ye','Yo','Bha','Bhi'],    // 19 Mula
  ['Bhu','Dha','Pha','Dha'],  // 20 Purva Ashadha
  ['Be','Bo','Ja','Ji'],      // 21 Uttara Ashadha
  ['Khi','Khu','Khe','Kho'],  // 22 Shravana
  ['Ga','Gi','Gu','Ge'],      // 23 Dhanishtha
  ['Go','Sa','Si','Su'],      // 24 Shatabhisha
  ['Se','So','Da','Di'],      // 25 Purva Bhadrapada
  ['Du','Tha','Jha','Na'],    // 26 Uttara Bhadrapada
  ['De','Do','Cha','Chi'],    // 27 Revati
];

// ─── Paya (Metallic quality of birth) ────────────────────────────────────────
// Based on nakshatra number group (3 groups of 9)
function calculatePaya(nakNum) {
  if (nakNum <= 9)  return { paya: 'Silver', paya_hi: 'रजत (चाँदी)' };
  if (nakNum <= 18) return { paya: 'Gold',   paya_hi: 'स्वर्ण (सोना)' };
  return { paya: 'Copper', paya_hi: 'ताम्र (तांबा)' };
}

// ─── Yunja (Position within nakshatra thirds) ─────────────────────────────────
function calculateYunja(degInNakshatra) {
  const third = NAK_SPAN / 3;  // 4.4444°
  if (degInNakshatra < third)          return { yunja: 'Poorva', yunja_hi: 'पूर्व' };
  if (degInNakshatra < 2 * third)      return { yunja: 'Madhya', yunja_hi: 'मध्य' };
  return { yunja: 'Uttara', yunja_hi: 'उत्तर' };
}

// ─── Tatva (Element) ─────────────────────────────────────────────────────────
const TATVA_MAP = {
  Fire:  { en: 'Fire', hi: 'अग्नि' },
  Earth: { en: 'Earth', hi: 'पृथ्वी' },
  Air:   { en: 'Air', hi: 'वायु' },
  Water: { en: 'Water', hi: 'जल' },
};
function getTatva(rashiElement) {
  return TATVA_MAP[rashiElement] || { en: rashiElement, hi: rashiElement };
}

// ─── calculatePanchang ────────────────────────────────────────────────────────
function calculatePanchang(sunSidLon, moonSidLon, year, month, day, hour, minute, latitude, longitude, tzOffsetHrs) {
  const sunRise = sunriseSunset(latitude, longitude, year, month, day, tzOffsetHrs);
  const tithi   = calculateTithi(sunSidLon, moonSidLon);
  const yoga    = calculateNityaYoga(sunSidLon, moonSidLon);
  const karana  = calculateKarana(sunSidLon, moonSidLon);
  const vara    = calculateVara(year, month, day, hour, minute, tzOffsetHrs);
  const masa    = hinduMasa(sunSidLon);
  const pahar   = sunRise.sunrise_mins
    ? calculatePahar(hour, minute, sunRise.sunrise_mins)
    : null;
  const moonPhase = tithi.num; // 1-30 (same as tithi number)

  return {
    masa,
    tithi,
    vara,
    yoga,
    karana,
    pahar,
    moon_phase: moonPhase,
    sunrise:  sunRise.sunrise,
    sunset:   sunRise.sunset,
    sunrise_mins: sunRise.sunrise_mins,
    sunset_mins:  sunRise.sunset_mins,
  };
}

// ─── calculateAstroDetails ────────────────────────────────────────────────────
function calculateAstroDetails(moonPlanet, moonNakshatra, ascendant, sunSidLon, moonSidLon) {
  const moonRashiNum = moonPlanet.rashi_num;
  const moonRashi    = RASHIS[moonRashiNum - 1];
  const nakNum       = moonNakshatra.num;
  const pada         = moonNakshatra.pada;
  const nakExtra_    = nakExtra(nakNum);
  const paya         = calculatePaya(nakNum);
  const yunja        = calculateYunja(moonNakshatra.degree_in_nakshatra);
  const tatva        = getTatva(moonRashi.element);
  const akshar       = (NAK_AKSHAR[nakNum] || [])[pada - 1] || '—';

  // Varna based on Moon's sign
  const varnaObj     = varnaForRashi(moonRashiNum);
  const varna        = { name: varnaObj.name, name_hi: { Brahmin:'विप्र (ब्राह्मण)', Kshatriya:'क्षत्रिय', Vaishya:'वैश्य', Shudra:'शूद्र' }[varnaObj.name] || varnaObj.name };

  // Vashya
  const vashyaRaw    = vashyaForRashi(moonRashiNum);
  const VASHYA_HI    = { chatushpada:'चतुष्पाद', manava:'मानव', jalachara:'जलचर', vanachara:'वनचर', keeta:'कीट' };
  const vashya       = { name: vashyaRaw, name_hi: VASHYA_HI[vashyaRaw] || vashyaRaw };

  // Gana
  const GANA_HI = { deva:'देव', manushya:'मनुष्य', rakshasa:'राक्षस' };
  const gana = { name: nakExtra_.gana, name_hi: GANA_HI[nakExtra_.gana] || nakExtra_.gana };

  // Nadi
  const NADI_HI = { adi:'आदि', madhya:'मध्य', antya:'अंत्य', unknown:'—' };
  const nadi = { name: nakExtra_.nadi, name_hi: NADI_HI[nakExtra_.nadi] || nakExtra_.nadi };

  // Yoni
  const yoni = { name: nakExtra_.yoni };

  // Tithi + Yoga + Karana again (for Astro Details display)
  const tithi  = calculateTithi(sunSidLon, moonSidLon);
  const yoga   = calculateNityaYoga(sunSidLon, moonSidLon);
  const karana = calculateKarana(sunSidLon, moonSidLon);

  return {
    // Ascendant
    ascendant_rashi_en:    ascendant.rashi_en,
    ascendant_rashi_hi:    ascendant.rashi_hi,
    ascendant_lord:        ascendant.rashi_lord,
    // Moon details
    moon_sign_en:          moonPlanet.rashi_en,
    moon_sign_hi:          moonPlanet.rashi_hi,
    moon_sign_lord:        moonPlanet.rashi_lord,
    moon_nakshatra_en:     moonNakshatra.en,
    moon_nakshatra_hi:     moonNakshatra.hi,
    moon_nakshatra_lord:   moonNakshatra.lord,
    moon_pada:             pada,
    // Char qualities
    varna,
    vashya,
    yoni,
    gana,
    nadi,
    tatva,
    yunja,
    naam_akshar:  akshar,
    paya,
    // Panchang
    tithi,
    yoga,
    karana,
  };
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
  const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const trop = Object.fromEntries(
    planetNames.map((name) => [name, tropicalLongitudeForPlanet(name, JD)])
  );
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
      daily_motion:      +dailyMotionForPlanet(name, JD).toFixed(4),
      is_retrograde:     isRetrogradePlanet(name, JD),
    };
  }

  // ── Ascendant rashi ──
  const ascRashi = rashiFromDeg(sidAsc);

  // ── Ascendant, Nakshatra, whole-sign houses ──
  const ascendant = {
    longitude:          +sidAsc.toFixed(4),
    longitude_dms:      toDMS(sidAsc),
    rashi_num:          ascRashi.num,
    rashi_en:           ascRashi.en,
    rashi_hi:           ascRashi.hi,
    rashi_symbol:       ascRashi.symbol,
    rashi_lord:         ascRashi.lord,
    degree_in_sign:     +ascRashi.degreeInSign.toFixed(4),
    degree_in_sign_dms: toDMS(ascRashi.degreeInSign),
  };
  const moonNak = nakshatraFromDeg(sid.Moon);
  const nakshatra = { ...moonNak, ...nakExtra(moonNak.num) };
  const houses = buildWholeSignHouses(ascRashi.num, planetDetails);

  // ── Dasha ──
  const birthDate = new Date(year, month - 1, day, hour, minute, second);
  const dasha = vimshottariDasha(sid.Moon, birthDate);

  const chart = {
    meta: {
      julian_day:      +JD.toFixed(5),
      ayanamsa:        +ayanamsa.toFixed(6),
      ayanamsa_dms:    toDMS(ayanamsa),
      system:          'Lahiri (Chitra-paksha)',
      calculation:     'Meeus Astronomical Algorithms 2nd Ed.',
      accuracy:        'Sun ~0.01°, Moon ~0.1°, Planets ~0.5–2°',
    },
    ascendant,
    planets:   planetDetails,
    nakshatra,
    houses,
    dasha,
  };

  chart.varga_charts = calculateAllVargaCharts(ascendant, planetDetails);
  chart.navamsha = chart.varga_charts.d9;
  chart.divisional_charts = chart.varga_charts;
  chart.mangal_dosha = analyzeMangalDosha(chart);
  chart.gochar = calculateTransitSummary(chart);
  chart.predictions = generateRuleBasedPredictions(chart);

  // ── Drishti, Bhav Karak, Digbala ──
  chart.drishti    = calculateGrahaDrishti(ascRashi.num, planetDetails);
  chart.bhav_karak = calculateBhavKarak(ascRashi.num, planetDetails);
  chart.digbala    = calculateDigbala(ascRashi.num, planetDetails);

  // ── Panchang (Tithi, Yoga, Karana, Vara, Masa, Sunrise, Pahar) ──
  chart.panchang = calculatePanchang(
    sid.Sun, sid.Moon,
    year, month, day, hour, minute,
    latitude, longitude, timezone
  );

  // ── Extended Astro Details ──
  chart.astro_details = calculateAstroDetails(
    planetDetails.Moon, nakshatra, ascendant, sid.Sun, sid.Moon
  );

  // ── Yogas & Doshas ──
  chart.yogas_doshas = detectYogasAndDoshas(chart);

  return chart;
}

// ─── Yoga & Dosha Detection ───────────────────────────────────────────────────
// Source: AstroAnsh Class 11 & 12 Premium Notes — Yogas and Doshas (BPHS-based)

function _signAdd(signNum, delta) {
  return ((signNum - 1 + delta + 1200) % 12) + 1;
}

function _getAspects(name) {
  if (name === 'Mars') return [4, 7, 8];
  if (name === 'Jupiter' || name === 'Rahu' || name === 'Ketu') return [5, 7, 9];
  if (name === 'Saturn') return [3, 7, 10];
  return [7];
}

function _aspects(fromPlanet, fromName, toSignNum) {
  const h = houseFromSign(fromPlanet.rashi_num, toSignNum);
  return _getAspects(fromName).includes(h);
}

function _isConjunct(p1, p2) { return p1.rashi_num === p2.rashi_num; }

function _mutuallyRelated(planets, n1, n2) {
  const p1 = planets[n1], p2 = planets[n2];
  if (!p1 || !p2) return false;
  if (_isConjunct(p1, p2)) return true;
  if (_aspects(p1, n1, p2.rashi_num)) return true;
  if (_aspects(p2, n2, p1.rashi_num)) return true;
  return false;
}

function _isParivartana(planets, n1, n2) {
  const p1 = planets[n1], p2 = planets[n2];
  if (!p1 || !p2) return false;
  return p1.rashi_lord === n2 && p2.rashi_lord === n1;
}

function _houseSignNum(ascRashiNum, houseNum) {
  return _signAdd(ascRashiNum, houseNum - 1);
}

function _houseLord(ascRashiNum, houseNum) {
  return RASHIS[_houseSignNum(ascRashiNum, houseNum) - 1].lord;
}

function _planetHouse(ascRashiNum, planet) {
  return houseFromSign(ascRashiNum, planet.rashi_num);
}

function detectYogasAndDoshas(chart) {
  const { ascendant, planets: p } = chart;
  const asc = ascendant.rashi_num;
  const yogas = [];
  const doshas = [];

  function yoga(name, name_hi, strength, trigger_en, trigger_hi, involved) {
    yogas.push({ name, name_hi, strength, trigger_en, trigger_hi, planets_involved: involved });
  }
  function dosha(name, name_hi, severity, trigger_en, trigger_hi, involved) {
    doshas.push({ name, name_hi, severity, trigger_en, trigger_hi, planets_involved: involved });
  }

  // ── 1. Gajakesari Yoga ─────────────────────────────────────────────────────
  {
    const jup = p.Jupiter, moon = p.Moon;
    if (jup && moon) {
      const h = houseFromSign(moon.rashi_num, jup.rashi_num);
      if ([1, 4, 7, 10].includes(h)) {
        const jupH  = _planetHouse(asc, jup);
        const moonH = _planetHouse(asc, moon);
        const debil = jup.dignity?.includes('Debilitation') || moon.dignity?.includes('Debilitation');
        const dust  = [6, 8, 12].includes(jupH) || [6, 8, 12].includes(moonH);
        const str   = debil || dust ? 'weak'
          : (jup.dignity?.includes('Exaltation') || jup.dignity?.includes('Own Sign') ? 'strong' : 'moderate');
        yoga('Gajakesari Yoga', 'गजकेसरी योग', str,
          `Jupiter (H${jupH}) and Moon (H${moonH}) are in Kendra from each other.`,
          `गुरु (भाव ${jupH}) और चंद्र (भाव ${moonH}) एक-दूसरे से केंद्र में।`,
          ['Jupiter', 'Moon']);
      }
    }
  }

  // ── 2. Budh-Aditya Yoga ────────────────────────────────────────────────────
  {
    const sun = p.Sun, mer = p.Mercury;
    if (sun && mer && _isConjunct(sun, mer)) {
      const h    = _planetHouse(asc, sun);
      const diff = Math.abs(sun.degree_in_sign - mer.degree_in_sign);
      const cmb  = diff < 3;
      const str  = cmb ? 'weak' : ([3, 5, 6].includes(sun.rashi_num) ? 'strong' : 'moderate');
      yoga('Budh-Aditya Yoga', 'बुध-आदित्य योग', str,
        `Sun and Mercury conjunct in ${sun.rashi_en} (H${h})${cmb ? ' — Mercury combust (<3°)' : ''}.`,
        `सूर्य और बुध ${sun.rashi_hi} (भाव ${h}) में युत${cmb ? ' — बुध अस्त' : ''}।`,
        ['Sun', 'Mercury']);
    }
  }

  // ── 3. Neech Bhanga Raj Yoga ───────────────────────────────────────────────
  {
    const debilMap  = { Sun:7, Moon:8, Mars:4, Mercury:12, Jupiter:10, Venus:6, Saturn:1 };
    const debilLord = { Sun:'Venus', Moon:'Mars', Mars:'Moon', Mercury:'Jupiter', Jupiter:'Saturn', Venus:'Mercury', Saturn:'Mars' };
    const exaltInD  = { Sun:'Saturn', Moon:null, Mars:'Jupiter', Mercury:'Venus', Jupiter:'Mars', Venus:'Mercury', Saturn:'Sun' };

    for (const [pn, ds] of Object.entries(debilMap)) {
      const pl = p[pn];
      if (!pl || pl.rashi_num !== ds) continue;
      const h = _planetHouse(asc, pl);
      const cancels = [];

      // Condition 1: lord of debilitation sign in Kendra from Lagna or Moon
      const dl = debilLord[pn], dlp = p[dl];
      if (dlp) {
        if ([1,4,7,10].includes(_planetHouse(asc, dlp))) cancels.push(`${dl} (debil-sign lord) in Kendra from Lagna`);
        else if (p.Moon && [1,4,7,10].includes(houseFromSign(p.Moon.rashi_num, dlp.rashi_num))) cancels.push(`${dl} in Kendra from Moon`);
      }
      // Condition 3: planet exalted in debil sign is in Kendra
      const ep = exaltInD[pn];
      if (ep && p[ep] && [1,4,7,10].includes(_planetHouse(asc, p[ep]))) {
        cancels.push(`${ep} (exalted in debil-sign) in Kendra`);
      }
      // Condition 4: debilitated planet conjunct/aspected by dispositor
      const disp = pl.rashi_lord, dispp = p[disp];
      if (dispp && (_isConjunct(pl, dispp) || _aspects(dispp, disp, pl.rashi_num))) {
        cancels.push(`Dispositor ${disp} conjuncts/aspects ${pn}`);
      }

      if (cancels.length > 0) {
        yoga('Neech Bhanga Raj Yoga', 'नीच भंग राज योग',
          cancels.length >= 2 ? 'strong' : 'moderate',
          `${pn} debilitated in ${pl.rashi_en} (H${h}) — cancelled by: ${cancels.join('; ')}.`,
          `${pn} ${pl.rashi_hi} (भाव ${h}) में नीच — रद्द: ${cancels.join('; ')}।`,
          [pn, dl].filter(Boolean));
      }
    }
  }

  // ── 4. Saraswati Yoga ─────────────────────────────────────────────────────
  {
    const jup = p.Jupiter, ven = p.Venus, mer = p.Mercury;
    if (jup && ven && mer) {
      const good = [1, 2, 4, 5, 7, 9, 10];
      const jH = _planetHouse(asc, jup), vH = _planetHouse(asc, ven), mH = _planetHouse(asc, mer);
      if (good.includes(jH) && good.includes(vH) && good.includes(mH)) {
        const rel = _mutuallyRelated(p, 'Jupiter', 'Venus') || _mutuallyRelated(p, 'Jupiter', 'Mercury') || _mutuallyRelated(p, 'Venus', 'Mercury');
        if (rel) {
          const str = [jup, ven, mer].some(pl => pl.dignity?.includes('Debilitation')) ? 'moderate' : 'strong';
          yoga('Saraswati Yoga', 'सरस्वती योग', str,
            `Jupiter (H${jH}), Venus (H${vH}), Mercury (H${mH}) — all in Kendra/Trikona/2nd, mutually related.`,
            `गुरु (भाव ${jH}), शुक्र (भाव ${vH}), बुध (भाव ${mH}) — केंद्र/त्रिकोण/2 में, परस्पर संबंधित।`,
            ['Jupiter', 'Venus', 'Mercury']);
        }
      }
    }
  }

  // ── 5. Kalaneedhi Yoga ────────────────────────────────────────────────────
  {
    const mer = p.Mercury;
    for (const pn of ['Venus', 'Jupiter']) {
      const pl = p[pn];
      if (!pl || !mer) continue;
      const h = _planetHouse(asc, pl);
      if ([2, 5].includes(h) && (_isConjunct(pl, mer) || _aspects(mer, 'Mercury', pl.rashi_num))) {
        yoga('Kalaneedhi Yoga', 'कलानीधि योग',
          pl.dignity?.includes('Debilitation') ? 'weak' : 'moderate',
          `${pn} in H${h} receives Mercury's ${_isConjunct(pl, mer) ? 'conjunction' : 'aspect'}.`,
          `${pn} भाव ${h} में — बुध की ${_isConjunct(pl, mer) ? 'युति' : 'दृष्टि'}।`,
          [pn, 'Mercury']);
      }
    }
  }

  // ── 6. Chandra-Mangal Laxmi Yoga ──────────────────────────────────────────
  {
    const moon = p.Moon, mars = p.Mars;
    if (moon && mars && _mutuallyRelated(p, 'Moon', 'Mars')) {
      const moonH = _planetHouse(asc, moon), marsH = _planetHouse(asc, mars);
      const debil = moon.rashi_num === 8 || mars.rashi_num === 4;
      const dust  = [6, 8, 12].includes(moonH) || [6, 8, 12].includes(marsH);
      yoga('Chandra-Mangal Laxmi Yoga', 'चंद्र-मंगल लक्ष्मी योग',
        dust || debil ? 'weak' : 'moderate',
        `Moon (H${moonH}) and Mars (H${marsH}) ${_isConjunct(moon, mars) ? 'conjunct' : 'in mutual aspect'}.`,
        `चंद्र (भाव ${moonH}) और मंगल (भाव ${marsH}) ${_isConjunct(moon, mars) ? 'युत' : 'परस्पर दृष्टि'}।`,
        ['Moon', 'Mars']);
    }
  }

  // ── 7. Dhan Yoga group ────────────────────────────────────────────────────
  {
    // A) Dhan Yoga
    const dhanLords = [...new Set([2, 5, 9, 11].map(h => _houseLord(asc, h)))];
    const dhanPairs = [];
    for (let i = 0; i < dhanLords.length; i++) {
      for (let j = i + 1; j < dhanLords.length; j++) {
        const n1 = dhanLords[i], n2 = dhanLords[j];
        if (_mutuallyRelated(p, n1, n2) || _isParivartana(p, n1, n2)) dhanPairs.push(`${n1}+${n2}`);
      }
    }
    if (dhanPairs.length >= 2) {
      yoga('Dhan Yoga', 'धन योग', dhanPairs.length >= 3 ? 'strong' : 'moderate',
        `Wealth house lords (2,5,9,11) connected: ${dhanPairs.join(', ')}.`,
        `धन भावों (2,5,9,11) के स्वामी संबंधित: ${dhanPairs.join(', ')}।`,
        dhanLords);
    }

    // B) Laxmi Yoga: 9th lord exalted in Kendra/Trikona + strong Lagna lord
    const l9 = _houseLord(asc, 9), p9 = p[l9];
    if (p9 && p9.dignity?.includes('Exaltation')) {
      const h9 = _planetHouse(asc, p9);
      if ([1, 4, 5, 7, 9, 10].includes(h9)) {
        const ll = _houseLord(asc, 1), pll = p[ll];
        if (pll && !pll.dignity?.includes('Debilitation')) {
          yoga('Laxmi Yoga', 'लक्ष्मी योग', 'strong',
            `9th lord ${l9} exalted in H${h9} (Kendra/Trikona) with strong Lagna lord ${ll}.`,
            `नवमेश ${l9} उच्च में भाव ${h9} में, बलवान लग्नेश ${ll}।`,
            [l9, ll]);
        }
      }
    }

    // C) Adhi Yoga: Jupiter/Venus/Mercury all in 6/7/8 from Moon
    if (p.Moon) {
      const beneficsIn = ['Jupiter', 'Venus', 'Mercury'].filter(n => {
        const pl = p[n];
        return pl && [6, 7, 8].includes(houseFromSign(p.Moon.rashi_num, pl.rashi_num));
      });
      if (beneficsIn.length >= 2) {
        yoga('Adhi Yoga', 'अधि योग', beneficsIn.length === 3 ? 'strong' : 'moderate',
          `${beneficsIn.join(', ')} in 6th/7th/8th from Moon.`,
          `${beneficsIn.join(', ')} चंद्र से 6/7/8वें भाव में।`,
          [...beneficsIn, 'Moon']);
      }
    }
  }

  // ── 8. Raj Yoga ───────────────────────────────────────────────────────────
  {
    const kendraLords  = [...new Set([1, 4, 7, 10].map(h => _houseLord(asc, h)))];
    const trikonaLords = [...new Set([1, 5, 9].map(h => _houseLord(asc, h)))];
    const rajPairs = [];
    for (const kl of kendraLords) {
      for (const tl of trikonaLords) {
        if (kl !== tl && p[kl] && p[tl] && _mutuallyRelated(p, kl, tl)) {
          rajPairs.push({ kl, tl, kH: _planetHouse(asc, p[kl]), tH: _planetHouse(asc, p[tl]) });
        }
      }
    }
    if (rajPairs.length > 0) {
      yoga('Raj Yoga', 'राज योग', rajPairs.length >= 2 ? 'strong' : 'moderate',
        `Kendra-Trikona lord connection: ${rajPairs.map(r => `${r.kl}(H${r.kH})+${r.tl}(H${r.tH})`).join(', ')}.`,
        `केंद्र-त्रिकोण स्वामी संबंध: ${rajPairs.map(r => `${r.kl}(भाव ${r.kH})+${r.tl}(भाव ${r.tH})`).join(', ')}।`,
        [...new Set(rajPairs.flatMap(r => [r.kl, r.tl]))]);
    }
  }

  // ── 9. Vipreet Raj Yoga ───────────────────────────────────────────────────
  {
    const vr = [
      { ln: 6, valid: [8, 12], sub: 'Harsha Yoga',  sub_hi: 'हर्ष योग'  },
      { ln: 8, valid: [6, 12], sub: 'Sarala Yoga',  sub_hi: 'सरल योग'  },
      { ln: 12, valid: [6, 8], sub: 'Vimala Yoga', sub_hi: 'विमल योग' },
    ];
    for (const { ln, valid, sub, sub_hi } of vr) {
      const lord = _houseLord(asc, ln), pl = p[lord];
      if (pl && valid.includes(_planetHouse(asc, pl))) {
        yoga('Vipreet Raj Yoga', 'विपरीत राज योग', 'moderate',
          `${sub}: ${ln}th lord (${lord}) in H${_planetHouse(asc, pl)}.`,
          `${sub_hi}: ${ln}वें भाव का स्वामी (${lord}) भाव ${_planetHouse(asc, pl)} में।`,
          [lord]);
      }
    }
  }

  // ── 10. Parivartan Yoga ───────────────────────────────────────────────────
  {
    const pNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    for (let i = 0; i < pNames.length; i++) {
      for (let j = i + 1; j < pNames.length; j++) {
        const n1 = pNames[i], n2 = pNames[j];
        if (!_isParivartana(p, n1, n2)) continue;
        const h1 = _planetHouse(asc, p[n1]), h2 = _planetHouse(asc, p[n2]);
        const d1 = [6,8,12].includes(h1), d2 = [6,8,12].includes(h2);
        const k1 = [1,4,7,10].includes(h1) || [5,9].includes(h1);
        const k2 = [1,4,7,10].includes(h2) || [5,9].includes(h2);
        const sub = (d1 || d2) ? 'Dusthana Parivartan Yoga' : (k1 && k2) ? 'Raj Parivartan Yoga' : 'Parivartan Yoga';
        yoga(sub, 'परिवर्तन योग',
          sub === 'Dusthana Parivartan Yoga' ? 'weak' : sub === 'Raj Parivartan Yoga' ? 'strong' : 'moderate',
          `${n1} (H${h1}) ↔ ${n2} (H${h2}) sign exchange — ${sub}.`,
          `${n1} (भाव ${h1}) ↔ ${n2} (भाव ${h2}) राशि विनिमय — ${sub}.`,
          [n1, n2]);
      }
    }
  }

  // ── 11. Guru-Aditya Yoga ──────────────────────────────────────────────────
  {
    const jup = p.Jupiter, sun = p.Sun;
    if (jup && sun && _isConjunct(jup, sun)) {
      const h   = _planetHouse(asc, sun);
      const str = (sun.dignity?.includes('Debilitation') || jup.dignity?.includes('Debilitation')) ? 'weak'
        : ([5, 9, 12, 4].includes(sun.rashi_num) ? 'strong' : 'moderate');
      yoga('Guru-Aditya Yoga', 'गुरु-आदित्य योग', str,
        `Jupiter and Sun conjunct in ${sun.rashi_en} (H${h}).`,
        `गुरु और सूर्य ${sun.rashi_hi} (भाव ${h}) में युत।`,
        ['Jupiter', 'Sun']);
    }
  }

  // ── 12. Shatru Hanta Yoga ─────────────────────────────────────────────────
  {
    const l6 = _houseLord(asc, 6), pl6 = p[l6];
    const mars = p.Mars, sun = p.Sun;
    const conds = [];
    if (pl6 && _planetHouse(asc, pl6) === 12) conds.push(`6th lord (${l6}) in H12`);
    if (mars && _planetHouse(asc, mars) === 6 && [1, 8, 10].includes(mars.rashi_num)) conds.push('Mars in H6 own/exalted');
    if (sun && _planetHouse(asc, sun) === 6 && sun.rashi_num === 5) conds.push('Sun in H6 in Leo');
    if (pl6 && mars && l6 !== 'Mars' && _mutuallyRelated(p, l6, 'Mars')) conds.push(`6th lord (${l6}) conjunct/aspected by Mars`);
    if (conds.length > 0) {
      yoga('Shatru Hanta Yoga', 'शत्रु हंत योग', conds.length >= 2 ? 'strong' : 'moderate',
        conds.join('; '),
        `शत्रु हंत योग: ${conds.join('; ')}`,
        [l6, 'Mars'].filter(Boolean));
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DOSHAS
  // ════════════════════════════════════════════════════════════════════════════

  const MALEFICS = ['Saturn', 'Mars', 'Rahu', 'Ketu'];

  // ── 1. Pitru Dosha ────────────────────────────────────────────────────────
  {
    const rahu = p.Rahu, ketu = p.Ketu, sun = p.Sun;
    const sign9 = _houseSignNum(asc, 9);
    const triggers = [];
    if (rahu && rahu.rashi_num === sign9) triggers.push('Rahu in 9th house');
    if (ketu && ketu.rashi_num === sign9) triggers.push('Ketu in 9th house');
    if (sun && sun.dignity?.includes('Debilitation')) triggers.push('Sun debilitated');
    for (const n of ['Saturn', 'Mars']) {
      const pl = p[n]; if (pl && pl.rashi_num === sign9) triggers.push(`${n} in 9th house`);
    }
    if (triggers.length > 0) {
      dosha('Pitru Dosha', 'पितृ दोष',
        triggers.length >= 3 ? 'strong' : triggers.length >= 2 ? 'moderate' : 'mild',
        `Triggers: ${triggers.join('; ')}.`,
        `कारण: ${triggers.join('; ')}।`,
        ['Sun', ...MALEFICS.filter(n => triggers.some(t => t.includes(n)))]);
    }
  }

  // ── 2. Surya-Shani Vish Dosha ─────────────────────────────────────────────
  {
    const sun = p.Sun, sat = p.Saturn;
    if (sun && sat && _isConjunct(sun, sat)) {
      const h = _planetHouse(asc, sun);
      dosha('Surya-Shani Vish Dosha', 'सूर्य-शनि विष दोष',
        [1, 9, 10].includes(h) ? 'strong' : 'moderate',
        `Sun and Saturn conjunct in ${sun.rashi_en} (H${h}).`,
        `सूर्य और शनि ${sun.rashi_hi} (भाव ${h}) में युत।`,
        ['Sun', 'Saturn']);
    }
  }

  // ── 3. Mangal-Shani Vish Dosha ────────────────────────────────────────────
  {
    const mars = p.Mars, sat = p.Saturn;
    if (mars && sat && _isConjunct(mars, sat)) {
      const h = _planetHouse(asc, mars);
      const fire = [1, 5, 9].includes(mars.rashi_num);
      dosha('Mangal-Shani Vish Dosha', 'मंगल-शनि विष दोष',
        (fire || [1, 3, 10].includes(h)) ? 'strong' : 'moderate',
        `Mars and Saturn conjunct in ${mars.rashi_en} (H${h}).`,
        `मंगल और शनि ${mars.rashi_hi} (भाव ${h}) में युत।`,
        ['Mars', 'Saturn']);
    }
  }

  // ── 4. Moon-Shani Vish Dosha ──────────────────────────────────────────────
  {
    const moon = p.Moon, sat = p.Saturn;
    if (moon && sat && _isConjunct(moon, sat)) {
      const h = _planetHouse(asc, moon);
      dosha('Moon-Shani Vish Dosha', 'चंद्र-शनि विष दोष',
        moon.rashi_num === 8 ? 'strong' : 'moderate',
        `Moon and Saturn conjunct in ${moon.rashi_en} (H${h}).`,
        `चंद्र और शनि ${moon.rashi_hi} (भाव ${h}) में युत।`,
        ['Moon', 'Saturn']);
    }
  }

  // ── 5. Amavasya Dosha ─────────────────────────────────────────────────────
  {
    const sun = p.Sun, moon = p.Moon;
    if (sun && moon && _isConjunct(sun, moon)) {
      const diff = Math.abs(sun.degree_in_sign - moon.degree_in_sign);
      if (diff <= 12) {
        const h = _planetHouse(asc, sun);
        const sev = [6, 8, 12].includes(h) ? 'strong' : diff <= 3 ? 'strong' : diff <= 6 ? 'moderate' : 'mild';
        // Check if Jupiter aspects for partial relief
        const jupRelief = p.Jupiter && _aspects(p.Jupiter, 'Jupiter', sun.rashi_num);
        dosha('Amavasya Dosha', 'अमावस्या दोष', jupRelief && sev !== 'strong' ? 'mild' : sev,
          `Sun-Moon Amavasya conjunction in ${sun.rashi_en} (H${h}), ${diff.toFixed(1)}° apart${jupRelief ? ' — partially relieved by Jupiter aspect' : ''}.`,
          `सूर्य-चंद्र अमावस्या युति ${sun.rashi_hi} (भाव ${h}) में, ${diff.toFixed(1)}° अंतर${jupRelief ? ' — गुरु दृष्टि से आंशिक राहत' : ''}।`,
          ['Sun', 'Moon']);
      }
    }
  }

  // ── 6. Angarak Dosha ──────────────────────────────────────────────────────
  {
    const mars = p.Mars, rahu = p.Rahu;
    if (mars && rahu && _isConjunct(mars, rahu)) {
      const h = _planetHouse(asc, mars);
      dosha('Angarak Dosha', 'अंगारक दोष',
        ([1, 5, 9].includes(mars.rashi_num) || [1, 4, 7].includes(h)) ? 'strong' : 'moderate',
        `Mars and Rahu conjunct in ${mars.rashi_en} (H${h}).`,
        `मंगल और राहु ${mars.rashi_hi} (भाव ${h}) में युत।`,
        ['Mars', 'Rahu']);
    }
  }

  // ── 7. Shaapit Dosha ──────────────────────────────────────────────────────
  {
    const sat = p.Saturn, rahu = p.Rahu;
    if (sat && rahu && _isConjunct(sat, rahu)) {
      const h = _planetHouse(asc, sat);
      dosha('Shaapit Dosha', 'शापित दोष',
        [1, 4, 7, 9, 10].includes(h) ? 'strong' : 'moderate',
        `Saturn and Rahu conjunct in ${sat.rashi_en} (H${h}).`,
        `शनि और राहु ${sat.rashi_hi} (भाव ${h}) में युत।`,
        ['Saturn', 'Rahu']);
    }
  }

  // ── 8. Grahan Dosha ───────────────────────────────────────────────────────
  {
    const sun = p.Sun, moon = p.Moon, rahu = p.Rahu, ketu = p.Ketu;
    for (const shadow of [rahu, ketu].filter(Boolean)) {
      const shadowName = shadow === rahu ? 'Rahu' : 'Ketu';
      if (sun && _isConjunct(sun, shadow)) {
        dosha('Surya Grahan Dosha', 'सूर्य ग्रहण दोष', 'moderate',
          `Sun eclipsed by ${shadowName} in ${sun.rashi_en} (H${_planetHouse(asc, sun)}).`,
          `सूर्य ${shadowName} द्वारा ग्रहण ${sun.rashi_hi} (भाव ${_planetHouse(asc, sun)}) में।`,
          ['Sun', shadowName]);
      }
      if (moon && _isConjunct(moon, shadow)) {
        dosha('Chandra Grahan Dosha', 'चंद्र ग्रहण दोष', 'moderate',
          `Moon eclipsed by ${shadowName} in ${moon.rashi_en} (H${_planetHouse(asc, moon)}).`,
          `चंद्र ${shadowName} द्वारा ग्रहण ${moon.rashi_hi} (भाव ${_planetHouse(asc, moon)}) में।`,
          ['Moon', shadowName]);
      }
    }
  }

  // ── 9. Guru Chandaal Dosha ────────────────────────────────────────────────
  {
    const jup = p.Jupiter;
    for (const shadowName of ['Rahu', 'Ketu']) {
      const shadow = p[shadowName];
      if (jup && shadow && _isConjunct(jup, shadow)) {
        const h = _planetHouse(asc, jup);
        dosha('Guru Chandaal Dosha', 'गुरु चांडाल दोष',
          [1, 5, 9, 12].includes(h) ? 'strong' : 'moderate',
          `Jupiter conjunct ${shadowName} in ${jup.rashi_en} (H${h}).`,
          `गुरु ${shadowName} के साथ ${jup.rashi_hi} (भाव ${h}) में युत।`,
          ['Jupiter', shadowName]);
      }
    }
  }

  // ── 10. Venus-Mangal / Venus-Rahu Vish Dosha ──────────────────────────────
  {
    const ven = p.Venus, mars = p.Mars, rahu = p.Rahu;
    if (ven && mars && _isConjunct(ven, mars)) {
      dosha('Venus-Mangal Vish Dosha', 'शुक्र-मंगल विष दोष', 'moderate',
        `Venus and Mars conjunct in ${ven.rashi_en} (H${_planetHouse(asc, ven)}).`,
        `शुक्र और मंगल ${ven.rashi_hi} (भाव ${_planetHouse(asc, ven)}) में युत।`,
        ['Venus', 'Mars']);
    }
    if (ven && rahu && _isConjunct(ven, rahu)) {
      dosha('Venus-Rahu Vish Dosha', 'शुक्र-राहु विष दोष', 'moderate',
        `Venus and Rahu conjunct in ${ven.rashi_en} (H${_planetHouse(asc, ven)}).`,
        `शुक्र और राहु ${ven.rashi_hi} (भाव ${_planetHouse(asc, ven)}) में युत।`,
        ['Venus', 'Rahu']);
    }
  }

  // ── 11. Kemdrum Dosha ─────────────────────────────────────────────────────
  {
    const moon = p.Moon;
    if (moon) {
      const s2  = _signAdd(moon.rashi_num, 1);
      const s12 = _signAdd(moon.rashi_num, -1);
      const pList = ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
      const has2  = pList.some(n => p[n] && p[n].rashi_num === s2);
      const has12 = pList.some(n => p[n] && p[n].rashi_num === s12);
      if (!has2 && !has12) {
        const jupAspect = p.Jupiter && _aspects(p.Jupiter, 'Jupiter', moon.rashi_num);
        const benKendra = ['Jupiter', 'Venus', 'Mercury'].some(n => {
          const pl = p[n]; return pl && [1, 4, 5, 7, 9, 10].includes(_planetHouse(asc, pl));
        });
        const sev = jupAspect || benKendra ? 'mild' : moon.rashi_num === 8 ? 'strong' : 'moderate';
        dosha('Kemdrum Dosha', 'केमद्रुम दोष', sev,
          `Moon (H${_planetHouse(asc, moon)}) has no planets in 2nd (sign ${s2}) or 12th (sign ${s12}) from it${jupAspect ? ' — partially relieved by Jupiter' : ''}.`,
          `चंद्र (भाव ${_planetHouse(asc, moon)}) के 2 (राशि ${s2}) और 12 (राशि ${s12}) में कोई ग्रह नहीं${jupAspect ? ' — गुरु दृष्टि से आंशिक राहत' : ''}।`,
          ['Moon']);
      }
    }
  }

  // ── 12. Paap Kartari Dosha ────────────────────────────────────────────────
  {
    const classicalMalefics = ['Saturn', 'Mars', 'Rahu', 'Ketu'];
    for (const houseNum of [1, 4, 7, 10]) {
      const hSign   = _houseSignNum(asc, houseNum);
      const sBefore = _signAdd(hSign, -1);
      const sAfter  = _signAdd(hSign, 1);
      const mBefore = classicalMalefics.filter(n => p[n] && p[n].rashi_num === sBefore);
      const mAfter  = classicalMalefics.filter(n => p[n] && p[n].rashi_num === sAfter);
      if (mBefore.length > 0 && mAfter.length > 0) {
        const allHemming = [...new Set([...mBefore, ...mAfter])];
        dosha('Paap Kartari Dosha', 'पाप कर्तरी दोष',
          houseNum === 1 ? 'strong' : 'moderate',
          `H${houseNum} hemmed — ${mBefore.join(',')} before and ${mAfter.join(',')} after.`,
          `भाव ${houseNum} घिरा — ${mBefore.join(',')} पहले और ${mAfter.join(',')} बाद।`,
          allHemming);
      }
    }
  }

  return {
    yogas,
    doshas,
    yoga_count:  yogas.length,
    dosha_count: doshas.length,
  };
}

module.exports = {
  calculateVedicChart,
  calculateGrahaDrishti,
  calculateBhavKarak,
  calculateDigbala,
  BHAV_KARAK,
  DIGBALA_STRONG_HOUSE,
  DRISHTI_OFFSETS,
  lahiriAyanamsa,
  rashiFromDeg,
  nakshatraFromDeg,
  vimshottariDasha,
  buildAntardasha,
  houseFromSign,
  vargaPlacementFromDeg,
  navamshaFromDeg,
  buildWholeSignHouses,
  calculateVargaChart,
  calculateAllVargaCharts,
  calculateNavamshaChart,
  analyzeMangalDosha,
  detectYogasAndDoshas,
  calculateAshtakoot,
  calculateTransitSummary,
  generateRuleBasedPredictions,
  getPlanetDignity,
  tropicalLongitudeForPlanet,
  siderealLongitudeForPlanet,
  dailyMotionForPlanet,
  isRetrogradePlanet,
  RASHIS,
  NAKSHATRAS,
  VARGA_DEFINITIONS,
  SUPPORTED_VARGA_DIVISIONS,
  toDMS,
};
