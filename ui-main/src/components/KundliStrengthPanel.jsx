'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { t } from '../lib/astroI18n';        // dictionary-backed (regional-aware) inline labels
import { pickLang } from '../lib/reportI18n'; // picks server humanizer regional fields

const PLANET_META = {
  Sun:     { icon:'☉', color:'#FBBF24', hi:'सूर्य'    },
  Moon:    { icon:'☽', color:'#94A3B8', hi:'चन्द्र'   },
  Mars:    { icon:'♂', color:'#EF4444', hi:'मंगल'      },
  Mercury: { icon:'☿', color:'#10B981', hi:'बुध'       },
  Jupiter: { icon:'♃', color:'#F97316', hi:'बृहस्पति' },
  Venus:   { icon:'♀', color:'#F472B6', hi:'शुक्र'     },
  Saturn:  { icon:'♄', color:'#818CF8', hi:'शनि'       },
  Rahu:    { icon:'☊', color:'#A78BFA', hi:'राहु'      },
  Ketu:    { icon:'☋', color:'#6B7280', hi:'केतु'      },
};

const PLANET_NAMES = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

function sc(s) {
  if (s >= 75) return '#10B981';
  if (s >= 60) return '#22C55E';
  if (s >= 48) return '#F59E0B';
  if (s >= 35) return '#F97316';
  return '#EF4444';
}

function ScoreBar({ val, maxVal = 100, height = 6 }) {
  const pct = Math.min(100, Math.round((val / maxVal) * 100));
  const color = sc(val);
  return (
    <div style={{ height, background:'rgba(255,255,255,0.08)', borderRadius:height, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:height }} />
    </div>
  );
}

function ScoreMeter({ score, label, lang }) {
  const color = label?.color || sc(score);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flexShrink:0 }}>
      <div style={{ position:'relative', width:112, height:112 }}>
        <div style={{
          width:112, height:112, borderRadius:'50%',
          background:`conic-gradient(${color} ${score}%, rgba(255,255,255,0.07) ${score}%)`,
        }} />
        <div style={{
          position:'absolute', top:10, left:10, width:92, height:92,
          borderRadius:'50%', background:'#0a0c1c',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ fontSize:28, fontWeight:900, color:'#F1F5F9', lineHeight:1 }}>{score}</span>
          <span style={{ fontSize:10, color:'#475569', lineHeight:1.2 }}>/100</span>
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, fontWeight:700, color }}>{t(lang, label?.en, label?.hi)}</div>
        <div style={{ fontSize:10, color:'#475569' }}>{t(lang,'Overall Kundli','समग्र कुंडली')}</div>
      </div>
    </div>
  );
}

function Heading({ children }) {
  return (
    <h4 style={{
      fontSize:11, fontWeight:700, color:'#D4AF37', textTransform:'uppercase',
      letterSpacing:'0.12em', margin:'0 0 12px',
      borderBottom:'1px solid rgba(212,175,55,0.13)', paddingBottom:7,
    }}>
      {children}
    </h4>
  );
}

function CatBar({ icon, label, val }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontSize:11, color:'#CBD5E1' }}>{icon} {label}</span>
        <span style={{ fontSize:12, fontWeight:700, color:sc(val) }}>{val}<span style={{ fontSize:9, color:'#475569' }}>/100</span></span>
      </div>
      <ScoreBar val={val} />
    </div>
  );
}

