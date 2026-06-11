'use client';
import { motion } from 'framer-motion';

// Planetary conjunction (yuti) narratives — profile.yuti_analysis (cosmic-extras.js)

export default function YutiPanel({ yuti, lang = 'en' }) {
  if (!yuti?.length) return null;
  const T = (en, hi) => (lang === 'hi' ? hi : en);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
      className="card-royal p-5 mt-6">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">
        ⚛️ {T('When Energies Merge — Planetary Conjunctions', 'जब ऊर्जाएं मिलती हैं — ग्रह युतियां')}
      </h2>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T('When two planets share one sign, their energies blend into a single force. These conjunctions shape your chart:',
           'जब दो ग्रह एक राशि में होते हैं, तो उनकी ऊर्जाएं मिलकर एक शक्ति बन जाती हैं। ये युतियां आपकी कुंडली को आकार देती हैं:')}
      </p>
      <div className="space-y-3">
        {yuti.map((y, i) => (
          <div key={i} style={{ border:'1px solid rgba(212,175,55,0.16)', borderRadius:10, padding:'12px 14px', background:'rgba(255,255,255,0.025)' }}>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-gold text-xs font-bold font-devanagari">
                {(lang === 'hi' ? y.planets_hi : y.planets).join(' + ')} · {lang === 'hi' ? y.rashi_hi : y.rashi_en} ({T('House','भाव')} {y.house})
              </span>
              {y.yoga_name && (
                <span style={{ fontSize:9, fontWeight:700, color:'#A78BFA', background:'rgba(167,139,250,0.1)',
                  border:'1px solid rgba(167,139,250,0.3)', borderRadius:10, padding:'2px 8px' }}>
                  {y.yoga_name}
                </span>
              )}
              <span className="text-ivory/35 text-[9.5px]">
                {y.planets[0]} {y.degrees[0]}° · {y.planets[1]} {y.degrees[1]}°
              </span>
            </div>
            <p className="text-ivory/70 text-[11px] leading-relaxed font-devanagari">
              {lang === 'hi' ? y.narrative_hi : y.narrative_en}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
