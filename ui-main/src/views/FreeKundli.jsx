'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ChartToggle, SouthIndianChart, NorthIndianChart } from '../components/kundli/KundliChart';

const GOLD  = '#D4AF37';
const AMBER = '#F59E0B';
const RED   = '#EF4444';
const GREEN = '#22C55E';
const MUTED = 'rgba(245,240,232,0.55)';

const emptyForm = {
  name: '', gender: 'male',
  date_of_birth: '', time_of_birth: '',
  place_of_birth: '', latitude: '', longitude: '', timezone_offset: '5.5',
};

const presets = [
  { label: 'New Delhi', latitude: '28.6139', longitude: '77.2090', timezone_offset: '5.5' },
  { label: 'Mumbai',    latitude: '19.0760', longitude: '72.8777', timezone_offset: '5.5' },
  { label: 'Bengaluru', latitude: '12.9716', longitude: '77.5946', timezone_offset: '5.5' },
];

const PLANET_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' };

// Locked feature grid definitions (icon + name only — content stays server-side)
const LOCKED_FEATURES = [
  { icon:'🛑', en:'Dosha Analysis & Cancellations', hi:'दोष विश्लेषण और निवारण' },
  { icon:'📿', en:'Personalised Remedies',           hi:'व्यक्तिगत उपाय' },
  { icon:'⚖️', en:'11-Layer Judgement Report',       hi:'11-स्तरीय निर्णय रिपोर्ट' },
  { icon:'📋', en:'Complete Life Report',            hi:'संपूर्ण जीवन रिपोर्ट' },
  { icon:'💪', en:'Planet Strength Analysis',        hi:'ग्रह बल विश्लेषण' },
  { icon:'📅', en:'Varshphal (Annual Chart)',        hi:'वर्षफल' },
  { icon:'🪐', en:'Upagrahas (Shadow Planets)',      hi:'उपग्रह' },
  { icon:'📄', en:'Full PDF Report',                 hi:'पूर्ण PDF रिपोर्ट' },
];

function SectionTitle({ icon, children }) {
  return (
    <p className="font-serif text-gold text-sm font-semibold mb-3">
      {icon} {children}
    </p>
  );
}

