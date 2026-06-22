'use client';
import { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Footer() {
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success(lang === 'hi' ? 'सफलतापूर्वक सदस्यता ली!' : 'Subscribed successfully!');
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo size={44} />
              <div>
                <h3 className="font-serif text-gold text-xl font-bold">Jyotish Stack AI</h3>
                <p className="text-ivory/40 text-xs tracking-widest font-devanagari">ज्योतिष स्टैक</p>
              </div>
            </div>
            <p className="text-ivory/60 text-sm leading-relaxed mb-6 max-w-sm font-devanagari">
              {lang === 'hi'
                ? 'प्राचीन वैदिक ज्योतिष और आधुनिक AI तकनीक का संगम।'
                : 'The confluence of ancient Vedic astrology and modern AI intelligence.'}
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={lang === 'hi' ? 'आपका ईमेल' : 'Your email'}
                className="input-royal flex-1 text-sm py-2" />
              <button type="submit" disabled={loading} className="btn-gold text-xs px-4 py-2 whitespace-nowrap">
                {loading ? '...' : (lang === 'hi' ? 'सदस्य बनें' : 'Subscribe')}
              </button>
            </form>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">
              {lang === 'hi' ? 'सेवाएं' : 'Services'}
            </h4>
            <ul className="space-y-2 text-sm text-ivory/60">
              {[
                ['/kundli', 'Kundli Chart', 'कुंडली चार्ट'],
                ['/matchmaking', 'Matchmaking', 'विवाह मिलान'],
                ['/predictions', 'Daily Predictions', 'दैनिक भविष्यवाणी'],
                ['/predictions', 'Dasha Analysis', 'दशा विश्लेषण'],
              ].map(([href, en, hi]) => (
                <li key={en}>
                  <Link href={href} className="hover:text-gold transition-colors">
                    {lang === 'hi' ? hi : en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">
              {lang === 'hi' ? 'कंपनी' : 'Company'}
            </h4>
            <ul className="space-y-2 text-sm text-ivory/60">
              {[
                ['/pricing',         'Pricing',            'मूल्य'],
                ['/terms',           'Terms & Conditions', 'नियम व शर्तें'],
                ['/privacy',         'Privacy Policy',     'गोपनीयता नीति'],
                ['/refund-policy',   'Refund Policy',      'धनवापसी नीति'],
                ['/disclaimer',      'Disclaimer',         'अस्वीकरण'],
              ].map(([href, en, hi]) => (
                <li key={en}>
                  <Link href={href} className="hover:text-gold transition-colors">
                    {lang === 'hi' ? hi : en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-gold mt-10" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-ivory/40 text-xs">
          <p>© {new Date().getFullYear()} Jyotish Stack AI — <span className="font-devanagari">ज्योतिष स्टैक</span></p>
          <p>jyotishstack.com</p>
        </div>
      </div>
    </footer>
  );
}
