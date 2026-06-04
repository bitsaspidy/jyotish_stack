'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const t = (lang, en, hi) => (lang === 'hi' ? hi : en);

const PLANET_ICON = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
const PLANET_COLOR = { Sun:'#FBBF24', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#10B981', Jupiter:'#F97316', Venus:'#F472B6', Saturn:'#818CF8', Rahu:'#A78BFA', Ketu:'#6B7280' };
const PLANET_NAME_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' };

const SCORE_COLOR = { 1:'#EF4444', 2:'#F97316', 3:'#F59E0B', 4:'#22C55E', 5:'#10B981' };
const SCORE_LABEL = { 1:'Difficult', 2:'Challenging', 3:'Moderate', 4:'Favorable', 5:'Excellent' };
const SCORE_LABEL_HI = { 1:'कठिन', 2:'चुनौतीपूर्ण', 3:'सामान्य', 4:'अनुकूल', 5:'उत्कृष्ट' };

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ score }) {
  return (
    <span style={{ letterSpacing:2 }}>
      {[1,2,3,4,5].map((n) => (
        <span key={n} style={{ color: n <= score ? SCORE_COLOR[score] : 'rgba(255,255,255,0.12)', fontSize:14 }}>★</span>
      ))}
    </span>
  );
}

// ─── Transit Strip ────────────────────────────────────────────────────────────
function TransitStrip({ summary, lang }) {
  if (!summary) return null;
  const planets = Object.entries(summary);
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', padding:'12px 0' }}>
      {planets.map(([name, data]) => (
        <div key={name} style={{
          display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:20, flexShrink:0,
        }}>
          <span style={{ fontSize:13, color: PLANET_COLOR[name] || '#D4AF37' }}>{PLANET_ICON[name]}</span>
          <span style={{ fontSize:10, color:'#CBD5E1' }}>
            {lang==='hi' ? PLANET_NAME_HI[name] : name}
          </span>
          <span style={{ fontSize:10, color:'#94A3B8' }}>
            {lang==='hi' ? data.rashi_hi : data.rashi_en}
          </span>
          {data.is_retrograde && <span style={{ fontSize:9, color:'#F59E0B' }}>℞</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Rashi Selector Grid ──────────────────────────────────────────────────────
function RashiGrid({ rashis, selected, onSelect, lang }) {
  if (!rashis) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
      {rashis.map((r) => {
        const isSelected = selected?.rashi_num === r.rashi_num;
        const scoreColor = SCORE_COLOR[r.score] || '#D4AF37';
        return (
          <button key={r.rashi_num} onClick={() => onSelect(r)} style={{
            background: isSelected ? `rgba(${hexToRgb(r.color)}, 0.15)` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isSelected ? r.color : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding:'10px 6px', cursor:'pointer',
            textAlign:'center', transition:'all 0.2s',
          }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{r.symbol}</div>
            <div style={{ fontSize:11, fontWeight:600, color: isSelected ? r.color : '#CBD5E1', marginBottom:3 }}>
              {t(lang, r.rashi_en, r.rashi_hi)}
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:1 }}>
              {[1,2,3,4,5].map((n) => (
                <span key={n} style={{ fontSize:8, color: n <= r.score ? scoreColor : 'rgba(255,255,255,0.1)' }}>★</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ─── Rashi Detail Card ────────────────────────────────────────────────────────
function RashiDetail({ rashi, lang }) {
  const [tab, setTab] = useState('overview');
  if (!rashi) return null;
  const scoreColor = SCORE_COLOR[rashi.score];
  const scoreLabel = lang==='hi' ? SCORE_LABEL_HI[rashi.score] : SCORE_LABEL[rashi.score];

  const TABS = [
    { key:'overview', en:'Overview', hi:'सारांश' },
    { key:'career',   en:'Career',   hi:'करियर' },
    { key:'love',     en:'Love',     hi:'प्रेम'  },
    { key:'health',   en:'Health',   hi:'स्वास्थ्य' },
    { key:'finance',  en:'Finance',  hi:'धन'    },
  ];

  return (
    <motion.div key={rashi.rashi_num} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      style={{
        background:'rgba(17,20,40,0.8)', border:`1px solid ${rashi.color}33`,
        borderRadius:16, overflow:'hidden',
      }}>
      {/* Header */}
      <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:`rgba(${hexToRgb(rashi.color)},0.06)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:36 }}>{rashi.symbol}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <h2 style={{ fontSize:20, fontWeight:700, color: rashi.color, fontFamily:'Georgia,serif', margin:0 }}>
                {t(lang, rashi.rashi_en, rashi.rashi_hi)}
              </h2>
              <span style={{
                fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
                padding:'3px 10px', borderRadius:20, border:`1px solid ${scoreColor}44`,
                background:`${scoreColor}18`, color: scoreColor,
              }}>{scoreLabel}</span>
              {rashi.sade_sati?.active && (
                <span style={{ fontSize:10, color:'#F59E0B', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', padding:'2px 8px', borderRadius:12 }}>
                  ⚠ {t(lang,`Sade Sati (${rashi.sade_sati.phase})`,'साढ़ेसाती')}
                </span>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:5 }}>
              <StarRating score={rashi.score} />
              <span style={{ fontSize:11, color:'#64748B' }}>
                {t(lang, rashi.title_en, rashi.title_hi)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 24px' }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding:'10px 14px', background:'none', border:'none', cursor:'pointer',
            fontSize:11, fontWeight:600, transition:'all 0.15s',
            color: tab===tb.key ? rashi.color : '#64748B',
            borderBottom: tab===tb.key ? `2px solid ${rashi.color}` : '2px solid transparent',
            marginBottom:-1,
          }}>
            {t(lang, tb.en, tb.hi)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding:'20px 24px' }}>
        {tab === 'overview' && (
          <div>
            <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, marginBottom:16 }}>
              {t(lang, rashi.description_en, rashi.description_hi)}
            </p>

            {/* Advice + Caution */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div style={{ padding:'12px 14px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#22C55E', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                  ✓ {t(lang,'Today\'s Guidance','आज का मार्गदर्शन')}
                </div>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, margin:0 }}>{t(lang, rashi.advice.en, rashi.advice.hi)}</p>
              </div>
              <div style={{ padding:'12px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                  ⚠ {t(lang,'Caution','सावधानी')}
                </div>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, margin:0 }}>{t(lang, rashi.caution.en, rashi.caution.hi)}</p>
              </div>
            </div>

            {/* Lucky */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {[
                { label: t(lang,'Lucky Numbers','शुभ अंक'), value: rashi.lucky.numbers.join(', ') },
                { label: t(lang,'Lucky Colors','शुभ रंग'),  value: rashi.lucky.colors.join(', ')  },
                { label: t(lang,'Gemstone','रत्न'),         value: rashi.lucky.gemstone             },
                { label: t(lang,'Best Day','शुभ दिन'),      value: rashi.lucky.day                  },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding:'8px 12px', background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:8 }}>
                  <div style={{ fontSize:9, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:12, color:'#F1F5F9', fontWeight:600 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Planet positions for this rashi */}
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
                {t(lang,'Today\'s Planets from Your Sign','आपकी राशि से आज के ग्रह')}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {Object.entries(rashi.planet_positions).map(([key, house]) => {
                  const pname = key.replace('_house','');
                  const pCap = pname.charAt(0).toUpperCase() + pname.slice(1);
                  const color = PLANET_COLOR[pCap] || '#94A3B8';
                  const icon  = PLANET_ICON[pCap]  || '●';
                  return (
                    <span key={key} style={{ fontSize:10, padding:'3px 8px', background:`${color}18`, border:`1px solid ${color}33`, borderRadius:12, color }}>
                      {icon} {lang==='hi' ? (PLANET_NAME_HI[pCap]||pCap) : pCap} — H{house}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'career' && (
          <div>
            <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:'0 0 12px' }}>
              {t(lang, rashi.career.en, rashi.career.hi)}
            </p>
          </div>
        )}
        {tab === 'love' && (
          <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
            {t(lang, rashi.love.en, rashi.love.hi)}
          </p>
        )}
        {tab === 'health' && (
          <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
            {t(lang, rashi.health.en, rashi.health.hi)}
          </p>
        )}
        {tab === 'finance' && (
          <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
            {t(lang, rashi.finance.en, rashi.finance.hi)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DailyHoroscope() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [userRashi, setUserRashi] = useState(null);

  // Load today's horoscope
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/horoscope/daily');
        setData(res.data);
        // Default: select user's Moon rashi if available
        setSelected(res.data.rashis?.[0] || null);
      } catch (e) {
        console.error('Horoscope load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // If logged in, load user's primary kundli to find their Moon rashi
  useEffect(() => {
    if (!user || !data) return;
    const loadKundli = async () => {
      try {
        const listRes = await api.get('/kundli');
        const profiles = listRes.data.profiles || [];
        if (!profiles.length) return;
        const first = profiles[0];
        const detailRes = await api.get(`/kundli/${first.uuid}`);
        const chart = detailRes.data.profile?.calculated_data;
        if (typeof chart === 'string') {
          try {
            const parsed = JSON.parse(chart);
            const moonRashiNum = parsed?.planets?.Moon?.rashi_num;
            if (moonRashiNum) {
              setUserRashi(moonRashiNum);
              const match = data.rashis?.find((r) => r.rashi_num === moonRashiNum);
              if (match) setSelected(match);
            }
          } catch {}
        } else if (chart?.planets?.Moon?.rashi_num) {
          const moonRashiNum = chart.planets.Moon.rashi_num;
          setUserRashi(moonRashiNum);
          const match = data.rashis?.find((r) => r.rashi_num === moonRashiNum);
          if (match) setSelected(match);
        }
      } catch {}
    };
    loadKundli();
  }, [user, data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>☽</div>
          <p style={{ color:'#D4AF37', fontSize:14 }}>{t(lang,'Loading today\'s cosmic reading…','आज की ब्रह्मांडीय रीडिंग लोड हो रही है…')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={60} />
      <div className="relative z-10 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
          <p style={{ color:'rgba(212,175,55,0.5)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.35em', marginBottom:6 }}>
            {t(lang,'Rashi Phal','राशि फल')}
          </p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#F1F5F9', marginBottom:4 }}>
            {t(lang,'Daily Horoscope','दैनिक राशिफल')}
          </h1>
          <p style={{ color:'rgba(245,240,232,0.45)', fontSize:13 }}>
            {data?.date ? fmtDate(data.date) : ''}
            {userRashi && data && (
              <span style={{ marginLeft:12, color:'#D4AF37' }}>
                {t(lang,'·  Your Moon sign is highlighted','·  आपकी चंद्र राशि हाइलाइट है')}
              </span>
            )}
          </p>
        </motion.div>

        {/* ── Today's Moon ── */}
        {data?.moon_sign && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.05 }}
            style={{ marginBottom:20, padding:'14px 20px', background:'rgba(148,163,184,0.08)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:12, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:28 }}>☽</span>
            <div>
              <div style={{ fontSize:10, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:2 }}>
                {t(lang,'Moon in','चंद्र राशि में')}
              </div>
              <div style={{ fontSize:16, color:'#F1F5F9', fontWeight:700 }}>
                {t(lang, data.moon_sign.rashi_en, data.moon_sign.rashi_hi)}
                <span style={{ fontSize:12, color:'#64748B', fontWeight:400, marginLeft:8 }}>
                  {data.moon_sign.degree}°
                </span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <TransitStrip summary={data.transit_summary} lang={lang} />
            </div>
          </motion.div>
        )}

        {/* ── Main Grid: Selector + Detail ── */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(260px,1fr) 2fr', gap:20, alignItems:'start' }}>

          {/* Rashi Selector */}
          <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
            <div style={{ padding:'16px', background:'rgba(17,20,40,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, marginBottom:14 }}>
              <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>
                {t(lang,'Select Your Rashi','अपनी राशि चुनें')}
              </p>
              <RashiGrid rashis={data?.rashis} selected={selected} onSelect={setSelected} lang={lang} />
            </div>

            {/* Scores legend */}
            <div style={{ padding:'12px 14px', background:'rgba(17,20,40,0.5)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
              <p style={{ fontSize:10, color:'#64748B', marginBottom:8 }}>{t(lang,'Day Rating Guide','दिन रेटिंग गाइड')}</p>
              {[5,4,3,2,1].map((s) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <StarRating score={s} />
                  <span style={{ fontSize:11, color: SCORE_COLOR[s] }}>
                    {t(lang, SCORE_LABEL[s], SCORE_LABEL_HI[s])}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Detail */}
          <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.12 }}>
            {selected
              ? <RashiDetail rashi={selected} lang={lang} />
              : (
                <div style={{ padding:40, textAlign:'center', color:'#64748B' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>☽</div>
                  <p>{t(lang,'Select a rashi to read your daily horoscope','अपनी राशि चुनें')}</p>
                </div>
              )
            }
          </motion.div>
        </div>

        {/* ── All Rashis Summary Strip ── */}
        {data?.rashis && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            style={{ marginTop:24, padding:'16px 20px', background:'rgba(17,20,40,0.6)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
            <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>
              {t(lang,'All Rashis — Today at a Glance','सभी राशियां — आज एक नज़र में')}
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {data.rashis.map((r) => {
                const sc = SCORE_COLOR[r.score];
                const isMe = userRashi === r.rashi_num;
                return (
                  <button key={r.rashi_num} onClick={() => { setSelected(r); window.scrollTo({ top:0, behavior:'smooth' }); }} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                    background: isMe ? `rgba(${hexToRgb(r.color)},0.15)` : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${isMe ? r.color : sc + '44'}`,
                    borderRadius:20, cursor:'pointer', transition:'all 0.15s',
                  }}>
                    <span style={{ fontSize:14 }}>{r.symbol}</span>
                    <span style={{ fontSize:11, color:'#CBD5E1' }}>{t(lang, r.rashi_en, r.rashi_hi)}</span>
                    <span style={{ fontSize:10, color: sc }}>{'★'.repeat(r.score)}</span>
                    {isMe && <span style={{ fontSize:9, color: r.color }}>●</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
