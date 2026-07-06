'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLang } from '../../context/LangContext';
import { t } from '../../lib/astroI18n';

export default function PrashnaError({ error, reset }) {
  const { lang } = useLang();

  useEffect(() => {
    console.error('[PrashnaPage]', error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center px-4" style={{ background:'linear-gradient(180deg,#0B0E23 0%,#141838 100%)' }}>
      <section className="card-royal p-6 text-center" style={{ width:'min(100%,520px)' }}>
        <p className="text-gold text-3xl" aria-hidden="true">◈</p>
        <h1 className="font-serif text-gold text-2xl font-bold mt-3">
          {t(lang, 'The Prashna page needs a fresh start', 'प्रश्न पृष्ठ को फिर से शुरू करने की आवश्यकता है')}
        </h1>
        <p className="text-ivory/60 text-sm leading-7 mt-3">
          {t(lang, 'Your question was not saved. Please try the page again, or return home if the problem continues.', 'आपका प्रश्न सहेजा नहीं गया। कृपया पृष्ठ को फिर से आजमाएं, या समस्या जारी रहने पर होम पेज पर जाएं।')}
        </p>
        <div className="flex justify-center gap-3 flex-wrap mt-5">
          <button type="button" onClick={reset} className="btn-gold" style={{ padding:'10px 18px', fontWeight:800 }}>
            {t(lang, 'Try Again', 'फिर से प्रयास करें')}
          </button>
          <Link href="/" style={{ padding:'9px 17px', border:'1px solid rgba(212,175,55,0.35)', color:'#D4AF37', borderRadius:7, textDecoration:'none' }}>
            {t(lang, 'Return Home', 'होम पेज पर जाएं')}
          </Link>
        </div>
      </section>
    </main>
  );
}
