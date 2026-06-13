'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

// Remedy Manual — Planet Ishta Devata, Puja Sequence & Sadhana Guidance
// Source: "Vedic Jyotish Remedial Manual" by Saiansh Arya (4th May 2026 class notes)

const PLANET_ICONS = {
  Sun:'☀️', Moon:'🌙', Mars:'🔴', Mercury:'💚', Jupiter:'🟡', Venus:'💎', Saturn:'🪐', Rahu:'☁️', Ketu:'🌀',
};

function Chip({ label, color = '#A78BFA' }) {
  return (
    <span style={{ fontSize:9.5, fontWeight:600, color, background:`${color}14`, border:`1px solid ${color}35`,
      borderRadius:8, padding:'2px 8px', whiteSpace:'nowrap', display:'inline-block', marginRight:4, marginBottom:4 }}>
      {label}
    </span>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ fontSize:11, fontWeight:600, padding:'6px 14px', borderRadius:8,
        background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
        color: active ? '#D4AF37' : 'rgba(240,230,210,0.45)',
        border: active ? '1px solid rgba(212,175,55,0.35)' : '1px solid transparent',
        cursor:'pointer', transition:'all 0.15s' }}>
      {label}
    </button>
  );
}

// ── Tab 1: Planet Deities ─────────────────────────────────────────────────────
function PlanetDeitiesTab({ planets, lang }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;
  return (
    <div className="space-y-3 mt-4">
      {(planets || []).map((p) => {
        const suktams = (lang === 'hi' ? (p.primary_suktam_hi || p.primary_suktam_en) : p.primary_suktam_en)
          ?.split(' | ').filter(Boolean) || [];
        const isdDev = lang === 'hi' ? (p.ishta_devata_hi || p.ishta_devata_en) : p.ishta_devata_en;
        const gem    = lang === 'hi' ? (p.gemstone_hi || p.gemstone) : p.gemstone;
        return (
          <div key={p.name} style={{ border:'1px solid rgba(212,175,55,0.18)', borderRadius:10,
            padding:'12px 14px', background:'rgba(212,175,55,0.03)' }}>
            <div className="flex items-start gap-2 flex-wrap mb-2">
              <span className="text-sm">{PLANET_ICONS[p.name] || '🪐'}</span>
              <span className="text-ivory/90 text-xs font-bold font-devanagari">
                {lang === 'hi' ? (p.name_hi || p.name) : p.name}
              </span>
              {isdDev && (
                <span className="text-[10.5px] font-devanagari" style={{ color:'#D4AF37' }}>
                  🙏 {T('Ishta Devata','इष्ट देवता')}: {isdDev}
                </span>
              )}
            </div>
            {suktams.length > 0 && (
              <div className="mb-2">
                <span className="text-[9.5px] text-ivory/40 uppercase tracking-wide mr-2">
                  {T('Primary Suktam/Stotra','प्राथमिक सूक्तम')}
                </span>
                <div className="inline-flex flex-wrap gap-0">
                  {suktams.map((s, i) => <Chip key={i} label={s} color="#A78BFA" />)}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-devanagari text-ivory/55">
              {p.beeja_mantra && (
                <span style={{ color:'#60A5FA' }}>🕉 {p.beeja_mantra}</span>
              )}
              {p.yantra && <span>⬡ {T('Yantra','यंत्र')}: {p.yantra}</span>}
              {(p.daan_en || p.daan_hi) && (
                <span>🎁 {T('Daan','दान')}: {lang === 'hi' ? (p.daan_hi || p.daan_en) : p.daan_en}</span>
              )}
              {gem && <span>💎 {T('Gemstone','रत्न')}: {gem}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 2: Puja Sequence ──────────────────────────────────────────────────────
function PujaSequenceTab({ steps, lang }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;
  const pick = (r, en, hi) => r ? (lang === 'hi' ? (r[hi] || r[en]) : r[en]) : null;
  return (
    <div className="mt-4 space-y-3">
      <p className="text-ivory/45 text-[10.5px] leading-relaxed font-devanagari mb-3">
        {T(
          'Follow this sequence for every puja/sadhana session. Steps 0–3 are mandatory; T&C Shakti Pujan is conditional.',
          'प्रत्येक पूजा/साधना सत्र के लिए इस क्रम का पालन करें। चरण 0–3 अनिवार्य हैं; शक्ति पूजन सशर्त है।'
        )}
      </p>
      {(steps || []).map((s, idx) => {
        const ed   = s.extra_data || {};
        const cond = ed.conditional;
        const stepLabel = cond
          ? T('Conditional', 'सशर्त')
          : `${T('Step','चरण')} ${ed.step ?? idx}`;
        const border = cond ? 'rgba(167,139,250,0.25)' : 'rgba(212,175,55,0.25)';
        const bg     = cond ? 'rgba(167,139,250,0.04)' : 'rgba(212,175,55,0.04)';
        const accent = cond ? '#A78BFA' : '#D4AF37';
        return (
          <div key={s.item_key} style={{ border:`1px solid ${border}`, borderRadius:10, padding:'12px 14px', background:bg }}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span style={{ fontSize:10, fontWeight:700, color: accent,
                background:`${accent}14`, border:`1px solid ${accent}30`,
                borderRadius:6, padding:'2px 8px' }}>{stepLabel}</span>
              <span className="text-ivory/85 text-xs font-semibold font-devanagari">
                {pick(s, 'title_en', 'title_hi')}
              </span>
              {ed.mandatory === true && (
                <Chip label={T('MANDATORY','अनिवार्य')} color="#22C55E" />
              )}
            </div>
            {pick(s, 'description_en', 'description_hi') && (
              <p className="text-ivory/60 text-[10.5px] leading-relaxed font-devanagari">
                {pick(s, 'description_en', 'description_hi')}
              </p>
            )}
            {ed.condition && (
              <p className="text-[10px] font-devanagari mt-1" style={{ color:'#F59E0B' }}>
                ⚑ {T('Condition','शर्त')}: {ed.condition}
              </p>
            )}
            {pick(s, 'effects_en', 'effects_hi') && (
              <p className="text-ivory/55 text-[10px] leading-relaxed font-devanagari mt-1">
                {pick(s, 'effects_en', 'effects_hi')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 3: How to Practise ────────────────────────────────────────────────────
function HowToPractiseTab({ guidance, lang }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;
  const pick = (r, en, hi) => r ? (lang === 'hi' ? (r[hi] || r[en]) : r[en]) : null;

  const find = (key) => guidance?.find((g) => g.item_key === key);
  const dur43  = find('duration_43');
  const dur90  = find('duration_90');
  const vedic  = find('vedic_rules');
  const paura  = find('pauranik_rules');
  const time   = find('time_windows');
  const muhur  = find('muhurat_guide');
  const chog   = find('chogadiya_guide');

  return (
    <div className="mt-4 space-y-4">

      {/* Duration */}
      {(dur43 || dur90) && (
        <div>
          <h3 className="text-[11px] font-bold text-gold/80 uppercase tracking-wide mb-2">
            {T('Sadhana Duration','साधना अवधि')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[dur43, dur90].filter(Boolean).map((d) => {
              const ed = d.extra_data || {};
              return (
                <div key={d.item_key} style={{ border:'1px solid rgba(212,175,55,0.2)', borderRadius:8, padding:'10px 12px', background:'rgba(212,175,55,0.04)' }}>
                  <span className="text-gold text-sm font-bold">{ed.days}</span>
                  <span className="text-ivory/50 text-[10px] ml-1">{T('days','दिन')}</span>
                  <p className="text-[9.5px] text-ivory/50 mt-0.5">{ed.type}</p>
                  <p className="text-[10px] text-ivory/65 font-devanagari mt-1">
                    {lang === 'hi' ? (ed.for_hi || ed.for_en) : ed.for_en}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vedic vs Pauranik rules */}
      {(vedic || paura) && (
        <div>
          <h3 className="text-[11px] font-bold text-gold/80 uppercase tracking-wide mb-2">
            {T('Practice Rules','साधना नियम')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[vedic, paura].filter(Boolean).map((r) => {
              const ed = r.extra_data || {};
              return (
                <div key={r.item_key} style={{ border:'1px solid rgba(96,165,250,0.2)', borderRadius:8, padding:'10px 12px', background:'rgba(96,165,250,0.03)' }}>
                  <p className="text-[10.5px] font-bold font-devanagari mb-2" style={{ color:'#60A5FA' }}>
                    {pick(r, 'title_en', 'title_hi')}
                  </p>
                  <div className="space-y-1 text-[10px] font-devanagari text-ivory/65">
                    <p>🧭 {T('Direction','दिशा')}: <span className="text-ivory/85">{ed.direction}</span></p>
                    <p>🪑 {T('Aasan','आसन')}: <span className="text-ivory/85">{ed.aasan}</span></p>
                    <p>🌿 {T('Aachman','आचमन')}: <span style={{ color: ed.aachman ? '#22C55E' : '#EF4444' }}>
                      {ed.aachman ? T('Required','आवश्यक') : T('Not required','आवश्यक नहीं')}
                    </span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time windows */}
      {time && Array.isArray(time.extra_data) && (
        <div>
          <h3 className="text-[11px] font-bold text-gold/80 uppercase tracking-wide mb-2">
            {T('Daily Sadhana Time Windows','दैनिक साधना समय')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {time.extra_data.map((tw, i) => {
              const qColor = tw.quality === 'best' ? '#D4AF37' : tw.quality === 'auspicious' ? '#22C55E' : '#60A5FA';
              return (
                <div key={i} style={{ border:`1px solid ${qColor}25`, borderRadius:8, padding:'8px 10px', background:`${qColor}05` }}>
                  <span className="text-[10px] font-bold font-devanagari" style={{ color: qColor }}>
                    {lang === 'hi' ? (tw.name_hi || tw.name_en) : tw.name_en}
                  </span>
                  <p className="text-[9.5px] text-ivory/55 mt-0.5">{tw.time}</p>
                  <Chip label={tw.quality} color={qColor} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Muhurat guide */}
      {muhur && muhur.extra_data && (
        <div>
          <h3 className="text-[11px] font-bold text-gold/80 uppercase tracking-wide mb-2">
            {T('Muhurat Guide','मुहूर्त मार्गदर्शिका')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div style={{ border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <p className="text-[9.5px] font-bold uppercase tracking-wide mb-1" style={{ color:'#22C55E' }}>
                {T('Prefer','अनुकूल')}</p>
              {(muhur.extra_data.prefer || []).map((m, i) => (
                <p key={i} className="text-[10px] text-ivory/70 font-devanagari">✓ {m}</p>
              ))}
            </div>
            <div style={{ border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <p className="text-[9.5px] font-bold uppercase tracking-wide mb-1" style={{ color:'#EF4444' }}>
                {T('Avoid','वर्जित')}</p>
              {(muhur.extra_data.avoid || []).map((m, i) => (
                <p key={i} className="text-[10px] text-ivory/70 font-devanagari">✗ {m}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chogadiya guide */}
      {chog && chog.extra_data && (
        <div>
          <h3 className="text-[11px] font-bold text-gold/80 uppercase tracking-wide mb-2">
            {T('Chogadiya for Mantra Timing','मंत्र के लिए चौघड़िया')}</h3>
          <div className="flex gap-2 flex-wrap">
            {(chog.extra_data.prefer || []).map((c, i) => <Chip key={`p${i}`} label={c} color="#22C55E" />)}
            {(chog.extra_data.neutral || []).map((c, i) => <Chip key={`n${i}`} label={c} color="#F59E0B" />)}
            {(chog.extra_data.avoid || []).map((c, i) => <Chip key={`a${i}`} label={c} color="#EF4444" />)}
          </div>
          <div className="flex gap-3 text-[9.5px] text-ivory/40 mt-1 font-devanagari">
            <span style={{ color:'#22C55E' }}>● {T('Prefer','अनुकूल')}</span>
            <span style={{ color:'#F59E0B' }}>● {T('Neutral','मध्यम')}</span>
            <span style={{ color:'#EF4444' }}>● {T('Avoid','वर्जित')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RemedyManualPanel({ data, lang = 'en' }) {
  const [tab, setTab] = useState('deities');
  const T = (en, hi) => lang === 'hi' ? hi : en;

  if (!data) return null;
  const { planet_deities, puja_sequence, sadhana_guidance } = data;
  if (!planet_deities?.length && !puja_sequence?.length && !sadhana_guidance?.length) return null;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
      className="card-royal p-5 mt-6">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">
        🕉 {T('Vedic Remedy Manual', 'वैदिक उपाय मार्गदर्शिका')}
      </h2>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T(
          'Ishta Devata for each planet, puja sequence, and sadhana practice guidelines from Vedic Jyotish Remedial Manual.',
          'प्रत्येक ग्रह के इष्ट देवता, पूजा क्रम एवं वैदिक ज्योतिष उपाय मार्गदर्शिका।'
        )}
      </p>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-1">
        <TabBtn label={T('Planet Deities','ग्रह देवता')} active={tab==='deities'}  onClick={() => setTab('deities')} />
        <TabBtn label={T('Puja Sequence','पूजा क्रम')}   active={tab==='puja'}     onClick={() => setTab('puja')} />
        <TabBtn label={T('How to Practise','साधना विधि')} active={tab==='practice'} onClick={() => setTab('practice')} />
      </div>

      {tab === 'deities'  && <PlanetDeitiesTab  planets={planet_deities}    lang={lang} />}
      {tab === 'puja'     && <PujaSequenceTab   steps={puja_sequence}       lang={lang} />}
      {tab === 'practice' && <HowToPractiseTab  guidance={sadhana_guidance} lang={lang} />}
    </motion.div>
  );
}
