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

function generateRuleBasedPredictions(chart) {
  const currentDasha = chart.dasha.find((d) => d.is_current) || chart.dasha[0];
  const currentAntardasha = currentDasha?.antardasha?.find((d) => d.is_current) || currentDasha?.antardasha?.[0];
  const sadeSati = chart.gochar?.highlights?.sade_sati;
  const jupiter = chart.gochar?.highlights?.jupiter_support;
  const mangal = chart.mangal_dosha;
  return {
    summary_en: [
      `${chart.ascendant.rashi_en} lagna with Moon in ${chart.planets.Moon.rashi_en} shows a ${chart.nakshatra.en} temperament.`,
      `Current Vimshottari focus: ${currentDasha?.lord || 'unknown'} mahadasha and ${currentAntardasha?.lord || 'unknown'} antardasha.`,
      jupiter?.favorable ? 'Jupiter transit is supportive for growth and guidance.' : 'Jupiter transit asks for patient, disciplined expansion.',
      sadeSati?.active ? `Saturn Sade Sati is active (${sadeSati.phase} phase), so discipline and steady routine matter.` : 'Saturn is not in the main Sade Sati zone from Moon.',
      mangal?.has_dosha ? `Mangal Dosha is ${mangal.severity}; relationship decisions should use full compatibility review.` : 'Mangal Dosha is not prominent from Lagna, Moon, or Venus.',
    ],
    summary_hi: [
      `${chart.ascendant.rashi_en} lagna aur ${chart.nakshatra.en} nakshatra vyakti ke mool swabhav ko dikhate hain.`,
      `Vartaman dasha: ${currentDasha?.lord || 'unknown'} mahadasha, ${currentAntardasha?.lord || 'unknown'} antardasha.`,
    ],
    categories: {
      career: jupiter?.favorable ? 'Good period for learning, mentors, and planned expansion.' : 'Avoid overextension; build skills steadily.',
      relationships: mangal?.has_dosha ? 'Use patience and formal compatibility checks before commitment.' : 'Relationship flow is comparatively balanced from Mangal Dosha perspective.',
      health: sadeSati?.active ? 'Protect sleep, joints, digestion, and stress rhythm.' : 'Maintain routine; no major Saturn pressure from Moon is indicated.',
      remedies: sadeSati?.active ? ['Saturday discipline and service', 'Simple Saturn mantra practice', 'Avoid impulsive commitments'] : ['Daily Surya arghya', 'Moon-calming meditation', 'Regular charity'],
    },
  };
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

  return chart;
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
