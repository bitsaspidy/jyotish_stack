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

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ── STEP 1 — Personal Info ─────────────────────────────────────────────────────
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
          : 'Enter your details and we\'ll prepare a personalised Vedic remedy PDF report from your birth chart.'}
      </p>
      <Field label={hi ? 'पूरा नाम' : 'Full Name'}>
        <input style={inputStyle} value={data.name} placeholder={hi ? 'अपना नाम लिखें' : 'Your full name'}
          onChange={e => onChange('name', e.target.value)} />
      </Field>
      <Field label={hi ? 'ईमेल पता' : 'Email Address'}
        hint={hi ? 'रिपोर्ट PDF और खाता सेटअप लिंक इस ईमेल पर भेजे जाएंगे।' : 'Your PDF report and account setup link will be sent here.'}>
        <input style={inputStyle} type="email" value={data.email} placeholder="you@example.com"
          onChange={e => onChange('email', e.target.value)} />
      </Field>
      <Field label={hi ? 'मोबाइल नंबर' : 'Phone Number'}
        hint={hi ? 'भुगतान फ़ॉर्म में स्वतः भरा जाएगा।' : 'Auto-filled in the payment form.'}>
        <input style={inputStyle} type="tel" value={data.phone} placeholder="+91 XXXXX XXXXX"
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

// ── STEP 2 — Birth Details ─────────────────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack, hi }) {
  const [query,    setQuery]    = useState(data.place_of_birth || '');
  const [results,  setResults]  = useState([]);
  const [searching,setSearching]= useState(false);
  const [err,      setErr]      = useState('');
  const debounceRef             = useRef(null);

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
    { label: 'New Delhi',  place: 'New Delhi, Delhi, India',    lat: '28.613939', lon: '77.209023', tz: '5.5' },
    { label: 'Mumbai',     place: 'Mumbai, Maharashtra, India',  lat: '19.076090', lon: '72.877426', tz: '5.5' },
    { label: 'Bengaluru',  place: 'Bengaluru, Karnataka, India', lat: '12.971599', lon: '77.594566', tz: '5.5' },
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
        hint={hi ? 'सटीक समय न हो तो खाली छोड़ें — दोपहर 12:00 उपयोग होगी।' : 'Leave blank if unknown — 12:00 noon will be used.'}>
        <input style={inputStyle} type="time" value={data.time_of_birth}
          onChange={e => onChange('time_of_birth', e.target.value)} />
      </Field>
      <Field label={hi ? 'जन्म स्थान' : 'Place of Birth'}>
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
          {hi ? 'भुगतान की ओर →' : 'Proceed to Payment →'}
        </button>
      </div>
    </div>
  );
}

// ── STEP 3 — Payment ───────────────────────────────────────────────────────────
const BASIC_FEATURES = [
  { icon: '📄', en: 'Personalised Vedic Remedy PDF Report',  hi: 'व्यक्तिगत वैदिक उपाय PDF रिपोर्ट' },
  { icon: '🔮', en: 'Full Kundli (Birth Chart) Access',      hi: 'पूर्ण कुंडली (जन्म चार्ट) एक्सेस' },
  { icon: '🪐', en: 'Daily Panchang & Transit Alerts',       hi: 'दैनिक पंचांग और ग्रह गोचर अलर्ट' },
  { icon: '🌟', en: 'Dasha & Antardasha Predictions',        hi: 'दशा और अंतर्दशा भविष्यवाणी' },
  { icon: '📊', en: 'Save up to 3 Kundli Profiles',         hi: '3 कुंडली प्रोफाइल सहेजें' },
  { icon: '✉️', en: 'Daily Vedic Guidance by Email',         hi: 'दैनिक वैदिक मार्गदर्शन ईमेल में' },
];

