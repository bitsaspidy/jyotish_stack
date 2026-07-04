// Zodiac sign registry — slug ↔ rashi number ↔ names. Used by the per-sign
// horoscope SEO routes and their metadata/sitemap generation.
export const SIGNS = [
  { slug: 'aries',       num: 1,  en: 'Aries',       hi: 'मेष',      symbol: '♈', dates: 'Mar 21 – Apr 19' },
  { slug: 'taurus',      num: 2,  en: 'Taurus',      hi: 'वृषभ',     symbol: '♉', dates: 'Apr 20 – May 20' },
  { slug: 'gemini',      num: 3,  en: 'Gemini',      hi: 'मिथुन',    symbol: '♊', dates: 'May 21 – Jun 20' },
  { slug: 'cancer',      num: 4,  en: 'Cancer',      hi: 'कर्क',     symbol: '♋', dates: 'Jun 21 – Jul 22' },
  { slug: 'leo',         num: 5,  en: 'Leo',         hi: 'सिंह',     symbol: '♌', dates: 'Jul 23 – Aug 22' },
  { slug: 'virgo',       num: 6,  en: 'Virgo',       hi: 'कन्या',    symbol: '♍', dates: 'Aug 23 – Sep 22' },
  { slug: 'libra',       num: 7,  en: 'Libra',       hi: 'तुला',     symbol: '♎', dates: 'Sep 23 – Oct 22' },
  { slug: 'scorpio',     num: 8,  en: 'Scorpio',     hi: 'वृश्चिक',  symbol: '♏', dates: 'Oct 23 – Nov 21' },
  { slug: 'sagittarius', num: 9,  en: 'Sagittarius', hi: 'धनु',      symbol: '♐', dates: 'Nov 22 – Dec 21' },
  { slug: 'capricorn',   num: 10, en: 'Capricorn',   hi: 'मकर',      symbol: '♑', dates: 'Dec 22 – Jan 19' },
  { slug: 'aquarius',    num: 11, en: 'Aquarius',    hi: 'कुम्भ',    symbol: '♒', dates: 'Jan 20 – Feb 18' },
  { slug: 'pisces',      num: 12, en: 'Pisces',      hi: 'मीन',      symbol: '♓', dates: 'Feb 19 – Mar 20' },
];

export const signBySlug = (slug) => SIGNS.find((s) => s.slug === slug) || null;
