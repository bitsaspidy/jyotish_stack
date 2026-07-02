'use strict';
/**
 * Weekly / Monthly / Yearly horoscope engine.
 * Same transit-based approach as daily-horoscope.js:
 *  - Weekly : Moon-driven day scores across the week + slow-planet themes
 *  - Monthly: Sun-house theme + day-score scan for lucky/caution dates + ingresses
 *  - Yearly : Jupiter/Saturn sign journeys (with dates) + quarterly outlook
 * All computed from real ephemeris positions; nothing persisted.
 */
const { computeTransitPlanets, computeDayScore, RASHIS, LUCKY } = require('./daily-horoscope');
const { houseFromSign } = require('./core-helpers');

const DAY_MS = 86400e3;
const WEEKDAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_HI = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

// ── Period-generic Jupiter texts (house from rashi) ──────────────────────────
const JUP_PERIOD = {
  1:  { en:'Jupiter transits your own sign — a phase of personal expansion, optimism and renewed self-belief. Doors open when you show up as yourself.', hi:'गुरु आपकी राशि में — व्यक्तिगत विस्तार, आशावाद और आत्मविश्वास का समय। स्वयं पर विश्वास रखें, द्वार खुलेंगे।' },
  2:  { en:'Jupiter blesses your house of wealth and family — income growth, savings and family harmony are supported in this period.', hi:'गुरु धन-कुटुंब भाव में — आय वृद्धि, बचत और पारिवारिक सौहार्द को समर्थन।' },
  3:  { en:'Jupiter in your 3rd asks for effort in communication and initiatives — growth comes through courage, siblings and skill-building.', hi:'गुरु तीसरे भाव में — साहस, संचार और कौशल-विकास से ही प्रगति मिलेगी।' },
  4:  { en:'Jupiter graces your 4th house — home, property, vehicles and inner contentment expand. Domestic happiness rises.', hi:'गुरु चौथे भाव में — घर, संपत्ति, वाहन और आंतरिक सुख में वृद्धि।' },
  5:  { en:'Jupiter in your 5th is a golden placement — creativity, romance, children and speculative gains all flourish.', hi:'गुरु पांचवें भाव में स्वर्णिम स्थिति — रचनात्मकता, प्रेम, संतान और निवेश-लाभ फलते-फूलते हैं।' },
  6:  { en:'Jupiter in your 6th brings growth through service, health discipline and handling competition — wins come after effort.', hi:'गुरु छठे भाव में — सेवा, स्वास्थ्य-अनुशासन और प्रतिस्पर्धा से जूझकर विजय।' },
  7:  { en:'Jupiter illuminates partnerships — marriage, business alliances and public dealings prosper in this period.', hi:'गुरु सातवें भाव में — विवाह, साझेदारी और जन-संपर्क समृद्ध होते हैं।' },
  8:  { en:'Jupiter in your 8th deepens transformation — inheritance, research and occult knowledge grow, but avoid shortcuts with joint finances.', hi:'गुरु आठवें भाव में — गहन परिवर्तन, विरासत और शोध में वृद्धि; संयुक्त धन में सावधानी।' },
  9:  { en:'Jupiter in your 9th — its most auspicious seat. Fortune, dharma, mentors, higher learning and long journeys bless this period.', hi:'गुरु नवम भाव में — सर्वाधिक शुभ। भाग्य, धर्म, गुरु-कृपा और यात्राओं का आशीर्वाद।' },
  10: { en:'Jupiter uplifts your career house — recognition, promotion and respected authority are within reach now.', hi:'गुरु दशम भाव में — करियर में पहचान, पदोन्नति और प्रतिष्ठा की प्राप्ति।' },
  11: { en:'Jupiter in your 11th — the classic gains position. Income multiplies, networks expand and long-held wishes materialise.', hi:'गुरु ग्यारहवें भाव में — लाभ की श्रेष्ठ स्थिति। आय, मित्र-मंडल और इच्छापूर्ति में वृद्धि।' },
  12: { en:'Jupiter in your 12th raises expenses but also spiritual depth — foreign matters, charity and moksha-oriented growth are favoured.', hi:'गुरु बारहवें भाव में — व्यय बढ़ेंगे पर आध्यात्मिक गहराई, विदेश-योग और दान-पुण्य फलदायी।' },
};

