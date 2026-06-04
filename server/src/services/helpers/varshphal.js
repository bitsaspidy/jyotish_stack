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

// Rashi → natural lord (index = rashi num 1-12)
const RASHI_LORD = ['','Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
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

// ── House lord for Varsha chart (whole-sign) ──────────────────────────────────
function getHouseLordPlanet(ascRashiNum, houseNum) {
  const rashiNum = ((ascRashiNum - 1 + houseNum - 1) % 12) + 1;
  return RASHI_LORD[rashiNum];
}

// ── Comprehensive Life Areas engine ──────────────────────────────────────────
function buildLifeAreas(varshaChart, houseMap, varshesha) {
  const vp  = varshaChart.planets;
  const asc = varshaChart.ascendant.rashi_num;

  const planetsIn = (hs) => { const r = []; hs.forEach((h) => houseMap[h]?.forEach((p) => r.push(p))); return r; };
  const beneficsIn = (hs) => planetsIn(hs).filter((p) => BENEFIC_PLANETS.has(p));
  const malefsIn  = (hs) => planetsIn(hs).filter((p) => MALEFIC_PLANETS.has(p));

  const houseTone = (hs) => {
    const b = beneficsIn(hs).length, m = malefsIn(hs).length;
    return b > m ? 'favorable' : m > b ? 'challenging' : 'moderate';
  };

  const areaScore = (hs) => {
    let s = 3;
    hs.forEach((h) => {
      houseMap[h]?.forEach((p) => {
        if (BENEFIC_PLANETS.has(p)) s += 0.5;
        if (MALEFIC_PLANETS.has(p)) s -= 0.4;
        if (p === 'Jupiter') s += 0.3;
      });
      const lord = getHouseLordPlanet(asc, h);
      const lh   = vp[lord]?.house;
      if (lh) {
        if (KENDRA_HOUSES.has(lh) || TRIKONA_HOUSES.has(lh)) s += 0.3;
        if (TRIK_HOUSES.has(lh)) s -= 0.3;
      }
    });
    return Math.max(1, Math.min(5, Math.round(s)));
  };

  const area = (titleEn, titleHi, icon, hs, en, hi) => ({
    title_en: titleEn, title_hi: titleHi, icon,
    tone: houseTone(hs), score: areaScore(hs),
    reading_en: en.trim(), reading_hi: hi.trim(),
    planets_involved: planetsIn(hs),
  });

  const h = (n) => houseMap[n] || [];
  const has = (houseNum, planet) => h(houseNum).includes(planet);

  // ── Finance & Wealth ───────────────────────────────────────────
  let fe = 'Finance this year flows through the 2nd (wealth), 11th (income/gains), and 8th (sudden windfalls or losses) Varsha houses. ';
  let fh = 'इस वर्ष वित्त द्वितीय (धन), एकादश (आय) और अष्टम (अचानक लाभ/हानि) भावों से प्रभावित है। ';
  if (has(11,'Jupiter')) { fe += 'Jupiter in the 11th is the strongest income indicator — expect substantial financial gains this year. '; fh += 'गुरु 11वें में — प्रबल आय का संकेत, वित्तीय लाभ। '; }
  if (has(2,'Jupiter') || has(2,'Venus')) { fe += `Benefic(s) in the 2nd strengthen wealth accumulation and family prosperity. `; fh += 'दूसरे में शुभ — धन संचय और पारिवारिक समृद्धि। '; }
  if (has(11,'Saturn')) { fe += 'Saturn in 11th: income comes through sustained hard work — not sudden windfalls. '; fh += 'शनि 11वें में: परिश्रम से आय, तत्काल नहीं। '; }
  if (has(2,'Mars') || has(2,'Rahu') || has(2,'Ketu')) { fe += 'Malefic influence on the 2nd: be cautious with savings, avoid lending money this year. '; fh += 'दूसरे पर पाप प्रभाव: बचत सावधान, उधार से बचें। '; }
  if (has(8,'Jupiter')) { fe += 'Jupiter in the 8th can bring unexpected inheritance or financial windfalls. '; fh += 'गुरु अष्टम में: अचानक धन लाभ या विरासत संभव। '; }
  if (has(12,'Saturn') || has(12,'Rahu')) { fe += 'Malefic in the 12th: monitor hidden expenses, foreign payments, and hospitalization costs. '; fh += '12वें में पाप: छुपे खर्च और विदेश/अस्पताल खर्च पर नजर रखें। '; }
  if (houseTone([2,11,8]) === 'favorable') { fe += 'Overall, financial prospects are positive — a good year to invest and save.'; fh += 'कुल मिलाकर वित्तीय दृष्टिकोण सकारात्मक — निवेश और बचत के लिए उत्तम वर्ष।'; }
  else if (houseTone([2,11,8]) === 'challenging') { fe += 'Caution: monitor expenditure carefully and avoid speculative investments.'; fh += 'सावधान: व्यय पर नियंत्रण रखें, सट्टे से बचें।'; }
  else { fe += 'Finance is steady — moderate income with manageable expenses.'; fh += 'वित्त स्थिर — मध्यम आय और नियंत्रित व्यय।'; }
  const finance = area('Finance & Wealth', 'धन और वित्त', '💰', [2,11,8], fe, fh);

  // ── Luck & Fortune ─────────────────────────────────────────────
  let le = 'Luck and fortune this year flow through the 9th (dharma/fortune) and 5th (purva punya/past merit) Varsha houses. ';
  let lh = 'भाग्य और किस्मत नवम (धर्म/भाग्य) और पंचम (पूर्व पुण्य) वर्ष भावों से आती है। ';
  if (has(9,'Jupiter')) { le += 'Jupiter in the 9th — exceptional blessing: fortune, higher learning, travel, and spiritual growth are all strongly supported. '; lh += 'गुरु नवम में: असाधारण भाग्य, यात्रा और आध्यात्मिक उन्नति। '; }
  if (has(9,'Sun')) { le += 'Sun in 9th: recognition through dharmic activities and paternal blessings flow this year. '; lh += 'सूर्य नवम में: धार्मिक कार्यों से पहचान, पिता का आशीर्वाद। '; }
  if (has(5,'Jupiter')) { le += 'Jupiter in 5th: past-life merit activates — spontaneous good luck and creative breakthroughs appear unexpectedly. '; lh += 'गुरु पंचम में: पूर्व पुण्य सक्रिय — अचानक सौभाग्य और सृजनशीलता। '; }
  if (has(9,'Saturn') || has(9,'Rahu')) { le += 'Malefic in the 9th: fortune requires effort — regular prayer, charity, and dharmic acts are strongly recommended. '; lh += 'नवम पर पाप: नियमित पूजा, दान और धर्म कार्य आवश्यक। '; }
  if (has(5,'Saturn') || has(5,'Ketu')) { le += 'Malefic in the 5th: karmic debts may surface — patience and spiritual practice help clear obstacles. '; lh += 'पंचम पर पाप: कर्म ऋण उभर सकता है — धैर्य और साधना से बाधा दूर होगी। '; }
  if (houseTone([9,5]) === 'favorable') { le += 'This is a fortunate year — trust your instincts and act on opportunities swiftly.'; lh += 'यह सौभाग्यशाली वर्ष है — अंतर्ज्ञान पर विश्वास रखें और अवसर पकड़ें।'; }
  else if (houseTone([9,5]) === 'challenging') { le += 'Fortune must be cultivated through conscious good deeds, spiritual practice, and helping others.'; lh += 'भाग्य सत्कर्म, साधना और परोपकार से मिलेगा।'; }
  else { le += 'Luck is moderate — steady effort combined with right timing brings results.'; lh += 'भाग्य सामान्य — सही समय पर परिश्रम से परिणाम।'; }
  const luck = area('Luck & Fortune', 'भाग्य और किस्मत', '🍀', [9,5], le, lh);

  // ── Family & Home ──────────────────────────────────────────────
  let fme = 'Family and home life this year are anchored in the 2nd (family wealth, speech) and 4th (home, domestic happiness, real estate) Varsha houses. ';
  let fmh = 'परिवार और घर द्वितीय (पारिवारिक धन, वाणी) और चतुर्थ (घर, सुख, संपत्ति) से जुड़े हैं। ';
  if (has(4,'Jupiter')) { fme += 'Jupiter in the 4th: domestic happiness, real estate blessings, and family harmony are strongly indicated. '; fmh += 'गुरु चतुर्थ में: गृह सुख, संपत्ति लाभ और पारिवारिक सद्भाव। '; }
  if (has(4,'Venus')) { fme += 'Venus in the 4th: comfort, beauty in the home, and warm family bonds. '; fmh += 'शुक्र चतुर्थ में: घर में सुख-सुविधा और प्रेम। '; }
  if (has(4,'Moon')) { fme += 'Moon in the 4th: emotionally rich home life — maternal connections and domestic activities are highlighted. '; fmh += 'चंद्र चतुर्थ में: भावपूर्ण घरेलू जीवन, माता से जुड़ाव। '; }
  if (has(4,'Mars')) { fme += 'Mars in the 4th: possible property disputes or household tensions — patience and diplomacy needed. '; fmh += 'मंगल चतुर्थ में: संपत्ति विवाद या गृह कलह संभव — धैर्य रखें। '; }
  if (has(4,'Saturn')) { fme += 'Saturn in the 4th: property matters move slowly but solidly; elderly family members may need care. '; fmh += 'शनि चतुर्थ में: संपत्ति मामले धीमे पर ठोस; बड़ों की देखभाल करें। '; }
  if (has(2,'Jupiter')) { fme += 'Jupiter in the 2nd: family wealth and positive family discussions are highlighted. '; fmh += 'गुरु द्वितीय में: पारिवारिक धन और सकारात्मक संवाद। '; }
  if (houseTone([2,4]) === 'favorable') { fme += 'A warm, harmonious year for family life overall.'; fmh += 'कुल मिलाकर पारिवारिक जीवन सुखद और सामंजस्यपूर्ण।'; }
  else if (houseTone([2,4]) === 'challenging') { fme += 'Some family tensions possible — communication and compromise are key.'; fmh += 'पारिवारिक तनाव संभव — संवाद और समझौता महत्वपूर्ण।'; }
  else { fme += 'Family life is stable with normal everyday ups and downs.'; fmh += 'पारिवारिक जीवन सामान्य उतार-चढ़ाव के साथ स्थिर।'; }
  const family = area('Family & Home', 'परिवार और घर', '🏠', [2,4], fme, fmh);

  // ── Spouse & Marriage ──────────────────────────────────────────
  let se = 'Spouse and marriage matters are governed by the 7th Varsha house — the house of partnerships, contracts, and committed relationships. ';
  let sh = 'जीवनसाथी और विवाह सप्तम वर्ष भाव से जुड़े हैं — साझेदारी, अनुबंध और प्रतिबद्ध संबंधों का भाव। ';
  if (has(7,'Venus')) { se += 'Venus in the 7th is the supreme placement for relationships — marriage, romance, and partnerships are deeply favored this year. '; sh += 'शुक्र सप्तम में: विवाह, प्रेम और साझेदारी के लिए सर्वोत्तम। '; }
  if (has(7,'Jupiter')) { se += 'Jupiter in the 7th: blessings for marriage and deep partnerships — a very favorable year for weddings. '; sh += 'गुरु सप्तम में: विवाह और गहरे संबंधों में शुभता। '; }
  if (has(7,'Moon')) { se += 'Moon in the 7th: emotional depth in relationships — spouse may travel or relocate; nurture emotional bonds. '; sh += 'चंद्र सप्तम में: संबंधों में भावनात्मक गहराई — जीवनसाथी की यात्रा संभव। '; }
  if (has(7,'Mars')) { se += 'Mars in the 7th: passionate but also friction-prone — manage conflicts with patience; avoid ego battles with partner. '; sh += 'मंगल सप्तम में: जोश पर घर्षण भी — धैर्य से संघर्ष प्रबंधित करें। '; }
  if (has(7,'Saturn')) { se += 'Saturn in the 7th: marriage delays for unmarried individuals; married partners face tests of responsibility and maturity. '; sh += 'शनि सप्तम में: अविवाहितों के विवाह में देरी; विवाहितों की जिम्मेदारी परीक्षा। '; }
  if (has(7,'Rahu')) { se += 'Rahu in the 7th: unconventional or foreign relationship events possible — due diligence before any commitment. '; sh += 'राहु सप्तम में: असामान्य संबंध घटनाएं — प्रतिबद्धता से पहले सावधानी। '; }
  if (has(7,'Ketu')) { se += 'Ketu in the 7th: a spiritualizing influence on relationships — detachment or karmic resolution with a partner. '; sh += 'केतु सप्तम में: संबंधों में वैराग्य या कर्म समाधान। '; }
  if (h(7).length === 0) { se += 'No planet occupies the 7th Varsha house — relationship energy flows through the 7th lord\'s placement. '; sh += '7वें वर्ष भाव में कोई ग्रह नहीं — संबंध ऊर्जा सप्तमेश की स्थिति पर निर्भर। '; }
  if (houseTone([7]) === 'favorable') { se += 'Relationships and partnerships flourish — an ideal year for deepening bonds.'; sh += 'संबंध और साझेदारी फलते-फूलते हैं — गहरे बंधन के लिए आदर्श वर्ष।'; }
  else if (houseTone([7]) === 'challenging') { se += 'Relationship challenges may arise — honest, open communication is the best remedy.'; sh += 'संबंधों में चुनौतियां संभव — ईमानदार संवाद सर्वोत्तम उपाय।'; }
  else { se += 'Relationship matters are balanced and stable this year.'; sh += 'संबंध मामले इस वर्ष संतुलित और स्थिर।'; }
  const spouse = area('Spouse & Marriage', 'जीवनसाथी और विवाह', '💍', [7], se, sh);

  // ── Parents ────────────────────────────────────────────────────
  let pe = 'Parents are signified by the 4th house (mother) and 9th house (father) in the Varsha chart. ';
  let ph = 'माता-पिता का विचार चतुर्थ (माता) और नवम (पिता) वर्ष भावों से होता है। ';
  if (has(4,'Jupiter') || has(4,'Venus')) { pe += 'Benefic in the 4th — mother\'s health and wellbeing are blessed; she may bring happiness or good news. '; ph += 'चतुर्थ में शुभ — माता का स्वास्थ्य और सुख में वृद्धि, शुभ समाचार। '; }
  if (has(4,'Saturn') || has(4,'Rahu') || has(4,'Ketu')) { pe += 'Malefic in the 4th — mother may need extra care and attention this year. '; ph += 'चतुर्थ पर पाप — माता की विशेष देखभाल और ध्यान आवश्यक। '; }
  if (has(4,'Mars')) { pe += 'Mars in the 4th can create friction in the household and with the mother — remain patient. '; ph += 'मंगल चतुर्थ में: माता से घर्षण संभव — धैर्य रखें। '; }
  if (has(9,'Jupiter') || has(9,'Venus')) { pe += 'Benefic in the 9th — father\'s blessings, support, and wellbeing are highlighted. '; ph += 'नवम में शुभ — पिता का आशीर्वाद, समर्थन और स्वास्थ्य सुखद। '; }
  if (has(9,'Saturn') || has(9,'Rahu')) { pe += 'Malefic in the 9th — father may need care; relationships with father could have some distance or tension. '; ph += 'नवम पर पाप — पिता की देखभाल और संबंध में तनाव संभव। '; }
  if (houseTone([4,9]) === 'favorable') { pe += 'Overall, a year of parental blessings and harmonious family relationships.'; ph += 'कुल मिलाकर माता-पिता का आशीर्वाद और सुखद संबंध।'; }
  else if (houseTone([4,9]) === 'challenging') { pe += 'Parents may need your active support and care this year — prioritize their wellbeing.'; ph += 'माता-पिता को इस वर्ष आपकी सक्रिय सहायता की आवश्यकता — उनके स्वास्थ्य को प्राथमिकता दें।'; }
  else { pe += 'Parent-related matters are stable this year.'; ph += 'माता-पिता से संबंधित मामले इस वर्ष स्थिर।'; }
  const parents = area('Parents', 'माता-पिता', '👪', [4,9], pe, ph);

  // ── Children (Sons & Daughters) ────────────────────────────────
  let ce = 'Children (sons and daughters) are governed by the 5th Varsha house — the house of progeny, creativity, and past-life merit. ';
  let ch = 'संतान पंचम वर्ष भाव से जुड़ी है — यह संतान, सृजन और पूर्व पुण्य का भाव है। ';
  if (has(5,'Jupiter')) { ce += 'Jupiter in the 5th is the strongest indicator for children — birth of a child is strongly possible; existing children bring joy and notable success. '; ch += 'गुरु पंचम में: नई संतान का योग; मौजूदा बच्चे सुख और उपलब्धि देंगे। '; }
  if (has(5,'Venus')) { ce += 'Venus in the 5th: creative expression and happiness through children; daughters especially are highlighted. '; ch += 'शुक्र पंचम में: संतान से सुख, पुत्री विशेष रूप से चर्चित। '; }
  if (has(5,'Moon')) { ce += 'Moon in the 5th: deep emotional bond with children; their education or wellbeing may need attention. '; ch += 'चंद्र पंचम में: बच्चों से गहरा भावनात्मक जुड़ाव; शिक्षा और स्वास्थ्य पर ध्यान। '; }
  if (has(5,'Mars')) { ce += 'Mars in the 5th: children are energetic and competitive; possible discipline challenges. For pregnancy planning, extra care is advised. '; ch += 'मंगल पंचम में: बच्चे ऊर्जावान; अनुशासन चुनौती संभव। गर्भधारण में सावधानी। '; }
  if (has(5,'Saturn')) { ce += 'Saturn in the 5th: delays in childbirth may persist; existing children may face academic challenges — provide extra support and patience. '; ch += 'शनि पंचम में: संतान में देरी जारी; बच्चों की पढ़ाई पर विशेष ध्यान आवश्यक। '; }
  if (has(5,'Rahu') || has(5,'Ketu')) { ce += 'Rahu/Ketu in the 5th: unusual events involving children; unconventional interests or karmic themes around progeny. '; ch += 'राहु/केतु पंचम में: असामान्य घटनाएं; कर्म और संतान विषय उभरेंगे। '; }
  if (h(5).length === 0) { ce += 'The 5th Varsha house is unoccupied — children matters depend on the strength of the 5th lord. '; ch += 'पंचम वर्ष भाव खाली — संतान मामले पंचमेश पर निर्भर। '; }
  if (houseTone([5]) === 'favorable') { ce += 'Children bring happiness and positive milestones this year.'; ch += 'इस वर्ष संतान सुख और शुभ उपलब्धियां लाएगी।'; }
  else if (houseTone([5]) === 'challenging') { ce += 'Children may need extra guidance and attention this year.'; ch += 'बच्चों को इस वर्ष विशेष मार्गदर्शन और ध्यान की आवश्यकता।'; }
  else { ce += 'Children-related matters are stable with no major events expected.'; ch += 'संतान से संबंधित मामले सामान्य, बड़ी घटना की संभावना नहीं।'; }
  const children = area('Children (Sons & Daughters)', 'संतान (पुत्र और पुत्री)', '👶', [5], ce, ch);

  // ── Siblings (Brothers & Sisters) ─────────────────────────────
  let sibe = 'Brothers and sisters are governed by the 3rd Varsha house — also the house of courage, communication, and short travel. ';
  let sibh = 'भाई-बहन तृतीय वर्ष भाव से जुड़े हैं — यह साहस, संवाद और छोटी यात्राओं का भी भाव है। ';
  if (has(3,'Jupiter')) { sibe += 'Jupiter in the 3rd: siblings bring support, positive news, and a spirit of cooperation. '; sibh += 'गुरु तृतीय में: भाई-बहन से सहायता और शुभ समाचार। '; }
  if (has(3,'Mercury')) { sibe += 'Mercury in the 3rd: excellent for communication, writing, and business dealings with or through siblings. '; sibh += 'बुध तृतीय में: संवाद, लेखन और भाई-बहन के साथ व्यापार के लिए उत्कृष्ट। '; }
  if (has(3,'Venus')) { sibe += 'Venus in the 3rd: creative collaborations and pleasurable short trips with siblings or friends. '; sibh += 'शुक्र तृतीय में: भाई-बहन के साथ रचनात्मक सहयोग और यात्रा। '; }
  if (has(3,'Mars')) { sibe += 'Mars in the 3rd: great personal courage and initiative, but sibling disputes or arguments are possible — choose battles wisely. '; sibh += 'मंगल तृतीय में: साहस और पहल — पर भाई-बहन से मतभेद संभव। '; }
  if (has(3,'Saturn') || has(3,'Rahu')) { sibe += 'Malefic in the 3rd: distance, misunderstandings, or delayed communication with siblings this year. '; sibh += 'तृतीय में पाप: भाई-बहन से दूरी या गलतफहमी संभव। '; }
  if (houseTone([3]) === 'favorable') { sibe += 'Sibling relationships are supportive and cooperative this year.'; sibh += 'भाई-बहन से संबंध सहायक और सकारात्मक।'; }
  else if (houseTone([3]) === 'challenging') { sibe += 'Maintain patience and clear communication with siblings to avoid unnecessary conflicts.'; sibh += 'भाई-बहन से संयम और स्पष्ट संवाद बनाए रखें।'; }
  else { sibe += 'Sibling relationships are normal and stable this year.'; sibh += 'भाई-बहन संबंध सामान्य और स्थिर।'; }
  const siblings = area('Siblings (Brothers & Sisters)', 'भाई-बहन', '🤝', [3], sibe, sibh);

  // ── Education & Learning ────────────────────────────────────────
  let ee = 'Education and learning connect the 4th (foundational learning), 5th (intellect and creative mind), and 9th (higher education, gurus, and philosophy) Varsha houses. ';
  let eh = 'शिक्षा चतुर्थ (प्रारंभिक), पंचम (बुद्धि/मन) और नवम (उच्च शिक्षा, गुरु) वर्ष भावों से जुड़ी है। ';
  if (has(9,'Jupiter')) { ee += 'Jupiter in the 9th — outstanding year for higher studies, research, and learning from great teachers or mentors. '; eh += 'गुरु नवम में: उच्च शिक्षा, शोध और श्रेष्ठ गुरु से सीखने के लिए उत्कृष्ट। '; }
  if (has(5,'Mercury')) { ee += 'Mercury in the 5th: sharp analytical mind — excellent for exams, competitive tests, and new skill acquisition. '; eh += 'बुध पंचम में: तेज बुद्धि — परीक्षाओं और नई कौशल के लिए उत्कृष्ट। '; }
  if (has(5,'Jupiter')) { ee += 'Jupiter in the 5th: learning comes naturally this year — all students benefit from this placement. '; eh += 'गुरु पंचम में: सीखना स्वाभाविक — सभी छात्रों के लिए लाभदायक। '; }
  if (has(4,'Saturn')) { ee += 'Saturn in the 4th: educational progress may feel slow — discipline and consistent routine will ultimately pay off. '; eh += 'शनि चतुर्थ में: शिक्षा में धीमी प्रगति — नियमित दिनचर्या और अनुशासन से फल। '; }
  if (has(5,'Rahu')) { ee += 'Rahu in the 5th: interest in unconventional subjects, technology, AI, or foreign educational opportunities. '; eh += 'राहु पंचम में: तकनीक, AI या विदेशी शिक्षा में रुचि। '; }
  if (has(9,'Saturn') || has(9,'Rahu')) { ee += 'Malefic in the 9th: higher education or certification may face delays — persistent effort and guidance from a mentor are key. '; eh += 'नवम पर पाप: उच्च शिक्षा में देरी — गुरु का मार्गदर्शन और लगातार प्रयास आवश्यक। '; }
  if (houseTone([4,5,9]) === 'favorable') { ee += 'A strong year for education, skill development, and intellectual growth.'; eh += 'शिक्षा, कौशल और बौद्धिक विकास के लिए मजबूत वर्ष।'; }
  else if (houseTone([4,5,9]) === 'challenging') { ee += 'Educational matters need extra focus and effort — consistency is the key.'; eh += 'शिक्षा में अतिरिक्त ध्यान और प्रयास आवश्यक।'; }
  else { ee += 'Education progresses steadily with normal effort.'; eh += 'सामान्य प्रयास से शिक्षा में स्थिर प्रगति।'; }
  const education = area('Education & Learning', 'शिक्षा और विद्या', '📚', [4,5,9], ee, eh);

  // ── Job & Service ──────────────────────────────────────────────
  let je = 'Job and service matters this year are governed by the 10th (career, authority, social standing) and 6th (work, daily service, competition) Varsha houses. ';
  let jh = 'नौकरी और सेवा दशम (करियर, अधिकार) और षष्ठ (कार्य, सेवा, प्रतिस्पर्धा) वर्ष भावों से जुड़े हैं। ';
  if (has(10,'Sun')) { je += 'Sun in the 10th: career is in the spotlight — promotion, recognition, and authority are at a peak. '; jh += 'सूर्य दशम में: करियर में पहचान, पदोन्नति और अधिकार चरम पर। '; }
  if (has(10,'Jupiter')) { je += 'Jupiter in the 10th: significant career growth, new professional opportunities, and expanding responsibilities. '; jh += 'गुरु दशम में: करियर में महत्वपूर्ण वृद्धि और नए अवसर। '; }
  if (has(10,'Saturn')) { je += 'Saturn in the 10th: hard work is non-negotiable but results are lasting and respected — no shortcuts this year. '; jh += 'शनि दशम में: कठिन परिश्रम से टिकाऊ परिणाम — कोई शॉर्टकट नहीं। '; }
  if (has(10,'Mars')) { je += 'Mars in the 10th: high ambition and competitive drive at work — great for those who need to assert themselves professionally. '; jh += 'मंगल दशम में: उच्च महत्वाकांक्षा और कार्यस्थल में प्रतिस्पर्धा। '; }
  if (has(6,'Mars')) { je += 'Mars in the 6th: excellent for overcoming competition and workplace obstacles — strong work stamina. '; jh += 'मंगल षष्ठ में: प्रतियोगिता पर विजय और कार्यस्थल में उत्तम ऊर्जा। '; }
  if (has(6,'Saturn')) { je += 'Saturn in the 6th: routine work may feel burdensome; health at the workplace needs monitoring. '; jh += 'शनि षष्ठ में: दिनचर्या भारी लग सकती है; कार्यस्थल स्वास्थ्य पर ध्यान। '; }
  if (has(6,'Jupiter') || has(6,'Venus')) { je += 'Benefic in the 6th: workplace relationships are smooth and disputes can be resolved easily this year. '; jh += 'षष्ठ में शुभ: कार्यस्थल संबंध सुगम, विवाद आसानी से सुलझेंगे। '; }
  if (houseTone([10,6]) === 'favorable') { je += 'Excellent year for career advancement, recognition, and professional achievements.'; jh += 'करियर में उन्नति और व्यावसायिक सफलता के लिए उत्कृष्ट वर्ष।'; }
  else if (houseTone([10,6]) === 'challenging') { je += 'Job matters require extra patience — avoid conflicts with superiors and stay focused on results.'; jh += 'नौकरी में अतिरिक्त धैर्य — वरिष्ठों से विवाद से बचें, परिणाम पर ध्यान दें।'; }
  else { je += 'Career is stable this year with moderate, steady growth potential.'; jh += 'करियर स्थिर — मध्यम और स्थिर वृद्धि की संभावना।'; }
  const job = area('Job & Service', 'नौकरी और सेवा', '🏢', [10,6], je, jh);

  // ── Business & Trade ───────────────────────────────────────────
  let be = 'Business and trade connect the 7th (partnerships, deals, contracts), 10th (brand and reputation), and 11th (income, new clients, gains) Varsha houses. ';
  let bh = 'व्यापार सप्तम (साझेदारी), दशम (प्रतिष्ठा) और एकादश (आय, लाभ) वर्ष भावों से जुड़ा है। ';
  if (has(11,'Jupiter')) { be += 'Jupiter in the 11th: exceptional business income — new clients, deals, and revenue streams are strongly favored. '; bh += 'गुरु 11वें में: व्यापार में असाधारण आय, नए ग्राहक और राजस्व। '; }
  if (has(7,'Venus')) { be += 'Venus in the 7th: business partnerships flourish — new alliances and contracts bring prosperity. '; bh += 'शुक्र सप्तम में: व्यापारिक साझेदारी उत्तम — नए गठबंधन और अनुबंध। '; }
  if (has(7,'Mercury')) { be += 'Mercury in the 7th: excellent for trade, negotiations, and deal-making — communication skills bring business success. '; bh += 'बुध सप्तम में: व्यापार, वार्ता और सौदों के लिए उत्कृष्ट। '; }
  if (has(7,'Jupiter')) { be += 'Jupiter in the 7th: a wise and trustworthy business partner may enter your life; existing partnerships expand. '; bh += 'गुरु सप्तम में: विश्वसनीय व्यापारिक साझेदार मिल सकता है; मौजूदा साझेदारी विस्तृत होगी। '; }
  if (has(7,'Saturn')) { be += 'Saturn in the 7th: choose business partners with great care — delays and heavy responsibilities in existing partnerships. '; bh += 'शनि सप्तम में: साझेदार सावधानी से चुनें — मौजूदा साझेदारी में देरी और जिम्मेदारी। '; }
  if (has(7,'Rahu')) { be += 'Rahu in the 7th: unusual foreign business opportunities may surface — thorough due diligence is critical. '; bh += 'राहु सप्तम में: विदेशी व्यापार अवसर — पूरी जांच-पड़ताल जरूरी। '; }
  if (has(10,'Sun') || has(10,'Jupiter')) { be += 'Benefic influence on the 10th: business reputation and brand visibility grow significantly. '; bh += 'दशम में शुभ: व्यापारिक प्रतिष्ठा और ब्रांड दृश्यता में वृद्धि। '; }
  if (houseTone([7,10,11]) === 'favorable') { be += 'A strong year for business growth, new ventures, and revenue expansion.'; bh += 'व्यापार वृद्धि और नए उद्यम के लिए मजबूत वर्ष।'; }
  else if (houseTone([7,10,11]) === 'challenging') { be += 'Business requires careful planning — avoid hasty deals and new high-risk partnerships.'; bh += 'व्यापार में सावधानीपूर्वक योजना — जल्दबाजी में सौदे और जोखिम भरी साझेदारी से बचें।'; }
  else { be += 'Business is steady — maintain existing relationships and look for incremental growth.'; bh += 'व्यापार स्थिर — मौजूदा संबंध बनाए रखें, क्रमिक वृद्धि पर ध्यान दें।'; }
  const business = area('Business & Trade', 'व्यापार और कारोबार', '📊', [7,10,11], be, bh);

  // ── Health & Vitality ──────────────────────────────────────────
  let he = 'Health and vitality flow through the 1st (physical body), 6th (immunity and disease), and 8th (chronic conditions and sudden health events) Varsha houses. ';
  let hh = 'स्वास्थ्य प्रथम (शरीर), षष्ठ (रोग प्रतिरोध) और अष्टम (पुराने रोग, अचानक घटना) वर्ष भावों से जुड़ा है। ';
  if (has(1,'Jupiter')) { he += 'Jupiter in the 1st Varsha house: excellent physical vitality and overall health energy throughout the year. '; hh += 'गुरु प्रथम में: वर्ष भर उत्कृष्ट शारीरिक ऊर्जा और स्वास्थ्य। '; }
  if (has(1,'Saturn')) { he += 'Saturn in the 1st: chronic conditions may surface — regular health checkups and consistent self-care are essential. '; hh += 'शनि प्रथम में: पुराने रोग उभर सकते हैं — नियमित जांच और देखभाल जरूरी। '; }
  if (has(1,'Mars')) { he += 'Mars in the 1st: high physical drive but risk of accidents, injuries, cuts, or inflammatory fever — exercise with care. '; hh += 'मंगल प्रथम में: ऊर्जा उच्च — पर दुर्घटना, चोट या बुखार का जोखिम। '; }
  if (has(1,'Moon')) { he += 'Moon in the 1st: mental and emotional health are prominent — stress management and quality sleep are critical. '; hh += 'चंद्र प्रथम में: मानसिक और भावनात्मक स्वास्थ्य पर ध्यान — तनाव प्रबंधन महत्वपूर्ण। '; }
  if (has(6,'Mars')) { he += 'Mars in the 6th: strong immunity and ability to defeat illness — but watch for inflammation or infections. '; hh += 'मंगल षष्ठ में: मजबूत प्रतिरक्षा — पर सूजन और संक्रमण से सावधान। '; }
  if (has(6,'Saturn')) { he += 'Saturn in the 6th: chronic digestive or joint issues may need ongoing attention throughout the year. '; hh += 'शनि षष्ठ में: पाचन या जोड़ों की समस्या पर वर्ष भर ध्यान दें। '; }
  if (has(8,'Saturn')) { he += 'Saturn in the 8th: do not ignore persistent symptoms — get a thorough medical evaluation; manage stress around health anxieties. '; hh += 'शनि अष्टम में: लगातार लक्षणों को नजरअंदाज न करें — पूरी जांच करें। '; }
  if (has(8,'Rahu') || has(8,'Ketu')) { he += 'Rahu/Ketu in the 8th: mysterious or hard-to-diagnose health issues possible — seek second medical opinions if needed. '; hh += 'राहु/केतु अष्टम में: रहस्यमय स्वास्थ्य समस्याएं संभव — दूसरी चिकित्सा राय लें। '; }
  if (houseTone([1,6,8]) === 'favorable') { he += 'Overall health is robust this year — maintain good habits to sustain vitality.'; hh += 'समग्र स्वास्थ्य मजबूत — अच्छी आदतें जारी रखें।'; }
  else if (houseTone([1,6,8]) === 'challenging') { he += 'Pay careful attention to health — prevention, regular checkups, and a disciplined lifestyle are essential.'; hh += 'स्वास्थ्य पर विशेष ध्यान — रोकथाम और नियमित जांच आवश्यक।'; }
  else { he += 'Health is generally stable — normal self-care is sufficient this year.'; hh += 'स्वास्थ्य सामान्यतः स्थिर — सामान्य देखभाल पर्याप्त।'; }
  const health = area('Health & Vitality', 'स्वास्थ्य और जीवनी शक्ति', '🌿', [1,6,8], he, hh);

  // ── Cautions (dynamic, based on chart) ────────────────────────
  const cautions = [];
  if (has(8,'Saturn') || has(8,'Rahu')) {
    cautions.push({ icon:'⚠️',
      title_en:'Guard Against Sudden Events', title_hi:'अचानक घटनाओं के लिए तैयार रहें',
      desc_en:'Saturn or Rahu in the 8th Varsha house signals potential sudden disruptions in health, finances, or life circumstances. Build an emergency fund, review insurance, and avoid reckless ventures this year.',
      desc_hi:'8वें में शनि/राहु — अचानक वित्त, स्वास्थ्य या जीवन में उथल-पुथल संभव। आपातकालीन निधि बनाएं, बीमा समीक्षा करें और जोखिम भरे काम से बचें।',
    });
  }
  if (malefsIn([6]).length >= 2) {
    cautions.push({ icon:'⚠️',
      title_en:'Multiple Challenges in the 6th House', title_hi:'षष्ठ भाव में बहु-पाप प्रभाव',
      desc_en:'Two or more malefic planets in the 6th house can amplify enemies, legal disputes, workplace conflicts, and health issues simultaneously. Stay away from litigation, resolve disputes early.',
      desc_hi:'षष्ठ में दो या अधिक पाप ग्रह — शत्रु, कानूनी विवाद और स्वास्थ्य एकसाथ चुनौती दे सकते हैं। मुकदमेबाजी से दूर रहें, विवाद जल्दी सुलझाएं।',
    });
  }
  if (malefsIn([12]).length >= 2) {
    cautions.push({ icon:'💸',
      title_en:'Watch for Hidden Expenses & Losses', title_hi:'छुपे खर्च और हानि से सावधान',
      desc_en:'Strong malefic activity in the 12th Varsha house can drain finances through hidden costs, hospitalization, foreign transactions, or theft. Track all expenditure meticulously this year.',
      desc_hi:'12वें में बहु-पाप — छुपे खर्च, अस्पताल, विदेश या चोरी से नुकसान संभव। सभी खर्चों का पूरा हिसाब रखें।',
    });
  }
  if (has(7,'Saturn') || has(7,'Mars')) {
    cautions.push({ icon:'🤝',
      title_en:'Caution with Partnerships & Contracts', title_hi:'साझेदारी और अनुबंधों में सावधानी',
      desc_en:'Malefic planets in the 7th Varsha house: Do not enter major business partnerships or sign high-value contracts hastily. Read all terms thoroughly; legal review is strongly recommended.',
      desc_hi:'सप्तम पर पाप — जल्दबाजी में साझेदारी या बड़े अनुबंध से बचें। सभी शर्तें पढ़ें; कानूनी समीक्षा लें।',
    });
  }
  if (has(4,'Mars') || has(4,'Rahu') || has(4,'Saturn')) {
    cautions.push({ icon:'🏠',
      title_en:'Home & Property Needs Careful Handling', title_hi:'घर और संपत्ति विषयों में सावधानी',
      desc_en:'Malefic in the 4th Varsha house: Property transactions, home renovation decisions, and domestic tensions require extra care. Avoid property investments without full legal due diligence.',
      desc_hi:'चतुर्थ पर पाप — संपत्ति लेनदेन और घरेलू मामलों में सावधानी जरूरी। पूरी कानूनी जांच के बिना संपत्ति निवेश न करें।',
    });
  }
  const lagna_lord = getHouseLordPlanet(asc, 1);
  const lagnaLordHouse = vp[lagna_lord]?.house;
  if (lagnaLordHouse && TRIK_HOUSES.has(lagnaLordHouse)) {
    cautions.push({ icon:'🌑',
      title_en:'Lagna Lord in a Trik House — Extra Self-Care', title_hi:'लग्नेश त्रिक भाव में — अतिरिक्त आत्म-देखभाल',
      desc_en:`The Lagna lord (${lagna_lord}) occupies the ${lagnaLordHouse}th house (a challenging Trik house) in your Varsha chart. This is a year requiring extra attention to personal health, energy management, and avoiding self-sabotage.`,
      desc_hi:`लग्नेश ${pname(lagna_lord)} ${lagnaLordHouse}वें (त्रिक) भाव में है — व्यक्तिगत स्वास्थ्य, ऊर्जा प्रबंधन और आत्म-नुकसान से बचें।`,
    });
  }

  // ── Key Advice — things to know before any major work ─────────
  const keyAdvice = [];

  // Varshesha alignment advice
  const varshaeshaGuidance = {
    Sun:     { en:'Be visible, lead with confidence, work with government or authority figures, and express your authentic self.', hi:'दृश्यमान रहें, नेतृत्व करें, सरकारी/प्राधिकार के साथ काम करें, प्रामाणिक बनें।' },
    Moon:    { en:'Trust your intuition, adapt to changes fluidly, nurture your home and mind, and avoid overthinking.', hi:'अंतर्ज्ञान पर भरोसा करें, परिवर्तन को सहजता से स्वीकारें, घर और मन को पोषित करें।' },
    Mars:    { en:'Act boldly and decisively, channel energy into focused projects, and control anger and impulsiveness.', hi:'साहस और निर्णय के साथ कार्य करें, ऊर्जा को केंद्रित परियोजनाओं में लगाएं, क्रोध नियंत्रित रखें।' },
    Mercury: { en:'Communicate, negotiate, learn new skills, and leverage your analytical mind for trade and writing.', hi:'संवाद करें, वार्ता करें, नई कौशल सीखें, व्यापार और लेखन में विश्लेषण का उपयोग करें।' },
    Jupiter: { en:'Expand, teach, learn from wise mentors, be generous, and grow in wisdom and prosperity.', hi:'विस्तार करें, श्रेष्ठ गुरु से सीखें, उदार रहें, ज्ञान और समृद्धि में वृद्धि करें।' },
    Venus:   { en:'Create beauty, invest in relationships, pursue art or luxury, and build comfort around yourself.', hi:'सौंदर्य सृजित करें, संबंधों में निवेश करें, कला या सुविधाओं का पीछा करें।' },
    Saturn:  { en:'Work hard with patient consistency, serve dutifully, build for the long term, and avoid shortcuts.', hi:'धैर्य और परिश्रम से काम करें, कर्तव्यनिष्ठा रखें, दीर्घकालिक निर्माण करें, शॉर्टकट से बचें।' },
  };
  keyAdvice.push({
    icon: '🌟',
    title_en: `Align with Your Varshesha ${varshesha}`,
    title_hi: `अपने वर्षेश ${pname(varshesha)} के अनुरूप चलें`,
    desc_en: `Your Year Lord is ${varshesha}. Before starting any major work this year, ask: "Does this align with ${varshesha}'s energy?" ${varshaeshaGuidance[varshesha]?.en || ''} Decisions that flow with the Varshesha's natural significations will yield the best results.`,
    desc_hi: `आपके वर्षेश ${pname(varshesha)} हैं। कोई भी बड़ा काम शुरू करने से पहले पूछें: "क्या यह ${pname(varshesha)} की ऊर्जा के अनुरूप है?" ${varshaeshaGuidance[varshesha]?.hi || ''} वर्षेश के अनुसार लिए गए निर्णय सबसे अच्छे फल देते हैं।`,
  });

  // Best houses to leverage
  const bestHouses = Object.entries(houseMap)
    .filter(([, ps]) => ps.some((p) => BENEFIC_PLANETS.has(p)))
    .map(([hn]) => parseInt(hn))
    .sort((a, b) => {
      const scoreH = (n) => {
        let s = 0;
        houseMap[n]?.forEach((p) => { if (p === 'Jupiter') s += 3; else if (BENEFIC_PLANETS.has(p)) s += 1; });
        return s;
      };
      return scoreH(b) - scoreH(a);
    });
  if (bestHouses.length > 0) {
    keyAdvice.push({
      icon: '✨',
      title_en: 'Focus Your Energy on These Houses',
      title_hi: 'इन भावों पर अपनी ऊर्जा केंद्रित करें',
      desc_en: `Houses ${bestHouses.slice(0,3).map(ordinal).join(', ')} have benefic planetary presence this year. Investments, key decisions, and major actions focused on life areas governed by these houses will yield the best returns.`,
      desc_hi: `${bestHouses.slice(0,3).join('वें, ')}वें भावों में इस वर्ष शुभ ग्रह हैं। इन भावों से जुड़े जीवन क्षेत्रों पर ऊर्जा और निवेश केंद्रित करें — सर्वोत्तम परिणाम मिलेंगे।`,
    });
  }

  // Avoid trik house areas
  const trikPlanets = [6,8,12].flatMap((h2) => houseMap[h2]?.filter((p) => BENEFIC_PLANETS.has(p)) || []);
  if (trikPlanets.length > 0) {
    keyAdvice.push({
      icon: '🔄',
      title_en: 'Benefics in Trik Houses — Redirect Their Energy',
      title_hi: 'त्रिक भावों में शुभ ग्रह — उनकी ऊर्जा सही दिशा में लगाएं',
      desc_en: `Benefic planet(s) ${[...new Set(trikPlanets)].join(', ')} are placed in the 6th, 8th, or 12th Varsha houses (Trik houses). While these can indicate hidden blessings, they also need careful handling. Channel this energy toward spiritual practice, foreign work, or service — not risky speculation or suppressed emotions.`,
      desc_hi: `शुभ ग्रह ${[...new Set(trikPlanets)].map(pname).join(', ')} त्रिक (6/8/12) भावों में हैं। इनकी ऊर्जा को साधना, सेवा या विदेश कार्य की दिशा में लगाएं — जोखिम या दबी भावनाओं में नहीं।`,
    });
  }

  // Timing advice
  keyAdvice.push({
    icon: '📅',
    title_en: 'Use Mudda Dasha Timing Wisely',
    title_hi: 'मुद्दा दशा के समय का सदुपयोग करें',
    desc_en: 'The Mudda Dasha tab shows your annual planetary periods. Start major projects, sign contracts, make investments, or take important decisions during the Mudda Dasha of a benefic planet (Jupiter, Venus, or Mercury). Avoid irreversible decisions during malefic periods (Saturn, Mars, Rahu, Ketu) unless absolutely necessary.',
    desc_hi: 'मुद्दा दशा टैब में वार्षिक ग्रह काल दिखाए गए हैं। शुभ ग्रह (गुरु, शुक्र, बुध) की मुद्दा दशा में बड़े काम, अनुबंध, निवेश और महत्वपूर्ण निर्णय लें। पाप (शनि, मंगल, राहु, केतु) दशा में अपरिवर्तनीय निर्णय यथासंभव टालें।',
  });

  keyAdvice.push({
    icon: '🙏',
    title_en: 'Strengthen the Year with Spiritual Practice',
    title_hi: 'साधना और सत्कर्म से वर्ष को सशक्त बनाएं',
    desc_en: `Every Varshphal is elevated by regular spiritual practice aligned with the Varshesha. For ${varshesha} as Year Lord: ${varshesha === 'Sun' ? 'Surya Namaskar daily, offer water to the sun at sunrise, and honor your father.' : varshesha === 'Moon' ? 'Moon meditation, visit a water body on Mondays, and care for your mother.' : varshesha === 'Mars' ? 'Hanuman worship, red offerings on Tuesdays, and practice courage in action.' : varshesha === 'Mercury' ? 'Read sacred texts, worship Vishnu on Wednesdays, and donate green items.' : varshesha === 'Jupiter' ? 'Guru puja, read Vishnu Sahasranama, yellow offerings on Thursdays, and seek a teacher.' : varshesha === 'Venus' ? 'Lakshmi puja on Fridays, white flowers, and practice gratitude and generosity.' : 'Shani puja on Saturdays, oil lamps for Saturn, serve the elderly and needy.'} These simple acts align your energy with the year's cosmic frequency.`,
    desc_hi: `प्रत्येक वर्षफल को नियमित साधना से सशक्त बनाया जा सकता है। ${pname(varshesha)} वर्षेश के लिए: ${varshesha === 'Sun' ? 'प्रतिदिन सूर्य नमस्कार करें, सूर्योदय पर जल अर्पित करें, पिता का सम्मान करें।' : varshesha === 'Moon' ? 'सोमवार को जलाशय दर्शन, माता की सेवा, चंद्र ध्यान।' : varshesha === 'Mars' ? 'मंगलवार को हनुमान पूजा, लाल वस्तुएं दान, साहस के साथ कार्य करें।' : varshesha === 'Mercury' ? 'बुधवार को विष्णु पूजा, हरी वस्तुएं दान, पवित्र ग्रंथ पढ़ें।' : varshesha === 'Jupiter' ? 'गुरुवार को गुरु पूजा, पीली वस्तुएं दान, विष्णु सहस्रनाम पाठ, किसी गुरु से मार्गदर्शन लें।' : varshesha === 'Venus' ? 'शुक्रवार को लक्ष्मी पूजा, सफेद फूल, कृतज्ञता और उदारता का अभ्यास।' : 'शनिवार को शनि पूजा, तेल का दीपक, वृद्धों और जरूरतमंदों की सेवा करें।'} ये सरल कार्य आपकी ऊर्जा को वर्ष की ब्रह्मांडीय आवृत्ति के साथ संरेखित करते हैं।`,
  });

  return { finance, luck, family, spouse, parents, children, siblings, education, job, business, health, cautions, key_advice: keyAdvice };
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
    life_areas: buildLifeAreas(varshaChart, houseMap, varshesha),
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

// ── Compact summary for multi-year strip ─────────────────────────────────────
function compactVarshphal(result) {
  if (!result) return null;
  const an = result.analysis;
  const la = an?.life_areas;
  return {
    target_year:      result.target_year,
    score:            an?.score || 3,
    varshesha:        result.varshesha,
    varshesha_hi:     result.varshesha_hi,
    sr_date:          result.varsha_chart?.sr_date,
    sr_weekday:       result.varsha_chart?.sr_weekday,
    sr_weekday_hi:    result.varsha_chart?.sr_weekday_hi,
    varsha_lagna_en:  result.varsha_chart?.ascendant?.rashi_en,
    varsha_lagna_hi:  result.varsha_chart?.ascendant?.rashi_hi,
    indicators_en:    an?.indicators_en?.slice(0, 2) || [],
    indicators_hi:    an?.indicators_hi?.slice(0, 2) || [],
    year_summary_en:  an?.year_summary_en?.split('.').slice(0, 2).join('.') + '.' || '',
    year_summary_hi:  an?.year_summary_hi?.split('।').slice(0, 2).join('।') + '।' || '',
    areas: la ? {
      finance: la.finance?.tone,  finance_score: la.finance?.score,
      luck:    la.luck?.tone,     luck_score:    la.luck?.score,
      family:  la.family?.tone,   family_score:  la.family?.score,
      spouse:  la.spouse?.tone,   spouse_score:  la.spouse?.score,
      health:  la.health?.tone,   health_score:  la.health?.score,
      career:  la.job?.tone,      career_score:  la.job?.score,
      business: la.business?.tone, business_score: la.business?.score,
      children: la.children?.tone, children_score: la.children?.score,
      education: la.education?.tone, education_score: la.education?.score,
      parents:  la.parents?.tone, parents_score:  la.parents?.score,
      siblings: la.siblings?.tone, siblings_score: la.siblings?.score,
    } : {},
    varshesha_desc_short_en: an?.varshesha_desc_en?.split('.')[0] + '.' || '',
    varshesha_desc_short_hi: an?.varshesha_desc_hi?.split('।')[0] + '।' || '',
    caution_count: la?.cautions?.length || 0,
  };
}

module.exports = { generateVarshphal, compactVarshphal };
