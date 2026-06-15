'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import adminApi from '../lib/adminApi';

import LifeReportPanel     from '../components/LifeReportPanel';
import KundliInsightPanel  from '../components/KundliInsightPanel';
import PlanetImpactPanel   from '../components/PlanetImpactPanel';
import BhavaLordPanel      from '../components/BhavaLordPanel';
import LifeGuidancePanel   from '../components/LifeGuidancePanel';
import FavouriteDaysPanel  from '../components/FavouriteDaysPanel';
import TodayPredictionPanel from '../components/TodayPredictionPanel';
import CharaKarakaPanel     from '../components/CharaKarakaPanel';
import SadeSatiPanel        from '../components/SadeSatiPanel';
import YutiPanel            from '../components/YutiPanel';
import AstaVakriPanel       from '../components/AstaVakriPanel';
import RemedyManualPanel    from '../components/RemedyManualPanel';
import PlacementNarrativesPanel from '../components/PlacementNarrativesPanel';
import AvakahadaPanel       from '../components/AvakahadaPanel';
import DashaJourneyPanel    from '../components/DashaJourneyPanel';
import KundliSynthesisPanel from '../components/KundliSynthesisPanel';
import {
  PLANET_META,
  DIGNITY_STYLE,
  BHAVA_NATURE,
  MAIN_TABS,
} from '../components/kundli/kundliConstants';
import { ChartToggle, SouthIndianChart, NorthIndianChart } from '../components/kundli/KundliChart';
import BasicDetailsPanel    from '../components/kundli/BasicDetailsPanel';
import PersonalityInsights  from '../components/kundli/PersonalityInsights';
import LifePortraitPanel    from '../components/kundli/LifePortraitPanel';
import YogasAndDoshasPanel  from '../components/kundli/YogasAndDoshasPanel';
import DetailedReportsPanel from '../components/kundli/DetailedReportsPanel';
import VargaChartsPanel     from '../components/kundli/VargaChartsPanel';
import DrishtiHouseCard     from '../components/kundli/DrishtiHouseCard';
import {
  chartStyleLabel, houseLabel, localizeAstroText,
  planetName, predictionSummaryLines, t,
} from '../lib/astroI18n';

