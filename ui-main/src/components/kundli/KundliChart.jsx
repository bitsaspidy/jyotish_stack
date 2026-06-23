'use client';
import { useState } from 'react';
import { t, planetName } from '../../lib/astroI18n';
import { PLANET_META, RASHI_SHORT_EN, RASHI_SHORT_HI, SI_GRID } from './kundliConstants';

// ─── Upagraha computation (Parashari BPHS formulae) ──────────────────────────

const UPAGRAHA_META = [
  { slug:'dhuma',      abbr_en:'Dh', abbr_hi:'धू',  color:'#FF8C42' },
  { slug:'vyatipata',  abbr_en:'Vy', abbr_hi:'व्य', color:'#FF8C42' },
  { slug:'parivesha',  abbr_en:'Pa', abbr_hi:'पा',   color:'#7FC97F' },
  { slug:'indrachapa', abbr_en:'Ic', abbr_hi:'इच',  color:'#7FC97F' },
  { slug:'upaketu',    abbr_en:'Uk', abbr_hi:'उक',  color:'#FF8C42' },
];

function computeUpagrahasForChart(sunLon, ascRashiNum) {
  const mod360 = v => ((v % 360) + 360) % 360;
  const dhuma      = mod360(sunLon + 133 + 20 / 60);
  const vyatipata  = mod360(360 - dhuma);
  const parivesha  = mod360(vyatipata + 180);
  const indrachapa = mod360(360 - parivesha);
  const upaketu    = mod360(indrachapa + 16 + 40 / 60);
  const lons = [dhuma, vyatipata, parivesha, indrachapa, upaketu];
  return UPAGRAHA_META.map((meta, i) => {
    const rashiNum = Math.floor(lons[i] / 30) + 1;
    const house    = ((rashiNum - ascRashiNum + 12) % 12) + 1;
    return { ...meta, rashiNum, house };
  });
}

// ─── Shared chart cell ────────────────────────────────────────────────────────

export function ChartCell({ highlight, dimBorder, children, extraStyle = {} }) {
  return (
    <div style={{
      aspectRatio:'1', position:'relative', overflow:'hidden',
      padding:'5px 4px',
      background: highlight ? 'rgba(212,175,55,0.20)' : 'rgba(255,255,255,0.07)',
      border: `1px solid ${highlight ? 'rgba(212,175,55,0.60)' : (dimBorder ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.22)')}`,
      borderRadius:4,
      display:'flex', flexDirection:'column',
      ...extraStyle,
    }}>
      {highlight && (
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(212,175,55,0.30)" strokeWidth="1"/>
        </svg>
      )}
      {children}
    </div>
  );
}

export function EmptyCell() {
  return (
    <div style={{
      aspectRatio:'1',
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(212,175,55,0.08)',
      borderRadius:3,
    }} />
  );
}

export function PlanetTokens({ names, lang = 'en' }) {
  if (!names.length) return null;
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:1, marginTop:'auto' }}>
      {names.map(p => (
        <span key={p} style={{
          fontSize:8, color: PLANET_META[p]?.color || '#D4AF37',
          fontWeight:700, lineHeight:1,
          textShadow:'0 0 4px rgba(0,0,0,0.8)',
        }}>
          {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
        </span>
      ))}
    </div>
  );
}

// ─── South Indian Chart ───────────────────────────────────────────────────────

