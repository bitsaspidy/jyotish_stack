'use strict';
const { generateDailyHoroscope } = require('./daily-horoscope');
const { computeFavouriteDays }   = require('./favourite-days');
const { DASHA_LORD_MEANINGS }    = require('./prediction-data');

const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु',
  Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const RASHI_NAMES = [
  null,
  { en:'Aries', hi:'मेष' }, { en:'Taurus', hi:'वृष' }, { en:'Gemini', hi:'मिथुन' },
  { en:'Cancer', hi:'कर्क' }, { en:'Leo', hi:'सिंह' }, { en:'Virgo', hi:'कन्या' },
  { en:'Libra', hi:'तुला' }, { en:'Scorpio', hi:'वृश्चिक' }, { en:'Sagittarius', hi:'धनु' },
  { en:'Capricorn', hi:'मकर' }, { en:'Aquarius', hi:'कुम्भ' }, { en:'Pisces', hi:'मीन' },
];

const NAKSHATRA_NAMES = [
  null,
  { en:'Ashwini', hi:'अश्विनी' }, { en:'Bharani', hi:'भरणी' }, { en:'Krittika', hi:'कृत्तिका' },
  { en:'Rohini', hi:'रोहिणी' }, { en:'Mrigashira', hi:'मृगशिरा' }, { en:'Ardra', hi:'आर्द्रा' },
  { en:'Punarvasu', hi:'पुनर्वसु' }, { en:'Pushya', hi:'पुष्य' }, { en:'Ashlesha', hi:'आश्लेषा' },
  { en:'Magha', hi:'मघा' }, { en:'Purva Phalguni', hi:'पूर्व फाल्गुनी' }, { en:'Uttara Phalguni', hi:'उत्तर फाल्गुनी' },
  { en:'Hasta', hi:'हस्त' }, { en:'Chitra', hi:'चित्रा' }, { en:'Swati', hi:'स्वाति' },
  { en:'Vishakha', hi:'विशाखा' }, { en:'Anuradha', hi:'अनुराधा' }, { en:'Jyeshtha', hi:'ज्येष्ठा' },
  { en:'Mula', hi:'मूल' }, { en:'Purva Ashadha', hi:'पूर्व आषाढ़' }, { en:'Uttara Ashadha', hi:'उत्तर आषाढ़' },
  { en:'Shravana', hi:'श्रवण' }, { en:'Dhanishtha', hi:'धनिष्ठा' }, { en:'Shatabhisha', hi:'शतभिषा' },
  { en:'Purva Bhadrapada', hi:'पूर्व भाद्रपद' }, { en:'Uttara Bhadrapada', hi:'उत्तर भाद्रपद' }, { en:'Revati', hi:'रेवती' },
];

