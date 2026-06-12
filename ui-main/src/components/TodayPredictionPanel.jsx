'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import adminApi from '../lib/adminApi';

// Today's personal prediction — served from the `predictions` table
// (generated once per day per kundli, then cached). Used in user
// KundliDetail and admin KundliAdminDetail (admin also sees history).

const GOLD = '#D4AF37';

function Stars({ n }) {
  return <span style={{ color:GOLD, fontSize:13, letterSpacing:2 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

function Chip({ children, color = GOLD }) {
  return (
    <span style={{ fontSize:10, fontWeight:700, color, background:`${color}14`,
      border:`1px solid ${color}38`, borderRadius:10, padding:'2px 9px', whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

export default function TodayPredictionPanel({ uuid, lang = 'en', admin = false }) {
  const [pred, setPred]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [history, setHistory]   = useState(null);
  const [showHist, setShowHist] = useState(false);
  const T = (en, hi) => (lang === 'hi' ? hi : en);

  useEffect(() => {
    if (!uuid) return;
    const client = admin ? adminApi : api;
    const base   = admin ? `/admin/kundlis/${uuid}` : `/kundli/${uuid}`;
    setLoading(true);
    client.get(`${base}/today`)
      .then((r) => { const d = r.data?.data || r.data; setPred(d?.prediction || null); })
      .catch(() => setPred(null))
      .finally(() => setLoading(false));
  }, [uuid, admin]);

  const loadHistory = () => {
    if (history || !admin) { setShowHist(!showHist); return; }
    adminApi.get(`/admin/kundlis/${uuid}/predictions`, { params: { limit: 10 } })
      .then((r) => { const d = r.data?.data || r.data; setHistory(d?.history || []); setShowHist(true); })
      .catch(() => setHistory([]));
  };

  if (loading) {
    return (
      <div className="card-royal p-5" style={{ marginBottom:20 }}>
        <p style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>🔮 {T('Loading today’s prediction…', 'आज की भविष्यवाणी लोड हो रही है…')}</p>
      </div>
    );
  }
  if (!pred) return null;

  const meta = pred.meta || {};
  const title = lang === 'hi' ? (meta.title_hi || pred.title) : pred.title;
  const content = (lang === 'hi' ? (pred.content_hi || pred.content_en) : pred.content_en) || '';
  const paras = content.split(/\n\n+/).filter(Boolean);
  const pick = (o) => (o ? (lang === 'hi' ? (o.hi || o.en) : o.en) : null);

  return (
    <div className="card-royal p-5" style={{ marginBottom:20, border:'1px solid rgba(212,175,55,0.28)',
      background:'linear-gradient(150deg, rgba(212,175,55,0.07), rgba(32,38,70,0.88) 45%)' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap', marginBottom:10 }}>
        <div>
          <p style={{ color:GOLD, fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:4 }}>
            🔮 {T('Today for You', 'आज आपके लिए')} · {meta.date || ''}
          </p>
          <h3 className="font-devanagari" style={{ color:'rgba(245,240,232,0.95)', fontSize:15, fontWeight:700 }}>{title}</h3>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
          <Stars n={meta.score || 3} />
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {meta.moon_rashi && <Chip>{meta.moon_rashi.symbol} {lang === 'hi' ? meta.moon_rashi.hi : meta.moon_rashi.en} {T('Moon', 'चंद्र')}</Chip>}
            {meta.dasha?.maha && <Chip color="#A78BFA">{meta.dasha.maha}{meta.dasha.antar ? `–${meta.dasha.antar}` : ''} {T('Dasha', 'दशा')}</Chip>}
            {meta.sade_sati?.active && <Chip color="#EF4444">{T('Sade Sati', 'साढ़ेसाती')} · {meta.sade_sati.phase}</Chip>}
          </div>
        </div>
      </div>

      {/* Prediction paragraphs */}
      <div style={{ display:'grid', gap:8, marginBottom:12 }}>
        {paras.map((p, i) => (
          <p key={i} className="font-devanagari" style={{ color:'rgba(245,240,232,0.78)', fontSize:12.5, lineHeight:1.8 }}>{p}</p>
        ))}
      </div>

      {/* Advice + Caution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ marginBottom:12 }}>
        {pick(meta.advice) && (
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, padding:'9px 11px' }}>
            <p style={{ color:'#22C55E', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>✓ {T('Advice', 'सलाह')}</p>
            <p className="font-devanagari" style={{ color:'rgba(245,240,232,0.75)', fontSize:11, lineHeight:1.7 }}>{pick(meta.advice)}</p>
          </div>
        )}
        {pick(meta.caution) && (
          <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'9px 11px' }}>
            <p style={{ color:'#EF4444', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>⚠ {T('Caution', 'सावधानी')}</p>
            <p className="font-devanagari" style={{ color:'rgba(245,240,232,0.75)', fontSize:11, lineHeight:1.7 }}>{pick(meta.caution)}</p>
          </div>
        )}
      </div>

      {/* Lucky + favourable purposes */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        {meta.lucky?.numbers && <Chip color="#60A5FA">🔢 {meta.lucky.numbers.join(', ')}</Chip>}
        {meta.lucky?.colors  && <Chip color="#EC4899">🎨 {meta.lucky.colors.join(', ')}</Chip>}
        {meta.lucky?.gemstone && <Chip color="#22C55E">💎 {meta.lucky.gemstone}</Chip>}
        {(meta.fav_purposes || []).map((f) => (
          <Chip key={f.key} color={GOLD}>{f.icon} {lang === 'hi' ? f.hi : f.en}</Chip>
        ))}
        {(meta.avoid_purposes || []).map((f) => (
          <Chip key={f.key} color="#EF4444">✕ {lang === 'hi' ? f.hi : f.en}</Chip>
        ))}
      </div>

      {/* Admin: stored prediction history */}
      {admin && (
        <div style={{ marginTop:14, borderTop:'1px solid rgba(212,175,55,0.12)', paddingTop:10 }}>
          <button onClick={loadHistory}
            style={{ background:'transparent', border:'none', color:'#A78BFA', fontSize:11, fontWeight:700, cursor:'pointer', padding:0 }}>
            🗂 {T('Stored Prediction Log', 'संग्रहीत भविष्यवाणी लॉग')} {showHist ? '▲' : '▼'}
          </button>
          {showHist && (
            <div style={{ display:'grid', gap:6, marginTop:8 }}>
              {(history || []).length === 0 && (
                <p style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>{T('No stored predictions yet.', 'अभी कोई संग्रहीत भविष्यवाणी नहीं।')}</p>
              )}
              {(history || []).map((h) => (
                <div key={h.uuid} style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center',
                  background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:6, padding:'7px 10px' }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ color:'rgba(245,240,232,0.8)', fontSize:11, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.title}</p>
                    <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9.5 }}>
                      {h.type} · {h.meta?.date || (h.valid_from || '').slice(0, 10)}
                    </p>
                  </div>
                  {h.meta?.score && <Stars n={h.meta.score} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
