'use strict';
const { houseFromSign, ordinal } = require('./core-helpers');
const { DASHA_LORD_MEANINGS, PLANET_NAME_HI } = require('./prediction-data');

const RASHI_LORD = {
  1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',6:'Mercury',
  7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Jupiter',
};

function pname(p) { return PLANET_NAME_HI[p] || p; }

function planetHouse(chart, planet) {
  const pd = chart.planets?.[planet];
  return pd?.rashi_num ? houseFromSign(chart.ascendant.rashi_num, pd.rashi_num) : null;
}

function lordOfHouse(lagnaRashi, houseNum) {
  const sign = ((lagnaRashi + houseNum - 2) % 12) + 1;
  return RASHI_LORD[sign];
}

function houseOccupants(chart, houseNum) {
  return Object.entries(chart.planets || {})
    .filter(([, pd]) => pd?.rashi_num && houseFromSign(chart.ascendant.rashi_num, pd.rashi_num) === houseNum)
    .map(([name]) => name);
}

function dignityScore(dignity) {
  if (!dignity) return 0;
  if (dignity.startsWith('Exalt'))  return 3;
  if (dignity.startsWith('Moola')) return 2.5;
  if (dignity.startsWith('Own'))   return 2;
  if (dignity.startsWith('Debilit')) return -2;
  return 0;
}

function planetScore(chart, planet) {
  const pd = chart.planets?.[planet];
  if (!pd) return 0;
  const house = planetHouse(chart, planet);
  let s = dignityScore(pd.dignity);
  if ([1,5,9,10,11].includes(house)) s += 2;
  else if ([2,4,7].includes(house))  s += 1;
  else if ([8,12].includes(house))   s -= 1.5;
  else if (house === 6)              s -= 0.5;
  return s;
}

function currentDasha(chart) {
  const d = chart.dasha?.find((x) => x.is_current) || chart.dasha?.[0];
  const a = d?.antardasha?.find((x) => x.is_current) || d?.antardasha?.[0];
  return { maha: d?.lord || null, antar: a?.lord || null, mahaEnd: d?.end || null, antarEnd: a?.end || null };
}

// ── 1. Career: Job vs Business ────────────────────────────────────────────────
function analyzeCareerPath(chart) {
  const lagnaRashi = chart.ascendant.rashi_num;
  const { maha, antar, mahaEnd } = currentDasha(chart);
  const lord6  = lordOfHouse(lagnaRashi, 6);
  const lord7  = lordOfHouse(lagnaRashi, 7);
  const lord10 = lordOfHouse(lagnaRashi, 10);
  const s6 = planetScore(chart, lord6);
  const s7 = planetScore(chart, lord7);
  const s10 = planetScore(chart, lord10);

  const tenth = houseOccupants(chart, 10);
  const seventh = houseOccupants(chart, 7);

  let bizScore = s7 * 1.5 + s10 * 0.5;
  let jobScore = s6 * 1.5;

  const bizPlanets = ['Sun','Mars','Jupiter','Venus','Rahu'];
  const jobPlanets = ['Saturn','Mercury','Moon'];
  tenth.forEach((p) => {
    if (bizPlanets.includes(p))  bizScore += 1.5;
    if (jobPlanets.includes(p))  jobScore += 1;
  });
  seventh.forEach((p) => {
    if (['Jupiter','Venus','Mercury'].includes(p)) bizScore += 1.2;
    if (['Saturn','Moon'].includes(p))             jobScore += 1;
  });
  if (bizPlanets.includes(maha))  bizScore += 0.8;
  if (jobPlanets.includes(maha))  jobScore += 0.8;

  const verdict = bizScore > jobScore + 1.5 ? 'business'
    : jobScore > bizScore + 1.5 ? 'job' : 'both_viable';

  const verdictLabels = {
    business:    { en:'Business / Self-Employment', hi:'व्यापार / स्व-रोजगार' },
    job:         { en:'Job / Service',              hi:'नौकरी / सेवा' },
    both_viable: { en:'Both Job & Business Viable', hi:'नौकरी और व्यापार दोनों संभव' },
  };

  const indicators_en = [], indicators_hi = [];
  if (s7 > 1)  { indicators_en.push(`7th lord ${lord7} is well-placed — business partnerships are favored`); indicators_hi.push(`7वें भाव के स्वामी ${pname(lord7)} बलवान — व्यापार अनुकूल`); }
  if (s7 < -0.5) { indicators_en.push(`7th lord ${lord7} is weak — partnerships need careful management`); indicators_hi.push(`7वें भाव के स्वामी कमज़ोर — साझेदारी में सावधानी`); }
  if (s6 > 1)  { indicators_en.push(`6th lord ${lord6} is strong — service orientation is natural`); indicators_hi.push(`6वें भाव के स्वामी ${pname(lord6)} बलवान — सेवा कार्य स्वाभाविक`); }
  tenth.forEach((p) => {
    const nature = p==='Saturn'?'service/discipline':p==='Mars'?'entrepreneurship':p==='Jupiter'?'advisory/teaching':p==='Sun'?'leadership/authority':p==='Mercury'?'trade/intellect':p==='Venus'?'arts/partnerships':'versatile';
    indicators_en.push(`${p} in 10th house — ${nature} approach to career`);
    indicators_hi.push(`दसवें भाव में ${pname(p)} — ${p==='Saturn'?'सेवा/अनुशासन':p==='Mars'?'उद्यमिता':p==='Jupiter'?'परामर्श/शिक्षण':p==='Sun'?'नेतृत्व/अधिकार':'व्यापार'} की प्रकृति`);
  });

  const dm = DASHA_LORD_MEANINGS[maha] || {};
  const dashaContext = ['Sun','Mars','Jupiter'].includes(maha)
    ? 'this Mahadasha naturally supports independent leadership and enterprise.'
    : maha==='Saturn' ? 'Saturn Mahadasha rewards disciplined service and long-term structured building.'
    : 'this period rewards consistent effort in whatever path you choose.';

  const description_en = `Career Direction: ${verdictLabels[verdict].en}. Your 7th house (business/partnership) score is ${bizScore.toFixed(1)} vs 6th house (job/service) score of ${jobScore.toFixed(1)}. ${verdict==='business' ? `${lord7} as your 7th lord in its current position favors entrepreneurship and self-driven ventures. You are built to create and lead rather than serve a structure. The 10th house placements further support independent action.` : verdict==='job' ? `${lord6} as your 6th lord indicates strength in structured service environments. You thrive with clear responsibilities, salary stability, and organizational backing.` : `Both paths carry genuine merit. You could hold a senior corporate role with entrepreneurial freedom, or run a structured service-based business.`} Currently in ${maha} Mahadasha — ${dashaContext}`;

  const description_hi = `करियर दिशा: ${verdictLabels[verdict].hi}। व्यापार स्कोर ${bizScore.toFixed(1)}, नौकरी स्कोर ${jobScore.toFixed(1)}। ${verdict==='business' ? `7वें भाव के स्वामी की स्थिति व्यापार अनुकूल है — आप नेतृत्व के लिए बने हैं।` : verdict==='job' ? `6वें भाव की मजबूती सेवा/नौकरी में सफलता दिलाती है।` : `दोनों मार्ग उचित हैं।`} वर्तमान ${pname(maha)} महादशा में ${['Sun','Mars','Jupiter'].includes(maha)?'स्वतंत्र कार्य अनुकूल है।':maha==='Saturn'?'अनुशासित सेवा से उन्नति होगी।':'निरंतर प्रयास सफलता देगा।'}`;

  const advice_en = verdict==='business'
    ? 'Start with a clear plan. Leverage your 7th house for partnerships — never go fully solo if Jupiter is weak. Build your brand identity early. Consider partnerships in Jupiter/Venus dashas.'
    : verdict==='job'
    ? 'Seek structured roles with a clear growth path. Senior organizational positions suit you. Promotions come through dedication, not shortcuts. Negotiate salary confidently.'
    : 'Begin with a structured job to build capital and network. Simultaneously test a side business. Transition fully to business only when monthly revenue covers 2x your salary needs.';

  const advice_hi = verdict==='business'
    ? 'स्पष्ट योजना से शुरुआत करें। साझेदारी में 7वें भाव की ऊर्जा उपयोग करें। अपनी ब्रांड पहचान जल्दी बनाएं।'
    : verdict==='job'
    ? 'स्पष्ट विकास पथ वाली संरचित नौकरी खोजें। समर्पण से पदोन्नति आती है।'
    : 'पहले नौकरी से पूंजी बनाएं। साथ में छोटा व्यापार परखें। मासिक आय 2x वेतन हो तभी पूरी तरह व्यापार पर जाएं।';

  return {
    verdict, verdict_en: verdictLabels[verdict].en, verdict_hi: verdictLabels[verdict].hi,
    business_score: +bizScore.toFixed(1), job_score: +jobScore.toFixed(1),
    tenth_house_planets: tenth, seventh_house_planets: seventh,
    indicators_en, indicators_hi, description_en, description_hi, advice_en, advice_hi,
    current_dasha_en: `${maha} Mahadasha until ${mahaEnd||'unknown'}`,
    current_dasha_hi: `${pname(maha)} महादशा ${mahaEnd||''} तक`,
  };
}

