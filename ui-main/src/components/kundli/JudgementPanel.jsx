'use client';

const JSTATUS = {
  strong:       { c:'#22C55E', bg:'rgba(34,197,94,0.12)',   b:'rgba(34,197,94,0.28)',   label:'Strong',       labelHi:'मजबूत'        },
  balanced:     { c:'#60A5FA', bg:'rgba(96,165,250,0.12)',  b:'rgba(96,165,250,0.28)',  label:'Balanced',     labelHi:'संतुलित'      },
  'needs-care': { c:'#F59E0B', bg:'rgba(245,158,11,0.12)',  b:'rgba(245,158,11,0.28)',  label:'Needs Care',   labelHi:'देखभाल जरूरी' },
  challenging:  { c:'#EF4444', bg:'rgba(239,68,68,0.12)',   b:'rgba(239,68,68,0.28)',   label:'Challenging',  labelHi:'चुनौतीपूर्ण'  },
};

const ACTIVATION_STYLE = {
  full:    { c:'#22C55E', bg:'rgba(34,197,94,0.15)',  label:'Full',    labelHi:'पूर्ण'    },
  partial: { c:'#F59E0B', bg:'rgba(245,158,11,0.14)', label:'Partial', labelHi:'आंशिक'   },
  weak:    { c:'#F97316', bg:'rgba(249,115,22,0.13)', label:'Weak',    labelHi:'कमज़ोर'   },
  blocked: { c:'#EF4444', bg:'rgba(239,68,68,0.12)',  label:'Blocked', labelHi:'अवरुद्ध' },
};

const GOLD  = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.92)';
const DIM   = 'rgba(245,240,232,0.55)';

function ScoreRing({ score, size = 90 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(score, 100) / 100);
  const color = score >= 65 ? '#22C55E' : score >= 48 ? '#60A5FA' : score >= 35 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transform:'rotate(-90deg)', transformOrigin:'center' }} />
      <text x={size/2} y={size/2 + 7} textAnchor="middle" fill={color} fontSize={20} fontWeight={700}>{score}</text>
    </svg>
  );
}

