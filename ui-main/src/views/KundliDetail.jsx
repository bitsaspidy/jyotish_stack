'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B', hi:'सूर्य'     },
  Moon:    { icon:'☽', color:'#94A3B8', hi:'चन्द्र'    },
  Mars:    { icon:'♂', color:'#EF4444', hi:'मंगल'       },
  Mercury: { icon:'☿', color:'#10B981', hi:'बुध'        },
  Jupiter: { icon:'♃', color:'#FBBF24', hi:'बृहस्पति'  },
  Venus:   { icon:'♀', color:'#F472B6', hi:'शुक्र'      },
  Saturn:  { icon:'♄', color:'#818CF8', hi:'शनि'        },
  Rahu:    { icon:'☊', color:'#A78BFA', hi:'राहु'       },
  Ketu:    { icon:'☋', color:'#6B7280', hi:'केतु'       },
};

const DIGNITY_STYLE = {
  'Exaltation (उच्च)':         { bg:'rgba(34,197,94,0.12)',  color:'#22C55E' },
  'Moolatrikona (मूलत्रिकोण)':  { bg:'rgba(245,158,11,0.12)', color:'#F59E0B' },
  'Own Sign (स्वगृह)':          { bg:'rgba(96,165,250,0.12)', color:'#60A5FA' },
  'Debilitation (नीच)':        { bg:'rgba(239,68,68,0.12)',  color:'#EF4444' },
  'Neutral':                   { bg:'rgba(107,114,128,0.12)',color:'#6B7280' },
  'shadow':                    { bg:'rgba(107,114,128,0.12)',color:'#6B7280' },
};

// Rashi short names (for chart cells)
const RASHI_SHORT_EN = ['','Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
const RASHI_SHORT_HI = ['','मेष','वृषभ','मिथु','कर्क','सिंह','कन्या','तुला','वृश्','धनु','मकर','कुम्भ','मीन'];

// ─── Grid layouts ─────────────────────────────────────────────────────────────

/**
 * South Indian chart — signs are FIXED in cells.
 * Each value = Rashi number (1–12). 0 = empty inner cell.
 * Reading left→right, top→bottom:
 *   Pisces(12) | Aries(1) | Taurus(2) | Gemini(3)
 *   Aquarius(11)|  ----   |   ----    | Cancer(4)
 *   Capricorn(10)|  ---- |   ----    | Leo(5)
 *   Sagitt(9)  | Scorpio(8) | Libra(7) | Virgo(6)
 */
const SI_GRID = [12,1,2,3, 11,0,0,4, 10,0,0,5, 9,8,7,6];

/**
 * North Indian chart — house numbers are FIXED in cells.
 * Each value = House number (1–12). 0 = empty inner cell.
 * Houses go counter-clockwise from house 1 (top area):
 *   H2  | H1  | H12 | H11
 *   H3  |     |     | H10
 *   H4  |     |     |  H9
 *   H5  | H6  | H7  |  H8
 */
// NI_GRID removed — North Indian chart now uses SVG geometry (see NorthIndianChart below)

// ─── Shared chart cell ────────────────────────────────────────────────────────

function ChartCell({ highlight, dimBorder, children, extraStyle = {} }) {
  return (
    <div style={{
      aspectRatio:'1', position:'relative', overflow:'hidden',
      padding:'4px 3px',
      background: highlight ? 'rgba(212,175,55,0.12)' : 'rgba(17,20,40,0.65)',
      border: `1px solid ${highlight ? 'rgba(212,175,55,0.45)' : (dimBorder ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.14)')}`,
      borderRadius:4,
      display:'flex', flexDirection:'column',
      ...extraStyle,
    }}>
      {highlight && (
        // Diagonal mark for Lagna (North Indian tradition)
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(212,175,55,0.2)" strokeWidth="1"/>
        </svg>
      )}
      {children}
    </div>
  );
}

function EmptyCell() {
  return (
    <div style={{
      aspectRatio:'1',
      background:'rgba(17,20,40,0.2)',
      border:'1px solid rgba(212,175,55,0.05)',
      borderRadius:3,
    }} />
  );
}

function PlanetTokens({ names }) {
  if (!names.length) return null;
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:1, marginTop:'auto' }}>
      {names.map(p => (
        <span key={p} style={{ fontSize:7, color: PLANET_META[p]?.color || '#D4AF37', fontWeight:700, lineHeight:1 }}>
          {PLANET_META[p]?.icon}{p.slice(0,2)}
        </span>
      ))}
    </div>
  );
}

// ─── South Indian Chart ───────────────────────────────────────────────────────

function SouthIndianChart({ chart, lang }) {
  if (!chart) return <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, textAlign:'center', padding:24 }}>Calculating chart…</p>;

  const ascSign = chart.ascendant?.rashi_num || 1;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
        {SI_GRID.map((signNum, i) => {
          if (signNum === 0) return <EmptyCell key={i} />;

          const isAsc   = signNum === ascSign;
          // house number this sign represents
          const houseNum = ((signNum - ascSign + 12) % 12) + 1;
          // planets in this sign
          const planetsIn = Object.entries(chart.planets || {})
            .filter(([,pd]) => pd.rashi_num === signNum)
            .map(([name]) => name);

          return (
            <ChartCell key={i} highlight={isAsc}>
              {/* Sign label + house indicator */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{ color: isAsc ? '#D4AF37' : 'rgba(245,240,232,0.5)', fontSize:8, fontWeight:600, lineHeight:1 }}>
                  {lang==='hi' ? RASHI_SHORT_HI[signNum] : RASHI_SHORT_EN[signNum]}
                </span>
                <span style={{ color: isAsc ? '#D4AF37' : 'rgba(212,175,55,0.3)', fontSize:7, fontWeight:700, lineHeight:1 }}>
                  {isAsc ? '↑' : houseNum}
                </span>
              </div>
              <PlanetTokens names={planetsIn} />
            </ChartCell>
          );
        })}
      </div>
      <p style={{ color:'rgba(245,240,232,0.25)', fontSize:10, textAlign:'center', marginTop:8 }}>
        ↑ = Lagna · Signs fixed · Houses float
      </p>
    </div>
  );
}

// ─── North Indian Chart (SVG — geometrically accurate) ───────────────────────
//
// Structure (verified from reference image):
//   • Outer square
//   • Two full corner-to-corner X diagonals: TL→BR and TR→BL
//   • Inner diamond: vertices at midpoints T, R, B, L of the 4 sides
//   → creates exactly 12 regions:
//       4 inner kite-shapes  = Houses 1,4,7,10 (Kendra/angular)
//       8 outer triangles    = Houses 2,3,5,6,8,9,11,12
//       (each outer corner is split into 2 triangles by the X diagonals)
//
// House numbering: counterclockwise from House 1 at TOP
//   1 (top-inner), 12 (top-right corner-upper), 11 (top-right corner-lower),
//   10 (right-inner), 9 (bottom-right corner-upper), 8 (bottom-right corner-lower),
//   7 (bottom-inner), 6 (bottom-left corner-upper), 5 (bottom-left corner-lower),
//   4 (left-inner), 3 (top-left corner-lower), 2 (top-left corner-upper)

