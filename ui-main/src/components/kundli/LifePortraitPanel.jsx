'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { t, planetName, portraitText, currentPeriodText, untilText } from '../../lib/astroI18n';

const PORTRAIT_TABS = [
  { key:'you',    label:'Who You Are',    label_hi:'आप कौन हैं'  },
  { key:'period', label:'Current Period', label_hi:'वर्तमान दशा' },
];

export default function LifePortraitPanel({ chart, lang }) {
  const [tab, setTab] = useState('you');
  const portrait = chart?.predictions?.portrait;
  const period   = chart?.predictions?.current_period;
  const dasha    = chart?.dasha?.find((d) => d.is_current) || chart?.dasha?.[0];
  const antar    = dasha?.antardasha?.find((d) => d.is_current) || dasha?.antardasha?.[0];

  if (!portrait && !period) return null;

  const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}
      className="card-royal p-5">
      <h2 className="font-serif text-gold text-sm font-semibold mb-3">
        🪐 {lang === 'hi' ? 'जीवन चित्रण' : 'Life Portrait'}
      </h2>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {PORTRAIT_TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{
              padding:'4px 12px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === tb.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === tb.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {lang === 'hi' ? tb.label_hi : tb.label}
          </button>
        ))}
      </div>

      {/* Who You Are */}
      {tab === 'you' && portrait && (
        <div className="space-y-4">
          <div>
            <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>
              ✦ {lang==='hi' ? 'आपकी लग्न — बाहरी व्यक्तित्व' : 'Your Ascendant — Outer Personality'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.82)', fontSize:12.5, lineHeight:1.8 }}>
              {portraitText(portrait, 'lagna', chart, lang)}
            </p>
          </div>
          <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
            <p style={{ color:'#94A3B8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>
              ☽ {lang==='hi' ? 'आपकी चन्द्र राशि — आंतरिक भावनाएं' : 'Your Moon Sign — Inner Emotional World'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12.5, lineHeight:1.8 }}>
              {portraitText(portrait, 'moon', chart, lang)}
            </p>
          </div>
          <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
            <p style={{ color:'#A78BFA', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>
              ✨ {lang==='hi' ? 'आपका नक्षत्र — आत्मा की प्रकृति' : 'Your Nakshatra — Soul Nature'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12.5, lineHeight:1.8 }}>
              {portraitText(portrait, 'nakshatra', chart, lang)}
            </p>
          </div>
        </div>
      )}

      {/* Current Period */}
      {tab === 'period' && (
        <div className="space-y-4">
          {/* Dasha badges */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <div style={{
              padding:'6px 14px', borderRadius:20,
              background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.35)',
              textAlign:'center',
            }}>
              <p style={{ color:'rgba(245,240,232,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em' }}>{t(lang, 'Mahadasha', 'महादशा')}</p>
              <p style={{ color:'#D4AF37', fontSize:15, fontWeight:700, fontFamily:'Georgia,serif', marginTop:2 }}>{planetName(dasha?.lord, lang) || '—'}</p>
              <p style={{ color:'rgba(245,240,232,0.68)', fontSize:9, marginTop:2 }}>{untilText(fmtDate(dasha?.end), lang)}</p>
            </div>
            <div style={{
              padding:'6px 14px', borderRadius:20,
              background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.3)',
              textAlign:'center',
            }}>
              <p style={{ color:'rgba(245,240,232,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em' }}>{t(lang, 'Antardasha', 'अंतर्दशा')}</p>
              <p style={{ color:'#A78BFA', fontSize:15, fontWeight:700, fontFamily:'Georgia,serif', marginTop:2 }}>{planetName(antar?.lord, lang) || '—'}</p>
              <p style={{ color:'rgba(245,240,232,0.68)', fontSize:9, marginTop:2 }}>{untilText(fmtDate(antar?.end), lang)}</p>
            </div>
          </div>

          {/* Combined meaning */}
          {period?.combined_en && (
            <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
              <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>
                📖 {lang==='hi' ? 'इस दशा का अर्थ' : 'What This Period Means'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.8)', fontSize:12.5, lineHeight:1.85 }}>
                {currentPeriodText(period, chart, lang)}
              </p>
            </div>
          )}

          {/* Mahadasha nature */}
          {period?.mahadasha?.nature && (
            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 12px' }}>
              <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, marginBottom:2 }}>
                {lang==='hi' ? 'महादशा की प्रकृति' : 'Mahadasha Nature'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12 }}>
                {lang === 'hi'
                  ? `${planetName(period.mahadasha.lord, 'hi')} की महादशा उसके कारकत्व, भाव स्थिति और बल के अनुसार जीवन की मुख्य दिशा को सक्रिय करती है।`
                  : period.mahadasha.nature}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
