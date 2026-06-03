'use strict';
const { houseFromSign, ordinal, toDMS, norm, equalHouseFromLongitude, signForEqualHouse, formatDate, rashiFromDeg, nakshatraFromDeg } = require('./core-helpers');
const { DASHA_SEQ, LORD_IDX, dashaSequenceFrom, proportionalLord, kpSubLordsFromLongitude } = require('./dasha-calc');
const { HOUSE_REPORT, PLANET_REPORT, PLANET_NAME_HI, NATURAL_PLANET_NATURE, REPORT_PLANET_ORDER, VARGA_MATRIX_ROWS, EVENT_AREA_CONFIG, DASHA_LORD_MEANINGS } = require('./prediction-data');
const { planets_house_desc } = require('./predictions-engine');

function planetNameHi(planet) { return PLANET_NAME_HI[planet] || planet || 'ग्रह'; }

function currentDashaPair(chart) {
  const currentDasha = chart.dasha?.find((d) => d.is_current) || chart.dasha?.[0] || null;
  const currentAntardasha = currentDasha?.antardasha?.find((d) => d.is_current) || currentDasha?.antardasha?.[0] || null;
  return { currentDasha, currentAntardasha };
}

function planetPositiveNegativeAssessment(chart, planet) {
  const pd = chart.planets?.[planet];
  if (!pd) return { planet, score:0, polarity:'mixed', level:'mixed', label_en:'Mixed', label_hi:'मिश्रित', reasons_en:['Planet data not available.'], reasons_hi:['ग्रह डेटा उपलब्ध नहीं।'], advice_en:'Recalculate the chart.', advice_hi:'कुंडली पुनः गणना करें।' };

  const house   = houseFromSign(chart.ascendant.rashi_num, pd.rashi_num);
  const dignity = pd.dignity || 'Neutral';
  const reasons_en = [], reasons_hi = [];
  let score = 0;

  if (dignity.startsWith('Exaltation'))    { score += 3;    reasons_en.push('Exaltation gives high sign strength.');        reasons_hi.push('उच्च राशि बहुत अच्छा बल देती है।'); }
  else if (dignity.startsWith('Moola'))    { score += 2.5;  reasons_en.push('Moolatrikona gives stable functional strength.');reasons_hi.push('मूलत्रिकोण स्थिर बल देती है।'); }
  else if (dignity.startsWith('Own'))      { score += 2;    reasons_en.push('Own sign supports natural expression.');        reasons_hi.push('स्वगृह स्वाभाविक अभिव्यक्ति को सहारा देती है।'); }
  else if (dignity.startsWith('Debilit'))  { score -= 3;    reasons_en.push('Debilitation weakens expression.');             reasons_hi.push('नीच स्थिति अभिव्यक्ति को कमजोर करती है।'); }
  else if (dignity === 'shadow')           { score -= 0.25; reasons_en.push('Shadow planet results are karmic.');             reasons_hi.push('छाया ग्रह के फल कर्मिक होते हैं।'); }
  else                                     {                 reasons_en.push('Neutral dignity gives moderate strength.');     reasons_hi.push('सामान्य स्थिति मध्यम बल देती है।'); }

  if ([1,5,9,10,11].includes(house))       { score += 2;    reasons_en.push(`${ordinal(house)} house is supportive.`);      reasons_hi.push(`भाव ${house} सहायक है।`); }
  else if ([2,4,7].includes(house))        { score += 1;    reasons_en.push(`${ordinal(house)} house supports life outcomes.`); reasons_hi.push(`भाव ${house} जीवन फल देता है।`); }
  else if ([3,6].includes(house))          { score += 0.25; reasons_en.push(`${ordinal(house)} house gives growth through effort.`); reasons_hi.push(`भाव ${house} प्रयास से विकास देता है।`); }
  else if (house === 8)                    { score -= 2;    reasons_en.push('8th house makes results transformative, delayed, or sudden.'); reasons_hi.push('भाव 8 फल को परिवर्तनशील बनाता है।'); }
  else if (house === 12)                   { score -= 1.5;  reasons_en.push('12th house can create expenses or withdrawal.'); reasons_hi.push('भाव 12 खर्च या विरक्ति बढ़ा सकता है।'); }

  const nature = NATURAL_PLANET_NATURE[planet] || 'mixed';
  if (nature === 'benefic')                { score += 0.75; reasons_en.push('Natural benefic softens results.');  reasons_hi.push('नैसर्गिक शुभ फल को नरम बनाता है।'); }
  else if (['firm','sharp','slow'].includes(nature)) { score -= 0.35; reasons_en.push('Natural malefic gives results through pressure.'); reasons_hi.push('नैसर्गिक पाप दबाव से फल देता है।'); }

  if (pd.is_retrograde && !['Rahu','Ketu'].includes(planet)) { score -= 0.5; reasons_en.push('Retrograde makes results introspective.'); reasons_hi.push('वक्री गति फल को आंतरिक बनाती है।'); }

  const { currentDasha, currentAntardasha } = currentDashaPair(chart);
  const activeInDasha = [currentDasha?.lord, currentAntardasha?.lord].includes(planet);
  if (activeInDasha) { reasons_en.push(`${planet} is active in the current Vimshottari period.`); reasons_hi.push(`${planetNameHi(planet)} वर्तमान विंशोत्तरी में सक्रिय है।`); }

  const roundedScore = +score.toFixed(2);
  const polarity = roundedScore >= 2 ? 'positive' : roundedScore <= -1 ? 'negative' : 'mixed';
  const level = roundedScore >= 4 ? 'strong_positive' : roundedScore >= 2 ? 'positive' : roundedScore <= -2.5 ? 'strong_negative' : roundedScore <= -1 ? 'negative' : 'mixed';
  const label_en = polarity === 'positive' ? 'Positive' : polarity === 'negative' ? 'Negative / needs care' : 'Mixed';
  const label_hi = polarity === 'positive' ? 'शुभ' : polarity === 'negative' ? 'नकारात्मक / सावधानी' : 'मिश्रित';
  const advice_en = polarity === 'positive' ? `Use ${planet} actively for its karakatva.` : polarity === 'negative' ? `Handle ${planet} with remedies and patience.` : `Treat ${planet} as conditional — results improve with maturity.`;
  const advice_hi = polarity === 'positive' ? `${planetNameHi(planet)} के कारकत्व को सक्रिय रूप से उपयोग करें।` : polarity === 'negative' ? `${planetNameHi(planet)} को उपाय और धैर्य से संभालें।` : `${planetNameHi(planet)} के फल परिपक्वता से सुधरते हैं।`;

  return { planet, score:roundedScore, polarity, level, label_en, label_hi, house, dignity, active_in_dasha:activeInDasha, reasons_en, reasons_hi, advice_en, advice_hi };
}

