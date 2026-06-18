'use strict';
// Shared utilities for the Kundli Judgement Priority Engine

const RASHI_LORD = {
  1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',6:'Mercury',
  7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Jupiter',
};

const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const MALEFICS = new Set(['Saturn','Mars','Rahu','Ketu','Sun']);
const NATURAL_MALEFICS = new Set(['Saturn','Mars','Rahu','Ketu']);
const BENEFICS = new Set(['Jupiter','Venus','Mercury','Moon']);

// ── Dignity helpers ───────────────────────────────────────────────────────────
function normDignity(planetObj) {
  const d = String(planetObj?.dignity || '');
  if (d.includes('Exaltation'))   return 'exalted';
  if (d.includes('Moolatrikona')) return 'moolatrikona';
  if (d.includes('Own'))          return 'own';
  if (d.includes('Debilitation')) return 'debilitated';
  return 'neutral';
}

const DIGNITY_SCORE_MAP = { exalted:92, moolatrikona:82, own:70, neutral:50, debilitated:15 };

function dignityScore(planetObj) {
  return DIGNITY_SCORE_MAP[normDignity(planetObj)] ?? 50;
}

function isStrongDignity(planetObj) {
  return ['exalted','moolatrikona','own'].includes(normDignity(planetObj));
}

function isWeakDignity(planetObj) {
  return normDignity(planetObj) === 'debilitated';
}

// ── House computation (whole-sign) ────────────────────────────────────────────
function houseOf(planetObj, lagnaRashi) {
  if (!planetObj?.rashi_num || !lagnaRashi) return null;
  if (planetObj.house_num) return planetObj.house_num;
  return ((planetObj.rashi_num - lagnaRashi + 12) % 12) + 1;
}

function houseSignNum(lagnaRashi, houseNum) {
  return ((lagnaRashi + houseNum - 2) % 12) + 1;
}

function houseLordName(lagnaRashi, houseNum) {
  return RASHI_LORD[houseSignNum(lagnaRashi, houseNum)];
}

// ── House type classification ─────────────────────────────────────────────────
function isKendra(h)    { return [1,4,7,10].includes(h); }
function isTrikona(h)   { return [1,5,9].includes(h); }
function isDusthana(h)  { return [6,8,12].includes(h); }
function isUpachaya(h)  { return [3,6,10,11].includes(h); }
function isMaarak(h)    { return [2,7].includes(h); }

// ── Aspect helpers ────────────────────────────────────────────────────────────
// Returns houses that planetName in houseH aspects (in addition to 7th which all planets aspect)
function specialAspects(planetName) {
  if (planetName === 'Mars')    return [4,7,8];
  if (['Jupiter','Rahu','Ketu'].includes(planetName)) return [5,7,9];
  if (planetName === 'Saturn')  return [3,7,10];
  return [7];
}

function planetAspectsHouse(planetName, fromHouse, toHouse) {
  if (!fromHouse || !toHouse) return false;
  const aspects = specialAspects(planetName);
  return aspects.some(delta => ((fromHouse - 1 + delta - 1) % 12) + 1 === toHouse);
}

// ── Affliction detection ──────────────────────────────────────────────────────
// Returns array of affliction tags for a named planet
function getAfflictions(pName, planets, lagnaRashi) {
  const planet = planets[pName];
  if (!planet) return [];
  const aff = [];
  const pH = houseOf(planet, lagnaRashi);

  if (planet.is_combust)                  aff.push('combust');
  if (planet.combust_level === 'deep')    aff.push('deep_combust');
  if (planet.is_retrograde && !['Sun','Moon'].includes(pName)) {
    // retrograde is not inherently an affliction but note it
    aff.push('retrograde');
  }

  for (const mName of ['Rahu','Ketu','Saturn','Mars']) {
    if (mName === pName) continue;
    const m = planets[mName];
    if (!m) continue;
    const mH = houseOf(m, lagnaRashi);
    if (mH === pH) aff.push(`${mName.toLowerCase()}_conjunct`);
    if (planetAspectsHouse(mName, mH, pH)) aff.push(`${mName.toLowerCase()}_aspect`);
  }

  return [...new Set(aff)];
}

// Severity score of afflictions (0 = none, higher = worse)
function afflictionPenalty(aff = []) {
  let pen = 0;
  if (aff.includes('deep_combust'))          pen += 25;
  else if (aff.includes('combust'))           pen += 12;
  if (aff.includes('rahu_conjunct'))          pen += 20;
  if (aff.includes('ketu_conjunct'))          pen += 18;
  if (aff.includes('rahu_aspect'))            pen += 12;
  if (aff.includes('ketu_aspect'))            pen += 10;
  if (aff.includes('saturn_conjunct'))        pen += 10;
  if (aff.includes('mars_conjunct'))          pen += 8;
  if (aff.includes('saturn_aspect'))          pen += 6;
  if (aff.includes('mars_aspect'))            pen += 5;
  return pen;
}

