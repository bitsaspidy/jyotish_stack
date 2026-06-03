'use strict';
// Static Vedic reference data — signs, nakshatras, dignity map, and friendship tables

const RASHIS = [
  { num:1,  en:'Aries',       hi:'मेष',      lord:'Mars',    symbol:'♈', element:'Fire',  quality:'Cardinal' },
  { num:2,  en:'Taurus',      hi:'वृषभ',     lord:'Venus',   symbol:'♉', element:'Earth', quality:'Fixed'    },
  { num:3,  en:'Gemini',      hi:'मिथुन',    lord:'Mercury', symbol:'♊', element:'Air',   quality:'Mutable'  },
  { num:4,  en:'Cancer',      hi:'कर्क',     lord:'Moon',    symbol:'♋', element:'Water', quality:'Cardinal' },
  { num:5,  en:'Leo',         hi:'सिंह',     lord:'Sun',     symbol:'♌', element:'Fire',  quality:'Fixed'    },
  { num:6,  en:'Virgo',       hi:'कन्या',    lord:'Mercury', symbol:'♍', element:'Earth', quality:'Mutable'  },
  { num:7,  en:'Libra',       hi:'तुला',     lord:'Venus',   symbol:'♎', element:'Air',   quality:'Cardinal' },
  { num:8,  en:'Scorpio',     hi:'वृश्चिक',  lord:'Mars',    symbol:'♏', element:'Water', quality:'Fixed'    },
  { num:9,  en:'Sagittarius', hi:'धनु',      lord:'Jupiter', symbol:'♐', element:'Fire',  quality:'Mutable'  },
  { num:10, en:'Capricorn',   hi:'मकर',      lord:'Saturn',  symbol:'♑', element:'Earth', quality:'Cardinal' },
  { num:11, en:'Aquarius',    hi:'कुम्भ',    lord:'Saturn',  symbol:'♒', element:'Air',   quality:'Fixed'    },
  { num:12, en:'Pisces',      hi:'मीन',      lord:'Jupiter', symbol:'♓', element:'Water', quality:'Mutable'  },
];

