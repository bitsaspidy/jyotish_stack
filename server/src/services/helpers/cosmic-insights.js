'use strict';
// Features inspired by classical "Cosmic Code" style reports:
//  1. Chara Karakas (7 Jaimini karakas by degree, same scheme as Atmakaraka)
//  2. Sade Sati Journey (all lifetime cycles with phase dates via ephemeris)
//  3. Mahadasha Journey (bilingual narrative per mahadasha, placement-aware)
//  4. Numerology (Moolank + Bhagyank with bilingual meanings)

const eph = require('../ephemeris.service');
const { siderealLongitudeForPlanet, rashiFromDeg } = require('./core-helpers');

const P_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' };

// ── 1. Chara Karakas ──────────────────────────────────────────────────────────
const KARAKA_DEFS = [
  { key:'atmakaraka',   en:'Atmakaraka (Soul)',        hi:'आत्मकारक (आत्मा)',
    meaning_en:'The king of your chart — your soul\'s deepest desire and the core lesson of this life.',
    meaning_hi:'आपकी कुंडली का राजा — आत्मा की गहरी इच्छा और इस जन्म का मुख्य पाठ।' },
  { key:'amatyakaraka', en:'Amatyakaraka (Career)',    hi:'अमात्यकारक (करियर)',
    meaning_en:'The minister — shapes your career, profession and how you achieve your purpose.',
    meaning_hi:'मंत्री — आपका करियर, पेशा और उद्देश्य प्राप्ति का तरीका तय करता है।' },
  { key:'bhratrikaraka',en:'Bhratrikaraka (Siblings/Guru)', hi:'भ्रातृकारक (भाई-बहन/गुरु)',
    meaning_en:'Represents siblings, courage, mentors and the guidance you receive.',
    meaning_hi:'भाई-बहन, साहस, गुरु और मिलने वाले मार्गदर्शन का प्रतिनिधित्व करता है।' },
  { key:'matrikaraka',  en:'Matrikaraka (Mother)',     hi:'मातृकारक (माता)',
    meaning_en:'Your bond with mother, home comforts and emotional nourishment.',
    meaning_hi:'माँ से जुड़ाव, घर का सुख और भावनात्मक पोषण।' },
  { key:'putrakaraka',  en:'Putrakaraka (Children)',   hi:'पुत्रकारक (संतान)',
    meaning_en:'Children, creativity, intelligence and how you express your talents.',
    meaning_hi:'संतान, रचनात्मकता, बुद्धि और प्रतिभा की अभिव्यक्ति।' },
  { key:'gnatikaraka',  en:'Gnatikaraka (Obstacles)',  hi:'ज्ञातिकारक (बाधाएं)',
    meaning_en:'Health, daily struggles, rivals and maternal relatives — where life tests you.',
    meaning_hi:'स्वास्थ्य, दैनिक संघर्ष, प्रतिद्वंद्वी — जहाँ जीवन आपकी परीक्षा लेता है।' },
  { key:'darakaraka',   en:'Darakaraka (Spouse)',      hi:'दारकारक (जीवनसाथी)',
    meaning_en:'Your life partner\'s nature and what you seek in relationships.',
    meaning_hi:'जीवनसाथी का स्वभाव और रिश्तों से आपकी अपेक्षाएं।' },
];

const PLANET_TRAIT = {
  Sun:     { en:'authority, self-respect and leadership define this area',          hi:'अधिकार, आत्मसम्मान और नेतृत्व इस क्षेत्र को परिभाषित करते हैं' },
  Moon:    { en:'emotions, care and intuition flow through this area',              hi:'भावनाएं, देखभाल और अंतर्ज्ञान इस क्षेत्र में बहते हैं' },
  Mars:    { en:'courage, action and competitive drive power this area',            hi:'साहस, कर्म और प्रतिस्पर्धा की ऊर्जा इस क्षेत्र को चलाती है' },
  Mercury: { en:'intellect, communication and adaptability lead this area',         hi:'बुद्धि, संवाद और लचीलापन इस क्षेत्र का नेतृत्व करते हैं' },
  Jupiter: { en:'wisdom, expansion and dharma bless this area',                     hi:'ज्ञान, विस्तार और धर्म इस क्षेत्र को आशीर्वाद देते हैं' },
  Venus:   { en:'love, beauty and harmony color this area',                         hi:'प्रेम, सौंदर्य और सामंजस्य इस क्षेत्र को रंग देते हैं' },
  Saturn:  { en:'discipline, patience and karma mature this area slowly but surely', hi:'अनुशासन, धैर्य और कर्म इस क्षेत्र को धीरे-धीरे परिपक्व करते हैं' },
};

