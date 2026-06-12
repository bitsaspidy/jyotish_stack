'use strict';
/**
 * Vedic Astrology Calculation Service — main orchestrator.
 * All logic lives in helpers/; this file wires them together and exports.
 */

const eph = require('./ephemeris.service');
const lifeReport = require('./life-report.service');

// ── Helpers ───────────────────────────────────────────────────────────────────
const {
  norm, NAK_SPAN, lahiriAyanamsa, toSidereal,
  tropicalLongitudeForPlanet, siderealLongitudeForPlanet,
  signedAngleDelta, dailyMotionForPlanet, isRetrogradePlanet,
  rashiFromDeg, nakshatraFromDeg, getPlanetDignity, getDignityStrength, getPlanetRelation,
  houseFromSign, wrapSign, rashiSummary, toDMS,
  startSignByQuality, startSignByElement,
  nakExtra, inclusiveNakDistance, varnaForRashi, vashyaForRashi, relationScore,
  ordinal, equalHouseFromLongitude, signForEqualHouse,
  formatDate, addYears,
} = require('./helpers/core-helpers');

const {
  VARGA_BY_DIVISION, SUPPORTED_VARGA_DIVISIONS,
  trimshamshaFromDegree, vargaPlacementFromDeg, navamshaFromDeg,
  buildWholeSignHouses, calculateVargaChart, calculateNavamshaChart, calculateAllVargaCharts,
} = require('./helpers/varga-calc');

const {
  DASHA_SEQ, LORD_IDX, buildAntardasha, vimshottariDasha, legacyVimshottariDasha,
  dashaSequenceFrom, proportionalLord, kpSubLordsFromLongitude,
} = require('./helpers/dasha-calc');

const { analyzeMangalDosha }    = require('./helpers/mangal-dosha');
const { calculatePanchang, calculateAstroDetails } = require('./helpers/panchang');

const {
  DRISHTI_OFFSETS, BHAV_KARAK, DIGBALA_STRONG_HOUSE,
  calculateGrahaDrishti, calculateBhavKarak, calculateDigbala,
} = require('./helpers/drishti-bhavkarak');

const { calculateTransitSummary }     = require('./helpers/gochar');
const { calculateAshtakoot }          = require('./helpers/ashtakoot');
const { generateRuleBasedPredictions } = require('./helpers/predictions-engine');
const { calculateDetailedReports, planetPositiveNegativeAssessment, calculateEventTiming } = require('./helpers/detailed-reports');
const { detectYogasAndDoshas }        = require('./helpers/yogas-doshas');

// ── Awastha (Baladi) helpers ──────────────────────────────────────────────────
// Odd signs (1,3,5,7,9,11): Bala→Kumara→Yuva→Vridha→Mrit
// Even signs (2,4,6,8,10,12): reversed (Mrit→Vridha→Yuva→Kumara→Bala)
const AVASTHA_ODD  = ['Bala','Kumara','Yuva','Vridha','Mrit'];
const AVASTHA_EVEN = ['Mrit','Vridha','Yuva','Kumara','Bala'];
const AVASTHA_HI   = { Bala:'बाल', Kumara:'कुमार', Yuva:'युवा', Vridha:'वृद्ध', Mrit:'मृत' };
function computeAvastha(rashiNum, degreeInSign) {
  const tier = Math.min(Math.floor(degreeInSign / 6), 4);
  return (rashiNum % 2 === 1) ? AVASTHA_ODD[tier] : AVASTHA_EVEN[tier];
}