// ─── Suspense / teaser card for doshas ────────────────────────────────────────
function DoshaTeaser({ doshas, name, lang }) {
  const hi = lang === 'hi';
  const total = doshas?.detected || 0;

  // Fake blurred rows — placeholder text only; real dosha data never reaches the client
  const fakeRows = Array.from({ length: Math.min(Math.max(total, 1), 3) });

  if (total === 0) return null;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className="card-royal p-5" style={{ border: '1px solid rgba(239,68,68,0.35)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <span style={{ fontSize:26 }}>⚠️</span>
        <div>
          <p style={{ fontSize:15, fontWeight:800, color:RED }}>
            {hi
              ? `${name || 'आपकी'} कुंडली में ${total} दोष पाए गए`
              : `${total} Dosha${total > 1 ? 's' : ''} Detected in ${name ? `${name}'s` : 'Your'} Kundli`}
          </p>
          <p style={{ fontSize:11, color:MUTED, marginTop:2 }}>
            {hi ? 'हमारे इंजन ने आपकी ग्रह-स्थितियों में महत्वपूर्ण दोष पहचाने हैं' : 'Our engine identified significant afflictions in your planetary positions'}
          </p>
        </div>
      </div>

      {/* Severity chips */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {doshas.strong > 0 && (
          <span style={{ fontSize:10, fontWeight:700, color:RED, border:`1px solid ${RED}55`, background:'rgba(239,68,68,0.10)', borderRadius:20, padding:'3px 10px' }}>
            {doshas.strong} {hi ? 'तीव्र' : 'Strong'}
          </span>
        )}
        {doshas.moderate > 0 && (
          <span style={{ fontSize:10, fontWeight:700, color:AMBER, border:`1px solid ${AMBER}55`, background:'rgba(245,158,11,0.10)', borderRadius:20, padding:'3px 10px' }}>
            {doshas.moderate} {hi ? 'मध्यम' : 'Moderate'}
          </span>
        )}
        {doshas.mild > 0 && (
          <span style={{ fontSize:10, fontWeight:700, color:'#60A5FA', border:'1px solid rgba(96,165,250,0.4)', background:'rgba(96,165,250,0.10)', borderRadius:20, padding:'3px 10px' }}>
            {doshas.mild} {hi ? 'सौम्य' : 'Mild'}
          </span>
        )}
      </div>

      {/* Life-area hints */}
      {doshas.area_hints?.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:10, color:MUTED, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
            {hi ? 'प्रभावित जीवन-क्षेत्र' : 'Life areas affected'}
          </p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {doshas.area_hints.map((a, i) => (
              <span key={i} style={{ fontSize:11, color:'#F5F0E8', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'4px 10px' }}>
                {hi ? a.hi : a.en}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Blurred locked rows */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <div style={{ filter:'blur(7px)', userSelect:'none', pointerEvents:'none' }} aria-hidden="true">
          {fakeRows.map((_, i) => (
            <div key={i} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, padding:'10px 14px', marginBottom:8 }}>
              <p style={{ fontSize:12, fontWeight:700, color:RED }}>
                {hi ? '██████ दोष — तीव्रता: ████' : '██████ Dosha — Severity: ████'}
              </p>
              <p style={{ fontSize:11, color:MUTED, marginTop:4 }}>
                {hi ? '████ ██████ ████████ ██ ██████ ████ ███ ██████ ████████' : '████ ██████ ████████ ██ ██████ ████ ███ ██████ ████████'}
              </p>
            </div>
          ))}
        </div>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:22 }}>🔒</span>
        </div>
      </div>

      <p style={{ fontSize:12, color:'#F5F0E8', lineHeight:1.7, marginBottom:14 }}>
        {hi
          ? 'कौन-से दोष हैं, कितने गंभीर हैं, क्या इनका निवारण (cancellation) मौजूद है और कौन-से उपाय इन्हें शांत करेंगे — यह सब पूर्ण रिपोर्ट में खोलें।'
          : 'Which doshas they are, how severe, whether cancellations exist in your chart, and the exact remedies that pacify them — unlock everything in the full report.'}
      </p>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <Link href="/register" className="btn-gold" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none' }}>
          {hi ? '🔓 दोष और उपाय खोलें' : '🔓 Unlock Doshas & Remedies'}
        </Link>
        <Link href="/remedy" style={{
          fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none',
          border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600,
        }}>
          {hi ? '📿 उपाय पुस्तिका देखें' : '📿 View Remedy Booklet'}
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Locked feature grid ──────────────────────────────────────────────────────
function LockedGrid({ lang }) {
  const hi = lang === 'hi';
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5">
      <SectionTitle icon="🔒">{hi ? 'पूर्ण रिपोर्ट में और क्या मिलेगा' : 'What Else Is In The Full Report'}</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10 }}>
        {LOCKED_FEATURES.map((f, i) => (
          <div key={i} style={{
            position:'relative', background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(212,175,55,0.15)', borderRadius:10, padding:'14px 12px',
            textAlign:'center', overflow:'hidden',
          }}>
            <div style={{ fontSize:22, marginBottom:6, filter:'grayscale(60%)', opacity:0.75 }}>{f.icon}</div>
            <p style={{ fontSize:11, color:MUTED, lineHeight:1.4 }}>{hi ? f.hi : f.en}</p>
            <span style={{ position:'absolute', top:6, right:8, fontSize:10 }}>🔒</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign:'center', marginTop:18 }}>
        <Link href="/register" className="btn-gold" style={{ fontSize:13, padding:'11px 26px', borderRadius:10, textDecoration:'none' }}>
          {hi ? 'निःशुल्क खाता बनाएं और पूर्ण कुंडली खोलें →' : 'Create Free Account & Unlock Full Kundli →'}
        </Link>
        <p style={{ fontSize:10, color:MUTED, marginTop:8 }}>
          {hi ? 'पंजीकरण निःशुल्क है · व्यक्तिगत उपाय पुस्तिका ₹250' : 'Registration is free · Personalised Remedy Booklet ₹250'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function FreeKundli() {
  const { lang } = useLang();
  const { user } = useAuth();
  const hi = lang === 'hi';
  const t = (en, h) => translate(lang, en, h);

  const [form, setForm]       = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [chartStyle, setChartStyle] = useState('north');

  const [locQuery, setLocQuery]     = useState('');
  const [locResults, setLocResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [leadEmail, setLeadEmail]   = useState('');
  const [emailBusy, setEmailBusy]   = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const searchRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setLocResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = (key, value) => setForm((c) => ({ ...c, [key]: value }));

  async function handleLocationSearch(e) {
    e.preventDefault();
    if (!locQuery.trim()) return;
    setSearching(true);
    setLocResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=6&addressdetails=1`;
      const res  = await fetch(url, { headers: { 'Accept-Language': hi ? 'hi' : 'en', 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.length === 0) toast.error(t('No results found. Try a different name.', 'कोई परिणाम नहीं मिला। अलग नाम आज़माएं।'));
      setLocResults(data);
    } catch {
      toast.error(t('Location search failed.', 'स्थान खोज विफल रही।'));
    } finally {
      setSearching(false);
    }
  }

  function selectLocResult(r) {
    const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    let tz = Math.round((lon / 15) * 2) / 2;
    if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 98) tz = 5.5; // India → IST
    setForm((c) => ({
      ...c, place_of_birth: r.display_name,
      latitude: lat.toFixed(6), longitude: lon.toFixed(6), timezone_offset: String(tz),
    }));
    setLocQuery(r.display_name.split(',')[0]);
    setLocResults([]);
  }

  const applyPreset = (p) => setForm((c) => ({
    ...c, place_of_birth: c.place_of_birth || p.label,
    latitude: p.latitude, longitude: p.longitude, timezone_offset: p.timezone_offset,
  }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error(t('Please search and select your birth place.', 'कृपया जन्म स्थान खोजें और चुनें।'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/public/free-kundli', form);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
    } catch (err) {
      toast.error(err.response?.data?.message || t('Unable to calculate kundli.', 'कुंडली की गणना नहीं हो सकी।'));
    } finally {
      setLoading(false);
    }
  }

  async function emailKundli(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
      toast.error(t('Please enter a valid email.', 'कृपया एक मान्य ईमेल दर्ज करें।'));
      return;
    }
    setEmailBusy(true);
    try {
      const { data } = await api.post('/public/free-kundli/email', { ...form, email: leadEmail, lang });
      setEmailSent(true);
      toast.success(data.message || t('Sent! Check your inbox.', 'भेज दिया! अपना इनबॉक्स देखें।'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('Could not send. Try again.', 'भेजा नहीं जा सका। पुनः प्रयास करें।'));
    } finally {
      setEmailBusy(false);
    }
  }

  // Adapt whitelisted payload to the chart components' expected shape
  const chartData = result ? {
    ascendant: result.chart.ascendant,
    planets:   result.chart.planets,
    houses:    result.chart.houses,
  } : null;

  const b = result?.basic;

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-12">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <h1 className="font-serif text-gold" style={{ fontSize:30, fontWeight:800 }}>
            {t('Free Kundli — Janam Kundali Online', 'निःशुल्क कुंडली — जन्म कुंडली ऑनलाइन')}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:560, marginLeft:'auto', marginRight:'auto', lineHeight:1.7 }}>
            {t('Generate your Vedic birth chart in 30 seconds — lagna, planetary positions, nakshatra, dasha and dosha scan. No login needed.',
               '30 सेकंड में अपनी वैदिक जन्म कुंडली बनाएं — लग्न, ग्रह स्थिति, नक्षत्र, दशा और दोष स्कैन। बिना लॉगिन के।')}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form onSubmit={handleSubmit} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="card-royal p-6 mb-8" style={{ maxWidth:640, margin:'0 auto 32px' }}>
          <div className="responsive-two-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-ivory/70 text-xs">{t('Full Name', 'पूरा नाम')} *</label>
              <input className="input-royal mt-1 w-full" value={form.name} onChange={(e) => update('name', e.target.value)} required
                placeholder={t('Your name', 'आपका नाम')} />
            </div>
            <div>
              <label className="text-ivory/70 text-xs">{t('Gender', 'लिंग')}</label>
              <select className="input-royal mt-1 w-full" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="male">{t('Male', 'पुरुष')}</option>
                <option value="female">{t('Female', 'महिला')}</option>
                <option value="other">{t('Other', 'अन्य')}</option>
              </select>
            </div>
            <div>
              <label className="text-ivory/70 text-xs">{t('Date of Birth', 'जन्म तिथि')} *</label>
              <input className="input-royal mt-1 w-full" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} required />
            </div>
            <div>
              <label className="text-ivory/70 text-xs">{t('Time of Birth', 'जन्म समय')} *</label>
              <input className="input-royal mt-1 w-full" type="time" value={form.time_of_birth} onChange={(e) => update('time_of_birth', e.target.value)} required />
            </div>

            {/* Place search */}
            <div style={{ gridColumn:'1 / -1', position:'relative' }} ref={searchRef}>
              <label className="text-ivory/70 text-xs">{t('Birth Place', 'जन्म स्थान')} *</label>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <input className="input-royal w-full" value={locQuery} onChange={(e) => setLocQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLocationSearch(e); }}
                  placeholder={t('e.g. Jodhpur, Rajasthan, India', 'जैसे: जोधपुर, राजस्थान, भारत')} />
                <button type="button" onClick={handleLocationSearch} className="btn-gold" style={{ fontSize:12, padding:'0 16px', borderRadius:8, whiteSpace:'nowrap' }}>
                  {searching ? '…' : t('Search', 'खोजें')}
                </button>
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
              <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                {presets.map((p) => (
                  <button key={p.label} type="button" onClick={() => applyPreset(p)} style={{
                    fontSize:10, color:MUTED, border:'1px solid rgba(255,255,255,0.12)',
                    background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'3px 10px', cursor:'pointer',
                  }}>
                    {p.label}
                  </button>
                ))}
                {form.latitude && (
                  <span style={{ fontSize:10, color:GREEN, padding:'3px 6px' }}>
                    ✓ {form.latitude}, {form.longitude} (UTC+{form.timezone_offset})
                  </span>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full mt-5" style={{ padding:'12px 0', fontSize:14, fontWeight:700, borderRadius:10 }}>
            {loading ? t('Calculating your kundli…', 'कुंडली बन रही है…') : t('🔯 Generate My Free Kundli', '🔯 मेरी निःशुल्क कुंडली बनाएं')}
          </button>
          <p style={{ fontSize:10, color:MUTED, textAlign:'center', marginTop:8 }}>
            {t('100% free · No account needed · Accurate Lahiri ayanamsa calculations', '100% निःशुल्क · खाते की आवश्यकता नहीं · सटीक लाहिरी अयनांश गणना')}
          </p>
        </motion.form>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && (
            <motion.div ref={resultRef} initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Basic details */}
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5">
                <SectionTitle icon="✨">{t(`${result.name}'s Birth Details`, `${result.name} का जन्म विवरण`)}</SectionTitle>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
                  {[
                    [t('Lagna (Ascendant)', 'लग्न'), hi ? b.lagna.rashi_hi : b.lagna.rashi_en, b.lagna.degree_in_sign_dms],
                    [t('Moon Sign (Rashi)', 'चंद्र राशि'), hi ? b.moon_sign.rashi_hi : b.moon_sign.rashi_en, null],
                    [t('Sun Sign', 'सूर्य राशि'), hi ? b.sun_sign.rashi_hi : b.sun_sign.rashi_en, null],
                    [t('Nakshatra', 'नक्षत्र'), (hi ? b.nakshatra.hi : b.nakshatra.en) + ` (${t('Pada', 'पद')} ${b.nakshatra.pada})`, t(`Lord: ${b.nakshatra.lord}`, `स्वामी: ${PLANET_HI[b.nakshatra.lord] || b.nakshatra.lord}`)],
                    [t('Tithi', 'तिथि'), hi ? (b.panchang.tithi_hi || b.panchang.tithi_en) : b.panchang.tithi_en, null],
                    [t('Day', 'वार'), hi ? (b.panchang.vara_hi || b.panchang.vara_en) : b.panchang.vara_en, null],
                  ].map(([label, value, sub], i) => value ? (
                    <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:10, padding:'10px 12px' }}>
                      <p style={{ fontSize:9, color:MUTED, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</p>
                      <p style={{ fontSize:13, color:GOLD, fontWeight:700, marginTop:3 }}>{value}</p>
                      {sub && <p style={{ fontSize:10, color:MUTED, marginTop:2 }}>{sub}</p>}
                    </div>
                  ) : null)}
                </div>
              </motion.div>

              {/* Email lead capture */}
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5"
                style={{ border:'1px solid rgba(212,175,55,0.3)' }}>
                {emailSent ? (
                  <p style={{ fontSize:13, color:GREEN, fontWeight:600 }}>
                    ✅ {t('Your kundli summary is on its way to your inbox. Check your email!', 'आपकी कुंडली सारांश आपके इनबॉक्स में भेज दी गई है। ईमेल देखें!')}
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize:13, fontWeight:700, color:GOLD, marginBottom:4 }}>
                      📧 {t('Email me this kundli summary', 'यह कुंडली सारांश मुझे ईमेल करें')}
                    </p>
                    <p style={{ fontSize:11, color:MUTED, marginBottom:10, lineHeight:1.6 }}>
                      {t('Get your birth chart summary in your inbox, plus a free link to unlock the full report.',
                         'अपना जन्म-कुंडली सारांश इनबॉक्स में पाएं, साथ ही पूर्ण रिपोर्ट खोलने का निःशुल्क लिंक।')}
                    </p>
                    <form onSubmit={emailKundli} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} required
                        placeholder={t('your@email.com', 'your@email.com')}
                        className="input-royal" style={{ flex:1, minWidth:200, fontSize:13 }} />
                      <button type="submit" disabled={emailBusy} className="btn-gold"
                        style={{ fontSize:12, fontWeight:700, padding:'9px 18px', borderRadius:8, whiteSpace:'nowrap' }}>
                        {emailBusy ? '…' : t('Email My Kundli', 'कुंडली ईमेल करें')}
                      </button>
                    </form>
                  </>
                )}
              </motion.div>

              {/* Chart */}
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5">
                <ChartToggle style={chartStyle} onChange={setChartStyle} lang={lang} />
                <p className="font-serif text-gold text-sm font-semibold text-center mb-3">
                  🔯 {t('Lagna Chart (D1)', 'लग्न कुंडली (D1)')}
                </p>
                {chartStyle === 'south'
                  ? <SouthIndianChart chart={chartData} lang={lang} />
                  : <NorthIndianChart chart={chartData} lang={lang} />}
              </motion.div>

              {/* Current dasha */}
              {result.dasha?.current_mahadasha && (
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5">
                  <SectionTitle icon="⏳">{t('Current Dasha Period', 'वर्तमान दशा')}</SectionTitle>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:180, background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'12px 16px' }}>
                      <p style={{ fontSize:10, color:MUTED, textTransform:'uppercase' }}>{t('Mahadasha', 'महादशा')}</p>
                      <p style={{ fontSize:16, color:GOLD, fontWeight:800, marginTop:3 }}>
                        {hi ? (PLANET_HI[result.dasha.current_mahadasha.lord] || result.dasha.current_mahadasha.lord) : result.dasha.current_mahadasha.lord}
                      </p>
                      <p style={{ fontSize:10, color:MUTED, marginTop:2 }}>
                        {t('Until', 'तक')} {String(result.dasha.current_mahadasha.end).slice(0, 10)}
                      </p>
                    </div>
                    {result.dasha.current_antardasha && (
                      <div style={{ flex:1, minWidth:180, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 16px' }}>
                        <p style={{ fontSize:10, color:MUTED, textTransform:'uppercase' }}>{t('Antardasha', 'अंतर्दशा')}</p>
                        <p style={{ fontSize:16, color:'#F5F0E8', fontWeight:800, marginTop:3 }}>
                          {hi ? (PLANET_HI[result.dasha.current_antardasha.lord] || result.dasha.current_antardasha.lord) : result.dasha.current_antardasha.lord}
                        </p>
                        <p style={{ fontSize:10, color:MUTED, marginTop:2 }}>
                          {t('Until', 'तक')} {String(result.dasha.current_antardasha.end).slice(0, 10)}
                        </p>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize:11, color:MUTED, marginTop:10, lineHeight:1.6 }}>
                    {t('What this dasha means for your career, marriage and health — see the full report.',
                       'यह दशा आपके करियर, विवाह और स्वास्थ्य के लिए क्या संकेत देती है — पूर्ण रिपोर्ट में देखें।')} 🔒
                  </p>
                </motion.div>
              )}

              {/* Yogas teaser */}
              {result.yogas?.total > 0 && (
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5"
                  style={{ border:'1px solid rgba(34,197,94,0.3)' }}>
                  <SectionTitle icon="✨">
                    {t(`${result.yogas.total} Auspicious Yogas Found`, `${result.yogas.total} शुभ योग मिले`)}
                  </SectionTitle>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                    {result.yogas.highlights.map((y, i) => (
                      <span key={i} style={{ fontSize:12, fontWeight:700, color:GREEN, border:`1px solid ${GREEN}44`, background:'rgba(34,197,94,0.08)', borderRadius:20, padding:'5px 14px' }}>
                        ✓ {hi ? (y.name_hi || y.name) : y.name}
                      </span>
                    ))}
                    {result.yogas.locked > 0 && (
                      <span style={{ fontSize:12, color:MUTED, border:'1px dashed rgba(255,255,255,0.2)', borderRadius:20, padding:'5px 14px' }}>
                        🔒 +{result.yogas.locked} {t('more yogas', 'और योग')}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:11, color:MUTED, lineHeight:1.6 }}>
                    {t('How strong are these yogas? When will they activate? Unlock the full yoga analysis with timing.',
                       'ये योग कितने प्रबल हैं? कब सक्रिय होंगे? पूर्ण योग विश्लेषण समय-निर्धारण के साथ खोलें।')}
                  </p>
                </motion.div>
              )}

              {/* Dosha suspense — the conversion driver */}
              <DoshaTeaser doshas={result.doshas} name={result.name} lang={lang} />

              {/* No doshas → positive upsell */}
              {result.doshas?.detected === 0 && (
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5"
                  style={{ border:'1px solid rgba(34,197,94,0.3)' }}>
                  <p style={{ fontSize:14, fontWeight:700, color:GREEN }}>
                    ✅ {t('No major doshas detected — a rare and fortunate chart!', 'कोई प्रमुख दोष नहीं मिला — एक दुर्लभ और भाग्यशाली कुंडली!')}
                  </p>
                  <p style={{ fontSize:12, color:MUTED, marginTop:6, lineHeight:1.7 }}>
                    {t('Now discover how to maximise your yogas — planet strength, dasha timing and personalised guidance await in the full report.',
                       'अब जानें कि अपने योगों का पूर्ण लाभ कैसे उठाएं — ग्रह बल, दशा समय और व्यक्तिगत मार्गदर्शन पूर्ण रिपोर्ट में।')}
                  </p>
                </motion.div>
              )}

              {/* Locked features grid */}
              <LockedGrid lang={lang} />

              {/* Try another */}
              <div style={{ textAlign:'center' }}>
                <button onClick={() => { setResult(null); setForm(emptyForm); setLocQuery(''); window.scrollTo({ top:0, behavior:'smooth' }); }}
                  style={{ fontSize:11, color:MUTED, background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:20, padding:'7px 18px', cursor:'pointer' }}>
                  {t('↻ Generate another kundli', '↻ दूसरी कुंडली बनाएं')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