function computeCharaKarakas(chart) {
  const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const list = order
    .map((name) => {
      const p = chart?.planets?.[name];
      if (!p) return null;
      return { planet: name, deg: +(((p.longitude % 360) + 360) % 360 % 30).toFixed(4), p };
    })
    .filter(Boolean)
    .sort((a, b) => b.deg - a.deg);

  return KARAKA_DEFS.map((def, i) => {
    const k = list[i];
    if (!k) return null;
    const trait = PLANET_TRAIT[k.planet] || {};
    return {
      ...def,
      planet:    k.planet,
      planet_hi: P_HI[k.planet],
      degree:    k.deg,
      rashi_en:  k.p.rashi_en,
      rashi_hi:  k.p.rashi_hi,
      reading_en: `Your ${def.en.split(' ')[0]} is ${k.planet} (${k.deg.toFixed(2)}° in ${k.p.rashi_en}) — ${trait.en}.`,
      reading_hi: `आपका ${def.hi.split(' ')[0]} ${P_HI[k.planet]} है (${k.p.rashi_hi} में ${k.deg.toFixed(2)}°) — ${trait.hi}।`,
    };
  }).filter(Boolean);
}

// ── 2. Sade Sati Journey ──────────────────────────────────────────────────────
const PHASE_INFO = {
  rising:  { en:'Rising Phase',  hi:'उदय चरण',
    text_en:'Saturn transits the 12th from your Moon. Expenses rise, sleep and peace of mind need care, and old patterns begin to dissolve. Start simplifying life and clearing pending matters.',
    text_hi:'शनि आपके चंद्र से बारहवें भाव में चलता है। खर्च बढ़ते हैं, नींद और मानसिक शांति का ध्यान रखना होता है, पुराने ढर्रे टूटने लगते हैं। जीवन सरल करें और लंबित काम निपटाएं।' },
  peak:    { en:'Peak Phase',    hi:'चरम चरण',
    text_en:'Saturn transits over your Moon — the most intense phase. Emotions, health and key relationships are tested. Discipline, routine and patience convert this pressure into lasting strength.',
    text_hi:'शनि आपके चंद्र के ऊपर से गुजरता है — सबसे तीव्र चरण। भावनाएं, स्वास्थ्य और प्रमुख रिश्ते परखे जाते हैं। अनुशासन, दिनचर्या और धैर्य इस दबाव को स्थायी शक्ति में बदलते हैं।' },
  setting: { en:'Setting Phase', hi:'अस्त चरण',
    text_en:'Saturn transits the 2nd from your Moon. Finances and family matters stabilise step by step. Rewards of the discipline you built start appearing — consolidate, don\'t rush.',
    text_hi:'शनि आपके चंद्र से दूसरे भाव में चलता है। धन और परिवार के मामले धीरे-धीरे स्थिर होते हैं। आपके अनुशासन का फल दिखने लगता है — जल्दबाज़ी न करें, मजबूती दें।' },
};

function _saturnRashi(dateMs) {
  const dt = new Date(dateMs);
  const JD = eph.julianDay(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), 12, 0, 0);
  return rashiFromDeg(siderealLongitudeForPlanet('Saturn', JD)).num;
}

function _phaseOf(satRashi, moonRashi) {
  if (satRashi === ((moonRashi + 10) % 12) + 1) return 'rising';   // 12th from Moon
  if (satRashi === moonRashi)                   return 'peak';
  if (satRashi === (moonRashi % 12) + 1)        return 'setting';  // 2nd from Moon
  return null;
}

