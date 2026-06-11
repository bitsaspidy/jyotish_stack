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

// ── Ritu (Season) ────────────────────────────────────────────────────────────
const RITU_EN = ['Vasanta','Grishma','Varsha','Sharad','Hemanta','Shishira'];
const RITU_HI = ['वसंत','ग्रीष्म','वर्षा','शरद','हेमंत','शिशिर'];
function getRitu(sunSidLon) {
  const idx = Math.floor(norm(sunSidLon) / 60) % 6;
  return { en: RITU_EN[idx], hi: RITU_HI[idx] };
}

// ── Ayana ─────────────────────────────────────────────────────────────────────
function getAyana(sunSidLon) {
  const lon = norm(sunSidLon);
  const isUttara = lon >= 270 || lon < 90;
  return { en: isUttara ? 'Uttarayana' : 'Dakshinayana', hi: isUttara ? 'उत्तरायण' : 'दक्षिणायण' };
}

// ── Moonrise / Moonset (astronomy-engine) ─────────────────────────────────────
function moonriseMoonset(lat, lon, year, month, day, tzOffsetHrs) {
  const Astronomy = require('astronomy-engine');
  const observer  = new Astronomy.Observer(lat, lon, 0);
  const startUtc  = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - Math.round(tzOffsetHrs * 3600000));
  const riseTime  = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, startUtc, 1.5);
  const setTime   = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, startUtc, 1.5);
  const toLocalMins = (t) => {
    if (!t) return null;
    return ((Math.round(t.date.getTime() / 60000) + Math.round(tzOffsetHrs * 60)) % 1440 + 1440) % 1440;
  };
  const fmtHHMM = (mins) => {
    if (mins === null) return null;
    const h = Math.floor(mins / 60), m = mins % 60;
    const ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`;
  };
  const riseMins = toLocalMins(riseTime);
  const setMins  = toLocalMins(setTime);
  return { moonrise: fmtHHMM(riseMins), moonset: fmtHHMM(setMins), moonrise_mins: riseMins, moonset_mins: setMins };
}

// ── Chaughadiya ───────────────────────────────────────────────────────────────
const CHAUGHADIYA_NAMES = {
  Udveg:  { en:'Udveg',  hi:'उद्वेग',  auspicious:false },
  Char:   { en:'Char',   hi:'चर',      auspicious:true  },
  Labh:   { en:'Labh',   hi:'लाभ',     auspicious:true  },
  Amrit:  { en:'Amrit',  hi:'अमृत',    auspicious:true  },
  Kaal:   { en:'Kaal',   hi:'काल',     auspicious:false },
  Shubh:  { en:'Shubh',  hi:'शुभ',     auspicious:true  },
  Rog:    { en:'Rog',    hi:'रोग',     auspicious:false },
};
const DAY_CHAUGHADIYA = [
  ['Udveg','Char','Labh','Amrit','Kaal','Shubh','Rog','Udveg'],   // Sun
  ['Amrit','Kaal','Shubh','Rog','Udveg','Char','Labh','Amrit'],   // Mon
  ['Rog','Udveg','Char','Labh','Amrit','Kaal','Shubh','Rog'],     // Tue
  ['Labh','Amrit','Kaal','Shubh','Rog','Udveg','Char','Labh'],    // Wed
  ['Shubh','Rog','Udveg','Char','Labh','Amrit','Kaal','Shubh'],   // Thu
  ['Char','Labh','Amrit','Kaal','Shubh','Rog','Udveg','Char'],    // Fri
  ['Kaal','Shubh','Rog','Udveg','Char','Labh','Amrit','Kaal'],    // Sat
];
const NIGHT_CHAUGHADIYA = [
  ['Shubh','Amrit','Char','Rog','Kaal','Labh','Udveg','Shubh'],   // Sun
  ['Char','Rog','Kaal','Labh','Udveg','Shubh','Amrit','Char'],    // Mon
  ['Kaal','Labh','Udveg','Shubh','Amrit','Char','Rog','Kaal'],    // Tue
  ['Udveg','Shubh','Amrit','Char','Rog','Kaal','Labh','Udveg'],   // Wed
  ['Amrit','Char','Rog','Kaal','Labh','Udveg','Shubh','Amrit'],   // Thu
  ['Rog','Kaal','Labh','Udveg','Shubh','Amrit','Char','Rog'],     // Fri
  ['Labh','Udveg','Shubh','Amrit','Char','Rog','Kaal','Labh'],    // Sat
];

function fmtMins(mins) {
  if (mins === null || mins === undefined) return null;
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mn = m % 60;
  const ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${String(mn).padStart(2,'0')} ${ap}`;
}