// ── Period-generic Saturn texts ───────────────────────────────────────────────
const SAT_PERIOD = {
  1:  { en:'Saturn moves through your own sign — the peak of Sade Sati. Responsibilities weigh heavier; health and reputation demand care. What you build now lasts decades.', hi:'शनि आपकी राशि में — साढ़े साती का चरम। जिम्मेदारियां भारी हैं; पर अभी की मेहनत दशकों तक फल देगी।' },
  2:  { en:'Saturn in your 2nd (Sade Sati setting phase) tests finances and family speech — budget strictly and speak with restraint.', hi:'शनि दूसरे भाव में (साढ़े साती अवरोही) — धन और वाणी की परीक्षा। संयम रखें।' },
  3:  { en:'Saturn in your 3rd is favourable — disciplined effort, courage and persistence get rewarded steadily.', hi:'शनि तीसरे भाव में अनुकूल — अनुशासित प्रयास और साहस का स्थिर फल।' },
  4:  { en:'Saturn in your 4th brings duties around home, property and mother — emotional heaviness lifts with patience and routine.', hi:'शनि चौथे भाव में — घर, संपत्ति और माता से जुड़े दायित्व। धैर्य रखें।' },
  5:  { en:'Saturn in your 5th disciplines romance, children and speculation — avoid gambling; structured creativity thrives.', hi:'शनि पांचवें भाव में — प्रेम, संतान और निवेश में अनुशासन आवश्यक; सट्टे से बचें।' },
  6:  { en:'Saturn in your 6th is among its best placements — enemies retreat, chronic issues stabilise, and hard work wins.', hi:'शनि छठे भाव में श्रेष्ठ — शत्रु परास्त, रोग नियंत्रित, परिश्रम विजयी।' },
  7:  { en:'Saturn in your 7th weighs on partnerships — commitments deepen or dissolve. Move slowly in marriage and business decisions.', hi:'शनि सातवें भाव में — साझेदारी की परीक्षा। विवाह और व्यापार निर्णयों में धीमे चलें।' },
  8:  { en:'Saturn in your 8th brings delays and hidden pressure — guard health, avoid loans, and let patience be your armour.', hi:'शनि आठवें भाव में — विलंब और गुप्त दबाव। स्वास्थ्य और ऋण में सतर्कता; धैर्य ही कवच है।' },
  9:  { en:'Saturn in your 9th slows fortune but matures wisdom — respect for tradition, elders and steady dharma pays off.', hi:'शनि नवम भाव में — भाग्य धीमा पर बुद्धि परिपक्व। बड़ों और धर्म का सम्मान फलदायी।' },
  10: { en:'Saturn in its own 10th domain — career demands maximum effort and gives lasting authority in return. No shortcuts.', hi:'शनि दशम भाव में — करियर में कठोर परिश्रम की मांग, बदले में स्थायी अधिकार।' },
  11: { en:'Saturn in your 11th grants slow but certain gains — income grows through consistency; elder friends prove valuable.', hi:'शनि ग्यारहवें भाव में — धीमा पर निश्चित लाभ। निरंतरता से आय-वृद्धि।' },
  12: { en:'Saturn in your 12th (Sade Sati rising phase) increases expenses and isolation — spiritual practice and disciplined sleep protect you.', hi:'शनि बारहवें भाव में (साढ़े साती आरोही) — व्यय और एकांत बढ़ेंगे; साधना और अनुशासन रक्षा करेंगे।' },
};

