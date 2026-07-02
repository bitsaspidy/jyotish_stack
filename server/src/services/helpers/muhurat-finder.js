'use strict';
/**
 * Occasion muhurat date-finder.
 * Scans a date range and returns auspicious dates per occasion using classical
 * tithi + nakshatra + vara rules (Muhurta Chintamani, simplified), excluding
 * Vishti (Bhadra) karana. Days that additionally carry a Sarvartha
 * Siddhi–class yoga are marked "excellent".
 */
const eph = require('../ephemeris.service');
const { siderealLongitudeForPlanet, nakshatraFromDeg } = require('./core-helpers');
const { calculateTithi, calculateKarana, calculateSpecialYogas } = require('./panchang');

const WEEKDAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_HI = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

// Rikta tithis (4, 9, 14 of each paksha) are avoided for all auspicious work
const RIKTA = new Set([4, 9, 14]);

// Occasion rules — nakshatra numbers (1 = Ashwini … 27 = Revati),
// allowed tithi half-numbers (1–15 within paksha), allowed weekdays (0 = Sunday)
const OCCASIONS = {
  marriage: {
    slug: 'marriage',
    name_en: 'Marriage (Vivah)', name_hi: 'विवाह',
    icon: '💍',
    nakshatras: [4, 5, 10, 12, 13, 15, 17, 19, 21, 26, 27],
    tithis: [2, 3, 5, 7, 10, 11, 12, 13],
    days: [1, 3, 4, 5, 0], // Mon Wed Thu Fri Sun
    desc_en: 'Vivah muhurat requires the Moon in one of the 11 marriage nakshatras (Rohini, Mrigashira, Magha, Uttara Phalguni, Hasta, Swati, Anuradha, Mula, Uttara Ashadha, Uttara Bhadrapada, Revati), an auspicious tithi, and a favourable weekday — while avoiding Rikta tithis, Amavasya and Bhadra.',
    desc_hi: 'विवाह मुहूर्त के लिए चंद्र 11 विवाह नक्षत्रों में हो, तिथि शुभ हो और वार अनुकूल हो — रिक्ता तिथि, अमावस्या और भद्रा से बचा जाता है।',
  },
  'griha-pravesh': {
    slug: 'griha-pravesh',
    name_en: 'Griha Pravesh (House Warming)', name_hi: 'गृह प्रवेश',
    icon: '🏠',
    nakshatras: [4, 5, 8, 12, 14, 17, 21, 26, 27],
    tithis: [2, 3, 5, 7, 10, 11, 13],
    days: [1, 3, 4, 5, 6], // Mon Wed Thu Fri Sat
    desc_en: 'Griha Pravesh is performed when the Moon transits fixed and gentle nakshatras (Rohini, Mrigashira, Pushya, Uttara Phalguni, Chitra, Anuradha, Uttara Ashadha, Uttara Bhadrapada, Revati) on an auspicious tithi — never on Rikta tithis or during Bhadra.',
    desc_hi: 'गृह प्रवेश स्थिर और सौम्य नक्षत्रों में शुभ तिथि पर किया जाता है — रिक्ता तिथि और भद्रा में कभी नहीं।',
  },
  naamkaran: {
    slug: 'naamkaran',
    name_en: 'Naamkaran (Naming Ceremony)', name_hi: 'नामकरण',
    icon: '👶',
    nakshatras: [1, 4, 5, 7, 8, 13, 15, 17, 22, 23, 24, 27],
    tithis: [1, 2, 3, 5, 6, 7, 10, 11, 12, 13, 15],
    days: [1, 3, 4, 5, 0], // Mon Wed Thu Fri Sun
    desc_en: 'Naamkaran suits soft, movable and friendly nakshatras (Ashwini, Rohini, Mrigashira, Punarvasu, Pushya, Hasta, Swati, Anuradha, Shravana, Dhanishta, Shatabhisha, Revati) on any auspicious tithi and gentle weekday.',
    desc_hi: 'नामकरण के लिए मृदु, चर और मैत्री नक्षत्र शुभ तिथि व सौम्य वार पर उत्तम माने जाते हैं।',
  },
  mundan: {
    slug: 'mundan',
    name_en: 'Mundan (First Haircut)', name_hi: 'मुंडन',
    icon: '✂️',
    nakshatras: [1, 5, 7, 8, 13, 14, 15, 18, 22, 23, 24, 27],
    tithis: [2, 3, 5, 7, 10, 11, 13],
    days: [1, 3, 4, 5], // Mon Wed Thu Fri
    desc_en: 'Mundan sanskar is done when the Moon occupies light and swift nakshatras (Ashwini, Mrigashira, Punarvasu, Pushya, Hasta, Chitra, Swati, Jyeshtha, Shravana, Dhanishta, Shatabhisha, Revati) on auspicious tithis, avoiding Tuesdays and weekends of grief.',
    desc_hi: 'मुंडन संस्कार लघु और क्षिप्र नक्षत्रों में शुभ तिथि पर किया जाता है — मंगलवार वर्जित।',
  },
  'vehicle-purchase': {
    slug: 'vehicle-purchase',
    name_en: 'Vehicle Purchase', name_hi: 'वाहन खरीद',
    icon: '🚗',
    nakshatras: [1, 4, 5, 7, 8, 13, 14, 15, 17, 22, 23, 24, 27],
    tithis: [2, 3, 5, 6, 7, 10, 11, 13, 15],
    days: [1, 3, 4, 5, 0], // Mon Wed Thu Fri Sun
    desc_en: 'Vehicles are best purchased when the Moon transits swift and gentle nakshatras (Ashwini, Rohini, Mrigashira, Punarvasu, Pushya, Hasta, Chitra, Swati, Anuradha, Shravana, Dhanishta, Shatabhisha, Revati) on an auspicious tithi — avoiding Rikta tithis and Amavasya.',
    desc_hi: 'वाहन खरीद के लिए चंद्र क्षिप्र व सौम्य नक्षत्रों में और तिथि शुभ हो — रिक्ता तिथि और अमावस्या वर्जित।',
  },
};

