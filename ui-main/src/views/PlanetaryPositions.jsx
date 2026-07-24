'use client';
import { useEffect, useRef, useState } from 'react';
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
  // Outer planets + the ascendant, for the full Drik-style table & detail cards.
  Uranus:  { icon:'⛢', color:'#7DD3FC' }, Neptune: { icon:'♆', color:'#60A5FA' },
  Pluto:   { icon:'♇', color:'#C4B5FD' }, Ascendant: { icon:'▲', color:'#D4AF37' },
};

const STATE_TONE = { asta:'#F59E0B', udita:'#22C55E', never:'rgba(245,240,232,0.55)' };

// Observer defaults + quick-pick cities for the location/time bar.
const DEFAULT_LOC = { lat:'28.6139', lon:'77.2090', tz:'5.5', time:'12:00', place:'New Delhi, India' };
const CITY_PRESETS = [
  { label:'New Delhi', place:'New Delhi, India', lat:'28.6139', lon:'77.2090', tz:'5.5' },
  { label:'Mumbai',    place:'Mumbai, India',    lat:'19.0760', lon:'72.8777', tz:'5.5' },
  { label:'Kolkata',   place:'Kolkata, India',   lat:'22.5726', lon:'88.3639', tz:'5.5' },
  { label:'Chennai',   place:'Chennai, India',   lat:'13.0827', lon:'80.2707', tz:'5.5' },
  { label:'Bengaluru', place:'Bengaluru, India', lat:'12.9716', lon:'77.5946', tz:'5.5' },
];