function DomainGrid({ domains, lang }) {
  if (!domains?.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:8 }}>
      {domains.map((d) => {
        if (!d) return null;
        const color = d.label?.color || '#F59E0B';
        return (
          <div key={d.key} style={{
            padding:'10px 13px', background:'rgba(255,255,255,0.025)',
            border:`1px solid ${color}25`, borderRadius:10,
          }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#E2E8F0', marginBottom:5 }}>
              {t(lang, d.en, d.hi)}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <span style={{ fontSize:18, fontWeight:800, color, lineHeight:1 }}>{d.score}</span>
              <span style={{ fontSize:9, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', background:`${color}18`, padding:'2px 7px', borderRadius:8 }}>
                {t(lang, d.label?.en, d.label?.hi)}
              </span>
            </div>
            <ScoreBar val={d.score} />
          </div>
        );
      })}
    </div>
  );
}

function PlanetTable({ scores, natalPlanets, lang }) {
  if (!scores) return null;
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {[
              t(lang,'Planet','ग्रह'), t(lang,'Dignity','स्थिति'),
              t(lang,'House','भाव'),   t(lang,'Strength','बल'), '',
            ].map((h, i) => (
              <th key={i} style={{
                padding:'5px 10px', textAlign:'left', color:'#475569',
                fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', fontSize:9, whiteSpace:'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLANET_NAMES.map((name) => {
            const pd  = natalPlanets?.[name];
            const val = scores[name] || 50;
            const pm  = PLANET_META[name] || { icon:'●', color:'#94A3B8', hi:name };
            const color     = sc(val);
            const dignity   = pd?.dignity?.split('(')[0].trim() || '—';
            const dignityHi = pd?.dignity?.match(/\(([^)]+)\)/)?.[1] || dignity;
            const label = val >= 72 ? t(lang,'Strong','प्रबल')
                        : val >= 52 ? t(lang,'Moderate','मध्यम')
                        :             t(lang,'Lower','सहयोग लें');
            return (
              <tr key={name} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding:'9px 10px', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:15, color:pm.color, marginRight:6 }}>{pm.icon}</span>
                  <span style={{ color:'#E2E8F0', fontWeight:600 }}>{t(lang, name, pm.hi)}</span>
                  {pd?.is_retrograde && <span style={{ color:'#F59E0B', fontSize:10, marginLeft:4 }}>℞</span>}
                </td>
                <td style={{ padding:'9px 10px', color:'#94A3B8', fontSize:10, maxWidth:110 }}>
                  {t(lang, dignity, dignityHi)}
                </td>
                <td style={{ padding:'9px 10px', color:'#CBD5E1', fontWeight:700, whiteSpace:'nowrap' }}>
                  {pd?.house ? `H${pd.house}` : '—'}
                </td>
                <td style={{ padding:'9px 10px', minWidth:100 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:800, color, minWidth:26 }}>{val}</span>
                    <div style={{ flex:1, minWidth:50 }}><ScoreBar val={val} /></div>
                  </div>
                </td>
                <td style={{ padding:'9px 10px', whiteSpace:'nowrap' }}>
                  <span style={{
                    fontSize:9, fontWeight:700, color, textTransform:'uppercase',
                    padding:'2px 8px', background:`${color}18`, border:`1px solid ${color}35`, borderRadius:8,
                  }}>{label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Friendly view components ─────────────────────────────────────────────────

function FriendlyScoreCard({ card, lang }) {
  const color = sc(card.score);
  return (
    <div style={{
      padding:'12px 14px', background:'rgba(255,255,255,0.025)',
      border:`1px solid ${color}22`, borderRadius:10, flex:'1 1 140px',
    }}>
      <div style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
        {pickLang(card, 'title', lang)}
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:6 }}>
        <span style={{ fontSize:22, fontWeight:900, color, lineHeight:1 }}>{card.score}</span>
        <span style={{ fontSize:10, color:'#475569' }}>/100</span>
      </div>
      <ScoreBar val={card.score} height={4} />
      <p style={{ fontSize:11, color:'rgba(245,240,232,0.65)', lineHeight:1.6, margin:'8px 0 0' }}>
        {pickLang(card, 'simpleMeaning', lang)}
      </p>
    </div>
  );
}

function FriendlyStrengthItem({ item, lang, type }) {
  const color  = type === 'strength' ? '#10B981' : '#F59E0B';
  const bg     = type === 'strength' ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)';
  const border = type === 'strength' ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)';
  const icon   = type === 'strength' ? '✦' : '◈';
  const pm     = PLANET_META[item.planet] || { icon:'●', color:'#94A3B8', hi: item.planet };
  return (
    <div style={{ display:'flex', gap:10, padding:'10px 12px', background:bg, border:`1px solid ${border}`, borderRadius:9, marginBottom:8 }}>
      <span style={{ color:pm.color, fontSize:18, flexShrink:0 }}>{pm.icon}</span>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:pm.color, marginBottom:3 }}>
          {pickLang(item, 'planetName', lang) || t(lang, item.planet, item.planetHi)}
        </div>
        <p style={{ fontSize:11, color:'rgba(245,240,232,0.72)', lineHeight:1.7, margin:0 }}>
          {pickLang(item, 'simpleMeaning', lang)}
        </p>
      </div>
      <span style={{ fontSize:9, fontWeight:700, color, marginLeft:'auto', flexShrink:0, alignSelf:'flex-start', padding:'2px 6px', background:`${color}15`, borderRadius:6 }}>
        {item.score}
      </span>
    </div>
  );
}

function FriendlyDomainCard({ d, lang }) {
  return (
    <div style={{
      padding:'12px 14px', background:'rgba(255,255,255,0.025)',
      border:`1px solid ${d.color}22`, borderRadius:10,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#E2E8F0' }}>
          {pickLang(d, 'title', lang)}
        </div>
        <span style={{
          fontSize:9, fontWeight:700, color:d.color,
          textTransform:'uppercase', letterSpacing:'0.05em',
          background:`${d.color}18`, padding:'2px 7px', borderRadius:8, flexShrink:0, marginLeft:6,
        }}>
          {pickLang(d, 'label', lang)}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ fontSize:16, fontWeight:800, color:d.color, lineHeight:1 }}>{d.score}</span>
        <div style={{ flex:1 }}><ScoreBar val={d.score} height={4} /></div>
      </div>
      <p style={{ fontSize:11, color:'rgba(245,240,232,0.6)', lineHeight:1.6, margin:0 }}>
        {pickLang(d, 'simpleMeaning', lang)}
      </p>
    </div>
  );
}

function DashaSummaryCard({ dasha, lang }) {
  if (!dasha) return null;
  const mahaM  = PLANET_META[dasha.mahaLord]  || { icon:'●', color:'#D4AF37', hi: dasha.mahaLord  };
  const antarM = dasha.antarLord ? (PLANET_META[dasha.antarLord] || { icon:'●', color:'#A78BFA', hi: dasha.antarLord }) : null;
  const supportColor = dasha.supportLevel === 'strong' ? '#10B981' : dasha.supportLevel === 'balanced' ? '#F59E0B' : '#F97316';
  const supportLabel = dasha.supportLevel === 'strong'
    ? t(lang, 'Favorable', 'अनुकूल')
    : dasha.supportLevel === 'balanced'
    ? t(lang, 'Balanced', 'संतुलित')
    : t(lang, 'Needs patience', 'धैर्य जरूरी');

  return (
    <div style={{ padding:'16px', background:'rgba(255,255,255,0.025)', border:`1px solid ${supportColor}22`, borderRadius:12 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:22, color:mahaM.color }}>{mahaM.icon}</span>
          <div>
            <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {t(lang,'Mahadasha','महादशा')}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:mahaM.color }}>
              {pickLang(dasha, 'mahaLord', lang) || t(lang, dasha.mahaLord, dasha.mahaLordHi)}
            </div>
            {dasha.mahaEndDate && <div style={{ fontSize:9, color:'#475569' }}>{t(lang,'Until','तक')} {dasha.mahaEndDate}</div>}
          </div>
        </div>
        {antarM && (
          <>
            <span style={{ color:'#334155', fontSize:16 }}>→</span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:22, color:antarM.color }}>{antarM.icon}</span>
              <div>
                <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  {t(lang,'Antardasha','अंतर्दशा')}
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:antarM.color }}>
                  {pickLang(dasha, 'antarLord', lang) || t(lang, dasha.antarLord, dasha.antarLordHi)}
                </div>
                {dasha.antarEndDate && <div style={{ fontSize:9, color:'#475569' }}>{t(lang,'Until','तक')} {dasha.antarEndDate}</div>}
              </div>
            </div>
          </>
        )}
        <span style={{
          marginLeft:'auto', fontSize:10, fontWeight:700, color:supportColor,
          background:`${supportColor}18`, padding:'4px 10px', borderRadius:8, border:`1px solid ${supportColor}30`,
        }}>
          {supportLabel}
        </span>
      </div>
      <p style={{ fontSize:12, color:'rgba(245,240,232,0.78)', lineHeight:1.8, margin:'0 0 8px' }}>
        {pickLang(dasha, 'simpleMeaning', lang)}
      </p>
      <p style={{ fontSize:11, color:'rgba(245,240,232,0.5)', lineHeight:1.6, margin:0, fontStyle:'italic' }}>
        → {pickLang(dasha, 'advice', lang)}
      </p>
    </div>
  );
}

