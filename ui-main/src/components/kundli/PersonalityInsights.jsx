'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { t } from '../../lib/astroI18n';

const PI_TABS = [
  { key:'traits',  label:'Traits',  label_hi:'स्वभाव'    },
  { key:'career',  label:'Career',  label_hi:'करियर'     },
  { key:'health',  label:'Health',  label_hi:'स्वास्थ्य' },
];

export default function PersonalityInsights({ insight, chart, lang }) {
  const [tab, setTab] = useState('traits');
  if (!insight) return null;

  const nakName   = lang === 'hi' ? insight.name_hi    : insight.name;
  const deityName = lang === 'hi' ? insight.deity_hi   : insight.deity_en;
  const professions = lang === 'hi'
    ? (insight.professions_hi || [])
    : (insight.professions_en || []);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      className="card-royal p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            ✨ {lang==='hi' ? 'नक्षत्र अंतर्दृष्टि' : 'Nakshatra Insights'}
          </h2>
          <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, marginTop:2 }}>
            {nakName} {lang==='hi' ? '• देवता:' : '• Deity:'} {deityName}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {PI_TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{
              padding:'4px 12px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === tb.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === tb.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {lang==='hi' ? tb.label_hi : tb.label}
          </button>
        ))}
      </div>

      {/* Traits */}
      {tab === 'traits' && (
        <div className="space-y-4">
          <div>
            <p style={{ color:'#22C55E', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
              {lang==='hi' ? '✅ मुख्य गुण' : '✅ Core Traits'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
              {lang==='hi' ? insight.characteristics_hi : insight.characteristics_en}
            </p>
          </div>
          {(insight.negative_traits_en || insight.negative_traits_hi) && (
            <div>
              <p style={{ color:'#EF4444', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '⚠️ सावधानियां' : '⚠️ What to Avoid'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.negative_traits_hi : insight.negative_traits_en}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Career */}
      {tab === 'career' && (
        <div className="space-y-4">
          {professions.length > 0 ? professions.map((cat, i) => (
            <div key={i}>
              <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>
                {cat.category}
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(cat.roles || []).map((role, j) => (
                  <span key={j} style={{
                    padding:'3px 9px', borderRadius:12, fontSize:10, fontWeight:500,
                    background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)',
                    color:'rgba(245,240,232,0.7)', fontFamily:'var(--font-devanagari),Inter,sans-serif',
                  }}>{role}</span>
                ))}
              </div>
            </div>
          )) : (
            <p style={{ color:'rgba(245,240,232,0.68)', fontSize:12, textAlign:'center', padding:12 }}>
              {lang==='hi' ? 'डेटा उपलब्ध नहीं' : 'Career data not available. Recalculate chart.'}
            </p>
          )}
        </div>
      )}

      {/* Health */}
      {tab === 'health' && (
        <div className="space-y-4">
          {(insight.health_issues_en || insight.health_issues_hi) && (
            <div>
              <p style={{ color:'#F59E0B', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '🔶 स्वास्थ्य समस्याएं' : '🔶 Common Health Issues'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.health_issues_hi : insight.health_issues_en}
              </p>
            </div>
          )}
          {(insight.health_root_cause_en || insight.health_root_cause_hi) && (
            <div>
              <p style={{ color:'#94A3B8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '🔍 मूल कारण' : '🔍 Root Cause'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.health_root_cause_hi : insight.health_root_cause_en}
              </p>
            </div>
          )}
          {(insight.health_guidance_en || insight.health_guidance_hi) && (
            <div>
              <p style={{ color:'#22C55E', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '💚 स्वास्थ्य मार्गदर्शन' : '💚 Health Guidance'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.health_guidance_hi : insight.health_guidance_en}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
