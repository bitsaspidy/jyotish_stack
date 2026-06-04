'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import LifeReportPanel from '../components/LifeReportPanel';
import KundliInsightPanel from '../components/KundliInsightPanel';
import PlanetImpactPanel from '../components/PlanetImpactPanel';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import { predictionHref } from '../lib/kundliLinks';
import {
  categoryLabel,
  chartStyleLabel,
  currentPeriodText,
  detailText,
  dignityLabel,
  getYogaDoshaDetail,
  houseLabel,
  karanaName,
  localizeAstroText,
  nityaYogaName,
  planetName,
  portraitText,
  predictionSummaryLines,
  strengthLabel,
  t,
  untilText,
} from '../lib/astroI18n';
import {
  vargaDescription,
  vargaDomain,
  vargaKeyUses,
  vargaName,
  vargaSignifies,
} from '../lib/vargaI18n';

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

const ASSESSMENT_STYLE = {
  positive: { bg:'rgba(34,197,94,0.12)', color:'#22C55E', border:'rgba(34,197,94,0.28)' },
  mixed:    { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'rgba(245,158,11,0.28)' },
  negative: { bg:'rgba(239,68,68,0.12)', color:'#EF4444', border:'rgba(239,68,68,0.28)' },
};

const TIMING_STYLE = {
  favorable: { bg:'rgba(34,197,94,0.12)', color:'#22C55E', border:'rgba(34,197,94,0.25)' },
  moderate:  { bg:'rgba(96,165,250,0.10)', color:'#60A5FA', border:'rgba(96,165,250,0.24)' },
  caution:   { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'rgba(245,158,11,0.28)' },
};

function assessmentLabel(assessment, lang) {
  if (!assessment) return t(lang, 'Mixed', 'मिश्रित');
  return lang === 'hi' ? (assessment.label_hi || assessment.label_en) : (assessment.label_en || assessment.polarity || 'Mixed');
}

function timingToneLabel(tone, lang) {
  const labels = {
    favorable: ['Favorable', 'सहायक'],
    moderate: ['Moderate', 'मध्यम'],
    caution: ['Caution', 'सावधानी'],
  };
  const pair = labels[tone] || [tone || 'Moderate', tone || 'मध्यम'];
  return t(lang, pair[0], pair[1]);
}

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

function PlanetTokens({ names, lang = 'en' }) {
  if (!names.length) return null;
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:1, marginTop:'auto' }}>
      {names.map(p => (
        <span key={p} style={{ fontSize:7, color: PLANET_META[p]?.color || '#D4AF37', fontWeight:700, lineHeight:1 }}>
          {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
        </span>
      ))}
    </div>
  );
}

// ─── South Indian Chart ───────────────────────────────────────────────────────

function SouthIndianChart({ chart, lang }) {
  if (!chart) return <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, textAlign:'center', padding:24 }}>{t(lang, 'Calculating chart…', 'कुंडली बन रही है…')}</p>;

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
              <PlanetTokens names={planetsIn} lang={lang} />
            </ChartCell>
          );
        })}
      </div>
      <p style={{ color:'rgba(245,240,232,0.25)', fontSize:10, textAlign:'center', marginTop:8 }}>
        {t(lang, '↑ = Lagna · Signs fixed · Houses float', '↑ = लग्न · राशियां स्थिर · भाव चलते हैं')}
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
    return <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, textAlign:'center', padding:24 }}>{t(lang, 'Calculating chart…', 'कुंडली बन रही है…')}</p>;
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
            .map(p => (PLANET_META[p]?.icon || '') + planetName(p, lang).slice(0,2))
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
        {t(lang, 'L = Lagna (H1) · Houses fixed · Signs float · H1/4/7/10 = Kendra', 'L = लग्न (भाव 1) · भाव स्थिर · राशियां चलती हैं · भाव 1/4/7/10 = केंद्र')}
      </p>
    </div>
  );
}

// ─── Chart Style Toggle ───────────────────────────────────────────────────────

function ChartToggle({ style, onChange, lang }) {
  const opts = [
    { value:'south', label:t(lang, 'South Indian', 'दक्षिण भारतीय'), icon:'◈' },
    { value:'north', label:t(lang, 'North Indian', 'उत्तर भारतीय'), icon:'◇' },
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
  const { lang } = useLang();
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
        headers: { 'Accept-Language': lang === 'hi' ? 'hi' : 'en', 'Accept': 'application/json' },
      });
      const data = await res.json();
      setLocResults(data);
    } catch {
      toast.error(t(lang, 'Location search failed. Check internet connection.', 'स्थान खोज विफल रही। इंटरनेट कनेक्शन जांचें।'));
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
      toast.error(t(lang, 'Name, date and time are required.', 'नाम, जन्म तिथि और जन्म समय आवश्यक हैं।'));
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
      toast.success(t(lang, 'Birth details saved & chart recalculated!', 'जन्म विवरण सेव हो गया और कुंडली पुनः गणना हो गई!'));
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || t(lang, 'Save failed. Try again.', 'सेव नहीं हो पाया। फिर प्रयास करें।'));
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
          <h2 className="font-serif text-gold text-lg font-bold">✏️ {t(lang, 'Edit Birth Details', 'जन्म विवरण संपादित करें')}</h2>
          <button onClick={onClose}
            style={{ color:'rgba(245,240,232,0.4)', fontSize:20, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Name + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t(lang, 'Full Name *', 'पूरा नाम *')}</label>
              <input className={inputCls} value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'Gender *', 'लिंग *')}</label>
              <select className={inputCls} value={form.gender}
                onChange={e => set('gender', e.target.value)}>
                <option value="male">{t(lang, 'Male', 'पुरुष')}</option>
                <option value="female">{t(lang, 'Female', 'महिला')}</option>
                <option value="other">{t(lang, 'Other', 'अन्य')}</option>
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t(lang, 'Date of Birth *', 'जन्म तिथि *')}</label>
              <input type="date" className={inputCls} value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'Time of Birth *', 'जन्म समय *')}</label>
              <input type="time" className={inputCls} value={form.time_of_birth}
                onChange={e => set('time_of_birth', e.target.value)} required />
            </div>
          </div>

          {/* Location search */}
          <div ref={searchRef}>
            <label className={labelCls}>{t(lang, 'Search Place of Birth (OpenStreetMap — free)', 'जन्म स्थान खोजें (OpenStreetMap — मुफ्त)')}</label>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder={t(lang, 'e.g. Jodhpur, Rajasthan, India', 'जैसे: जोधपुर, राजस्थान, भारत')}
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
                {searching ? '⏳' : `🔍 ${t(lang, 'Search', 'खोजें')}`}
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
            <label className={labelCls}>{t(lang, 'Place of Birth (Label)', 'जन्म स्थान (लेबल)')}</label>
            <input className={inputCls} value={form.place_of_birth}
              onChange={e => set('place_of_birth', e.target.value)}
              placeholder={t(lang, 'City, State, Country', 'शहर, राज्य, देश')} />
          </div>

          {/* Lat / Lon / Timezone */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{t(lang, 'Latitude °N', 'अक्षांश °N')}</label>
              <input type="number" step="0.000001" className={inputCls}
                value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
                placeholder="26.2800" />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'Longitude °E', 'देशांतर °E')}</label>
              <input type="number" step="0.000001" className={inputCls}
                value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
                placeholder="73.0200" />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'UTC Offset (hrs)', 'UTC अंतर (घंटे)')}</label>
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
              <label className={labelCls}>{t(lang, 'Location Preview (OpenStreetMap)', 'स्थान पूर्वावलोकन (OpenStreetMap)')}</label>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', height: 200 }}>
                <iframe
                  src={mapSrc}
                  width="100%" height="200"
                  style={{ border: 'none', display: 'block' }}
                  loading="lazy"
                  title={t(lang, 'Birth place map', 'जन्म स्थान मानचित्र')}
                />
              </div>
              <p style={{ fontSize:10, color:'rgba(245,240,232,0.25)', marginTop:4 }}>
                📌 {lat.toFixed(4)}°N, {lon.toFixed(4)}°E ·
                <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color:'#D4AF37', marginLeft:4, textDecoration:'underline' }}>
                  {t(lang, 'Open full map ↗', 'पूरा मानचित्र खोलें ↗')}
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
              {t(lang, 'Cancel', 'रद्द करें')}
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding:'8px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
                background: saving ? 'rgba(212,175,55,0.2)' : 'linear-gradient(135deg,#D4AF37,#B8960C)',
                border:'none', color: saving ? '#D4AF37' : '#0B0D1A',
                opacity: saving ? 0.7 : 1,
              }}>
              {saving
                ? `⏳ ${t(lang, 'Saving & Recalculating…', 'सेव और पुनः गणना हो रही है…')}`
                : `💾 ${t(lang, 'Save & Recalculate Chart', 'सेव करें और कुंडली पुनः गणना करें')}`}
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
  const label = (en, hi) => t(lang, en, hi);

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
          <InfoRow label={label('Name', 'नाम')}       value={kundli.name} />
          <InfoRow label={label('Place', 'स्थान')}      value={kundli.place_of_birth} />
          <InfoRow label={label('Date', 'तिथि')}       value={dateFormatted} />
          <InfoRow label={label('Time', 'समय')}       value={fmt12(time)} />
          <InfoRow label={label('Latitude', 'अक्षांश')}   value={`${parseFloat(kundli.latitude).toFixed(2)}°`} />
          <InfoRow label={label('Longitude', 'देशांतर')}  value={`${parseFloat(kundli.longitude).toFixed(2)}°`} />
          <InfoRow label={label('Timezone', 'समय क्षेत्र')}   value={`GMT+${tz}`} />
          <InfoRow label={label('Sunrise', 'सूर्योदय')}    value={p?.sunrise || '—'} />
          <InfoRow label={label('Sunset', 'सूर्यास्त')}     value={p?.sunset  || '—'} />
          <InfoRow label={label('Ayanamsha', 'अयनांश')}  value={chart ? `${chart.meta.ayanamsa_dms} (Lahiri)` : '—'} />
        </div>
      )}

      {tab === 'ghat' && (
        <div>
          <InfoRow label={label('Month', 'मास')}      value={p ? (lang==='hi' ? p.masa.name_hi : p.masa.name) : '—'} />
          <InfoRow label={label('Tithi', 'तिथि')}      value={p ? (lang==='hi' ? p.tithi.display_hi : p.tithi.display_en) : '—'} />
          <InfoRow label={label('Day', 'वार')}        value={p ? (lang==='hi' ? p.vara.day_hi : p.vara.day_en) : '—'} />
          <InfoRow label={label('Nakshatra', 'नक्षत्र')}  value={chart ? (lang==='hi' ? chart.nakshatra.hi : chart.nakshatra.en) : '—'} />
          <InfoRow label={label('Yoga', 'योग')}       value={p ? nityaYogaName(p.yoga, lang) : '—'} />
          <InfoRow label={label('Karan', 'करण')}      value={p ? karanaName(p.karana, lang) : '—'} />
          <InfoRow label={label('Pahar', 'पहर')}      value={p?.pahar != null ? String(p.pahar) : '—'} />
          <InfoRow label={label('Moon Phase', 'चंद्र कला')} value={p?.moon_phase != null ? String(p.moon_phase) : '—'} />
        </div>
      )}

      {tab === 'astro' && ad && (
        <div>
          <InfoRow label={label('Ascendant', 'लग्न')}       value={lang==='hi' ? ad.ascendant_rashi_hi : ad.ascendant_rashi_en} />
          <InfoRow label={label('Ascendant Lord', 'लग्नेश')}  value={planetName(ad.ascendant_lord, lang)} />
          <InfoRow label={label('Varna', 'वर्ण')}           value={lang==='hi' ? ad.varna.name_hi : ad.varna.name} />
          <InfoRow label={label('Vashya', 'वश्य')}          value={lang==='hi' ? ad.vashya.name_hi : ad.vashya.name} />
          <InfoRow label={label('Yoni', 'योनि')}            value={ad.yoni.name} />
          <InfoRow label={label('Gan', 'गण')}             value={lang==='hi' ? ad.gana.name_hi : ad.gana.name} />
          <InfoRow label={label('Nadi', 'नाड़ी')}            value={lang==='hi' ? ad.nadi.name_hi : ad.nadi.name} />
          <InfoRow label={label('Sign Lord', 'राशि स्वामी')}       value={planetName(ad.moon_sign_lord, lang)} />
          <InfoRow label={label('Sign', 'राशि')}            value={lang==='hi' ? ad.moon_sign_hi : ad.moon_sign_en} />
          <InfoRow label={label('Nakshatra', 'नक्षत्र')}       value={lang==='hi' ? ad.moon_nakshatra_hi : ad.moon_nakshatra_en} />
          <InfoRow label={label('Nakshatra Lord', 'नक्षत्र स्वामी')}  value={planetName(ad.moon_nakshatra_lord, lang)} />
          <InfoRow label={label('Charan', 'चरण')}          value={String(ad.moon_pada)} />
          <InfoRow label={label('Yoga', 'योग')}            value={nityaYogaName(ad.yoga, lang)} />
          <InfoRow label={label('Karan', 'करण')}           value={karanaName(ad.karana, lang)} />
          <InfoRow label={label('Tithi', 'तिथि')}           value={lang==='hi' ? ad.tithi.display_hi : ad.tithi.display_en} />
          <InfoRow label={label('Yunja', 'युंजा')}           value={lang==='hi' ? ad.yunja.yunja_hi : ad.yunja.yunja} />
          <InfoRow label={label('Tatva', 'तत्व')}           value={lang==='hi' ? ad.tatva.hi : ad.tatva.en} />
          <InfoRow label={label('Name Alphabet', 'नाम अक्षर')}   value={ad.naam_akshar} />
          <InfoRow label={label('Paya', 'पाया')}            value={lang==='hi' ? ad.paya.paya_hi : ad.paya.paya} />
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

// ─── Life Portrait Panel ─────────────────────────────────────────────────────
// Shows who the person is: Lagna portrait, Moon portrait, nakshatra soul,
// and current dasha period summary — all in narrative paragraph form.

const PORTRAIT_TABS = [
  { key: 'you',    label: 'Who You Are',       label_hi: 'आप कौन हैं'       },
  { key: 'period', label: 'Current Period',    label_hi: 'वर्तमान दशा'      },
];

function LifePortraitPanel({ chart, lang }) {
  const [tab, setTab] = useState('you');
  const portrait = chart?.predictions?.portrait;
  const period   = chart?.predictions?.current_period;
  const dasha    = chart?.dasha?.find((d) => d.is_current) || chart?.dasha?.[0];
  const antar    = dasha?.antardasha?.find((d) => d.is_current) || dasha?.antardasha?.[0];

  if (!portrait && !period) return null;

  const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}
      className="card-royal p-5">
      {/* Header */}
      <h2 className="font-serif text-gold text-sm font-semibold mb-3">
        🪐 {lang === 'hi' ? 'जीवन चित्रण' : 'Life Portrait'}
      </h2>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {PORTRAIT_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding:'4px 12px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === t.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === t.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {lang === 'hi' ? t.label_hi : t.label}
          </button>
        ))}
      </div>

      {/* Who You Are */}
      {tab === 'you' && portrait && (
        <div className="space-y-4">
          <div>
            <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>
              ✦ {lang==='hi' ? 'आपकी लग्न — बाहरी व्यक्तित्व' : 'Your Ascendant — Outer Personality'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.82)', fontSize:12.5, lineHeight:1.8 }}>
              {portraitText(portrait, 'lagna', chart, lang)}
            </p>
          </div>
          <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
            <p style={{ color:'#94A3B8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>
              ☽ {lang==='hi' ? 'आपकी चन्द्र राशि — आंतरिक भावनाएं' : 'Your Moon Sign — Inner Emotional World'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12.5, lineHeight:1.8 }}>
              {portraitText(portrait, 'moon', chart, lang)}
            </p>
          </div>
          <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
            <p style={{ color:'#A78BFA', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>
              ✨ {lang==='hi' ? 'आपका नक्षत्र — आत्मा की प्रकृति' : 'Your Nakshatra — Soul Nature'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12.5, lineHeight:1.8 }}>
              {portraitText(portrait, 'nakshatra', chart, lang)}
            </p>
          </div>
        </div>
      )}

      {/* Current Period */}
      {tab === 'period' && (
        <div className="space-y-4">
          {/* Dasha badges */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <div style={{
              padding:'6px 14px', borderRadius:20,
              background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.35)',
              textAlign:'center',
            }}>
              <p style={{ color:'rgba(245,240,232,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em' }}>{t(lang, 'Mahadasha', 'महादशा')}</p>
              <p style={{ color:'#D4AF37', fontSize:15, fontWeight:700, fontFamily:'Georgia,serif', marginTop:2 }}>{planetName(dasha?.lord, lang) || '—'}</p>
              <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, marginTop:2 }}>{untilText(fmtDate(dasha?.end), lang)}</p>
            </div>
            <div style={{
              padding:'6px 14px', borderRadius:20,
              background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.3)',
              textAlign:'center',
            }}>
              <p style={{ color:'rgba(245,240,232,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em' }}>{t(lang, 'Antardasha', 'अंतर्दशा')}</p>
              <p style={{ color:'#A78BFA', fontSize:15, fontWeight:700, fontFamily:'Georgia,serif', marginTop:2 }}>{planetName(antar?.lord, lang) || '—'}</p>
              <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, marginTop:2 }}>{untilText(fmtDate(antar?.end), lang)}</p>
            </div>
          </div>

          {/* Combined meaning */}
          {period?.combined_en && (
            <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
              <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>
                📖 {lang==='hi' ? 'इस दशा का अर्थ' : 'What This Period Means'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.8)', fontSize:12.5, lineHeight:1.85 }}>
                {currentPeriodText(period, chart, lang)}
              </p>
            </div>
          )}

          {/* Mahadasha nature */}
          {period?.mahadasha?.nature && (
            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 12px' }}>
              <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, marginBottom:2 }}>
                {lang==='hi' ? 'महादशा की प्रकृति' : 'Mahadasha Nature'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12 }}>
                {lang === 'hi'
                  ? `${planetName(period.mahadasha.lord, 'hi')} की महादशा उसके कारकत्व, भाव स्थिति और बल के अनुसार जीवन की मुख्य दिशा को सक्रिय करती है।`
                  : period.mahadasha.nature}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Yogas & Doshas Panel ────────────────────────────────────────────────────

