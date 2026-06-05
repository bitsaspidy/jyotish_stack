'use strict';
const eph = require('../ephemeris.service');
const { norm, nakExtra, varnaForRashi, vashyaForRashi, rashiFromDeg, nakshatraFromDeg } = require('./core-helpers');
const { RASHIS, NAK_SPAN } = require('./vedic-data');

// ── Masa ──────────────────────────────────────────────────────────────────────
const MASA_NAMES    = ['Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada','Ashwin','Kartika','Margashirsha','Pausa','Magha','Phalguna'];
const MASA_NAMES_HI = ['चैत्र','वैशाख','ज्येष्ठ','आषाढ़','श्रावण','भाद्रपद','आश्विन','कार्तिक','मार्गशीर्ष','पौष','माघ','फाल्गुन'];

function hinduMasa(sunSiderealDeg) {
  const idx = Math.floor(norm(sunSiderealDeg) / 30);
  return { name: MASA_NAMES[idx], name_hi: MASA_NAMES_HI[idx], num: idx + 1 };
}

// ── Nitya Yoga ────────────────────────────────────────────────────────────────
const NITYA_YOGA_NAMES = ['Vishkambha','Preeti','Ayushman','Saubhagya','Sobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghat','Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
const YOGA_AUSPICIOUS  = new Set(['Preeti','Ayushman','Saubhagya','Sobhana','Sukarma','Dhriti','Vriddhi','Dhruva','Harshana','Siddhi','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra']);

function calculateNityaYoga(sunSiderealLon, moonSiderealLon) {
  const combined = norm(sunSiderealLon + moonSiderealLon);
  const idx  = Math.floor(combined / (360 / 27)) % 27;
  const name = NITYA_YOGA_NAMES[idx];
  return { num: idx + 1, name, is_auspicious: YOGA_AUSPICIOUS.has(name) };
}

// ── Tithi ─────────────────────────────────────────────────────────────────────
const TITHI_NAMES_EN = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
const TITHI_NAMES_HI = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी'];

function calculateTithi(sunSidLon, moonSidLon) {
  const diff = norm(moonSidLon - sunSidLon);
  const tithiN30 = Math.floor(diff / 12) + 1;
  const isShukla = tithiN30 <= 15;
  const halfNum  = isShukla ? tithiN30 : tithiN30 - 15;
  const paksha   = isShukla ? 'Shukla' : 'Krishna';
  const nameEn   = halfNum <= 14 ? TITHI_NAMES_EN[halfNum - 1] : (isShukla ? 'Purnima' : 'Amavasya');
  const nameHi   = halfNum <= 14 ? TITHI_NAMES_HI[halfNum - 1] : (isShukla ? 'पूर्णिमा' : 'अमावस्या');
  return { num: tithiN30, half_num: halfNum, paksha, name_en: nameEn, name_hi: nameHi, display_en: `${paksha} ${nameEn}`, display_hi: `${paksha === 'Shukla' ? 'शुक्ल' : 'कृष्ण'} ${nameHi}` };
}

// ── Karana ────────────────────────────────────────────────────────────────────
const MOVABLE_KARANAS = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
function calculateKarana(sunSidLon, moonSidLon) {
  const diff = norm(moonSidLon - sunSidLon);
  const slot = Math.floor(diff / 6);
  let name;
  if      (slot === 0)  name = 'Kimstughna';
  else if (slot === 57) name = 'Shakuni';
  else if (slot === 58) name = 'Chatushpada';
  else if (slot === 59) name = 'Naga';
  else name = MOVABLE_KARANAS[(slot - 1) % 7];
  return { name, slot: slot + 1 };
}

// ── Vara ──────────────────────────────────────────────────────────────────────
const VARA_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const VARA_HI = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
function calculateVara(year, month, day, hour, minute, tzOffsetHrs) {
  const localMs = Date.UTC(year, month - 1, day, hour, minute) - tzOffsetHrs * 3600000;
  const dayNum  = new Date(localMs).getUTCDay();
  return { day_en: VARA_EN[dayNum], day_hi: VARA_HI[dayNum], day_num: dayNum };
}

// ── Pahar ─────────────────────────────────────────────────────────────────────
function calculatePahar(birthHour, birthMinute, sunriseMinsFromMidnight) {
  const birthMins = birthHour * 60 + birthMinute;
  const diff = birthMins - sunriseMinsFromMidnight;
  if (diff < 0) return Math.max(1, Math.floor((diff + 720) / 180) + 5);
  return Math.min(4, Math.floor(diff / 180) + 1);
}

// ── Sunrise/Sunset — delegates to ephemeris.service (astronomy-engine) ───────
const sunriseSunset = eph.sunriseSunset;

// ── Naam Akshar ───────────────────────────────────────────────────────────────
const NAK_AKSHAR = [
  null,
  ['Chu','Che','Cho','La'], ['Li','Lu','Le','Lo'],   ['A','I','U','E'],         ['O','Va','Vi','Vu'],
  ['Ve','Vo','Ka','Ki'],    ['Ku','Gha','Na','Cha'],  ['Ke','Ko','Ha','Hi'],     ['Hu','He','Ho','Da'],
  ['Di','Du','De','Do'],    ['Ma','Mi','Mu','Me'],    ['Mo','Ta','Ti','Tu'],     ['Te','To','Pa','Pi'],
  ['Pu','Sha','Na','Tha'],  ['Pe','Po','Ra','Ri'],    ['Ru','Re','Ro','Ta'],     ['Ti','Tu','Te','To'],
  ['Na','Ni','Nu','Ne'],    ['No','Ya','Yi','Yu'],    ['Ye','Yo','Bha','Bhi'],   ['Bhu','Dha','Pha','Dha'],
  ['Be','Bo','Ja','Ji'],    ['Khi','Khu','Khe','Kho'],['Ga','Gi','Gu','Ge'],    ['Go','Sa','Si','Su'],
  ['Se','So','Da','Di'],    ['Du','Tha','Jha','Na'],  ['De','Do','Cha','Chi'],
];

function calculatePaya(nakNum) {
  if (nakNum <= 9)  return { paya: 'Silver', paya_hi: 'रजत (चाँदी)' };
  if (nakNum <= 18) return { paya: 'Gold',   paya_hi: 'स्वर्ण (सोना)' };
  return { paya: 'Copper', paya_hi: 'ताम्र (तांबा)' };
}

function calculateYunja(degInNakshatra) {
  const third = NAK_SPAN / 3;
  if (degInNakshatra < third)       return { yunja: 'Poorva', yunja_hi: 'पूर्व' };
  if (degInNakshatra < 2 * third)   return { yunja: 'Madhya', yunja_hi: 'मध्य' };
  return { yunja: 'Uttara', yunja_hi: 'उत्तर' };
}

const TATVA_MAP = { Fire:{ en:'Fire', hi:'अग्नि' }, Earth:{ en:'Earth', hi:'पृथ्वी' }, Air:{ en:'Air', hi:'वायु' }, Water:{ en:'Water', hi:'जल' } };
function getTatva(rashiElement) { return TATVA_MAP[rashiElement] || { en: rashiElement, hi: rashiElement }; }

// ── calculatePanchang ─────────────────────────────────────────────────────────
function calculatePanchang(sunSidLon, moonSidLon, year, month, day, hour, minute, latitude, longitude, tzOffsetHrs) {
  const sunRise   = sunriseSunset(latitude, longitude, year, month, day, tzOffsetHrs);
  const tithi     = calculateTithi(sunSidLon, moonSidLon);
  const yoga      = calculateNityaYoga(sunSidLon, moonSidLon);
  const karana    = calculateKarana(sunSidLon, moonSidLon);
  const vara      = calculateVara(year, month, day, hour, minute, tzOffsetHrs);
  const masa      = hinduMasa(sunSidLon);
  const pahar     = sunRise.sunrise_mins ? calculatePahar(hour, minute, sunRise.sunrise_mins) : null;
  return { masa, tithi, vara, yoga, karana, pahar, moon_phase: tithi.num, sunrise: sunRise.sunrise, sunset: sunRise.sunset, sunrise_mins: sunRise.sunrise_mins, sunset_mins: sunRise.sunset_mins };
}

// ── calculateAstroDetails ─────────────────────────────────────────────────────
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

  const varnaObj = varnaForRashi(moonRashiNum);
  const varna    = { name: varnaObj.name, name_hi: { Brahmin:'विप्र (ब्राह्मण)', Kshatriya:'क्षत्रिय', Vaishya:'वैश्य', Shudra:'शूद्र' }[varnaObj.name] || varnaObj.name };
  const vashyaRaw = vashyaForRashi(moonRashiNum);
  const VASHYA_HI  = { chatushpada:'चतुष्पाद', manava:'मानव', jalachara:'जलचर', vanachara:'वनचर', keeta:'कीट' };
  const vashya     = { name: vashyaRaw, name_hi: VASHYA_HI[vashyaRaw] || vashyaRaw };
  const GANA_HI    = { deva:'देव', manushya:'मनुष्य', rakshasa:'राक्षस' };
  const gana       = { name: nakExtra_.gana, name_hi: GANA_HI[nakExtra_.gana] || nakExtra_.gana };
  const NADI_HI    = { adi:'आदि', madhya:'मध्य', antya:'अंत्य', unknown:'—' };
  const nadi       = { name: nakExtra_.nadi, name_hi: NADI_HI[nakExtra_.nadi] || nakExtra_.nadi };
  const yoni       = { name: nakExtra_.yoni };

  const tithi  = calculateTithi(sunSidLon, moonSidLon);
  const yoga   = calculateNityaYoga(sunSidLon, moonSidLon);
  const karana = calculateKarana(sunSidLon, moonSidLon);

  return {
    ascendant_rashi_en: ascendant.rashi_en, ascendant_rashi_hi: ascendant.rashi_hi, ascendant_lord: ascendant.rashi_lord,
    moon_sign_en: moonPlanet.rashi_en, moon_sign_hi: moonPlanet.rashi_hi, moon_sign_lord: moonPlanet.rashi_lord,
    moon_nakshatra_en: moonNakshatra.en, moon_nakshatra_hi: moonNakshatra.hi, moon_nakshatra_lord: moonNakshatra.lord,
    moon_pada: pada,
    varna, vashya, gana, nadi, yoni,
    tatva, paya, yunja,
    naam_akshar: akshar,
    tithi, yoga, karana,
  };
}

module.exports = { hinduMasa, calculateNityaYoga, calculateTithi, calculateKarana, calculateVara, calculatePahar, sunriseSunset, calculatePanchang, calculateAstroDetails, calculatePaya, calculateYunja, getTatva, NAK_AKSHAR };
