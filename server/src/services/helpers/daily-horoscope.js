'use strict';
const eph = require('../ephemeris.service');
const { siderealLongitudeForPlanet, rashiFromDeg, houseFromSign, isRetrogradePlanet } = require('./core-helpers');
const {
  M_TITLE_I18N, M_GENERAL_I18N, ADVICE_I18N, CAUTION_I18N,
  M_CAREER_I18N, M_LOVE_I18N, M_HEALTH_I18N, M_FINANCE_I18N,
} = require('./daily-horoscope-i18n');
const { SS_NOTE_I18N } = require('./period-horoscope-i18n');

const REGIONAL = ['ta', 'te', 'bn', 'mr', 'pa', 'gu'];

// ── Rashi metadata ────────────────────────────────────────────────────────────
const RASHIS = [
  null, // index 0 unused
  { en:'Aries',       hi:'मेष',      lord:'Mars',    element:'Fire',   quality:'Cardinal', symbol:'♈', color:'#EF4444' },
  { en:'Taurus',      hi:'वृष',      lord:'Venus',   element:'Earth',  quality:'Fixed',    symbol:'♉', color:'#10B981' },
  { en:'Gemini',      hi:'मिथुन',    lord:'Mercury', element:'Air',    quality:'Mutable',  symbol:'♊', color:'#F59E0B' },
  { en:'Cancer',      hi:'कर्क',     lord:'Moon',    element:'Water',  quality:'Cardinal', symbol:'♋', color:'#60A5FA' },
  { en:'Leo',         hi:'सिंह',     lord:'Sun',     element:'Fire',   quality:'Fixed',    symbol:'♌', color:'#FBBF24' },
  { en:'Virgo',       hi:'कन्या',    lord:'Mercury', element:'Earth',  quality:'Mutable',  symbol:'♍', color:'#34D399' },
  { en:'Libra',       hi:'तुला',     lord:'Venus',   element:'Air',    quality:'Cardinal', symbol:'♎', color:'#F472B6' },
  { en:'Scorpio',     hi:'वृश्चिक',  lord:'Mars',    element:'Water',  quality:'Fixed',    symbol:'♏', color:'#A78BFA' },
  { en:'Sagittarius', hi:'धनु',      lord:'Jupiter', element:'Fire',   quality:'Mutable',  symbol:'♐', color:'#F97316' },
  { en:'Capricorn',   hi:'मकर',      lord:'Saturn',  element:'Earth',  quality:'Cardinal', symbol:'♑', color:'#94A3B8' },
  { en:'Aquarius',    hi:'कुम्भ',    lord:'Saturn',  element:'Air',    quality:'Fixed',    symbol:'♒', color:'#818CF8' },
  { en:'Pisces',      hi:'मीन',      lord:'Jupiter', element:'Water',  quality:'Mutable',  symbol:'♓', color:'#22D3EE' },
];

