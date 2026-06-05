'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, planetName, chartStyleLabel } from '../../lib/astroI18n';
import { vargaDescription, vargaDomain, vargaKeyUses, vargaName, vargaSignifies } from '../../lib/vargaI18n';
import { PLANET_META, TIMING_STYLE } from './kundliConstants';
import { SouthIndianChart, NorthIndianChart } from './KundliChart';

export default function VargaChartsPanel({ birthChart, reference, referenceError, chartStyle, lang }) {
  const [selectedSlug, setSelectedSlug] = useState('d9');
  const vargaCharts    = birthChart?.varga_charts || birthChart?.divisional_charts || {};
  const referenceCharts = Array.isArray(reference?.charts) ? reference.charts : [];
  const fallbackSlugs  = Object.keys(vargaCharts);
  if (!fallbackSlugs.includes('d9') && birthChart?.navamsha) fallbackSlugs.push('d9');
  const fallbackDefinitions = fallbackSlugs
    .map((slug) => {
      const division = Number(String(slug).replace(/^d/i, ''));
      return {
        id: division || slug,
        code: division ? `D${division}` : String(slug).toUpperCase(),
        slug,
        division: division || 0,
        name_en: division ? `D${division}` : String(slug).toUpperCase(),
        primary_domain: '',
        signifies_en: '',
        key_uses_en: [],
        relationships: [],
      };
    })
    .sort((a, b) => a.division - b.division);
  const definitions      = referenceCharts.length ? referenceCharts : fallbackDefinitions;
  const definitionSlugs  = definitions.map((item) => item.slug).join('|');

  useEffect(() => {
    if (!definitions.length) return;
    const hasSelected = definitions.some((item) => item.slug === selectedSlug);
    if (!hasSelected) {
      const preferred = definitions.find((item) => item.slug === 'd9') || definitions[0];
      setSelectedSlug(preferred.slug);
    }
  }, [definitionSlugs, selectedSlug]);

  if (!birthChart || !definitions.length) return null;

  const selectedDefinition = definitions.find((item) => item.slug === selectedSlug)
    || definitions.find((item) => item.slug === 'd9')
    || definitions[0];
  const selectedChart = selectedDefinition.slug === 'd1'
    ? birthChart
    : (vargaCharts[selectedDefinition.slug] || (selectedDefinition.slug === 'd9' ? birthChart.navamsha : null));
  const selectedUses      = vargaKeyUses(selectedDefinition, lang);
  const selectedAscendant = selectedChart?.ascendant;
  const selectedPlanets   = Object.entries(selectedChart?.planets || {});
  const calculatedCount   = Object.keys(vargaCharts).length || (birthChart.navamsha ? 1 : 0);
  const reading           = birthChart?.varga_analysis?.[selectedDefinition.slug];

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.21 }}
      className="card-royal p-5 mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            {t(lang, 'Varga / Divisional Charts', 'वर्ग / विभागीय कुंडली')}
          </h2>
          <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
            {t(lang,
              `Choose a divisional chart to see its role, strengths, cautions, and remedies. ${calculatedCount} charts are available.`,
              `हर वर्ग कुंडली की भूमिका, शक्ति, सावधानी और उपाय देखने के लिए चार्ट चुनें। ${calculatedCount} चार्ट उपलब्ध हैं।`
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="rounded border border-gold/15 px-2 py-1 text-gold/70">
            {chartStyleLabel(chartStyle, lang)}
          </span>
          {selectedDefinition.is_high_precision && (
            <span className="rounded border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-amber-200/80">
              {t(lang, 'High precision', 'उच्च सटीकता')}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-gold/10">
        {definitions.map((definition) => {
          const active = definition.slug === selectedDefinition.slug;
          const hasChart = Boolean(
            definition.slug === 'd1'
              ? birthChart
              : (vargaCharts[definition.slug] || (definition.slug === 'd9' ? birthChart.navamsha : null))
          );
          return (
            <button key={definition.slug} type="button" onClick={() => setSelectedSlug(definition.slug)}
              style={{
                minWidth:74, padding:'7px 9px', borderRadius:8,
                border:`1px solid ${active ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.14)'}`,
                background: active ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.02)',
                color: active ? '#D4AF37' : hasChart ? 'rgba(245,240,232,0.58)' : 'rgba(245,240,232,0.25)',
                cursor:'pointer', flex:'0 0 auto', textAlign:'left',
              }}>
              <span className="block text-[11px] font-bold leading-tight">{definition.code}</span>
              <span className="block text-[8px] leading-tight mt-0.5 truncate font-devanagari">
                {vargaName(definition, lang)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <div className="rounded border border-gold/12 bg-[#0f1128]/55 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-gold text-xs font-bold">{selectedDefinition.code} · {vargaName(selectedDefinition, lang)}</p>
                <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">{vargaDomain(selectedDefinition, lang)}</p>
              </div>
              {selectedAscendant && (
                <div className="text-right shrink-0">
                  <p className="text-ivory/35 text-[9px]">{t(lang, 'Lagna', 'लग्न')}</p>
                  <p className="text-gold/85 text-[11px] font-devanagari">
                    {lang === 'hi' ? selectedAscendant.rashi_hi : selectedAscendant.rashi_en}
                  </p>
                </div>
              )}
            </div>

            {selectedChart ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div key={`varga-${selectedDefinition.slug}-${chartStyle}`}
                    initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.2 }}>
                    {chartStyle === 'south'
                      ? <SouthIndianChart chart={selectedChart} lang={lang} />
                      : <NorthIndianChart chart={selectedChart} lang={lang} />
                    }
                  </motion.div>
                </AnimatePresence>
                <div className="grid grid-cols-3 gap-1.5 mt-4">
                  {selectedPlanets.map(([planet, pd]) => (
                    <div key={planet} className="rounded border border-white/5 bg-white/3 px-2 py-1.5">
                      <p className="text-[9px] text-gold/70 font-devanagari truncate">
                        {PLANET_META[planet]?.icon} {planetName(planet, lang)}
                      </p>
                      <p className="text-[9px] text-ivory/55 font-devanagari truncate">
                        {lang === 'hi' ? pd.rashi_hi : pd.rashi_en}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-100/75">
                {t(lang,
                  'This saved profile does not yet contain this divisional chart. Recalculate the Kundli to populate the full Varga set.',
                  'इस सेव की गई कुंडली में यह वर्ग अभी उपलब्ध नहीं है। पूरा वर्ग सेट भरने के लिए कुंडली को पुनः गणना करें।'
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {/* Verdict + What this chart answers */}
          {reading ? (
            <div className="rounded border border-gold/15 bg-gradient-to-br from-[#1a1530]/60 to-[#0f1128]/60 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-1 font-devanagari">
                    {t(lang, 'What this chart tells you', 'यह कुंडली क्या बताती है')}
                  </p>
                  <p className="text-ivory/85 text-sm font-semibold font-devanagari leading-snug">
                    {lang === 'hi' ? (reading.role_hi || reading.role_en) : reading.role_en}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full font-devanagari ${
                  reading.overall_status === 'favorable'
                    ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/25'
                    : reading.overall_status === 'mixed'
                    ? 'bg-amber-400/12 text-amber-200 border border-amber-400/25'
                    : 'bg-red-400/12 text-red-300 border border-red-400/25'
                }`}>
                  {reading.verdict_en && lang !== 'hi' ? reading.verdict_en : reading.verdict_hi || (lang === 'hi' ? reading.overall_hi : reading.overall_en)}
                </span>
              </div>
              <p className="text-ivory/70 text-[12px] leading-relaxed font-devanagari">
                {lang === 'hi' ? (reading.user_summary_hi || reading.user_summary_en) : reading.user_summary_en}
              </p>
            </div>
          ) : (
            <div className="rounded border border-gold/12 bg-white/3 p-4">
              <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                {t(lang, 'About this chart', 'इस कुंडली के बारे में')}
              </p>
              <p className="text-ivory/55 text-[10px] mb-1 font-devanagari">{vargaSignifies(selectedDefinition, lang)}</p>
              <p className="text-ivory/65 text-sm leading-relaxed font-devanagari">{vargaDescription(selectedDefinition, lang)}</p>
            </div>
          )}

          {/* Three plain-language insight cards */}
          {reading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon:'✓', title:t(lang,'What It Means For You','आपके लिए क्या अर्थ है'), rows:reading.benefits||[], iconColor:'#22C55E', borderColor:'rgba(34,197,94,0.18)', bgColor:'rgba(34,197,94,0.05)' },
                { icon:'⚠', title:t(lang,'What To Watch','क्या ध्यान रखें'), rows:reading.watch_points||[], iconColor:'#F59E0B', borderColor:'rgba(245,158,11,0.18)', bgColor:'rgba(245,158,11,0.04)' },
                { icon:'✦', title:t(lang,'What To Do','क्या करें'), rows:reading.remedies||[], iconColor:'#A78BFA', borderColor:'rgba(167,139,250,0.18)', bgColor:'rgba(167,139,250,0.04)' },
              ].map((card) => (
                <div key={card.title} className="rounded border p-3 flex flex-col gap-2"
                  style={{ borderColor:card.borderColor, background:card.bgColor }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color:card.iconColor }} className="text-sm leading-none">{card.icon}</span>
                    <p className="text-[10px] font-semibold font-devanagari" style={{ color:card.iconColor }}>{card.title}</p>
                  </div>
                  <div className="space-y-2">
                    {card.rows.map((row, idx) => (
                      <p key={idx} className="text-ivory/72 text-[11px] leading-relaxed font-devanagari">
                        {lang === 'hi' ? row.hi : row.en}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Planet-by-Planet Deep Analysis */}
          {reading?.planet_readings?.length > 0 && (() => {
            const IMPACT_COLOR = {
              very_favorable: { badge:'#10B981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.22)', label_en:'Excellent',    label_hi:'उत्कृष्ट'   },
              favorable:      { badge:'#22C55E', bg:'rgba(34,197,94,0.07)',  border:'rgba(34,197,94,0.2)',   label_en:'Good',          label_hi:'अच्छा'      },
              neutral:        { badge:'#F59E0B', bg:'rgba(245,158,11,0.06)', border:'rgba(245,158,11,0.18)', label_en:'Neutral',       label_hi:'सामान्य'    },
              challenging:    { badge:'#EF4444', bg:'rgba(239,68,68,0.07)',  border:'rgba(239,68,68,0.2)',   label_en:'Needs Remedy',  label_hi:'उपाय करें'  },
            };
            const PLANET_COLOR = { Sun:'#FBBF24', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#10B981', Jupiter:'#F97316', Venus:'#F472B6', Saturn:'#818CF8', Rahu:'#A78BFA', Ketu:'#6B7280' };
            return (
              <div style={{ marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                      {t(lang,'Planet-by-Planet Analysis','ग्रह-दर-ग्रह विश्लेषण')}
                    </p>
                    <p style={{ fontSize:10, color:'rgba(245,240,232,0.68)', marginTop:3 }}>
                      {t(lang,`How each planet performs in the ${selectedDefinition.code} (${t(lang,reading.topic_en,reading.topic_hi)}) chart`,`${selectedDefinition.code} (${t(lang,reading.topic_en,reading.topic_hi)}) में प्रत्येक ग्रह का प्रदर्शन`)}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    {[
                      { label:t(lang,'Strong','बलवान'), color:'#10B981', count:reading.planet_readings.filter(p=>p.impact==='very_favorable'||p.impact==='favorable').length },
                      { label:t(lang,'Remedy','उपाय'),  color:'#EF4444', count:reading.planet_readings.filter(p=>p.is_challenged).length },
                    ].map(({ label, color, count }) => (
                      <div key={label} style={{ padding:'4px 10px', borderRadius:8, background:`${color}12`, border:`1px solid ${color}28`, textAlign:'center' }}>
                        <div style={{ fontSize:15, fontWeight:800, color, lineHeight:1 }}>{count}</div>
                        <div style={{ fontSize:9, color:'rgba(245,240,232,0.6)', marginTop:2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {reading.planet_readings.map((pr) => {
                    const ic = IMPACT_COLOR[pr.impact] || IMPACT_COLOR.neutral;
                    const pc = PLANET_COLOR[pr.planet] || '#D4AF37';
                    return (
                      <div key={pr.planet} style={{ borderRadius:10, border:`1px solid ${ic.border}`, background:ic.bg, overflow:'hidden' }}>
                        <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, flex:'0 0 auto' }}>
                            <span style={{ fontSize:18, color:pc }}>{pr.icon}</span>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:pc, lineHeight:1.1 }}>{lang==='hi' ? pr.planet_hi : pr.planet}</div>
                              <div style={{ fontSize:9, color:'rgba(245,240,232,0.65)', marginTop:1 }}>{pr.dignity}</div>
                            </div>
                          </div>
                          <div style={{ flex:1, minWidth:100 }}>
                            <div style={{ fontSize:10, color:'rgba(245,240,232,0.88)', fontWeight:600 }}>
                              H{pr.house} — {t(lang, pr.house_domain_en, pr.house_domain_hi)}
                            </div>
                            <div style={{ fontSize:9, color:'rgba(245,240,232,0.65)', marginTop:2 }}>{lang==='hi' ? pr.rashi_hi : pr.rashi_en}</div>
                          </div>
                          <span style={{ fontSize:9, fontWeight:700, color:ic.badge, background:`${ic.badge}15`, border:`1px solid ${ic.badge}30`, padding:'3px 9px', borderRadius:8, flexShrink:0, textTransform:'uppercase' }}>
                            {lang==='hi' ? ic.label_hi : ic.label_en}
                          </span>
                        </div>
                        {pr.positives_en?.length > 0 && (
                          <div style={{ padding:'0 14px 10px', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8 }}>
                            {(lang==='hi' ? pr.positives_hi : pr.positives_en).map((txt, i) => (
                              <div key={i} style={{ display:'flex', gap:7, marginBottom:5 }}>
                                <span style={{ color:'#22C55E', flexShrink:0, fontSize:12 }}>◈</span>
                                <p style={{ fontSize:11, color:'rgba(245,240,232,0.85)', lineHeight:1.7, margin:0 }}>{txt}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {pr.negatives_en?.length > 0 && (
                          <div style={{ padding:'0 14px 10px' }}>
                            {(lang==='hi' ? pr.negatives_hi : pr.negatives_en).map((txt, i) => (
                              <div key={i} style={{ display:'flex', gap:7, marginBottom:5 }}>
                                <span style={{ color:'#F97316', flexShrink:0, fontSize:12 }}>▸</span>
                                <p style={{ fontSize:11, color:'rgba(245,240,232,0.80)', lineHeight:1.7, margin:0 }}>{txt}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {pr.remedy && (
                          <div style={{ margin:'0 14px 12px', padding:'8px 12px', borderRadius:8, background:'rgba(167,139,250,0.07)', border:'1px solid rgba(167,139,250,0.2)' }}>
                            <div style={{ fontSize:9, fontWeight:700, color:'#A78BFA', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>
                              ✦ {t(lang,'Remedy','उपाय')} — {lang==='hi' ? pr.planet_hi : pr.planet}
                            </div>
                            <p style={{ fontSize:10, color:'rgba(245,240,232,0.80)', lineHeight:1.8, margin:0 }}>
                              {lang==='hi' ? pr.remedy.hi : pr.remedy.en}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {reading.chart_remedy && (
                  <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.2)' }}>
                    <div style={{ fontSize:9, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>
                      🕉 {t(lang,'Overall Chart Remedy','समग्र चार्ट उपाय')}
                    </div>
                    <p style={{ fontSize:11, color:'rgba(245,240,232,0.82)', lineHeight:1.8, margin:0 }}>
                      {lang==='hi' ? reading.chart_remedy.hi : reading.chart_remedy.en}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* D60 Past Life Reading */}
          {selectedDefinition.slug === 'd60' && reading?.past_life_reading && (() => {
            const pl = reading.past_life_reading;
            const KARMA_COLOR = pl.karma_quality === 'positive'
              ? { border:'rgba(34,197,94,0.25)', bg:'rgba(34,197,94,0.07)', text:'#86EFAC' }
              : pl.karma_quality === 'mixed'
              ? { border:'rgba(245,158,11,0.25)', bg:'rgba(245,158,11,0.07)', text:'#FCD34D' }
              : { border:'rgba(239,68,68,0.25)', bg:'rgba(239,68,68,0.07)', text:'#FCA5A5' };
            const relCards = [
              { label_en:'Your Past-Life Profession',   label_hi:'पूर्व जन्म में व्यवसाय',    icon:'💼', data:pl.profession,  color:'rgba(212,175,55,0.18)', tcolor:'#D4AF37'  },
              { label_en:'Relationship with Father',    label_hi:'पिता के साथ संबंध',         icon:'👨', data:pl.father,      color:'rgba(96,165,250,0.18)',  tcolor:'#93C5FD'  },
              { label_en:'Relationship with Mother',    label_hi:'माँ के साथ संबंध',           icon:'🌸', data:pl.mother,      color:'rgba(244,114,182,0.18)', tcolor:'#F9A8D4'  },
              { label_en:'Relationship with Spouse',   label_hi:'जीवनसाथी के साथ संबंध',     icon:'💑', data:pl.spouse,      color:'rgba(167,139,250,0.18)', tcolor:'#C4B5FD'  },
              { label_en:'Spiritual Status & Moksha',  label_hi:'आध्यात्मिक स्तर और मोक्ष', icon:'🕉', data:pl.past_moksha, color:'rgba(52,211,153,0.18)',  tcolor:'#6EE7B7'  },
            ];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gold/60 font-devanagari">
                      {t(lang, 'D60 — Past Life Reading', 'D60 — पूर्व जन्म पठन')}
                    </p>
                    <p className="text-ivory/85 text-xs font-devanagari mt-0.5">
                      {t(lang, `Past life lagna: ${pl.d60_lagna_en}`, `पूर्व जन्म लग्न: ${pl.d60_lagna_hi || pl.d60_lagna_en}`)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full font-devanagari"
                    style={{ border:`1px solid ${KARMA_COLOR.border}`, background:KARMA_COLOR.bg, color:KARMA_COLOR.text }}>
                    {lang === 'hi' ? (pl.karma_label_hi || pl.karma_label_en) : pl.karma_label_en}
                  </span>
                </div>
                <div className="rounded border border-gold/15 bg-gradient-to-br from-[#1a1530]/60 to-[#0f1128]/60 p-4">
                  <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Who You Were', 'आप कौन थे')}
                  </p>
                  <p className="text-ivory/75 text-[12px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? (pl.personality_hi || pl.personality_en) : pl.personality_en}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relCards.map((card) => card.data && (
                    <div key={card.label_en} className="rounded border p-3 space-y-1.5"
                      style={{ borderColor:card.color, background:card.color.replace('0.18','0.05') }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm leading-none">{card.icon}</span>
                        <p className="text-[10px] font-semibold font-devanagari" style={{ color:card.tcolor }}>
                          {lang === 'hi' ? (card.label_hi || card.label_en) : card.label_en}
                        </p>
                        <span className="ml-auto text-[9px] text-ivory/35 font-devanagari">
                          {t(lang, `House ${card.data.house}`, `भाव ${card.data.house}`)} · {lang === 'hi' ? card.data.primary_influence_hi : card.data.primary_influence}
                        </span>
                      </div>
                      <p className="text-ivory/70 text-[11px] leading-relaxed font-devanagari">
                        {lang === 'hi' ? (card.data.reading_hi || card.data.reading_en) : card.data.reading_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* D20 Spiritual Path */}
          {selectedDefinition.slug === 'd20' && reading?.spiritual_reading && (() => {
            const sp = reading.spiritual_reading;
            const SPIRIT_COLOR = sp.spirit_verdict === 'strong'
              ? { border:'rgba(52,211,153,0.25)', bg:'rgba(52,211,153,0.07)', text:'#6EE7B7' }
              : sp.spirit_verdict === 'moderate'
              ? { border:'rgba(245,158,11,0.25)', bg:'rgba(245,158,11,0.07)', text:'#FCD34D' }
              : { border:'rgba(167,139,250,0.25)', bg:'rgba(167,139,250,0.07)', text:'#C4B5FD' };
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gold/60 font-devanagari">
                      {t(lang, 'D20 — Your Spiritual Path', 'D20 — आपका आध्यात्मिक मार्ग')}
                    </p>
                    <p className="text-ivory/85 text-xs font-devanagari mt-0.5">
                      {t(lang, `D20 Lagna: ${sp.d20_lagna_en}`, `D20 लग्न: ${sp.d20_lagna_hi || sp.d20_lagna_en}`)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full font-devanagari"
                    style={{ border:`1px solid ${SPIRIT_COLOR.border}`, background:SPIRIT_COLOR.bg, color:SPIRIT_COLOR.text }}>
                    {lang === 'hi' ? (sp.verdict_hi || sp.verdict_en) : sp.verdict_en}
                  </span>
                </div>
                <div className="rounded border border-gold/15 bg-gradient-to-br from-[#1a1530]/60 to-[#0f1128]/60 p-4">
                  <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Your Spiritual Temperament', 'आपका आध्यात्मिक स्वभाव')}
                  </p>
                  <p className="text-ivory/75 text-[12px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? (sp.temperament_hi || sp.temperament_en) : sp.temperament_en}
                  </p>
                </div>
                <div className="rounded border border-indigo-400/20 bg-indigo-500/5 p-3">
                  <p className="text-indigo-300/70 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Your Core Practice', 'आपकी मुख्य साधना')}
                  </p>
                  <p className="text-ivory/72 text-[11px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? (sp.primary_practice_hi || sp.primary_practice_en) : sp.primary_practice_en}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sp.jupiter && (
                    <div className="rounded border p-3 space-y-1"
                      style={{ borderColor:sp.jupiter.favorable?'rgba(251,191,36,0.25)':'rgba(245,245,245,0.1)', background:sp.jupiter.favorable?'rgba(251,191,36,0.06)':'rgba(255,255,255,0.02)' }}>
                      <p className="text-[9px] uppercase tracking-widest font-devanagari" style={{ color:sp.jupiter.favorable?'#FCD34D':'#9CA3AF' }}>
                        {t(lang, '♃ Jupiter in D20', '♃ D20 में गुरु')}
                      </p>
                      <p className="text-ivory/72 text-[11px] font-devanagari">
                        {lang === 'hi' ? sp.jupiter.sign_hi : sp.jupiter.sign_en} · {t(lang, `House ${sp.jupiter.house}`, `भाव ${sp.jupiter.house}`)}
                      </p>
                      <p className="text-[10px] font-devanagari" style={{ color:sp.jupiter.favorable?'#86EFAC':'#FCA5A5' }}>
                        {sp.jupiter.favorable ? t(lang,'✓ Spiritually strong','✓ आध्यात्मिक बल अच्छा') : t(lang,'⚠ Needs strengthening','⚠ बल बढ़ाने की जरूरत')}
                      </p>
                    </div>
                  )}
                  {sp.ketu && (
                    <div className="rounded border p-3 space-y-1"
                      style={{ borderColor:sp.ketu.favorable?'rgba(167,139,250,0.25)':'rgba(245,245,245,0.1)', background:sp.ketu.favorable?'rgba(167,139,250,0.06)':'rgba(255,255,255,0.02)' }}>
                      <p className="text-[9px] uppercase tracking-widest font-devanagari" style={{ color:sp.ketu.favorable?'#C4B5FD':'#9CA3AF' }}>
                        {t(lang, '☊ Ketu in D20', '☊ D20 में केतु')}
                      </p>
                      <p className="text-ivory/72 text-[11px] font-devanagari">
                        {lang === 'hi' ? sp.ketu.sign_hi : sp.ketu.sign_en} · {t(lang, `House ${sp.ketu.house}`, `भाव ${sp.ketu.house}`)}
                      </p>
                      <p className="text-[10px] font-devanagari" style={{ color:sp.ketu.favorable?'#86EFAC':'#FCA5A5' }}>
                        {sp.ketu.favorable ? t(lang,'✓ Liberation karma strong','✓ मोक्ष कर्म मजबूत') : t(lang,'Developing moksha seed','मोक्ष बीज विकसित हो रहा')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="rounded border border-saffron/20 bg-saffron/5 p-3">
                  <p className="text-saffron/70 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Path of Divine Grace (9th House)', 'दिव्य कृपा का मार्ग (9वाँ भाव)')}
                  </p>
                  <p className="text-ivory/72 text-[11px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? (sp.grace_path_hi || sp.grace_path_en) : sp.grace_path_en}
                  </p>
                </div>
                {sp.ishta_devata && (
                  <div className="rounded border border-gold/20 bg-gold/5 p-3">
                    <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                      {t(lang, 'Your Ishta Devata (Personal Deity)', 'आपके इष्ट देवता')}
                    </p>
                    <p className="text-gold text-sm font-semibold font-devanagari mb-1">
                      {lang === 'hi' ? sp.ishta_devata.hi : sp.ishta_devata.en}
                    </p>
                    <p className="text-ivory/60 text-[11px] font-devanagari">
                      {t(lang, 'Mantra:', 'मंत्र:')} {lang === 'hi' ? (sp.ishta_devata.mantra_hi || sp.ishta_devata.mantra_en) : sp.ishta_devata.mantra_en}
                    </p>
                  </div>
                )}
                {sp.moksha_indicator && (
                  <div className="rounded border border-emerald-400/15 bg-emerald-500/5 p-3">
                    <p className="text-emerald-300/60 text-[10px] uppercase tracking-widest mb-1 font-devanagari">
                      {t(lang, 'Moksha Path (12th House)', 'मोक्ष मार्ग (12वाँ भाव)')}
                    </p>
                    <p className="text-ivory/72 text-[11px] font-devanagari">
                      {lang === 'hi'
                        ? `12वें भाव पर ${sp.moksha_indicator_hi} का प्रभाव — इस ग्रह की दिशा में मोक्ष साधना सबसे प्रभावी है।`
                        : `${sp.moksha_indicator} governs your 12th house of liberation — align your liberation practice with this planet's energy for the deepest results.`
                      }
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Use this chart for */}
          {selectedUses.length > 0 && (
            <div>
              <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                {t(lang, 'Use This Chart To Check', 'इस कुंडली से जानें')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedUses.map((item) => (
                  <div key={item} className="rounded border border-gold/10 bg-[#111428]/55 px-3 py-2 text-ivory/65 text-[11px] font-devanagari flex items-start gap-2">
                    <span className="text-gold/40 mt-0.5 shrink-0">·</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {referenceError && (
        <p className="text-amber-200/60 text-[10px] mt-4">
          {t(lang, 'Reference API unavailable; showing calculated Varga charts only.', 'संदर्भ API उपलब्ध नहीं है; केवल गणित वर्ग कुंडलियां दिखाई जा रही हैं।')}
        </p>
      )}
    </motion.div>
  );
}
