'use strict';
const { houseFromSign, nakExtra, inclusiveNakDistance, varnaForRashi, vashyaForRashi, relationScore } = require('./core-helpers');
const { analyzeMangalDosha } = require('./mangal-dosha');

// ── Hindi name maps ───────────────────────────────────────────────────────────
const VARNA_HI  = { Brahmin:'ब्राह्मण', Kshatriya:'क्षत्रिय', Vaishya:'वैश्य', Shudra:'शूद्र' };
const VASHYA_HI = { manava:'मानव', chatushpada:'चतुष्पद', jalachara:'जलचर', vanachara:'वनचर', keeta:'कीट' };
const GANA_HI   = { deva:'देव', manushya:'मनुष्य', rakshasa:'राक्षस' };
const NADI_HI   = { adi:'आदि', madhya:'मध्य', antya:'अंत्य' };

// ── Rajju — nakshatra body-zone map (1-indexed, matching NAKSHATRAS array) ────
const RAJJU_GROUP = new Map([
  [1,'pada'],[9,'pada'],[10,'pada'],[18,'pada'],[19,'pada'],[27,'pada'],
  [2,'kati'],[8,'kati'],[11,'kati'],[17,'kati'],[20,'kati'],[26,'kati'],
  [3,'udara'],[7,'udara'],[12,'udara'],[16,'udara'],[21,'udara'],[25,'udara'],
  [4,'kantha'],[6,'kantha'],[13,'kantha'],[15,'kantha'],[22,'kantha'],[24,'kantha'],
  [5,'sira'],[14,'sira'],[23,'sira'],
]);
const RAJJU_LABEL = {
  pada:   { en:'Pada (Foot)',    hi:'पाद (पैर)' },
  kati:   { en:'Kati (Waist)',   hi:'कटि (कमर)' },
  udara:  { en:'Udara (Stomach)',hi:'उदर (पेट)' },
  kantha: { en:'Kantha (Throat)',hi:'कंठ (गला)' },
  sira:   { en:'Sira (Head)',    hi:'शिरा (सिर)' },
};
const RAJJU_EFFECT = {
  pada:   { en:'Pada Rajju Dosha — hardship on journeys, bodily suffering',                                   hi:'पाद राज्जु दोष — यात्रा में कठिनाई, शारीरिक कष्ट' },
  kati:   { en:'Kati Rajju Dosha — recurring health issues, bodily ailments',                                  hi:'कटि राज्जु दोष — स्वास्थ्य समस्याएं, शारीरिक रोग' },
  udara:  { en:'Udara Rajju Dosha — financial instability, poverty risk',                                      hi:'उदर राज्जु दोष — आर्थिक अस्थिरता, दरिद्रता का भय' },
  kantha: { en:'Kantha Rajju Dosha — risk to husband\'s longevity, untimely widowhood',                       hi:'कंठ राज्जु दोष — पति की आयु पर प्रतिकूल, वैधव्य का भय' },
  sira:   { en:'Sira Rajju Dosha — most severe; widowhood or partner\'s untimely death risk',                 hi:'शिरा राज्जु दोष — सर्वाधिक गंभीर; वैधव्य या साथी की अकाल मृत्यु का भय' },
};

// ── Vedha — nakshatra "piercing" pairs that must not match ────────────────────
// Source: BPHS; covers all 27 nakshatras (23=Dhanishtha has no vedha)
const VEDHA_PAIRS = new Set([
  '1-18','18-1','2-17','17-2','3-16','16-3','4-15','15-4','5-14','14-5',
  '6-13','13-6','7-12','12-7','8-11','11-8','9-10','10-9',
  '19-27','27-19','20-26','26-20','21-25','25-21','22-24','24-22',
]);

function kootStatus(score, max) {
  const pct = score / max;
  if (pct >= 0.75) return { en: 'Excellent', hi: 'उत्तम',    color: '#10B981' };
  if (pct >= 0.5)  return { en: 'Good',      hi: 'शुभ',      color: '#22C55E' };
  if (pct >  0)    return { en: 'Average',   hi: 'सामान्य',  color: '#F59E0B' };
  return                   { en: 'Weak',     hi: 'अशुभ',     color: '#EF4444' };
}