// ── Monthly overview by Sun's house ───────────────────────────────────────────
const SUN_MONTH = {
  1:  { en:'The Sun energises your own sign this month — vitality, visibility and self-assertion peak. Lead from the front.', hi:'इस माह सूर्य आपकी राशि में — ऊर्जा, पहचान और नेतृत्व चरम पर।' },
  2:  { en:'The Sun lights your wealth house — money, family matters and speech take centre stage this month.', hi:'सूर्य धन भाव में — इस माह धन, परिवार और वाणी केंद्र में।' },
  3:  { en:'A month of initiative — communication, short travel and bold moves are highlighted by the Sun.', hi:'पहल का महीना — संचार, छोटी यात्राएं और साहसिक कदम।' },
  4:  { en:'The Sun turns focus homeward — property, family roots and inner peace dominate this month.', hi:'सूर्य चौथे भाव में — घर, संपत्ति और आंतरिक शांति पर ध्यान।' },
  5:  { en:'A creative, expressive month — romance, children and recognition for your talents shine.', hi:'रचनात्मक माह — प्रेम, संतान और प्रतिभा की पहचान।' },
  6:  { en:'A month of work and health focus — clear pending tasks, face competition and tighten routines.', hi:'कार्य और स्वास्थ्य का माह — लंबित कार्य निपटाएं, दिनचर्या सुधारें।' },
  7:  { en:'Relationships take the spotlight — partnerships, marriage matters and public dealings intensify.', hi:'संबंधों का माह — साझेदारी, विवाह और जन-संपर्क प्रमुख।' },
  8:  { en:'A month of depth and caution — avoid risks, research thoroughly, and let transformations unfold.', hi:'गहराई और सावधानी का माह — जोखिम टालें, परिवर्तन को समय दें।' },
  9:  { en:'Fortune favours you this month — travel, learning and dharma bring growth and grace.', hi:'भाग्यशाली माह — यात्रा, शिक्षा और धर्म से उन्नति।' },
  10: { en:'A career-defining month — the Sun crowns your 10th house with recognition and authority.', hi:'करियर-निर्णायक माह — पहचान और अधिकार की प्राप्ति।' },
  11: { en:'A month of gains — income streams, friendships and goal-fulfilment are solar-charged.', hi:'लाभ का माह — आय, मित्रता और लक्ष्य-पूर्ति।' },
  12: { en:'A month for closure and reflection — expenses rise, but letting go clears the path ahead.', hi:'समापन और चिंतन का माह — व्यय बढ़ेंगे, पर त्याग से मार्ग खुलेगा।' },
};

