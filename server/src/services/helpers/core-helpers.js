'use strict';
const eph = require('../ephemeris.service');
const { RASHIS, NAKSHATRAS, NAK_SPAN, DIGNITY_MAP, NAK_EXTRA, NATURAL_FRIENDS } = require('./vedic-data');

const norm = eph.norm;

// ── Lahiri Ayanamsa ───────────────────────────────────────────────────────────
function lahiriAyanamsa(JD) {
  const yearsFromJ2000 = (JD - 2451545.0) / 365.25;
  return 23.85317 + (50.2796 / 3600) * yearsFromJ2000;
}

function toSidereal(tropDeg, JD) {
  return norm(tropDeg - lahiriAyanamsa(JD));
}

function tropicalLongitudeForPlanet(name, JD) {
  switch (name) {
    case 'Sun':     return eph.sunTropicalLongitude(JD);
    case 'Moon':    return eph.moonTropicalLongitude(JD);
    case 'Rahu':    return eph.rahuTropicalLongitude(JD);
    case 'Ketu':    return norm(eph.rahuTropicalLongitude(JD) + 180);
    case 'Mars': case 'Mercury': case 'Jupiter': case 'Venus': case 'Saturn':
      return eph.planetTropicalLongitude(name.toLowerCase(), JD);
    default: throw new Error(`Unsupported planet: ${name}`);
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

// ── Rashi helpers ─────────────────────────────────────────────────────────────
function rashiFromDeg(siderealDeg) {
  const n = norm(siderealDeg);
  const idx = Math.floor(n / 30);
  return { ...RASHIS[idx], degreeInSign: n % 30 };
}

function nakshatraFromDeg(siderealDeg) {
  const n = norm(siderealDeg);
  const idx = Math.floor(n / NAK_SPAN);
  const degN = n - idx * NAK_SPAN;
  return { ...NAKSHATRAS[idx], degree_in_nakshatra: +degN.toFixed(4), pada: Math.floor(degN / (NAK_SPAN / 4)) + 1 };
}

function getPlanetDignity(planet, siderealDeg) {
  const d = DIGNITY_MAP[planet];
  if (!d) return 'shadow';
  const n = norm(siderealDeg);
  const s = Math.floor(n / 30) + 1;
  const deg = n % 30;
  if (s === d.exalt)                               return 'Exaltation (उच्च)';
  if (s === d.debil)                               return 'Debilitation (नीच)';
  if (s === d.mool && deg >= d.moolF && deg <= d.moolT) return 'Moolatrikona (मूलत्रिकोण)';
  if (d.own.includes(s))                           return 'Own Sign (स्वगृह)';
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
  return { rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi, rashi_symbol: rashi.symbol, rashi_lord: rashi.lord };
}

function startSignByQuality(quality, starts) {
  if (quality === 'Cardinal') return starts.cardinal;
  if (quality === 'Fixed')    return starts.fixed;
  return starts.mutable;
}

function startSignByElement(element) {
  if (element === 'Fire')  return 1;
  if (element === 'Earth') return 4;
  if (element === 'Air')   return 7;
  return 10;
}

function toDMS(deg) {
  const abs = Math.abs(deg);
  let d = Math.floor(abs);
  let m = Math.floor((abs - d) * 60);
  let s = Math.round(((abs - d) * 60 - m) * 60);
  if (s >= 60) { s -= 60; m += 1; }
  if (m >= 60) { m -= 60; d += 1; }
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

// ── Nakshatra / Ashtakoot helpers ─────────────────────────────────────────────
function nakExtra(nakNum) {
  return NAK_EXTRA[nakNum] || { gana:'unknown', nadi:'unknown', yoni:'unknown' };
}

function inclusiveNakDistance(fromNum, toNum) {
  return ((toNum - fromNum + 27) % 27) + 1;
}

function varnaForRashi(signNum) {
  if ([4, 8, 12].includes(signNum)) return { name:'Brahmin', rank:4 };
  if ([1, 5, 9].includes(signNum))  return { name:'Kshatriya', rank:3 };
  if ([2, 6, 10].includes(signNum)) return { name:'Vaishya', rank:2 };
  return { name:'Shudra', rank:1 };
}

function vashyaForRashi(signNum) {
  if ([1, 2, 9, 10].includes(signNum)) return 'chatushpada';
  if ([3, 6, 7, 11].includes(signNum)) return 'manava';
  if ([4, 12].includes(signNum))       return 'jalachara';
  if (signNum === 5)                   return 'vanachara';
  return 'keeta';
}

function relationScore(lordA, lordB) {
  if (lordA === lordB) return 5;
  const a = NATURAL_FRIENDS[lordA];
  const b = NATURAL_FRIENDS[lordB];
  if (!a || !b) return 2.5;
  const aFriend = a.friends.includes(lordB);
  const bFriend = b.friends.includes(lordA);
  const aEnemy  = a.enemies.includes(lordB);
  const bEnemy  = b.enemies.includes(lordA);
  if (aFriend && bFriend) return 5;
  if (aEnemy  || bEnemy)  return 0;
  if (aFriend || bFriend) return 4;
  return 3;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function ordinal(n) {
  const suffix = (n % 10 === 1 && n % 100 !== 11) ? 'st'
    : (n % 10 === 2 && n % 100 !== 12) ? 'nd'
    : (n % 10 === 3 && n % 100 !== 13) ? 'rd' : 'th';
  return `${n}${suffix}`;
}

function equalHouseFromLongitude(ascendantLongitude, targetLongitude) {
  return Math.floor(norm(targetLongitude - ascendantLongitude) / 30) + 1;
}

function signForEqualHouse(ascendantSignNum, houseNum) {
  return wrapSign(ascendantSignNum, houseNum - 1);
}

function formatDate(d) { return d.toISOString().slice(0, 10); }

function addYears(d, yrs) {
  return new Date(d.getTime() + yrs * 365.25 * 24 * 3600 * 1000);
}

module.exports = {
  norm, NAK_SPAN, lahiriAyanamsa, toSidereal,
  tropicalLongitudeForPlanet, siderealLongitudeForPlanet,
  signedAngleDelta, dailyMotionForPlanet, isRetrogradePlanet,
  rashiFromDeg, nakshatraFromDeg, getPlanetDignity,
  houseFromSign, wrapSign, rashiSummary, toDMS,
  startSignByQuality, startSignByElement,
  nakExtra, inclusiveNakDistance, varnaForRashi, vashyaForRashi, relationScore,
  ordinal, equalHouseFromLongitude, signForEqualHouse,
  formatDate, addYears,
};