// ── 2. Work Location: Home vs Away ────────────────────────────────────────────
function analyzeWorkLocation(chart) {
  const lagnaRashi = chart.ascendant.rashi_num;
  const lord4  = lordOfHouse(lagnaRashi, 4);
  const lord12 = lordOfHouse(lagnaRashi, 12);
  const lord9  = lordOfHouse(lagnaRashi, 9);
  const s4  = planetScore(chart, lord4);
  const s12 = planetScore(chart, lord12);
  const s9  = planetScore(chart, lord9);

  const moonHouse = planetHouse(chart, 'Moon');
  const rahuHouse = planetHouse(chart, 'Rahu');
  const fourth    = houseOccupants(chart, 4);

  let homeScore = s4;
  let awayScore = s12 + s9 * 0.5;

  if ([9,12].includes(moonHouse))  awayScore += 1.5;
  if ([1,4].includes(moonHouse))   homeScore += 1.5;
  if ([1,12,9].includes(rahuHouse)) awayScore += 1.2;
  if (fourth.includes('Jupiter'))  homeScore += 1;
  if (fourth.includes('Rahu'))     awayScore += 1;
  if (fourth.includes('Saturn'))   homeScore -= 0.5;

  const verdict = awayScore > homeScore + 1 ? 'relocate'
    : homeScore > awayScore + 1 ? 'home' : 'flexible';

  const indicators_en = [], indicators_hi = [];
  if (s4 > 1)  { indicators_en.push(`4th lord ${lord4} is strong — home base is comfortable and productive`); indicators_hi.push(`चौथे भाव के स्वामी ${pname(lord4)} बलवान — घर आधार उचित`); }
  if (s12 > 1) { indicators_en.push(`12th lord ${lord12} is strong — foreign/remote earnings are possible`); indicators_hi.push(`12वें भाव के स्वामी ${pname(lord12)} बलवान — विदेश/दूर से कमाई संभव`); }
  if ([9,12].includes(moonHouse)) { indicators_en.push(`Moon in ${ordinal(moonHouse)} house — emotional fulfillment comes when away from birthplace`); indicators_hi.push(`चंद्र ${moonHouse}वें भाव में — जन्मस्थान से दूर भावनात्मक विकास`); }
  if ([1,12,9].includes(rahuHouse)) { indicators_en.push(`Rahu in ${ordinal(rahuHouse)} house — strong pull toward foreign or unfamiliar environments`); indicators_hi.push(`राहु ${rahuHouse}वें भाव में — विदेश/अजाने परिवेश की ओर खिंचाव`); }
  if (fourth.includes('Jupiter')) { indicators_en.push('Jupiter in 4th house — home is a place of wisdom and stability'); indicators_hi.push('चौथे भाव में गुरु — घर ज्ञान और स्थिरता का केंद्र'); }

  const verdictLabels = {
    relocate: { en:'Work Away from Home / Relocate', hi:'घर से दूर काम / स्थानांतरण' },
    home:     { en:'Work from Home / Local Base',    hi:'घर से काम / स्थानीय आधार' },
    flexible: { en:'Flexible — Both Work Well',      hi:'लचीला — दोनों उचित' },
  };

  const description_en = verdict==='relocate'
    ? `Your chart shows a strong pull toward earning away from your birthplace. The 12th house (foreign/abroad, score ${s12.toFixed(1)}) and 9th house (long distance, score ${s9.toFixed(1)}) are active. ${[9,12].includes(moonHouse) ? `Moon in the ${ordinal(moonHouse)} house tells you that your emotional growth happens when you step beyond familiar surroundings.` : ''} Career opportunities involving relocation, remote work for international clients, or regular travel are more fruitful than staying confined to one location.`
    : verdict==='home'
    ? `Your 4th house is strong (score ${s4.toFixed(1)}), making your home environment your natural power center. Working from home, a home-based business, or remaining close to your roots serves you best. ${[1,4].includes(moonHouse) ? `Moon near the lagna/4th confirms this — you need familiar surroundings to feel secure and productive.` : ''} The 4th lord ${lord4}'s placement actively supports stability and productivity from a familiar base.`
    : `Your chart supports flexibility. Work effectively from home and external locations. Home provides the anchor; travel brings variety and opportunity. Neither extreme — full isolation nor constant relocation — serves you best.`;

  const description_hi = verdict==='relocate'
    ? `12वें और 9वें भाव की मजबूती जन्मस्थान से दूर कमाई का संकेत देती है। विदेश या दूरदराज के कार्य अधिक फलदायी होंगे।`
    : verdict==='home'
    ? `4था भाव मजबूत — घर आपका शक्ति केंद्र है। घर से काम या स्थानीय व्यापार सर्वोचित है।`
    : `लचीलापन अनुकूल है — घर और बाहर दोनों से काम करें। घर को आधार रखें, यात्रा से विविधता लाएं।`;

  const advice_en = verdict==='relocate'
    ? 'Actively explore opportunities in other cities or internationally. Remote work for foreign clients, export business, or careers requiring travel are your growth zones. Do not anchor yourself too rigidly to your birthplace.'
    : verdict==='home'
    ? 'Invest in a quality home office setup. Local businesses, home-based consulting, or hybrid work with home as anchor suits you. Productivity peaks in familiar, comfortable surroundings.'
    : 'A semi-structured routine works best — a few days in office/field and a few at home. Travel for key projects but keep home as your operational base.';

  const advice_hi = verdict==='relocate'
    ? 'अन्य शहरों या विदेश में अवसर सक्रिय रूप से खोजें। विदेशी क्लाइंट, निर्यात या यात्रा-आधारित करियर आपके विकास क्षेत्र हैं।'
    : verdict==='home'
    ? 'गुणवत्तापूर्ण होम ऑफिस में निवेश करें। स्थानीय व्यापार या हाइब्रिड कार्य उचित है।'
    : 'कुछ दिन बाहर, कुछ घर से — यह संतुलन सर्वोत्तम है। महत्वपूर्ण कार्य के लिए यात्रा करें।';

  return {
    verdict, home_score: +homeScore.toFixed(1), away_score: +awayScore.toFixed(1),
    verdict_en: verdictLabels[verdict].en, verdict_hi: verdictLabels[verdict].hi,
    indicators_en, indicators_hi, description_en, description_hi, advice_en, advice_hi,
  };
}