// Tara: 9-star cycle counted from natal Moon nakshatra
const TARA = [
  { name:'Janma',        hi:'जन्म',      good:null,  en:'Today\'s Moon is in your Janma (birth) nakshatra — a day of heightened sensitivity and personal focus. Tune inward; decisions feel amplified.', hi_note:'आज चंद्र आपके जन्म नक्षत्र में — संवेदनशीलता और आत्म-ध्यान।' },
  { name:'Sampat',       hi:'संपत्',     good:true,  en:'Moon is in your Sampat (wealth) nakshatra — auspicious for financial decisions, new income sources, and abundance-building activities.', hi_note:'चंद्र संपत् नक्षत्र में — धन, आय और समृद्धि के लिए शुभ।' },
  { name:'Vipat',        hi:'विपत्',     good:false, en:'Moon is in your Vipat (danger) nakshatra — exercise caution today. Avoid risky ventures, confrontations, and major commitments.', hi_note:'चंद्र विपत् नक्षत्र में — जोखिम और विवाद से बचें।' },
  { name:'Kshema',       hi:'क्षेम',     good:true,  en:'Moon is in your Kshema (wellbeing) nakshatra — a stable, positive day. Proceed confidently; the energy strongly supports success.', hi_note:'चंद्र क्षेम नक्षत्र में — स्थिर, शुभ दिन।' },
  { name:'Pratyak',      hi:'प्रत्यक्', good:false, en:'Moon is in your Pratyak (obstacle) nakshatra — obstacles may surface. Persist patiently rather than forcing outcomes today.', hi_note:'चंद्र प्रत्यक् नक्षत्र में — बाधाएं हो सकती हैं; धैर्य रखें।' },
  { name:'Sadhana',      hi:'साधना',     good:true,  en:'Moon is in your Sadhana (achievement) nakshatra — excellent for focused effort, spiritual practice, and disciplined goal pursuit.', hi_note:'चंद्र साधना नक्षत्र में — अनुशासित प्रयास और साधना उत्तम।' },
  { name:'Naidhana',     hi:'नैधान',     good:false, en:'Moon is in your Naidhana (challenging) nakshatra — avoid confrontations, risky travel, and major commitments. Focus on inner completion.', hi_note:'चंद्र नैधान नक्षत्र में — संघर्ष और जोखिम से बचें।' },
  { name:'Mitra',        hi:'मित्र',     good:true,  en:'Moon is in your Mitra (friend) nakshatra — a supportive day for relationships, social connections, and cooperative ventures.', hi_note:'चंद्र मित्र नक्षत्र में — सामाजिक संबंध और सहयोग शुभ।' },
  { name:'Parama Mitra', hi:'परम मित्र', good:true,  en:'Moon is in your Parama Mitra (supreme friend) nakshatra — the most auspicious placement for you today. Act boldly on important matters.', hi_note:'चंद्र परम मित्र नक्षत्र में — आपके लिए अत्यंत शुभ; महत्वपूर्ण कार्य करें।' },
];

const JUP_FROM_LAGNA = {
  1:  { en:'Jupiter transits your Lagna — a year of personal growth, wisdom, and a fresh life chapter. Your overall energy and fortune are naturally elevated.', hi:'गुरु लग्न में — व्यक्तिगत विकास, ज्ञान और नई जीवन शुरुआत।', tone:'positive' },
  2:  { en:'Jupiter in your 2nd house blesses family, speech, and finances. Wealth opportunities are present; family harmony improves.', hi:'गुरु द्वितीय भाव — धन, परिवार और वाणी पर कृपा।', tone:'positive' },
  3:  { en:'Jupiter in 3rd brings learning opportunities, beneficial travel, and strengthened communication abilities.', hi:'गुरु तृतीय भाव — यात्रा, शिक्षा और संचार में शुभता।', tone:'positive' },
  4:  { en:'Jupiter blesses your home, mother\'s wellbeing, and property. Domestic peace and real estate gains are possible.', hi:'गुरु चतुर्थ भाव — घर, माता और संपत्ति पर कृपा।', tone:'positive' },
  5:  { en:'Jupiter in your 5th house is exceptional — intellect, children, creativity, and romance receive powerful blessings.', hi:'गुरु पंचम भाव — बुद्धि, संतान, रचनात्मकता पर अत्यंत शुभ।', tone:'positive' },
  6:  { en:'Jupiter in 6th reduces debts, defeats enemies, and actively supports health improvement.', hi:'गुरु षष्ठ भाव — ऋण कम, शत्रु पर विजय, स्वास्थ्य लाभ।', tone:'positive' },
  7:  { en:'Jupiter blesses partnerships and marriage. Relationships receive wisdom; business partnerships prosper.', hi:'गुरु सप्तम भाव — विवाह और साझेदारी पर कृपा।', tone:'positive' },
  8:  { en:'Jupiter in 8th brings hidden wisdom, longevity, and spiritual transformation. Research and inheritance matters benefit.', hi:'गुरु अष्टम भाव — आयु, गुप्त ज्ञान और आध्यात्मिक परिवर्तन।', tone:'neutral' },
  9:  { en:'Jupiter in your 9th — its most powerful position — brings immense fortune, guru blessings, and profound spiritual growth.', hi:'गुरु नवम भाव — अत्यंत शुभ — भाग्य, गुरु और आध्यात्मिक उन्नति।', tone:'positive' },
  10: { en:'Jupiter in 10th directly elevates career, recognition, and professional prestige. Promotions and public gains are supported.', hi:'गुरु दशम भाव — करियर, मान और पद में वृद्धि।', tone:'positive' },
  11: { en:'Jupiter in your 11th — one of its best positions — income grows, social aspirations are fulfilled, and gains multiply.', hi:'गुरु एकादश भाव — आय, इच्छापूर्ति पर अत्यंत शुभ।', tone:'positive' },
  12: { en:'Jupiter in 12th supports spiritual liberation, foreign opportunities, and behind-the-scenes blessings.', hi:'गुरु द्वादश भाव — विदेश, मोक्ष और आध्यात्मिक साधना।', tone:'neutral' },
};

