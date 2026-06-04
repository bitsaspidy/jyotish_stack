'use client';
import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

const t = (lang, en, hi) => (lang === 'hi' ? hi : en);

const PLANET_META = {
  Sun:     { icon:'☉', color:'#FBBF24', hi:'सूर्य'    },
  Moon:    { icon:'☽', color:'#94A3B8', hi:'चन्द्र'   },
  Mars:    { icon:'♂', color:'#EF4444', hi:'मंगल'      },
  Mercury: { icon:'☿', color:'#10B981', hi:'बुध'       },
  Jupiter: { icon:'♃', color:'#F97316', hi:'बृहस्पति' },
  Venus:   { icon:'♀', color:'#F472B6', hi:'शुक्र'     },
  Saturn:  { icon:'♄', color:'#818CF8', hi:'शनि'       },
  Rahu:    { icon:'☊', color:'#A78BFA', hi:'राहु'      },
  Ketu:    { icon:'☋', color:'#6B7280', hi:'केतु'      },
};

const CATEGORY_META = [
  { key:'planet_avg',   en:'Planet Strengths',  hi:'ग्रह बल',        icon:'🪐' },
  { key:'yoga_score',   en:'Yoga Analysis',     hi:'योग विश्लेषण',   icon:'✦'  },
  { key:'domain_avg',   en:'Life Domains',      hi:'जीवन क्षेत्र',   icon:'🌐' },
  { key:'dasha_score',  en:'Current Dasha',     hi:'वर्तमान दशा',    icon:'🔮' },
];

function scoreColor(s) {
  if (s >= 75) return '#10B981';
  if (s >= 60) return '#22C55E';
  if (s >= 48) return '#F59E0B';
  if (s >= 35) return '#F97316';
  return '#EF4444';
}

function ScoreBar({ score, max = 100, color }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background: color || scoreColor(score), borderRadius:4, transition:'width 0.6s ease' }} />
    </div>
  );
}

// ── Big Score Ring ────────────────────────────────────────────────────────────
function ScoreRing({ score, label, lang }) {
  const c = label?.color || scoreColor(score);
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={128} height={128} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 0.8s ease' }} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          style={{ fill:'#F1F5F9', fontSize:22, fontWeight:800, transform:'rotate(90deg)', transformOrigin:`${cx}px ${cy}px`, fontFamily:'sans-serif' }}>
          {score}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="central"
          style={{ fill:'#64748B', fontSize:10, transform:'rotate(90deg)', transformOrigin:`${cx}px ${cy}px`, fontFamily:'sans-serif' }}>
          /100
        </text>
      </svg>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, fontWeight:700, color:c }}>{t(lang, label?.en, label?.hi)}</div>
        <div style={{ fontSize:10, color:'#64748B' }}>{t(lang,'Overall Kundli Score','समग्र कुंडली बल')}</div>
      </div>
    </div>
  );
}

// ── Category Bars ─────────────────────────────────────────────────────────────
function CategoryBars({ st, lang }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
      {CATEGORY_META.map(({ key, en, hi, icon }) => {
        const val = st[key] || 0;
        const c   = scoreColor(val);
        return (
          <div key={key}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'#CBD5E1' }}>{icon} {t(lang, en, hi)}</span>
              <span style={{ fontSize:12, fontWeight:700, color:c }}>{val}%</span>
            </div>
            <ScoreBar score={val} color={c} />
          </div>
        );
      })}
    </div>
  );
}

// ── Life Domain Grid ──────────────────────────────────────────────────────────
function LifeDomainGrid({ domains, lang }) {
  if (!domains?.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:8 }}>
      {domains.map((d) => {
        if (!d) return null;
        const c = d.label?.color || '#F59E0B';
        return (
          <div key={d.key} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.025)', border:`1px solid ${c}28`, borderRadius:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#CBD5E1', marginBottom:6 }}>
              {t(lang, d.en, d.hi)}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <span style={{ fontSize:13, fontWeight:800, color:c }}>{d.score}</span>
              <span style={{ fontSize:9, color:c, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {t(lang, d.label?.en, d.label?.hi)}
              </span>
            </div>
            <ScoreBar score={d.score} color={c} />
          </div>
        );
      })}
    </div>
  );
}