// ── 3. Business Start Timing ──────────────────────────────────────────────────
function analyzeBusinessTiming(chart) {
  const { maha, antar, mahaEnd, antarEnd } = currentDasha(chart);
  const MAHA_BIZ = {
    Jupiter:{ score:3, en:'Jupiter Mahadasha — best time for expansion, new ventures, and growth', hi:'गुरु महादशा — विस्तार और नए उद्यम के लिए श्रेष्ठ' },
    Venus:  { score:3, en:'Venus Mahadasha — excellent for arts, luxury, beauty, partnerships', hi:'शुक्र महादशा — कला, विलास और साझेदारी व्यापार के लिए उत्तम' },
    Mercury:{ score:2, en:'Mercury Mahadasha — strong for trade, IT, communication businesses', hi:'बुध महादशा — व्यापार, IT, संचार के लिए अनुकूल' },
    Sun:    { score:2, en:'Sun Mahadasha — authority-based businesses and leadership roles', hi:'सूर्य महादशा — नेतृत्व और अधिकार आधारित व्यापार के लिए उचित' },
    Mars:   { score:2, en:'Mars Mahadasha — real estate, construction, competitive industries', hi:'मंगल महादशा — अचल संपत्ति, निर्माण, प्रतिस्पर्धी व्यापार' },
    Moon:   { score:1, en:'Moon Mahadasha — public-facing, retail, hospitality — start carefully', hi:'चंद्र महादशा — जन-सेवा, खुदरा, आतिथ्य — सावधानी से शुरुआत' },
    Rahu:   { score:1, en:'Rahu Mahadasha — tech, media, unconventional businesses with research', hi:'राहु महादशा — तकनीक, मीडिया — सोच-समझकर करें' },
    Saturn: { score:0, en:'Saturn Mahadasha — slow, disciplined building; delay big launches to mid-period', hi:'शनि महादशा — धीमा निर्माण; बड़ा प्रारंभ मध्य काल के बाद' },
    Ketu:   { score:0, en:'Ketu Mahadasha — spiritual and introspective; not ideal for business launches', hi:'केतु महादशा — आध्यात्मिक समय; व्यापार शुरुआत के लिए आदर्श नहीं' },
  };

  const mi = MAHA_BIZ[maha]  || { score:1, en:'Neutral period', hi:'सामान्य काल' };
  const ai = MAHA_BIZ[antar] || { score:1, en:'Neutral sub-period', hi:'सामान्य अंतर्दशा' };
  const composite = (mi.score + ai.score) / 2;
  const jupFav = Boolean(chart.gochar?.highlights?.jupiter_support?.favorable);

  const timing = composite >= 2.5 && jupFav ? 'excellent'
    : composite >= 2   ? 'favorable'
    : composite >= 1   ? 'moderate'
    : 'wait';

  const nextGood = (chart.dasha || []).find((d) => (MAHA_BIZ[d.lord]?.score || 0) >= 2 && !d.is_current);

  const timingLabel = { excellent:'Excellent', favorable:'Favorable', moderate:'Moderate — Start Small', wait:'Wait for Better Period' };
  const timingLabelHi = { excellent:'उत्कृष्ट', favorable:'अनुकूल', moderate:'सामान्य — छोटा शुरू करें', wait:'बेहतर काल की प्रतीक्षा' };

  const description_en = `Business Start Timing: ${timingLabel[timing]}. You are in ${maha} Mahadasha (until ${mahaEnd||'—'}) / ${antar} Antardasha (until ${antarEnd||'—'}). ${mi.en}. ${ai.en} (Antardasha adds its layer). ${jupFav ? 'Transit Jupiter is supportive right now — this is a genuine expansion window.' : 'Transit Jupiter is not in peak support — build foundations now, launch when it turns favorable.'} ${timing==='wait' && nextGood ? `Next favorable period: ${nextGood.lord} Mahadasha from ${nextGood.start||'upcoming'} — use this time to prepare thoroughly.` : ''}`;

  const description_hi = `व्यापार समय: ${timingLabelHi[timing]}। आप ${pname(maha)} महादशा (${mahaEnd||''} तक) में हैं। ${mi.hi}। ${ai.hi}। ${jupFav ? 'गोचर गुरु सहायक — यह विस्तार का समय है।' : 'गोचर गुरु अनुकूल नहीं — तैयारी करें।'} ${timing==='wait' && nextGood ? `अगला अनुकूल काल: ${pname(nextGood.lord)} महादशा से।` : ''}`;

  const advice_en = timing==='excellent'
    ? 'Launch now. Register your business, build MVP, publicize. The planetary window for expansion is open — act decisively.'
    : timing==='favorable'
    ? 'Good time to start. Spend first 3–6 months on foundation, then scale. Avoid over-investment in year one.'
    : timing==='moderate'
    ? 'Start small with minimal capital. Test the market before heavy investment. Do not quit your job yet.'
    : 'Preparation phase — research market, build skills, save capital. Do not launch until the next favorable Mahadasha.';

  const advice_hi = timing==='excellent'
    ? 'अभी शुरू करें। रजिस्ट्रेशन, MVP, प्रचार — यह विस्तार की खिड़की खुली है।'
    : timing==='favorable'
    ? 'पहले 3-6 महीने नींव बनाएं, फिर विस्तार करें। पहले साल अधिक निवेश न करें।'
    : timing==='moderate'
    ? 'न्यूनतम पूंजी से छोटा शुरू करें। अभी नौकरी न छोड़ें।'
    : 'तैयारी करें — बाज़ार अनुसंधान, कौशल निर्माण, बचत। अगले अनुकूल काल में शुरू करें।';

  return {
    timing_verdict: timing, composite_score: +composite.toFixed(1),
    verdict_en: timingLabel[timing], verdict_hi: timingLabelHi[timing],
    current_maha: maha, current_antar: antar,
    maha_rating: mi.score, antar_rating: ai.score,
    maha_reason_en: mi.en, maha_reason_hi: mi.hi,
    antar_reason_en: ai.en, antar_reason_hi: ai.hi,
    jupiter_favorable: jupFav,
    next_good_period_en: nextGood ? `${nextGood.lord} Mahadasha from ${nextGood.start||'upcoming'}` : null,
    next_good_period_hi: nextGood ? `${pname(nextGood.lord)} महादशा से ${nextGood.start||'शीघ्र'}` : null,
    description_en, description_hi, advice_en, advice_hi,
  };
}

