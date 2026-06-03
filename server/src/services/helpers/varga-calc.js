'use strict';
const { VARGA_DEFINITIONS } = require('../../data/varga-reference');
const { RASHIS } = require('./vedic-data');
const { norm, rashiFromDeg, rashiSummary, wrapSign, startSignByQuality, startSignByElement } = require('./core-helpers');

const VARGA_BY_DIVISION = new Map(VARGA_DEFINITIONS.map((item) => [item.division, item]));
const SUPPORTED_VARGA_DIVISIONS = VARGA_DEFINITIONS.map((item) => item.division);

function trimshamshaFromDegree(signNum, degreeInSign) {
  const sections = signNum % 2 === 1
    ? [
        { limit: 5,  sign: 1,  lord: 'Mars'    },
        { limit: 10, sign: 11, lord: 'Saturn'  },
        { limit: 18, sign: 9,  lord: 'Jupiter' },
        { limit: 25, sign: 3,  lord: 'Mercury' },
        { limit: 30, sign: 7,  lord: 'Venus'   },
      ]
    : [
        { limit: 5,  sign: 2,  lord: 'Venus'   },
        { limit: 12, sign: 6,  lord: 'Mercury' },
        { limit: 20, sign: 12, lord: 'Jupiter' },
        { limit: 25, sign: 10, lord: 'Saturn'  },
        { limit: 30, sign: 8,  lord: 'Mars'    },
      ];
  const index = sections.findIndex((s) => degreeInSign < s.limit);
  const sectionIndex = index === -1 ? sections.length - 1 : index;
  return { ...sections[sectionIndex], part: sectionIndex + 1 };
}

function vargaPlacementFromDeg(siderealDeg, division) {
  if (!SUPPORTED_VARGA_DIVISIONS.includes(division)) throw new Error(`Unsupported Varga division: D${division}`);
  const source = rashiFromDeg(siderealDeg);
  const degreeInSign = source.degreeInSign;
  const definition = VARGA_BY_DIVISION.get(division);
  let part = 1, targetSignNum = source.num, sectionLord = null, degreeInPart = degreeInSign;

  if (division === 1) {
    part = 1;
  } else if (division === 30) {
    const section = trimshamshaFromDegree(source.num, degreeInSign);
    part = section.part; targetSignNum = section.sign; sectionLord = section.lord;
    const previousLimit = part === 1 ? 0 : (source.num % 2 === 1 ? [5,10,18,25] : [5,12,20,25])[part - 2];
    degreeInPart = degreeInSign - previousLimit;
  } else {
    const partSize = 30 / division;
    const partIndex = Math.min(division - 1, Math.floor(degreeInSign / partSize));
    part = partIndex + 1;
    degreeInPart = degreeInSign - partIndex * partSize;
    switch (division) {
      case 2:  targetSignNum = source.num % 2 === 1 ? (partIndex === 0 ? 5 : 4) : (partIndex === 0 ? 4 : 5); break;
      case 3:  targetSignNum = wrapSign(source.num, partIndex * 4); break;
      case 4:  targetSignNum = wrapSign(source.num, partIndex * 3); break;
      // D5 Panchamsha — cardinal from Aries, fixed from Leo, mutable from Sagittarius (BPHS)
      case 5:  { const start = startSignByQuality(source.quality, { cardinal: 1, fixed: 5, mutable: 9 }); targetSignNum = wrapSign(start, partIndex); break; }
      case 7:  { const start = source.num % 2 === 1 ? source.num : wrapSign(source.num, 6); targetSignNum = wrapSign(start, partIndex); break; }
      // D8 Ashtamsha — odd signs from itself, even signs from 9th sign (BPHS)
      case 8:  { const start = source.num % 2 === 1 ? source.num : wrapSign(source.num, 8); targetSignNum = wrapSign(start, partIndex); break; }
      case 9:  { const startOffset = source.quality === 'Cardinal' ? 0 : source.quality === 'Fixed' ? 8 : 4; targetSignNum = wrapSign(source.num, startOffset + partIndex); break; }
      case 10: { const start = source.num % 2 === 1 ? source.num : wrapSign(source.num, 8); targetSignNum = wrapSign(start, partIndex); break; }
      case 12: targetSignNum = wrapSign(source.num, partIndex); break;
      case 16: { const start = startSignByQuality(source.quality, { cardinal: 1, fixed: 5,  mutable: 9  }); targetSignNum = wrapSign(start, partIndex); break; }
      case 20: { const start = startSignByQuality(source.quality, { cardinal: 1, fixed: 9,  mutable: 5  }); targetSignNum = wrapSign(start, partIndex); break; }
      case 24: { const start = source.num % 2 === 1 ? 5 : 4; targetSignNum = wrapSign(start, partIndex); break; }
      case 27: { const start = startSignByElement(source.element); targetSignNum = wrapSign(start, partIndex); break; }
      case 40: { const start = source.num % 2 === 1 ? 1 : 7; targetSignNum = wrapSign(start, partIndex); break; }
      case 45: { const start = startSignByQuality(source.quality, { cardinal: 1, fixed: 5, mutable: 9 }); targetSignNum = wrapSign(start, partIndex); break; }
      case 60: default: targetSignNum = wrapSign(source.num, partIndex); break;
    }
  }

  return {
    division, code: definition?.code || `D${division}`, name_en: definition?.name_en || `D${division}`,
    varga_part: part, section_lord: sectionLord,
    ...rashiSummary(targetSignNum),
    source_rashi_num: source.num, source_rashi_en: source.en, source_rashi_hi: source.hi,
    source_degree_in_sign: +degreeInSign.toFixed(4), degree_in_part: +degreeInPart.toFixed(4),
    calculation_rule: definition?.calculation_rule || null,
  };
}

