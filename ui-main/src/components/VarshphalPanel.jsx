'use client';
import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

const t = (lang, en, hi) => (lang === 'hi' ? hi : en);

const PLANET_META = {
  Sun:     { icon:'☉', color:'#FBBF24', hi:'सूर्य'     },
  Moon:    { icon:'☽', color:'#94A3B8', hi:'चन्द्र'    },
  Mars:    { icon:'♂', color:'#EF4444', hi:'मंगल'       },
  Mercury: { icon:'☿', color:'#10B981', hi:'बुध'        },
  Jupiter: { icon:'♃', color:'#F97316', hi:'बृहस्पति'  },
  Venus:   { icon:'♀', color:'#F472B6', hi:'शुक्र'      },
  Saturn:  { icon:'♄', color:'#818CF8', hi:'शनि'        },
  Rahu:    { icon:'☊', color:'#A78BFA', hi:'राहु'       },
  Ketu:    { icon:'☋', color:'#6B7280', hi:'केतु'       },
};

const SCORE_COLOR = ['','#EF4444','#F97316','#F59E0B','#22C55E','#10B981'];
const SCORE_LABEL = { en:['','Difficult','Challenging','Moderate','Favorable','Excellent'], hi:['','कठिन','चुनौतीपूर्ण','सामान्य','अनुकूल','उत्कृष्ट'] };
const HOUSE_ORD   = ['','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const HOUSE_ORD_HI= ['','प्रथम','द्वितीय','तृतीय','चतुर्थ','पंचम','षष्ठ','सप्तम','अष्टम','नवम','दशम','एकादश','द्वादश'];

const TONE_STYLE = {
  favorable:   { color:'#22C55E', bg:'rgba(34,197,94,0.08)',   border:'rgba(34,197,94,0.2)'  },
  challenging: { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)'  },
  moderate:    { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)' },
};

function Badge({ label, color = '#D4AF37', bg, border }) {
  return (
    <span style={{
      fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
      padding:'2px 9px', borderRadius:20,
      background: bg || `${color}18`, border:`1px solid ${border || color+'44'}`, color,
    }}>{label}</span>
  );
}

function SectionHeader({ title, lang }) {
  return (
    <h3 style={{ fontSize:11, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em', margin:'18px 0 10px', borderBottom:'1px solid rgba(212,175,55,0.15)', paddingBottom:6 }}>
      {title}
    </h3>
  );
}

// ── Varshesha Card ────────────────────────────────────────────────────────────
function VarshaeshaCard({ varshesha, varshesha_hi, desc_en, desc_hi, house, lang }) {
  const pm = PLANET_META[varshesha] || { icon:'●', color:'#D4AF37', hi: varshesha };
  return (
    <div style={{ padding:'14px 18px', background:`${pm.color}12`, border:`1px solid ${pm.color}33`, borderRadius:12, display:'flex', gap:14 }}>
      <div style={{ fontSize:32, lineHeight:1 }}>{pm.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
          <span style={{ fontSize:15, fontWeight:700, color: pm.color }}>
            {t(lang, `${varshesha} — Year Lord`, `${lang==='hi'?pm.hi:varshesha} — वर्षेश`)}
          </span>
          {house && <Badge label={t(lang,`${HOUSE_ORD[house]} House`,`${HOUSE_ORD_HI[house]} भाव`)} color={pm.color} />}
        </div>
        <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.75, margin:0 }}>
          {t(lang, desc_en, desc_hi)}
        </p>
      </div>
    </div>
  );
}

// ── Mudda Dasha Timeline ──────────────────────────────────────────────────────
function MuddaDashaTimeline({ periods, lang }) {
  if (!periods?.length) return null;
  const totalDays = periods.reduce((s, p) => s + p.days, 0);
  return (
    <div>
      {/* Bar */}
      <div style={{ display:'flex', height:28, borderRadius:8, overflow:'hidden', marginBottom:12, border:'1px solid rgba(255,255,255,0.06)' }}>
        {periods.map((p) => {
          const pm = PLANET_META[p.planet] || { color:'#64748B' };
          const pct = (p.days / totalDays) * 100;
          return (
            <div key={p.planet} title={p.planet} style={{ width:`${pct}%`, background: pm.color, opacity: p.is_current ? 1 : 0.5, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', minWidth:2 }}>
              {pct > 5 && <span style={{ fontSize:9, color:'#000', fontWeight:700, opacity:0.8, textShadow:'none' }}>{pm.icon}</span>}
              {p.is_current && (
                <div style={{ position:'absolute', top:-4, left:'50%', transform:'translateX(-50%)', width:4, height:4, background:'#fff', borderRadius:'50%' }} />
              )}
            </div>
          );
        })}
      </div>
      {/* List */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6 }}>
        {periods.map((p) => {
          const pm = PLANET_META[p.planet] || { icon:'●', color:'#64748B', hi: p.planet };
          return (
            <div key={p.planet} style={{
              padding:'8px 12px', borderRadius:8,
              background: p.is_current ? `${pm.color}15` : 'rgba(255,255,255,0.03)',
              border:`1px solid ${p.is_current ? pm.color+'44' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <span style={{ fontSize:14, color: pm.color }}>{pm.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color: pm.color }}>
                  {t(lang, p.planet, pm.hi)}
                </span>
                {p.is_current && <Badge label={t(lang,'Current','वर्तमान')} color={pm.color} />}
                <span style={{ fontSize:10, color:'#64748B', marginLeft:'auto' }}>{p.days}d</span>
              </div>
              <div style={{ fontSize:10, color:'#94A3B8' }}>
                {p.start_date} → {p.end_date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Planet Table ──────────────────────────────────────────────────────────────
function PlanetTable({ planets, movement, lang }) {
  const names = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {[t(lang,'Planet','ग्रह'), t(lang,'Rashi','राशि'), t(lang,'House','भाव'), t(lang,'Degree','अंश'), t(lang,'Retro','वक्री'), t(lang,'Natal House','जन्म भाव')].map((h) => (
              <th key={h} style={{ padding:'6px 10px', textAlign:'left', color:'#64748B', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', fontSize:9 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((name) => {
            const pd = planets[name];
            const mv = movement?.[name];
            const pm = PLANET_META[name] || { icon:'●', color:'#94A3B8', hi: name };
            if (!pd) return null;
            const moved = mv?.moved;
            return (
              <tr key={name} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: moved ? 'rgba(212,175,55,0.04)' : 'transparent' }}>
                <td style={{ padding:'8px 10px' }}>
                  <span style={{ fontSize:15, color: pm.color, marginRight:6 }}>{pm.icon}</span>
                  <span style={{ color:'#E2E8F0', fontWeight:600 }}>{t(lang, name, pm.hi)}</span>
                </td>
                <td style={{ padding:'8px 10px', color:'#CBD5E1' }}>{t(lang, pd.rashi_en, pd.rashi_hi)}</td>
                <td style={{ padding:'8px 10px', color: pm.color, fontWeight:700 }}>{HOUSE_ORD[pd.house]}</td>
                <td style={{ padding:'8px 10px', color:'#94A3B8', fontFamily:'monospace', fontSize:10 }}>{pd.degree_in_sign}°</td>
                <td style={{ padding:'8px 10px' }}>{pd.is_retrograde ? <span style={{ color:'#F59E0B' }}>℞</span> : <span style={{ color:'#334155' }}>—</span>}</td>
                <td style={{ padding:'8px 10px', color: moved ? '#D4AF37' : '#64748B' }}>
                  {mv?.natal_house ? HOUSE_ORD[mv.natal_house] : '—'}
                  {moved && <span style={{ fontSize:9, color:'#D4AF37', marginLeft:4 }}>↗</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── House Grid ────────────────────────────────────────────────────────────────
function HouseGrid({ house_readings, lang }) {
  const [expanded, setExpanded] = useState(null);
  if (!house_readings) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
      {Array.from({ length:12 }, (_, i) => {
        const h  = i + 1;
        const hr = house_readings[h];
        if (!hr) return null;
        const ts = TONE_STYLE[hr.tone] || TONE_STYLE.moderate;
        const isOpen = expanded === h;
        return (
          <div key={h} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${ts.border}`, borderRadius:10, overflow:'hidden' }}>
            <button onClick={() => setExpanded(isOpen ? null : h)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:24, height:24, borderRadius:'50%', background:`${ts.color}18`, border:`1px solid ${ts.color}33`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color: ts.color, flexShrink:0 }}>{h}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#E2E8F0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{hr.theme}</div>
                  {hr.occupants.length > 0 && (
                    <div style={{ display:'flex', gap:4, marginTop:3, flexWrap:'wrap' }}>
                      {hr.occupants.map((p) => {
                        const pm2 = PLANET_META[p] || { icon:'●', color:'#94A3B8' };
                        return <span key={p} style={{ fontSize:11, color: pm2.color }}>{pm2.icon}</span>;
                      })}
                    </div>
                  )}
                </div>
                <span style={{ fontSize:10, color:'#64748B' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ padding:'0 12px 12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.7, margin:'8px 0 0' }}>
                  {t(lang, hr.reading_en, hr.reading_hi)}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Area Summary Chips ────────────────────────────────────────────────────────
function AreaChips({ analysis, lang }) {
  const areas = [
    { key:'career',   icon:'💼', en:'Career',       hi:'करियर', data: analysis.career   },
    { key:'finance',  icon:'💰', en:'Finance',      hi:'धन',    data: analysis.finance  },
    { key:'relation', icon:'💞', en:'Relationships', hi:'संबंध', data: analysis.relation },
    { key:'health',   icon:'🌿', en:'Health',       hi:'स्वास्थ्य', data: analysis.health },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
      {areas.map(({ key, icon, en, hi, data }) => {
        if (!data) return null;
        const tone = data.tone || 'moderate';
        const ts   = TONE_STYLE[tone] || TONE_STYLE.moderate;
        return (
          <div key={key} style={{ padding:'10px 14px', background: ts.bg, border:`1px solid ${ts.border}`, borderRadius:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color: ts.color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>
              {icon} {t(lang, en, hi)} — {t(lang, tone.charAt(0).toUpperCase()+tone.slice(1), tone==='favorable'?'अनुकूल':tone==='challenging'?'चुनौतीपूर्ण':'सामान्य')}
            </div>
            {data.good?.length > 0 && (
              <div style={{ fontSize:10, color:'#94A3B8' }}>
                {t(lang,'Benefic:','शुभ:')} {data.good.map((p) => PLANET_META[p]?.icon + ' ' + (lang==='hi' ? PLANET_META[p]?.hi : p)).join(', ')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Year Selector ─────────────────────────────────────────────────────────────
function YearSelector({ selected, onChange }) {
  const now = new Date().getUTCFullYear();
  const years = [now - 1, now, now + 1, now + 2];
  return (
    <div style={{ display:'flex', gap:6 }}>
      {years.map((y) => (
        <button key={y} onClick={() => onChange(y)} style={{
          padding:'6px 16px', borderRadius:20, border:'1px solid',
          fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
          background: selected===y ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
          borderColor: selected===y ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)',
          color: selected===y ? '#D4AF37' : '#94A3B8',
        }}>{y}</button>
      ))}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
const TABS = [
  { key:'overview',    en:'Year Overview',  hi:'वार्षिक सारांश' },
  { key:'life_guide',  en:'Life Guide',     hi:'जीवन मार्गदर्शन' },
  { key:'chart',       en:'Varsha Chart',   hi:'वर्ष कुंडली'     },
  { key:'houses',      en:'House Readings', hi:'भाव रीडिंग'      },
  { key:'dasha',       en:'Mudda Dasha',    hi:'मुद्दा दशा'      },
];

const LIFE_AREA_ORDER = ['finance','luck','family','spouse','parents','children','siblings','education','job','business','health'];

const TONE_ICON = { favorable:'✦', moderate:'◆', challenging:'▲' };

// ── Life Area Card ────────────────────────────────────────────────────────────
function LifeAreaCard({ area, lang }) {
  const [open, setOpen] = useState(false);
  if (!area) return null;
  const ts = TONE_STYLE[area.tone] || TONE_STYLE.moderate;
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${ts.border}`, borderRadius:12, overflow:'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'12px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20, lineHeight:1, flexShrink:0 }}>{area.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#E2E8F0' }}>{t(lang, area.title_en, area.title_hi)}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, flexWrap:'wrap' }}>
              <span style={{ fontSize:9, fontWeight:700, color: ts.color, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {TONE_ICON[area.tone]} {t(lang, area.tone.charAt(0).toUpperCase()+area.tone.slice(1), area.tone==='favorable'?'अनुकूल':area.tone==='challenging'?'चुनौतीपूर्ण':'सामान्य')}
              </span>
              <span style={{ letterSpacing:1 }}>
                {[1,2,3,4,5].map((n) => <span key={n} style={{ color: n<=area.score ? ts.color : 'rgba(255,255,255,0.1)', fontSize:10 }}>★</span>)}
              </span>
            </div>
          </div>
          <span style={{ fontSize:10, color:'#475569', flexShrink:0 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'10px 14px 12px' }}>
          <p style={{ fontSize:12, color:'#94A3B8', lineHeight:1.8, margin:'0 0 8px' }}>
            {t(lang, area.reading_en, area.reading_hi)}
          </p>
          {area.planets_involved?.length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[...new Set(area.planets_involved)].map((p) => {
                const pm = PLANET_META[p] || { icon:'●', color:'#94A3B8', hi: p };
                return (
                  <span key={p} style={{ fontSize:10, color: pm.color, background:`${pm.color}15`, border:`1px solid ${pm.color}30`, padding:'2px 8px', borderRadius:10 }}>
                    {pm.icon} {t(lang, p, pm.hi)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Caution Card ──────────────────────────────────────────────────────────────
function CautionCard({ caution, lang }) {
  return (
    <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, display:'flex', gap:10 }}>
      <span style={{ fontSize:18, lineHeight:1, flexShrink:0 }}>{caution.icon}</span>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#FCA5A5', marginBottom:4 }}>
          {t(lang, caution.title_en, caution.title_hi)}
        </div>
        <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.75, margin:0 }}>
          {t(lang, caution.desc_en, caution.desc_hi)}
        </p>
      </div>
    </div>
  );
}

// ── Key Advice Card ───────────────────────────────────────────────────────────
function KeyAdviceCard({ advice, lang }) {
  return (
    <div style={{ padding:'12px 14px', background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:10, display:'flex', gap:10 }}>
      <span style={{ fontSize:18, lineHeight:1, flexShrink:0 }}>{advice.icon}</span>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#D4AF37', marginBottom:4 }}>
          {t(lang, advice.title_en, advice.title_hi)}
        </div>
        <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.75, margin:0 }}>
          {t(lang, advice.desc_en, advice.desc_hi)}
        </p>
      </div>
    </div>
  );
}

export default function VarshphalPanel({ kundliUuid, lang = 'en' }) {
  const now = new Date().getUTCFullYear();
  const [year, setYear]     = useState(now);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const load = useCallback(async (y) => {
    if (!kundliUuid) return;
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/kundli/${kundliUuid}/varshphal?year=${y}`);
      setData(res.data.varshphal);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load Varshphal');
    } finally {
      setLoading(false);
    }
  }, [kundliUuid]);

  useEffect(() => { load(year); }, [year, load]);

  const an  = data?.analysis;
  const vc  = data?.varsha_chart;
  const score = an?.score || 3;
  const scoreColor = SCORE_COLOR[score] || '#F59E0B';

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#F1F5F9', margin:'0 0 4px' }}>
            {t(lang,'🌞 Varshphal — Annual Solar Return','🌞 वर्षफल — वार्षिक सौर कुंडली')}
          </h2>
          <p style={{ fontSize:12, color:'#64748B', margin:0 }}>
            {t(lang,'Personalized yearly prediction based on exact Solar Return (Sun\'s annual return to natal position)','नताल सूर्य के वार्षिक मिलन पर आधारित वार्षिक भविष्यफल')}
          </p>
        </div>
        <YearSelector selected={year} onChange={(y) => { setYear(y); setData(null); }} />
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:32, color:'#64748B' }}>
          <div style={{ fontSize:24, marginBottom:8 }}>☀</div>
          <p style={{ fontSize:12 }}>{t(lang,'Calculating Solar Return…','सौर कुंडली की गणना हो रही है…')}</p>
        </div>
      )}

      {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#FCA5A5', fontSize:12 }}>{error}</div>}

      {!loading && data && (
        <>
          {/* Solar Return banner */}
          <div style={{ marginBottom:16, padding:'12px 18px', background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:12, display:'flex', flexWrap:'wrap', gap:16, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:9, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:2 }}>{t(lang,'Solar Return Date','सौर वापसी तिथि')}</div>
              <div style={{ fontSize:14, color:'#F1F5F9', fontWeight:600 }}>{vc?.sr_date}</div>
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{vc?.sr_local}</div>
            </div>
            <div>
              <div style={{ fontSize:9, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:2 }}>{t(lang,'Varsha Lagna','वर्ष लग्न')}</div>
              <div style={{ fontSize:14, color:'#F1F5F9', fontWeight:600 }}>{t(lang, vc?.ascendant?.rashi_en, vc?.ascendant?.rashi_hi)}</div>
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{vc?.ascendant?.dms}</div>
            </div>
            <div>
              <div style={{ fontSize:9, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:2 }}>{t(lang,'Weekday','वार')}</div>
              <div style={{ fontSize:14, color:'#F1F5F9', fontWeight:600 }}>{t(lang, vc?.sr_weekday, vc?.sr_weekday_hi)}</div>
            </div>
            <div>
              <div style={{ fontSize:9, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:2 }}>{t(lang,'Year Rating','वर्ष रेटिंग')}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ letterSpacing:2 }}>
                  {[1,2,3,4,5].map((n) => <span key={n} style={{ color: n<=score ? scoreColor : 'rgba(255,255,255,0.12)', fontSize:14 }}>★</span>)}
                </span>
                <span style={{ fontSize:11, color: scoreColor }}>{t(lang, SCORE_LABEL.en[score], SCORE_LABEL.hi[score])}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:18, flexWrap:'wrap' }}>
            {TABS.map((tb) => {
              const active = activeTab === tb.key;
              return (
                <button key={tb.key} onClick={() => setActiveTab(tb.key)} style={{
                  padding:'7px 16px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600,
                  cursor:'pointer', transition:'all 0.15s',
                  background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                  borderColor: active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)',
                  color: active ? '#D4AF37' : '#94A3B8',
                }}>
                  {t(lang, tb.en, tb.hi)}
                </button>
              );
            })}
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && an && (
            <div>
              <div style={{ padding:'14px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, marginBottom:14 }}>
                <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
                  {t(lang, an.year_summary_en, an.year_summary_hi)}
                </p>
              </div>

              <SectionHeader title={t(lang,'Varshesha — Year Lord','वर्षेश — वर्ष स्वामी')} />
              <VarshaeshaCard
                varshesha={data.varshesha} varshesha_hi={data.varshesha_hi}
                desc_en={an.varshesha_desc_en} desc_hi={an.varshesha_desc_hi}
                house={an.varshesha_house} lang={lang}
              />

              {an.indicators_en?.length > 0 && (
                <>
                  <SectionHeader title={t(lang,'Key Indicators','प्रमुख संकेत')} />
                  <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                    {an.indicators_en.map((ind, i) => (
                      <li key={i} style={{ fontSize:12, color:'#94A3B8', display:'flex', gap:8, marginBottom:6 }}>
                        <span style={{ color:'#D4AF37', flexShrink:0 }}>◈</span>
                        <span>{t(lang, ind, an.indicators_hi?.[i] || ind)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <SectionHeader title={t(lang,'Life Area Forecast','जीवन क्षेत्र पूर्वानुमान')} />
              <AreaChips analysis={an} lang={lang} />
            </div>
          )}

          {/* Tab: Life Guide */}
          {activeTab === 'life_guide' && an?.life_areas && (
            <div>
              {/* Life Area Grid */}
              <SectionHeader title={t(lang,'All Life Areas This Year','इस वर्ष सभी जीवन क्षेत्र')} />
              <p style={{ fontSize:11, color:'#475569', margin:'0 0 12px' }}>
                {t(lang,'Click any area to read your personalised Varsha chart analysis for that life domain.','किसी भी क्षेत्र पर क्लिक करें उस जीवन क्षेत्र का व्यक्तिगत वर्ष कुंडली विश्लेषण पढ़ें।')}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8, marginBottom:24 }}>
                {LIFE_AREA_ORDER.map((key) => (
                  <LifeAreaCard key={key} area={an.life_areas[key]} lang={lang} />
                ))}
              </div>

              {/* Cautions */}
              {an.life_areas.cautions?.length > 0 && (
                <>
                  <SectionHeader title={t(lang,'⚠ Important Cautions This Year','⚠ इस वर्ष महत्वपूर्ण सावधानियां')} />
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                    {an.life_areas.cautions.map((c, i) => (
                      <CautionCard key={i} caution={c} lang={lang} />
                    ))}
                  </div>
                </>
              )}

              {/* Key Advice */}
              {an.life_areas.key_advice?.length > 0 && (
                <>
                  <SectionHeader title={t(lang,'✦ Key Advice Before Any Major Decision','✦ कोई भी बड़ा निर्णय लेने से पहले')} />
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {an.life_areas.key_advice.map((a, i) => (
                      <KeyAdviceCard key={i} advice={a} lang={lang} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Varsha Chart */}
          {activeTab === 'chart' && vc && (
            <div>
              <SectionHeader title={t(lang,'Planets at Solar Return','सौर वापसी पर ग्रह')} />
              <PlanetTable planets={vc.planets} movement={an?.planet_movement} lang={lang} />
              <p style={{ fontSize:11, color:'#64748B', marginTop:10 }}>
                {t(lang,'↗ marker indicates planet changed house from natal chart','↗ चिह्न दर्शाता है कि ग्रह जन्म कुंडली से भाव बदला है')}
              </p>
            </div>
          )}

          {/* Tab: House Readings */}
          {activeTab === 'houses' && an?.house_readings && (
            <div>
              <p style={{ fontSize:12, color:'#64748B', marginBottom:12 }}>
                {t(lang,'Click any house to expand the year prediction for that area of life.','किसी भी भाव पर क्लिक करें उस जीवन क्षेत्र की वार्षिक भविष्यवाणी देखने के लिए।')}
              </p>
              <HouseGrid house_readings={an.house_readings} lang={lang} />
            </div>
          )}

          {/* Tab: Mudda Dasha */}
          {activeTab === 'dasha' && data?.mudda_dasha && (
            <div>
              <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, marginBottom:14 }}>
                {t(lang,
                  `Mudda Dasha (Tajika annual periods) divides the year among 7 planets starting from ${data.varshesha} (Varshesha). Each planet rules a specific period, activating its karakatva for the year.`,
                  `मुद्दा दशा (ताजिका वार्षिक काल) वर्ष को ${data.varshesha_hi} (वर्षेश) से शुरू करके 7 ग्रहों में विभाजित करती है।`
                )}
              </p>
              <MuddaDashaTimeline periods={data.mudda_dasha} lang={lang} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
