'use strict';
/**
 * Gochar (transit) engine — "where are today's planets sitting in MY chart, and
 * what does that mean right now?"
 *
 * Deterministic and rule-based. No LLM. The same chart at the same instant returns
 * the same reading.
 *
 * REUSE, NOT REBUILD: the transiting positions and the two house counts
 * (from-Lagna and from-Moon) come from helpers/gochar.js calculateTransitSummary,
 * which is already the fresh-transit source used by the life-activation engine.
 * chart.gochar is a STALE snapshot frozen at chart-calculation time and is never
 * read here.
 *
 * The reading is COMPOSED from config/transit.config.js (house life-areas, planet
 * meanings, the classical Gochar favourability table) rather than written out as
 * 9×12 paragraphs — the same approach the deterministic-qa engine uses, and the
 * reason all the astrology content sits in one owner-reviewable config.
 *
 * Two reference points by the owner's choice:
 *   house_from_lagna → which life AREA is lit up
 *   house_from_moon  → the classical seat that decides FAVOURABLE vs CHALLENGING
 */

const CFG = require('../../config/transit.config');
const { calculateTransitSummary } = require('../helpers/gochar');
// Reused so Hindi house names are the classical words (प्रथम भाव), never the
// broken "1वें भाव" pattern — the exact bug this helper was written to kill.
const { houseLabel } = require('../deterministic-qa/house-label');

const PLANET_ORDER = ['Saturn', 'Jupiter', 'Rahu', 'Ketu', 'Sun', 'Mars', 'Venus', 'Mercury', 'Moon'];

const pick = (pair, lang) => (pair ? (lang === 'hi' ? pair.hi : pair.en) : '');

function insufficient(reason, lang) {
  return {
    available: false,
    reason,
    message: pick(CFG.INSUFFICIENT[reason] || CFG.INSUFFICIENT.calculation_failed, lang),
    rule_version: CFG.RULE_VERSION,
  };
}

/** Classical Gochar verdict for a planet at a given house FROM THE MOON. */
function favourFromMoon(planet, houseFromMoon) {
  if ((CFG.GOCHAR_FAVORABLE[planet] || []).includes(houseFromMoon)) return 'favorable';
  if ((CFG.GOCHAR_NEUTRAL[planet] || []).includes(houseFromMoon)) return 'neutral';
  return 'challenging';
}

function planetName(planet, lang) {
  return lang === 'hi' ? (CFG.PLANET_HI[planet] || planet) : planet;
}

/**
 * One planet's reading, composed from both reference houses.
 * Returns the user-facing lines plus the raw pieces the admin panel needs.
 */
function readPlanet(planet, p, lang) {
  const hLagna = p.house_from_lagna;
  const hMoon = p.house_from_moon;
  const areaLagna = CFG.HOUSE_AREA[hLagna];
  const favour = favourFromMoon(planet, hMoon);
  const brings = CFG.PLANET_TRANSIT[planet];
  const name = planetName(planet, lang);

  const houseName = houseLabel(hLagna, lang); // "प्रथम भाव" / "1st house"

  // User sentence: which area (from Lagna) + the classical verdict (from Moon) +
  // what the planet brings — all valence-neutral pieces assembled by the frame.
  const summary = lang === 'hi'
    ? `${name} इस समय आपके ${houseName} (${areaLagna.hi}) में गोचर कर रहा है। चंद्र से यह ${pick(CFG.FAVOUR_LABEL[favour], 'hi')} है, जो ${brings.hi} को इस क्षेत्र में सामने लाता है।`
    : `${name} is transiting your ${houseName} (${areaLagna.en}). From the Moon this is ${pick(CFG.FAVOUR_LABEL[favour], 'en')}, bringing ${brings.en} into this area.`;

  const notes = [];
  if (p.is_retrograde && planet !== 'Rahu' && planet !== 'Ketu') {
    notes.push(pick(CFG.COPY.retrograde, lang));
  }

  return {
    planet,
    planet_label: name,
    house_from_lagna: hLagna,
    house_from_moon: hMoon,
    area: areaLagna.area,
    area_label: { en: areaLagna.en, hi: areaLagna.hi },
    favour,
    favour_label: CFG.FAVOUR_LABEL[favour],
    is_retrograde: !!p.is_retrograde,
    rashi: { num: p.rashi_num, en: p.rashi_en, hi: p.rashi_hi },
    summary,
    notes,
  };
}

/**
 * @param {object} chart  kundli_profiles.calculated_data
 * @param {object} opts   { lang='hi', admin=false, now=new Date() }
 */
