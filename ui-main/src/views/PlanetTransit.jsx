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

// The nine grahas, with a stable slug for the per-planet route.
const PLANETS = [
  ['Sun', 'sun', '☉', '#F59E0B'], ['Moon', 'moon', '☽', '#94A3B8'],
  ['Mars', 'mars', '♂', '#EF4444'], ['Mercury', 'mercury', '☿', '#10B981'],
  ['Jupiter', 'jupiter', '♃', '#FBBF24'], ['Venus', 'venus', '♀', '#F472B6'],
  ['Saturn', 'saturn', '♄', '#818CF8'], ['Rahu', 'rahu', '☊', '#A78BFA'],
  ['Ketu', 'ketu', '☋', '#6B7280'],
];

export default function PlanetTransit() {
  const { lang } = useLang();
  const t = (en, hi) => translate(lang, en, hi);
  const [signs, setSigns] = useState({}); // planet -> { rashi_en, rashi_hi }

  useEffect(() => {
    // One call gives every planet's current sign for the cards.
    api.get('/panchang/planet-positions')
      .then((res) => {
        const map = {};
        (res.data?.positions || []).forEach((p) => { map[p.planet] = p; });
        setSigns(map);
      })
      .catch(() => setSigns({}));
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-16">

        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            🪐 {t('Planet Transit', 'ग्रह गोचर (राशि परिवर्तन)')}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:600, margin:'8px auto 0', lineHeight:1.7 }}>
            {t('When each planet moves from one sign — and one nakshatra — to the next, through any year. Choose a planet to see its full ingress calendar.',
               'प्रत्येक ग्रह किसी भी वर्ष में एक राशि से दूसरी — और एक नक्षत्र से दूसरे — में कब प्रवेश करता है। पूरा गोचर कैलेंडर देखने हेतु ग्रह चुनें।')}
          </p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap:14 }}>
          {PLANETS.map(([name, slug, icon, color]) => {
            const cur = signs[name];
            return (
              <Link key={slug} href={`/planet-transit/${slug}`} style={{ textDecoration:'none' }}>
                <motion.div
                  whileHover={{ y:-3 }}
                  className="card-royal p-5"
                  style={{ height:'100%', display:'flex', flexDirection:'column', gap:8, cursor:'pointer' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ color, fontSize:26 }}>{icon}</span>
                    <div>
                      <p style={{ color:'#F5F0E8', fontSize:16, fontWeight:700 }}>{planetName(name, lang)}</p>
                      <p style={{ color:MUTED, fontSize:11 }}>{t('Transit calendar', 'गोचर कैलेंडर')}</p>
                    </div>
                  </div>
                  <div style={{ marginTop:'auto', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:MUTED }}>
                      {cur ? <>{t('Now in', 'अभी')} <span style={{ color }}>{t(cur.rashi_en, cur.rashi_hi)}</span></> : ' '}
                    </span>
                    <span style={{ color:GOLD, fontSize:16 }}>→</span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11.5, lineHeight:1.7, textAlign:'center', marginTop:24 }}>
          {t('Sidereal (Lahiri) positions. Ingress dates are exact; the printed clock time can differ from other sources by a few minutes due to ayanamsa precision.',
             'निरयन (लाहिरी) स्थिति। प्रवेश तिथियाँ सटीक हैं; अयनांश की सूक्ष्मता के कारण समय अन्य स्रोतों से कुछ मिनट भिन्न हो सकता है।')}
        </p>
      </div>
    </div>
  );
}
