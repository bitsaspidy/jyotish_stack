'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// ── Mandala SVG decoration ────────────────────────────────────────
function Mandala({ size = 400, opacity = 0.07 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none" style={{ opacity }} className="pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <line key={i} x1="200" y1="200"
          x2={200 + 190 * Math.cos((i * 30 * Math.PI) / 180)}
          y2={200 + 190 * Math.sin((i * 30 * Math.PI) / 180)}
          stroke="#FF9933" strokeWidth="1" />
      ))}
      {[40, 80, 120, 160].map(r => (
        <circle key={r} cx="200" cy="200" r={r} stroke="#FF9933" strokeWidth="0.8" />
      ))}
      {[...Array(8)].map((_, i) => (
        <polygon key={i}
          points={`${200 + 80 * Math.cos((i * 45 * Math.PI) / 180)},${200 + 80 * Math.sin((i * 45 * Math.PI) / 180)} ${200 + 120 * Math.cos(((i * 45 + 22) * Math.PI) / 180)},${200 + 120 * Math.sin(((i * 45 + 22) * Math.PI) / 180)} ${200 + 80 * Math.cos(((i * 45 + 45) * Math.PI) / 180)},${200 + 80 * Math.sin(((i * 45 + 45) * Math.PI) / 180)}`}
          stroke="#D4AF37" strokeWidth="0.6" fill="none" />
      ))}
    </svg>
  );
}

const features = [
  { icon: '🪐', title: 'जन्म कुंडली', desc: 'सभी 12 भावों, ग्रहों और नवांश के साथ सटीक वैदिक जन्म कुंडली का निर्माण।' },
  { icon: '💫', title: 'भविष्यवाणी',  desc: 'दैनिक, साप्ताहिक और मासिक भविष्यवाणी — AI की सहायता से हिंदी में।' },
  { icon: '💍', title: 'विवाह मिलान', desc: 'अष्टकूट गुण मिलान, मंगल दोष और सम्पूर्ण वैवाहिक अनुकूलता विश्लेषण।' },
  { icon: '⏳', title: 'दशा विश्लेषण', desc: 'विंशोत्तरी दशा और ग्रह-दर-ग्रह जीवन चरण का विस्तृत विश्लेषण।' },
  { icon: '🔱', title: 'नक्षत्र रिपोर्ट', desc: '27 नक्षत्रों का विस्तृत विवरण — व्यक्तित्व, करियर और आध्यात्मिक मार्ग।' },
  { icon: '🌙', title: 'गोचर फल',     desc: 'वास्तविक समय ग्रह गोचर और आपकी कुंडली पर उनके विशेष प्रभाव।' },
];