// Collapsible technical details accordion
function TechnicalAccordion({ st, natalPlanets, lang, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'none', cursor:'pointer',
        }}
      >
        <span style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          {t(lang,'View technical details','तकनीकी विवरण देखें')}
        </span>
        <span style={{ fontSize:12, color:'#475569' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding:'16px', background:'rgba(10,12,28,0.4)', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          {/* Score breakdown */}
          <div style={{ marginBottom:16 }}>
            <Heading>⚙ {t(lang,'Score Breakdown','स्कोर विवरण')}</Heading>
            <CatBar icon="🪐" label={t(lang,'Planet Strengths','ग्रह बल')}   val={st.planet_avg}  />
            <CatBar icon="✦"  label={t(lang,'Yoga & Dosha','योग और दोष')}    val={st.yoga_score}  />
            <CatBar icon="🌐" label={t(lang,'Life Domains','जीवन क्षेत्र')} val={st.domain_avg}  />
            <CatBar icon="🔮" label={t(lang,'Current Dasha','वर्तमान दशा')} val={st.dasha_score} />
            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <div style={{ padding:'6px 12px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.22)', borderRadius:8, textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#22C55E' }}>{st.yoga_count}</div>
                <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang,'Good Yogas','शुभ योग')}</div>
              </div>
              <div style={{ padding:'6px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:8, textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#EF4444' }}>{st.dosha_count}</div>
                <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang,'Doshas','दोष')}</div>
              </div>
            </div>
          </div>
          {/* Verdict */}
          <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, marginBottom:16 }}>
            <p style={{ fontSize:11, color:'rgba(245,240,232,0.7)', lineHeight:1.8, margin:0 }}>
              {t(lang, st.verdict_en, st.verdict_hi)}
            </p>
          </div>
          {/* Planet table */}
          <div style={{ marginBottom:16 }}>
            <Heading>{t(lang,'Planet-by-Planet Strength','ग्रह-दर-ग्रह बल')}</Heading>
            <PlanetTable scores={st.planet_scores} natalPlanets={natalPlanets} lang={lang} />
          </div>
          {/* Life domains */}
          <div>
            <Heading>{t(lang,'Life Domain Analysis','जीवन क्षेत्र विश्लेषण')}</Heading>
            <DomainGrid domains={st.life_domain_list} lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Friendly mode full render ─────────────────────────────────────────────────
