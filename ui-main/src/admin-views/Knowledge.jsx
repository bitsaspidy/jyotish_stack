'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';

// Jyotish Knowledge Base — Class 1 PDF (jyotish_basics table, 35 entries)
// Astrologer's quick-reference: Vedas, Vedangas, Jyotish Angas, Uses, Karma, Hora, Graha BPHS

const CATEGORY_META = {
  graha_bphs:  { icon:'🪐', en:'Graha BPHS Attributes', hi:'ग्रह BPHS गुण',  desc:'Complete BPHS attribute sheet for all 9 grahas — karakatva, exaltation, friendships, body parts' },
  veda:        { icon:'📜', en:'The Four Vedas',         hi:'चार वेद',        desc:'Rigveda, Yajurveda, Samaveda, Atharvaveda with their Upavedas' },
  vedanga:     { icon:'🔱', en:'Six Vedangas',           hi:'छह वेदांग',      desc:'Limbs of the Vedas — Jyotish is the eye (Chakshu)' },
  jyotish_anga:{ icon:'👁️', en:'Six Angas of Jyotish',  hi:'ज्योतिष के छह अंग', desc:'Gola, Ganita, Jataka, Prashna, Muhurta, Nimitta' },
  jyotish_use: { icon:'🎯', en:'Five Uses of Jyotish',   hi:'ज्योतिष के पांच उपयोग', desc:'Classical purposes of Jyotish Shastra' },
  karma_type:  { icon:'☸️', en:'Karma Theory',           hi:'कर्म सिद्धांत',  desc:'Sanchita, Prarabdha, Kriyamana — how the chart maps karma' },
  hora_rule:   { icon:'⏳', en:'Hora System Rules',      hi:'होरा नियम',      desc:'Planetary hour rules used in Muhurta' },
};
const CAT_ORDER = ['graha_bphs','veda','vedanga','jyotish_anga','jyotish_use','karma_type','hora_rule'];

const EXTRA_LABEL = {
  karakatva:'Karakatva', own_sign:'Own Sign', exaltation:'Exaltation', debilitation:'Debilitation',
  moolatrikona:'Moolatrikona', friends:'Friends', enemies:'Enemies', neutral:'Neutral',
  digbala_house:'Digbala House', natural_nature:'Nature', body_part:'Body Parts',
  atmakaraka_eligible:'Atmakaraka Eligible', upaveda:'Upaveda', hymns:'Hymns',
  mandalas:'Mandalas', branches:'Branches',
};

function fmtVal(v) {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v && typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k}: ${fmtVal(x)}`).join(' · ');
  return String(v);
}

function ExtraDataGrid({ extra }) {
  if (!extra || typeof extra !== 'object') return null;
  const entries = Object.entries(extra).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!entries.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:8, marginTop:10 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:6, padding:'7px 10px' }}>
          <p style={{ color:'#D4AF37', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
            {EXTRA_LABEL[k] || k.replace(/_/g, ' ')}
          </p>
          <p style={{ color:'rgba(245,240,232,0.82)', fontSize:11.5, lineHeight:1.5 }}>{fmtVal(v)}</p>
        </div>
      ))}
    </div>
  );
}

export default function Knowledge() {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [activeCat, setActiveCat] = useState('graha_bphs');
  const [lang, setLang]       = useState('en');

  const load = () => {
    setError(null);
    adminApi.get('/admin/jyotish-basics')
      .then((r) => setData(r.data.data || r.data))
      .catch((e) => setError(e.response?.data?.message || e.message));
  };
  useEffect(load, []);

  if (error) {
    return (
      <div style={{ padding:40, textAlign:'center' }}>
        <p style={{ color:'#EF4444', fontSize:13, marginBottom:12 }}>⚠ {error}</p>
        <button onClick={load} style={{ padding:'7px 18px', borderRadius:8, border:'1px solid rgba(212,175,55,0.4)', background:'rgba(212,175,55,0.12)', color:'#D4AF37', fontSize:12, fontWeight:700, cursor:'pointer' }}>Retry</button>
      </div>
    );
  }
  if (!data) return <div style={{ padding:40, textAlign:'center', color:'rgba(245,240,232,0.4)', fontSize:13 }}>Loading knowledge base…</div>;

  const categories = data.categories || {};
  const cats = CAT_ORDER.filter((c) => categories[c]?.length);
  const rows = categories[activeCat] || [];
  const meta = CATEGORY_META[activeCat] || {};

  return (
    <div>
      {/* Header strip */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:16 }}>
        <p style={{ color:'rgba(245,240,232,0.55)', fontSize:12 }}>
          📚 Classical reference from AstroAnsh Class 1 (BPHS) — {data.total} entries across {cats.length} categories
        </p>
        <div style={{ display:'flex', borderRadius:7, overflow:'hidden', border:'1px solid rgba(212,175,55,0.25)' }}>
          {['en','hi'].map((l) => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding:'5px 12px', fontSize:11, fontWeight:700, border:'none', cursor:'pointer',
                background: lang === l ? 'rgba(212,175,55,0.2)' : 'transparent',
                color: lang === l ? '#D4AF37' : 'rgba(245,240,232,0.4)' }}>
              {l === 'en' ? 'EN' : 'हि'}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:18 }}>
        {cats.map((c) => {
          const m = CATEGORY_META[c] || {};
          const active = activeCat === c;
          return (
            <button key={c} onClick={() => setActiveCat(c)}
              style={{ padding:'7px 14px', borderRadius:8, fontSize:11, fontWeight: active ? 700 : 500, cursor:'pointer',
                background: active ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                border:`1px solid ${active ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.1)'}`,
                color: active ? '#D4AF37' : 'rgba(245,240,232,0.55)' }}>
              {m.icon} {lang === 'hi' ? (m.hi || m.en) : m.en} ({categories[c].length})
            </button>
          );
        })}
      </div>

      {/* Category description */}
      {meta.desc && (
        <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11.5, marginBottom:14, fontStyle:'italic' }}>{meta.desc}</p>
      )}

      {/* Entry cards */}
      <div style={{ display:'grid', gap:12 }}>
        {rows.map((r) => (
          <div key={r.item_key} style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
              <p style={{ color:'#D4AF37', fontSize:14, fontWeight:700, fontFamily:'Georgia,serif' }}>
                {lang === 'hi' ? (r.name_hi || r.name_en) : r.name_en}
              </p>
              <p style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>
                {lang === 'hi' ? r.name_en : r.name_hi}
              </p>
            </div>
            {(r.description_en || r.description_hi) && (
              <p style={{ color:'rgba(245,240,232,0.72)', fontSize:12.5, lineHeight:1.75, marginTop:8 }}>
                {lang === 'hi' ? (r.description_hi || r.description_en) : r.description_en}
              </p>
            )}
            <ExtraDataGrid extra={r.extra_data} />
          </div>
        ))}
      </div>
    </div>
  );
}