const YOGA_STRENGTH_STYLE = {
  strong:   { bg:'rgba(34,197,94,0.12)',  color:'#22C55E', label:'Strong' },
  moderate: { bg:'rgba(245,158,11,0.10)', color:'#F59E0B', label:'Moderate' },
  weak:     { bg:'rgba(239,68,68,0.10)',  color:'#EF4444', label:'Weak' },
};
const DOSHA_SEV_STYLE = {
  strong:   { bg:'rgba(239,68,68,0.12)',  color:'#EF4444', label:'Strong' },
  moderate: { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', label:'Moderate' },
  mild:     { bg:'rgba(96,165,250,0.10)', color:'#60A5FA', label:'Mild' },
};
const CATEGORY_ICONS = {
  power:'👑', wealth:'💰', intellect:'🧠', wisdom:'📿', victory:'⚔️',
  karmic:'🔮', vish:'☠️', grahan:'🌑', luminary:'☀️', general:'⚖️',
};

function YogasAndDoshasPanel({ chart, lang }) {
  const [tab, setTab] = useState('yogas');
  const yd = chart?.yogas_doshas;
  if (!yd) return null;

  const tabs = [
    { key:'yogaDasha', label:t(lang, 'Yoga + Dasha', 'योग + दशा') },
    { key:'timing', label:t(lang, 'Event Timing', 'घटना समय') },
    { key:'yogas',  label: lang==='hi' ? `योग (${yd.yoga_count})`  : `Yogas (${yd.yoga_count})`  },
    { key:'doshas', label: lang==='hi' ? `दोष (${yd.dosha_count})` : `Doshas (${yd.dosha_count})` },
  ];

  const hasMajorDosha = yd.doshas.some(d => d.severity === 'strong');
  const yogaDasha = chart?.reports?.yoga_dasha_report || {};
  const eventTiming = chart?.reports?.event_timing || {};
  const renderEntry = (entry, type, index) => {
    const isDosha = type === 'dosha';
    const st = isDosha
      ? (DOSHA_SEV_STYLE[entry.severity] || DOSHA_SEV_STYLE.moderate)
      : (YOGA_STRENGTH_STYLE[entry.strength] || YOGA_STRENGTH_STYLE.moderate);
    const detail = getYogaDoshaDetail(entry, type);
    const name = lang === 'hi' ? entry.name_hi : entry.name;
    const secondaryName = lang === 'hi' ? entry.name : entry.name_hi;
    const statusLabel = entry.is_cancelled
      ? t(lang, 'Relieved / Cancelled', 'राहत / रद्द')
      : entry.cancellation_status === 'active_with_relief'
      ? t(lang, 'Active with Relief', 'राहत के साथ सक्रिय')
      : entry.cancellation_status === 'modified'
      ? t(lang, 'Modified Result', 'परिवर्तित फल')
      : t(lang, 'Active', 'सक्रिय');

    return (
      <div
        key={`${entry.name}-${index}`}
        style={{
          border: `1px solid ${isDosha ? st.color + '33' : 'rgba(212,175,55,0.14)'}`,
          borderRadius: 8,
          padding: 13,
          background: isDosha ? `${st.color}07` : 'rgba(17,20,40,0.55)',
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-ivory/90 text-xs font-semibold font-devanagari">{name}</span>
              <span style={{
                color: '#D4AF37',
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.18)',
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: 9,
                fontWeight: 700,
              }}>
                {CATEGORY_ICONS[detail.category] || '✦'} {categoryLabel(detail.category, lang)}
              </span>
            </div>
            <p className="text-ivory/35 text-[10px] mt-0.5">{secondaryName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span style={{ background: st.bg, color: st.color, borderRadius:10, padding:'2px 8px', fontSize:9, fontWeight:700, whiteSpace:'nowrap' }}>
              {strengthLabel(isDosha ? entry.severity : entry.strength, lang)}
            </span>
            <span style={{ background: entry.is_cancelled ? 'rgba(34,197,94,0.13)' : 'rgba(212,175,55,0.08)', color: entry.is_cancelled ? '#22C55E' : '#D4AF37', borderRadius:10, padding:'2px 8px', fontSize:8.5, fontWeight:700, whiteSpace:'nowrap' }}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div style={{ display:'grid', gap:9 }}>
          <div>
            <p style={{ color:'#D4AF37', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:3 }}>
              {t(lang, 'Detected in this chart', 'इस कुंडली में कारण')}
            </p>
            <p className="text-ivory/62 text-[10.5px] leading-relaxed font-devanagari">
              {localizeAstroText(lang === 'hi' ? entry.trigger_hi : entry.trigger_en, lang)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.08)', borderRadius:6, padding:'8px 9px' }}>
              <p style={{ color:'rgba(245,240,232,0.38)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                {t(lang, 'Formation Rule', 'बनने का नियम')}
              </p>
              <p className="text-ivory/65 text-[10px] leading-relaxed font-devanagari">
                {detailText(detail, 'formation', lang)}
              </p>
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.08)', borderRadius:6, padding:'8px 9px' }}>
              <p style={{ color:'rgba(245,240,232,0.38)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                {t(lang, isDosha ? 'Likely Pressure' : 'Likely Result', isDosha ? 'संभावित दबाव' : 'संभावित फल')}
              </p>
              <p className="text-ivory/65 text-[10px] leading-relaxed font-devanagari">
                {detailText(detail, 'result', lang)}
              </p>
            </div>
          </div>

          <div style={{ background: isDosha ? `${st.color}0A` : 'rgba(34,197,94,0.04)', border:`1px solid ${isDosha ? st.color + '22' : 'rgba(34,197,94,0.14)'}`, borderRadius:6, padding:'8px 9px' }}>
            <p style={{ color: isDosha ? st.color : '#22C55E', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
              {t(lang, isDosha ? 'Balancing Guidance' : 'How to Use It', isDosha ? 'संतुलन मार्गदर्शन' : 'इसे कैसे उपयोग करें')}
            </p>
            <p className="text-ivory/65 text-[10px] leading-relaxed font-devanagari">
              {detailText(detail, 'guidance', lang)}
            </p>
          </div>

          {(entry.relief_en || entry.relief_hi) && (
            <div style={{ background: entry.is_cancelled ? 'rgba(34,197,94,0.05)' : 'rgba(212,175,55,0.045)', border:`1px solid ${entry.is_cancelled ? 'rgba(34,197,94,0.16)' : 'rgba(212,175,55,0.13)'}`, borderRadius:6, padding:'8px 9px' }}>
              <p style={{ color: entry.is_cancelled ? '#22C55E' : '#D4AF37', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                {t(lang, 'Cancellation / Relief Check', 'रद्द / राहत जांच')}
              </p>
              <p className="text-ivory/68 text-[10px] leading-relaxed font-devanagari">
                {lang === 'hi' ? entry.relief_hi : entry.relief_en}
              </p>
            </div>
          )}
        </div>

        {entry.planets_involved?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/6">
            <span className="text-ivory/30 text-[9px] mr-1">{t(lang, 'Planets:', 'ग्रह:')}</span>
            {entry.planets_involved.map(pn => (
              <span key={pn} style={{ fontSize:9, color: PLANET_META[pn]?.color || st.color, background:isDosha ? `${st.color}0F` : 'rgba(212,175,55,0.07)', borderRadius:8, padding:'1px 6px', fontWeight:700 }}>
                {PLANET_META[pn]?.icon} {planetName(pn, lang)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
      className="card-royal p-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-gold text-sm font-semibold">
          ✨ {lang==='hi' ? 'योग एवं दोष' : 'Yogas & Doshas'}
        </h2>
        <div className="flex gap-2 text-[9px]">
          <span style={{ color:'#22C55E' }}>✦ {yd.yoga_count} {lang==='hi'?'योग':'yoga'}</span>
          <span style={{ color: hasMajorDosha ? '#EF4444' : '#F59E0B' }}>
            ⚠ {yd.dosha_count} {lang==='hi'?'दोष':'dosha'}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding:'4px 14px', borderRadius:16, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === t.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === t.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Yoga + Dasha tab */}
      {tab === 'yogaDasha' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <p className="text-ivory/78 text-sm leading-relaxed font-devanagari">
              {lang === 'hi'
                ? (yogaDasha.summary_hi || 'वर्तमान दशा से योग और दोष सक्रियता उपलब्ध नहीं है। कुंडली को पुनः गणना करें।')
                : (yogaDasha.summary_en || 'Yoga and dosha activation by current dasha is not available yet. Recalculate the chart.')}
            </p>
            {(yogaDasha.guidance_en || yogaDasha.guidance_hi) && (
              <p className="text-ivory/58 text-xs leading-relaxed mt-2 font-devanagari">
                {lang === 'hi' ? yogaDasha.guidance_hi : yogaDasha.guidance_en}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              { key:'yogas', title:t(lang, 'Dasha Activated Yogas', 'दशा सक्रिय योग'), rows:yogaDasha.yogas || [], empty:t(lang, 'No yoga is directly activated by current dasha.', 'वर्तमान दशा से कोई योग सीधे सक्रिय नहीं है।') },
              { key:'doshas', title:t(lang, 'Dasha Activated Doshas', 'दशा सक्रिय दोष'), rows:yogaDasha.doshas || [], empty:t(lang, 'No dosha is directly activated by current dasha.', 'वर्तमान दशा से कोई दोष सीधे सक्रिय नहीं है।') },
            ].map((group) => (
              <div key={group.key} className="rounded border border-gold/10 bg-white/3 p-4">
                <p className="text-gold/85 text-xs font-semibold mb-3 font-devanagari">{group.title}</p>
                {group.rows.length === 0 ? (
                  <p className="text-ivory/50 text-xs font-devanagari">{group.empty}</p>
                ) : (
                  <div className="space-y-2">
                    {group.rows.slice(0, 8).map((item, index) => (
                      <div key={`${group.key}-${item.name}-${index}`} className="rounded border border-white/7 bg-[#0f1128]/60 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-ivory/82 text-xs font-semibold font-devanagari">{lang === 'hi' ? item.name_hi : item.name}</p>
                            <p className="text-ivory/52 text-[10px] mt-1 font-devanagari">
                              {item.activated_by?.length
                                ? `${t(lang, 'Activated by', 'सक्रिय ग्रह')}: ${item.activated_by.map((p) => planetName(p, lang)).join(', ')}`
                                : t(lang, 'Background natal promise', 'जन्म कुंडली का पृष्ठभूमि संकेत')}
                            </p>
                          </div>
                          <span className={`rounded px-2 py-1 text-[9px] font-semibold shrink-0 ${item.active ? 'bg-emerald-400/12 text-emerald-300' : 'bg-white/5 text-ivory/62'}`}>
                            {item.active ? t(lang, 'Active', 'सक्रिय') : t(lang, 'Background', 'पृष्ठभूमि')}
                          </span>
                        </div>
                        <p className="text-ivory/66 text-xs leading-relaxed mt-2 font-devanagari">
                          {lang === 'hi' ? item.timing_hi : item.timing_en}
                        </p>
                        {(item.relief_en || item.relief_hi) && (
                          <p className="text-gold/72 text-[10px] leading-relaxed mt-2 font-devanagari">
                            {lang === 'hi' ? item.relief_hi : item.relief_en}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Timing tab */}
      {tab === 'timing' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <p className="text-ivory/72 text-xs leading-relaxed font-devanagari">
              {lang === 'hi'
                ? (eventTiming.methodology_hi || 'घटना समय रिपोर्ट उपलब्ध नहीं है। कुंडली को पुनः गणना करें।')
                : (eventTiming.methodology_en || 'Event timing report is not available yet. Recalculate the chart.')}
            </p>
            <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
              <span className="rounded bg-gold/10 text-gold/75 px-2 py-1">
                {t(lang, 'As of', 'तिथि')}: {eventTiming.as_of || '—'}
              </span>
              {eventTiming.current_window?.antardasha?.end && (
                <span className="rounded bg-white/5 text-ivory/62 px-2 py-1">
                  {t(lang, 'Current Antar ends', 'वर्तमान अंतर समाप्त')}: {eventTiming.current_window.antardasha.end}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(eventTiming.windows || []).map((window) => {
              const toneStyle = TIMING_STYLE[window.tone] || TIMING_STYLE.moderate;
              const triggers = lang === 'hi' ? window.triggers_hi : window.triggers_en;
              return (
                <div key={window.key} className="rounded border border-gold/10 bg-white/3 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-gold/85 text-xs font-semibold font-devanagari">
                      {lang === 'hi' ? window.title_hi : window.title_en}
                    </p>
                    <span className="rounded px-2 py-1 text-[9px] font-semibold shrink-0" style={{ background:toneStyle.bg, color:toneStyle.color, border:`1px solid ${toneStyle.border}` }}>
                      {timingToneLabel(window.tone, lang)}
                    </span>
                  </div>
                  <p className="text-ivory/40 text-[10px] mb-2">
                    {window.date_from || '—'} → {window.date_to || '—'} · {t(lang, 'Score', 'स्कोर')}: {window.score}
                  </p>
                  <p className="text-ivory/70 text-xs leading-relaxed font-devanagari">
                    {lang === 'hi' ? window.prediction_hi : window.prediction_en}
                  </p>
                  {!!triggers?.length && (
                    <div className="mt-3 space-y-1">
                      {triggers.slice(0, 4).map((trigger, index) => (
                        <p key={index} className="text-ivory/50 text-[10px] leading-relaxed font-devanagari">{trigger}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {!(eventTiming.windows || []).length && (
              <p className="text-ivory/50 text-xs font-devanagari">
                {t(lang, 'No timing windows available yet.', 'अभी कोई घटना समय विंडो उपलब्ध नहीं है।')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Yogas tab */}
      {tab === 'yogas' && (
        yd.yogas.length === 0
          ? <p className="text-ivory/25 text-xs text-center py-6">{lang==='hi'?'कोई प्रमुख योग नहीं मिला।':'No major yogas detected in this chart.'}</p>
          : <div className="space-y-3">
              {yd.yogas.map((y, i) => renderEntry(y, 'yoga', i))}
            </div>
      )}

      {/* Doshas tab */}
      {tab === 'doshas' && (
        yd.doshas.length === 0
          ? <p className="text-ivory/25 text-xs text-center py-6">{lang==='hi'?'कोई प्रमुख दोष नहीं मिला।':'No major doshas detected in this chart.'}</p>
          : <div className="space-y-3">
              {yd.doshas.map((d, i) => renderEntry(d, 'dosha', i))}
            </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function DetailedReportsPanel({ reports, lang, onRecalculate, recalcing }) {
  const [tab, setTab] = useState('general');
  const tabs = [
    { key:'general', label:t(lang, 'General Report', 'सामान्य रिपोर्ट') },
    { key:'planets', label:t(lang, 'Planet Report', 'ग्रह रिपोर्ट') },
    { key:'yogaDasha', label:t(lang, 'Yoga + Dasha', 'योग + दशा') },
    { key:'timing', label:t(lang, 'Event Timing', 'घटना समय') },
    { key:'matrix', label:t(lang, 'Varga Matrix', 'वर्ग तालिका') },
    { key:'details', label:t(lang, 'Planet Details', 'ग्रह विवरण') },
    { key:'cusps', label:t(lang, 'Cusps', 'कस्प') },
  ];

  if (!reports) {
    return (
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className="card-royal p-5 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-serif text-gold text-sm font-semibold">
              {t(lang, 'Graha Rashi Bhav Detailed Report', 'ग्रह राशि भाव विस्तृत रिपोर्ट')}
            </h2>
            <p className="text-ivory/45 text-xs mt-1">
              {t(lang, 'This saved Kundli needs recalculation to generate the new report tables.', 'नई रिपोर्ट तालिकाएं बनाने के लिए इस कुंडली की पुनः गणना जरूरी है।')}
            </p>
          </div>
          <button onClick={onRecalculate} disabled={recalcing} className="btn-outline-gold text-xs px-4 py-2">
            {recalcing ? t(lang, 'Recalculating...', 'पुनः गणना हो रही है...') : t(lang, 'Recalculate', 'पुनः गणना')}
          </button>
        </div>
      </motion.div>
    );
  }

  const matrix = reports.varga_matrix || {};
  const planetOrder = matrix.planet_order || [];
  const planetRows = reports.planet_details || [];
  const cuspRows = reports.cusp_details || [];
  const planetReport = reports.planet_report || [];
  const general = reports.general_report || {};
  const yogaDasha = reports.yoga_dasha_report || {};
  const eventTiming = reports.event_timing || {};
  const cellStyle = 'py-2 pr-3 border-b border-white/5 whitespace-nowrap';
  const headStyle = 'text-left py-2 pr-3 border-b border-gold/15 text-ivory/35 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap';

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      className="card-royal p-5 mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            {t(lang, 'Graha Rashi Bhav Detailed Report', 'ग्रह राशि भाव विस्तृत रिपोर्ट')}
          </h2>
          <p className="text-ivory/35 text-[10px] mt-1">
            {t(
              lang,
              'General narrative, planet interpretations, divisional matrix, KP-style sub lords, and equal-house cusps.',
              'सामान्य फल, ग्रह व्याख्या, वर्ग तालिका, KP शैली सब-लॉर्ड और समान-भाव कस्प।'
            )}
          </p>
        </div>
        <span className="rounded border border-gold/15 px-2 py-1 text-gold/65 text-[10px]">
          {t(lang, 'Graha + Rashi + Bhav', 'ग्रह + राशि + भाव')}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-gold/10">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className="shrink-0"
            style={{
              padding:'7px 12px',
              borderRadius:8,
              border:`1px solid ${tab === item.key ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.14)'}`,
              background: tab === item.key ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.02)',
              color: tab === item.key ? '#D4AF37' : 'rgba(245,240,232,0.55)',
              fontSize:11,
              fontWeight:700,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div>
          <p className="text-ivory/75 text-sm leading-relaxed font-devanagari mb-4">
            {lang === 'hi' ? general.summary_hi : general.summary_en}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(general.sections || []).map((section) => (
              <div key={section.key} className="rounded border border-gold/10 bg-[#111428]/55 p-4">
                <p className="text-gold/85 text-xs font-semibold mb-2 font-devanagari">
                  {lang === 'hi' ? section.title_hi : section.title_en}
                </p>
                <p className="text-ivory/60 text-xs leading-relaxed font-devanagari">
                  {lang === 'hi' ? section.body_hi : section.body_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'planets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {planetReport.map((row) => {
            const assessment = row.assessment || {};
            const badgeStyle = ASSESSMENT_STYLE[assessment.polarity] || ASSESSMENT_STYLE.mixed;
            const reasons = lang === 'hi' ? assessment.reasons_hi : assessment.reasons_en;
            return (
            <div key={row.planet} className="rounded border border-gold/10 bg-white/3 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-gold/85 text-xs font-semibold font-devanagari">
                  {PLANET_META[row.planet]?.icon} {lang === 'hi' ? row.title_hi : row.title_en}
                </p>
                <span
                  className="rounded px-2 py-1 text-[9px] font-semibold shrink-0"
                  style={{ background:badgeStyle.bg, color:badgeStyle.color, border:`1px solid ${badgeStyle.border}` }}
                >
                  {assessmentLabel(assessment, lang)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="rounded bg-gold/10 text-gold/75 px-2 py-1 text-[9px]">{houseLabel(row.house, lang)}</span>
                <span className="rounded bg-white/5 text-ivory/45 px-2 py-1 text-[9px]">
                  {t(lang, 'Score', 'स्कोर')}: {assessment.score ?? '—'}
                </span>
              </div>
              <p className="text-ivory/60 text-xs leading-relaxed font-devanagari">
                {lang === 'hi' ? row.summary_hi : row.summary_en}
              </p>
              {!!reasons?.length && (
                <div className="mt-3 space-y-1">
                  {reasons.slice(0, 3).map((reason, index) => (
                    <p key={index} className="text-ivory/42 text-[10px] leading-relaxed font-devanagari">
                      {reason}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="rounded bg-gold/10 text-gold/75 px-2 py-1 text-[9px]">{lang === 'hi' ? row.rashi_hi : row.rashi_en}</span>
                <span className="rounded bg-white/5 text-ivory/45 px-2 py-1 text-[9px]">{dignityLabel(row.dignity, lang)}</span>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {tab === 'yogaDasha' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <p className="text-ivory/75 text-sm leading-relaxed font-devanagari">
              {lang === 'hi' ? yogaDasha.summary_hi : yogaDasha.summary_en}
            </p>
            <p className="text-ivory/45 text-xs leading-relaxed mt-2 font-devanagari">
              {lang === 'hi' ? yogaDasha.guidance_hi : yogaDasha.guidance_en}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { key:'yogas', title:t(lang, 'Dasha Activated Yogas', 'दशा सक्रिय योग'), rows:yogaDasha.yogas || [], empty:t(lang, 'No yogas detected.', 'कोई योग नहीं मिला।') },
              { key:'doshas', title:t(lang, 'Dasha Activated Doshas', 'दशा सक्रिय दोष'), rows:yogaDasha.doshas || [], empty:t(lang, 'No doshas detected.', 'कोई दोष नहीं मिला।') },
            ].map((group) => (
              <div key={group.key} className="rounded border border-gold/10 bg-white/3 p-4">
                <p className="text-gold/85 text-xs font-semibold mb-3 font-devanagari">{group.title}</p>
                {group.rows.length === 0 ? (
                  <p className="text-ivory/30 text-xs">{group.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {group.rows.slice(0, 6).map((item, index) => {
                      const activeStyle = item.active ? ASSESSMENT_STYLE.positive : ASSESSMENT_STYLE.mixed;
                      return (
                        <div key={`${group.key}-${item.name}-${index}`} className="rounded border border-white/5 bg-[#0f1128]/55 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-ivory/75 text-xs font-semibold font-devanagari">
                                {lang === 'hi' ? item.name_hi : item.name}
                              </p>
                              <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
                                {item.activated_by?.length
                                  ? `${t(lang, 'Activated by', 'सक्रिय ग्रह')}: ${item.activated_by.map((p) => planetName(p, lang)).join(', ')}`
                                  : t(lang, 'Background natal promise', 'जन्म कुंडली का पृष्ठभूमि संकेत')}
                              </p>
                            </div>
                            <span
                              className="rounded px-2 py-1 text-[9px] font-semibold shrink-0"
                              style={{ background:activeStyle.bg, color:activeStyle.color, border:`1px solid ${activeStyle.border}` }}
                            >
                              {item.active ? t(lang, 'Active', 'सक्रिय') : t(lang, 'Background', 'पृष्ठभूमि')}
                            </span>
                          </div>
                          <p className="text-ivory/55 text-xs leading-relaxed mt-2 font-devanagari">
                            {lang === 'hi' ? item.timing_hi : item.timing_en}
                          </p>
                          {(lang === 'hi' ? item.trigger_hi : item.trigger_en) && (
                            <p className="text-ivory/32 text-[10px] leading-relaxed mt-2 font-devanagari">
                              {lang === 'hi' ? item.trigger_hi : item.trigger_en}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'timing' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-ivory/70 text-xs leading-relaxed font-devanagari">
                {lang === 'hi' ? eventTiming.methodology_hi : eventTiming.methodology_en}
              </p>
              <span className="rounded border border-gold/15 px-2 py-1 text-gold/70 text-[10px] shrink-0">
                {t(lang, 'As of', 'तिथि')}: {eventTiming.as_of || '—'}
              </span>
            </div>
            {eventTiming.current_window && (
              <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
                <span className="rounded bg-gold/10 text-gold/75 px-2 py-1">
                  {t(lang, 'Maha', 'महा')}: {planetName(eventTiming.current_window.mahadasha?.lord, lang)} {eventTiming.current_window.mahadasha?.end || ''}
                </span>
                <span className="rounded bg-white/5 text-ivory/55 px-2 py-1">
                  {t(lang, 'Antar', 'अंतर')}: {planetName(eventTiming.current_window.antardasha?.lord, lang)} {eventTiming.current_window.antardasha?.end || ''}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(eventTiming.windows || []).map((window) => {
              const toneStyle = TIMING_STYLE[window.tone] || TIMING_STYLE.moderate;
              const triggers = lang === 'hi' ? window.triggers_hi : window.triggers_en;
              return (
                <div key={window.key} className="rounded border border-gold/10 bg-white/3 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-gold/85 text-xs font-semibold font-devanagari">
                      {lang === 'hi' ? window.title_hi : window.title_en}
                    </p>
                    <span
                      className="rounded px-2 py-1 text-[9px] font-semibold shrink-0"
                      style={{ background:toneStyle.bg, color:toneStyle.color, border:`1px solid ${toneStyle.border}` }}
                    >
                      {timingToneLabel(window.tone, lang)}
                    </span>
                  </div>
                  <p className="text-ivory/35 text-[10px] mb-2">
                    {window.date_from || '—'} → {window.date_to || '—'} · {t(lang, 'Score', 'स्कोर')}: {window.score}
                  </p>
                  <p className="text-ivory/62 text-xs leading-relaxed font-devanagari">
                    {lang === 'hi' ? window.prediction_hi : window.prediction_en}
                  </p>
                  {!!triggers?.length && (
                    <div className="mt-3 space-y-1">
                      {triggers.slice(0, 4).map((trigger, index) => (
                        <p key={index} className="text-ivory/38 text-[10px] leading-relaxed font-devanagari">
                          {trigger}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!!eventTiming.upcoming_antardashas?.length && (
            <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
              <p className="text-gold/85 text-xs font-semibold mb-3 font-devanagari">
                {t(lang, 'Upcoming Antardasha Signals — Yoga + Dasha Forecast', 'आने वाली अंतर्दशा — योग + दशा पूर्वानुमान')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {eventTiming.upcoming_antardashas.map((period) => {
                  const pm         = PLANET_META[period.lord] || {};
                  const activeYogas  = (period.activated_yogas  || []).filter((y) => !y.is_cancelled);
                  const activeDoshas = period.activated_doshas  || [];
                  const topAreas     = (period.life_area_windows || []).filter((a) => a.score > 0).slice(0, 3);
                  return (
                    <div key={`${period.lord}-${period.start}`}
                         className="rounded border bg-white/3 p-3 flex flex-col gap-2.5"
                         style={{ borderColor: `${pm.color || '#D4AF37'}22` }}>

                      {/* Planet header */}
                      <div className="flex items-center gap-2 pb-1.5"
                           style={{ borderBottom: `1px solid ${pm.color || '#D4AF37'}18` }}>
                        <span style={{ color: pm.color || '#D4AF37', fontSize: '1.1rem', lineHeight: 1 }}>
                          {pm.icon || '◎'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold font-devanagari leading-tight"
                             style={{ color: pm.color || '#D4AF37' }}>
                            {planetName(period.lord, lang)} {t(lang, 'Antardasha', 'अंतर्दशा')}
                          </p>
                          <p className="text-ivory/30 text-[10px] leading-tight mt-0.5">
                            {period.start} → {period.end}
                          </p>
                        </div>
                      </div>

                      {/* Focus / nature paragraph */}
                      <p className="text-ivory/55 text-[10px] leading-relaxed font-devanagari">
                        {lang === 'hi' ? period.focus_hi : period.focus_en}
                      </p>

                      {/* Life area predictions */}
                      {topAreas.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-ivory/30 uppercase tracking-wide">
                            {t(lang, 'Life Areas', 'जीवन क्षेत्र')}
                          </p>
                          {topAreas.map((area) => {
                            const ts = TIMING_STYLE[area.tone] || TIMING_STYLE.moderate;
                            return (
                              <div key={area.key}
                                   className="flex items-center gap-1.5 rounded px-2 py-1"
                                   style={{ background: ts.bg, border: `1px solid ${ts.border}` }}>
                                <span className="text-[9px] font-semibold font-devanagari flex-1"
                                      style={{ color: ts.color }}>
                                  {lang === 'hi' ? area.title_hi : area.title_en}
                                </span>
                                <span className="text-[9px] font-bold flex-shrink-0" style={{ color: ts.color }}>
                                  {area.tone === 'favorable' ? '↑' : area.tone === 'caution' ? '⚠' : '~'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Activated Yogas */}
                      {activeYogas.length > 0 && (
                        <div>
                          <p className="text-[9px] text-gold/45 mb-1 font-devanagari">
                            {t(lang, 'Yogas That Activate', 'सक्रिय होने वाले योग')}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {activeYogas.map((y) => (
                              <span key={y.name}
                                    className="text-[9px] px-1.5 py-0.5 rounded font-devanagari"
                                    style={{ background: 'rgba(34,197,94,0.10)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.22)' }}>
                                {lang === 'hi' ? y.name_hi : y.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activated Doshas */}
                      {activeDoshas.length > 0 && (
                        <div>
                          <p className="text-[9px] text-saffron/45 mb-1 font-devanagari">
                            {t(lang, 'Doshas to Watch', 'ध्यान देने योग्य दोष')}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {activeDoshas.map((d) => (
                              <span key={d.name}
                                    className="text-[9px] px-1.5 py-0.5 rounded font-devanagari"
                                    style={{ background: 'rgba(245,158,11,0.10)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.22)' }}>
                                {lang === 'hi' ? d.name_hi : d.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key themes */}
                      {(period.key_themes || []).length > 0 && (
                        <div>
                          <p className="text-[9px] text-ivory/30 mb-1">
                            {t(lang, 'Key Themes', 'मुख्य विषय')}
                          </p>
                          <ul className="space-y-0.5">
                            {period.key_themes.map((theme) => (
                              <li key={theme} className="text-[9px] text-ivory/50 flex items-start gap-1.5 font-devanagari">
                                <span className="text-gold/50 mt-0.5 flex-shrink-0">·</span>
                                <span>{theme}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Cautions */}
                      {(period.cautions || []).length > 0 && (
                        <div>
                          <p className="text-[9px] text-crimson/50 mb-1">
                            {t(lang, 'Cautions', 'सावधानियां')}
                          </p>
                          <ul className="space-y-0.5">
                            {period.cautions.map((c) => (
                              <li key={c} className="text-[9px] text-ivory/40 flex items-start gap-1.5 font-devanagari">
                                <span className="text-saffron/50 mt-0.5 flex-shrink-0">⚠</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'matrix' && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className={headStyle}>{t(lang, 'Chart', 'चार्ट')}</th>
                  {planetOrder.map((planet) => (
                    <th key={planet} className={headStyle}>{lang === 'hi' ? planetName(planet, lang) : planet.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(matrix.rows || []).map((row) => (
                  <tr key={row.key} className="hover:bg-white/3">
                    <td className={`${cellStyle} text-gold/80 font-semibold font-devanagari`}>
                      {lang === 'hi' ? row.label_hi : row.label_en}
                    </td>
                    {planetOrder.map((planet) => (
                      <td key={`${row.key}-${planet}`} className={`${cellStyle} text-ivory/65 font-mono`}>
                        {row.values?.[planet] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-ivory/30 text-[10px] mt-3">
            {t(lang, 'Values are rashi numbers. Chalit uses equal-house bhav sign from Lagna degree.', 'मान राशि संख्या है। चलित में लग्न अंश से समान-भाव राशि ली गई है।')}
          </p>
        </div>
      )}

      {tab === 'details' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {[
                  t(lang, 'Planet', 'ग्रह'),
                  t(lang, 'Degree', 'अंश'),
                  t(lang, 'Retro', 'वक्री'),
                  t(lang, 'Normalized Degree', 'राशि अंश'),
                  t(lang, 'House', 'भाव'),
                  t(lang, 'Zodiac Sign', 'राशि'),
                  t(lang, 'Sign Lord', 'राशि स्वामी'),
                  t(lang, 'Nakshatra', 'नक्षत्र'),
                  t(lang, 'Nakshatra Lord', 'नक्षत्र स्वामी'),
                  t(lang, 'Charan', 'चरण'),
                  t(lang, 'Sub Lord', 'सब लॉर्ड'),
                  t(lang, 'Sub Sub Lord', 'सब-सब लॉर्ड'),
                ].map((head) => <th key={head} className={headStyle}>{head}</th>)}
                <th className={headStyle}>{t(lang, 'Positive/Negative', 'शुभ/अशुभ')}</th>
              </tr>
            </thead>
            <tbody>
              {planetRows.map((row) => (
                <tr key={row.planet} className="hover:bg-white/3">
                  <td className={`${cellStyle} text-gold/80 font-semibold font-devanagari`}>
                    {row.planet === 'Ascendant' ? t(lang, 'Ascendant', 'लग्न') : planetName(row.planet, lang)}
                  </td>
                  <td className={`${cellStyle} text-ivory/60 font-mono`}>{row.degree}</td>
                  <td className={`${cellStyle} text-ivory/60`}>{row.retrograde ? t(lang, 'Yes', 'हाँ') : t(lang, 'No', 'नहीं')}</td>
                  <td className={`${cellStyle} text-ivory/60 font-mono`}>{row.normalized_degree}</td>
                  <td className={`${cellStyle} text-ivory/60`}>{lang === 'hi' ? row.house_label_hi : row.house_label_en}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.zodiac_sign_hi : row.zodiac_sign}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sign_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.nakshatra_hi : row.nakshatra}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.nakshatra_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60`}>{row.charan}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_sub_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>
                    {row.assessment ? `${assessmentLabel(row.assessment, lang)} (${row.assessment_score ?? row.assessment.score})` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'cusps' && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {[
                    t(lang, 'Cusp', 'कस्प'),
                    t(lang, 'Cusp Degree', 'कस्प अंश'),
                    t(lang, 'Zodiac Sign', 'राशि'),
                    t(lang, 'Sign Lord', 'राशि स्वामी'),
                    t(lang, 'Nakshatra', 'नक्षत्र'),
                    t(lang, 'Nakshatra Lord', 'नक्षत्र स्वामी'),
                    t(lang, 'Sub Lord', 'सब लॉर्ड'),
                    t(lang, 'Sub Sub Lord', 'सब-सब लॉर्ड'),
                  ].map((head) => <th key={head} className={headStyle}>{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {cuspRows.map((row) => (
                  <tr key={row.cusp} className="hover:bg-white/3">
                    <td className={`${cellStyle} text-gold/80 font-semibold`}>{row.cusp}</td>
                    <td className={`${cellStyle} text-ivory/60 font-mono`}>{row.degree}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.zodiac_sign_hi : row.zodiac_sign}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sign_lord, lang)}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.nakshatra_hi : row.nakshatra}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.nakshatra_lord, lang)}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_lord, lang)}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_sub_lord, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-ivory/30 text-[10px] mt-3">
            {t(lang, 'Cusp model: equal-house cusps from the exact Lahiri Lagna degree.', 'कस्प मॉडल: सटीक लाहिड़ी लग्न अंश से समान-भाव कस्प।')}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function VargaChartsPanel({ birthChart, reference, referenceError, chartStyle, lang }) {
  const [selectedSlug, setSelectedSlug] = useState('d9');
  const vargaCharts = birthChart?.varga_charts || birthChart?.divisional_charts || {};
  const referenceCharts = Array.isArray(reference?.charts) ? reference.charts : [];
  const fallbackSlugs = Object.keys(vargaCharts);
  if (!fallbackSlugs.includes('d9') && birthChart?.navamsha) fallbackSlugs.push('d9');
  const fallbackDefinitions = fallbackSlugs
    .map((slug) => {
      const division = Number(String(slug).replace(/^d/i, ''));
      return {
        id: division || slug,
        code: division ? `D${division}` : String(slug).toUpperCase(),
        slug,
        division: division || 0,
        name_en: division ? `D${division}` : String(slug).toUpperCase(),
        primary_domain: '',
        signifies_en: '',
        key_uses_en: [],
        relationships: [],
      };
    })
    .sort((a, b) => a.division - b.division);
  const definitions = referenceCharts.length ? referenceCharts : fallbackDefinitions;
  const definitionSlugs = definitions.map((item) => item.slug).join('|');

  useEffect(() => {
    if (!definitions.length) return;
    const hasSelected = definitions.some((item) => item.slug === selectedSlug);
    if (!hasSelected) {
      const preferred = definitions.find((item) => item.slug === 'd9') || definitions[0];
      setSelectedSlug(preferred.slug);
    }
  }, [definitionSlugs, selectedSlug]);

  if (!birthChart || !definitions.length) return null;

  const selectedDefinition = definitions.find((item) => item.slug === selectedSlug)
    || definitions.find((item) => item.slug === 'd9')
    || definitions[0];
  const selectedChart = selectedDefinition.slug === 'd1'
    ? birthChart
    : (vargaCharts[selectedDefinition.slug] || (selectedDefinition.slug === 'd9' ? birthChart.navamsha : null));
  const selectedUses = vargaKeyUses(selectedDefinition, lang);
  const selectedAscendant = selectedChart?.ascendant;
  const selectedPlanets = Object.entries(selectedChart?.planets || {});
  const calculatedCount = Object.keys(vargaCharts).length || (birthChart.navamsha ? 1 : 0);
  const reading = birthChart?.varga_analysis?.[selectedDefinition.slug];

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.21 }}
      className="card-royal p-5 mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            {t(lang, 'Varga / Divisional Charts', 'वर्ग / विभागीय कुंडली')}
          </h2>
          <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
            {t(
              lang,
              `Choose a divisional chart to see its role, strengths, cautions, and remedies. ${calculatedCount} charts are available.`,
              `हर वर्ग कुंडली की भूमिका, शक्ति, सावधानी और उपाय देखने के लिए चार्ट चुनें। ${calculatedCount} चार्ट उपलब्ध हैं।`
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="rounded border border-gold/15 px-2 py-1 text-gold/70">
            {chartStyleLabel(chartStyle, lang)}
          </span>
          {selectedDefinition.is_high_precision && (
            <span className="rounded border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-amber-200/80">
              {t(lang, 'High precision', 'उच्च सटीकता')}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-gold/10">
        {definitions.map((definition) => {
          const active = definition.slug === selectedDefinition.slug;
          const hasChart = Boolean(
            definition.slug === 'd1'
              ? birthChart
              : (vargaCharts[definition.slug] || (definition.slug === 'd9' ? birthChart.navamsha : null))
          );
          return (
            <button
              key={definition.slug}
              type="button"
              onClick={() => setSelectedSlug(definition.slug)}
              style={{
                minWidth: 74,
                padding:'7px 9px',
                borderRadius:8,
                border:`1px solid ${active ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.14)'}`,
                background: active ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.02)',
                color: active ? '#D4AF37' : hasChart ? 'rgba(245,240,232,0.58)' : 'rgba(245,240,232,0.25)',
                cursor:'pointer',
                flex:'0 0 auto',
                textAlign:'left',
              }}
            >
              <span className="block text-[11px] font-bold leading-tight">{definition.code}</span>
              <span className="block text-[8px] leading-tight mt-0.5 truncate font-devanagari">
                {vargaName(definition, lang)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <div className="rounded border border-gold/12 bg-[#0f1128]/55 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-gold text-xs font-bold">{selectedDefinition.code} · {vargaName(selectedDefinition, lang)}</p>
                <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
                  {vargaDomain(selectedDefinition, lang)}
                </p>
              </div>
              {selectedAscendant && (
                <div className="text-right shrink-0">
                  <p className="text-ivory/35 text-[9px]">{t(lang, 'Lagna', 'लग्न')}</p>
                  <p className="text-gold/85 text-[11px] font-devanagari">
                    {lang === 'hi' ? selectedAscendant.rashi_hi : selectedAscendant.rashi_en}
                  </p>
                </div>
              )}
            </div>

            {selectedChart ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`varga-${selectedDefinition.slug}-${chartStyle}`}
                    initial={{ opacity:0, scale:0.97 }}
                    animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0, scale:0.97 }}
                    transition={{ duration:0.2 }}
                  >
                    {chartStyle === 'south'
                      ? <SouthIndianChart chart={selectedChart} lang={lang} />
                      : <NorthIndianChart chart={selectedChart} lang={lang} />
                    }
                  </motion.div>
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-1.5 mt-4">
                  {selectedPlanets.map(([planet, pd]) => (
                    <div key={planet} className="rounded border border-white/5 bg-white/3 px-2 py-1.5">
                      <p className="text-[9px] text-gold/70 font-devanagari truncate">
                        {PLANET_META[planet]?.icon} {planetName(planet, lang)}
                      </p>
                      <p className="text-[9px] text-ivory/55 font-devanagari truncate">
                        {lang === 'hi' ? pd.rashi_hi : pd.rashi_en}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-100/75">
                {t(
                  lang,
                  'This saved profile does not yet contain this divisional chart. Recalculate the Kundli to populate the full Varga set.',
                  'इस सेव की गई कुंडली में यह वर्ग अभी उपलब्ध नहीं है। पूरा वर्ग सेट भरने के लिए कुंडली को पुनः गणना करें।'
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">

          {/* ── Verdict + What this chart answers ── */}
          {reading ? (
            <div className="rounded border border-gold/15 bg-gradient-to-br from-[#1a1530]/60 to-[#0f1128]/60 p-4">
              {/* Verdict badge + question */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-1 font-devanagari">
                    {t(lang, 'What this chart tells you', 'यह कुंडली क्या बताती है')}
                  </p>
                  <p className="text-ivory/85 text-sm font-semibold font-devanagari leading-snug">
                    {lang === 'hi' ? reading.role_hi : reading.role_en}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  reading.overall_status === 'favorable'
                    ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/25'
                    : reading.overall_status === 'mixed'
                    ? 'bg-amber-400/12 text-amber-200 border border-amber-400/25'
                    : 'bg-red-400/12 text-red-300 border border-red-400/25'
                } font-devanagari`}>
                  {reading.verdict_en && lang !== 'hi' ? reading.verdict_en : reading.verdict_hi || (lang === 'hi' ? reading.overall_hi : reading.overall_en)}
                </span>
              </div>

              {/* Plain-language answer paragraph */}
              <p className="text-ivory/70 text-[12px] leading-relaxed font-devanagari">
                {lang === 'hi' ? reading.user_summary_hi : reading.user_summary_en}
              </p>
            </div>
          ) : (
            <div className="rounded border border-gold/12 bg-white/3 p-4">
              <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                {t(lang, 'About this chart', 'इस कुंडली के बारे में')}
              </p>
              <p className="text-ivory/55 text-[10px] mb-1 font-devanagari">{vargaSignifies(selectedDefinition, lang)}</p>
              <p className="text-ivory/65 text-sm leading-relaxed font-devanagari">
                {vargaDescription(selectedDefinition, lang)}
              </p>
            </div>
          )}

          {/* ── Three plain-language insight cards ── */}
          {reading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  icon: '✓',
                  title: t(lang, 'What It Means For You', 'आपके लिए क्या अर्थ है'),
                  rows: reading.benefits || [],
                  iconColor: '#22C55E',
                  borderColor: 'rgba(34,197,94,0.18)',
                  bgColor: 'rgba(34,197,94,0.05)',
                },
                {
                  icon: '⚠',
                  title: t(lang, 'What To Watch', 'क्या ध्यान रखें'),
                  rows: reading.watch_points || [],
                  iconColor: '#F59E0B',
                  borderColor: 'rgba(245,158,11,0.18)',
                  bgColor: 'rgba(245,158,11,0.04)',
                },
                {
                  icon: '✦',
                  title: t(lang, 'What To Do', 'क्या करें'),
                  rows: reading.remedies || [],
                  iconColor: '#A78BFA',
                  borderColor: 'rgba(167,139,250,0.18)',
                  bgColor: 'rgba(167,139,250,0.04)',
                },
              ].map((card) => (
                <div key={card.title}
                     className="rounded border p-3 flex flex-col gap-2"
                     style={{ borderColor: card.borderColor, background: card.bgColor }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: card.iconColor }} className="text-sm leading-none">{card.icon}</span>
                    <p className="text-[10px] font-semibold font-devanagari" style={{ color: card.iconColor }}>
                      {card.title}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {card.rows.map((row, idx) => (
                      <p key={idx} className="text-ivory/72 text-[11px] leading-relaxed font-devanagari">
                        {lang === 'hi' ? row.hi : row.en}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── D60 Past Life Reading ── */}
          {selectedDefinition.slug === 'd60' && reading?.past_life_reading && (() => {
            const pl = reading.past_life_reading;
            const KARMA_COLOR = pl.karma_quality === 'positive'
              ? { border:'rgba(34,197,94,0.25)', bg:'rgba(34,197,94,0.07)', text:'#86EFAC' }
              : pl.karma_quality === 'mixed'
              ? { border:'rgba(245,158,11,0.25)', bg:'rgba(245,158,11,0.07)', text:'#FCD34D' }
              : { border:'rgba(239,68,68,0.25)', bg:'rgba(239,68,68,0.07)', text:'#FCA5A5' };
            const relCards = [
              { label_en:'Your Past-Life Profession', label_hi:'पूर्व जन्म में व्यवसाय', icon:'💼', data: pl.profession, color:'rgba(212,175,55,0.18)', tcolor:'#D4AF37' },
              { label_en:'Relationship with Father', label_hi:'पिता के साथ संबंध', icon:'👨', data: pl.father, color:'rgba(96,165,250,0.18)', tcolor:'#93C5FD' },
              { label_en:'Relationship with Mother', label_hi:'माँ के साथ संबंध', icon:'🌸', data: pl.mother, color:'rgba(244,114,182,0.18)', tcolor:'#F9A8D4' },
              { label_en:'Relationship with Spouse', label_hi:'जीवनसाथी के साथ संबंध', icon:'💑', data: pl.spouse, color:'rgba(167,139,250,0.18)', tcolor:'#C4B5FD' },
              { label_en:'Spiritual Status & Moksha', label_hi:'आध्यात्मिक स्तर और मोक्ष', icon:'🕉', data: pl.past_moksha, color:'rgba(52,211,153,0.18)', tcolor:'#6EE7B7' },
            ];
            return (
              <div className="space-y-4">
                {/* Header + karma badge */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gold/60 font-devanagari">
                      {t(lang, 'D60 — Past Life Reading', 'D60 — पूर्व जन्म पठन')}
                    </p>
                    <p className="text-ivory/85 text-xs font-devanagari mt-0.5">
                      {t(lang, `Past life lagna: ${pl.d60_lagna_en}`, `पूर्व जन्म लग्न: ${pl.d60_lagna_hi || pl.d60_lagna_en}`)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full font-devanagari"
                        style={{ border:`1px solid ${KARMA_COLOR.border}`, background: KARMA_COLOR.bg, color: KARMA_COLOR.text }}>
                    {lang === 'hi' ? pl.karma_label_hi : pl.karma_label_en}
                  </span>
                </div>

                {/* Past life personality */}
                <div className="rounded border border-gold/15 bg-gradient-to-br from-[#1a1530]/60 to-[#0f1128]/60 p-4">
                  <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Who You Were', 'आप कौन थे')}
                  </p>
                  <p className="text-ivory/75 text-[12px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? pl.personality_hi : pl.personality_en}
                  </p>
                </div>

                {/* 5 relationship/profession cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relCards.map((card) => card.data && (
                    <div key={card.label_en} className="rounded border p-3 space-y-1.5"
                         style={{ borderColor: card.color, background: card.color.replace('0.18','0.05') }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm leading-none">{card.icon}</span>
                        <p className="text-[10px] font-semibold font-devanagari" style={{ color: card.tcolor }}>
                          {lang === 'hi' ? card.label_hi : card.label_en}
                        </p>
                        <span className="ml-auto text-[9px] text-ivory/35 font-devanagari">
                          {t(lang, `House ${card.data.house}`, `भाव ${card.data.house}`)} · {lang === 'hi' ? card.data.primary_influence_hi : card.data.primary_influence}
                        </span>
                      </div>
                      <p className="text-ivory/70 text-[11px] leading-relaxed font-devanagari">
                        {lang === 'hi' ? card.data.reading_hi : card.data.reading_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── D20 Spiritual Path ── */}
          {selectedDefinition.slug === 'd20' && reading?.spiritual_reading && (() => {
            const sp = reading.spiritual_reading;
            const SPIRIT_COLOR = sp.spirit_verdict === 'strong'
              ? { border:'rgba(52,211,153,0.25)', bg:'rgba(52,211,153,0.07)', text:'#6EE7B7' }
              : sp.spirit_verdict === 'moderate'
              ? { border:'rgba(245,158,11,0.25)', bg:'rgba(245,158,11,0.07)', text:'#FCD34D' }
              : { border:'rgba(167,139,250,0.25)', bg:'rgba(167,139,250,0.07)', text:'#C4B5FD' };
            return (
              <div className="space-y-4">
                {/* Header + verdict badge */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gold/60 font-devanagari">
                      {t(lang, 'D20 — Your Spiritual Path', 'D20 — आपका आध्यात्मिक मार्ग')}
                    </p>
                    <p className="text-ivory/85 text-xs font-devanagari mt-0.5">
                      {t(lang, `D20 Lagna: ${sp.d20_lagna_en}`, `D20 लग्न: ${sp.d20_lagna_hi || sp.d20_lagna_en}`)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full font-devanagari"
                        style={{ border:`1px solid ${SPIRIT_COLOR.border}`, background: SPIRIT_COLOR.bg, color: SPIRIT_COLOR.text }}>
                    {lang === 'hi' ? sp.verdict_hi : sp.verdict_en}
                  </span>
                </div>

                {/* Spiritual temperament */}
                <div className="rounded border border-gold/15 bg-gradient-to-br from-[#1a1530]/60 to-[#0f1128]/60 p-4">
                  <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Your Spiritual Temperament', 'आपका आध्यात्मिक स्वभाव')}
                  </p>
                  <p className="text-ivory/75 text-[12px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? sp.temperament_hi : sp.temperament_en}
                  </p>
                </div>

                {/* Primary practice */}
                <div className="rounded border border-indigo-400/20 bg-indigo-500/5 p-3">
                  <p className="text-indigo-300/70 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Your Core Practice', 'आपकी मुख्य साधना')}
                  </p>
                  <p className="text-ivory/72 text-[11px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? sp.primary_practice_hi : sp.primary_practice_en}
                  </p>
                </div>

                {/* Jupiter + Ketu placement */}
                <div className="grid grid-cols-2 gap-3">
                  {sp.jupiter && (
                    <div className="rounded border p-3 space-y-1"
                         style={{ borderColor: sp.jupiter.favorable ? 'rgba(251,191,36,0.25)' : 'rgba(245,245,245,0.1)', background: sp.jupiter.favorable ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)' }}>
                      <p className="text-[9px] uppercase tracking-widest font-devanagari"
                         style={{ color: sp.jupiter.favorable ? '#FCD34D' : '#9CA3AF' }}>
                        {t(lang, '♃ Jupiter in D20', '♃ D20 में गुरु')}
                      </p>
                      <p className="text-ivory/72 text-[11px] font-devanagari">
                        {lang === 'hi' ? sp.jupiter.sign_hi : sp.jupiter.sign_en} · {t(lang, `House ${sp.jupiter.house}`, `भाव ${sp.jupiter.house}`)}
                      </p>
                      <p className="text-[10px] font-devanagari" style={{ color: sp.jupiter.favorable ? '#86EFAC' : '#FCA5A5' }}>
                        {sp.jupiter.favorable ? t(lang, '✓ Spiritually strong', '✓ आध्यात्मिक बल अच्छा') : t(lang, '⚠ Needs strengthening', '⚠ बल बढ़ाने की जरूरत')}
                      </p>
                    </div>
                  )}
                  {sp.ketu && (
                    <div className="rounded border p-3 space-y-1"
                         style={{ borderColor: sp.ketu.favorable ? 'rgba(167,139,250,0.25)' : 'rgba(245,245,245,0.1)', background: sp.ketu.favorable ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.02)' }}>
                      <p className="text-[9px] uppercase tracking-widest font-devanagari"
                         style={{ color: sp.ketu.favorable ? '#C4B5FD' : '#9CA3AF' }}>
                        {t(lang, '☊ Ketu in D20', '☊ D20 में केतु')}
                      </p>
                      <p className="text-ivory/72 text-[11px] font-devanagari">
                        {lang === 'hi' ? sp.ketu.sign_hi : sp.ketu.sign_en} · {t(lang, `House ${sp.ketu.house}`, `भाव ${sp.ketu.house}`)}
                      </p>
                      <p className="text-[10px] font-devanagari" style={{ color: sp.ketu.favorable ? '#86EFAC' : '#FCA5A5' }}>
                        {sp.ketu.favorable ? t(lang, '✓ Liberation karma strong', '✓ मोक्ष कर्म मजबूत') : t(lang, 'Developing moksha seed', 'मोक्ष बीज विकसित हो रहा')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Grace path (9th house) */}
                <div className="rounded border border-saffron/20 bg-saffron/5 p-3">
                  <p className="text-saffron/70 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                    {t(lang, 'Path of Divine Grace (9th House)', 'दिव्य कृपा का मार्ग (9वाँ भाव)')}
                  </p>
                  <p className="text-ivory/72 text-[11px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? sp.grace_path_hi : sp.grace_path_en}
                  </p>
                </div>

                {/* Isht Devata */}
                {sp.ishta_devata && (
                  <div className="rounded border border-gold/20 bg-gold/5 p-3">
                    <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                      {t(lang, 'Your Ishta Devata (Personal Deity)', 'आपके इष्ट देवता')}
                    </p>
                    <p className="text-gold text-sm font-semibold font-devanagari mb-1">
                      {lang === 'hi' ? sp.ishta_devata.hi : sp.ishta_devata.en}
                    </p>
                    <p className="text-ivory/60 text-[11px] font-devanagari">
                      {t(lang, 'Mantra:', 'मंत्र:')} {lang === 'hi' ? sp.ishta_devata.mantra_hi : sp.ishta_devata.mantra_en}
                    </p>
                  </div>
                )}

                {/* Moksha indicator */}
                {sp.moksha_indicator && (
                  <div className="rounded border border-emerald-400/15 bg-emerald-500/5 p-3">
                    <p className="text-emerald-300/60 text-[10px] uppercase tracking-widest mb-1 font-devanagari">
                      {t(lang, 'Moksha Path (12th House)', 'मोक्ष मार्ग (12वाँ भाव)')}
                    </p>
                    <p className="text-ivory/72 text-[11px] font-devanagari">
                      {lang === 'hi'
                        ? `12वें भाव पर ${sp.moksha_indicator_hi} का प्रभाव — इस ग्रह की दिशा में मोक्ष साधना सबसे प्रभावी है।`
                        : `${sp.moksha_indicator} governs your 12th house of liberation — align your liberation practice with this planet's energy for the deepest results.`
                      }
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Use this chart for ── */}
          {selectedUses.length > 0 && (
            <div>
              <p className="text-gold/55 text-[10px] uppercase tracking-widest mb-2 font-devanagari">
                {t(lang, 'Use This Chart To Check', 'इस कुंडली से जानें')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedUses.map((item) => (
                  <div key={item}
                       className="rounded border border-gold/10 bg-[#111428]/55 px-3 py-2 text-ivory/65 text-[11px] font-devanagari flex items-start gap-2">
                    <span className="text-gold/40 mt-0.5 shrink-0">·</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {referenceError && (
        <p className="text-amber-200/60 text-[10px] mt-4">
          {t(lang, 'Reference API unavailable; showing calculated Varga charts only.', 'संदर्भ API उपलब्ध नहीं है; केवल गणित वर्ग कुंडलियां दिखाई जा रही हैं।')}
        </p>
      )}
    </motion.div>
  );
}

// ─── Graha Drishti House Card with Life-Area Impact Accordion ────────────────
const LIFE_AREA_ICONS = {
  self:'👤', family:'🏠', spouse:'💑', money:'💰', career:'💼', health:'❤️', spirit:'🙏',
};
const ASPECT_NATURE_COLOR = {
  auspicious:'#22C55E', aggressive:'#EF4444', restricting:'#818CF8',
  karmic:'#A78BFA', neutral:'#9CA3AF',
};

function DrishtiHouseCard({ item, lang, t, houseLabel, planetName, PLANET_META }) {
  const [expanded, setExpanded] = useState(false);
  const [activeImpact, setActiveImpact] = useState(0);

  const hasAspects   = item.aspects?.length > 0;
  const hasOccupants = item.occupants?.length > 0;
  const impacts      = item.planet_impacts || [];
  const hasImpacts   = impacts.length > 0;

  const natureColor = hasAspects
    ? (ASPECT_NATURE_COLOR[item.aspects[0]?.nature] || '#D4AF37')
    : 'rgba(212,175,55,0.4)';

  return (
    <div style={{
      border: `1px solid ${hasAspects ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, padding: '12px 14px',
      background: hasAspects ? 'rgba(212,175,55,0.03)' : 'rgba(17,20,40,0.4)',
    }}>
      {/* House header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-gold/85 text-xs font-semibold font-devanagari">
            {houseLabel(item.house, lang)} · {lang === 'hi' ? item.sign_hi : item.sign_en}
          </p>
          <p className="text-ivory/52 text-[10px] mt-0.5 font-devanagari">
            {lang === 'hi' ? item.theme_hi : item.theme_en}
          </p>
        </div>
        <span style={{ background: hasAspects ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)' }}
          className={`rounded px-2 py-1 text-[9px] font-semibold shrink-0 ${hasAspects ? 'text-gold/80' : 'text-ivory/55'}`}>
          {hasAspects ? `${item.aspects.length} ${t(lang,'aspect','दृष्टि')}` : t(lang,'quiet','शांत')}
        </span>
      </div>

      {/* Summary text */}
      <p className="text-ivory/74 text-[11px] leading-relaxed font-devanagari mb-2">
        {lang === 'hi' ? item.plain_effect_hi : item.plain_effect_en}
      </p>

      {/* Benefit / Watch */}
      <div className="grid grid-cols-1 gap-1 mb-2">
        <p className="text-emerald-300/76 text-[10px] leading-relaxed font-devanagari">
          ✓ {lang === 'hi' ? item.benefit_hi : item.benefit_en}
        </p>
        <p className="text-amber-200/76 text-[10px] leading-relaxed font-devanagari">
          ⚠ {lang === 'hi' ? item.watch_hi : item.watch_en}
        </p>
      </div>

      {/* Planet chips */}
      {(hasOccupants || hasAspects) && (
        <div className="flex flex-wrap gap-1.5 mb-3 pt-2 border-t border-white/6">
          {item.occupants?.map((p) => (
            <span key={`occ-${p}`} className="rounded bg-white/5 px-2 py-1 text-[9px] text-ivory/70 font-devanagari">
              {t(lang,'Sitting:','बैठा:')} {planetName(p, lang)}
            </span>
          ))}
          {item.aspects?.map((a) => (
            <span key={`${a.planet}-${a.offset}`}
              style={{ color: PLANET_META[a.planet]?.color || '#D4AF37' }}
              className="rounded bg-white/5 px-2 py-1 text-[9px] font-devanagari">
              {t(lang,'Aspect:','दृष्टि:')} {planetName(a.planet, lang)}
            </span>
          ))}
        </div>
      )}

      {/* ── Life Area Impact expand button ── */}
      {hasImpacts && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              width:'100%', textAlign:'left', padding:'7px 10px',
              background: expanded ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.06)',
              border:'1px solid rgba(167,139,250,0.25)', borderRadius:8,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
            <span style={{ color:'#A78BFA', fontSize:10, fontWeight:700 }}>
              🔍 {t(lang,
                `Detailed Life Impact — ${hasOccupants ? item.occupants.join(', ') + ' in this house' : 'this house'}`,
                `विस्तृत जीवन प्रभाव — ${hasOccupants ? item.occupants.map(p => p).join(', ') + ' इस भाव में' : 'इस भाव पर'}`)}
            </span>
            <span style={{ color:'#A78BFA', fontSize:12 }}>{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div style={{ marginTop:8 }}>
              {/* Aspecting planet tabs (if multiple aspects) */}
              {impacts.length > 1 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  {impacts.map((imp, idx) => (
                    <button key={imp.aspecting_planet} onClick={() => setActiveImpact(idx)} style={{
                      padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:600,
                      background: idx === activeImpact ? `${PLANET_META[imp.aspecting_planet]?.color || '#A78BFA'}22` : 'rgba(255,255,255,0.05)',
                      color: idx === activeImpact ? (PLANET_META[imp.aspecting_planet]?.color || '#A78BFA') : 'rgba(245,240,232,0.4)',
                      border: `1px solid ${idx === activeImpact ? (PLANET_META[imp.aspecting_planet]?.color || '#A78BFA') + '44' : 'transparent'}`,
                      cursor:'pointer',
                    }}>
                      {t(lang, imp.aspecting_planet, imp.aspecting_planet)} {t(lang,'aspect','दृष्टि')}
                    </button>
                  ))}
                </div>
              )}

              {/* Active impact — 7 life area cards */}
              {impacts[activeImpact] && (() => {
                const imp = impacts[activeImpact];
                const natColor = ASPECT_NATURE_COLOR[imp.aspect_nature] || '#A78BFA';
                const pColor   = PLANET_META[imp.aspecting_planet]?.color || natColor;
                return (
                  <div>
                    {/* Impact header */}
                    <div style={{
                      padding:'8px 12px', borderRadius:8, marginBottom:10,
                      background:`${pColor}0E`, border:`1px solid ${pColor}30`,
                    }}>
                      <p style={{ color: pColor, fontSize:11, fontWeight:700, fontFamily:'Georgia,serif' }}>
                        {t(lang,
                          `${imp.aspecting_planet}'s ${imp.aspect_nature} aspect on ${imp.occupants.join(' + ')} in House ${imp.house}`,
                          `${imp.aspecting_planet} की ${imp.aspect_nature === 'karmic' ? 'कर्मिक' : imp.aspect_nature === 'auspicious' ? 'शुभ' : imp.aspect_nature === 'aggressive' ? 'तीव्र' : imp.aspect_nature === 'restricting' ? 'गंभीर' : 'सामान्य'} दृष्टि — भाव ${imp.house} में ${imp.occupants.join(' + ')} पर`
                        )}
                      </p>
                      <p style={{ color:'rgba(245,240,232,0.45)', fontSize:10, marginTop:3 }}>
                        {t(lang,
                          'How this aspect shapes 7 life areas for you personally:',
                          'यह दृष्टि आपके लिए 7 जीवन क्षेत्रों को कैसे प्रभावित करती है:')}
                      </p>
                    </div>

                    {/* 7 Life area accordion */}
                    <div style={{ display:'grid', gap:6 }}>
                      {imp.life_areas.map((area) => (
                        <DrishtiAreaRow key={area.key} area={area} lang={lang} pColor={pColor} t={t} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Single life-area expandable row
function DrishtiAreaRow({ area, lang, pColor, t }) {
  const [open, setOpen] = useState(false);
  const icon = LIFE_AREA_ICONS[area.key] || '•';
  const text = lang === 'hi' ? area.text_hi : area.text_en;

  // Bold **text** helper
  function renderBold(str) {
    if (!str) return null;
    return str.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color:'rgba(245,240,232,0.9)', fontWeight:700 }}>{part}</strong>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <div style={{
      border:`1px solid ${open ? pColor + '30' : 'rgba(255,255,255,0.07)'}`,
      borderRadius:8, overflow:'hidden',
      background: open ? `${pColor}08` : 'rgba(17,20,40,0.3)',
      transition:'all 0.18s',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', padding:'9px 12px', display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer', background:'transparent',
          border:'none', textAlign:'left',
        }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>{icon}</span>
          <span style={{ color: open ? pColor : 'rgba(245,240,232,0.7)', fontSize:11, fontWeight:600,
            fontFamily:'var(--font-devanagari,Georgia),sans-serif' }}>
            {lang === 'hi' ? area.heading_hi : area.heading_en}
          </span>
        </div>
        <span style={{ color: open ? pColor : 'rgba(245,240,232,0.3)', fontSize:10 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding:'0 12px 12px 34px' }}>
          <p style={{ color:'rgba(245,240,232,0.72)', fontSize:11, lineHeight:1.85,
            fontFamily:'var(--font-devanagari,Georgia),sans-serif' }}>
            {renderBold(text)}
          </p>
        </div>
      )}
    </div>
  );
}

export default function KundliDetail({ uuid }) {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const router   = useRouter();

  const [kundli,           setKundli]           = useState(null);
  const [nakshatraInsight, setNakshatraInsight] = useState(null);
  const [chartEnrichment,  setChartEnrichment]  = useState(null);
  const [error,            setError]            = useState(null);
  const [fetching,         setFetching]         = useState(true);
  const [recalcing,        setRecalcing]        = useState(false);
  const [editOpen,         setEditOpen]         = useState(false);
  const [chartStyle,       setChartStyle]       = useState('north'); // 'south' | 'north'
  const [vargaReference,   setVargaReference]   = useState(null);
  const [vargaReferenceError, setVargaReferenceError] = useState(null);

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
        setChartEnrichment(data.profile.chart_enrichment || null);
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load Kundli'))
      .finally(() => setFetching(false));
  }, [user, uuid]);

  useEffect(fetchKundli, [fetchKundli]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setVargaReferenceError(null);
    api.get('/kundli/reference/varga')
      .then(({ data }) => {
        if (alive) setVargaReference(data.reference || null);
      })
      .catch((e) => {
        if (alive) setVargaReferenceError(e.response?.data?.message || 'Varga reference unavailable');
      });
    return () => { alive = false; };
  }, [user]);

  const handleRecalc = async () => {
    setRecalcing(true);
    try {
      const { data } = await api.post(`/kundli/${uuid}/recalculate`);
      setKundli(data.profile);
      setNakshatraInsight(data.profile.nakshatra_insight || null);
      setChartEnrichment(data.profile.chart_enrichment || null);
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
      toast.error(e.response?.data?.message || t(lang, 'Unable to export PDF', 'PDF निर्यात नहीं हो पाया'));
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
          <Link href="/dashboard" className="hover:text-gold transition-colors">{t(lang, 'Dashboard', 'डैशबोर्ड')}</Link>
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
              📄 {t(lang, 'PDF Report', 'PDF रिपोर्ट')}
            </button>
            <button onClick={handleRecalc} disabled={recalcing}
              className="btn-outline-gold text-xs px-4 py-2">
              {recalcing ? `⏳ ${t(lang, 'Recalculating…', 'पुनः गणना हो रही है…')}` : `🔄 ${t(lang, 'Recalculate', 'पुनः गणना')}`}
            </button>
            <button onClick={() => setEditOpen(true)}
              style={{
                padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.45)',
                color:'#D4AF37', cursor:'pointer',
              }}>
              ✏️ {t(lang, 'Edit Details', 'विवरण संपादित करें')}
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
              <ChartToggle style={chartStyle} onChange={handleStyleChange} lang={lang} />

              {/* Chart label */}
              <p className="font-serif text-gold text-sm font-semibold text-center mb-3">
                  🔯 {lang==='hi'?'लग्न कुंडली (D1)':'Lagna Chart (D1)'}
                <span className="text-gold/40 text-[10px] ml-2 normal-case font-sans">
                  {chartStyleLabel(chartStyle, lang)}
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
                  🔯 {t(lang, 'D9 Navamsha', 'D9 नवांश')}
                  <span className="text-gold/40 text-[10px] ml-2 normal-case font-sans">
                    {lang==='hi' ? chart.navamsha.ascendant?.rashi_hi : chart.navamsha.ascendant?.rashi_en} {t(lang, 'Lagna', 'लग्न')} ·{' '}
                    {chartStyleLabel(chartStyle, lang)}
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
                  { l: lang==='hi'?'नक्षत्र':'Nakshatra', v: lang==='hi'?chart.nakshatra.hi:chart.nakshatra.en,               s:t(lang, `Pada ${chart.nakshatra.pada}`, `चरण ${chart.nakshatra.pada}`),        c:'#A78BFA' },
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
                        {[lang==='hi'?'ग्रह':'Planet', lang==='hi'?'राशि':'Sign', lang==='hi'?'अंश':'Degree', lang==='hi'?'भाव':'House', lang==='hi'?'स्थिति (EDOFEN)':'Status (EDOFEN)'].map(h => (
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
                        // EDOFEN: strength % and sign-lord relation
                        const strength = pd.dignity_strength;
                        const relKey   = pd.sign_lord_relation;
                        const REL_COLOR = { friend:'#22C55E', enemy:'#EF4444', neutral:'#9CA3AF', self:'#60A5FA' };
                        const REL_LABEL_EN = { friend:'Friend\'s sign', enemy:'Enemy\'s sign', neutral:'Neutral sign', self:'Own sign' };
                        const REL_LABEL_HI = { friend:'मित्र राशि', enemy:'शत्रु राशि', neutral:'सम राशि', self:'स्वराशि' };
                        return (
                          <tr key={name} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                <span style={{ color:meta.color, fontSize:13, width:16 }}>{meta.icon}</span>
                                <div>
                                  <p className="text-ivory text-xs font-medium font-devanagari">{planetName(name, lang)}</p>
                                  <p className="text-ivory/30 text-[9px] font-devanagari">{lang === 'hi' ? name : meta.hi}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3">
                              <p className="text-ivory/80 text-[11px] font-devanagari">
                                {lang==='hi' ? pd.rashi_hi : pd.rashi_en}
                              </p>
                              {/* Sign-lord relation from EDOFEN Friendship table */}
                              {relKey && relKey !== 'self' && (
                                <p className="text-[9px] mt-0.5" style={{ color: REL_COLOR[relKey] || '#9CA3AF' }}>
                                  {lang === 'hi' ? REL_LABEL_HI[relKey] : REL_LABEL_EN[relKey]}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 pr-3 text-ivory/55 font-mono text-[10px]">
                              {pd.degree_in_sign_dms}
                              {pd.is_retrograde && <span className="text-red-400 ml-1 text-[9px]">℞</span>}
                            </td>
                            <td className="py-2.5 pr-3 text-ivory/45 text-[11px]">
                              {houseNum ? houseLabel(houseNum, lang) : '—'}
                            </td>
                            <td className="py-2.5">
                              <div className="flex flex-col gap-0.5">
                                <span style={{
                                  fontSize:10, padding:'2px 7px', borderRadius:12, fontWeight:600,
                                  background: ds.bg, color: ds.color, display:'inline-block',
                                }}>
                                  {dignityLabel(pd.dignity, lang)}
                                </span>
                                {/* EDOFEN strength percentage */}
                                {strength !== undefined && (
                                  <span style={{
                                    fontSize:9, color: strength >= 70 ? '#22C55E' : strength <= 15 ? '#EF4444' : '#9CA3AF',
                                    paddingLeft:2, fontWeight:600,
                                  }}>
                                    {strength}% {lang === 'hi' ? 'शक्ति' : 'strength'}
                                  </span>
                                )}
                              </div>
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
                          {d.full_years}{lang === 'hi' ? ' वर्ष' : 'Y'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {curDasha?.antardasha && (
                  <div className="mt-5 pt-4 border-t border-gold/10">
                    <h3 className="text-gold/80 text-xs uppercase tracking-[0.22em] mb-3">
                      {t(lang, 'Current Antardasha', 'वर्तमान अंतर्दशा')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {curDasha.antardasha.map((ad) => {
                        const isCur = ad.is_current;
                        return (
                          <div key={`${ad.lord}-${ad.start}`} className={`rounded border p-2 ${isCur ? 'border-gold/45 bg-gold/10' : 'border-gold/10 bg-white/3'}`}>
                            <div className="flex justify-between gap-2">
                              <span className="text-ivory text-xs font-devanagari">{planetName(ad.lord, lang)}</span>
                              {isCur && <span className="text-gold text-[9px] uppercase">{t(lang, 'Now', 'चालू')}</span>}
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
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">{t(lang, 'Mangal Dosha', 'मंगल दोष')}</h2>
                  <p className="text-ivory/75 text-sm font-devanagari">
                    {lang === 'hi'
                      ? (chart.mangal_dosha?.has_dosha
                        ? `मंगल दोष ${chart.mangal_dosha.checks?.filter((c) => c.has_dosha).map((c) => `${c.basis === 'Lagna' ? 'लग्न' : c.basis === 'Moon' ? 'चंद्र' : 'शुक्र'} से ${houseLabel(c.house, 'hi')}`).join(', ')} में दिखता है। प्रभाव: ${strengthLabel(chart.mangal_dosha.severity, 'hi')}।`
                        : 'लग्न, चंद्र और शुक्र से प्रमुख मंगल दोष नहीं दिखता।')
                      : (chart.mangal_dosha?.summary_en || 'Not calculated')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {(chart.mangal_dosha?.checks || []).map((check) => (
                      <div key={check.basis} className={`rounded border p-2 text-center ${check.has_dosha ? 'border-gold/40 bg-gold/10' : 'border-gold/10 bg-white/3'}`}>
                        <p className="text-[10px] text-ivory/35">{check.basis === 'Lagna' ? t(lang, 'Lagna', 'लग्न') : check.basis === 'Moon' ? t(lang, 'Moon', 'चंद्र') : t(lang, 'Venus', 'शुक्र')}</p>
                        <p className="text-sm text-gold mt-1">{houseLabel(check.house, lang)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-royal p-5">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">{t(lang, 'Gochar', 'गोचर')}</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-gold/8 pb-2">
                      <span className="text-ivory/45">{t(lang, 'Sade Sati', 'साढ़ेसाती')}</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.sade_sati?.active ? localizeAstroText(chart.gochar.highlights.sade_sati.phase, lang) : t(lang, 'Inactive', 'सक्रिय नहीं')}</span>
                    </div>
                    <div className="flex justify-between border-b border-gold/8 pb-2">
                      <span className="text-ivory/45">{t(lang, 'Jupiter', 'गुरु')}</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.jupiter_support?.favorable ? t(lang, 'Supportive', 'सहायक') : t(lang, 'Patient', 'धैर्य चाहिए')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ivory/45">{t(lang, 'Rahu Ketu', 'राहु केतु')}</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.rahu_ketu_axis || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="card-royal p-5 md:col-span-2">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">{t(lang, 'Prediction Engine', 'भविष्यवाणी इंजन')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {predictionSummaryLines(chart, lang).map((line, index) => (
                      <p key={index} className="border border-gold/10 rounded p-3 text-sm text-ivory/70 font-devanagari">{line}</p>
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
                        <span className="text-[9px] text-ivory/35 uppercase tracking-wider font-medium">{houseLabel(h.house_num, lang)}</span>
                        <span className="text-[10px] text-ivory/55 font-devanagari">
                          {lang==='hi' ? h.rashi_hi : h.rashi_en?.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-[9px] text-ivory/30">
                        {lang==='hi'?'स्वामी':'Lord'}: <span className="text-gold/55">{planetName(h.rashi_lord, lang)}</span>
                      </p>
                      {h.planets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {h.planets.map(p => (
                            <span key={p} style={{ color: PLANET_META[p]?.color || '#D4AF37', fontSize:10 }}>
                              {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
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

            {/* Life Portrait — who you are + current dasha meaning */}
            {chart?.predictions?.portrait && (
              <LifePortraitPanel chart={chart} lang={lang} />
            )}

          </div>
        </div>

        {/* ── Life Report (Finance, Family, Health, Problems, Isht Devata) ── */}
        {chart?.life_report?.sections && (
          <LifeReportPanel lifeReport={chart.life_report} lang={lang} />
        )}

        {/* ── Kundli Insight — Plain Language Customer Guide ────────────────
             Uses Class 3&4 DB data: guna/varna/deity for planets,
             zodiac sign descriptions, house topics & health organs.          */}
        {chart && chartEnrichment && (
          <KundliInsightPanel
            chart={chart}
            enrichment={chartEnrichment}
            lang={lang}
          />
        )}

        {/* ── Planet Life Impact — How each planet affects money, career, family etc. */}
        {chart?.reports?.planet_assessments && (
          <PlanetImpactPanel chart={chart} lang={lang} />
        )}

        {/* ── Detailed Reports ─────────────────────────────────────────────── */}
        {chart && (
          <DetailedReportsPanel
            reports={chart.reports}
            lang={lang}
            onRecalculate={handleRecalc}
            recalcing={recalcing}
          />
        )}

        {chart && (
          <VargaChartsPanel
            birthChart={chart}
            reference={vargaReference}
            referenceError={vargaReferenceError}
            chartStyle={chartStyle}
            lang={lang}
          />
        )}

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
                        <span className="text-ivory text-xs font-semibold font-devanagari">{planetName(d.planet, lang)}</span>
                        {d.has_digbala && (
                          <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(34,197,94,0.2)', color:'#22C55E', fontWeight:700, textTransform:'uppercase' }}>
                            {t(lang, 'Digbala', 'दिग्बल')} ✓
                          </span>
                        )}
                        {d.has_digbala_loss && (
                          <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(239,68,68,0.15)', color:'#EF4444', fontWeight:700, textTransform:'uppercase' }}>
                            {t(lang, 'Lost', 'ह्रास')}
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
                        {houseLabel(d.planet_house, lang)} ({lang === 'hi' ? d.rashi_hi || d.rashi_en : d.rashi_en})
                        {'  →  '}
                        {lang==='hi' ? 'शक्तिशाली भाव' : 'Strong at'} {houseLabel(d.strong_house, lang)}
                      </span>
                      <span style={{ color: '#A78BFA' }}>
                        {d.strong_direction?.[lang === 'hi' ? 'hi' : 'en']}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
                      <p className="text-ivory/74 text-[11px] leading-relaxed font-devanagari">
                        {lang === 'hi' ? d.effect_hi : d.effect_en}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <p className="text-emerald-300/78 text-[10px] leading-relaxed font-devanagari">
                          {t(lang, 'Benefit:', 'लाभ:')} {lang === 'hi' ? d.benefit_hi : d.benefit_en}
                        </p>
                        <p className="text-amber-200/78 text-[10px] leading-relaxed font-devanagari">
                          {t(lang, 'Watch:', 'सावधानी:')} {lang === 'hi' ? d.watch_hi : d.watch_en}
                        </p>
                        <p className="text-violet-200/78 text-[10px] leading-relaxed font-devanagari">
                          {t(lang, 'Remedy:', 'उपाय:')} {lang === 'hi' ? d.remedy_hi : d.remedy_en}
                        </p>
                      </div>
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
              {Object.values(chart.bhav_karak).map((bk) => (
                  <div key={bk.house}
                    className="border border-gold/12 rounded p-3 hover:border-gold/25 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gold/70 text-[10px] font-bold uppercase tracking-wider">
                        {houseLabel(bk.house, lang)}
                      </span>
                      <div className="flex gap-1">
                        {bk.karakas.map((p) => (
                          <span key={p}
                            style={{ fontSize:10, color: PLANET_META[p]?.color || '#D4AF37', fontWeight:700 }}>
                            {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
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
                            {meta.icon} {planetName(kp.planet, lang)}
                          </span>
                          <span style={{ fontSize:9, color: qualityColor }}>
                            {houseLabel(kp.house, lang)} · {lang === 'hi' ? localizeAstroText(kp.rashi_en, lang) : kp.rashi_en}
                            {kp.placement_quality !== 'other' && (
                              <span style={{ marginLeft:4, opacity:0.7 }}>
                                ({lang === 'hi' ? localizeAstroText(kp.placement_quality, lang) : kp.placement_quality})
                              </span>
                            )}
                            {kp.is_in_own_karak_house && (
                              <span style={{ marginLeft:3, color:'#F59E0B' }} title="Karako Bhava Nashaya">⚠</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                    <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
                      <p className="text-emerald-300/78 text-[10px] leading-relaxed font-devanagari">
                        {t(lang, 'Benefit:', 'लाभ:')} {lang === 'hi' ? bk.benefit_hi : bk.benefit_en}
                      </p>
                      <p className="text-amber-200/78 text-[10px] leading-relaxed font-devanagari">
                        {t(lang, 'Danger:', 'सावधानी:')} {lang === 'hi' ? bk.danger_hi : bk.danger_en}
                      </p>
                      <p className="text-violet-200/78 text-[10px] leading-relaxed font-devanagari">
                        {t(lang, 'Remedy:', 'उपाय:')} {lang === 'hi' ? bk.remedy_hi : bk.remedy_en}
                      </p>
                    </div>
                  </div>
              ))}
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

            {chart.drishti.by_house_detail && (
              <div className="mb-5">
                <h3 className="text-gold/70 text-[10px] uppercase tracking-widest mb-2">
                  {lang==='hi' ? 'साधारण भाषा में प्रभाव' : 'Plain-Language Effects'}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Object.values(chart.drishti.by_house_detail).map((item) => (
                    <DrishtiHouseCard key={item.house} item={item} lang={lang}
                      t={t} houseLabel={houseLabel} planetName={planetName} PLANET_META={PLANET_META} />
                  ))}
                </div>
              </div>
            )}

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
                      <span className="text-ivory text-xs font-semibold font-devanagari">{planetName(planet, lang)}</span>
                      <span className="text-ivory/30 text-[9px]">{houseLabel(info.from_house, lang)}</span>
                      {hasSpecial && (
                        <span style={{ fontSize:8, padding:'1px 5px', borderRadius:8, background:'rgba(212,175,55,0.15)', color:'#D4AF37', marginLeft:'auto' }}>
                          {t(lang, 'Special', 'विशेष')}
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
                            {houseLabel(house, lang)} ({lang === 'hi' ? `${offset}वीं` : `${offset}th`})
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
                  <p className="text-[9px] text-ivory/35 uppercase tracking-wider mb-1">{houseLabel(house, lang)}</p>
                  {planets.length ? (
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {planets.map((p) => (
                        <span key={p} style={{ fontSize:9, color: PLANET_META[p]?.color || '#D4AF37', fontWeight:700 }}>
                          {planetName(p, lang).slice(0,2)}
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

        {/* ── Yogas & Doshas ──────────────────────────────────────────────── */}
        {chart?.yogas_doshas && (
          <YogasAndDoshasPanel chart={chart} lang={lang} />
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
            <Link href={predictionHref(kundli?.uuid || uuid)} className="btn-gold text-xs px-5 py-2 font-semibold">
              💫 {lang==='hi'?'भविष्यवाणी':'Predictions'}
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
