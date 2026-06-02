'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import Logo from '../components/Logo';
import api from '../lib/api';
import toast from 'react-hot-toast';

const LAUNCH_DATE = new Date('2026-09-01T00:00:00');

function getTimeLeft() {
  const diff = LAUNCH_DATE - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass border border-gold/30 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-sm">
        <span className="text-3xl md:text-4xl font-bold text-gradient-gold font-serif">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-ivory/50 text-xs mt-2 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function ComingSoon({ lang = 'en', message, messageHi, title }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success(lang === 'hi' ? 'हम लॉन्च पर आपको सूचित करेंगे!' : "We'll notify you at launch!");
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const displayTitle = title || (lang === 'hi' ? 'जल्द आ रहा है' : 'Coming Soon');
  const displayMsg = (lang === 'hi' ? messageHi : message) ||
    (lang === 'hi'
      ? 'हम कुछ असाधारण बना रहे हैं। ज्योतिष स्टैक AI जल्द ही लॉन्च होगा।'
      : 'We are crafting something extraordinary. Jyotish Stack AI is launching soon.');

  return (
    <div className="relative min-h-screen starfield-bg flex flex-col items-center justify-center overflow-hidden px-6">
      <StarField count={250} />

      {/* Mandala bg */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <svg width="700" height="700" viewBox="0 0 700 700" fill="none">
          {[...Array(12)].map((_, i) => (
            <line key={i} x1="350" y1="350"
              x2={350 + 340 * Math.cos((i * 30 * Math.PI) / 180)}
              y2={350 + 340 * Math.sin((i * 30 * Math.PI) / 180)}
              stroke="#D4AF37" strokeWidth="1" />
          ))}
          {[80, 150, 220, 290].map((r) => (
            <circle key={r} cx="350" cy="350" r={r} stroke="#D4AF37" strokeWidth="0.8" />
          ))}
        </svg>
      </div>

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
        className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} className="mb-6">
          <Logo size={80} />
        </motion.div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold text-gradient-gold animate-glow mb-2">
          Jyotish Stack
        </h1>
        <p className="text-saffron/80 text-sm tracking-[0.3em] uppercase mb-2 font-devanagari">ज्योतिष स्टैक AI</p>
        <h2 className="font-serif text-3xl md:text-4xl text-ivory font-semibold mt-6 mb-4">{displayTitle}</h2>
        <p className="text-ivory/60 text-base md:text-lg leading-relaxed mb-10 font-devanagari">{displayMsg}</p>

        <div className="flex gap-4 mb-12">
          <CountUnit value={timeLeft.days}    label={lang === 'hi' ? 'दिन' : 'Days'} />
          <CountUnit value={timeLeft.hours}   label={lang === 'hi' ? 'घंटे' : 'Hours'} />
          <CountUnit value={timeLeft.minutes} label={lang === 'hi' ? 'मिनट' : 'Minutes'} />
          <CountUnit value={timeLeft.seconds} label={lang === 'hi' ? 'सेकंड' : 'Seconds'} />
        </div>

        <form onSubmit={handleNotify} className="flex gap-2 w-full max-w-md">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={lang === 'hi' ? 'सूचना के लिए ईमेल दर्ज करें' : 'Enter email to get notified'}
            className="input-royal flex-1" />
          <button type="submit" disabled={loading} className="btn-gold px-5 whitespace-nowrap">
            {loading ? '...' : (lang === 'hi' ? 'सूचित करें' : 'Notify Me')}
          </button>
        </form>

        <div className="flex gap-5 mt-8 text-ivory/30 text-xs">
          <a href="mailto:contact@jyotishstack.com" className="hover:text-gold transition-colors">contact@jyotishstack.com</a>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-40" />
    </div>
  );
}
