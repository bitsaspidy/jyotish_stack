'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { computePersonalizedRemedies } from '../utils/remedy-engine';

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIORITY = {
  critical: { color:'#EF4444', bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.28)',  labelEn:'Urgent Attention',  labelHi:'तुरंत ध्यान'     },
  high:     { color:'#F97316', bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.28)', labelEn:'Needs Attention',   labelHi:'ध्यान चाहिए'     },
  medium:   { color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.28)', labelEn:'Moderate Support',  labelHi:'सामान्य सहायता'  },
  low:      { color:'#60A5FA', bg:'rgba(96,165,250,0.08)', border:'rgba(96,165,250,0.28)', labelEn:'Minor Support',     labelHi:'थोड़ी सहायता'     },
  healthy:  { color:'#22C55E', bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.28)',  labelEn:'Doing Well',        labelHi:'ठीक है'           },
};
const GOLD = '#D4AF37';

// ── Shared small components ────────────────────────────────────────────────────
function PBadge({ priority, hi }) {
  const m = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span style={{ fontSize:9.5, fontWeight:700, color:m.color, background:m.bg,
      border:`1px solid ${m.border}`, borderRadius:10, padding:'2px 9px',
      whiteSpace:'nowrap', display:'inline-block' }}>
      {hi ? m.labelHi : m.labelEn}
    </span>
  );
}
function SH({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-base">{icon}</span>
      <div>
        <h3 className="font-serif text-gold text-sm font-semibold">{title}</h3>
        {sub && <p className="text-ivory/38 text-[10px] font-devanagari">{sub}</p>}
      </div>
    </div>
  );
}
function Chip({ label, color = GOLD }) {
  return (
    <span style={{ fontSize:9, fontWeight:600, color, background:`${color}12`,
      border:`1px solid ${color}28`, borderRadius:6, padding:'1px 7px',
      display:'inline-block', marginRight:3, marginBottom:3 }}>
      {label}
    </span>
  );
}
function Divider() { return <div style={{ height:1, background:'rgba(212,175,55,0.09)', margin:'14px 0' }} />; }

// ── Tab navigation ─────────────────────────────────────────────────────────────
const TABS_USER  = ['plan','puja','timing','problems','library'];
const TABS_ADMIN = [...TABS_USER,'admin'];

function TabBar({ tabs, active, setActive, hi }) {
  const labels = {
    plan:     hi ? '🪷 उपाय योजना'       : '🪷 Remedy Plan',
    puja:     hi ? '🕉 पूजा क्रम'         : '🕉 Daily Puja',
    timing:   hi ? '⏰ समय और अवधि'       : '⏰ Timing & Duration',
    problems: hi ? '🩺 विशेष उपाय'        : '🩺 Problem Remedies',
    library:  hi ? '📚 संदर्भ पुस्तकालय'  : '📚 Reference Library',
    admin:    '🔬 Admin Details',
  };
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:16, borderBottom:'1px solid rgba(212,175,55,0.12)', paddingBottom:8 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => setActive(t)} style={{
          fontSize:10.5, fontWeight:700, padding:'5px 12px', borderRadius:8, cursor:'pointer',
          border:`1px solid ${active===t ? 'rgba(212,175,55,0.4)' : 'transparent'}`,
          background: active===t ? 'rgba(212,175,55,0.12)' : 'transparent',
          color: active===t ? GOLD : 'rgba(245,240,232,0.4)',
          transition:'all 0.15s',
        }}>
          {labels[t]}
        </button>
      ))}
    </div>
  );
}