function Step3({ form, planInfo, onPay, onBack, paying, hi }) {
  const rawPrice = planInfo ? Number(planInfo.price || planInfo.plan_price || 0) : 0;
  // Razorpay stores amount in paise; if > 1000 it's likely paise, convert to rupees
  const priceRs  = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
  const priceStr = priceRs > 0 ? priceRs.toLocaleString('en-IN') : '…';
  const currency = planInfo?.currency || 'INR';
  const sym      = currency === 'INR' ? '₹' : '$';

  return (
    <div>
      <p style={{ color: DIM, fontSize: 14, marginBottom: 20 }}>
        {hi
          ? 'अपनी रिपोर्ट और Basic Plan एक्सेस के लिए भुगतान करें।'
          : 'Complete payment to receive your remedy report and activate your Basic plan.'}
      </p>

      {/* Plan summary */}
      <div style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <p style={{ color: GOLD, fontWeight: 800, fontSize: 17, margin: 0 }}>Basic Plan</p>
            <p style={{ color: DIM, fontSize: 12, margin: '2px 0 0' }}>{hi ? 'एक वर्ष की एक्सेस' : 'Full year access'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: IVORY, fontWeight: 800, fontSize: 22, margin: 0 }}>{sym}{priceStr}</p>
            <p style={{ color: DIM, fontSize: 11, margin: 0 }}>{hi ? '/ वर्ष' : '/ year'}</p>
          </div>
        </div>
        <div style={{ borderTop: `1px solid rgba(212,175,55,0.15)`, paddingTop: 14 }}>
          {BASIC_FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ color: '#c8c0b0', fontSize: 13 }}>{hi ? f.hi : f.en}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-fill notice */}
      {(form.email || form.phone) && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '9px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 14, marginTop: 1 }}>🔗</span>
          <p style={{ color: '#93C5FD', fontSize: 12, margin: 0 }}>
            {hi
              ? `आपकी जानकारी (${form.email}${form.phone ? `, ${form.phone}` : ''}) भुगतान फ़ॉर्म में स्वतः भरी जाएगी।`
              : `Your details (${form.email}${form.phone ? `, ${form.phone}` : ''}) will be pre-filled in the Razorpay checkout.`}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} disabled={paying} style={{
          flex: 1, padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: 'transparent', border: `1px solid ${BORDER}`, color: DIM,
          cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.5 : 1,
        }}>
          {hi ? '← वापस' : '← Back'}
        </button>
        <button onClick={onPay} disabled={paying || !planInfo} className="btn-gold"
          style={{ flex: 2, padding: '12px', fontSize: 15, fontWeight: 700, opacity: (!planInfo || paying) ? 0.7 : 1 }}>
          {paying
            ? (hi ? '⏳ प्रोसेस हो रहा है…' : '⏳ Processing…')
            : (planInfo ? `${hi ? 'भुगतान करें' : 'Pay'} ${sym}${priceStr} →` : (hi ? 'लोड हो रहा है…' : 'Loading…'))}
        </button>
      </div>

      <p style={{ color: DIM, fontSize: 11, textAlign: 'center', marginTop: 14 }}>
        🔒 {hi ? 'Razorpay द्वारा सुरक्षित। UPI, Card, NetBanking, Wallet सभी स्वीकार हैं।' : 'Secured by Razorpay. UPI, Cards, NetBanking & Wallets accepted.'}
      </p>
    </div>
  );
}

