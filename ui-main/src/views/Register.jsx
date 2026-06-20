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

const fadeUp = { hidden:{ opacity:0, y:20 }, show:{ opacity:1, y:0, transition:{ duration:0.5 } } };
const stag   = { show:{ transition:{ staggerChildren:0.08 } } };

// Decorative cosmos panel shown on lg+
function CosmosPanel({ lang }) {
  const hi = lang === 'hi';
  const PERKS = [
    { icon:'🪐', en:'Free Kundli generation',     hi:'निःशुल्क कुंडली निर्माण' },
    { icon:'💫', en:'AI-powered predictions',      hi:'AI भविष्यवाणी' },
    { icon:'💍', en:'Kundli matchmaking',          hi:'विवाह मिलान' },
    { icon:'🌙', en:'Daily horoscope & Panchang',  hi:'दैनिक राशिफल और पंचांग' },
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background:'linear-gradient(160deg, #1a1f42 0%, #0e1128 60%, #070919 100%)' }}>

      {/* Orbital decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[360, 260, 170].map((size, i) => (
          <div key={size} style={{
            position:'absolute', width:size, height:size, borderRadius:'50%',
            border:`1px solid rgba(212,175,55,${0.1 - i * 0.025})`,
          }}
          className={i % 2 === 0 ? 'animate-spin-slow' : 'animate-spin-rev'}
          />
        ))}
        <div style={{ width:14, height:14, borderRadius:'50%', background:GOLD,
          boxShadow:`0 0 20px ${GOLD}`, opacity:0.75 }} />
      </div>

      {/* Floating dots */}
      {[
        { size:6, top:'12%', left:'22%', delay:'0s',   dur:6 },
        { size:4, top:'65%', left:'10%', delay:'1.8s', dur:8 },
        { size:5, top:'38%', right:'14%', delay:'0.6s', dur:5.5 },
        { size:3, top:'85%', right:'22%', delay:'2.2s', dur:7 },
        { size:5, top:'78%', left:'30%', delay:'1s',   dur:6.5 },
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

      {/* Perks list */}
      <div className="relative z-10">
        <p className="text-ivory/40 text-xs uppercase tracking-widest mb-5 font-medium">
          {hi ? 'आपको क्या मिलेगा' : 'What you get for free'}
        </p>
        <ul className="space-y-3.5">
          {PERKS.map(p => (
            <li key={p.en} className="flex items-center gap-3">
              <span className="text-lg shrink-0">{p.icon}</span>
              <span className="text-ivory/65 text-sm font-devanagari">{hi ? p.hi : p.en}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom trust line */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1" style={{ background:'rgba(212,175,55,0.15)' }} />
          <span className="text-ivory/25 text-xs">✦</span>
          <div className="h-px flex-1" style={{ background:'rgba(212,175,55,0.15)' }} />
        </div>
        <p className="text-ivory/30 text-xs text-center font-devanagari">
          {hi ? 'GST-अनुपालित • Razorpay द्वारा भुगतान' : 'GST-compliant • Payments by Razorpay'}
        </p>
      </div>
    </div>
  );
}

export default function Register() {
  const { register: registerUser } = useAuth();
  const { lang } = useLang();
  const router   = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, watch, formState:{ errors } } = useForm();
  const hi = lang === 'hi';

  const onSubmit = async ({ name, email, password }) => {
    setBusy(true);
    try {
      await registerUser({ name, email, password, preferred_language: lang });
      toast.success(hi ? 'स्वागत है! खाता बनाया गया।' : 'Account created! Welcome aboard.');
      router.push('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || (hi ? 'पंजीकरण विफल' : 'Registration failed'));
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
                {hi ? 'खाता बनाएं' : 'Create Account'}
              </h1>
              <p className="text-ivory/40 text-sm font-devanagari">
                {hi ? 'ब्रह्मांडीय यात्रा शुरू करें — निःशुल्क' : 'Begin your cosmic journey — it\'s free'}
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={fadeUp}>
                <label className="block text-ivory/50 text-xs font-medium mb-1.5 uppercase tracking-wider">
                  {hi ? 'पूरा नाम' : 'Full Name'}
                </label>
                <input placeholder={hi ? 'आपका नाम' : 'Your name'} className="input-royal"
                  style={{ transition:'border-color 0.2s' }}
                  {...register('name', {
                    required: hi ? 'नाम आवश्यक है' : 'Name required',
                    minLength: { value:2, message: hi ? 'न्यूनतम 2 अक्षर' : 'Min 2 chars' },
                  })} />
                {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
              </motion.div>

              <motion.div variants={fadeUp}>
                <label className="block text-ivory/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" placeholder="you@example.com" className="input-royal"
                  style={{ transition:'border-color 0.2s' }}
                  {...register('email', { required: hi ? 'ईमेल आवश्यक है' : 'Email required' })} />
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </motion.div>

              <motion.div variants={fadeUp}>
                <label className="block text-ivory/50 text-xs font-medium mb-1.5 uppercase tracking-wider">
                  {hi ? 'पासवर्ड' : 'Password'}
                </label>
                <input type="password" placeholder={hi ? 'न्यूनतम 8 अक्षर' : 'Min 8 characters'} className="input-royal"
                  style={{ transition:'border-color 0.2s' }}
                  {...register('password', {
                    required: hi ? 'पासवर्ड आवश्यक है' : 'Password required',
                    minLength: { value:8, message: hi ? 'न्यूनतम 8 अक्षर' : 'Min 8 chars' },
                  })} />
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
              </motion.div>

              <motion.div variants={fadeUp}>
                <label className="block text-ivory/50 text-xs font-medium mb-1.5 uppercase tracking-wider">
                  {hi ? 'पासवर्ड दोहराएं' : 'Confirm Password'}
                </label>
                <input type="password" placeholder={hi ? 'पुनः दर्ज करें' : 'Repeat password'} className="input-royal"
                  style={{ transition:'border-color 0.2s' }}
                  {...register('confirm', {
                    required: hi ? 'पुष्टि करें' : 'Please confirm',
                    validate: v => v === watch('password') || (hi ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match'),
                  })} />
                {errors.confirm && <p className="text-red-400 text-xs mt-1.5">{errors.confirm.message}</p>}
              </motion.div>

              <motion.div variants={fadeUp} className="pt-1">
                <button type="submit" disabled={busy}
                  className="btn-gold w-full py-3.5 text-[15px] font-semibold text-center block relative overflow-hidden"
                  style={{ transition:'opacity 0.2s, transform 0.15s' }}>
                  <span className={busy ? 'opacity-0' : ''}>
                    {hi ? 'खाता बनाएं' : 'Create Account'}
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
              {hi ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <Link href="/login" className="text-gold font-semibold hover:text-gold-light transition-colors">
                {hi ? 'लॉगिन करें' : 'Sign in'}
              </Link>
            </motion.p>

            <motion.p variants={fadeUp} className="text-center text-ivory/20 text-xs mt-4 font-devanagari leading-relaxed">
              {hi ? 'खाता बनाकर आप हमारी ' : 'By creating an account you agree to our '}
              <Link href="/terms" className="underline hover:text-gold transition-colors">
                {hi ? 'शर्तों' : 'Terms'}
              </Link>
              {hi ? ', ' : ', '}
              <Link href="/privacy" className="underline hover:text-gold transition-colors">
                {hi ? 'गोपनीयता नीति' : 'Privacy Policy'}
              </Link>
              {hi ? ' और ' : ' & '}
              <Link href="/disclaimer" className="underline hover:text-gold transition-colors">
                {hi ? 'अस्वीकरण' : 'Disclaimer'}
              </Link>
              {hi ? ' से सहमत हैं।' : '.'}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
