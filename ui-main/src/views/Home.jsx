'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';

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
  { en:'Basic',   hi:'आधारभूत',  price:'₹0',    pe:'/month', ph:'/माह', feats:['1 Kundli profile','Daily prediction','Basic matchmaking'],                                                            hot:false },
  { en:'Premium', hi:'प्रीमियम', price:'₹499',  pe:'/month', ph:'/माह', feats:['5 Kundli profiles','All prediction types','Advanced matchmaking','Dasha analysis','Transit report'],                hot:true  },
  { en:'Yearly',  hi:'वार्षिक',  price:'₹3,999',pe:'/year',  ph:'/वर्ष', feats:['Unlimited profiles','Every feature included','Priority support','Muhurta calculator','Gemstone & remedy advice'], hot:false },
];

const fadeUp = { hidden:{ opacity:0, y:28 }, show:{ opacity:1, y:0, transition:{ duration:0.55 } } };
const stag   = { show:{ transition:{ staggerChildren:0.09 } } };

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
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-gold text-xs mt-0.5 shrink-0">✦</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register"
                  className={`text-center py-3 rounded-sm text-sm font-semibold block transition-all ${
                    p.hot ? 'btn-gold shadow-gold' : 'btn-outline-gold'
                  }`}>
                  {t('start', lang)}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

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
