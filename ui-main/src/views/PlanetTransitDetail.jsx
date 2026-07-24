'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t as translate, planetName } from '../lib/astroI18n';
import api from '../lib/api';

const GOLD = '#D4AF37';
const MUTED = 'rgba(245,240,232,0.55)';

const SLUG_TO_PLANET = {
  sun:'Sun', moon:'Moon', mars:'Mars', mercury:'Mercury', jupiter:'Jupiter',
  venus:'Venus', saturn:'Saturn', rahu:'Rahu', ketu:'Ketu',
};
const META = {
  Sun:{icon:'☉',color:'#F59E0B'}, Moon:{icon:'☽',color:'#94A3B8'}, Mars:{icon:'♂',color:'#EF4444'},
  Mercury:{icon:'☿',color:'#10B981'}, Jupiter:{icon:'♃',color:'#FBBF24'}, Venus:{icon:'♀',color:'#F472B6'},
  Saturn:{icon:'♄',color:'#818CF8'}, Rahu:{icon:'☊',color:'#A78BFA'}, Ketu:{icon:'☋',color:'#6B7280'},
};

const MONTHS = {
  en:['January','February','March','April','May','June','July','August','September','October','November','December'],
  hi:['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'],
};
const WDAYS = {
  en:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  hi:['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'],
};
const pad = (n) => String(n).padStart(2, '0');

// ISO UTC → local (tz offset) formatted string, 12h or 24h clock.
function fmtLocal(iso, tz, hour24, lang) {
  const d = new Date(new Date(iso).getTime() + tz * 3600000);
  const mo = MONTHS[lang === 'hi' ? 'hi' : 'en'][d.getUTCMonth()];
  const wd = WDAYS[lang === 'hi' ? 'hi' : 'en'][d.getUTCDay()];
  let h = d.getUTCHours(); const mi = d.getUTCMinutes();
  let time;
  if (hour24) time = `${pad(h)}:${pad(mi)}`;
  else { const ap = h < 12 ? 'AM' : 'PM'; time = `${pad(h % 12 || 12)}:${pad(mi)} ${ap}`; }
  return `${mo} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${wd} · ${time}`;
}

