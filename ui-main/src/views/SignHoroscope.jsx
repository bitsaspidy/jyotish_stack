'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t } from '../lib/astroI18n';
import api from '../lib/api';
import { SIGNS, signBySlug } from '../lib/rashiSigns';

const GOLD  = '#D4AF37';
const MUTED = 'rgba(245,240,232,0.55)';
const SCORE_COLOR = { 1:'#EF4444', 2:'#F97316', 3:'#F59E0B', 4:'#22C55E', 5:'#10B981' };

function fmtDate(dateStr, lang) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function Section({ icon, title, text }) {
  if (!text) return null;
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px' }}>
      <p style={{ fontSize:10, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{icon} {title}</p>
      <p style={{ fontSize:12.5, color:'rgba(245,240,232,0.82)', lineHeight:1.75, fontFamily:'var(--font-devanagari),sans-serif' }}>{text}</p>
    </div>
  );
}

export default function SignHoroscope({ sign }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const meta = signBySlug(sign);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Localized picker for a server language-map ({en, hi, ta, …})
  const L = (m) => (m && (m[lang] ?? (hi ? m.hi : m.en) ?? m.en)) || '';

  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    api.get(`/horoscope/daily?rashi=${meta.num}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [meta?.num]);

  if (!meta) return null;
  const r = data?.rashi || null;
  const scoreColor = r ? SCORE_COLOR[r.score] : GOLD;
  const signName = t(lang, meta.en, meta.hi);

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-6">
          <div style={{ fontSize:44, marginBottom:4 }}>{meta.symbol}</div>
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            {t(lang, `${meta.en} Horoscope Today`, `${meta.hi} राशिफल आज`)}
          </h1>
          <p style={{ color:MUTED, fontSize:12, marginTop:6 }}>
            {meta.dates}{data?.date ? ` · ${fmtDate(data.date, lang)}` : ''}
          </p>
        </motion.div>

        {/* Period tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:16 }}>
          {[
            { href:`/horoscope/${meta.slug}`, label:t(lang,'Daily','दैनिक'), active:true },
            { href:'/horoscope/weekly',       label:t(lang,'Weekly','साप्ताहिक') },
            { href:'/horoscope/monthly',      label:t(lang,'Monthly','मासिक') },
            { href:'/horoscope/yearly',       label:t(lang,'Yearly','वार्षिक') },
          ].map((tab) => (
            <Link key={tab.href} href={tab.href} style={{
              fontSize:12, fontWeight:600, textDecoration:'none', padding:'6px 15px', borderRadius:18,
              border:`1px solid ${tab.active ? GOLD : 'rgba(212,175,55,0.2)'}`,
              background: tab.active ? 'rgba(212,175,55,0.12)' : 'transparent',
              color: tab.active ? GOLD : 'rgba(245,240,232,0.5)',
            }}>{tab.label}</Link>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Consulting the planets…', 'ग्रहों से परामर्श हो रहा है…')}</p>
        ) : !r ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Unable to load horoscope.', 'राशिफल लोड नहीं हो सका।')}</p>
        ) : (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card-royal p-5" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Score + title */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <p style={{ fontSize:16, fontWeight:800, color:scoreColor }}>{L(r.title)}</p>
              <span style={{ letterSpacing:2 }}>
                {[1,2,3,4,5].map((n) => <span key={n} style={{ color: n <= r.score ? scoreColor : 'rgba(255,255,255,0.12)', fontSize:15 }}>★</span>)}
              </span>
            </div>
            {r.sade_sati?.active && (
              <p style={{ fontSize:11, color:'#F59E0B', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:8, padding:'8px 12px' }}>
                ⚠ {t(lang, `Sade Sati ${r.sade_sati.phase} phase is running`, 'साढ़ेसाती चल रही है')}
              </p>
            )}

            {/* Overview */}
            <p style={{ fontSize:13, color:'rgba(245,240,232,0.85)', lineHeight:1.85, fontFamily:'var(--font-devanagari),sans-serif' }}>{L(r.description)}</p>

            {/* Advice + caution */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }} className="max-sm:!grid-cols-1">
              <div style={{ padding:'12px 14px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#22C55E', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>✓ {t(lang,"Today's Guidance",'आज का मार्गदर्शन')}</p>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>{L(r.advice)}</p>
              </div>
              <div style={{ padding:'12px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>⚠ {t(lang,'Caution','सावधानी')}</p>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>{L(r.caution)}</p>
              </div>
            </div>

            {/* Life-area sections */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }} className="max-sm:!grid-cols-1">
              <Section icon="💼" title={t(lang,'Career','करियर')}     text={L(r.career)} />
              <Section icon="❤️" title={t(lang,'Love','प्रेम')}        text={L(r.love)} />
              <Section icon="💰" title={t(lang,'Finance','धन')}        text={L(r.finance)} />
              <Section icon="🌿" title={t(lang,'Health','स्वास्थ्य')}  text={L(r.health)} />
            </div>

            {/* Lucky */}
            {r.lucky && (
              <p style={{ fontSize:11, color:MUTED }}>
                🍀 {t(lang,'Lucky','शुभ')}: {r.lucky.numbers?.join(', ')} · {r.lucky.colors?.join(', ')} · {r.lucky.gemstone} · {t(lang, r.lucky.day || '', r.lucky.day)}
              </p>
            )}
          </motion.div>
        )}

        {/* Personalisation CTA */}
        <div className="card-royal p-5 mt-6" style={{ border:'1px solid rgba(245,158,11,0.3)' }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#F59E0B', marginBottom:6 }}>
            {t(lang, `This is your Moon-sign (${meta.en}) forecast`, `यह आपकी चंद्र राशि (${meta.hi}) का फल है`)}
          </p>
          <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginBottom:12 }}>
            {t(lang,
              'A general sun/moon-sign reading is a starting point. Your full birth chart — lagna, dasha and doshas — reveals what today really means for YOU.',
              'सामान्य राशि-फल केवल शुरुआत है। आपकी पूर्ण जन्म कुंडली — लग्न, दशा और दोष — बताती है कि आज आपके लिए वास्तव में क्या है।')}
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link href="/free-kundli" className="btn-gold" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none' }}>
              {t(lang, '🔯 Free Personalised Kundli', '🔯 निःशुल्क व्यक्तिगत कुंडली')}
            </Link>
            <Link href="/horoscope" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none', border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600 }}>
              {t(lang, 'All Signs — Today', 'सभी राशियां — आज')}
            </Link>
          </div>
        </div>

        {/* Sign switcher (internal linking) */}
        <div style={{ marginTop:22 }}>
          <p style={{ fontSize:11, color:MUTED, textAlign:'center', marginBottom:10 }}>{t(lang, 'Read another sign', 'दूसरी राशि पढ़ें')}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(88px, 1fr))', gap:8 }}>
            {SIGNS.map((s) => {
              const active = s.slug === meta.slug;
              return (
                <Link key={s.slug} href={`/horoscope/${s.slug}`} style={{
                  textDecoration:'none', textAlign:'center', padding:'10px 4px', borderRadius:10,
                  border:`1px solid ${active ? GOLD : 'rgba(255,255,255,0.08)'}`,
                  background: active ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{ fontSize:18 }}>{s.symbol}</div>
                  <div style={{ fontSize:10, fontWeight:600, color: active ? GOLD : '#CBD5E1', marginTop:2 }}>{t(lang, s.en, s.hi)}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
