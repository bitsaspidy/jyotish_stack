'use strict';
const { DASHA_LORD_MEANINGS, LAGNA_PORTRAIT, MOON_SIGN_PORTRAIT, SADE_SATI_DESC, HOUSE_REPORT } = require('./prediction-data');
const { PLANET_NAME_HI } = require('./prediction-data');

function planets_house_desc(n) {
  if (!n) return 'current position';
  const ord = ['','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
  const label = HOUSE_REPORT[n]?.en || 'this house';
  return `${ord[n] || n} house (${label})`;
}

function planetNameHi(planet) {
  return PLANET_NAME_HI[planet] || planet || 'ग्रह';
}

function generateRuleBasedPredictions(chart) {
  const currentDasha = chart.dasha.find((d) => d.is_current) || chart.dasha[0];
  const currentAntardasha = currentDasha?.antardasha?.find((d) => d.is_current) || currentDasha?.antardasha?.[0];
  const sadeSati = chart.gochar?.highlights?.sade_sati;
  const jupiter  = chart.gochar?.highlights?.jupiter_support;
  const mangal   = chart.mangal_dosha;

  const ascNum    = chart.ascendant?.rashi_num || 1;
  const moonNum   = chart.planets?.Moon?.rashi_num || 1;
  const dashaLord = currentDasha?.lord || 'Sun';
  const antarLord = currentAntardasha?.lord || 'Sun';
  const dm = DASHA_LORD_MEANINGS[dashaLord] || DASHA_LORD_MEANINGS.Sun;
  const am = DASHA_LORD_MEANINGS[antarLord] || DASHA_LORD_MEANINGS.Sun;
  const lagnaPortrait = LAGNA_PORTRAIT[ascNum] || LAGNA_PORTRAIT[1];
  const moonPortrait  = MOON_SIGN_PORTRAIT[moonNum] || MOON_SIGN_PORTRAIT[1];
  const sadeSatiPhase = sadeSati?.active ? sadeSati.phase : 'none';
  const sadeSatiText  = SADE_SATI_DESC[sadeSatiPhase] || SADE_SATI_DESC.none;

  const portrait = {
    lagna_en:    lagnaPortrait.en,
    moon_en:     moonPortrait.en,
    nakshatra_en:`Your birth Nakshatra is ${chart.nakshatra?.en || 'unknown'}, ruled by ${chart.nakshatra?.lord || 'unknown'}, in Pada ${chart.nakshatra?.pada || 1}. This Nakshatra shapes your instinctive nature, the quality of your mind in its most natural state, and the flavor of your emotional responses.`,
    combined_en: `You are a ${chart.ascendant?.rashi_en || ''} ascendant with Moon in ${chart.planets?.Moon?.rashi_en || ''}. Born under ${chart.nakshatra?.en || ''} Nakshatra, you carry the energy of ${chart.nakshatra?.lord || ''} in your soul-nature. Your outer world is shaped by ${chart.ascendant?.rashi_lord || ''} energy, while your inner emotional world moves with the Moon in ${chart.planets?.Moon?.rashi_en || ''}.`,
  };

  const dashaEnd  = currentDasha?.end?.slice(0, 10) || 'unknown';
  const antarEnd  = currentAntardasha?.end?.slice(0, 10) || 'unknown';
  const isSameLord = dashaLord === antarLord;
  const periodCombined = isSameLord
    ? `You are running ${dashaLord}–${dashaLord} — the purest and most concentrated expression of ${dashaLord} energy. All qualities of ${dashaLord} — both its gifts and its challenges — are amplified at this time.`
    : `You are running ${dashaLord} Mahadasha with ${antarLord} Antardasha. The broad ${dashaLord} themes (${dm.nature}) are currently colored by ${antarLord} energy (${am.nature}). This combination creates a unique blend — ${dashaLord} sets the overarching direction, while ${antarLord} influences the texture and events of day-to-day life right now.`;
  const periodCombinedHi = isSameLord
    ? `आप ${planetNameHi(dashaLord)}-${planetNameHi(dashaLord)} की अवधि में हैं।`
    : `आप ${planetNameHi(dashaLord)} महादशा और ${planetNameHi(antarLord)} अंतर्दशा में हैं।`;

  const current_period = { mahadasha:{ lord:dashaLord, end:dashaEnd, nature:dm.nature }, antardasha:{ lord:antarLord, end:antarEnd, nature:am.nature }, combined_en:periodCombined, combined_hi:periodCombinedHi };

  const asterLordNote = isSameLord ? '' : ` ${antarLord} Antardasha adds its own flavor — expect themes of ${am.nature} to weave through this area as well.`;

  const life_areas = {
    career:        { outlook:jupiter?.favorable?'positive':(sadeSati?.active?'challenging':'mixed'), description_en:dm.career_en+(jupiter?.favorable?' Jupiter\'s transit is currently supportive.':' Jupiter\'s transit asks for patient effort.')+asterLordNote, keywords:dm.opportunities.slice(0,3) },
    relationships: { outlook:mangal?.has_dosha?'needs attention':(dashaLord==='Venus'?'positive':'mixed'), description_en:dm.relationships_en+(mangal?.has_dosha?` Note: Mangal Dosha (${mangal.severity}) is present.`:' No prominent Mangal Dosha.')+asterLordNote, keywords:['Emotional depth','Commitment','Communication'] },
    health:        { outlook:sadeSati?.active?'needs attention':'stable', description_en:dm.health_en+(sadeSati?.active?` Additionally, ${sadeSatiText}`:' No compounding Saturn transit pressure.')+asterLordNote, keywords:dm.cautions.slice(-2) },
    finance:       { outlook:(dashaLord==='Jupiter'||dashaLord==='Venus')?'positive':(sadeSati?.active?'challenging':'mixed'), description_en:dm.finance_en+asterLordNote, keywords:['Consistent effort','Planning','Patience'] },
    spirituality:  { outlook:(dashaLord==='Ketu'||dashaLord==='Jupiter'||dashaLord==='Saturn')?'deeply active':'supported', description_en:dm.spiritual_en+(dashaLord==='Ketu'||dashaLord==='Jupiter'?' The inner dimensions are especially alive now.':'')+asterLordNote, keywords:['Practice','Devotion','Inner growth'] },
  };

  const gochar_narrative = {
    sade_sati:{ active:sadeSati?.active, phase:sadeSatiPhase, description_en:sadeSatiText },
    jupiter:{ favorable:jupiter?.favorable, description_en:jupiter?.favorable
      ?`Transit Jupiter is currently in a favorable position from your Moon (${planets_house_desc(jupiter?.house_from_moon)}). This supports expansion, learning, and guidance from mentors. Make use of this window.`
      :`Transit Jupiter is not in its most favorable position from your Moon right now (${planets_house_desc(jupiter?.house_from_moon)}). Growth is still possible, but requires more conscious effort.` },
    rahu_ketu:{ axis:chart.gochar?.highlights?.rahu_ketu_axis||'unknown', description_en:`The current Rahu-Ketu transit axis is ${chart.gochar?.highlights?.rahu_ketu_axis||'unknown'}. Rahu's sign brings new karmic desires; Ketu's sign shows where release and spiritual insight are available.` },
    overall_en:sadeSati?.active
      ?`The overall transit picture is demanding. Sade Sati (${sadeSatiPhase}) adds weight to Saturn's lessons. Integrity, patience, and consistent practice are your strongest tools.`
      :`The overall transit picture is manageable. ${jupiter?.favorable?'Jupiter\'s support from transit is a genuine asset.':'Daily practice and consistent effort continue to bear fruit.'} Stay grounded and deliberate.`,
  };

  const current_challenges = [
    ...dm.cautions.slice(0,2).map((c)=>`${dashaLord} Mahadasha — watch for: ${c}`),
    sadeSati?.active?`Sade Sati (${sadeSatiPhase}) — patience and routine are essential`:null,
    mangal?.has_dosha?`Mangal Dosha (${mangal.severity}) — relationship and property decisions need careful review`:null,
  ].filter(Boolean);

  const current_opportunities = [
    ...dm.opportunities.slice(0,3).map((o)=>`${dashaLord} Mahadasha opens: ${o}`),
    jupiter?.favorable?'Jupiter transit supports expansion — act on it now':null,
    !sadeSati?.active?'No Sade Sati pressure — a clearer window for building':null,
  ].filter(Boolean);

  const base_remedies = sadeSati?.active
    ?['Saturday service — donate black sesame and mustard oil','Shani Chalisa or Shani mantra','Regular daily routine: fixed sleep, meals, exercise','Avoid major impulsive decisions during peak Sade Sati']
    :dashaLord==='Sun'?['Daily Surya Arghya at sunrise','Gayatri mantra — 108 times in the morning','Honor your father and father figures']
    :dashaLord==='Moon'?['Offer water to Moon on Purnima','Chandra mantra for mental peace','Regular journaling to process emotions']
    :dashaLord==='Mars'?['Hanuman Chalisa on Tuesdays','Donate red lentils on Tuesdays','Channel energy into vigorous daily exercise']
    :dashaLord==='Mercury'?['Vishnu Sahasranama on Wednesdays','Meditate on clarity','Write to process Mercury energy']
    :dashaLord==='Jupiter'?['Guru Vandana — honor teachers','Donate yellow food on Thursdays','Deepen study of sacred knowledge']
    :dashaLord==='Venus'?['Friday Lakshmi puja','Create beauty in home consciously','Practice gratitude for abundance']
    :dashaLord==='Saturn'?['Shani puja on Saturdays','Dedicated service to elderly or underprivileged','Iron discipline in daily routine']
    :dashaLord==='Rahu'?['Rahu mantra: Om Raam Rahave Namah','Grounding practices — barefoot in nature','Develop discernment: question intense new desires']
    :['Ganesha puja — Om Gam Ganapataye Namah on Tuesdays','Meditation and inner silence','Create space for insight to arise'];

  const summary_en = [
    portrait.combined_en,
    `Current Vimshottari focus: ${dashaLord} Mahadasha (until ${dashaEnd}) and ${antarLord} Antardasha (until ${antarEnd}).`,
    current_period.combined_en,
    sadeSati?.active?`Sade Sati is active (${sadeSatiPhase}) — discipline and routine matter deeply.`:'Saturn is not in Sade Sati from your Moon — no compounding transit pressure.',
    mangal?.has_dosha?`Mangal Dosha (${mangal.severity}) — relationship decisions benefit from careful review.`:'Mangal Dosha is not prominent from Lagna, Moon, or Venus.',
  ];

  return {
    portrait, current_period, life_areas, gochar_narrative,
    current_challenges, current_opportunities, remedies: base_remedies, summary_en,
    summary_hi:[
      `${chart.ascendant?.rashi_hi||chart.ascendant?.rashi_en||''} लग्न और ${chart.nakshatra?.hi||chart.nakshatra?.en||''} नक्षत्र।`,
      `वर्तमान दशा: ${planetNameHi(dashaLord)} महादशा (${dashaEnd} तक) और ${planetNameHi(antarLord)} अंतर्दशा (${antarEnd} तक)।`,
      periodCombinedHi,
      sadeSati?.active?`चंद्र से साढ़ेसाती सक्रिय है (${sadeSatiPhase} चरण)।`:'चंद्र से साढ़ेसाती सक्रिय नहीं है।',
      mangal?.has_dosha?`मंगल दोष (${mangal.severity}) दिखता है।`:'प्रमुख मंगल दोष नहीं दिखता।',
    ],
    categories:{ career:life_areas.career.description_en, relationships:life_areas.relationships.description_en, health:life_areas.health.description_en, remedies:base_remedies },
  };
}

module.exports = { generateRuleBasedPredictions, planets_house_desc, planetNameHi };
