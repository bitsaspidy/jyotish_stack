'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import VarshphalPanel from '../components/VarshphalPanel';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';

const t = (lang, en, hi) => (lang === 'hi' ? hi : en);

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(String(s).slice(0, 10) + 'T12:00:00Z');
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// ── Kundli Selector Card ──────────────────────────────────────────────────────
function KundliCard({ profile, selected, onSelect, lang }) {
  const isSel = selected?.uuid === profile.uuid;
  return (
    <button onClick={() => onSelect(profile)} style={{
      width:'100%', textAlign:'left', cursor:'pointer',
      padding:'14px 18px',
      background: isSel ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
      border:`1px solid ${isSel ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius:12, transition:'all 0.15s',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background: isSel ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
          ☀
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color: isSel ? '#D4AF37' : '#E2E8F0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {profile.full_name}
          </div>
          <div style={{ fontSize:10, color:'#64748B', marginTop:2 }}>
            {fmtDate(profile.date_of_birth)}
            {profile.birth_city ? ` · ${profile.birth_city}` : ''}
          </div>
        </div>
        {isSel && <span style={{ color:'#D4AF37', fontSize:16 }}>◉</span>}
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VarshphalPage() {
  const { lang }        = useLang();
  const { user }        = useAuth();
  const [kundlis,  setKundlis]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get('/kundli')
      .then(r => {
        const profiles = r.data.profiles || [];
        setKundlis(profiles);
        if (profiles.length > 0) setSelected(profiles[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={55} />
      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:32 }}>
          <p style={{ color:'rgba(212,175,55,0.5)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.35em', marginBottom:6 }}>
            {t(lang,'Vedic Annual Forecast','वैदिक वार्षिक भविष्यफल')}
          </p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#F1F5F9', margin:'0 0 6px' }}>
            {t(lang,'🌞 Varshphal','🌞 वर्षफल')}
          </h1>
          <p style={{ color:'rgba(245,240,232,0.5)', fontSize:13, maxWidth:600 }}>
            {t(lang,
              'Annual Solar Return chart — computed to the exact moment the Sun returns to its natal degree each year. See your 5-year life journey, Varshesha, Mudda Dasha, and detailed life domain forecasts.',
              'वार्षिक सौर कुंडली — प्रत्येक वर्ष सूर्य के जन्म अंश पर वापसी के सटीक क्षण पर। 5-वर्षीय यात्रा, वर्षेश, मुद्दा दशा और विस्तृत जीवन क्षेत्र पूर्वानुमान देखें।'
            )}
          </p>
        </motion.div>

        {/* ── Not logged in ── */}
        {!user && !loading && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🌞</div>
            <h2 style={{ fontSize:20, color:'#F1F5F9', marginBottom:8 }}>
              {t(lang,'Sign in to view your Varshphal','वर्षफल देखने के लिए लॉगिन करें')}
            </h2>
            <p style={{ color:'#64748B', marginBottom:20, fontSize:13 }}>
              {t(lang,'Your Varshphal is calculated from your birth chart. Create a Kundli first.','वर्षफल आपकी जन्म कुंडली से बनता है। पहले कुंडली बनाएं।')}
            </p>
            <Link href="/login" style={{ padding:'10px 28px', background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.4)', borderRadius:8, color:'#D4AF37', fontSize:13, fontWeight:600, textDecoration:'none' }}>
              {t(lang,'Login / Register','लॉगिन / रजिस्टर')}
            </Link>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>☀</div>
            <p style={{ color:'#D4AF37', fontSize:13 }}>{t(lang,'Loading your Kundlis…','कुंडलियां लोड हो रही हैं…')}</p>
          </div>
        )}

        {/* ── No kundli ── */}
        {!loading && user && kundlis.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🪐</div>
            <h2 style={{ fontSize:18, color:'#F1F5F9', marginBottom:8 }}>
              {t(lang,'No Kundli found','कोई कुंडली नहीं मिली')}
            </h2>
            <p style={{ color:'#64748B', marginBottom:20, fontSize:13 }}>
              {t(lang,'Create a Kundli to see your Varshphal annual forecast.','वर्षफल देखने के लिए पहले कुंडली बनाएं।')}
            </p>
            <Link href="/kundli/new" style={{ padding:'10px 28px', background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.4)', borderRadius:8, color:'#D4AF37', fontSize:13, fontWeight:600, textDecoration:'none' }}>
              {t(lang,'Create Kundli →','कुंडली बनाएं →')}
            </Link>
          </div>
        )}

        {/* ── Main Layout: selector + panel ── */}
        {!loading && user && kundlis.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:24, alignItems:'start' }}>

            {/* Kundli Selector Sidebar */}
            <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
              <div style={{ padding:'16px', background:'rgba(17,20,40,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, position:'sticky', top:88 }}>
                <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12, margin:'0 0 12px' }}>
                  {t(lang,'Select Kundli','कुंडली चुनें')}
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {kundlis.map(k => (
                    <KundliCard key={k.uuid} profile={k} selected={selected} onSelect={setSelected} lang={lang} />
                  ))}
                </div>
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <Link href="/kundli/new" style={{ display:'block', textAlign:'center', fontSize:11, color:'#D4AF37', padding:'8px', border:'1px solid rgba(212,175,55,0.3)', borderRadius:8, textDecoration:'none' }}>
                    {t(lang,'+ Add New Kundli','+ नई कुंडली जोड़ें')}
                  </Link>
                  {selected && (
                    <Link href={`/kundli/${selected.uuid}`} style={{ display:'block', textAlign:'center', fontSize:11, color:'#64748B', padding:'8px', textDecoration:'none', marginTop:6 }}>
                      {t(lang,'↗ View Full Kundli Detail','↗ पूरी कुंडली देखें')}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Varshphal Panel */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              {selected ? (
                <div style={{ background:'rgba(17,20,40,0.6)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24 }}>
                  {/* Selected kundli header */}
                  <div style={{ marginBottom:20, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:'#E2E8F0' }}>{selected.full_name}</div>
                      <div style={{ fontSize:11, color:'#64748B', marginTop:3 }}>
                        {fmtDate(selected.date_of_birth)}
                        {selected.time_of_birth ? ` · ${selected.time_of_birth}` : ''}
                        {selected.birth_city    ? ` · ${selected.birth_city}`    : ''}
                      </div>
                    </div>
                    <Link href={`/kundli/${selected.uuid}`} style={{ fontSize:11, color:'#D4AF37', textDecoration:'none', border:'1px solid rgba(212,175,55,0.3)', padding:'6px 14px', borderRadius:20 }}>
                      {t(lang,'View Kundli Detail →','पूरी कुंडली →')}
                    </Link>
                  </div>

                  <VarshphalPanel kundliUuid={selected.uuid} lang={lang} />
                </div>
              ) : (
                <div style={{ padding:60, textAlign:'center', color:'#64748B' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>☀</div>
                  <p>{t(lang,'Select a Kundli from the left panel','बाईं ओर से कुंडली चुनें')}</p>
                </div>
              )}
            </motion.div>

          </div>
        )}

      </div>
    </div>
  );
}