// ── STEP 4 — Processing ────────────────────────────────────────────────────────
function Step4({ hi }) {
  const msgs = hi
    ? ['कुंडली गणना हो रही है...', 'ग्रह स्थिति विश्लेषण...', 'व्यक्तिगत उपाय तैयार हो रहे हैं...', 'PDF रिपोर्ट बन रही है...']
    : ['Calculating your Vedic chart...', 'Analysing planetary positions...', 'Crafting personalised remedies...', 'Building your PDF report...'];
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS(x => (x + 1) % msgs.length), 1800);
    return () => clearInterval(id);
  }, [msgs.length]);
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 20, display: 'inline-block', animation: 'spinY 3s linear infinite' }}>🪐</div>
      <style>{`@keyframes spinY{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}`}</style>
      <p style={{ color: GOLD, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        {hi ? 'रिपोर्ट तैयार हो रही है...' : 'Preparing your report…'}
      </p>
      <AnimatePresence mode="wait">
        <motion.p key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }} style={{ color: DIM, fontSize: 13 }}>
          {msgs[s]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ── STEP 5 — Success ───────────────────────────────────────────────────────────
function Step5({ email, hi }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
      <h2 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 22, marginBottom: 8 }}>
        {hi ? 'भुगतान सफल! रिपोर्ट भेज दी गई।' : 'Payment Successful!'}
      </h2>
      <p style={{ color: DIM, fontSize: 14, marginBottom: 6 }}>
        {hi ? 'आपकी उपाय रिपोर्ट PDF और खाता सेटअप लिंक भेजे गए हैं:' : 'Your remedy report PDF and account setup link have been sent to:'}
      </p>
      <p style={{ color: IVORY, fontWeight: 700, fontSize: 15, marginBottom: 28 }}>{email}</p>

      <div style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 10, padding: '18px 20px', textAlign: 'left', marginBottom: 24 }}>
        <p style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
          {hi ? 'अगले कदम:' : 'What to do next:'}
        </p>
        {[
          {
            n: '1',
            t: hi ? '📄 रिपोर्ट डाउनलोड करें' : '📄 Download your remedy report',
            d: hi ? 'पहला ईमेल देखें — PDF संलग्न है।' : 'Open your first email — the PDF is attached.',
          },
          {
            n: '2',
            t: hi ? '🔐 पासवर्ड सेट करें' : '🔐 Set your account password',
            d: hi ? 'दूसरे ईमेल में "Set My Password →" पर क्लिक करें।' : 'Click "Set My Password →" in your second email.',
          },
          {
            n: '3',
            t: hi ? '✉️ ईमेल सत्यापित करें' : '✉️ Verify your email',
            d: hi ? 'उसी ईमेल में सत्यापन लिंक भी है — एक क्लिक में पूरा हो जाएगा।' : 'The verify link is in the same email — one click and you\'re done.',
          },
          {
            n: '4',
            t: hi ? '🌟 Basic Plan पहले से एक्टिव है' : '🌟 Basic plan is already active',
            d: hi ? 'लॉगिन करें और पूर्ण Kundli, भविष्यवाणी और दशा विश्लेषण देखें।' : 'Log in to explore your full Kundli, predictions, and Dasha analysis.',
          },
        ].map(item => (
          <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: GOLD, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.n}</span>
            <div>
              <p style={{ color: IVORY, fontWeight: 600, fontSize: 13, margin: 0 }}>{item.t}</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>{item.d}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: DIM, fontSize: 12 }}>
        {hi ? 'कोई समस्या? ' : 'Questions? '}
        <a href="mailto:support@jyotishstack.com" style={{ color: GOLD }}>support@jyotishstack.com</a>
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RemedyPackage() {
  const [step,     setStep]    = useState(1); // 1 | 2 | 3 | 4 | 5
  const [paying,   setPaying]  = useState(false);
  const [planInfo, setPlanInfo]= useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', lang: 'en',
    date_of_birth: '', time_of_birth: '', place_of_birth: '',
    latitude: '', longitude: '', timezone_offset: '5.5',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hi  = form.lang === 'hi';

  // Fetch plan info when arriving at Step 3
  useEffect(() => {
    if (step !== 3) return;
    api.get('/subscriptions/plans').then(({ data }) => {
      const basic = (data.plans || []).find(p => String(p.name || '').toLowerCase() === 'basic');
      if (basic) setPlanInfo(basic);
    }).catch(() => {});
  }, [step]);

  const handlePay = async () => {
    setPaying(true);
    try {
      // 1. Create Razorpay order (also guards duplicate email)
      let orderData;
      try {
        const { data } = await api.post('/remedy/order', { email: form.email.trim().toLowerCase() });
        orderData = data;
      } catch (ex) {
        const msg = ex.response?.data?.message || (hi ? 'ऑर्डर बनाने में त्रुटि।' : 'Failed to create order. Please try again.');
        toast.error(msg);
        setPaying(false);
        if (ex.response?.status === 409) setStep(1); // nudge back to email field
        return;
      }

      // 2. Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error(hi ? 'Razorpay लोड नहीं हुआ। पुनः प्रयास करें।' : 'Could not load payment gateway. Please try again.');
        setPaying(false);
        return;
      }

      // 3. Open Razorpay modal with pre-filled email + phone
      await new Promise((resolve) => {
        const modal = new window.Razorpay({
          key:         orderData.key_id,
          order_id:    orderData.order_id,
          amount:      orderData.amount,
          currency:    orderData.currency || 'INR',
          name:        'Jyotish Stack AI',
          description: 'Vedic Remedy Report + Basic Plan (1 year)',
          prefill: {
            name:    form.name.trim(),
            email:   form.email.trim(),
            contact: form.phone.trim() || undefined,
          },
          theme: { color: '#D4AF37' },
          handler: async (response) => {
            // 4. Payment done — generate report + create basic account
            setStep(4); // processing spinner
            try {
              await api.post('/remedy/submit', {
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
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                plan_id:         orderData.plan_id,
              });
              setStep(5); // success
            } catch (err) {
              const msg = err.response?.data?.message
                || (hi
                  ? `रिपोर्ट बनाने में त्रुटि। Payment ID: ${response.razorpay_payment_id} के साथ हमसे संपर्क करें।`
                  : `Failed to generate report. Contact us with Payment ID: ${response.razorpay_payment_id}`);
              toast.error(msg, { duration: 10000 });
              setStep(3);
            } finally {
              setPaying(false);
            }
            resolve();
          },
          modal: {
            ondismiss: () => { setPaying(false); resolve(); },
          },
        });
        modal.open();
      });
    } catch (ex) {
      console.error('[RemedyPackage/handlePay]', ex);
      toast.error(hi ? 'कुछ गलत हुआ। पुनः प्रयास करें।' : 'Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  const STEP_LABELS = [
    hi ? 'व्यक्तिगत जानकारी' : 'Personal Info',
    hi ? 'जन्म विवरण'        : 'Birth Details',
    hi ? 'भुगतान'             : 'Payment',
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
            {hi ? 'वैदिक उपाय रिपोर्ट + Basic Plan' : 'Vedic Remedy Report + Basic Plan'}
          </h1>
          <p style={{ color: DIM, fontSize: 15, maxWidth: 460, margin: '0 auto' }}>
            {hi
              ? 'अपना जन्म विवरण दें, भुगतान करें — तुरंत PDF रिपोर्ट और एक वर्ष की Basic Plan एक्सेस पाएं।'
              : 'Enter your birth details, complete payment — receive your remedy PDF instantly and get one year of Basic plan access.'}
          </p>
        </div>

        {/* Progress — steps 1-3 only */}
        {step <= 3 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 32, alignItems: 'center', justifyContent: 'center' }}>
            {[1, 2, 3].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${step >= s ? GOLD : 'rgba(255,255,255,0.12)'}`,
                  color: step >= s ? GOLD : DIM, fontSize: 12, fontWeight: 700,
                }}>{s}</div>
                <span style={{ fontSize: 11, color: step >= s ? GOLD : DIM }}>{STEP_LABELS[i]}</span>
                {s < 3 && <div style={{ width: 22, height: 1, background: step > s ? GOLD : 'rgba(255,255,255,0.1)' }} />}
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
                <Step2 data={form} onChange={set} onNext={() => setStep(3)} onBack={() => setStep(1)} hi={hi} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <Step3 form={form} planInfo={planInfo} onPay={handlePay} onBack={() => setStep(2)} paying={paying} hi={hi} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Step4 hi={hi} />
              </motion.div>
            )}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                <Step5 email={form.email} hi={hi} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust badges */}
        {step <= 3 && (
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { icon: '🔒', t: hi ? 'सुरक्षित भुगतान' : 'Secure Payment'   },
              { icon: '📄', t: hi ? 'तुरंत PDF ईमेल'  : 'Instant PDF Email' },
              { icon: '🌟', t: hi ? '1 वर्ष Basic Plan': '1 Year Basic Plan' },
              { icon: '🔮', t: hi ? 'पूर्ण Kundli'     : 'Full Kundli Access'},
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