// ── Section fallbacks by score ────────────────────────────────────────────────
const GENERIC = {
  career: {
    high: { en:'Professional momentum is with you — push key projects, ask for what you deserve, and be visible.', hi:'करियर में गति है — मुख्य कार्य आगे बढ़ाएं और अपनी योग्यता प्रस्तुत करें।' },
    mid:  { en:'Steady, consistent work wins this period — avoid job-hopping impulses and office politics.', hi:'स्थिर और नियमित कार्य ही श्रेष्ठ — जल्दबाजी और राजनीति से बचें।' },
    low:  { en:'Keep your head down and consolidate — this is a period to protect your position, not gamble it.', hi:'यह समय पद सुरक्षित रखने का है, जोखिम लेने का नहीं।' },
  },
  love: {
    high: { en:'Warmth flows in relationships — express affection openly; singles may find a meaningful connection.', hi:'संबंधों में मधुरता — प्रेम व्यक्त करें; अविवाहितों को शुभ संकेत।' },
    mid:  { en:'Relationships stay stable with honest communication — small gestures matter more than grand ones.', hi:'ईमानदार संवाद से संबंध स्थिर — छोटे प्रयास बड़े काम आएंगे।' },
    low:  { en:'Guard against irritability with loved ones — listen more, react less, and postpone difficult talks.', hi:'प्रियजनों से चिड़चिड़ापन टालें — अधिक सुनें, कम प्रतिक्रिया दें।' },
  },
  finance: {
    high: { en:'Money matters flow favourably — good period for planned investments and clearing debts.', hi:'धन-योग अनुकूल — नियोजित निवेश और ऋण-मुक्ति के लिए शुभ।' },
    mid:  { en:'Finances remain balanced — stick to budgets and avoid lending large sums.', hi:'वित्त संतुलित — बजट पर टिके रहें, बड़ा उधार न दें।' },
    low:  { en:'Tighten spending and avoid speculation — unexpected expenses are possible this period.', hi:'खर्च नियंत्रित रखें, सट्टे से बचें — आकस्मिक व्यय संभव।' },
  },
  health: {
    high: { en:'Vitality runs strong — an excellent period to build fitness routines that stick.', hi:'ऊर्जा उत्तम — व्यायाम की आदत बनाने का श्रेष्ठ समय।' },
    mid:  { en:'Health stays steady with moderation — watch sleep and digestion.', hi:'संयम से स्वास्थ्य स्थिर — नींद और पाचन पर ध्यान।' },
    low:  { en:'Energy dips are likely — prioritise rest, light food and stress management.', hi:'ऊर्जा में कमी संभव — विश्राम, हल्का भोजन और तनाव-प्रबंधन प्राथमिक।' },
  },
};
const band = (score) => (score >= 4 ? 'high' : score >= 3 ? 'mid' : 'low');

function sadeSatiFromSatHouse(satH) {
  if (satH === 12) return 'rising';
  if (satH === 1)  return 'peak';
  if (satH === 2)  return 'setting';
  return null;
}

const fmt = (d) => d.toISOString().slice(0, 10);
const atNoon = (ms) => new Date(new Date(ms).setUTCHours(12, 0, 0, 0));

// ── WEEKLY ────────────────────────────────────────────────────────────────────
function generateWeeklyHoroscope(atDate = new Date()) {
  const base = new Date(Date.UTC(atDate.getUTCFullYear(), atDate.getUTCMonth(), atDate.getUTCDate()));
  const dow  = (base.getUTCDay() + 6) % 7; // 0 = Monday
  const monday = new Date(base.getTime() - dow * DAY_MS);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = atNoon(monday.getTime() + i * DAY_MS);
    days.push({ date: d, planets: computeTransitPlanets(d).planets });
  }
  const mid = days[3].planets; // Thursday = representative slow-planet positions

  const rashis = [];
  for (let rn = 1; rn <= 12; rn++) {
    const meta = RASHIS[rn];
    const scored = days.map((d) => ({
      date: fmt(d.date),
      weekday_en: WEEKDAYS_EN[d.date.getUTCDay()],
      weekday_hi: WEEKDAYS_HI[d.date.getUTCDay()],
      score: computeDayScore(rn, d.planets),
    }));
    const avg   = scored.reduce((s, x) => s + x.score, 0) / 7;
    const score = Math.max(1, Math.min(5, Math.round(avg)));

    const jupH = houseFromSign(rn, mid.Jupiter.rashi_num);
    const satH = houseFromSign(rn, mid.Saturn.rashi_num);
    const venH = houseFromSign(rn, mid.Venus.rashi_num);
    const marsH = houseFromSign(rn, mid.Mars.rashi_num);
    const ss   = sadeSatiFromSatHouse(satH);
    const b    = band(score);

    const bestDays = [...scored].sort((a, z) => z.score - a.score).slice(0, 2);
    const cautionDays = scored.filter((x) => x.score <= 2).slice(0, 2);

    const loveExtra = venH === 5 || venH === 7
      ? { en:' Venus strongly supports romance this week.', hi:' शुक्र इस सप्ताह प्रेम को विशेष बल देता है।' }
      : { en:'', hi:'' };
    const healthExtra = marsH === 6
      ? { en:' Mars boosts physical stamina — great week for workouts.', hi:' मंगल शारीरिक बल बढ़ाता है — व्यायाम के लिए उत्तम सप्ताह।' }
      : satH === 1
      ? { en:' Saturn on your sign — do not skimp on rest.', hi:' शनि आपकी राशि पर — विश्राम में कटौती न करें।' }
      : { en:'', hi:'' };

    rashis.push({
      rashi_num: rn, rashi_en: meta.en, rashi_hi: meta.hi, symbol: meta.symbol, color: meta.color,
      score,
      overview: {
        en: `${JUP_PERIOD[jupH].en} ${SAT_PERIOD[satH].en}${ss ? ` (Sade Sati ${ss} phase.)` : ''}`,
        hi: `${JUP_PERIOD[jupH].hi} ${SAT_PERIOD[satH].hi}`,
      },
      career:  { en: GENERIC.career[b].en,  hi: GENERIC.career[b].hi },
      love:    { en: GENERIC.love[b].en + loveExtra.en, hi: GENERIC.love[b].hi + loveExtra.hi },
      finance: { en: GENERIC.finance[b].en, hi: GENERIC.finance[b].hi },
      health:  { en: GENERIC.health[b].en + healthExtra.en, hi: GENERIC.health[b].hi + healthExtra.hi },
      day_scores: scored,
      best_days: bestDays,
      caution_days: cautionDays,
      sade_sati: ss ? { active: true, phase: ss } : { active: false },
      lucky: LUCKY[rn] || {},
    });
  }

  return {
    week_start: fmt(days[0].date),
    week_end:   fmt(days[6].date),
    computed_at: new Date().toISOString(),
    transit_summary: summarise(mid),
    rashis,
  };
}

