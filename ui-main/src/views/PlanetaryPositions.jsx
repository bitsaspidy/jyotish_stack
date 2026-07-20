'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import PlanetaryTransitChart from '../components/PlanetaryTransitChart';
import { ChartToggle } from '../components/kundli/KundliChart';
import { useLang } from '../context/LangContext';
import { t, planetName, chartStyleLabel } from '../lib/astroI18n';
import { normalizePlanetaryChartStyle } from '../lib/planetaryChart.mjs';
import api from '../lib/api';

const GOLD  = '#D4AF37';
const MUTED = 'rgba(245,240,232,0.55)';
// Strength of the planet in the sign it currently occupies (exalted/own/friend =
// strong, debilitated/rival = weak). Set by the API's dignity_tone.
const TONE_COLOR = { strong: '#22C55E', neutral: '#60A5FA', weak: '#F59E0B' };

const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B' }, Moon:    { icon:'☽', color:'#94A3B8' },
  Mars:    { icon:'♂', color:'#EF4444' }, Mercury: { icon:'☿', color:'#10B981' },
  Jupiter: { icon:'♃', color:'#FBBF24' }, Venus:   { icon:'♀', color:'#F472B6' },
  Saturn:  { icon:'♄', color:'#818CF8' }, Rahu:    { icon:'☊', color:'#A78BFA' },
  Ketu:    { icon:'☋', color:'#6B7280' },
};