// ── Moon house themes (12 entries — Moon's house from a given rashi) ───────────
const MOON_THEME = {
  1:  { score:0,  title_en:'Personal Focus Day',       title_hi:'व्यक्तिगत ध्यान का दिन',      general_en:'The Moon is transiting your own sign today, creating heightened emotional sensitivity and self-awareness. Your instincts are sharp. Decisions made with emotional clarity now carry long-lasting impact. Avoid reactive behavior — use this sensitivity as a gift, not a burden.', general_hi:'चंद्र आज आपकी राशि में है — भावनात्मक संवेदनशीलता और आत्म-जागरूकता उच्च है। सोच-समझकर निर्णय लें।' },
  2:  { score:1,  title_en:'Financial & Family Day',    title_hi:'धन और परिवार का दिन',          general_en:'The Moon in your 2nd house illuminates finances, family relationships, and the power of your words. This is a good day to review accounts, have honest family conversations, and be mindful of your speech. What you say today echoes far.', general_hi:'द्वितीय भाव में चंद्र — धन, परिवार और वाणी पर ध्यान। आज के शब्द दूर तक गूंजते हैं।' },
  3:  { score:1,  title_en:'Action & Communication Day', title_hi:'साहस और संचार का दिन',        general_en:'The Moon energizes your 3rd house of communication, siblings, short travel, and courage. Your mind is quick, your words effective. Good day for writing, negotiations, social media, and short trips. Take initiative — this is not a day for waiting.', general_hi:'तृतीय भाव में चंद्र — संचार, साहस और छोटी यात्राएं अनुकूल हैं। पहल करने का दिन।' },
  4:  { score:0,  title_en:'Home & Inner Peace Day',    title_hi:'घर और आंतरिक शांति का दिन',    general_en:'The Moon rests in your 4th house — the house of home, mother, roots, and emotional security. Today invites you inward. Domestic matters come to the foreground. Nurture your home environment, spend time with family, and reconnect with what gives you true comfort.', general_hi:'चतुर्थ भाव में चंद्र — घर, माता और आंतरिक शांति। आज घर पर ध्यान दें।' },
  5:  { score:2,  title_en:'Joy, Romance & Creativity', title_hi:'आनंद, प्रेम और रचनात्मकता',     general_en:'The Moon in your 5th house brings joyful, creative, and romantic energy. This is one of the most positive daily Moon placements. Luck is with you in speculation, creative projects, children-related matters, and love. Express yourself — the universe is receptive.', general_hi:'5वें भाव में चंद्र — प्रेम, रचनात्मकता और सौभाग्य। यह सबसे शुभ स्थितियों में से एक है।' },
  6:  { score:-1, title_en:'Work Hard, Watch Health',   title_hi:'परिश्रम और स्वास्थ्य सावधानी',  general_en:'The Moon transits your 6th house of work, health, service, and competition. Productivity is high but emotional energy may feel strained. Guard your health — especially digestion and stress-related issues. Tackle outstanding tasks and clear pending work. Competitors may be active.', general_hi:'6वें भाव में चंद्र — काम में उत्पादकता है पर तनाव संभव। स्वास्थ्य और प्रतिस्पर्धा पर ध्यान दें।' },
  7:  { score:1,  title_en:'Partnership & Social Day',  title_hi:'साझेदारी और सामाजिक दिन',       general_en:'The Moon activates your 7th house of partnerships, relationships, and social agreements. Favorable for marriage-related discussions, business partnerships, and public dealings. Your charm and diplomatic skills are heightened. Cooperation brings better results than solo action today.', general_hi:'7वें भाव में चंद्र — साझेदारी, विवाह और सामाजिक कार्य के लिए अनुकूल।' },
  8:  { score:-2, title_en:'Introspection & Caution',   title_hi:'आत्म-निरीक्षण और सावधानी',      general_en:'The Moon in your 8th house creates a day of depth, transformation, and possible hidden challenges. Avoid major financial decisions, legal agreements, and confrontations. Instead, use this energy for research, meditation, and honest self-reflection. What hidden truths surface today are valuable teachers.', general_hi:'8वें भाव में चंद्र — गहराई, परिवर्तन और संभावित चुनौतियां। बड़े निर्णयों से बचें।' },
  9:  { score:2,  title_en:'Fortune, Travel & Learning', title_hi:'भाग्य, यात्रा और ज्ञान',        general_en:'The Moon blesses your 9th house of fortune, long-distance travel, higher learning, and dharma. This is an auspicious day — luck runs high, spiritual insights come easily, and distant matters proceed favorably. An excellent day for important decisions, learning, travel, and connecting with mentors.', general_hi:'9वें भाव में चंद्र — भाग्य, यात्रा और ज्ञान के लिए शुभ। आज के निर्णय फलदायी होंगे।' },
  10: { score:1,  title_en:'Career & Status Day',       title_hi:'करियर और प्रतिष्ठा का दिन',      general_en:'The Moon illuminates your 10th house of career, status, and public recognition. A good day for professional action, meeting senior people, and advancing career goals. Your actions are visible to the right people. Work with integrity — your reputation is being built today.', general_hi:'10वें भाव में चंद्र — करियर और प्रतिष्ठा के लिए अनुकूल। आज के कार्य दृश्यमान हैं।' },
  11: { score:2,  title_en:'Gains & Social Fulfillment', title_hi:'लाभ और सामाजिक संतुष्टि',       general_en:'The Moon in your 11th house of gains, social networks, and fulfillment makes this an excellent day. Income opportunities arise, friendships deepen, and long-term desires move closer to realization. Engage with your social circle — connections made today carry real value. Wishes tend to materialize.', general_hi:'11वें भाव में चंद्र — लाभ, इच्छापूर्ति और सामाजिक संपर्क के लिए उत्कृष्ट।' },
  12: { score:-1, title_en:'Rest, Retreat & Reflection', title_hi:'विश्राम और आत्म-चिंतन',          general_en:'The Moon enters your 12th house of solitude, spirituality, and the unconscious. This is a day for rest, meditation, and inner work rather than outward action. Expenses may occur. Foreign or distant matters are in focus. Let go of what no longer serves — this is a karmic clearing day.', general_hi:'12वें भाव में चंद्र — विश्राम, आध्यात्मिकता और आत्म-चिंतन। बाहरी कार्यों से अधिक आंतरिक कार्य।' },
};

