'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_HI = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
const TZ_OPTIONS = [
  { label:'IST +5:30 (India)',       value: 5.5  },
  { label:'PKT +5:00 (Pakistan)',    value: 5    },
  { label:'NPT +5:45 (Nepal)',       value: 5.75 },
  { label:'BST +6:00 (Bangladesh)', value: 6    },
  { label:'UTC +0:00',               value: 0    },
  { label:'UAE +4:00',               value: 4    },
  { label:'CET +1:00',               value: 1    },
  { label:'EST -5:00',               value: -5   },
];
const PLANET_COLORS = { Sun:'#F59E0B', Venus:'#EC4899', Mercury:'#10B981', Moon:'#94A3B8', Saturn:'#6B7280', Jupiter:'#F97316', Mars:'#EF4444' };
const PLANET_ICONS  = { Sun:'☉', Venus:'♀', Mercury:'☿', Moon:'☽', Saturn:'♄', Jupiter:'♃', Mars:'♂' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function guessTimezone(lon) {
  return Math.round((lon / 15) * 2) / 2;
}
function clampTzToOption(raw) {
  const closest = TZ_OPTIONS.reduce((best, o) => Math.abs(o.value - raw) < Math.abs(best.value - raw) ? o : best);
  return closest.value;
}
function fmtDate(y, m, d) {
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
}
function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}
function nowParts() {
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SunMoonCard({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-xl py-4 px-3">
      <span style={{ color, fontSize: 22 }}>{icon}</span>
      <span className="text-ivory/40 text-[10px] uppercase tracking-widest">{label}</span>
      <span className="text-ivory font-semibold text-sm font-mono">{value || '—'}</span>
    </div>
  );
}

function PanchangElementCard({ label, label_hi, num, name, name_hi, sub, end_time, color, lang }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-gold/60 text-[10px] uppercase tracking-widest">
        {lang === 'hi' ? label_hi : label}
      </span>
      <div className="flex items-baseline gap-2">
        {num !== undefined && (
          <span className="text-gold text-sm font-bold">{num}</span>
        )}
        <span style={{ color: color || '#F5F0E8' }} className="font-semibold text-sm leading-tight">
          {lang === 'hi' ? (name_hi || name) : name}
        </span>
      </div>
      {sub && <span className="text-ivory/40 text-[11px]">{sub}</span>}
      {end_time && (
        <span className="text-amber-400/70 text-[10px] font-mono mt-1">
          {lang === 'hi' ? 'समाप्त: ' : 'End: '}{end_time}
        </span>
      )}
    </div>
  );
}

function ChaughadiyaRow({ period, isDay, lang }) {
  const auspicious = period.auspicious;
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
      auspicious
        ? 'bg-emerald-500/[0.07] border-emerald-500/20'
        : 'bg-red-500/[0.06] border-red-500/15'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-bold ${auspicious ? 'text-emerald-400' : 'text-red-400'}`}>
          {auspicious ? '✓' : '✗'}
        </span>
        <div>
          <p className={`text-sm font-semibold ${auspicious ? 'text-emerald-300' : 'text-red-300'}`}>
            {lang === 'hi' ? period.hi : period.en}
          </p>
          <p className="text-ivory/30 text-[10px]">
            {lang === 'hi' ? (auspicious ? 'शुभ' : 'अशुभ') : (auspicious ? 'Auspicious' : 'Inauspicious')}
          </p>
        </div>
      </div>
      <span className="text-ivory/40 text-[10px] font-mono">{period.start} – {period.end}</span>
    </div>
  );
}

function HoraRow({ hora, isCurrentHora, lang }) {
  const color = PLANET_COLORS[hora.lord] || '#D4AF37';
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
      isCurrentHora
        ? 'bg-white/[0.08] border-gold/40 shadow-[0_0_8px_rgba(212,175,55,0.15)]'
        : 'bg-white/[0.02] border-white/[0.06]'
    }`}>
      <div className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <span style={{ color, fontSize: 14 }}>{hora.icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color }}>
          {lang === 'hi' ? hora.lord_hi : hora.lord}
        </p>
        <p className="text-ivory/30 text-[10px]">
          {lang === 'hi' ? hora.nature_hi : hora.nature}
        </p>
      </div>
      <div className="text-right">
        <p className="text-ivory/50 text-[10px] font-mono">{hora.start}</p>
        <p className="text-ivory/30 text-[10px] font-mono">{hora.end}</p>
      </div>
      {isCurrentHora && (
        <span className="text-[9px] font-bold text-gold bg-gold/15 border border-gold/30 rounded px-1.5 py-0.5">NOW</span>
      )}
    </div>
  );
}