function calculateAshtakoot(boyChart, girlChart) {
  const boyMoon  = boyChart.planets.Moon;
  const girlMoon = girlChart.planets.Moon;
  const boyNak   = boyChart.nakshatra;
  const girlNak  = girlChart.nakshatra;
  const boyExtra  = nakExtra(boyNak.num);
  const girlExtra = nakExtra(girlNak.num);

  // ── 1. Varna (1 pt) ────────────────────────────────────────────
  const boyVarna  = varnaForRashi(boyMoon.rashi_num);
  const girlVarna = varnaForRashi(girlMoon.rashi_num);
  const varna = boyVarna.rank >= girlVarna.rank ? 1 : 0;

  // ── 2. Vashya (2 pts) ──────────────────────────────────────────
  const boyVashya  = vashyaForRashi(boyMoon.rashi_num);
  const girlVashya = vashyaForRashi(girlMoon.rashi_num);
  const vashya = boyVashya === girlVashya ? 2 : 1;

  // ── 3. Tara (3 pts) ────────────────────────────────────────────
  const taraBoyToGirl = inclusiveNakDistance(boyNak.num, girlNak.num) % 9;
  const taraGirlToBoy = inclusiveNakDistance(girlNak.num, boyNak.num) % 9;
  const goodTara = (n) => [0, 2, 4, 6, 8].includes(n);
  const tara = (goodTara(taraBoyToGirl) ? 1.5 : 0) + (goodTara(taraGirlToBoy) ? 1.5 : 0);

  // ── 4. Yoni (4 pts) ────────────────────────────────────────────
  const enemyYoni = new Set(['cat:rat','rat:cat','serpent:mongoose','mongoose:serpent','dog:deer','deer:dog','cow:tiger','tiger:cow','elephant:lion','lion:elephant','horse:buffalo','buffalo:horse']);
  const yoniKey = `${boyExtra.yoni}:${girlExtra.yoni}`;
  const yoni = boyExtra.yoni === girlExtra.yoni ? 4 : enemyYoni.has(yoniKey) ? 0 : 2;

  // ── 5. Graha Maitri (5 pts) ────────────────────────────────────
  const graha = relationScore(boyMoon.rashi_lord, girlMoon.rashi_lord);

  // ── 6. Gana (6 pts) ────────────────────────────────────────────
  let gana = 0;
  const isDevRakshas = [boyExtra.gana, girlExtra.gana].includes('rakshasa') && [boyExtra.gana, girlExtra.gana].includes('deva');
  const hasRakshas   = [boyExtra.gana, girlExtra.gana].includes('rakshasa');
  if (boyExtra.gana === girlExtra.gana) gana = 6;
  else if (isDevRakshas) gana = 0;
  else if (hasRakshas)   gana = 1;
  else                   gana = 5;

  // ── 7. Bhakoot (7 pts) ─────────────────────────────────────────
  const boyToGirlSign = houseFromSign(boyMoon.rashi_num, girlMoon.rashi_num);
  const girlToBoySign = houseFromSign(girlMoon.rashi_num, boyMoon.rashi_num);
  const badBhakootPairs = new Set(['2:12','12:2','5:9','9:5','6:8','8:6']);
  const bhakoot = badBhakootPairs.has(`${boyToGirlSign}:${girlToBoySign}`) ? 0 : 7;

  // ── 8. Nadi (8 pts) ────────────────────────────────────────────
  const nadi = boyExtra.nadi === girlExtra.nadi ? 0 : 8;

  // ── Build kootas with full bilingual detail ─────────────────────
  const kootas = [
    {
      name: 'Varna', name_hi: 'वर्ण', score: varna, max: 1,
      description_en: 'Spiritual level & ego compatibility',
      description_hi: 'आत्मिक स्तर और अहं भाव की अनुकूलता',
      details: `${boyVarna.name} / ${girlVarna.name}`,
      details_hi: `${VARNA_HI[boyVarna.name] || boyVarna.name} / ${VARNA_HI[girlVarna.name] || girlVarna.name}`,
      has_dosha: false,
      status: kootStatus(varna, 1),
      status_en: varna === 1 ? 'Compatible spiritual levels — ego harmony likely' : 'Spiritual rank mismatch — ego conflicts possible',
      status_hi: varna === 1 ? 'आत्मिक स्तर अनुकूल — अहं सामंजस्य संभव' : 'आत्मिक स्तर में अंतर — अहं टकराव संभव',
    },
    {
      name: 'Vashya', name_hi: 'वश्य', score: vashya, max: 2,
      description_en: 'Mutual dominance, attraction & control',
      description_hi: 'आपसी नियंत्रण, आकर्षण और प्रभाव',
      details: `${boyVashya} / ${girlVashya}`,
      details_hi: `${VASHYA_HI[boyVashya] || boyVashya} / ${VASHYA_HI[girlVashya] || girlVashya}`,
      has_dosha: false,
      status: kootStatus(vashya, 2),
      status_en: vashya === 2 ? 'Same vashya type — strong mutual attraction' : 'Different vashya types — some adjustment needed',
      status_hi: vashya === 2 ? 'एक ही वश्य — मजबूत आपसी आकर्षण' : 'भिन्न वश्य — कुछ सामंजस्य की जरूरत',
    },
    {
      name: 'Tara', name_hi: 'तारा', score: tara, max: 3,
      description_en: 'Health & destiny via birth Nakshatra distance',
      description_hi: 'जन्म नक्षत्र दूरी से स्वास्थ्य और भाग्य',
      details: `Tara remainders ${taraBoyToGirl}, ${taraGirlToBoy}`,
      details_hi: `तारा शेष ${taraBoyToGirl}, ${taraGirlToBoy}`,
      has_dosha: false,
      status: kootStatus(tara, 3),
      status_en: tara === 3 ? 'Excellent tara — health & fortune well aligned' : tara === 1.5 ? 'One-sided tara — one partner may benefit more' : 'Unfavourable tara — health compatibility needs attention',
      status_hi: tara === 3 ? 'उत्तम तारा — स्वास्थ्य और भाग्य सुसंगत' : tara === 1.5 ? 'एकतरफा तारा — एक पक्ष को अधिक लाभ' : 'प्रतिकूल तारा — स्वास्थ्य अनुकूलता पर ध्यान दें',
    },
    {
      name: 'Yoni', name_hi: 'योनि', score: yoni, max: 4,
      description_en: 'Physical & intimate compatibility via Nakshatra animal symbol',
      description_hi: 'नक्षत्र पशु प्रतीक से शारीरिक और अंतरंग अनुकूलता',
      details: `${boyExtra.yoni} / ${girlExtra.yoni}`,
      details_hi: `${boyExtra.yoni} / ${girlExtra.yoni}`,
      has_dosha: yoni === 0,
      dosha_name: yoni === 0 ? 'Yoni Vairam' : null,
      dosha_name_hi: yoni === 0 ? 'योनि वैरम (शत्रु योनि)' : null,
      status: kootStatus(yoni, 4),
      status_en: yoni === 4 ? 'Same yoni — deep physical harmony' : yoni === 2 ? 'Neutral yoni — acceptable physical compatibility' : 'Enemy yoni — physical and intimate incompatibility',
      status_hi: yoni === 4 ? 'समान योनि — गहरा शारीरिक सामंजस्य' : yoni === 2 ? 'तटस्थ योनि — स्वीकार्य शारीरिक अनुकूलता' : 'शत्रु योनि — शारीरिक असंगति की संभावना',
    },
    {
      name: 'Graha Maitri', name_hi: 'ग्रह मैत्री', score: graha, max: 5,
      description_en: 'Emotional & intellectual bonding via Moon sign lords',
      description_hi: 'चंद्र राशि स्वामी की मैत्री से भावनात्मक और बौद्धिक संबंध',
      details: `${boyMoon.rashi_lord} / ${girlMoon.rashi_lord}`,
      details_hi: `${boyMoon.rashi_lord} / ${girlMoon.rashi_lord}`,
      has_dosha: false,
      status: kootStatus(graha, 5),
      status_en: graha >= 4 ? 'Strong mental and emotional bond' : graha >= 2 ? 'Moderate emotional compatibility' : 'Mental wavelengths differ — communication effort needed',
      status_hi: graha >= 4 ? 'मजबूत मानसिक और भावनात्मक बंधन' : graha >= 2 ? 'मध्यम भावनात्मक अनुकूलता' : 'मानसिक तरंगदैर्ध्य में अंतर — संवाद प्रयास जरूरी',
    },
    {
      name: 'Gana', name_hi: 'गण', score: gana, max: 6,
      description_en: 'Nature & temperament match (Dev / Manushya / Rakshas)',
      description_hi: 'स्वभाव और व्यक्तित्व की अनुकूलता (देव / मनुष्य / राक्षस)',
      details: `${boyExtra.gana} / ${girlExtra.gana}`,
      details_hi: `${GANA_HI[boyExtra.gana] || boyExtra.gana} / ${GANA_HI[girlExtra.gana] || girlExtra.gana}`,
      has_dosha: isDevRakshas,
      dosha_name: isDevRakshas ? 'Gana Dosha' : null,
      dosha_name_hi: isDevRakshas ? 'गण दोष' : null,
      status: kootStatus(gana, 6),
      status_en: gana === 6 ? 'Same gana — perfect temperament match' : gana === 5 ? 'Compatible ganas — minor temperament differences' : gana === 1 ? 'Rakshas gana present — significant character differences' : 'Gana Dosha (Dev-Rakshas) — serious temperament clash',
      status_hi: gana === 6 ? 'समान गण — स्वभाव में पूर्ण सामंजस्य' : gana === 5 ? 'अनुकूल गण — थोड़ा स्वभाव अंतर' : gana === 1 ? 'राक्षस गण — चरित्र में अंतर' : 'गण दोष (देव-राक्षस) — स्वभाव में गंभीर टकराव',
    },
    {
      name: 'Bhakoot', name_hi: 'भकूट', score: bhakoot, max: 7,
      description_en: 'Emotional, financial & family harmony via Moon sign distance',
      description_hi: 'चंद्र राशि दूरी से भावनात्मक, आर्थिक और पारिवारिक सामंजस्य',
      details: `${boyToGirlSign}/${girlToBoySign}`,
      details_hi: `${boyToGirlSign}/${girlToBoySign} (राशि अनुपात)`,
      has_dosha: bhakoot === 0,
      dosha_name: bhakoot === 0 ? 'Bhakoot Dosha' : null,
      dosha_name_hi: bhakoot === 0 ? 'भकूट दोष' : null,
      status: kootStatus(bhakoot, 7),
      status_en: bhakoot === 7 ? 'No Bhakoot Dosha — emotional and financial harmony' : 'Bhakoot Dosha — financial and emotional stress possible',
      status_hi: bhakoot === 7 ? 'भकूट दोष नहीं — भावनात्मक और आर्थिक सामंजस्य' : 'भकूट दोष — आर्थिक और भावनात्मक तनाव संभव',
    },
    {
      name: 'Nadi', name_hi: 'नाड़ी', score: nadi, max: 8,
      description_en: 'Health, genes & fertility — most important koot (8 pts)',
      description_hi: 'स्वास्थ्य, अनुवांशिकी और संतान — सर्वाधिक महत्वपूर्ण (8 गुण)',
      details: `${boyExtra.nadi} / ${girlExtra.nadi}`,
      details_hi: `${NADI_HI[boyExtra.nadi] || boyExtra.nadi} / ${NADI_HI[girlExtra.nadi] || girlExtra.nadi}`,
      has_dosha: nadi === 0,
      dosha_name: nadi === 0 ? 'Nadi Dosha' : null,
      dosha_name_hi: nadi === 0 ? 'नाड़ी दोष' : null,
      status: kootStatus(nadi, 8),
      status_en: nadi === 8 ? 'Different nadi — healthy progeny and genetic harmony' : 'Nadi Dosha — same nadi indicates health & progeny concerns',
      status_hi: nadi === 8 ? 'भिन्न नाड़ी — स्वस्थ संतान और अनुवांशिक सामंजस्य' : 'नाड़ी दोष — समान नाड़ी से स्वास्थ्य और संतान चिंता',
    },
  ];

  // ── Rajju ─────────────────────────────────────────────────────────────────
  const boyRajju  = RAJJU_GROUP.get(boyNak.num);
  const girlRajju = RAJJU_GROUP.get(girlNak.num);
  const rajjuDosha = !!boyRajju && boyRajju === girlRajju;
  const rajju = {
    name:'Rajju', name_hi:'राज्जु',
    description_en:'Longevity & well-being — nakshatra body-zone compatibility',
    description_hi:'नक्षत्र शरीर क्षेत्र से आयु एवं कल्याण जांच',
    boy_group:    RAJJU_LABEL[boyRajju]?.en  || boyRajju  || '—',
    boy_group_hi: RAJJU_LABEL[boyRajju]?.hi  || boyRajju  || '—',
    girl_group:    RAJJU_LABEL[girlRajju]?.en || girlRajju || '—',
    girl_group_hi: RAJJU_LABEL[girlRajju]?.hi || girlRajju || '—',
    has_dosha: rajjuDosha,
    dosha_name:    rajjuDosha ? `${RAJJU_LABEL[boyRajju]?.en} Rajju Dosha` : null,
    dosha_name_hi: rajjuDosha ? `${RAJJU_LABEL[boyRajju]?.hi} राज्जु दोष`  : null,
    status_en: rajjuDosha
      ? RAJJU_EFFECT[boyRajju]?.en
      : `Compatible zones: ${RAJJU_LABEL[boyRajju]?.en} (boy) + ${RAJJU_LABEL[girlRajju]?.en} (girl) — no Rajju concern`,
    status_hi: rajjuDosha
      ? RAJJU_EFFECT[boyRajju]?.hi
      : `संगत क्षेत्र: ${RAJJU_LABEL[boyRajju]?.hi} (वर) + ${RAJJU_LABEL[girlRajju]?.hi} (वधू) — राज्जु चिंता नहीं`,
  };

  // ── Vedha ─────────────────────────────────────────────────────────────────
  const vedhaKey = `${boyNak.num}-${girlNak.num}`;
  const hasVedha = VEDHA_PAIRS.has(vedhaKey);
  const vedha = {
    name:'Vedha', name_hi:'वेध',
    description_en:'Nakshatra "piercing" incompatibility — BPHS forbidden pairs',
    description_hi:'नक्षत्र वेध — BPHS के अनुसार वर्जित युग्म',
    boy_nak_num:  boyNak.num,
    girl_nak_num: girlNak.num,
    has_dosha: hasVedha,
    dosha_name:    hasVedha ? 'Vedha Dosha' : null,
    dosha_name_hi: hasVedha ? 'वेध दोष'    : null,
    status_en: hasVedha
      ? `Vedha Dosha — ${boyNak.en || 'Nak '+boyNak.num} and ${girlNak.en || 'Nak '+girlNak.num} form a BPHS piercing pair. Adverse effect on mutual prosperity.`
      : `No Vedha — ${boyNak.en || 'Nak '+boyNak.num} and ${girlNak.en || 'Nak '+girlNak.num} are not a piercing pair. Auspicious.`,
    status_hi: hasVedha
      ? `वेध दोष — ${boyNak.hi || 'नक्ष '+boyNak.num} और ${girlNak.hi || 'नक्ष '+girlNak.num} BPHS के अनुसार वेध युग्म हैं। आपसी समृद्धि पर प्रतिकूल।`
      : `वेध नहीं — ${boyNak.hi || 'नक्ष '+boyNak.num} और ${girlNak.hi || 'नक्ष '+girlNak.num} BPHS वेध युग्म नहीं हैं। शुभ संकेत।`,
  };

  const total = +kootas.reduce((sum, k) => sum + k.score, 0).toFixed(2);

  // ── Overall verdict ─────────────────────────────────────────────────────────
  let verdict, verdict_en, verdict_hi;
  if (total >= 32) {
    verdict = 'excellent';
    verdict_en = 'Excellent Match (32–36) — Highly auspicious union';
    verdict_hi = 'उत्तम मिलान (32–36) — अत्यंत शुभ विवाह';
  } else if (total >= 25) {
    verdict = 'good';
    verdict_en = 'Good Match (25–31) — Auspicious, recommended';
    verdict_hi = 'शुभ मिलान (25–31) — शुभ, अनुशंसित';
  } else if (total >= 18) {
    verdict = 'average';
    verdict_en = 'Average Match (18–24) — Acceptable with mutual effort';
    verdict_hi = 'सामान्य मिलान (18–24) — आपसी प्रयास से स्वीकार्य';
  } else {
    verdict = 'caution';
    verdict_en = 'Below 18 — Not recommended without expert consultation';
    verdict_hi = '18 से कम — विशेषज्ञ परामर्श बिना अनुशंसित नहीं';
  }

  // ── Mangal Dosha comparison ─────────────────────────────────────────────────
  const mangal = {
    boy:  boyChart.mangal_dosha  || analyzeMangalDosha(boyChart),
    girl: girlChart.mangal_dosha || analyzeMangalDosha(girlChart),
  };

  // Both Manglik → cancels; same severity → compatible
  const bothManglik = mangal.boy.has_dosha && mangal.girl.has_dosha;
  const mangalCompatible = !mangal.boy.has_dosha && !mangal.girl.has_dosha
    || bothManglik
    || mangal.boy.severity === mangal.girl.severity;

  const mangalNote_en = bothManglik
    ? 'Both partners are Manglik — Dosha is mutually cancelled. Excellent compatibility on this front.'
    : !mangal.boy.has_dosha && !mangal.girl.has_dosha
      ? 'Neither partner has Manglik Dosha — no concern here.'
      : `Mangal mismatch: Boy is ${mangal.boy.manglik_type || 'non-Manglik'}, Girl is ${mangal.girl.manglik_type || 'non-Manglik'}. Expert consultation advised.`;

  const mangalNote_hi = bothManglik
    ? 'दोनों पक्ष मांगलिक हैं — दोष परस्पर शांत होता है। इस दृष्टि से उत्तम।'
    : !mangal.boy.has_dosha && !mangal.girl.has_dosha
      ? 'किसी भी पक्ष को मांगलिक दोष नहीं — कोई चिंता नहीं।'
      : `मंगल असंगति: लड़का ${mangal.boy.manglik_type_hi || 'गैर-मांगलिक'}, लड़की ${mangal.girl.manglik_type_hi || 'गैर-मांगलिक'}। विशेषज्ञ परामर्श लें।`;

  // ── Dosha summary ───────────────────────────────────────────────────────────
  const activeDosha = kootas.filter((k) => k.has_dosha).map((k) => k.name_hi || k.name);

  const summary_en = `Guna score ${total}/36 — ${verdict_en}. ${activeDosha.length ? `Active doshas: ${kootas.filter((k)=>k.has_dosha).map((k)=>k.dosha_name).join(', ')}.` : 'No major koot dosha detected.'} Mangal: ${mangalNote_en}`;
  const summary_hi = `गुण मिलान ${total}/36 — ${verdict_hi}। ${activeDosha.length ? `सक्रिय दोष: ${kootas.filter((k)=>k.has_dosha).map((k)=>k.dosha_name_hi).join(', ')}।` : 'कोई प्रमुख कूट दोष नहीं।'} मंगल: ${mangalNote_hi}`;

  return {
    system: 'Ashtakoot Guna Milan + Rajju-Vedha',
    note: 'Classical BPHS rule-based implementation. Verify against an approved Panchang before life decisions.',
    total, max: 36,
    percentage: +((total / 36) * 100).toFixed(1),
    verdict,
    verdict_en,
    verdict_hi,
    kootas,
    rajju,
    vedha,
    mangal,
    mangal_compatible: mangalCompatible,
    mangal_note_en: mangalNote_en,
    mangal_note_hi: mangalNote_hi,
    active_dosha_count: activeDosha.length,
    summary_en,
    summary_hi,
  };
}

module.exports = { calculateAshtakoot };