const todayIST = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
function shiftDate(dateStr, n) { const d = new Date(dateStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function fmtDate(dateStr, lang) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

export default function PlanetaryPositions({ initialDate }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [date, setDate] = useState(initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : todayIST());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartStyle, setChartStyle] = useState('south');
  // Upagrahas are shadow points, not grahas — on by default because they are the
  // reason many readers come to a Gochar page, but dismissible for anyone who
  // just wants the nine planets.
  const [showUpagrahas, setShowUpagrahas] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kundli_chart_style');
      setChartStyle(normalizePlanetaryChartStyle(saved));
    } catch {
      // The chart still works when browser storage is unavailable.
    }
  }, []);

  const handleChartStyleChange = (nextStyle) => {
    const normalizedStyle = normalizePlanetaryChartStyle(nextStyle);
    setChartStyle(normalizedStyle);
    try {
      localStorage.setItem('kundli_chart_style', normalizedStyle);
    } catch {
      // Keep the in-page selection even when persistence is unavailable.
    }
  };

  useEffect(() => {
    setLoading(true);
    // detail=1 asks for the enriched payload: dignity, the composed effect line,
    // retrograde/combustion notes and the transit window.
    api.get(`/panchang/planet-positions?date=${date}&detail=1`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-12">

        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-6">
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            🌌 {t(lang, 'Planetary Positions', 'ग्रह स्थिति (गोचर)')}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:560, margin:'8px auto 0', lineHeight:1.7 }}>
            {t(lang,
              'Sidereal (Lahiri) positions of all nine planets for any day — sign, degree, nakshatra and retrograde status.',
              'किसी भी दिन नवग्रहों की निरयन (लाहिरी) स्थिति — राशि, अंश, नक्षत्र एवं वक्री स्थिति।')}
          </p>
        </motion.div>

        {/* Date navigator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
          <button onClick={() => setDate(shiftDate(date, -1))} style={navBtn}>←</button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
            className="input-royal" style={{ fontSize:13, padding:'6px 12px', width:'auto', colorScheme:'dark' }} />
          <button onClick={() => setDate(shiftDate(date, 1))} style={navBtn}>→</button>
          <button onClick={() => setDate(todayIST())} style={{ ...navBtn, width:'auto', padding:'0 14px', fontSize:11 }}>{t(lang,'Today','आज')}</button>
        </div>
        <p style={{ textAlign:'center', color:MUTED, fontSize:12, marginBottom:20 }}>{fmtDate(date, lang)}</p>

        {loading ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Calculating positions…', 'स्थिति गणना हो रही है…')}</p>
        ) : !data ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Unable to load positions.', 'स्थिति लोड नहीं हो सकी।')}</p>
        ) : (
          <motion.div
            key={date}
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 390px), 1fr))', gap:16, alignItems:'start' }}
          >
            <section className="card-royal p-4" aria-label={t(lang, 'Chart', 'चार्ट')}>
              <ChartToggle style={chartStyle} onChange={handleChartStyleChange} lang={lang} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:12 }}>
                <div>
                  <p style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700 }}>
                    {chartStyle === 'north' ? '◇' : '◈'} {t(lang, 'Chart', 'चार्ट')}
                  </p>
                  <p style={{ color:MUTED, fontSize:10, marginTop:3 }}>
                    {t(lang, 'Planetary Positions', 'ग्रह स्थिति')} · {chartStyleLabel(chartStyle, lang)}
                  </p>
                </div>
                <span style={{ color:'rgba(245,240,232,0.35)', fontSize:9, textAlign:'right' }}>
                  {t(lang, 'Retrograde', 'वक्री')} = ℞
                </span>
              </div>
              <motion.div
                key={chartStyle}
                initial={{ opacity:0, scale:0.98 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ duration:0.18 }}
              >
                <PlanetaryTransitChart
                  positions={data.positions}
                  upagrahas={data.upagrahas || []}
                  showUpagrahas={showUpagrahas}
                  date={data.date || date}
                  lang={lang}
                  style={chartStyle}
                />
              </motion.div>
            </section>

            <section className="card-royal p-4" aria-label={t(lang, 'Planetary Positions', 'ग्रह स्थिति')}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8 }}>
                <p style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700 }}>
                  ☷ {t(lang, 'Planetary Positions', 'ग्रह स्थिति')}
                </p>
                <span style={{ color:MUTED, fontSize:9 }}>{data.positions.length} {t(lang, 'Planet', 'ग्रह')}</span>
              </div>

              <div style={{ overflowX:'auto' }}>
                <div style={{ minWidth:440 }}>
                  {/* header row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1.3fr 1fr 1.6fr', gap:8, padding:'6px 10px', borderBottom:'1px solid rgba(212,175,55,0.2)' }}>
                    {[['Planet','ग्रह'],['Sign','राशि'],['Degree','अंश'],['Nakshatra','नक्षत्र']].map((h, i) => (
                      <span key={i} style={{ fontSize:9, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang, h[0], h[1])}</span>
                    ))}
                  </div>
                  {data.positions.map((p) => {
                    const meta = PLANET_META[p.planet] || {};
                    return (
                      <div key={p.planet} style={{ display:'grid', gridTemplateColumns:'1.4fr 1.3fr 1fr 1.6fr', gap:8, padding:'10px', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems:'center' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:600, color:'#F5F0E8' }}>
                          <span style={{ color: meta.color, fontSize:15 }}>{meta.icon}</span>
                          {planetName(p.planet, lang)}
                          {p.is_retrograde && <span style={{ fontSize:10, color:'#F59E0B', fontWeight:700 }} title={t(lang,'Retrograde','वक्री')}>℞</span>}
                        </span>
                        <span style={{ fontSize:12.5, color: meta.color }}>{t(lang, p.rashi_en, p.rashi_hi)}</span>
                        <span style={{ fontSize:11.5, color:MUTED, fontVariantNumeric:'tabular-nums' }}>{p.degree_dms}</span>
                        <span style={{ fontSize:11.5, color:'rgba(245,240,232,0.75)' }}>
                          {t(lang, p.nakshatra_en, p.nakshatra_hi)} <span style={{ color:MUTED }}>· {t(lang,'Pada','पद')} {p.pada}</span>
                        </span>

                        {/* Reading — only present when the API returned detail=1 */}
                        {p.effect && (
                          <div style={{ gridColumn:'1 / -1', paddingTop:8, marginTop:2 }}>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:6 }}>
                              {p.dignity_label && (
                                <span style={{
                                  fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:10,
                                  color: TONE_COLOR[p.dignity_tone] || MUTED,
                                  background:'rgba(255,255,255,0.04)',
                                  border:`1px solid ${TONE_COLOR[p.dignity_tone] || MUTED}44`,
                                }}>
                                  {t(lang, p.dignity_label.en, p.dignity_label.hi)}
                                </span>
                              )}
                              {p.is_combust && (
                                <span style={{ fontSize:10, color:'#F59E0B' }}>{t(lang,'Combust','अस्त')}</span>
                              )}
                              {p.transit_window?.leaves_on && (
                                <span style={{ fontSize:10, color:MUTED }}>
                                  {t(lang,'in this sign until','इस राशि में')} {p.transit_window.leaves_on}
                                  {p.transit_window.days_remaining != null && (
                                    <> · {p.transit_window.days_remaining} {
                                      lang === 'hi'
                                        ? 'दिन शेष'
                                        : (p.transit_window.days_remaining === 1 ? 'day left' : 'days left')
                                    }</>
                                  )}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize:12, color:'rgba(245,240,232,0.72)', lineHeight:1.75, margin:0 }}>
                              {t(lang, p.effect.en, p.effect.hi)}
                            </p>
                            {p.retrograde_note && (
                              <p style={{ fontSize:11.5, color:'rgba(249,115,22,0.8)', lineHeight:1.7, margin:'6px 0 0' }}>
                                ℞ {t(lang, p.retrograde_note.en, p.retrograde_note.hi)}
                              </p>
                            )}
                            {p.combust_note && (
                              <p style={{ fontSize:11.5, color:'rgba(245,158,11,0.8)', lineHeight:1.7, margin:'6px 0 0' }}>
                                {t(lang, p.combust_note.en, p.combust_note.hi)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {data.ayanamsa != null && (
                <p style={{ fontSize:10, color:MUTED, textAlign:'right', marginTop:10 }}>
                  {t(lang,'Lahiri Ayanamsa','लाहिरी अयनांश')}: {data.ayanamsa}° · {t(lang,'computed at 12:00 IST','12:00 IST पर गणना')}
                </p>
              )}
            </section>

            {/* ── Upagrahas (sub-planets) ─────────────────────────────────── */}
            {data.upagrahas?.length > 0 && (
              <section className="card-royal p-4 mt-4" aria-label={t(lang,'Upagrahas','उपग्रह')}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:6, flexWrap:'wrap' }}>
                  <h2 style={{ fontSize:15, fontWeight:700, color:GOLD }}>
                    {t(lang,'Upagrahas — the shadow points','उपग्रह — छाया बिंदु')}
                  </h2>
                  <button
                    onClick={() => setShowUpagrahas((v) => !v)}
                    style={{
                      fontSize:11, padding:'4px 11px', borderRadius:7, cursor:'pointer',
                      background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', color:GOLD,
                    }}
                  >
                    {showUpagrahas
                      ? t(lang,'Hide from chart','चार्ट से हटाएँ')
                      : t(lang,'Show in chart','चार्ट में दिखाएँ')}
                  </button>
                </div>
                <p style={{ fontSize:11.5, color:MUTED, lineHeight:1.75, marginBottom:12 }}>
                  {t(lang,
                    'These five are not planets. They are sensitive points calculated from the Sun\'s position, and classical texts read them for the subtler texture of a period — where clarity clouds, where recognition comes, where things break suddenly.',
                    'ये पाँच ग्रह नहीं हैं। ये सूर्य की स्थिति से गणना किए गए संवेदनशील बिंदु हैं, और शास्त्र इन्हें समय की सूक्ष्म बनावट के लिए देखते हैं — कहाँ स्पष्टता धुँधली होती है, कहाँ मान्यता मिलती है, कहाँ अचानक टूटन आती है।')}
                </p>

                <div style={{ display:'grid', gap:9 }}>
                  {data.upagrahas.map((u) => {
                    const col = u.is_benefic ? '#22C55E' : u.is_malefic ? '#F59E0B' : MUTED;
                    return (
                      <div key={u.slug} style={{ border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 12px', background:'rgba(255,255,255,0.02)' }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:5 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#F5F0E8' }}>
                            {t(lang, u.name_en, u.name_hi)}
                          </span>
                          <span style={{ fontSize:11.5, color:GOLD }}>
                            {t(lang, u.rashi_en, u.rashi_hi)} {u.degree_dms}
                          </span>
                          <span style={{ fontSize:10.5, color:MUTED }}>
                            {t(lang, u.nakshatra_en, u.nakshatra_hi)} · {t(lang,'Pada','पद')} {u.pada}
                          </span>
                          <span style={{
                            fontSize:9.5, fontWeight:700, padding:'2px 8px', borderRadius:9,
                            color:col, background:'rgba(255,255,255,0.04)', border:`1px solid ${col}44`,
                          }}>
                            {u.is_benefic ? t(lang,'Benefic','शुभ') : u.is_malefic ? t(lang,'Malefic','अशुभ') : t(lang,'Mixed','मिश्रित')}
                          </span>
                        </div>
                        {u.nature && (
                          <p style={{ fontSize:12, color:'rgba(245,240,232,0.72)', lineHeight:1.7, margin:0 }}>
                            {t(lang, u.nature.en, u.nature.hi)}
                          </p>
                        )}
                        {u.key_indication && (
                          <p style={{ fontSize:11.5, color:MUTED, lineHeight:1.7, margin:'5px 0 0' }}>
                            {t(lang, u.key_indication.en, u.key_indication.hi)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p style={{ fontSize:11, color:MUTED, lineHeight:1.7, marginTop:11, paddingTop:9, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  {t(lang,
                    'An upagraha matters most when it falls on a planet or an important house in a birth chart — which house that is differs for every reader.',
                    'उपग्रह का महत्व तब सबसे अधिक होता है जब वह किसी जन्म-कुंडली में किसी ग्रह या महत्वपूर्ण भाव पर पड़े — और वह भाव हर व्यक्ति के लिए अलग होता है।')}
                </p>
              </section>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <div className="card-royal p-5 mt-6" style={{ border:'1px solid rgba(245,158,11,0.3)' }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#F59E0B', marginBottom:6 }}>
            {t(lang, 'How do these transits affect YOU?', 'ये गोचर आपको कैसे प्रभावित करते हैं?')}
          </p>
          <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginBottom:12 }}>
            {t(lang,
              'These are the sky\'s positions for everyone. Their effect depends on your birth chart — see your personal transit reading from your kundli.',
              'ये सभी के लिए आकाश की स्थिति है। इनका प्रभाव आपकी जन्म कुंडली पर निर्भर करता है — अपनी कुंडली से व्यक्तिगत गोचर फल देखें।')}
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link href="/free-kundli" className="btn-gold" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none' }}>
              {t(lang, '🔯 Free Kundli', '🔯 निःशुल्क कुंडली')}
            </Link>
            <Link href="/horoscope" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none', border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600 }}>
              {t(lang, "Today's Horoscope", 'आज का राशिफल')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtn = {
  width:36, height:34, borderRadius:8, cursor:'pointer', fontSize:14,
  border:'1px solid rgba(212,175,55,0.3)', background:'rgba(212,175,55,0.08)', color:GOLD,
};