// ── MONTHLY ───────────────────────────────────────────────────────────────────
function generateMonthlyHoroscope(atDate = new Date()) {
  const year = atDate.getUTCFullYear(), month = atDate.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = atNoon(Date.UTC(year, month, d));
    days.push({ day: d, date: dt, planets: computeTransitPlanets(dt).planets });
  }
  const mid = days[Math.floor(daysInMonth / 2)].planets;

  // Sign ingresses during the month (fast planets + Sun)
  const ingresses = [];
  for (const p of ['Sun', 'Mars', 'Mercury', 'Venus', 'Jupiter', 'Saturn']) {
    for (let i = 1; i < days.length; i++) {
      const a = days[i - 1].planets[p], z = days[i].planets[p];
      if (a.rashi_num !== z.rashi_num) {
        ingresses.push({
          planet: p, date: fmt(days[i].date),
          from_en: a.rashi_en, from_hi: a.rashi_hi,
          to_en: z.rashi_en, to_hi: z.rashi_hi, to_num: z.rashi_num,
        });
      }
    }
  }

  const rashis = [];
  for (let rn = 1; rn <= 12; rn++) {
    const meta = RASHIS[rn];
    const scored = days.map((d) => ({ day: d.day, score: computeDayScore(rn, d.planets) }));
    const avg   = scored.reduce((s, x) => s + x.score, 0) / scored.length;
    const score = Math.max(1, Math.min(5, Math.round(avg)));

    const luckyDates   = scored.filter((x) => x.score >= 4).map((x) => x.day).slice(0, 6);
    const cautionDates = scored.filter((x) => x.score <= 2).map((x) => x.day).slice(0, 4);

    const sunH  = houseFromSign(rn, mid.Sun.rashi_num);
    const jupH  = houseFromSign(rn, mid.Jupiter.rashi_num);
    const satH  = houseFromSign(rn, mid.Saturn.rashi_num);
    const ss    = sadeSatiFromSatHouse(satH);
    const b     = band(score);

    rashis.push({
      rashi_num: rn, rashi_en: meta.en, rashi_hi: meta.hi, symbol: meta.symbol, color: meta.color,
      score,
      overview: {
        en: `${SUN_MONTH[sunH].en} ${JUP_PERIOD[jupH].en}${ss ? ` Saturn continues its Sade Sati ${ss} phase — patience remains your ally.` : ''}`,
        hi: `${SUN_MONTH[sunH].hi} ${JUP_PERIOD[jupH].hi}${ss ? ' साढ़े साती जारी है — धैर्य ही सहयोगी है।' : ''}`,
      },
      career:  { en: GENERIC.career[b].en,  hi: GENERIC.career[b].hi },
      love:    { en: GENERIC.love[b].en,    hi: GENERIC.love[b].hi },
      finance: { en: GENERIC.finance[b].en, hi: GENERIC.finance[b].hi },
      health:  { en: GENERIC.health[b].en,  hi: GENERIC.health[b].hi },
      lucky_dates: luckyDates,
      caution_dates: cautionDates,
      sade_sati: ss ? { active: true, phase: ss } : { active: false },
      lucky: LUCKY[rn] || {},
    });
  }

  return {
    year, month: month + 1,
    month_start: fmt(days[0].date),
    month_end:   fmt(days[days.length - 1].date),
    computed_at: new Date().toISOString(),
    transit_summary: summarise(mid),
    key_transits: ingresses,
    rashis,
  };
}