function calculatePlanetAssessmentMap(chart) {
  return Object.fromEntries(Object.keys(PLANET_REPORT).map((planet) => [planet, planetPositiveNegativeAssessment(chart, planet)]));
}

function activatedByCurrentDasha(entry, activeLords) {
  return (Array.isArray(entry.planets_involved) ? entry.planets_involved : []).filter((p) => activeLords.has(p));
}

function calculateYogaDashaReport(chart) {
  const { currentDasha, currentAntardasha } = currentDashaPair(chart);
  const dashaLord = currentDasha?.lord || null;
  const antarLord = currentAntardasha?.lord || null;
  const activeLords = new Set([dashaLord, antarLord].filter(Boolean));
  const yogas  = chart.yogas_doshas?.yogas  || [];
  const doshas = chart.yogas_doshas?.doshas || [];

  const mapEntry = (entry, type) => {
    const activatedBy = activatedByCurrentDasha(entry, activeLords);
    const active = activatedBy.length > 0;
    const name = entry.name || (type === 'yoga' ? 'Yoga' : 'Dosha');
    const nameHi = entry.name_hi || name;
    return {
      name, name_hi:nameHi, type, strength:entry.strength||entry.severity||'moderate', active, activated_by:activatedBy,
      planets_involved:entry.planets_involved||[], trigger_en:entry.trigger_en||'', trigger_hi:entry.trigger_hi||'',
      is_cancelled:Boolean(entry.is_cancelled),
      cancellation_status:entry.cancellation_status || 'active',
      relief_en:entry.relief_en || '',
      relief_hi:entry.relief_hi || '',
      timing_en: active
        ? `${name} is more active because ${activatedBy.join(', ')} is running in the current Dasha/Antardasha. Expect its results to surface more clearly until ${currentAntardasha?.end||currentDasha?.end||'the current period ends'}.`
        : `${name} remains a natal promise. It can become stronger when its involved planets run in Dasha/Antardasha.`,
      timing_hi: active
        ? `${nameHi} अधिक सक्रिय है क्योंकि ${activatedBy.map(planetNameHi).join(', ')} चल रहे हैं।`
        : `${nameHi} जन्म कुंडली का स्थायी संकेत है।`,
    };
  };

  const yogaRows  = yogas.map((e) => mapEntry(e,'yoga')).sort((a,b) => Number(b.active)-Number(a.active));
  const doshaRows = doshas.map((e) => mapEntry(e,'dosha')).sort((a,b) => Number(b.active)-Number(a.active));
  const activeYogaCount  = yogaRows.filter((r) => r.active).length;
  const activeDoshaCount = doshaRows.filter((r) => r.active).length;
  const dashaText = dashaLord && antarLord ? `${dashaLord}-${antarLord}` : 'current Dasha';
  const dashaTextHi = dashaLord && antarLord ? `${planetNameHi(dashaLord)}-${planetNameHi(antarLord)}` : 'वर्तमान दशा';

  return {
    current_lords:{ mahadasha:dashaLord, antardasha:antarLord },
    summary_en:`${dashaText} is the current timing lens. ${activeYogaCount} yoga(s) and ${activeDoshaCount} dosha(s) are directly activated.`,
    summary_hi:`${dashaTextHi} वर्तमान संकेत है। ${activeYogaCount} योग और ${activeDoshaCount} दोष सक्रिय हैं।`,
    guidance_en:'Read Yoga/Dosha results through the strength of involved planets, current Dasha lord, and Gochar overlay.',
    guidance_hi:'योग/दोष के फल को जुड़े ग्रहों के बल, महादशा स्वामी और गोचर के साथ पढ़ें।',
    yogas:yogaRows, doshas:doshaRows,
  };
}