function FriendlyView({ sf, st, natalPlanets, lang, admin, onToggleTech }) {
  const color = sf.overall?.color || '#D4AF37';
  return (
    <div style={{ background:'rgba(10,12,28,0.5)', padding:'0 20px 24px' }}>

      {/* Admin toggle */}
      {admin && (
        <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:14, marginBottom:4 }}>
          <button onClick={onToggleTech} style={{
            fontSize:11, color:'#64748B', background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'5px 12px', cursor:'pointer',
          }}>
            {t(lang,'⚙ Technical view','⚙ तकनीकी दृश्य')}
          </button>
        </div>
      )}

      {/* Overall meaning card */}
      <div style={{ paddingTop: admin ? 8 : 20, marginBottom:20 }}>
        <div style={{ padding:'16px', background:`${color}08`, border:`1px solid ${color}22`, borderRadius:12 }}>
          <p style={{ fontSize:13, color:'rgba(245,240,232,0.88)', lineHeight:1.9, margin:'0 0 8px' }}>
            {pickLang(sf.overall, 'simpleMeaning', lang)}
          </p>
          <p style={{ fontSize:11, color:'rgba(245,240,232,0.5)', fontStyle:'italic', margin:0 }}>
            → {pickLang(sf.overall, 'advice', lang)}
          </p>
        </div>
      </div>

      {/* Score breakdown cards */}
      <div style={{ marginBottom:20 }}>
        <Heading>📊 {t(lang,'Your Four Pillars','आपके चार स्तंभ')}</Heading>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {(sf.scoreBreakdownCards || []).map(card => (
            <FriendlyScoreCard key={card.key} card={card} lang={lang} />
          ))}
        </div>
      </div>

      {/* Yoga summary */}
      {(sf.yogaSummaryEn || sf.yogaSummaryHi) && (
        <div style={{ marginBottom:20 }}>
          <Heading>✦ {t(lang,'Auspicious Combinations','शुभ संयोजन')}</Heading>
          <div style={{ padding:'12px 16px', background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:10 }}>
            <p style={{ fontSize:12, color:'rgba(245,240,232,0.78)', lineHeight:1.8, margin:0 }}>
              {pickLang(sf, 'yogaSummary', lang)}
            </p>
          </div>
        </div>
      )}

      {/* Top strengths + needs care */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:20 }}>
        {sf.topStrengths?.length > 0 && (
          <div>
            <Heading>✦ {t(lang,'Where Life Supports You','जहां जीवन आपका साथ देता है')}</Heading>
            {sf.topStrengths.map(item => (
              <FriendlyStrengthItem key={item.planet} item={item} lang={lang} type="strength" />
            ))}
          </div>
        )}
        {sf.needsCare?.length > 0 && (
          <div>
            <Heading>◈ {t(lang,'Areas That Benefit From Care','जिन्हें देखभाल से लाभ होगा')}</Heading>
            {sf.needsCare.map(item => (
              <FriendlyStrengthItem key={item.planet} item={item} lang={lang} type="care" />
            ))}
          </div>
        )}
      </div>

      {/* Life domain cards */}
      {sf.lifeDomains?.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <Heading>🌐 {t(lang,'Life Area Snapshot','जीवन क्षेत्र')}</Heading>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
            {sf.lifeDomains.map(d => (
              <FriendlyDomainCard key={d.key} d={d} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* Dasha summary */}
      {sf.dashaSummary && (
        <div style={{ marginBottom:20 }}>
          <Heading>🔮 {t(lang,'Current Life Phase','वर्तमान जीवन चरण')}</Heading>
          <DashaSummaryCard dasha={sf.dashaSummary} lang={lang} />
        </div>
      )}

      {/* Technical details accordion */}
      {st && (
        <TechnicalAccordion st={st} natalPlanets={natalPlanets} lang={lang} defaultOpen={false} />
      )}
    </div>
  );
}

// ── Technical (legacy) mode full render ──────────────────────────────────────
function TechnicalView({ st, natalPlanets, lang, admin, onToggleFriendly }) {
  const color = st ? sc(st.overall_score) : '#D4AF37';
  return (
    <div style={{ background:'rgba(10,12,28,0.5)', padding:'0 20px 24px' }}>

      {/* Admin friendly-view toggle */}
      {admin && (
        <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:14, marginBottom:4 }}>
          <button onClick={onToggleFriendly} style={{
            fontSize:11, color:'#10B981', background:'rgba(16,185,129,0.07)',
            border:'1px solid rgba(16,185,129,0.2)', borderRadius:7, padding:'5px 12px', cursor:'pointer',
          }}>
            {t(lang,'← User view','← उपयोगकर्ता दृश्य')}
          </button>
        </div>
      )}

      {/* Score overview + verdict */}
      <div style={{ paddingTop:20, display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start', marginBottom:20 }}>
        <ScoreMeter score={st.overall_score} label={st.label} lang={lang} />
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ marginBottom:16 }}>
            <CatBar icon="🪐" label={t(lang,'Planet Strengths','ग्रह बल')}    val={st.planet_avg}  />
            <CatBar icon="✦"  label={t(lang,'Yoga & Dosha','योग और दोष')}     val={st.yoga_score}  />
            <CatBar icon="🌐" label={t(lang,'Life Domains','जीवन क्षेत्र')} val={st.domain_avg}  />
            <CatBar icon="🔮" label={t(lang,'Current Dasha','वर्तमान दशा')} val={st.dasha_score} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ padding:'7px 14px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.22)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#22C55E' }}>{st.yoga_count}</div>
              <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang,'Good Yogas','शुभ योग')}</div>
            </div>
            <div style={{ padding:'7px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#EF4444' }}>{st.dosha_count}</div>
              <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(lang,'Doshas','दोष')}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${color}22`, borderRadius:10, marginBottom:20 }}>
        <p style={{ fontSize:12, color:'rgba(245,240,232,0.82)', lineHeight:1.9, margin:0 }}>
          {t(lang, st.verdict_en, st.verdict_hi)}
        </p>
      </div>

      {st.current_mahadasha && (
        <div style={{ marginBottom:20 }}>
          <Heading>{t(lang,'Current Dasha Strength','वर्तमान दशा बल')}</Heading>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {[
              { d: st.current_mahadasha, label: t(lang,'Mahadasha','महादशा') },
              st.current_antardasha ? { d: st.current_antardasha, label: t(lang,'Antardasha','अंतर्दशा') } : null,
            ].filter(Boolean).map(({ d, label }) => {
              const pm = PLANET_META[d.planet] || { icon:'●', color:'#94A3B8', hi:d.planet };
              return (
                <div key={label} style={{ padding:'12px 16px', background:`${pm.color}0d`, border:`1px solid ${pm.color}28`, borderRadius:10, display:'flex', gap:12, alignItems:'center', minWidth:180 }}>
                  <span style={{ fontSize:24, color:pm.color }}>{pm.icon}</span>
                  <div>
                    <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:pm.color }}>{t(lang, d.planet, d.planet_hi)}</div>
                    <div style={{ fontSize:11, color:sc(d.score), fontWeight:600 }}>{d.score}/100 {t(lang,'strength','बल')}</div>
                    {d.end_date && <div style={{ fontSize:9, color:'#475569', marginTop:2 }}>{t(lang,'Until','तक')} {d.end_date}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <Heading>{t(lang,'Life Domain Analysis','जीवन क्षेत्र विश्लेषण')}</Heading>
        <DomainGrid domains={st.life_domain_list} lang={lang} />
      </div>

      <div style={{ marginBottom:20 }}>
        <Heading>{t(lang,'Planet-by-Planet Strength','ग्रह-दर-ग्रह बल')}</Heading>
        <PlanetTable scores={st.planet_scores} natalPlanets={natalPlanets} lang={lang} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
        <div>
          <Heading>✦ {t(lang,'Key Strengths','प्रमुख शक्तियां')}</Heading>
          {(st.strengths_en?.length > 0)
            ? st.strengths_en.map((s, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10, padding:'8px 12px', background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:8 }}>
                  <span style={{ color:'#22C55E', flexShrink:0, fontSize:14 }}>◈</span>
                  <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.8, margin:0 }}>
                    {t(lang, s, st.strengths_hi?.[i] || s)}
                  </p>
                </div>
              ))
            : <p style={{ fontSize:11, color:'#475569' }}>{t(lang,'No exceptional strengths identified.','विशेष शक्तियां नहीं मिलीं।')}</p>
          }
        </div>
        <div>
          <Heading>▲ {t(lang,'Key Challenges','प्रमुख चुनौतियां')}</Heading>
          {(st.challenges_en?.length > 0)
            ? st.challenges_en.map((s, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10, padding:'8px 12px', background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8 }}>
                  <span style={{ color:'#F97316', flexShrink:0, fontSize:14 }}>▸</span>
                  <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.8, margin:0 }}>
                    {t(lang, s, st.challenges_hi?.[i] || s)}
                  </p>
                </div>
              ))
            : <p style={{ fontSize:11, color:'#475569' }}>{t(lang,'No major challenges identified.','कोई बड़ी चुनौती नहीं मिली।')}</p>
          }
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function KundliStrengthPanel({ kundliUuid, natalPlanets, lang = 'en', admin = false }) {
  const [st,       setSt]      = useState(null);
  const [sf,       setSf]      = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);
  const [expanded, setExpanded]= useState(false);
  // admin defaults to technical; users default to friendly (when available)
  const [viewMode, setViewMode]= useState(admin ? 'technical' : 'friendly');

  useEffect(() => {
    if (!kundliUuid) { setLoading(false); return; }
    api.get(`/kundli/${kundliUuid}/strength`)
      .then(r => {
        setSt(r.data.strength || null);
        setSf(r.data.strength_friendly || null);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [kundliUuid]);

  const color = st ? sc(st.overall_score) : '#D4AF37';

  if (loading) {
    return (
      <div style={{ padding:'18px 20px', background:'rgba(32,38,70,0.80)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:14, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(212,175,55,0.1)', border:'2px solid rgba(212,175,55,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🌟</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#E2E8F0', marginBottom:4 }}>{t(lang,'Kundli Strength Report','कुंडली बल रिपोर्ट')}</div>
          <div style={{ fontSize:11, color:'#475569' }}>{t(lang,'Analysing planets, yogas & life domains…','ग्रह, योग और जीवन क्षेत्रों का विश्लेषण हो रहा है…')}</div>
        </div>
      </div>
    );
  }

  if (error || !st) return null;

  const showFriendly = sf && viewMode === 'friendly';

  // Header label — friendly label (regional-aware) when in friendly mode, technical otherwise
  const headerLabel = showFriendly
    ? (pickLang(sf.overall, 'label', lang) || t(lang, st.label?.en, st.label?.hi))
    : t(lang, st.label?.en, st.label?.hi);
  const headerColor = showFriendly ? (sf.overall?.color || color) : color;

  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${headerColor}35` }}>

      {/* ── Header row (always visible) ── */}
      <div
        style={{ padding:'16px 20px', background:'rgba(17,20,40,0.7)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', cursor:'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:200 }}>
          <div style={{ flexShrink:0 }}>
            <div style={{ position:'relative', width:54, height:54 }}>
              <div style={{ width:54, height:54, borderRadius:'50%', background:`conic-gradient(${headerColor} ${st.overall_score}%, rgba(255,255,255,0.08) ${st.overall_score}%)` }} />
              <div style={{ position:'absolute', top:5, left:5, width:44, height:44, borderRadius:'50%', background:'#0a0c1c', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:15, fontWeight:900, color:'#F1F5F9', lineHeight:1 }}>{st.overall_score}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F1F5F9' }}>
              {t(lang,'Kundli Strength Report','कुंडली बल रिपोर्ट')}
            </div>
            <div style={{ fontSize:12, color:headerColor, fontWeight:600, marginTop:2 }}>
              {headerLabel} — {st.overall_score}/100
            </div>
          </div>
        </div>

        {/* 4 mini scores */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { label:t(lang,'Planets','ग्रह'),    val:st.planet_avg  },
            { label:t(lang,'Yogas','योग'),        val:st.yoga_score  },
            { label:t(lang,'Life Areas','क्षेत्र'),val:st.domain_avg },
            { label:t(lang,'Dasha','दशा'),        val:st.dasha_score },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign:'center', padding:'6px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, minWidth:58 }}>
              <div style={{ fontSize:15, fontWeight:800, color:sc(val), lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:9, color:'#475569', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
            </div>
          ))}
        </div>

        <span style={{ fontSize:13, color:'#475569' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        showFriendly
          ? <FriendlyView
              sf={sf}
              st={st}
              natalPlanets={natalPlanets}
              lang={lang}
              admin={admin}
              onToggleTech={() => setViewMode('technical')}
            />
          : <TechnicalView
              st={st}
              natalPlanets={natalPlanets}
              lang={lang}
              admin={admin}
              onToggleFriendly={() => setViewMode('friendly')}
            />
      )}
    </div>
  );
}
