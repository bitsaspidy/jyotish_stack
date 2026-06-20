'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import api from '../lib/api';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD  = '#D4AF37';
const IVORY = '#F5F0E8';
const DIM   = 'rgba(245,240,232,0.45)';
const CARD  = 'rgba(20,23,40,0.92)';
const BORDER= 'rgba(212,175,55,0.22)';

// ── Shared input / label styles ───────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8, color: IVORY,
  padding: '11px 14px', fontSize: 14,
  outline: 'none', fontFamily: 'Inter,sans-serif',
};
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.08em', color: DIM,
  marginBottom: 6, textTransform: 'uppercase',
};

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: DIM, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// ── STEP 1 — Personal Info ────────────────────────────────────────────────────
function Step1({ data, onChange, onNext, hi }) {
  const [err, setErr] = useState('');
  const submit = () => {
    if (!data.name.trim())  return setErr(hi ? 'नाम आवश्यक है।' : 'Full name is required.');
    if (!data.email.trim()) return setErr(hi ? 'ईमेल आवश्यक है।' : 'Email address is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return setErr(hi ? 'मान्य ईमेल दर्ज करें।' : 'Enter a valid email address.');
    setErr('');
    onNext();
  };

  return (
    <div>
      <p style={{ color: DIM, fontSize: 14, marginBottom: 24 }}>
        {hi
          ? 'अपना विवरण भरें — हम आपकी कुंडली के आधार पर व्यक्तिगत उपाय रिपोर्ट तैयार करेंगे।'
          : 'Enter your details and we\'ll prepare a personalised remedy report from your birth chart.'}
      </p>
      <Field label={hi ? 'पूरा नाम' : 'Full Name'}>
        <input style={inputStyle} value={data.name} placeholder={hi ? 'अपना नाम लिखें' : 'Your full name'}
          onChange={e => onChange('name', e.target.value)} />
      </Field>
      <Field label={hi ? 'ईमेल पता' : 'Email Address'}
        hint={hi ? 'रिपोर्ट इस ईमेल पर PDF में भेजी जाएगी।' : 'The PDF report will be sent to this email.'}>
        <input style={inputStyle} type="email" value={data.email} placeholder="you@example.com"
          onChange={e => onChange('email', e.target.value)} />
      </Field>
      <Field label={hi ? 'मोबाइल नंबर (वैकल्पिक)' : 'Phone Number (optional)'}>
        <input style={inputStyle} type="tel" value={data.phone} placeholder={hi ? '+91 XXXXX XXXXX' : '+91 XXXXX XXXXX'}
          onChange={e => onChange('phone', e.target.value)} />
      </Field>
      <Field label={hi ? 'रिपोर्ट की भाषा' : 'Report Language'}>
        <select style={inputStyle} value={data.lang} onChange={e => onChange('lang', e.target.value)}>
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
        </select>
      </Field>
      {err && <p style={{ color: '#F87171', fontSize: 13, marginBottom: 12 }}>{err}</p>}
      <button onClick={submit} className="btn-gold" style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 700 }}>
        {hi ? 'अगला →' : 'Next →'}
      </button>
    </div>
  );
}

