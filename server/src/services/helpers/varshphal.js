'use strict';
const eph = require('../ephemeris.service');
const {
  siderealLongitudeForPlanet, signedAngleDelta, rashiFromDeg,
  houseFromSign, toSidereal, isRetrogradePlanet, toDMS, lahiriAyanamsa, ordinal,
} = require('./core-helpers');
const { RASHIS } = require('./vedic-data');
const { PLANET_NAME_HI } = require('./prediction-data');

const norm = eph.norm;

// ── Constants ─────────────────────────────────────────────────────────────────
const PLANET_LIST = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

const WEEKDAY_LORD = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']; // 0=Sun…6=Sat

// Tajika Mudda Dasha proportions (sum = 79/3 ≈ 26.33 "units")
const MUDDA_UNITS = { Sun:11, Moon:1, Mars:2, Mercury:5, Jupiter:13/3, Venus:2, Saturn:1 };
const MUDDA_TOTAL = Object.values(MUDDA_UNITS).reduce((a, b) => a + b, 0); // ≈ 26.333

const VARSHESHA_DESC = {
  Sun:     { en:'The Sun as Year Lord brings focus on authority, recognition, and career. A year of visibility, leadership, and self-expression. Government dealings and paternal relationships are highlighted. Health and vitality are in the foreground.', hi:'वर्षेश सूर्य: अधिकार, पहचान और करियर पर ध्यान। नेतृत्व, आत्म-अभिव्यक्ति और सरकारी कार्यों का वर्ष।' },
  Moon:    { en:'The Moon as Year Lord emphasizes emotions, home, mother, and the mind. Travel, changes of residence, and fluctuating circumstances are likely. Business with the public is favored. Emotional sensitivity is heightened — nurture yourself.', hi:'वर्षेश चंद्र: मन, घर और माता पर ध्यान। यात्राएं, भावनात्मक संवेदनशीलता और जनसामान्य से जुड़ा कार्य।' },
  Mars:    { en:'Mars as Year Lord brings a year of action, initiative, and competitive energy. Property, real estate, and construction matters surface. Siblings and short travel are significant. Conflicts may arise — channel Mars energy into focused action rather than aggression.', hi:'वर्षेश मंगल: कार्य, साहस और प्रतिस्पर्धा का वर्ष। अचल संपत्ति, भाई-बहन और छोटी यात्राएं महत्वपूर्ण।' },
  Mercury: { en:'Mercury as Year Lord makes this a year of intellect, communication, trade, and analysis. Writing, education, and business dealings are prominent. Multiple interests and activities are common. Contracts and agreements need careful reading.', hi:'वर्षेश बुध: बुद्धि, संचार और व्यापार का वर्ष। लेखन, शिक्षा और अनुबंधों पर ध्यान।' },
  Jupiter: { en:'Jupiter as Year Lord is one of the most auspicious Varshesha placements. A year of expansion, wisdom, and fortune. Learning, spiritual growth, long-distance travel, and financial prosperity are supported. Blessings through teachers and mentors are likely.', hi:'वर्षेश गुरु: सर्वश्रेष्ठ वर्षेश में से एक। विस्तार, ज्ञान और सौभाग्य का वर्ष। शिक्षा, यात्रा और आर्थिक समृद्धि।' },
  Venus:   { en:'Venus as Year Lord brings a year of pleasure, relationships, beauty, and material comforts. Marriage and partnerships are highlighted. Creative pursuits, artistic endeavors, and luxury are favored. Financial matters connected to relationships or art may be significant.', hi:'वर्षेश शुक्र: सुख, संबंध और सौंदर्य का वर्ष। विवाह, साझेदारी और कलात्मक कार्य अनुकूल।' },
  Saturn:  { en:'Saturn as Year Lord creates a year of hard work, discipline, and slow but steady progress. Delays are possible, but results are durable. Service, elderly relatives, and long-term projects are featured. Health requires attention. Practice patience — this year builds what lasts for decades.', hi:'वर्षेश शनि: परिश्रम, अनुशासन और धैर्य का वर्ष। देरी संभव, पर परिणाम टिकाऊ। वृद्धजनों और सेवा पर ध्यान।' },
};