export function SouthIndianChart({ chart, lang }) {
  const [showUG, setShowUG] = useState(false);

  if (!chart) return <p style={{ color:'rgba(245,240,232,0.5)', fontSize:12, textAlign:'center', padding:24 }}>{t(lang, 'Calculating chart…', 'कुंडली बन रही है…')}</p>;

  const ascSign = chart.ascendant?.rashi_num || 1;
  const sunLon  = chart.planets?.Sun?.longitude;

  const ugByRashi = {};
  if (showUG && sunLon != null) {
    for (const u of computeUpagrahasForChart(sunLon, ascSign)) {
      (ugByRashi[u.rashiNum] ??= []).push(u);
    }
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
        {SI_GRID.map((signNum, i) => {
          if (signNum === 0) return <EmptyCell key={i} />;

          const isAsc   = signNum === ascSign;
          const houseNum = ((signNum - ascSign + 12) % 12) + 1;
          const planetsIn = Object.entries(chart.planets || {})
            .filter(([,pd]) => pd.rashi_num === signNum)
            .map(([name]) => name);
          const ugHere = ugByRashi[signNum] || [];

          return (
            <ChartCell key={i} highlight={isAsc}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{
                  color: isAsc ? '#F0D060' : 'rgba(245,240,232,0.90)',
                  fontSize:9, fontWeight:700, lineHeight:1,
                  textShadow:'0 1px 3px rgba(0,0,0,0.7)',
                }}>
                  {lang==='hi' ? RASHI_SHORT_HI[signNum] : RASHI_SHORT_EN[signNum]}
                </span>
                <span style={{
                  color: isAsc ? '#F0D060' : 'rgba(212,175,55,0.85)',
                  fontSize:8, fontWeight:700, lineHeight:1,
                  textShadow:'0 1px 3px rgba(0,0,0,0.7)',
                }}>
                  {isAsc ? '↑' : houseNum}
                </span>
              </div>
              <PlanetTokens names={planetsIn} lang={lang} />
              {ugHere.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:1, marginTop:2, borderTop:'1px solid rgba(255,140,66,0.18)', paddingTop:2 }}>
                  {ugHere.map(u => (
                    <span key={u.slug} style={{
                      fontSize:7, color:u.color, fontWeight:700, lineHeight:1,
                      textShadow:'0 0 4px rgba(0,0,0,0.9)',
                    }}>
                      {lang==='hi' ? u.abbr_hi : u.abbr_en}
                    </span>
                  ))}
                </div>
              )}
            </ChartCell>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
        <p style={{ color:'rgba(245,240,232,0.50)', fontSize:10 }}>
          {t(lang, '↑ = Lagna · Signs fixed · Houses float', '↑ = लग्न · राशियां स्थिर · भाव चलते हैं')}
        </p>
        {sunLon != null && (
          <button onClick={() => setShowUG(v => !v)} style={{
            fontSize:9, fontWeight:600, cursor:'pointer', padding:'3px 9px', borderRadius:12,
            border:`1px solid ${showUG ? '#FF8C42' : 'rgba(255,140,66,0.25)'}`,
            background: showUG ? 'rgba(255,140,66,0.12)' : 'transparent',
            color: showUG ? '#FF8C42' : 'rgba(255,140,66,0.4)',
            transition:'all 0.2s',
          }}>
            🪐 {t(lang, 'Upagrahas', 'उपग्रह')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── North Indian Chart (SVG — geometrically accurate) ───────────────────────

export function NorthIndianChart({ chart, lang }) {
  const [showUG, setShowUG] = useState(false);

  if (!chart) {
    return <p style={{ color:'rgba(245,240,232,0.68)', fontSize:12, textAlign:'center', padding:24 }}>{t(lang, 'Calculating chart…', 'कुंडली बन रही है…')}</p>;
  }

  const S = 300;
  const TL=[0,0], TR=[S,0], BR=[S,S], BL=[0,S];
  const T=[S/2,0], R=[S,S/2], B=[S/2,S], L=[0,S/2];
  const O=[S/2,S/2];
  const MTL=[S/4,S/4], MTR=[3*S/4,S/4], MBR=[3*S/4,3*S/4], MBL=[S/4,3*S/4];

  const HOUSES = [
    { h:1,  v:[T,   MTL, O,   MTR] },
    { h:2,  v:[TL,  T,   MTL]       },
    { h:3,  v:[TL,  L,   MTL]       },
    { h:4,  v:[L,   MTL, O,   MBL]  },
    { h:5,  v:[BL,  L,   MBL]       },
    { h:6,  v:[BL,  B,   MBL]       },
    { h:7,  v:[B,   MBL, O,   MBR]  },
    { h:8,  v:[BR,  B,   MBR]       },
    { h:9,  v:[BR,  R,   MBR]       },
    { h:10, v:[R,   MTR, O,   MBR]  },
    { h:11, v:[TR,  R,   MTR]       },
    { h:12, v:[TR,  T,   MTR]       },
  ];

  const pStr = (verts) => verts.map(([x,y]) => `${x},${y}`).join(' ');
  const cx = (verts) => verts.reduce((s,[x]) => s+x, 0) / verts.length;
  const cy = (verts) => verts.reduce((s,[,y]) => s+y, 0) / verts.length;

  const ascRashiNum = chart.ascendant?.rashi_num || 1;
  const sunLon      = chart.planets?.Sun?.longitude;

  const ugByHouse = {};
  if (showUG && sunLon != null) {
    for (const u of computeUpagrahasForChart(sunLon, ascRashiNum)) {
      (ugByHouse[u.house] ??= []).push(u);
    }
  }

  return (
    <div>
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 320, display:'block', margin:'0 auto' }}>
        <defs>
          <filter id="ni-text-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="rgba(0,0,0,0.95)" floodOpacity="1"/>
          </filter>
          <filter id="ni-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="rgba(0,0,0,0.85)" floodOpacity="1"/>
          </filter>
        </defs>

        <rect width={S} height={S} fill="rgba(18,22,50,0.60)" rx="3" />

        {HOUSES.map(({ h, v }) => {
          const houseData = chart.houses?.[h] || {};
          const signNum   = houseData.rashi_num || 0;
          const planetsIn = houseData.planets   || [];
          const isLagna   = h === 1;
          const pcx = cx(v), pcy = cy(v);
          const isKendra  = [1,4,7,10].includes(h);

          const planetStr = planetsIn.slice(0,4)
            .map(p => (PLANET_META[p]?.icon || '') + planetName(p, lang).slice(0,2))
            .join(' ');

          const ugHere = ugByHouse[h] || [];
          const ugStr  = ugHere.map(u => lang==='hi' ? u.abbr_hi : u.abbr_en).join(' ');

          // Compute y offsets based on how many text rows are rendered
          const hasPlanets = planetsIn.length > 0;
          const hasUg      = ugHere.length > 0;
          const baseOffset = isKendra ? 10 : 6;
          const signY      = pcy + (isKendra ? 5 : 4);
          const planetsY   = pcy + (isKendra ? 18 : 15);
          const ugY        = hasPlanets ? planetsY + (isKendra ? 10 : 9) : planetsY;

          return (
            <g key={h}>
              <polygon
                points={pStr(v)}
                fill={isLagna ? 'rgba(212,175,55,0.22)' : isKendra ? 'rgba(61,53,128,0.32)' : 'rgba(255,255,255,0.055)'}
                stroke={isLagna ? 'rgba(212,175,55,0.85)' : 'rgba(212,175,55,0.42)'}
                strokeWidth={isLagna ? 1.5 : 1}
              />
              {isLagna && (
                <>
                  <line x1={v[0][0]} y1={v[0][1]} x2={v[2][0]} y2={v[2][1]} stroke="rgba(212,175,55,0.25)" strokeWidth="1" />
                  <line x1={v[1][0]} y1={v[1][1]} x2={v[3][0]} y2={v[3][1]} stroke="rgba(212,175,55,0.25)" strokeWidth="1" />
                </>
              )}
              <text x={pcx} y={pcy - baseOffset} textAnchor="middle"
                fill={isLagna ? '#FFE566' : '#D4AF37'}
                fontSize={isLagna ? 12 : isKendra ? 9 : 8.5}
                fontWeight="bold" fontFamily="Inter,sans-serif" filter="url(#ni-glow)">
                {isLagna ? 'L' : h}
              </text>
              {signNum > 0 && (
                <text x={pcx} y={signY} textAnchor="middle"
                  fill={isLagna ? '#FFFFFF' : 'rgba(245,240,232,0.95)'}
                  fontSize={isKendra ? 9.5 : 8}
                  fontFamily="'Noto Sans Devanagari',Inter,sans-serif" filter="url(#ni-text-shadow)">
                  {lang === 'hi' ? RASHI_SHORT_HI[signNum] : RASHI_SHORT_EN[signNum]}
                </text>
              )}
              {hasPlanets && (
                <text x={pcx} y={planetsY} textAnchor="middle"
                  fill="rgba(245,240,232,0.98)"
                  fontSize={isKendra ? 8.5 : 7.5}
                  fontFamily="Inter,sans-serif" filter="url(#ni-text-shadow)">
                  {planetStr}
                </text>
              )}
              {hasUg && (
                <text x={pcx} y={ugY} textAnchor="middle"
                  fill="#FF8C42"
                  fontSize={isKendra ? 7.5 : 6.5}
                  fontWeight="bold" fontFamily="'Noto Sans Devanagari',Inter,sans-serif" filter="url(#ni-text-shadow)"
                  opacity="0.90">
                  {ugStr}
                </text>
              )}
            </g>
          );
        })}

        <rect width={S} height={S} fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="1.5" rx="2" />
      </svg>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
        <p style={{ color:'rgba(245,240,232,0.52)', fontSize:10 }}>
          {t(lang, 'L = Lagna (H1) · Houses fixed · Signs float · H1/4/7/10 = Kendra', 'L = लग्न (भाव 1) · भाव स्थिर · राशियां चलती हैं · भाव 1/4/7/10 = केंद्र')}
        </p>
        {sunLon != null && (
          <button onClick={() => setShowUG(v => !v)} style={{
            fontSize:9, fontWeight:600, cursor:'pointer', padding:'3px 9px', borderRadius:12,
            border:`1px solid ${showUG ? '#FF8C42' : 'rgba(255,140,66,0.25)'}`,
            background: showUG ? 'rgba(255,140,66,0.12)' : 'transparent',
            color: showUG ? '#FF8C42' : 'rgba(255,140,66,0.4)',
            transition:'all 0.2s',
          }}>
            🪐 {t(lang, 'Upagrahas', 'उपग्रह')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Chart Style Toggle ───────────────────────────────────────────────────────

export function ChartToggle({ style, onChange, lang }) {
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