function antardashaWindow(currentDasha) {
  const list = currentDasha?.antardasha || [];
  const foundIndex = list.findIndex((p) => p.is_current);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  return { current:list[currentIndex]||null, upcoming:list.slice(currentIndex+1, currentIndex+4) };
}

function _scoreEventAreasForPlanets(activePlanets, chart, gochar, mahadashLord) {
  const sadeSati     = gochar?.highlights?.sade_sati;
  const jupiter      = gochar?.highlights?.jupiter_support;
  const rahuKetuAxis = gochar?.highlights?.rahu_ketu_axis || 'unknown';
  const activeHouses = Object.fromEntries(activePlanets.map((p) => [
    p, chart.planets?.[p] ? houseFromSign(chart.ascendant.rashi_num, chart.planets[p].rashi_num) : null,
  ]));
  return Object.entries(EVENT_AREA_CONFIG).map(([key, config]) => {
    let score = 0;
    const triggers_en = [], triggers_hi = [];
    for (const planet of activePlanets) {
      const house = activeHouses[planet];
      if (config.lords.includes(planet)) {
        score += planet === mahadashLord ? 1.2 : 0.8;
        triggers_en.push(`${planet} period activates this area.`);
        triggers_hi.push(`${planetNameHi(planet)} की अवधि इस क्षेत्र को सक्रिय करती है।`);
      }
      if (house && config.houses.includes(house)) {
        score += planet === mahadashLord ? 1 : 0.75;
        triggers_en.push(`${planet} in ${ordinal(house)} house activates this area.`);
        triggers_hi.push(`${planetNameHi(planet)} भाव ${house} में इस क्षेत्र को सक्रिय करता है।`);
      }
    }
    if (config.gochar.includes('jupiter_support')) {
      if (jupiter?.favorable) { score += 1; triggers_en.push('Transit Jupiter is supportive.'); triggers_hi.push('गोचर गुरु सहायक है।'); }
      else { triggers_en.push('Transit Jupiter asks for patience.'); triggers_hi.push('गोचर गुरु धैर्य मांगता है।'); }
    }
    if (config.gochar.includes('sade_sati') && sadeSati?.active) {
      score -= key === 'health' ? 1.2 : 0.8;
      triggers_en.push(`Sade Sati active (${sadeSati.phase}).`);
      triggers_hi.push('साढ़ेसाती सक्रिय है।');
    }
    if (config.gochar.includes('rahu_ketu_axis')) {
      triggers_en.push(`Rahu-Ketu axis: ${rahuKetuAxis}.`);
      triggers_hi.push(`राहु-केतु अक्ष: ${rahuKetuAxis}।`);
    }
    const tone = score >= 2.4 ? 'favorable' : score <= -0.8 ? 'caution' : 'moderate';
    return { key, title_en:config.title_en, title_hi:config.title_hi, tone, score:+score.toFixed(2), triggers_en, triggers_hi };
  });
}

