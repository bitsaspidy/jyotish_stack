'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

const T = {
  tagline:  ['Ancient Wisdom. Modern Intelligence.','प्राचीन ज्ञान। आधुनिक बुद्धि।'],
  h1:       ['Jyotish Stack AI','ज्योतिष स्टैक AI'],
  sub:      ['Where 5,000 years of Vedic astrology meets artificial intelligence. Kundli, Dasha, and cosmic destiny — decoded precisely.','जहाँ 5,000 वर्षों की वैदिक ज्योतिष AI से मिलती है। कुंडली, दशा और भाग्य — सटीक विश्लेषण।'],
  cta1:     ['Start for Free','निःशुल्क शुरू करें'],
  cta2:     ['Create Kundli','कुंडली बनाएं'],
  feat_h:   ['Our Services','हमारी सेवाएं'],
  feat_s:   ['Complete Vedic astrology — powered by AI','AI की शक्ति से वैदिक ज्योतिष की सम्पूर्ण सेवाएं'],
  how_h:    ['How It Works','यह कैसे काम करता है'],
  how_s:    ['Your cosmic journey in three simple steps','तीन आसान चरणों में आपकी ब्रह्मांडीय यात्रा'],
  price_h:  ['Pricing Plans','मूल्य योजनाएं'],
  price_s:  ['Choose the plan that fits your journey','अपनी यात्रा के अनुसार योजना चुनें'],
  popular:  ['Most Popular','सबसे लोकप्रिय'],
};
const t = (key, lang) => translate(lang, T[key]?.[0] || '', T[key]?.[1]);

const FEATURES = [
  { icon:'🪐', en:'Kundli Chart',      hi:'कुंडली चार्ट',    de:'Vedic birth chart with 12 houses, planets & Navamsha.', dh:'12 भावों और नवांश के साथ वैदिक जन्म कुंडली।', href:'/kundli' },
  { icon:'💫', en:'Bhavishya Vani',    hi:'भविष्यवाणी',       de:'AI-powered daily, weekly & monthly predictions.',      dh:'AI-संचालित दैनिक, साप्ताहिक भविष्यवाणी।', href:'/predictions' },
  { icon:'💍', en:'Kundli Matching',   hi:'विवाह मिलान',      de:'Guna Milan, Mangal Dosha & full compatibility.',       dh:'गुण मिलान, मंगल दोष और अनुकूलता।', href:'/matchmaking' },
  { icon:'⏳', en:'Dasha Analysis',    hi:'दशा विश्लेषण',     de:'Vimshottari Dasha — life phase by phase.',             dh:'विंशोत्तरी दशा — जीवन चरण विश्लेषण।', href:'/predictions' },
  { icon:'🔱', en:'Nakshatra Report',  hi:'नक्षत्र रिपोर्ट',  de:'27 Nakshatras — personality, career & spirit.',        dh:'27 नक्षत्र — व्यक्तित्व और करियर।', href:'/kundli' },
  { icon:'🌙', en:'Transit Forecast',  hi:'गोचर भविष्यवाणी', de:'Real-time planetary transits on your chart.',           dh:'वास्तविक समय ग्रह गोचर फल।', href:'/predictions' },
];

const HOW_IT_WORKS = [
  {
    step:'01', icon:'✨',
    en:'Create Free Account',    hi:'निःशुल्क खाता बनाएं',
    de:'Register in seconds — no credit card required to get started.',
    dh:'कुछ सेकंड में रजिस्टर करें — शुरू करने के लिए क्रेडिट कार्ड आवश्यक नहीं।',
  },
  {
    step:'02', icon:'📍',
    en:'Enter Birth Details',    hi:'जन्म विवरण दर्ज करें',
    de:'Provide your name, date, time, and place of birth for an accurate chart.',
    dh:'सटीक कुंडली के लिए अपना नाम, जन्म तिथि, समय और स्थान दर्ज करें।',
  },
  {
    step:'03', icon:'🔱',
    en:'Discover Your Destiny',  hi:'अपना भाग्य जानें',
    de:'Receive your complete Kundli, Dasha timeline, predictions, and life guidance.',
    dh:'अपनी पूर्ण कुंडली, दशा, भविष्यवाणी और जीवन मार्गदर्शन प्राप्त करें।',
  },
];