const SAT_FROM_LAGNA = {
  1:  { en:'Saturn transits your Lagna — a character-forging period. Steady, disciplined effort is being divinely rewarded, though the pace is slow and deliberate.', hi:'शनि लग्न में — अनुशासन और धैर्य से चरित्र निर्माण।', tone:'challenging' },
  2:  { en:'Saturn in 2nd demands financial discipline and careful speech. Protect family harmony; avoid unnecessary expenditures.', hi:'शनि द्वितीय भाव — वित्तीय अनुशासन और परिवार की सुरक्षा।', tone:'challenging' },
  3:  { en:'Saturn in 3rd rewards persistent, disciplined effort. Structured communication and professional writing yield significant results.', hi:'शनि तृतीय भाव — अनुशासित संचार और परिश्रम से सफलता।', tone:'positive' },
  4:  { en:'Saturn in 4th brings tests to domestic stability. Home and property require careful, patient management.', hi:'शनि चतुर्थ भाव — गृह स्थिरता में सावधानी।', tone:'challenging' },
  5:  { en:'Saturn in 5th requires sustained effort in education and creative work. Avoid speculation; long-term projects are well-supported.', hi:'शनि पंचम भाव — शिक्षा और रचनात्मक कार्यों में निरंतर प्रयास।', tone:'challenging' },
  6:  { en:'Saturn in 6th is one of its best transit positions — enemies are defeated and disciplined service-work is richly rewarded.', hi:'शनि षष्ठ भाव — शत्रु पर विजय और सेवा में पुरस्कार।', tone:'positive' },
  7:  { en:'Saturn in 7th tests partnerships with the demand for maturity, commitment, and patience.', hi:'शनि सप्तम भाव — विवाह और साझेदारी में धैर्य।', tone:'challenging' },
  8:  { en:'Saturn in 8th is deeply transformative. Avoid risky ventures; focus on long-term security and inner work.', hi:'शनि अष्टम भाव — परिवर्तन; दीर्घकालिक सुरक्षा और धैर्य।', tone:'challenging' },
  9:  { en:'Saturn in 9th brings fortune through disciplined, ethical action. Dharmic consistency is being divinely recorded.', hi:'शनि नवम भाव — नैतिक अनुशासन से भाग्य।', tone:'neutral' },
  10: { en:'Saturn in 10th demands maximum professional effort but is building lasting career recognition and reputation.', hi:'शनि दशम भाव — व्यावसायिक परिश्रम से स्थायी ख्याति।', tone:'positive' },
  11: { en:'Saturn in 11th steadily grows income and social networks. Consistent, disciplined pursuit of goals produces reliable gains.', hi:'शनि एकादश भाव — धैर्य और अनुशासन से आय और नेटवर्क वृद्धि।', tone:'positive' },
  12: { en:'Saturn in 12th (Sade Sati rising) — expenditures rise and isolation may increase. Focused inner work and spiritual practice are powerfully supported.', hi:'शनि द्वादश भाव (साढ़ेसाती आरोही) — आंतरिक और आध्यात्मिक कार्य।', tone:'challenging' },
};