function calculateChaughadiya(sunriseMins, sunsetMins, dayNum) {
  if (sunriseMins === null || sunsetMins === null) return { day:[], night:[] };
  const daySpan   = (sunsetMins - sunriseMins + 1440) % 1440;
  const nightSpan = 1440 - daySpan;
  const daySlot   = daySpan   / 8;
  const nightSlot = nightSpan / 8;

  const dayNames   = DAY_CHAUGHADIYA[dayNum]   || DAY_CHAUGHADIYA[0];
  const nightNames = NIGHT_CHAUGHADIYA[dayNum] || NIGHT_CHAUGHADIYA[0];

  const dayPeriods = dayNames.map((name, i) => {
    const start = Math.round(sunriseMins + i * daySlot);
    const end   = Math.round(sunriseMins + (i + 1) * daySlot);
    return { name, ...CHAUGHADIYA_NAMES[name], start: fmtMins(start), end: fmtMins(end), start_mins:start, end_mins:end };
  });

  const nightPeriods = nightNames.map((name, i) => {
    const start = Math.round(sunsetMins + i * nightSlot);
    const end   = Math.round(sunsetMins + (i + 1) * nightSlot);
    return { name, ...CHAUGHADIYA_NAMES[name], start: fmtMins(start), end: fmtMins(end), start_mins:start, end_mins:end };
  });

  return { day: dayPeriods, night: nightPeriods };
}

// ── Hora (Planetary Hours) ────────────────────────────────────────────────────
const HORA_LORDS    = ['Sun','Venus','Mercury','Moon','Saturn','Jupiter','Mars'];
const HORA_LORDS_HI = { Sun:'सूर्य', Venus:'शुक्र', Mercury:'बुध', Moon:'चंद्र', Saturn:'शनि', Jupiter:'गुरु', Mars:'मंगल' };
const HORA_ICONS    = { Sun:'☉', Venus:'♀', Mercury:'☿', Moon:'☽', Saturn:'♄', Jupiter:'♃', Mars:'♂' };
const HORA_COLORS   = { Sun:'#F59E0B', Venus:'#EC4899', Mercury:'#10B981', Moon:'#94A3B8', Saturn:'#6B7280', Jupiter:'#F97316', Mars:'#EF4444' };
const HORA_NATURE   = { Sun:'Powerful', Venus:'Artistic', Mercury:'Intelligent', Moon:'Emotional', Saturn:'Disciplined', Jupiter:'Auspicious', Mars:'Active' };
const HORA_NATURE_HI = { Sun:'शक्तिशाली', Venus:'कलात्मक', Mercury:'बुद्धिमान', Moon:'भावनात्मक', Saturn:'अनुशासित', Jupiter:'शुभ', Mars:'सक्रिय' };
// Day lord by weekday (0=Sun): slowest→fastest (Saturn→Jupiter→Mars→Sun→Venus→Mercury→Moon)
const DAY_LORD_IDX  = [0,3,6,2,5,1,4]; // Sun→0(Sun), Mon→3(Moon), Tue→6(Mars), Wed→2(Merc), Thu→5(Jup), Fri→1(Venus), Sat→4(Saturn)

// Each hora = exactly 60 minutes (BPHS: 1 hora = ~60 min, 24 horas = 24 hours)
// Day horas 1-12: sunrise to sunrise+12hrs; Night horas 13-24: next 12 hrs
function calculateHora(sunriseMins, _sunsetMins, dayNum) {
  if (sunriseMins === null) return { day:[], night:[] };
  const startIdx = DAY_LORD_IDX[dayNum];

  const dayHoras = Array.from({ length:12 }, (_, i) => {
    const lord  = HORA_LORDS[(startIdx + i) % 7];
    const start = sunriseMins + i * 60;
    const end   = sunriseMins + (i + 1) * 60;
    return { hora_num: i + 1, lord, lord_hi: HORA_LORDS_HI[lord], icon: HORA_ICONS[lord], color: HORA_COLORS[lord], nature: HORA_NATURE[lord], nature_hi: HORA_NATURE_HI[lord], start: fmtMins(start), end: fmtMins(end), start_mins: start, end_mins: end };
  });

  const nightHoras = Array.from({ length:12 }, (_, i) => {
    const lord  = HORA_LORDS[(startIdx + 12 + i) % 7];
    const start = sunriseMins + (12 + i) * 60;
    const end   = sunriseMins + (13 + i) * 60;
    return { hora_num: 13 + i, lord, lord_hi: HORA_LORDS_HI[lord], icon: HORA_ICONS[lord], color: HORA_COLORS[lord], nature: HORA_NATURE[lord], nature_hi: HORA_NATURE_HI[lord], start: fmtMins(start), end: fmtMins(end), start_mins: start, end_mins: end };
  });

  return { day: dayHoras, night: nightHoras };
}

