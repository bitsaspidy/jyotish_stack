'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

// Graha Phal — per-planet placement narratives (sign + house) for all 9 grahas.
// Data: profile.placement_narratives (helpers/placement-narratives.js).

const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B' },
  Moon:    { icon:'☽', color:'#94A3B8' },
  Mars:    { icon:'♂', color:'#EF4444' },
  Mercury: { icon:'☿', color:'#10B981' },
  Jupiter: { icon:'♃', color:'#FBBF24' },
  Venus:   { icon:'♀', color:'#F472B6' },
  Saturn:  { icon:'♄', color:'#818CF8' },
  Rahu:    { icon:'☊', color:'#A78BFA' },
  Ketu:    { icon:'☋', color:'#6B7280' },
};

function Badge({ children, color }) {
  return (
    <span style={{ fontSize:9.5, fontWeight:700, color, background:`${color}14`,
      border:`1px solid ${color}40`, borderRadius:10, padding:'2px 9px', whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

export default function PlacementNarrativesPanel({ data, lang = 'en' }) {
  const [open, setOpen] = useState({ Sun: true });
  const T = (en, hi) => (lang === 'hi' ? hi : en);
  if (!Array.isArray(data) || !data.length) return null;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
      className="card-royal p-5 mt-6">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">
        🪐 {T('Graha Phal — What Each Planet Says About You', 'ग्रह फल — हर ग्रह आपके बारे में क्या कहता है')}
      </h2>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T('A direct reading of every planet\'s rashi (sign) and bhava (house) placement — the two coordinates that shape how each graha expresses in your life.',
           'हर ग्रह की राशि और भाव स्थिति का सीधा फल — यही दो निर्देशांक तय करते हैं कि ग्रह आपके जीवन में कैसे प्रकट होगा।')}
      </p>

      <div className="space-y-2.5">
        {data.map((pl) => {
          const meta = PLANET_META[pl.planet] || {};
          const dig = (pl.dignity || '').toLowerCase();
          const isOpen = !!open[pl.planet];
          return (
            <div key={pl.planet} style={{ border:`1px solid ${meta.color}33`, borderRadius:10,
              background:'rgba(255,255,255,0.04)', overflow:'hidden' }}>
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [pl.planet]: !o[pl.planet] }))}
                className="w-full flex items-center gap-2 flex-wrap px-3.5 py-2.5 text-left">
                <span style={{ color: meta.color, fontSize: 15 }}>{meta.icon}</span>
                <span className="text-ivory/90 text-xs font-bold font-devanagari">
                  {lang === 'hi' ? pl.planet_hi : pl.planet} · {lang === 'hi' ? pl.rashi_hi : pl.rashi_en} · {T('House', 'भाव')} {pl.house}
                </span>
                {/exalt/.test(dig)       && <Badge color="#22C55E">{T('EXALTED','उच्च')}</Badge>}
                {/debil/.test(dig)       && <Badge color="#EF4444">{T('DEBILITATED','नीच')}</Badge>}
                {/own|mool/.test(dig)    && <Badge color="#60A5FA">{T('OWN SIGN','स्वराशि')}</Badge>}
                {pl.is_retrograde        && <Badge color="#A78BFA">{T('RETRO','वक्री')}</Badge>}
                {pl.is_combust           && <Badge color={pl.combust_level === 'deep' ? '#EF4444' : '#F59E0B'}>
                  {pl.combust_level === 'deep' ? T('DEEP COMBUST','गहरा अस्त') : T('COMBUST','अस्त')}</Badge>}
                <span className="ml-auto text-ivory/45 text-[10px]">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 space-y-2">
                  {pl.sign_text && (
                    <p className="text-ivory/70 text-[11.5px] leading-relaxed font-devanagari">
                      <span style={{ color: meta.color, fontWeight: 700 }}>{T('In sign','राशि में')}: </span>
                      {lang === 'hi' ? pl.sign_text.hi : pl.sign_text.en}
                    </p>
                  )}
                  {pl.house_text && (
                    <p className="text-ivory/70 text-[11.5px] leading-relaxed font-devanagari">
                      <span style={{ color: meta.color, fontWeight: 700 }}>{T('In house','भाव में')}: </span>
                      {lang === 'hi' ? pl.house_text.hi : pl.house_text.en}
                    </p>
                  )}
                  {(pl.modifiers || []).map((m, i) => (
                    <p key={i} className="text-[11px] font-devanagari" style={{ color:'#F59E0B' }}>
                      ✦ {lang === 'hi' ? m.hi : m.en}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
