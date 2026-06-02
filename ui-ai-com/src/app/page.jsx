'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

function GridBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04 }}>
        <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00D4FF" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(123,47,190,0.15)0%,transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '60%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(0,212,255,0.1)0%,transparent 70%)', borderRadius: '50%' }} />
    </div>
  );
}

const features = [
  { icon: '🤖', title: 'AI Kundli Engine',     desc: 'ML-enhanced Vedic birth chart with precise planetary positions, aspects, and yogas.' },
  { icon: '🔮', title: 'Predictive Analytics',  desc: 'AI-powered daily, weekly, and monthly predictions based on your unique chart.' },
  { icon: '💡', title: 'Smart Matchmaking',     desc: 'Advanced compatibility using Ashtakoot Guna Milan with AI scoring.' },
  { icon: '📡', title: 'Real-time Transits',    desc: 'Live planetary transit tracker showing real-time effects on your birth chart.' },
  { icon: '🧬', title: 'Dasha Intelligence',    desc: 'Deep Vimshottari Dasha analysis with AI-generated life period predictions.' },
  { icon: '⚡', title: 'Instant Reports',       desc: 'Generate comprehensive astrology reports in seconds — Hindi & English.' },
];

const stats = [
  { value: '99.8%', label: 'Calculation Accuracy' },
  { value: '< 1s',  label: 'Report Generation' },
  { value: '27',    label: 'Nakshatras Analyzed' },
  { value: '144',   label: 'House Combinations' },
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState('');
  const headline = 'Ancient Wisdom. Artificial Intelligence.';

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { setTyped(headline.slice(0, i)); i++; if (i > headline.length) clearInterval(t); }, 50);
    return () => clearInterval(t);
  }, []);

  const subscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) { toast.success("You're on the list!"); setEmail(''); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <GridBg />

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(4,8,16,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7B2FBE,#00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🪐</div>
            <div>
              <p style={{ color: '#00D4FF', fontWeight: 700, fontSize: 16, lineHeight: 1.2, letterSpacing: '0.05em' }}>Jyotish Stack <span style={{ color: '#A855F7' }}>AI</span></p>
              <p style={{ color: 'rgba(232,244,255,0.3)', fontSize: 9, letterSpacing: '0.3em' }}>JYOTISHSTACKAI.COM</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ color: 'rgba(232,244,255,0.6)', fontSize: 13, textDecoration: 'none', padding: '8px 12px' }}>Login</Link>
            <Link href="/register" style={{ background: 'linear-gradient(135deg,#7B2FBE,#A855F7)', color: '#fff', fontWeight: 600, padding: '8px 20px', borderRadius: 6, fontSize: 13, textDecoration: 'none', border: '1px solid rgba(168,85,247,0.4)' }}>
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: 'center', position: 'relative', zIndex: 1, padding: '140px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.05)', padding: '6px 18px', borderRadius: 20, marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4FF', display: 'inline-block', boxShadow: '0 0 8px #00D4FF' }} />
            <span style={{ color: '#00D4FF', fontSize: 12, letterSpacing: '0.15em' }}>AI-POWERED VEDIC ASTROLOGY PLATFORM</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem,6vw,5rem)', fontWeight: 800, lineHeight: 1.1, maxWidth: 800, margin: '0 auto 24px' }}>
            <span style={{ color: '#E8F4FF' }}>5,000 Years of </span>
            <span style={{ background: 'linear-gradient(135deg,#00D4FF,#7B2FBE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Vedic Wisdom</span>
            <br /><span style={{ color: '#E8F4FF' }}>Meets Modern </span><span style={{ color: '#00D4FF' }}>AI</span>
          </h1>

          <p style={{ color: 'rgba(232,244,255,0.65)', fontSize: 'clamp(0.95rem,2vw,1.15rem)', maxWidth: 560, margin: '0 auto 16px', lineHeight: 1.7 }}>
            {typed}<span style={{ color: '#00D4FF' }}>|</span>
          </p>
          <p style={{ color: 'rgba(232,244,255,0.35)', fontSize: 13, marginBottom: 48 }}>
            Kundli · Matchmaking · Predictions · Dasha · Nakshatra · Transit
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ background: 'linear-gradient(135deg,#00D4FF,#0099CC)', color: '#040810', fontWeight: 700, padding: '14px 32px', borderRadius: 6, fontSize: 15, textDecoration: 'none' }}>
              Generate Free Kundli
            </Link>
            <Link href="/register" style={{ border: '1px solid rgba(123,47,190,0.5)', color: '#A855F7', padding: '14px 32px', borderRadius: 6, fontSize: 15, textDecoration: 'none', background: 'rgba(123,47,190,0.05)' }}>
              See AI Demo →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 24px 60px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: 'rgba(10,15,42,0.8)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ color: '#00D4FF', fontSize: 32, fontWeight: 800, marginBottom: 6 }}>{s.value}</p>
              <p style={{ color: 'rgba(232,244,255,0.5)', fontSize: 12 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: '#E8F4FF', marginBottom: 12 }}>Platform Features</h2>
          <p style={{ color: 'rgba(232,244,255,0.5)' }}>Everything in a modern AI astrology platform</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ background: 'rgba(10,15,42,0.7)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 10, padding: '28px 24px' }}>
              <span style={{ fontSize: 36, display: 'block', marginBottom: 16 }}>{f.icon}</span>
              <h3 style={{ color: '#00D4FF', fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: 'rgba(232,244,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section style={{ padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ background: 'linear-gradient(135deg,rgba(123,47,190,0.15),rgba(0,212,255,0.1))', border: '1px solid rgba(123,47,190,0.3)', borderRadius: 16, padding: '60px 40px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 700, color: '#E8F4FF', marginBottom: 12 }}>Ready to explore your cosmos?</h2>
          <p style={{ color: 'rgba(232,244,255,0.5)', marginBottom: 40, fontSize: 15 }}>Get notified at launch. Be among the first AI astrology users.</p>
          <form onSubmit={subscribe} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email"
              style={{ flex: 1, minWidth: 0, background: 'rgba(4,8,16,0.7)', border: '1px solid rgba(0,212,255,0.2)', color: '#E8F4FF', padding: '12px 16px', borderRadius: 6, fontSize: 14, outline: 'none' }} />
            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#00D4FF,#0099CC)', color: '#040810', fontWeight: 700, padding: '12px 22px', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {loading ? '...' : 'Notify Me'}
            </button>
          </form>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,212,255,0.08)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#00D4FF', fontWeight: 700, marginBottom: 4 }}>Jyotish Stack <span style={{ color: '#A855F7' }}>AI</span></p>
        <p style={{ color: 'rgba(232,244,255,0.3)', fontSize: 12 }}>jyotishstackai.com · jyotishstackai.in · jyotishstack.com</p>
        <p style={{ color: 'rgba(232,244,255,0.15)', fontSize: 11, marginTop: 12 }}>© {new Date().getFullYear()} Jyotish Stack AI</p>
      </footer>

      <Toaster position="top-right" toastOptions={{ style: { background: '#0A0F2A', color: '#E8F4FF', border: '1px solid #00D4FF' } }} />
    </div>
  );
}