// ── Section text tables (Moon house) ──────────────────────────────────────────
const MOON_CAREER = {
  1:'Avoid major career decisions today — focus on self-presentation and planning rather than execution.',
  2:'Administrative and financial career tasks go well. A good day for salary discussions.',
  3:'Communication tasks, emails, presentations, and negotiations are highly favored.',
  4:'Work from home if possible. Internal meetings and planning sessions work well.',
  5:'Creative projects shine. Leadership and speculative career moves have good energy.',
  6:'A productive work day — handle pending tasks and difficult colleagues with patience.',
  7:'Client meetings, partnerships, and collaborative projects bring the best results.',
  8:'Avoid launching new projects. Research, audits, and behind-the-scenes work suit this day.',
  9:'Career decisions made today tend to have long-lasting positive impact. Think big.',
  10:'One of the best career days — step forward, be visible, and claim your professional space.',
  11:'Networking and professional social events are highly rewarding. Reach out to key contacts.',
  12:'A quiet work day. Handle routine tasks. Avoid overcommitting.',
};

const MOON_LOVE = {
  1:'Emotional intensity may cause friction in relationships. Communicate feelings gently.',
  2:'Family bonds deepen today. Speak kind words to those you love — they land powerfully.',
  3:'Playful, flirtatious energy — great for casual social interactions and new connections.',
  4:'Romantic comfort is found at home. Domestic harmony strengthens bonds today.',
  5:'Romance is deeply favored. Express love openly — this is one of the best days for relationship nurturing.',
  6:'Relationship stress may surface through work anxiety. Separate professional and personal concerns.',
  7:'Outstanding day for relationships — partnerships of all kinds receive positive energy.',
  8:'Emotional depth in relationships today. Honest, vulnerable conversations create lasting intimacy.',
  9:'Optimism and philosophical connection strengthen bonds. Plan a trip or adventure together.',
  10:'Professional focus may pull attention from relationships. Consciously carve out quality time.',
  11:'Social and friendship energy is high. Group outings and social events are enjoyable.',
  12:'A quiet, private day for love. Intimate, one-on-one connection is more meaningful than social interaction.',
};

