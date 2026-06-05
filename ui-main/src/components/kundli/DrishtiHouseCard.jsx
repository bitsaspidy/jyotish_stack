'use client';
import { useState } from 'react';
import { t, houseLabel, planetName } from '../../lib/astroI18n';
import { PLANET_META, LIFE_AREA_ICONS, ASPECT_NATURE_COLOR } from './kundliConstants';

// ─── Single life-area expandable row ─────────────────────────────────────────

export function DrishtiAreaRow({ area, lang, pColor }) {
  const [open, setOpen] = useState(false);
  const icon = LIFE_AREA_ICONS[area.key] || '•';
  const text = lang === 'hi' ? (area.text_hi || area.text_en) : area.text_en;

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
      <button onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', padding:'9px 12px', display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer', background:'transparent',
          border:'none', textAlign:'left',
        }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>{icon}</span>
          <span style={{ color: open ? pColor : 'rgba(245,240,232,0.7)', fontSize:11, fontWeight:600,
            fontFamily:'var(--font-devanagari,Georgia),sans-serif' }}>
            {lang === 'hi' ? (area.heading_hi || area.heading_en) : area.heading_en}
          </span>
        </div>
        <span style={{ color: open ? pColor : 'rgba(245,240,232,0.68)', fontSize:10 }}>
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

// ─── Drishti House Card ───────────────────────────────────────────────────────

export default function DrishtiHouseCard({ item, lang }) {
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
      border:`1px solid ${hasAspects ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius:10, padding:'12px 14px',
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
        {lang === 'hi' ? (item.plain_effect_hi || item.plain_effect_en) : item.plain_effect_en}
      </p>

      {/* Benefit / Watch */}
      <div className="grid grid-cols-1 gap-1 mb-2">
        <p className="text-emerald-300/76 text-[10px] leading-relaxed font-devanagari">
          ✓ {lang === 'hi' ? (item.benefit_hi || item.benefit_en) : item.benefit_en}
        </p>
        <p className="text-amber-200/76 text-[10px] leading-relaxed font-devanagari">
          ⚠ {lang === 'hi' ? (item.watch_hi || item.watch_en) : item.watch_en}
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

      {/* Life Area Impact expand button */}
      {hasImpacts && (
        <>
          <button onClick={() => setExpanded(v => !v)}
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
              {/* Aspecting planet tabs */}
              {impacts.length > 1 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  {impacts.map((imp, idx) => (
                    <button key={imp.aspecting_planet} onClick={() => setActiveImpact(idx)} style={{
                      padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:600,
                      background: idx === activeImpact ? `${PLANET_META[imp.aspecting_planet]?.color || '#A78BFA'}22` : 'rgba(255,255,255,0.05)',
                      color: idx === activeImpact ? (PLANET_META[imp.aspecting_planet]?.color || '#A78BFA') : 'rgba(245,240,232,0.4)',
                      border:`1px solid ${idx === activeImpact ? (PLANET_META[imp.aspecting_planet]?.color || '#A78BFA') + '44' : 'transparent'}`,
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
                    <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:10, background:`${pColor}0E`, border:`1px solid ${pColor}30` }}>
                      <p style={{ color:pColor, fontSize:11, fontWeight:700, fontFamily:'Georgia,serif' }}>
                        {t(lang,
                          `${imp.aspecting_planet}'s ${imp.aspect_nature} aspect on ${imp.occupants.join(' + ')} in House ${imp.house}`,
                          `${imp.aspecting_planet} की ${imp.aspect_nature === 'karmic' ? 'कर्मिक' : imp.aspect_nature === 'auspicious' ? 'शुभ' : imp.aspect_nature === 'aggressive' ? 'तीव्र' : imp.aspect_nature === 'restricting' ? 'गंभीर' : 'सामान्य'} दृष्टि — भाव ${imp.house} में ${imp.occupants.join(' + ')} पर`
                        )}
                      </p>
                      <p style={{ color:'rgba(245,240,232,0.45)', fontSize:10, marginTop:3 }}>
                        {t(lang, 'How this aspect shapes 7 life areas for you personally:', 'यह दृष्टि आपके लिए 7 जीवन क्षेत्रों को कैसे प्रभावित करती है:')}
                      </p>
                    </div>
                    <div style={{ display:'grid', gap:6 }}>
                      {imp.life_areas.map((area) => (
                        <DrishtiAreaRow key={area.key} area={area} lang={lang} pColor={pColor} />
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
