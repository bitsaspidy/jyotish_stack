'use strict';
const eph = require('../ephemeris.service');
const { siderealLongitudeForPlanet, rashiFromDeg, houseFromSign, isRetrogradePlanet, formatDate } = require('./core-helpers');

function calculateTransitSummary(natalChart, p, atDate = new Date()) {
  const JD = eph.julianDay(
    atDate.getUTCFullYear(), atDate.getUTCMonth() + 1, atDate.getUTCDate(),
    atDate.getUTCHours(), atDate.getUTCMinutes(), atDate.getUTCSeconds()
  );
  const planetNames = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const planets = {};
  for (const name of planetNames) {
    const lon = siderealLongitudeForPlanet(name, JD);
    const rashi = rashiFromDeg(lon);
    planets[name] = {
      longitude: +lon.toFixed(4),
      rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi,
      house_from_lagna: houseFromSign(natalChart.ascendant.rashi_num, rashi.num),
      house_from_moon:  houseFromSign(natalChart.planets.Moon.rashi_num, rashi.num),
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
      sade_sati: { active: sadeSati, phase: saturnMoonHouse === 12 ? 'rising' : saturnMoonHouse === 1 ? 'peak' : saturnMoonHouse === 2 ? 'setting' : 'none', saturn_house_from_moon: saturnMoonHouse },
      jupiter_support: { favorable: jupiterFavorable, house_from_moon: planets.Jupiter.house_from_moon },
      rahu_ketu_axis: `${planets.Rahu.rashi_en}-${planets.Ketu.rashi_en}`,
    },
  };
}

module.exports = { calculateTransitSummary };
