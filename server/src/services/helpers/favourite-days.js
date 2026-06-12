'use strict';

const WEEKDAY_EN  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAY_HI  = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
const PLANET_WD   = { Sun:0, Moon:1, Mars:2, Mercury:3, Jupiter:4, Venus:5, Saturn:6 };
const PLANET_HI   = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि' };
const PLANET_ICON = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄' };

const DIGNITY_SCORE = { exalted:5, moolatrikona:4.5, own:4, friend:3.5, neutral:3, enemy:2, debilitated:1 };
const HOUSE_MOD     = { 1:0.5, 4:0.5, 7:0.5, 10:0.5, 5:0.5, 9:0.5, 6:-0.5, 8:-0.5, 12:-0.5 };

const PURPOSES = [
  { key:'study',     en:'Study & Learning',    hi:'अध्ययन और शिक्षा',    icon:'📚', planets:['Mercury','Jupiter'],
    tip_en:'Start new subjects, exams, or skill learning on this day.',
    tip_hi:'नया विषय, परीक्षा या कौशल सीखने के लिए श्रेष्ठ दिन।' },
  { key:'work',      en:'Work & Career',        hi:'कार्य और करियर',      icon:'💼', planets:['Saturn','Sun'],
    tip_en:'Ideal for important work meetings, job applications, or career decisions.',
    tip_hi:'महत्वपूर्ण बैठक, नौकरी या करियर निर्णय के लिए आदर्श।' },
  { key:'finance',   en:'Finance & Business',   hi:'वित्त और व्यापार',    icon:'💰', planets:['Jupiter','Venus'],
    tip_en:'Best for investments, signing business deals, or financial planning.',
    tip_hi:'निवेश, व्यापार अनुबंध या वित्त योजना के लिए शुभ।' },
  { key:'love',      en:'Love & Relationships', hi:'प्रेम और रिश्ते',     icon:'❤️', planets:['Venus','Moon'],
    tip_en:'Strengthen bonds, romantic proposals, or resolve conflicts today.',
    tip_hi:'रिश्ते मजबूत करना, प्रेम प्रस्ताव या विवाद सुलझाने के लिए।' },
  { key:'health',    en:'Health & Recovery',    hi:'स्वास्थ्य और उपचार',  icon:'🏥', planets:['Sun','Moon'],
    tip_en:'Begin health routines, medical treatments, or yoga practice.',
    tip_hi:'नई दिनचर्या, चिकित्सा उपचार या योगाभ्यास शुरू करें।' },
  { key:'travel',    en:'Travel & Movement',    hi:'यात्रा और गतिविधि',   icon:'✈️', planets:['Mercury','Moon'],
    tip_en:'Start journeys, relocation, or important commutes on this day.',
    tip_hi:'यात्रा, स्थानांतरण या महत्वपूर्ण आवागमन के लिए उत्तम।' },
  { key:'spiritual', en:'Spiritual Practice',   hi:'साधना और पूजा',       icon:'🙏', planets:['Jupiter','Sun'],
    tip_en:'Meditation, mantra recitation, puja, or visiting sacred places.',
    tip_hi:'ध्यान, मंत्र जाप, पूजा या तीर्थ दर्शन के लिए शुभ।' },
  { key:'new',       en:'New Beginnings',       hi:'नए आरंभ',              icon:'🌟', planets:['Jupiter','Moon'],
    tip_en:'Launch projects, new ventures, or make important life decisions.',
    tip_hi:'नए प्रोजेक्ट, उद्यम या महत्वपूर्ण जीवन निर्णय लेने के लिए।' },
];

function planetScore(chart, name) {
  const p = chart.planets?.[name];
  if (!p) return 3;
  return Math.max(1, Math.min(5, (DIGNITY_SCORE[p.dignity] ?? 3) + (HOUSE_MOD[p.house] ?? 0)));
}

function computeFavouriteDays(chart) {
  if (!chart?.planets) return { purposes: [], by_day: [] };

  const purposes = PURPOSES.map(pur => {
    const [pri, sec] = pur.planets;
    const priS = planetScore(chart, pri);
    const secS = planetScore(chart, sec);
    const best = priS >= secS ? pri  : sec;
    const alt  = best === pri  ? sec  : pri;
    const score = Math.max(priS, secS);
    const pp    = chart.planets[best];

    // Reason
    let reason_en;
    if (pp?.dignity === 'exalted')                               reason_en = `${best} is exalted in house ${pp.house}`;
    else if (pp?.dignity === 'own' || pp?.dignity === 'moolatrikona') reason_en = `${best} in own sign (house ${pp.house})`;
    else if (pp?.dignity === 'friend')                           reason_en = `${best} in friendly sign (house ${pp.house})`;
    else                                                         reason_en = `${best} governs ${pur.en.toLowerCase()}`;

    // Avoid day: only flag if the weak planet is truly debilitated/enemy
    const weakS  = Math.min(priS, secS);
    const weakP  = priS <= secS ? pri : sec;
    const avoidWd = weakS <= 2 ? PLANET_WD[weakP] : null;

    return {
      key:          pur.key,
      icon:         pur.icon,
      purpose_en:   pur.en,
      purpose_hi:   pur.hi,
      tip_en:       pur.tip_en,
      tip_hi:       pur.tip_hi,
      best_day:     WEEKDAY_EN[PLANET_WD[best]],
      best_day_hi:  WEEKDAY_HI[PLANET_WD[best]],
      best_day_num: PLANET_WD[best],
      alt_day:      WEEKDAY_EN[PLANET_WD[alt]],
      alt_day_hi:   WEEKDAY_HI[PLANET_WD[alt]],
      planet:       best,
      planet_hi:    PLANET_HI[best],
      planet_icon:  PLANET_ICON[best],
      score:        +score.toFixed(1),
      reason_en,
      avoid_day:     avoidWd !== null ? WEEKDAY_EN[avoidWd] : null,
      avoid_day_hi:  avoidWd !== null ? WEEKDAY_HI[avoidWd] : null,
      avoid_day_num: avoidWd,
    };
  });

  // Index by weekday: which purposes are best on each day
  const by_day = WEEKDAY_EN.map((day, i) => ({
    day_en: day,
    day_hi: WEEKDAY_HI[i],
    day_num: i,
    purposes: purposes
      .filter(p => p.best_day_num === i)
      .map(p => ({ key: p.key, icon: p.icon, purpose_en: p.purpose_en, purpose_hi: p.purpose_hi, score: p.score })),
  }));

  return { purposes, by_day };
}

module.exports = { computeFavouriteDays };