// 11 columns, Drik order. Fixed fr ratios inside a 940px min-width scroller.
const TABLE_COLS = '1.3fr 1.5fr 1.2fr 0.4fr 0.95fr 0.95fr 0.75fr 1.25fr 0.8fr 0.8fr 0.8fr';

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

  // Observer: place + local clock time the sky is read for. `loc` is what's been
  // applied (drives the fetch); `pending` is what the user is editing until they
  // press "Show positions". Defaults to New Delhi at 12:00.
  const [loc, setLoc]         = useState(DEFAULT_LOC);
  const [pending, setPending] = useState(DEFAULT_LOC);
  const [locQuery, setLocQuery]     = useState('');
  const [locResults, setLocResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [searchErr, setSearchErr]   = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setLocResults([]); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function handleLocationSearch() {
    if (!locQuery.trim()) return;
    setSearching(true); setLocResults([]); setSearchErr('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=6&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': hi ? 'hi' : 'en', 'Accept': 'application/json' } });
      const results = await res.json();
      if (!results.length) setSearchErr(t(lang, 'No results — try a different name.', 'कोई परिणाम नहीं — अलग नाम आज़माएं।'));
      setLocResults(results);
    } catch {
      setSearchErr(t(lang, 'Location search failed.', 'स्थान खोज विफल रही।'));
    } finally {
      setSearching(false);
    }
  }

  function selectLocResult(r) {
    const latN = parseFloat(r.lat), lonN = parseFloat(r.lon);
    // Rough tz from longitude, forced to IST inside the Indian bounding box —
    // the same heuristic the birth-chart forms use.
    let tz = Math.round((lonN / 15) * 2) / 2;
    if (latN >= 6 && latN <= 37 && lonN >= 68 && lonN <= 98) tz = 5.5;
    setPending((p) => ({ ...p, lat: latN.toFixed(4), lon: lonN.toFixed(4), tz: String(tz), place: r.display_name }));
    setLocQuery(r.display_name.split(',')[0]);
    setLocResults([]);
  }

  const applyPreset = (c) => setPending((p) => ({ ...p, lat: c.lat, lon: c.lon, tz: c.tz, place: c.place }));
  const submitObserver = () => { setLoc(pending); setLocResults([]); };

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
    // retrograde/combustion notes and the transit window. lat/lon/tz/time set the
    // observer (default New Delhi 12:00); time shifts every body, place the Lagna.
    const q = new URLSearchParams({
      date, detail: '1', lat: loc.lat, lon: loc.lon, tz: loc.tz, time: loc.time, place: loc.place,
    });
    api.get(`/panchang/planet-positions?${q.toString()}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [date, loc]);

  // Full table order, Drik-style: Lagna first, then the nine grahas, then the
  // outer planets. The chart above still uses data.positions (the nine) alone.
  const rows = data
    ? [
        ...(data.ascendant ? [data.ascendant] : []),
        ...data.positions,
        ...(data.outer_positions || []),
      ]
    : [];

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-12">

        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-6">
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            🌌 {t(lang, 'Planetary Positions', 'ग्रह स्थिति (गोचर)')}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:580, margin:'8px auto 0', lineHeight:1.7 }}>
            {t(lang,
              'Sidereal (Lahiri) positions for any place, day and time — sign, degree, nakshatra, sub-lord, latitude, speed, RA/declination and retrograde status, plus the ascendant.',
              'किसी भी स्थान, दिन एवं समय हेतु निरयन (लाहिरी) स्थिति — राशि, अंश, नक्षत्र, उप-स्वामी, शर, गति, विषुवांश/क्रांति एवं वक्री स्थिति, साथ में लग्न।')}
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
        <p style={{ textAlign:'center', color:MUTED, fontSize:12, marginBottom:14 }}>{fmtDate(date, lang)}</p>

        {/* Location & time — sets the observer (default New Delhi 12:00). */}
        <div className="card-royal p-4" style={{ maxWidth:640, margin:'0 auto 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ color:GOLD, fontSize:13, fontWeight:700 }}>📍 {t(lang, 'Location & Time', 'स्थान एवं समय')}</span>
            <span style={{ color:MUTED, fontSize:10 }}>{t(lang, '(for the ascendant & the moment read)', '(लग्न एवं क्षण हेतु)')}</span>
          </div>

          <div style={{ position:'relative' }} ref={searchRef}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <input
                className="input-royal"
                value={locQuery}
                onChange={(e) => setLocQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocationSearch(); } }}
                placeholder={t(lang, 'Search a city — e.g. Jaipur, India', 'शहर खोजें — जैसे जयपुर, भारत')}
                style={{ flex:'1 1 220px', fontSize:13, padding:'8px 12px', colorScheme:'dark' }}
              />
              <button onClick={handleLocationSearch} className="btn-gold" style={{ fontSize:12, padding:'0 16px', borderRadius:8, whiteSpace:'nowrap' }}>
                {searching ? '…' : t(lang, 'Search', 'खोजें')}
              </button>
              <input
                type="time"
                value={pending.time}
                onChange={(e) => setPending((p) => ({ ...p, time: e.target.value || '12:00' }))}
                className="input-royal"
                style={{ fontSize:13, padding:'8px 10px', width:'auto', colorScheme:'dark' }}
                aria-label={t(lang, 'Local time', 'स्थानीय समय')}
              />
            </div>

            {locResults.length > 0 && (
              <div style={{
                position:'absolute', top:'100%', left:0, right:0, zIndex:30,
                background:'#141838', border:'1px solid rgba(212,175,55,0.3)', borderRadius:10,
                marginTop:4, maxHeight:220, overflowY:'auto',
              }}>
                {locResults.map((r, i) => (
                  <button key={i} type="button" onClick={() => selectLocResult(r)} style={{
                    display:'block', width:'100%', textAlign:'left', padding:'9px 12px',
                    fontSize:11, color:'#F5F0E8', background:'transparent', border:'none',
                    borderBottom:'1px solid rgba(255,255,255,0.06)', cursor:'pointer',
                  }}>
                    📍 {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {searchErr && <p style={{ color:'#F59E0B', fontSize:11, marginTop:6 }}>{searchErr}</p>}

          {/* City quick-picks */}
          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
            {CITY_PRESETS.map((c) => {
              const active = pending.place === c.place;
              return (
                <button key={c.label} type="button" onClick={() => applyPreset(c)} style={{
                  fontSize:10.5, borderRadius:14, padding:'3px 11px', cursor:'pointer',
                  color: active ? '#0B0E23' : MUTED,
                  background: active ? GOLD : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`,
                  fontWeight: active ? 700 : 400,
                }}>
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Pending selection + submit */}
          <div style={{ display:'flex', gap:10, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', marginTop:12, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:11, color:'rgba(245,240,232,0.7)' }}>
              {pending.place.split(',')[0]} · {pending.time} · UTC{Number(pending.tz) >= 0 ? '+' : ''}{pending.tz}
              <span style={{ color:MUTED }}> · {pending.lat}, {pending.lon}</span>
            </span>
            <button
              onClick={submitObserver}
              className="btn-gold"
              style={{ fontSize:12, padding:'8px 20px', borderRadius:9, fontWeight:700 }}
            >
              {t(lang, 'Show positions', 'स्थिति दिखाएँ')}
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Calculating positions…', 'स्थिति गणना हो रही है…')}</p>
        ) : !data ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Unable to load positions.', 'स्थिति लोड नहीं हो सकी।')}</p>
        ) : (
          <motion.div
            key={`${date}|${loc.place}|${loc.time}`}
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            style={{ display:'flex', flexDirection:'column', gap:16 }}
          >
            <section className="card-royal p-4" style={{ width:'100%', maxWidth:460, margin:'0 auto' }} aria-label={t(lang, 'Chart', 'चार्ट')}>
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
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8, flexWrap:'wrap' }}>
                <p style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700 }}>
                  ☷ {t(lang, 'Planetary Positions', 'ग्रह स्थिति')}
                </p>
                <span style={{ color:MUTED, fontSize:9 }}>{rows.length} {t(lang, 'Bodies', 'पिंड')}</span>
              </div>

              {/* Wide Drik-style grid — scrolls horizontally on narrow screens. */}
              <div style={{ overflowX:'auto' }}>
                <div style={{ minWidth:940 }}>
                  <div style={{ display:'grid', gridTemplateColumns:TABLE_COLS, gap:8, padding:'6px 10px', borderBottom:'1px solid rgba(212,175,55,0.2)' }}>
                    {[['Planet','ग्रह'],['Longitude','देशांतर'],['Nakshatra','नक्षत्र'],['Pada','पद'],
                      ['Nak Lord','नक्षत्र स्वामी'],['Sub Lord','उप-स्वामी'],['Full°','पूर्ण अंश'],
                      ['Lat / Shara','शर'],['Speed','गति'],['R.A.','विषुवांश'],['Decl.','क्रांति']].map((h, i) => (
                      <span key={i} style={{ fontSize:8.5, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{t(lang, h[0], h[1])}</span>
                    ))}
                  </div>
                  {rows.map((p) => {
                    const meta = PLANET_META[p.planet] || {};
                    return (
                      <div key={p.planet} style={{ display:'grid', gridTemplateColumns:TABLE_COLS, gap:8, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems:'center', fontVariantNumeric:'tabular-nums' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:600, color:'#F5F0E8' }}>
                          <span style={{ color: meta.color, fontSize:14 }}>{meta.icon}</span>
                          {planetName(p.planet, lang)}
                          {p.is_retrograde && <span style={{ fontSize:9.5, color:'#F59E0B', fontWeight:700 }} title={t(lang,'Retrograde','वक्री')}>℞</span>}
                        </span>
                        <span style={{ fontSize:11.5, color: meta.color }}>{t(lang, p.rashi_en, p.rashi_hi)} <span style={{ color:MUTED }}>{p.degree_dms}</span></span>
                        <span style={{ fontSize:11, color:'rgba(245,240,232,0.75)' }}>{t(lang, p.nakshatra_en, p.nakshatra_hi)}</span>
                        <span style={{ fontSize:11, color:MUTED, textAlign:'center' }}>{p.pada}</span>
                        <span style={{ fontSize:11, color:'rgba(245,240,232,0.75)' }}>{planetName(p.nakshatra_lord, lang)}</span>
                        <span style={{ fontSize:11, color:'rgba(245,240,232,0.75)' }}>{planetName(p.nakshatra_sub_lord, lang)}</span>
                        <span style={{ fontSize:11, color:MUTED }}>{p.raw_longitude}</span>
                        <span style={{ fontSize:10.5, color:MUTED }}>{p.latitude_dms}</span>
                        <span style={{ fontSize:11, color: p.speed < 0 ? '#F59E0B' : MUTED }}>{p.speed > 0 ? '+' : ''}{p.speed}</span>
                        <span style={{ fontSize:11, color:MUTED }}>{p.right_ascension}</span>
                        <span style={{ fontSize:11, color:MUTED }}>{p.declination}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {data.ayanamsa != null && (
                <p style={{ fontSize:10, color:MUTED, textAlign:'right', marginTop:10 }}>
                  {t(lang,'Lahiri Ayanamsa','लाहिरी अयनांश')}: {data.ayanamsa}°
                  {data.observer && <> · {data.observer.time} · UTC{data.observer.tz >= 0 ? '+' : ''}{data.observer.tz}
                    {' · '}{t(lang, data.observer.place.en, data.observer.place.hi).split(',')[0]}</>}
                </p>
              )}
            </section>

            {/* ── Per-planet detail cards (Drik-style) ────────────────────── */}
            <section className="card-royal p-4" style={{ gridColumn:'1 / -1' }} aria-label={t(lang,'Planet Details','ग्रह विवरण')}>
              <p style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, marginBottom:12 }}>
                🔭 {t(lang, 'Each Body in Detail', 'प्रत्येक पिंड — विस्तार से')}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap:12 }}>
                {rows.map((p) => <DetailCard key={p.planet} p={p} lang={lang} />)}
              </div>
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

// One label/value pair inside a detail card.
function Field({ label, children }) {
  return (
    <div>
      <p style={{ fontSize:8.5, color:MUTED, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 2px' }}>{label}</p>
      <p style={{ fontSize:12, color:'rgba(245,240,232,0.85)', margin:0, fontVariantNumeric:'tabular-nums' }}>{children}</p>
    </div>
  );
}

// Full Drik-style detail card for any body (planet, node, outer planet, Lagna).
function DetailCard({ p, lang }) {
  const meta = PLANET_META[p.planet] || {};
  const stateTone = STATE_TONE[p.state?.key] || MUTED;
  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 13px', background:'rgba(255,255,255,0.02)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:10, marginBottom:10, paddingBottom:8, borderBottom:'1px solid rgba(212,175,55,0.14)' }}>
        <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:14, fontWeight:700, color:'#F5F0E8' }}>
          <span style={{ color: meta.color, fontSize:17 }}>{meta.icon}</span>
          {planetName(p.planet, lang)}
          {p.is_retrograde && <span style={{ fontSize:10, color:'#F59E0B', fontWeight:700 }} title={t(lang,'Retrograde','वक्री')}>℞</span>}
        </span>
        <span style={{ fontSize:12, color: meta.color, textAlign:'right' }}>{t(lang, p.rashi_en, p.rashi_hi)} {p.degree_dms}</span>
      </div>

      {/* Field grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px 12px' }}>
        <Field label={t(lang,'Full Degree','पूर्ण अंश')}>{p.raw_longitude}°</Field>
        <Field label={t(lang,'Nakshatra','नक्षत्र')}>{t(lang, p.nakshatra_en, p.nakshatra_hi)} · {t(lang,'Pada','पद')} {p.pada}</Field>
        <Field label={t(lang,'Nakshatra Lord','नक्षत्र स्वामी')}>{planetName(p.nakshatra_lord, lang)}</Field>
        <Field label={t(lang,'Sub Lord','उप-स्वामी')}>{planetName(p.nakshatra_sub_lord, lang)}</Field>
        <Field label={t(lang,'Latitude / Shara','अक्षांश / शर')}>{p.latitude_dms}</Field>
        <Field label={t(lang,'Speed (°/day)','गति (°/दिन)')}>
          <span style={{ color: p.speed < 0 ? '#F59E0B' : 'inherit' }}>{p.speed > 0 ? '+' : ''}{p.speed}</span>
        </Field>
        <Field label={t(lang,'Right Ascension','विषुवांश')}>{p.right_ascension}°</Field>
        <Field label={t(lang,'Declination','क्रांति')}>{p.declination}°</Field>
        <Field label={t(lang,'Motion','गति दिशा')}>
          {p.motion === 'retrograde' ? t(lang,'Retrograde ℞','वक्री ℞') : t(lang,'Forward','मार्गी')}
        </Field>
        <Field label={t(lang,'State','अवस्था')}>
          <span style={{ color: stateTone }}>{p.state ? t(lang, p.state.en, p.state.hi) : '—'}</span>
        </Field>
        {p.residing_in && (
          <Field label={t(lang,'Residing in','स्थित')}>{t(lang, p.residing_in.en, p.residing_in.hi)}</Field>
        )}
        {p.location && (
          <Field label={t(lang,'Reference','संदर्भ')}>{t(lang, p.location.en, p.location.hi)} · {p.computed_at}</Field>
        )}
      </div>

      {/* Reading — classical planets only (dignity, effect, transit window) */}
      {p.effect && (
        <div style={{ marginTop:10, paddingTop:9, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:6 }}>
            {p.dignity_label && (
              <span style={{
                fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:10,
                color: TONE_COLOR[p.dignity_tone] || MUTED,
                background:'rgba(255,255,255,0.04)', border:`1px solid ${TONE_COLOR[p.dignity_tone] || MUTED}44`,
              }}>
                {t(lang, p.dignity_label.en, p.dignity_label.hi)}
              </span>
            )}
            {p.transit_window?.leaves_on && (
              <span style={{ fontSize:10, color:MUTED }}>
                {t(lang,'in this sign until','इस राशि में')} {p.transit_window.leaves_on}
                {p.transit_window.days_remaining != null && (
                  <> · {p.transit_window.days_remaining} {
                    lang === 'hi' ? 'दिन शेष' : (p.transit_window.days_remaining === 1 ? 'day left' : 'days left')
                  }</>
                )}
              </span>
            )}
          </div>
          <p style={{ fontSize:12, color:'rgba(245,240,232,0.72)', lineHeight:1.7, margin:0 }}>
            {t(lang, p.effect.en, p.effect.hi)}
          </p>
          {p.retrograde_note && (
            <p style={{ fontSize:11.5, color:'rgba(249,115,22,0.8)', lineHeight:1.65, margin:'6px 0 0' }}>
              ℞ {t(lang, p.retrograde_note.en, p.retrograde_note.hi)}
            </p>
          )}
          {p.combust_note && (
            <p style={{ fontSize:11.5, color:'rgba(245,158,11,0.8)', lineHeight:1.65, margin:'6px 0 0' }}>
              {t(lang, p.combust_note.en, p.combust_note.hi)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