function generateTransit(chart, opts = {}) {
  const lang = opts.lang === 'en' ? 'en' : 'hi';
  const admin = opts.admin === true;
  const now = opts.now instanceof Date ? opts.now : new Date();

  try {
    if (!chart?.planets || !chart?.ascendant) return insufficient('missing_chart', lang);
    if (!chart.planets.Moon?.rashi_num || !chart.ascendant.rashi_num) return insufficient('missing_moon', lang);

    let ts;
    try {
      ts = calculateTransitSummary(chart, null, now);
    } catch {
      return insufficient('calculation_failed', lang);
    }
    if (!ts?.planets) return insufficient('calculation_failed', lang);

    const planets = PLANET_ORDER
      .filter((name) => ts.planets[name])
      .map((name) => readPlanet(name, ts.planets[name], lang));

    // ── Special Saturn conditions (Moon-referenced) ──────────────────────────
    const saturnMoon = ts.planets.Saturn?.house_from_moon;
    const special = [];
    if (saturnMoon && CFG.SADE_SATI_PHASE[saturnMoon]) {
      const ph = CFG.SADE_SATI_PHASE[saturnMoon];
      special.push({
        key: 'sade_sati',
        phase: ph.key,
        title: { en: 'Sade Sati is running', hi: 'साढ़े साती चल रही है' },
        detail: {
          en: `Saturn is in the ${saturnMoon === 12 ? '12th' : saturnMoon === 1 ? '1st' : '2nd'} from your Moon — the ${ph.en} of Sade Sati. A period that asks for patience and steady effort; it is a maturing influence, not a punishment.`,
          hi: `शनि आपके चंद्र से ${saturnMoon === 12 ? 'बारहवें' : saturnMoon === 1 ? 'पहले' : 'दूसरे'} भाव में है — साढ़े साती का ${ph.hi}। यह धैर्य और निरंतर प्रयास माँगने वाला समय है; यह परिपक्व करने वाला प्रभाव है, दंड नहीं।`,
        },
        house_from_moon: saturnMoon,
      });
    } else if (saturnMoon && CFG.DHAIYYA_HOUSE[saturnMoon]) {
      const dh = CFG.DHAIYYA_HOUSE[saturnMoon];
      special.push({
        key: 'dhaiyya',
        variant: dh.key,
        title: { en: 'Dhaiyya (small Sade Sati)', hi: 'ढैया (लघु साढ़े साती)' },
        detail: {
          // houseLabel, not `${n}वें` — Hindi ordinals 1–4 are irregular, so the
          // interpolated form produced "4वें भाव", which is not a word.
          en: `Saturn is in the ${houseLabel(saturnMoon, 'en')} from your Moon — ${dh.en}. A roughly two-and-a-half year phase that tests one area steadily rather than across the board.`,
          hi: `शनि आपके चंद्र से ${houseLabel(saturnMoon, 'hi')} में है — ${dh.hi}। लगभग ढाई वर्ष का यह चरण किसी एक क्षेत्र की स्थिर परीक्षा लेता है।`,
        },
        house_from_moon: saturnMoon,
      });
    }

    // Overall tilt: count favourable vs challenging among the slow, life-shaping
    // planets (Saturn/Jupiter/Rahu/Ketu) — the daily Moon is not weighed here.
    const slow = planets.filter((p) => ['Saturn', 'Jupiter', 'Rahu', 'Ketu'].includes(p.planet));
    const fav = slow.filter((p) => p.favour === 'favorable').length;
    const chal = slow.filter((p) => p.favour === 'challenging').length;
    const tone = fav > chal ? 'supportive' : chal > fav ? 'demanding' : 'mixed';
    const toneLabel = {
      supportive: { en: 'broadly supportive', hi: 'व्यापक रूप से सहायक' },
      demanding:  { en: 'demanding, a time for patience', hi: 'चुनौतीपूर्ण, धैर्य का समय' },
      mixed:      { en: 'mixed', hi: 'मिश्रित' },
    }[tone];

    const result = {
      available: true,
      rule_version: CFG.RULE_VERSION,
      date: ts.date,
      calculated_at: now.toISOString(),
      overall: { tone, tone_label: toneLabel },
      planets,
      special,
      disclaimer: CFG.COPY.disclaimer,
    };

    if (admin) {
      result.evidence = {
        rule_version: CFG.RULE_VERSION,
        moon_rashi: chart.planets.Moon.rashi_num,
        lagna_rashi: chart.ascendant.rashi_num,
        source: 'helpers/gochar.js calculateTransitSummary (fresh; chart.gochar is a stale snapshot)',
        // The classical favourability table applied, so the admin can audit the verdict.
        favourability_table: CFG.GOCHAR_FAVORABLE,
        rows: planets.map((p) => ({
          planet: p.planet,
          rashi: p.rashi.num,
          house_from_lagna: p.house_from_lagna,
          house_from_moon: p.house_from_moon,
          favour: p.favour,
          rule: `${p.planet} favourable from Moon in [${(CFG.GOCHAR_FAVORABLE[p.planet] || []).join(', ')}]; here at ${p.house_from_moon} → ${p.favour}`,
          retrograde: p.is_retrograde,
        })),
        slow_tally: { favorable: fav, challenging: chal, tone },
      };
    }

    return result;
  } catch (err) {
    return { ...insufficient('calculation_failed', lang), error: admin ? String(err && err.message) : undefined };
  }
}

module.exports = { generateTransit, favourFromMoon };
