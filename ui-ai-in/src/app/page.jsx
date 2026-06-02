'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

const features = [
  { icon: '🤖', hi: 'AI कुंडली इंजन',    en: 'AI Kundli Engine',    desc_hi: 'ML-आधारित वैदिक जन्म कुंडली — सटीक ग्रह स्थिति, योग और दशा।', desc_en: 'ML-enhanced Vedic birth chart with precise planetary positions and yogas.' },
  { icon: '💫', hi: 'स्मार्ट भविष्यवाणी', en: 'Smart Predictions',   desc_hi: 'AI-संचालित दैनिक, साप्ताहिक और मासिक भविष्यवाणी हिंदी में।', desc_en: 'AI-powered daily, weekly, and monthly predictions in Hindi & English.' },
  { icon: '💍', hi: 'विवाह मिलान',        en: 'Smart Matchmaking',   desc_hi: 'अष्टकूट गुण मिलान और मंगल दोष — AI स्कोरिंग के साथ।', desc_en: 'Ashtakoot Guna Milan with AI compatibility scoring.' },
  { icon: '⏳', hi: 'दशा विश्लेषण',       en: 'Dasha Intelligence',  desc_hi: 'विंशोत्तरी दशा का AI-जनित जीवन चरण विश्लेषण।', desc_en: 'Vimshottari Dasha with AI life period predictions.' },
  { icon: '🔱', hi: 'नक्षत्र रिपोर्ट',    en: 'Nakshatra Report',   desc_hi: '27 नक्षत्रों का विस्तृत व्यक्तित्व और करियर विश्लेषण।', desc_en: 'Deep personality and career analysis for all 27 nakshatras.' },
  { icon: '🌙', hi: 'गोचर ट्रैकर',        en: 'Transit Tracker',    desc_hi: 'वास्तविक समय ग्रह गोचर और आपकी कुंडली पर प्रभाव।', desc_en: 'Real-time planetary transits and their effects on your chart.' },
];