// ── STEP 2 — Birth Details ────────────────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack, hi }) {
  const [query,   setQuery]   = useState(data.place_of_birth || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr]         = useState('');
  const debounceRef           = useRef(null);

  const searchPlace = useCallback((q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`)
      .then(r => r.json())
      .then(items => setResults(items || []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  const onQueryChange = (v) => {
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlace(v), 420);
  };

  const selectPlace = (r) => {
    const lat = parseFloat(r.lat).toFixed(6);
    const lon = parseFloat(r.lon).toFixed(6);
    // India heuristic for timezone
    const latF = parseFloat(lat), lonF = parseFloat(lon);
    let tz = Math.round((lonF / 15) * 2) / 2;
    if (latF >= 6 && latF <= 37 && lonF >= 68 && lonF <= 98) tz = 5.5;
    onChange('place_of_birth', r.display_name);
    onChange('latitude', lat);
    onChange('longitude', lon);
    onChange('timezone_offset', String(tz));
    setQuery(r.display_name);
    setResults([]);
  };

  const submit = () => {
    if (!data.date_of_birth) return setErr(hi ? 'जन्म तिथि आवश्यक है।' : 'Date of birth is required.');
    if (!data.latitude)       return setErr(hi ? 'कृपया जन्म स्थान चुनें।' : 'Please select a birth location from the dropdown.');
    setErr('');
    onNext();
  };

  const PRESETS = [
    { label: 'New Delhi', place: 'New Delhi, Delhi, India', lat: '28.613939', lon: '77.209023', tz: '5.5' },
    { label: 'Mumbai',    place: 'Mumbai, Maharashtra, India', lat: '19.076090', lon: '72.877426', tz: '5.5' },
    { label: 'Bengaluru', place: 'Bengaluru, Karnataka, India', lat: '12.971599', lon: '77.594566', tz: '5.5' },
  ];

  return (
    <div>
      <p style={{ color: DIM, fontSize: 14, marginBottom: 24 }}>
        {hi ? 'जन्म विवरण जितना सटीक होगा, उपाय उतने ही प्रभावी होंगे।'
            : 'The more accurate your birth details, the more precise your remedies will be.'}
      </p>

      <Field label={hi ? 'जन्म तिथि' : 'Date of Birth'}>
        <input style={inputStyle} type="date" value={data.date_of_birth}
          max={new Date().toISOString().slice(0, 10)}
          onChange={e => onChange('date_of_birth', e.target.value)} />
      </Field>

      <Field label={hi ? 'जन्म समय (वैकल्पिक)' : 'Time of Birth (optional)'}
        hint={hi ? 'सटीक समय न हो तो खाली छोड़ें — दोपहर 12:00 उपयोग होगी।'
                 : 'Leave blank if unknown — 12:00 noon will be used.'}>
        <input style={inputStyle} type="time" value={data.time_of_birth}
          onChange={e => onChange('time_of_birth', e.target.value)} />
      </Field>

      <Field label={hi ? 'जन्म स्थान' : 'Place of Birth'}>
        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => {
              onChange('place_of_birth', p.place);
              onChange('latitude', p.lat);
              onChange('longitude', p.lon);
              onChange('timezone_offset', p.tz);
              setQuery(p.place);
              setResults([]);
            }} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 20,
              background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
              color: GOLD, cursor: 'pointer',
            }}>{p.label}</button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <input style={inputStyle} value={query} placeholder={hi ? 'शहर खोजें...' : 'Search city...'}
            onChange={e => onQueryChange(e.target.value)} />
          {searching && <p style={{ fontSize: 11, color: DIM, marginTop: 4 }}>{hi ? 'खोज रहे हैं...' : 'Searching...'}</p>}
          {results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#151829', border: `1px solid ${BORDER}`, borderRadius: 8,
              maxHeight: 220, overflowY: 'auto', marginTop: 4,
            }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => selectPlace(r)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 14px', background: 'none', border: 'none',
                  borderBottom: i < results.length - 1 ? `1px solid ${BORDER}` : 'none',
                  color: IVORY, fontSize: 13, cursor: 'pointer',
                }}>
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        {data.latitude && (
          <p style={{ fontSize: 11, color: DIM, marginTop: 6 }}>
            ✓ {data.place_of_birth?.split(',')[0]} &nbsp;·&nbsp; {data.latitude}°N, {data.longitude}°E &nbsp;·&nbsp; UTC{data.timezone_offset >= 0 ? '+' : ''}{data.timezone_offset}
          </p>
        )}
      </Field>

      {err && <p style={{ color: '#F87171', fontSize: 13, marginBottom: 12 }}>{err}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: 'transparent', border: `1px solid ${BORDER}`, color: DIM, cursor: 'pointer',
        }}>
          {hi ? '← वापस' : '← Back'}
        </button>
        <button onClick={submit} className="btn-gold" style={{ flex: 2, padding: '12px', fontSize: 15, fontWeight: 700 }}>
          {hi ? 'रिपोर्ट बनाएं →' : 'Generate My Report →'}
        </button>
      </div>
    </div>
  );
}

// ── STEP 3 — Processing ───────────────────────────────────────────────────────
function Step3({ hi }) {
  const steps = hi
    ? ['कुंडली गणना हो रही है...', 'ग्रह स्थिति विश्लेषण...', 'व्यक्तिगत उपाय तैयार हो रहे हैं...', 'PDF रिपोर्ट बन रही है...']
    : ['Calculating your Vedic chart...', 'Analysing planetary positions...', 'Crafting personalised remedies...', 'Building your PDF report...'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 20, animation: 'spinY 3s linear infinite' }}>🪐</div>
      <style>{`@keyframes spinY{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}`}</style>
      <p style={{ color: GOLD, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        {hi ? 'रिपोर्ट तैयार हो रही है...' : 'Preparing your report...'}
      </p>
      <AnimatePresence mode="wait">
        <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }} style={{ color: DIM, fontSize: 13 }}>
          {steps[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ── STEP 4 — Success ──────────────────────────────────────────────────────────
function Step4({ email, isNewUser, hi }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
      <h2 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 22, marginBottom: 8 }}>
        {hi ? 'रिपोर्ट भेज दी गई!' : 'Report Sent!'}
      </h2>
      <p style={{ color: DIM, fontSize: 14, marginBottom: 6 }}>
        {hi ? 'आपकी वैदिक उपाय रिपोर्ट इस पते पर भेज दी गई है:' : 'Your Vedic Remedy Report has been sent to:'}
      </p>
      <p style={{ color: IVORY, fontWeight: 700, fontSize: 15, marginBottom: 24 }}>{email}</p>

      <div style={{ background: 'rgba(212,175,55,0.07)', border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 10, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
        <p style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
          {hi ? 'अगले कदम:' : 'Next steps:'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { n: '1', t: hi ? 'रिपोर्ट डाउनलोड करें' : 'Download your report', d: hi ? 'ईमेल में PDF संलग्न है।' : 'PDF is attached to your email.' },
            ...(isNewUser ? [
              { n: '2', t: hi ? 'पासवर्ड सेट करें' : 'Set your password', d: hi ? 'खाता सेटअप लिंक अलग ईमेल में भेजा गया है।' : 'Account setup link sent in a separate email.' },
              { n: '3', t: hi ? 'ईमेल सत्यापित करें' : 'Verify your email', d: hi ? 'सत्यापन लिंक पर क्लिक करें।' : 'Click the verification link we sent.' },
              { n: '4', t: hi ? 'प्लान चुनें' : 'Choose a plan', d: hi ? 'पूर्ण कुंडली और भविष्यवाणी के लिए अपग्रेड करें।' : 'Upgrade for full chart and predictions.' },
            ] : [
              { n: '2', t: hi ? 'लॉगिन करें' : 'Log in', d: hi ? 'अपने खाते से लॉगिन करें।' : 'Sign in to your existing account.' },
            ]),
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: GOLD, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</span>
              <div>
                <p style={{ color: IVORY, fontWeight: 600, fontSize: 13, margin: 0 }}>{s.t}</p>
                <p style={{ color: DIM, fontSize: 12, margin: 0 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isNewUser
          ? <p style={{ color: DIM, fontSize: 13 }}>{hi ? 'पासवर्ड सेटअप के लिए अपना ईमेल जांचें।' : 'Check your email to set up your account password.'}</p>
          : <Link href="/login" className="btn-gold" style={{ textAlign: 'center', padding: '12px', fontSize: 14, fontWeight: 700 }}>
              {hi ? 'लॉगिन करें →' : 'Log In to Your Account →'}
            </Link>}
        <Link href="/pricing" style={{ color: DIM, fontSize: 13, textDecoration: 'underline', textAlign: 'center' }}>
          {hi ? 'योजना देखें' : 'View Plans & Pricing'}
        </Link>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RemedyPackage() {
  const [step, setStep] = useState(1); // 1 | 2 | 3 | 4
  const [isNewUser, setIsNewUser] = useState(true);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', lang: 'en',
    date_of_birth: '', time_of_birth: '', place_of_birth: '',
    latitude: '', longitude: '', timezone_offset: '5.5',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hi = form.lang === 'hi';

  const submit = async () => {
    setStep(3);
    try {
      const { data } = await api.post('/remedy/submit', {
        name:            form.name.trim(),
        email:           form.email.trim().toLowerCase(),
        phone:           form.phone.trim() || undefined,
        date_of_birth:   form.date_of_birth,
        time_of_birth:   form.time_of_birth || '12:00:00',
        place_of_birth:  form.place_of_birth,
        latitude:        form.latitude,
        longitude:       form.longitude,
        timezone_offset: form.timezone_offset,
        lang:            form.lang,
      });
      setIsNewUser(data.is_new_user !== false);
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || (hi ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.');
      toast.error(msg);
      setStep(2);
    }
  };

  const STEPS = [
    hi ? 'व्यक्तिगत जानकारी' : 'Personal Info',
    hi ? 'जन्म विवरण' : 'Birth Details',
    hi ? 'प्रोसेसिंग' : 'Processing',
    hi ? 'सफलता' : 'Done',
  ];

  return (
    <div className="relative min-h-screen" style={{ background: 'radial-gradient(ellipse at top,#181C35 0%,#0B0D1A 60%,#06070F 100%)' }}>
      <StarField count={120} />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-24">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ color: GOLD, fontSize: 12, letterSpacing: '0.3em', fontWeight: 700, marginBottom: 10 }}>
            🪐 {hi ? 'वैदिक ज्योतिष उपाय' : 'VEDIC JYOTISH REMEDIES'}
          </p>
          <h1 style={{ color: IVORY, fontFamily: 'Georgia,serif', fontSize: 30, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
            {hi ? 'निःशुल्क वैदिक उपाय रिपोर्ट' : 'Free Vedic Remedy Report'}
          </h1>
          <p style={{ color: DIM, fontSize: 15, maxWidth: 440, margin: '0 auto' }}>
            {hi
              ? 'अपना जन्म विवरण दें — हम आपकी कुंडली से व्यक्तिगत उपाय PDF में तैयार करेंगे और ईमेल पर भेजेंगे।'
              : 'Enter your birth details and we\'ll generate a personalised remedy report from your Vedic chart and send it to your email as a PDF.'}
          </p>
        </div>

        {/* Progress — only steps 1 & 2 */}
        {step <= 2 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center', justifyContent: 'center' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${step >= s ? GOLD : 'rgba(255,255,255,0.12)'}`,
                  color: step >= s ? GOLD : DIM, fontSize: 12, fontWeight: 700,
                }}>{s}</div>
                <span style={{ fontSize: 12, color: step >= s ? GOLD : DIM }}>{STEPS[s - 1]}</span>
                {s < 2 && <div style={{ width: 30, height: 1, background: step > s ? GOLD : 'rgba(255,255,255,0.1)' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '32px 28px' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <Step1 data={form} onChange={set} onNext={() => setStep(2)} hi={hi} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <Step2 data={form} onChange={set} onNext={submit} onBack={() => setStep(1)} hi={hi} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Step3 hi={hi} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                <Step4 email={form.email} isNewUser={isNewUser} hi={hi} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust indicators */}
        {step <= 2 && (
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { icon: '🔒', t: hi ? 'डेटा सुरक्षित' : 'Data Secure' },
              { icon: '📄', t: hi ? 'PDF ईमेल पर' : 'PDF by Email' },
              { icon: '⚡', t: hi ? 'तत्काल रिपोर्ट' : 'Instant Report' },
              { icon: '🆓', t: hi ? 'बिल्कुल मुफ़्त' : 'Completely Free' },
            ].map(b => (
              <div key={b.t} style={{ display: 'flex', alignItems: 'center', gap: 6, color: DIM, fontSize: 12 }}>
                <span>{b.icon}</span>{b.t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
