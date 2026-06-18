'use strict';
/**
 * LAYER 1 — Raw Astrology Data extractor (buildContext)
 * LAYER 2 — Interpretation Rule layer (RULES) — LOGIC ONLY
 *
 * Rules carry no language text. Each rule's user-facing wording lives in
 * templates/<lang>.js keyed by rule id, so the same logic serves every language
 * with no runtime translation.
 *
 *   { id, area, priority, tone, test(ctx) }
 */
const RASHI_LORD = { 1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',6:'Mercury',7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Jupiter' };
const BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
const MALEFICS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun']);
const STRONG_DIGNITY = new Set(['exalted', 'moolatrikona', 'own', 'great_friend', 'friend']);
const WEAK_DIGNITY = new Set(['debilitated', 'great_enemy', 'enemy']);

// ── LAYER 1: turn a raw chart into a clean, queryable context ────────────────────
function buildContext(chart = {}) {
  const planets = chart.planets || {};
  const lagna = chart?.ascendant?.rashi_num || 1;

  const houseOf = (name) => {
    const p = planets[name];
    if (!p) return null;
    if (p.house_num) return p.house_num;
    if (p.rashi_num) return ((p.rashi_num - lagna + 12) % 12) + 1;
    return null;
  };

  const ctx = {
    chart,
    lagna,
    lagnaLord: RASHI_LORD[lagna],
    moonSign: planets.Moon?.rashi_num || null,
    sunSign: planets.Sun?.rashi_num || null,
    moonNak: planets.Moon?.nakshatra_num || chart?.nakshatra?.num || null,
    planets,
    houseOf,
    dignity: (name) => planets[name]?.dignity || 'neutral',
    isStrong: (name) => STRONG_DIGNITY.has(planets[name]?.dignity),
    isWeak: (name) => WEAK_DIGNITY.has(planets[name]?.dignity),
    inHouse: (name, h) => houseOf(name) === h,
    occupants: (h) => Object.keys(planets).filter((n) => houseOf(n) === h),
    beneficsIn: (h) => Object.keys(planets).filter((n) => houseOf(n) === h && BENEFICS.has(n)),
    maleficsIn: (h) => Object.keys(planets).filter((n) => houseOf(n) === h && MALEFICS.has(n)),
    hasYoga: (re) => ((chart.yogas_doshas?.yogas) || []).some((y) => y && !y.is_cancelled && re.test(y.name || '')),
    mangal: chart.mangal_dosha || null,
  };

  const maha = Array.isArray(chart.dasha) ? (chart.dasha.find((d) => d.is_current) || chart.dasha[0]) : null;
  ctx.dasha = maha?.lord || null;
  ctx.antar = maha?.antardasha?.find((a) => a.is_current)?.lord || null;
  ctx.lagnaLordHouse = houseOf(ctx.lagnaLord);
  ctx.yogaNames = ((chart.yogas_doshas?.yogas) || []).filter((y) => y && !y.is_cancelled).map((y) => y.name || '');
  return ctx;
}

const benefic = (n) => BENEFICS.has(n);

