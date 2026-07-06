'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { ChartToggle, NorthIndianChart, SouthIndianChart } from '../components/kundli/KundliChart';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { t } from '../lib/astroI18n';
import api from '../lib/api';

const GOLD = '#D4AF37';
const TEXT = 'rgba(245,240,232,0.82)';
const MUTED = 'rgba(245,240,232,0.54)';

const CATEGORIES = [
  ['general', 'General Direction', 'सामान्य दिशा', '🧭'],
  ['marriage', 'Marriage & Partnership', 'विवाह और साझेदारी', '💞'],
  ['career', 'Career & Job', 'करियर और नौकरी', '💼'],
  ['finance', 'Money & Gains', 'धन और लाभ', '💰'],
  ['health', 'Health & Recovery', 'स्वास्थ्य और सुधार', '🌿'],
  ['legal', 'Dispute & Legal Matter', 'विवाद और कानूनी विषय', '⚖'],
  ['travel', 'Travel & Relocation', 'यात्रा और स्थान परिवर्तन', '✈'],
  ['lost_object', 'Lost Object', 'खोई हुई वस्तु', '🔎'],
  ['property', 'Property & Home', 'संपत्ति और घर', '🏠'],
  ['education', 'Education & Examination', 'शिक्षा और परीक्षा', '📚'],
  ['family', 'Family & Home', 'परिवार और घर', '👨‍👩‍👧'],
];

const PRESETS = [
  { place:'New Delhi, India', latitude:28.6139, longitude:77.2090, timezone_offset:5.5 },
  { place:'Mumbai, India', latitude:19.0760, longitude:72.8777, timezone_offset:5.5 },
  { place:'Bengaluru, India', latitude:12.9716, longitude:77.5946, timezone_offset:5.5 },
];

const TONE_STYLE = {
  support:{ color:'#34D399', border:'rgba(52,211,153,0.28)', background:'rgba(52,211,153,0.08)' },
  balanced:{ color:'#FBBF24', border:'rgba(251,191,36,0.26)', background:'rgba(251,191,36,0.07)' },
  care:{ color:'#FB923C', border:'rgba(251,146,60,0.27)', background:'rgba(251,146,60,0.07)' },
};

const RESULT_STYLE = {
  supportive:{ color:'#34D399', border:'rgba(52,211,153,0.38)', background:'linear-gradient(135deg,rgba(52,211,153,0.12),rgba(17,20,40,0.96))' },
  conditional:{ color:'#FBBF24', border:'rgba(251,191,36,0.38)', background:'linear-gradient(135deg,rgba(251,191,36,0.11),rgba(17,20,40,0.96))' },
  mixed:{ color:'#FB923C', border:'rgba(251,146,60,0.38)', background:'linear-gradient(135deg,rgba(251,146,60,0.11),rgba(17,20,40,0.96))' },
  delayed:{ color:'#F87171', border:'rgba(248,113,113,0.38)', background:'linear-gradient(135deg,rgba(248,113,113,0.11),rgba(17,20,40,0.96))' },
  unclear:{ color:'#C4B5FD', border:'rgba(196,181,253,0.38)', background:'linear-gradient(135deg,rgba(167,139,250,0.12),rgba(17,20,40,0.96))' },
};

function pick(lang, value, key) {
  return t(lang, value?.[`${key}En`] || '', value?.[`${key}Hi`] || value?.[`${key}En`] || '');
}

function guessTimezone(latitude, longitude) {
  if (latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 98) return 5.5;
  return Math.max(-12, Math.min(14, Math.round((longitude / 15) * 4) / 4));
}