// ── 4. Relationships ──────────────────────────────────────────────────────────
function analyzeRelationships(chart) {
  const lagnaRashi = chart.ascendant.rashi_num;
  const lord5 = lordOfHouse(lagnaRashi, 5);
  const lord7 = lordOfHouse(lagnaRashi, 7);
  const s5 = planetScore(chart, lord5);
  const s7 = planetScore(chart, lord7);
  const sv = planetScore(chart, 'Venus');
  const venus = chart.planets?.Venus;
  const venusHouse = planetHouse(chart, 'Venus');
  const mangal = chart.mangal_dosha;
  const fifth  = houseOccupants(chart, 5);
  const seventh = houseOccupants(chart, 7);

  const relScore = (s5 + s7 + sv) / 3;
  const outlook = relScore >= 2 ? 'flourishing' : relScore >= 0 ? 'needs nurturing' : 'needs healing';

  const indicators_en = [], indicators_hi = [];
  if (s5 > 1)  { indicators_en.push(`5th lord ${lord5} is strong — love and romance come naturally`); indicators_hi.push(`5वें भाव के स्वामी ${pname(lord5)} बलवान — प्रेम स्वाभाविक`); }
  if (s7 > 1)  { indicators_en.push(`7th lord ${lord7} is strong — committed partnerships are stable and fulfilling`); indicators_hi.push(`7वें भाव के स्वामी ${pname(lord7)} मजबूत — साझेदारी स्थिर और संतोषजनक`); }
  if (sv > 1)  { indicators_en.push(`Venus in ${venus?.rashi_en||''} — natural charm, beauty, and ease in forming bonds`); indicators_hi.push(`शुक्र बलवान — स्वाभाविक आकर्षण और संबंध बनाने में आसानी`); }
  if (sv < -0.5) { indicators_en.push('Venus is weakened — relationships require more conscious effort and patience'); indicators_hi.push('शुक्र कमज़ोर — संबंधों में अधिक प्रयास और धैर्य आवश्यक'); }
  if (mangal?.has_dosha) { indicators_en.push(`Mangal Dosha (${mangal.severity}) — choose a compatible partner; intense relational energy`); indicators_hi.push(`मंगल दोष (${mangal.severity}) — अनुकूल साथी चुनें; रिश्ते में तीव्र ऊर्जा`); }
  if (fifth.includes('Jupiter'))  { indicators_en.push('Jupiter in 5th — relationships have wisdom and spiritual depth'); indicators_hi.push('5वें भाव में गुरु — रिश्तों में ज्ञान और गहराई'); }
  if (seventh.includes('Saturn')) { indicators_en.push('Saturn in 7th — partnerships mature slowly but prove durable'); indicators_hi.push('7वें भाव में शनि — रिश्ते धीरे परिपक्व पर टिकाऊ'); }
  if (seventh.includes('Rahu'))   { indicators_en.push('Rahu in 7th — unconventional attractions; partner may be from different background'); indicators_hi.push('7वें भाव में राहु — अपारंपरिक आकर्षण; भिन्न पृष्ठभूमि का साथी संभव'); }

  const description_en = `Relationship Outlook: ${outlook.toUpperCase()}. Venus in ${venus?.rashi_en||'its sign'} (${ordinal(venusHouse||0)} house) — ${sv > 1 ? 'its strength gifts you natural charm and ease in forming bonds.' : sv < -0.5 ? 'Venus needs strengthening — relationships are karmic tests requiring patience and consistent effort.' : 'moderate Venus brings balanced relationships with both joy and lessons.'} Your 5th lord ${lord5} ${s5 > 0 ? 'supports' : 'challenges'} romance; your 7th lord ${lord7} ${s7 > 0 ? 'supports' : 'challenges'} committed partnerships. ${mangal?.has_dosha ? `Mangal Dosha (${mangal.severity}) is present — matching with a Mangali partner or performing remedies is important.` : 'No significant Mangal Dosha — relationship harmony is accessible.'} Goals: depth over drama, consistent effort over grand gestures, and mutual growth as the foundation.`;

  const description_hi = `संबंध संभावना: ${outlook==='flourishing'?'समृद्ध':outlook==='needs nurturing'?'पोषण की आवश्यकता':'उपचार की आवश्यकता'}। शुक्र ${venus?.rashi_hi||''} में ${sv>1?'बलवान — स्वाभाविक आकर्षण।':sv<-0.5?'कमज़ोर — धैर्य और प्रयास से संबंध सुधरेंगे।':'मध्यम।'} ${mangal?.has_dosha?`मंगल दोष (${mangal.severity}) — मांगलिक साथी या उपाय आवश्यक।`:'प्रमुख मंगल दोष नहीं।'}`;

  const advice_en = mangal?.has_dosha
    ? 'Mangal Dosha priority: Hanuman Chalisa on Tuesdays, donate red lentils, coral gemstone (consult astrologer). Match with a Mangali partner for best compatibility. Avoid impulsive relationship decisions.'
    : sv < 0
    ? 'Strengthen Venus: Friday Lakshmi puja, wear white/cream, donate white sweets to women, practice gratitude in relationships. Express love openly — Venus weakens in emotional repression.'
    : 'Your relationship path is positive. Key guidance: communicate clearly and early, honor your partner\'s individuality, practice Friday puja together, and revisit relationship goals annually.';

  const advice_hi = mangal?.has_dosha
    ? 'मंगल दोष: मंगलवार हनुमान चालीसा, लाल मसूर दाल दान, मूंगा रत्न। मांगलिक साथी को प्राथमिकता दें।'
    : sv < 0
    ? 'शुक्र मजबूत करें: शुक्रवार लक्ष्मी पूजा, सफेद वस्त्र, मिठाई दान। भावनाओं को खुलकर व्यक्त करें।'
    : 'स्पष्ट संवाद रखें। साथी की विशिष्टता का सम्मान करें। शुक्रवार पूजा साथ करें।';

  return {
    outlook, rel_score: +relScore.toFixed(1),
    venus_score: +sv.toFixed(1), fifth_lord_score: +s5.toFixed(1), seventh_lord_score: +s7.toFixed(1),
    venus_house: venusHouse, mangal_dosha: mangal?.has_dosha||false, mangal_severity: mangal?.severity||null,
    verdict_en: outlook==='flourishing'?'Relationships Are Flourishing':outlook==='needs nurturing'?'Relationships Need Nurturing':'Relationships Need Healing',
    verdict_hi: outlook==='flourishing'?'संबंध समृद्ध हैं':outlook==='needs nurturing'?'संबंधों को पोषण चाहिए':'संबंधों को उपचार चाहिए',
    indicators_en, indicators_hi, description_en, description_hi, advice_en, advice_hi,
  };
}