// ── Tab 1: Personalized Plan ──────────────────────────────────────────────────
function TabPlan({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const [expanded, setExpanded] = useState({});

  // Server plan shape
  const health    = plan.planetaryHealth || plan.sorted || [];
  const remedies  = plan.priorityRemedies || [];
  const optional  = plan.optionalRemedies || (plan.buckets?.healthy || []).map(p => ({ name:p.name, name_hi:p.name_hi, icon:p.icon, status_en:'Doing well — no specific remedy required.', status_hi:'ठीक स्थिति में — कोई विशेष उपाय आवश्यक नहीं।' }));

  return (
    <div>
      {/* Planet health grid */}
      <SH icon="🪐" title={T('Planetary Focus Areas','ग्रह फोकस क्षेत्र')}
        sub={T('Planets ranked by how much support they currently need.','ग्रह उनकी वर्तमान सहायता आवश्यकता के अनुसार क्रमित।')} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {health.map(p => {
          const m = PRIORITY[p.priority] || PRIORITY.medium;
          const triggers = hi ? (p.triggers_hi || p.triggers?.map(t=>t.hi) || []) : (p.triggers_en || p.triggers?.map(t=>t.en) || []);
          return (
            <div key={p.name} style={{ border:`1px solid ${m.border}`, borderRadius:10, padding:'10px 12px', background:m.bg }}>
              <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
                <span className="font-semibold text-ivory/90 text-xs font-devanagari">{p.icon} {hi ? p.name_hi : p.name}</span>
                <PBadge priority={p.priority} hi={hi} />
              </div>
              <p className="text-[9.5px] text-ivory/48 font-devanagari leading-tight">
                {hi ? p.impact_hi || p.impact?.hi : p.impact_en || p.impact?.en}
              </p>
              {triggers.slice(0,1).map((t,i) => <Chip key={i} label={t} color={m.color} />)}
            </div>
          );
        })}
      </div>

      {/* Priority remedy cards */}
      {remedies.length > 0 && (
        <>
          <Divider />
          <SH icon="🌟" title={T('Your Remedy Focus','आपके उपाय फोकस')}
            sub={T('What to practise, why, and what to expect.','क्या करें, क्यों, और क्या उम्मीद रखें।')} />
          <div className="space-y-3">
            {remedies.map((r, idx) => {
              const key   = r.planet?.name || idx;
              const open  = !!expanded[key];
              const m     = PRIORITY[r.planet?.priority] || PRIORITY.medium;
              return (
                <div key={key} style={{ border:`1px solid ${m.border}`, borderRadius:12, overflow:'hidden' }}>
                  <button onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))} style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    gap:8, padding:'11px 14px', background:m.bg, border:'none', cursor:'pointer', textAlign:'left' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize:11, fontWeight:800, color:m.color, minWidth:22 }}>P{r.rank || idx+1}</span>
                      <span className="text-ivory/90 text-xs font-semibold font-devanagari">
                        {r.planet?.icon} {hi ? r.planet?.name_hi : r.planet?.name}
                      </span>
                      <PBadge priority={r.planet?.priority} hi={hi} />
                    </div>
                    <span style={{ color:m.color, fontSize:11 }}>{open ? '▲' : '▾'}</span>
                  </button>
                  {open && (
                    <div style={{ padding:'12px 14px', background:'rgba(0,0,0,0.2)' }}>
                      {/* Why */}
                      <p style={{ fontSize:11, color:'rgba(245,240,232,0.85)', marginBottom:10, lineHeight:1.6 }} className="font-devanagari">
                        {hi ? r.why_hi : r.why_en}
                      </p>
                      {/* Benefit */}
                      <p style={{ fontSize:10.5, color:GOLD, marginBottom:8, fontStyle:'italic' }} className="font-devanagari">
                        ✨ {hi ? r.benefit_hi : r.benefit_en}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'8px 10px' }}>
                          <p style={{ fontSize:9, fontWeight:700, color:GOLD, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                            {T('Daily Practice','दैनिक साधना')}
                          </p>
                          <p className="text-ivory/80 text-[10.5px] font-devanagari leading-relaxed">{hi ? r.daily_hi : r.daily_en}</p>
                        </div>
                        <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'8px 10px' }}>
                          <p style={{ fontSize:9, fontWeight:700, color:GOLD, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                            {T('Weekly Practice','साप्ताहिक साधना')}
                          </p>
                          <p className="text-ivory/80 text-[10.5px] font-devanagari leading-relaxed">{hi ? r.weekly_hi : r.weekly_en}</p>
                        </div>
                      </div>
                      {/* Advanced — show only if present */}
                      {(hi ? r.advanced_hi : r.advanced_en)?.length > 0 && (
                        <div style={{ marginTop:8, background:'rgba(96,165,250,0.05)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:8, padding:'8px 10px' }}>
                          <p style={{ fontSize:9, fontWeight:700, color:'#60A5FA', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                            {T('Advanced (Optional)','उन्नत (वैकल्पिक)')}
                          </p>
                          {(hi ? r.advanced_hi : r.advanced_en).map((a,i) => (
                            <p key={i} className="text-ivory/65 text-[10px] font-devanagari leading-relaxed">{a}</p>
                          ))}
                        </div>
                      )}
                      {/* Mantra reference card */}
                      {r.primary_text_en && (
                        <div style={{ marginTop:8, background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'8px 10px' }}>
                          <p style={{ fontSize:9, fontWeight:700, color:'rgba(212,175,55,0.6)', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.07em' }}>{T('Recommended Text','अनुशंसित पाठ')}</p>
                          <p className="text-ivory/60 text-[10px] font-devanagari">{r.primary_text_en}</p>
                          <p style={{ fontSize:9, color:'rgba(245,240,232,0.35)', marginTop:4 }}>{T('Source: Remedy Class 1 — 4th May 2026','स्रोत: रेमेडी क्लास 1 — 4 मई 2026')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Optional planets */}
      {optional.length > 0 && (
        <>
          <Divider />
          <SH icon="✅" title={T('Planets Doing Well','स्वस्थ ग्रह')}
            sub={T('No specific remedy required — optional maintenance only.','कोई विशेष उपाय आवश्यक नहीं — केवल वैकल्पिक रखरखाव।')} />
          <div className="flex flex-wrap gap-2">
            {optional.map(o => (
              <div key={o.name} style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:9, padding:'7px 11px', maxWidth:220 }}>
                <p className="text-[11px] font-semibold text-ivory/80 font-devanagari mb-0.5">{o.icon} {hi ? o.name_hi : o.name}</p>
                <p className="text-[9.5px] text-ivory/45 font-devanagari leading-snug">{hi ? o.status_hi : o.status_en}</p>
                {(hi ? o.optional_hi : o.optional_en) && (
                  <p className="text-[9px] text-gold/60 font-devanagari mt-1">{hi ? o.optional_hi : o.optional_en}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab 2: Daily Puja Flow ────────────────────────────────────────────────────
function TabPuja({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const steps = plan.dailyPujaSequence || plan.pujaFlow || [];

  return (
    <div>
      <SH icon="🕉" title={T('Your Personal Puja Sequence','आपका व्यक्तिगत पूजा क्रम')}
        sub={T('Built from your chart — follow in order each day.','आपकी कुंडली से निर्मित — प्रतिदिन क्रमानुसार करें।')} />
      <div className="space-y-3">
        {steps.map((s, idx) => {
          const isCond = s.conditional;
          return (
            <div key={idx} style={{
              border:`1px solid ${isCond ? 'rgba(167,139,250,0.25)' : 'rgba(212,175,55,0.22)'}`,
              borderRadius:11, overflow:'hidden',
            }}>
              <div style={{ background: isCond ? 'rgba(167,139,250,0.07)' : 'rgba(212,175,55,0.07)', padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:13, fontWeight:800, color: isCond ? '#A78BFA' : GOLD, minWidth:26, textAlign:'center' }}>
                  {s.step ?? idx}
                </span>
                <div className="flex-1">
                  <p className="font-serif font-semibold text-ivory/90 text-xs font-devanagari">
                    {hi ? s.label_hi : s.label_en}
                    {isCond && <span style={{ fontSize:9, color:'#A78BFA', marginLeft:6 }}>({T('Conditional','सशर्त')})</span>}
                    {s.mandatory && !isCond && <span style={{ fontSize:9, color:GOLD, marginLeft:6 }}>({T('Mandatory','अनिवार्य')})</span>}
                  </p>
                  <p className="text-[10px] text-ivory/50 font-devanagari">{hi ? s.deity_hi : s.deity_en}</p>
                </div>
              </div>
              <div style={{ padding:'9px 14px', background:'rgba(0,0,0,0.15)' }}>
                <p className="text-ivory/78 text-[10.5px] font-devanagari leading-relaxed mb-1">{hi ? s.action_hi : s.action_en}</p>
                {(s.mantra_en || s.mantra_hi) && (
                  <p style={{ fontSize:9.5, color:`${GOLD}99`, fontStyle:'italic', marginTop:4 }} className="font-devanagari">
                    {T('Mantra:','मंत्र:')} {hi ? (s.mantra_hi || s.mantra_en) : s.mantra_en}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {steps.length === 0 && <p className="text-ivory/40 text-xs">{T('Puja sequence will appear once chart is analysed.','कुंडली विश्लेषण के बाद पूजा क्रम दिखेगा।')}</p>}

      {/* Vedic vs Pauranik rules */}
      <Divider />
      <SH icon="📖" title={T('Practice Rules','साधना नियम')} sub={T('From Remedy Class 1, 4th May 2026','रेमेडी क्लास 1, 4 मई 2026 से')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: T('Vedic Mantra / Suktam','वैदिक मंत्र / सूक्तम'), items: [
            T('Direction: Face East','दिशा: पूर्व की ओर मुखकर'),
            T('Aasan: Red wool or kusha grass mat','आसन: लाल ऊनी या कुश घास'),
            T('Aachman: Not required before each recitation','आचमन: प्रत्येक पाठ से पहले आवश्यक नहीं'),
          ]},
          { title: T('Pauranik Mantra / Stotra','पौराणिक मंत्र / स्तोत्र'), items: [
            T('Direction: Planet-specific (see remedy card)','दिशा: ग्रह-विशिष्ट'),
            T('Aasan: Red wool or kusha grass mat','आसन: लाल ऊनी या कुश घास'),
            T('Aachman: Mandatory before recitation','आचमन: पाठ से पहले अनिवार्य'),
          ]},
        ].map(({ title, items }) => (
          <div key={title} style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:9, padding:'10px 12px' }}>
            <p style={{ fontSize:10, fontWeight:700, color:GOLD, marginBottom:6 }} className="font-devanagari">{title}</p>
            {items.map(item => <p key={item} className="text-ivory/65 text-[10px] font-devanagari leading-relaxed">• {item}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 3: Timing & Duration ──────────────────────────────────────────────────
function TabTiming({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;

  // Server shape
  const dur  = plan.sadhanaDuration;
  const tw   = plan.bestTimeWindows;
  // Client shape fallback
  const days = dur?.days     || plan.sadhanaDays;
  const reasonEn = dur?.reason_en || plan.sadhanaReason?.en || '';
  const reasonHi = dur?.reason_hi || plan.sadhanaReason?.hi || '';

  const timeWindows   = tw?.time_windows   || (plan.timeWindows?.extra_data?.windows) || [];
  const muhuratPref   = tw?.muhurat_prefer || [];
  const muhuratAvoid  = tw?.muhurat_avoid  || [];
  const chogadiya     = tw?.chogadiya      || null;

  const QUALITY_COLOR = { best:'#D4AF37', auspicious:'#22C55E', good:'#60A5FA' };

  return (
    <div>
      {/* Sadhana Duration */}
      <SH icon="📅" title={T('Recommended Sadhana Duration','अनुशंसित साधना अवधि')} />
      <div style={{ background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize:28, fontWeight:800, color:GOLD }}>{days}</span>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:GOLD }} className="font-devanagari">{T('days','दिन')}</p>
            <p className="text-ivory/50 text-[10px]">{T('Minimum sadhana cycle','न्यूनतम साधना चक्र')}</p>
          </div>
        </div>
        <p className="text-ivory/78 text-[11px] font-devanagari leading-relaxed">{hi ? reasonHi : reasonEn}</p>
        {dur?.start_day_en && (
          <p style={{ fontSize:10, color:`${GOLD}99`, marginTop:8 }} className="font-devanagari">
            🌅 {hi ? dur.start_day_hi : dur.start_day_en}
          </p>
        )}
      </div>

      {/* Best Time Windows */}
      <SH icon="⏰" title={T('Best Practice Times','सर्वोत्तम साधना समय')}
        sub={T('Source: Remedy Class 1 PDF — 4th May 2026','स्रोत: रेमेडी क्लास 1 PDF — 4 मई 2026')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {timeWindows.map((w, i) => {
          const col = QUALITY_COLOR[w.quality] || '#A78BFA';
          return (
            <div key={i} style={{ border:`1px solid ${col}30`, borderRadius:9, padding:'9px 12px', background:`${col}06` }}>
              <div className="flex items-center justify-between mb-1">
                <p style={{ fontSize:11, fontWeight:700, color:col }} className="font-devanagari">{hi ? w.name_hi : w.name_en}</p>
                <span style={{ fontSize:9, fontWeight:700, color:col, background:`${col}15`, borderRadius:6, padding:'1px 7px' }}>
                  {w.quality === 'best' ? T('BEST','सर्वोत्तम') : w.quality === 'auspicious' ? T('AUSPICIOUS','शुभ') : T('GOOD','अच्छा')}
                </span>
              </div>
              <p className="text-ivory/65 text-[10px]">{w.time}</p>
              <p className="text-ivory/48 text-[9.5px] font-devanagari mt-0.5">{hi ? w.quality_hi : w.quality_en}</p>
            </div>
          );
        })}
      </div>

      {/* Muhurat Prefer / Avoid */}
      {(muhuratPref.length > 0 || muhuratAvoid.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {muhuratPref.length > 0 && (
            <div style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:9, padding:'9px 12px' }}>
              <p style={{ fontSize:9.5, fontWeight:700, color:'#22C55E', marginBottom:5, textTransform:'uppercase' }}>✅ {T('Prefer','पसंद करें')}</p>
              {muhuratPref.map(m => (
                <div key={m.name_en} className="mb-1.5">
                  <p className="text-ivory/80 text-[10.5px] font-semibold font-devanagari">{hi ? m.name_hi : m.name_en}</p>
                  <p className="text-ivory/45 text-[9.5px] font-devanagari">{hi ? m.note_hi : m.note_en}</p>
                </div>
              ))}
            </div>
          )}
          {muhuratAvoid.length > 0 && (
            <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, padding:'9px 12px' }}>
              <p style={{ fontSize:9.5, fontWeight:700, color:'#EF4444', marginBottom:5, textTransform:'uppercase' }}>🚫 {T('Avoid','टालें')}</p>
              {muhuratAvoid.map(m => (
                <div key={m.name_en} className="mb-1.5">
                  <p className="text-ivory/80 text-[10.5px] font-semibold font-devanagari">{hi ? m.name_hi : m.name_en}</p>
                  <p className="text-ivory/45 text-[9.5px] font-devanagari">{hi ? m.note_hi : m.note_en}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chogadiya */}
      {chogadiya && (
        <>
          <SH icon="🌙" title={T('Chogadiya Guide','चौघड़िया मार्गदर्शिका')} />
          <div className="grid grid-cols-3 gap-2">
            {[
              { key:'prefer',  label: T('Prefer','पसंद करें'),  color:'#22C55E', items: hi ? chogadiya.prefer_hi : chogadiya.prefer },
              { key:'neutral', label: T('Neutral','तटस्थ'),     color:'#60A5FA', items: hi ? chogadiya.neutral_hi : chogadiya.neutral },
              { key:'avoid',   label: T('Avoid','टालें'),       color:'#EF4444', items: hi ? chogadiya.avoid_hi : chogadiya.avoid },
            ].map(({ key, label, color, items }) => (
              <div key={key} style={{ background:`${color}07`, border:`1px solid ${color}25`, borderRadius:9, padding:'8px 10px' }}>
                <p style={{ fontSize:9, fontWeight:700, color, marginBottom:5, textTransform:'uppercase' }}>{label}</p>
                {(items || []).map(item => <p key={item} className="text-ivory/70 text-[10.5px] font-devanagari font-semibold">{item}</p>)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab 4: Problem-Specific Remedies ─────────────────────────────────────────
function TabProblems({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const problems = plan.problemSpecificRemedies || [];
  const active   = problems.filter(p => p.is_active);
  const inactive = problems.filter(p => !p.is_active);

  function ProbCard({ prob }) {
    return (
      <div style={{ border:'1px solid rgba(212,175,55,0.22)', borderRadius:12, overflow:'hidden', marginBottom:10 }}>
        <div style={{ background:'rgba(212,175,55,0.07)', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
          <span className="text-base">{prob.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-ivory/90 text-xs font-devanagari">{hi ? prob.label_hi : prob.label_en}</p>
            <p className="text-[9.5px] text-ivory/48 font-devanagari">{hi ? prob.deity_hi : prob.deity_en} · {hi ? prob.planet : prob.planet}</p>
          </div>
          {prob.is_active && <span style={{ fontSize:9, fontWeight:700, color:'#EF4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, padding:'2px 8px' }}>{T('ACTIVE','सक्रिय')}</span>}
        </div>
        <div style={{ padding:'10px 14px', background:'rgba(0,0,0,0.15)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <div>
              <p style={{ fontSize:9, fontWeight:700, color:GOLD, textTransform:'uppercase', marginBottom:3 }}>{T('Remedy Practice','उपाय साधना')}</p>
              <p className="text-ivory/78 text-[10.5px] font-devanagari leading-relaxed">{hi ? prob.action_hi : prob.action_en}</p>
            </div>
            <div>
              <p style={{ fontSize:9, fontWeight:700, color:GOLD, textTransform:'uppercase', marginBottom:3 }}>{T('Mantras','मंत्र')}</p>
              {(hi ? prob.mantras_hi : prob.mantras_en).map(m => (
                <p key={m} className="text-ivory/70 text-[10.5px] font-devanagari">• {m}</p>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 flex-wrap">
            <span style={{ fontSize:9, color:'#60A5FA' }}>⏱ {hi ? prob.duration_hi : prob.duration_en}</span>
            {prob.direction && <span style={{ fontSize:9, color:'#22C55E' }}>🧭 {T('Direction:','दिशा:')} {prob.direction}</span>}
          </div>
          {(hi ? prob.safety_hi : prob.safety_en) && (
            <p style={{ fontSize:9.5, color:'rgba(245,240,232,0.45)', marginTop:6, fontStyle:'italic', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:6 }} className="font-devanagari">
              ⚕️ {hi ? prob.safety_hi : prob.safety_en}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {active.length > 0 ? (
        <>
          <SH icon="🩺" title={T('Relevant Remedies for Your Chart','आपकी कुंडली के लिए प्रासंगिक उपाय')}
            sub={T('Detected from your planetary placements.','आपकी ग्रह स्थिति से पहचाना गया।')} />
          {active.map(p => <ProbCard key={p.key} prob={p} />)}
        </>
      ) : (
        <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:11, padding:'14px 16px', marginBottom:16 }}>
          <p className="text-[11px] text-ivory/70 font-devanagari">{T('No urgent problem-specific remedies detected from your chart at this time.','इस समय आपकी कुंडली से कोई तत्काल विशेष उपाय नहीं पहचाना गया।')}</p>
        </div>
      )}

      {inactive.length > 0 && (
        <details style={{ marginTop:8 }}>
          <summary style={{ cursor:'pointer', fontSize:10.5, color:`${GOLD}80`, fontWeight:700, padding:'6px 0' }}>
            {T(`▾ View all ${inactive.length} reference remedies (not currently active)`,`▾ सभी ${inactive.length} संदर्भ उपाय देखें (वर्तमान में सक्रिय नहीं)`)}
          </summary>
          <div style={{ marginTop:8, opacity:0.7 }}>
            {inactive.map(p => <ProbCard key={p.key} prob={p} />)}
          </div>
        </details>
      )}

      {/* Gemstone safety warning */}
      <div style={{ marginTop:16, background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:9, padding:'10px 12px' }}>
        <p style={{ fontSize:9.5, color:'#F59E0B', fontWeight:700, marginBottom:3 }}>💎 {T('Gemstone Advisory','रत्न परामर्श')}</p>
        <p className="text-ivory/58 text-[10px] font-devanagari">{T('Gemstones are shown only in the Reference Library for information. Never wear a gemstone as a default remedy. Always consult a qualified Jyotishi before using any gemstone.','रत्न केवल संदर्भ पुस्तकालय में जानकारी के लिए दिखाए जाते हैं। कभी भी रत्न को डिफ़ॉल्ट उपाय के रूप में न पहनें। कोई भी रत्न उपयोग करने से पहले हमेशा योग्य ज्योतिषी से परामर्श करें।')}</p>
      </div>
    </div>
  );
}

// ── Tab 5: Reference Library (pass-through to old RemedyManualPanel content) ──
function TabLibrary({ remedyManual, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;

  if (!remedyManual?.planet_deities?.length) {
    return <p className="text-ivory/40 text-xs">{T('Reference library loading…','संदर्भ पुस्तकालय लोड हो रहा है…')}</p>;
  }

  return (
    <div>
      <SH icon="📚" title={T('Vedic Remedy Reference Library','वैदिक उपाय संदर्भ पुस्तकालय')}
        sub={T('Complete planet-by-planet remedy guide. Use for deeper study.','ग्रह-वार पूर्ण उपाय मार्गदर्शिका। गहन अध्ययन के लिए उपयोग करें।')} />

      {/* Planet deities table */}
      <div className="space-y-2 mb-6">
        {remedyManual.planet_deities.map(p => {
          const mantraCount = p.mantras_en?.length || 0;
          return (
            <details key={p.name} style={{ border:'1px solid rgba(212,175,55,0.14)', borderRadius:9, overflow:'hidden' }}>
              <summary style={{ cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', background:'rgba(212,175,55,0.05)', fontWeight:700, fontSize:11, color:GOLD }} className="font-devanagari">
                <span>{hi ? p.name_hi || p.name : p.name} — {hi ? p.ishta_devata_hi || p.ishta_devata_en : p.ishta_devata_en}</span>
                <span style={{ fontSize:9, color:'rgba(212,175,55,0.5)' }}>▾</span>
              </summary>
              <div style={{ padding:'10px 12px', background:'rgba(0,0,0,0.15)' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  {p.beeja_mantra && <div><p style={{ color:GOLD, marginBottom:2, fontSize:9, fontWeight:700 }}>{T('Beeja Mantra','बीज मंत्र')}</p><p className="text-ivory/75 font-devanagari">{p.beeja_mantra}</p></div>}
                  {(p.daan_en || p.daan_hi) && <div><p style={{ color:GOLD, marginBottom:2, fontSize:9, fontWeight:700 }}>{T('Daan','दान')}</p><p className="text-ivory/75 font-devanagari">{hi ? p.daan_hi || p.daan_en : p.daan_en}</p></div>}
                  {p.yantra && <div><p style={{ color:GOLD, marginBottom:2, fontSize:9, fontWeight:700 }}>{T('Yantra','यंत्र')}</p><p className="text-ivory/75">{p.yantra}</p></div>}
                  {p.direction && <div><p style={{ color:GOLD, marginBottom:2, fontSize:9, fontWeight:700 }}>{T('Direction','दिशा')}</p><p className="text-ivory/75">{p.direction}</p></div>}
                  {(p.gemstone_en || p.gemstone_hi) && (
                    <div>
                      <p style={{ color:'#F59E0B', marginBottom:2, fontSize:9, fontWeight:700 }}>{T('Gemstone (consultation required)','रत्न (परामर्श आवश्यक)')}</p>
                      <p className="text-ivory/60 font-devanagari">{hi ? p.gemstone_hi || p.gemstone_en : p.gemstone_en}</p>
                    </div>
                  )}
                </div>
                {mantraCount > 0 && (
                  <div style={{ marginTop:8 }}>
                    <p style={{ fontSize:9, fontWeight:700, color:GOLD, marginBottom:3 }}>{T('Mantras / Suktam','मंत्र / सूक्तम')}</p>
                    <div className="flex flex-wrap gap-1">
                      {(hi ? (p.mantras_hi || p.mantras_en) : p.mantras_en).map(m => <Chip key={m} label={m} />)}
                    </div>
                  </div>
                )}
                {p.primary_suktam_en && (
                  <p style={{ fontSize:10, color:`${GOLD}80`, marginTop:4, fontStyle:'italic' }}>
                    {T('Primary text:','प्राथमिक पाठ:')} {hi ? p.primary_suktam_hi || p.primary_suktam_en : p.primary_suktam_en}
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {/* Puja sequence reference */}
      {remedyManual.puja_sequence?.length > 0 && (
        <>
          <Divider />
          <SH icon="🕉" title={T('Reference Puja Sequence','संदर्भ पूजा क्रम')} />
          <div className="space-y-2">
            {remedyManual.puja_sequence.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'7px 10px', background:'rgba(212,175,55,0.04)', borderRadius:8 }}>
                <span style={{ color:GOLD, fontWeight:800, fontSize:11, minWidth:20 }}>{s.extra_data?.step ?? i}</span>
                <div>
                  <p className="text-ivory/80 text-[10.5px] font-semibold font-devanagari">{hi ? s.title_hi || s.title_en : s.title_en}</p>
                  <p className="text-ivory/45 text-[9.5px] font-devanagari">{hi ? s.description_hi || s.description_en : s.description_en}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab 6: Admin Technical Details ────────────────────────────────────────────
function TabAdmin({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const admin = plan.adminTechnicalDetails || {};

  return (
    <div>
      <SH icon="🔬" title="Admin: Technical Remedy Analysis" sub={admin.source || 'Remedy Class 1 — 4th May 2026'} />

      {/* Input summary */}
      <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:9, padding:'10px 12px', marginBottom:12 }}>
        <p style={{ fontSize:9, fontWeight:700, color:GOLD, textTransform:'uppercase', marginBottom:6 }}>Chart Inputs</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-ivory/70">
          {[
            ['Lagna Lord', admin.lagna_lord || plan.meta?.lagna_lord || plan.lagnaLord],
            ['Atmakaraka', admin.atmakarak  || plan.meta?.atmakarak  || plan.atmakarak],
            ['Current MD', admin.current_md || plan.meta?.current_md_lord],
            ['Current AD', admin.current_ad || plan.meta?.current_ad_lord],
            ['Sadhana Days', plan.sadhanaDuration?.days || plan.sadhanaDays],
            ['Focus Planets', plan.meta?.focus_count ?? plan.priorityRemedies?.length],
          ].map(([k,v]) => (
            <div key={k}><span style={{ color:GOLD }}>{k}:</span> {v || '—'}</div>
          ))}
        </div>
      </div>

      {/* Planet score table */}
      {admin.planet_scores && (
        <>
          <p style={{ fontSize:9, fontWeight:700, color:GOLD, textTransform:'uppercase', marginBottom:6 }}>Planet Score Table</p>
          <div style={{ overflowX:'auto', marginBottom:12 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10.5 }}>
              <thead>
                <tr style={{ background:'rgba(212,175,55,0.08)' }}>
                  {['Planet','Score','Priority'].map(h => (
                    <th key={h} style={{ padding:'5px 8px', textAlign:'left', color:GOLD, fontSize:9, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(admin.planet_scores).map(([name, { score, priority }]) => {
                  const m = PRIORITY[priority] || PRIORITY.medium;
                  return (
                    <tr key={name} style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding:'5px 8px', color:'rgba(245,240,232,0.8)' }}>{name}</td>
                      <td style={{ padding:'5px 8px', color:m.color, fontWeight:700 }}>{score}</td>
                      <td style={{ padding:'5px 8px' }}><PBadge priority={priority} hi={false} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Priority logic */}
      {admin.priority_logic?.length > 0 && (
        <>
          <p style={{ fontSize:9, fontWeight:700, color:GOLD, textTransform:'uppercase', marginBottom:6 }}>Priority Selection Logic</p>
          <div className="space-y-1.5 mb-4">
            {admin.priority_logic.map(r => (
              <div key={r.rank} style={{ display:'flex', gap:8, fontSize:10, color:'rgba(245,240,232,0.7)', alignItems:'flex-start' }}>
                <span style={{ color:GOLD, fontWeight:700, minWidth:18 }}>#{r.rank}</span>
                <span style={{ fontWeight:700 }}>{r.planet}</span>
                <span style={{ color:'rgba(245,240,232,0.45)' }}>{r.selection_reason}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Trigger log */}
      {admin.trigger_log?.length > 0 && (
        <>
          <p style={{ fontSize:9, fontWeight:700, color:GOLD, textTransform:'uppercase', marginBottom:6 }}>Trigger Log ({admin.trigger_log.length} entries)</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
              <thead>
                <tr style={{ background:'rgba(212,175,55,0.05)' }}>
                  {['Planet','Rule','Pts','Evidence'].map(h => (
                    <th key={h} style={{ padding:'4px 7px', textAlign:'left', color:GOLD, fontSize:9, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admin.trigger_log.map((t, i) => (
                  <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding:'4px 7px', color:'rgba(245,240,232,0.8)', fontWeight:700 }}>{t.planet}</td>
                    <td style={{ padding:'4px 7px', color:'#A78BFA' }}>{t.rule}</td>
                    <td style={{ padding:'4px 7px', color:'#F97316', fontWeight:700 }}>+{t.pts}</td>
                    <td style={{ padding:'4px 7px', color:'rgba(245,240,232,0.5)', maxWidth:200 }}>{t.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * PersonalizedRemedyPanel
 * @prop {object} serverPlan    — from profile.personalized_remedies (server-computed, preferred)
 * @prop {object} chart         — from profile.calculated_data (client fallback)
 * @prop {object} remedyManual  — from profile.remedy_manual
 * @prop {string} lang          — 'en' | 'hi'
 * @prop {boolean} isAdmin
 */
export default function PersonalizedRemedyPanel({ serverPlan, chart, remedyManual, lang = 'en', isAdmin = false }) {
  const [tab, setTab] = useState('plan');
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;

  // Use server plan when available; fall back to client-side engine
  const clientPlan = useMemo(() => {
    if (serverPlan) return null;
    if (!chart?.planets) return null;
    return computePersonalizedRemedies(chart, remedyManual);
  }, [serverPlan, chart, remedyManual]);

  const plan = serverPlan || clientPlan;
  if (!plan) return null;

  const meta = plan.meta || {};
  const tabs = isAdmin ? TABS_ADMIN : TABS_USER;

  // Summary stats
  const health    = plan.planetaryHealth || plan.sorted || [];
  const needCount = health.filter(p => p.priority !== 'healthy').length;
  const topCount  = health.filter(p => ['critical','high'].includes(p.priority)).length;
  const days      = plan.sadhanaDuration?.days || plan.sadhanaDays || 43;

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            🪷 {T('Personalized Remedy Plan','व्यक्तिगत उपाय योजना')}
          </h2>
          <p className="text-ivory/38 text-[10px] font-devanagari mt-0.5">
            {T('Chart-driven · Source: Remedy Class 1 — 4th May 2026','कुंडली आधारित · स्रोत: रेमेडी क्लास 1 — 4 मई 2026')}
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14, padding:'9px 13px',
        background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.13)', borderRadius:10 }}>
        {[
          { label: T('Lagna Lord','लग्न स्वामी'),  value: meta.lagna_lord || plan.lagnaLord || '—' },
          { label: T('Atmakaraka','आत्मकारक'),     value: meta.atmakarak  || plan.atmakarak  || '—' },
          { label: T('Main Dasha','मुख्य दशा'),     value: meta.current_md_lord || plan.currentDasha?.lord || '—' },
          { label: T('Needs Focus','फोकस ग्रह'),    value: `${needCount}/9` },
          { label: T('Sadhana','साधना'),             value: `${days} ${T('days','दिन')}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign:'center', minWidth:64 }}>
            <p style={{ color:GOLD, fontSize:12, fontWeight:800 }}>{value}</p>
            <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9 }} className="font-devanagari">{label}</p>
          </div>
        ))}
        {topCount > 0 && (
          <div style={{ textAlign:'center', minWidth:64 }}>
            <p style={{ color:'#EF4444', fontSize:12, fontWeight:800 }}>{topCount}</p>
            <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9 }} className="font-devanagari">{T('Critical/High','गंभीर/उच्च')}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <TabBar tabs={tabs} active={tab} setActive={setTab} hi={hi} />

      {/* Tab content */}
      {tab === 'plan'     && <TabPlan     plan={plan}  lang={lang} />}
      {tab === 'puja'     && <TabPuja     plan={plan}  lang={lang} />}
      {tab === 'timing'   && <TabTiming   plan={plan}  lang={lang} />}
      {tab === 'problems' && <TabProblems plan={plan}  lang={lang} />}
      {tab === 'library'  && <TabLibrary  remedyManual={remedyManual || plan.remedyManual} lang={lang} />}
      {tab === 'admin' && isAdmin && <TabAdmin plan={plan} lang={lang} />}
    </motion.div>
  );
}