export default function JudgementPanel({ judgement, lang = 'hi', admin = false }) {
  if (!judgement) return null;
  const isHi = lang === 'hi';
  const overallSt    = JSTATUS[judgement.overallStatus] || JSTATUS.balanced;
  const overallLabel = isHi ? judgement.overallLabel?.hi : judgement.overallLabel?.en;

  return (
    <div style={{ border:'1px solid rgba(167,139,250,0.28)', borderRadius:16, padding:'20px 22px', marginBottom:20, background:'rgba(167,139,250,0.04)' }}>

      {/* ── Overall score row ─────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20, flexWrap:'wrap' }}>
        <ScoreRing score={judgement.overallScore ?? 0} />
        <div style={{ flex:1, minWidth:140 }}>
          <h3 style={{ color:'#A78BFA', fontFamily:'Georgia,serif', fontSize:16, fontWeight:700, marginBottom:8 }}>
            ⚖️ {isHi ? 'कुंडली निर्णय स्कोर' : 'Kundli Judgement Score'}
          </h3>
          <span style={{ fontSize:12, fontWeight:700, color:overallSt.c, background:overallSt.bg, border:`1px solid ${overallSt.b}`, borderRadius:12, padding:'3px 12px' }}>
            {overallLabel}
          </span>
          <p style={{ color:DIM, fontSize:11.5, lineHeight:1.7, marginTop:9 }}>
            {isHi
              ? '11 परत के शुद्ध ज्योतिषीय नियमों पर आधारित। 65+ मजबूत · 48–64 संतुलित · 35–47 देखभाल जरूरी।'
              : '11-layer pure Vedic rule analysis. 65+ strong · 48–64 balanced · 35–47 needs care.'}
          </p>
        </div>
      </div>

      {/* ── Area cards ────────────────────────────────────────────────────── */}
      {(judgement.areas || []).length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:10 }}>
          {judgement.areas.map(a => {
            const st      = JSTATUS[a.status] || JSTATUS.balanced;
            const title   = isHi ? (a.titleHi  || a.titleEn)  : a.titleEn;
            const summary = isHi ? (a.userSummaryHi || a.userSummaryEn) : a.userSummaryEn;
            const slabel  = isHi ? st.labelHi : st.label;

            return (
              <div key={a.areaKey} style={{ background:st.bg, border:`1px solid ${st.b}`, borderRadius:10, padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:IVORY, lineHeight:1.3 }}>{title}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:st.c, background:'rgba(0,0,0,0.22)', borderRadius:8, padding:'2px 8px', whiteSpace:'nowrap', flexShrink:0 }}>
                    {slabel}
                  </span>
                </div>

                {/* Score bar */}
                <div style={{ height:4, borderRadius:4, background:'rgba(255,255,255,0.08)', marginBottom:8 }}>
                  <div style={{ height:'100%', width:`${a.score || 0}%`, borderRadius:4, background:st.c }} />
                </div>

                {summary && (
                  <p style={{ fontSize:11, color:DIM, lineHeight:1.65, marginBottom: a.areaKey === 'yogas' && (a.yogas || []).length ? 7 : 0 }}>
                    {summary}
                  </p>
                )}

                {/* Yoga activation chips (yogas area only) */}
                {a.areaKey === 'yogas' && (a.yogas || []).length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5 }}>
                    {a.yogas.map(y => {
                      const aS = ACTIVATION_STYLE[y.activation] || ACTIVATION_STYLE.partial;
                      return (
                        <span key={y.name} style={{ fontSize:9.5, fontWeight:600, color:aS.c, background:aS.bg, borderRadius:7, padding:'2px 7px' }}>
                          {isHi ? (y.nameHi || y.name) : y.name} · {isHi ? aS.labelHi : aS.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Advice (user view only) */}
                {!admin && (isHi ? (a.adviceHi || a.advice || []) : (a.advice || [])).map((adv, i) => (
                  <div key={i} style={{ marginTop:7, fontSize:11, color:'#A7F3D0', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:6, padding:'5px 8px', lineHeight:1.6 }}>
                    ✓ {adv}
                  </div>
                ))}

                {/* Admin technical details */}
                {admin && a.technical?.visibleOnlyInAdmin && a.technical.rawScore != null && (
                  <div style={{ marginTop:8, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:7 }}>
                    <p style={{ fontSize:10, color:'rgba(245,240,232,0.35)' }}>
                      raw {a.technical.rawScore} · {(a.technical.blockers || []).length} blockers · {(a.technical.rulesApplied || []).length} rules
                    </p>
                    {(a.technical.blockers || []).length > 0 && (
                      <p style={{ fontSize:10, color:'#FCA5A5', marginTop:3, lineHeight:1.6 }}>
                        {a.technical.blockers.join(' | ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Admin-only: chart signals ─────────────────────────────────────── */}
      {admin && (
        <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:8 }}>
          {judgement.lagnaStrength && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.14)', borderRadius:8, padding:'9px 12px' }}>
              <p style={{ color:GOLD, fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Lagna Strength</p>
              <p style={{ fontSize:11, color:DIM }}>
                Score {judgement.lagnaStrength.score} · {judgement.lagnaStrength.label || judgement.lagnaStrength.status}
              </p>
            </div>
          )}
          {judgement.pillarStrength && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(96,165,250,0.18)', borderRadius:8, padding:'9px 12px' }}>
              <p style={{ color:'#60A5FA', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Sun / Moon Pillars</p>
              <p style={{ fontSize:11, color:DIM }}>
                ☉ {judgement.pillarStrength.sunScore} · ☽ {judgement.pillarStrength.moonScore} · {judgement.pillarStrength.status}
              </p>
            </div>
          )}
          {judgement.rahuPlacement && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(167,139,250,0.18)', borderRadius:8, padding:'9px 12px' }}>
              <p style={{ color:'#A78BFA', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Rahu Placement</p>
              <p style={{ fontSize:11, color:DIM }}>
                H{judgement.rahuPlacement.house} · {judgement.rahuPlacement.potential} · score {judgement.rahuPlacement.score}
              </p>
            </div>
          )}
          {judgement.ashtakavargaGuard && Object.keys(judgement.ashtakavargaGuard).length > 0 && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:8, padding:'9px 12px' }}>
              <p style={{ color:'#F59E0B', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>AV Guard</p>
              <p style={{ fontSize:11, color:DIM }}>
                {Object.values(judgement.ashtakavargaGuard).some(p => p?.majorDosha) ? '⚠ major dosha' : '✓ clear'}
                {` · ${Object.keys(judgement.ashtakavargaGuard).length} planets`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
