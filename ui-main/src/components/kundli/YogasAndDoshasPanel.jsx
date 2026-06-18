'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { t, planetName, categoryLabel, detailText, getYogaDoshaDetail, localizeAstroText, strengthLabel } from '../../lib/astroI18n';
import { PLANET_META, TIMING_STYLE, timingToneLabel } from './kundliConstants';

const YOGA_STRENGTH_STYLE = {
  strong:   { bg:'rgba(34,197,94,0.12)',  color:'#22C55E', label:'Strong'   },
  moderate: { bg:'rgba(245,158,11,0.10)', color:'#F59E0B', label:'Moderate' },
  weak:     { bg:'rgba(239,68,68,0.10)',  color:'#EF4444', label:'Weak'     },
};
const DOSHA_SEV_STYLE = {
  strong:   { bg:'rgba(239,68,68,0.12)',  color:'#EF4444', label:'Strong'   },
  moderate: { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', label:'Moderate' },
  mild:     { bg:'rgba(96,165,250,0.10)', color:'#60A5FA', label:'Mild'     },
};
const CATEGORY_ICONS = {
  power:'👑', wealth:'💰', intellect:'🧠', wisdom:'📿', victory:'⚔️',
  karmic:'🔮', vish:'☠️', grahan:'🌑', luminary:'☀️', general:'⚖️',
};
const ACTIVATION_STYLE = {
  full:    { bg:'rgba(34,197,94,0.15)',  color:'#22C55E', label:'Full',    labelHi:'पूर्ण'    },
  partial: { bg:'rgba(245,158,11,0.14)', color:'#F59E0B', label:'Partial', labelHi:'आंशिक'   },
  weak:    { bg:'rgba(249,115,22,0.13)', color:'#F97316', label:'Weak',    labelHi:'कमज़ोर'   },
  blocked: { bg:'rgba(239,68,68,0.12)',  color:'#EF4444', label:'Blocked', labelHi:'अवरुद्ध' },
};

export default function YogasAndDoshasPanel({ chart, lang, library, admin = false, judgement = null }) {
  const [tab, setTab] = useState('yogas');
  const [openRef, setOpenRef] = useState(null);
  const yd = chart?.yogas_doshas;
  if (!yd) return null;

  const tabs = [
    { key:'yogaDasha', label:t(lang, 'Yoga + Dasha', 'योग + दशा') },
    { key:'timing',    label:t(lang, 'Event Timing', 'घटना समय') },
    { key:'yogas',     label: lang==='hi' ? `योग (${yd.yoga_count})`  : `Yogas (${yd.yoga_count})`  },
    { key:'doshas',    label: lang==='hi' ? `दोष (${yd.dosha_count})` : `Doshas (${yd.dosha_count})` },
  ];

  const hasMajorDosha = yd.doshas.some(d => d.severity === 'strong');
  const jYogas = judgement?.areas?.find(a => a.areaKey === 'yogas')?.yogas || [];
  const activationMap = Object.fromEntries(jYogas.map(y => [y.name, y]));
  const yogaDasha    = chart?.reports?.yoga_dasha_report || {};
  const eventTiming  = chart?.reports?.event_timing || {};

  const renderEntry = (entry, type, index) => {
    const isDosha = type === 'dosha';
    const st = isDosha
      ? (DOSHA_SEV_STYLE[entry.severity]  || DOSHA_SEV_STYLE.moderate)
      : (YOGA_STRENGTH_STYLE[entry.strength] || YOGA_STRENGTH_STYLE.moderate);
    const detail = getYogaDoshaDetail(entry, type);
    const name          = lang === 'hi' ? entry.name_hi  : entry.name;
    const secondaryName = lang === 'hi' ? entry.name     : entry.name_hi;
    const actYoga  = !isDosha ? activationMap[entry.name] : null;
    const actStyle = actYoga ? (ACTIVATION_STYLE[actYoga.activation] || ACTIVATION_STYLE.partial) : null;
    const statusLabel   = entry.is_cancelled
      ? t(lang, 'Relieved / Cancelled', 'राहत / रद्द')
      : entry.cancellation_status === 'active_with_relief'
      ? t(lang, 'Active with Relief', 'राहत के साथ सक्रिय')
      : entry.cancellation_status === 'modified'
      ? t(lang, 'Modified Result', 'परिवर्तित फल')
      : t(lang, 'Active', 'सक्रिय');

    return (
      <div key={`${entry.name}-${index}`} style={{
        border:`1px solid ${isDosha ? st.color + '33' : 'rgba(212,175,55,0.14)'}`,
        borderRadius:8, padding:13,
        background: isDosha ? `${st.color}07` : 'rgba(17,20,40,0.55)',
      }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-ivory/90 text-xs font-semibold font-devanagari">{name}</span>
              <span style={{
                color:'#D4AF37', background:'rgba(212,175,55,0.08)',
                border:'1px solid rgba(212,175,55,0.18)', borderRadius:10,
                padding:'1px 7px', fontSize:9, fontWeight:700,
              }}>
                {CATEGORY_ICONS[detail.category] || '✦'} {categoryLabel(detail.category, lang)}
              </span>
            </div>
            <p className="text-ivory/35 text-[10px] mt-0.5">{secondaryName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span style={{ background:st.bg, color:st.color, borderRadius:10, padding:'2px 8px', fontSize:9, fontWeight:700, whiteSpace:'nowrap' }}>
              {strengthLabel(isDosha ? entry.severity : entry.strength, lang)}
            </span>
            {actStyle && (
              <span style={{ background:actStyle.bg, color:actStyle.color, borderRadius:10, padding:'2px 8px', fontSize:8.5, fontWeight:700, whiteSpace:'nowrap' }}>
                ⚡ {lang === 'hi' ? actStyle.labelHi : actStyle.label}
              </span>
            )}
            <span style={{
              background: entry.is_cancelled ? 'rgba(34,197,94,0.13)' : 'rgba(212,175,55,0.08)',
              color: entry.is_cancelled ? '#22C55E' : '#D4AF37',
              borderRadius:10, padding:'2px 8px', fontSize:8.5, fontWeight:700, whiteSpace:'nowrap',
            }}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div style={{ display:'grid', gap:9 }}>
          <div>
            <p style={{ color:'#D4AF37', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:3 }}>
              {t(lang, 'Detected in this chart', 'इस कुंडली में कारण')}
            </p>
            <p className="text-ivory/62 text-[10.5px] leading-relaxed font-devanagari">
              {localizeAstroText(lang === 'hi' ? entry.trigger_hi : entry.trigger_en, lang)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.08)', borderRadius:6, padding:'8px 9px' }}>
              <p style={{ color:'rgba(245,240,232,0.38)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                {t(lang, 'Formation Rule', 'बनने का नियम')}
              </p>
              <p className="text-ivory/65 text-[10px] leading-relaxed font-devanagari">
                {detailText(detail, 'formation', lang)}
              </p>
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.08)', borderRadius:6, padding:'8px 9px' }}>
              <p style={{ color:'rgba(245,240,232,0.38)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                {t(lang, isDosha ? 'Likely Pressure' : 'Likely Result', isDosha ? 'संभावित दबाव' : 'संभावित फल')}
              </p>
              <p className="text-ivory/65 text-[10px] leading-relaxed font-devanagari">
                {detailText(detail, 'result', lang)}
              </p>
            </div>
          </div>

          <div style={{ background: isDosha ? `${st.color}0A` : 'rgba(34,197,94,0.04)', border:`1px solid ${isDosha ? st.color + '22' : 'rgba(34,197,94,0.14)'}`, borderRadius:6, padding:'8px 9px' }}>
            <p style={{ color: isDosha ? st.color : '#22C55E', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
              {t(lang, isDosha ? 'Balancing Guidance' : 'How to Use It', isDosha ? 'संतुलन मार्गदर्शन' : 'इसे कैसे उपयोग करें')}
            </p>
            <p className="text-ivory/65 text-[10px] leading-relaxed font-devanagari">
              {detailText(detail, 'guidance', lang)}
            </p>
          </div>

          {(entry.relief_en || entry.relief_hi) && (
            <div style={{ background: entry.is_cancelled ? 'rgba(34,197,94,0.05)' : 'rgba(212,175,55,0.045)', border:`1px solid ${entry.is_cancelled ? 'rgba(34,197,94,0.16)' : 'rgba(212,175,55,0.13)'}`, borderRadius:6, padding:'8px 9px' }}>
              <p style={{ color: entry.is_cancelled ? '#22C55E' : '#D4AF37', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                {t(lang, 'Cancellation / Relief Check', 'रद्द / राहत जांच')}
              </p>
              <p className="text-ivory/68 text-[10px] leading-relaxed font-devanagari">
                {lang === 'hi' ? (entry.relief_hi || entry.relief_en) : entry.relief_en}
              </p>
            </div>
          )}

          {/* Classical Reference (yogas_library / doshas_library — Class 11 & 12 PDF) */}
          {(() => {
            const lib = (isDosha ? library?.doshas : library?.yogas)?.[entry.name];
            if (!lib) return null;
            const refKey = `${type}-${index}`;
            const isOpen = openRef === refKey;
            const pick = (en, hi) => (lang === 'hi' ? (hi || en) : en);
            const blocks = [
              { label: t(lang, 'What is this', 'यह क्या है'),                txt: pick(lib.definition_en, lib.definition_hi),  color:'#D4AF37' },
              { label: t(lang, 'Signs you may notice', 'संभावित लक्षण'),     txt: pick(lib.symptoms_en, lib.symptoms_hi),      color:'#60A5FA' },
              { label: t(lang, 'Classical Effects', 'शास्त्रीय फल'),          txt: pick(lib.effects_en, lib.effects_hi),        color: isDosha ? '#F59E0B' : '#22C55E' },
              !isDosha && { label: t(lang, 'Cancellation Rules', 'भंग नियम'), txt: pick(lib.cancellation_en, lib.cancellation_hi), color:'#22C55E' },
              admin && isDosha && { label: t(lang, 'Technical Note (Astrologer)', 'तकनीकी नोट (ज्योतिषी)'), txt: pick(lib.technical_note_en, lib.technical_note_hi), color:'#A78BFA' },
            ].filter((b) => b && b.txt);
            if (!blocks.length) return null;
            return (
              <div style={{ border:'1px solid rgba(167,139,250,0.18)', borderRadius:6, background:'rgba(167,139,250,0.04)' }}>
                <button onClick={() => setOpenRef(isOpen ? null : refKey)}
                  style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'7px 9px', background:'transparent', border:'none', cursor:'pointer' }}>
                  <span style={{ color:'#A78BFA', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                    📖 {t(lang, 'Classical Reference (BPHS)', 'शास्त्रीय संदर्भ (BPHS)')}
                  </span>
                  <span style={{ color:'#A78BFA', fontSize:10 }}>{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div style={{ padding:'0 9px 9px', display:'grid', gap:7 }}>
                    {blocks.map((b, bi) => (
                      <div key={bi}>
                        <p style={{ color:b.color, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>{b.label}</p>
                        <p className="text-ivory/68 text-[10.5px] leading-relaxed font-devanagari">{b.txt}</p>
                      </div>
                    ))}
                    {admin && lib.source && (
                      <p className="text-ivory/35 text-[9px] italic">{t(lang, 'Source', 'स्रोत')}: {lib.source}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {entry.planets_involved?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/6">
            <span className="text-ivory/30 text-[9px] mr-1">{t(lang, 'Planets:', 'ग्रह:')}</span>
            {entry.planets_involved.map(pn => (
              <span key={pn} style={{ fontSize:9, color: PLANET_META[pn]?.color || st.color, background:isDosha ? `${st.color}0F` : 'rgba(212,175,55,0.07)', borderRadius:8, padding:'1px 6px', fontWeight:700 }}>
                {PLANET_META[pn]?.icon} {planetName(pn, lang)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
      className="card-royal p-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-gold text-sm font-semibold">
          ✨ {lang==='hi' ? 'योग एवं दोष' : 'Yogas & Doshas'}
        </h2>
        <div className="flex gap-2 text-[9px]">
          <span style={{ color:'#22C55E' }}>✦ {yd.yoga_count} {lang==='hi'?'योग':'yoga'}</span>
          <span style={{ color: hasMajorDosha ? '#EF4444' : '#F59E0B' }}>
            ⚠ {yd.dosha_count} {lang==='hi'?'दोष':'dosha'}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{
              padding:'4px 14px', borderRadius:16, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === tb.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === tb.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Yoga + Dasha tab */}
      {tab === 'yogaDasha' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <p className="text-ivory/78 text-sm leading-relaxed font-devanagari">
              {lang === 'hi'
                ? (yogaDasha.summary_hi || 'वर्तमान दशा से योग और दोष सक्रियता उपलब्ध नहीं है। कुंडली को पुनः गणना करें।')
                : (yogaDasha.summary_en || 'Yoga and dosha activation by current dasha is not available yet. Recalculate the chart.')}
            </p>
            {(yogaDasha.guidance_en || yogaDasha.guidance_hi) && (
              <p className="text-ivory/58 text-xs leading-relaxed mt-2 font-devanagari">
                {lang === 'hi' ? (yogaDasha.guidance_hi || yogaDasha.guidance_en) : yogaDasha.guidance_en}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              { key:'yogas',  title:t(lang, 'Dasha Activated Yogas',  'दशा सक्रिय योग'),  rows:yogaDasha.yogas  || [], empty:t(lang, 'No yoga is directly activated by current dasha.',  'वर्तमान दशा से कोई योग सीधे सक्रिय नहीं है।') },
              { key:'doshas', title:t(lang, 'Dasha Activated Doshas', 'दशा सक्रिय दोष'), rows:yogaDasha.doshas || [], empty:t(lang, 'No dosha is directly activated by current dasha.', 'वर्तमान दशा से कोई दोष सीधे सक्रिय नहीं है।') },
            ].map((group) => (
              <div key={group.key} className="rounded border border-gold/10 bg-white/3 p-4">
                <p className="text-gold/85 text-xs font-semibold mb-3 font-devanagari">{group.title}</p>
                {group.rows.length === 0 ? (
                  <p className="text-ivory/50 text-xs font-devanagari">{group.empty}</p>
                ) : (
                  <div className="space-y-2">
                    {group.rows.slice(0, 8).map((item, index) => (
                      <div key={`${group.key}-${item.name}-${index}`} className="rounded border border-white/7 bg-[#0f1128]/60 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-ivory/82 text-xs font-semibold font-devanagari">{lang === 'hi' ? item.name_hi : item.name}</p>
                            <p className="text-ivory/52 text-[10px] mt-1 font-devanagari">
                              {item.activated_by?.length
                                ? `${t(lang, 'Activated by', 'सक्रिय ग्रह')}: ${item.activated_by.map((p) => planetName(p, lang)).join(', ')}`
                                : t(lang, 'Background natal promise', 'जन्म कुंडली का पृष्ठभूमि संकेत')}
                            </p>
                          </div>
                          <span className={`rounded px-2 py-1 text-[9px] font-semibold shrink-0 ${item.active ? 'bg-emerald-400/12 text-emerald-300' : 'bg-white/5 text-ivory/62'}`}>
                            {item.active ? t(lang, 'Active', 'सक्रिय') : t(lang, 'Background', 'पृष्ठभूमि')}
                          </span>
                        </div>
                        <p className="text-ivory/66 text-xs leading-relaxed mt-2 font-devanagari">
                          {lang === 'hi' ? (item.timing_hi || item.timing_en) : item.timing_en}
                        </p>
                        {(item.relief_en || item.relief_hi) && (
                          <p className="text-gold/72 text-[10px] leading-relaxed mt-2 font-devanagari">
                            {lang === 'hi' ? (item.relief_hi || item.relief_en) : item.relief_en}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Timing tab */}
      {tab === 'timing' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <p className="text-ivory/72 text-xs leading-relaxed font-devanagari">
              {lang === 'hi'
                ? (eventTiming.methodology_hi || 'घटना समय रिपोर्ट उपलब्ध नहीं है। कुंडली को पुनः गणना करें।')
                : (eventTiming.methodology_en || 'Event timing report is not available yet. Recalculate the chart.')}
            </p>
            <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
              <span className="rounded bg-gold/10 text-gold/75 px-2 py-1">
                {t(lang, 'As of', 'तिथि')}: {eventTiming.as_of || '—'}
              </span>
              {eventTiming.current_window?.antardasha?.end && (
                <span className="rounded bg-white/5 text-ivory/62 px-2 py-1">
                  {t(lang, 'Current Antar ends', 'वर्तमान अंतर समाप्त')}: {eventTiming.current_window.antardasha.end}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(eventTiming.windows || []).map((window) => {
              const toneStyle = TIMING_STYLE[window.tone] || TIMING_STYLE.moderate;
              const triggers = lang === 'hi' ? (window.triggers_hi || window.triggers_en) : window.triggers_en;
              return (
                <div key={window.key} className="rounded border border-gold/10 bg-white/3 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-gold/85 text-xs font-semibold font-devanagari">
                      {lang === 'hi' ? (window.title_hi || window.title_en) : window.title_en}
                    </p>
                    <span className="rounded px-2 py-1 text-[9px] font-semibold shrink-0"
                      style={{ background:toneStyle.bg, color:toneStyle.color, border:`1px solid ${toneStyle.border}` }}>
                      {timingToneLabel(window.tone, lang)}
                    </span>
                  </div>
                  <p className="text-ivory/40 text-[10px] mb-2">
                    {window.date_from || '—'} → {window.date_to || '—'} · {t(lang, 'Score', 'स्कोर')}: {window.score}
                  </p>
                  <p className="text-ivory/70 text-xs leading-relaxed font-devanagari">
                    {lang === 'hi' ? (window.prediction_hi || window.prediction_en) : window.prediction_en}
                  </p>
                  {!!triggers?.length && (
                    <div className="mt-3 space-y-1">
                      {triggers.slice(0, 4).map((trigger, index) => (
                        <p key={index} className="text-ivory/50 text-[10px] leading-relaxed font-devanagari">{trigger}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {!(eventTiming.windows || []).length && (
              <p className="text-ivory/50 text-xs font-devanagari">
                {t(lang, 'No timing windows available yet.', 'अभी कोई घटना समय विंडो उपलब्ध नहीं है।')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Yogas tab */}
      {tab === 'yogas' && (
        yd.yogas.length === 0
          ? <p className="text-ivory/25 text-xs text-center py-6">{lang==='hi'?'कोई प्रमुख योग नहीं मिला।':'No major yogas detected in this chart.'}</p>
          : <div className="space-y-3">{yd.yogas.map((y, i) => renderEntry(y, 'yoga', i))}</div>
      )}

      {/* Doshas tab */}
      {tab === 'doshas' && (
        yd.doshas.length === 0
          ? <p className="text-ivory/25 text-xs text-center py-6">{lang==='hi'?'कोई प्रमुख दोष नहीं मिला।':'No major doshas detected in this chart.'}</p>
          : <div className="space-y-3">{yd.doshas.map((d, i) => renderEntry(d, 'dosha', i))}</div>
      )}
    </motion.div>
  );
}
