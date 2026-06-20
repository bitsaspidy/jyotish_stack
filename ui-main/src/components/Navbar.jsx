'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const NAV = [
  { href: '/',            en: 'Home',        hi: 'होम'        },
  { href: '/kundli',      en: 'Kundli',      hi: 'कुंडली'     },
  { href: '/horoscope',        en: 'Horoscope',   hi: 'राशिफल'  },
  { href: '/panchang-muhurat', en: 'Muhurta',     hi: 'मुहूर्त'  },
  { href: '/varshphal',        en: 'Varshphal',   hi: 'वर्षफल'  },
  { href: '/matchmaking', en: 'Matching',    hi: 'मिलान'      },
  { href: '/predictions', en: 'Predictions', hi: 'भविष्यवाणी' },
  { href: '/pricing',     en: 'Pricing',     hi: 'मूल्य'      },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const { user, logout } = useAuth();
  const { lang, toggleLang } = useLang();
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navBg = scrolled
    ? 'bg-cosmos-900/95 backdrop-blur-xl border-b border-gold/20 shadow-cosmos'
    : 'bg-cosmos-800/70 backdrop-blur-md border-b border-white/5';

  return (
    <motion.nav initial={{ y: -72 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navBg}`}>

      {/* ── Desktop bar ─────────────────────────────────────────────── */}
      <div className="max-w-8xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Logo size={38} />
          <div className="hidden sm:block leading-tight">
            <p className="font-serif text-gold font-bold text-base tracking-wide">Jyotish Stack</p>
            <p className="text-gold/40 text-[10px] tracking-[0.25em] uppercase">AI Platform</p>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(l => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-sm transition-colors duration-200 ${
                  active ? 'text-gold' : 'text-ivory/65 hover:text-ivory'
                }`}>
                {lang === 'hi' ? l.hi : l.en}
                {active && (
                  <motion.span layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {/* Lang toggle */}
          <button onClick={toggleLang}
            className="hidden sm:flex text-[11px] border border-gold/35 text-gold/80 hover:text-gold hover:border-gold px-3 py-1.5 rounded-sm transition-colors font-devanagari">
            {lang === 'en' ? 'हिन्दी' : 'EN'}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/account"
                className="text-sm text-ivory/70 hover:text-gold transition-colors flex items-center gap-1.5">
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>
                  {user.name?.[0]?.toUpperCase() || '?'}
                </span>
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout}
                className="text-xs border border-gold/40 text-gold/80 hover:text-gold hover:border-gold px-4 py-2 rounded-sm transition-colors">
                {lang === 'hi' ? 'बाहर' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login"
                className="text-sm text-ivory/65 hover:text-ivory transition-colors px-3 py-2">
                {lang === 'hi' ? 'लॉगिन' : 'Login'}
              </Link>
              <Link href="/register"
                className="btn-gold text-xs px-5 py-2.5 font-semibold">
                {lang === 'hi' ? 'शुरू करें' : 'Get Started'}
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => setMenuOpen(v => !v)}
            className="md:hidden text-ivory/70 hover:text-gold p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile menu ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-gold/15 bg-cosmos-900/98 backdrop-blur-xl">
            <div className="px-5 py-4 space-y-1">
              {NAV.map(l => (
                <Link key={l.href} href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                    pathname === l.href ? 'text-gold bg-gold/8' : 'text-ivory/65 hover:text-ivory'
                  }`}>
                  {lang === 'hi' ? l.hi : l.en}
                </Link>
              ))}

              <div className="pt-3 border-t border-gold/10 flex flex-col gap-2">
                <button onClick={toggleLang}
                  className="text-xs border border-gold/35 text-gold px-4 py-2 rounded-sm w-full">
                  {lang === 'en' ? 'हिन्दी में देखें' : 'Switch to English'}
                </button>
                {user ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                        className="text-xs border border-gold/25 text-ivory/70 hover:text-gold px-3 py-2.5 rounded-sm text-center transition-colors">
                        {lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                      </Link>
                      <Link href="/account" onClick={() => setMenuOpen(false)}
                        className="text-xs border border-gold/35 text-gold/80 hover:text-gold px-3 py-2.5 rounded-sm text-center transition-colors">
                        {lang === 'hi' ? 'प्रोफाइल' : 'My Account'}
                      </Link>
                    </div>
                    <button onClick={handleLogout}
                      className="btn-outline-gold text-xs py-2.5 w-full text-center">
                      {lang === 'hi' ? 'बाहर' : 'Logout'}
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMenuOpen(false)}
                      className="btn-outline-gold text-xs text-center py-2.5">
                      {lang === 'hi' ? 'लॉगिन' : 'Login'}
                    </Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)}
                      className="btn-gold text-xs text-center py-2.5 font-semibold">
                      {lang === 'hi' ? 'शुरू करें' : 'Get Started'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
