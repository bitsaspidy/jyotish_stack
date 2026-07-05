'use strict';
/**
 * Hindu festival calendar — authoritative per-year dates.
 *
 * Festival dates depend on regional muhurta rules (night/pradosh tithi,
 * adhik-maas month naming) that a purely astronomical scan gets wrong, so the
 * dates here are curated from Drik Panchang (drikpanchang.com) and
 * cross-checked against our Lahiri panchang engine. Each year must be added
 * explicitly; only curated years are served.
 */

// slug → { date 'YYYY-MM-DD' } per year, sourced from Drik Panchang.
const DATES = {
  2026: {
    'makar-sankranti':   '2026-01-14',
    'vasant-panchami':   '2026-01-23',
    'maha-shivratri':    '2026-02-15',
    'holika-dahan':      '2026-03-03',
    'holi':              '2026-03-04',
    'chaitra-navratri':  '2026-03-19',
    'ugadi-gudi-padwa':  '2026-03-19',
    'ram-navami':        '2026-03-26',
    'hanuman-jayanti':   '2026-04-02',
    'akshaya-tritiya':   '2026-04-19',
    'buddha-purnima':    '2026-05-01',
    'vat-savitri':       '2026-05-16',
    'guru-purnima':      '2026-07-29',
    'nag-panchami':      '2026-08-17',
    'raksha-bandhan':    '2026-08-28',
    'janmashtami':       '2026-09-04',
    'ganesh-chaturthi':  '2026-09-14',
    'anant-chaturdashi': '2026-09-25',
    'navratri':          '2026-10-11',
    'durga-ashtami':     '2026-10-19',
    'dussehra':          '2026-10-20',
    'sharad-purnima':    '2026-10-25',
    'karva-chauth':      '2026-10-29',
    'dhanteras':         '2026-11-06',
    'diwali':            '2026-11-08',
    'govardhan-puja':    '2026-11-10',
    'bhai-dooj':         '2026-11-11',
    'chhath-puja':       '2026-11-15',
    'dev-uthani-ekadashi':'2026-11-20',
    'kartik-purnima':    '2026-11-24',
  },
  2027: {
    'makar-sankranti':   '2027-01-15',
    'vasant-panchami':   '2027-02-11',
    'maha-shivratri':    '2027-03-06',
    'holika-dahan':      '2027-03-21',
    'holi':              '2027-03-22',
    'chaitra-navratri':  '2027-04-07',
    'ugadi-gudi-padwa':  '2027-04-07',
    'ram-navami':        '2027-04-15',
    'hanuman-jayanti':   '2027-04-20',
    'akshaya-tritiya':   '2027-05-09',
    'buddha-purnima':    '2027-05-20',
    'vat-savitri':       '2027-06-04',
    'guru-purnima':      '2027-07-18',
    'nag-panchami':      '2027-08-06',
    'raksha-bandhan':    '2027-08-17',
    'janmashtami':       '2027-08-25',
    'ganesh-chaturthi':  '2027-09-04',
    'anant-chaturdashi': '2027-09-14',
    'navratri':          '2027-09-30',
    'durga-ashtami':     '2027-10-07',
    'dussehra':          '2027-10-09',
    'sharad-purnima':    '2027-10-14',
    'karva-chauth':      '2027-10-18',
    'dhanteras':         '2027-10-27',
    'diwali':            '2027-10-29',
    'govardhan-puja':    '2027-10-30',
    'bhai-dooj':         '2027-10-31',
    'chhath-puja':       '2027-11-04',
    'dev-uthani-ekadashi':'2027-11-10',
    'kartik-purnima':    '2027-11-14',
  },
};

