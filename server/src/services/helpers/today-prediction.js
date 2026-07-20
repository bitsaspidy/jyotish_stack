'use strict';
const { generateDailyHoroscope } = require('./daily-horoscope');
const { computeFavouriteDays }   = require('./favourite-days');
const { DASHA_LORD_MEANINGS }    = require('./prediction-data');
// Same engine the Kundli Gochar tab uses, so the email and the app agree.
const { generateTransit }        = require('../transit');
const { houseLabel }             = require('../deterministic-qa/house-label');

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
  // `nature` strings end with a full stop ("Soul, authority, father… vitality.").
  // Interpolating them mid-sentence produced "themes of X. — this is a period of…",
  // a full stop followed by a dash. Trim the terminal punctuation first.
  const clean = (s) => String(s || '').trim().replace(/[.।]\s*$/, '');
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
    // No career clause here on purpose. `career_en` is a full sentence, not a noun
    // phrase — slotting it in produced "so this is a period of authority and
    // recognition is where you feel it most". It also belongs to the Career area,
    // and repeating it here is the duplication this file already had once.
    antar_note_en: a
      ? `Within it, the ${antarLord} Antardasha is running — it layers ${clean(a.nature).toLowerCase()} over the broader ${mahaLord} cycle.`
      : null,
    antar_note_hi: a
      ? `इसके भीतर ${antarHi} अंतर्दशा चल रही है — यह ${clean(a.nature_hi || a.nature)} के विषयों को ${mahaHi} महादशा के ऊपर जोड़ती है।`
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

/**
 * Personalise the day's rating, advice and caution.
 *
 * `rh.score` comes from computeDayScore(), which is generic PER RASHI — it is the
 * same number every Sagittarius-Moon reader sees, and it is shared with the public
 * weekly/monthly engines, so it must not be changed there.
 *
 * Tara Bala is PERSONAL: it is measured from the reader's own natal nakshatra. It
 * was computed and displayed prominently next to the stars, but never fed into the
 * rating — so a day could show "🌟 Tara: Pratyak" (an obstacle tara) alongside five
 * stars and "the stars are aligned in your favour". That contradiction is what this
 * fixes: the three inauspicious taras (Vipat, Pratyak, Naidhana) pull the day down
 * and, more importantly, stop it from ever being sold as excellent.
 *
 * The advice text is then rebuilt FROM the personalised score. Leaving the generic
 * advice in place would just move the contradiction rather than remove it.
 */