function _predictUpcomingAntardasha(dashaLord, uLord, chart, gochar) {
  const activePlanets = [dashaLord, uLord].filter(Boolean);
  const activeLords   = new Set(activePlanets);
  const yogas  = chart.yogas_doshas?.yogas  || [];
  const doshas = chart.yogas_doshas?.doshas || [];

  const activated_yogas = yogas
    .filter((y) => (Array.isArray(y.planets_involved) ? y.planets_involved : []).some((p) => activeLords.has(p)))
    .map((y) => ({ name:y.name, name_hi:y.name_hi||y.name, strength:y.strength||'moderate', is_cancelled:Boolean(y.is_cancelled) }));

  const activated_doshas = doshas
    .filter((d) => (Array.isArray(d.planets_involved) ? d.planets_involved : []).some((p) => activeLords.has(p)))
    .map((d) => ({ name:d.name, name_hi:d.name_hi||d.name, severity:d.severity||'moderate' }));

  const life_area_windows = _scoreEventAreasForPlanets(activePlanets, chart, gochar, dashaLord)
    .sort((a, b) => b.score - a.score);

  const dashaInfo  = DASHA_LORD_MEANINGS[uLord] || {};
  const nature_en  = dashaInfo.nature || `${uLord} brings its natural planetary themes.`;
  const nature_hi  = `${planetNameHi(uLord)} अपने नैसर्गिक कारकत्व के विषय लाता है।`;
  const key_themes = (dashaInfo.opportunities || []).slice(0, 3);
  const cautions   = (dashaInfo.cautions      || []).slice(0, 2);

  const topArea        = life_area_windows.find((a) => a.score > 0) || life_area_windows[0];
  const activeYogas    = activated_yogas.filter((y) => !y.is_cancelled);
  const yogaSuffix     = activeYogas.length > 0 ? ` ${activeYogas.map((y) => y.name).join(', ')} ${activeYogas.length === 1 ? 'yoga activates' : 'yogas activate'}.` : '';
  const doshaSuffix    = activated_doshas.length > 0 ? ` Watch: ${activated_doshas.map((d) => d.name).join(', ')}.` : '';
  const focus_en = `${uLord} Antardasha within ${dashaLord} Mahadasha highlights ${topArea?.title_en || 'key life themes'}. ${nature_en}${yogaSuffix}${doshaSuffix}`;
  const focus_hi = `${planetNameHi(uLord)} अंतर्दशा में ${topArea?.title_hi || 'प्रमुख जीवन क्षेत्र'} उभरेंगे।${activeYogas.length > 0 ? ' ' + activeYogas.map((y) => y.name_hi).join(', ') + ' योग सक्रिय।' : ''}${activated_doshas.length > 0 ? ' ' + activated_doshas.map((d) => d.name_hi).join(', ') + ' पर ध्यान दें।' : ''}`;

  return { activated_yogas, activated_doshas, life_area_windows, nature_en, nature_hi, focus_en, focus_hi, key_themes, cautions };
}