// slug → bilingual metadata (order defines display order within a date tie).
const META = {
  'makar-sankranti':   { cat:'harvest',     en:'Makar Sankranti', hi:'मकर संक्रांति', desc_en:'Sun enters Capricorn; harvest festival marking uttarayana.', desc_hi:'सूर्य का मकर राशि में प्रवेश; उत्तरायण एवं फसल पर्व।' },
  'vasant-panchami':   { cat:'devotional',  en:'Vasant Panchami', hi:'वसंत पंचमी', desc_en:'Worship of Goddess Saraswati; onset of spring.', desc_hi:'माँ सरस्वती की पूजा; वसंत का आगमन।' },
  'maha-shivratri':    { cat:'major',       en:'Maha Shivratri', hi:'महाशिवरात्रि', desc_en:'The great night of Lord Shiva — fasting and night-long worship.', desc_hi:'भगवान शिव की महान रात्रि — व्रत एवं जागरण।' },
  'holika-dahan':      { cat:'major',       en:'Holika Dahan', hi:'होलिका दहन', desc_en:'Bonfire on the eve of Holi — victory of good over evil.', desc_hi:'होली की पूर्व संध्या पर होलिका दहन।' },
  'holi':              { cat:'major',       en:'Holi', hi:'होली', desc_en:'The festival of colours celebrating spring and joy.', desc_hi:'रंगों का पर्व — वसंत और आनंद का उत्सव।' },
  'chaitra-navratri':  { cat:'major',       en:'Chaitra Navratri Begins', hi:'चैत्र नवरात्रि आरंभ', desc_en:'Nine nights of Goddess Durga in spring (Chaitra Shukla Pratipada).', desc_hi:'वसंत ऋतु में माँ दुर्गा की नौ रातें (चैत्र शुक्ल प्रतिपदा)।' },
  'ugadi-gudi-padwa':  { cat:'new-year',    en:'Ugadi / Gudi Padwa', hi:'उगादि / गुड़ी पड़वा', desc_en:'Lunar New Year (Chaitra Shukla Pratipada).', desc_hi:'चैत्र शुक्ल प्रतिपदा — नववर्ष।' },
  'ram-navami':        { cat:'devotional',  en:'Ram Navami', hi:'राम नवमी', desc_en:'Birth of Lord Rama (Chaitra Shukla Navami).', desc_hi:'भगवान श्रीराम का जन्मोत्सव।' },
  'hanuman-jayanti':   { cat:'devotional',  en:'Hanuman Jayanti', hi:'हनुमान जयंती', desc_en:'Birth of Lord Hanuman (Chaitra Purnima).', desc_hi:'भगवान हनुमान का जन्मोत्सव।' },
  'akshaya-tritiya':   { cat:'auspicious',  en:'Akshaya Tritiya', hi:'अक्षय तृतीया', desc_en:'Highly auspicious day for new beginnings, gold and charity.', desc_hi:'नए कार्य, स्वर्ण एवं दान का अति शुभ दिन।' },
  'buddha-purnima':    { cat:'devotional',  en:'Buddha Purnima', hi:'बुद्ध पूर्णिमा', desc_en:'Birth of Gautama Buddha (Vaishakha Purnima).', desc_hi:'गौतम बुद्ध का जन्मोत्सव।' },
  'vat-savitri':       { cat:'devotional',  en:'Vat Savitri Vrat', hi:'वट सावित्री व्रत', desc_en:'Married women fast for their husbands\' longevity (Jyeshtha Amavasya).', desc_hi:'सुहागिनें पति की दीर्घायु हेतु व्रत रखती हैं (ज्येष्ठ अमावस्या)।' },
  'guru-purnima':      { cat:'devotional',  en:'Guru Purnima', hi:'गुरु पूर्णिमा', desc_en:'Day to honour one\'s guru (Ashadha Purnima).', desc_hi:'गुरु के सम्मान का दिवस।' },
  'nag-panchami':      { cat:'devotional',  en:'Nag Panchami', hi:'नाग पंचमी', desc_en:'Worship of serpent deities (Shravana Shukla Panchami).', desc_hi:'नाग देवता की पूजा।' },
  'raksha-bandhan':    { cat:'major',       en:'Raksha Bandhan', hi:'रक्षा बंधन', desc_en:'Bond of protection between siblings (Shravana Purnima).', desc_hi:'भाई-बहन के स्नेह का पर्व।' },
  'janmashtami':       { cat:'major',       en:'Krishna Janmashtami', hi:'कृष्ण जन्माष्टमी', desc_en:'Birth of Lord Krishna (Krishna Ashtami).', desc_hi:'भगवान श्रीकृष्ण का जन्मोत्सव।' },
  'ganesh-chaturthi':  { cat:'major',       en:'Ganesh Chaturthi', hi:'गणेश चतुर्थी', desc_en:'Birth of Lord Ganesha (Bhadrapada Shukla Chaturthi).', desc_hi:'भगवान गणेश का जन्मोत्सव।' },
  'anant-chaturdashi': { cat:'devotional',  en:'Anant Chaturdashi', hi:'अनंत चतुर्दशी', desc_en:'Conclusion of Ganeshotsav.', desc_hi:'गणेशोत्सव का समापन।' },
  'navratri':          { cat:'major',       en:'Sharad Navratri Begins', hi:'शारदीय नवरात्रि आरंभ', desc_en:'Nine nights of Goddess Durga (Ashwin Shukla Pratipada).', desc_hi:'माँ दुर्गा की नौ रातें।' },
  'durga-ashtami':     { cat:'devotional',  en:'Durga Ashtami', hi:'दुर्गा अष्टमी', desc_en:'Maha Ashtami — eighth day of Navratri.', desc_hi:'महाअष्टमी — नवरात्रि का आठवाँ दिन।' },
  'dussehra':          { cat:'major',       en:'Dussehra (Vijayadashami)', hi:'दशहरा (विजयादशमी)', desc_en:'Victory of Rama over Ravana.', desc_hi:'राम की रावण पर विजय।' },
  'sharad-purnima':    { cat:'devotional',  en:'Sharad Purnima', hi:'शरद पूर्णिमा', desc_en:'Harvest full moon associated with Lakshmi.', desc_hi:'शरद पूर्णिमा — लक्ष्मी पूजा।' },
  'karva-chauth':      { cat:'devotional',  en:'Karva Chauth', hi:'करवा चौथ', desc_en:'Married women fast from sunrise to moonrise.', desc_hi:'सुहागिनें सूर्योदय से चंद्रोदय तक व्रत रखती हैं।' },
  'dhanteras':         { cat:'major',       en:'Dhanteras', hi:'धनतेरस', desc_en:'First day of Diwali; worship of Dhanvantari.', desc_hi:'दीपावली का पहला दिन; धन्वंतरि पूजा।' },
  'diwali':            { cat:'major',       en:'Diwali (Lakshmi Puja)', hi:'दीपावली (लक्ष्मी पूजा)', desc_en:'The festival of lights; worship of Goddess Lakshmi.', desc_hi:'दीपों का पर्व; माँ लक्ष्मी की पूजा।' },
  'govardhan-puja':    { cat:'devotional',  en:'Govardhan Puja', hi:'गोवर्धन पूजा', desc_en:'Annakut; worship of Govardhan and Krishna.', desc_hi:'अन्नकूट; गोवर्धन पूजा।' },
  'bhai-dooj':         { cat:'major',       en:'Bhai Dooj', hi:'भाई दूज', desc_en:'Sisters pray for their brothers\' wellbeing.', desc_hi:'बहनें भाइयों के कल्याण की कामना करती हैं।' },
  'chhath-puja':       { cat:'devotional',  en:'Chhath Puja', hi:'छठ पूजा', desc_en:'Worship of the Sun God and Chhathi Maiya.', desc_hi:'सूर्य देव एवं छठी मैया की पूजा।' },
  'dev-uthani-ekadashi':{ cat:'auspicious', en:'Dev Uthani Ekadashi', hi:'देव उठनी एकादशी', desc_en:'Vishnu awakens; wedding season begins.', desc_hi:'विष्णु जागरण; विवाह मुहूर्त आरंभ।' },
  'kartik-purnima':    { cat:'devotional',  en:'Kartik Purnima', hi:'कार्तिक पूर्णिमा', desc_en:'Dev Deepawali; sacred bathing and lamp offerings.', desc_hi:'देव दीपावली; पवित्र स्नान एवं दीपदान।' },
};