export default function PlanetTransitDetail({ slug }) {
  const { lang } = useLang();
  const t = (en, hi) => translate(lang, en, hi);
  const planet = SLUG_TO_PLANET[String(slug || '').toLowerCase()] || 'Sun';
  const meta = META[planet] || {};

  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [type, setType] = useState('rashi');   // 'rashi' | 'nakshatra'
  const [hour24, setHour24] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const TZ = 5.5;

  useEffect(() => {
    setLoading(true);
    api.get(`/panchang/planet-transits?planet=${planet}&year=${year}&type=${type}&tz=${TZ}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [planet, year, type]);

  const curSignNum = data?.current?.sign_num;

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-24 pb-16">

        <Link href="/planet-transit" style={{ color:MUTED, fontSize:12, textDecoration:'none' }}>
          ← {t('All planets', 'सभी ग्रह')}
        </Link>

        {/* Header */}
        <div style={{ textAlign:'center', margin:'14px 0 18px' }}>
          <h1 className="font-serif text-gold" style={{ fontSize:26, fontWeight:800, display:'flex', gap:10, justifyContent:'center', alignItems:'center' }}>
            <span style={{ color:meta.color }}>{meta.icon}</span>
            {planetName(planet, lang)} {type === 'nakshatra' ? t('Nakshatra Transit', 'नक्षत्र गोचर') : t('Rashi Transit', 'राशि गोचर')}
          </h1>
          {data?.current && type === 'rashi' && (
            <p style={{ color:'rgba(245,240,232,0.8)', fontSize:13, marginTop:8 }}>
              {t(`${planetName(planet,'en')} is transiting in`, `${planetName(planet,'hi')} अभी गोचर कर रहा है`)}{' '}
              <span style={{ color:meta.color, fontWeight:700 }}>{t(data.current.rashi_en, data.current.rashi_hi)} {data.current.symbol}</span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', alignItems:'center', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={() => setYear((y) => y - 1)} style={navBtn}>❮</button>
            <span style={{ color:GOLD, fontSize:16, fontWeight:700, minWidth:56, textAlign:'center' }}>{year}</span>
            <button onClick={() => setYear((y) => y + 1)} style={navBtn}>❯</button>
            <button onClick={() => setYear(new Date().getUTCFullYear())} style={{ ...navBtn, width:'auto', padding:'0 12px', fontSize:11 }}>{t('Now', 'अभी')}</button>
          </div>
          <Toggle value={type} onChange={setType} options={[['rashi', t('Rashi','राशि')], ['nakshatra', t('Nakshatra','नक्षत्र')]]} />
          <Toggle value={hour24 ? '24' : '12'} onChange={(v) => setHour24(v === '24')} options={[['12','12h'], ['24','24h']]} />
        </div>
        <p style={{ textAlign:'center', color:MUTED, fontSize:11, marginBottom:18 }}>
          📍 {t('New Delhi, India', 'नई दिल्ली, भारत')} · {t('local time', 'स्थानीय समय')}
        </p>

        {loading ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t('Calculating transits…', 'गोचर गणना हो रही है…')}</p>
        ) : !data?.ingresses?.length ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>
            {t(`No ${type} ingress for ${planet} in ${year}.`, `${year} में ${planetName(planet,'hi')} का कोई ${type === 'nakshatra' ? 'नक्षत्र' : 'राशि'} परिवर्तन नहीं।`)}
          </p>
        ) : (
          <motion.div key={`${planet}-${year}-${type}`} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ display:'grid', gap:8 }}>
            {data.ingresses.map((ing, i) => {
              const isCurrent = type === 'rashi' && ing.sign_num === curSignNum;
              const label = type === 'nakshatra' ? t(ing.nak_en, ing.nak_hi) : t(ing.sign_en, ing.sign_hi);
              return (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10,
                  background: isCurrent ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCurrent ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  <span style={{ color:MUTED, fontSize:12, fontVariantNumeric:'tabular-nums', minWidth:20 }}>{i + 1}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ color:isCurrent ? GOLD : '#F5F0E8', fontSize:15, fontWeight:700 }}>
                      {type === 'rashi' && ing.symbol ? `${ing.symbol} ` : ''}{label}
                      {type === 'nakshatra' && ing.lord && (
                        <span style={{ color:MUTED, fontSize:11, fontWeight:400 }}> · {t('Lord','स्वामी')} {planetName(ing.lord, lang)}</span>
                      )}
                    </p>
                    <p style={{ color:MUTED, fontSize:12, marginTop:2 }}>{fmtLocal(ing.at, TZ, hour24, lang)}</p>
                  </div>
                  {isCurrent && (
                    <span style={{ fontSize:9.5, fontWeight:700, color:GOLD, border:`1px solid ${GOLD}55`, borderRadius:8, padding:'2px 8px' }}>
                      {t('NOW', 'अभी')}
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, lineHeight:1.7, textAlign:'center', marginTop:20 }}>
          {t('Sidereal (Lahiri). Dates are exact; the clock time can differ from other sources by a few minutes due to ayanamsa precision. India observes no DST.',
             'निरयन (लाहिरी)। तिथियाँ सटीक; अयनांश की सूक्ष्मता से समय कुछ मिनट भिन्न हो सकता है। भारत में DST नहीं।')}
        </p>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, options }) {
  return (
    <div style={{ display:'inline-flex', border:'1px solid rgba(212,175,55,0.3)', borderRadius:8, overflow:'hidden' }}>
      {options.map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)} style={{
          fontSize:12, padding:'6px 12px', cursor:'pointer', border:'none',
          background: value === val ? GOLD : 'transparent',
          color: value === val ? '#0B0E23' : 'rgba(245,240,232,0.7)',
          fontWeight: value === val ? 700 : 400,
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}

const navBtn = {
  width:34, height:32, borderRadius:8, cursor:'pointer', fontSize:13,
  border:'1px solid rgba(212,175,55,0.3)', background:'rgba(212,175,55,0.08)', color:GOLD,
};
