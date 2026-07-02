'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';
import api from '../lib/api';

const GOLD  = '#D4AF37';
const GREEN = '#22C55E';
const AMBER = '#F59E0B';
const MUTED = 'rgba(245,240,232,0.55)';

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_HI = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];

export const OCCASION_LIST = [
  { slug:'marriage',         icon:'💍', en:'Marriage Muhurat',        hi:'विवाह मुहूर्त' },
  { slug:'griha-pravesh',    icon:'🏠', en:'Griha Pravesh Muhurat',   hi:'गृह प्रवेश मुहूर्त' },
  { slug:'naamkaran',        icon:'👶', en:'Naamkaran Muhurat',       hi:'नामकरण मुहूर्त' },
  { slug:'mundan',           icon:'✂️', en:'Mundan Muhurat',          hi:'मुंडन मुहूर्त' },
  { slug:'vehicle-purchase', icon:'🚗', en:'Vehicle Purchase Muhurat', hi:'वाहन खरीद मुहूर्त' },
];

export default function MuhuratOccasion({ occasion }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const t = (en, h) => translate(lang, en, h);
  const year = new Date().getFullYear();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/panchang/muhurat/${occasion}?year=${year}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [occasion, year]);

  // Group dates by month
  const byMonth = {};
  for (const d of data?.dates || []) {
    const m = parseInt(d.date.slice(5, 7), 10) - 1;
    (byMonth[m] ??= []).push(d);
  }

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">

        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-6">
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            {data?.occasion ? `${data.occasion.icon} ${hi ? data.occasion.name_hi : data.occasion.name_en} ${year}` : '…'}
          </h1>
          {data?.occasion && (
            <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:640, margin:'8px auto 0', lineHeight:1.7 }}>
              {hi ? data.occasion.desc_hi : data.occasion.desc_en}
            </p>
          )}
        </motion.div>

        {/* Occasion switcher */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:24 }}>
          {OCCASION_LIST.map((o) => (
            <Link key={o.slug} href={`/muhurat/${o.slug}`} style={{
              fontSize:11, fontWeight:600, textDecoration:'none',
              padding:'6px 14px', borderRadius:18,
              border:`1px solid ${o.slug === occasion ? GOLD : 'rgba(212,175,55,0.2)'}`,
              background: o.slug === occasion ? 'rgba(212,175,55,0.12)' : 'transparent',
              color: o.slug === occasion ? GOLD : 'rgba(245,240,232,0.5)',
            }}>
              {o.icon} {hi ? o.hi : o.en}
            </Link>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t('Finding auspicious dates…', 'शुभ तिथियां खोजी जा रही हैं…')}</p>
        ) : !data ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t('Unable to load muhurat dates.', 'मुहूर्त तिथियां लोड नहीं हो सकीं।')}</p>
        ) : (
          <>
            <p style={{ textAlign:'center', color:MUTED, fontSize:12, marginBottom:20 }}>
              {t(`${data.count} auspicious dates found from ${data.range.from} to ${data.range.to}`,
                 `${data.range.from} से ${data.range.to} तक ${data.count} शुभ तिथियां मिलीं`)}
              &nbsp;·&nbsp;
              <span style={{ color:GREEN }}>◆ {t('Excellent (Siddhi Yoga)', 'उत्कृष्ट (सिद्धि योग)')}</span>
            </p>

            {Object.keys(byMonth).map((m) => (
              <motion.div key={m} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card-royal p-5 mb-4">
                <p className="font-serif text-gold text-sm font-semibold mb-3">
                  📅 {hi ? MONTHS_HI[m] : MONTHS_EN[m]} {year}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:10 }}>
                  {byMonth[m].map((d) => (
                    <div key={d.date} style={{
                      background: d.quality === 'excellent' ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${d.quality === 'excellent' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.09)'}`,
                      borderRadius:10, padding:'10px 12px',
                    }}>
                      <p style={{ fontSize:13, fontWeight:800, color: d.quality === 'excellent' ? GREEN : '#F5F0E8' }}>
                        {d.date.slice(8)} {hi ? MONTHS_HI[m] : MONTHS_EN[m].slice(0, 3)} · {hi ? d.weekday_hi : d.weekday_en}
                        {d.quality === 'excellent' && <span style={{ marginLeft:6 }}>◆</span>}
                      </p>
                      <p style={{ fontSize:10, color:MUTED, marginTop:3, lineHeight:1.6 }}>
                        {hi ? d.tithi_hi : d.tithi_en} · {hi ? d.nakshatra_hi : d.nakshatra_en}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Personalisation CTA */}
            <div className="card-royal p-5 mt-6" style={{ border:'1px solid rgba(245,158,11,0.3)' }}>
              <p style={{ fontSize:13, fontWeight:700, color:AMBER, marginBottom:6 }}>
                ⚠️ {t('These are general muhurat dates', 'ये सामान्य मुहूर्त तिथियां हैं')}
              </p>
              <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginBottom:12 }}>
                {t('The truly right date depends on YOUR kundli — your lagna, moon nakshatra, current dasha and doshas can make a generally auspicious date unsuitable for you (and vice versa). Get your personal muhurta verified against your birth chart.',
                   'सही तिथि आपकी कुंडली पर निर्भर करती है — आपका लग्न, चंद्र नक्षत्र, वर्तमान दशा और दोष किसी सामान्य शुभ तिथि को आपके लिए अनुपयुक्त बना सकते हैं। अपनी जन्म कुंडली से व्यक्तिगत मुहूर्त की पुष्टि कराएं।')}
              </p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <Link href="/register" className="btn-gold" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none' }}>
                  {t('🔯 Check Against My Kundli — Free', '🔯 मेरी कुंडली से मिलान करें — निःशुल्क')}
                </Link>
                <Link href="/panchang-muhurat" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none', border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600 }}>
                  {t("📿 Today's Full Panchang", 'आज का पूर्ण पंचांग')}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