function NorthIndianChart({ chart, lang }) {
  if (!chart) {
    return <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, textAlign:'center', padding:24 }}>Calculating chart…</p>;
  }

  const S = 300;  // SVG canvas size
  // Key points
  const TL=[0,0], TR=[S,0], BR=[S,S], BL=[0,S];
  const T=[S/2,0], R=[S,S/2], B=[S/2,S], L=[0,S/2];
  const O=[S/2,S/2];
  // Intersections of X-diagonals with inner diamond sides
  // TL→BR diagonal (y=x) hits L→T inner side at (S/4, S/4)
  // TL→BR hits R→B inner side at (3S/4, 3S/4)
  // TR→BL diagonal (y = S-x) hits T→R inner side at (3S/4, S/4)
  // TR→BL hits B→L inner side at (S/4, 3S/4)
  const MTL=[S/4,S/4], MTR=[3*S/4,S/4], MBR=[3*S/4,3*S/4], MBL=[S/4,3*S/4];

  // 12 house polygons (vertices listed in order, CCW from H1 at top)
  // Inner kites: H1, H4, H7, H10
  // Outer triangles: H2,H3 (TL corner), H5,H6 (BL), H8,H9 (BR), H11,H12 (TR)
  const HOUSES = [
    { h:1,  v:[T,   MTL, O,   MTR] },  // inner top kite    (Lagna)
    { h:2,  v:[TL,  T,   MTL]       },  // TL corner upper triangle
    { h:3,  v:[TL,  L,   MTL]       },  // TL corner lower triangle
    { h:4,  v:[L,   MTL, O,   MBL]  },  // inner left kite
    { h:5,  v:[BL,  L,   MBL]       },  // BL corner upper triangle
    { h:6,  v:[BL,  B,   MBL]       },  // BL corner lower triangle
    { h:7,  v:[B,   MBL, O,   MBR]  },  // inner bottom kite
    { h:8,  v:[BR,  B,   MBR]       },  // BR corner upper triangle
    { h:9,  v:[BR,  R,   MBR]       },  // BR corner lower triangle
    { h:10, v:[R,   MTR, O,   MBR]  },  // inner right kite
    { h:11, v:[TR,  R,   MTR]       },  // TR corner lower triangle
    { h:12, v:[TR,  T,   MTR]       },  // TR corner upper triangle
  ];

  const pStr = (verts) => verts.map(([x,y]) => `${x},${y}`).join(' ');

  // Centroid of a polygon (average of vertices)
  const cx = (verts) => verts.reduce((s,[x]) => s+x, 0) / verts.length;
  const cy = (verts) => verts.reduce((s,[,y]) => s+y, 0) / verts.length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${S} ${S}`}
        width="100%"
        style={{ maxWidth: 320, display:'block', margin:'0 auto' }}
      >
        {/* Background */}
        <rect width={S} height={S} fill="rgba(17,20,40,0.7)" rx="3" />

        {/* Render each house */}
        {HOUSES.map(({ h, v }) => {
          const houseData = chart.houses?.[h] || {};
          const signNum   = houseData.rashi_num || 0;
          const planetsIn = houseData.planets   || [];
          const isLagna   = h === 1;
          const pcx = cx(v), pcy = cy(v);
          const isKendra  = [1,4,7,10].includes(h);

          // Planet icons string (max 4 to avoid overflow)
          const planetStr = planetsIn.slice(0,4)
            .map(p => (PLANET_META[p]?.icon || '') + p.slice(0,2))
            .join(' ');

          return (
            <g key={h}>
              <polygon
                points={pStr(v)}
                fill={isLagna
                  ? 'rgba(212,175,55,0.15)'
                  : isKendra
                    ? 'rgba(61,53,128,0.18)'
                    : 'rgba(17,20,40,0.5)'}
                stroke={isLagna
                  ? 'rgba(212,175,55,0.7)'
                  : 'rgba(212,175,55,0.28)'}
                strokeWidth={isLagna ? 1.5 : 1}
              />

              {/* Lagna diagonal mark */}
              {isLagna && (
                <>
                  <line x1={v[0][0]} y1={v[0][1]} x2={v[2][0]} y2={v[2][1]}
                    stroke="rgba(212,175,55,0.18)" strokeWidth="1" />
                  <line x1={v[1][0]} y1={v[1][1]} x2={v[3][0]} y2={v[3][1]}
                    stroke="rgba(212,175,55,0.18)" strokeWidth="1" />
                </>
              )}

              {/* House number */}
              <text
                x={pcx} y={pcy - (isKendra ? 10 : 6)}
                textAnchor="middle"
                fill={isLagna ? '#F0D060' : isKendra ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.4)'}
                fontSize={isLagna ? 11 : 8}
                fontWeight="bold"
                fontFamily="Inter,sans-serif"
              >
                {isLagna ? 'L' : h}
              </text>

              {/* Sign name */}
              {signNum > 0 && (
                <text
                  x={pcx} y={pcy + (isKendra ? 4 : 3)}
                  textAnchor="middle"
                  fill={isLagna ? 'rgba(245,240,232,0.9)' : 'rgba(245,240,232,0.6)'}
                  fontSize={isKendra ? 9 : 7.5}
                  fontFamily="'Noto Sans Devanagari',Inter,sans-serif"
                >
                  {lang === 'hi' ? RASHI_SHORT_HI[signNum] : RASHI_SHORT_EN[signNum]}
                </text>
              )}

              {/* Planets */}
              {planetsIn.length > 0 && (
                <text
                  x={pcx} y={pcy + (isKendra ? 16 : 13)}
                  textAnchor="middle"
                  fill="rgba(245,240,232,0.75)"
                  fontSize={isKendra ? 8 : 7}
                  fontFamily="Inter,sans-serif"
                >
                  {planetStr}
                </text>
              )}
            </g>
          );
        })}

        {/* Outer border */}
        <rect width={S} height={S} fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" rx="2" />
      </svg>

      <p style={{ color:'rgba(245,240,232,0.25)', fontSize:10, textAlign:'center', marginTop:8 }}>
        L = Lagna (H1) · Houses fixed · Signs float · H1/4/7/10 = Kendra
      </p>
    </div>
  );
}

// ─── Chart Style Toggle ───────────────────────────────────────────────────────

function ChartToggle({ style, onChange }) {
  const opts = [
    { value:'south', label:'South Indian', icon:'◈' },
    { value:'north', label:'North Indian', icon:'◇' },
  ];
  return (
    <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:12 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
            border:`1px solid ${style===o.value ? '#D4AF37' : 'rgba(212,175,55,0.2)'}`,
            background: style===o.value ? 'rgba(212,175,55,0.12)' : 'transparent',
            color: style===o.value ? '#D4AF37' : 'rgba(245,240,232,0.45)',
            transition:'all 0.2s',
          }}>
          <span>{o.icon}</span> {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Edit Kundli Modal ────────────────────────────────────────────────────────
// Location search: Nominatim (OpenStreetMap) — 100% free, no API key needed.
// Map preview:     OSM embed iframe.

function EditKundliModal({ kundli, onClose, onSaved }) {
  const dob = String(kundli.date_of_birth || '').slice(0, 10);
  const [form, setForm] = useState({
    name:             kundli.name          || '',
    date_of_birth:    dob,
    time_of_birth:    (kundli.time_of_birth || '00:00:00').slice(0, 5),
    place_of_birth:   kundli.place_of_birth || '',
    latitude:         String(kundli.latitude  || ''),
    longitude:        String(kundli.longitude || ''),
    timezone_offset:  String(kundli.timezone_offset || '5.5'),
    gender:           kundli.gender        || 'male',
  });

  const [locQuery,    setLocQuery]    = useState('');
  const [locResults,  setLocResults]  = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setLocResults([]);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Nominatim geocoding search (free, no API key) ──
  async function handleLocationSearch(e) {
    e.preventDefault();
    if (!locQuery.trim()) return;
    setSearching(true);
    setLocResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=6&addressdetails=1`;
      const res  = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'Accept': 'application/json' },
      });
      const data = await res.json();
      setLocResults(data);
    } catch {
      toast.error('Location search failed. Check internet connection.');
    } finally {
      setSearching(false);
    }
  }

  function selectResult(r) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    // Auto-estimate UTC offset from longitude (nearest half-hour)
    let tz = Math.round((lon / 15) * 2) / 2;
    // India heuristic: IST = +5.5
    if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 98) tz = 5.5;
    const label = r.display_name;
    set('place_of_birth', label);
    setForm(f => ({
      ...f,
      place_of_birth:  label,
      latitude:        lat.toFixed(6),
      longitude:       lon.toFixed(6),
      timezone_offset: String(tz),
    }));
    setLocQuery(label.split(',')[0]);
    setLocResults([]);
  }

  // ── Map preview src (OSM embed, no key) ──
  const lat = parseFloat(form.latitude);
  const lon = parseFloat(form.longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lon);
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lon-0.05).toFixed(5)},${(lat-0.05).toFixed(5)},${(lon+0.05).toFixed(5)},${(lat+0.05).toFixed(5)}&layer=mapnik&marker=${lat},${lon}`
    : null;

  // ── Save ──
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.date_of_birth || !form.time_of_birth) {
      toast.error('Name, date and time are required.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/kundli/${kundli.uuid}`, {
        name:            form.name,
        date_of_birth:   form.date_of_birth,
        time_of_birth:   form.time_of_birth + ':00',
        place_of_birth:  form.place_of_birth,
        latitude:        parseFloat(form.latitude),
        longitude:       parseFloat(form.longitude),
        timezone_offset: parseFloat(form.timezone_offset),
        gender:          form.gender,
      });
      // Force fresh recalculation with new birth data
      await api.post(`/kundli/${kundli.uuid}/recalculate`);
      toast.success('Birth details saved & chart recalculated!');
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full bg-[#0f1128] border border-gold/20 rounded-lg px-3 py-2 text-ivory text-sm focus:outline-none focus:border-gold/60 placeholder-ivory/25 transition-colors';
  const labelCls = 'text-ivory/45 text-[10px] uppercase tracking-widest block mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(6,7,15,0.88)', backdropFilter: 'blur(6px)', paddingTop: 60, paddingBottom: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="card-royal w-full max-w-2xl mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-gold text-lg font-bold">✏️ Edit Birth Details</h2>
          <button onClick={onClose}
            style={{ color:'rgba(245,240,232,0.4)', fontSize:20, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Name + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls} value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Gender *</label>
              <select className={inputCls} value={form.gender}
                onChange={e => set('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input type="date" className={inputCls} value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Time of Birth *</label>
              <input type="time" className={inputCls} value={form.time_of_birth}
                onChange={e => set('time_of_birth', e.target.value)} required />
            </div>
          </div>

          {/* Location search */}
          <div ref={searchRef}>
            <label className={labelCls}>Search Place of Birth (OpenStreetMap — free)</label>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="e.g. Jodhpur, Rajasthan, India"
                value={locQuery}
                onChange={e => setLocQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLocationSearch(e); }}}
              />
              <button type="button" onClick={handleLocationSearch} disabled={searching}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
                  color: '#D4AF37', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {searching ? '⏳' : '🔍 Search'}
              </button>
            </div>

            {/* Results dropdown */}
            {locResults.length > 0 && (
              <div style={{
                position: 'absolute', zIndex: 100, left: 0, right: 0,
                background: '#0f1128', border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {locResults.map((r, i) => (
                  <button key={i} type="button"
                    onClick={() => selectResult(r)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', fontSize: 12, color: 'rgba(245,240,232,0.75)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: i < locResults.length - 1 ? '1px solid rgba(212,175,55,0.08)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ color: '#D4AF37', marginRight: 6 }}>📍</span>
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Place label (editable) */}
          <div>
            <label className={labelCls}>Place of Birth (Label)</label>
            <input className={inputCls} value={form.place_of_birth}
              onChange={e => set('place_of_birth', e.target.value)}
              placeholder="City, State, Country" />
          </div>

          {/* Lat / Lon / Timezone */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Latitude °N</label>
              <input type="number" step="0.000001" className={inputCls}
                value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
                placeholder="26.2800" />
            </div>
            <div>
              <label className={labelCls}>Longitude °E</label>
              <input type="number" step="0.000001" className={inputCls}
                value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
                placeholder="73.0200" />
            </div>
            <div>
              <label className={labelCls}>UTC Offset (hrs)</label>
              <select className={inputCls} value={form.timezone_offset}
                onChange={e => set('timezone_offset', e.target.value)}>
                {['-12','-11','-10','-9.5','-9','-8','-7','-6','-5','-4.5','-4',
                  '-3.5','-3','-2','-1','0','1','2','3','3.5','4','4.5','5','5.5',
                  '5.75','6','6.5','7','8','8.75','9','9.5','10','10.5','11','12',
                  '12.75','13','14'].map(v => (
                  <option key={v} value={v}>UTC {+v >= 0 ? '+' : ''}{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* OSM Map preview */}
          {hasCoords && mapSrc && (
            <div>
              <label className={labelCls}>Location Preview (OpenStreetMap)</label>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', height: 200 }}>
                <iframe
                  src={mapSrc}
                  width="100%" height="200"
                  style={{ border: 'none', display: 'block' }}
                  loading="lazy"
                  title="Birth place map"
                />
              </div>
              <p style={{ fontSize:10, color:'rgba(245,240,232,0.25)', marginTop:4 }}>
                📌 {lat.toFixed(4)}°N, {lon.toFixed(4)}°E ·
                <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color:'#D4AF37', marginLeft:4, textDecoration:'underline' }}>
                  Open full map ↗
                </a>
              </p>
            </div>
          )}

          {/* Save */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gold/10">
            <button type="button" onClick={onClose}
              style={{
                padding:'8px 20px', borderRadius:8, fontSize:12, cursor:'pointer',
                background:'transparent', border:'1px solid rgba(212,175,55,0.25)', color:'rgba(245,240,232,0.5)',
              }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding:'8px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
                background: saving ? 'rgba(212,175,55,0.2)' : 'linear-gradient(135deg,#D4AF37,#B8960C)',
                border:'none', color: saving ? '#D4AF37' : '#0B0D1A',
                opacity: saving ? 0.7 : 1,
              }}>
              {saving ? '⏳ Saving & Recalculating…' : '💾 Save & Recalculate Chart'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Basic Details Panel ─────────────────────────────────────────────────────
// Shows 3 tabs: Basic Details | Ghat Chakra (Panchang) | Astro Details

const BD_TABS = [
  { key: 'basic',  label: 'Basic Details',  label_hi: 'जन्म विवरण' },
  { key: 'ghat',   label: 'Ghat Chakra',    label_hi: 'घट चक्र'   },
  { key: 'astro',  label: 'Astro Details',  label_hi: 'ज्योतिष विवरण' },
];

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'flex-start',
      padding:'6px 0', borderBottom:'1px solid rgba(212,175,55,0.07)',
    }}>
      <span style={{ color:'rgba(245,240,232,0.38)', fontSize:11, flexShrink:0, minWidth:120 }}>{label}</span>
      <span style={{ color:'#F5F0E8', fontSize:12, textAlign:'right', fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>{value}</span>
    </div>
  );
}

function BasicDetailsPanel({ kundli, chart, lang }) {
  const [tab, setTab] = useState('basic');
  if (!kundli) return null;

  const dob  = String(kundli.date_of_birth).slice(0, 10);
  const time = (kundli.time_of_birth || '').slice(0, 5);
  const tz   = kundli.timezone_offset;
  const p    = chart?.panchang;
  const ad   = chart?.astro_details;

  const fmt12 = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const ap  = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`;
  };

  const dateFormatted = (() => {
    const parts = dob.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dob;
  })();

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
      className="card-royal p-5">
      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {BD_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding:'4px 11px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === t.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === t.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {lang === 'hi' ? t.label_hi : t.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div>
          <InfoRow label="Name"       value={kundli.name} />
          <InfoRow label="Place"      value={kundli.place_of_birth} />
          <InfoRow label="Date"       value={dateFormatted} />
          <InfoRow label="Time"       value={fmt12(time)} />
          <InfoRow label="Latitude"   value={`${parseFloat(kundli.latitude).toFixed(2)}°`} />
          <InfoRow label="Longitude"  value={`${parseFloat(kundli.longitude).toFixed(2)}°`} />
          <InfoRow label="Timezone"   value={`GMT+${tz}`} />
          <InfoRow label="Sunrise"    value={p?.sunrise || '—'} />
          <InfoRow label="Sunset"     value={p?.sunset  || '—'} />
          <InfoRow label="Ayanamsha"  value={chart ? `${chart.meta.ayanamsa_dms} (Lahiri)` : '—'} />
        </div>
      )}

      {tab === 'ghat' && (
        <div>
          <InfoRow label="Month"      value={p ? (lang==='hi' ? p.masa.name_hi : p.masa.name) : '—'} />
          <InfoRow label="Tithi"      value={p ? (lang==='hi' ? p.tithi.display_hi : p.tithi.display_en) : '—'} />
          <InfoRow label="Day"        value={p ? (lang==='hi' ? p.vara.day_hi : p.vara.day_en) : '—'} />
          <InfoRow label="Nakshatra"  value={chart ? (lang==='hi' ? chart.nakshatra.hi : chart.nakshatra.en) : '—'} />
          <InfoRow label="Yoga"       value={p ? p.yoga.name : '—'} />
          <InfoRow label="Karan"      value={p ? p.karana.name : '—'} />
          <InfoRow label="Pahar"      value={p?.pahar != null ? String(p.pahar) : '—'} />
          <InfoRow label="Moon Phase" value={p?.moon_phase != null ? String(p.moon_phase) : '—'} />
        </div>
      )}

      {tab === 'astro' && ad && (
        <div>
          <InfoRow label="Ascendant"       value={lang==='hi' ? ad.ascendant_rashi_hi : ad.ascendant_rashi_en} />
          <InfoRow label="Ascendant Lord"  value={ad.ascendant_lord} />
          <InfoRow label="Varna"           value={lang==='hi' ? ad.varna.name_hi : ad.varna.name} />
          <InfoRow label="Vashya"          value={lang==='hi' ? ad.vashya.name_hi : ad.vashya.name} />
          <InfoRow label="Yoni"            value={ad.yoni.name} />
          <InfoRow label="Gan"             value={lang==='hi' ? ad.gana.name_hi : ad.gana.name} />
          <InfoRow label="Nadi"            value={lang==='hi' ? ad.nadi.name_hi : ad.nadi.name} />
          <InfoRow label="Sign Lord"       value={ad.moon_sign_lord} />
          <InfoRow label="Sign"            value={lang==='hi' ? ad.moon_sign_hi : ad.moon_sign_en} />
          <InfoRow label="Nakshatra"       value={lang==='hi' ? ad.moon_nakshatra_hi : ad.moon_nakshatra_en} />
          <InfoRow label="Nakshatra Lord"  value={ad.moon_nakshatra_lord} />
          <InfoRow label="Charan"          value={String(ad.moon_pada)} />
          <InfoRow label="Yoga"            value={ad.yoga.name} />
          <InfoRow label="Karan"           value={ad.karana.name} />
          <InfoRow label="Tithi"           value={lang==='hi' ? ad.tithi.display_hi : ad.tithi.display_en} />
          <InfoRow label="Yunja"           value={lang==='hi' ? ad.yunja.yunja_hi : ad.yunja.yunja} />
          <InfoRow label="Tatva"           value={lang==='hi' ? ad.tatva.hi : ad.tatva.en} />
          <InfoRow label="Name Alphabet"   value={ad.naam_akshar} />
          <InfoRow label="Paya"            value={lang==='hi' ? ad.paya.paya_hi : ad.paya.paya} />
        </div>
      )}
      {tab === 'astro' && !ad && (
        <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, textAlign:'center', padding:16 }}>
          {lang==='hi' ? 'कुंडली पुनः गणना करें' : 'Recalculate to see Astro Details'}
        </p>
      )}
    </motion.div>
  );
}

// ─── Personality Insights Panel ───────────────────────────────────────────────

const PI_TABS = [
  { key:'traits',    label:'Traits',    label_hi:'स्वभाव'    },
  { key:'career',    label:'Career',    label_hi:'करियर'     },
  { key:'health',    label:'Health',    label_hi:'स्वास्थ्य' },
];

function PersonalityInsights({ insight, chart, lang }) {
  const [tab, setTab] = useState('traits');
  if (!insight) return null;

  const nakName = lang === 'hi' ? insight.name_hi : insight.name;
  const deityName = lang === 'hi' ? insight.deity_hi : insight.deity_en;

  const professions = lang === 'hi'
    ? (insight.professions_hi || [])
    : (insight.professions_en || []);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      className="card-royal p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            ✨ {lang==='hi' ? 'नक्षत्र अंतर्दृष्टि' : 'Nakshatra Insights'}
          </h2>
          <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, marginTop:2 }}>
            {nakName} {lang==='hi' ? '• देवता:' : '• Deity:'} {deityName}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {PI_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding:'4px 12px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === t.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === t.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {lang==='hi' ? t.label_hi : t.label}
          </button>
        ))}
      </div>

      {/* Traits */}
      {tab === 'traits' && (
        <div className="space-y-4">
          {/* Positive traits */}
          <div>
            <p style={{ color:'#22C55E', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
              {lang==='hi' ? '✅ मुख्य गुण' : '✅ Core Traits'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
              {lang==='hi' ? insight.characteristics_hi : insight.characteristics_en}
            </p>
          </div>
          {/* Negative traits */}
          {(insight.negative_traits_en || insight.negative_traits_hi) && (
            <div>
              <p style={{ color:'#EF4444', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '⚠️ सावधानियां' : '⚠️ What to Avoid'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.negative_traits_hi : insight.negative_traits_en}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Career */}
      {tab === 'career' && (
        <div className="space-y-4">
          {professions.length > 0 ? professions.map((cat, i) => (
            <div key={i}>
              <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>
                {cat.category}
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(cat.roles || []).map((role, j) => (
                  <span key={j} style={{
                    padding:'3px 9px', borderRadius:12, fontSize:10, fontWeight:500,
                    background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)',
                    color:'rgba(245,240,232,0.7)', fontFamily:'var(--font-devanagari),Inter,sans-serif',
                  }}>{role}</span>
                ))}
              </div>
            </div>
          )) : (
            <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, textAlign:'center', padding:12 }}>
              {lang==='hi' ? 'डेटा उपलब्ध नहीं' : 'Career data not available. Recalculate chart.'}
            </p>
          )}
        </div>
      )}

      {/* Health */}
      {tab === 'health' && (
        <div className="space-y-4">
          {(insight.health_issues_en || insight.health_issues_hi) && (
            <div>
              <p style={{ color:'#F59E0B', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '🔶 स्वास्थ्य समस्याएं' : '🔶 Common Health Issues'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.health_issues_hi : insight.health_issues_en}
              </p>
            </div>
          )}
          {(insight.health_root_cause_en || insight.health_root_cause_hi) && (
            <div>
              <p style={{ color:'#94A3B8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '🔍 मूल कारण' : '🔍 Root Cause'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.health_root_cause_hi : insight.health_root_cause_en}
              </p>
            </div>
          )}
          {(insight.health_guidance_en || insight.health_guidance_hi) && (
            <div>
              <p style={{ color:'#22C55E', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
                {lang==='hi' ? '💚 स्वास्थ्य मार्गदर्शन' : '💚 Health Guidance'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.7, fontFamily:'var(--font-devanagari),Inter,sans-serif' }}>
                {lang==='hi' ? insight.health_guidance_hi : insight.health_guidance_en}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KundliDetail({ uuid }) {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const router   = useRouter();

  const [kundli,           setKundli]           = useState(null);
  const [nakshatraInsight, setNakshatraInsight] = useState(null);
  const [error,            setError]            = useState(null);
  const [fetching,         setFetching]         = useState(true);
  const [recalcing,        setRecalcing]        = useState(false);
  const [editOpen,         setEditOpen]         = useState(false);
  const [chartStyle,       setChartStyle]       = useState('north'); // 'south' | 'north'

  // Persist chart style preference
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kundli_chart_style') : null;
    if (saved === 'south' || saved === 'north') setChartStyle(saved);
  }, []);

  const handleStyleChange = (s) => {
    setChartStyle(s);
    localStorage.setItem('kundli_chart_style', s);
  };

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const fetchKundli = useCallback(() => {
    if (!user || !uuid) return;
    setFetching(true);
    api.get(`/kundli/${uuid}`)
      .then(({ data }) => {
        setKundli(data.profile);
        setNakshatraInsight(data.profile.nakshatra_insight || null);
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load Kundli'))
      .finally(() => setFetching(false));
  }, [user, uuid]);

  useEffect(fetchKundli, [fetchKundli]);

  const handleRecalc = async () => {
    setRecalcing(true);
    try {
      const { data } = await api.post(`/kundli/${uuid}/recalculate`);
      setKundli(data.profile);
      setNakshatraInsight(data.profile.nakshatra_insight || null);
    } catch {}
    finally { setRecalcing(false); }
  };

  // Called by EditKundliModal after save+recalc succeeds — re-fetch fresh chart
  const handleEditSaved = useCallback(() => {
    setEditOpen(false);
    fetchKundli();   // reload full profile with new calculated_data
  }, [fetchKundli]);

  const handlePdf = async () => {
    try {
      const response = await api.get(`/kundli/${uuid}/report.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${kundli?.name || 'kundli'}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to export PDF');
    }
  };

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">🪐</div>
          <p className="text-gold/50 text-sm tracking-widest font-devanagari">
            {lang==='hi' ? 'कुंडली गणना हो रही है…' : 'Computing Kundli…'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card-royal p-10 text-center max-w-md">
          <p className="text-4xl mb-4">❌</p>
          <h2 className="font-serif text-gold text-xl mb-2">
            {lang==='hi' ? 'कुंडली नहीं मिली' : 'Kundli Not Found'}
          </h2>
          <p className="text-ivory/55 text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="btn-outline-gold px-6 py-2 text-sm">← Dashboard</Link>
        </div>
      </div>
    );
  }
  if (!kundli) return null;

  // Parse calculated_data
  let chart = null;
  try {
    chart = kundli.calculated_data
      ? (typeof kundli.calculated_data === 'string' ? JSON.parse(kundli.calculated_data) : kundli.calculated_data)
      : null;
  } catch {}

  const dob = String(kundli.date_of_birth).slice(0, 10);
  const curDasha = chart?.dasha?.find(d => d.is_current) || chart?.dasha?.[0];

  return (
    <div className="relative min-h-screen pt-20 pb-16 px-4"
      style={{ background:'radial-gradient(ellipse at top,#181C35 0%,#0B0D1A 60%,#06070F 100%)' }}>
      <StarField count={70} />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ivory/30 mb-6">
          <Link href="/dashboard" className="hover:text-gold transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gold/80">{kundli.name}</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="card-royal p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl shrink-0">🪐</div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gradient-gold">{kundli.name}</h1>
              <p className="text-ivory/45 text-sm mt-0.5 font-devanagari">
                {dob} · {kundli.time_of_birth?.slice(0,5)} · {kundli.place_of_birth}
              </p>
              {chart?.meta && (
                <p className="text-ivory/20 text-[10px] mt-1 font-mono">
                  {chart.meta.system} · Ayanamsa {chart.meta.ayanamsa_dms} · JD {chart.meta.julian_day}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={handlePdf} className="btn-outline-gold text-xs px-4 py-2">
              📄 PDF Report
            </button>
            <button onClick={handleRecalc} disabled={recalcing}
              className="btn-outline-gold text-xs px-4 py-2">
              {recalcing ? '⏳ Recalculating…' : '🔄 Recalculate'}
            </button>
            <button onClick={() => setEditOpen(true)}
              style={{
                padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.45)',
                color:'#D4AF37', cursor:'pointer',
              }}>
              ✏️ Edit Details
            </button>
          </div>
        </motion.div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editOpen && kundli && (
            <EditKundliModal
              kundli={kundli}
              onClose={() => setEditOpen(false)}
              onSaved={handleEditSaved}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left col: Chart ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Chart card with style toggle */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              className="card-royal p-5">

              {/* Toggle */}
              <ChartToggle style={chartStyle} onChange={handleStyleChange} />

              {/* Chart label */}
              <p className="font-serif text-gold text-sm font-semibold text-center mb-3">
                🔯 {lang==='hi'?'लग्न कुंडली (D1)':'Lagna Chart (D1)'}
                <span className="text-gold/40 text-[10px] ml-2 normal-case font-sans">
                  {chartStyle === 'south' ? 'South Indian' : 'North Indian'}
                </span>
              </p>

              {/* Animated chart swap */}
              <AnimatePresence mode="wait">
                <motion.div key={chartStyle}
                  initial={{ opacity:0, scale:0.97 }}
                  animate={{ opacity:1, scale:1 }}
                  exit={{ opacity:0, scale:0.97 }}
                  transition={{ duration:0.2 }}>
                  {chartStyle === 'south'
                    ? <SouthIndianChart chart={chart} lang={lang} />
                    : <NorthIndianChart chart={chart} lang={lang} />
                  }
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Navamsha D9 chart — same North/South style toggle as D1 */}
            {chart?.navamsha && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
                className="card-royal p-5">
                <p className="font-serif text-gold text-sm font-semibold text-center mb-3">
                  🔯 D9 Navamsha
                  <span className="text-gold/40 text-[10px] ml-2 normal-case font-sans">
                    {lang==='hi' ? chart.navamsha.ascendant?.rashi_hi : chart.navamsha.ascendant?.rashi_en} Lagna ·{' '}
                    {chartStyle === 'south' ? 'South Indian' : 'North Indian'}
                  </span>
                </p>
                <AnimatePresence mode="wait">
                  <motion.div key={`nav-${chartStyle}`}
                    initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.2 }}>
                    {chartStyle === 'south'
                      ? <SouthIndianChart chart={chart.navamsha} lang={lang} />
                      : <NorthIndianChart chart={chart.navamsha} lang={lang} />
                    }
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}

            {/* Quick stats */}
            {chart && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                className="grid grid-cols-2 gap-3">
                {[
                  { l: lang==='hi'?'लग्न':'Ascendant',  v: lang==='hi'?chart.ascendant.rashi_hi:chart.ascendant.rashi_en,   s: chart.ascendant.degree_in_sign_dms, c:'#D4AF37' },
                  { l: lang==='hi'?'नक्षत्र':'Nakshatra', v: lang==='hi'?chart.nakshatra.hi:chart.nakshatra.en,               s:`Pada ${chart.nakshatra.pada}`,        c:'#A78BFA' },
                  { l: lang==='hi'?'चन्द्र':'Moon',      v: lang==='hi'?chart.planets.Moon.rashi_hi:chart.planets.Moon.rashi_en, s: chart.planets.Moon.degree_in_sign_dms, c:'#94A3B8' },
                  { l: lang==='hi'?'सूर्य':'Sun',         v: lang==='hi'?chart.planets.Sun.rashi_hi:chart.planets.Sun.rashi_en,  s: chart.planets.Sun.degree_in_sign_dms,  c:'#F59E0B' },
                ].map(({ l, v, s, c }) => (
                  <div key={l} className="card-royal p-3 text-center">
                    <p style={{ color:c, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, lineHeight:1.2 }}>{v}</p>
                    <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, marginTop:2 }}>{s}</p>
                    <p style={{ color:'rgba(245,240,232,0.45)', fontSize:10, marginTop:3 }}>{l}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Basic Details + Ghat Chakra + Astro Details (tabbed panel) */}
            <BasicDetailsPanel kundli={kundli} chart={chart} lang={lang} />
          </div>

          {/* ── Right col: Planets + Dasha + Houses ──────────────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Planet table */}
            {chart && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                className="card-royal p-5">
                <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                  🌌 {lang==='hi'?'ग्रह स्थिति':'Planet Positions'}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gold/15">
                        {[lang==='hi'?'ग्रह':'Planet', lang==='hi'?'राशि':'Sign', lang==='hi'?'अंश':'Degree', lang==='hi'?'भाव':'House', lang==='hi'?'स्थिति':'Status'].map(h => (
                          <th key={h} className="text-left py-2 pr-3 text-ivory/30 text-[10px] font-medium uppercase tracking-wider first:pl-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(chart.planets).map(([name, pd]) => {
                        const meta = PLANET_META[name] || {};
                        const ds   = DIGNITY_STYLE[pd.dignity] || DIGNITY_STYLE.Neutral;
                        const houseNum = Object.entries(chart.houses)
                          .find(([,h]) => h.rashi_num === pd.rashi_num)?.[0];
                        return (
                          <tr key={name} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                <span style={{ color:meta.color, fontSize:13, width:16 }}>{meta.icon}</span>
                                <div>
                                  <p className="text-ivory text-xs font-medium">{name}</p>
                                  <p className="text-ivory/30 text-[9px] font-devanagari">{meta.hi}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3">
                              <p className="text-ivory/80 text-[11px] font-devanagari">
                                {lang==='hi' ? pd.rashi_hi : pd.rashi_en}
                              </p>
                              <p className="text-ivory/30 text-[9px]">{pd.rashi_symbol}</p>
                            </td>
                            <td className="py-2.5 pr-3 text-ivory/55 font-mono text-[10px]">
                              {pd.degree_in_sign_dms}
                            </td>
                            <td className="py-2.5 pr-3 text-ivory/45 text-[11px]">
                              {houseNum ? `H${houseNum}` : '—'}
                            </td>
                            <td className="py-2.5">
                              <span style={{
                                fontSize:10, padding:'2px 7px', borderRadius:12, fontWeight:600,
                                background: ds.bg, color: ds.color,
                              }}>
                                {pd.dignity.split('(')[0].trim() || pd.dignity}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Dasha timeline */}
            {chart?.dasha && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
                className="card-royal p-5">
                <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                  ⏳ {lang==='hi'?'विंशोत्तरी दशा':'Vimshottari Dasha'}
                  {curDasha && (
                    <span className="text-gold/45 text-[10px] font-sans font-normal ml-2 normal-case">
                      {lang==='hi'?'चालू:':'Current:'} {lang==='hi' ? PLANET_META[curDasha.lord]?.hi : curDasha.lord}
                    </span>
                  )}
                </h2>
                <div className="space-y-1.5">
                  {chart.dasha.map((d, i) => {
                    const meta = PLANET_META[d.lord] || {};
                    const isCur = d.is_current;
                    // Progress bar width for current dasha
                    const today = new Date();
                    const start = new Date(d.start);
                    const end   = new Date(d.end);
                    const pct   = isCur ? Math.min(100, Math.max(0,
                      (today - start) / (end - start) * 100
                    )) : 0;

                    return (
                      <div key={i} style={{
                        position:'relative',
                        display:'flex', alignItems:'center', gap:10,
                        padding:'8px 10px', borderRadius:6, overflow:'hidden',
                        border:`1px solid ${isCur ? 'rgba(212,175,55,0.3)' : 'transparent'}`,
                        background: isCur ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                        transition:'all 0.2s',
                      }}>
                        {/* Progress fill for current dasha */}
                        {isCur && (
                          <div style={{
                            position:'absolute', left:0, top:0, bottom:0,
                            width:`${pct}%`, opacity:0.08,
                            background:'linear-gradient(90deg,#D4AF37,transparent)',
                            pointerEvents:'none',
                          }} />
                        )}

                        <span style={{ color:meta.color, fontSize:15, width:18, textAlign:'center', flexShrink:0 }}>
                          {meta.icon}
                        </span>

                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                            <span style={{ color:'#F5F0E8', fontSize:12, fontWeight:600, fontFamily:'var(--font-devanagari),sans-serif' }}>
                              {lang==='hi' ? meta.hi : d.lord}
                            </span>
                            {isCur && (
                              <span style={{
                                fontSize:9, padding:'1px 7px', borderRadius:10, fontWeight:700,
                                background:'rgba(212,175,55,0.2)', color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.1em',
                              }}>
                                {lang==='hi'?'चालू':'NOW'}
                              </span>
                            )}
                          </div>
                          <span style={{ color:'rgba(245,240,232,0.35)', fontSize:10, fontFamily:'monospace' }}>
                            {d.start} → {d.end}
                          </span>
                        </div>

                        <span style={{ color:'rgba(245,240,232,0.25)', fontSize:10, flexShrink:0 }}>
                          {d.full_years}Y
                        </span>
                      </div>
                    );
                  })}
                </div>
                {curDasha?.antardasha && (
                  <div className="mt-5 pt-4 border-t border-gold/10">
                    <h3 className="text-gold/80 text-xs uppercase tracking-[0.22em] mb-3">
                      Current Antardasha
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {curDasha.antardasha.map((ad) => {
                        const isCur = ad.is_current;
                        return (
                          <div key={`${ad.lord}-${ad.start}`} className={`rounded border p-2 ${isCur ? 'border-gold/45 bg-gold/10' : 'border-gold/10 bg-white/3'}`}>
                            <div className="flex justify-between gap-2">
                              <span className="text-ivory text-xs">{ad.lord}</span>
                              {isCur && <span className="text-gold text-[9px] uppercase">Now</span>}
                            </div>
                            <p className="text-ivory/35 text-[10px] mt-1">{ad.start} → {ad.end}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Dosha, transit, predictions */}
            {chart && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-royal p-5">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">Mangal Dosha</h2>
                  <p className="text-ivory/75 text-sm">{chart.mangal_dosha?.summary_en || 'Not calculated'}</p>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {(chart.mangal_dosha?.checks || []).map((check) => (
                      <div key={check.basis} className={`rounded border p-2 text-center ${check.has_dosha ? 'border-gold/40 bg-gold/10' : 'border-gold/10 bg-white/3'}`}>
                        <p className="text-[10px] text-ivory/35">{check.basis}</p>
                        <p className="text-sm text-gold mt-1">H{check.house}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-royal p-5">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">Gochar</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-gold/8 pb-2">
                      <span className="text-ivory/45">Sade Sati</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.sade_sati?.active ? chart.gochar.highlights.sade_sati.phase : 'Inactive'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gold/8 pb-2">
                      <span className="text-ivory/45">Jupiter</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.jupiter_support?.favorable ? 'Supportive' : 'Patient'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ivory/45">Rahu Ketu</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.rahu_ketu_axis || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="card-royal p-5 md:col-span-2">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">Prediction Engine</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(chart.predictions?.summary_en || []).map((line, index) => (
                      <p key={index} className="border border-gold/10 rounded p-3 text-sm text-ivory/70">{line}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Houses grid */}
            {chart?.houses && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                className="card-royal p-5">
                <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                  🏠 {lang==='hi'?'12 भाव (पूर्ण राशि)':'12 Houses (Whole Sign)'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(chart.houses).map(h => (
                    <div key={h.house_num}
                      className={`border rounded p-2.5 transition-all ${
                        h.rashi_num === chart.ascendant.rashi_num
                          ? 'border-gold/40 bg-gold/6'
                          : 'border-gold/10 hover:border-gold/20'
                      }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-ivory/35 uppercase tracking-wider font-medium">H{h.house_num}</span>
                        <span className="text-[10px] text-ivory/55 font-devanagari">
                          {lang==='hi' ? h.rashi_hi : h.rashi_en?.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-[9px] text-ivory/30">
                        {lang==='hi'?'स्वामी':'Lord'}: <span className="text-gold/55">{h.rashi_lord}</span>
                      </p>
                      {h.planets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {h.planets.map(p => (
                            <span key={p} style={{ color: PLANET_META[p]?.color || '#D4AF37', fontSize:10 }}>
                              {PLANET_META[p]?.icon}{p.slice(0,2)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Personality Insights (from nakshatra DB) */}
            {nakshatraInsight && (
              <PersonalityInsights insight={nakshatraInsight} chart={chart} lang={lang} />
            )}

          </div>
        </div>

        {/* ── Digbala ─────────────────────────────────────────────────────── */}
        {chart?.digbala && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
            className="card-royal p-5 mt-6">
            <h2 className="font-serif text-gold text-sm font-semibold mb-1">
              🧭 {lang==='hi' ? 'ग्रह दिग्बल (Digbala)' : 'Graha Digbala — Directional Strength'}
            </h2>
            <p className="text-ivory/30 text-[10px] mb-4">
              {lang==='hi'
                ? 'जब कोई ग्रह अपनी विशेष दिशा (भाव) में होता है तो उसे दिग्बल प्राप्त होता है।'
                : 'A planet gains Digbala (directional strength) when placed in its specific directional house.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(chart.digbala).map((d) => {
                const meta = PLANET_META[d.planet] || {};
                const barColor = d.has_digbala ? '#22C55E'
                               : d.has_digbala_loss ? '#EF4444'
                               : '#D4AF37';
                return (
                  <div key={d.planet}
                    style={{
                      border: `1px solid ${d.has_digbala ? 'rgba(34,197,94,0.4)' : d.has_digbala_loss ? 'rgba(239,68,68,0.25)' : 'rgba(212,175,55,0.12)'}`,
                      borderRadius: 8, padding: '10px 12px',
                      background: d.has_digbala ? 'rgba(34,197,94,0.06)' : 'rgba(17,20,40,0.5)',
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: meta.color, fontSize: 14 }}>{meta.icon}</span>
                        <span className="text-ivory text-xs font-semibold">{d.planet}</span>
                        {d.has_digbala && (
                          <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(34,197,94,0.2)', color:'#22C55E', fontWeight:700, textTransform:'uppercase' }}>
                            Digbala ✓
                          </span>
                        )}
                        {d.has_digbala_loss && (
                          <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(239,68,68,0.15)', color:'#EF4444', fontWeight:700, textTransform:'uppercase' }}>
                            Lost
                          </span>
                        )}
                      </div>
                      <span className="text-ivory/35 text-[10px]">{d.strength_percent}%</span>
                    </div>
                    {/* Strength bar */}
                    <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${d.strength_percent}%`, background:barColor, borderRadius:2, transition:'width 0.4s ease' }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-ivory/35">
                      <span>
                        {lang==='hi' ? 'भाव' : 'House'} {d.planet_house} ({d.rashi_en})
                        {'  →  '}
                        {lang==='hi' ? 'शक्तिशाली भाव' : 'Strong at'} H{d.strong_house}
                      </span>
                      <span style={{ color: '#A78BFA' }}>
                        {d.strong_direction?.[lang === 'hi' ? 'hi' : 'en']}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Bhav Karak ───────────────────────────────────────────────────── */}
        {chart?.bhav_karak && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
            className="card-royal p-5 mt-6">
            <h2 className="font-serif text-gold text-sm font-semibold mb-1">
              🪐 {lang==='hi' ? 'भाव कारक ग्रह' : 'Bhav Karak Grahas — Natural Significators'}
            </h2>
            <p className="text-ivory/30 text-[10px] mb-4">
              {lang==='hi'
                ? 'हर भाव का एक कारक ग्रह होता है जो उस भाव के स्वाभाविक फल का प्रतिनिधित्व करता है।'
                : 'Each house has natural significator (Karak) planets that govern its themes.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.values(chart.bhav_karak).map((bk) => {
                const isLagna = bk.house === chart.ascendant?.rashi_num
                  ? false   // compare house not sign
                  : false;
                return (
                  <div key={bk.house}
                    className="border border-gold/12 rounded p-3 hover:border-gold/25 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gold/70 text-[10px] font-bold uppercase tracking-wider">
                        H{bk.house}
                      </span>
                      <div className="flex gap-1">
                        {bk.karakas.map((p) => (
                          <span key={p}
                            style={{ fontSize:10, color: PLANET_META[p]?.color || '#D4AF37', fontWeight:700 }}>
                            {PLANET_META[p]?.icon}{p.slice(0,2)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-ivory/55 text-[10px] mb-2 leading-tight">
                      {lang==='hi' ? bk.signification_hi : bk.signification_en}
                    </p>
                    {bk.karaka_positions.map((kp) => {
                      const meta = PLANET_META[kp.planet] || {};
                      const qualityColor = kp.placement_quality === 'trikona' ? '#22C55E'
                                         : kp.placement_quality === 'kendra'  ? '#60A5FA'
                                         : 'rgba(245,240,232,0.35)';
                      return (
                        <div key={kp.planet}
                          className="flex items-center justify-between mt-1 border-t border-white/4 pt-1">
                          <span style={{ color: meta.color, fontSize:10 }}>
                            {meta.icon} {kp.planet}
                          </span>
                          <span style={{ fontSize:9, color: qualityColor }}>
                            H{kp.house} · {kp.rashi_en}
                            {kp.placement_quality !== 'other' && (
                              <span style={{ marginLeft:4, opacity:0.7 }}>
                                ({kp.placement_quality})
                              </span>
                            )}
                            {kp.is_in_own_karak_house && (
                              <span style={{ marginLeft:3, color:'#F59E0B' }} title="Karako Bhava Nashaya">⚠</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Graha Drishti ────────────────────────────────────────────────── */}
        {chart?.drishti && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
            className="card-royal p-5 mt-6">
            <h2 className="font-serif text-gold text-sm font-semibold mb-1">
              👁 {lang==='hi' ? 'ग्रह दृष्टि (Graha Drishti)' : 'Graha Drishti — Planetary Aspects'}
            </h2>
            <p className="text-ivory/30 text-[10px] mb-4">
              {lang==='hi'
                ? 'हर ग्रह अपनी स्थिति से 7वें भाव पर दृष्टि डालता है। मंगल, गुरु, शनि, राहु, केतु की विशेष दृष्टियाँ होती हैं।'
                : 'Every planet aspects the 7th house. Mars, Jupiter, Saturn, Rahu & Ketu have additional special aspects.'}
            </p>

            {/* By Planet */}
            <h3 className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">
              {lang==='hi' ? 'ग्रह → जिन भावों पर दृष्टि' : 'Planet → Houses Aspected'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
              {Object.entries(chart.drishti.by_planet || {}).map(([planet, info]) => {
                const meta = PLANET_META[planet] || {};
                const hasSpecial = info.aspects.length > 1;
                return (
                  <div key={planet}
                    style={{
                      border: `1px solid ${hasSpecial ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.1)'}`,
                      borderRadius: 8, padding: '8px 10px',
                      background: hasSpecial ? 'rgba(212,175,55,0.04)' : 'transparent',
                    }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: meta.color, fontSize:13 }}>{meta.icon}</span>
                      <span className="text-ivory text-xs font-semibold">{planet}</span>
                      <span className="text-ivory/30 text-[9px]">H{info.from_house}</span>
                      {hasSpecial && (
                        <span style={{ fontSize:8, padding:'1px 5px', borderRadius:8, background:'rgba(212,175,55,0.15)', color:'#D4AF37', marginLeft:'auto' }}>
                          Special
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {info.aspects.map(({ house, offset, nature }) => {
                        const natColor = nature === 'auspicious'  ? '#22C55E'
                                       : nature === 'aggressive'  ? '#EF4444'
                                       : nature === 'karmic'      ? '#A78BFA'
                                       : nature === 'restricting' ? '#818CF8'
                                       : '#94A3B8';
                        return (
                          <span key={offset}
                            style={{ fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:600,
                              background:`${natColor}18`, color:natColor, border:`1px solid ${natColor}33` }}>
                            H{house} ({offset}th)
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* By House */}
            <h3 className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">
              {lang==='hi' ? 'भाव → जिन ग्रहों की दृष्टि पड़ रही है' : 'House → Planets Aspecting It'}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.entries(chart.drishti.by_house || {}).map(([house, planets]) => (
                <div key={house}
                  className={`border rounded p-2 text-center ${
                    planets.length ? 'border-gold/20 bg-gold/4' : 'border-gold/8'
                  }`}>
                  <p className="text-[9px] text-ivory/35 uppercase tracking-wider mb-1">H{house}</p>
                  {planets.length ? (
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {planets.map((p) => (
                        <span key={p} style={{ fontSize:9, color: PLANET_META[p]?.color || '#D4AF37', fontWeight:700 }}>
                          {p.slice(0,2)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ivory/15 text-[9px]">—</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bottom nav */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
          className="mt-6 flex flex-wrap gap-3 justify-between items-center card-royal p-4">
          <Link href="/dashboard" className="btn-outline-gold text-xs px-5 py-2">
            ← {lang==='hi'?'वापस':'Dashboard'}
          </Link>
          <div className="flex gap-3">
            <Link href="/matchmaking" className="btn-outline-gold text-xs px-5 py-2">
              💍 {lang==='hi'?'मिलान':'Matchmaking'}
            </Link>
            <Link href="/predictions" className="btn-gold text-xs px-5 py-2 font-semibold">
              💫 {lang==='hi'?'भविष्यवाणी':'Predictions'}
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
