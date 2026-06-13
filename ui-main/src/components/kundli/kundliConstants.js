// ─── Shared constants & helpers for KundliDetail and its sub-components ────────
import { t } from '../../lib/astroI18n';

export const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B', hi:'सूर्य'     },
  Moon:    { icon:'☽', color:'#94A3B8', hi:'चन्द्र'    },
  Mars:    { icon:'♂', color:'#EF4444', hi:'मंगल'       },
  Mercury: { icon:'☿', color:'#10B981', hi:'बुध'        },
  Jupiter: { icon:'♃', color:'#FBBF24', hi:'बृहस्पति'  },
  Venus:   { icon:'♀', color:'#F472B6', hi:'शुक्र'      },
  Saturn:  { icon:'♄', color:'#818CF8', hi:'शनि'        },
  Rahu:    { icon:'☊', color:'#A78BFA', hi:'राहु'       },
  Ketu:    { icon:'☋', color:'#6B7280', hi:'केतु'       },
};

export const DIGNITY_STYLE = {
  'Exaltation (उच्च)':         { bg:'rgba(34,197,94,0.12)',  color:'#22C55E' },
  'Moolatrikona (मूलत्रिकोण)':  { bg:'rgba(245,158,11,0.12)', color:'#F59E0B' },
  'Own Sign (स्वगृह)':          { bg:'rgba(96,165,250,0.12)', color:'#60A5FA' },
  'Debilitation (नीच)':        { bg:'rgba(239,68,68,0.12)',  color:'#EF4444' },
  'Neutral':                   { bg:'rgba(107,114,128,0.12)',color:'#6B7280' },
  'shadow':                    { bg:'rgba(107,114,128,0.12)',color:'#6B7280' },
};

export const ASSESSMENT_STYLE = {
  positive: { bg:'rgba(34,197,94,0.12)', color:'#22C55E', border:'rgba(34,197,94,0.28)' },
  mixed:    { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'rgba(245,158,11,0.28)' },
  negative: { bg:'rgba(239,68,68,0.12)', color:'#EF4444', border:'rgba(239,68,68,0.28)' },
};

export const TIMING_STYLE = {
  favorable: { bg:'rgba(34,197,94,0.12)', color:'#22C55E', border:'rgba(34,197,94,0.25)' },
  moderate:  { bg:'rgba(96,165,250,0.10)', color:'#60A5FA', border:'rgba(96,165,250,0.24)' },
  caution:   { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'rgba(245,158,11,0.28)' },
};