const rashiNames = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
const rashiIcons = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRashi, setActiveRashi] = useState(0);
  const [lang, setLang] = useState('hi');

  useEffect(() => {
    const t = setInterval(() => setActiveRashi(r => (r + 1) % 12), 3000);
    return () => clearInterval(t);
  }, []);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, preferred_language: 'hi' }),
      });
      const data = await res.json();
      if (data.success) { toast.success('सफलतापूर्वक सदस्यता ली!'); setEmail(''); }
      else toast.error(data.message);
    } catch { toast.error('कुछ गलत हुआ'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #2C1510 0%, #1A0D08 55%, #120A06 100%)' }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(26,13,8,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,153,51,0.15)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>🔱</span>
            <div>
              <p style={{ color: '#FF9933', fontFamily: 'var(--font-playfair),Georgia,serif', fontWeight: 700, fontSize: 18, lineHeight: 1.2, fontStyle: 'italic' }}>ज्योतिष स्टैक</p>
              <p style={{ color: 'rgba(255,248,240,0.4)', fontSize: 10, letterSpacing: '0.2em' }}>JYOTISHSTACK.IN</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLang(l => l === 'hi' ? 'en' : 'hi')}
              style={{ border: '1px solid rgba(255,153,51,0.3)', color: '#FF9933', background: 'transparent', padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer' }}>
              {lang === 'hi' ? 'English' : 'हिन्दी'}
            </button>
            <Link href="/login" style={{ color: 'rgba(255,248,240,0.6)', fontSize: 13, textDecoration: 'none', padding: '8px 12px' }}>
              {lang === 'hi' ? 'लॉगिन' : 'Login'}
            </Link>
            <Link href="/register"
              style={{ background: 'linear-gradient(135deg,#FF9933,#FFB347,#E07B1A)', color: '#120A06', fontWeight: 700, padding: '8px 18px', borderRadius: 20, fontSize: 13, textDecoration: 'none' }}>
              {lang === 'hi' ? 'शुरू करें' : 'Get Started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Mandala background */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
            <Mandala size={700} opacity={0.06} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}
          style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ color: '#D4AF37', fontSize: 13, letterSpacing: '0.4em', marginBottom: 20, textTransform: 'uppercase' }}>
            ॥ वैदिक ज्योतिष का डिजिटल मंदिर ॥
          </p>
          <h1 style={{ fontFamily: 'var(--font-devanagari),sans-serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontWeight: 700, lineHeight: 1.15, marginBottom: 24 }}>
            <span style={{ color: '#FF9933' }}>ज्योतिष स्टैक</span>
            <br />
            <span style={{ fontSize: '0.55em', color: 'rgba(255,248,240,0.8)', fontStyle: 'italic', fontFamily: 'var(--font-playfair),Georgia,serif' }}>AI</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-devanagari),sans-serif', fontSize: 'clamp(1rem,2.5vw,1.3rem)', color: 'rgba(255,248,240,0.7)', lineHeight: 1.8, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            {lang === 'hi'
              ? 'प्राचीन वैदिक ज्योतिष और आधुनिक AI का अद्भुत संगम। अपनी कुंडली, दशा, भाग्य और जीवन के रहस्य जानें।'
              : 'Ancient Vedic astrology meets modern AI. Discover your Kundli, Dasha, destiny and life secrets.'}
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register"
              style={{ background: 'linear-gradient(135deg,#FF9933,#FFB347,#E07B1A)', color: '#120A06', fontWeight: 700, padding: '14px 32px', borderRadius: 6, fontSize: 16, textDecoration: 'none' }}>
              {lang === 'hi' ? 'निःशुल्क कुंडली बनाएं' : 'Free Kundli'}
            </Link>
            <Link href="/matchmaking"
              style={{ border: '1px solid #FF9933', color: '#FF9933', padding: '14px 32px', borderRadius: 6, fontSize: 16, textDecoration: 'none', background: 'transparent' }}>
              {lang === 'hi' ? 'विवाह मिलान' : 'Matchmaking'}
            </Link>
          </div>

          {/* Live Rashi carousel */}
          <div style={{ marginTop: 60, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 600, margin: '60px auto 0' }}>
            {rashiNames.map((r, i) => (
              <motion.div key={r} animate={{ scale: i === activeRashi ? 1.2 : 1, opacity: i === activeRashi ? 1 : 0.45 }}
                transition={{ duration: 0.4 }}
                style={{ background: i === activeRashi ? 'rgba(255,153,51,0.15)' : 'rgba(44,21,16,0.5)', border: `1px solid ${i === activeRashi ? 'rgba(255,153,51,0.5)' : 'rgba(255,153,51,0.1)'}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'center', minWidth: 56 }}
                onClick={() => setActiveRashi(i)}>
                <p style={{ fontSize: 20, lineHeight: 1 }}>{rashiIcons[i]}</p>
                <p style={{ fontSize: 11, color: i === activeRashi ? '#FF9933' : 'rgba(255,248,240,0.5)', marginTop: 4, fontFamily: 'var(--font-devanagari),sans-serif' }}>{r}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontFamily: 'var(--font-devanagari),sans-serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: '#FF9933', marginBottom: 12 }}>
            {lang === 'hi' ? 'हमारी सेवाएं' : 'Our Services'}
          </h2>
          <p style={{ color: 'rgba(255,248,240,0.55)', maxWidth: 500, margin: '0 auto', fontFamily: 'var(--font-devanagari),sans-serif' }}>
            {lang === 'hi' ? 'वैदिक ज्योतिष की सम्पूर्ण सेवाएं — AI की शक्ति के साथ' : 'Complete Vedic astrology powered by AI'}
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ background: 'rgba(44,21,16,0.6)', border: '1px solid rgba(255,153,51,0.2)', borderRadius: 10, padding: 24, cursor: 'pointer', transition: 'border-color 0.3s' }}>
              <span style={{ fontSize: 36, display: 'block', marginBottom: 16 }}>{f.icon}</span>
              <h3 style={{ color: '#FF9933', fontFamily: 'var(--font-devanagari),sans-serif', fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{lang === 'hi' ? f.title : f.title}</h3>
              <p style={{ color: 'rgba(255,248,240,0.6)', fontSize: 13, lineHeight: 1.7, fontFamily: 'var(--font-devanagari),sans-serif' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ padding: '60px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h3 style={{ fontFamily: 'var(--font-devanagari),sans-serif', color: '#FF9933', fontSize: 24, marginBottom: 12 }}>
            {lang === 'hi' ? 'साप्ताहिक राशिफल पाएं' : 'Get Weekly Horoscope'}
          </h3>
          <p style={{ color: 'rgba(255,248,240,0.55)', marginBottom: 24, fontFamily: 'var(--font-devanagari),sans-serif' }}>
            {lang === 'hi' ? 'हर सोमवार आपके ईमेल पर भविष्यवाणी' : 'Predictions delivered every Monday'}
          </p>
          <form onSubmit={subscribe} style={{ display: 'flex', gap: 10 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder={lang === 'hi' ? 'आपका ईमेल पता' : 'Your email address'}
              style={{ flex: 1, background: 'rgba(44,21,16,0.5)', border: '1px solid rgba(255,153,51,0.25)', color: '#FFF8F0', padding: '12px 16px', borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'var(--font-devanagari),sans-serif' }} />
            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#FF9933,#FFB347,#E07B1A)', color: '#120A06', fontWeight: 700, padding: '12px 22px', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {loading ? '...' : (lang === 'hi' ? 'सदस्य बनें' : 'Subscribe')}
            </button>
          </form>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,153,51,0.1)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>🔱</p>
        <p style={{ color: '#FF9933', fontFamily: 'var(--font-devanagari),sans-serif', fontWeight: 600, marginBottom: 4 }}>ज्योतिष स्टैक</p>
        <p style={{ color: 'rgba(255,248,240,0.3)', fontSize: 12, marginBottom: 16 }}>jyotishstack.in · jyotishstack.com · contact@jyotishstack.com</p>
        <p style={{ color: 'rgba(255,248,240,0.2)', fontSize: 11 }}>© {new Date().getFullYear()} Jyotish Stack AI · सर्वाधिकार सुरक्षित</p>
      </footer>

      <Toaster position="top-right" toastOptions={{ style: { background: '#231008', color: '#FFF8F0', border: '1px solid #FF9933' } }} />
    </div>
  );
}
