'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '../../context/LangContext';
import { t } from '../../lib/astroI18n';

const TABS = [
  { href:'/horoscope',         en:'Daily',   hi:'दैनिक'   },
  { href:'/horoscope/weekly',  en:'Weekly',  hi:'साप्ताहिक' },
  { href:'/horoscope/monthly', en:'Monthly', hi:'मासिक'   },
  { href:'/horoscope/yearly',  en:'Yearly',  hi:'वार्षिक'  },
];

export default function PeriodTabs() {
  const { lang } = useLang();
  const pathname = usePathname();
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} style={{
            fontSize:12, fontWeight:600, textDecoration:'none',
            padding:'7px 16px', borderRadius:20,
            border:`1px solid ${active ? '#D4AF37' : 'rgba(212,175,55,0.2)'}`,
            background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
            color: active ? '#D4AF37' : 'rgba(245,240,232,0.5)',
            transition:'all 0.2s',
          }}>
            {t(lang, tab.en, tab.hi)}
          </Link>
        );
      })}
    </div>
  );
}