// Paap Kartari: planet hemmed between malefics in prev/next houses
function hasPaapKartari(pName, planets, lagnaRashi) {
  const planet = planets[pName];
  if (!planet) return false;
  const h = houseOf(planet, lagnaRashi);
  if (!h) return false;
  const prev = ((h - 2 + 12) % 12) + 1;
  const next = (h % 12) + 1;

  const hasMaleficIn = (targetH) =>
    Object.entries(planets).some(([n, p]) =>
      NATURAL_MALEFICS.has(n) && n !== pName && houseOf(p, lagnaRashi) === targetH
    );

  return hasMaleficIn(prev) && hasMaleficIn(next);
}

// Kemadruma: Moon alone with no non-shadow planets in 2H/12H from Moon
function hasKemadruma(planets, lagnaRashi) {
  const moon = planets.Moon;
  if (!moon) return false;
  const mH = houseOf(moon, lagnaRashi);
  if (!mH) return false;
  const prev = ((mH - 2 + 12) % 12) + 1;
  const next = (mH % 12) + 1;

  const hasNeighbor = Object.entries(planets).some(([n, p]) => {
    if (['Moon','Rahu','Ketu'].includes(n)) return false;
    const h = houseOf(p, lagnaRashi);
    return h === prev || h === next;
  });
  return !hasNeighbor;
}

// Planets occupying a house
function occupantsOf(houseNum, planets, lagnaRashi) {
  return Object.entries(planets)
    .filter(([, p]) => houseOf(p, lagnaRashi) === houseNum)
    .map(([n]) => n);
}

// Benefics/malefics aspecting a specific house
function beneficsAspecting(houseNum, planets, lagnaRashi) {
  return Object.entries(planets)
    .filter(([n, p]) => BENEFICS.has(n) && planetAspectsHouse(n, houseOf(p, lagnaRashi), houseNum))
    .map(([n]) => n);
}

function maleficsAspecting(houseNum, planets, lagnaRashi) {
  return Object.entries(planets)
    .filter(([n, p]) => NATURAL_MALEFICS.has(n) && planetAspectsHouse(n, houseOf(p, lagnaRashi), houseNum))
    .map(([n]) => n);
}

// ── Dasha helpers ─────────────────────────────────────────────────────────────
function getCurrentDasha(chart) {
  const dashas = Array.isArray(chart.dasha) ? chart.dasha : [];
  const maha = dashas.find(d => d.is_current) || dashas[0] || null;
  const antar = Array.isArray(maha?.antardasha)
    ? (maha.antardasha.find(a => a.is_current) || maha.antardasha[0] || null)
    : null;
  return { maha: maha?.lord || null, antar: antar?.lord || null, mahaObj: maha, antarObj: antar };
}

// Does current dasha support a planet?
function dashaSupportsPlanet(planet, chart) {
  const { maha, antar } = getCurrentDasha(chart);
  return maha === planet || antar === planet;
}

// ── Age ───────────────────────────────────────────────────────────────────────
function estimateAge(profile) {
  if (!profile?.date_of_birth) return null;
  const dob = new Date(profile.date_of_birth);
  return Math.floor((Date.now() - dob) / (1000 * 60 * 60 * 24 * 365.25));
}

// ── Scoring helpers ───────────────────────────────────────────────────────────
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function statusFromScore(score) {
  if (score >= 72) return 'strong';
  if (score >= 52) return 'balanced';
  if (score >= 35) return 'needs-care';
  return 'challenging';
}

function pHi(name) { return PLANET_HI[name] || name; }

function houseLabel(h, lang='en') {
  const hi = ['प्रथम','द्वितीय','तृतीय','चतुर्थ','पंचम','षष्ठ','सप्तम','अष्टम','नवम','दशम','एकादश','द्वादश'];
  return lang === 'hi' ? `${hi[h-1] || h} भाव` : `${h}th house`;
}

module.exports = {
  RASHI_LORD, PLANET_HI, MALEFICS, NATURAL_MALEFICS, BENEFICS,
  normDignity, dignityScore, isStrongDignity, isWeakDignity,
  houseOf, houseSignNum, houseLordName,
  isKendra, isTrikona, isDusthana, isUpachaya, isMaarak,
  specialAspects, planetAspectsHouse,
  getAfflictions, afflictionPenalty,
  hasPaapKartari, hasKemadruma,
  occupantsOf, beneficsAspecting, maleficsAspecting,
  getCurrentDasha, dashaSupportsPlanet,
  estimateAge, clamp, statusFromScore, pHi, houseLabel,
};
