'use strict';
const { PLANET_NAME_HI } = require('./prediction-data');
const { ordinal }         = require('./core-helpers');

const RASHI_LORD = ['','Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

const BENEFIC = new Set(['Jupiter','Venus','Mercury','Moon']);
const MALEFIC = new Set(['Saturn','Mars','Rahu','Ketu','Sun']);
const KENDRA  = new Set([1,4,7,10]);
const TRIKONA = new Set([1,5,9]);
const TRIK    = new Set([6,8,12]);

const PLANET_KARAKATVA = {
  Sun:     ['government, authority, father, career, self-confidence',   'सरकार, पिता, करियर, आत्मविश्वास, अधिकार'],
  Moon:    ['mind, emotions, mother, public life, mental peace',        'मन, माता, भावनाएं, जनजीवन, मानसिक शांति'],
  Mars:    ['energy, courage, siblings, property, ambition',            'ऊर्जा, साहस, भाई-बहन, संपत्ति, महत्वाकांक्षा'],
  Mercury: ['intellect, communication, trade, education, skills',       'बुद्धि, संवाद, व्यापार, शिक्षा, कौशल'],
  Jupiter: ['wisdom, fortune, children, marriage, spirituality, wealth','ज्ञान, भाग्य, संतान, विवाह, अध्यात्म, समृद्धि'],
  Venus:   ['marriage, beauty, luxury, arts, relationships, finance',   'विवाह, सौंदर्य, विलास, कला, संबंध, वित्त'],
  Saturn:  ['discipline, longevity, karma, service, career persistence','अनुशासन, दीर्घायु, कर्म, सेवा, करियर दृढ़ता'],
  Rahu:    ['ambition, foreign links, technology, unconventional paths','महत्वाकांक्षा, विदेश, तकनीक, असामान्य मार्ग'],
  Ketu:    ['spirituality, past karma, liberation, intuition',          'आध्यात्म, पूर्व कर्म, मोक्ष, अंतर्ज्ञान'],
};

const HOUSE_SIGNIFICATION = {
  1:'self, personality, and physical vitality',    2:'wealth, family speech, and savings',
  3:'courage, siblings, and communication',        4:'home, mother, and domestic happiness',
  5:'children, intellect, and investments',        6:'work, health, and overcoming obstacles',
  7:'marriage, business partnerships, and deals',  8:'transformation, longevity, and inheritance',
  9:'fortune, father, and higher learning',        10:'career, reputation, and social status',
  11:'income, gains, and social network',          12:'spirituality, foreign travel, and hidden costs',
};

const LIFE_DOMAIN_DEF = [
  { key:'wealth',       en:'Wealth & Income',        hi:'धन और आय',              houses:[2,11], karaka:['Jupiter','Venus']  },
  { key:'career',       en:'Career & Fame',           hi:'करियर और प्रतिष्ठा',   houses:[10,6], karaka:['Sun']             },
  { key:'health',       en:'Health & Longevity',      hi:'स्वास्थ्य और आयु',      houses:[1,6,8],karaka:[]                  },
  { key:'marriage',     en:'Marriage & Love',         hi:'विवाह और प्रेम',        houses:[7],    karaka:['Venus']            },
  { key:'family',       en:'Family & Happiness',      hi:'परिवार और सुख',         houses:[2,4],  karaka:['Moon']             },
  { key:'children',     en:'Children & Intellect',    hi:'संतान और बुद्धि',       houses:[5],    karaka:['Jupiter']          },
  { key:'fortune',      en:'Fortune & Dharma',        hi:'भाग्य और धर्म',         houses:[9,5],  karaka:['Jupiter']          },
  { key:'spirituality', en:'Spirituality & Moksha',   hi:'आध्यात्म और मोक्ष',    houses:[12,9], karaka:['Ketu','Jupiter']   },
];

function dignityScore(pd) {
  const d = pd.dignity || '';
  if (d.includes('Exaltation')   || d.includes('उच्च'))         return 90;
  if (d.includes('Moolatrikona') || d.includes('मूलत्रिकोण'))  return 82;
  if (d.includes('Own Sign')     || d.includes('स्वगृह'))       return 76;
  if (d.includes('Debilitation') || d.includes('नीच'))          return 22;
  if (d.includes('Friend')       || d.includes('मित्र'))        return 63;
  if (d.includes('Enemy')        || d.includes('शत्रु'))        return 38;
  return 52;
}

function houseMod(name, house) {
  if (!house) return 0;
  let m = 0;
  if (KENDRA.has(house))  m += 8;
  if (TRIKONA.has(house)) m += 8;
  if (TRIK.has(house)) m += BENEFIC.has(name) ? -12 : -4;
  if ([3,6,11].includes(house) && MALEFIC.has(name)) m += 6;
  return m;
}

function computeKundliStrength(chart) {
  if (!chart?.planets || !chart?.ascendant) return null;

  const planets = chart.planets;
  const ascNum  = chart.ascendant.rashi_num || 1;

  // Whole-sign house — planet data doesn't pre-compute house, derive from rashi_num
  const planetHouse = (pd) => {
    if (pd.house) return pd.house;
    if (pd.rashi_num) return ((pd.rashi_num - ascNum + 12) % 12) + 1;
    return null;
  };

  // ── 1. Planet scores ──────────────────────────────────────────
  const planetScores = {};
  let pTotal = 0;

  for (const [name, pd] of Object.entries(planets)) {
    let s = dignityScore(pd) + houseMod(name, planetHouse(pd));
    if (pd.is_retrograde && !['Rahu','Ketu'].includes(name)) s -= 5;
    s = Math.max(10, Math.min(100, Math.round(s)));
    planetScores[name] = s;
    pTotal += s;
  }

  const planetAvg = Math.round(pTotal / Object.keys(planetScores).length);

  // ── 2. Yoga / Dosha score ─────────────────────────────────────
  const goodYogas = chart.yogas_doshas?.yogas  || [];
  const doshas    = chart.yogas_doshas?.doshas || [];

  let yogaScore = 50;
  yogaScore += goodYogas.length * 7;
  yogaScore -= doshas.length  * 6;
  if (goodYogas.some(y => (y.name || '').toLowerCase().includes('raja')))  yogaScore += 15;
  if (goodYogas.some(y => (y.name || '').toLowerCase().includes('dhan')))  yogaScore += 10;
  if (chart.mangal_dosha?.has_dosha) yogaScore -= 10;
  yogaScore = Math.max(5, Math.min(100, yogaScore));

  // ── 3. Life domain scores ─────────────────────────────────────
  const getLordScore = (h) => {
    const rn   = ((ascNum - 1 + h - 1) % 12) + 1;
    const lord = RASHI_LORD[rn];
    return planetScores[lord] || 52;
  };

  const lifeDomains = {};
  for (const def of LIFE_DOMAIN_DEF) {
    const vals = [
      ...def.houses.map(getLordScore),
      ...def.karaka.map(k => planetScores[k] || 52),
    ];
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const lbl = avg >= 72 ? {en:'Excellent',     hi:'उत्कृष्ट', color:'#10B981'}
              : avg >= 58 ? {en:'Good',           hi:'अच्छा',    color:'#22C55E'}
              : avg >= 44 ? {en:'Average',        hi:'सामान्य',  color:'#F59E0B'}
              :             {en:'Needs Attention', hi:'सुधार चाहिए',color:'#EF4444'};
    lifeDomains[def.key] = { key:def.key, en:def.en, hi:def.hi, score:avg, label:lbl };
  }

  const domainAvg = Math.round(
    Object.values(lifeDomains).reduce((s, d) => s + d.score, 0) / LIFE_DOMAIN_DEF.length
  );

  // ── 4. Dasha score ────────────────────────────────────────────
  const curMaha  = (chart.dasha || []).find(d => d.is_current);
  const curAntar = curMaha?.antardasha?.find(a => a.is_current);
  let dashaScore = 50;
  if (curMaha) {
    const ms = planetScores[curMaha.lord] || 52;
    const as = curAntar ? (planetScores[curAntar.lord] || 52) : 52;
    dashaScore = Math.round(ms * 0.6 + as * 0.4);
  }

  // ── 5. Overall score ──────────────────────────────────────────
  const overallScore = Math.round(
    planetAvg * 0.35 +
    yogaScore * 0.25 +
    domainAvg * 0.25 +
    dashaScore * 0.15
  );

  const getLabel = (s) => {
    if (s >= 80) return {en:'Exceptional',       hi:'असाधारण',          color:'#10B981'};
    if (s >= 68) return {en:'Strong',             hi:'मजबूत',             color:'#22C55E'};
    if (s >= 56) return {en:'Above Average',      hi:'औसत से बेहतर',      color:'#84CC16'};
    if (s >= 44) return {en:'Average',            hi:'सामान्य',           color:'#F59E0B'};
    if (s >= 32) return {en:'Challenging',        hi:'चुनौतीपूर्ण',       color:'#F97316'};
    return             {en:'Needs Remedies',     hi:'उपाय आवश्यक',      color:'#EF4444'};
  };

  // ── 6. Strengths ──────────────────────────────────────────────
  const strengths_en = [], strengths_hi = [];
  const sorted = Object.entries(planetScores).sort((a, b) => b[1] - a[1]);

  for (const [name, score] of sorted) {
    if (score < 70 || strengths_en.length >= 3) break;
    const pd = planets[name];
    const dg = pd.dignity?.split('(')[0].trim() || 'well-placed';
    const h  = planetHouse(pd);
    strengths_en.push(`${name} (${dg}) in the ${ordinal(h)} house — strongly supports ${PLANET_KARAKATVA[name]?.[0] || 'its significations'}.`);
    strengths_hi.push(`${PLANET_NAME_HI[name] || name} (${pd.dignity?.match(/\(([^)]+)\)/)?.[1] || 'शुभ'}) ${h}वें भाव में — ${PLANET_KARAKATVA[name]?.[1] || 'जीवन को बल देता है'}।`);
  }

  goodYogas.slice(0, 2).forEach(y => {
    if (strengths_en.length >= 5) return;
    strengths_en.push(`${y.name || 'Beneficial Yoga'} — ${(y.description_en || 'a powerful combination supporting life success').split('.')[0]}.`);
    strengths_hi.push(`${y.name_hi || y.name || 'शुभ योग'} — ${(y.description_hi || 'जीवन सफलता में सहायक शक्तिशाली योग').split('।')[0]}।`);
  });

  // ── 7. Challenges ─────────────────────────────────────────────
  const challenges_en = [], challenges_hi = [];
  const sortedAsc = [...sorted].reverse();

  for (const [name, score] of sortedAsc) {
    if (score > 40 || challenges_en.length >= 3) break;
    const pd = planets[name];
    const dg = pd.dignity?.split('(')[0].trim() || 'weakened';
    const h  = planetHouse(pd);
    const hs = HOUSE_SIGNIFICATION[h] || 'its house area';
    challenges_en.push(`${name} (${dg}) in the ${ordinal(h)} house — the area of ${hs} requires remedies and mindful effort.`);
    challenges_hi.push(`${PLANET_NAME_HI[name] || name} (${dg}) ${h}वें भाव में — ${hs.split(',')[0]} क्षेत्र में उपाय और सचेत प्रयास आवश्यक।`);
  }

  doshas.slice(0, 2).forEach(y => {
    if (challenges_en.length >= 4) return;
    challenges_en.push(`${y.name || 'Dosha'} present — ${(y.description_en || 'remedies recommended').split('.')[0]}.`);
    challenges_hi.push(`${y.name_hi || y.name || 'दोष'} उपस्थित — ${(y.description_hi || 'उपाय आवश्यक').split('।')[0]}।`);
  });

  if (chart.mangal_dosha?.has_dosha && challenges_en.length < 4) {
    challenges_en.push('Mangal Dosha present — marriage timing and partner compatibility need careful Jyotish guidance.');
    challenges_hi.push('मंगल दोष उपस्थित — विवाह काल और जीवनसाथी चुनाव में ज्योतिष मार्गदर्शन लें।');
  }

  // ── 8. Verdict ────────────────────────────────────────────────
  const lbl = getLabel(overallScore);
  const verdict_en = `Overall Kundli strength: ${overallScore}/100 (${lbl.en}). Chart has ${goodYogas.length} positive yoga${goodYogas.length !== 1 ? 's' : ''} and ${doshas.length} dosha${doshas.length !== 1 ? 's' : ''}.${curMaha ? ` Current ${curMaha.lord} Mahadasha rates ${dashaScore}/100 for this chart.` : ''}`;
  const verdict_hi = `समग्र कुंडली बल: ${overallScore}/100 (${lbl.hi})। ${goodYogas.length} शुभ योग और ${doshas.length} दोष। ${curMaha ? `वर्तमान ${PLANET_NAME_HI[curMaha.lord] || curMaha.lord} महादशा इस कुंडली के लिए ${dashaScore}/100।` : ''}`;

  return {
    overall_score: overallScore,
    label: lbl,
    planet_scores: planetScores,
    planet_avg: planetAvg,
    yoga_score: yogaScore,
    yoga_count: goodYogas.length,
    dosha_count: doshas.length,
    domain_avg: domainAvg,
    dasha_score: dashaScore,
    life_domains: lifeDomains,
    life_domain_list: LIFE_DOMAIN_DEF.map(d => lifeDomains[d.key]),
    strengths_en,
    strengths_hi,
    challenges_en,
    challenges_hi,
    verdict_en,
    verdict_hi,
    current_mahadasha: curMaha ? {
      planet:    curMaha.lord,
      planet_hi: PLANET_NAME_HI[curMaha.lord] || curMaha.lord,
      score:     Math.round(planetScores[curMaha.lord] || 50),
      end_date:  curMaha.end,
    } : null,
    current_antardasha: curAntar ? {
      planet:    curAntar.lord,
      planet_hi: PLANET_NAME_HI[curAntar.lord] || curAntar.lord,
      score:     Math.round(planetScores[curAntar.lord] || 50),
      end_date:  curAntar.end,
    } : null,
  };
}

module.exports = { computeKundliStrength };