function LocationPicker({ value, onChange, lang }) {
  const [query, setQuery] = useState(value.place || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2 || query === value.place) return undefined;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`, {
          headers:{ 'Accept-Language':lang === 'hi' ? 'hi' : 'en', Accept:'application/json' },
        });
        if (!response.ok) throw new Error('Location search failed');
        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query, value.place, lang]);

  const select = (place, latitude, longitude, timezoneOffset) => {
    const next = {
      place,
      latitude:Number(latitude),
      longitude:Number(longitude),
      timezone_offset:Number(timezoneOffset),
    };
    setQuery(place);
    setSuggestions([]);
    onChange(next);
  };

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <label className="text-ivory/65 text-xs">{t(lang, 'Question Location', 'प्रश्न का स्थान')} *</label>
      <div style={{ position:'relative', marginTop:5 }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:GOLD }}>⌖</span>
        <input
          className="input-royal w-full"
          style={{ paddingLeft:34 }}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value !== value.place) onChange({ ...value, place:'', latitude:null, longitude:null });
          }}
          placeholder={t(lang, 'Search city, state, country', 'शहर, राज्य, देश खोजें')}
        />
        {searching && <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:MUTED, fontSize:11 }}>…</span>}
      </div>
      {suggestions.length > 0 && (
        <div style={{ position:'absolute', zIndex:40, top:'100%', left:0, right:0, marginTop:4, maxHeight:230, overflowY:'auto', background:'#11152D', border:'1px solid rgba(212,175,55,0.3)', borderRadius:10, boxShadow:'0 18px 45px rgba(0,0,0,0.55)' }}>
          {suggestions.map((item) => (
            <button key={`${item.place_id}-${item.lat}`} type="button" onMouseDown={() => {
              const lat = Number(item.lat);
              const lon = Number(item.lon);
              select(item.display_name, lat, lon, guessTimezone(lat, lon));
            }} style={{ display:'block', width:'100%', padding:'10px 12px', textAlign:'left', color:TEXT, background:'transparent', border:0, borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', fontSize:11 }}>
              📍 {item.display_name}
            </button>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:6, marginTop:7, flexWrap:'wrap' }}>
        {PRESETS.map((preset) => (
          <button key={preset.place} type="button" onClick={() => select(preset.place, preset.latitude, preset.longitude, preset.timezone_offset)} style={{ border:'1px solid rgba(212,175,55,0.18)', background:'rgba(212,175,55,0.05)', color:MUTED, borderRadius:14, padding:'4px 9px', fontSize:9.5, cursor:'pointer' }}>
            {preset.place.split(',')[0]}
          </button>
        ))}
      </div>
      {value.latitude != null && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'end', marginTop:10 }}>
          <p style={{ color:'#34D399', fontSize:10, lineHeight:1.5 }}>✓ {value.place}<br />{value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}</p>
          <label style={{ color:MUTED, fontSize:9 }}>
            UTC offset
            <input type="number" min="-12" max="14" step="0.25" className="input-royal" value={value.timezone_offset}
              onChange={(event) => onChange({ ...value, timezone_offset:Number(event.target.value) })}
              style={{ display:'block', width:82, marginTop:3, padding:'6px 8px', fontSize:11 }} />
          </label>
        </div>
      )}
    </div>
  );
}

function SignalCard({ signal, lang }) {
  const style = TONE_STYLE[signal.tone] || TONE_STYLE.balanced;
  return (
    <article style={{ padding:'14px 15px', borderRadius:12, border:`1px solid ${style.border}`, background:style.background }}>
      <p style={{ color:style.color, fontSize:11.5, fontWeight:800 }}>{pick(lang, signal, 'title')}</p>
      <p style={{ color:TEXT, fontSize:12, lineHeight:1.75, marginTop:6 }}>{pick(lang, signal, 'summary')}</p>
    </article>
  );
}

function PaidReport({ premium, lang, canViewTechnical = false }) {
  const list = (items, color) => (
    <div style={{ display:'grid', gap:8 }}>
      {items?.map((item, index) => (
        <p key={index} style={{ color:TEXT, fontSize:12, lineHeight:1.7, display:'flex', gap:8 }}>
          <span style={{ color }}>●</span>{t(lang, item.en, item.hi || item.en)}
        </p>
      ))}
    </div>
  );
  return (
    <div style={{ display:'grid', gap:16 }}>
      <section className="card-royal p-5">
        <h2 className="font-serif text-gold text-lg font-bold">💡 {t(lang, 'Why this answer?', 'यह उत्तर क्यों मिला?')}</h2>
        <p style={{ color:MUTED, fontSize:11.5, lineHeight:1.7, marginTop:6 }}>
          {t(lang, 'Three simple signals used to understand your situation.', 'आपकी परिस्थिति समझने के लिए तीन सरल संकेत।')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {premium.allSignals?.map((signal) => <SignalCard key={signal.key} signal={signal} lang={lang} />)}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="card-royal p-5">
          <h3 style={{ color:'#34D399', fontFamily:'Georgia,serif', fontWeight:700, marginBottom:10 }}>✦ {t(lang, 'Supporting Factors', 'सहायक संकेत')}</h3>
          {list(premium.supportingFactors, '#34D399')}
        </section>
        <section className="card-royal p-5">
          <h3 style={{ color:'#FB923C', fontFamily:'Georgia,serif', fontWeight:700, marginBottom:10 }}>◈ {t(lang, 'Points Requiring Care', 'सावधानी के संकेत')}</h3>
          {list(premium.cautions, '#FB923C')}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <section className="card-royal p-5" style={{ border:'1px solid rgba(167,139,250,0.25)' }}>
          <h3 style={{ color:'#C4B5FD', fontFamily:'Georgia,serif', fontWeight:700 }}>⏳ {t(lang, 'Likely Timing Window', 'संभावित समय-सीमा')}</h3>
          <p style={{ color:'#E9D5FF', fontWeight:800, fontSize:14, marginTop:10 }}>{pick(lang, premium.timing, 'window')}</p>
          <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.6, marginTop:6 }}>{pick(lang, premium.timing, 'note')}</p>
        </section>
        <section className="card-royal p-5 lg:col-span-4" style={{ border:'1px solid rgba(52,211,153,0.22)' }}>
          <h3 style={{ color:'#34D399', fontFamily:'Georgia,serif', fontWeight:700 }}>✓ {t(lang, 'Your decision checklist', 'निर्णय से पहले यह जांचें')}</h3>
          <div style={{ display:'grid', gap:9, marginTop:12 }}>
            {premium.nextSteps?.map((step, index) => (
              <div key={index} style={{ display:'grid', gridTemplateColumns:'26px 1fr', gap:9, alignItems:'start' }}>
                <span style={{ width:24, height:24, borderRadius:'50%', display:'grid', placeItems:'center', color:'#34D399', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', fontSize:10, fontWeight:800 }}>{index + 1}</span>
                <p style={{ color:TEXT, fontSize:12.5, lineHeight:1.65, paddingTop:2 }}>{t(lang, step.en, step.hi || step.en)}</p>
              </div>
            ))}
          </div>
          <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.65, marginTop:13, paddingTop:11, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <strong style={{ color:'#34D399' }}>{t(lang, 'Bottom line:', 'मुख्य सलाह:')}</strong>{' '}{t(lang, premium.guidanceEn, premium.guidanceHi)}
          </p>
        </section>
      </div>

      {canViewTechnical && premium.technicalDetails && (
        <details className="card-royal" style={{ overflow:'hidden' }}>
          <summary style={{ padding:'13px 17px', color:GOLD, cursor:'pointer', fontSize:11, fontWeight:700 }}>
            🔐 {t(lang, 'Technical Prashna Factors — Admin only', 'तकनीकी प्रश्न संकेत — केवल एडमिन')}
          </summary>
          <div style={{ padding:'0 17px 17px', display:'grid', gap:8 }}>
            {premium.allSignals?.map((signal) => (
              <p key={signal.key} style={{ color:'rgba(245,240,232,0.62)', fontSize:10.5, lineHeight:1.65 }}>
                <strong style={{ color:'rgba(245,240,232,0.82)' }}>{pick(lang, signal, 'title')}:</strong>{' '}
                {pick(lang, signal, 'technical')}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ChartPanel({ chart, chartStyle, onStyleChange, lang }) {
  return (
    <details className="card-royal" style={{ overflow:'hidden' }}>
      <summary style={{ padding:'15px 18px', color:GOLD, cursor:'pointer', fontSize:12, fontWeight:800 }}>
        🔮 {t(lang, 'View Prashna chart and planet placements', 'प्रश्न कुंडली और ग्रह स्थिति देखें')}
      </summary>
      <div style={{ padding:'0 18px 18px', maxWidth:520, margin:'0 auto' }}>
        <ChartToggle style={chartStyle} onChange={onStyleChange} lang={lang} />
        <motion.div key={chartStyle} initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }}>
          {chartStyle === 'south'
            ? <SouthIndianChart chart={chart} lang={lang} />
            : <NorthIndianChart chart={chart} lang={lang} />}
        </motion.div>
      </div>
    </details>
  );
}

function FreePaywall({ reading, authenticated, lang }) {
  return (
    <section className="card-royal p-5" style={{ position:'relative', overflow:'hidden', border:'1px solid rgba(212,175,55,0.36)' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 80% 10%, rgba(212,175,55,0.13), transparent 45%)', pointerEvents:'none' }} />
      <div style={{ position:'relative' }}>
        <span style={{ display:'inline-block', color:'#FBBF24', border:'1px solid rgba(251,191,36,0.3)', background:'rgba(251,191,36,0.08)', borderRadius:15, padding:'4px 9px', fontSize:9, fontWeight:800 }}>
          🔒 {t(lang, 'Important details are available', 'महत्वपूर्ण जानकारी उपलब्ध है')}
        </span>
        <h2 className="font-serif text-gold text-lg font-bold mt-3">{t(lang, 'Unlock the complete Prashna judgement', 'पूर्ण प्रश्न निर्णय खोलें')}</h2>
        <p style={{ color:MUTED, fontSize:12, lineHeight:1.7, marginTop:7, maxWidth:720 }}>
          {t(lang, 'Your free result shows the chart and basic direction. Premium and Yearly members can see the decisive factors, timing and practical guidance that should be considered before acting.', 'आपके निःशुल्क परिणाम में कुंडली और मूल दिशा दिखाई गई है। प्रीमियम और वार्षिक सदस्य निर्णय से पहले देखने योग्य मुख्य कारण, समय और व्यावहारिक मार्गदर्शन देख सकते हैं।')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {reading.lockedSections?.map((section) => (
            <div key={section.key} style={{ padding:'10px 12px', borderRadius:9, background:'rgba(0,0,0,0.16)', border:'1px solid rgba(212,175,55,0.12)', color:TEXT, fontSize:11 }}>
              🔒 {pick(lang, section, 'title')}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:16 }}>
          <Link href="/pricing" className="btn-gold" style={{ padding:'10px 18px', fontSize:12, fontWeight:800, textDecoration:'none' }}>
            {t(lang, 'View Membership Plans', 'सदस्यता योजनाएं देखें')}
          </Link>
          {!authenticated && (
            <Link href="/login" style={{ padding:'9px 17px', border:'1px solid rgba(212,175,55,0.35)', color:GOLD, borderRadius:7, fontSize:12, textDecoration:'none' }}>
              {t(lang, 'Already a member? Login', 'पहले से सदस्य हैं? लॉगिन करें')}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Prashna() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [form, setForm] = useState({ question:'', category:'general', place:'', latitude:null, longitude:null, timezone_offset:5.5 });
  const [chartStyle, setChartStyle] = useState('north');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kundli_chart_style');
      if (saved === 'north' || saved === 'south') setChartStyle(saved);
    } catch {}
  }, []);

  const changeStyle = (style) => {
    setChartStyle(style);
    try { localStorage.setItem('kundli_chart_style', style); } catch {}
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.place || form.latitude == null || form.longitude == null) {
      toast.error(t(lang, 'Please select a valid question location.', 'कृपया प्रश्न का सही स्थान चुनें।'));
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await api.post('/prashna/calculate', {
        ...form,
        asked_at:new Date().toISOString(),
      });
      setResult(data);
      setTimeout(() => document.getElementById('prashna-result')?.scrollIntoView({ behavior:'smooth', block:'start' }), 50);
    } catch (error) {
      toast.error(error.response?.data?.message || t(lang, 'Unable to calculate Prashna right now.', 'अभी प्रश्न कुंडली की गणना नहीं हो सकी।'));
    } finally {
      setSubmitting(false);
    }
  };

  const reading = result?.reading;
  const paid = !!result?.access?.is_paid;
  const resultStyle = RESULT_STYLE[reading?.free?.tone] || RESULT_STYLE.mixed;

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg,#0B0E23 0%,#141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-14">
        <motion.header initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-7">
          <span style={{ display:'inline-block', color:'#C4B5FD', border:'1px solid rgba(167,139,250,0.28)', background:'rgba(167,139,250,0.08)', borderRadius:16, padding:'5px 11px', fontSize:9.5, fontWeight:800, letterSpacing:'0.08em' }}>
            {t(lang, 'QUESTION-TIME ASTROLOGY', 'प्रश्न-समय ज्योतिष')}
          </span>
          <h1 className="font-serif text-gold font-bold mt-3" style={{ fontSize:'clamp(28px,4vw,42px)' }}>
            🔮 {t(lang, 'Prashna Jyotish', 'प्रश्न ज्योतिष')}
          </h1>
          <p style={{ color:MUTED, fontSize:13, lineHeight:1.75, maxWidth:680, margin:'10px auto 0' }}>
            {t(lang, 'Ask one sincere, specific question. The chart is created for the exact moment and location of your question.', 'एक ईमानदार और स्पष्ट प्रश्न पूछें। कुंडली आपके प्रश्न के ठीक समय और स्थान के लिए बनाई जाती है।')}
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
          <motion.form onSubmit={submit} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card-royal p-5 lg:col-span-3">
            <h2 className="font-serif text-gold text-lg font-bold">{t(lang, 'Ask Your Question', 'अपना प्रश्न पूछें')}</h2>
            <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.6, marginTop:4 }}>{t(lang, 'Ask about one matter only. A focused question gives a clearer reading.', 'केवल एक विषय के बारे में पूछें। स्पष्ट प्रश्न से फल अधिक उपयोगी होता है।')}</p>

            <label className="text-ivory/65 text-xs block mt-4">{t(lang, 'Question Category', 'प्रश्न की श्रेणी')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {CATEGORIES.map(([value, en, hi, icon]) => (
                <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, category:value }))}
                  aria-pressed={form.category === value}
                  style={{ minHeight:44, borderRadius:9, border:`1px solid ${form.category === value ? GOLD : 'rgba(212,175,55,0.15)'}`, background:form.category === value ? 'rgba(212,175,55,0.11)' : 'rgba(255,255,255,0.025)', color:form.category === value ? GOLD : MUTED, padding:'7px 8px', fontSize:10.5, fontWeight:700, cursor:'pointer' }}>
                  {icon} {t(lang, en, hi)}
                </button>
              ))}
            </div>

            <label className="text-ivory/65 text-xs block mt-4">{t(lang, 'Your Specific Question', 'आपका स्पष्ट प्रश्न')} *</label>
            <textarea className="input-royal w-full mt-1" value={form.question} minLength={8} maxLength={500} required rows={4}
              onChange={(event) => setForm((current) => ({ ...current, question:event.target.value }))}
              placeholder={t(lang, 'Example: Is this the right time to accept the new job offer?', 'उदाहरण: क्या नई नौकरी का प्रस्ताव स्वीकार करने का यह सही समय है?')}
              style={{ resize:'vertical', lineHeight:1.6 }} />
            <p style={{ color:MUTED, fontSize:9, textAlign:'right', marginTop:3 }}>{form.question.length}/500</p>

            <div className="mt-4">
              <LocationPicker value={form} onChange={(location) => setForm((current) => ({ ...current, ...location }))} lang={lang} />
            </div>

            <button type="submit" disabled={submitting} className="btn-gold w-full mt-5" style={{ padding:'12px 18px', fontSize:13, fontWeight:800, opacity:submitting ? 0.65 : 1 }}>
              {submitting ? t(lang, 'Casting the Prashna chart…', 'प्रश्न कुंडली बन रही है…') : t(lang, 'Cast My Prashna Chart', 'मेरी प्रश्न कुंडली बनाएं')}
            </button>
          </motion.form>

          <aside className="lg:col-span-2 space-y-4">
            <section className="card-royal p-5">
              <h2 className="font-serif text-gold font-bold">{t(lang, 'How It Works', 'यह कैसे काम करता है')}</h2>
              <div style={{ display:'grid', gap:12, marginTop:12 }}>
                {[
                  ['1', 'Ask one sincere question', 'एक ईमानदार प्रश्न पूछें'],
                  ['2', 'Select where you are asking it', 'प्रश्न पूछने का स्थान चुनें'],
                  ['3', 'The current moment becomes the chart', 'वर्तमान समय प्रश्न कुंडली बनता है'],
                  ['4', 'Read the conditions, timing and guidance', 'स्थिति, समय और मार्गदर्शन पढ़ें'],
                ].map(([number, en, hi]) => (
                  <div key={number} style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ width:25, height:25, flex:'0 0 auto', borderRadius:'50%', border:'1px solid rgba(212,175,55,0.32)', color:GOLD, display:'grid', placeItems:'center', fontSize:10, fontWeight:800 }}>{number}</span>
                    <p style={{ color:TEXT, fontSize:11.5 }}>{t(lang, en, hi)}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="card-royal p-5" style={{ border:'1px solid rgba(52,211,153,0.2)' }}>
              <p style={{ color:'#34D399', fontSize:11, fontWeight:800 }}>✓ {t(lang, 'Free access', 'निःशुल्क उपलब्ध')}</p>
              <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.6, marginTop:5 }}>{t(lang, 'Chart, basic direction and two key indicators.', 'कुंडली, मूल दिशा और दो मुख्य संकेत।')}</p>
              <p style={{ color:'#C4B5FD', fontSize:11, fontWeight:800, marginTop:11 }}>✦ {t(lang, 'Premium & Yearly access', 'प्रीमियम और वार्षिक सदस्य सुविधा')}</p>
              <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.6, marginTop:5 }}>{t(lang, 'Complete judgement, all indicators, timing, cautions and practical guidance.', 'पूर्ण निर्णय, सभी संकेत, समय, सावधानियां और व्यावहारिक मार्गदर्शन।')}</p>
            </section>
          </aside>
        </div>

        {reading && (
          <div id="prashna-result" style={{ scrollMarginTop:85, marginTop:24, display:'grid', gap:16 }}>
            <section className="card-royal p-5" aria-live="polite" style={{ border:`1px solid ${resultStyle.border}`, background:resultStyle.background }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', alignItems:'flex-start' }}>
                <div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:resultStyle.color, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    ✓ {t(lang, 'Direct answer', 'सीधा जवाब')}
                  </span>
                  <p style={{ color:MUTED, fontSize:10.5, marginTop:7 }}>
                    {t(lang, 'Your question:', 'आपका प्रश्न:')} <span style={{ color:TEXT }}>{reading.question.text}</span>
                  </p>
                </div>
                <span style={{ color:paid ? '#34D399' : '#FBBF24', border:`1px solid ${paid ? 'rgba(52,211,153,0.28)' : 'rgba(251,191,36,0.25)'}`, background:paid ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.07)', borderRadius:14, padding:'4px 9px', fontSize:9.5, fontWeight:800 }}>
                  {paid ? t(lang, 'Complete member reading', 'पूर्ण सदस्य फल') : t(lang, 'Free reading', 'निःशुल्क फल')}
                </span>
              </div>
              <h2 className="font-serif font-bold mt-4" style={{ color:resultStyle.color, fontSize:'clamp(21px,3vw,29px)', lineHeight:1.35 }}>{pick(lang, reading.free, 'headline')}</h2>
              <p style={{ color:TEXT, fontSize:14, lineHeight:1.85, marginTop:9, maxWidth:880 }}>{pick(lang, reading.free, 'summary')}</p>
              <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginTop:14, paddingTop:11, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ color:'rgba(245,240,232,0.43)', fontSize:9.5, lineHeight:1.55, maxWidth:680 }}>{pick(lang, reading.free, 'note')}</p>
                <span style={{ color:MUTED, fontSize:9.5 }}>{new Date(reading.question.askedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')} · {reading.question.place}</span>
              </div>
            </section>

            {paid && reading.premium
              ? <PaidReport premium={reading.premium} lang={lang} canViewTechnical={!!result.access.can_view_technical} />
              : (
                <>
                  <section className="card-royal p-5">
                    <h2 className="font-serif text-gold text-lg font-bold">💡 {t(lang, 'Why this answer?', 'यह उत्तर क्यों मिला?')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {reading.free.visibleSignals?.map((signal) => <SignalCard key={signal.key} signal={signal} lang={lang} />)}
                    </div>
                  </section>
                  <FreePaywall reading={reading} authenticated={result.access.authenticated || !!user} lang={lang} />
                </>
              )}

            <ChartPanel chart={reading.chart} chartStyle={chartStyle} onStyleChange={changeStyle} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}