function computeSadeSatiJourney(chart, profile, years = 90) {
  const moonRashi = chart?.planets?.Moon?.rashi_num;
  if (!moonRashi) return null;

  const birth = new Date(`${String(profile?.date_of_birth || '1990-01-01').slice(0, 10)}T12:00:00Z`);
  const start = birth.getTime();
  const end   = start + years * 365.25 * 86400e3;
  const STEP  = 15 * 86400e3;

  // sample → runs of identical phase
  const runs = [];
  let prevPhase = _phaseOf(_saturnRashi(start), moonRashi);
  let runStart  = start;
  for (let t = start + STEP; t <= end; t += STEP) {
    const ph = _phaseOf(_saturnRashi(t), moonRashi);
    if (ph !== prevPhase) {
      // refine boundary by bisection (1-day precision)
      let lo = t - STEP, hi = t;
      while (hi - lo > 86400e3) {
        const mid = (lo + hi) / 2;
        if (_phaseOf(_saturnRashi(mid), moonRashi) === prevPhase) lo = mid; else hi = mid;
      }
      if (prevPhase) runs.push({ phase: prevPhase, start: runStart, end: hi });
      prevPhase = ph;
      runStart  = hi;
    }
  }
  if (prevPhase) runs.push({ phase: prevPhase, start: runStart, end });

  // group runs into cycles: new cycle when gap since previous run > 3 years
  const fmt = (ms) => new Date(ms).toISOString().slice(0, 10);
  const now = Date.now();
  let cycleNum = 0, lastEnd = -Infinity;
  const phases = runs.map((rn) => {
    if (rn.start - lastEnd > 3 * 365.25 * 86400e3) cycleNum += 1;
    lastEnd = rn.end;
    const info = PHASE_INFO[rn.phase];
    return {
      cycle:     cycleNum,
      phase:     rn.phase,
      phase_en:  info.en,
      phase_hi:  info.hi,
      text_en:   info.text_en,
      text_hi:   info.text_hi,
      start:     fmt(rn.start),
      end:       fmt(rn.end),
      is_current: rn.start <= now && now <= rn.end,
      is_past:    rn.end < now,
    };
  });

  const current = phases.find((p) => p.is_current) || null;
  return {
    moon_rashi_num: moonRashi,
    moon_rashi_en:  chart.planets.Moon.rashi_en,
    moon_rashi_hi:  chart.planets.Moon.rashi_hi,
    total_cycles:   cycleNum,
    active:         !!current,
    current,
    phases,
  };
}

