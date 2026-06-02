'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KundliDetail({ uuid }) {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const router   = useRouter();

  const [kundli,    setKundli]    = useState(null);
  const [error,     setError]     = useState(null);
  const [fetching,  setFetching]  = useState(true);
  const [recalcing, setRecalcing] = useState(false);
  const [chartStyle, setChartStyle] = useState('south'); // 'south' | 'north'

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
      .then(({ data }) => setKundli(data.profile))
      .catch(e => setError(e.response?.data?.message || 'Could not load Kundli'))
      .finally(() => setFetching(false));
  }, [user, uuid]);

  useEffect(fetchKundli, [fetchKundli]);

  const handleRecalc = async () => {
    setRecalcing(true);
    try {
      const { data } = await api.post(`/kundli/${uuid}/recalculate`);
      setKundli(data.profile);
    } catch {}
    finally { setRecalcing(false); }
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
          <button onClick={handleRecalc} disabled={recalcing}
            className="btn-outline-gold text-xs px-4 py-2 shrink-0">
            {recalcing ? '⏳ Recalculating…' : '🔄 Recalculate'}
          </button>
        </motion.div>

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

            {/* Birth details */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
              className="card-royal p-5">
              <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                📋 {lang==='hi'?'जन्म विवरण':'Birth Details'}
              </h2>
              <div className="space-y-3">
                {[
                  [lang==='hi'?'जन्म तिथि':'Date',   dob],
                  [lang==='hi'?'समय':'Time',          `${kundli.time_of_birth?.slice(0,5)} (UTC+${kundli.timezone_offset})`],
                  [lang==='hi'?'स्थान':'Place',        kundli.place_of_birth],
                  [lang==='hi'?'अक्षांश/देशांतर':'Coordinates', `${kundli.latitude}°N / ${kundli.longitude}°E`],
                  ...(chart ? [[lang==='hi'?'अयनांश':'Ayanamsa', `${chart.meta.ayanamsa_dms} (Lahiri)`]] : []),
                ].map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-0.5 border-b border-gold/8 pb-2 last:border-0 last:pb-0">
                    <span className="text-ivory/35 text-[10px] uppercase tracking-widest">{l}</span>
                    <span className="text-ivory text-sm font-devanagari">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
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
          </div>
        </div>

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