function calculateEventTiming(chart) {
  const { currentDasha, currentAntardasha } = currentDashaPair(chart);
  const dashaLord = currentDasha?.lord || null;
  const antarLord = currentAntardasha?.lord || null;
  const activePlanets = [dashaLord, antarLord].filter(Boolean);
  const gochar = chart.gochar || {};
  const gocharDate = gochar.date || formatDate(new Date());
  const sadeSati      = gochar.highlights?.sade_sati;
  const jupiter       = gochar.highlights?.jupiter_support;
  const rahuKetuAxis  = gochar.highlights?.rahu_ketu_axis || 'unknown';

  const activeHouses = Object.fromEntries(activePlanets.map((planet) => [
    planet,
    chart.planets?.[planet] ? houseFromSign(chart.ascendant.rashi_num, chart.planets[planet].rashi_num) : null,
  ]));

  const windows = Object.entries(EVENT_AREA_CONFIG).map(([key, config]) => {
    let score = 0;
    const triggers_en = [], triggers_hi = [];
    for (const planet of activePlanets) {
      const house = activeHouses[planet];
      if (config.lords.includes(planet)) { score += planet === dashaLord ? 1.2 : 0.8; triggers_en.push(`${planet} period relates to this area.`); triggers_hi.push(`${planetNameHi(planet)} की अवधि इस क्षेत्र से जुड़ती है।`); }
      if (house && config.houses.includes(house)) { score += planet === dashaLord ? 1 : 0.75; triggers_en.push(`${planet} in ${ordinal(house)} house activates this area.`); triggers_hi.push(`${planetNameHi(planet)} भाव ${house} में है।`); }
    }
    if (config.gochar.includes('jupiter_support')) {
      if (jupiter?.favorable) { score += 1; triggers_en.push(`Transit Jupiter is supportive (${planets_house_desc(jupiter.house_from_moon)}).`); triggers_hi.push(`गोचर गुरु सहायक है।`); }
      else { triggers_en.push('Transit Jupiter asks for patient growth.'); triggers_hi.push('गोचर गुरु धैर्य मांगता है।'); }
    }
    if (config.gochar.includes('sade_sati') && sadeSati?.active) { score -= key==='health'?1.2:0.8; triggers_en.push(`Sade Sati active (${sadeSati.phase}).`); triggers_hi.push(`साढ़ेसाती सक्रिय है।`); }
    if (config.gochar.includes('rahu_ketu_axis')) { triggers_en.push(`Rahu-Ketu axis is ${rahuKetuAxis}.`); triggers_hi.push(`राहु-केतु अक्ष ${rahuKetuAxis} है।`); }
    const tone = score >= 2.4 ? 'favorable' : score <= -0.8 ? 'caution' : 'moderate';
    return { key, title_en:config.title_en, title_hi:config.title_hi, tone, score:+score.toFixed(2), date_from:gocharDate, date_to:currentAntardasha?.end||currentDasha?.end||null, mahadasha_lord:dashaLord, antardasha_lord:antarLord, prediction_en:`${config.title_en}: ${dashaLord||'current'} Mahadasha and ${antarLord||'current'} Antardasha make this a ${tone} window until ${currentAntardasha?.end||currentDasha?.end||'the current period ends'}. ${config.action_en}`, prediction_hi:`${config.title_hi}: ${tone==='favorable'?'सहायक':tone==='caution'?'सावधानी वाला':'मध्यम'} समय है। ${config.action_hi}`, triggers_en, triggers_hi, confidence:'rule_based_dasha_gochar' };
  });

  const antar = antardashaWindow(currentDasha);
  return {
    as_of:gocharDate,
    methodology_en:'Event timing combines current Vimshottari Mahadasha/Antardasha with natal house placement of running lords and current Gochar highlights.',
    methodology_hi:'घटना समय निर्धारण वर्तमान दशा, चल रहे ग्रहों की जन्म भाव स्थिति और गोचर संकेतों को मिलाकर किया गया है।',
    current_window:{ mahadasha:currentDasha?{lord:currentDasha.lord,start:currentDasha.start,end:currentDasha.end}:null, antardasha:currentAntardasha?{lord:currentAntardasha.lord,start:currentAntardasha.start,end:currentAntardasha.end}:null, gochar_date:gocharDate },
    windows,
    upcoming_antardashas:antar.upcoming.map((period)=>{ const pred=_predictUpcomingAntardasha(dashaLord,period.lord,chart,gochar); return { lord:period.lord, lord_hi:planetNameHi(period.lord), start:period.start, end:period.end, ...pred }; }),
  };
}