const CATEGORY_META = {
  major:      { en:'Major Festival', hi:'प्रमुख पर्व', color:'#D4AF37' },
  devotional: { en:'Devotional',     hi:'धार्मिक',     color:'#A78BFA' },
  auspicious: { en:'Auspicious Day', hi:'शुभ दिन',     color:'#22C55E' },
  harvest:    { en:'Harvest',        hi:'फसल पर्व',    color:'#F59E0B' },
  'new-year': { en:'New Year',       hi:'नववर्ष',      color:'#60A5FA' },
};

const WD_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WD_HI = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

function availableYears() { return Object.keys(DATES).map(Number).sort(); }

function computeFestivals(year) {
  const table = DATES[year];
  if (!table) return { year, count: 0, festivals: [], unavailable: true };
  const out = [];
  for (const [slug, date] of Object.entries(table)) {
    const m = META[slug];
    if (!m) continue;
    const dow = new Date(date + 'T00:00:00Z').getUTCDay();
    out.push({
      slug, date, weekday_en: WD_EN[dow], weekday_hi: WD_HI[dow],
      name_en: m.en, name_hi: m.hi, desc_en: m.desc_en, desc_hi: m.desc_hi,
      category: m.cat, category_en: CATEGORY_META[m.cat]?.en, category_hi: CATEGORY_META[m.cat]?.hi,
      color: CATEGORY_META[m.cat]?.color || '#D4AF37',
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return { year, count: out.length, festivals: out };
}

module.exports = { computeFestivals, CATEGORY_META, availableYears };