// ── LAYER 2: the rule set (logic only; text in templates/<lang>.js) ─────────────
const RULES = [
  // personality
  { id: 'pers.base', area: 'personality', priority: 10, tone: 'neutral', test: () => true },
  { id: 'pers.lagnalord.strong', area: 'personality', priority: 7, tone: 'positive', test: (c) => c.isStrong(c.lagnaLord) },
  { id: 'pers.lagnalord.weak', area: 'personality', priority: 7, tone: 'caution', test: (c) => c.isWeak(c.lagnaLord) },
  { id: 'pers.sun.strong', area: 'personality', priority: 5, tone: 'positive', test: (c) => c.isStrong('Sun') },
  { id: 'pers.saturn.lagna', area: 'personality', priority: 5, tone: 'mixed', test: (c) => c.inHouse('Saturn', 1) },

  // family
  { id: 'fam.base', area: 'family', priority: 10, tone: 'neutral', test: () => true },
  { id: 'fam.benefic4', area: 'family', priority: 7, tone: 'positive', test: (c) => c.beneficsIn(4).length > 0 },
  { id: 'fam.malefic4', area: 'family', priority: 6, tone: 'caution', test: (c) => c.maleficsIn(4).length > 0 },
  { id: 'fam.jupiter.strong', area: 'family', priority: 5, tone: 'positive', test: (c) => c.isStrong('Jupiter') },
  { id: 'fam.rahuketu2', area: 'family', priority: 6, tone: 'caution', test: (c) => c.inHouse('Rahu', 2) || c.inHouse('Ketu', 2) },

  // career
  { id: 'car.base', area: 'career', priority: 10, tone: 'neutral', test: () => true },
  { id: 'car.benefic10', area: 'career', priority: 7, tone: 'positive', test: (c) => c.occupants(10).some((p) => benefic(p) || c.isStrong(p)) },
  { id: 'car.saturn', area: 'career', priority: 6, tone: 'mixed', test: (c) => c.lagnaLord === 'Saturn' || c.isStrong('Saturn') },
  { id: 'car.sun', area: 'career', priority: 5, tone: 'positive', test: (c) => c.isStrong('Sun') || c.inHouse('Sun', 10) },
  { id: 'car.mercury', area: 'career', priority: 5, tone: 'positive', test: (c) => c.isStrong('Mercury') || c.hasYoga(/budh.?aditya|bhadra/i) },
  { id: 'car.rajyoga', area: 'career', priority: 6, tone: 'positive', test: (c) => c.hasYoga(/raj/i) },
  { id: 'car.rahu10', area: 'career', priority: 5, tone: 'caution', test: (c) => c.inHouse('Rahu', 10) },
  { id: 'car.ego', area: 'career', priority: 4, tone: 'caution', test: (c) => c.isStrong('Sun') || c.inHouse('Sun', 10) || c.inHouse('Mars', 10) },

  // money / business
  { id: 'mon.base', area: 'money', priority: 10, tone: 'neutral', test: () => true },
  { id: 'mon.jupiter.venus', area: 'money', priority: 7, tone: 'positive', test: (c) => c.isStrong('Jupiter') || c.isStrong('Venus') },
  { id: 'mon.gain11', area: 'money', priority: 6, tone: 'positive', test: (c) => c.beneficsIn(11).length > 0 || c.occupants(11).some((p) => c.isStrong(p)) },
  { id: 'mon.lakshmi', area: 'money', priority: 6, tone: 'positive', test: (c) => c.hasYoga(/lakshmi|laxmi|dhana|dhan/i) },
  { id: 'mon.chandramangal', area: 'money', priority: 5, tone: 'mixed', test: (c) => c.hasYoga(/chandra.?mangal/i) },
  { id: 'mon.rahu2', area: 'money', priority: 5, tone: 'caution', test: (c) => c.inHouse('Rahu', 2) },
  { id: 'mon.saturn2', area: 'money', priority: 4, tone: 'mixed', test: (c) => c.inHouse('Saturn', 2) },

  // marriage
  { id: 'mar.base', area: 'marriage', priority: 10, tone: 'neutral', test: () => true },
  { id: 'mar.benefic7', area: 'marriage', priority: 8, tone: 'positive', test: (c) => c.beneficsIn(7).length > 0 },
  { id: 'mar.jupiter7', area: 'marriage', priority: 6, tone: 'positive', test: (c) => c.inHouse('Jupiter', 7) || c.isStrong('Jupiter') },
  { id: 'mar.venus.weak', area: 'marriage', priority: 5, tone: 'caution', test: (c) => c.isWeak('Venus') },
  { id: 'mar.mars7', area: 'marriage', priority: 6, tone: 'caution', test: (c) => c.inHouse('Mars', 7) || c.mangal?.has_dosha },
  { id: 'mar.rahuketu7', area: 'marriage', priority: 5, tone: 'caution', test: (c) => c.inHouse('Rahu', 7) || c.inHouse('Ketu', 7) },

  // children
  { id: 'chl.base', area: 'children', priority: 10, tone: 'neutral', test: () => true },
  { id: 'chl.jupiter5', area: 'children', priority: 7, tone: 'positive', test: (c) => c.inHouse('Jupiter', 5) || c.beneficsIn(5).length > 0 || c.isStrong('Jupiter') },
  { id: 'chl.delay', area: 'children', priority: 6, tone: 'caution', test: (c) => c.maleficsIn(5).length > 0 && c.beneficsIn(5).length === 0 && !c.isStrong('Jupiter') },

  // siblings / friends
  { id: 'sib.base', area: 'siblings', priority: 10, tone: 'neutral', test: () => true },
  { id: 'sib.mars3', area: 'siblings', priority: 6, tone: 'positive', test: (c) => c.inHouse('Mars', 3) || c.beneficsIn(3).length > 0 },
  { id: 'sib.saturn3', area: 'siblings', priority: 5, tone: 'mixed', test: (c) => c.inHouse('Saturn', 3) },

  // health
  { id: 'hea.base', area: 'health', priority: 10, tone: 'neutral', test: () => true },
  { id: 'hea.lagnalord.strong', area: 'health', priority: 6, tone: 'positive', test: (c) => c.isStrong(c.lagnaLord) },
  { id: 'hea.weak', area: 'health', priority: 6, tone: 'caution', test: (c) => c.isWeak(c.lagnaLord) || c.maleficsIn(1).length > 0 },
  { id: 'hea.mind', area: 'health', priority: 5, tone: 'caution', test: (c) => c.isWeak('Moon') || c.moonNak === 9 },

  // debt / enemies
  { id: 'deb.base', area: 'debt', priority: 10, tone: 'neutral', test: () => true },
  { id: 'deb.win6', area: 'debt', priority: 6, tone: 'positive', test: (c) => c.inHouse('Mars', 6) || c.inHouse('Saturn', 6) || c.occupants(6).some((p) => c.isStrong(p)) },
  { id: 'deb.caution', area: 'debt', priority: 5, tone: 'caution', test: (c) => c.inHouse('Rahu', 6) || c.inHouse('Rahu', 8) || c.inHouse('Saturn', 8) },

  // property
  { id: 'pro.base', area: 'property', priority: 10, tone: 'neutral', test: () => true },
  { id: 'pro.benefic4', area: 'property', priority: 6, tone: 'positive', test: (c) => c.beneficsIn(4).length > 0 || c.isStrong('Venus') || c.isStrong('Moon') },
  { id: 'pro.mars4', area: 'property', priority: 5, tone: 'mixed', test: (c) => c.inHouse('Mars', 4) },
  { id: 'pro.saturn4', area: 'property', priority: 5, tone: 'caution', test: (c) => c.inHouse('Saturn', 4) },

  // luck / spirituality
  { id: 'spi.base', area: 'spirituality', priority: 10, tone: 'neutral', test: () => true },
  { id: 'spi.jupiter9', area: 'spirituality', priority: 6, tone: 'positive', test: (c) => c.inHouse('Jupiter', 9) || c.isStrong('Jupiter') || c.beneficsIn(9).length > 0 },
  { id: 'spi.ketu', area: 'spirituality', priority: 5, tone: 'positive', test: (c) => c.inHouse('Ketu', 12) || c.inHouse('Jupiter', 12) || c.inHouse('Ketu', 9) },
];

module.exports = { buildContext, RULES, RASHI_LORD, BENEFICS, MALEFICS };
