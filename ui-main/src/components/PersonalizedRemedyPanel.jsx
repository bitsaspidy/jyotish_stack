'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { computePersonalizedRemedies } from '../utils/remedy-engine';

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIORITY = {
  critical: { color:'#EF4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.28)', labelEn:'Urgent Attention',  labelHi:'तुरंत ध्यान',      rank:1 },
  high:     { color:'#F97316', bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.28)', labelEn:'Needs Attention',  labelHi:'ध्यान चाहिए',      rank:2 },
  medium:   { color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.28)', labelEn:'Moderate Support', labelHi:'सामान्य सहायता',   rank:3 },
  low:      { color:'#60A5FA', bg:'rgba(96,165,250,0.08)', border:'rgba(96,165,250,0.28)', labelEn:'Minor Support',    labelHi:'थोड़ी सहायता',      rank:4 },
  healthy:  { color:'#22C55E', bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.28)',  labelEn:'Doing Well',       labelHi:'ठीक है',            rank:5 },
};

// ── Small helpers ─────────────────────────────────────────────────────────────
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

function SectionHead({ icon, title, sub }) {
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

function Divider() {
  return <div style={{ height:1, background:'rgba(212,175,55,0.1)', margin:'18px 0' }} />;
}

function Tag({ label, color = '#A78BFA' }) {
  return (
    <span style={{ fontSize:9, fontWeight:600, color, background:`${color}12`,
      border:`1px solid ${color}30`, borderRadius:6, padding:'1px 7px',
      display:'inline-block', marginRight:4, marginBottom:4 }}>
      {label}
    </span>
  );
}

// ── Section 1: Planetary Health Report ───────────────────────────────────────
function PlanetHealthSection({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  return (
    <div>
      <SectionHead icon="🪐" title={T('Your Planetary Focus Areas','आपके ग्रह फोकस क्षेत्र')}
        sub={T('Planets ranked by how much attention they currently need.','ग्रह उनकी वर्तमान ध्यान आवश्यकता के अनुसार क्रमित।')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plan.sorted.map((p) => {
          const m = PRIORITY[p.priority];
          return (
            <div key={p.name} style={{ border:`1px solid ${m.border}`, borderRadius:10,
              padding:'11px 13px', background:m.bg }}>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-ivory/90 text-xs font-devanagari">
                  {p.icon} {hi ? p.name_hi : p.name}
                </span>
                <PBadge priority={p.priority} hi={hi} />
              </div>
              <p className="text-[10px] text-ivory/50 font-devanagari leading-relaxed mb-1">
                {T('Affects: ','प्रभाव: ')}{hi ? p.impact.hi : p.impact.en}
              </p>
              {p.triggers.length > 0 && (
                <div className="flex flex-wrap gap-0 mt-1">
                  {p.triggers.slice(0,2).map((tr, i) => (
                    <Tag key={i} label={hi ? tr.hi : tr.en} color={m.color} />
                  ))}
                  {p.triggers.length > 2 && <Tag label={`+${p.triggers.length-2}`} color="rgba(245,240,232,0.3)" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 2: Personalized Remedy Plan ──────────────────────────────────────
function RemedyPlanSection({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const [expandIdx, setExpandIdx] = useState(0);

  if (!plan.focusPlanets.length) return null;

  return (
    <div>
      <SectionHead icon="🌿" title={T('Your Personalized Remedy Plan','आपका व्यक्तिगत उपाय योजना')}
        sub={T('Only the remedies you actually need — sorted by urgency.','केवल वे उपाय जो आपको वास्तव में चाहिए — तात्कालिकता से क्रमित।')} />
      <div className="space-y-3">
        {plan.focusPlanets.map((p, idx) => {
          const m       = PRIORITY[p.priority];
          const open    = expandIdx === idx;
          const ordinal = ['Priority 1','Priority 2','Priority 3'][idx];
          const ordHi   = ['प्राथमिकता 1','प्राथमिकता 2','प्राथमिकता 3'][idx];
          return (
            <div key={p.name} style={{ border:`1px solid ${m.border}`, borderRadius:12, overflow:'hidden' }}>
              {/* Header */}
              <button onClick={() => setExpandIdx(open ? -1 : idx)} style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'12px 14px', background:m.bg, border:'none', cursor:'pointer', gap:8,
              }}>
                <div className="flex items-center gap-2.5 flex-wrap text-left">
                  <span style={{ fontSize:9.5, fontWeight:700, color:m.color,
                    background:`${m.color}18`, border:`1px solid ${m.color}35`,
                    borderRadius:8, padding:'2px 9px' }}>
                    {hi ? ordHi : ordinal}
                  </span>
                  <span className="text-ivory/90 text-sm font-semibold font-devanagari">
                    {p.icon} {hi ? p.name_hi : p.name}
                  </span>
                  <PBadge priority={p.priority} hi={hi} />
                </div>
                <span style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>{open ? '▲' : '▼'}</span>
              </button>

              {/* Body */}
              {open && (
                <div style={{ padding:'14px 16px', borderTop:`1px solid ${m.border}` }}>
                  {/* Why triggered */}
                  <p className="text-ivory/50 text-[10.5px] leading-relaxed font-devanagari mb-3">
                    <span style={{ color:m.color, fontWeight:700 }}>
                      {T('Why triggered: ','क्यों सक्रिय: ')}
                    </span>
                    {p.triggers.map((tr, i) => (
                      <span key={i}>{hi ? tr.hi : tr.en}{i < p.triggers.length-1 ? ' · ' : ''}</span>
                    ))}
                  </p>

                  {/* Expected benefit */}
                  <div style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)',
                    borderRadius:8, padding:'9px 12px', marginBottom:10 }}>
                    <p className="text-[9.5px] font-bold text-[#22C55E] uppercase tracking-wide mb-1">
                      {T('Expected Benefit','अपेक्षित लाभ')}
                    </p>
                    <p className="text-ivory/70 text-[10.5px] leading-relaxed font-devanagari">
                      {hi ? p.benefit.hi : p.benefit.en}
                    </p>
                  </div>

                  {/* Remedy table */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { label:T('Daily Remedy','दैनिक उपाय'), icon:'🌅', text: hi ? p.dailyRemedy.hi : p.dailyRemedy.en, color:'#D4AF37' },
                      { label:T('Weekly Remedy','साप्ताहिक उपाय'), icon:'📅', text: hi ? p.weeklyRemedy.hi : p.weeklyRemedy.en, color:'#A78BFA' },
                    ].map(({ label, icon, text, color }) => (
                      <div key={label} style={{ border:`1px solid ${color}28`, borderRadius:8, padding:'9px 11px', background:`${color}05` }}>
                        <p style={{ color, fontSize:9.5, fontWeight:700, marginBottom:4 }}>{icon} {label}</p>
                        <p className="text-ivory/65 text-[10px] leading-relaxed font-devanagari">{text}</p>
                      </div>
                    ))}
                    {p.advancedRemedy?.en?.length > 0 && (
                      <div style={{ border:'1px solid rgba(96,165,250,0.28)', borderRadius:8, padding:'9px 11px', background:'rgba(96,165,250,0.05)' }}>
                        <p style={{ color:'#60A5FA', fontSize:9.5, fontWeight:700, marginBottom:4 }}>🔮 {T('Advanced Remedy','उन्नत उपाय')}</p>
                        {(hi ? p.advancedRemedy.hi : p.advancedRemedy.en).map((line, i) => (
                          <p key={i} className="text-ivory/60 text-[10px] leading-relaxed font-devanagari">• {line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 3: Planets Not Required ──────────────────────────────────────────
function HealthyPlanetsSection({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const [open, setOpen] = useState(false);
  const healthy = plan.buckets.healthy;
  const low     = plan.buckets.low;
  const fine    = [...healthy, ...low];
  if (!fine.length) return null;
  return (
    <div>
      <SectionHead icon="✅" title={T('Planets That Are Doing Well','ठीक ग्रह — उपाय आवश्यक नहीं')}
        sub={T('No major remedy needed for these — optional practices only.','इनके लिए कोई प्रमुख उपाय आवश्यक नहीं — केवल वैकल्पिक साधना।')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {fine.slice(0, open ? fine.length : 4).map((p) => (
          <div key={p.name} style={{ border:'1px solid rgba(34,197,94,0.22)', borderRadius:10,
            padding:'10px 13px', background:'rgba(34,197,94,0.04)',
            display:'flex', alignItems:'flex-start', gap:10 }}>
            <span className="text-base">{p.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-ivory/80 text-xs font-semibold font-devanagari">{hi ? p.name_hi : p.name}</span>
                <PBadge priority={p.priority} hi={hi} />
              </div>
              <p className="text-ivory/45 text-[10px] font-devanagari">
                {p.priority === 'healthy'
                  ? T('Strong — no specific remedy required.','मजबूत — कोई विशेष उपाय नहीं।')
                  : T('Minor support only — optional practice.','थोड़ी सहायता — वैकल्पिक साधना।')}
              </p>
              {p.remedy?.beeja_mantra && (
                <p className="text-[9.5px] mt-1" style={{ color:'#A78BFA' }}>
                  {T('Optional: ','वैकल्पिक: ')}{T('Morning Arghya or ','प्रातः अर्घ्य या ')}{p.remedy.beeja_mantra}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {fine.length > 4 && (
        <button onClick={() => setOpen(!open)} style={{
          marginTop:8, background:'transparent', border:'none', color:'#A78BFA',
          fontSize:11, fontWeight:700, cursor:'pointer', padding:0 }}>
          {open ? T('▲ Show less','▲ कम दिखाएं') : T(`▼ Show all ${fine.length}`,`▼ सभी ${fine.length} दिखाएं`)}
        </button>
      )}
    </div>
  );
}

// ── Section 4: Personal Puja Flow ─────────────────────────────────────────────
function PujaFlowSection({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const pick = (obj, en, h) => obj ? (hi ? (obj[h] || obj[en]) : obj[en]) : null;
  const totalMin = plan.pujaFlow.length * 7;

  return (
    <div>
      <SectionHead icon="🙏" title={T('Your Personal Puja Flow','आपका व्यक्तिगत पूजा क्रम')}
        sub={T(`Auto-built for your chart · Estimated ${totalMin}–${totalMin+8} min`,`आपकी कुंडली के अनुसार स्वतः निर्मित · अनुमानित ${totalMin}–${totalMin+8} मिनट`)} />
      <div className="space-y-2.5">
        {plan.pujaFlow.map((step, idx) => {
          const ed    = step.extra_data || {};
          const cond  = step.conditional || ed.conditional;
          const accentColor = cond ? '#A78BFA' : '#D4AF37';
          const stepLabel   = cond
            ? T('Conditional','सशर्त')
            : `${T('Step','चरण')} ${step.stepNum ?? idx}`;
          return (
            <div key={step.item_key || idx} style={{
              border:`1px solid ${accentColor}28`, borderRadius:10,
              padding:'11px 14px', background:`${accentColor}05`,
              display:'flex', gap:12, alignItems:'flex-start',
            }}>
              <div style={{ minWidth:44, height:44, borderRadius:'50%', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                background: cond ? 'rgba(167,139,250,0.1)' : 'rgba(212,175,55,0.12)',
                border:`1px solid ${accentColor}35`, flexShrink:0 }}>
                <span style={{ fontSize:9, fontWeight:700, color:accentColor, lineHeight:1 }}>
                  {stepLabel}
                </span>
              </div>
              <div style={{ flex:1 }}>
                <p className="text-ivory/88 text-xs font-semibold font-devanagari mb-0.5">
                  {pick(step, 'title_en', 'title_hi')}
                </p>
                {pick(step, 'description_en', 'description_hi') && (
                  <p className="text-ivory/55 text-[10px] leading-relaxed font-devanagari">
                    {pick(step, 'description_en', 'description_hi')}
                  </p>
                )}
                {cond && ed.condition && (
                  <p className="text-[10px] mt-1 font-devanagari" style={{ color:'#F59E0B' }}>
                    ⚑ {T('When required: ','जब आवश्यक हो: ')}{ed.condition}
                  </p>
                )}
              </div>
              {ed.mandatory && !cond && (
                <span style={{ fontSize:9, fontWeight:700, color:'#22C55E', background:'rgba(34,197,94,0.1)',
                  border:'1px solid rgba(34,197,94,0.25)', borderRadius:6, padding:'2px 7px',
                  whiteSpace:'nowrap', alignSelf:'center', flexShrink:0 }}>
                  {T('MANDATORY','अनिवार्य')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 5: Sadhana Duration ───────────────────────────────────────────────
function SadhanaDurationSection({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const days = plan.sadhanaDays;
  const color = days === 90 ? '#EF4444' : days === 43 ? '#F59E0B' : '#22C55E';

  return (
    <div>
      <SectionHead icon="🗓️" title={T('Recommended Sadhana Duration','अनुशंसित साधना अवधि')}
        sub={T('Automatically determined from your chart severity.','आपकी कुंडली की गंभीरता से स्वतः निर्धारित।')} />
      <div style={{ border:`1px solid ${color}35`, borderRadius:12, padding:'16px 18px', background:`${color}07` }}>
        <div className="flex items-center gap-4 mb-3">
          <div style={{ textAlign:'center', minWidth:60 }}>
            <p style={{ fontSize:36, fontWeight:800, color, fontFamily:'var(--font-playfair)', lineHeight:1 }}>{days}</p>
            <p className="text-ivory/45 text-[10px] font-devanagari">{T('Days','दिन')}</p>
          </div>
          <div>
            <p style={{ color, fontSize:12, fontWeight:700, fontFamily:'var(--font-playfair)', marginBottom:3 }}>
              {days === 90 ? T('Full Sadhana Cycle (3 Mandalas)','पूर्ण साधना चक्र (3 मंडल)')
               : days === 43 ? T('Purna Mandala (43 Days)','पूर्ण मंडल (43 दिन)')
               : T('Lunar Cycle Mandala (21 Days)','चंद्र चक्र मंडल (21 दिन)')}
            </p>
            <p className="text-ivory/55 text-[10.5px] leading-relaxed font-devanagari">
              {hi ? plan.sadhanaReason.hi : plan.sadhanaReason.en}
            </p>
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${color}20`, paddingTop:10 }}>
          <p className="text-ivory/35 text-[9.5px] font-devanagari">
            {T('💡 Start on a ', '💡 ')}
            {plan.focusPlanets[0] ? T(`${plan.focusPlanets[0].dayEn} (${plan.focusPlanets[0].name}'s day).`, `${plan.focusPlanets[0].dayHi} (${plan.focusPlanets[0].name_hi} का दिन) से शुरू करें।`) : ''}
            {' '}{T('Skip only on major festivals — otherwise continue daily.','प्रमुख त्योहारों को छोड़कर प्रतिदिन जारी रखें।')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Section 6: Practice Timing ────────────────────────────────────────────────
function PracticeTimingSection({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const tw = plan.timeWindows;
  const cg = plan.chogadiya;
  if (!tw && !cg) return null;

  const times = Array.isArray(tw?.extra_data) ? tw.extra_data : [];
  const qColor = (q) => q === 'best' ? '#D4AF37' : q === 'auspicious' ? '#22C55E' : '#60A5FA';

  return (
    <div>
      <SectionHead icon="⏰" title={T('Best Practice Times','सर्वोत्तम साधना समय')}
        sub={T('When to practise for best results. Always avoid Rahu Kaal.','सर्वोत्तम परिणाम के लिए कब साधना करें। सदा राहु काल से बचें।')} />

      {times.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {times.map((tw2, i) => {
            const qc = qColor(tw2.quality);
            const badge = tw2.quality === 'best' ? T('BEST','सर्वोत्तम')
                        : tw2.quality === 'auspicious' ? T('GOOD','अच्छा')
                        : T('AVOID','बचें');
            return (
              <div key={i} style={{ border:`1px solid ${qc}28`, borderRadius:8, padding:'9px 11px', background:`${qc}05` }}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10.5px] font-semibold font-devanagari" style={{ color:qc }}>
                    {hi ? (tw2.name_hi || tw2.name_en) : tw2.name_en}
                  </span>
                  <span style={{ fontSize:8.5, fontWeight:700, color:qc, background:`${qc}15`,
                    border:`1px solid ${qc}30`, borderRadius:6, padding:'1px 6px' }}>{badge}</span>
                </div>
                <p className="text-ivory/45 text-[9.5px]">{tw2.time}</p>
              </div>
            );
          })}
        </div>
      )}

      {cg?.extra_data && (
        <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:8, padding:'10px 13px' }}>
          <p className="text-[9.5px] font-bold text-gold/60 uppercase tracking-wide mb-2">
            {T('Chogadiya for Mantra Timing','मंत्र जाप के लिए चौघड़िया')}
          </p>
          <div className="flex flex-wrap gap-0">
            {(cg.extra_data.prefer  || []).map((c, i) => <Tag key={`p${i}`} label={c} color="#22C55E" />)}
            {(cg.extra_data.neutral || []).map((c, i) => <Tag key={`n${i}`} label={c} color="#F59E0B" />)}
            {(cg.extra_data.avoid   || []).map((c, i) => <Tag key={`a${i}`} label={c} color="#EF4444" />)}
          </div>
          <div className="flex gap-3 text-[9px] text-ivory/35 mt-1 font-devanagari">
            <span style={{ color:'#22C55E' }}>● {T('Prefer','अनुकूल')}</span>
            <span style={{ color:'#F59E0B' }}>● {T('Neutral','मध्यम')}</span>
            <span style={{ color:'#EF4444' }}>● {T('Avoid','वर्जित')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section 7: Special Life Areas ────────────────────────────────────────────
function SpecialAreasSection({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  if (!plan.specialAreas.length) return null;

  return (
    <div>
      <SectionHead icon="🎯" title={T('Special Life Area Remedies','विशेष जीवन क्षेत्र उपाय')}
        sub={T('Based on your chart — only areas that need focused attention.','आपकी कुंडली के अनुसार — केवल वे क्षेत्र जिन्हें विशेष ध्यान चाहिए।')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plan.specialAreas.map((area) => {
          const lead = area.relevantPlanets[0];
          const m    = PRIORITY[lead?.priority] || PRIORITY.medium;
          return (
            <div key={area.key} style={{ border:`1px solid ${m.border}`, borderRadius:10,
              padding:'12px 14px', background:m.bg }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{area.icon}</span>
                <p style={{ color:m.color, fontSize:11.5, fontWeight:700, fontFamily:'var(--font-playfair)' }}>
                  {hi ? area.hi : area.en}
                </p>
              </div>
              <p className="text-ivory/50 text-[10px] font-devanagari mb-2 leading-relaxed">
                {T('Planet(s) needing support: ','ध्यान देने वाले ग्रह: ')}
                {area.relevantPlanets.map(p => `${hi ? p.name_hi : p.name} (${hi ? PRIORITY[p.priority]?.labelHi : PRIORITY[p.priority]?.labelEn})`).join(', ')}
              </p>
              {lead?.remedy && (
                <p className="text-[9.5px] font-devanagari" style={{ color:'#A78BFA' }}>
                  {T('Suggested: ','सुझाव: ')}
                  {lead.remedy.beeja_mantra && `${lead.remedy.beeja_mantra} · `}
                  {hi ? (lead.remedy.daan_hi || lead.remedy.daan_en) : lead.remedy.daan_en}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 8: Admin Technical View ──────────────────────────────────────────
function AdminTechView({ plan, lang }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;

  return (
    <div className="space-y-5">
      <div>
        <SectionHead icon="📊" title="Technical Planet Score Analysis"
          sub="Need score (0–100). Higher = more remedy focus required." />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ background:'rgba(212,175,55,0.08)' }}>
                {['Planet','House','Dignity','Score','Priority','Dasha Active','Triggers'].map(h2 => (
                  <th key={h2} style={{ padding:'7px 10px', textAlign:'left', color:'#D4AF37',
                    fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.07em' }}>{h2}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.sorted.map((p, i) => {
                const m = PRIORITY[p.priority];
                const dashaActive = [
                  plan.currentDasha?.lord === p.name ? 'MD' : '',
                  plan.currentAntar?.lord  === p.name ? 'AD' : '',
                ].filter(Boolean).join('+') || '—';
                return (
                  <tr key={p.name} style={{ borderTop:'1px solid rgba(255,255,255,0.05)',
                    background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding:'7px 10px', color:'#D4AF37', fontWeight:700 }}>{p.icon} {p.name}</td>
                    <td style={{ padding:'7px 10px', color:'rgba(245,240,232,0.6)' }}>H{p.house}</td>
                    <td style={{ padding:'7px 10px', color:'rgba(245,240,232,0.65)', fontSize:10 }}>{p.dignity?.split('(')?.[0]?.trim()}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span style={{ color:m.color, fontWeight:700 }}>{p.score}</span>
                      <span className="text-ivory/30 text-[9px]">/100</span>
                    </td>
                    <td style={{ padding:'7px 10px' }}><PBadge priority={p.priority} hi={false} /></td>
                    <td style={{ padding:'7px 10px', color: dashaActive !== '—' ? '#F59E0B' : 'rgba(245,240,232,0.3)', fontSize:10, fontWeight: dashaActive !== '—' ? 700 : 400 }}>{dashaActive}</td>
                    <td style={{ padding:'7px 10px', maxWidth:200 }}>
                      <div className="flex flex-wrap gap-0">
                        {p.adminTriggers.map((tr, j) => (
                          <span key={j} style={{ fontSize:8.5, color:'rgba(167,139,250,0.85)',
                            background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.25)',
                            borderRadius:5, padding:'1px 6px', marginRight:3, marginBottom:3,
                            display:'inline-block', whiteSpace:'nowrap' }}>
                            {tr.rule} (+{tr.pts})
                          </span>
                        ))}
                        {!p.adminTriggers.length && <span className="text-ivory/25 text-[9px]">No active triggers</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Divider />

      {/* Trigger evidence per planet */}
      <div>
        <SectionHead icon="🔬" title="Trigger Engine — Evidence Per Planet"
          sub="Full breakdown of why each planet received its priority score." />
        <div className="space-y-2">
          {plan.sorted.filter(p => p.adminTriggers.length > 0).map((p) => {
            const m = PRIORITY[p.priority];
            return (
              <details key={p.name} style={{ border:`1px solid ${m.border}`, borderRadius:8, overflow:'hidden' }}>
                <summary style={{ padding:'9px 13px', cursor:'pointer', listStyle:'none',
                  background:m.bg, display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
                  <span style={{ color:'#D4AF37', fontWeight:700 }}>{p.icon} {p.name}</span>
                  <PBadge priority={p.priority} hi={false} />
                  <span className="text-ivory/40 text-[10px]">Score: {p.score}/100</span>
                  <span style={{ marginLeft:'auto', color:'rgba(245,240,232,0.3)', fontSize:10 }}>▾</span>
                </summary>
                <div style={{ padding:'10px 13px' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
                    <thead>
                      <tr>
                        {['Rule','Points Added','Evidence'].map(h2 => (
                          <th key={h2} style={{ padding:'4px 8px', textAlign:'left',
                            color:'rgba(212,175,55,0.6)', fontSize:9, textTransform:'uppercase',
                            letterSpacing:'0.06em', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{h2}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.adminTriggers.map((tr, j) => (
                        <tr key={j} style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding:'5px 8px', color:'#A78BFA', fontWeight:600 }}>{tr.rule}</td>
                          <td style={{ padding:'5px 8px', color:`${m.color}`, fontWeight:700 }}>+{tr.pts}</td>
                          <td style={{ padding:'5px 8px', color:'rgba(245,240,232,0.55)' }}>{tr.evidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* Remedy selection logic */}
      <div>
        <SectionHead icon="📋" title="Remedy Selection Logic"
          sub="Why each focus planet was chosen and what remedy was assigned." />
        <div className="space-y-2">
          {plan.focusPlanets.map((p, idx) => {
            const m = PRIORITY[p.priority];
            const ordinals = ['Priority 1','Priority 2','Priority 3'];
            return (
              <div key={p.name} style={{ border:`1px solid ${m.border}`, borderRadius:8, padding:'10px 13px', background:m.bg }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{ color:m.color, fontSize:10, fontWeight:700 }}>{ordinals[idx]}</span>
                  <span className="text-ivory/80 text-xs font-semibold">{p.icon} {p.name}</span>
                  <span className="text-ivory/35 text-[9.5px]">Score: {p.score}/100</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9.5px] text-ivory/55">
                  <p><span className="text-ivory/35">Deity: </span>{p.remedy?.ishta_devata_en || '—'}</p>
                  <p><span className="text-ivory/35">Mantra: </span>{p.remedy?.beeja_mantra || '—'}</p>
                  <p><span className="text-ivory/35">Daily count: </span>{p.mantraCount}×</p>
                  <p><span className="text-ivory/35">Weekly day: </span>{p.dayEn}</p>
                  <p><span className="text-ivory/35">Yantra: </span>{p.remedy?.yantra || '—'}</p>
                  <p><span className="text-ivory/35">Gemstone: </span>{p.remedy?.gemstone || '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PersonalizedRemedyPanel({ chart, remedyManual, lang = 'en', isAdmin = false }) {
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const [adminView, setAdminView] = useState(false);

  const plan = useMemo(() => computePersonalizedRemedies(chart, remedyManual), [chart, remedyManual]);

  if (!plan) return null;

  const topCount    = plan.buckets.critical.length + plan.buckets.high.length;
  const totalNeed   = plan.sorted.filter(p => p.priority !== 'healthy').length;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      className="card-royal p-5 mt-0">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <h2 className="font-serif text-gold text-base font-bold">
            🪷 {T('Personalized Remedy Plan','व्यक्तिगत उपाय योजना')}
          </h2>
          <p className="text-ivory/40 text-[10.5px] font-devanagari mt-0.5">
            {T('Chart-analysis-based · Tailored specifically for your Kundli',
               'कुंडली विश्लेषण आधारित · आपकी कुंडली के लिए विशेष रूप से तैयार')}
          </p>
        </div>
        {isAdmin && (
          <div style={{ display:'flex', gap:6 }}>
            {['user','admin'].map((mode) => (
              <button key={mode} onClick={() => setAdminView(mode === 'admin')}
                style={{ fontSize:10, fontWeight:700, padding:'5px 12px', borderRadius:8, cursor:'pointer',
                  border:`1px solid ${(adminView ? mode==='admin' : mode==='user') ? 'rgba(212,175,55,0.4)' : 'transparent'}`,
                  background:(adminView ? mode==='admin' : mode==='user') ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color:(adminView ? mode==='admin' : mode==='user') ? '#D4AF37' : 'rgba(245,240,232,0.38)' }}>
                {mode === 'user' ? T('👤 User View','👤 उपयोगकर्ता') : '🔬 Admin View'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', margin:'10px 0 16px',
        padding:'10px 14px', background:'rgba(212,175,55,0.05)',
        border:'1px solid rgba(212,175,55,0.14)', borderRadius:10 }}>
        {[
          { label: T('Lagna Lord','लग्न स्वामी'),   value: T(plan.lagnaLord, plan.PLANET_NAME_HI[plan.lagnaLord] || plan.lagnaLord) },
          { label: T('Atmakaraka','आत्मकारक'),      value: T(plan.atmakarak, plan.PLANET_NAME_HI[plan.atmakarak] || plan.atmakarak) },
          { label: T('Mahadasha','महादशा'),          value: plan.currentDasha ? T(plan.currentDasha.lord, plan.PLANET_NAME_HI[plan.currentDasha.lord] || plan.currentDasha.lord) : T('—','—') },
          { label: T('Planets needing focus','फोकस ग्रह'), value: `${totalNeed}/9` },
          { label: T('Sadhana','साधना'),              value: `${plan.sadhanaDays} ${T('days','दिन')}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign:'center', minWidth:70 }}>
            <p className="text-gold text-xs font-bold">{value}</p>
            <p className="text-ivory/35 text-[9px] font-devanagari">{label}</p>
          </div>
        ))}
        {topCount > 0 && (
          <div style={{ textAlign:'center', minWidth:70 }}>
            <p style={{ color:'#EF4444', fontSize:12, fontWeight:800 }}>{topCount}</p>
            <p className="text-ivory/35 text-[9px] font-devanagari">{T('Critical/High','गंभीर/उच्च')}</p>
          </div>
        )}
      </div>

      {/* ── ADMIN VIEW ── */}
      {adminView && isAdmin ? (
        <AdminTechView plan={plan} lang={lang} />
      ) : (
        /* ── USER VIEW ── */
        <div className="space-y-6">
          <PlanetHealthSection   plan={plan} lang={lang} />
          <Divider />
          <RemedyPlanSection     plan={plan} lang={lang} />
          <Divider />
          <HealthyPlanetsSection plan={plan} lang={lang} />
          <Divider />
          <PujaFlowSection       plan={plan} lang={lang} />
          <Divider />
          <SadhanaDurationSection plan={plan} lang={lang} />
          {(plan.timeWindows || plan.chogadiya) && (
            <>
              <Divider />
              <PracticeTimingSection plan={plan} lang={lang} />
            </>
          )}
          {plan.specialAreas.length > 0 && (
            <>
              <Divider />
              <SpecialAreasSection plan={plan} lang={lang} />
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