// Varsha house interpretations (planet in that house for the year)
const VARSHA_HOUSE_THEME = {
  1: 'Self and overall year vitality',  2: 'Finance and family wealth',
  3: 'Courage, siblings, short travel', 4: 'Home, mother, real estate',
  5: 'Children, creativity, investments',6: 'Work, health, competition',
  7: 'Partnerships and marriage',        8: 'Sudden events, transformation',
  9: 'Fortune, travel, higher learning', 10:'Career and social standing',
  11:'Income, gains, fulfillment',        12:'Expenses, foreign, spirituality',
};

const BENEFIC_PLANETS = new Set(['Jupiter','Venus','Mercury','Moon']);
const MALEFIC_PLANETS = new Set(['Saturn','Mars','Rahu','Ketu','Sun']);
const KENDRA_HOUSES   = new Set([1,4,7,10]);
const TRIKONA_HOUSES  = new Set([1,5,9]);
const TRIK_HOUSES     = new Set([6,8,12]);

const pname = (p) => PLANET_NAME_HI[p] || p;

// ── JD → UT date components ───────────────────────────────────────────────────
function jdToUTComponents(JD) {
  const JD_adj = JD + 0.5;
  const Z = Math.floor(JD_adj);
  const F = JD_adj - Z;
  let A;
  if (Z < 2299161) { A = Z; }
  else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day   = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year  = month > 2 ? C - 4716 : C - 4715;
  const timeH = F * 24;
  const hour  = Math.floor(timeH);
  const minD  = (timeH - hour) * 60;
  const minute = Math.floor(minD);
  const second = Math.round((minD - minute) * 60);
  return { year, month, day, hour, minute, second };
}

// ── Format UT date/time string ────────────────────────────────────────────────
function formatUTDateTime({ year, month, day, hour, minute, second }) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)} UT`;
}

function formatLocalDateTime({ year, month, day, hour, minute, second }, tz) {
  const pad = (n) => String(n).padStart(2, '0');
  const sign = tz >= 0 ? '+' : '-';
  const tzH = Math.floor(Math.abs(tz));
  const tzM = Math.round((Math.abs(tz) - tzH) * 60);
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)} IST${sign}${pad(tzH)}:${pad(tzM)}`;
}

// ── Solar Return finder (binary search) ───────────────────────────────────────
function findSolarReturnJD(natalSunLong, birthJD_UT, targetYear, birthYear) {
  const yearsAhead  = targetYear - birthYear;
  const approxJD    = birthJD_UT + yearsAhead * 365.25636; // sidereal year
  let lo = approxJD - 2;
  let hi = approxJD + 2;

  for (let i = 0; i < 60; i++) {
    const mid    = (lo + hi) / 2;
    const sunNow = siderealLongitudeForPlanet('Sun', mid);
    const delta  = signedAngleDelta(sunNow, natalSunLong);
    if (delta > 0) lo = mid; else hi = mid;
    if (hi - lo < 1 / 86400) break;
  }
  return (lo + hi) / 2;
}