const RAHU_FROM_LAGNA = {
  1:  { en:'Rahu transits your Lagna — ambitious desires and unusual experiences are highly active. Channel this energy into focused, meaningful goals.', hi:'राहु लग्न में — महत्वाकांक्षा; ऊर्जा केंद्रित रखें।', tone:'neutral' },
  2:  { en:'Rahu in 2nd amplifies desire for wealth; unconventional income sources may arise. Guard speech and protect family dynamics carefully.', hi:'राहु द्वितीय भाव — धन की तीव्र इच्छा; वाणी और परिवार में सावधानी।', tone:'neutral' },
  3:  { en:'Rahu in 3rd brings bold communication and sudden opportunities. Media, technology, and digital ventures are strongly favored.', hi:'राहु तृतीय भाव — साहसी संचार, मीडिया और तकनीक में अवसर।', tone:'positive' },
  4:  { en:'Rahu in 4th creates desire for a different home environment or foreign settlement. Ground yourself consciously amid domestic shifts.', hi:'राहु चतुर्थ भाव — घर परिवर्तन या विदेश वास की इच्छा।', tone:'challenging' },
  5:  { en:'Rahu in 5th intensifies ambition for education and speculation. Unconventional creative work can yield significant gains.', hi:'राहु पंचम भाव — शिक्षा और अपरंपरागत रचनात्मक कार्य।', tone:'neutral' },
  6:  { en:'Rahu in 6th is powerful for defeating competition. Technology, healthcare, and foreign-environment service are strongly supported.', hi:'राहु षष्ठ भाव — शत्रुओं पर विजय और विदेशी या तकनीक-आधारित सेवा।', tone:'positive' },
  7:  { en:'Rahu in 7th brings intense, sometimes karmic relationships. Foreign or unconventional business alliances may form compellingly.', hi:'राहु सप्तम भाव — कार्मिक संबंध और विदेशी साझेदारी।', tone:'neutral' },
  8:  { en:'Rahu in 8th intensifies occult and hidden matters. Focus on genuine inner work; avoid reckless decisions today.', hi:'राहु अष्टम भाव — गुप्त मामले; विवेकपूर्ण निर्णय लें।', tone:'challenging' },
  9:  { en:'Rahu in 9th creates unconventional spiritual pursuits. Foreign travel and non-traditional guru connections can prove highly valuable.', hi:'राहु नवम भाव — अपरंपरागत दर्शन, विदेश यात्रा, गुरु संबंध।', tone:'neutral' },
  10: { en:'Rahu in 10th is highly ambitious — sudden career leaps are possible. Technology, media, and foreign career opportunities arise dramatically.', hi:'राहु दशम भाव — करियर में अचानक उछाल; तकनीक और मीडिया।', tone:'positive' },
  11: { en:'Rahu in 11th is excellent for income — ambitious financial goals and unconventional income sources are strongly active.', hi:'राहु एकादश भाव — महत्वाकांक्षी आय और असाधारण लाभ।', tone:'positive' },
  12: { en:'Rahu in 12th pulls toward foreign lands and spiritual depths. Dreams and subconscious patterns are especially active and revealing.', hi:'राहु द्वादश भाव — विदेश, आध्यात्मिकता और अवचेतन।', tone:'neutral' },
};

