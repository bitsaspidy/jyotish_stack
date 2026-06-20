'use strict';
/**
 * Analyses a chart and returns per-planet scoring with triggers.
 * Mirrors the client-side scoring but runs server-side as the authoritative engine.
 */
const { PLANET_REMEDY_MAP, PLANET_ORDER } = require('./planetRemedyMap');

const RASHI_LORD = ['','Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const MALEFIC    = new Set(['Saturn','Mars','Rahu','Ketu','Sun']);
const DUSTHANA   = new Set([6, 8, 12]);

function parseDegInSign(dms) {
  if (!dms) return 0;
  const m = String(dms).match(/^(\d+)[°d]?(\d+)[']?(\d+)?/);
  if (m) return +m[1] + +m[2] / 60 + +(m[3] || 0) / 3600;
  return parseFloat(dms) || 0;
}

function dignityNeedBase(pd) {
  const d = pd.dignity || '';
  if (d.includes('Exaltation')   || d.includes('उच्च'))        return 8;
  if (d.includes('Moolatrikona') || d.includes('मूलत्रिकोण')) return 15;
  if (d.includes('Own Sign')     || d.includes('स्वगृह'))      return 20;
  if (d.includes('Debilitation') || d.includes('नीच'))         return 72;
  if (d.includes('Enemy')        || d.includes('शत्रु'))       return 52;
  if (d.includes('Friend')       || d.includes('मित्र'))       return 30;
  return 40; // Neutral
}

function houseLord(ascNum, houseNum) {
  const rn = ((ascNum - 1 + houseNum - 1) % 12) + 1;
  return RASHI_LORD[rn] || 'Jupiter';
}

function getHouse(pd, ascNum) {
  if (pd.house) return +pd.house;
  if (pd.rashi_num && ascNum) return ((+pd.rashi_num - ascNum + 12) % 12) + 1;
  return null;
}

/**
 * detectAtmakaraka — highest degree in sign among 7 classical planets.
 */
function detectAtmakaraka(planets) {
  let max = -1, atma = 'Sun';
  for (const name of ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']) {
    const pd = planets[name];
    if (!pd) continue;
    const deg = parseDegInSign(pd.degree_in_sign_dms);
    if (deg > max) { max = deg; atma = name; }
  }
  return atma;
}

/**
 * detectLagnaLord — planet ruling the ascendant rashi.
 */
function detectLagnaLord(ascNum) {
  return RASHI_LORD[ascNum] || 'Jupiter';
}

/**
 * detectCurrentDasha — finds current Mahadasha, Antardasha, Pratyantardasha.
 */
function detectCurrentDasha(dasha) {
  const md  = (dasha || []).find(d => d.is_current) || (dasha || [])[0] || null;
  const ad  = md?.antardasha?.find(a => a.is_current) || md?.antardasha?.[0] || null;
  const pad = ad?.pratyantardasha?.find(p => p.is_current) || null;
  return { md, ad, pad };
}

/**
 * scorePlanets — returns per-planet analysis with score, priority, triggers.
 */
function scorePlanets(chart) {
  if (!chart?.planets || !chart?.ascendant) return {};

  const planets  = chart.planets;
  const ascNum   = chart.ascendant?.rashi_num || 1;
  const lagnaLord = detectLagnaLord(ascNum);
  const atmakarak = detectAtmakaraka(planets);
  const { md, ad, pad } = detectCurrentDasha(chart.dasha);

  // Build house occupancy map for Paap Kartari + Grahan detection
  const houseOcc = {};
  for (const [name, pd] of Object.entries(planets)) {
    const h = getHouse(pd, ascNum);
    if (h) { (houseOcc[h] = houseOcc[h] || []).push(name); }
  }
  const hasMaleficIn = (h) => (houseOcc[h] || []).some(n => MALEFIC.has(n));

  const result = {};

  for (const name of PLANET_ORDER) {
    const pd = planets[name];
    if (!pd) continue;

    const h = getHouse(pd, ascNum);
    let score = dignityNeedBase(pd);
    const triggers      = [];   // user-friendly (no jargon)
    const adminTriggers = [];   // technical with rule + pts + evidence

    // ── Dignity ──────────────────────────────────────────────────────────
    const dig = pd.dignity || '';
    if (dig.includes('Debilitation') || dig.includes('नीच')) {
      triggers.push({ en: 'Needs extra support — in a challenging position', hi: 'चुनौतीपूर्ण स्थिति में — अतिरिक्त सहायता चाहिए' });
      adminTriggers.push({ rule: 'Debilitation (Neech)', pts: 50, evidence: `${name} debilitated in ${pd.rashi_en}` });
    } else if (dig.includes('Enemy') || dig.includes('शत्रु')) {
      triggers.push({ en: 'Under some pressure in current placement', hi: 'वर्तमान स्थान में कुछ दबाव में' });
      adminTriggers.push({ rule: 'Enemy Sign (Shatru Rashi)', pts: 25, evidence: `${name} in enemy sign ${pd.rashi_en}` });
    } else if (dig.includes('Exaltation') || dig.includes('उच्च')) {
      triggers.push({ en: 'In an exceptionally strong position', hi: 'असाधारण रूप से मजबूत स्थिति में' });
    } else if (dig.includes('Own') || dig.includes('स्वगृह')) {
      triggers.push({ en: 'In its own sign — well placed', hi: 'स्वगृह में — अच्छी स्थिति' });
    }

    // ── Combustion ───────────────────────────────────────────────────────
    if (pd.is_combust && name !== 'Sun') {
      const add = pd.combust_level === 'deep' ? 22 : 14;
      score += add;
      triggers.push({ en: 'Temporarily reduced by solar proximity', hi: 'सूर्य की निकटता से अस्थायी रूप से कमजोर' });
      adminTriggers.push({
        rule: pd.combust_level === 'deep' ? 'Deep Combustion (Ati Maudhya)' : 'Combustion (Maudhya)',
        pts: add,
        evidence: `${name} within ${pd.combust_level === 'deep' ? 'deep' : 'standard'} combustion orb of Sun (distance: ${pd.sun_distance ?? 'n/a'}°)`,
      });
    }

    // ── Retrogression ────────────────────────────────────────────────────
    if (pd.is_retrograde && !['Rahu','Ketu'].includes(name)) {
      score += 6;
      triggers.push({ en: 'Moving in an introspective direction', hi: 'आत्म-चिंतन की दिशा में गतिमान' });
      adminTriggers.push({ rule: 'Retrogression (Vakri)', pts: 6, evidence: `${name} is retrograde (Vakri)` });
    }

    // ── House placement ──────────────────────────────────────────────────
    if (h && DUSTHANA.has(h)) {
      score += 18;
      const areaEn = h===6 ? 'obstacles & service areas' : h===8 ? 'transformation & hidden challenges' : 'losses & isolation';
      const areaHi = h===6 ? 'बाधाएं और सेवा क्षेत्र' : h===8 ? 'परिवर्तन और छिपी चुनौतियां' : 'हानि और एकांत';
      triggers.push({ en: `Extra care needed — placed in area of ${areaEn}`, hi: `अतिरिक्त सावधानी — ${areaHi} में स्थित` });
      adminTriggers.push({ rule: `${h}th House (Dusthana)`, pts: 18, evidence: `${name} in H${h} (dusthana)` });
    } else if (h && ([1,4,7,10].includes(h) || [5,9].includes(h))) {
      score = Math.round(Math.max(score - 8, score * 0.88));
    }

    // ── Paap Kartari Yoga ────────────────────────────────────────────────
    if (h) {
      const prev = h === 1 ? 12 : h - 1;
      const next = h === 12 ? 1 : h + 1;
      if (hasMaleficIn(prev) && hasMaleficIn(next)) {
        score += 20;
        triggers.push({ en: 'Surrounded by challenging planetary energies', hi: 'चुनौतीपूर्ण ग्रह ऊर्जाओं से घिरा हुआ' });
        adminTriggers.push({ rule: 'Paap Kartari Yoga', pts: 20, evidence: `Malefics in H${prev} and H${next} flanking ${name} in H${h}` });
      }
    }

    // ── Grahan / Eclipse Yoga ────────────────────────────────────────────
    if (!['Rahu','Ketu'].includes(name) && h) {
      const shadow = (houseOcc[h] || []).find(m => ['Rahu','Ketu'].includes(m));
      if (shadow) {
        score += 15;
        triggers.push({ en: 'Under eclipse influence — needs balancing', hi: 'ग्रहण प्रभाव में — संतुलन आवश्यक' });
        adminTriggers.push({ rule: 'Grahan Yoga (Eclipse)', pts: 15, evidence: `${name} conjunct ${shadow} in H${h}` });
      }
    }

    // ── Dasha activation ─────────────────────────────────────────────────
    if (md?.lord === name) {
      score += 30;
      triggers.push({ en: 'Running your main life period — highly active', hi: 'मुख्य जीवन दशा में — अत्यधिक सक्रिय' });
      adminTriggers.push({ rule: 'Mahadasha Lord', pts: 30, evidence: `${name} Mahadasha until ${String(md.end).slice(0,10)}` });
    }
    if (ad?.lord === name) {
      score += 20;
      triggers.push({ en: 'Active in your current sub-period', hi: 'वर्तमान अंतरदशा में सक्रिय' });
      adminTriggers.push({ rule: 'Antardasha Lord', pts: 20, evidence: `${name} Antardasha until ${String(ad.end).slice(0,10)}` });
    }
    if (pad?.lord === name) {
      score += 10;
      triggers.push({ en: 'Influencing your current sub-sub-period', hi: 'प्रत्यंतर दशा में प्रभावशाली' });
      adminTriggers.push({ rule: 'Pratyantardasha Lord', pts: 10, evidence: `${name} Pratyantardasha is active` });
    }

    // ── Lagna lord ───────────────────────────────────────────────────────
    if (name === lagnaLord) {
      score += 20;
      triggers.push({ en: 'Controls your personality, health and life direction', hi: 'आपके व्यक्तित्व, स्वास्थ्य और जीवन दिशा का स्वामी' });
      adminTriggers.push({ rule: 'Lagna Lord', pts: 20, evidence: `${name} rules Lagna (${chart.ascendant.rashi_en})` });
    }

    // ── Atmakaraka ───────────────────────────────────────────────────────
    if (name === atmakarak) {
      score += 12;
      triggers.push({ en: "Your soul's main planet — important for life purpose", hi: "आत्मा का मुख्य ग्रह — जीवन उद्देश्य के लिए महत्वपूर्ण" });
      adminTriggers.push({ rule: 'Atmakaraka', pts: 12, evidence: `${name} at ${parseDegInSign(pd.degree_in_sign_dms).toFixed(2)}° (highest degree in sign)` });
    }

    // ── Mangal Dosha ─────────────────────────────────────────────────────
    if (name === 'Mars' && chart.mangal_dosha?.has_dosha) {
      score += 10;
      triggers.push({ en: 'Mars Dosha present — extra care recommended', hi: 'मंगल दोष उपस्थित — अतिरिक्त सावधानी अनुशंसित' });
      adminTriggers.push({ rule: 'Mangal Dosha', pts: 10, evidence: 'Mangal Dosha confirmed in chart' });
    }

    // ── Other doshas ─────────────────────────────────────────────────────
    const doshas = (chart.yogas_doshas?.doshas || []).filter(d =>
      (d.planets || []).includes(name) || (d.name || '').includes(name)
    );
    doshas.forEach(d => {
      score += 8;
      triggers.push({ en: 'Affected by a chart imbalance — support recommended', hi: 'कुंडली असंतुलन से प्रभावित — सहायता अनुशंसित' });
      adminTriggers.push({ rule: d.name || 'Dosha', pts: 8, evidence: `${name} involved in ${d.name}` });
    });

    score = Math.max(0, Math.min(100, Math.round(score)));

    const priority =
      score >= 85 ? 'critical' :
      score >= 65 ? 'high'     :
      score >= 45 ? 'medium'   :
      score >= 25 ? 'low'      :
                    'healthy';

    const remedyRef = PLANET_REMEDY_MAP[name] || null;

    result[name] = {
      name,
      name_hi: remedyRef?.name_hi || name,
      icon:    remedyRef?.icon    || '🪐',
      house:   h,
      rashi_en: pd.rashi_en || '',
      dignity:  pd.dignity  || 'Neutral',
      is_retrograde: !!pd.is_retrograde,
      is_combust:    !!pd.is_combust,
      score,
      priority,
      triggers,
      adminTriggers,
      remedyRef,
    };
  }

  return result;
}

module.exports = { scorePlanets, detectAtmakaraka, detectLagnaLord, detectCurrentDasha, parseDegInSign, RASHI_LORD };
