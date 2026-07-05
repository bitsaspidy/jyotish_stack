'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t, planetName } from '../lib/astroI18n';
import api from '../lib/api';

const GOLD  = '#D4AF37';
const MUTED = 'rgba(245,240,232,0.55)';

const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B' }, Moon:    { icon:'☽', color:'#94A3B8' },
  Mars:    { icon:'♂', color:'#EF4444' }, Mercury: { icon:'☿', color:'#10B981' },
  Jupiter: { icon:'♃', color:'#FBBF24' }, Venus:   { icon:'♀', color:'#F472B6' },
  Saturn:  { icon:'♄', color:'#818CF8' }, Rahu:    { icon:'☊', color:'#A78BFA' },
  Ketu:    { icon:'☋', color:'#6B7280' },
};

const todayIST = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
function shiftDate(dateStr, n) { const d = new Date(dateStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function fmtDate(dateStr, lang) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

export default function PlanetaryPositions({ initialDate }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [date, setDate] = useState(initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : todayIST());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/panchang/planet-positions?date=${date}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">

        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-6">
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            🌌 {t(lang, 'Planetary Positions', 'ग्रह स्थिति (गोचर)')}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:560, margin:'8px auto 0', lineHeight:1.7 }}>
            {t(lang,
              'Sidereal (Lahiri) positions of all nine planets for any day — sign, degree, nakshatra and retrograde status.',
              'किसी भी दिन नवग्रहों की निरयन (लाहिरी) स्थिति — राशि, अंश, नक्षत्र एवं वक्री स्थिति।')}
          </p>
        </motion.div>

        {/* Date navigator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
          <button onClick={() => setDate(shiftDate(date, -1))} style={navBtn}>←</button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
            className="input-royal" style={{ fontSize:13, padding:'6px 12px', width:'auto', colorScheme:'dark' }} />
          <button onClick={() => setDate(shiftDate(date, 1))} style={navBtn}>→</button>
          <button onClick={() => setDate(todayIST())} style={{ ...navBtn, width:'auto', padding:'0 14px', fontSize:11 }}>{t(lang,'Today','आज')}</button>
        </div>
        <p style={{ textAlign:'center', color:MUTED, fontSize:12, marginBottom:20 }}>{fmtDate(date, lang)}</p>

        {loading ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Calculating positions…', 'स्थिति गणना हो रही है…')}</p>
        ) : !data ? (
          <p style={{ textAlign:'center', color:MUTED, padding:40 }}>{t(lang, 'Unable to load positions.', 'स्थिति लोड नहीं हो सकी।')}</p>
        ) : (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card-royal p-4">
            {/* header row */}
            <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1.3fr 1fr 1.6fr', gap:8, padding:'6px 10px', borderBottom:'1px solid rgba(212,175,55,0.2)' }}>
              {[['Planet','ग्रह'],['Sign','राशि'],['Degree','अंश'],['Nakshatra','नक्षत्र']].map((h, i) => (
                <span key={i} style={{ fontSize:9, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang, h[0], h[1])}</span>
              ))}
            </div>
            {data.positions.map((p) => {
              const meta = PLANET_META[p.planet] || {};
              return (
                <div key={p.planet} style={{ display:'grid', gridTemplateColumns:'1.4fr 1.3fr 1fr 1.6fr', gap:8, padding:'10px', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems:'center' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:600, color:'#F5F0E8' }}>
                    <span style={{ color: meta.color, fontSize:15 }}>{meta.icon}</span>
                    {planetName(p.planet, lang)}
                    {p.is_retrograde && <span style={{ fontSize:10, color:'#F59E0B', fontWeight:700 }} title={t(lang,'Retrograde','वक्री')}>℞</span>}
                  </span>
                  <span style={{ fontSize:12.5, color: meta.color }}>{t(lang, p.rashi_en, p.rashi_hi)}</span>
                  <span style={{ fontSize:11.5, color:MUTED, fontVariantNumeric:'tabular-nums' }}>{p.degree_dms}</span>
                  <span style={{ fontSize:11.5, color:'rgba(245,240,232,0.75)' }}>
                    {t(lang, p.nakshatra_en, p.nakshatra_hi)} <span style={{ color:MUTED }}>· {t(lang,'Pada','पद')} {p.pada}</span>
                  </span>
                </div>
              );
            })}
            {data.ayanamsa != null && (
              <p style={{ fontSize:10, color:MUTED, textAlign:'right', marginTop:10 }}>
                {t(lang,'Lahiri Ayanamsa','लाहिरी अयनांश')}: {data.ayanamsa}° · {t(lang,'computed at 12:00 IST','12:00 IST पर गणना')}
              </p>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <div className="card-royal p-5 mt-6" style={{ border:'1px solid rgba(245,158,11,0.3)' }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#F59E0B', marginBottom:6 }}>
            {t(lang, 'How do these transits affect YOU?', 'ये गोचर आपको कैसे प्रभावित करते हैं?')}
          </p>
          <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginBottom:12 }}>
            {t(lang,
              'These are the sky\'s positions for everyone. Their effect depends on your birth chart — see your personal transit reading from your kundli.',
              'ये सभी के लिए आकाश की स्थिति है। इनका प्रभाव आपकी जन्म कुंडली पर निर्भर करता है — अपनी कुंडली से व्यक्तिगत गोचर फल देखें।')}
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link href="/free-kundli" className="btn-gold" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none' }}>
              {t(lang, '🔯 Free Kundli', '🔯 निःशुल्क कुंडली')}
            </Link>
            <Link href="/horoscope" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none', border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600 }}>
              {t(lang, "Today's Horoscope", 'आज का राशिफल')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtn = {
  width:36, height:34, borderRadius:8, cursor:'pointer', fontSize:14,
  border:'1px solid rgba(212,175,55,0.3)', background:'rgba(212,175,55,0.08)', color:GOLD,
};