// ── Planet Strength Table ─────────────────────────────────────────────────────
function PlanetStrengthTable({ scores, natalPlanets, lang }) {
  const names = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  if (!scores) return null;
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {[t(lang,'Planet','ग्रह'), t(lang,'Dignity','दशा'), t(lang,'House','भाव'), t(lang,'Score','बल'), t(lang,'Retro','वक्री'), ''].map((h) => (
              <th key={h} style={{ padding:'6px 10px', textAlign:'left', color:'#475569', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', fontSize:9 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((name) => {
            const pd  = natalPlanets?.[name];
            const sc  = scores[name] || 50;
            const pm  = PLANET_META[name] || { icon:'●', color:'#94A3B8', hi:name };
            const c   = scoreColor(sc);
            const dg  = pd?.dignity?.split('(')[0].trim() || '—';
            const dgHi = pd?.dignity?.match(/\(([^)]+)\)/)?.[1] || dg;
            return (
              <tr key={name} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding:'8px 10px' }}>
                  <span style={{ fontSize:14, color:pm.color, marginRight:6 }}>{pm.icon}</span>
                  <span style={{ color:'#E2E8F0', fontWeight:600 }}>{t(lang, name, pm.hi)}</span>
                </td>
                <td style={{ padding:'8px 10px', color:'#94A3B8', fontSize:10 }}>{t(lang, dg, dgHi)}</td>
                <td style={{ padding:'8px 10px', color:'#CBD5E1', fontWeight:600 }}>{pd?.house ? `H${pd.house}` : '—'}</td>
                <td style={{ padding:'8px 10px', minWidth:80 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:c, minWidth:28 }}>{sc}</span>
                    <div style={{ flex:1 }}><ScoreBar score={sc} color={c} /></div>
                  </div>
                </td>
                <td style={{ padding:'8px 10px' }}>
                  {pd?.is_retrograde ? <span style={{ color:'#F59E0B', fontSize:11 }}>℞</span> : <span style={{ color:'#334155' }}>—</span>}
                </td>
                <td style={{ padding:'8px 10px' }}>
                  <span style={{ fontSize:9, fontWeight:700, color:c, textTransform:'uppercase', padding:'2px 7px', background:`${c}18`, border:`1px solid ${c}33`, borderRadius:8 }}>
                    {sc >= 72 ? t(lang,'Strong','प्रबल') : sc >= 55 ? t(lang,'Moderate','मध्यम') : t(lang,'Weak','कमजोर')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function KundliStrengthPanel({ kundliUuid, natalPlanets, lang = 'en' }) {
  const [st,      setSt]      = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const load = useCallback(async () => {
    if (!kundliUuid || st) return;
    setLoading(true);
    try {
      const r = await api.get(`/kundli/${kundliUuid}/strength`);
      setSt(r.data.strength);
    } catch (e) {
      console.error('[KundliStrength]', e);
    } finally {
      setLoading(false);
    }
  }, [kundliUuid, st]);

  // Load on first open
  const handleOpen = () => {
    setOpen(v => !v);
    if (!st) load();
  };

  const c = st ? scoreColor(st.overall_score) : '#D4AF37';

  return (
    <div style={{ marginBottom:20 }}>
      {/* ── Collapsed header ── */}
      <button onClick={handleOpen} style={{
        width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:0,
      }}>
        <div style={{ padding:'16px 20px', background:'rgba(17,20,40,0.6)', border:`1px solid ${st ? c+'44' : 'rgba(212,175,55,0.2)'}`, borderRadius: open ? '14px 14px 0 0' : 14, display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flex:1 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:`${c}18`, border:`2px solid ${c}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {loading ? <span style={{ fontSize:20 }}>⏳</span> : <span style={{ fontSize:22 }}>🌟</span>}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:'#F1F5F9' }}>
                {t(lang,'Kundli Strength Report','कुंडली बल रिपोर्ट')}
              </div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>
                {st
                  ? <span style={{ color:c, fontWeight:600 }}>{st.overall_score}/100 — {t(lang, st.label?.en, st.label?.hi)}</span>
                  : t(lang,'How strong is this Kundli? Click to analyse all planets, yogas & life domains.','यह कुंडली कितनी मजबूत है? सभी ग्रह, योग और जीवन क्षेत्रों का विश्लेषण देखें।')}
              </div>
            </div>
          </div>
          {st && !open && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[
                { lbl: t(lang,'Planets','ग्रह'),   val: st.planet_avg },
                { lbl: t(lang,'Yogas','योग'),       val: st.yoga_score },
                { lbl: t(lang,'Life Areas','क्षेत्र'),val: st.domain_avg },
                { lbl: t(lang,'Dasha','दशा'),       val: st.dasha_score },
              ].map(({ lbl, val }) => (
                <div key={lbl} style={{ textAlign:'center', padding:'6px 12px', background:'rgba(255,255,255,0.04)', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:scoreColor(val) }}>{val}</div>
                  <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em' }}>{lbl}</div>
                </div>
              ))}
            </div>
          )}
          <span style={{ fontSize:12, color:'#475569', flexShrink:0 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div style={{ border:`1px solid ${c}33`, borderTop:'none', borderRadius:'0 0 14px 14px', overflow:'hidden' }}>

          {loading && (
            <div style={{ padding:32, textAlign:'center', color:'#64748B' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🌟</div>
              <p style={{ fontSize:12 }}>{t(lang,'Analysing all planets, yogas and life domains…','सभी ग्रह, योग और जीवन क्षेत्रों का विश्लेषण हो रहा है…')}</p>
            </div>
          )}

          {st && (
            <div style={{ background:'rgba(10,12,28,0.5)' }}>

              {/* ── Score Summary ── */}
              <div style={{ padding:'20px 20px 0' }}>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start', marginBottom:20 }}>
                  <ScoreRing score={st.overall_score} label={st.label} lang={lang} />
                  <CategoryBars st={st} lang={lang} />
                </div>

                {/* Verdict */}
                <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${c}28`, borderRadius:10, marginBottom:20 }}>
                  <p style={{ fontSize:12, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
                    {t(lang, st.verdict_en, st.verdict_hi)}
                  </p>
                </div>

                {/* Current Dasha */}
                {st.current_mahadasha && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                    {[st.current_mahadasha, st.current_antardasha].filter(Boolean).map((d, i) => {
                      const pm = PLANET_META[d.planet] || { icon:'●', color:'#94A3B8', hi:d.planet };
                      const dc = scoreColor(d.score);
                      return (
                        <div key={i} style={{ padding:'10px 16px', background:`${pm.color}10`, border:`1px solid ${pm.color}30`, borderRadius:10, display:'flex', gap:10, alignItems:'center' }}>
                          <span style={{ fontSize:20, color:pm.color }}>{pm.icon}</span>
                          <div>
                            <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>
                              {i === 0 ? t(lang,'Mahadasha','महादशा') : t(lang,'Antardasha','अंतर्दशा')}
                            </div>
                            <div style={{ fontSize:13, fontWeight:700, color:pm.color }}>
                              {t(lang, d.planet, d.planet_hi)}
                            </div>
                            <div style={{ fontSize:10, color:dc }}>{d.score}/100 {t(lang,'strength for this chart','इस कुंडली के लिए बल')}</div>
                            {d.end_date && <div style={{ fontSize:9, color:'#475569' }}>{t(lang,'Until','तक')} {d.end_date}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Life Domains ── */}
              <div style={{ padding:'0 20px 20px' }}>
                <h4 style={{ fontSize:11, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 10px', borderBottom:'1px solid rgba(212,175,55,0.12)', paddingBottom:6 }}>
                  {t(lang,'Life Domain Analysis','जीवन क्षेत्र विश्लेषण')}
                </h4>
                <LifeDomainGrid domains={st.life_domain_list} lang={lang} />
              </div>

              {/* ── Planet Table ── */}
              <div style={{ padding:'0 20px 20px' }}>
                <h4 style={{ fontSize:11, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 10px', borderBottom:'1px solid rgba(212,175,55,0.12)', paddingBottom:6 }}>
                  {t(lang,'Planet-by-Planet Strength','ग्रह-दर-ग्रह बल विश्लेषण')}
                </h4>
                <PlanetStrengthTable scores={st.planet_scores} natalPlanets={natalPlanets} lang={lang} />
              </div>

              {/* ── Strengths & Challenges ── */}
              <div style={{ padding:'0 20px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <h4 style={{ fontSize:11, fontWeight:700, color:'#22C55E', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 10px' }}>
                    ✦ {t(lang,'Key Strengths','प्रमुख शक्तियां')}
                  </h4>
                  {st.strengths_en?.length > 0
                    ? st.strengths_en.map((s, i) => (
                        <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                          <span style={{ color:'#22C55E', flexShrink:0, marginTop:1 }}>◈</span>
                          <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.75, margin:0 }}>
                            {t(lang, s, st.strengths_hi?.[i] || s)}
                          </p>
                        </div>
                      ))
                    : <p style={{ fontSize:11, color:'#475569' }}>{t(lang,'Analysing…','विश्लेषण…')}</p>
                  }
                </div>
                <div>
                  <h4 style={{ fontSize:11, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 10px' }}>
                    ▲ {t(lang,'Key Challenges','प्रमुख चुनौतियां')}
                  </h4>
                  {st.challenges_en?.length > 0
                    ? st.challenges_en.map((s, i) => (
                        <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                          <span style={{ color:'#F97316', flexShrink:0, marginTop:1 }}>▸</span>
                          <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.75, margin:0 }}>
                            {t(lang, s, st.challenges_hi?.[i] || s)}
                          </p>
                        </div>
                      ))
                    : <p style={{ fontSize:11, color:'#475569' }}>{t(lang,'No major challenges found.','कोई बड़ी चुनौती नहीं मिली।')}</p>
                  }
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