// ── Compute Varsha chart from SR JD + location ────────────────────────────────
function computeVarshaChart(srJD, lat, lon, tz) {
  const ayanamsa = lahiriAyanamsa(srJD);
  const tropAsc  = eph.tropicalAscendant(srJD, lat, lon);
  const siderAsc = toSidereal(tropAsc, srJD);
  const ascRashi = rashiFromDeg(siderAsc);

  const planets = {};
  for (const name of PLANET_LIST) {
    const lon_s  = siderealLongitudeForPlanet(name, srJD);
    const rashi  = rashiFromDeg(lon_s);
    const house  = houseFromSign(ascRashi.num, rashi.num);
    planets[name] = {
      longitude: +lon_s.toFixed(4),
      rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi,
      rashi_lord: rashi.lord,
      house, house_label: ordinal(house),
      is_retrograde: isRetrogradePlanet(name, srJD),
      degree_in_sign: +(lon_s % 30).toFixed(2),
      dms: toDMS(lon_s),
    };
  }

  const utComp   = jdToUTComponents(srJD);
  const localComp = jdToUTComponents(srJD + tz / 24);

  return {
    ayanamsa: +ayanamsa.toFixed(5),
    ascendant: {
      longitude:  +siderAsc.toFixed(4),
      rashi_num:  ascRashi.num,
      rashi_en:   ascRashi.en,
      rashi_hi:   ascRashi.hi,
      rashi_lord: ascRashi.lord,
      degree_in_sign: +(siderAsc % 30).toFixed(2),
      dms: toDMS(siderAsc),
    },
    planets,
    sr_jd:      +srJD.toFixed(5),
    sr_ut:      formatUTDateTime(utComp),
    sr_local:   formatLocalDateTime(localComp, tz),
    sr_date:    `${utComp.year}-${String(utComp.month).padStart(2,'0')}-${String(utComp.day).padStart(2,'0')}`,
    sr_weekday: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][Math.floor((srJD + 1.5)) % 7],
    sr_weekday_hi: ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'][Math.floor((srJD + 1.5)) % 7],
  };
}

// ── Varshesha (Year Lord) ─────────────────────────────────────────────────────
function getVarshesha(srJD) {
  const dayOfWeek = Math.floor(srJD + 1.5) % 7; // 0=Sun…6=Sat
  return WEEKDAY_LORD[dayOfWeek];
}

// ── Mudda Dasha (Tajika annual periods) ───────────────────────────────────────
function computeMuddaDasha(varshesha, srJD) {
  // Sequence starts from Varshesha, follows Sun→Mon→Tue→Wed→Thu→Fri→Sat order
  const seqOrder = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const startIdx = seqOrder.indexOf(varshesha);
  const sequence = [...seqOrder.slice(startIdx), ...seqOrder.slice(0, startIdx)];

  const YEAR_DAYS = 365.25;
  let cursor = srJD;
  return sequence.map((planet) => {
    const days     = (MUDDA_UNITS[planet] / MUDDA_TOTAL) * YEAR_DAYS;
    const startJD  = cursor;
    const endJD    = cursor + days;
    cursor         = endJD;
    const startComp = jdToUTComponents(startJD);
    const endComp   = jdToUTComponents(endJD);
    return {
      planet,
      planet_hi: pname(planet),
      days: +days.toFixed(1),
      start_date: `${startComp.year}-${String(startComp.month).padStart(2,'0')}-${String(startComp.day).padStart(2,'0')}`,
      end_date:   `${endComp.year}-${String(endComp.month).padStart(2,'0')}-${String(endComp.day).padStart(2,'0')}`,
      is_current: srJD <= new Date().getTime() / 86400000 + 2440587.5
        ? (startJD <= new Date().getTime() / 86400000 + 2440587.5 && new Date().getTime() / 86400000 + 2440587.5 < endJD)
        : false,
    };
  });
}

// ── House occupants map ───────────────────────────────────────────────────────
function buildHouseMap(varshaChart) {
  const map = {};
  for (let h = 1; h <= 12; h++) map[h] = [];
  for (const [name, pd] of Object.entries(varshaChart.planets)) {
    map[pd.house].push(name);
  }
  return map;
}