// ── YEARLY ────────────────────────────────────────────────────────────────────
function slowPlanetSegments(planet, year) {
  // Sample every 3 days; refine boundaries to the day
  const start = Date.UTC(year, 0, 1), end = Date.UTC(year, 11, 31);
  const segs = [];
  let prev = null, segStart = start;
  for (let t = start; t <= end; t += 3 * DAY_MS) {
    const pl = computeTransitPlanets(atNoon(t)).planets[planet];
    if (prev && pl.rashi_num !== prev.rashi_num) {
      // refine boundary
      let lo = t - 3 * DAY_MS, hi = t;
      while (hi - lo > DAY_MS) {
        const midT = lo + Math.floor((hi - lo) / 2 / DAY_MS) * DAY_MS;
        const m = computeTransitPlanets(atNoon(midT)).planets[planet];
        if (m.rashi_num === prev.rashi_num) lo = midT; else hi = midT;
      }
      segs.push({ ...prev, from: fmt(new Date(segStart)), to: fmt(new Date(lo)) });
      segStart = hi;
    }
    prev = { rashi_num: pl.rashi_num, rashi_en: pl.rashi_en, rashi_hi: pl.rashi_hi };
  }
  segs.push({ ...prev, from: fmt(new Date(segStart)), to: fmt(new Date(end)) });
  return segs;
}

const JUP_SCORE_Y = { 1:0.5, 2:1, 3:-0.5, 4:0.5, 5:1.5, 6:-0.5, 7:1, 8:-0.5, 9:1.5, 10:0.5, 11:1.5, 12:-0.5 };
const SAT_SCORE_Y = { 1:-1, 2:-0.5, 3:0.5, 4:-0.5, 5:-1, 6:0.5, 7:-1, 8:-1.5, 9:-0.5, 10:0.5, 11:0.5, 12:-0.5 };