// ── Location Search with Autocomplete ─────────────────────────────────────────
function LocationSearch({ onSelect, lang }) {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showDrop,    setShowDrop]    = useState(false);
  const [selected,    setSelected]    = useState('');
  const wrapRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced Nominatim search
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'JyotishStackAI/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data || []);
        setShowDrop(data?.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = useCallback((s) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    const parts = s.display_name.split(',');
    const display = parts.slice(0, Math.min(3, parts.length)).join(',').trim();
    setSelected(display);
    setQuery(display);
    setShowDrop(false);
    setSuggestions([]);
    const tz = clampTzToOption(guessTimezone(lon));
    onSelect({ lat, lon, display, tz });
  }, [onSelect]);

  const placeHolder = lang === 'hi' ? 'स्थान खोजें जैसे किशनगढ़, राजस्थान' : 'Search place — e.g. Kishangarh, Rajasthan';

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-base">📍</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (selected && e.target.value !== selected) setSelected(''); }}
          placeholder={placeHolder}
          className="w-full bg-white/[0.05] border border-gold/20 rounded-lg pl-9 pr-4 py-3 text-ivory text-sm placeholder-ivory/30 outline-none focus:border-gold/50 focus:bg-white/[0.07] transition-all"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/50 text-xs animate-pulse">...</span>
        )}
        {selected && query === selected && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-base">✓</span>
        )}
      </div>
      {showDrop && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0d0f1e] border border-gold/20 rounded-lg shadow-2xl overflow-hidden">
          {suggestions.map((s, i) => {
            const parts = s.display_name.split(',');
            const main  = parts[0]?.trim();
            const sub   = parts.slice(1, 3).join(',').trim();
            return (
              <button
                key={i}
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 hover:bg-gold/10 border-b border-white/[0.04] last:border-b-0 transition-colors"
              >
                <p className="text-ivory text-sm font-medium">{main}</p>
                <p className="text-ivory/40 text-[11px] mt-0.5">{sub}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PanchangMuhurta() {
  const { day: dNow, month: mNow, year: yNow } = nowParts();

  const [lang,      setLang]      = useState('en');
  const [selDay,    setSelDay]    = useState(dNow);
  const [selMonth,  setSelMonth]  = useState(mNow);
  const [selYear,   setSelYear]   = useState(yNow);
  const [lat,       setLat]       = useState(null);
  const [lon,       setLon]       = useState(null);
  const [tz,        setTz]        = useState(5.5);
  const [placeName, setPlaceName] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [result,    setResult]    = useState(null);
  const [muhurtaTab, setMuhurtaTab] = useState('chaughadiya'); // 'chaughadiya' | 'hora'
  const [muhurtaDayNight, setMuhurtaDayNight] = useState('day');
  const [currentMins, setCurrentMins] = useState(null);

  const T = (en, hi) => lang === 'hi' ? hi : en;

  // Track current time for NOW badge in Hora
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentMins(now.getHours() * 60 + now.getMinutes());
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLocationSelect = useCallback(({ lat: la, lon: lo, display, tz: autoTz }) => {
    setLat(la); setLon(lo); setPlaceName(display); setTz(autoTz);
  }, []);

  const maxDay = daysInMonth(selMonth, selYear);
  useEffect(() => { if (selDay > maxDay) setSelDay(maxDay); }, [selMonth, selYear, maxDay, selDay]);

  const handleSubmit = async () => {
    if (!lat || !lon) { setError(T('Please select a location first', 'पहले स्थान चुनें')); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const dateStr = `${selYear}-${String(selMonth).padStart(2,'0')}-${String(selDay).padStart(2,'0')}`;
      const { data } = await api.get('/panchang/daily', { params: { date: dateStr, lat, lon, tz, place: placeName } });
      setResult(data.panchang);
      setMuhurtaTab('chaughadiya');
      setMuhurtaDayNight('day');
      // Auto-switch to night if current time is past sunset
      if (data.panchang?.hora?.day?.[0]) {
        const firstHoraMins = data.panchang.hora.day[0].start_mins;
        if (currentMins !== null && currentMins >= (firstHoraMins + 720)) setMuhurtaDayNight('night');
      }
    } catch (e) {
      setError(e?.response?.data?.message || T('Failed to load panchang', 'पंचांग लोड करने में त्रुटि'));
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = "bg-white/[0.05] border border-gold/20 rounded-lg px-3 py-2.5 text-ivory text-sm outline-none focus:border-gold/40 cursor-pointer appearance-none";
  const years = Array.from({ length: 20 }, (_, i) => yNow - 5 + i);

  const p = result;
  const isCurrentHora = (hora) => currentMins !== null && currentMins >= hora.start_mins && currentMins < hora.end_mins;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070918] to-[#0a0c1c] text-ivory pb-20">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="text-center pt-24 pb-6 px-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-gold/30 text-2xl">✦</span>
          <h1 className="text-3xl font-bold text-gold" style={{ fontFamily: 'Georgia, serif' }}>
            {T('Panchang Muhurta', 'पंचांग मुहूर्त')}
          </h1>
          <span className="text-gold/30 text-2xl">✦</span>
        </div>
        <p className="text-ivory/40 text-sm">
          {T('Daily Vedic almanac · Tithi · Nakshatra · Yoga · Chaughadiya · Hora', 'दैनिक वैदिक पंचांग · तिथि · नक्षत्र · योग · चौघड़िया · होरा')}
        </p>
        {/* Occasion muhurat quick links */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {[
            { href:'/muhurat/marriage',         icon:'💍', en:'Marriage',       hi:'विवाह' },
            { href:'/muhurat/griha-pravesh',    icon:'🏠', en:'Griha Pravesh',  hi:'गृह प्रवेश' },
            { href:'/muhurat/naamkaran',        icon:'👶', en:'Naamkaran',      hi:'नामकरण' },
            { href:'/muhurat/mundan',           icon:'✂️', en:'Mundan',         hi:'मुंडन' },
            { href:'/muhurat/vehicle-purchase', icon:'🚗', en:'Vehicle',        hi:'वाहन' },
          ].map((o) => (
            <a key={o.href} href={o.href}
              className="text-xs text-gold/70 border border-gold/25 rounded-full px-3 py-1.5 hover:bg-gold/10 transition-colors no-underline">
              {o.icon} {T(`${o.en} Muhurat ${new Date().getFullYear()}`, `${o.hi} मुहूर्त ${new Date().getFullYear()}`)}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">

        {/* ── Search Form ──────────────────────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-gold/15 rounded-2xl p-5 mb-6">

          {/* Row 1: Location Search */}
          <div className="mb-4">
            <label className="text-ivory/50 text-xs uppercase tracking-widest mb-2 block">
              {T('Location', 'स्थान')}
            </label>
            <LocationSearch onSelect={handleLocationSelect} lang={lang} />
          </div>

          {/* Row 2: Date + Timezone + Lang + Button */}
          <div className="flex flex-wrap gap-3 items-end">

            {/* Day */}
            <div className="flex flex-col gap-1 min-w-[72px]">
              <label className="text-ivory/40 text-[11px] uppercase tracking-widest">
                {T('Day', 'दिन')}
              </label>
              <select value={selDay} onChange={e => setSelDay(Number(e.target.value))} className={selectStyle}>
                {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{String(d).padStart(2,'0')}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-ivory/40 text-[11px] uppercase tracking-widest">
                {T('Month', 'माह')}
              </label>
              <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} className={selectStyle}>
                {MONTHS_EN.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {lang === 'hi' ? MONTHS_HI[i] : m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="flex flex-col gap-1 min-w-[90px]">
              <label className="text-ivory/40 text-[11px] uppercase tracking-widest">
                {T('Year', 'वर्ष')}
              </label>
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} className={selectStyle}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Timezone */}
            <div className="flex flex-col gap-1 min-w-[170px]">
              <label className="text-ivory/40 text-[11px] uppercase tracking-widest">
                {T('Timezone', 'समय क्षेत्र')}
              </label>
              <select value={tz} onChange={e => setTz(parseFloat(e.target.value))} className={selectStyle}>
                {TZ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Lang toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-ivory/40 text-[11px] uppercase tracking-widest">Lang</label>
              <div className="flex rounded-lg overflow-hidden border border-gold/20">
                {['en','hi'].map(l => (
                  <button key={l} onClick={() => setLang(l)} className={`px-4 py-2.5 text-sm font-semibold transition-colors ${lang === l ? 'bg-gold/20 text-gold' : 'text-ivory/40 hover:text-ivory/60'}`}>
                    {l === 'en' ? 'EN' : 'हि'}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-1 ml-auto">
              <label className="text-ivory/40 text-[11px] uppercase tracking-widest opacity-0">Go</label>
              <button
                onClick={handleSubmit}
                disabled={loading || !lat}
                className="px-6 py-2.5 bg-gold/15 border border-gold/40 text-gold rounded-lg font-semibold text-sm hover:bg-gold/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '⏳' : '🕉'} {T('Get Panchang', 'पंचांग देखें')}
              </button>
            </div>
          </div>

          {/* Coords display */}
          {lat && lon && (
            <p className="text-ivory/25 text-[11px] mt-3 font-mono">
              📍 {lat.toFixed(4)}°N, {lon.toFixed(4)}°E · TZ {tz >= 0 ? '+' : ''}{tz}
            </p>
          )}

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {p && (
          <>
            {/* ── Result Header ──────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/20 rounded-2xl p-5 mb-4 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <p className="text-gold font-bold text-xl" style={{ fontFamily: 'Georgia, serif' }}>
                  {T(p.vara.day_en, p.vara.day_hi)}
                </p>
                <p className="text-ivory/50 text-sm mt-0.5">{fmtDate(selYear, selMonth, selDay)}</p>
              </div>
              {placeName && (
                <div className="text-right">
                  <p className="text-ivory/70 text-sm font-medium">📍 {placeName}</p>
                  <p className="text-ivory/30 text-[11px] font-mono mt-0.5">{lat?.toFixed(3)}°N · {lon?.toFixed(3)}°E</p>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <span className="text-[11px] px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  {T(p.masa.name, p.masa.name_hi)}
                </span>
                <span className="text-[11px] px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  {T(p.paksha.en, p.paksha.hi)}
                </span>
                <span className="text-[11px] px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  {T(p.ayana.en, p.ayana.hi)}
                </span>
              </div>
            </div>

            {/* ── Celestial Times ─────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <SunMoonCard icon="🌅" label={T('Sunrise','सूर्योदय')} value={p.sunrise} color="#F59E0B" />
              <SunMoonCard icon="🌇" label={T('Sunset','सूर्यास्त')} value={p.sunset} color="#F97316" />
              <SunMoonCard icon="🌙" label={T('Moonrise','चंद्रोदय')} value={p.moonrise || '—'} color="#94A3B8" />
              <SunMoonCard icon="🌑" label={T('Moonset','चंद्रास्त')} value={p.moonset || '—'} color="#64748B" />
            </div>

            {/* ── 5 Panchang Elements ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              <PanchangElementCard
                label="Tithi" label_hi="तिथि"
                num={p.tithi.num}
                name={`${p.tithi.paksha} ${p.tithi.name_en}`}
                name_hi={`${p.tithi.paksha === 'Shukla' ? 'शुक्ल' : 'कृष्ण'} ${p.tithi.name_hi}`}
                end_time={p.tithi.end_time}
                color="#D4AF37"
                lang={lang}
              />
              <PanchangElementCard
                label="Nakshatra" label_hi="नक्षत्र"
                num={p.nakshatra.num}
                name={p.nakshatra.en}
                name_hi={p.nakshatra.hi}
                sub={`Pada ${p.nakshatra.pada}${p.nakshatra.lord ? ` · ${p.nakshatra.lord}` : ''}`}
                end_time={p.nakshatra.end_time}
                color="#A78BFA"
                lang={lang}
              />
              <PanchangElementCard
                label="Yoga" label_hi="योग"
                num={p.yoga.num}
                name={p.yoga.name}
                name_hi={p.yoga.name}
                end_time={p.yoga.end_time}
                color={p.yoga.is_auspicious ? '#10B981' : '#EF4444'}
                lang={lang}
              />
              <PanchangElementCard
                label="Karana" label_hi="करण"
                name={p.karana.name}
                name_hi={p.karana.name}
                end_time={p.karana.end_time}
                color="#60A5FA"
                lang={lang}
              />
              <PanchangElementCard
                label="Paksha" label_hi="पक्ष"
                name={p.paksha.en}
                name_hi={p.paksha.hi}
                lang={lang}
              />
            </div>

            {/* ── Astro Details row ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label:'Ritu (Season)', label_hi:'ऋतु', value: T(p.ritu.en, p.ritu.hi), color:'#A78BFA' },
                { label:'Sun Sign', label_hi:'सूर्य राशि', value: T(p.sun_sign.en, p.sun_sign.hi), color:'#F59E0B' },
                { label:'Moon Sign', label_hi:'चंद्र राशि', value: T(p.moon_sign.en, p.moon_sign.hi), color:'#94A3B8' },
                { label:'Ayana', label_hi:'अयन', value: T(p.ayana.en, p.ayana.hi), color:'#60A5FA' },
                ...(p.samvat ? [
                  { label:'Vikram Samvat', label_hi:'विक्रम संवत', value: String(p.samvat.vikram), color:'#D4AF37' },
                  { label:'Shaka Samvat', label_hi:'शक संवत', value: String(p.samvat.shaka), color:'#F472B6' },
                  { label:'Samvatsara', label_hi:'संवत्सर', value: T(p.samvat.samvatsara_en, p.samvat.samvatsara_hi), color:'#10B981' },
                  { label:'Kali Samvat', label_hi:'कलि संवत', value: String(p.samvat.kali), color:'#818CF8' },
                ] : []),
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-ivory/40 text-xs">{lang === 'hi' ? item.label_hi : item.label}</span>
                  <span className="font-semibold text-sm" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* ── Special Yogas ────────────────────────────────────────────── */}
            {p.special_yogas?.length > 0 && (
              <div className="bg-white/[0.03] border border-gold/10 rounded-xl p-4 mb-4">
                <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-3">
                  {T('Panchang Yogas', 'पंचांग योग')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.special_yogas.map((y, i) => (
                    <span key={i} className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                      y.auspicious
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-300'
                    }`}>
                      {lang === 'hi' ? y.name_hi : y.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Muhurta Section (Chaughadiya + Hora) ────────────────────── */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden mb-4">

              {/* Tab bar */}
              <div className="flex border-b border-white/[0.07]">
                {[
                  { key:'chaughadiya', en:'Chaughadiya', hi:'चौघड़िया' },
                  { key:'hora', en:'Hora (Planetary Hours)', hi:'होरा (ग्रह घड़ी)' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setMuhurtaTab(tab.key)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                      muhurtaTab === tab.key
                        ? 'border-gold text-gold bg-gold/[0.06]'
                        : 'border-transparent text-ivory/40 hover:text-ivory/60'
                    }`}
                  >
                    {T(tab.en, tab.hi)}
                  </button>
                ))}
              </div>

              {/* Day/Night sub-tab */}
              <div className="flex gap-2 p-4 pb-2">
                {[
                  { key:'day', en:'Day ☀', hi:'दिन ☀' },
                  { key:'night', en:'Night 🌙', hi:'रात 🌙' },
                ].map(dn => (
                  <button
                    key={dn.key}
                    onClick={() => setMuhurtaDayNight(dn.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      muhurtaDayNight === dn.key
                        ? 'bg-gold/15 border-gold/40 text-gold'
                        : 'bg-white/[0.04] border-white/[0.08] text-ivory/40 hover:text-ivory/60'
                    }`}
                  >
                    {T(dn.en, dn.hi)}
                  </button>
                ))}
              </div>

              <div className="p-4 pt-2">
                {muhurtaTab === 'chaughadiya' && (
                  <div className="flex flex-col gap-2">
                    {(muhurtaDayNight === 'day' ? p.chaughadiya?.day : p.chaughadiya?.night)?.map((period, i) => (
                      <ChaughadiyaRow key={i} period={period} lang={lang} />
                    ))}
                  </div>
                )}

                {muhurtaTab === 'hora' && (
                  <>
                    {/* Hora info */}
                    <div className="bg-gold/[0.06] border border-gold/15 rounded-lg px-4 py-2 mb-3">
                      <p className="text-gold/70 text-[11px]">
                        {T(
                          `${p.vara.day_en}'s first hora lord: ${(muhurtaDayNight === 'day' ? p.hora?.day : p.hora?.night)?.[0]?.lord || '—'} · Each hora = 60 min · Sequence: Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon`,
                          `${p.vara.day_hi} का पहला होरा स्वामी: ${(muhurtaDayNight === 'day' ? p.hora?.day : p.hora?.night)?.[0]?.lord_hi || '—'} · प्रत्येक होरा = 60 मिनट`
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(muhurtaDayNight === 'day' ? p.hora?.day : p.hora?.night)?.map((hora, i) => (
                        <HoraRow key={i} hora={hora} isCurrentHora={isCurrentHora(hora)} lang={lang} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── BPHS Note ───────────────────────────────────────────────── */}
            <div className="text-center py-4">
              <p className="text-ivory/20 text-[11px]">
                {T(
                  'Based on Brihat Parashar Hora Shastra · Lahiri Ayanamsa · Whole-sign houses · astronomy-engine (VSOP87)',
                  'बृहत् पाराशर होरा शास्त्र आधारित · लाहिरी अयनांश · पूर्ण-राशि भाव · astronomy-engine (VSOP87)'
                )}
              </p>
            </div>
          </>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!p && !loading && (
          <div className="text-center py-16 opacity-40">
            <p className="text-6xl mb-4">🕉</p>
            <p className="text-ivory/50 text-sm">
              {T('Search a location and select a date to view Panchang', 'स्थान खोजें और तारीख चुनें')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
