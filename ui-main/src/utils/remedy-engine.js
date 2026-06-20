// Personalized remedy engine — runs client-side from chart data already in memory.
// Input: chart (from kundli.calculated_data) + remedyManual (from kundli.remedy_manual)
// Output: ranked planet priorities, remedy plan, puja flow, sadhana duration, life areas.

const RASHI_LORD = ['','Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

export const PLANET_NAME_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const PLANET_ICONS = {
  Sun:'☀️', Moon:'🌙', Mars:'🔴', Mercury:'💚', Jupiter:'🟡', Venus:'💎', Saturn:'🪐', Rahu:'☁️', Ketu:'🌀',
};

const PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

const PLANET_DAY    = { Sun:'Sunday', Moon:'Monday', Mars:'Tuesday', Mercury:'Wednesday', Jupiter:'Thursday', Venus:'Friday', Saturn:'Saturday', Rahu:'Saturday', Ketu:'Tuesday' };
const PLANET_DAY_HI = { Sun:'रविवार', Moon:'सोमवार', Mars:'मंगलवार', Mercury:'बुधवार', Jupiter:'गुरुवार', Venus:'शुक्रवार', Saturn:'शनिवार', Rahu:'शनिवार', Ketu:'मंगलवार' };

const MALEFIC = new Set(['Saturn','Mars','Rahu','Ketu','Sun']);

const IMPACT = {
  Sun:     { en:'confidence, father, authority, and career',            hi:'आत्मविश्वास, पिता, अधिकार और करियर' },
  Moon:    { en:'mind, emotions, mother, and mental peace',             hi:'मन, भावनाएं, माता और मानसिक शांति' },
  Mars:    { en:'energy, courage, property, and siblings',              hi:'ऊर्जा, साहस, संपत्ति और भाई-बहन' },
  Mercury: { en:'communication, intellect, and business',               hi:'संवाद, बुद्धि और व्यापार' },
  Jupiter: { en:'wisdom, fortune, children, and growth',                hi:'ज्ञान, भाग्य, संतान और समृद्धि' },
  Venus:   { en:'love, relationships, beauty, and finance',             hi:'प्रेम, संबंध, सौंदर्य और वित्त' },
  Saturn:  { en:'discipline, karma, and career persistence',            hi:'अनुशासन, कर्म और करियर दृढ़ता' },
  Rahu:    { en:'ambition, technology, and foreign matters',            hi:'महत्वाकांक्षा, तकनीक और विदेश' },
  Ketu:    { en:'spirituality, past karma, and liberation',             hi:'आध्यात्म, पूर्व कर्म और मोक्ष' },
};

const REMEDY_BENEFIT = {
  Sun:     { en:'Greater confidence, clarity in career, improved relationship with authority figures and father.', hi:'आत्मविश्वास में वृद्धि, करियर में स्पष्टता, अधिकारियों और पिता के साथ बेहतर संबंध।' },
  Moon:    { en:'Mental peace, emotional stability, better relationship with mother and the public.',              hi:'मानसिक शांति, भावनात्मक स्थिरता, माता एवं जनसंपर्क में सुधार।' },
  Mars:    { en:'Increased energy and courage, resolution of property disputes, better sibling harmony.',         hi:'ऊर्जा और साहस में वृद्धि, संपत्ति विवाद का समाधान, भाई-बहनों के साथ सौहार्द।' },
  Mercury: { en:'Sharper intellect, improved communication and negotiation, success in business and studies.',    hi:'तीक्ष्ण बुद्धि, संवाद और वार्ता में सुधार, व्यापार और शिक्षा में सफलता।' },
  Jupiter: { en:'Enhanced wisdom and fortune, blessings in children, marital harmony, financial growth.',         hi:'ज्ञान और भाग्य में वृद्धि, संतान सुख, वैवाहिक सौहार्द, आर्थिक विकास।' },
  Venus:   { en:'Harmonious relationships, marital happiness, improved finances, creativity, and beauty.',        hi:'सौहार्दपूर्ण संबंध, वैवाहिक सुख, वित्त, सृजनात्मकता और सौंदर्य में सुधार।' },
  Saturn:  { en:'Reduced delays and obstacles, better discipline, career stability, and karmic resolution.',      hi:'विलंब और बाधाओं में कमी, अनुशासन, करियर स्थिरता और कर्म समाधान।' },
  Rahu:    { en:'Clarity in ambition, reduced confusion and anxiety, better results from technology and travel.', hi:'महत्वाकांक्षा में स्पष्टता, भ्रम और चिंता में कमी, तकनीक एवं यात्रा में सफलता।' },
  Ketu:    { en:'Spiritual progress, release of past karmic burdens, enhanced intuition and inner peace.',        hi:'आध्यात्मिक प्रगति, पूर्व कर्मों से मुक्ति, अंतर्ज्ञान और आंतरिक शांति।' },
};

const MANTRA_COUNT = { critical: 108, high: 54, medium: 27, low: 11 };

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
  return 40;
}