function generateYearlyHoroscope(year = new Date().getUTCFullYear()) {
  const jupSegs = slowPlanetSegments('Jupiter', year);
  const satSegs = slowPlanetSegments('Saturn', year);
  const rahuMid = computeTransitPlanets(atNoon(Date.UTC(year, 6, 1))).planets.Rahu;

  const segDays = (s) => (new Date(s.to) - new Date(s.from)) / DAY_MS + 1;

  const rashis = [];
  for (let rn = 1; rn <= 12; rn++) {
    const meta = RASHIS[rn];

    const jupPhases = jupSegs.map((s) => {
      const h = houseFromSign(rn, s.rashi_num);
      return { from: s.from, to: s.to, sign_en: s.rashi_en, sign_hi: s.rashi_hi, house: h,
               text_en: JUP_PERIOD[h].en, text_hi: JUP_PERIOD[h].hi };
    });
    const satPhases = satSegs.map((s) => {
      const h = houseFromSign(rn, s.rashi_num);
      const ss = sadeSatiFromSatHouse(h);
      return { from: s.from, to: s.to, sign_en: s.rashi_en, sign_hi: s.rashi_hi, house: h,
               sade_sati: ss, text_en: SAT_PERIOD[h].en, text_hi: SAT_PERIOD[h].hi };
    });

    // Duration-weighted yearly score from slow planets
    let weighted = 0, totalDays = 0;
    for (const s of jupSegs) { const d = segDays(s); weighted += (JUP_SCORE_Y[houseFromSign(rn, s.rashi_num)] || 0) * d; totalDays += d; }
    let satWeighted = 0;
    for (const s of satSegs) { satWeighted += (SAT_SCORE_Y[houseFromSign(rn, s.rashi_num)] || 0) * segDays(s); }
    const score = Math.max(1, Math.min(5, Math.round(3 + weighted / totalDays + satWeighted / totalDays)));

    // Quarterly outlook (slow planets sampled mid-quarter)
    const quarters = [0, 3, 6, 9].map((m, qi) => {
      const pl = computeTransitPlanets(atNoon(Date.UTC(year, m + 1, 15))).planets;
      const q  = 3 + (JUP_SCORE_Y[houseFromSign(rn, pl.Jupiter.rashi_num)] || 0)
                   + (SAT_SCORE_Y[houseFromSign(rn, pl.Saturn.rashi_num)]  || 0);
      const qs = q >= 3.5 ? 'favorable' : q >= 2.5 ? 'moderate' : 'challenging';
      return { quarter: qi + 1, tone: qs };
    });

    const rahuH = houseFromSign(rn, rahuMid.rashi_num);
    const sadeSatiActive = satPhases.some((p) => p.sade_sati);
    const b = band(score);

    rashis.push({
      rashi_num: rn, rashi_en: meta.en, rashi_hi: meta.hi, symbol: meta.symbol, color: meta.color,
      score,
      overview: {
        en: `${year} for ${meta.en}: ${jupPhases[0].text_en} ${satPhases[0].text_en}${sadeSatiActive ? ' Sade Sati influences part of this year — discipline converts pressure into long-term strength.' : ''}`,
        hi: `${meta.hi} के लिए ${year}: ${jupPhases[0].text_hi} ${satPhases[0].text_hi}${sadeSatiActive ? ' इस वर्ष साढ़े साती का प्रभाव — अनुशासन ही शक्ति है।' : ''}`,
      },
      career:  { en: GENERIC.career[b].en,  hi: GENERIC.career[b].hi },
      love:    { en: GENERIC.love[b].en,    hi: GENERIC.love[b].hi },
      finance: { en: GENERIC.finance[b].en, hi: GENERIC.finance[b].hi },
      health:  { en: GENERIC.health[b].en,  hi: GENERIC.health[b].hi },
      jupiter_phases: jupPhases,
      saturn_phases:  satPhases,
      rahu_house: rahuH,
      quarters,
      sade_sati_year: sadeSatiActive,
      lucky: LUCKY[rn] || {},
    });
  }

  return {
    year,
    computed_at: new Date().toISOString(),
    rashis,
  };
}

// ── Shared transit summary ────────────────────────────────────────────────────
function summarise(planets) {
  const out = {};
  for (const [name, p] of Object.entries(planets)) {
    out[name] = { rashi_num: p.rashi_num, rashi_en: p.rashi_en, rashi_hi: p.rashi_hi };
    if (p.is_retrograde) out[name].is_retrograde = true;
  }
  return out;
}

module.exports = { generateWeeklyHoroscope, generateMonthlyHoroscope, generateYearlyHoroscope };