// ── JD → local HH:MM:SS ───────────────────────────────────────────────────────
function jdToLocalHMS(jd, tz) {
  const ms      = (jd - 2440587.5) * 86400000;
  const localMs = ms + tz * 3600000;
  const d = new Date(localMs);
  const h = d.getUTCHours(), m = d.getUTCMinutes(), s = d.getUTCSeconds();
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── End-times for Tithi / Nakshatra / Yoga / Karana ──────────────────────────
// Uses 10-min forward scan + 25-iter binary search; ~1300 ephemeris calls total (< 5 ms)
function computeEndTimes(year, month, day, tz) {
  const { lahiriAyanamsa } = require('./core-helpers');
  const JD       = eph.julianDay(year, month, day, 12, 0) - tz / 24;
  const ayanamsa = lahiriAyanamsa(JD);                         // fixed for the day (~0.075° drift over 2 days — negligible)

  const getMoonSid = jd => norm(eph.moonTropicalLongitude(jd) - ayanamsa);
  const getSunSid  = jd => norm(eph.sunTropicalLongitude(jd)  - ayanamsa);

  const moonSid = getMoonSid(JD);
  const sunSid  = getSunSid(JD);
  const diff    = norm(moonSid - sunSid);
  const sum     = norm(moonSid + sunSid);
  const NAK_SPAN_DEG = 360 / 27;

  const curTithi  = Math.floor(diff / 12);
  const curNak    = Math.floor(moonSid / NAK_SPAN_DEG);
  const curYoga   = Math.floor(sum    / NAK_SPAN_DEG);
  const curKarana = Math.floor(diff   / 6);

  function findEnd(getIdxFn, currentIdx) {
    let changeJD = null;
    for (let i = 1; i <= 288; i++) {           // 10-min steps up to 48 hrs
      const jd = JD + i / 144;                 // 144 intervals/day = 10 min each
      if (getIdxFn(jd) !== currentIdx) { changeJD = jd; break; }
    }
    if (!changeJD) return null;
    let lo = changeJD - 1 / 144, hi = changeJD;
    for (let k = 0; k < 25; k++) {
      const mid = (lo + hi) / 2;
      if (getIdxFn(mid) !== currentIdx) hi = mid; else lo = mid;
    }
    return jdToLocalHMS(hi, tz);
  }

  return {
    tithi_end:     findEnd(jd => Math.floor(norm(getMoonSid(jd) - getSunSid(jd)) / 12),          curTithi),
    nakshatra_end: findEnd(jd => Math.floor(getMoonSid(jd) / NAK_SPAN_DEG),                       curNak),
    yoga_end:      findEnd(jd => Math.floor(norm(getMoonSid(jd) + getSunSid(jd)) / NAK_SPAN_DEG), curYoga),
    karana_end:    findEnd(jd => Math.floor(norm(getMoonSid(jd) - getSunSid(jd)) / 6),            curKarana),
  };
}

// ── Special Panchang Yogas ────────────────────────────────────────────────────
// Sarvartha Siddhi Yoga: specific day+nakshatra pairs (BPHS / Muhurta Chintamani)
const SARVARTHA_SIDDHI = {
  0: new Set([1,2,4,7,10,11,14,16,20,22,27]),  // Sun
  1: new Set([4,7,10,11,14,15,16,20,21,22,25,26]),  // Mon
  2: new Set([1,2,3,4,5,6,7,8,9,10,11,12,14,16,20,22,27]),  // Tue
  3: new Set([2,4,6,7,10,11,14,16,20,22,24,25,26,27]),  // Wed
  4: new Set([1,4,7,10,11,13,14,15,16,20,21,22,25,27]),  // Thu
  5: new Set([2,4,5,7,10,11,12,13,14,16,20,22,24,25,26,27]),  // Fri
  6: new Set([3,4,7,10,11,14,16,20,22,27]),  // Sat
};
const RAVI_YOG = {
  0: new Set([3,9,19,25]),
  1: new Set([5,11,21,27]),
  2: new Set([1,7,13,14,17,23]),
  3: new Set([4,10,20,26]),
  4: new Set([2,8,14,20,24]),
  5: new Set([3,9,15,21]),
  6: new Set([6,12,18]),
};
const AMRIT_SIDDHI = {
  0: new Set([27]),
  1: new Set([22]),
  2: new Set([7]),
  3: new Set([4]),
  4: new Set([13]),
  5: new Set([15]),
  6: new Set([3]),
};

function calculateSpecialYogas(tithiNum, nakNum, dayNum) {
  const yogas = [];
  if (SARVARTHA_SIDDHI[dayNum]?.has(nakNum)) yogas.push({ name:'Sarvartha Siddhi Yoga', name_hi:'सर्वार्थ सिद्धि योग', auspicious:true });
  if (AMRIT_SIDDHI[dayNum]?.has(nakNum))     yogas.push({ name:'Amrit Siddhi Yoga',     name_hi:'अमृत सिद्धि योग',     auspicious:true });
  if (RAVI_YOG[dayNum]?.has(nakNum))         yogas.push({ name:'Ravi Yoga',              name_hi:'रवि योग',              auspicious:false });
  // Dwipushkar: Sun/Tue/Sat + Dwitiya/Saptami/Dwadashi + twin nakshatras (6,7,11,12,20,21)
  if ([0,2,6].includes(dayNum) && [2,7,12].includes(tithiNum) && [6,7,11,12,20,21].includes(nakNum))
    yogas.push({ name:'Dwipushkar Yoga', name_hi:'द्विपुष्कर योग', auspicious:false });
  // Tripushkar: Sun/Tue/Sat + Tritiya/Ashtami/Trayodashi + (3,4,8,9,17,18)
  if ([0,2,6].includes(dayNum) && [3,8,13].includes(tithiNum) && [3,4,8,9,17,18].includes(nakNum))
    yogas.push({ name:'Tripushkar Yoga', name_hi:'त्रिपुष्कर योग', auspicious:false });
  return yogas;
}

// ── calculateDailyPanchang — full muhurta panchang for a given date+location ─
function calculateDailyPanchang({ year, month, day, lat, lon, tz }) {
  const { lahiriAyanamsa } = require('./core-helpers');

  // Use local noon as reference for sidereal positions
  const JD = eph.julianDay(year, month, day, 12, 0) - tz / 24;
  const sunTrop  = eph.sunTropicalLongitude(JD);
  const moonTrop = eph.moonTropicalLongitude(JD);
  const ayanamsa = lahiriAyanamsa(JD);
  const sunSid   = norm(sunTrop  - ayanamsa);
  const moonSid  = norm(moonTrop - ayanamsa);

  const sunData  = eph.sunriseSunset(lat, lon, year, month, day, tz);
  const moonData = moonriseMoonset(lat, lon, year, month, day, tz);

  const tithi  = calculateTithi(sunSid, moonSid);
  const yoga   = calculateNityaYoga(sunSid, moonSid);
  const karana = calculateKarana(sunSid, moonSid);
  const vara   = calculateVara(year, month, day, 12, 0, tz);
  const masa   = hinduMasa(sunSid);
  const ritu   = getRitu(sunTrop);  // Ritu is seasonal — use tropical sun
  const ayana  = getAyana(sunSid);

  const moonNak   = nakshatraFromDeg(moonSid);
  const sunRashi  = rashiFromDeg(sunSid);
  const moonRashi = rashiFromDeg(moonSid);

  const chaughadiya  = calculateChaughadiya(sunData.sunrise_mins, sunData.sunset_mins, vara.day_num);
  const hora         = calculateHora(sunData.sunrise_mins, sunData.sunset_mins, vara.day_num);
  const specialYogas = calculateSpecialYogas(tithi.num, moonNak.num, vara.day_num);
  const endTimes     = computeEndTimes(year, month, day, tz);

  return {
    date: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
    vara,
    masa,
    ritu,
    ayana,
    sunrise:  sunData.sunrise,
    sunset:   sunData.sunset,
    moonrise: moonData.moonrise,
    moonset:  moonData.moonset,
    tithi:     { ...tithi,   end_time: endTimes.tithi_end },
    nakshatra: { ...moonNak, end_time: endTimes.nakshatra_end },
    yoga:      { ...yoga,    end_time: endTimes.yoga_end },
    karana:    { ...karana,  end_time: endTimes.karana_end },
    paksha: { en: tithi.paksha, hi: tithi.paksha === 'Shukla' ? 'शुक्ल-पक्ष' : 'कृष्ण-पक्ष' },
    sun_sign:  { en: sunRashi.en,  hi: sunRashi.hi  },
    moon_sign: { en: moonRashi.en, hi: moonRashi.hi },
    special_yogas: specialYogas,
    chaughadiya,
    hora,
  };
}

module.exports = { hinduMasa, calculateNityaYoga, calculateTithi, calculateKarana, calculateVara, calculatePahar, sunriseSunset, calculatePanchang, calculateAstroDetails, calculatePaya, calculateYunja, getTatva, NAK_AKSHAR, getRitu, getAyana, moonriseMoonset, calculateChaughadiya, calculateHora, calculateSpecialYogas, computeEndTimes, jdToLocalHMS, calculateDailyPanchang };