// ── Year analysis ─────────────────────────────────────────────────────────────
function analyzeVarshaChart(varshaChart, natalChart, varshesha, targetYear) {
  const asc       = varshaChart.ascendant;
  const houseMap  = buildHouseMap(varshaChart);
  const vp        = varshaChart.planets;

  // Varshesha house from Varsha Lagna
  const varshaLord = vp[varshesha];
  const varshaLordHouse = varshaLord?.house;

  // Overall year score (1-5)
  let score = 3;
  if (varshesha === 'Jupiter' || varshesha === 'Venus') score += 0.8;
  if (varshesha === 'Saturn'  || varshesha === 'Rahu'  || varshesha === 'Ketu') score -= 0.5;
  if (varshaLordHouse && KENDRA_HOUSES.has(varshaLordHouse))  score += 0.7;
  if (varshaLordHouse && TRIKONA_HOUSES.has(varshaLordHouse)) score += 0.7;
  if (varshaLordHouse && TRIK_HOUSES.has(varshaLordHouse))    score -= 0.7;

  // Benefics in Kendra/Trikona
  for (const [planet, pd] of Object.entries(vp)) {
    if (BENEFIC_PLANETS.has(planet) && (KENDRA_HOUSES.has(pd.house) || TRIKONA_HOUSES.has(pd.house))) score += 0.3;
    if (MALEFIC_PLANETS.has(planet) && KENDRA_HOUSES.has(pd.house)) score -= 0.25;
  }
  score = Math.max(1, Math.min(5, Math.round(score)));

  // Key indicators
  const indicators_en = [], indicators_hi = [];
  const jupHouse = vp.Jupiter?.house;
  const satHouse = vp.Saturn?.house;
  const venHouse = vp.Venus?.house;
  const marsHouse = vp.Mars?.house;
  const moonHouse = vp.Moon?.house;
  const sunHouse  = vp.Sun?.house;

  if (jupHouse && TRIKONA_HOUSES.has(jupHouse)) { indicators_en.push(`Jupiter in ${ordinal(jupHouse)} house — exceptional fortune and expansion during the year`); indicators_hi.push(`गुरु ${jupHouse}वें भाव में — वर्ष में असाधारण भाग्य और विस्तार`); }
  if (jupHouse === 11) { indicators_en.push('Jupiter in 11th — income and gains are strongly supported'); indicators_hi.push('गुरु 11वें में — आय और लाभ प्रबल रूप से समर्थित'); }
  if (satHouse === 1 || satHouse === 8 || satHouse === 12) { indicators_en.push(`Saturn in ${ordinal(satHouse)} house — discipline required; delays possible but growth through persistence`); indicators_hi.push(`शनि ${satHouse}वें में — धैर्य आवश्यक; देरी संभव पर दृढ़ता से विकास`); }
  if (venHouse && (KENDRA_HOUSES.has(venHouse) || venHouse === 5 || venHouse === 11)) { indicators_en.push(`Venus in ${ordinal(venHouse)} house — relationships, comforts, and finances receive positive energy`); indicators_hi.push(`शुक्र ${venHouse}वें में — संबंध, सुख और धन पर सकारात्मक प्रभाव`); }
  if (marsHouse === 1 || marsHouse === 10 || marsHouse === 3) { indicators_en.push(`Mars in ${ordinal(marsHouse)} house — high physical energy, initiative, and competitive drive this year`); indicators_hi.push(`मंगल ${marsHouse}वें में — उच्च ऊर्जा, पहल और प्रतिस्पर्धी शक्ति`); }

  // House-by-house year predictions
  const house_readings = {};
  for (let h = 1; h <= 12; h++) {
    const occupants = houseMap[h];
    const beneficsHere = occupants.filter((p) => BENEFIC_PLANETS.has(p));
    const malefsHere   = occupants.filter((p) => MALEFIC_PLANETS.has(p));
    const tone = beneficsHere.length > malefsHere.length ? 'favorable'
      : malefsHere.length > beneficsHere.length ? 'challenging' : 'moderate';

    let reading_en = '';
    if (occupants.length === 0) {
      reading_en = `No planets occupy your ${ordinal(h)} Varsha house. This area runs on the strength of the house lord's placement.`;
    } else {
      const beneficStr = beneficsHere.length ? `Benefics (${beneficsHere.join(', ')}) bring positive energy.` : '';
      const maleficStr = malefsHere.length   ? `Malefics (${malefsHere.join(', ')}) demand careful attention.` : '';
      reading_en = `${occupants.join(', ')} ${occupants.length === 1 ? 'occupies' : 'occupy'} your ${ordinal(h)} Varsha house of ${VARSHA_HOUSE_THEME[h]}. ${beneficStr} ${maleficStr}`.trim();
    }

    // Add specific guidance per house
    const specific = h === 1 && occupants.includes('Jupiter') ? ' Jupiter in 1st Varsha house is a powerful blessing for health and overall year vitality.'
      : h === 7 && occupants.includes('Venus') ? ' Venus in 7th is one of the best placements for marriage, partnerships, and relationship harmony.'
      : h === 10 && occupants.includes('Sun') ? ' Sun in 10th brings career recognition, authority, and professional visibility.'
      : h === 11 && occupants.includes('Jupiter') ? ' Jupiter in 11th is the premier income indicator — financial gains are strongly promised.'
      : h === 8 && occupants.includes('Saturn') ? ' Saturn in 8th demands patience with inheritance, insurance, or sudden events — long-term discipline pays off.'
      : '';

    house_readings[h] = {
      house: h, theme: VARSHA_HOUSE_THEME[h], occupants, tone,
      reading_en: reading_en + specific,
      reading_hi: `${h}वें भाव में ${occupants.length ? occupants.map(pname).join(', ') : 'कोई ग्रह नहीं'} — ${tone === 'favorable' ? 'शुभ' : tone === 'challenging' ? 'चुनौतीपूर्ण' : 'सामान्य'} प्रभाव।`,
    };
  }

  // Natal vs Varsha planet comparison (house changes)
  const planet_movement = {};
  for (const name of PLANET_LIST) {
    const natalHouse = natalChart.planets?.[name]
      ? houseFromSign(natalChart.ascendant.rashi_num, natalChart.planets[name].rashi_num)
      : null;
    const varshaHouse = vp[name]?.house || null;
    const moved = natalHouse !== null && varshaHouse !== null && natalHouse !== varshaHouse;
    planet_movement[name] = {
      natal_house: natalHouse, natal_rashi: natalChart.planets?.[name]?.rashi_en || null,
      varsha_house: varshaHouse, varsha_rashi: vp[name]?.rashi_en || null,
      moved,
      movement_en: moved
        ? `${name} moves from ${ordinal(natalHouse)} (natal) to ${ordinal(varshaHouse)} Varsha house — ${VARSHA_HOUSE_THEME[varshaHouse]} becomes activated.`
        : natalHouse
        ? `${name} stays in the ${ordinal(natalHouse)} house area — steady continuity in ${VARSHA_HOUSE_THEME[natalHouse]}.`
        : '',
    };
  }

  // Career, finance, relationship, health summaries
  const careerHouses   = [houseMap[10], houseMap[6], houseMap[2]].flat();
  const financeHouses  = [houseMap[11], houseMap[2], houseMap[8]].flat();
  const relHouses      = [houseMap[7], houseMap[5]].flat();
  const healthHouses   = [houseMap[1], houseMap[6], houseMap[8]].flat();

  const areaText = (planets_here, area, goodPlanets, badPlanets) => {
    const good = planets_here.filter((p) => goodPlanets.has(p));
    const bad  = planets_here.filter((p) => badPlanets.has(p));
    const tone = good.length >= bad.length ? 'favorable' : 'needs attention';
    return { tone, planets: planets_here, good, bad };
  };

  const year_summary_en = `${targetYear} Varshphal: Your Solar Return falls on ${varshaChart.sr_date} with ${asc.rashi_en} Varsha Lagna. ${varshesha} is your Varshesha (Year Lord) — ${VARSHESHA_DESC[varshesha]?.en?.split('.')[0]}. The year carries ${score >= 4 ? 'strong positive' : score <= 2 ? 'challenging' : 'moderate'} overall energy. ${indicators_en.slice(0, 2).join(' ')} Varshesha ${varshesha} in the ${ordinal(varshaLordHouse || 1)} Varsha house ${varshaLordHouse && KENDRA_HOUSES.has(varshaLordHouse) ? 'gains strength from this angular position.' : varshaLordHouse && TRIK_HOUSES.has(varshaLordHouse) ? 'faces some challenges from this position — extra effort needed.' : 'works through this house area.'}`;

  const year_summary_hi = `${targetYear} वर्षफल: आपकी सौर वापसी ${varshaChart.sr_date} को ${asc.rashi_hi} वर्ष लग्न के साथ। ${pname(varshesha)} आपके वर्षेश हैं — ${VARSHESHA_DESC[varshesha]?.hi?.split('।')[0]}। वर्ष में ${score >= 4 ? 'प्रबल सकारात्मक' : score <= 2 ? 'चुनौतीपूर्ण' : 'सामान्य'} ऊर्जा है।`;

  return {
    score, target_year: targetYear,
    year_summary_en, year_summary_hi,
    varshesha, varshesha_house: varshaLordHouse,
    varshesha_desc_en: VARSHESHA_DESC[varshesha]?.en || '',
    varshesha_desc_hi: VARSHESHA_DESC[varshesha]?.hi || '',
    indicators_en, indicators_hi,
    house_readings,
    planet_movement,
    career:   areaText(careerHouses,  'career',   BENEFIC_PLANETS, MALEFIC_PLANETS),
    finance:  areaText(financeHouses, 'finance',  BENEFIC_PLANETS, MALEFIC_PLANETS),
    relation: areaText(relHouses,     'relation', BENEFIC_PLANETS, MALEFIC_PLANETS),
    health:   areaText(healthHouses,  'health',   new Set(['Jupiter','Venus','Moon']), new Set(['Saturn','Mars','Rahu','Ketu'])),
  };
}