const MOON_FROM_LAGNA = {
  1:  { en:'Moon transits your Lagna today — your emotional self and public presence are fully aligned. High personal energy and strong instincts: make decisions that feel authentically right.', hi:'चंद्र लग्न में — भावनात्मक स्पष्टता और व्यक्तिगत शक्ति।', tone:'strong' },
  2:  { en:'Moon in your 2nd today — finances, family, and the power of your words come into focus. A good time for money-related or family conversations.', hi:'चंद्र द्वितीय भाव — धन, परिवार और वाणी।', tone:'positive' },
  3:  { en:'Moon in your 3rd today sharpens communication and courage. Write, negotiate, and connect actively — your mind is persuasive and quick.', hi:'चंद्र तृतीय भाव — संचार, साहस और छोटी यात्राएं।', tone:'positive' },
  4:  { en:'Moon in your 4th today brings home and inner emotional security into focus. Rest, nurture, and attend to domestic matters.', hi:'चंद्र चतुर्थ भाव — घर, माता और आंतरिक शांति।', tone:'neutral' },
  5:  { en:'Moon in your 5th today is joyful — creativity, romance, children, and speculation all receive positive lunar energy. Follow your heart.', hi:'चंद्र पंचम भाव — रचनात्मकता, प्रेम और आनंद।', tone:'positive' },
  6:  { en:'Moon in your 6th today — health, service, and workplace matters are high-priority. Productivity is strong; tackle pending tasks and maintain your routine.', hi:'चंद्र षष्ठ भाव — स्वास्थ्य, सेवा और कार्यक्षेत्र।', tone:'neutral' },
  7:  { en:'Moon in your 7th today illuminates relationships and partnerships. Excellent for meetings, key conversations, and joint decisions — social energy is elevated.', hi:'चंद्र सप्तम भाव — विवाह, साझेदारी और सामाजिक संबंध।', tone:'positive' },
  8:  { en:'Moon in your 8th today invites depth and introspection. Avoid forced decisions. Research, meditation, and inner honesty serve you best now.', hi:'चंद्र अष्टम भाव — गहराई और आत्म-निरीक्षण।', tone:'challenging' },
  9:  { en:'Moon in your 9th today is auspicious — fortune, long-distance connections, and guru-related matters are supported. A good day for important decisions.', hi:'चंद्र नवम भाव — भाग्य, यात्रा और ज्ञान।', tone:'positive' },
  10: { en:'Moon in your 10th today spotlights career and public visibility. Visibility is at its peak — act professionally and advance career goals with confidence.', hi:'चंद्र दशम भाव — करियर और प्रतिष्ठा।', tone:'positive' },
  11: { en:'Moon in your 11th today brings social energy, income opportunities, and desire-fulfilment. Reach out to your network and actively pursue financial goals.', hi:'चंद्र एकादश भाव — लाभ, इच्छापूर्ति और सामाजिक संपर्क।', tone:'positive' },
  12: { en:'Moon in your 12th today invites rest, spiritual contemplation, and releasing what no longer serves. Lower outward activity and renew internally.', hi:'चंद्र द्वादश भाव — विश्राम, आध्यात्मिकता और आंतरिक नवीनीकरण।', tone:'challenging' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function _houseFromLagna(lagnaNum, planetRashiNum) {
  return ((planetRashiNum - lagnaNum + 12) % 12) + 1;
}

function _getLagnaNum(chart) {
  if (chart?.ascendant?.rashi_num) return chart.ascendant.rashi_num;
  const p = chart?.planets;
  if (!p) return 1;
  for (const name of ['Sun', 'Moon', 'Mars', 'Jupiter', 'Saturn']) {
    const planet = p[name];
    if (planet?.rashi_num && planet?.house_num) {
      return ((planet.rashi_num - planet.house_num + 12) % 12) + 1;
    }
  }
  return 1;
}

function _buildDashaGuidance(mahaLord, antarLord) {
  if (!mahaLord) return null;
  const m = DASHA_LORD_MEANINGS[mahaLord];
  if (!m) return null;
  const a = antarLord ? DASHA_LORD_MEANINGS[antarLord] : null;
  const antarCareer = a?.career_en?.split('.')[0] || '';
  const mahaHi   = PLANET_HI[mahaLord] || mahaLord;
  const antarHi  = antarLord ? (PLANET_HI[antarLord] || antarLord) : null;
  return {
    maha: mahaLord,
    antar: antarLord || null,
    nature_en: m.nature,
    nature_hi: m.nature_hi || m.nature,
    career_en: m.career_en,
    career_hi: m.career_hi || m.career_en,
    health_en: m.health_en,
    health_hi: m.health_hi || m.health_en,
    finance_en: m.finance_en,
    finance_hi: m.finance_hi || m.finance_en,
    relationships_en: m.relationships_en,
    relationships_hi: m.relationships_hi || m.relationships_en,
    spiritual_en: m.spiritual_en,
    spiritual_hi: m.spiritual_hi || m.spiritual_en,
    opportunities: m.opportunities || [],
    opportunities_hi: m.opportunities_hi || m.opportunities || [],
    cautions: m.cautions || [],
    cautions_hi: m.cautions_hi || m.cautions || [],
    antar_note_en: a
      ? `The ${antarLord} Antardasha currently adds themes of ${a.nature}${antarCareer ? ` — ${antarCareer.toLowerCase()}` : ''}, blending with the overarching ${mahaLord} Mahadasha cycle.`
      : null,
    antar_note_hi: a
      ? `${antarHi} अंतर्दशा अभी ${a.nature_hi || a.nature} के विषयों को जोड़ रही है — ${mahaHi} महादशा के साथ मिलकर।`
      : null,
  };
}

function _buildTransitInsights(transitSummary, lagnaNum) {
  const ts = transitSummary;
  const jupH  = _houseFromLagna(lagnaNum, ts.Jupiter.rashi_num);
  const satH  = _houseFromLagna(lagnaNum, ts.Saturn.rashi_num);
  const rahuH = _houseFromLagna(lagnaNum, ts.Rahu.rashi_num);
  const moonH = _houseFromLagna(lagnaNum, ts.Moon.rashi_num);
  const marsH = _houseFromLagna(lagnaNum, ts.Mars.rashi_num);
  const sunH  = _houseFromLagna(lagnaNum, ts.Sun.rashi_num);
  const venH  = _houseFromLagna(lagnaNum, ts.Venus.rashi_num);
  const merH  = _houseFromLagna(lagnaNum, ts.Mercury.rashi_num);
  const ketuH = ((rahuH + 5) % 12) + 1;

  const jupD  = JUP_FROM_LAGNA[jupH]    || { en:`Jupiter transits your ${jupH}th house.`,  hi:`गुरु ${jupH}वें भाव में।`,  tone:'neutral' };
  const satD  = SAT_FROM_LAGNA[satH]    || { en:`Saturn transits your ${satH}th house.`,  hi:`शनि ${satH}वें भाव में।`,  tone:'neutral' };
  const rahuD = RAHU_FROM_LAGNA[rahuH]  || { en:`Rahu transits your ${rahuH}th house.`,  hi:`राहु ${rahuH}वें भाव में।`, tone:'neutral' };
  const moonD = MOON_FROM_LAGNA[moonH]  || { en:`Moon transits your ${moonH}th house today.`, hi:`चंद्र आज ${moonH}वें भाव में।`, tone:'neutral' };

  const list = [
    { planet:'Moon',    house:moonH,  en:moonD.en,  hi:moonD.hi,  tone:moonD.tone,  icon:'🌙',  is_retrograde:false },
    { planet:'Jupiter', house:jupH,   en:jupD.en,   hi:jupD.hi,   tone:jupD.tone,   icon:'♃',   is_retrograde:ts.Jupiter.is_retrograde },
    { planet:'Saturn',  house:satH,   en:satD.en,   hi:satD.hi,   tone:satD.tone,   icon:'♄',   is_retrograde:ts.Saturn.is_retrograde },
    { planet:'Rahu',    house:rahuH,  en:rahuD.en,  hi:rahuD.hi,  tone:rahuD.tone,  icon:'☊',   is_retrograde:false },
  ];

  return {
    lagna_num: lagnaNum,
    lagna_en: RASHI_NAMES[lagnaNum]?.en || '',
    lagna_hi: RASHI_NAMES[lagnaNum]?.hi || '',
    list,
    house_positions: { sun:sunH, moon:moonH, mars:marsH, mercury:merH, jupiter:jupH, venus:venH, saturn:satH, rahu:rahuH, ketu:ketuH },
  };
}

function _computeTara(natalNakNum, transitNakNum) {
  if (!natalNakNum || !transitNakNum) return null;
  const diff    = (transitNakNum - natalNakNum + 27) % 27;
  const taraIdx = diff % 9;
  const tara    = TARA[taraIdx];
  return {
    natal_nak: natalNakNum,
    transit_nak: transitNakNum,
    diff,
    cycle: Math.floor(diff / 9) + 1,
    idx: taraIdx,
    name: tara.name,
    name_hi: tara.hi,
    is_favorable: tara.good,
    note_en: tara.en,
    note_hi: tara.hi_note,
  };
}

function _activeYogas(chart) {
  const yogas = chart?.yogas_doshas?.yogas;
  if (!Array.isArray(yogas)) return [];
  return yogas
    .filter((y) => y && !y.is_cancelled)
    .slice(0, 6)
    .map((y) => ({ name_en:y.name, name_hi:y.name_hi, strength:y.strength }));
}

function _buildEnrichedAreas(rh, dashaGuidance) {
  const merge = (base, dashaLine) => [base, dashaLine].filter(Boolean).join(' ');
  return {
    career:  {
      en: merge(rh.career?.en,  dashaGuidance?.career_en),
      hi: merge(rh.career?.hi,  dashaGuidance?.career_hi),
      icon:'💼',
    },
    love:    {
      en: merge(rh.love?.en,    dashaGuidance?.relationships_en),
      hi: merge(rh.love?.hi,    dashaGuidance?.relationships_hi),
      icon:'💑',
    },
    health:  {
      en: merge(rh.health?.en,  dashaGuidance?.health_en),
      hi: merge(rh.health?.hi,  dashaGuidance?.health_hi),
      icon:'🌿',
    },
    finance: {
      en: merge(rh.finance?.en, dashaGuidance?.finance_en),
      hi: merge(rh.finance?.hi, dashaGuidance?.finance_hi),
      icon:'💰',
    },
  };
}

function _favDayLines(chart, weekdayIdx) {
  const fd    = computeFavouriteDays(chart);
  const today = fd.by_day?.find((d) => d.day_num === weekdayIdx);
  const favs   = today?.purposes || [];
  const avoids = (fd.purposes || []).filter((p) => p.avoid_day_num === weekdayIdx);
  let en = '', hi = '';
  if (favs.length) {
    en += `As per your chart, today is your favourable day for: ${favs.map((p) => p.purpose_en).join(', ')} — schedule these activities today.`;
    hi += `आपकी कुंडली के अनुसार आज का दिन इनके लिए शुभ है: ${favs.map((p) => p.purpose_hi).join(', ')} — ये कार्य आज करें।`;
  }
  if (avoids.length) {
    en += `${en ? ' ' : ''}Better postponed today: ${avoids.map((p) => p.purpose_en).join(', ')}.`;
    hi += `${hi ? ' ' : ''}आज टालना बेहतर: ${avoids.map((p) => p.purpose_hi).join(', ')}।`;
  }
  return { en, hi, favs, avoids };
}

// ── Main entry — returns a row-shaped object ready to insert into `predictions` ──
function generateTodayPrediction(chart, atDate = new Date()) {
  const moonRashi = chart?.planets?.Moon?.rashi_num;
  if (!moonRashi) return null;

  const daily = generateDailyHoroscope(atDate);
  if (!daily) return null;
  const rh = daily.rashis[moonRashi - 1];

  const lagnaNum = _getLagnaNum(chart);

  const maha  = Array.isArray(chart.dasha) ? chart.dasha.find((d) => d.is_current) || chart.dasha[0] : null;
  const antar = maha?.antardasha?.find((a) => a.is_current) || null;
  const dashaGuidance = _buildDashaGuidance(maha?.lord, antar?.lord);

  const transitData    = _buildTransitInsights(daily.transit_summary, lagnaNum);
  const moonFromLagnaH = transitData.house_positions.moon;
  const moonLagnaText  = MOON_FROM_LAGNA[moonFromLagnaH];

  // Transit Moon nakshatra from longitude
  const moonTotalDeg      = (daily.moon_sign.rashi_num - 1) * 30 + (daily.moon_sign.degree || 0);
  const transitMoonNakNum = Math.min(27, Math.max(1, Math.floor(moonTotalDeg / (360 / 27)) + 1));
  const natalMoonNakNum   = chart?.planets?.Moon?.nakshatra_num;
  const taraData          = _computeTara(natalMoonNakNum, transitMoonNakNum);

  const activeYogas    = _activeYogas(chart);
  const enrichedAreas  = _buildEnrichedAreas(rh, dashaGuidance);
  const favLine        = _favDayLines(chart, atDate.getDay());

  // Content paragraphs (used as preview text)
  const dashaLine_en = dashaGuidance
    ? `You are in ${maha?.lord || ''} Mahadasha${antar?.lord ? ` / ${antar.lord} Antardasha` : ''}. ${dashaGuidance.career_en} ${dashaGuidance.spiritual_en || ''}`
    : '';
  const dashaLine_hi = maha?.lord
    ? `आप ${PLANET_HI[maha.lord]} महादशा${antar?.lord ? ` / ${PLANET_HI[antar.lord]} अंतर्दशा` : ''} में हैं।`
    : '';

  const content_en = [rh.description_en, moonLagnaText?.en, dashaLine_en, favLine.en].filter(Boolean).join('\n\n');
  const content_hi = [rh.description_hi, moonLagnaText?.hi, dashaLine_hi, favLine.hi].filter(Boolean).join('\n\n');

  const dayStart = new Date(atDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(atDate); dayEnd.setHours(23, 59, 59, 999);

  const lagnaName = RASHI_NAMES[lagnaNum];
  return {
    type:        'daily',
    title:       `${rh.title_en} · ${lagnaName?.en || ''} Lagna · ${rh.rashi_en} Moon`,
    content_en,
    content_hi,
    valid_from:  dayStart,
    valid_until: dayEnd,
    meta: {
      date:     rh.date,
      score:    rh.score,
      stars:    rh.stars,
      title_hi: `${rh.title_hi} · ${lagnaName?.hi || ''} लग्न · ${rh.rashi_hi} चंद्र`,
      moon_rashi:  { num: rh.rashi_num, en: rh.rashi_en, hi: rh.rashi_hi, symbol: rh.symbol },
      lagna:       { num: lagnaNum, en: lagnaName?.en || '', hi: lagnaName?.hi || '' },
      dasha:       { maha: maha?.lord || null, antar: antar?.lord || null },
      dasha_guidance: dashaGuidance,
      areas:       enrichedAreas,
      transit:     transitData,
      tara:        taraData,
      moon_nakshatra_today: NAKSHATRA_NAMES[transitMoonNakNum]
        ? { num: transitMoonNakNum, ...NAKSHATRA_NAMES[transitMoonNakNum] } : null,
      natal_moon_nakshatra: natalMoonNakNum && NAKSHATRA_NAMES[natalMoonNakNum]
        ? { num: natalMoonNakNum, ...NAKSHATRA_NAMES[natalMoonNakNum] } : null,
      active_yogas: activeYogas,
      advice:   rh.advice,
      caution:  rh.caution,
      lucky:    rh.lucky,
      sade_sati: rh.sade_sati,
      fav_purposes:   favLine.favs.map((p)  => ({ key: p.key, icon: p.icon, en: p.purpose_en, hi: p.purpose_hi })),
      avoid_purposes: favLine.avoids.map((p) => ({ key: p.key, icon: p.icon, en: p.purpose_en, hi: p.purpose_hi })),
    },
  };
}

module.exports = { generateTodayPrediction };