// Source: AstroAnsh Class 8 — Nakshatra Table Sheet.pdf
const NAKSHATRAS = [
  { num:1,  en:'Ashwini',          hi:'अश्विनी',          lord:'Ketu',    years:7,  deity_en:'Ashwini Kumars',     deity_hi:'अश्विनी कुमार',    is_gandmool:true  },
  { num:2,  en:'Bharani',          hi:'भरणी',             lord:'Venus',   years:20, deity_en:'Yama',               deity_hi:'यम',               is_gandmool:false },
  { num:3,  en:'Krittika',         hi:'कृत्तिका',         lord:'Sun',     years:6,  deity_en:'Agni',               deity_hi:'अग्नि',            is_gandmool:false },
  { num:4,  en:'Rohini',           hi:'रोहिणी',           lord:'Moon',    years:10, deity_en:'Brahma',             deity_hi:'ब्रह्मा',          is_gandmool:false },
  { num:5,  en:'Mrigashira',       hi:'मृगशीर्षा',        lord:'Mars',    years:7,  deity_en:'Soma / Chandra',     deity_hi:'सोम / चंद्र',      is_gandmool:false },
  { num:6,  en:'Ardra',            hi:'आर्द्रा',           lord:'Rahu',    years:18, deity_en:'Rudra',              deity_hi:'रुद्र',            is_gandmool:false },
  { num:7,  en:'Punarvasu',        hi:'पुनर्वसु',          lord:'Jupiter', years:16, deity_en:'Aditi',              deity_hi:'अदिति',            is_gandmool:false },
  { num:8,  en:'Pushya',           hi:'पुष्य',             lord:'Saturn',  years:19, deity_en:'Brihaspati',         deity_hi:'बृहस्पति',         is_gandmool:false },
  { num:9,  en:'Ashlesha',         hi:'आश्लेषा',           lord:'Mercury', years:17, deity_en:'Nagas',              deity_hi:'नाग',              is_gandmool:true  },
  { num:10, en:'Magha',            hi:'मघा',               lord:'Ketu',    years:7,  deity_en:'Pitris (Ancestors)', deity_hi:'पितृ',             is_gandmool:true  },
  { num:11, en:'Purva Phalguni',   hi:'पूर्वा फाल्गुनी',   lord:'Venus',   years:20, deity_en:'Bhaga',              deity_hi:'भग',               is_gandmool:false },
  { num:12, en:'Uttara Phalguni',  hi:'उत्तरा फाल्गुनी',   lord:'Sun',     years:6,  deity_en:'Aryaman',            deity_hi:'अर्यमन',           is_gandmool:false },
  { num:13, en:'Hasta',            hi:'हस्त',              lord:'Moon',    years:10, deity_en:'Savitar',            deity_hi:'सवितार',           is_gandmool:false },
  { num:14, en:'Chitra',           hi:'चित्रा',            lord:'Mars',    years:7,  deity_en:'Tvashtar / Vishwakarma', deity_hi:'त्वष्टा / विश्वकर्मा', is_gandmool:false },
  { num:15, en:'Swati',            hi:'स्वाती',            lord:'Rahu',    years:18, deity_en:'Vayu',               deity_hi:'वायु',             is_gandmool:false },
  { num:16, en:'Vishakha',         hi:'विशाखा',            lord:'Jupiter', years:16, deity_en:'Indra & Agni',       deity_hi:'इंद्र और अग्नि',   is_gandmool:false },
  { num:17, en:'Anuradha',         hi:'अनुराधा',           lord:'Saturn',  years:19, deity_en:'Mitra',              deity_hi:'मित्र',            is_gandmool:false },
  { num:18, en:'Jyeshtha',         hi:'ज्येष्ठा',          lord:'Mercury', years:17, deity_en:'Indra',              deity_hi:'इंद्र',            is_gandmool:true  },
  { num:19, en:'Mula',             hi:'मूल',               lord:'Ketu',    years:7,  deity_en:'Nirriti',            deity_hi:'निर्ऋति',          is_gandmool:true  },
  { num:20, en:'Purva Ashadha',    hi:'पूर्वाषाढ़ा',       lord:'Venus',   years:20, deity_en:'Apas (Water)',       deity_hi:'आपः / जल',         is_gandmool:false },
  { num:21, en:'Uttara Ashadha',   hi:'उत्तराषाढ़ा',       lord:'Sun',     years:6,  deity_en:'Vishwadeva',         deity_hi:'विश्वदेव',         is_gandmool:false },
  { num:22, en:'Shravana',         hi:'श्रवण',             lord:'Moon',    years:10, deity_en:'Vishnu',             deity_hi:'विष्णु',           is_gandmool:false },
  { num:23, en:'Dhanishtha',       hi:'धनिष्ठा',           lord:'Mars',    years:7,  deity_en:'Vasus',              deity_hi:'वसु',              is_gandmool:false },
  { num:24, en:'Shatabhisha',      hi:'शतभिषा',            lord:'Rahu',    years:18, deity_en:'Varuna',             deity_hi:'वरुण',             is_gandmool:false },
  { num:25, en:'Purva Bhadrapada', hi:'पूर्वा भाद्रपद',    lord:'Jupiter', years:16, deity_en:'Aja Ekapada',        deity_hi:'अज एकपाद',         is_gandmool:false },
  { num:26, en:'Uttara Bhadrapada',hi:'उत्तरा भाद्रपद',    lord:'Saturn',  years:19, deity_en:'Ahirbudhnya',        deity_hi:'अहिर्बुध्न्य',     is_gandmool:false },
  { num:27, en:'Revati',           hi:'रेवती',             lord:'Mercury', years:17, deity_en:'Pushan',             deity_hi:'पूषन',             is_gandmool:true  },
];

const NAK_SPAN = 360 / 27; // 13.333...°