// Panchang snapshot at local noon (approximated as UTC 06:30 for IST audience)
function panchangAt(year, month, day) {
  const JD = eph.julianDay(year, month, day, 6, 30, 0);
  const sunLon  = siderealLongitudeForPlanet('Sun', JD);
  const moonLon = siderealLongitudeForPlanet('Moon', JD);
  const tithi   = calculateTithi(sunLon, moonLon);
  const karana  = calculateKarana(sunLon, moonLon);
  const nak     = nakshatraFromDeg(moonLon);
  const dayNum  = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { tithi, karana, nak, dayNum };
}

function findMuhuratDates(occasionSlug, { year, months = 3 } = {}) {
  const occ = OCCASIONS[occasionSlug];
  if (!occ) return null;

  // Range: whole calendar year if `year` given, else next `months` from today
  let start, end;
  if (year) {
    start = new Date(Date.UTC(year, 0, 1));
    end   = new Date(Date.UTC(year, 11, 31));
    const today = new Date();
    if (year === today.getUTCFullYear()) {
      start = new Date(Date.UTC(year, today.getUTCMonth(), today.getUTCDate()));
    }
  } else {
    const now = new Date();
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    end   = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + Math.min(months, 6));
  }

  const nakSet = new Set(occ.nakshatras);
  const tithiSet = new Set(occ.tithis);
  const daySet = new Set(occ.days);

  const dates = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 86400e3) {
    const d = new Date(t);
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
    const p = panchangAt(y, m, dd);

    if (!daySet.has(p.dayNum)) continue;
    if (!nakSet.has(p.nak.num)) continue;
    if (RIKTA.has(p.tithi.half_num)) continue;
    if (p.tithi.num === 30) continue;                 // Amavasya
    if (/vishti|bhadra/i.test(p.karana.name || '')) continue; // Bhadra
    if (!tithiSet.has(p.tithi.half_num)) continue;

    const special = calculateSpecialYogas(p.tithi.num, p.nak.num, p.dayNum) || [];
    const hasSpecial = special.some((yg) => yg.auspicious);

    dates.push({
      date: d.toISOString().slice(0, 10),
      weekday_en: WEEKDAYS_EN[p.dayNum],
      weekday_hi: WEEKDAYS_HI[p.dayNum],
      tithi_en: p.tithi.display_en, tithi_hi: p.tithi.display_hi,
      nakshatra_en: p.nak.en, nakshatra_hi: p.nak.hi,
      quality: hasSpecial ? 'excellent' : 'good',
    });
  }

  return {
    occasion: {
      slug: occ.slug, icon: occ.icon,
      name_en: occ.name_en, name_hi: occ.name_hi,
      desc_en: occ.desc_en, desc_hi: occ.desc_hi,
    },
    range: { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) },
    count: dates.length,
    dates,
  };
}

module.exports = { findMuhuratDates, OCCASIONS };
