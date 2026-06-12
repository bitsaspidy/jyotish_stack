'use client';
import { useEffect, useState } from 'react';
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

const PLANET_NAMES = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

function sc(s) {
  if (s >= 75) return '#10B981';
  if (s >= 60) return '#22C55E';
  if (s >= 48) return '#F59E0B';
  if (s >= 35) return '#F97316';
  return '#EF4444';
}

function ScoreBar({ val, maxVal = 100, height = 6 }) {
  const pct = Math.min(100, Math.round((val / maxVal) * 100));
  const color = sc(val);
  return (
    <div style={{ height, background:'rgba(255,255,255,0.08)', borderRadius:height, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:height }} />
    </div>
  );
}

// ── Conic-gradient score meter ────────────────────────────────────────────────
function ScoreMeter({ score, label, lang }) {
  const color = label?.color || sc(score);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flexShrink:0 }}>
      <div style={{ position:'relative', width:112, height:112 }}>
        <div style={{
          width:112, height:112, borderRadius:'50%',
          background:`conic-gradient(${color} ${score}%, rgba(255,255,255,0.07) ${score}%)`,
        }} />
        <div style={{
          position:'absolute', top:10, left:10, width:92, height:92,
          borderRadius:'50%', background:'#0a0c1c',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ fontSize:28, fontWeight:900, color:'#F1F5F9', lineHeight:1 }}>{score}</span>
          <span style={{ fontSize:10, color:'#475569', lineHeight:1.2 }}>/100</span>
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, fontWeight:700, color }}>{t(lang, label?.en, label?.hi)}</div>
        <div style={{ fontSize:10, color:'#475569' }}>{t(lang,'Overall Kundli','समग्र कुंडली')}</div>
      </div>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function Heading({ children }) {
  return (
    <h4 style={{
      fontSize:11, fontWeight:700, color:'#D4AF37', textTransform:'uppercase',
      letterSpacing:'0.12em', margin:'0 0 12px',
      borderBottom:'1px solid rgba(212,175,55,0.13)', paddingBottom:7,
    }}>
      {children}
    </h4>
  );
}

// ── Category bar row ──────────────────────────────────────────────────────────
function CatBar({ icon, label, val }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontSize:11, color:'#CBD5E1' }}>{icon} {label}</span>
        <span style={{ fontSize:12, fontWeight:700, color:sc(val) }}>{val}<span style={{ fontSize:9, color:'#475569' }}>/100</span></span>
      </div>
      <ScoreBar val={val} />
    </div>
  );
}