const MOON_HEALTH = {
  1:'Emotional health is paramount. Avoid stress triggers. Grounding practices help stabilize energy.',
  2:'Watch your diet today — especially sugar, dairy, and heavy foods. Throat and neck need care.',
  3:'Good physical energy for exercise. Mind may be overactive — brief meditation helps.',
  4:'Rest and domestic comfort support health. Avoid overworking. Heart and chest need care.',
  5:'Strong vitality today — good for vigorous activity. Watch for overindulgence.',
  6:'Monitor digestive health and stress responses. Light, clean meals are best.',
  7:'Kidneys and lower back need care. Balanced hydration and gentle exercise support wellbeing.',
  8:'Low stamina day. Rest adequately. Avoid pushing physical limits. Reproductive health needs care.',
  9:'Good health day overall. Exercise is beneficial. Hips and thighs need gentle attention.',
  10:'Strong physical energy — good for achievement. Watch for stress-related neck or back tension.',
  11:'Good vitality. Social activity invigorates. Circulation and ankles need care.',
  12:'Rest is essential. Feet and lymphatic system need attention. Prioritize sleep tonight.',
};

const MOON_FINANCE = {
  1:'Avoid impulsive financial decisions. This is a day to observe, not transact.',
  2:'Positive day for financial review and family-related expenses. Money matters clarify.',
  3:'Communication-related income is favored — writing, speaking, teaching, or consulting.',
  4:'Property, home, and real estate matters carry good financial energy.',
  5:'Speculative risks may tempt you — approach with measured confidence, not blind optimism.',
  6:'Work-related income is active. Pay pending bills and clear outstanding financial matters.',
  7:'Partnership-based income is favorable. Joint ventures and collaborations show profit potential.',
  8:'Avoid major investments. Insurance, research, and inherited matters may surface.',
  9:'Fortune smiles on larger financial goals. This is a good day to plan long-term wealth.',
  10:'Career-linked income is strong. Promotions, raises, and recognition carry financial weight.',
  11:'Income flows in today — a genuinely good financial day. Gains from multiple sources possible.',
  12:'Watch for unexpected expenses. Avoid gambling or speculative investments.',
};

// ── Planet house modifiers ─────────────────────────────────────────────────────
const JUP_SCORE  = { 1:0.5, 2:1, 3:-0.5, 4:0.5, 5:1.5, 6:-0.5, 7:1, 8:-0.5, 9:1.5, 10:0.5, 11:1.5, 12:-0.5 };
const SAT_SCORE  = { 1:-1, 2:-0.5, 3:0.5, 4:-0.5, 5:-1, 6:0.5, 7:-1, 8:-1.5, 9:-0.5, 10:0.5, 11:0.5, 12:-0.5 };
const MARS_SCORE = { 1:0, 2:-0.5, 3:1, 4:-0.5, 5:0.5, 6:1, 7:-1, 8:-0.5, 9:0.5, 10:1, 11:0.5, 12:-0.5 };
const VEN_SCORE  = { 1:0.5, 2:1, 3:0.5, 4:0.5, 5:1.5, 6:-0.5, 7:1.5, 8:-0.5, 9:0.5, 10:0.5, 11:1, 12:0 };
const SUN_SCORE  = { 1:0.5, 2:0, 3:0.5, 4:-0.5, 5:1, 6:0.5, 7:-0.5, 8:-1, 9:0.5, 10:1, 11:0.5, 12:-0.5 };