function calculateVargaSignMatrix(chart) {
  const birthValues  = () => Object.fromEntries(REPORT_PLANET_ORDER.map((p) => [p, chart.planets[p]?.rashi_num||null]));
  const chalitValues = () => Object.fromEntries(REPORT_PLANET_ORDER.map((p) => { const pd=chart.planets[p]; if(!pd)return[p,null]; const ch=equalHouseFromLongitude(chart.ascendant.longitude,pd.longitude); return[p,signForEqualHouse(chart.ascendant.rashi_num,ch)]; }));
  const vargaValues  = (slug) => Object.fromEntries(REPORT_PLANET_ORDER.map((p) => [p, chart.varga_charts?.[slug]?.planets?.[p]?.rashi_num||null]));
  return { planet_order:REPORT_PLANET_ORDER, value_type:'rashi_number', rows:VARGA_MATRIX_ROWS.map((row)=>({ key:row.key, label_en:row.label_en, label_hi:row.label_hi, reference_lagna:row.reference_lagna||null, values:row.type==='chalit'?chalitValues():row.slug?vargaValues(row.slug):birthValues() })) };
}

function reportRowForPoint(label, longitude, ascendant, planets, options = {}) {
  const rashi = rashiFromDeg(longitude);
  const kp    = kpSubLordsFromLongitude(longitude);
  const house = options.house || houseFromSign(ascendant.rashi_num, rashi.num);
  const row   = { planet:label, degree:toDMS(longitude), degree_decimal:+norm(longitude).toFixed(4), retrograde:Boolean(options.retrograde), normalized_degree:toDMS(rashi.degreeInSign), normalized_degree_decimal:+rashi.degreeInSign.toFixed(4), house, house_label_en:ordinal(house), house_label_hi:`भाव ${house}`, zodiac_sign:rashi.en, zodiac_sign_hi:rashi.hi, sign_lord:rashi.lord, nakshatra:kp.nakshatra.en, nakshatra_hi:kp.nakshatra.hi, nakshatra_lord:kp.nakshatra.lord, charan:kp.nakshatra.pada, sub_lord:kp.sub_lord, sub_sub_lord:kp.sub_sub_lord, dignity:label==='Ascendant'?null:planets[label]?.dignity||null };
  if (options.assessment) { row.assessment=options.assessment; row.polarity=options.assessment.polarity; row.positive_negative_en=options.assessment.label_en; row.positive_negative_hi=options.assessment.label_hi; row.assessment_score=options.assessment.score; }
  return row;
}

function calculatePlanetDetailRows(chart, assessmentMap = calculatePlanetAssessmentMap(chart)) {
  const rows = Object.keys(PLANET_REPORT).map((planet) => reportRowForPoint(planet, chart.planets[planet].longitude, chart.ascendant, chart.planets, { retrograde:chart.planets[planet].is_retrograde, assessment:assessmentMap[planet] }));
  rows.push(reportRowForPoint('Ascendant', chart.ascendant.longitude, chart.ascendant, chart.planets, { house:1 }));
  return rows;
}