// ── 5. Marriage ────────────────────────────────────────────────────────────────
function analyzeMarriage(chart) {
  const lagnaRashi = chart.ascendant.rashi_num;
  const { maha, antar, mahaEnd } = currentDasha(chart);
  const lord7 = lordOfHouse(lagnaRashi, 7);
  const s7 = planetScore(chart, lord7);
  const sv = planetScore(chart, 'Venus');
  const venus = chart.planets?.Venus;
  const venusHouse = planetHouse(chart, 'Venus');
  const lord7House = planetHouse(chart, lord7);
  const mangal = chart.mangal_dosha;
  const seventh = houseOccupants(chart, 7);

  const marDashas = ['Venus', 'Jupiter', lord7];
  const isDashActive = marDashas.includes(maha) || marDashas.includes(antar);
  const composite = (s7 + sv) / 2;
  const outlook = composite >= 1.5 && isDashActive ? 'very_favorable'
    : composite >= 0.5 ? 'favorable' : composite >= -0.5 ? 'moderate' : 'needs_remedies';

  const indicators_en = [], indicators_hi = [];
  if (s7 > 1)  { indicators_en.push(`7th lord ${lord7} is well-placed — strong marriage promise`); indicators_hi.push(`7वें भाव के स्वामी ${pname(lord7)} बलवान — विवाह का वचन मजबूत`); }
  if (s7 < -0.5) { indicators_en.push(`7th lord ${lord7} is afflicted — marriage may be delayed; evaluate carefully`); indicators_hi.push(`7वें भाव के स्वामी कमज़ोर — विवाह में देरी या सावधानी की ज़रूरत`); }
  if (sv > 1)  { indicators_en.push('Venus is strong — marital happiness is supported'); indicators_hi.push('शुक्र बलवान — वैवाहिक सुख का संकेत'); }
  if (sv < -0.5) { indicators_en.push('Venus is weakened — marital friction possible; work on communication'); indicators_hi.push('शुक्र कमज़ोर — वैवाहिक तनाव संभव; संवाद पर काम करें'); }
  seventh.forEach((p) => {
    const tip = p==='Jupiter'?'wisdom/spiritual depth':p==='Saturn'?'delayed but durable marriage':p==='Rahu'?'unconventional partner possible':p==='Venus'?'charm and beauty in partner':p==='Mars'?'passionate but assertive partner':'';
    if (tip) { indicators_en.push(`${p} in 7th house — ${tip}`); indicators_hi.push(`7वें भाव में ${pname(p)}`); }
  });
  if (isDashActive) { indicators_en.push(`Current ${maha}/${antar} Dasha activates marriage potential`); indicators_hi.push(`${pname(maha)}/${pname(antar)} दशा विवाह की संभावना सक्रिय`); }

  const description_en = `Marriage Outlook: ${outlook.replace('_',' ').toUpperCase()}. Your 7th house (marriage) is governed by ${lord7}, currently in the ${ordinal(lord7House||0)} house. ${s7 > 1 ? `${lord7}'s strong placement promises a good marriage — the partner is likely a steady, positive influence.` : s7 < -0.5 ? `${lord7}'s weakness creates challenges — delay, complications, or karmic learning. Remedies for ${lord7} will help shift this.` : `${lord7}'s moderate position gives a balanced marriage.`} Venus in ${venus?.rashi_en||'its sign'} (${ordinal(venusHouse||0)} house) ${sv > 1 ? 'adds charm and harmony.' : sv < 0 ? 'needs strengthening for better marital happiness.' : 'gives moderate comfort.'} ${isDashActive ? `The current ${maha}-${antar} Dasha period is a key marriage activation window — events related to partnerships are more likely now.` : `A Venus or ${lord7} Dasha in future will be the primary marriage activation window.`} ${mangal?.has_dosha ? `Mangal Dosha (${mangal.severity}) requires a compatibility check before committing.` : ''}`;

  const description_hi = `विवाह संभावना: ${outlook==='very_favorable'?'अत्यंत अनुकूल':outlook==='favorable'?'अनुकूल':outlook==='moderate'?'सामान्य':'उपाय आवश्यक'}। 7वां भाव ${pname(lord7)} द्वारा ${ordinal(lord7House||0)} भाव में। ${isDashActive ? `${pname(maha)}-${pname(antar)} दशा विवाह के लिए महत्वपूर्ण।` : `शुक्र या ${pname(lord7)} दशा में विवाह की अधिक संभावना।`} ${mangal?.has_dosha?`मंगल दोष (${mangal.severity}) — विवाह से पहले कुंडली मिलान अवश्य।`:''}`;

  const advice_en = `1. Always do Kundali Milan before marriage — aim for 24+ gunas. 2. ${mangal?.has_dosha ? 'Mangal Dosha: choose Mangali partner or perform remedies first.' : 'No Mangal Dosha concern — standard matching applies.'} 3. Best dasha windows: Venus, Jupiter, or ${lord7} Mahadasha/Antardasha. 4. ${sv < 0 ? `Strengthen Venus: Friday Lakshmi puja, Shukra mantra.` : 'Friday Lakshmi puja maintains Venus energy for marital harmony.'} 5. Foundation: open communication, mutual respect, and shared spiritual practice outlast any planetary challenge.`;

  const advice_hi = `1. कुंडली मिलान करें — 24+ गुण लक्ष्य। 2. ${mangal?.has_dosha?'मांगलिक साथी या उपाय पहले करें।':'सामान्य मिलान पर्याप्त।'} 3. श्रेष्ठ समय: शुक्र, गुरु या ${pname(lord7)} दशा। 4. शुक्रवार लक्ष्मी पूजा वैवाहिक सुख बनाए रखती है। 5. खुला संवाद और पारस्परिक सम्मान हर ग्रह चुनौती से बड़ा है।`;

  return {
    outlook, composite_score: +composite.toFixed(1),
    seventh_lord: lord7, seventh_lord_score: +s7.toFixed(1),
    venus_score: +sv.toFixed(1), venus_house: venusHouse,
    marriage_dasha_active: isDashActive, mangal_dosha: mangal?.has_dosha||false,
    verdict_en: outlook==='very_favorable'?'Marriage Conditions Very Favorable':outlook==='favorable'?'Marriage Is Supported':outlook==='moderate'?'Marriage Needs Careful Timing':'Marriage Needs Remedies First',
    verdict_hi: outlook==='very_favorable'?'विवाह की स्थिति अत्यंत अनुकूल':outlook==='favorable'?'विवाह के लिए समर्थन है':outlook==='moderate'?'सही समय और सावधानी चाहिए':'पहले उपाय, फिर विवाह',
    indicators_en, indicators_hi, description_en, description_hi, advice_en, advice_hi,
  };
}

