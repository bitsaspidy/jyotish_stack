'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import adminApi from '../lib/adminApi';

const GOLD = '#D4AF37';
const TONE = { positive:'#22C55E', challenging:'#EF4444', neutral:'#94A3B8', strong:GOLD };
const AREA_CFG = [
  { key:'career',  icon:'💼', en:'Career',        hi:'करियर',     color:'#60A5FA' },
  { key:'love',    icon:'💑', en:'Relationships', hi:'संबंध',     color:'#EC4899' },
  { key:'health',  icon:'🌿', en:'Health',        hi:'स्वास्थ्य', color:'#22C55E' },
  { key:'finance', icon:'💰', en:'Finance',       hi:'वित्त',     color:'#F59E0B' },
];

function Stars({ n }) {
  return <span style={{ color:GOLD, fontSize:13, letterSpacing:2 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

function Chip({ children, color = GOLD }) {
  return (
    <span style={{ fontSize:10, fontWeight:700, color, background:`${color}14`,
      border:`1px solid ${color}38`, borderRadius:10, padding:'2px 9px', whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

function SecLabel({ icon, en, hi, lang, color = GOLD }) {
  return (
    <div style={{ fontSize:9, fontWeight:700, color, textTransform:'uppercase',
      letterSpacing:'0.15em', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
      {icon} {lang === 'hi' ? hi : en}
    </div>
  );
}

export default function TodayPredictionPanel({ uuid, lang = 'en', admin = false }) {
  const [pred, setPred]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [history, setHistory]   = useState(null);
  const [showHist, setShowHist] = useState(false);
  const T = (en, hi) => (lang === 'hi' ? hi : en);
  const pick = (o) => (o ? (lang === 'hi' ? (o.hi || o.en) : o.en) : null);
  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' });
  };

  useEffect(() => {
    if (!uuid) return;
    const client = admin ? adminApi : api;
    const base   = admin ? `/admin/kundlis/${uuid}` : `/kundli/${uuid}`;
    setLoading(true);
    client.get(`${base}/today`)
      .then((r) => { const d = r.data?.data || r.data; setPred(d?.prediction || null); })
      .catch(() => setPred(null))
      .finally(() => setLoading(false));
  }, [uuid, admin]);

  const loadHistory = () => {
    if (history || !admin) { setShowHist(!showHist); return; }
    adminApi.get(`/admin/kundlis/${uuid}/predictions`, { params: { limit: 10 } })
      .then((r) => { const d = r.data?.data || r.data; setHistory(d?.history || []); setShowHist(true); })
      .catch(() => setHistory([]));
  };

  if (loading) {
    return (
      <div className="card-royal p-5" style={{ marginBottom:20 }}>
        <p style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>
          🔮 {T('Loading today\'s prediction…', 'आज की भविष्यवाणी लोड हो रही है…')}
        </p>
      </div>
    );
  }
  if (!pred) return null;

  const meta    = pred.meta || {};
  const title   = lang === 'hi' ? (meta.title_hi || pred.title) : pred.title;
  const content = (lang === 'hi' ? (pred.content_hi || pred.content_en) : pred.content_en) || '';
  const paras   = content.split(/\n\n+/).filter(Boolean);

  const dg           = meta.dasha_guidance;
  const transitData  = meta.transit;
  const transitList  = transitData?.list || [];
  const tara         = meta.tara;
  const activeYogas  = meta.active_yogas || [];
  const lagna        = meta.lagna;

  return (
    <div className="card-royal p-5" style={{ marginBottom:20, border:'1px solid rgba(212,175,55,0.28)',
      background:'linear-gradient(150deg, rgba(212,175,55,0.07), rgba(32,38,70,0.88) 45%)' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        gap:10, flexWrap:'wrap', marginBottom:12 }}>
        <div>
          <p style={{ color:GOLD, fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:4 }}>
            🔮 {T('Today for You', 'आज आपके लिए')} · {formatDate(meta.date)}
          </p>
          <h3 className="font-devanagari" style={{ color:'rgba(245,240,232,0.95)', fontSize:15, fontWeight:700, lineHeight:1.4 }}>
            {title}
          </h3>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
          <Stars n={meta.score || 3} />
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {meta.moon_rashi && (
              <Chip>{meta.moon_rashi.symbol} {lang === 'hi' ? meta.moon_rashi.hi : meta.moon_rashi.en} {T('Moon','चंद्र')}</Chip>
            )}
            {lagna?.en && (
              <Chip color="#818CF8">⬆ {lang === 'hi' ? lagna.hi : lagna.en} {T('Lagna','लग्न')}</Chip>
            )}
            {meta.dasha?.maha && (
              <Chip color="#A78BFA">{meta.dasha.maha}{meta.dasha.antar ? `–${meta.dasha.antar}` : ''} {T('Dasha','दशा')}</Chip>
            )}
            {meta.sade_sati?.active && (
              <Chip color="#EF4444">{T('Sade Sati','साढ़ेसाती')} · {meta.sade_sati.phase}</Chip>
            )}
          </div>
        </div>
      </div>

      {/* ── Today's Energy (overview paragraphs) ── */}
      {paras.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <SecLabel icon="🌌" en="Today's Energy" hi="आज की ऊर्जा" lang={lang} />
          {paras.slice(0, 2).map((p, i) => (
            <p key={i} className="font-devanagari"
              style={{ color:'rgba(245,240,232,0.78)', fontSize:12.5, lineHeight:1.85, marginBottom:i < 1 ? 6 : 0 }}>
              {p}
            </p>
          ))}
        </div>
      )}

      {/* ── Life Areas 2×2 grid ── */}
      {meta.areas && (
        <div style={{ marginBottom:14 }}>
          <SecLabel icon="📊" en="Life Areas Today" hi="जीवन क्षेत्र आज" lang={lang} />
          <div className="responsive-two-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
            {AREA_CFG.map(({ key, icon, en, hi, color }) => {
              const a = meta.areas[key];
              if (!a) return null;
              const text = lang === 'hi' ? (a.hi || a.en) : a.en;
              if (!text) return null;
              return (
                <div key={key} style={{ background:`${color}08`, border:`1px solid ${color}22`,
                  borderRadius:8, padding:'10px 12px', minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                    <span style={{ fontSize:13, flexShrink:0 }}>{icon}</span>
                    <span style={{ fontSize:9, fontWeight:700, color, textTransform:'uppercase',
                      letterSpacing:'0.1em', flexShrink:0 }}>
                      {T(en, hi)}
                    </span>
                  </div>
                  <p className="font-devanagari"
                    style={{ color:'rgba(245,240,232,0.72)', fontSize:11, lineHeight:1.7, margin:0,
                      wordBreak:'break-word', overflowWrap:'break-word' }}>
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dasha Insights ── */}
      {dg && (
        <div style={{ marginBottom:14, background:'rgba(167,139,250,0.06)',
          border:'1px solid rgba(167,139,250,0.22)', borderRadius:8, padding:'11px 13px' }}>
          <SecLabel icon="✨" en="Dasha Insights" hi="दशा विश्लेषण" lang={lang} color="#A78BFA" />
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, color:'#A78BFA', fontWeight:700 }}>
              {dg.maha} {T('Mahadasha','महादशा')}
            </span>
            {dg.antar && <>
              <span style={{ color:'rgba(245,240,232,0.3)', fontSize:12 }}>·</span>
              <span style={{ fontSize:11, color:'#C4B5FD' }}>{dg.antar} {T('Antardasha','अंतर्दशा')}</span>
            </>}
          </div>
          {(lang === 'hi' ? dg.nature_hi : dg.nature_en) && (
            <p className="font-devanagari"
              style={{ color:'rgba(245,240,232,0.75)', fontSize:11.5, lineHeight:1.7, marginBottom:8 }}>
              {lang === 'hi' ? (dg.nature_hi || dg.nature_en) : dg.nature_en}
            </p>
          )}
          {(lang === 'hi' ? dg.spiritual_hi : dg.spiritual_en) && (
            <p className="font-devanagari"
              style={{ color:'rgba(196,181,253,0.65)', fontSize:11, lineHeight:1.65, marginBottom:8, fontStyle:'italic' }}>
              {lang === 'hi' ? (dg.spiritual_hi || dg.spiritual_en) : dg.spiritual_en}
            </p>
          )}
          {(lang === 'hi' ? dg.antar_note_hi : dg.antar_note_en) && (
            <p className="font-devanagari"
              style={{ color:'rgba(196,181,253,0.6)', fontSize:10.5, lineHeight:1.65, marginBottom:8 }}>
              {lang === 'hi' ? (dg.antar_note_hi || dg.antar_note_en) : dg.antar_note_en}
            </p>
          )}
          {(() => {
            const opps = lang === 'hi' ? (dg.opportunities_hi || dg.opportunities || []) : (dg.opportunities || []);
            const caut = lang === 'hi' ? (dg.cautions_hi    || dg.cautions    || []) : (dg.cautions    || []);
            if (!opps.length && !caut.length) return null;
            return (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {opps.slice(0, 3).map((o, i) => (
                  <span key={i} style={{ fontSize:10, fontWeight:600, color:'#22C55E',
                    background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)',
                    borderRadius:10, padding:'2px 8px' }}>✦ {o}</span>
                ))}
                {caut.slice(0, 2).map((c, i) => (
                  <span key={i} style={{ fontSize:10, fontWeight:600, color:'#EF4444',
                    background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)',
                    borderRadius:10, padding:'2px 8px' }}>⚠ {c}</span>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Transit Highlights from Lagna ── */}
      {transitList.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <SecLabel
            icon="🪐"
            en={`Transits from ${transitData?.lagna_en || ''} Lagna`}
            hi={`${transitData?.lagna_hi || ''} लग्न से गोचर`}
            lang={lang}
          />
          <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid rgba(212,175,55,0.1)' }}>
            {transitList.map((ins, i) => {
              const c = TONE[ins.tone] || TONE.neutral;
              return (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start',
                  padding:'9px 12px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderBottom: i < transitList.length - 1 ? '1px solid rgba(212,175,55,0.07)' : 'none' }}>
                  <span style={{ fontSize:15, lineHeight:1, marginTop:2, flexShrink:0 }}>{ins.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:c }}>{ins.planet}</span>
                      <span style={{ fontSize:9, color:'rgba(245,240,232,0.35)',
                        background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                        borderRadius:4, padding:'0 5px' }}>H{ins.house}</span>
                      {ins.is_retrograde && (
                        <span style={{ fontSize:8, color:'#F59E0B',
                          background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)',
                          borderRadius:4, padding:'0 4px' }}>℞ Retro</span>
                      )}
                      <span style={{ fontSize:8, color:`${c}90`, marginLeft:'auto',
                        textTransform:'uppercase', letterSpacing:'0.08em' }}>{ins.tone}</span>
                    </div>
                    <p className="font-devanagari"
                      style={{ color:'rgba(245,240,232,0.72)', fontSize:11, lineHeight:1.65, margin:0 }}>
                      {lang === 'hi' ? (ins.hi || ins.en) : ins.en}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Moon Nakshatra + Tara ── */}
      {(meta.moon_nakshatra_today || tara) && (
        <div style={{ marginBottom:14, background:'rgba(212,175,55,0.05)',
          border:'1px solid rgba(212,175,55,0.18)', borderRadius:8, padding:'11px 13px' }}>
          <SecLabel icon="🌙" en="Moon's Nakshatra Today" hi="आज चंद्र का नक्षत्र" lang={lang} />
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom:8 }}>
            {meta.moon_nakshatra_today && (
              <div>
                <div style={{ fontSize:9, color:'rgba(245,240,232,0.4)', marginBottom:2 }}>{T('Today','आज')}</div>
                <div style={{ fontSize:13, fontWeight:700, color:GOLD }}>
                  {lang === 'hi' ? meta.moon_nakshatra_today.hi : meta.moon_nakshatra_today.en}
                </div>
              </div>
            )}
            {meta.natal_moon_nakshatra && (
              <>
                <span style={{ color:'rgba(245,240,232,0.2)', fontSize:16 }}>→</span>
                <div>
                  <div style={{ fontSize:9, color:'rgba(245,240,232,0.4)', marginBottom:2 }}>{T('Natal','जन्म')}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'rgba(245,240,232,0.6)' }}>
                    {lang === 'hi' ? meta.natal_moon_nakshatra.hi : meta.natal_moon_nakshatra.en}
                  </div>
                </div>
              </>
            )}
            {tara && (() => {
              const tc = tara.is_favorable === true ? '#22C55E' : tara.is_favorable === false ? '#EF4444' : GOLD;
              return (
                <div style={{ marginLeft:'auto' }}>
                  <div style={{ fontSize:9, color:'rgba(245,240,232,0.4)', marginBottom:3, textAlign:'right' }}>
                    {T('Tara','तारा')} {T('(cycle','(चक्र')} {tara.cycle})
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:tc,
                    background:`${tc}12`, border:`1px solid ${tc}35`,
                    borderRadius:10, padding:'2px 10px' }}>
                    {tara.name}
                  </span>
                </div>
              );
            })()}
          </div>
          {tara?.note_en && (
            <p className="font-devanagari"
              style={{ color:'rgba(245,240,232,0.65)', fontSize:11, lineHeight:1.65, margin:0, fontStyle:'italic' }}>
              {lang === 'hi' ? tara.note_hi : tara.note_en}
            </p>
          )}
        </div>
      )}

      {/* ── Active Yogas ── */}
      {activeYogas.length > 0 && (
        <div style={{ marginBottom:13 }}>
          <SecLabel icon="⚡" en="Active Yogas in Your Chart" hi="आपकी कुंडली में सक्रिय योग" lang={lang} />
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {activeYogas.map((y, i) => (
              <span key={i} style={{ fontSize:10, fontWeight:600, color:GOLD,
                background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.25)',
                borderRadius:10, padding:'3px 10px' }}>
                {lang === 'hi' ? (y.name_hi || y.name_en) : y.name_en}
                {y.strength && (
                  <span style={{ color:'rgba(212,175,55,0.55)', fontSize:9 }}> · {y.strength}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Advice + Caution ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ marginBottom:12 }}>
        {pick(meta.advice) && (
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)',
            borderRadius:8, padding:'9px 11px' }}>
            <p style={{ color:'#22C55E', fontSize:9, fontWeight:700, textTransform:'uppercase',
              letterSpacing:'0.12em', marginBottom:4 }}>✓ {T('Advice','सलाह')}</p>
            <p className="font-devanagari"
              style={{ color:'rgba(245,240,232,0.75)', fontSize:11, lineHeight:1.7 }}>
              {pick(meta.advice)}
            </p>
          </div>
        )}
        {pick(meta.caution) && (
          <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)',
            borderRadius:8, padding:'9px 11px' }}>
            <p style={{ color:'#EF4444', fontSize:9, fontWeight:700, textTransform:'uppercase',
              letterSpacing:'0.12em', marginBottom:4 }}>⚠ {T('Caution','सावधानी')}</p>
            <p className="font-devanagari"
              style={{ color:'rgba(245,240,232,0.75)', fontSize:11, lineHeight:1.7 }}>
              {pick(meta.caution)}
            </p>
          </div>
        )}
      </div>

      {/* ── Lucky + Favourable Purposes ── */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        {meta.lucky?.numbers && <Chip color="#60A5FA">🔢 {meta.lucky.numbers.join(', ')}</Chip>}
        {meta.lucky?.colors  && <Chip color="#EC4899">🎨 {meta.lucky.colors.join(', ')}</Chip>}
        {meta.lucky?.gemstone && <Chip color="#22C55E">💎 {meta.lucky.gemstone}</Chip>}
        {(meta.fav_purposes || []).map((f) => (
          <Chip key={f.key} color={GOLD}>{f.icon} {lang === 'hi' ? f.hi : f.en}</Chip>
        ))}
        {(meta.avoid_purposes || []).map((f) => (
          <Chip key={f.key} color="#EF4444">✕ {lang === 'hi' ? f.hi : f.en}</Chip>
        ))}
      </div>

      {/* ── Admin: prediction history ── */}
      {admin && (
        <div style={{ marginTop:14, borderTop:'1px solid rgba(212,175,55,0.12)', paddingTop:10 }}>
          <button onClick={loadHistory}
            style={{ background:'transparent', border:'none', color:'#A78BFA', fontSize:11,
              fontWeight:700, cursor:'pointer', padding:0 }}>
            🗂 {T('Stored Prediction Log','संग्रहीत भविष्यवाणी लॉग')} {showHist ? '▲' : '▼'}
          </button>
          {showHist && (
            <div style={{ display:'grid', gap:6, marginTop:8 }}>
              {(history || []).length === 0 && (
                <p style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>
                  {T('No stored predictions yet.','अभी कोई संग्रहीत भविष्यवाणी नहीं।')}
                </p>
              )}
              {(history || []).map((h) => (
                <div key={h.uuid} style={{ display:'flex', justifyContent:'space-between', gap:10,
                  alignItems:'center', background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(212,175,55,0.1)', borderRadius:6, padding:'7px 10px' }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ color:'rgba(245,240,232,0.8)', fontSize:11, fontWeight:600,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.title}</p>
                    <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9.5 }}>
                      {h.type} · {h.meta?.date || (h.valid_from || '').slice(0, 10)}
                    </p>
                  </div>
                  {h.meta?.score && <Stars n={h.meta.score} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