function calculateCuspDetailRows(chart) {
  return Array.from({ length:12 }, (_, index) => {
    const cusp = index + 1;
    const longitude = norm(chart.ascendant.longitude + index * 30);
    const rashi = rashiFromDeg(longitude);
    const kp    = kpSubLordsFromLongitude(longitude);
    return { cusp, degree:toDMS(longitude), degree_decimal:+longitude.toFixed(4), zodiac_sign:rashi.en, zodiac_sign_hi:rashi.hi, sign_lord:rashi.lord, nakshatra:kp.nakshatra.en, nakshatra_hi:kp.nakshatra.hi, nakshatra_lord:kp.nakshatra.lord, sub_lord:kp.sub_lord, sub_sub_lord:kp.sub_sub_lord };
  });
}

function sentenceForPlanet(chart, planet) {
  const pd = chart.planets[planet];
  const house = houseFromSign(chart.ascendant.rashi_num, pd.rashi_num);
  const houseInfo = HOUSE_REPORT[house];
  const planetInfo = PLANET_REPORT[planet];
  return { planet, title_en:`${planet} in ${pd.rashi_en}, ${ordinal(house)} house`, title_hi:`${planet} ${pd.rashi_hi}, भाव ${house}`, summary_en:`${planet} represents ${planetInfo.en}. In ${pd.rashi_en}, ruled by ${pd.rashi_lord}, and placed in the ${ordinal(house)} house, it mainly activates ${houseInfo.en}. Its dignity is ${pd.dignity||'Neutral'}.`, summary_hi:`${planet} ${planetInfo.hi} का संकेत देता है। ${pd.rashi_hi} राशि और भाव ${house} में यह ${houseInfo.hi} को सक्रिय करता है।`, house, rashi_num:pd.rashi_num, rashi_en:pd.rashi_en, rashi_hi:pd.rashi_hi, house_theme_en:houseInfo.en, house_theme_hi:houseInfo.hi, karakatva_en:planetInfo.en, karakatva_hi:planetInfo.hi, dignity:pd.dignity };
}

function sentenceForPlanetWithAssessment(chart, planet, assessment = planetPositiveNegativeAssessment(chart, planet)) {
  const pd = chart.planets[planet];
  const house = houseFromSign(chart.ascendant.rashi_num, pd.rashi_num);
  const houseInfo = HOUSE_REPORT[house];
  const planetInfo = PLANET_REPORT[planet];
  return { planet, title_en:`${planet} in ${pd.rashi_en}, ${ordinal(house)} house`, title_hi:`${planetNameHi(planet)} ${pd.rashi_hi}, भाव ${house}`, summary_en:`${planet} represents ${planetInfo.en}. In ${pd.rashi_en}, ruled by ${pd.rashi_lord}, and placed in the ${ordinal(house)} house, it mainly activates ${houseInfo.en}. Its dignity is ${pd.dignity||'Neutral'}. Assessment: ${assessment.label_en} (score ${assessment.score}). ${assessment.advice_en}`, summary_hi:`${planetNameHi(planet)} ${planetInfo.hi} का संकेत देता है। ${pd.rashi_hi} राशि और भाव ${house} में ${houseInfo.hi} को सक्रिय करता है। आकलन: ${assessment.label_hi}। ${assessment.advice_hi}`, house, rashi_num:pd.rashi_num, rashi_en:pd.rashi_en, rashi_hi:pd.rashi_hi, house_theme_en:houseInfo.en, house_theme_hi:houseInfo.hi, karakatva_en:planetInfo.en, karakatva_hi:planetInfo.hi, dignity:pd.dignity, assessment };
}