// ── 6. Parent Relations ────────────────────────────────────────────────────────
function analyzeParents(chart) {
  const lagnaRashi = chart.ascendant.rashi_num;
  const lord4 = lordOfHouse(lagnaRashi, 4);
  const lord9 = lordOfHouse(lagnaRashi, 9);
  const s4  = planetScore(chart, lord4);
  const s9  = planetScore(chart, lord9);
  const sm  = planetScore(chart, 'Moon');
  const ss  = planetScore(chart, 'Sun');
  const moon = chart.planets?.Moon;
  const sun  = chart.planets?.Sun;
  const moonHouse = planetHouse(chart, 'Moon');
  const sunHouse  = planetHouse(chart, 'Sun');
  const fourth = houseOccupants(chart, 4);
  const ninth  = houseOccupants(chart, 9);

  const motherScore = (s4 + sm) / 2;
  const fatherScore = (s9 + ss) / 2;
  const mOut = motherScore >= 1.5 ? 'strong_bond' : motherScore >= 0 ? 'supportive' : 'needs_healing';
  const fOut = fatherScore >= 1.5 ? 'strong_bond' : fatherScore >= 0 ? 'supportive' : 'needs_healing';

  const mom_en = [], dad_en = [];
  if (sm > 1)  mom_en.push('Moon is strong — deep, nurturing bond with mother');
  if (sm < -0.5) mom_en.push('Moon is afflicted — emotional distance or karmic lessons with mother');
  if (s4 > 1)  mom_en.push(`4th lord ${lord4} well-placed — home environment and mother's support are positive`);
  fourth.forEach((p) => {
    const n = p==='Jupiter'?'mother is a source of wisdom and blessings':p==='Saturn'?'disciplined or distant relationship; respect boundaries':p==='Rahu'?'unconventional home; mother may be strong-willed':'notable planet in 4th house';
    mom_en.push(`${p} in 4th house — ${n}`);
  });

  if (ss > 1)  dad_en.push('Sun is strong — positive, guiding relationship with father');
  if (ss < -0.5) dad_en.push('Sun is weakened — ego clashes or authority tensions with father; self-work resolves this');
  if (s9 > 1)  dad_en.push(`9th lord ${lord9} well-placed — father's guidance and blessings are available`);
  ninth.forEach((p) => {
    const n = p==='Jupiter'?'father is a guru figure — powerful positive influence':p==='Saturn'?'karmic relationship with father; serious lessons':p==='Ketu'?'spiritual or karmic father connection':'notable planet in 9th house';
    dad_en.push(`${p} in 9th house — ${n}`);
  });

  const description_en = `MOTHER: Moon in ${moon?.rashi_en||'its sign'} (${ordinal(moonHouse||0)} house). ${sm>1?'Moon\'s strength indicates a deep, nurturing bond — your mother is a genuine source of emotional support and stability.':sm<-0.5?'Moon\'s affliction suggests emotional distance or unresolved patterns in this relationship. Healing is possible through conscious effort and the right remedies.':'Moon\'s moderate position gives a functional, realistic mother relationship.'} Your 4th lord ${lord4} ${s4>0?'strengthens':'creates challenges in'} the home foundation. FATHER: Sun in ${sun?.rashi_en||'its sign'} (${ordinal(sunHouse||0)} house). ${ss>1?'Sun\'s strength shows paternal pride, guidance, and a supportive relationship with authority.':ss<-0.5?'Sun\'s weakness creates tension with father or authority figures — ego work and honest conversation are the remedy.':'Sun\'s moderate condition gives a balanced, realistic father relationship.'} Your 9th lord ${lord9} ${s9>0?'supports':'challenges'} paternal blessings and fortune.`;

  const description_hi = `माता: चंद्र ${moon?.rashi_hi||''} में ${ordinal(moonHouse||0)} भाव में — ${sm>1?'गहरा, पोषणकारी माता संबंध।':sm<-0.5?'भावनात्मक दूरी या कर्मिक पाठ — उपाय और प्रयास से सुधार।':'सामान्य माता संबंध।'} पिता: सूर्य ${sun?.rashi_hi||''} में — ${ss>1?'सकारात्मक, मार्गदर्शक पिता संबंध।':ss<-0.5?'अहंकार टकराव या अधिकार तनाव — आत्म-कार्य से सुधार।':'संतुलित पिता संबंध।'}`;

  const advice_en = `For mother: ${sm<0?'Chandra mantra on Mondays (Om Som Somaya Namah), offer milk to Shivling, seek mother\'s blessings with humility.':'Regular contact, offer water to Moon on Purnima — mother\'s blessings are a protective shield.'} For father: ${ss<0?'Surya Arghya at sunrise on Sundays, Gayatri mantra, forgive old grievances and seek reconciliation.':'Gayatri mantra daily, seek father\'s blessings regularly — his guidance carries genuine weight.'} Both parents are doorways to ancestral blessings (Pitru and Matru kripa) that shield your entire life path.`;

  const advice_hi = `माता के लिए: ${sm<0?'सोमवार चंद्र मंत्र, शिवलिंग पर दूध, विनम्रता से आशीर्वाद लें।':'नियमित संपर्क, पूर्णिमा पर जल — माता का आशीर्वाद कवच है।'} पिता के लिए: ${ss<0?'रविवार सूर्य अर्घ्य, गायत्री मंत्र, पुराने मनमुटाव को क्षमा करें।':'गायत्री मंत्र रोज, पिता का आशीर्वाद नियमित लें।'} माता-पिता पितृ और मातृ कृपा के द्वार हैं।`;

  return {
    mother: {
      outlook: mOut, score: +motherScore.toFixed(1), indicators_en: mom_en,
      verdict_en: mOut==='strong_bond'?'Strong Maternal Bond':mOut==='supportive'?'Supportive Relationship':'Needs Healing',
      verdict_hi: mOut==='strong_bond'?'माता से मजबूत संबंध':mOut==='supportive'?'सहायक संबंध':'उपचार की आवश्यकता',
    },
    father: {
      outlook: fOut, score: +fatherScore.toFixed(1), indicators_en: dad_en,
      verdict_en: fOut==='strong_bond'?'Strong Paternal Bond':fOut==='supportive'?'Supportive Relationship':'Needs Healing',
      verdict_hi: fOut==='strong_bond'?'पिता से मजबूत संबंध':fOut==='supportive'?'सहायक संबंध':'उपचार की आवश्यकता',
    },
    description_en, description_hi, advice_en, advice_hi,
  };
}

