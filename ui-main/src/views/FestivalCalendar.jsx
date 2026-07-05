'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t } from '../lib/astroI18n';
import api from '../lib/api';

const GOLD  = '#D4AF37';
const MUTED = 'rgba(245,240,232,0.55)';
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_HI = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];

const CATEGORY_FILTERS = [
  { key:'all',        en:'All',         hi:'सभी' },
  { key:'major',      en:'Major',       hi:'प्रमुख' },
  { key:'devotional', en:'Devotional',  hi:'धार्मिक' },
  { key:'auspicious', en:'Auspicious',  hi:'शुभ' },
];

export default function FestivalCalendar() {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setLoading(true);
    api.get(`/panchang/festivals?year=${year}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  const availableYears = data?.available_years || [2026];

  const festivals = (data?.festivals || []).filter((f) => filter === 'all' || f.category === filter);
  const byMonth = {};
  for (const f of festivals) {
    const m = parseInt(f.date.slice(5, 7), 10) - 1;
    (byMonth[m] ??= []).push(f);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-12">

        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-6">
          <h1 className="font-serif text-gold" style={{ fontSize:30, fontWeight:800 }}>
            🪔 {t(lang, `Hindu Festivals ${year}`, `हिंदू त्योहार ${year}`)}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:600, margin:'8px auto 0', lineHeight:1.7 }}>
            {t(lang,
              `Complete list of major Hindu festivals and vrat dates in ${year} — with day, tithi significance and category.`,
              `${year} के प्रमुख हिंदू त्योहार एवं व्रत तिथियां — वार, महत्त्व एवं श्रेणी सहित।`)}
          </p>
        </motion.div>

        {/* Year selector */}
        {availableYears.length > 1 && (
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14 }}>
            {availableYears.map((y) => (
              <button key={y} onClick={() => setYear(y)} style={{
                fontSize:13, fontWeight:700, cursor:'pointer', padding:'6px 20px', borderRadius:10,
                border:`1px solid ${year === y ? GOLD : 'rgba(212,175,55,0.25)'}`,
                background: year === y ? 'rgba(212,175,55,0.14)' : 'transparent',
                color: year === y ? GOLD : 'rgba(245,240,232,0.6)',
              }}>{y}</button>
            ))}
          </div>
        )}

        {/* Category filter */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:22 }}>
          {CATEGORY_FILTERS.map((c) => (
            <button key={c.key} onClick={() => setFilter(c.key)} style={{
              fontSize:12, fontWeight:600, cursor:'pointer', padding:'6px 15px', borderRadius:18,
              border:`1px solid ${filter === c.key ? GOLD : 'rgba(212,175,55,0.2)'}`,
              background: filter === c.key ? 'rgba(212,175,55,0.12)' : 'transparent',
              color: filter === c.key ? GOLD : 'rgba(245,240,232,0.5)',
            }}>{t(lang, c.en, c.hi)}</button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Loading festivals…', 'त्योहार लोड हो रहे हैं…')}</p>
        ) : !data || data.count === 0 ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Festival calendar unavailable.', 'त्योहार कैलेंडर उपलब्ध नहीं।')}</p>
        ) : (
          Object.keys(byMonth).map((m) => (
            <motion.div key={m} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card-royal p-5 mb-4">
              <p className="font-serif text-gold text-sm font-semibold mb-3">📅 {hi ? MONTHS_HI[m] : MONTHS_EN[m]} {year}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {byMonth[m].map((f) => {
                  const isPast = f.date < todayStr;
                  const d = new Date(f.date + 'T00:00:00Z').getUTCDate();
                  return (
                    <div key={f.slug + f.date} style={{
                      display:'flex', gap:14, alignItems:'flex-start', padding:'10px 12px', borderRadius:10,
                      background: isPast ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.045)',
                      border:`1px solid ${f.color}22`, opacity: isPast ? 0.55 : 1,
                    }}>
                      <div style={{ textAlign:'center', minWidth:44 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:f.color, lineHeight:1 }}>{d}</div>
                        <div style={{ fontSize:9, color:MUTED, marginTop:2 }}>{t(lang, f.weekday_en, f.weekday_hi).slice(0,3)}</div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <span style={{ fontSize:14, fontWeight:700, color:'#F5F0E8' }}>{t(lang, f.name_en, f.name_hi)}</span>
                          <span style={{ fontSize:9, fontWeight:700, color:f.color, border:`1px solid ${f.color}44`, background:`${f.color}14`, borderRadius:12, padding:'1px 8px' }}>
                            {t(lang, f.category_en, f.category_hi)}
                          </span>
                        </div>
                        <p style={{ fontSize:11.5, color:MUTED, lineHeight:1.6, marginTop:3, fontFamily:'var(--font-devanagari),sans-serif' }}>
                          {t(lang, f.desc_en, f.desc_hi)}
                        </p>
                        <Link href={`/planetary-positions?date=${f.date}`} style={{ fontSize:10.5, color:GOLD, textDecoration:'none', marginTop:4, display:'inline-block' }}>
                          🌌 {t(lang, 'Planet positions this day →', 'इस दिन ग्रह स्थिति →')}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}

        {/* CTA + disclaimer */}
        <div className="card-royal p-5 mt-6" style={{ border:'1px solid rgba(245,158,11,0.3)' }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#F59E0B', marginBottom:6 }}>
            🔯 {t(lang, 'Plan your celebrations with the right muhurat', 'सही मुहूर्त के साथ अपने उत्सव की योजना बनाएं')}
          </p>
          <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginBottom:12 }}>
            {t(lang,
              'Festival dates follow the Hindu lunar calendar. Get today\'s full panchang, or a personalised muhurat verified against your own kundli.',
              'त्योहार की तिथियां हिंदू चंद्र कैलेंडर पर आधारित हैं। आज का पूर्ण पंचांग देखें, या अपनी कुंडली से व्यक्तिगत मुहूर्त प्राप्त करें।')}
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link href="/panchang-muhurat" className="btn-gold" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none' }}>
              {t(lang, '📿 Today\'s Panchang', 'आज का पंचांग')}
            </Link>
            <Link href="/muhurat/marriage" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none', border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600 }}>
              {t(lang, '💍 Marriage Muhurat', 'विवाह मुहूर्त')}
            </Link>
          </div>
        </div>

        <p style={{ fontSize:10, color:'rgba(245,240,232,0.3)', textAlign:'center', marginTop:16, lineHeight:1.6 }}>
          {t(lang,
            'Dates follow the drik (observation-based) Hindu calendar and may vary by region and local sunrise. Verify with your local panchang before observance.',
            'तिथियां दृक हिंदू पंचांग पर आधारित हैं और क्षेत्र एवं स्थानीय सूर्योदय अनुसार भिन्न हो सकती हैं। पालन से पूर्व स्थानीय पंचांग से पुष्टि करें।')}
        </p>
      </div>
    </div>
  );
}