function calculateGeneralReport(chart) {
  const asc = chart.ascendant;
  const moon = chart.planets.Moon;
  const sun  = chart.planets.Sun;
  const ascLord = chart.planets[asc.rashi_lord];
  const ascLordHouse = ascLord ? houseFromSign(asc.rashi_num, ascLord.rashi_num) : null;
  const moonHouse = houseFromSign(asc.rashi_num, moon.rashi_num);
  const sunHouse  = houseFromSign(asc.rashi_num, sun.rashi_num);
  const currentDasha = chart.dasha?.find((d) => d.is_current) || chart.dasha?.[0];
  const currentAntar = currentDasha?.antardasha?.find((d) => d.is_current);
  return {
    summary_en:`${asc.rashi_en} Lagna, Moon in ${moon.rashi_en}, and Sun in ${sun.rashi_en} form the main Graha-Rashi-Bhav foundation.`,
    summary_hi:`${asc.rashi_hi} लग्न, ${moon.rashi_hi} चंद्र और ${sun.rashi_hi} सूर्य इस कुंडली का मुख्य आधार बनाते हैं।`,
    sections:[
      { key:'lagna',    title_en:'Core Nature From Lagna',   title_hi:'लग्न से मूल स्वभाव',   body_en:`${asc.rashi_en} Lagna makes ${asc.rashi_lord} the chart ruler. This puts the life focus through ${asc.rashi_en} qualities and makes the condition of ${asc.rashi_lord}${ascLordHouse?` in the ${ordinal(ascLordHouse)} house`:''} important.`, body_hi:`${asc.rashi_hi} लग्न से ${asc.rashi_lord} कुंडली का लग्नेश बनता है।` },
      { key:'mind',     title_en:'Mind And Emotional Pattern', title_hi:'मन और भावनात्मक पैटर्न', body_en:`Moon in ${moon.rashi_en}, ${chart.nakshatra.en} Nakshatra, shows the instinctive mind. Its house from Lagna is ${ordinal(moonHouse)}, so emotional comfort is linked with ${HOUSE_REPORT[moonHouse].en}.`, body_hi:`चंद्र ${moon.rashi_hi} में मन की सहज प्रकृति दिखाता है। भाव ${moonHouse} में ${HOUSE_REPORT[moonHouse].hi} से जुड़ता है।` },
      { key:'karma',    title_en:'Karma And Visibility',       title_hi:'कर्म और प्रतिष्ठा',      body_en:`Sun in ${sun.rashi_en} in the ${ordinal(sunHouse)} house shows authority, recognition, and self-expression. Its sign lord ${sun.rashi_lord} becomes a key channel for public confidence.`, body_hi:`सूर्य ${sun.rashi_hi} में भाव ${sunHouse} में अधिकार और पहचान दिखाता है।` },
      { key:'period',   title_en:'Current Operating Period',   title_hi:'वर्तमान दशा',            body_en:currentDasha?`The running Mahadasha is ${currentDasha.lord}${currentAntar?` with ${currentAntar.lord} Antardasha`:''}.`:'Current Dasha data not available.', body_hi:currentDasha?`वर्तमान महादशा ${currentDasha.lord}${currentAntar?` और अंतर्दशा ${currentAntar.lord}`:''} की है।`:'वर्तमान दशा उपलब्ध नहीं।' },
    ],
  };
}

function calculateDetailedReports(chart) {
  const planetAssessments = calculatePlanetAssessmentMap(chart);
  return {
    methodology:{ house_system:'whole_sign_for_natal_report', cusp_model:'equal_house_from_lagna_degree', sub_lord_model:'KP-style Vimshottari proportional subdivision', event_timing_model:'rule_based_current_vimshottari_dasha_plus_gochar_overlay' },
    general_report:calculateGeneralReport(chart),
    planet_report:Object.keys(PLANET_REPORT).map((planet) => sentenceForPlanetWithAssessment(chart, planet, planetAssessments[planet])),
    planet_assessments:planetAssessments,
    yoga_dasha_report:calculateYogaDashaReport(chart),
    event_timing:calculateEventTiming(chart),
    varga_matrix:calculateVargaSignMatrix(chart),
    planet_details:calculatePlanetDetailRows(chart, planetAssessments),
    cusp_details:calculateCuspDetailRows(chart),
  };
}

module.exports = {
  planetNameHi, currentDashaPair,
  planetPositiveNegativeAssessment, calculatePlanetAssessmentMap,
  activatedByCurrentDasha, calculateYogaDashaReport, antardashaWindow, calculateEventTiming,
  predictUpcomingAntardasha:_predictUpcomingAntardasha,
  calculateVargaSignMatrix, reportRowForPoint,
  calculatePlanetDetailRows, calculateCuspDetailRows,
  sentenceForPlanet, sentenceForPlanetWithAssessment,
  calculateGeneralReport, calculateDetailedReports,
};