// ── Jupiter modifiers for each life area ──────────────────────────────────────
const JUP_CAREER_MOD = {
  1:'Jupiter\'s presence supports self-reliance and independent initiatives.',
  2:'Jupiter blesses financial and administrative career matters.',
  5:'Jupiter expands creative and leadership opportunities.',
  9:'Jupiter\'s 9th house position is exceptionally favorable for career growth and mentorship.',
  10:'Jupiter directly supports career — promotions and recognition are likely.',
  11:'Jupiter in 11th brings income expansion and professional network opportunities.',
};
const SAT_CAREER_MOD = {
  3:'Saturn in 3rd rewards disciplined communication efforts.',
  6:'Saturn in 6th — hard work is well-rewarded in service and competitive environments.',
  10:'Saturn in 10th demands effort but brings lasting career recognition.',
  11:'Saturn in 11th — income comes through steady, consistent effort.',
};
const SAT_CAUTION = {
  1:'Saturn\'s position creates a period of personal pressure — pace yourself.',
  7:'Saturn in 7th adds weight to relationship and partnership decisions — move carefully.',
  8:'Saturn in 8th creates delays and hidden obstacles — patience is essential.',
  12:'Saturn in 12th increases expenses and isolation tendency — stay grounded.',
};
const JUP_BLESS = {
  2:'Jupiter blesses your financial house — wealth-related decisions carry fortune today.',
  5:'Jupiter expands joy, romance, and creative expression today.',
  7:'Jupiter blesses partnerships — relationships prosper under this influence.',
  9:'Jupiter in your 9th is a powerful blessing — fortune, teachers, and long-distance luck are active.',
  11:'Jupiter in 11th is the best income position — gains, social fulfillment, and wish-fulfillment are supported.',
};

// ── Lucky numbers / colors per rashi ──────────────────────────────────────────
const LUCKY = {
  1:  { numbers:[1,9], colors:['Red','Coral'], gemstone:'Red Coral', day:'Tuesday'    },
  2:  { numbers:[2,6], colors:['White','Pink'], gemstone:'Diamond',  day:'Friday'     },
  3:  { numbers:[3,5], colors:['Green','Yellow'], gemstone:'Emerald', day:'Wednesday' },
  4:  { numbers:[4,2], colors:['White','Silver'], gemstone:'Pearl',  day:'Monday'     },
  5:  { numbers:[1,5], colors:['Gold','Orange'], gemstone:'Ruby',    day:'Sunday'     },
  6:  { numbers:[5,3], colors:['Green','Brown'], gemstone:'Emerald', day:'Wednesday'  },
  7:  { numbers:[6,2], colors:['White','Pink'], gemstone:'Diamond',  day:'Friday'     },
  8:  { numbers:[9,3], colors:['Red','Purple'], gemstone:'Red Coral', day:'Tuesday'   },
  9:  { numbers:[3,9], colors:['Yellow','Orange'], gemstone:'Yellow Sapphire', day:'Thursday' },
  10: { numbers:[8,4], colors:['Blue','Black'], gemstone:'Blue Sapphire', day:'Saturday'    },
  11: { numbers:[8,4], colors:['Blue','Violet'], gemstone:'Blue Sapphire', day:'Saturday'   },
  12: { numbers:[3,9], colors:['Yellow','Sea Green'], gemstone:'Yellow Sapphire', day:'Thursday' },
};

// ── Sade Sati phases ──────────────────────────────────────────────────────────
function sadeSatiPhase(satHouseFromRashi) {
  if (satHouseFromRashi === 12) return 'rising';
  if (satHouseFromRashi === 1)  return 'peak';
  if (satHouseFromRashi === 2)  return 'setting';
  return null;
}

// ── Compute today's transits (no natal chart — standalone) ────────────────────
function computeTransitPlanets(atDate = new Date()) {
  const JD = eph.julianDay(
    atDate.getUTCFullYear(), atDate.getUTCMonth() + 1, atDate.getUTCDate(),
    atDate.getUTCHours(), atDate.getUTCMinutes(), 0
  );
  const names = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const planets = {};
  for (const name of names) {
    const lon   = siderealLongitudeForPlanet(name, JD);
    const rashi = rashiFromDeg(lon);
    planets[name] = {
      longitude: +lon.toFixed(4),
      rashi_num: rashi.num, rashi_en: rashi.en, rashi_hi: rashi.hi,
      is_retrograde: isRetrogradePlanet(name, JD),
      degree_in_sign: +(lon % 30).toFixed(2),
    };
  }
  return { JD, planets };
}

