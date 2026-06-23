'use strict';
const db = require('../../config/db');

const RASHIS_EN = ['','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const RASHIS_HI = ['','मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
const RASHI_LORDS = ['','Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

function toDMS(deg) {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = Math.round((mf - m) * 60);
  return `${d}°${String(m).padStart(2,'0')}'${String(s).padStart(2,'0')}"`;
}

function mod360(v) { return ((v % 360) + 360) % 360; }

function computePositions(sunLon) {
  const dhuma      = mod360(sunLon + 133 + 20 / 60);
  const vyatipata  = mod360(360 - dhuma);
  const parivesha  = mod360(vyatipata + 180);
  const indrachapa = mod360(360 - parivesha);
  const upaketu    = mod360(indrachapa + 16 + 40 / 60);
  return { dhuma, vyatipata, parivesha, indrachapa, upaketu };
}

function lonToRashiInfo(lon) {
  const rashiNum = Math.floor(lon / 30) + 1;
  const degreeInSign = lon - (rashiNum - 1) * 30;
  return {
    rashi_num: rashiNum,
    rashi_en:  RASHIS_EN[rashiNum],
    rashi_hi:  RASHIS_HI[rashiNum],
    rashi_lord:RASHI_LORDS[rashiNum],
    degree:    +degreeInSign.toFixed(2),
    degree_dms:toDMS(degreeInSign),
    longitude: +lon.toFixed(4),
  };
}

function getHouseNum(upagrahaRashiNum, lagnaRashiNum) {
  return ((upagrahaRashiNum - lagnaRashiNum + 12) % 12) + 1;
}

// Detect which natal planets share the same rashi (whole-sign conjunction)
function findConjunctPlanets(rashiNum, planets) {
  const conjunct = [];
  for (const [name, pd] of Object.entries(planets || {})) {
    if (pd.rashi_num === rashiNum) conjunct.push(name);
  }
  return conjunct;
}

async function computeAndLookupUpagrahas(chart) {
  const sunLon    = chart?.planets?.Sun?.longitude;
  const lagnaNum  = chart?.ascendant?.rashi_num;
  if (!sunLon || !lagnaNum) return { upagrahas: [] };

  const positions  = computePositions(sunLon);
  const SLUG_ORDER = ['dhuma', 'vyatipata', 'parivesha', 'indrachapa', 'upaketu'];

  // Fetch all master definitions
  const masters = await db('upagrahas').orderBy('display_order');
  const masterMap = Object.fromEntries(masters.map((m) => [m.slug, m]));

  // Fetch all house effects at once
  const houseEffects = await db('upagraha_house_effects');
  const heMap = {};
  for (const r of houseEffects) {
    heMap[`${r.upagraha_slug}_${r.house_number}`] = r;
  }

  // Fetch all conjunction effects at once
  const conjEffects = await db('upagraha_planet_conjunctions');
  const ceMap = {};
  for (const r of conjEffects) {
    ceMap[`${r.upagraha_slug}_${r.planet_slug}`] = r;
  }

  const result = [];
  for (const slug of SLUG_ORDER) {
    const lon   = positions[slug];
    const rInfo = lonToRashiInfo(lon);
    const house = getHouseNum(rInfo.rashi_num, lagnaNum);
    const hKey  = `${slug}_${house}`;
    const houseEffect = heMap[hKey] || null;

    const conjunctPlanets = findConjunctPlanets(rInfo.rashi_num, chart.planets);
    const conjunctEffects = conjunctPlanets.map((p) => ({
      planet: p,
      ...(ceMap[`${slug}_${p}`] || { effect_en: null, effect_hi: null }),
    }));

    const master = masterMap[slug] || {};
    result.push({
      slug,
      name_en:             master.name_en,
      name_hi:             master.name_hi,
      literal_meaning_en:  master.literal_meaning_en,
      literal_meaning_hi:  master.literal_meaning_hi,
      nature_en:           master.nature_en,
      nature_hi:           master.nature_hi,
      symbolism_en:        master.symbolism_en,
      symbolism_hi:        master.symbolism_hi,
      positive_traits_en:  master.positive_traits_en,
      positive_traits_hi:  master.positive_traits_hi,
      negative_traits_en:  master.negative_traits_en,
      negative_traits_hi:  master.negative_traits_hi,
      spiritual_en:        master.spiritual_en,
      spiritual_hi:        master.spiritual_hi,
      formula_en:          master.formula_en,
      formula_hi:          master.formula_hi,
      key_indication_en:   master.key_indication_en,
      key_indication_hi:   master.key_indication_hi,
      is_malefic:          master.is_malefic,
      is_benefic:          master.is_benefic,
      display_order:       master.display_order,
      // Computed position
      longitude:           rInfo.longitude,
      rashi_num:           rInfo.rashi_num,
      rashi_en:            rInfo.rashi_en,
      rashi_hi:            rInfo.rashi_hi,
      rashi_lord:          rInfo.rashi_lord,
      degree:              rInfo.degree,
      degree_dms:          rInfo.degree_dms,
      house:               house,
      house_effect_en:     houseEffect?.effect_en || null,
      house_effect_hi:     houseEffect?.effect_hi || null,
      conjunct_planets:    conjunctEffects,
    });
  }

  return { upagrahas: result };
}

// Lightweight pure computation (for PDF — no DB)
function computeUpagrahasInline(sunLon, lagnaNum) {
  const positions  = computePositions(sunLon);
  const SLUGS = [
    { slug:'dhuma',      name_en:'Dhuma',      name_hi:'धूम',        formula_en:"Sun + 133°20'", is_malefic:true  },
    { slug:'vyatipata',  name_en:'Vyatipata',  name_hi:'व्यतिपात',   formula_en:"360° − Dhuma",  is_malefic:true  },
    { slug:'parivesha',  name_en:'Parivesha',  name_hi:'परिवेष',     formula_en:'Vyatipata + 180°', is_malefic:false },
    { slug:'indrachapa', name_en:'Indrachapa', name_hi:'इन्द्रचाप',  formula_en:"360° − Parivesha", is_malefic:false },
    { slug:'upaketu',    name_en:'Upaketu',    name_hi:'उपकेतु',     formula_en:"Indrachapa + 16°40'", is_malefic:true },
  ];
  return SLUGS.map((meta) => {
    const lon   = positions[meta.slug];
    const rInfo = lonToRashiInfo(lon);
    const house = lagnaNum ? getHouseNum(rInfo.rashi_num, lagnaNum) : null;
    return { ...meta, ...rInfo, house };
  });
}

module.exports = { computeAndLookupUpagrahas, computeUpagrahasInline, computePositions };