// ── Life domain cards ─────────────────────────────────────────────────────────
function DomainGrid({ domains, lang }) {
  if (!domains?.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:8 }}>
      {domains.map((d) => {
        if (!d) return null;
        const color = d.label?.color || '#F59E0B';
        return (
          <div key={d.key} style={{
            padding:'10px 13px', background:'rgba(255,255,255,0.025)',
            border:`1px solid ${color}25`, borderRadius:10,
          }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#E2E8F0', marginBottom:5 }}>
              {t(lang, d.en, d.hi)}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <span style={{ fontSize:18, fontWeight:800, color, lineHeight:1 }}>{d.score}</span>
              <span style={{ fontSize:9, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', background:`${color}18`, padding:'2px 7px', borderRadius:8 }}>
                {t(lang, d.label?.en, d.label?.hi)}
              </span>
            </div>
            <ScoreBar val={d.score} />
          </div>
        );
      })}
    </div>
  );
}

// ── Planet strength table ─────────────────────────────────────────────────────
function PlanetTable({ scores, natalPlanets, lang }) {
  if (!scores) return null;
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {[
              t(lang,'Planet','ग्रह'),
              t(lang,'Dignity','स्थिति'),
              t(lang,'House','भाव'),
              t(lang,'Strength','बल'),
              '',
            ].map((h, i) => (
              <th key={i} style={{
                padding:'5px 10px', textAlign:'left', color:'#475569',
                fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', fontSize:9,
                whiteSpace:'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLANET_NAMES.map((name) => {
            const pd  = natalPlanets?.[name];
            const val = scores[name] || 50;
            const pm  = PLANET_META[name] || { icon:'●', color:'#94A3B8', hi:name };
            const color = sc(val);
            const dignity    = pd?.dignity?.split('(')[0].trim() || '—';
            const dignityHi  = pd?.dignity?.match(/\(([^)]+)\)/)?.[1] || dignity;
            const label  = val >= 72 ? t(lang,'Strong','प्रबल')
                         : val >= 52 ? t(lang,'Moderate','मध्यम')
                         :             t(lang,'Weak','कमजोर');
            return (
              <tr key={name} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                {/* Planet */}
                <td style={{ padding:'9px 10px', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:15, color:pm.color, marginRight:6 }}>{pm.icon}</span>
                  <span style={{ color:'#E2E8F0', fontWeight:600 }}>{t(lang, name, pm.hi)}</span>
                  {pd?.is_retrograde && <span style={{ color:'#F59E0B', fontSize:10, marginLeft:4 }}>℞</span>}
                </td>
                {/* Dignity */}
                <td style={{ padding:'9px 10px', color:'#94A3B8', fontSize:10, maxWidth:110 }}>
                  {t(lang, dignity, dignityHi)}
                </td>
                {/* House */}
                <td style={{ padding:'9px 10px', color:'#CBD5E1', fontWeight:700, whiteSpace:'nowrap' }}>
                  {pd?.house ? `H${pd.house}` : '—'}
                </td>
                {/* Score + bar */}
                <td style={{ padding:'9px 10px', minWidth:100 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:800, color, minWidth:26 }}>{val}</span>
                    <div style={{ flex:1, minWidth:50 }}><ScoreBar val={val} /></div>
                  </div>
                </td>
                {/* Label badge */}
                <td style={{ padding:'9px 10px', whiteSpace:'nowrap' }}>
                  <span style={{
                    fontSize:9, fontWeight:700, color, textTransform:'uppercase',
                    padding:'2px 8px', background:`${color}18`,
                    border:`1px solid ${color}35`, borderRadius:8,
                  }}>{label}</span>
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
  const [st,       setSt]      = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);
  const [expanded, setExpanded]= useState(false);

  // Auto-load on mount
  useEffect(() => {
    if (!kundliUuid) { setLoading(false); return; }
    api.get(`/kundli/${kundliUuid}/strength`)
      .then(r => { setSt(r.data.strength); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [kundliUuid]);

  const color = st ? sc(st.overall_score) : '#D4AF37';

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding:'18px 20px', background:'rgba(32,38,70,0.80)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:14, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(212,175,55,0.1)', border:'2px solid rgba(212,175,55,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🌟</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#E2E8F0', marginBottom:4 }}>{t(lang,'Kundli Strength Report','कुंडली बल रिपोर्ट')}</div>
          <div style={{ fontSize:11, color:'#475569' }}>{t(lang,'Analysing planets, yogas & life domains…','ग्रह, योग और जीवन क्षेत्रों का विश्लेषण हो रहा है…')}</div>
        </div>
      </div>
    );
  }

  if (error || !st) return null;

  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${color}35` }}>

      {/* ── Header row (always visible) ── */}
      <div style={{ padding:'16px 20px', background:'rgba(17,20,40,0.7)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', cursor:'pointer' }} onClick={() => setExpanded(v => !v)}>

        {/* Score pill */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:200 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
            <div style={{ position:'relative', width:54, height:54 }}>
              <div style={{ width:54, height:54, borderRadius:'50%', background:`conic-gradient(${color} ${st.overall_score}%, rgba(255,255,255,0.08) ${st.overall_score}%)` }} />
              <div style={{ position:'absolute', top:5, left:5, width:44, height:44, borderRadius:'50%', background:'#0a0c1c', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:15, fontWeight:900, color:'#F1F5F9', lineHeight:1 }}>{st.overall_score}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F1F5F9' }}>
              {t(lang,'Kundli Strength Report','कुंडली बल रिपोर्ट')}
            </div>
            <div style={{ fontSize:12, color, fontWeight:600, marginTop:2 }}>
              {t(lang, st.label?.en, st.label?.hi)} — {st.overall_score}/100
            </div>
          </div>
        </div>

        {/* 4 mini scores */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { label:t(lang,'Planets','ग्रह'),    val:st.planet_avg  },
            { label:t(lang,'Yogas','योग'),        val:st.yoga_score  },
            { label:t(lang,'Life Areas','क्षेत्र'),val:st.domain_avg },
            { label:t(lang,'Dasha','दशा'),        val:st.dasha_score },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign:'center', padding:'6px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, minWidth:58 }}>
              <div style={{ fontSize:15, fontWeight:800, color:sc(val), lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:9, color:'#475569', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
            </div>
          ))}
        </div>

        <span style={{ fontSize:13, color:'#475569' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{ background:'rgba(10,12,28,0.5)', padding:'0 20px 24px' }}>

          {/* ── Score overview + verdict ── */}
          <div style={{ paddingTop:20, display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start', marginBottom:20 }}>
            <ScoreMeter score={st.overall_score} label={st.label} lang={lang} />
            <div style={{ flex:1, minWidth:220 }}>
              {/* Category bars */}
              <div style={{ marginBottom:16 }}>
                <CatBar icon="🪐" label={t(lang,'Planet Strengths','ग्रह बल')}      val={st.planet_avg}  />
                <CatBar icon="✦"  label={t(lang,'Yoga & Dosha','योग और दोष')}       val={st.yoga_score}  />
                <CatBar icon="🌐" label={t(lang,'Life Domains','जीवन क्षेत्र')}    val={st.domain_avg}  />
                <CatBar icon="🔮" label={t(lang,'Current Dasha','वर्तमान दशा')}    val={st.dasha_score} />
              </div>
              {/* Yoga / Dosha count */}
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ padding:'7px 14px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.22)', borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'#22C55E' }}>{st.yoga_count}</div>
                  <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang,'Good Yogas','शुभ योग')}</div>
                </div>
                <div style={{ padding:'7px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'#EF4444' }}>{st.dosha_count}</div>
                  <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang,'Doshas','दोष')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${color}22`, borderRadius:10, marginBottom:20 }}>
            <p style={{ fontSize:12, color:'rgba(245,240,232,0.82)', lineHeight:1.9, margin:0 }}>
              {t(lang, st.verdict_en, st.verdict_hi)}
            </p>
          </div>

          {/* ── Current Dasha ── */}
          {st.current_mahadasha && (
            <div style={{ marginBottom:20 }}>
              <Heading>{t(lang,'Current Dasha Strength','वर्तमान दशा बल')}</Heading>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  { d: st.current_mahadasha, label: t(lang,'Mahadasha','महादशा') },
                  st.current_antardasha ? { d: st.current_antardasha, label: t(lang,'Antardasha','अंतर्दशा') } : null,
                ].filter(Boolean).map(({ d, label }) => {
                  const pm = PLANET_META[d.planet] || { icon:'●', color:'#94A3B8', hi:d.planet };
                  return (
                    <div key={label} style={{ padding:'12px 16px', background:`${pm.color}0d`, border:`1px solid ${pm.color}28`, borderRadius:10, display:'flex', gap:12, alignItems:'center', minWidth:180 }}>
                      <span style={{ fontSize:24, color:pm.color }}>{pm.icon}</span>
                      <div>
                        <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:pm.color }}>{t(lang, d.planet, d.planet_hi)}</div>
                        <div style={{ fontSize:11, color:sc(d.score), fontWeight:600 }}>{d.score}/100 {t(lang,'strength','बल')}</div>
                        {d.end_date && (
                          <div style={{ fontSize:9, color:'#475569', marginTop:2 }}>{t(lang,'Until','तक')} {d.end_date}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Life domains ── */}
          <div style={{ marginBottom:20 }}>
            <Heading>{t(lang,'Life Domain Analysis','जीवन क्षेत्र विश्लेषण')}</Heading>
            <DomainGrid domains={st.life_domain_list} lang={lang} />
          </div>

          {/* ── Planet table ── */}
          <div style={{ marginBottom:20 }}>
            <Heading>{t(lang,'Planet-by-Planet Strength','ग्रह-दर-ग्रह बल')}</Heading>
            <PlanetTable scores={st.planet_scores} natalPlanets={natalPlanets} lang={lang} />
          </div>

          {/* ── Strengths & Challenges ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {/* Strengths */}
            <div>
              <Heading>✦ {t(lang,'Key Strengths','प्रमुख शक्तियां')}</Heading>
              {(st.strengths_en?.length > 0)
                ? st.strengths_en.map((s, i) => (
                    <div key={i} style={{ display:'flex', gap:10, marginBottom:10, padding:'8px 12px', background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:8 }}>
                      <span style={{ color:'#22C55E', flexShrink:0, fontSize:14 }}>◈</span>
                      <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.8, margin:0 }}>
                        {t(lang, s, st.strengths_hi?.[i] || s)}
                      </p>
                    </div>
                  ))
                : <p style={{ fontSize:11, color:'#475569' }}>{t(lang,'No exceptional strengths identified.','विशेष शक्तियां नहीं मिलीं।')}</p>
              }
            </div>
            {/* Challenges */}
            <div>
              <Heading>▲ {t(lang,'Key Challenges','प्रमुख चुनौतियां')}</Heading>
              {(st.challenges_en?.length > 0)
                ? st.challenges_en.map((s, i) => (
                    <div key={i} style={{ display:'flex', gap:10, marginBottom:10, padding:'8px 12px', background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8 }}>
                      <span style={{ color:'#F97316', flexShrink:0, fontSize:14 }}>▸</span>
                      <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.8, margin:0 }}>
                        {t(lang, s, st.challenges_hi?.[i] || s)}
                      </p>
                    </div>
                  ))
                : <p style={{ fontSize:11, color:'#475569' }}>{t(lang,'No major challenges identified.','कोई बड़ी चुनौती नहीं मिली।')}</p>
              }
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
