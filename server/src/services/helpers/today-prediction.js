'use strict';
// Personal daily prediction for one kundli — composed from the daily rashi
// horoscope engine + the native's running dasha + favourite-day purposes.
// Persisted in the `predictions` table (type 'daily') by the routes.

const { generateDailyHoroscope } = require('./daily-horoscope');
const { computeFavouriteDays }   = require('./favourite-days');

const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु',
  Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};
const GOOD_HOUSES = [1, 3, 4, 5, 7, 9, 10, 11];
const HARD_HOUSES = [6, 8, 12];

function _transitHouse(positions, lord) {
  const key = `${String(lord || '').toLowerCase()}_house`;
  if (positions[key]) return positions[key];
  if (lord === 'Ketu' && positions.rahu_house) return ((positions.rahu_house + 5) % 12) + 1; // opposite Rahu
  return null;
}

function _dashaLines(maha, antar, positions) {
  if (!maha) return { en: '', hi: '' };
  const mh = _transitHouse(positions, maha);
  let tone_en, tone_hi;
  if (mh && GOOD_HOUSES.includes(mh)) {
    tone_en = `Transit ${maha} is well placed today (house ${mh} from your Moon), so work connected to your main dasha agenda gets natural support — move important matters forward.`;
    tone_hi = `गोचर ${PLANET_HI[maha]} आज अनुकूल स्थिति में है (चंद्र से भाव ${mh}), इसलिए दशा से जुड़े कार्यों को स्वाभाविक समर्थन मिलेगा — महत्वपूर्ण कार्य आगे बढ़ाएं।`;
  } else if (mh && HARD_HOUSES.includes(mh)) {
    tone_en = `Transit ${maha} moves through a testing position today (house ${mh} from your Moon) — keep dasha-related initiatives low-key and avoid forcing outcomes.`;
    tone_hi = `गोचर ${PLANET_HI[maha]} आज चुनौतीपूर्ण स्थिति में है (चंद्र से भाव ${mh}) — दशा से जुड़े कार्यों में धीमी गति रखें और जबरदस्ती परिणाम न निकालें।`;
  } else {
    tone_en = `Keep steady, routine progress on matters ruled by ${maha}.`;
    tone_hi = `${PLANET_HI[maha]} से जुड़े विषयों में नियमित और स्थिर प्रगति रखें।`;
  }
  const en = `You are currently running ${maha} Mahadasha${antar ? ` with ${antar} Antardasha` : ''}. ${tone_en}`;
  const hi = `आप वर्तमान में ${PLANET_HI[maha]} महादशा${antar ? ` और ${PLANET_HI[antar]} अंतर्दशा` : ''} में हैं। ${tone_hi}`;
  return { en, hi };
}

function _favDayLines(chart, weekdayIdx) {
  const fd = computeFavouriteDays(chart);
  const today = fd.by_day?.find((d) => d.day_num === weekdayIdx);
  const favs   = today?.purposes || [];
  const avoids = (fd.purposes || []).filter((p) => p.avoid_day_num === weekdayIdx);
  let en = '', hi = '';
  if (favs.length) {
    en += `As per your chart, today is your favourable day for: ${favs.map((p) => p.purpose_en).join(', ')} — schedule these activities today.`;
    hi += `आपकी कुंडली के अनुसार आज का दिन इनके लिए शुभ है: ${favs.map((p) => p.purpose_hi).join(', ')} — ये कार्य आज करें।`;
  }
  if (avoids.length) {
    en += `${en ? ' ' : ''}Better postponed today: ${avoids.map((p) => p.purpose_en).join(', ')}.`;
    hi += `${hi ? ' ' : ''}आज टालना बेहतर: ${avoids.map((p) => p.purpose_hi).join(', ')}।`;
  }
  return { en, hi, favs, avoids };
}

// Main entry — returns a row-shaped object ready to insert into `predictions`
function generateTodayPrediction(chart, atDate = new Date()) {
  const moonRashi = chart?.planets?.Moon?.rashi_num;
  if (!moonRashi) return null;

  const daily = generateDailyHoroscope(atDate);
  if (!daily) return null;
  const rh = daily.rashis[moonRashi - 1];

  const maha  = Array.isArray(chart.dasha) ? chart.dasha.find((d) => d.is_current) || chart.dasha[0] : null;
  const antar = maha?.antardasha?.find((a) => a.is_current) || null;
  const dashaLine = _dashaLines(maha?.lord, antar?.lord, rh.planet_positions);
  const favLine   = _favDayLines(chart, atDate.getDay());

  const content_en = [rh.description_en, dashaLine.en, favLine.en].filter(Boolean).join('\n\n');
  const content_hi = [rh.description_hi, dashaLine.hi, favLine.hi].filter(Boolean).join('\n\n');

  const dayStart = new Date(atDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(atDate); dayEnd.setHours(23, 59, 59, 999);

  return {
    type:        'daily',
    title:       `${rh.title_en} · ${rh.rashi_en} Moon`,
    content_en,
    content_hi,
    valid_from:  dayStart,
    valid_until: dayEnd,
    meta: {
      date:        rh.date,
      score:       rh.score,
      stars:       rh.stars,
      title_hi:    `${rh.title_hi} · ${rh.rashi_hi} चंद्र`,
      moon_rashi:  { num: rh.rashi_num, en: rh.rashi_en, hi: rh.rashi_hi, symbol: rh.symbol },
      dasha:       { maha: maha?.lord || null, antar: antar?.lord || null },
      areas: {
        career:  rh.career,  love: rh.love,
        health:  rh.health,  finance: rh.finance,
      },
      advice:      rh.advice,
      caution:     rh.caution,
      lucky:       rh.lucky,
      sade_sati:   rh.sade_sati,
      fav_purposes:   favLine.favs.map((p)  => ({ key: p.key, icon: p.icon, en: p.purpose_en, hi: p.purpose_hi })),
      avoid_purposes: favLine.avoids.map((p) => ({ key: p.key, icon: p.icon, en: p.purpose_en, hi: p.purpose_hi })),
    },
  };
}

module.exports = { generateTodayPrediction };