// ── Day score for one rashi (1–5) — shared with weekly/monthly engines ───────
function computeDayScore(rashiNum, transitPlanets) {
  const h = (planet) => houseFromSign(rashiNum, transitPlanets[planet].rashi_num);
  const rawScore = 3
    + (MOON_THEME[h('Moon')]?.score || 0)
    + (JUP_SCORE[h('Jupiter')]  || 0)
    + (SAT_SCORE[h('Saturn')]   || 0)
    + (MARS_SCORE[h('Mars')]    || 0) * 0.4
    + (VEN_SCORE[h('Venus')]    || 0) * 0.4
    + (SUN_SCORE[h('Sun')]      || 0) * 0.3;
  return Math.max(1, Math.min(5, Math.round(rawScore)));
}

// ── Generate horoscope for one rashi ─────────────────────────────────────────
function generateRashiHoroscope(rashiNum, transitPlanets, dateStr) {
  const rashi = RASHIS[rashiNum];
  const h = (planet) => houseFromSign(rashiNum, transitPlanets[planet].rashi_num);

  const moonH = h('Moon');
  const jupH  = h('Jupiter');
  const satH  = h('Saturn');
  const sunH  = h('Sun');
  const marsH = h('Mars');
  const venH  = h('Venus');
  const merH  = h('Mercury');
  const rahuH = h('Rahu');

  const score = computeDayScore(rashiNum, transitPlanets);
  const stars = '★'.repeat(score) + '☆'.repeat(5 - score);

  const moonTheme = MOON_THEME[moonH];
  const ssPhase   = sadeSatiPhase(satH);

  // Build career text
  const careerBase = MOON_CAREER[moonH] || '';
  const careerJup  = JUP_CAREER_MOD[jupH]  || '';
  const careerSat  = SAT_CAREER_MOD[satH]  || '';
  const career_en  = [careerBase, careerJup, careerSat].filter(Boolean).join(' ');

  // Build love text
  const love_en = MOON_LOVE[moonH] || '';
  const love_extra = venH === 5 ? ' Venus in your 5th brings special romantic opportunity today.'
    : venH === 7 ? ' Venus energizes your relationship house — partnerships bloom.'
    : venH === 2 ? ' Venus in your 2nd strengthens family bonds and comfort.'
    : '';

  // Build health text
  const health_en = MOON_HEALTH[moonH] || '';
  const health_extra = satH === 1 ? ' Saturn transiting your sign may lower physical vitality — rest adequately.'
    : marsH === 6 ? ' Mars in 6th adds strong physical energy — good for exercise but avoid overexertion.'
    : '';

  // Build finance text
  const finance_en = MOON_FINANCE[moonH] || '';
  const finance_jup = JUP_BLESS[jupH] || '';
  const finance_full = [finance_en, finance_jup].filter(Boolean).join(' ');

  // Overall description
  const satCaution = SAT_CAUTION[satH] || '';
  const description_en = [
    moonTheme.general_en,
    jupH === 9 || jupH === 11 || jupH === 5
      ? `Jupiter in your ${jupH}th house today adds an extra layer of grace — expansion, fortune, and positive growth are supported.`
      : jupH === 6 || jupH === 8 || jupH === 12
      ? `Jupiter in your ${jupH}th house creates some friction with the day\'s natural flow — be patient with delays.`
      : '',
    satCaution,
    ssPhase
      ? `Note: Saturn is in Sade Sati ${ssPhase} phase from your sign — practice discipline and patience as your long-term foundation is being built.`
      : '',
    rahuH === 1
      ? 'Rahu in your sign creates restlessness and intense desires — channel this energy consciously rather than chasing impulsively.'
      : rahuH === 11
      ? 'Rahu in your 11th brings strong ambition for gains — excellent for bold goals but avoid greed.'
      : '',
  ].filter(Boolean).join(' ');

  // Advice and caution
  const advice_en = score >= 4
    ? `Today carries strong positive energy. Act on important matters, pursue opportunities confidently, and trust your instincts. The stars are aligned in your favor.`
    : score === 3
    ? `A balanced day — neither exceptionally favored nor particularly challenging. Steady, consistent effort brings results. Stay centered and avoid unnecessary drama.`
    : `Today calls for caution and patience. Avoid major decisions, focus on routine tasks, and use this day for rest, planning, and inner work. The tide will turn.`;

  const caution_en = satH === 8
    ? 'Avoid large financial commitments and confrontational situations — hidden obstacles are likely today.'
    : moonH === 8
    ? 'Be cautious with hidden information, financial agreements, and emotional confrontations.'
    : ssPhase === 'peak'
    ? 'Sade Sati peak phase — exercise maximum patience and avoid impulsive decisions in all areas.'
    : marsH === 7
    ? 'Mars in 7th can create friction in relationships — choose diplomacy over aggression.'
    : 'General awareness: avoid overcommitting today. Quality over quantity in all endeavors.';

  const lucky = LUCKY[rashiNum] || {};

  // ── Multilingual text maps (en + hi + 6 regional) ──────────────────────────
  const description_hi = moonTheme.general_hi + (satCaution ? ` ${satCaution}` : '') + (ssPhase ? ` साढ़ेसाती (${ssPhase === 'peak' ? 'चरम' : ssPhase === 'rising' ? 'आरोही' : 'अवरोही'}) चल रही है — धैर्य रखें।` : '');

  const title = { en: moonTheme.title_en, hi: moonTheme.title_hi, ...(M_TITLE_I18N[moonH] || {}) };

  const description = { en: description_en, hi: description_hi };
  for (const l of REGIONAL) {
    description[l] = (M_GENERAL_I18N[moonH]?.[l] || description_en)
      + (ssPhase ? (SS_NOTE_I18N[ssPhase]?.[l] || '') : '');
  }

  // Sections: EN keeps the composed text (base + planet modifiers); hi/regional
  // use the per-house tables (fixes the legacy bug where hi carried English).
  const mkSection = (enText, tbl) => {
    const m = { en: enText, hi: tbl[moonH]?.hi || enText };
    for (const l of REGIONAL) m[l] = tbl[moonH]?.[l] || enText;
    return m;
  };
  const careerMap  = mkSection(career_en, M_CAREER_I18N);
  const loveMap    = mkSection(love_en + love_extra, M_LOVE_I18N);
  const healthMap  = mkSection(health_en + health_extra, M_HEALTH_I18N);
  const financeMap = mkSection(finance_full, M_FINANCE_I18N);

  const band = score >= 4 ? 'high' : score === 3 ? 'mid' : 'low';
  const advice = {
    en: advice_en,
    hi: score >= 4 ? 'आज सकारात्मक ऊर्जा है — महत्वपूर्ण कार्य आगे बढ़ाएं।' : score === 3 ? 'संतुलित दिन — नियमित कार्य में स्थिरता रखें।' : 'आज सावधानी और धैर्य का दिन है। बड़े निर्णय टालें।',
    ...(ADVICE_I18N[band] || {}),
  };

  const cautionKey = satH === 8 ? 'sat8' : moonH === 8 ? 'moon8' : ssPhase === 'peak' ? 'sspeak' : marsH === 7 ? 'mars7' : 'general';
  const caution = {
    en: caution_en,
    hi: CAUTION_I18N[cautionKey]?.hi
      || (ssPhase === 'peak' ? 'साढ़ेसाती चरम — अधिकतम धैर्य रखें।' : 'सामान्य सावधानी — अति-प्रतिबद्धता से बचें।'),
  };
  for (const l of REGIONAL) caution[l] = CAUTION_I18N[cautionKey]?.[l] || caution_en;

  return {
    rashi_num:    rashiNum,
    rashi_en:     rashi.en,
    rashi_hi:     rashi.hi,
    lord:         rashi.lord,
    symbol:       rashi.symbol,
    color:        rashi.color,
    element:      rashi.element,
    date:         dateStr,
    score,
    stars,
    title,
    title_en:     moonTheme.title_en,
    title_hi:     moonTheme.title_hi,
    description,
    description_en,
    description_hi,
    career:  careerMap,
    love:    loveMap,
    health:  healthMap,
    finance: financeMap,
    advice,
    caution,
    lucky: {
      numbers:  lucky.numbers  || [1, 3],
      colors:   lucky.colors   || ['Gold', 'White'],
      gemstone: lucky.gemstone || 'Pearl',
      day:      lucky.day      || 'Monday',
    },
    sade_sati: ssPhase ? { active: true, phase: ssPhase } : { active: false },
    planet_positions: {
      moon_house:    moonH,
      jupiter_house: jupH,
      saturn_house:  satH,
      sun_house:     sunH,
      mars_house:    marsH,
      venus_house:   venH,
      mercury_house: merH,
      rahu_house:    rahuH,
    },
  };
}