// Rashi short names (for chart cells)
export const RASHI_SHORT_EN = ['','Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
export const RASHI_SHORT_HI = ['','मेष','वृषभ','मिथु','कर्क','सिंह','कन्या','तुला','वृश्','धनु','मकर','कुम्भ','मीन'];

// South Indian chart grid — signs fixed in cells
export const SI_GRID = [12,1,2,3, 11,0,0,4, 10,0,0,5, 9,8,7,6];

// Bhava Nature (from "Name of Bhavas" PDF)
export const BHAVA_NATURE = {
  1:  { en:'Very Auspicious',  hi:'अत्यंत शुभ',          color:'#D4AF37', bg:'rgba(212,175,55,0.14)' },
  2:  { en:'Maarak',           hi:'मारक',                 color:'#EF4444', bg:'rgba(239,68,68,0.12)'  },
  3:  { en:'Grows with Age',   hi:'उपचय',                 color:'#60A5FA', bg:'rgba(96,165,250,0.12)' },
  4:  { en:'Auspicious',       hi:'शुभ (केंद्र)',          color:'#22C55E', bg:'rgba(34,197,94,0.12)'  },
  5:  { en:'Auspicious',       hi:'शुभ (त्रिकोण)',         color:'#22C55E', bg:'rgba(34,197,94,0.12)'  },
  6:  { en:'Evil (Dusthana)',   hi:'दुस्थान + उपचय',       color:'#EF4444', bg:'rgba(239,68,68,0.12)'  },
  7:  { en:'Auspicious',       hi:'शुभ + मारक',            color:'#22C55E', bg:'rgba(34,197,94,0.12)'  },
  8:  { en:'Evil (Dusthana)',   hi:'दुस्थान (मृत्यु)',      color:'#DC2626', bg:'rgba(220,38,38,0.12)'  },
  9:  { en:'Very Auspicious',  hi:'अत्यंत शुभ (भाग्य)',    color:'#D4AF37', bg:'rgba(212,175,55,0.14)' },
  10: { en:'Auspicious',       hi:'शुभ (केंद्र+उपचय)',     color:'#22C55E', bg:'rgba(34,197,94,0.12)'  },
  11: { en:'Grows with Age',   hi:'उपचय (लाभ)',            color:'#60A5FA', bg:'rgba(96,165,250,0.12)' },
  12: { en:'Evil (Dusthana)',   hi:'दुस्थान (व्यय)',        color:'#EF4444', bg:'rgba(239,68,68,0.12)'  },
};

// Main tabs for KundliDetail
export const MAIN_TABS = [
  { key:'kundli',      en:'Kundli',        hi:'कुंडली',         icon:'🔯' },
  { key:'life-report', en:'Life Report',   hi:'जीवन रिपोर्ट',   icon:'📋' },
  { key:'strength',    en:'Strength',      hi:'ग्रह बल',        icon:'💪' },
  { key:'impact',      en:'Planet Impact', hi:'ग्रह प्रभाव',    icon:'🌌' },
  { key:'bhava-lords', en:'Bhava Lords',   hi:'भाव स्वामी',     icon:'🏠' },
  { key:'guidance',    en:'Guidance',      hi:'मार्गदर्शन',      icon:'🧭' },
  { key:'varshphal',   en:'Varshphal',     hi:'वर्षफल',         icon:'📅' },
  { key:'grb',         en:'GRB Report',    hi:'GRB रिपोर्ट',    icon:'📊' },
  { key:'varga',       en:'Varga',         hi:'वर्ग चार्ट',     icon:'⬡'  },
  { key:'digbala',     en:'Digbala',       hi:'दिग्बल',          icon:'⬡'  },
  { key:'bhav-karak',  en:'Bhav Karak',    hi:'भाव कारक',       icon:'🪐' },
  { key:'drishti',     en:'Drishti',       hi:'दृष्टि',          icon:'👁' },
  { key:'yogas',       en:'Yogas',         hi:'योग-दोष',        icon:'✨' },
  { key:'fav-days',    en:'Fav Days',      hi:'शुभ दिन',        icon:'📅' },
  { key:'results',     en:'Final Results', hi:'संपूर्ण निर्णय',  icon:'🌟' },
  { key:'ai-reading',  en:'AI Reading',   hi:'AI पठन',          icon:'🤖' },
];

// Life area icons (Drishti section)
export const LIFE_AREA_ICONS = {
  self:'👤', family:'🏠', spouse:'💑', money:'💰', career:'💼', health:'❤️', spirit:'🙏',
};

// Aspect nature colours (Drishti section)
export const ASPECT_NATURE_COLOR = {
  auspicious:'#22C55E', aggressive:'#EF4444', restricting:'#818CF8',
  karmic:'#A78BFA', neutral:'#9CA3AF',
};

// Helper: assessment label
export function assessmentLabel(assessment, lang) {
  if (!assessment) return t(lang, 'Mixed', 'मिश्रित');
  return lang === 'hi' ? (assessment.label_hi || assessment.label_en) : (assessment.label_en || assessment.polarity || 'Mixed');
}

// Helper: timing tone label
export function timingToneLabel(tone, lang) {
  const labels = {
    favorable: ['Favorable', 'सहायक'],
    moderate: ['Moderate', 'मध्यम'],
    caution: ['Caution', 'सावधानी'],
  };
  const pair = labels[tone] || [tone || 'Moderate', tone || 'मध्यम'];
  return t(lang, pair[0], pair[1]);
}