// Source: seed 004_planet_dignity.js
const DIGNITY_MAP = {
  Sun:     { exalt:1, exaltD:10, debil:7, debilD:10, mool:5, moolF:0,  moolT:20, own:[5]     },
  Moon:    { exalt:2, exaltD:3,  debil:8, debilD:3,  mool:2, moolF:4,  moolT:20, own:[4]     },
  Mars:    { exalt:10,exaltD:28, debil:4, debilD:28, mool:1, moolF:0,  moolT:12, own:[1,8]   },
  Mercury: { exalt:6, exaltD:15, debil:12,debilD:15, mool:6, moolF:16, moolT:20, own:[3,6]   },
  Jupiter: { exalt:4, exaltD:5,  debil:10,debilD:5,  mool:9, moolF:0,  moolT:10, own:[9,12]  },
  Venus:   { exalt:12,exaltD:27, debil:6, debilD:27, mool:7, moolF:0,  moolT:15, own:[2,7]   },
  Saturn:  { exalt:7, exaltD:20, debil:1, debilD:20, mool:11,moolF:0,  moolT:20, own:[10,11] },
};

// Gana, Nadi, Yoni per nakshatra (index 1-27; index 0 is null)
const NAK_EXTRA = [
  null,
  { gana:'deva',     nadi:'adi',    yoni:'horse' },
  { gana:'manushya', nadi:'madhya', yoni:'elephant' },
  { gana:'rakshasa', nadi:'antya',  yoni:'sheep' },
  { gana:'manushya', nadi:'antya',  yoni:'serpent' },
  { gana:'deva',     nadi:'madhya', yoni:'serpent' },
  { gana:'manushya', nadi:'adi',    yoni:'dog' },
  { gana:'deva',     nadi:'adi',    yoni:'cat' },
  { gana:'deva',     nadi:'madhya', yoni:'sheep' },
  { gana:'rakshasa', nadi:'antya',  yoni:'cat' },
  { gana:'rakshasa', nadi:'antya',  yoni:'rat' },
  { gana:'manushya', nadi:'madhya', yoni:'rat' },
  { gana:'manushya', nadi:'adi',    yoni:'cow' },
  { gana:'deva',     nadi:'adi',    yoni:'buffalo' },
  { gana:'rakshasa', nadi:'madhya', yoni:'tiger' },
  { gana:'deva',     nadi:'antya',  yoni:'buffalo' },
  { gana:'rakshasa', nadi:'antya',  yoni:'tiger' },
  { gana:'deva',     nadi:'madhya', yoni:'deer' },
  { gana:'rakshasa', nadi:'adi',    yoni:'deer' },
  { gana:'rakshasa', nadi:'adi',    yoni:'dog' },
  { gana:'manushya', nadi:'madhya', yoni:'monkey' },
  { gana:'manushya', nadi:'antya',  yoni:'mongoose' },
  { gana:'deva',     nadi:'antya',  yoni:'monkey' },
  { gana:'rakshasa', nadi:'madhya', yoni:'lion' },
  { gana:'rakshasa', nadi:'adi',    yoni:'horse' },
  { gana:'manushya', nadi:'adi',    yoni:'lion' },
  { gana:'manushya', nadi:'madhya', yoni:'cow' },
  { gana:'deva',     nadi:'antya',  yoni:'elephant' },
];

const NATURAL_FRIENDS = {
  Sun:     { friends:['Moon','Mars','Jupiter'], neutral:['Mercury'], enemies:['Venus','Saturn'] },
  Moon:    { friends:['Sun','Mercury'], neutral:['Mars','Jupiter','Venus','Saturn'], enemies:[] },
  Mars:    { friends:['Sun','Moon','Jupiter'], neutral:['Venus','Saturn'], enemies:['Mercury'] },
  Mercury: { friends:['Sun','Venus'], neutral:['Mars','Jupiter','Saturn'], enemies:['Moon'] },
  Jupiter: { friends:['Sun','Moon','Mars'], neutral:['Saturn'], enemies:['Mercury','Venus'] },
  Venus:   { friends:['Mercury','Saturn'], neutral:['Mars','Jupiter'], enemies:['Sun','Moon'] },
  Saturn:  { friends:['Mercury','Venus'], neutral:['Jupiter'], enemies:['Sun','Moon','Mars'] },
};

module.exports = { RASHIS, NAKSHATRAS, NAK_SPAN, DIGNITY_MAP, NAK_EXTRA, NATURAL_FRIENDS };
