'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

// Mahadasha Journey — Life in Nine Chapters, with per-antardasha narratives.
// Data: profile.dasha_journey (9 maha narratives) + profile.antar_narratives
// (map: maha lord → 9 antardasha narrative entries). Accordion keeps 81
// narratives readable — current mahadasha opens by default.

const PLANET_COLOR = {
  Sun:'#F59E0B', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#22C55E',
  Jupiter:'#F59E0B', Venus:'#EC4899', Saturn:'#6366F1', Rahu:'#A78BFA', Ketu:'#D97706',
};
const PLANET_ICON = {
  Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋',
};

export default function DashaJourneyPanel({ journey, antarNarratives, lang = 'en' }) {
  const currentLord = journey?.find((d) => d.is_current)?.lord || null;
  const [open, setOpen] = useState(currentLord);
  if (!journey?.length) return null;
  const T = (en, hi) => (lang === 'hi' ? hi : en);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }}
      className="card-royal p-5 mt-6">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">
        🌌 {T('Your Mahadasha Journey — Life in Nine Chapters', 'आपकी महादशा यात्रा — नौ अध्यायों में जीवन')}
      </h2>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T('Life moves through planetary chapters. Open any Mahadasha to read its theme and what every Antardasha inside it holds for you.',
           'जीवन ग्रहों के अध्यायों से गुजरता है। किसी भी महादशा को खोलकर उसका सार और उसकी हर अंतर्दशा का फल पढ़ें।')}
      </p>

      <div className="space-y-2">
        {journey.map((dj) => {
          const isOpen = open === dj.lord;
          const ants = antarNarratives?.[dj.lord] || [];
          const pc = PLANET_COLOR[dj.lord] || '#D4AF37';
          return (
            <div key={dj.lord} style={{
              border: `1px solid ${dj.is_current ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, overflow:'hidden',
              background: dj.is_current ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
            }}>
              {/* Accordion header */}
              <button onClick={() => setOpen(isOpen ? null : dj.lord)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  gap:10, padding:'11px 14px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span style={{ color:pc, fontSize:15 }}>{PLANET_ICON[dj.lord]}</span>
                  <span className="text-ivory/90 text-xs font-bold font-devanagari">
                    {lang === 'hi' ? `${dj.lord_hi} महादशा` : `${dj.lord} Mahadasha`}
                  </span>
                  <span className="text-gold/70 text-[10.5px] font-devanagari">
                    {lang === 'hi' ? dj.title_hi : dj.title_en}
                  </span>
                  {dj.is_current && (
                    <span style={{ fontSize:9, fontWeight:700, color:'#22C55E', background:'rgba(34,197,94,0.12)',
                      border:'1px solid rgba(34,197,94,0.3)', borderRadius:10, padding:'1px 8px' }}>
                      {T('RUNNING NOW', 'अभी चल रही')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-ivory/40 text-[10px]">{dj.start} → {dj.end} ({dj.years} {T('yrs','वर्ष')})</span>
                  <span style={{ color:'#D4AF37', fontSize:11 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ padding:'0 14px 13px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-ivory/72 text-[11px] leading-relaxed font-devanagari mt-3">
                    {lang === 'hi' ? dj.text_hi : dj.text_en}
                  </p>
                  {(dj.placement_en || dj.placement_hi) && (
                    <p className="text-[10.5px] leading-relaxed font-devanagari mt-2" style={{ color:'#A78BFA' }}>
                      ◈ {lang === 'hi' ? dj.placement_hi : dj.placement_en}
                    </p>
                  )}

                  {ants.length > 0 && (
                    <>
                      <p style={{ color:'#60A5FA', fontSize:10, fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'0.12em', margin:'14px 0 8px' }} className="font-devanagari">
                        {T(`Antardasha phal of ${dj.lord} Mahadasha`, `${dj.lord_hi} महादशा की अंतर्दशाओं का फल`)}
                      </p>
                      <div className="space-y-2">
                        {ants.map((ad, i) => (
                          <div key={i} style={{
                            borderLeft: `2px solid ${ad.is_current ? '#22C55E' : PLANET_COLOR[ad.lord] || 'rgba(212,175,55,0.4)'}`,
                            background: ad.is_current ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                            borderRadius:'0 8px 8px 0', padding:'8px 11px',
                          }}>
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              <span className="text-[11px] font-bold font-devanagari"
                                style={{ color: ad.is_current ? '#22C55E' : '#D4AF37' }}>
                                {lang === 'hi' ? `${dj.lord_hi} - ${ad.lord_hi}` : `${dj.lord} - ${ad.lord}`}
                                {ad.is_current ? ` ⏳ ${T('NOW','अभी')}` : ''}
                              </span>
                              <span className="text-ivory/35 text-[9.5px]">{ad.start} → {ad.end}</span>
                            </div>
                            <p className="text-ivory/62 text-[10.5px] leading-relaxed font-devanagari">
                              {(lang === 'hi' ? ad.narrative_hi : ad.narrative_en).replace(/^[^:]+:\s*/, '')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