// ── 3. Mahadasha Journey ──────────────────────────────────────────────────────
const MAHA_THEME = {
  Sun:     { title_en:'Time of Power & Identity',     title_hi:'शक्ति और पहचान का समय',
    en:'The Sun period puts your identity, confidence and authority in the spotlight. Recognition at work, dealings with government or seniors, and your relationship with father become central. Lead with humility — ego is the only enemy here.',
    hi:'सूर्य की दशा आपकी पहचान, आत्मविश्वास और अधिकार को केंद्र में लाती है। कार्यक्षेत्र में पहचान, सरकार या वरिष्ठों से जुड़े काम और पिता से संबंध मुख्य बनते हैं। विनम्रता से नेतृत्व करें — यहाँ अहंकार ही एकमात्र शत्रु है।' },
  Moon:    { title_en:'Time of Emotions & Mind',      title_hi:'भावनाओं और मन का समय',
    en:'The Moon period turns life inward — emotions, family, mother and mental peace dominate. Home matters, relocation and nurturing bonds take priority. Protect your routine and rest; a calm mind multiplies every other gain.',
    hi:'चंद्र की दशा जीवन को भीतर की ओर मोड़ती है — भावनाएं, परिवार, माता और मानसिक शांति प्रमुख होती हैं। घर के मामले और रिश्तों का पोषण प्राथमिकता बनते हैं। दिनचर्या और विश्राम की रक्षा करें; शांत मन हर लाभ को कई गुना करता है।' },
  Mars:    { title_en:'Time of Courage & Action',     title_hi:'साहस और एक्शन का समय',
    en:'The Mars period brings raw energy, ambition and competition. Property matters, technical work, sports and bold initiatives flourish. Channel the fire into disciplined action — impulsiveness and conflicts are the traps.',
    hi:'मंगल की दशा कच्ची ऊर्जा, महत्वाकांक्षा और प्रतिस्पर्धा लाती है। संपत्ति के मामले, तकनीकी कार्य और साहसिक पहल फलते-फूलते हैं। इस अग्नि को अनुशासित कर्म में लगाएं — आवेग और टकराव ही जाल हैं।' },
  Mercury: { title_en:'Time of Intellect & Growth',   title_hi:'बुद्धि और विकास का समय',
    en:'The Mercury period sharpens intellect, communication and business sense. Studies, writing, trade, networking and new skills bring growth. Keep commitments precise — scattered focus dilutes Mercury\'s gifts.',
    hi:'बुध की दशा बुद्धि, संवाद और व्यापारिक समझ को तेज करती है। पढ़ाई, लेखन, व्यापार, नेटवर्किंग और नए कौशल विकास लाते हैं। वादों में स्पष्टता रखें — बिखरा ध्यान बुध के वरदान कमजोर करता है।' },
  Jupiter: { title_en:'Time of Wisdom & Expansion',   title_hi:'ज्ञान और विस्तार का समय',
    en:'The Jupiter period expands everything it touches — knowledge, wealth, family and faith. Teachers and mentors appear, marriage and children matters progress, and dharma deepens. Stay generous; growth follows gratitude.',
    hi:'गुरु की दशा जिसे छूती है उसे बढ़ाती है — ज्ञान, धन, परिवार और श्रद्धा। गुरु और मार्गदर्शक मिलते हैं, विवाह-संतान के मामले आगे बढ़ते हैं, धर्म गहरा होता है। उदार रहें; कृतज्ञता के पीछे विकास आता है।' },
  Venus:   { title_en:'Time of Love & Comforts',      title_hi:'प्रेम और सुख का समय',
    en:'The Venus period is the season of relationships, luxury, art and pleasures. Marriage, vehicles, property and creative ventures blossom. Enjoy — but guard against overindulgence; balance keeps Venus auspicious.',
    hi:'शुक्र की दशा रिश्तों, विलासिता, कला और सुखों का मौसम है। विवाह, वाहन, संपत्ति और रचनात्मक कार्य खिलते हैं। आनंद लें — पर अति से बचें; संतुलन ही शुक्र को शुभ रखता है।' },
  Saturn:  { title_en:'Time of Karma & Discipline',   title_hi:'कर्म और अनुशासन का समय',
    en:'The Saturn period is the karmic audit — slow, fair and transformative. Hard work compounds into lasting status; shortcuts collapse. Health, routine and service to elders need attention. What you build now, stays.',
    hi:'शनि की दशा कर्मों का लेखा-जोखा है — धीमी, न्यायप्रिय और रूपांतरकारी। मेहनत स्थायी प्रतिष्ठा बनती है; शॉर्टकट गिर जाते हैं। स्वास्थ्य, दिनचर्या और बड़ों की सेवा पर ध्यान दें। जो अभी बनाएंगे, वही टिकेगा।' },
  Rahu:    { title_en:'Time of Ambition & Twists',    title_hi:'महत्वाकांक्षा और मोड़ का समय',
    en:'The Rahu period brings big desires, foreign connections, technology and sudden twists. Unconventional paths pay off, but illusions and obsessions mislead. Verify everything; ground ambition in ethics.',
    hi:'राहु की दशा बड़ी इच्छाएं, विदेशी संबंध, तकनीक और अचानक मोड़ लाती है। अपरंपरागत रास्ते फल देते हैं, पर भ्रम और जुनून भटकाते हैं। हर चीज़ परखें; महत्वाकांक्षा को नैतिकता से जोड़ें।' },
  Ketu:    { title_en:'Time of Detachment & Moksha',  title_hi:'वैराग्य और मोक्ष का समय',
    en:'The Ketu period quietly detaches you from what no longer serves. Spiritual insight, research and healing deepen, while material attachments loosen. Let go gracefully — clarity arrives through simplicity.',
    hi:'केतु की दशा चुपचाप उन चीज़ों से अलग करती है जो अब काम की नहीं। आध्यात्मिक दृष्टि, शोध और उपचार गहरे होते हैं, भौतिक मोह ढीला पड़ता है। सहजता से छोड़ें — सरलता से स्पष्टता आती है।' },
};

const HOUSE_THEME = {
  1:{ en:'your personality, health and self-image', hi:'आपके व्यक्तित्व, स्वास्थ्य और आत्म-छवि' },
  2:{ en:'wealth, family and speech', hi:'धन, परिवार और वाणी' },
  3:{ en:'courage, siblings and communication', hi:'साहस, भाई-बहन और संवाद' },
  4:{ en:'home, mother and inner peace', hi:'घर, माता और आंतरिक शांति' },
  5:{ en:'children, creativity and intelligence', hi:'संतान, रचनात्मकता और बुद्धि' },
  6:{ en:'health, service and overcoming rivals', hi:'स्वास्थ्य, सेवा और शत्रुओं पर विजय' },
  7:{ en:'marriage, partnerships and public dealings', hi:'विवाह, साझेदारी और सार्वजनिक व्यवहार' },
  8:{ en:'deep transformation, longevity and hidden matters', hi:'गहरे परिवर्तन, आयु और गुप्त विषयों' },
  9:{ en:'fortune, dharma and higher learning', hi:'भाग्य, धर्म और उच्च शिक्षा' },
  10:{ en:'career, status and public achievements', hi:'करियर, प्रतिष्ठा और सार्वजनिक उपलब्धियों' },
  11:{ en:'gains, income and social circles', hi:'लाभ, आय और सामाजिक दायरे' },
  12:{ en:'expenses, foreign lands and spiritual liberation', hi:'व्यय, विदेश और आध्यात्मिक मुक्ति' },
};