// ── 7. Children ────────────────────────────────────────────────────────────────
function analyzeChildren(chart) {
  const lagnaRashi = chart.ascendant.rashi_num;
  const { maha, antar } = currentDasha(chart);
  const lord5 = lordOfHouse(lagnaRashi, 5);
  const s5 = planetScore(chart, lord5);
  const sj = planetScore(chart, 'Jupiter');
  const jup = chart.planets?.Jupiter;
  const jupHouse = planetHouse(chart, 'Jupiter');
  const fifth = houseOccupants(chart, 5);

  const childDashas = ['Jupiter', lord5, 'Moon'];
  const isDashActive = childDashas.includes(maha) || childDashas.includes(antar);
  const composite = (s5 + sj) / 2;
  const outlook = composite >= 1.5 ? 'very_blessed' : composite >= 0 ? 'positive' : 'needs_attention';

  const indicators_en = [], indicators_hi = [];
  if (sj > 1)  { indicators_en.push(`Jupiter is strong (${ordinal(jupHouse||0)} house) — blessings for children and family expansion`); indicators_hi.push(`गुरु बलवान (${jupHouse||''}वें भाव में) — संतान और परिवार विस्तार का आशीर्वाद`); }
  if (sj < -0.5) { indicators_en.push('Jupiter is weakened — child matters need remedies and patience'); indicators_hi.push('गुरु कमज़ोर — संतान विषय में उपाय और धैर्य'); }
  if (s5 > 1)  { indicators_en.push(`5th lord ${lord5} is well-placed — strong children promise`); indicators_hi.push(`5वें भाव के स्वामी ${pname(lord5)} बलवान — संतान का वचन प्रबल`); }
  fifth.forEach((p) => {
    const n = p==='Jupiter'?'very auspicious — blessings, intelligence, wisdom':p==='Saturn'?'children come with delay; once born, responsible and disciplined':p==='Rahu'?'unconventional timing or circumstances for children':p==='Ketu'?'spiritual/karmic connection with children; fewer children possible':p==='Mars'?'children bring energy and courage':p==='Venus'?'charming, artistic children':'';
    if (n) { indicators_en.push(`${p} in 5th house — ${n}`); indicators_hi.push(`5वें भाव में ${pname(p)}`); }
  });
  if (isDashActive) { indicators_en.push(`Current ${maha}/${antar} Dasha is favorable for child-related events`); indicators_hi.push(`${pname(maha)}/${pname(antar)} दशा संतान विषय के लिए अनुकूल`); }

  const description_en = `Children Outlook: ${outlook.replace('_',' ').toUpperCase()}. Your 5th house (children, creativity) is governed by ${lord5}. ${s5>1?`${lord5} is well-placed — the promise for children is strong.`:s5<-0.5?`${lord5} needs strengthening — perform ${lord5} remedies and consult regarding timing.`:`${lord5} in moderate condition — children are promised with karmic timing.`} Jupiter (natural significator of children) is in ${jup?.rashi_en||'its sign'} (${ordinal(jupHouse||0)} house). ${sj>1?'Jupiter\'s strength is a very positive sign — children\'s blessings are available.':sj<-0.5?'Jupiter\'s weakness needs attention — Thursday Guru puja and Guru mantra will help.':'Jupiter in moderate strength.'} ${isDashActive?`The current ${maha}-${antar} Dasha creates an active window for child-related events — conception, birth, or significant milestones.`:`A Jupiter or 5th lord Dasha will be the primary activation period for children.`}`;

  const description_hi = `संतान संभावना: ${outlook==='very_blessed'?'अत्यंत आशीर्वादित':outlook==='positive'?'शुभ':'ध्यान की आवश्यकता'}। 5वां भाव ${pname(lord5)} द्वारा शासित — ${s5>1?'संतान का वचन प्रबल।':s5<-0.5?'उपाय करें।':'कर्मिक समय से संतान।'} गुरु ${jup?.rashi_hi||''} में ${sj>1?'बलवान — संतान का आशीर्वाद है।':sj<-0.5?'कमज़ोर — गुरुवार पूजा और मंत्र से शक्ति बढ़ाएं।':'मध्यम बल में।'}`;

  const advice_en = `${sj<0?'Strengthen Jupiter: Thursday Vishnu/Guru puja, yellow food donations, Guru mantra (Om Brim Brihaspataye Namah). ':''}${s5<0?`Strengthen 5th lord ${lord5} through relevant planetary remedies. `:''}For child-seeking: Santana Gopala mantra and puja. Avoid stress during pregnancy — peace in the home environment directly benefits the child. Children thrive when parents' relationship is harmonious — invest in your partnership equally.`;

  const advice_hi = `${sj<0?'गुरु को मजबूत करें: गुरुवार विष्णु/गुरु पूजा, पीले भोजन का दान, गुरु मंत्र (ॐ ब्रिम् बृहस्पतये नमः)। ':''}संतान के लिए संतान गोपाल मंत्र और पूजा। गर्भावस्था में शांति रखें — घर का माहौल बच्चे पर सीधा प्रभाव डालता है। माता-पिता का सामंजस्य बच्चों को फलने-फूलने देता है।`;

  return {
    outlook, composite_score: +composite.toFixed(1),
    fifth_lord: lord5, fifth_lord_score: +s5.toFixed(1),
    jupiter_score: +sj.toFixed(1), jupiter_house: jupHouse,
    dasha_active: isDashActive,
    verdict_en: outlook==='very_blessed'?'Strong Blessings for Children':outlook==='positive'?'Positive Child Promise':'Needs Remedies & Patience',
    verdict_hi: outlook==='very_blessed'?'संतान का प्रबल आशीर्वाद':outlook==='positive'?'संतान का शुभ वचन':'उपाय और धैर्य की आवश्यकता',
    indicators_en, indicators_hi, description_en, description_hi, advice_en, advice_hi,
  };
}

