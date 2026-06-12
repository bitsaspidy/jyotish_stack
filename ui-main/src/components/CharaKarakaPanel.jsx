'use client';
import { motion } from 'framer-motion';

// Chara Karakas (Jaimini) — 7 planets ranked by degree, each carrying a life role.
// Data: profile.chara_karakas (computed server-side in cosmic-insights.js)

const KARAKA_ICON = {
  atmakaraka:'👑', amatyakaraka:'💼', bhratrikaraka:'🤝', matrikaraka:'🤱',
  putrakaraka:'🎨', gnatikaraka:'⚔️', darakaraka:'💑',
};
const PLANET_COLOR = {
  Sun:'#F59E0B', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#22C55E',
  Jupiter:'#F59E0B', Venus:'#EC4899', Saturn:'#6366F1',
};

export default function CharaKarakaPanel({ karakas, lang = 'en' }) {
  if (!karakas?.length) return null;
  const T = (en, hi) => (lang === 'hi' ? hi : en);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
      className="card-royal p-5 mt-6">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">
        🪐 {T('Chara Karakas — Planets Behind Your Purpose', 'चर कारक — आपके उद्देश्य के पीछे के ग्रह')}
      </h2>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T('In Jaimini astrology the 7 planets are ranked by their degree in sign — each rank gives a Karaka, a planet carrying a specific responsibility in your life.',
           'जैमिनी ज्योतिष में 7 ग्रहों को राशि में अंश के अनुसार क्रम दिया जाता है — हर क्रम एक कारक बनता है, जो जीवन की एक विशेष जिम्मेदारी निभाता है।')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {karakas.map((k) => (
          <div key={k.key} style={{
            border:'1px solid rgba(167,139,250,0.18)', borderRadius:10, padding:'11px 13px',
            background: k.key === 'atmakaraka' ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.025)',
          }}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-ivory/90 text-xs font-semibold font-devanagari">
                {KARAKA_ICON[k.key]} {lang === 'hi' ? k.hi : k.en}
              </span>
              <span style={{ fontSize:10, fontWeight:700, color: PLANET_COLOR[k.planet] || '#D4AF37',
                background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'2px 9px', whiteSpace:'nowrap' }}>
                {lang === 'hi' ? k.planet_hi : k.planet} · {k.degree?.toFixed(2)}°
              </span>
            </div>
            <p className="text-ivory/55 text-[10.5px] leading-relaxed font-devanagari mb-1">
              {lang === 'hi' ? k.meaning_hi : k.meaning_en}
            </p>
            <p className="text-ivory/70 text-[10.5px] leading-relaxed font-devanagari">
              {lang === 'hi' ? k.reading_hi : k.reading_en}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