const PLANS = [
  {
    tier:'basic',
    en:'Basic', hi:'आधारभूत', price:'₹200', pe:'/month', ph:'/माह', hot:false,
    cta_en:'Get Started', cta_hi:'अभी शुरू करें',
    feats:[
      { en:'1 Kundli profile',    hi:'1 कुंडली प्रोफ़ाइल' },
      { en:'Full chart analysis', hi:'पूर्ण चार्ट विश्लेषण' },
      { en:'Daily prediction',    hi:'दैनिक भविष्यवाणी' },
      { en:'Basic matchmaking',   hi:'बेसिक विवाह मिलान' },
      { en:'No PDF download',     hi:'PDF डाउनलोड शामिल नहीं' },
    ],
  },
  {
    tier:'premium',
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
    tier:'yearly',
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

const STATS = [
  { value:'10K+', en:'Kundlis',      hi:'कुंडलियां' },
  { value:'50K+', en:'Predictions',  hi:'भविष्यवाणियां' },
  { value:'27',   en:'Nakshatras',   hi:'नक्षत्र' },
  { value:'99.8%',en:'Accuracy',     hi:'सटीकता' },
];

const fadeUp = { hidden:{ opacity:0, y:28 }, show:{ opacity:1, y:0, transition:{ duration:0.55 } } };
const fadeIn  = { hidden:{ opacity:0 },      show:{ opacity:1, transition:{ duration:0.7 } } };
const stag    = { show:{ transition:{ staggerChildren:0.09 } } };
const stagSlow= { show:{ transition:{ staggerChildren:0.15 } } };

// ── Orbital rings decoration ──────────────────────────────────────────────────
function OrbitalRings({ className = '' }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden ${className}`}>
      {[700, 520, 360, 220].map((size, i) => (
        <div key={size} style={{
          position:'absolute', width:size, height:size, borderRadius:'50%',
          border:`1px solid rgba(212,175,55,${0.08 - i * 0.015})`,
        }}
        className={i % 2 === 0 ? 'animate-spin-slow' : 'animate-spin-rev'}
        />
      ))}
      {/* Glowing accent dots on one ring */}
      {[0, 120, 240].map((deg, i) => (
        <div key={deg} style={{
          position:'absolute', width:4, height:4, borderRadius:'50%',
          background:GOLD, opacity:0.55,
          transform:`rotate(${deg}deg) translateX(260px)`,
          animation:`spin-slow 30s linear infinite`,
          animationDelay:`${i * -10}s`,
          filter:'blur(0.5px)',
        }} />
      ))}
    </div>
  );
}

// ── Floating accent dots ──────────────────────────────────────────────────────
function FloatingDots() {
  const dots = [
    { w:10, h:10, top:'18%', left:'10%',  delay:'0s',   dur:6, color:GOLD },
    { w:6,  h:6,  top:'30%', left:'6%',   delay:'1.2s', dur:8, color:'#9B89F0' },
    { w:7,  h:7,  top:'60%', right:'8%',  delay:'0.5s', dur:5, color:GOLD },
    { w:5,  h:5,  top:'75%', left:'18%',  delay:'2s',   dur:7, color:'#F0D060' },
    { w:8,  h:8,  top:'45%', right:'15%', delay:'1.5s', dur:6.5, color:GOLD },
    { w:4,  h:4,  top:'22%', right:'22%', delay:'0.8s', dur:9, color:'#9B89F0' },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((d, i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', background:d.color,
          width:d.w, height:d.h, top:d.top, left:d.left, right:d.right,
          animation:`float ${d.dur}s ease-in-out infinite`,
          animationDelay:d.delay, opacity:0.45,
        }} />
      ))}
    </div>
  );
}

// ── Section heading helper ────────────────────────────────────────────────────
function SectionHead({ title, sub }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
      className="text-center mb-14">
      <h2 className="section-title mb-3">{title}</h2>
      <p style={{ color:DIM }} className="font-devanagari">{sub}</p>
      <div className="w-16 h-0.5 bg-gold mx-auto mt-5 rounded-full" />
    </motion.div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorksSection({ lang }) {
  const hi = lang === 'hi';
  return (
    <section className="relative z-10 py-20 px-6">
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <SectionHead title={t('how_h', lang)} sub={t('how_s', lang)} />
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagSlow}
          className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="relative">
              {/* Connector line on desktop (not last) */}
              {i < 2 && (
                <div className="hidden md:block absolute top-10 z-10"
                  style={{ left:'calc(50% + 60px)', width:'calc(100% - 60px)', height:1,
                    background:'linear-gradient(90deg, rgba(212,175,55,0.35), transparent)' }} />
              )}
              <div className="text-center p-8 rounded-xl h-full transition-all duration-300 hover:-translate-y-1"
                style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.12)',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
                <div className="relative inline-block mb-5">
                  <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto',
                    background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.22)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                    {s.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 text-[10px] font-bold leading-none"
                    style={{ color:'rgba(212,175,55,0.5)', fontFamily:'Georgia,serif' }}>{s.step}</span>
                </div>
                <h3 className="font-serif font-semibold mb-3" style={{ color:GOLD, fontSize:15 }}>
                  {translate(lang, s.en, s.hi)}
                </h3>
                <p className="font-devanagari text-sm leading-relaxed" style={{ color:DIM }}>
                  {translate(lang, s.de, s.dh)}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function TestimonialsSection({ lang }) {
  const hi = lang === 'hi';
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch('/api/public/testimonials').then(r => r.json())
      .then(d => setItems(d.data?.testimonials || [])).catch(() => {});
  }, []);
  if (items.length === 0) return null;
  return (
    <section className="relative z-10 py-24 px-6">
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <SectionHead
          title={translate(lang, 'What Our Users Say', 'हमारे उपयोगकर्ता क्या कहते हैं')}
          sub={translate(lang, 'Trusted by thousands of satisfied users', 'हजारों संतुष्ट उपयोगकर्ताओं का विश्वास')}
        />
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
          {items.map(item => (
            <motion.div key={item.id} variants={fadeUp}
              style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.1)',
                borderRadius:14, padding:'22px 24px', transition:'border-color 0.25s' }}
              className="hover:border-gold/25">
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                {item.avatar_url
                  ? <img src={item.avatar_url} alt={item.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                  : <div style={{ width:44, height:44, borderRadius:'50%', background:`${GOLD}20`,
                      border:`1px solid ${GOLD}40`, display:'flex', alignItems:'center',
                      justifyContent:'center', color:GOLD, fontFamily:'Georgia,serif', fontWeight:700, fontSize:17 }}>
                      {(item.name || '?')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <p style={{ color:IVORY, fontFamily:'Georgia,serif', fontWeight:600, fontSize:14 }}>{item.name}</p>
                  {(item.role || item.location) && (
                    <p style={{ color:DIM, fontSize:11 }}>{[item.role, item.location].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                {item.rating > 0 && (
                  <span style={{ marginLeft:'auto', color:GOLD, fontSize:12, letterSpacing:1 }}>
                    {'★'.repeat(Math.min(5, item.rating))}
                  </span>
                )}
              </div>
              <p style={{ color:DIM, fontSize:13, lineHeight:1.75, fontStyle:'italic', fontFamily:'Georgia,serif' }}>
                "{item.content}"
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Team ──────────────────────────────────────────────────────────────────────
function TeamSection({ lang }) {
  const hi = lang === 'hi';
  const [members, setMembers] = useState([]);
  useEffect(() => {
    fetch('/api/public/team').then(r => r.json())
      .then(d => setMembers(d.data?.members || [])).catch(() => {});
  }, []);
  if (members.length === 0) return null;
  return (
    <section className="relative z-10 py-20 px-6">
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <SectionHead
          title={translate(lang, 'Our Team', 'हमारी टीम')}
          sub={translate(lang, 'Experienced astrologers and AI specialists', 'अनुभवी ज्योतिषी और AI विशेषज्ञ')}
        />
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
          style={{ display:'flex', flexWrap:'wrap', gap:20, justifyContent:'center' }}>
          {members.map(m => (
            <motion.div key={m.id} variants={fadeUp}
              style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.1)',
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
                {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" style={{ color:DIM, fontSize:11, textDecoration:'none' }}>💼 LinkedIn</a>}
                {m.twitter  && <a href={m.twitter}  target="_blank" rel="noreferrer" style={{ color:DIM, fontSize:11, textDecoration:'none' }}>𝕏 Twitter</a>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function ContactSection({ lang }) {
  const hi = lang === 'hi';
  const [form, setForm]     = useState({ name:'', email:'', department:'general', subject:'', message:'' });
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const DEPARTMENTS = [
    { value:'general', en:'General Inquiry',   hi:'सामान्य पूछताछ' },
    { value:'sales',   en:'Sales',             hi:'बिक्री' },
    { value:'team',    en:'Support',           hi:'सहायता' },
    { value:'account', en:'Account & Billing', hi:'खाता एवं भुगतान' },
  ];

  const submit = async (e) => {
    e.preventDefault(); setStatus('sending');
    try {
      const r = await fetch('/api/public/contact', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message || 'Failed');
      setStatus('done');
      setForm({ name:'', email:'', department:'general', subject:'', message:'' });
    } catch (e) { setErrMsg(e.message); setStatus('error'); }
  };

  const inp = {
    width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
    borderRadius:8, color:IVORY, fontSize:13, padding:'11px 14px', boxSizing:'border-box',
    outline:'none', fontFamily:'inherit', transition:'border-color 0.2s',
  };

  return (
    <section className="relative z-10 py-20 px-6">
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <SectionHead
          title={translate(lang, 'Contact Us', 'संपर्क करें')}
          sub={translate(lang, "We're here to help", 'हम आपकी सहायता के लिए यहाँ हैं')}
        />
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}
          style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.14)',
            borderRadius:16, padding:'36px 40px' }}>
          {status === 'done' ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <p style={{ fontSize:52, marginBottom:14 }}>✅</p>
              <h3 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:20, marginBottom:8 }}>
                {translate(lang, 'Message Sent!', 'संदेश भेजा गया!')}
              </h3>
              <p style={{ color:DIM, fontSize:13, marginBottom:20 }}>
                {translate(lang, "We'll get back to you soon.", 'हम जल्द ही आपसे संपर्क करेंगे।')}
              </p>
              <button onClick={() => setStatus('idle')} style={{
                background:'transparent', border:`1px solid ${GOLD}40`, color:GOLD,
                borderRadius:8, fontSize:13, padding:'8px 20px', cursor:'pointer',
              }}>
                {translate(lang, 'Send another', 'नया संदेश')}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>{translate(lang, 'Name *', 'नाम *')}</label>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                    required placeholder={translate(lang, 'Your name', 'आपका नाम')} style={inp} />
                </div>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>{translate(lang, 'Email *', 'ईमेल *')}</label>
                  <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                    required placeholder="you@example.com" style={inp} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>{translate(lang, 'Topic', 'विषय श्रेणी')}</label>
                  <select value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}
                    style={{ ...inp, appearance:'auto', cursor:'pointer' }}>
                    {DEPARTMENTS.map(d => (
                      <option key={d.value} value={d.value} style={{ background:'#0B0D1A', color:IVORY }}>
                        {translate(lang, d.en, d.hi)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>{translate(lang, 'Subject', 'विषय')}</label>
                  <input value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))}
                    placeholder={translate(lang, 'Subject', 'विषय लिखें')} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ color:DIM, fontSize:11, display:'block', marginBottom:5 }}>{translate(lang, 'Message *', 'संदेश *')}</label>
                <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))}
                  required rows={5} placeholder={translate(lang, 'Write your message…', 'अपना संदेश लिखें…')}
                  style={{ ...inp, resize:'vertical' }} />
              </div>
              {status === 'error' && (
                <p style={{ color:'#EF4444', fontSize:12 }}>⚠ {errMsg || (translate(lang, 'Something went wrong.', 'त्रुटि हुई।'))}</p>
              )}
              <button type="submit" disabled={status === 'sending'} style={{
                background:`linear-gradient(135deg, #B8952A, ${GOLD})`,
                color:'#06070F', border:'none', borderRadius:8, fontWeight:800,
                fontSize:14, padding:'13px 24px', cursor:status==='sending'?'not-allowed':'pointer',
                opacity:status==='sending'?0.7:1,
              }}>
                {status==='sending' ? (translate(lang, 'Sending…', 'भेजा जा रहा है…')) : (translate(lang, 'Send Message ✦', 'संदेश भेजें ✦'))}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ── Razorpay script loader ────────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home({ scrollTo }) {
  const { lang } = useLang();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const pRef = useRef(null);
  const [dbPlans, setDbPlans] = useState([]);
  const [paying,  setPaying]  = useState(null); // tier key being purchased

  useEffect(() => {
    if (scrollTo === 'pricing') pRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [scrollTo]);

  // Fetch live plan catalogue once (public endpoint, no auth needed)
  useEffect(() => {
    api.get('/subscriptions/plans')
      .then(({ data }) => setDbPlans(data.plans || []))
      .catch(() => {});
  }, []);

  const handleUpgrade = async (tier) => {
    if (!user) {
      router.push('/register');
      return;
    }

    const dbPlan = dbPlans.find(p => String(p.name).toLowerCase() === tier);
    if (!dbPlan) {
      toast.error('Plan details not loaded yet — please try again.');
      return;
    }

    setPaying(tier);
    try {
      const { data: orderData } = await api.post('/subscriptions/order', { plan_id: dbPlan.id });

      if (orderData.free) {
        const { data: pd } = await api.get('/users/profile');
        setUser(pd.user);
        toast.success('Plan activated!');
        setPaying(null);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Check your internet connection.');
        setPaying(null);
        return;
      }

      const options = {
        key:         orderData.key_id,
        amount:      orderData.amount,
        currency:    orderData.currency,
        order_id:    orderData.order_id,
        name:        'Jyotish Stack AI',
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
        prefill:     { name: user.name, email: user.email },
        theme:       { color: '#D4AF37' },
        handler: async (response) => {
          try {
            await api.post('/subscriptions/verify', {
              order_id:        response.razorpay_order_id,
              payment_id:      response.razorpay_payment_id,
              signature:       response.razorpay_signature,
              subscription_id: orderData.subscription_id,
            });
            const { data: pd } = await api.get('/users/profile');
            setUser(pd.user);
            toast.success('🎉 Plan activated! Enjoy your new features.');
          } catch {
            toast.error('Payment verified but activation failed — contact support.');
          } finally {
            setPaying(null);
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment. Please try again.');
      setPaying(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background:'radial-gradient(ellipse at top, #181C35 0%, #0B0D1A 60%, #06070F 100%)' }}>
      <StarField count={160} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 min-h-screen">
        {/* Ambient glow blob */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-pulse-glow" style={{ width:700, height:700, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(61,53,128,0.28) 0%, transparent 65%)' }} />
        </div>

        {/* Orbital rings */}
        <OrbitalRings />

        {/* Floating dots */}
        <FloatingDots />

        <motion.div initial="hidden" animate="show" variants={stag}
          className="relative flex flex-col items-center max-w-4xl w-full">

          {/* Pill badge */}
          <motion.span variants={fadeUp}
            className="inline-flex items-center gap-2 border border-gold/30 bg-gold/5 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
            <span className="text-saffron text-xs tracking-widest uppercase font-medium font-devanagari">
              {t('tagline', lang)}
            </span>
          </motion.span>

          {/* Headline */}
          <motion.h1 variants={fadeUp}
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-gradient-gold">{t('h1', lang)}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={fadeUp}
            className="text-ivory/60 text-lg md:text-xl leading-relaxed max-w-2xl mb-12 font-devanagari">
            {t('sub', lang)}
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center mb-20">
            <Link href="/register"
              className="btn-gold text-base px-8 py-4 font-semibold shadow-gold">
              {t('cta1', lang)}
            </Link>
            <Link href="/kundli"
              className="btn-outline-gold text-base px-8 py-4 font-semibold">
              {t('cta2', lang)}
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={stag} className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full max-w-xl">
            {STATS.map(s => (
              <motion.div key={s.value} variants={fadeUp} className="text-center">
                <p className="font-serif text-3xl font-bold text-gradient-gold">{s.value}</p>
                <p className="text-ivory/40 text-xs mt-1 tracking-wide font-devanagari">
                  {translate(lang, s.en, s.hi)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:0.4 }} transition={{ delay:2, duration:1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-ivory/30 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gold/30 animate-pulse" />
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <SectionHead title={t('feat_h', lang)} sub={t('feat_s', lang)} />
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href={f.href}
                  className="card-royal p-7 flex flex-col h-full group block relative overflow-hidden
                             hover:border-gold/50 hover:-translate-y-1 transition-all duration-300">
                  {/* Icon glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background:'radial-gradient(circle at 30% 30%, rgba(212,175,55,0.06), transparent 60%)' }} />
                  <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">{f.icon}</span>
                  <h3 className="font-serif text-gold text-lg font-semibold mb-2">
                    {translate(lang, f.en, f.hi)}
                  </h3>
                  <p className="text-ivory/55 text-sm leading-relaxed flex-1 font-devanagari">
                    {translate(lang, f.de, f.dh)}
                  </p>
                  <p className="text-gold/40 group-hover:text-gold text-xs mt-4 transition-colors">
                    {translate(lang, 'Learn more →', 'अधिक जानें →')}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 max-w-5xl mx-auto px-6"><div className="divider-gold" /></div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <HowItWorksSection lang={lang} />

      <div className="relative z-10 max-w-5xl mx-auto px-6"><div className="divider-gold" /></div>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section ref={pRef} id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHead title={t('price_h', lang)} sub={t('price_s', lang)} />
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stag}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {PLANS.map((p, i) => (
              <motion.div key={i} variants={fadeUp}
                className={`card-royal p-8 flex flex-col relative ${
                  p.hot ? 'border-gold/55 md:scale-105 md:z-10' : ''
                }`}
                style={p.hot ? { boxShadow:'0 0 40px rgba(212,175,55,0.15)' } : {}}>
                {p.hot && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-cosmos-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shimmer-gold">
                    {t('popular', lang)}
                  </span>
                )}
                <p className="font-serif text-ivory text-xl font-semibold mb-1">{translate(lang, p.en, p.hi)}</p>
                <div className="flex items-baseline gap-1 my-4">
                  <span className={`font-serif text-4xl font-bold ${p.hot ? 'text-gradient-gold' : 'text-ivory'}`}>{p.price}</span>
                  <span className="text-ivory/40 text-sm">{translate(lang, p.pe, p.ph)}</span>
                </div>
                <ul className="space-y-2.5 text-sm text-ivory/65 flex-1 mb-8">
                  {p.feats.map(f => (
                    <li key={f.en} className="flex items-start gap-2">
                      <span className="text-gold text-xs mt-0.5 shrink-0">✦</span>
                      <span className="font-devanagari">{translate(lang, f.en, f.hi)}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(p.tier)}
                  disabled={paying === p.tier}
                  className={`text-center py-3 rounded-sm text-sm font-semibold block w-full transition-all ${
                    p.hot ? 'btn-gold shadow-gold' : 'btn-outline-gold'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}>
                  {paying === p.tier
                    ? '⏳ Processing…'
                    : (user
                        ? (translate(lang, p.cta_en, p.cta_hi))
                        : (translate(lang, 'Get Started', 'अभी शुरू करें'))
                      )}
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Legal note under pricing */}
          <motion.p initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
            className="text-center text-ivory/25 text-xs mt-8 font-devanagari">
            {translate(lang, 'All prices inclusive of GST • ', 'सभी मूल्य GST सहित हैं • ')}
            <Link href="/refund-policy" className="underline hover:text-gold transition-colors">
              {translate(lang, 'Refund Policy', 'धनवापसी नीति')}
            </Link>
            {' • '}
            <Link href="/disclaimer" className="underline hover:text-gold transition-colors">
              {translate(lang, 'Disclaimer', 'अस्वीकरण')}
            </Link>
          </motion.p>
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
          className="max-w-3xl mx-auto text-center card-royal p-10 border-gold/25 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background:'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.07), transparent 60%)' }} />
          <p className="text-5xl mb-5 relative z-10">🔱</p>
          <h3 className="font-serif text-2xl md:text-3xl text-gradient-gold font-bold mb-4 relative z-10">
            {translate(lang, 'Begin Your Cosmic Journey', 'अपनी ब्रह्मांडीय यात्रा शुरू करें')}
          </h3>
          <p className="text-ivory/55 mb-8 font-devanagari relative z-10">
            {translate(lang, 'Create your free account today and discover your Vedic birth chart.', 'आज ही निःशुल्क खाता बनाएं और अपनी पहली कुंडली देखें।')}
          </p>
          <Link href="/register"
            className="btn-gold text-base px-10 py-4 inline-block shadow-gold font-semibold relative z-10">
            {translate(lang, "Get Started — It's Free", 'अभी शुरू करें — निःशुल्क')}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