// ── 8. Remedies (targeted, cross-analysis) ────────────────────────────────────
function generateLifeGuidanceRemedies(chart, analyses) {
  const { maha } = currentDasha(chart);
  const dm = DASHA_LORD_MEANINGS[maha] || {};
  const remedies = [];

  // Career
  if (analyses.career?.verdict === 'business') {
    remedies.push({ area:'career', area_hi:'करियर', priority:'high', remedy_en:'Strengthen 7th house for business: Friday Lakshmi puja, white flowers. Chant Venus mantra for partnership success.', remedy_hi:'7वें भाव हेतु: शुक्रवार लक्ष्मी पूजा, सफेद फूल। शुक्र मंत्र।' });
    remedies.push({ area:'career', area_hi:'करियर', priority:'medium', remedy_en:'Before any new business: Ganesha puja — Om Gam Ganapataye Namah. Remove obstacles first, then proceed.', remedy_hi:'नया व्यापार: पहले गणेश पूजा — ॐ गं गणपतये नमः।' });
  } else if (analyses.career?.verdict === 'job') {
    remedies.push({ area:'career', area_hi:'करियर', priority:'high', remedy_en:'6th house/Saturn remedy for career: Saturday service to elderly, black sesame oil donation, Shani mantra.', remedy_hi:'6वें भाव/शनि उपाय: शनिवार बुज़ुर्ग सेवा, काले तिल का तेल दान, शनि मंत्र।' });
    remedies.push({ area:'career', area_hi:'करियर', priority:'medium', remedy_en:'For job growth: Surya Arghya at sunrise daily. Respect superiors. Work with integrity and punctuality.', remedy_hi:'उन्नति के लिए: सूर्य अर्घ्य, वरिष्ठों का सम्मान, ईमानदारी।' });
  }

  // Relationships
  if (analyses.relationships?.mangal_dosha) {
    remedies.push({ area:'relationship', area_hi:'संबंध', priority:'high', remedy_en:'Mangal Dosha remedy: Hanuman Chalisa on Tuesdays, donate red lentils, coral gemstone under astrological guidance.', remedy_hi:'मंगल दोष: मंगलवार हनुमान चालीसा, लाल मसूर दान, मूंगा रत्न (ज्योतिषी सलाह से)।' });
  }
  if (analyses.relationships?.venus_score < 0) {
    remedies.push({ area:'relationship', area_hi:'संबंध', priority:'high', remedy_en:'Strengthen Venus: Friday Lakshmi puja, white/cream clothing, donate white sweets to women, Shukra mantra.', remedy_hi:'शुक्र उपाय: शुक्रवार लक्ष्मी पूजा, सफेद कपड़े, महिलाओं को सफेद मिठाई दान।' });
  }

  // Marriage
  if (analyses.marriage?.outlook === 'needs_remedies') {
    remedies.push({ area:'marriage', area_hi:'विवाह', priority:'high', remedy_en:`7th lord ${analyses.marriage?.seventh_lord} remedies needed. Katyayani Devi puja for marriage. Friday Lakshmi puja consistently.`, remedy_hi:`7वें भाव के स्वामी ${pname(analyses.marriage?.seventh_lord)} के उपाय। विवाह के लिए कात्यायनी देवी पूजा।` });
  }

  // Parents
  if (analyses.parents?.mother?.outlook === 'needs_healing') {
    remedies.push({ area:'parents', area_hi:'माता-पिता', priority:'medium', remedy_en:'Mother relation: Chandra mantra on Mondays (Om Som Somaya Namah), offer milk to Shivling, seek her blessings sincerely.', remedy_hi:'माता संबंध: सोमवार चंद्र मंत्र, शिवलिंग पर दूध, विनम्रता से आशीर्वाद।' });
  }
  if (analyses.parents?.father?.outlook === 'needs_healing') {
    remedies.push({ area:'parents', area_hi:'माता-पिता', priority:'medium', remedy_en:'Father relation: Surya Arghya on Sundays, Gayatri mantra daily, release old resentments consciously.', remedy_hi:'पिता संबंध: रविवार सूर्य अर्घ्य, गायत्री मंत्र, पुराने मनमुटाव को क्षमा करें।' });
  }

  // Children
  if (analyses.children?.outlook === 'needs_attention') {
    remedies.push({ area:'children', area_hi:'संतान', priority:'high', remedy_en:'For children: Santana Gopala mantra and puja, Thursday Guru mantra, donate yellow food on Thursdays.', remedy_hi:'संतान के लिए: संतान गोपाल पूजा, गुरुवार गुरु मंत्र, पीले भोजन का दान।' });
  }

  // Dasha remedy
  const dashaRemedy =
    maha==='Sun'     ? 'Surya Arghya at sunrise, Gayatri mantra 108 times, honor father and authority figures.' :
    maha==='Moon'    ? 'Monday Chandra puja, offer water to Moon on Purnima, journaling for emotional clarity.' :
    maha==='Mars'    ? 'Tuesday Hanuman Chalisa, donate red lentils, channel energy into daily physical exercise.' :
    maha==='Mercury' ? 'Wednesday Vishnu Sahasranama, green food donation, meditate on clarity and discernment.' :
    maha==='Jupiter' ? 'Thursday Guru Vandana, yellow food donation, honor teachers and sacred knowledge.' :
    maha==='Venus'   ? 'Friday Lakshmi puja, white flower offering, gratitude practice, conscious beauty in home.' :
    maha==='Saturn'  ? 'Saturday Shani puja, serve elderly/underprivileged, iron discipline in daily routine.' :
    maha==='Rahu'    ? 'Durga mantra, grounding practices — barefoot in nature, question intense new desires.' :
    'Tuesday Ganesha puja, Om Gam Ganapataye Namah, meditation and inner silence.';

  remedies.push({ area:'dasha', area_hi:'दशा', priority:'high', remedy_en:`${maha} Mahadasha remedy: ${dashaRemedy}`, remedy_hi:`${pname(maha)} महादशा उपाय: ${dashaRemedy}` });

  // Universal
  remedies.push({ area:'general', area_hi:'सामान्य', priority:'low', remedy_en:'Daily foundation: 10–15 min meditation or pranayama, fixed sleep schedule, offer water to rising Sun. These amplify all other remedies.', remedy_hi:'दैनिक अभ्यास: 10-15 मिनट ध्यान/प्राणायाम, नियमित नींद, उगते सूर्य को जल। ये सभी उपायों को बढ़ाते हैं।' });

  return remedies;
}

// ── Main Entry Point ──────────────────────────────────────────────────────────
function generateLifeGuidance(chart) {
  if (!chart?.ascendant?.rashi_num || !chart?.planets) return null;
  try {
    const career        = analyzeCareerPath(chart);
    const workLocation  = analyzeWorkLocation(chart);
    const businessTiming = analyzeBusinessTiming(chart);
    const relationships = analyzeRelationships(chart);
    const marriage      = analyzeMarriage(chart);
    const parents       = analyzeParents(chart);
    const children      = analyzeChildren(chart);
    const remedies      = generateLifeGuidanceRemedies(chart, { career, relationships, marriage, parents, children });
    return { career, workLocation, businessTiming, relationships, marriage, parents, children, remedies };
  } catch (e) {
    console.error('[LifeGuidance] Error:', e.message);
    return null;
  }
}

module.exports = { generateLifeGuidance };