function houseLord(ascNum, houseNum) {
  const rn = ((ascNum - 1 + houseNum - 1) % 12) + 1;
  return RASHI_LORD[rn] || 'Jupiter';
}

export function computePersonalizedRemedies(chart, remedyManual) {
  if (!chart?.planets || !chart?.ascendant) return null;

  const planets = chart.planets;
  const ascNum  = chart.ascendant?.rashi_num || 1;

  const lagnaLord = RASHI_LORD[ascNum] || 'Jupiter';

  // Atmakaraka: highest degree in sign among classical 7
  let akaMax = -1, atmakarak = 'Sun';
  for (const name of ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']) {
    const pd = planets[name];
    if (!pd) continue;
    const deg = parseDegInSign(pd.degree_in_sign_dms);
    if (deg > akaMax) { akaMax = deg; atmakarak = name; }
  }

  const curMaha  = (chart.dasha || []).find(d => d.is_current);
  const curAntar = curMaha?.antardasha?.find(a => a.is_current);
  const curPrat  = curAntar?.pratyantardasha?.find(p => p.is_current);

  const getHouse = (pd) => {
    if (pd.house) return +pd.house;
    if (pd.rashi_num) return ((+pd.rashi_num - ascNum + 12) % 12) + 1;
    return null;
  };

  // House occupancy for Paap Kartari & Grahan detection
  const houseOcc = {};
  for (const [name, pd] of Object.entries(planets)) {
    const h = getHouse(pd);
    if (h) { houseOcc[h] = houseOcc[h] || []; houseOcc[h].push(name); }
  }
  const hasMalefic = (h) => (houseOcc[h] || []).some(n => MALEFIC.has(n));

  const planetAnalysis = {};

  for (const name of PLANET_ORDER) {
    const pd = planets[name];
    if (!pd) continue;

    const h = getHouse(pd);
    let score = dignityNeedBase(pd);
    const triggers = [];      // user-friendly
    const adminTriggers = []; // technical details

    // Dignity
    const dig = pd.dignity || '';
    if (dig.includes('Debilitation') || dig.includes('नीच')) {
      triggers.push({ en:'Needs Significant Support', hi:'महत्वपूर्ण सहायता चाहिए' });
      adminTriggers.push({ rule:'Debilitation', pts:50, evidence:`${name} debilitated in ${pd.rashi_en}` });
    } else if (dig.includes('Enemy') || dig.includes('शत्रु')) {
      triggers.push({ en:'Under Pressure', hi:'दबाव में' });
      adminTriggers.push({ rule:'Enemy Sign', pts:25, evidence:`${name} in enemy sign ${pd.rashi_en}` });
    } else if (dig.includes('Exaltation') || dig.includes('उच्च')) {
      triggers.push({ en:'Exceptionally Powerful', hi:'असाधारण रूप से शक्तिशाली' });
    } else if (dig.includes('Own') || dig.includes('स्वगृह')) {
      triggers.push({ en:'In Home Sign', hi:'स्वगृह में' });
    }

    // Combustion
    if (pd.is_combust && name !== 'Sun') {
      const add = pd.combust_level === 'deep' ? 22 : 14;
      score += add;
      triggers.push({ en:"Sun's proximity weakening it", hi:'सूर्य की निकटता से कमजोर' });
      adminTriggers.push({ rule: pd.combust_level === 'deep' ? 'Deep Combustion' : 'Combustion (Maudhya)', pts: add, evidence:`${name} within ${pd.combust_level === 'deep' ? 'deep ' : ''}combust orb of Sun` });
    }

    // Retrograde
    if (pd.is_retrograde && !['Rahu','Ketu'].includes(name)) {
      score += 6;
      triggers.push({ en:'Moving in unusual direction', hi:'असामान्य दिशा में गतिमान' });
      adminTriggers.push({ rule:'Retrogression (Vakri)', pts:6, evidence:`${name} Vakri` });
    }

    // House: dusthana penalty
    if ([6,8,12].includes(h)) {
      score += 18;
      const areaEn = h===6?'challenges & enemies':h===8?'obstacles & transformation':'hidden matters & loss';
      const areaHi = h===6?'चुनौतियां':h===8?'बाधाएं और परिवर्तन':'छिपे मामले';
      triggers.push({ en:`Placed in area of ${areaEn}`, hi:`${areaHi} के क्षेत्र में` });
      adminTriggers.push({ rule:`${h}th House (Dusthana)`, pts:18, evidence:`${name} in H${h}` });
    } else if ([1,4,7,10].includes(h) || [5,9].includes(h)) {
      score = Math.max(score - 8, score * 0.88);
    }

    // Paap Kartari
    if (h) {
      const prev = h === 1 ? 12 : h - 1;
      const next = h === 12 ? 1  : h + 1;
      if (hasMalefic(prev) && hasMalefic(next)) {
        score += 20;
        triggers.push({ en:'Surrounded by challenging influences', hi:'चुनौतीपूर्ण प्रभावों से घिरा' });
        adminTriggers.push({ rule:'Paap Kartari Yoga', pts:20, evidence:`Malefics in H${prev} and H${next} flanking ${name}` });
      }
    }

    // Grahan/Eclipse
    if (!['Rahu','Ketu'].includes(name) && h) {
      const grahan = (houseOcc[h] || []).find(m => ['Rahu','Ketu'].includes(m));
      if (grahan) {
        score += 15;
        triggers.push({ en:'Under eclipse influence', hi:'ग्रहण का प्रभाव' });
        adminTriggers.push({ rule:'Grahan Yoga (Eclipse)', pts:15, evidence:`${name} conjunct ${grahan}` });
      }
    }

    // Dasha activation
    if (curMaha?.lord === name) {
      score += 30;
      triggers.push({ en:'Running your main life period', hi:'आपकी मुख्य जीवन दशा में' });
      adminTriggers.push({ rule:'Mahadasha Lord', pts:30, evidence:`${name} Mahadasha until ${String(curMaha.end).slice(0,10)}` });
    }
    if (curAntar?.lord === name) {
      score += 20;
      triggers.push({ en:'Active in current sub-period', hi:'वर्तमान अंतरदशा में सक्रिय' });
      adminTriggers.push({ rule:'Antardasha Lord', pts:20, evidence:`${name} Antardasha until ${String(curAntar.end).slice(0,10)}` });
    }
    if (curPrat?.lord === name) {
      score += 10;
      triggers.push({ en:'Influencing current sub-sub-period', hi:'प्रत्यंतर दशा में सक्रिय' });
      adminTriggers.push({ rule:'Pratyantardasha Lord', pts:10, evidence:`${name} Pratyantardasha active` });
    }

    // Lagna lord importance
    if (name === lagnaLord) {
      score += 20;
      triggers.push({ en:'Controls your personality & vitality', hi:'आपके व्यक्तित्व का स्वामी' });
      adminTriggers.push({ rule:'Lagna Lord', pts:20, evidence:`${name} rules Lagna (${chart.ascendant.rashi_en})` });
    }

    // Atmakaraka importance
    if (name === atmakarak) {
      score += 12;
      triggers.push({ en:"Your soul's main indicator", hi:'आपकी आत्मा का मुख्य संकेतक' });
      adminTriggers.push({ rule:'Atmakaraka', pts:12, evidence:`${name} at ${parseDegInSign(pd.degree_in_sign_dms).toFixed(2)}° (highest degree in sign)` });
    }

    // Mangal dosha
    if (name === 'Mars' && chart.mangal_dosha?.has_dosha) {
      score += 10;
      triggers.push({ en:'Mangal Dosha present', hi:'मंगल दोष उपस्थित' });
      adminTriggers.push({ rule:'Mangal Dosha', pts:10, evidence:'Mangal Dosha in chart' });
    }

    // Other doshas involving this planet
    const doshas = chart.yogas_doshas?.doshas || [];
    const relDoshas = doshas.filter(d => (d.planets || []).includes(name) || (d.name || '').includes(name));
    relDoshas.forEach(d => {
      score += 8;
      triggers.push({ en:'Affected by chart imbalance', hi:'कुंडली असंतुलन से प्रभावित' });
      adminTriggers.push({ rule:d.name || 'Dosha', pts:8, evidence:`${name} in ${d.name}` });
    });

    score = Math.max(0, Math.min(100, Math.round(score)));

    const priority = score >= 85 ? 'critical'
                   : score >= 65 ? 'high'
                   : score >= 45 ? 'medium'
                   : score >= 25 ? 'low'
                   : 'healthy';

    const remedy = (remedyManual?.planet_deities || []).find(p => p.name === name) || null;
    const count  = MANTRA_COUNT[priority] || 11;

    planetAnalysis[name] = {
      name,
      name_hi: PLANET_NAME_HI[name] || name,
      icon:    PLANET_ICONS[name]   || '🪐',
      house:   h,
      rashi_en: pd.rashi_en || '',
      dignity:  pd.dignity  || 'Neutral',
      is_retrograde: !!pd.is_retrograde,
      is_combust:    !!pd.is_combust,
      score,
      priority,
      triggers,
      adminTriggers,
      remedy,
      dayEn:   PLANET_DAY[name]    || '',
      dayHi:   PLANET_DAY_HI[name] || '',
      impact:  IMPACT[name]  || { en:'its significations', hi:'इसके कारकत्व' },
      benefit: REMEDY_BENEFIT[name] || { en:'Improved planetary results.', hi:'ग्रह फल में सुधार।' },
      mantraCount: count,
      dailyRemedy: {
        en: remedy?.beeja_mantra
          ? `Recite "${remedy.beeja_mantra}" × ${count} times each morning after bath.`
          : `Chant the ${name} mantra × ${count} times each morning.`,
        hi: remedy?.beeja_mantra
          ? `स्नान के बाद प्रतिदिन "${remedy.beeja_mantra}" × ${count} बार जाप करें।`
          : `प्रतिदिन ${PLANET_NAME_HI[name]} मंत्र × ${count} बार जाप करें।`,
      },
      weeklyRemedy: {
        en: remedy?.daan_en
          ? `On ${PLANET_DAY[name]}, offer ${remedy.daan_en} as daan (charity) and worship ${remedy.ishta_devata_en || name + "'s deity"}.`
          : `On ${PLANET_DAY[name]}, worship the deity of ${name} and perform a simple puja.`,
        hi: remedy?.daan_hi || remedy?.daan_en
          ? `${PLANET_DAY_HI[name]} को ${remedy.daan_hi || remedy.daan_en} का दान करें और ${remedy.ishta_devata_hi || remedy.ishta_devata_en || name} की पूजा करें।`
          : `${PLANET_DAY_HI[name]} को ${PLANET_NAME_HI[name]} के देव की पूजा करें।`,
      },
      advancedRemedy: {
        en: [
          remedy?.yantra  ? `Install a ${remedy.yantra} (consult a Jyotishi for proper energisation).` : null,
          remedy?.gemstone ? `Gemstone: ${remedy.gemstone} — wear only after professional astrological advice.` : null,
          remedy?.primary_suktam_en ? `Recite: ${remedy.primary_suktam_en}.` : null,
        ].filter(Boolean),
        hi: [
          remedy?.yantra  ? `${remedy.yantra} स्थापित करें (उचित प्राण-प्रतिष्ठा के लिए ज्योतिषी से परामर्श लें)।` : null,
          (remedy?.gemstone_hi || remedy?.gemstone) ? `रत्न: ${remedy.gemstone_hi || remedy.gemstone} — पेशेवर ज्योतिषीय परामर्श के बाद ही धारण करें।` : null,
          (remedy?.primary_suktam_hi || remedy?.primary_suktam_en) ? `जाप: ${remedy.primary_suktam_hi || remedy.primary_suktam_en}।` : null,
        ].filter(Boolean),
      },
    };
  }

  const sorted = PLANET_ORDER.filter(n => planetAnalysis[n]).map(n => planetAnalysis[n]).sort((a, b) => b.score - a.score);

  const buckets = {
    critical: sorted.filter(p => p.priority === 'critical'),
    high:     sorted.filter(p => p.priority === 'high'),
    medium:   sorted.filter(p => p.priority === 'medium'),
    low:      sorted.filter(p => p.priority === 'low'),
    healthy:  sorted.filter(p => p.priority === 'healthy'),
  };

  const focusPlanets = sorted.filter(p => p.priority !== 'healthy').slice(0, 3);

  const sadhanaDays = buckets.critical.length > 0 ? 90
                    : (buckets.high.length > 0 || buckets.medium.length >= 3) ? 43
                    : 21;

  const sadhanaReason = {
    90: { en:'One or more planets are in critical condition. A full 90-day cycle (3 Mandalas) is required for deep and lasting transformation.', hi:'एक या अधिक ग्रह गंभीर स्थिति में हैं। गहरे और स्थायी परिवर्तन के लिए 90-दिवसीय पूर्ण चक्र (3 मंडल) आवश्यक है।' },
    43: { en:'Your planets need sustained support. A 43-day Purna Mandala is recommended for meaningful improvement.', hi:'आपके ग्रहों को निरंतर सहायता चाहिए। सार्थक सुधार के लिए 43-दिवसीय पूर्ण मंडल अनुशंसित है।' },
    21: { en:'Planets need minor tuning. A 21-day Mandala (one lunar cycle) will create the necessary energetic shift.', hi:'ग्रहों को थोड़ी सुधार की जरूरत है। 21-दिवसीय मंडल (एक चंद्र चक्र) आवश्यक ऊर्जावान बदलाव लाएगा।' },
  }[sadhanaDays];

  // Personalized puja flow
  const baseSteps  = remedyManual?.puja_sequence || [];
  const step0Data  = baseSteps.find(s => +s.extra_data?.step === 0 || s.item_key === 'step_0');
  const shaktiData = baseSteps.find(s => s.extra_data?.conditional || s.item_key === 't_c_shakti');
  const needsShakti = sorted.filter(p => [6,8,12].includes(p.house) && p.priority !== 'healthy').length >= 2;

  const pujaFlow = [];

  // Step 0: Ganesha
  pujaFlow.push(step0Data ? { ...step0Data, stepNum:0, mandatory:true } : {
    item_key:'step_0', title_en:'Ganesh Invocation', title_hi:'गणेश आवाहन',
    description_en:'Begin every session with Lord Ganesha to remove obstacles.',
    description_hi:'बाधाओं को दूर करने के लिए प्रत्येक सत्र गणेश जी के आवाहन से शुरू करें।',
    extra_data:{ step:0, mandatory:true }, stepNum:0, mandatory:true,
  });

  // Steps 1-3: deduplicated priority slots
  const pujaSlots = [
    { planet: focusPlanets[0],              roleEn:'Priority Focus',  roleHi:'प्राथमिकता',  stepNum:1 },
    { planet: planetAnalysis[lagnaLord],    roleEn:'Lagna Lord',      roleHi:'लग्न स्वामी', stepNum:2 },
    { planet: planetAnalysis[atmakarak],    roleEn:'Atmakaraka',      roleHi:'आत्मकारक',    stepNum:3 },
  ];
  const usedInPuja = new Set(['Ganesha']);
  for (const slot of pujaSlots) {
    const p = slot.planet;
    if (!p || usedInPuja.has(p.name)) continue;
    usedInPuja.add(p.name);
    const r = p.remedy;
    pujaFlow.push({
      item_key:       `puja_${p.name}`,
      title_en:       `${p.name} (${slot.roleEn}) — ${r?.ishta_devata_en || 'Deity Invocation'}`,
      title_hi:       `${p.name_hi} (${slot.roleHi}) — ${r?.ishta_devata_hi || r?.ishta_devata_en || 'देव आवाहन'}`,
      description_en: r?.beeja_mantra
        ? `Recite Beeja Mantra: ${r.beeja_mantra} × ${p.mantraCount} times.`
        : `Worship the deity of ${p.name} to strengthen its positive influence.`,
      description_hi: r?.beeja_mantra
        ? `बीज मंत्र जाप: ${r.beeja_mantra} × ${p.mantraCount} बार।`
        : `${p.name_hi} के देव की उपासना करें।`,
      extra_data:{ step:slot.stepNum, mandatory:true },
      stepNum:slot.stepNum, mandatory:true, planet:p.name,
    });
  }

  if (shaktiData && needsShakti) {
    pujaFlow.push({ ...shaktiData, stepNum: pujaFlow.length, conditional:true });
  }

  // Special life areas
  const LIFE_AREAS = [
    { key:'marriage',  en:'Marriage & Relationships', hi:'विवाह और संबंध',        icon:'💍', lords:['Venus', houseLord(ascNum,7)],            threshold:42 },
    { key:'career',    en:'Career & Authority',        hi:'करियर और अधिकार',       icon:'💼', lords:['Sun',  houseLord(ascNum,10)],            threshold:42 },
    { key:'children',  en:'Children & Creativity',     hi:'संतान और सृजनात्मकता', icon:'👶', lords:['Jupiter', houseLord(ascNum,5)],          threshold:42 },
    { key:'health',    en:'Health & Vitality',          hi:'स्वास्थ्य और जीवनशक्ति', icon:'❤️', lords:[lagnaLord, houseLord(ascNum,6)],       threshold:40 },
    { key:'finance',   en:'Finance & Prosperity',       hi:'वित्त और समृद्धि',      icon:'💰', lords:['Jupiter', houseLord(ascNum,2), houseLord(ascNum,11)], threshold:42 },
    { key:'spiritual', en:'Spiritual Growth',           hi:'आध्यात्मिक विकास',       icon:'🕉', lords:['Ketu', houseLord(ascNum,12)],          threshold:35 },
  ];

  const specialAreas = LIFE_AREAS.map(area => {
    const uniq  = [...new Set(area.lords)];
    const pData = uniq.map(l => planetAnalysis[l]).filter(Boolean);
    const needs = pData.filter(p => p.score >= area.threshold);
    if (needs.length === 0) return null;
    const avgScore = Math.round(pData.reduce((s, p) => s + p.score, 0) / (pData.length || 1));
    return { ...area, relevantPlanets: needs, avgScore };
  }).filter(Boolean);

  const timeWindows = (remedyManual?.sadhana_guidance || []).find(g => g.item_key === 'time_windows');
  const chogadiya   = (remedyManual?.sadhana_guidance || []).find(g => g.item_key === 'chogadiya_guide');
  const muhurat     = (remedyManual?.sadhana_guidance || []).find(g => g.item_key === 'muhurat_guide');

  return {
    lagnaLord, atmakarak,
    currentDasha:  curMaha  ? { lord:curMaha.lord,  end:String(curMaha.end).slice(0,10) }  : null,
    currentAntar:  curAntar ? { lord:curAntar.lord, end:String(curAntar.end).slice(0,10) } : null,
    planetAnalysis, sorted, buckets, focusPlanets,
    sadhanaDays, sadhanaReason, pujaFlow, specialAreas,
    timeWindows, chogadiya, muhurat,
    PLANET_NAME_HI, PLANET_ICONS,
  };
}
