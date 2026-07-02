'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import PeriodTabs from '../components/horoscope/PeriodTabs';
import PushOptIn from '../components/PushOptIn';

const GOLD  = '#D4AF37';
const AMBER = '#F59E0B';
const GREEN = '#22C55E';
const RED   = '#EF4444';
const MUTED = 'rgba(245,240,232,0.55)';

import { t } from '../lib/astroI18n';
const SCORE_COLOR = { 1:'#EF4444', 2:'#F97316', 3:'#F59E0B', 4:'#22C55E', 5:'#10B981' };
const PLANET_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' };
const TONE_META = {
  favorable:   { en:'Favorable',   hi:'अनुकूल',      color:GREEN },
  moderate:    { en:'Moderate',    hi:'मध्यम',        color:AMBER },
  challenging: { en:'Challenging', hi:'चुनौतीपूर्ण', color:RED   },
};

function Stars({ score }) {
  return (
    <span style={{ letterSpacing:2 }}>
      {[1,2,3,4,5].map((n) => (
        <span key={n} style={{ color: n <= score ? SCORE_COLOR[score] : 'rgba(255,255,255,0.12)', fontSize:14 }}>★</span>
      ))}
    </span>
  );
}

function Section({ icon, title, text }) {
  if (!text) return null;
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px' }}>
      <p style={{ fontSize:10, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{icon} {title}</p>
      <p style={{ fontSize:12, color:'rgba(245,240,232,0.8)', lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>{text}</p>
    </div>
  );
}

// period: 'weekly' | 'monthly' | 'yearly'
export default function PeriodHoroscope({ period }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selectedNum, setSelectedNum] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/horoscope/${period}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const selected = data?.rashis?.find((r) => r.rashi_num === selectedNum) || null;

  const heading = period === 'weekly'
    ? t(lang, 'Weekly Horoscope', 'साप्ताहिक राशिफल')
    : period === 'monthly'
      ? t(lang, 'Monthly Horoscope', 'मासिक राशिफल')
      : t(lang, `Yearly Horoscope ${data?.year || ''}`, `वार्षिक राशिफल ${data?.year || ''}`);

  const subtitle = period === 'weekly' && data
    ? `${data.week_start} → ${data.week_end}`
    : period === 'monthly' && data
      ? `${data.month_start} → ${data.month_end}`
      : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>☽</div>
          <p style={{ color:GOLD, fontSize:14 }}>{t(lang, 'Consulting the planets…', 'ग्रहों से परामर्श हो रहा है…')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={60} />
      <div className="relative z-10 max-w-5xl mx-auto">

        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:16 }}>
          <p style={{ color:'rgba(212,175,55,0.5)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.35em', marginBottom:6 }}>
            {t(lang, 'Rashi Phal', 'राशि फल')}
          </p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#F1F5F9', marginBottom:4 }}>{heading}</h1>
          {subtitle && <p style={{ color:MUTED, fontSize:13 }}>{subtitle}</p>}
        </motion.div>

        <PushOptIn />
        <PeriodTabs />

        {!data ? (
          <p style={{ color:MUTED, fontSize:13 }}>{t(lang, 'Unable to load horoscope.', 'राशिफल लोड नहीं हो सका।')}</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'minmax(220px, 300px) 1fr', gap:20, alignItems:'start' }} className="max-md:!grid-cols-1">

            {/* Rashi selector */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
              {data.rashis.map((r) => {
                const active = r.rashi_num === selectedNum;
                return (
                  <button key={r.rashi_num} onClick={() => setSelectedNum(r.rashi_num)} style={{
                    background: active ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${active ? GOLD : 'rgba(255,255,255,0.08)'}`,
                    borderRadius:10, padding:'10px 4px', cursor:'pointer', textAlign:'center',
                  }}>
                    <div style={{ fontSize:18 }}>{r.symbol}</div>
                    <div style={{ fontSize:10, fontWeight:600, color: active ? GOLD : '#CBD5E1', margin:'3px 0' }}>
                      {t(lang, r.rashi_en, r.rashi_hi)}
                    </div>
                    <div style={{ display:'flex', justifyContent:'center', gap:1 }}>
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} style={{ fontSize:7, color: n <= r.score ? SCORE_COLOR[r.score] : 'rgba(255,255,255,0.1)' }}>★</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail */}
            {selected && (
              <motion.div key={`${period}-${selectedNum}`} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                className="card-royal p-5" style={{ display:'flex', flexDirection:'column', gap:14 }}>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <p style={{ fontSize:18, fontWeight:800, color:GOLD }}>
                    {selected.symbol} {t(lang, selected.rashi_en, selected.rashi_hi)}
                  </p>
                  <Stars score={selected.score} />
                </div>

                {/* Overview */}
                <p style={{ fontSize:13, color:'rgba(245,240,232,0.85)', lineHeight:1.8, fontFamily:'var(--font-devanagari),sans-serif' }}>
                  {hi ? selected.overview?.hi : selected.overview?.en}
                </p>

                {selected.sade_sati?.active && (
                  <p style={{ fontSize:11, color:AMBER, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:8, padding:'8px 12px' }}>
                    🪐 {t(lang, `Sade Sati ${selected.sade_sati.phase} phase is running`, `साढ़े साती (${selected.sade_sati.phase === 'peak' ? 'चरम' : selected.sade_sati.phase === 'rising' ? 'आरोही' : 'अवरोही'}) चल रही है`)}
                  </p>
                )}

                {/* Weekly: day scores + best/caution days */}
                {period === 'weekly' && selected.day_scores && (
                  <div>
                    <p style={{ fontSize:10, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                      📅 {t(lang, 'Day by Day', 'दिन-प्रतिदिन')}
                    </p>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {selected.day_scores.map((d) => (
                        <div key={d.date} style={{
                          flex:'1 0 60px', textAlign:'center', padding:'7px 4px',
                          background:'rgba(255,255,255,0.04)', borderRadius:8,
                          border:`1px solid ${d.score >= 4 ? 'rgba(34,197,94,0.35)' : d.score <= 2 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                          <p style={{ fontSize:9, color:MUTED }}>{(hi ? d.weekday_hi : d.weekday_en).slice(0, 3)}</p>
                          <p style={{ fontSize:11, color:SCORE_COLOR[d.score], fontWeight:700 }}>{'★'.repeat(d.score)}</p>
                        </div>
                      ))}
                    </div>
                    {selected.best_days?.length > 0 && (
                      <p style={{ fontSize:11, color:GREEN, marginTop:8 }}>
                        ✓ {t(lang, 'Best days', 'श्रेष्ठ दिन')}: {selected.best_days.map((d) => (hi ? d.weekday_hi : d.weekday_en)).join(', ')}
                      </p>
                    )}
                    {selected.caution_days?.length > 0 && (
                      <p style={{ fontSize:11, color:RED, marginTop:3 }}>
                        ⚠ {t(lang, 'Caution days', 'सावधानी के दिन')}: {selected.caution_days.map((d) => (hi ? d.weekday_hi : d.weekday_en)).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Monthly: lucky/caution dates + key transits */}
                {period === 'monthly' && (
                  <div>
                    {selected.lucky_dates?.length > 0 && (
                      <p style={{ fontSize:12, color:GREEN, marginBottom:4 }}>
                        ✓ {t(lang, 'Lucky dates', 'शुभ तिथियां')}: <b>{selected.lucky_dates.join(', ')}</b>
                      </p>
                    )}
                    {selected.caution_dates?.length > 0 && (
                      <p style={{ fontSize:12, color:RED, marginBottom:10 }}>
                        ⚠ {t(lang, 'Caution dates', 'सावधानी तिथियां')}: <b>{selected.caution_dates.join(', ')}</b>
                      </p>
                    )}
                    {data.key_transits?.length > 0 && (
                      <div>
                        <p style={{ fontSize:10, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', margin:'6px 0' }}>
                          🔭 {t(lang, "This Month's Key Transits", 'इस माह के प्रमुख गोचर')}
                        </p>
                        {data.key_transits.map((k, i) => (
                          <p key={i} style={{ fontSize:11, color:MUTED, lineHeight:1.8 }}>
                            {k.date}: <b style={{ color:'#F5F0E8' }}>{hi ? (PLANET_HI[k.planet] || k.planet) : k.planet}</b> {t(lang, 'enters', 'प्रवेश')} {hi ? k.to_hi : k.to_en}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Yearly: Jupiter/Saturn phases + quarters */}
                {period === 'yearly' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {selected.quarters?.map((q) => {
                        const tone = TONE_META[q.tone] || TONE_META.moderate;
                        return (
                          <span key={q.quarter} style={{
                            fontSize:10, fontWeight:700, color:tone.color,
                            border:`1px solid ${tone.color}44`, background:`${tone.color}11`,
                            borderRadius:14, padding:'4px 10px',
                          }}>
                            Q{q.quarter}: {t(lang, tone.en, tone.hi)}
                          </span>
                        );
                      })}
                    </div>
                    <div>
                      <p style={{ fontSize:10, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                        ♃ {t(lang, 'Jupiter Through the Year', 'वर्ष भर गुरु')}
                      </p>
                      {selected.jupiter_phases?.map((p, i) => (
                        <div key={i} style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:8, padding:'8px 12px', marginBottom:6 }}>
                          <p style={{ fontSize:10, color:AMBER, fontWeight:700 }}>
                            {p.from} → {p.to} · {hi ? p.sign_hi : p.sign_en} ({t(lang, 'House', 'भाव')} {p.house})
                          </p>
                          <p style={{ fontSize:11, color:MUTED, lineHeight:1.6, marginTop:3, fontFamily:'var(--font-devanagari),sans-serif' }}>
                            {hi ? p.text_hi : p.text_en}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p style={{ fontSize:10, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                        ♄ {t(lang, 'Saturn Through the Year', 'वर्ष भर शनि')}
                      </p>
                      {selected.saturn_phases?.map((p, i) => (
                        <div key={i} style={{ background:'rgba(129,140,248,0.05)', border:'1px solid rgba(129,140,248,0.18)', borderRadius:8, padding:'8px 12px', marginBottom:6 }}>
                          <p style={{ fontSize:10, color:'#818CF8', fontWeight:700 }}>
                            {p.from} → {p.to} · {hi ? p.sign_hi : p.sign_en} ({t(lang, 'House', 'भाव')} {p.house})
                            {p.sade_sati && <span style={{ color:AMBER, marginLeft:8 }}>· {t(lang, `Sade Sati (${p.sade_sati})`, 'साढ़े साती')}</span>}
                          </p>
                          <p style={{ fontSize:11, color:MUTED, lineHeight:1.6, marginTop:3, fontFamily:'var(--font-devanagari),sans-serif' }}>
                            {hi ? p.text_hi : p.text_en}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Life-area sections */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }} className="max-sm:!grid-cols-1">
                  <Section icon="💼" title={t(lang, 'Career', 'करियर')}  text={hi ? selected.career?.hi  : selected.career?.en} />
                  <Section icon="❤️" title={t(lang, 'Love', 'प्रेम')}     text={hi ? selected.love?.hi    : selected.love?.en} />
                  <Section icon="💰" title={t(lang, 'Finance', 'धन')}     text={hi ? selected.finance?.hi : selected.finance?.en} />
                  <Section icon="🌿" title={t(lang, 'Health', 'स्वास्थ्य')} text={hi ? selected.health?.hi  : selected.health?.en} />
                </div>

                {/* Lucky */}
                {selected.lucky && (
                  <p style={{ fontSize:11, color:MUTED }}>
                    🍀 {t(lang, 'Lucky', 'शुभ')}: {selected.lucky.numbers?.join(', ')} · {selected.lucky.colors?.join(', ')} · {selected.lucky.gemstone} · {selected.lucky.day}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