// ── Main: generate all 12 rashi horoscopes for a date ────────────────────────
function generateDailyHoroscope(atDate = new Date()) {
  try {
    const { planets } = computeTransitPlanets(atDate);
    const year  = atDate.getUTCFullYear();
    const month = String(atDate.getUTCMonth() + 1).padStart(2, '0');
    const day   = String(atDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const rashis = [];
    for (let i = 1; i <= 12; i++) {
      rashis.push(generateRashiHoroscope(i, planets, dateStr));
    }

    return {
      date: dateStr,
      computed_at: new Date().toISOString(),
      moon_sign: { rashi_num: planets.Moon.rashi_num, rashi_en: planets.Moon.rashi_en, rashi_hi: planets.Moon.rashi_hi, degree: planets.Moon.degree_in_sign },
      transit_summary: {
        Sun:     { rashi_num: planets.Sun.rashi_num,     rashi_en: planets.Sun.rashi_en,     rashi_hi: planets.Sun.rashi_hi     },
        Moon:    { rashi_num: planets.Moon.rashi_num,    rashi_en: planets.Moon.rashi_en,    rashi_hi: planets.Moon.rashi_hi    },
        Mars:    { rashi_num: planets.Mars.rashi_num,    rashi_en: planets.Mars.rashi_en,    rashi_hi: planets.Mars.rashi_hi,    is_retrograde: planets.Mars.is_retrograde    },
        Mercury: { rashi_num: planets.Mercury.rashi_num, rashi_en: planets.Mercury.rashi_en, rashi_hi: planets.Mercury.rashi_hi, is_retrograde: planets.Mercury.is_retrograde },
        Jupiter: { rashi_num: planets.Jupiter.rashi_num, rashi_en: planets.Jupiter.rashi_en, rashi_hi: planets.Jupiter.rashi_hi, is_retrograde: planets.Jupiter.is_retrograde },
        Venus:   { rashi_num: planets.Venus.rashi_num,   rashi_en: planets.Venus.rashi_en,   rashi_hi: planets.Venus.rashi_hi,   is_retrograde: planets.Venus.is_retrograde   },
        Saturn:  { rashi_num: planets.Saturn.rashi_num,  rashi_en: planets.Saturn.rashi_en,  rashi_hi: planets.Saturn.rashi_hi,  is_retrograde: planets.Saturn.is_retrograde  },
        Rahu:    { rashi_num: planets.Rahu.rashi_num,    rashi_en: planets.Rahu.rashi_en,    rashi_hi: planets.Rahu.rashi_hi    },
        Ketu:    { rashi_num: planets.Ketu.rashi_num,    rashi_en: planets.Ketu.rashi_en,    rashi_hi: planets.Ketu.rashi_hi    },
      },
      rashis,
    };
  } catch (e) {
    console.error('[DailyHoroscope] Error:', e.message);
    return null;
  }
}

module.exports = { generateDailyHoroscope, computeTransitPlanets, computeDayScore, RASHIS, LUCKY };