function computeDashaJourney(chart) {
  if (!Array.isArray(chart?.dasha)) return null;
  const ascR = chart.ascendant?.rashi_num || 1;
  return chart.dasha.map((d) => {
    const theme = MAHA_THEME[d.lord] || {};
    const p = chart.planets?.[d.lord];
    const house = p?.rashi_num ? ((p.rashi_num - ascR + 12) % 12) + 1 : null;
    const ht = house ? HOUSE_THEME[house] : null;
    return {
      lord:      d.lord,
      lord_hi:   P_HI[d.lord],
      start:     String(d.start).slice(0, 10),
      end:       String(d.end).slice(0, 10),
      years:     d.full_years,
      is_current: !!d.is_current,
      title_en:  theme.title_en, title_hi: theme.title_hi,
      text_en:   theme.en, text_hi: theme.hi,
      placement_en: house ? `${d.lord} sits in your ${house}th house, so this period especially activates ${ht.en}.` : null,
      placement_hi: house ? `${P_HI[d.lord]} आपके ${house}वें भाव में है, इसलिए यह दशा विशेष रूप से ${ht.hi} को सक्रिय करती है।` : null,
    };
  });
}

// ── 4. Numerology ─────────────────────────────────────────────────────────────
const NUM_MEANING = {
  1:{ planet:'Sun',     en:'Leadership, originality and independence. You are born to initiate and inspire.',       hi:'नेतृत्व, मौलिकता और स्वतंत्रता। आप शुरुआत करने और प्रेरित करने के लिए बने हैं।' },
  2:{ planet:'Moon',    en:'Sensitivity, diplomacy and partnership. Your strength lies in cooperation and intuition.', hi:'संवेदनशीलता, कूटनीति और साझेदारी। आपकी शक्ति सहयोग और अंतर्ज्ञान में है।' },
  3:{ planet:'Jupiter', en:'Wisdom, expression and optimism. Knowledge and teaching bring you fortune.',            hi:'ज्ञान, अभिव्यक्ति और आशावाद। ज्ञान और शिक्षण आपको सौभाग्य देते हैं।' },
  4:{ planet:'Rahu',    en:'Discipline, structure and unconventional thinking. You build lasting systems.',          hi:'अनुशासन, संरचना और अपरंपरागत सोच। आप स्थायी व्यवस्थाएं बनाते हैं।' },
  5:{ planet:'Mercury', en:'Communication, adaptability and commerce. Movement and networks fuel your growth.',      hi:'संवाद, लचीलापन और व्यापार। गतिशीलता और नेटवर्क आपके विकास का ईंधन हैं।' },
  6:{ planet:'Venus',   en:'Love, beauty and responsibility. You harmonise people and create comfort.',              hi:'प्रेम, सौंदर्य और दायित्व। आप लोगों में सामंजस्य और सुख का सृजन करते हैं।' },
  7:{ planet:'Ketu',    en:'Spirituality, research and depth. You see what others miss.',                            hi:'आध्यात्म, शोध और गहराई। आप वह देखते हैं जो दूसरों से छूट जाता है।' },
  8:{ planet:'Saturn',  en:'Karma, perseverance and authority. Success comes late but stays forever.',               hi:'कर्म, दृढ़ता और सत्ता। सफलता देर से आती है पर सदा रहती है।' },
  9:{ planet:'Mars',    en:'Courage, service and completion. You fight for causes larger than yourself.',            hi:'साहस, सेवा और पूर्णता। आप स्वयं से बड़े उद्देश्यों के लिए लड़ते हैं।' },
};

const digitSum = (n) => { n = Math.abs(n); while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };

function computeNumerology(profile) {
  const dob = String(profile?.date_of_birth || '').slice(0, 10);
  const [y, m, d] = dob.split('-').map(Number);
  if (!y || !m || !d) return null;
  const moolank  = digitSum(d);
  const bhagyank = digitSum(String(y).split('').reduce((s, c) => s + +c, 0) + digitSum(m) + digitSum(d));
  return {
    moolank:  { num: moolank,  ...NUM_MEANING[moolank] },
    bhagyank: { num: bhagyank, ...NUM_MEANING[bhagyank] },
  };
}

module.exports = { computeCharaKarakas, computeSadeSatiJourney, computeDashaJourney, computeNumerology, HOUSE_THEME, P_HI };
