'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { t } from '../lib/astroI18n';

// Grouped navigation — direct links + dropdown groups (keeps the bar compact).
const NAV = [
  { href: '/', en: 'Home', hi: 'होम' },
  {
    en: 'Kundli', hi: 'कुंडली',
    children: [
      { href: '/free-kundli',  en: 'Free Kundli',      hi: 'फ्री कुंडली'  },
      { href: '/kundli',       en: 'My Kundli',        hi: 'मेरी कुंडली'  },
      { href: '/matchmaking',  en: 'Kundli Matching',  hi: 'कुंडली मिलान' },
      { href: '/varshphal',    en: 'Varshphal',        hi: 'वर्षफल'       },
    ],
  },
  {
    en: 'Horoscope', hi: 'राशिफल',
    children: [
      { href: '/horoscope',           en: 'Daily Horoscope',       hi: 'दैनिक राशिफल'  },
      { href: '/predictions',         en: 'Predictions',           hi: 'भविष्यवाणी'    },
      { href: '/planetary-positions', en: 'Planetary Positions',   hi: 'ग्रह स्थिति'   },
    ],
  },
  {
    en: 'Panchang', hi: 'पंचांग',
    children: [
      { href: '/panchang-muhurat', en: 'Panchang & Muhurta', hi: 'पंचांग व मुहूर्त' },
      { href: '/festivals',        en: 'Festivals 2026',     hi: 'त्योहार 2026'     },
    ],
  },
  { href: '/calculators', en: 'Calculators', hi: 'कैलकुलेटर' },
  { href: '/remedies',    en: 'Remedies',    hi: 'उपाय'      },
  { href: '/pricing',     en: 'Pricing',     hi: 'मूल्य'     },
];

const Chevron = () => (
  <svg className="w-3 h-3 opacity-60 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const { user, logout } = useAuth();
  const { lang, setLang, langs } = useLang();
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

  const isActive = (item) =>
    item.href ? pathname === item.href
              : item.children?.some((c) => pathname === c.href);

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

        {/* Desktop nav (links + dropdown groups) */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV.map((item) => {
            const active = isActive(item);
            if (!item.children) {
              return (
                <Link key={item.href} href={item.href}
                  className={`relative px-3.5 py-2 text-sm font-medium rounded-sm transition-colors duration-200 ${
                    active ? 'text-gold' : 'text-ivory/65 hover:text-ivory'
                  }`}>
                  {t(lang, item.en, item.hi)}
                  {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gold rounded-full" />}
                </Link>
              );
            }
            return (
              <div key={item.en} className="relative group">
                <button
                  className={`flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-sm transition-colors duration-200 ${
                    active ? 'text-gold' : 'text-ivory/65 hover:text-ivory'
                  }`}>
                  {t(lang, item.en, item.hi)} <Chevron />
                  {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gold rounded-full" />}
                </button>
                {/* pt-2 forms a hover bridge so the panel doesn't close between button and menu */}
                <div className="absolute left-0 top-full pt-2 min-w-[210px] invisible opacity-0 translate-y-1
                                group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
                  <div
                    className="rounded-xl border border-gold/30 py-2 overflow-hidden"
                    style={{
                      background:'linear-gradient(145deg, #171B34 0%, #0B0D1A 72%, #080A16 100%)',
                      boxShadow:'0 22px 50px rgba(0,0,0,0.62), 0 0 0 1px rgba(212,175,55,0.05) inset',
                    }}>
                    {item.children.map((c) => (
                      <Link key={c.href} href={c.href}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          pathname === c.href ? 'text-gold bg-gold/10' : 'text-ivory/70 hover:text-gold hover:bg-white/5'
                        }`}>
                        {t(lang, c.en, c.hi)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {/* Language picker */}
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language"
            className="hidden sm:block text-[11px] border border-gold/35 text-gold/80 hover:text-gold hover:border-gold px-2 py-1.5 rounded-sm transition-colors font-devanagari bg-transparent cursor-pointer"
            style={{ background: 'transparent' }}>
            {langs.map((l) => (
              <option key={l.code} value={l.code} style={{ background: '#111428', color: '#F5F0E8' }}>
                {l.native}
              </option>
            ))}
          </select>

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
                {t(lang, 'Logout', 'बाहर')}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login"
                className="text-sm text-ivory/65 hover:text-ivory transition-colors px-3 py-2">
                {t(lang, 'Login', 'लॉगिन')}
              </Link>
              <Link href="/register"
                className="btn-gold text-xs px-5 py-2.5 font-semibold">
                {t(lang, 'Get Started', 'शुरू करें')}
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
            className="md:hidden overflow-hidden border-t border-gold/15"
            style={{ background:'linear-gradient(180deg, #111428 0%, #090B19 100%)' }}>
            <div className="px-5 py-4 space-y-1 max-h-[75vh] overflow-y-auto">
              {NAV.map((item) => {
                if (!item.children) {
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                        pathname === item.href ? 'text-gold bg-gold/8' : 'text-ivory/65 hover:text-ivory'
                      }`}>
                      {t(lang, item.en, item.hi)}
                    </Link>
                  );
                }
                return (
                  <div key={item.en} className="pt-1.5">
                    <p className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-[0.15em] text-gold/50 font-semibold">
                      {t(lang, item.en, item.hi)}
                    </p>
                    {item.children.map((c) => (
                      <Link key={c.href} href={c.href} onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 pl-6 pr-3 py-2 rounded text-sm transition-colors ${
                          pathname === c.href ? 'text-gold bg-gold/8' : 'text-ivory/60 hover:text-ivory'
                        }`}>
                        {t(lang, c.en, c.hi)}
                      </Link>
                    ))}
                  </div>
                );
              })}

              <div className="pt-3 border-t border-gold/10 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  {langs.map((l) => (
                    <button key={l.code} onClick={() => setLang(l.code)}
                      className={`text-xs border px-2 py-2 rounded-sm font-devanagari transition-colors ${
                        lang === l.code ? 'border-gold text-gold bg-gold/10' : 'border-gold/25 text-ivory/60 hover:text-gold'
                      }`}>
                      {l.native}
                    </button>
                  ))}
                </div>
                {user ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                        className="text-xs border border-gold/25 text-ivory/70 hover:text-gold px-3 py-2.5 rounded-sm text-center transition-colors">
                        {t(lang, 'Dashboard', 'डैशबोर्ड')}
                      </Link>
                      <Link href="/account" onClick={() => setMenuOpen(false)}
                        className="text-xs border border-gold/35 text-gold/80 hover:text-gold px-3 py-2.5 rounded-sm text-center transition-colors">
                        {t(lang, 'My Account', 'प्रोफाइल')}
                      </Link>
                    </div>
                    <button onClick={handleLogout}
                      className="btn-outline-gold text-xs py-2.5 w-full text-center">
                      {t(lang, 'Logout', 'बाहर')}
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMenuOpen(false)}
                      className="btn-outline-gold text-xs text-center py-2.5">
                      {t(lang, 'Login', 'लॉगिन')}
                    </Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)}
                      className="btn-gold text-xs text-center py-2.5 font-semibold">
                      {t(lang, 'Get Started', 'शुरू करें')}
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