function _personaliseDay(rh, taraData, transitData, sadeSatiActive) {
  const base = Number(rh.score) || 3;
  let score = base;

  if (taraData) {
    if (taraData.is_favorable === false) score = Math.min(score - 1, 3); // never "excellent"
    else if (taraData.is_favorable === true && score < 5) score += 1;
  }
  score = Math.max(1, Math.min(5, Math.round(score)));

  const advice = score >= 4
    ? {
      en: 'A genuinely good day for you. Move important work forward, ask for what you want, and trust your read on things.',
      hi: 'आज का दिन आपके लिए वास्तव में अच्छा है। ज़रूरी काम आगे बढ़ाएं, जो चाहिए वह माँगें, और अपनी समझ पर भरोसा रखें।',
    }
    : score === 3
      ? {
        en: 'A steady, ordinary day — neither a green light nor a red one. Regular work goes well; save the big commitments for a stronger day.',
        hi: 'एक सामान्य, स्थिर दिन — न पूरी हरी झंडी, न रोक। रोज़मर्रा का काम ठीक चलेगा; बड़े निर्णय किसी मज़बूत दिन के लिए रखें।',
      }
      : {
        en: 'Today asks for patience rather than push. Keep to routine work, avoid new commitments, and let contentious matters wait a day or two.',
        hi: 'आज ज़ोर लगाने से ज़्यादा धैर्य का दिन है। नियमित काम करें, नई ज़िम्मेदारी न लें, और विवाद वाले मामले एक-दो दिन टाल दें।',
      };

  // Caution built from what is ACTUALLY difficult in this chart today, in priority
  // order. The old text was a fixed "avoid overcommitting / quality over quantity",
  // which said nothing and often contradicted the advice block above it.
  const reasons = [];
  if (sadeSatiActive) {
    reasons.push({
      en: 'Sade Sati is running, so progress feels slower than your effort deserves. That is the phase, not a verdict on you — steady beats fast right now.',
      hi: 'साढ़े साती चल रही है, इसलिए मेहनत के अनुपात में प्रगति धीमी लगती है। यह चरण की बात है, आपकी क्षमता की नहीं — अभी तेज़ी से बेहतर है निरंतरता।',
    });
  }
  if (taraData && taraData.is_favorable === false) {
    reasons.push({
      en: `The Moon is in your ${taraData.name} tara today, which tends to put small obstacles in the way. Expect friction on new starts; routine work is unaffected.`,
      hi: `आज चंद्र आपकी ${taraData.name_hi} तारा में है, जो छोटी-छोटी बाधाएं लाती है। नई शुरुआत में अटकाव संभव; नियमित काम पर असर नहीं।`,
    });
  }
  const rough = (transitData?.list || []).filter((t) => t.tone === 'challenging');
  if (rough.length) {
    const names = rough.map((t) => t.planet);
    reasons.push({
      en: `${names.join(' and ')} ${names.length > 1 ? 'are' : 'is'} sitting awkwardly for you at the moment — that is where the day is most likely to test your patience.`,
      hi: `${names.join(' और ')} इस समय आपके लिए असहज स्थिति में ${names.length > 1 ? 'हैं' : 'है'} — दिन की परीक्षा सबसे अधिक यहीं से आ सकती है।`,
    });
  }

  const caution = reasons.length
    ? { en: reasons.map((r) => r.en).join(' '), hi: reasons.map((r) => r.hi).join(' ') }
    : {
      en: 'Nothing in your chart is flagging a warning today. Use the day normally.',
      hi: 'आज आपकी कुंडली में कोई विशेष चेतावनी नहीं है। दिन सामान्य रूप से उपयोग करें।',
    };

  return { score, stars: '★'.repeat(score) + '☆'.repeat(5 - score), advice, caution, base_score: base };
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

  // The main reading (`rh.description_en`) is classical Gochar read FROM THE MOON
  // SIGN (Chandra Lagna). `moonLagnaText` is the Moon's house FROM THE ASCENDANT.
  // These are two different reference frames, so the ascendant line must be
  // labelled — otherwise "transiting your own sign" (from the Moon) and "your
  // 7th" (from the Lagna) read as a contradiction. Skip it entirely when both
  // frames land on the same house (Lagna == Moon sign), where it is a duplicate.
  const moonFromMoonH = _houseFromLagna(moonRashi, daily.moon_sign.rashi_num);
  const showMoonLagna = moonLagnaText && moonFromLagnaH !== moonFromMoonH;
  const moonLagnaLine_en = showMoonLagna ? `From your ascendant (Lagna): ${moonLagnaText.en}` : '';
  const moonLagnaLine_hi = showMoonLagna ? `लग्न से: ${moonLagnaText.hi}` : '';

  // Transit Moon nakshatra from longitude
  const moonTotalDeg      = (daily.moon_sign.rashi_num - 1) * 30 + (daily.moon_sign.degree || 0);
  const transitMoonNakNum = Math.min(27, Math.max(1, Math.floor(moonTotalDeg / (360 / 27)) + 1));
  const natalMoonNakNum   = chart?.planets?.Moon?.nakshatra_num;
  const taraData          = _computeTara(natalMoonNakNum, transitMoonNakNum);

  const activeYogas    = _activeYogas(chart);
  const enrichedAreas  = _buildEnrichedAreas(rh, dashaGuidance);
  const favLine        = _favDayLines(chart, atDate.getDay());

  // Content paragraphs (used as preview text)
  // The body describes the dasha's overall NATURE and names the antardasha. It
  // deliberately does NOT use `career_en` — that text is already merged into the
  // Career life-area below, and using it here printed the identical paragraph
  // twice in one email. Same reason `spiritual_en` is dropped: the areas grid
  // carries the per-area detail, the body carries the frame.
  const dashaLine_en = dashaGuidance
    ? [
      `You are running ${maha?.lord || ''} Mahadasha${antar?.lord ? ` with ${antar.lord} Antardasha` : ''}.`,
      dashaGuidance.nature_en ? `${String(dashaGuidance.nature_en).trim().replace(/[.]\s*$/, '')} — that is the backdrop to everything below.` : '',
      dashaGuidance.antar_note_en || '',
    ].filter(Boolean).join(' ')
    : '';
  // Hindi previously stopped at "आप X महादशा में हैं।" with no interpretation at
  // all, while English got a full paragraph. Same substance in both now.
  const dashaLine_hi = dashaGuidance
    ? [
      `आप ${PLANET_HI[maha?.lord] || maha?.lord || ''} महादशा${antar?.lord ? ` और ${PLANET_HI[antar.lord] || antar.lord} अंतर्दशा` : ''} में चल रहे हैं।`,
      dashaGuidance.nature_hi ? `${String(dashaGuidance.nature_hi).trim().replace(/[।.]\s*$/, '')} — यही नीचे लिखी हर बात की पृष्ठभूमि है।` : '',
      dashaGuidance.antar_note_hi || '',
    ].filter(Boolean).join(' ')
    : '';

  // Personalised rating + matching advice/caution (Tara Bala is personal; rh.score
  // is not). Must be computed after taraData and transitData exist.
  const personal = _personaliseDay(rh, taraData, transitData, !!daily.transit_summary?.highlights?.sade_sati?.active);

  // Today's planetary positions read against THIS chart. Reuses the same engine as
  // the Kundli's Gochar tab so the email and the app cannot disagree: per planet it
  // gives the sign, the house from the Lagna (which life area is lit up) and the
  // house from the Moon (the classical seat that decides favourable vs demanding).
  let planetPositions = null;
  try {
    const t = generateTransit(chart, { lang: 'en', admin: false, now: atDate });
    if (t?.available) {
      planetPositions = {
        date: t.date,
        tone: t.overall?.tone || null,
        tone_label: t.overall?.tone_label || null,
        special: t.special || [],
        list: t.planets.map((p) => ({
          planet: p.planet,
          planet_hi: PLANET_HI[p.planet] || p.planet,
          rashi_en: p.rashi?.en || '',
          rashi_hi: p.rashi?.hi || '',
          house_from_lagna: p.house_from_lagna,
          house_from_moon: p.house_from_moon,
          // Pre-formatted here so the email never builds "9 भाव" by hand — Hindi
          // needs the classical word (नवम भाव), not a digit + भाव.
          house_label_en: houseLabel(p.house_from_lagna, 'en'),
          house_label_hi: houseLabel(p.house_from_lagna, 'hi'),
          favour: p.favour,
          area_en: p.area_label?.en || '',
          area_hi: p.area_label?.hi || '',
          is_retrograde: p.is_retrograde,
        })),
      };
    }
  } catch {
    planetPositions = null; // never let this break the daily email
  }

  const content_en = [rh.description_en, moonLagnaLine_en, dashaLine_en, favLine.en].filter(Boolean).join('\n\n');
  const content_hi = [rh.description_hi, moonLagnaLine_hi, dashaLine_hi, favLine.hi].filter(Boolean).join('\n\n');

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
      // Personalised: rh.score is the generic per-rashi number; this one includes
      // the reader's own Tara Bala. base_score keeps the generic value visible.
      score:    personal.score,
      stars:    personal.stars,
      base_score: personal.base_score,
      title_hi: `${rh.title_hi} · ${lagnaName?.hi || ''} लग्न · ${rh.rashi_hi} चंद्र`,
      moon_rashi:  { num: rh.rashi_num, en: rh.rashi_en, hi: rh.rashi_hi, symbol: rh.symbol },
      lagna:       { num: lagnaNum, en: lagnaName?.en || '', hi: lagnaName?.hi || '' },
      dasha:       { maha: maha?.lord || null, antar: antar?.lord || null },
      dasha_guidance: dashaGuidance,
      areas:       enrichedAreas,
      transit:     transitData,
      planet_positions: planetPositions,
      tara:        taraData,
      moon_nakshatra_today: NAKSHATRA_NAMES[transitMoonNakNum]
        ? { num: transitMoonNakNum, ...NAKSHATRA_NAMES[transitMoonNakNum] } : null,
      natal_moon_nakshatra: natalMoonNakNum && NAKSHATRA_NAMES[natalMoonNakNum]
        ? { num: natalMoonNakNum, ...NAKSHATRA_NAMES[natalMoonNakNum] } : null,
      active_yogas: activeYogas,
      advice:   personal.advice,
      caution:  personal.caution,
      lucky:    rh.lucky,
      sade_sati: rh.sade_sati,
      fav_purposes:   favLine.favs.map((p)  => ({ key: p.key, icon: p.icon, en: p.purpose_en, hi: p.purpose_hi })),
      avoid_purposes: favLine.avoids.map((p) => ({ key: p.key, icon: p.icon, en: p.purpose_en, hi: p.purpose_hi })),
    },
  };
}

module.exports = { generateTodayPrediction };
