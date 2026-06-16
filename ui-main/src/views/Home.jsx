'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

const T = {
  tagline:    ['Ancient Wisdom. Modern Intelligence.','प्राचीन ज्ञान। आधुनिक बुद्धि।'],
  h1:         ['Jyotish Stack AI','ज्योतिष स्टैक AI'],
  sub:        ['Where 5,000 years of Vedic astrology meets artificial intelligence. Kundli, Dasha, and cosmic destiny — decoded precisely.','जहाँ 5,000 वर्षों की वैदिक ज्योतिष AI से मिलती है। कुंडली, दशा और भाग्य — सटीक विश्लेषण।'],
  cta1:       ['Start for Free','निःशुल्क शुरू करें'],
  cta2:       ['Create Kundli','कुंडली बनाएं'],
  feat_h:     ['Our Services','हमारी सेवाएं'],
  feat_s:     ['Complete Vedic astrology — powered by AI','AI की शक्ति से वैदिक ज्योतिष की सम्पूर्ण सेवाएं'],
  price_h:    ['Pricing Plans','मूल्य योजनाएं'],
  price_s:    ['Choose the plan that fits your journey','अपनी यात्रा के अनुसार योजना चुनें'],
  popular:    ['Most Popular','सबसे लोकप्रिय'],
  start:      ['Get Started','अभी शुरू करें'],
};
const t = (key, lang) => T[key]?.[lang === 'hi' ? 1 : 0] || '';

const FEATURES = [
  { icon:'🪐', en:'Kundli Chart',       hi:'कुंडली चार्ट',    de:'Vedic birth chart with 12 houses, planets & Navamsha.', dh:'12 भावों और नवांश के साथ वैदिक जन्म कुंडली।', href:'/kundli' },
  { icon:'💫', en:'Bhavishya Vani',     hi:'भविष्यवाणी',       de:'AI-powered daily, weekly & monthly predictions.',      dh:'AI-संचालित दैनिक, साप्ताहिक भविष्यवाणी।', href:'/predictions' },
  { icon:'💍', en:'Kundli Matching',    hi:'विवाह मिलान',      de:'Guna Milan, Mangal Dosha & full compatibility.',       dh:'गुण मिलान, मंगल दोष और अनुकूलता।', href:'/matchmaking' },
  { icon:'⏳', en:'Dasha Analysis',     hi:'दशा विश्लेषण',     de:'Vimshottari Dasha — life phase by phase.',             dh:'विंशोत्तरी दशा — जीवन चरण विश्लेषण।', href:'/predictions' },
  { icon:'🔱', en:'Nakshatra Report',   hi:'नक्षत्र रिपोर्ट',  de:'27 Nakshatras — personality, career & spirit.',        dh:'27 नक्षत्र — व्यक्तित्व और करियर।', href:'/kundli' },
  { icon:'🌙', en:'Transit Forecast',   hi:'गोचर भविष्यवाणी', de:'Real-time planetary transits on your chart.',           dh:'वास्तविक समय ग्रह गोचर फल।', href:'/predictions' },
];

const PLANS = [
  {
    en:'Basic', hi:'आधारभूत', price:'₹200', pe:'/month', ph:'/माह', hot:false,
    cta_en:'Get Started', cta_hi:'अभी शुरू करें',
    feats:[
      { en:'1 Kundli profile',    hi:'1 कुंडली प्रोफ़ाइल' },
      { en:'Daily prediction',    hi:'दैनिक भविष्यवाणी' },
      { en:'Basic matchmaking',   hi:'बेसिक विवाह मिलान' },
      { en:'No PDF download',     hi:'PDF डाउनलोड शामिल नहीं' },
    ],
  },
  {
    en:'Premium', hi:'प्रीमियम', price:'₹499', pe:'/month', ph:'/माह', hot:true,
    cta_en:'Get Premium', cta_hi:'प्रीमियम लें',
    feats:[
      { en:'5 Kundli profiles',      hi:'5 कुंडली प्रोफ़ाइल' },
      { en:'PDF download',           hi:'PDF डाउनलोड' },
      { en:'All prediction types',   hi:'सभी भविष्यवाणी प्रकार' },
      { en:'Advanced matchmaking',   hi:'उन्नत विवाह मिलान' },
      { en:'Dasha analysis',         hi:'दशा विश्लेषण' },
      { en:'Transit report',         hi:'गोचर रिपोर्ट' },
    ],
  },
  {
    en:'Yearly', hi:'वार्षिक', price:'₹3,999', pe:'/year', ph:'/वर्ष', hot:false,
    cta_en:'Get Yearly', cta_hi:'वार्षिक योजना लें',
    feats:[
      { en:'Up to 50 Kundli profiles',  hi:'50 तक कुंडली प्रोफ़ाइल' },
      { en:'PDF download',              hi:'PDF डाउनलोड' },
      { en:'Every feature included',    hi:'सभी सुविधाएं शामिल' },
      { en:'Priority support',          hi:'प्राथमिकता सहायता' },
      { en:'Muhurta calculator',        hi:'मुहूर्त कैलकुलेटर' },
      { en:'Gemstone & remedy advice',  hi:'रत्न एवं उपाय परामर्श' },
    ],
  },
];