// ── Combustion (Maudhya) constants ────────────────────────────────────────────
// Orbs per BPHS — reduced orb when planet is retrograde for Mercury/Venus
const COMBUST_ORB       = { Moon:12, Mars:17, Mercury:14, Jupiter:11, Venus:10, Saturn:15 };
const COMBUST_ORB_RETRO = { Mercury:12, Venus:8 };
// Deep combustion (Teevra Maudhya) — AstroAnsh Class 13 / BPHS, Phaladeepika, Saravali
const COMBUST_DEEP      = { Moon:6, Mars:8, Mercury:5, Jupiter:5, Venus:3, Saturn:7 };
function _angularDiff(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

// ── Main Chart Calculation ────────────────────────────────────────────────────
function calculateVedicChart(p) {
  const { year, month, day, hour = 0, minute = 0, second = 0,
          timezone = 5.5, latitude, longitude } = p;

  const localMs = Date.UTC(year, month - 1, day, hour, minute, second) - timezone * 3600 * 1000;
  const ut = new Date(localMs);

  const JD = eph.julianDay(
    ut.getUTCFullYear(), ut.getUTCMonth() + 1, ut.getUTCDate(),
    ut.getUTCHours(),    ut.getUTCMinutes(),    ut.getUTCSeconds()
  );

  const planetNames = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const trop = Object.fromEntries(planetNames.map((name) => [name, tropicalLongitudeForPlanet(name, JD)]));
  const tropAsc = eph.tropicalAscendant(JD, latitude, longitude);

  const ayanamsa = lahiriAyanamsa(JD);
  const sid = Object.fromEntries(Object.entries(trop).map(([k, v]) => [k, toSidereal(v, JD)]));
  const sidAsc = toSidereal(tropAsc, JD);

  const planetDetails = {};
  for (const [name, lon] of Object.entries(sid)) {
    const rashi      = rashiFromDeg(lon);
    const nak        = nakshatraFromDeg(lon);
    const dignityLbl = getPlanetDignity(name, lon);
    const awastha    = computeAvastha(rashi.num, rashi.degreeInSign);
    const isRetro    = isRetrogradePlanet(name, JD);
    planetDetails[name] = {
      longitude:            +lon.toFixed(4),
      longitude_dms:        toDMS(lon),
      rashi_num:            rashi.num,
      rashi_en:             rashi.en,
      rashi_hi:             rashi.hi,
      rashi_symbol:         rashi.symbol,
      rashi_lord:           rashi.lord,
      degree_in_sign:       +rashi.degreeInSign.toFixed(4),
      degree_in_sign_dms:   toDMS(rashi.degreeInSign),
      dignity:              dignityLbl,
      dignity_strength:     getDignityStrength(dignityLbl),
      sign_lord_relation:   getPlanetRelation(name, rashi.lord),
      daily_motion:         +dailyMotionForPlanet(name, JD).toFixed(4),
      is_retrograde:        isRetro,
      // Nakshatra
      nakshatra_en:         nak.en,
      nakshatra_hi:         nak.hi,
      nakshatra_lord:       nak.lord,
      nakshatra_num:        nak.num,
      nakshatra_pada:       nak.pada,
      // Awastha (Baladi Avastha)
      awastha,
      awastha_hi:           AVASTHA_HI[awastha] || awastha,
    };
  }

  // Combust detection — requires Sun to be computed first
  const sunLon = sid.Sun;
  for (const [name, pd] of Object.entries(planetDetails)) {
    const baseOrb = COMBUST_ORB[name];
    if (!baseOrb) { pd.is_combust = false; continue; }
    const orb = pd.is_retrograde && COMBUST_ORB_RETRO[name] ? COMBUST_ORB_RETRO[name] : baseOrb;
    const dist = _angularDiff(pd.longitude, sunLon);
    pd.is_combust    = dist <= orb;
    pd.sun_distance  = +dist.toFixed(2);
    pd.combust_level = pd.is_combust ? (dist <= (COMBUST_DEEP[name] || orb / 2) ? 'deep' : 'mild') : null;
  }

  const ascRashi   = rashiFromDeg(sidAsc);
  const ascNak     = nakshatraFromDeg(sidAsc);
  const ascendant  = {
    longitude:          +sidAsc.toFixed(4),
    longitude_dms:      toDMS(sidAsc),
    rashi_num:          ascRashi.num,
    rashi_en:           ascRashi.en,
    rashi_hi:           ascRashi.hi,
    rashi_symbol:       ascRashi.symbol,
    rashi_lord:         ascRashi.lord,
    degree_in_sign:     +ascRashi.degreeInSign.toFixed(4),
    degree_in_sign_dms: toDMS(ascRashi.degreeInSign),
    nakshatra_en:       ascNak.en,
    nakshatra_hi:       ascNak.hi,
    nakshatra_lord:     ascNak.lord,
    nakshatra_num:      ascNak.num,
    nakshatra_pada:     ascNak.pada,
  };

  const moonNak  = nakshatraFromDeg(sid.Moon);
  const nakshatra = { ...moonNak, ...nakExtra(moonNak.num) };
  const houses   = buildWholeSignHouses(ascRashi.num, planetDetails);
  const birthDate = new Date(year, month - 1, day, hour, minute, second);
  const dasha    = vimshottariDasha(sid.Moon, birthDate);

  const chart = {
    meta: {
      julian_day:  +JD.toFixed(5),
      ayanamsa:    +ayanamsa.toFixed(6),
      ayanamsa_dms: toDMS(ayanamsa),
      system:      'Lahiri (Chitra-paksha)',
      calculation: 'astronomy-engine VSOP87 + Meeus Lahiri Ayanamsa',
      accuracy:    'Sun <1", Moon <1", Planets <5" (VSOP87); Rahu ~0.1°; Asc ~0.1°',
    },
    ascendant,
    planets: planetDetails,
    nakshatra,
    houses,
    dasha,
  };

  chart.varga_charts      = calculateAllVargaCharts(ascendant, planetDetails);
  chart.navamsha          = chart.varga_charts.d9;
  chart.divisional_charts = chart.varga_charts;
  chart.mangal_dosha      = analyzeMangalDosha(chart);
  chart.gochar            = calculateTransitSummary(chart);
  chart.predictions       = generateRuleBasedPredictions(chart);

  chart.drishti    = calculateGrahaDrishti(ascRashi.num, planetDetails);
  chart.bhav_karak = calculateBhavKarak(ascRashi.num, planetDetails);
  chart.digbala    = calculateDigbala(ascRashi.num, planetDetails);

  chart.panchang = calculatePanchang(
    sid.Sun, sid.Moon,
    year, month, day, hour, minute,
    latitude, longitude, timezone
  );

  chart.astro_details = calculateAstroDetails(
    planetDetails.Moon, nakshatra, ascendant, sid.Sun, sid.Moon
  );

  chart.yogas_doshas = detectYogasAndDoshas(chart);
  chart.reports      = calculateDetailedReports(chart);

  // Life Report (Atmakaraka, Isht Devata, Varga Analysis, 5-section Life Report)
  chart.life_report    = lifeReport.generateLifeReport(chart);
  chart.varga_analysis = lifeReport.generateVargaAnalysis(chart);

  return chart;
}

const { BHAVA_CLASSIFICATION, DIGNITY_STRENGTH } = require('./helpers/vedic-data');

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  calculateVedicChart,
  // Data constants
  BHAVA_CLASSIFICATION, DIGNITY_STRENGTH,
  // Life report
  generateLifeReport:    lifeReport.generateLifeReport,
  generateVargaAnalysis: lifeReport.generateVargaAnalysis,
  calculateAtmakaraka:   lifeReport.calculateAtmakaraka,
  calculateIshtaDevata:  lifeReport.calculateIshtaDevata,
  // Varga
  vargaPlacementFromDeg, navamshaFromDeg,
  buildWholeSignHouses, calculateVargaChart, calculateNavamshaChart, calculateAllVargaCharts,
  VARGA_BY_DIVISION, SUPPORTED_VARGA_DIVISIONS,
  // Dasha
  buildAntardasha, vimshottariDasha,
  dashaSequenceFrom, proportionalLord, kpSubLordsFromLongitude,
  DASHA_SEQ, LORD_IDX,
  // Aspects / Bhav / Digbala
  calculateGrahaDrishti, calculateBhavKarak, calculateDigbala,
  BHAV_KARAK, DIGBALA_STRONG_HOUSE, DRISHTI_OFFSETS,
  // Core helpers
  lahiriAyanamsa, rashiFromDeg, nakshatraFromDeg, houseFromSign,
  dailyMotionForPlanet, siderealLongitudeForPlanet,
  // Others
  analyzeMangalDosha, detectYogasAndDoshas,
  planetPositiveNegativeAssessment, calculateEventTiming, calculateDetailedReports,
  isRetrogradePlanet,
  calculateAshtakoot, calculateTransitSummary, generateRuleBasedPredictions,
};
