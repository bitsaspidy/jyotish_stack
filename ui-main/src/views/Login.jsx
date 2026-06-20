'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const GOLD = '#D4AF37';

const fadeUp  = { hidden:{ opacity:0, y:20 }, show:{ opacity:1, y:0, transition:{ duration:0.5 } } };
const stag    = { show:{ transition:{ staggerChildren:0.1 } } };
const slideIn = { hidden:{ opacity:0, x:32 }, show:{ opacity:1, x:0, transition:{ duration:0.55, ease:'easeOut' } } };

// Decorative cosmos panel shown on lg+
function CosmosPanel({ lang }) {
  const hi = lang === 'hi';
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background:'linear-gradient(160deg, #1a1f42 0%, #0e1128 60%, #070919 100%)' }}>

      {/* Orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[320, 230, 150].map((size, i) => (
          <div key={size} style={{
            position:'absolute', width:size, height:size, borderRadius:'50%',
            border:`1px solid rgba(212,175,55,${0.12 - i * 0.03})`,
          }}
          className={i % 2 === 0 ? 'animate-spin-slow' : 'animate-spin-rev'}
          />
        ))}
        {/* Planet dot */}
        <div style={{ width:12, height:12, borderRadius:'50%', background:GOLD,
          boxShadow:`0 0 16px ${GOLD}`, opacity:0.8 }} />
        {/* Orbiting accent */}
        <div className="absolute" style={{
          width:6, height:6, borderRadius:'50%', background:'#9B89F0',
          top:'50%', left:'50%', marginTop:-3, marginLeft:-3,
          animation:'spin-slow 18s linear infinite',
          transformOrigin:'-115px 0',
          opacity:0.7,
        }} />
      </div>

      {/* Floating small dots */}
      {[
        { size:6, top:'15%', left:'20%', delay:'0s', dur:6 },
        { size:4, top:'70%', left:'12%', delay:'1.5s', dur:8 },
        { size:5, top:'40%', right:'18%', delay:'0.8s', dur:5.5 },
        { size:3, top:'82%', right:'25%', delay:'2s', dur:7 },
      ].map((d, i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', background:GOLD,
          width:d.size, height:d.size, top:d.top, left:d.left, right:d.right,
          animation:`float ${d.dur}s ease-in-out infinite`, animationDelay:d.delay, opacity:0.4,
        }} />
      ))}

      {/* Brand */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <Logo size={40} />
          <div>
            <h2 className="font-serif text-gold text-xl font-bold">Jyotish Stack AI</h2>
            <p className="text-ivory/35 text-xs font-devanagari">ज्योतिष स्टैक</p>
          </div>
        </div>
      </div>

      {/* Centre quote */}
      <div className="relative z-10 text-center px-4">
        <p className="font-serif text-ivory/60 text-lg leading-relaxed mb-2" style={{ fontStyle:'italic' }}>
          {hi ? '"अपना भाग्य जानें, अपना जीवन बनाएं।"' : '"Know your stars. Shape your story."'}
        </p>
        <p className="text-gold/40 text-xs tracking-widest uppercase">Vedic Jyotish · AI Powered</p>
      </div>

      {/* Stats row */}
      <div className="relative z-10 grid grid-cols-3 gap-4">
        {[['10K+','Kundlis','कुंडलियां'],['27','Nakshatras','नक्षत्र'],['99.8%','Accuracy','सटीकता']].map(([v, en, hi2]) => (
          <div key={v} className="text-center">
            <p className="font-serif text-xl font-bold text-gradient-gold">{v}</p>
            <p className="text-ivory/35 text-xs mt-0.5 font-devanagari">{hi ? hi2 : en}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const { login }  = useAuth();
  const { lang }   = useLang();
  const router     = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState:{ errors } } = useForm();
  const hi = lang === 'hi';

  const onSubmit = async ({ email, password }) => {
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(hi ? `स्वागत, ${user.name.split(' ')[0]}!` : `Welcome, ${user.name.split(' ')[0]}!`);
      router.push('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || (hi ? 'लॉगिन विफल' : 'Login failed'));
    } finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 starfield-bg">
      <StarField count={80} />

      <motion.div initial="hidden" animate="show" variants={fadeUp}
        className="relative z-10 w-full max-w-4xl mx-auto">

        {/* Card shell */}
        <div className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden"
          style={{ borderRadius:16, border:'1px solid rgba(212,175,55,0.2)',
            boxShadow:'0 32px 80px rgba(0,0,0,0.45)' }}>

          <CosmosPanel lang={lang} />

          {/* Form side */}
          <motion.div initial="hidden" animate="show" variants={stag}
            className="flex flex-col justify-center p-8 sm:p-10"
            style={{ background:'rgba(14,17,38,0.97)', backdropFilter:'blur(20px)' }}>

            {/* Logo — mobile only */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8 lg:hidden">
              <Logo size={36} />
              <span className="font-serif text-gold font-bold">Jyotish Stack AI</span>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-8">
              <h1 className="font-serif text-gold text-2xl font-bold mb-1">
                {hi ? 'लॉगिन करें' : 'Welcome Back'}
              </h1>
              <p className="text-ivory/40 text-sm font-devanagari">
                {hi ? 'अपने खाते में प्रवेश करें' : 'Sign in to continue your cosmic journey'}
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div variants={fadeUp}>
                <label className="block text-ivory/50 text-xs font-medium mb-1.5 uppercase tracking-wider">
                  {hi ? 'ईमेल' : 'Email'}
                </label>
                <input type="email" placeholder="you@example.com"
                  className="input-royal transition-all focus:border-gold/60 focus:shadow-sm"
                  style={{ transition:'border-color 0.2s, box-shadow 0.2s' }}
                  {...register('email', { required: hi ? 'ईमेल आवश्यक है' : 'Email required' })} />
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </motion.div>

              <motion.div variants={fadeUp}>
                <div className="flex justify-between mb-1.5">
                  <label className="text-ivory/50 text-xs font-medium uppercase tracking-wider">
                    {hi ? 'पासवर्ड' : 'Password'}
                  </label>
                  <Link href="/forgot-password"
                    className="text-gold/50 text-xs hover:text-gold transition-colors">
                    {hi ? 'भूल गए?' : 'Forgot?'}
                  </Link>
                </div>
                <input type="password" placeholder="••••••••" className="input-royal"
                  style={{ transition:'border-color 0.2s' }}
                  {...register('password', { required: hi ? 'पासवर्ड आवश्यक है' : 'Password required' })} />
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
              </motion.div>

              <motion.div variants={fadeUp}>
                <button type="submit" disabled={busy}
                  className="btn-gold w-full py-3.5 text-[15px] font-semibold text-center block relative overflow-hidden"
                  style={{ transition:'opacity 0.2s, transform 0.15s' }}>
                  <span className={busy ? 'opacity-0' : ''}>
                    {hi ? 'लॉगिन करें' : 'Sign In'}
                  </span>
                  {busy && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-cosmos-900/40 border-t-cosmos-900 rounded-full animate-spin" />
                    </span>
                  )}
                </button>
              </motion.div>
            </form>

            <motion.div variants={fadeUp} className="divider-gold" />

            <motion.p variants={fadeUp} className="text-center text-ivory/40 text-sm font-devanagari">
              {hi ? 'नया खाता?' : 'New here?'}{' '}
              <Link href="/register" className="text-gold font-semibold hover:text-gold-light transition-colors">
                {hi ? 'रजिस्टर करें' : 'Create account'}
              </Link>
            </motion.p>

            <motion.p variants={fadeUp} className="text-center text-ivory/20 text-xs mt-6 font-devanagari">
              {hi ? 'साइन इन करके आप हमारी ' : 'By signing in you agree to our '}
              <Link href="/terms" className="underline hover:text-gold transition-colors">
                {hi ? 'शर्तों' : 'Terms'}
              </Link>
              {' & '}
              <Link href="/privacy" className="underline hover:text-gold transition-colors">
                {hi ? 'गोपनीयता नीति' : 'Privacy Policy'}
              </Link>
              {hi ? ' से सहमत हैं।' : '.'}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