function navamshaFromDeg(siderealDeg) {
  const placement = vargaPlacementFromDeg(siderealDeg, 9);
  return { ...placement, navamsha_part: placement.varga_part };
}

function buildWholeSignHouses(ascendantSignNum, planetsBySign) {
  const houses = {};
  for (let h = 1; h <= 12; h++) {
    const signIdx = (ascendantSignNum - 1 + h - 1) % 12;
    const rashi = RASHIS[signIdx];
    const planets = Object.entries(planetsBySign)
      .filter(([, pd]) => pd.rashi_num === rashi.num)
      .map(([name]) => name);
    houses[h] = { house_num: h, rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi, rashi_lord: rashi.lord, planets };
  }
  return houses;
}

function calculateVargaChart(division, ascendant, planets) {
  const definition = VARGA_BY_DIVISION.get(division);
  const vargaAsc = division === 1
    ? { ...ascendant, division, code: 'D1', name_en: 'Lagna / Birth Chart', varga_part: 1 }
    : { ...vargaPlacementFromDeg(ascendant.longitude, division), longitude: ascendant.longitude, longitude_dms: ascendant.longitude_dms };
  const vargaPlanets = {};

  for (const [name, pd] of Object.entries(planets)) {
    if (division === 1) { vargaPlanets[name] = { ...pd, division, code: 'D1', varga_part: 1 }; continue; }
    const placement = vargaPlacementFromDeg(pd.longitude, division);
    vargaPlanets[name] = { ...placement, longitude: pd.longitude, source_longitude: pd.longitude, source_longitude_dms: pd.longitude_dms, source_degree_in_sign_dms: pd.degree_in_sign_dms, dignity: pd.dignity, is_retrograde: pd.is_retrograde };
    if (division === 9) vargaPlanets[name].navamsha_part = placement.varga_part;
  }
  if (division === 9) vargaAsc.navamsha_part = vargaAsc.varga_part;

  return {
    code: definition?.code || `D${division}`, division,
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

module.exports = {
  VARGA_BY_DIVISION, SUPPORTED_VARGA_DIVISIONS,
  trimshamshaFromDegree, vargaPlacementFromDeg, navamshaFromDeg,
  buildWholeSignHouses, calculateVargaChart, calculateNavamshaChart, calculateAllVargaCharts,
};
