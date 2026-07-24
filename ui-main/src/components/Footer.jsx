'use client';
import { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { BRAND_NAME, TRADEMARK_SYMBOL, LEGAL_ENTITY, TRADEMARK_APP_NO, TRADEMARK_CLASS, copyrightLine } from '../lib/brand';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';
import api from '../lib/api';
import toast from 'react-hot-toast';

const YOUTUBE_URL = 'https://www.youtube.com/@JyotishStack';

// Real internal routes only — every one of these pages exists.
const LINK_GROUPS = [
  { title: ['Astrology', 'ज्योतिष'], links: [
    ['/free-kundli',   'Free Kundli',  'निःशुल्क कुंडली'],
    ['/matchmaking',   'Matchmaking',  'विवाह मिलान'],
    ['/prashna',       'Prashna',      'प्रश्न'],
    ['/varshphal',     'Varshphal',    'वर्षफल'],
    ['/calculators',   'Calculators',  'कैलकुलेटर'],
  ]},
  { title: ['Panchang', 'पंचांग'], links: [
    ['/panchang-muhurat',    'Panchang & Muhurat',  'पंचांग व मुहूर्त'],
    ['/planetary-positions', 'Planetary Positions', 'ग्रह स्थिति'],
    ['/festivals',           'Festivals',           'त्योहार'],
    ['/muhurat/marriage',    'Marriage Muhurat',    'विवाह मुहूर्त'],
  ]},
  { title: ['Horoscope', 'राशिफल'], links: [
    ['/horoscope',         'Daily Horoscope', 'दैनिक राशिफल'],
    ['/horoscope/weekly',  'Weekly',          'साप्ताहिक'],
    ['/horoscope/monthly', 'Monthly',         'मासिक'],
    ['/horoscope/yearly',  'Yearly',          'वार्षिक'],
  ]},
  { title: ['Company', 'कंपनी'], links: [
    ['/about',     'About Us',  'हमारे बारे में'],
    ['/pricing',   'Pricing',   'मूल्य'],
    ['/blog',      'Blog',      'ब्लॉग'],
    ['/remedies',  'Remedies',  'उपाय'],
  ]},
];

const LEGAL_LINKS = [
  ['/terms',         'Terms',      'नियम'],
  ['/privacy',       'Privacy',    'गोपनीयता'],
  ['/refund-policy', 'Refund',     'धनवापसी'],
  ['/disclaimer',    'Disclaimer', 'अस्वीकरण'],
  ['/cookie-policy', 'Cookies',    'कुकीज़'],
];

export default function Footer() {
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const t = (en, hi) => translate(lang, en, hi);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success(t('Subscribed successfully!', 'सफलतापूर्वक सदस्यता ली!'));
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative border-t border-gold/15 bg-cosmos-900/80 backdrop-blur-sm mt-20">
      <div className="max-w-8xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-10">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo size={44} />
              <div>
                <h3 className="font-serif text-gold text-xl font-bold">
                  {BRAND_NAME}
                  <sup className="text-[0.5em] font-normal ml-[1px] align-super">{TRADEMARK_SYMBOL}</sup>
                </h3>
                <p className="text-ivory/40 text-xs tracking-widest font-devanagari">ज्योतिष स्टैक</p>
              </div>
            </div>
            <p className="text-ivory/60 text-sm leading-relaxed mb-5 max-w-sm font-devanagari">
              {t('The confluence of ancient Vedic astrology and modern AI intelligence.', 'प्राचीन वैदिक ज्योतिष और आधुनिक AI तकनीक का संगम।')}
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm mb-5">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t('Your email', 'आपका ईमेल')}
                className="input-royal flex-1 text-sm py-2" />
              <button type="submit" disabled={loading} className="btn-gold text-xs px-4 py-2 whitespace-nowrap">
                {loading ? '...' : t('Subscribe', 'सदस्य बनें')}
              </button>
            </form>

            {/* Social */}
            <div className="flex items-center gap-3">
              <span className="text-ivory/40 text-xs uppercase tracking-wider">{t('Follow', 'जुड़ें')}</span>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer"
                aria-label="YouTube — Jyotish Stack"
                className="inline-flex items-center gap-2 text-ivory/60 hover:text-gold transition-colors group">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold/20 bg-gold/5 group-hover:border-gold/50 transition-colors">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
                  </svg>
                </span>
                <span className="text-xs">YouTube</span>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {LINK_GROUPS.map((group) => (
            <div key={group.title[0]}>
              <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">
                {t(group.title[0], group.title[1])}
              </h4>
              <ul className="space-y-2 text-sm text-ivory/60">
                {group.links.map(([href, en, hi]) => (
                  <li key={en}>
                    <Link href={href} className="hover:text-gold transition-colors">
                      {t(en, hi)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider-gold mt-12" />

        {/* Legal row */}
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6 text-xs">
          {LEGAL_LINKS.map(([href, en, hi]) => (
            <Link key={href} href={href} className="text-ivory/45 hover:text-gold transition-colors">
              {t(en, hi)}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-ivory/40 text-xs">
          <div className="text-center md:text-left">
            <p>{copyrightLine()} — <span className="font-devanagari">ज्योतिष स्टैक</span></p>
            {/* Names the mark, its real OWNER (the entity, not the brand) and the
                public application number. Says "trade mark", never "registered
                trade mark" — the application is pending. See lib/brand.js. */}
            <p className="mt-1 text-ivory/30">
              {BRAND_NAME}{TRADEMARK_SYMBOL} and the Jyot Chakra logo are trade marks of {LEGAL_ENTITY}
              {' '}(TM Application No. {TRADEMARK_APP_NO}, Class {TRADEMARK_CLASS} — pending).
              Logo artwork is copyright-protected.
            </p>
          </div>
          <p>jyotishstack.com</p>
        </div>
      </div>
    </footer>
  );
}