export default function HomePage() {
  const [lang, setLang] = useState('hi');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, preferred_language: lang }) });
      const data = await res.json();
      if (data.success) { toast.success(lang === 'hi' ? 'सफलतापूर्वक सदस्यता ली!' : "You're on the list!"); setEmail(''); }
      else toast.error(data.message);
    } catch { toast.error(lang === 'hi' ? 'कुछ गलत हुआ' : 'Failed'); }
    finally { setLoading(false); }
  };

  const t = (hi, en) => lang === 'hi' ? hi : en;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top,#0E1228 0%,#060810 60%,#030408 100%)' }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '25%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(255,153,51,0.08)0%,transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '5%', width: 350, height: 350, background: 'radial-gradient(circle,rgba(0,212,255,0.08)0%,transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(6,8,16,0.88)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,153,51,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#FF9933,#00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🪐</div>
            <div>
              <p style={{ fontFamily: 'var(--font-devanagari),sans-serif', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
                <span style={{ color: '#FF9933' }}>ज्योतिष स्टैक </span><span style={{ color: '#00D4FF' }}>AI</span>
              </p>
              <p style={{ color: 'rgba(255,245,232,0.3)', fontSize: 9, letterSpacing: '0.25em' }}>JYOTISHSTACKAI.IN</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLang(l => l === 'hi' ? 'en' : 'hi')}
              style={{ border: '1px solid rgba(255,153,51,0.3)', color: '#FF9933', background: 'transparent', padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-devanagari),sans-serif' }}>
              {lang === 'hi' ? 'EN' : 'हि'}
            </button>
            <Link href="/login" style={{ color: 'rgba(255,245,232,0.55)', fontSize: 13, textDecoration: 'none', padding: '8px 10px', fontFamily: 'var(--font-devanagari),sans-serif' }}>
              {t('लॉगिन', 'Login')}
            </Link>
            <Link href="/register"
              style={{ background: 'linear-gradient(135deg,#FF9933,#00D4FF)', color: '#060810', fontWeight: 700, padding: '8px 18px', borderRadius: 6, fontSize: 13, textDecoration: 'none' }}>
              {t('शुरू करें', 'Get Started')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 130, paddingBottom: 80, textAlign: 'center', position: 'relative', zIndex: 1, padding: '130px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,153,51,0.2)', background: 'rgba(255,153,51,0.05)', padding: '6px 18px', borderRadius: 20, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9933', display: 'inline-block', boxShadow: '0 0 6px #FF9933' }} />
            <span style={{ color: '#FF9933', fontSize: 11, letterSpacing: '0.15em', fontFamily: 'var(--font-devanagari),sans-serif' }}>
              {t('AI-संचालित वैदिक ज्योतिष', 'AI-POWERED VEDIC ASTROLOGY')}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem,6vw,4.8rem)', fontWeight: 800, lineHeight: 1.15, maxWidth: 800, margin: '0 auto 24px', fontFamily: 'var(--font-devanagari),sans-serif' }}>
            <span style={{ color: '#FF9933' }}>{t('प्राचीन ज्ञान', 'Ancient Wisdom')}</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#FF9933,#00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t('+ आधुनिक AI', '+ Modern AI')}
            </span>
          </h1>

          <p style={{ color: 'rgba(255,245,232,0.65)', fontSize: 'clamp(0.95rem,2.2vw,1.2rem)', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.8, fontFamily: 'var(--font-devanagari),sans-serif' }}>
            {t(
              'वैदिक ज्योतिष की 5000 वर्षों की ज्ञान परंपरा और आधुनिक AI का अद्भुत संगम — अपनी कुंडली, दशा और भविष्य जानें।',
              '5,000 years of Vedic wisdom meets the precision of modern AI — discover your Kundli, Dasha, and destiny.'
            )}
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register"
              style={{ background: 'linear-gradient(135deg,#FF9933,#FFB347)', color: '#060810', fontWeight: 700, padding: '14px 32px', borderRadius: 6, fontSize: 15, textDecoration: 'none', fontFamily: 'var(--font-devanagari),sans-serif' }}>
              {t('निःशुल्क कुंडली बनाएं', 'Free Kundli')}
            </Link>
            <Link href="/register"
              style={{ border: '1px solid rgba(0,212,255,0.4)', color: '#00D4FF', padding: '14px 32px', borderRadius: 6, fontSize: 15, textDecoration: 'none', background: 'rgba(0,212,255,0.05)', fontFamily: 'var(--font-devanagari),sans-serif' }}>
              {t('विवाह मिलान', 'Matchmaking')}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-devanagari),sans-serif' }}>
            <span style={{ color: '#FF9933' }}>{t('AI', 'AI')}</span>
            <span style={{ color: '#FFF5E8' }}>{t(' + ज्योतिष सेवाएं', ' + Astrology Services')}</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09 }}
              style={{ background: 'rgba(14,18,40,0.7)', border: `1px solid ${i % 2 === 0 ? 'rgba(255,153,51,0.18)' : 'rgba(0,212,255,0.15)'}`, borderRadius: 10, padding: '24px' }}>
              <span style={{ fontSize: 36, display: 'block', marginBottom: 14 }}>{f.icon}</span>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: i % 2 === 0 ? '#FF9933' : '#00D4FF', fontFamily: 'var(--font-devanagari),sans-serif' }}>
                {t(f.hi, f.en)}
              </h3>
              <p style={{ color: 'rgba(255,245,232,0.55)', fontSize: 13, lineHeight: 1.7, fontFamily: 'var(--font-devanagari),sans-serif' }}>
                {t(f.desc_hi, f.desc_en)}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ background: 'linear-gradient(135deg,rgba(255,153,51,0.08),rgba(0,212,255,0.08))', border: '1px solid rgba(255,153,51,0.2)', borderRadius: 16, padding: '56px 40px', maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.2rem)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-devanagari),sans-serif', color: '#FFF5E8' }}>
            {t('लॉन्च पर सूचना पाएं', 'Get notified at launch')}
          </h2>
          <p style={{ color: 'rgba(255,245,232,0.5)', marginBottom: 36, fontFamily: 'var(--font-devanagari),sans-serif' }}>
            {t('पहले उपयोगकर्ताओं में शामिल हों — विशेष छूट के साथ', 'Be among first users — with exclusive early-bird offer')}
          </p>
          <form onSubmit={subscribe} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('आपका ईमेल पता', 'Your email address')}
              style={{ flex: 1, minWidth: 0, background: 'rgba(6,8,16,0.7)', border: '1px solid rgba(255,153,51,0.2)', color: '#FFF5E8', padding: '12px 16px', borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'var(--font-devanagari),sans-serif' }} />
            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#FF9933,#00D4FF)', color: '#060810', fontWeight: 700, padding: '12px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-devanagari),sans-serif' }}>
              {loading ? '...' : t('सूचित करें', 'Notify Me')}
            </button>
          </form>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,153,51,0.1)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-devanagari),sans-serif', marginBottom: 4 }}>
          <span style={{ color: '#FF9933', fontWeight: 600 }}>ज्योतिष स्टैक </span>
          <span style={{ color: '#00D4FF', fontWeight: 600 }}>AI</span>
        </p>
        <p style={{ color: 'rgba(255,245,232,0.3)', fontSize: 12 }}>jyotishstackai.in · jyotishstackai.com · jyotishstack.com</p>
        <p style={{ color: 'rgba(255,245,232,0.15)', fontSize: 11, marginTop: 12 }}>© {new Date().getFullYear()} Jyotish Stack AI</p>
      </footer>

      <Toaster position="top-right" toastOptions={{ style: { background: '#0A0D1C', color: '#FFF5E8', border: '1px solid #FF9933' } }} />
    </div>
  );
}