// ─── Admin Guide — collapsible panel ─────────────────────────────────────────
function AdminGuide({ title, children, defaultOpen = false, lang = 'en' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:10, marginBottom:20, overflow:'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>📚</span>
          <span style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:13, fontWeight:700 }}>
            {lang === 'hi' ? 'ज्योतिषी मार्गदर्शिका' : "Astrologer's Guide"}
          </span>
          <span style={{ color:'rgba(212,175,55,0.55)', fontSize:11 }}>— {title}</span>
        </div>
        <span style={{ color:'rgba(212,175,55,0.6)', fontSize:14, transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(212,175,55,0.12)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function GLine({ label, text, color = '#D4AF37' }) {
  return (
    <div style={{ marginBottom:8 }}>
      <span style={{ color, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}: </span>
      <span style={{ color:'rgba(245,240,232,0.7)', fontSize:12, lineHeight:'1.5' }}>{text}</span>
    </div>
  );
}

function GSection({ title, items }) {
  return (
    <div style={{ marginTop:12, marginBottom:4 }}>
      <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>{title}</p>
      {items.map((item, i) => (
        <div key={i} style={{ display:'flex', gap:8, marginBottom:5 }}>
          <span style={{ color:'rgba(212,175,55,0.5)', flexShrink:0, marginTop:1 }}>▸</span>
          <span style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:'1.5' }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Admin Strength Section ───────────────────────────────────────────────────
function AdminStrengthSection({ uuid, lang = 'en' }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi.get(`/admin/kundlis/${uuid}/strength`)
      .then(({ data: d }) => setData(d.strength || null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) return <p style={{ color:'rgba(245,240,232,0.3)', fontSize:13, padding:24 }}>⏳ Computing strength…</p>;
  if (error || !data) return <p style={{ color:'#F87171', fontSize:13, padding:24 }}>⚠ Could not load strength data</p>;

  const T = (en, hi) => lang === 'hi' ? hi : en;
  const score = data.overall_score ?? 0;
  const lbl   = data.label || {};
  const scoreColor = lbl.color || '#D4AF37';

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24 }}>

      {/* Header + Overall Score Ring */}
      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:16, fontWeight:700, marginBottom:4 }}>
            ⚡ {T('Kundli Strength Analysis', 'कुंडली बल विश्लेषण')}
          </h2>
          <p style={{ color:'rgba(245,240,232,0.45)', fontSize:12 }}>
            {T(`${data.yoga_count ?? 0} yogas · ${data.dosha_count ?? 0} doshas`, `${data.yoga_count ?? 0} योग · ${data.dosha_count ?? 0} दोष`)}
          </p>
        </div>
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{
            width:80, height:80, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            background:`conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
            boxShadow:`0 0 16px ${scoreColor}44`,
          }}>
            <div style={{ width:62, height:62, borderRadius:'50%', background:'#0D0F1F', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#F5F0E8', fontSize:18, fontWeight:700, lineHeight:1 }}>{score}</span>
              <span style={{ color:'rgba(245,240,232,0.3)', fontSize:9 }}>/100</span>
            </div>
          </div>
          <p style={{ color:scoreColor, fontSize:11, fontWeight:700, marginTop:6 }}>{T(lbl.en, lbl.hi)}</p>
        </div>
      </div>

      {/* Sub-scores row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
        {[
          { l:T('Planet Avg','ग्रह औसत'),   v: data.planet_avg  ?? '—' },
          { l:T('Yoga Score','योग स्कोर'),   v: data.yoga_score  ?? '—' },
          { l:T('Domain Avg','क्षेत्र औसत'), v: data.domain_avg  ?? '—' },
          { l:T('Dasha Score','दशा स्कोर'),  v: data.dasha_score ?? '—' },
        ].map(({ l, v }) => (
          <div key={l} style={{ background:'rgba(17,20,40,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
            <p style={{ color:'#D4AF37', fontSize:16, fontWeight:700, lineHeight:1 }}>{v}</p>
            <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Planet strength bars */}
      {data.planet_scores && Object.keys(data.planet_scores).length > 0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>
            {T('Planet Strengths (0–100)', 'ग्रह बल (0–100)')}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:8 }}>
            {Object.entries(data.planet_scores).map(([planet, val]) => {
              const meta = PLANET_META[planet] || {};
              const barColor = val >= 72 ? '#10B981' : val >= 58 ? '#22C55E' : val >= 44 ? '#F59E0B' : '#EF4444';
              return (
                <div key={planet} style={{ background:'rgba(17,20,40,0.7)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <span style={{ color:meta.color, fontSize:13 }}>{meta.icon}</span>
                    <span style={{ color:'#F5F0E8', fontSize:11, fontWeight:600 }}>
                      {lang === 'hi' ? (meta.hi || planet) : planet}
                    </span>
                    <span style={{ marginLeft:'auto', color:'rgba(245,240,232,0.45)', fontSize:10 }}>{val}</span>
                  </div>
                  <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
                    <div style={{ height:'100%', width:`${Math.min(100, val)}%`, background:barColor, borderRadius:2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Life domain grid */}
      {data.life_domain_list?.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>
            {T('Life Domains', 'जीवन क्षेत्र')}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
            {data.life_domain_list.map(d => (
              <div key={d.key} style={{ background:'rgba(17,20,40,0.7)', border:`1px solid ${d.label.color}44`, borderRadius:8, padding:'10px 12px' }}>
                <p style={{ color:'#F5F0E8', fontSize:11, fontWeight:600, marginBottom:6 }}>
                  {lang === 'hi' ? d.hi : d.en}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
                    <div style={{ height:'100%', width:`${d.score}%`, background:d.label.color, borderRadius:2 }} />
                  </div>
                  <span style={{ color:d.label.color, fontSize:10, fontWeight:700, flexShrink:0 }}>{d.score}</span>
                </div>
                <p style={{ color:d.label.color, fontSize:9, marginTop:4, fontWeight:600 }}>
                  {lang === 'hi' ? d.label.hi : d.label.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Dasha */}
      {(data.current_mahadasha || data.current_antardasha) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {data.current_mahadasha && (() => {
            const meta = PLANET_META[data.current_mahadasha.planet] || {};
            return (
              <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:8, padding:'12px 14px' }}>
                <p style={{ color:'rgba(212,175,55,0.6)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                  {T('Current Mahadasha', 'वर्तमान महादशा')}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:meta.color, fontSize:20 }}>{meta.icon}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ color:'#F5F0E8', fontSize:14, fontWeight:700 }}>
                      {lang === 'hi' ? data.current_mahadasha.planet_hi : data.current_mahadasha.planet}
                    </p>
                    <p style={{ color:'rgba(245,240,232,0.3)', fontSize:10 }}>→ {data.current_mahadasha.end_date}</p>
                  </div>
                  <span style={{ color:meta.color || '#D4AF37', fontWeight:700, fontSize:14 }}>{data.current_mahadasha.score}</span>
                </div>
              </div>
            );
          })()}
          {data.current_antardasha && (() => {
            const meta = PLANET_META[data.current_antardasha.planet] || {};
            return (
              <div style={{ background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:8, padding:'12px 14px' }}>
                <p style={{ color:'rgba(167,139,250,0.6)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                  {T('Current Antardasha', 'वर्तमान अंतर्दशा')}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:meta.color, fontSize:20 }}>{meta.icon}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ color:'#F5F0E8', fontSize:14, fontWeight:700 }}>
                      {lang === 'hi' ? data.current_antardasha.planet_hi : data.current_antardasha.planet}
                    </p>
                    <p style={{ color:'rgba(245,240,232,0.3)', fontSize:10 }}>→ {data.current_antardasha.end_date}</p>
                  </div>
                  <span style={{ color:meta.color || '#A78BFA', fontWeight:700, fontSize:14 }}>{data.current_antardasha.score}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Strengths */}
      {data.strengths_en?.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <p style={{ color:'rgba(16,185,129,0.8)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>
            {T('Strengths', 'शक्तियां')}
          </p>
          {(lang === 'hi' ? (data.strengths_hi?.length ? data.strengths_hi : data.strengths_en) : data.strengths_en).map((s, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
              <span style={{ color:'#10B981', fontSize:13, flexShrink:0 }}>✓</span>
              <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.5 }}>{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Challenges */}
      {data.challenges_en?.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <p style={{ color:'rgba(239,68,68,0.8)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>
            {T('Challenges', 'चुनौतियां')}
          </p>
          {(lang === 'hi' ? (data.challenges_hi?.length ? data.challenges_hi : data.challenges_en) : data.challenges_en).map((s, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
              <span style={{ color:'#EF4444', fontSize:13, flexShrink:0 }}>⚠</span>
              <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.5 }}>{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Verdict */}
      {(data.verdict_en || data.verdict_hi) && (
        <div style={{ padding:'12px 16px', background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:8 }}>
          <p style={{ color:'rgba(245,240,232,0.8)', fontSize:12, lineHeight:1.7 }}>
            {lang === 'hi' ? (data.verdict_hi || data.verdict_en) : data.verdict_en}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Admin Varshphal Section ──────────────────────────────────────────────────
const PC = { Sun:'#F59E0B', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#22C55E', Jupiter:'#F59E0B', Venus:'#EC4899', Saturn:'#6366F1', Rahu:'#A78BFA', Ketu:'#D97706' };
const TONE_STYLE = {
  favorable:   { color:'#22C55E', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.3)' },
  challenging: { color:'#EF4444', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.3)' },
  moderate:    { color:'#F59E0B', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.3)' },
};

function AdminVarshphalSection({ uuid }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());

  const fetchVarshphal = useCallback(() => {
    setLoading(true);
    setError(false);
    adminApi.get(`/admin/kundlis/${uuid}/varshphal`, { params: { year: targetYear } })
      .then(({ data: d }) => setData(d.varshphal || null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [uuid, targetYear]);

  useEffect(() => { fetchVarshphal(); }, [fetchVarshphal]);

  if (loading) return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:32, textAlign:'center' }}>
      <p style={{ color:'rgba(212,175,55,0.4)', fontSize:13 }}>⏳ Computing Varshphal for {targetYear}…</p>
    </div>
  );
  if (error || !data) return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, textAlign:'center' }}>
      <p style={{ color:'#F87171', fontSize:13, marginBottom:10 }}>⚠ Could not load Varshphal data</p>
      <button onClick={fetchVarshphal} style={{ padding:'6px 14px', borderRadius:6, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:12, cursor:'pointer' }}>↺ Retry</button>
    </div>
  );

  const vc  = data.varsha_chart;
  const a   = data.analysis;
  const curMudda = data.mudda_dasha?.find(m => m.is_current);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Header + year selector ── */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.2)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:18, fontWeight:700, marginBottom:4 }}>
            📅 Varshphal — Solar Return {data.target_year}
          </h2>
          {vc && (
            <p style={{ color:'rgba(245,240,232,0.4)', fontSize:12 }}>
              Solar Return: {vc.sr_date} · {vc.sr_weekday} · {vc.sr_local?.split(' ')[1]} IST
            </p>
          )}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setTargetYear(y => y - 1)}
            style={{ padding:'6px 12px', borderRadius:6, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.25)', color:'#D4AF37', cursor:'pointer', fontSize:13, fontWeight:700 }}>←</button>
          <span style={{ color:'#D4AF37', fontSize:16, fontWeight:700, minWidth:48, textAlign:'center' }}>{targetYear}</span>
          <button onClick={() => setTargetYear(y => y + 1)}
            style={{ padding:'6px 12px', borderRadius:6, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.25)', color:'#D4AF37', cursor:'pointer', fontSize:13, fontWeight:700 }}>→</button>
        </div>
      </div>

      {/* ── Key stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
        {[
          { label:'Varsha Lagna', v: vc?.ascendant?.rashi_en || '—', c:'#D4AF37' },
          { label:'Varshesha (Year Lord)', v: data.varshesha || '—', c: PC[data.varshesha] || '#D4AF37' },
          { label:'Year Lord in', v: a?.varshesha_house ? `${a.varshesha_house}th House` : '—', c:'rgba(245,240,232,0.7)' },
          { label:'Overall Score', v: a?.score ? `${a.score} / 5` : '—', c: a?.score >= 4 ? '#22C55E' : a?.score >= 3 ? '#F59E0B' : '#EF4444' },
          { label:'Current Mudda', v: curMudda?.planet || '—', c: PC[curMudda?.planet] || '#D4AF37' },
          { label:'Mudda Ends', v: curMudda?.end_date || '—', c:'rgba(245,240,232,0.5)' },
        ].map(({ label, v, c }) => (
          <div key={label} style={{ padding:'12px 14px', borderRadius:8, background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.12)', textAlign:'center' }}>
            <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>{label}</p>
            <p style={{ color:c, fontSize:14, fontWeight:700, lineHeight:1.2 }}>{v}</p>
          </div>
        ))}
      </div>

      {/* ── Year summary ── */}
      {a?.year_summary_en && (
        <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Year Overview</p>
          <p style={{ color:'rgba(245,240,232,0.78)', fontSize:13, lineHeight:1.7 }}>{a.year_summary_en}</p>
        </div>
      )}

      {/* ── Varshesha description ── */}
      {a?.varshesha_desc_en && (
        <div style={{ background:'rgba(17,20,40,0.8)', border:`1px solid ${PC[data.varshesha] || '#D4AF37'}33`, borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color: PC[data.varshesha] || '#D4AF37', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
            {PLANET_META[data.varshesha]?.icon} Varshesha: {data.varshesha} in {a.varshesha_house ? `${a.varshesha_house}th House` : ''}
          </p>
          <p style={{ color:'rgba(245,240,232,0.72)', fontSize:13, lineHeight:1.6 }}>{a.varshesha_desc_en}</p>
        </div>
      )}

      {/* ── Key indicators ── */}
      {a?.indicators_en?.length > 0 && (
        <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>Key Chart Indicators</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {a.indicators_en.map((ind, i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <span style={{ color:'#D4AF37', flexShrink:0, marginTop:2 }}>▸</span>
                <span style={{ color:'rgba(245,240,232,0.7)', fontSize:13, lineHeight:1.5 }}>{ind}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Life Areas ── */}
      {a?.life_areas && Object.keys(a.life_areas).length > 0 && (
        <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>Life Area Forecasts</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
            {Object.values(a.life_areas).map((area) => {
              const ts = TONE_STYLE[area.tone] || TONE_STYLE.moderate;
              return (
                <div key={area.title_en} style={{ borderRadius:8, border:`1px solid ${ts.border}`, background: ts.bg, padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:16 }}>{area.icon}</span>
                      <span style={{ color:'#F5F0E8', fontSize:12, fontWeight:600 }}>{area.title_en}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {area.score && (
                        <span style={{ color: ts.color, fontSize:11, fontWeight:700 }}>{area.score}/5</span>
                      )}
                      <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:700, color: ts.color, background:`${ts.color}22`, border:`1px solid ${ts.border}`, textTransform:'uppercase' }}>
                        {area.tone}
                      </span>
                    </div>
                  </div>
                  <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.55 }}>{area.reading_en}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Planet positions in Varsha chart ── */}
      {vc?.planets && (
        <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>Solar Return Planet Positions</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
            {Object.entries(vc.planets).map(([planet, pd]) => (
              <div key={planet} style={{ padding:'10px 12px', borderRadius:7, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                  <span style={{ color: PC[planet]||'#D4AF37', fontSize:13 }}>{PLANET_META[planet]?.icon}</span>
                  <span style={{ color: PC[planet]||'#D4AF37', fontSize:11, fontWeight:700 }}>{planet}</span>
                  {pd.is_retrograde && <span style={{ color:'#F97316', fontSize:9, fontWeight:700 }}>℞</span>}
                </div>
                <p style={{ color:'rgba(245,240,232,0.7)', fontSize:11, fontWeight:500 }}>{pd.rashi_en}</p>
                <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, marginTop:2 }}>{pd.house_label} House</p>
                <p style={{ color:'rgba(245,240,232,0.25)', fontSize:9, fontFamily:'monospace' }}>{pd.dms}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mudda Dasha ── */}
      {data.mudda_dasha?.length > 0 && (
        <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>
            Mudda Dasha — Annual Sub-Periods
            {curMudda && <span style={{ color:'rgba(212,175,55,0.4)', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:8 }}>Current: {curMudda.planet}</span>}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
            {data.mudda_dasha.map((m, i) => {
              const isCur = m.is_current;
              return (
                <div key={i} style={{ borderRadius:8, border:`1px solid ${isCur ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`, background: isCur ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)', padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ color: PC[m.planet]||'#D4AF37', fontSize:13 }}>{PLANET_META[m.planet]?.icon}</span>
                      <span style={{ color: PC[m.planet]||'#D4AF37', fontSize:12, fontWeight:700 }}>{m.planet}</span>
                    </div>
                    {isCur && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:8, fontWeight:700, background:'rgba(212,175,55,0.2)', color:'#D4AF37', textTransform:'uppercase' }}>NOW</span>}
                  </div>
                  <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, fontFamily:'monospace' }}>{m.start_date}</p>
                  <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, fontFamily:'monospace' }}>→ {m.end_date}</p>
                  <p style={{ color:'rgba(245,240,232,0.2)', fontSize:9, marginTop:3 }}>{m.days?.toFixed(0)} days</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── House readings ── */}
      {a?.house_readings && Object.keys(a.house_readings).length > 0 && (
        <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>Varsha House Readings</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
            {Object.values(a.house_readings).map((hr) => {
              const ts = TONE_STYLE[hr.tone] || TONE_STYLE.moderate;
              return (
                <div key={hr.house} style={{ borderRadius:8, border:`1px solid ${ts.border}40`, background:`${ts.bg}`, padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ color:'rgba(212,175,55,0.7)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                      House {hr.house} — {hr.theme}
                    </span>
                    <span style={{ fontSize:9, padding:'1px 6px', borderRadius:8, fontWeight:700, color: ts.color, background:`${ts.color}18`, border:`1px solid ${ts.border}`, textTransform:'uppercase' }}>
                      {hr.tone}
                    </span>
                  </div>
                  {hr.occupants?.length > 0 && (
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                      {hr.occupants.map(p => (
                        <span key={p} style={{ fontSize:10, color: PC[p]||'#D4AF37', fontWeight:600 }}>
                          {PLANET_META[p]?.icon} {p}
                        </span>
                      ))}
                    </div>
                  )}
                  <p style={{ color:'rgba(245,240,232,0.62)', fontSize:11, lineHeight:1.55 }}>{hr.reading_en}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Planet movement (natal → varsha) ── */}
      {a?.planet_movement && Object.keys(a.planet_movement).length > 0 && (
        <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:10, padding:'14px 16px' }}>
          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>Planet Movement — Natal → Solar Return House</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {Object.entries(a.planet_movement).map(([planet, mv]) => (
              <div key={planet} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 10px', borderRadius:7, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: PC[planet]||'#D4AF37', fontSize:13, width:16, flexShrink:0 }}>{PLANET_META[planet]?.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ color: PC[planet]||'#D4AF37', fontSize:11, fontWeight:700 }}>{planet}</span>
                    <span style={{ color:'rgba(245,240,232,0.3)', fontSize:10, fontFamily:'monospace' }}>
                      {mv.natal_rashi} (H{mv.natal_house}) → {mv.varsha_rashi} (H{mv.varsha_house})
                    </span>
                  </div>
                  <p style={{ color:'rgba(245,240,232,0.6)', fontSize:11, lineHeight:1.45 }}>{mv.movement_en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Owner Banner ─────────────────────────────────────────────────────────────
function OwnerBanner({ owner }) {
  if (!owner) return null;
  return (
    <div style={{ background:'rgba(96,165,250,0.07)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:16 }}>👤</span>
      <div>
        <span style={{ color:'#60A5FA', fontSize:12, fontWeight:600 }}>{owner.name}</span>
        <span style={{ color:'rgba(245,240,232,0.4)', fontSize:11 }}> · {owner.email}</span>
        {!owner.is_active && (
          <span style={{ marginLeft:8, fontSize:9, padding:'1px 6px', borderRadius:8, background:'rgba(239,68,68,0.15)', color:'#F87171', fontWeight:700 }}>INACTIVE</span>
        )}
      </div>
      <span style={{ marginLeft:'auto', fontSize:10, color:'rgba(245,240,232,0.25)' }}>Account owner</span>
    </div>
  );
}

// ── Lang toggle ───────────────────────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  return (
    <div style={{ display:'flex', borderRadius:7, overflow:'hidden', border:'1px solid rgba(212,175,55,0.25)' }}>
      {['en','hi'].map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{
            padding:'5px 12px', fontSize:11, fontWeight:700, border:'none', cursor:'pointer',
            background: lang === l ? 'rgba(212,175,55,0.2)' : 'transparent',
            color: lang === l ? '#D4AF37' : 'rgba(245,240,232,0.4)',
            transition:'all 0.15s',
          }}>
          {l === 'en' ? 'EN' : 'हि'}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function KundliAdminDetail({ kundliUuid }) {
  const router    = useRouter();
  const [lang,    setLang]    = useState('en');

  const [kundli,       setKundli]       = useState(null);
  const [chartEnrich,  setChartEnrich]  = useState(null);
  const [fetching,     setFetching]     = useState(true);
  const [error,        setError]        = useState(null);
  const [recalcing,    setRecalcing]    = useState(false);
  const [activeTab,    setActiveTab]    = useState('kundli');
  const [chartStyle,   setChartStyle]   = useState('north');

  // Astrologer's Guide translation helper — picks Hindi when the admin toggles to हि
  const G = (en, hi) => (lang === 'hi' ? hi : en);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kundli_chart_style') : null;
    if (saved === 'south' || saved === 'north') setChartStyle(saved);
  }, []);

  const handleStyleChange = (s) => {
    setChartStyle(s);
    localStorage.setItem('kundli_chart_style', s);
  };

  useEffect(() => {
    if (!kundliUuid) return;
    setFetching(true);
    adminApi.get(`/admin/kundlis/${kundliUuid}`)
      .then(({ data }) => {
        setKundli(data.profile);
        setChartEnrich(data.profile?.chart_enrichment || null);
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load Kundli'))
      .finally(() => setFetching(false));
  }, [kundliUuid]);

  const handleRecalc = async () => {
    setRecalcing(true);
    try {
      await adminApi.post(`/admin/kundlis/${kundliUuid}/recalculate`);
      // Re-fetch after recalculation
      const { data } = await adminApi.get(`/admin/kundlis/${kundliUuid}`);
      setKundli(data.profile);
      setChartEnrich(data.profile?.chart_enrichment || null);
      toast.success('Kundli recalculated successfully');
    } catch { toast.error('Recalculation failed'); }
    finally { setRecalcing(false); }
  };

  // ── Loading / Error
  if (fetching) {
    return (
      <div style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🪐</div>
          <p style={{ color:'rgba(212,175,55,0.4)', fontSize:13 }}>Loading Kundli…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', padding:32 }}>
          <p style={{ fontSize:36, marginBottom:12 }}>❌</p>
          <p style={{ color:'#F87171', fontSize:14, marginBottom:8 }}>{error}</p>
          <button onClick={() => router.push('/admin/kundlis')}
            style={{ padding:'7px 18px', borderRadius:6, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:12, cursor:'pointer' }}>
            ← Back to Kundli Profiles
          </button>
        </div>
      </div>
    );
  }
  if (!kundli) return null;

  let chart = null;
  try {
    chart = kundli.calculated_data
      ? (typeof kundli.calculated_data === 'string' ? JSON.parse(kundli.calculated_data) : kundli.calculated_data)
      : null;
  } catch {}

  const dob      = String(kundli.date_of_birth).slice(0, 10);
  const curDasha = chart?.dasha?.find(d => d.is_current) || chart?.dasha?.[0];

  // ─── Planet table helpers (same as KundliDetail)
  const AWASTHA_COLOR = { Bala:'#60A5FA', Kumara:'#22C55E', Yuva:'#FBBF24', Vridha:'#F97316', Mrit:'#EF4444' };
  const houseForRashi = (rNum) => {
    if (!chart?.houses) return null;
    const entry = Object.entries(chart.houses).find(([, h]) => h.rashi_num === rNum);
    return entry ? parseInt(entry[0]) : null;
  };
  const fmtSpeed = (dm) => dm !== undefined ? parseFloat(dm.toFixed(2)).toString() : '0.00';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:6 }}>
        <button onClick={() => router.push('/admin/kundlis')}
          style={{ background:'none', border:'none', color:'rgba(212,175,55,0.5)', cursor:'pointer', fontSize:12, padding:0, marginBottom:12 }}>
          ← {lang === 'hi' ? 'कुंडली सूची पर वापस' : 'Back to Kundli Profiles'}
        </button>
      </div>

      <OwnerBanner owner={kundli.owner} />

      {/* Kundli header card */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.2)', borderRadius:12, padding:20, marginBottom:20, display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🪐</div>
          <div>
            <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:2 }}>{kundli.name}</h1>
            <p style={{ color:'rgba(245,240,232,0.4)', fontSize:12 }}>
              {dob} · {kundli.time_of_birth?.slice(0,5)} · {kundli.place_of_birth}
            </p>
            {chart?.meta && (
              <p style={{ color:'rgba(245,240,232,0.2)', fontSize:10, fontFamily:'monospace', marginTop:2 }}>
                {chart.meta.system} · Ayanamsa {chart.meta.ayanamsa_dms} · JD {chart.meta.julian_day}
              </p>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <LangToggle lang={lang} setLang={setLang} />
          <button onClick={handleRecalc} disabled={recalcing}
            style={{ padding:'7px 14px', borderRadius:7, fontSize:12, fontWeight:600, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.35)', color:'#D4AF37', cursor: recalcing ? 'not-allowed' : 'pointer', opacity: recalcing ? 0.6 : 1 }}>
            {recalcing ? (lang === 'hi' ? '⏳ पुनः गणना हो रही है…' : '⏳ Recalculating…') : (lang === 'hi' ? '🔄 पुनः गणना' : '🔄 Recalculate')}
          </button>
          <button onClick={async () => {
              try {
                const r = await adminApi.get(`/admin/kundlis/${kundliUuid}/report.pdf`, { responseType: 'blob' });
                const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url; a.download = `${kundli?.name || 'kundli'}-report.pdf`; a.click();
                URL.revokeObjectURL(url);
              } catch { toast.error('Unable to download PDF'); }
            }}
            style={{ padding:'7px 14px', borderRadius:7, fontSize:12, fontWeight:600, background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.35)', color:'#60A5FA', cursor:'pointer' }}>
            📄 {lang === 'hi' ? 'PDF रिपोर्ट' : 'PDF Report'}
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ overflowX:'auto', marginBottom:20 }}>
        <div style={{ display:'flex', gap:4, minWidth:'max-content', paddingBottom:4 }}>
          {MAIN_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding:'7px 13px', borderRadius:8, fontSize:11, fontWeight: activeTab === tab.key ? 700 : 500,
                background: activeTab === tab.key ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === tab.key ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.1)'}`,
                color: activeTab === tab.key ? '#D4AF37' : 'rgba(245,240,232,0.55)',
                cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
              }}>
              {tab.icon} {lang === 'hi' ? (tab.hi || tab.en) : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: KUNDLI ═══════════════════════════════════════════════════════ */}
      {activeTab === 'kundli' && (
        <TodayPredictionPanel uuid={kundliUuid} lang={lang} admin />
      )}

      {activeTab === 'kundli' && (
        <div>
          <AdminGuide lang={lang} title={G('Birth Chart Interpretation', 'जन्म कुंडली व्याख्या')}>
            <GLine label={G('What this shows', 'यह क्या दर्शाता है')} text={G(
              "The D1 (Lagna/Rashi) chart is the foundational birth chart. It maps the sky at the exact moment of birth. Each of the 12 houses governs a life domain; planets in those houses color the results.",
              "D1 (लग्न/राशि) कुंडली मूल जन्म कुंडली है। यह जन्म के ठीक क्षण के आकाश का मानचित्र है। 12 भावों में से प्रत्येक एक जीवन क्षेत्र का स्वामी होता है; उन भावों में स्थित ग्रह फलों को प्रभावित करते हैं।"
            )} />
            <GLine label={G('Ascendant (Lagna)', 'लग्न')} text={G(
              "The rising sign at birth — defines the person's physical body, personality, and the lens through which all chart results manifest. Most important point in the chart.",
              "जन्म के समय उदित होती राशि — व्यक्ति के शरीर, व्यक्तित्व, और उस दृष्टिकोण को परिभाषित करती है जिससे कुंडली के सभी फल प्रकट होते हैं। कुंडली का सबसे महत्वपूर्ण बिंदु।"
            )} color="#A78BFA" />
            <GLine label={G('Navamsha (D9)', 'नवांश (D9)')} text={G(
              "The 9th divisional chart. Reveals marriage, dharma, and the deeper soul purpose. After 35 years, the D9 becomes as important as D1 for predicting outcomes.",
              "9वीं विभागीय कुंडली। विवाह, धर्म, और आत्मा के गहरे उद्देश्य को प्रकट करती है। 35 वर्ष के बाद, फल कथन के लिए D9, D1 जितनी ही महत्वपूर्ण हो जाती है।"
            )} color="#60A5FA" />
            <GSection title={G('Dasha Timeline', 'दशा समयरेखा')} items={[
              G("Vimshottari Dasha runs on a 120-year cycle based on Moon's nakshatra at birth.",
                "विंशोत्तरी दशा जन्म के समय चंद्रमा के नक्षत्र के आधार पर 120-वर्ष के चक्र पर चलती है।"),
              G("Mahadasha (major period) sets the overarching theme; Antardasha (sub-period) activates specific planets.",
                "महादशा (मुख्य काल) समग्र विषय तय करती है; अंतर्दशा (उप-काल) विशिष्ट ग्रहों को सक्रिय करती है।"),
              G("A planet in a good house, with good dignity, in its own Dasha = powerful results.",
                "शुभ भाव में, अच्छी अवस्था वाला ग्रह, अपनी दशा में = शक्तिशाली फल।"),
              G("Pratyantardasha and Sookshmadasha are useful for pinpointing event windows within days/weeks.",
                "प्रत्यंतर्दशा और सूक्ष्मदशा दिनों/सप्ताहों के भीतर घटनाओं का सटीक समय निर्धारित करने में उपयोगी हैं।"),
            ]} />
            <GSection title={G('Reading Planet Dignity', 'ग्रह अवस्था पढ़ना')} items={[
              G("Exalted (Uccha): Planet at its strongest. Powerful, benefic results.",
                "उच्च: ग्रह अपनी सबसे प्रबल अवस्था में। शक्तिशाली, शुभ फल।"),
              G("Own Sign (Swa): Second-strongest. Planet acts reliably in its own domain.",
                "स्वगृह: दूसरी सबसे प्रबल अवस्था। ग्रह अपने क्षेत्र में विश्वसनीय रूप से फल देता है।"),
              G("Moolatrikona: Near own sign in strength. Generally positive.",
                "मूलत्रिकोण: स्वगृह के निकट बल वाला। सामान्यतः सकारात्मक।"),
              G("Friendly Sign: Moderately strong. Good results with some variation.",
                "मित्र राशि: मध्यम बल। कुछ भिन्नता के साथ अच्छे फल।"),
              G("Neutral Sign: Average strength. Results are mixed.",
                "सम राशि: औसत बल। फल मिश्रित होते हैं।"),
              G("Enemy Sign: Weakened. May give delayed or troubled results.",
                "शत्रु राशि: कमजोर। विलंबित या कष्टप्रद फल दे सकता है।"),
              G("Debilitated (Neecha): Weakest placement. BUT check for Neecha Bhanga — cancellation of debility by specific combinations can make such planets very powerful.",
                "नीच: सबसे कमजोर स्थिति। परंतु नीच भंग की जाँच करें — विशिष्ट योगों द्वारा नीचता का रद्द होना ऐसे ग्रहों को अत्यंत शक्तिशाली बना सकता है।"),
            ]} />
            <GLine label={G('Combust (Asta)', 'अस्त')} text={G(
              "Planets within BPHS prescribed orb of the Sun lose strength and independence. Their significations are overshadowed by solar themes (ego, authority).",
              "सूर्य की BPHS-निर्धारित सीमा के भीतर के ग्रह बल और स्वतंत्रता खो देते हैं। उनके कारकत्व सूर्य के विषयों (अहंकार, अधिकार) से ढक जाते हैं।"
            )} color="#F59E0B" />
            <GLine label={G('Retrograde (Vakri)', 'वक्री')} text={G(
              "Retrograde planets are internalized — their energy turns inward. Often indicates delayed but ultimately stronger results in that planet's period. Check natal house position carefully.",
              "वक्री ग्रह अंतर्मुखी होते हैं — उनकी ऊर्जा भीतर की ओर मुड़ती है। प्रायः उस ग्रह की दशा में विलंबित परंतु अंततः प्रबल फल दर्शाते हैं। जन्म कुंडली में भाव स्थिति की सावधानी से जाँच करें।"
            )} color="#F97316" />
          </AdminGuide>

          <div style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:24 }}>
            {/* Left col */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Chart */}
              <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
                <ChartToggle style={chartStyle} onChange={handleStyleChange} lang={lang} />
                <p style={{ fontFamily:'Georgia,serif', color:'#D4AF37', fontSize:13, fontWeight:600, textAlign:'center', marginBottom:12 }}>
                  🔯 Lagna Chart (D1)
                  <span style={{ color:'rgba(212,175,55,0.4)', fontSize:10, marginLeft:6, fontFamily:'sans-serif', fontWeight:400 }}>
                    {chartStyleLabel(chartStyle, lang)}
                  </span>
                </p>
                <AnimatePresence mode="wait">
                  <motion.div key={chartStyle} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                    {chartStyle === 'south' ? <SouthIndianChart chart={chart} lang={lang} /> : <NorthIndianChart chart={chart} lang={lang} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navamsha */}
              {chart?.navamsha && (
                <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
                  <p style={{ fontFamily:'Georgia,serif', color:'#D4AF37', fontSize:13, fontWeight:600, textAlign:'center', marginBottom:12 }}>
                    🔯 D9 Navamsha
                    <span style={{ color:'rgba(212,175,55,0.4)', fontSize:10, marginLeft:6, fontFamily:'sans-serif', fontWeight:400 }}>
                      {chart.navamsha.ascendant?.rashi_en} Lagna · {chartStyleLabel(chartStyle, lang)}
                    </span>
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div key={`nav-${chartStyle}`} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                      {chartStyle === 'south' ? <SouthIndianChart chart={chart.navamsha} lang={lang} /> : <NorthIndianChart chart={chart.navamsha} lang={lang} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* Quick stats */}
              {chart && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { l: lang==='hi' ? 'लग्न'    : 'Ascendant', v: lang==='hi' ? (chart.ascendant.rashi_hi  || chart.ascendant.rashi_en)      : chart.ascendant.rashi_en,      s: chart.ascendant.degree_in_sign_dms,        c:'#D4AF37' },
                    { l: lang==='hi' ? 'नक्षत्र' : 'Nakshatra', v: lang==='hi' ? (chart.nakshatra.hi        || chart.nakshatra.en)             : chart.nakshatra.en,             s: `${lang==='hi'?'पाद':'Pada'} ${chart.nakshatra.pada}`, c:'#A78BFA' },
                    { l: lang==='hi' ? 'चंद्र'   : 'Moon',      v: lang==='hi' ? (chart.planets.Moon.rashi_hi || chart.planets.Moon.rashi_en) : chart.planets.Moon.rashi_en, s: chart.planets.Moon.degree_in_sign_dms, c:'#94A3B8' },
                    { l: lang==='hi' ? 'सूर्य'   : 'Sun',       v: lang==='hi' ? (chart.planets.Sun.rashi_hi  || chart.planets.Sun.rashi_en)  : chart.planets.Sun.rashi_en,  s: chart.planets.Sun.degree_in_sign_dms,  c:'#F59E0B' },
                  ].map(({ l, v, s, c }) => (
                    <div key={l} style={{ background:'rgba(17,20,40,0.7)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:12, textAlign:'center' }}>
                      <p style={{ color:c, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, lineHeight:1.2 }}>{v}</p>
                      <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, marginTop:2 }}>{s}</p>
                      <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, marginTop:3 }}>{l}</p>
                    </div>
                  ))}
                </div>
              )}
              <BasicDetailsPanel kundli={kundli} chart={chart} lang={lang} />
            </div>

            {/* Right col */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Planet table */}
              {chart && (() => {
                const PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
                const asc = chart.ascendant;
                const ascRow = {
                  name:'Ascendant', nameHi:'लग्न', icon:'⊕', color:'#D4AF37',
                  fullDeg: asc.longitude_dms, normDeg: asc.degree_in_sign_dms,
                  speed:'0.00', retro:false, sign: asc.rashi_en, signLord: asc.rashi_lord,
                  nak: asc.nakshatra_en||'—', nakLord: asc.nakshatra_lord||'—',
                  pada: asc.nakshatra_pada??'—', house:1, combust:false, awastha:'—',
                  dignityLbl:null, ds:null, strength:null,
                };
                const planetRows = PLANET_ORDER.map(name => {
                  const pd = chart.planets[name];
                  if (!pd) return null;
                  const meta = PLANET_META[name] || {};
                  return {
                    name, nameHi: meta.hi || name, icon: meta.icon || '●', color: meta.color || '#9CA3AF',
                    fullDeg: pd.longitude_dms, normDeg: pd.degree_in_sign_dms,
                    speed: fmtSpeed(pd.daily_motion), retro: pd.is_retrograde,
                    sign: pd.rashi_en, signLord: pd.rashi_lord,
                    nak: pd.nakshatra_en||'—', nakLord: pd.nakshatra_lord||'—',
                    pada: pd.nakshatra_pada??'—', house: houseForRashi(pd.rashi_num),
                    combust: pd.is_combust||false, awastha: pd.awastha||'—', awasthaHi: pd.awastha_hi||'—',
                    dignityLbl: pd.dignity, ds: DIGNITY_STYLE[pd.dignity]||DIGNITY_STYLE.Neutral, strength: pd.dignity_strength,
                  };
                }).filter(Boolean);
                const allRows = [ascRow, ...planetRows];
                const th = { padding:'8px 10px', textAlign:'left', color:'rgba(212,175,55,0.5)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap', borderBottom:'1px solid rgba(212,175,55,0.12)' };
                const td = { padding:'7px 10px', color:'rgba(245,240,232,0.65)', fontSize:10, whiteSpace:'nowrap' };

                return (
                  <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
                    <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:14, fontWeight:700, marginBottom:14 }}>🌌 {lang==='hi' ? 'ग्रह स्थिति' : 'Planet Positions'}</h2>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:860 }}>
                        <thead>
                          <tr>
                            {['Planet','Full Deg','Norm. Deg','Speed','R','Sign','Sign Lord','Nakshatra','Nak Lord','Pada','House','Combust','Awastha'].map(h => (
                              <th key={h} style={th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allRows.map(row => (
                            <tr key={row.name} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ ...td, padding:'8px 10px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  <span style={{ color:row.color, fontSize:12, width:14 }}>{row.icon}</span>
                                  <div>
                                    <p style={{ color:row.color, fontSize:11, fontWeight:600 }}>{row.name}</p>
                                    <p style={{ color:'rgba(245,240,232,0.25)', fontSize:9 }}>{row.nameHi}</p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...td, fontFamily:'monospace' }}>{row.fullDeg}</td>
                              <td style={{ ...td, fontFamily:'monospace' }}>{row.normDeg}</td>
                              <td style={{ ...td, fontFamily:'monospace', color: row.retro?'#F97316':undefined }}>{row.speed}</td>
                              <td style={td}>
                                {row.retro ? <span style={{ color:'#F87171', fontWeight:700 }}>℞</span> : <span style={{ color:'rgba(245,240,232,0.25)' }}>—</span>}
                              </td>
                              <td style={td}>{row.sign}</td>
                              <td style={{ ...td, color:(PLANET_META[row.signLord]||{}).color||'#9CA3AF' }}>{row.signLord}</td>
                              <td style={td}>{row.nak}</td>
                              <td style={{ ...td, color:(PLANET_META[row.nakLord]||{}).color||'#9CA3AF' }}>{row.nakLord !== '—' ? row.nakLord : '—'}</td>
                              <td style={td}>{row.pada !== '—' ? <span style={{ background:'rgba(255,255,255,0.08)', borderRadius:4, padding:'1px 5px' }}>{row.pada}</span> : '—'}</td>
                              <td style={td}>{row.house ? houseLabel(String(row.house), lang) : '—'}</td>
                              <td style={td}>
                                {row.name === 'Sun' || row.name === 'Ascendant'
                                  ? <span style={{ color:'rgba(245,240,232,0.2)' }}>—</span>
                                  : row.combust
                                    ? <span style={{ color:'#EF4444', fontWeight:700 }}>☉ Yes</span>
                                    : <span style={{ color:'rgba(245,240,232,0.3)' }}>No</span>}
                              </td>
                              <td style={td}>
                                {row.awastha !== '—'
                                  ? <span style={{ fontSize:9, padding:'2px 6px', borderRadius:10, fontWeight:600, background:`${AWASTHA_COLOR[row.awastha]||'#9CA3AF'}22`, color: AWASTHA_COLOR[row.awastha]||'#9CA3AF' }}>
                                      {row.awastha}
                                    </span>
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Dasha timeline */}
              {chart?.dasha && (
                <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
                  <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:14, fontWeight:700, marginBottom:14 }}>
                    ⏳ {lang==='hi' ? 'विंशोत्तरी दशा' : 'Vimshottari Dasha'}
                    {curDasha && <span style={{ color:'rgba(212,175,55,0.4)', fontSize:10, fontFamily:'sans-serif', fontWeight:400, marginLeft:8 }}>{lang==='hi' ? 'वर्तमान' : 'Current'}: {curDasha.lord}</span>}
                  </h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {chart.dasha.map((d, i) => {
                      const meta  = PLANET_META[d.lord] || {};
                      const isCur = d.is_current;
                      const today = new Date(), start = new Date(d.start), end = new Date(d.end);
                      const pct   = isCur ? Math.min(100, Math.max(0, (today - start) / (end - start) * 100)) : 0;
                      return (
                        <div key={i} style={{ position:'relative', display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:6, overflow:'hidden', border:`1px solid ${isCur ? 'rgba(212,175,55,0.3)' : 'transparent'}`, background: isCur ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)' }}>
                          {isCur && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, opacity:0.08, background:'linear-gradient(90deg,#D4AF37,transparent)', pointerEvents:'none' }} />}
                          <span style={{ color:meta.color, fontSize:14, width:18, textAlign:'center', flexShrink:0 }}>{meta.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                              <span style={{ color:'#F5F0E8', fontSize:12, fontWeight:600 }}>{d.lord}</span>
                              {isCur && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, fontWeight:700, background:'rgba(212,175,55,0.2)', color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.08em' }}>NOW</span>}
                            </div>
                            <span style={{ color:'rgba(245,240,232,0.35)', fontSize:10, fontFamily:'monospace' }}>{d.start} → {d.end}</span>
                          </div>
                          <span style={{ color:'rgba(245,240,232,0.25)', fontSize:10 }}>{d.full_years}Y</span>
                        </div>
                      );
                    })}
                  </div>

                  {curDasha?.antardasha && (() => {
                    const curAntar      = curDasha.antardasha.find(a => a.is_current) || curDasha.antardasha[0];
                    const curPratyantar = curAntar?.pratyantardasha?.find(p => p.is_current) || curAntar?.pratyantardasha?.[0];
                    return (
                      <>
                        {/* Antardasha */}
                        <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid rgba(212,175,55,0.1)' }}>
                          <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:8 }}>
                            {lang==='hi' ? 'अंतर्दशा' : 'Antardasha'} {curAntar && <span style={{ color:'rgba(212,175,55,0.4)', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6 }}>{lang==='hi' ? 'वर्तमान' : 'Current'}: {curAntar.lord}</span>}
                          </p>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
                            {curDasha.antardasha.map(ad => {
                              const isCur = ad.is_current, meta = PLANET_META[ad.lord] || {};
                              return (
                                <div key={`ad-${ad.lord}`} style={{ borderRadius:6, border:`1px solid ${isCur ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`, background: isCur ? 'rgba(212,175,55,0.09)' : 'rgba(255,255,255,0.03)', padding:'6px 8px' }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                    <span style={{ color:meta.color, fontSize:11 }}>{meta.icon} {ad.lord}</span>
                                    {isCur && <span style={{ fontSize:8, padding:'1px 4px', borderRadius:8, fontWeight:700, background:'rgba(212,175,55,0.2)', color:'#D4AF37' }}>NOW</span>}
                                  </div>
                                  <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, fontFamily:'monospace', marginTop:3 }}>{ad.start}</p>
                                  <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, fontFamily:'monospace' }}>→ {ad.end}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pratyantardasha */}
                        {curAntar?.pratyantardasha?.length > 0 && (
                          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(212,175,55,0.07)' }}>
                            <p style={{ color:'rgba(167,139,250,0.8)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:8 }}>
                              {lang==='hi' ? 'प्रत्यंतर्दशा' : 'Pratyantardasha'} {curPratyantar && <span style={{ color:'rgba(167,139,250,0.4)', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6 }}>{lang==='hi' ? 'वर्तमान' : 'Current'}: {curPratyantar.lord}</span>}
                            </p>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
                              {curAntar.pratyantardasha.map(pp => {
                                const isCur = pp.is_current, meta = PLANET_META[pp.lord] || {};
                                return (
                                  <div key={`pp-${pp.lord}`} style={{ borderRadius:6, border:`1px solid ${isCur ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`, background: isCur ? 'rgba(167,139,250,0.09)' : 'rgba(255,255,255,0.02)', padding:'6px 8px' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                      <span style={{ color:meta.color, fontSize:11 }}>{meta.icon} {pp.lord}</span>
                                      {isCur && <span style={{ fontSize:8, padding:'1px 4px', borderRadius:8, fontWeight:700, background:'rgba(167,139,250,0.2)', color:'#A78BFA' }}>NOW</span>}
                                    </div>
                                    <p style={{ color:'rgba(245,240,232,0.28)', fontSize:9, fontFamily:'monospace', marginTop:3 }}>{pp.start}</p>
                                    <p style={{ color:'rgba(245,240,232,0.28)', fontSize:9, fontFamily:'monospace' }}>→ {pp.end}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Mangal Dosha + Gochar */}
              {chart && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:13, fontWeight:700 }}>Mangal Dosha</h2>
                      {chart.mangal_dosha?.has_dosha
                        ? <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:7, color:'#F97316', background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.3)' }}>
                            {chart.mangal_dosha.manglik_type}
                          </span>
                        : <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:7, color:'#10B981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>No Dosha</span>
                      }
                    </div>
                    <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, marginBottom:10 }}>
                      {chart.mangal_dosha?.summary_en || 'Not calculated'}
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                      {(chart.mangal_dosha?.checks || []).map(check => (
                        <div key={check.basis} style={{ borderRadius:7, border: check.has_dosha ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(212,175,55,0.12)', background: check.has_dosha ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', padding:'7px', textAlign:'center' }}>
                          <p style={{ fontSize:10, color:'#64748B' }}>{check.basis}</p>
                          <p style={{ fontSize:13, fontWeight:700, color: check.has_dosha ? '#F97316' : '#94A3B8', marginTop:2 }}>H{check.house}</p>
                          {check.has_dosha && <p style={{ fontSize:9, color:'#EF4444', marginTop:2 }}>✗ Dosha</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:16 }}>
                    <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:13, fontWeight:700, marginBottom:10 }}>Gochar (Transit)</h2>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(212,175,55,0.08)', paddingBottom:6 }}>
                        <span style={{ color:'rgba(245,240,232,0.45)', fontSize:12 }}>Sade Sati</span>
                        <span style={{ color:'#F5F0E8', fontSize:12 }}>{chart.gochar?.highlights?.sade_sati?.active ? chart.gochar.highlights.sade_sati.phase : 'Inactive'}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(212,175,55,0.08)', paddingBottom:6 }}>
                        <span style={{ color:'rgba(245,240,232,0.45)', fontSize:12 }}>Jupiter</span>
                        <span style={{ color:'#F5F0E8', fontSize:12 }}>{chart.gochar?.highlights?.jupiter_support?.favorable ? 'Supportive' : 'Patient needed'}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ color:'rgba(245,240,232,0.45)', fontSize:12 }}>Rahu-Ketu</span>
                        <span style={{ color:'#F5F0E8', fontSize:12 }}>{chart.gochar?.highlights?.rahu_ketu_axis || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Houses */}
              {chart?.houses && (
                <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
                  <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:14, fontWeight:700, marginBottom:14 }}>🏠 12 Houses (Whole Sign)</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {Object.values(chart.houses).map(h => (
                      <div key={h.house_num} style={{
                        border: h.rashi_num === chart.ascendant.rashi_num ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(212,175,55,0.1)',
                        borderRadius:7, padding:10,
                        background: h.rashi_num === chart.ascendant.rashi_num ? 'rgba(212,175,55,0.06)' : 'transparent',
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <span style={{ fontSize:9, color:'rgba(245,240,232,0.35)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{houseLabel(h.house_num, lang)}</span>
                          <span style={{ fontSize:10, color:'rgba(245,240,232,0.55)' }}>{h.rashi_en?.split(' ')[0]}</span>
                        </div>
                        <p style={{ fontSize:9, color:'rgba(245,240,232,0.3)' }}>
                          Lord: <span style={{ color:'rgba(212,175,55,0.55)' }}>{h.rashi_lord}</span>
                        </p>
                        {BHAVA_NATURE[h.house_num] && (
                          <span style={{ display:'inline-block', marginTop:3, fontSize:8, padding:'1px 5px', borderRadius:8, fontWeight:600, color: BHAVA_NATURE[h.house_num].color, background: BHAVA_NATURE[h.house_num].bg, border:`1px solid ${BHAVA_NATURE[h.house_num].color}33` }}>
                            {BHAVA_NATURE[h.house_num].en}
                          </span>
                        )}
                        {h.planets.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:5 }}>
                            {h.planets.map(p => (
                              <span key={p} style={{ color:PLANET_META[p]?.color||'#D4AF37', fontSize:10 }}>
                                {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {kundli.nakshatra_insight && <PersonalityInsights insight={kundli.nakshatra_insight} chart={chart} lang={lang} />}
              {chart?.predictions?.portrait && <LifePortraitPanel chart={chart} lang={lang} />}
            </div>
          </div>
        </div>
      )}

      {/* Chara Karakas + Sade Sati Journey (kundli tab) */}
      {activeTab === 'kundli' && (
        <>
          <AvakahadaPanel chart={chart} lang={lang} />
          <PlacementNarrativesPanel data={kundli?.placement_narratives} lang={lang} />
          <CharaKarakaPanel karakas={kundli?.chara_karakas} lang={lang} />
          <YutiPanel yuti={kundli?.yuti_analysis} lang={lang} />
          <AstaVakriPanel data={kundli?.asta_vakri} lang={lang} />
          <RemedyManualPanel data={kundli?.remedy_manual} lang={lang} />
          <DashaJourneyPanel journey={kundli?.dasha_journey} antarNarratives={kundli?.antar_narratives} lang={lang} />
          <SadeSatiPanel journey={kundli?.sade_sati_journey} lang={lang} />
        </>
      )}

      {/* ══ TAB: LIFE REPORT ══════════════════════════════════════════════════ */}
      {activeTab === 'life-report' && (
        <div>
          <AdminGuide title="Life Report Sections">
            <GLine label="What this shows" text="A comprehensive narrative assessment across all major life domains: health, career, relationships, wealth, spirituality, and psychological patterns. Generated from the full chart calculation." />
            <GSection title="How to read each section" items={[
              "Each section synthesizes multiple chart factors: planet placements, their dignity, dasha period, and natural significators.",
              "Positive sections indicate supported areas in this chart — the person's natural talents and blessings.",
              "Challenging sections reveal areas needing conscious effort, remedies, or timing awareness.",
              "Cross-reference with current dasha period: if a planet ruling a challenged area is running its dasha, those themes activate.",
            ]} />
            <GLine label="Admin use" text="Compare life report themes against what the client reports as current issues. Strong alignment = high chart reliability. Use this to build trust with the client." color="#60A5FA" />
          </AdminGuide>
          {chart?.life_report?.sections && <LifeReportPanel lifeReport={chart.life_report} lang={lang} narratives={kundli?.life_report_narratives} />}
        </div>
      )}

      {/* ══ TAB: STRENGTH ════════════════════════════════════════════════════ */}
      {activeTab === 'strength' && (
        <div>
          <AdminGuide title="Kundli Strength (Shadbala)">
            <GLine label="What this shows" text="Shadbala = Six-fold strength. A planet's ability to deliver results depends on its combined positional, temporal, directional, motional, natural, and aspectual strength." />
            <GSection title="The six Balas" items={[
              "Sthana Bala (Positional): Strength from being in exaltation, own sign, friendly sign etc.",
              "Dig Bala (Directional): Strength from being in the preferred directional house.",
              "Kala Bala (Temporal): Strength based on time of birth — day/night, season, paksha.",
              "Chesta Bala (Motional): Strength based on speed of motion — retrograde adds strength.",
              "Naisargika Bala (Natural): Fixed inherent strength — Sun strongest, Saturn weakest.",
              "Drik Bala (Aspectual): Strength gained or lost from aspects of other planets.",
            ]} />
            <GLine label="Interpretation" text="A planet with Shadbala > 1.0 Rupa is strong. 0.5-1.0 is average. Below 0.5 is weak. A weak planet in its dasha period will struggle to give good results even if well-placed." color="#A78BFA" />
            <GLine label="Practical use" text="Strong planets in dasha = reliable, predictable results. Weak planets in dasha = delays, reversals, health issues related to that planet's body parts and significations." color="#60A5FA" />
          </AdminGuide>
          <AdminStrengthSection uuid={kundliUuid} lang={lang} />
        </div>
      )}

      {/* ══ TAB: PLANET IMPACT ═══════════════════════════════════════════════ */}
      {activeTab === 'impact' && (
        <div>
          <AdminGuide title="Planet Impact Assessment">
            <GLine label="What this shows" text="A qualitative assessment of how each planet is impacting the native's life across health, career, relationships, wealth, and spirituality domains." />
            <GSection title="How planets affect life areas" items={[
              "Sun: Soul, ego, father, authority figures, government, heart, bones.",
              "Moon: Mind, mother, emotions, home, fluids, chest/lungs. Very sensitive to transits.",
              "Mars: Energy, siblings, property, debts, surgery, accidents, blood, muscles.",
              "Mercury: Communication, intelligence, education, business, skin, nerves.",
              "Jupiter: Wisdom, children, teachers, wealth, liver, fortune. Natural benefic.",
              "Venus: Relationship, arts, luxury, reproduction, kidneys, throat. Natural benefic.",
              "Saturn: Discipline, delays, karma, longevity, servants, legs, chronic illness.",
              "Rahu: Foreign, unconventional, desire, obsession, sudden events, amplifies house/sign lord.",
              "Ketu: Spirituality, past-life karma, detachment, mysterious illness, liberation.",
            ]} />
            <GLine label="Combust planets" text="Combusted planets merge with solar themes. Their own significations become overshadowed — the native may feel the effect through father, authority, or government rather than the planet's own domain." color="#F59E0B" />
          </AdminGuide>
          {chart && chartEnrich && <KundliInsightPanel chart={chart} enrichment={chartEnrich} lang={lang} />}
          {chart?.reports?.planet_assessments && <PlanetImpactPanel chart={chart} lang={lang} />}
        </div>
      )}

      {/* ══ TAB: BHAVA LORDS ═════════════════════════════════════════════════ */}
      {activeTab === 'bhava-lords' && (
        <div>
          <AdminGuide title="Bhava Lord Interpretations (BPHS)">
            <GLine label="What this shows" text="Each of the 12 houses has a ruling planet (the lord of that house's sign). Where this lord is placed in the chart determines how that house's matters manifest in life. This is the BPHS (Brihat Parashara Hora Shastra) house-lord system." />
            <GSection title="Key rules" items={[
              "Lord of a Kendra (1,4,7,10) placed in a Trikona (1,5,9) = Raj Yoga. Great fortune and power.",
              "Lord of a Dusthana (6,8,12) placed in another Dusthana = Viparita Raja Yoga. Reversals can bring hidden blessings.",
              "Lord in own house = strong. The matters of that house thrive.",
              "Lord in 7th from its house = Karaka placement. Mixed results — can indicate excess of that house's themes.",
              "Lord in 6,8,12 from its own house = weakened. Delays, obstacles, or challenges in that house's matters.",
              "Lord of 1st placed in 10th = career success, public recognition.",
              "Lord of 7th in 12th = separation from partner, marriage challenges.",
            ]} />
            <GLine label="Overall Effect" text="Look at the 'Overall Effect' rating for each lord — auspicious, mixed, or challenging. Cross-reference with the dasha of that lord to understand when effects manifest." color="#A78BFA" />
          </AdminGuide>
          {kundli?.bhava_lord_readings?.length > 0 && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24 }}>
              <BhavaLordPanel readings={kundli.bhava_lord_readings} lang={lang} />
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: GUIDANCE ════════════════════════════════════════════════════ */}
      {activeTab === 'guidance' && (
        <div>
          <AdminGuide title="Life Guidance & Remedies">
            <GLine label="What this shows" text="Synthesized guidance for the native's life journey — practical recommendations based on chart strengths, challenges, and the current dasha period. Includes mantra, gemstone, color, and behavioral remedies." />
            <GSection title="Types of remedies and their basis" items={[
              "Mantras: Vibrationally align with the planet's energy. Best done at the planet's hora or day.",
              "Gemstones: Worn to strengthen a weak benefic planet in dasha. NEVER recommend gemstone for a malefic planet that is well-placed.",
              "Colors/Clothes: Minor but consistent daily reinforcement of planetary energy.",
              "Charity: Giving away the materials associated with a planet on its weekday pacifies malefic effects.",
              "Fasting: Observed on the planet's day. Clears karmic backlog and reduces malefic effects.",
              "Behavioral changes: Addressing the life patterns governed by the afflicted house/planet.",
            ]} />
            <GLine label="Admin note" text="Present remedies as suggestions, not predictions. The strength of the remedy depends on the native's sincerity and the severity of the planetary condition. Gemstones require proper quality and astrological consultation." color="#60A5FA" />
          </AdminGuide>
          {kundli?.life_guidance && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24 }}>
              <LifeGuidancePanel guidance={kundli.life_guidance} lang={lang} marriageTiming={kundli?.marriage_timing} />
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: VARSHPHAL ═══════════════════════════════════════════════════ */}
      {activeTab === 'varshphal' && (
        <div>
          <AdminGuide title="Varshphal — Annual Horoscope (Solar Return)">
            <GLine label="What this shows" text="Varshphal is the annual solar return chart — calculated for the moment the Sun returns to its natal position each year. It overlays the natal chart to reveal the themes and events of that year." />
            <GSection title="Key Varshphal concepts" items={[
              "Year Lord (Varsha Pati): The planet that rules the year. Determined by the hora at the solar return moment. This planet colors the entire year's theme.",
              "Muntha: A special sensitive point that moves forward 1 house each year. Indicates activated areas of life. Muntha in 1st, 5th, 9th = good year. In 6th, 8th, 12th = challenges.",
              "Tri-Pataki Chakra: Cross-reference of natal dasha with annual chart to identify event windows within the year.",
              "Solar Return Planets: Check which houses they fall in both the natal and annual chart. Strong placements indicate supported areas.",
              "Mudda Dasha: The annual sub-dasha system running within the solar return year. Each period = approximately 1 month of themes.",
            ]} />
            <GLine label="Reading method" text="First identify the Year Lord and Muntha. Then check annual lagna lord's strength. Finally cross-reference annual planets against natal sensitive points (natal lagna, natal Moon, natal Sun)." color="#A78BFA" />
          </AdminGuide>
          <AdminVarshphalSection uuid={kundliUuid} />
        </div>
      )}

      {/* ══ TAB: GRB REPORT ══════════════════════════════════════════════════ */}
      {activeTab === 'grb' && (
        <div>
          <AdminGuide title="Graha-Rashi-Bhava Detailed Report">
            <GLine label="What this shows" text="The most comprehensive analytical report — planet strength assessments, yoga identification, event timing windows, and detailed house analysis. This is the primary research tool for deep chart analysis." />
            <GSection title="Key sub-sections" items={[
              "Planet Assessments: Detailed qualitative and quantitative evaluation of each planet's condition.",
              "Yoga & Dasha Report: Identifies active yogas (beneficial and malefic combinations) and correlates them with the current dasha.",
              "Varga Matrix: Performance of each planet across all divisional charts (D1 through D60). Reveals whether a planet is consistently strong or only superficially placed.",
              "Event Timing Windows: Calculated periods when specific life events (marriage, career change, health issues) are likely to manifest, based on combined dasha + transit + yoga activation.",
            ]} />
            <GLine label="Varga Matrix reading" text="A planet scoring ≥ 4 in varga (good placement in 4+ divisional charts) is genuinely strong. 2-3 is average. Below 2 is weak regardless of D1 placement. This is the difference between chart promises and actual results." color="#22C55E" />
          </AdminGuide>
          {chart && (
            <DetailedReportsPanel reports={chart.reports} lang={lang} onRecalculate={handleRecalc} recalcing={recalcing} />
          )}
        </div>
      )}

      {/* ══ TAB: VARGA CHARTS ════════════════════════════════════════════════ */}
      {activeTab === 'varga' && (
        <div>
          <AdminGuide title="Divisional Charts (Vargas) — D1 through D60">
            <GLine label="What this shows" text="Each divisional chart divides the zodiac signs into finer subdivisions, revealing specific life areas in greater detail. The natal D1 chart shows overall life; divisional charts zoom into specific domains." />
            <GSection title="The major divisional charts" items={[
              "D1 (Rashi) — Overall life chart. Foundation of all interpretation.",
              "D2 (Hora) — Wealth and financial resources. Sun hora = male, Moon hora = female assets.",
              "D3 (Drekkana) — Siblings, co-born, courage. Used for sibling relationships.",
              "D4 (Chaturthamsha) — Fixed assets, property, home. Fortune from land and structures.",
              "D7 (Saptamsha) — Children and progeny. Also creative output and legacy.",
              "D9 (Navamsha) — Dharma, spouse, fortune after 35. Most important after D1.",
              "D10 (Dashamsha) — Career and professional achievements. Key for ambition timing.",
              "D12 (Dwadashamsha) — Parents, ancestors, lineage karma.",
              "D16 (Shodashamsha) — Vehicles, comforts, mental happiness.",
              "D20 (Vimshamsha) — Spiritual progress, religious practices, moksha potential.",
              "D24 (Chaturvimshamsha) — Education, learning, skills.",
              "D27 (Bhamsha) — Strength and vitality.",
              "D30 (Trimshamsha) — Misfortune, illness, sin. Shows karmic weaknesses.",
              "D40 (Khavedamsha) — Auspicious and inauspicious tendencies.",
              "D45 (Akshavedamsha) — General indications about character.",
              "D60 (Shastiamsha) — Past life karma. Most important varga for spiritual astrology.",
            ]} />
            <GLine label="D9 priority" text="Always examine D9 alongside D1. A planet weakened in D1 but strong in D9 will show results after middle age. A planet strong in D1 but debilitated in D9 gives early promise that fades." color="#D4AF37" />
          </AdminGuide>
          {chart && (
            <VargaChartsPanel birthChart={chart} reference={null} referenceError={null} chartStyle={chartStyle} lang={lang} />
          )}
        </div>
      )}

      {/* ══ TAB: DIGBALA ═════════════════════════════════════════════════════ */}
      {activeTab === 'digbala' && (
        <div>
          <AdminGuide title="Digbala — Directional Strength">
            <GLine label="What this shows" text="Digbala is one component of Shadbala. Each planet has a specific directional house where it gains maximum directional strength (100%), and loses it in the opposite house (0%)." />
            <GSection title="Directional strengths table" items={[
              "Sun & Mars → 10th house (South). They excel in career, public life, action.",
              "Jupiter & Mercury → 1st house (East). They excel in personality, intelligence, self-expression.",
              "Moon & Venus → 4th house (North). They excel in home, emotions, beauty, relationships.",
              "Saturn → 7th house (West). It excels in partnerships, trade, and long-term commitments.",
            ]} />
            <GLine label="Digbala loss (Dikbala Hani)" text="A planet placed in the house directly opposite its strong house suffers complete directional weakness. Sun in 4th, Jupiter in 7th, Saturn in 1st = severely weakened directional strength." color="#F87171" />
            <GLine label="Admin use" text="A planet with high Digbala in an important dasha will deliver exceptional results in its signified domain. Especially important for planets ruling career (10th lord) or relationships (7th lord)." color="#60A5FA" />
          </AdminGuide>
          {chart?.digbala && (
            <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
              <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, marginBottom:16 }}>
                🧭 Graha Digbala — Directional Strength
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {Object.values(chart.digbala).map(d => {
                  const meta     = PLANET_META[d.planet] || {};
                  const barColor = d.has_digbala ? '#22C55E' : d.has_digbala_loss ? '#EF4444' : '#D4AF37';
                  return (
                    <div key={d.planet} style={{ border:`1px solid ${d.has_digbala ? 'rgba(34,197,94,0.4)' : d.has_digbala_loss ? 'rgba(239,68,68,0.25)' : 'rgba(212,175,55,0.12)'}`, borderRadius:8, padding:'10px 12px', background: d.has_digbala ? 'rgba(34,197,94,0.06)' : 'rgba(17,20,40,0.5)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ color:meta.color, fontSize:14 }}>{meta.icon}</span>
                          <span style={{ color:'#F5F0E8', fontSize:12, fontWeight:600 }}>{planetName(d.planet, lang)}</span>
                          {d.has_digbala && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:10, background:'rgba(34,197,94,0.2)', color:'#22C55E', fontWeight:700, textTransform:'uppercase' }}>Digbala ✓</span>}
                          {d.has_digbala_loss && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:10, background:'rgba(239,68,68,0.15)', color:'#EF4444', fontWeight:700, textTransform:'uppercase' }}>Lost</span>}
                        </div>
                        <span style={{ color:'rgba(245,240,232,0.35)', fontSize:10 }}>{d.strength_percent}%</span>
                      </div>
                      <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:8 }}>
                        <div style={{ height:'100%', width:`${d.strength_percent}%`, background:barColor, borderRadius:2 }} />
                      </div>
                      <div style={{ fontSize:9, color:'rgba(245,240,232,0.35)', display:'flex', justifyContent:'space-between' }}>
                        <span>{houseLabel(d.planet_house, lang)} → strong at {houseLabel(d.strong_house, lang)}</span>
                        <span style={{ color:'#A78BFA' }}>{d.strong_direction?.en}</span>
                      </div>
                      <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ color:'rgba(245,240,232,0.7)', fontSize:11, lineHeight:1.5, marginBottom:6 }}>{d.effect_en}</p>
                        <p style={{ color:'rgba(52,211,153,0.75)', fontSize:10, lineHeight:1.4, marginBottom:4 }}>Benefit: {d.benefit_en}</p>
                        <p style={{ color:'rgba(251,191,36,0.75)', fontSize:10, lineHeight:1.4, marginBottom:4 }}>Watch: {d.watch_en}</p>
                        <p style={{ color:'rgba(196,181,253,0.75)', fontSize:10, lineHeight:1.4 }}>Remedy: {d.remedy_en}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: BHAV KARAK ══════════════════════════════════════════════════ */}
      {activeTab === 'bhav-karak' && (
        <div>
          <AdminGuide title="Bhav Karak Grahas — Natural Significators">
            <GLine label="What this shows" text="Beyond house lordship, each house has natural significator planets (Karakas) whose inherent nature governs those house themes regardless of the actual birth chart configuration." />
            <GSection title="Key Karakas" items={[
              "1st House → Sun (soul, self). Sun's condition reflects overall vitality.",
              "2nd House → Jupiter (wealth). Jupiter's dignity reflects financial stability.",
              "3rd House → Mars (courage, siblings). Mars placement affects brother relationships.",
              "4th House → Moon (mother, home). Moon shows emotional security and property.",
              "5th House → Jupiter (children, education). Jupiter reflects creative intelligence.",
              "6th House → Mars/Saturn (enemies, disease). Their condition = health challenges.",
              "7th House → Venus (spouse, partnership). Venus dignity = quality of marriages.",
              "8th House → Saturn (longevity, secrets). Saturn shows life span and mysteries.",
              "9th House → Jupiter (father, dharma). Jupiter = spiritual guide and fortune.",
              "10th House → Mercury/Sun (career). Their strength = career achievement.",
              "11th House → Jupiter (gains, elder sibling). Jupiter = financial gains.",
              "12th House → Saturn/Ketu (expenses, moksha). Their position = losses or liberation.",
            ]} />
            <GLine label="Karako Bhava Nashaya" text="When a Karak planet occupies its own Karak house, it can actually destroy the matters of that house through excess. E.g., Jupiter in 5th can damage children matters (over-analysis, delayed progeny)." color="#F59E0B" />
          </AdminGuide>
          {chart?.bhav_karak && (
            <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
              <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, marginBottom:16 }}>
                🪐 Bhav Karak Grahas — Natural Significators
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {Object.values(chart.bhav_karak).map(bk => (
                  <div key={bk.house} style={{ border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:12 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ color:'rgba(212,175,55,0.7)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>{houseLabel(bk.house, lang)}</span>
                      <div style={{ display:'flex', gap:4 }}>
                        {bk.karakas.map(p => (
                          <span key={p} style={{ fontSize:10, color:PLANET_META[p]?.color||'#D4AF37', fontWeight:700 }}>
                            {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p style={{ color:'rgba(245,240,232,0.55)', fontSize:10, marginBottom:8, lineHeight:1.4 }}>{bk.signification_en}</p>
                    {bk.karaka_positions.map(kp => {
                      const meta         = PLANET_META[kp.planet] || {};
                      const qualityColor = kp.placement_quality==='trikona' ? '#22C55E' : kp.placement_quality==='kendra' ? '#60A5FA' : 'rgba(245,240,232,0.35)';
                      return (
                        <div key={kp.planet} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4, borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:4 }}>
                          <span style={{ color:meta.color, fontSize:10 }}>{meta.icon} {planetName(kp.planet, lang)}</span>
                          <span style={{ fontSize:9, color:qualityColor }}>
                            {houseLabel(kp.house, lang)} · {kp.rashi_en}
                            {kp.is_in_own_karak_house && <span style={{ marginLeft:3, color:'#F59E0B' }} title="Karako Bhava Nashaya">⚠</span>}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ marginTop:8, paddingTop:6, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color:'rgba(52,211,153,0.7)', fontSize:10, lineHeight:1.4, marginBottom:3 }}>Benefit: {bk.benefit_en}</p>
                      <p style={{ color:'rgba(251,191,36,0.7)', fontSize:10, lineHeight:1.4, marginBottom:3 }}>Danger: {bk.danger_en}</p>
                      <p style={{ color:'rgba(196,181,253,0.7)', fontSize:10, lineHeight:1.4 }}>Remedy: {bk.remedy_en}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: DRISHTI ══════════════════════════════════════════════════════ */}
      {activeTab === 'drishti' && (
        <div>
          <AdminGuide title="Graha Drishti — Planetary Aspects">
            <GLine label="What this shows" text="In Jyotish, every planet aspects the 7th house from its position. Additionally, Mars, Jupiter, Saturn, Rahu, and Ketu have special aspects. Aspects significantly influence the houses and planets they fall upon." />
            <GSection title="Special aspects" items={[
              "Mars: Also aspects 4th and 8th houses from its position. Brings energy, aggression, or accidents to those houses.",
              "Jupiter: Also aspects 5th and 9th houses from its position. Brings wisdom, expansion, and protection.",
              "Saturn: Also aspects 3rd and 10th houses from its position. Brings delay, discipline, and restriction.",
              "Rahu & Ketu: Some traditions give them 5th and 9th aspects (like Jupiter). Creates unusual karmic connections.",
            ]} />
            <GSection title="How to interpret aspects" items={[
              "A benefic planet (Jupiter, Venus, Moon, Mercury) aspecting a house protects and strengthens it.",
              "A malefic planet (Saturn, Mars, Sun, Rahu, Ketu) aspecting a house creates tension and obstacles.",
              "A planet aspecting its own house = double strength for those matters.",
              "Saturn's aspect on 7th lord = delays or restrictions in marriage.",
              "Jupiter's aspect on 5th = protection for children and education.",
              "Mars aspecting 8th from 1st position (i.e., Mars in 1st) = Mangal Dosha.",
            ]} />
          </AdminGuide>
          {chart?.drishti && (
            <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20 }}>
              <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, marginBottom:16 }}>
                👁 Graha Drishti — Planetary Aspects
              </h2>

              {chart.drishti.by_house_detail && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ color:'rgba(212,175,55,0.6)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>Plain-Language Effects</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {Object.values(chart.drishti.by_house_detail).map(item => (
                      <DrishtiHouseCard key={item.house} item={item} lang={lang} />
                    ))}
                  </div>
                </div>
              )}

              <p style={{ color:'rgba(212,175,55,0.6)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>Planet → Houses Aspected</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
                {Object.entries(chart.drishti.by_planet || {}).map(([planet, info]) => {
                  const meta       = PLANET_META[planet] || {};
                  const hasSpecial = info.aspects.length > 1;
                  return (
                    <div key={planet} style={{ border:`1px solid ${hasSpecial ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.1)'}`, borderRadius:8, padding:'8px 10px', background: hasSpecial ? 'rgba(212,175,55,0.04)' : 'transparent' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                        <span style={{ color:meta.color, fontSize:13 }}>{meta.icon}</span>
                        <span style={{ color:'#F5F0E8', fontSize:12, fontWeight:600 }}>{planetName(planet, lang)}</span>
                        <span style={{ color:'rgba(245,240,232,0.3)', fontSize:9 }}>{houseLabel(info.from_house, lang)}</span>
                        {hasSpecial && <span style={{ marginLeft:'auto', fontSize:8, padding:'1px 5px', borderRadius:8, background:'rgba(212,175,55,0.15)', color:'#D4AF37' }}>Special</span>}
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {info.aspects.map(({ house, offset, nature }) => {
                          const natColor = nature==='auspicious' ? '#22C55E' : nature==='aggressive' ? '#EF4444' : nature==='karmic' ? '#A78BFA' : nature==='restricting' ? '#818CF8' : '#94A3B8';
                          return (
                            <span key={offset} style={{ fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:600, background:`${natColor}18`, color:natColor, border:`1px solid ${natColor}33` }}>
                              {houseLabel(house, lang)} ({offset}th)
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p style={{ color:'rgba(212,175,55,0.6)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>House → Planets Aspecting It</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                {Object.entries(chart.drishti.by_house || {}).map(([house, planets]) => (
                  <div key={house} style={{ border: planets.length ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(212,175,55,0.08)', borderRadius:6, padding:8, textAlign:'center', background: planets.length ? 'rgba(212,175,55,0.04)' : 'transparent' }}>
                    <p style={{ fontSize:9, color:'rgba(245,240,232,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{houseLabel(house, lang)}</p>
                    {planets.length ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:2, justifyContent:'center' }}>
                        {planets.map(p => (
                          <span key={p} style={{ fontSize:9, color:PLANET_META[p]?.color||'#D4AF37', fontWeight:700 }}>
                            {planetName(p, lang).slice(0,2)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color:'rgba(245,240,232,0.15)', fontSize:9 }}>—</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: YOGAS ═══════════════════════════════════════════════════════ */}
      {activeTab === 'yogas' && (
        <div>
          <AdminGuide title="Yogas & Doshas — Chart Combinations">
            <GLine label="What this shows" text="Yogas are specific planetary combinations that produce above-average results (good or bad) in the native's life. They are the 'overrides' in the chart — a strong yoga can override the base chart indications." />
            <GSection title="Major Raj Yogas" items={[
              "Pancha Mahapurusha Yogas: 5 yogas formed when a planet (Mars, Mercury, Jupiter, Venus, Saturn) is in own sign or exalted AND in a Kendra (1,4,7,10). Strong, specific personality and career results.",
              "Dhana Yoga: When the lords of the wealth houses (2nd, 5th, 9th, 11th) are mutually connected. Indicates significant wealth accumulation.",
              "Gaja Kesari Yoga: Jupiter in Kendra from Moon. Gives fame, intelligence, and good character.",
              "Budhaditya Yoga: Sun-Mercury conjunction. Gives intelligence and analytical ability.",
            ]} />
            <GSection title="Important Doshas" items={[
              "Mangal Dosha: Mars in 1st, 4th, 7th, 8th, or 12th house. Check Lagna, Moon, and Venus separately. Affects marriage timing and partnership quality.",
              "Kaal Sarp Dosha: All planets between Rahu and Ketu. Can create obsessive drives but also exceptional achievement. Many great people have it.",
              "Pitru Dosha: Sun afflicted by Rahu/Saturn/Ketu in 9th house. Ancestor karma affecting the current life.",
              "Grahan Yoga: Sun or Moon conjunct Rahu/Ketu. Ecliptic placement — brings dramatic life events around eclipse periods.",
            ]} />
            <GLine label="Cancellation of Doshas" text="Most doshas have cancellation conditions (Dosha Bhanga). Always check for cancellations before presenting negative yogas. A cancelled dosha becomes a powerful yoga in many cases." color="#22C55E" />
          </AdminGuide>
          {chart?.yogas_doshas && <YogasAndDoshasPanel chart={chart} lang={lang} library={kundli?.yoga_dosha_library} admin />}
        </div>
      )}

      {/* ══ TAB: FAVOURITE DAYS ══════════════════════════════════════════════ */}
      {activeTab === 'fav-days' && (
        <div>
          <AdminGuide title="Favourite Days — Purpose-wise Auspicious Weekdays">
            <GLine label="What this shows" text="For each life purpose (study, work, finance, love, health, travel, spiritual, new beginnings), the best weekday is derived from the strongest governing planet in the native's chart. Each weekday is ruled by a planet — the day of the stronger significator gives better results." />
            <GSection title="How it is computed" items={[
              "Each purpose has two significator planets (e.g. Study → Mercury & Jupiter; Work → Saturn & Sun).",
              "Planet strength = dignity score (exalted 5 → debilitated 1) adjusted by house placement (Kendra/Trikona +0.5, Dusthana −0.5).",
              "The stronger planet's weekday becomes the Best Day; the other planet's weekday is the Alternative.",
              "If the weaker planet is debilitated or in an enemy sign (score ≤ 2), its weekday is flagged as a day to Avoid for that purpose.",
            ]} />
            <GLine label="Practical use" text="Advise the native to schedule important activities (exam, job interview, investment, journey) on their purpose-specific best day, and defer them on flagged avoid days." color="#60A5FA" />
          </AdminGuide>
          <FavouriteDaysPanel favouriteDays={kundli?.favourite_days} lang={lang} />
        </div>
      )}

      {/* ══ TAB: FINAL RESULTS ═══════════════════════════════════════════════ */}
      {activeTab === 'results' && (
        <div>
          <AdminGuide title="Final Results — Kundli Synthesis">
            <GLine label="What this shows" text="Aggregates the most important signals from all 13 analysis tabs — strength score, top yogas, current Dasha phase, career/marriage verdicts, best Bhava lord placements, active Yutis, key remedies, and life domain scores — into a single executive view." />
            <GLine label="How to use" text="Use this tab for a rapid end-to-end assessment before a client consultation. The strength ring gives the overall score; the domain bars pinpoint areas needing attention; the remedy section gives the most targeted prescription." color="#60A5FA" />
            <GLine label="Key rules" text="Strength score 70+ = strongly positive chart; 50–69 = balanced; 35–49 = mixed; below 35 = challenging. Multiple active Raja Yogas elevate the score significantly." color="#FBBF24" />
          </AdminGuide>
          <KundliSynthesisPanel kundli={kundli} lang={lang} admin={true} />
        </div>
      )}

      {/* Bottom navigation */}
      <div style={{ marginTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'12px 16px' }}>
        <button onClick={() => router.push('/admin/kundlis')}
          style={{ padding:'7px 16px', borderRadius:6, background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)', color:'rgba(212,175,55,0.7)', fontSize:12, cursor:'pointer' }}>
          ← All Kundli Profiles
        </button>
        <div style={{ display:'flex', gap:8 }}>
          {MAIN_TABS.map(tab => (
            activeTab === tab.key ? null : (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ padding:'5px 10px', borderRadius:5, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'rgba(245,240,232,0.4)', fontSize:10, cursor:'pointer', whiteSpace:'nowrap' }}>
                {tab.icon}
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