// ── Main Entry Point ──────────────────────────────────────────────────────────
function generateVarshphal(natalChart, profile, targetYear) {
  if (!natalChart?.planets?.Sun || !natalChart?.ascendant) return null;
  try {
    const rawDate = String(profile.date_of_birth || '').slice(0, 10);
    const [bY, bM, bD] = rawDate.split('-').map(Number);
    if (!bY || !bM || !bD) return null;

    const [hr, mn, sc] = (profile.time_of_birth || '00:00:00').split(':').map(Number);
    const tz    = parseFloat(profile.timezone_offset) || 5.5;
    const lat   = parseFloat(profile.latitude)  || 28.6;
    const lon   = parseFloat(profile.longitude) || 77.2;

    // Birth JD in UT
    const birthJD_UT = eph.julianDay(bY, bM, bD, (hr||0) - tz, (mn||0), (sc||0));

    const natalSunLong = natalChart.planets.Sun.longitude; // sidereal
    const srJD = findSolarReturnJD(natalSunLong, birthJD_UT, targetYear, bY);

    const varshaChart  = computeVarshaChart(srJD, lat, lon, tz);
    const varshesha    = getVarshesha(srJD);
    const muddaDasha   = computeMuddaDasha(varshesha, srJD);
    const analysis     = analyzeVarshaChart(varshaChart, natalChart, varshesha, targetYear);

    return {
      target_year:   targetYear,
      natal_sun_long: +natalSunLong.toFixed(4),
      varsha_chart:   varshaChart,
      varshesha,
      varshesha_hi:  pname(varshesha),
      mudda_dasha:   muddaDasha,
      analysis,
    };
  } catch (e) {
    console.error('[Varshphal] Error:', e.message);
    return null;
  }
}

module.exports = { generateVarshphal };