const fadeUp = { hidden:{ opacity:0, y:28 }, show:{ opacity:1, y:0, transition:{ duration:0.55 } } };
const stag   = { show:{ transition:{ staggerChildren:0.09 } } };

// ─── Testimonials Section ────────────────────────────────────────────────────
function TestimonialsSection({ lang }) {
  const hi = lang === 'hi';
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/public/testimonials')
      .then(r => r.json())
      .then(d => setItems(d.data?.testimonials || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="relative z-10 py-24 px-6">
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
          className="text-center mb-14">
          <h2 className="section-title mb-3">{hi ? 'हमारे उपयोगकर्ता क्या कहते हैं' : 'What Our Users Say'}</h2>
          <p style={{ color:DIM }}>{hi ? 'हजारों संतुष्ट उपयोगकर्ताओं का विश्वास' : 'Trusted by thousands of satisfied users'}</p>
          <div className="w-16 h-0.5 bg-gold mx-auto mt-5 rounded-full" />
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
          {items.map((t, i) => (
            <motion.div key={t.id} variants={fadeUp}
              style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.12)',
                borderRadius:14, padding:'22px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                {t.avatar_url
                  ? <img src={t.avatar_url} alt={t.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                  : <div style={{ width:44, height:44, borderRadius:'50%', background:`${GOLD}20`,
                      border:`1px solid ${GOLD}40`, display:'flex', alignItems:'center',
                      justifyContent:'center', color:GOLD, fontFamily:'Georgia,serif',
                      fontWeight:700, fontSize:17 }}>
                      {(t.name || '?')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <p style={{ color:IVORY, fontFamily:'Georgia,serif', fontWeight:600, fontSize:14 }}>{t.name}</p>
                  {(t.role || t.location) && (
                    <p style={{ color:DIM, fontSize:11 }}>
                      {[t.role, t.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                {t.rating > 0 && (
                  <span style={{ marginLeft:'auto', color:GOLD, fontSize:12, letterSpacing:1 }}>
                    {'★'.repeat(Math.min(5, t.rating))}
                  </span>
                )}
              </div>
              <p style={{ color:DIM, fontSize:13, lineHeight:1.75, fontStyle:'italic', fontFamily:'Georgia,serif' }}>
                "{t.content}"
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Team Section ─────────────────────────────────────────────────────────────
function TeamSection({ lang }) {
  const hi = lang === 'hi';
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetch('/api/public/team')
      .then(r => r.json())
      .then(d => setMembers(d.data?.members || []))
      .catch(() => {});
  }, []);

  if (members.length === 0) return null;

  return (
    <section className="relative z-10 py-20 px-6">
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
          className="text-center mb-14">
          <h2 className="section-title mb-3">{hi ? 'हमारी टीम' : 'Our Team'}</h2>
          <p style={{ color:DIM }}>{hi ? 'अनुभवी ज्योतिषी और AI विशेषज्ञ' : 'Experienced astrologers and AI specialists'}</p>
          <div className="w-16 h-0.5 bg-gold mx-auto mt-5 rounded-full" />
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
          style={{ display:'flex', flexWrap:'wrap', gap:20, justifyContent:'center' }}>
          {members.map(m => (
            <motion.div key={m.id} variants={fadeUp}
              style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.1)',
                borderRadius:14, padding:'28px 24px', textAlign:'center', width:220, flexShrink:0 }}>
              {m.avatar_url
                ? <img src={m.avatar_url} alt={m.name} style={{ width:72, height:72, borderRadius:'50%',
                    objectFit:'cover', margin:'0 auto 14px', border:`2px solid ${GOLD}30` }} />
                : <div style={{ width:72, height:72, borderRadius:'50%', background:`${GOLD}15`,
                    border:`2px solid ${GOLD}30`, display:'flex', alignItems:'center',
                    justifyContent:'center', color:GOLD, fontFamily:'Georgia,serif',
                    fontWeight:700, fontSize:26, margin:'0 auto 14px' }}>
                    {(m.name || '?')[0].toUpperCase()}
                  </div>
              }
              <p style={{ color:IVORY, fontFamily:'Georgia,serif', fontWeight:700, fontSize:15, marginBottom:4 }}>{m.name}</p>
              {m.role && <p style={{ color:GOLD, fontSize:12, marginBottom:8, fontWeight:600 }}>{m.role}</p>}
              {m.bio && <p style={{ color:DIM, fontSize:11, lineHeight:1.65, marginBottom:12 }}>{m.bio}</p>}
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                {m.linkedin && (
                  <a href={m.linkedin} target="_blank" rel="noreferrer"
                    style={{ color:DIM, fontSize:11, textDecoration:'none' }}>💼 LinkedIn</a>
                )}
                {m.twitter && (
                  <a href={m.twitter} target="_blank" rel="noreferrer"
                    style={{ color:DIM, fontSize:11, textDecoration:'none' }}>𝕏 Twitter</a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Contact Section ──────────────────────────────────────────────────────────
function ContactSection({ lang }) {
  const hi = lang === 'hi';
  const [form, setForm]     = useState({ name:'', email:'', department:'general', subject:'', message:'' });
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [errMsg, setErrMsg] = useState('');

  const DEPARTMENTS = [
    { value:'general', en:'General Inquiry',   hi:'सामान्य पूछताछ' },
    { value:'sales',   en:'Sales',             hi:'बिक्री' },
    { value:'team',    en:'Support',           hi:'सहायता' },
    { value:'account', en:'Account & Billing', hi:'खाता एवं भुगतान' },
  ];

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch('/api/public/contact', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message || 'Failed');
      setStatus('done');
      setForm({ name:'', email:'', department:'general', subject:'', message:'' });
    } catch (e) {
      setErrMsg(e.message);
      setStatus('error');
    }
  };

  const inp = {
    width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
    borderRadius:8, color:IVORY, fontSize:13, padding:'11px 14px', boxSizing:'border-box',
    outline:'none', fontFamily:'inherit',
  };

  return (
    <section className="relative z-10 py-20 px-6">
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
          className="text-center mb-12">
          <h2 className="section-title mb-3">{hi ? 'संपर्क करें' : 'Contact Us'}</h2>
          <p style={{ color:DIM }}>{hi ? 'हम आपकी सहायता के लिए यहाँ हैं' : "We're here to help"}</p>
          <div className="w-16 h-0.5 bg-gold mx-auto mt-5 rounded-full" />
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
          style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.14)',
            borderRadius:16, padding:'36px 40px' }}>

          {status === 'done' ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <p style={{ fontSize:52, marginBottom:14 }}>✅</p>
              <h3 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:20, marginBottom:8 }}>
                {hi ? 'संदेश भेजा गया!' : 'Message Sent!'}
              </h3>
              <p style={{ color:DIM, fontSize:13, marginBottom:20 }}>
                {hi ? 'हम जल्द ही आपसे संपर्क करेंगे।' : "We'll get back to you soon."}
              </p>
              <button onClick={() => setStatus('idle')} style={{
                background:'transparent', border:`1px solid ${GOLD}40`, color:GOLD,
                borderRadius:8, fontSize:13, padding:'8px 20px', cursor:'pointer',
              }}>
                {hi ? 'नया संदेश' : 'Send another'}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>
                    {hi ? 'नाम *' : 'Name *'}
                  </label>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                    required placeholder={hi ? 'आपका नाम' : 'Your name'} style={inp} />
                </div>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>
                    {hi ? 'ईमेल *' : 'Email *'}
                  </label>
                  <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                    required placeholder="you@example.com" style={inp} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>
                    {hi ? 'विषय श्रेणी' : 'Topic'}
                  </label>
                  <select value={form.department}
                    onChange={e => setForm(f=>({...f,department:e.target.value}))}
                    style={{ ...inp, appearance:'auto', cursor:'pointer' }}>
                    {DEPARTMENTS.map(d => (
                      <option key={d.value} value={d.value} style={{ background:'#0B0D1A', color:IVORY }}>
                        {hi ? d.hi : d.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>
                    {hi ? 'विषय' : 'Subject'}
                  </label>
                  <input value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))}
                    placeholder={hi ? 'विषय लिखें' : 'Subject'} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>
                  {hi ? 'संदेश *' : 'Message *'}
                </label>
                <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))}
                  required rows={5}
                  placeholder={hi ? 'अपना संदेश लिखें…' : 'Write your message…'}
                  style={{ ...inp, resize:'vertical' }} />
              </div>

              {status === 'error' && (
                <p style={{ color:'#EF4444', fontSize:12 }}>⚠ {errMsg || (hi ? 'त्रुटि हुई।' : 'Something went wrong.')}</p>
              )}

              <button type="submit" disabled={status === 'sending'} style={{
                background:`linear-gradient(135deg, #B8952A, ${GOLD})`,
                color:'#06070F', border:'none', borderRadius:8,
                fontWeight:800, fontSize:14, padding:'13px 24px',
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                opacity: status === 'sending' ? 0.7 : 1,
              }}>
                {status === 'sending'
                  ? (hi ? 'भेजा जा रहा है…' : 'Sending…')
                  : (hi ? 'संदेश भेजें ✦' : 'Send Message ✦')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default function Home({ scrollTo }) {
  const { lang } = useLang();
  const pRef = useRef(null);
  useEffect(() => {
    if (scrollTo === 'pricing') pRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [scrollTo]);

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background:'radial-gradient(ellipse at top, #181C35 0%, #0B0D1A 60%, #06070F 100%)' }}>
      <StarField count={160} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 min-h-screen">
        {/* Deep-indigo ambient blob */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width:600, height:600, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(61,53,128,0.22) 0%, transparent 70%)' }} />
        </div>

        <motion.div initial="hidden" animate="show" variants={stag}
          className="relative flex flex-col items-center max-w-4xl w-full">

          {/* Pill badge */}
          <motion.span variants={fadeUp}
            className="inline-flex items-center gap-2 border border-gold/30 bg-gold/5 rounded-full px-5 py-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
            <span className="text-saffron text-xs tracking-widest uppercase font-medium font-devanagari">
              {t('tagline', lang)}
            </span>
          </motion.span>

          {/* Headline */}
          <motion.h1 variants={fadeUp}
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-gradient-gold">{t('h1', lang)}</span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp}
            className="text-ivory/60 text-lg md:text-xl leading-relaxed max-w-2xl mb-12 font-devanagari">
            {t('sub', lang)}
          </motion.p>

          {/* Buttons */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center mb-20">
            <Link href="/register" className="btn-gold text-base px-8 py-4 font-semibold shadow-gold">
              {t('cta1', lang)}
            </Link>
            <Link href="/kundli" className="btn-outline-gold text-base px-8 py-4 font-semibold">
              {t('cta2', lang)}
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={fadeUp}
            className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full max-w-xl">
            {[['10K+','Kundlis','कुंडलियां'],['50K+','Predictions','भविष्यवाणियां'],['27','Nakshatras','नक्षत्र'],['99.8%','Accuracy','सटीकता']].map(([v,en,hi])=>(
              <div key={v} className="text-center">
                <p className="font-serif text-3xl font-bold text-gradient-gold">{v}</p>
                <p className="text-ivory/40 text-xs mt-1 tracking-wide">{lang==='hi'?hi:en}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-8xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
            className="text-center mb-14">
            <h2 className="section-title mb-3">{t('feat_h', lang)}</h2>
            <p className="text-ivory/50 max-w-xl mx-auto">{t('feat_s', lang)}</p>
            <div className="w-16 h-0.5 bg-gold mx-auto mt-5 rounded-full" />
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f,i)=>(
              <motion.div key={i} variants={fadeUp}>
                <Link href={f.href}
                  className="card-royal p-7 flex flex-col h-full group block
                             hover:border-gold/50 hover:-translate-y-1 transition-all duration-300">
                  <span className="text-4xl mb-4 block">{f.icon}</span>
                  <h3 className="font-serif text-gold text-lg font-semibold mb-2">
                    {lang==='hi'?f.hi:f.en}
                  </h3>
                  <p className="text-ivory/55 text-sm leading-relaxed flex-1 font-devanagari">
                    {lang==='hi'?f.dh:f.de}
                  </p>
                  <p className="text-gold/40 group-hover:text-gold text-xs mt-4 transition-colors">
                    {lang==='hi'?'अधिक जानें →':'Learn more →'}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Thin gold divider */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="divider-gold" />
      </div>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section ref={pRef} id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
            className="text-center mb-14">
            <h2 className="section-title mb-3">{t('price_h', lang)}</h2>
            <p className="text-ivory/50">{t('price_s', lang)}</p>
            <div className="w-16 h-0.5 bg-gold mx-auto mt-5 rounded-full" />
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {PLANS.map((p,i)=>(
              <motion.div key={i} variants={fadeUp}
                className={`card-royal p-8 flex flex-col relative ${
                  p.hot ? 'border-gold/55 shadow-gold-lg md:scale-105 md:z-10' : ''
                }`}>
                {p.hot && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold text-cosmos-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    {t('popular', lang)}
                  </span>
                )}

                <p className="font-serif text-ivory text-xl font-semibold mb-1">{lang==='hi'?p.hi:p.en}</p>
                <div className="flex items-baseline gap-1 my-4">
                  <span className={`font-serif text-4xl font-bold ${p.hot?'text-gradient-gold':'text-ivory'}`}>{p.price}</span>
                  <span className="text-ivory/40 text-sm">{lang==='hi'?p.ph:p.pe}</span>
                </div>

                <ul className="space-y-2.5 text-sm text-ivory/65 flex-1 mb-8">
                  {p.feats.map(f=>(
                    <li key={f.en} className="flex items-start gap-2">
                      <span className="text-gold text-xs mt-0.5 shrink-0">✦</span>
                      <span className="font-devanagari">{lang==='hi' ? f.hi : f.en}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register"
                  className={`text-center py-3 rounded-sm text-sm font-semibold block transition-all ${
                    p.hot ? 'btn-gold shadow-gold' : 'btn-outline-gold'
                  }`}>
                  {lang==='hi' ? p.cta_hi : p.cta_en}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <TestimonialsSection lang={lang} />

      {/* ── TEAM ──────────────────────────────────────────────────────────── */}
      <TeamSection lang={lang} />

      {/* ── CONTACT ───────────────────────────────────────────────────────── */}
      <ContactSection lang={lang} />

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
          className="max-w-3xl mx-auto text-center card-royal p-10 border-gold/25">
          <p className="text-5xl mb-5">🔱</p>
          <h3 className="font-serif text-2xl md:text-3xl text-gradient-gold font-bold mb-4">
            {lang==='hi'?'अपनी ब्रह्मांडीय यात्रा शुरू करें':'Begin Your Cosmic Journey'}
          </h3>
          <p className="text-ivory/55 mb-8 font-devanagari">
            {lang==='hi'
              ?'आज ही निःशुल्क खाता बनाएं और अपनी पहली कुंडली देखें।'
              :"Create your free account today and discover your Vedic birth chart."}
          </p>
          <Link href="/register" className="btn-gold text-base px-10 py-4 inline-block shadow-gold font-semibold">
            {lang==='hi'?'अभी शुरू करें — निःशुल्क':"Get Started — It's Free"}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
