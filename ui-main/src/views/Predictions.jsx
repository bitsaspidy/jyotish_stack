'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import LifeGuidancePanel from '../components/LifeGuidancePanel';
import PredictionFriendlyView from '../components/PredictionFriendlyView';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import { predictionHref, readPredictionKundliParam } from '../lib/kundliLinks';
import {
  areaLabel,
  currentPeriodText,
  gocharOverallText,
  gocharText,
  keywordLabel,
  lifeAreaText,
  localizeAstroText,
  outlookLabel,
  planetName,
  portraitText,
  t as chooseText,
  translatedListItem,
  untilText,
} from '../lib/astroI18n';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseChart(profile) {
  if (!profile?.calculated_data) return null;
  if (typeof profile.calculated_data === 'object') return profile.calculated_data;
  try { return JSON.parse(profile.calculated_data); } catch { return null; }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const OUTLOOK_STYLE = {
  positive:       { color:'#22C55E', bg:'rgba(34,197,94,0.08)',   border:'rgba(34,197,94,0.25)',   label:'Positive'       },
  'deeply active':{ color:'#A78BFA', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.25)', label:'Deeply Active'  },
  mixed:          { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.25)',  label:'Mixed'          },
  stable:         { color:'#60A5FA', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.25)',  label:'Stable'         },
  supported:      { color:'#60A5FA', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.25)',  label:'Supported'      },
  challenging:    { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.25)',   label:'Needs Attention'},
  'needs attention':{ color:'#FB923C', bg:'rgba(251,146,60,0.08)', border:'rgba(251,146,60,0.25)', label:'Needs Attention'},
};

const AREA_ICON = {
  career: '💼', relationships: '💞', health: '🌿', finance: '💰', spirituality: '🕉️',
};
const AREA_COLOR = {
  career: '#F59E0B', relationships: '#F472B6', health: '#22C55E',
  finance: '#60A5FA', spirituality: '#A78BFA',
};

function OutlookBadge({ outlook, lang }) {
  const s = OUTLOOK_STYLE[outlook] || OUTLOOK_STYLE.mixed;
  return (
    <span style={{
      fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
      padding:'2px 8px', borderRadius:12, border:`1px solid ${s.border}`,
      background:s.bg, color:s.color,
    }}>{outlookLabel(outlook, lang)}</span>
  );
}

function LifeAreaCard({ areaKey, area, chart, lang, delay = 0 }) {
  const [open, setOpen] = useState(true);
  const icon  = AREA_ICON[areaKey] || '✦';
  const label = areaLabel(areaKey, lang);
  const color = AREA_COLOR[areaKey] || '#D4AF37';
  const description = lifeAreaText(areaKey, area, chart, lang);

  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      style={{
        borderRadius:12, border:`1px solid rgba(212,175,55,0.12)`,
        background:'rgba(17,20,40,0.65)', overflow:'hidden',
      }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px', background:'transparent', border:'none', cursor:'pointer',
          borderBottom: open ? '1px solid rgba(212,175,55,0.08)' : 'none',
        }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ color, fontSize:13, fontWeight:700, fontFamily:'Georgia,serif' }}>{label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {area?.outlook && <OutlookBadge outlook={area.outlook} lang={lang} />}
          <span style={{ color:'rgba(245,240,232,0.68)', fontSize:12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding:'14px 16px' }}>
          {description && (
            <p style={{ color:'rgba(245,240,232,0.8)', fontSize:13, lineHeight:1.85, marginBottom: area?.keywords?.length ? 12 : 0 }}>
              {description}
            </p>
          )}
          {area?.keywords?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:4 }}>
              {area.keywords.map((k) => (
                <span key={k} style={{
                  fontSize:10, padding:'3px 10px', borderRadius:12,
                  background:`rgba(${color.replace('#','').match(/../g).map(h=>parseInt(h,16)).join(',')},0.1)`,
                  border:`1px solid rgba(${color.replace('#','').match(/../g).map(h=>parseInt(h,16)).join(',')},0.2)`,
                  color,
                }}>{keywordLabel(k, lang)}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function GocharCard({ gochar, chart, lang, delay = 0 }) {
  if (!gochar) return null;
  const { sade_sati, jupiter, rahu_ketu } = gochar;
  const overallText = gocharOverallText(gochar, lang);

  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className="card-royal p-5">
      <h2 className="font-serif text-gold text-sm font-semibold mb-4">
        🌍 {chooseText(lang, 'Current Transit Influences (Gochar)', 'वर्तमान गोचर प्रभाव')}
      </h2>

      <div className="space-y-4">
        {/* Overall */}
        {overallText && (
          <p style={{ color:'rgba(245,240,232,0.75)', fontSize:13, lineHeight:1.8 }}>{overallText}</p>
        )}

        {/* Sade Sati */}
        {sade_sati && (
          <div style={{
            borderRadius:8, padding:'12px 14px',
            border: sade_sati.active ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(212,175,55,0.1)',
            background: sade_sati.active ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:14 }}>♄</span>
              <span style={{ color: sade_sati.active ? '#FB923C' : '#94A3B8', fontSize:11, fontWeight:700 }}>
                {chooseText(lang, 'Sade Sati', 'साढ़ेसाती')} — {sade_sati.active ? chooseText(lang, `ACTIVE (${sade_sati.phase} phase)`, `सक्रिय (${localizeAstroText(sade_sati.phase, lang)} चरण)`) : chooseText(lang, 'Not Active', 'सक्रिय नहीं')}
              </span>
            </div>
            <p style={{ color:'rgba(245,240,232,0.7)', fontSize:12, lineHeight:1.75 }}>
              {gocharText('sade_sati', sade_sati, chart, lang)}
            </p>
          </div>
        )}

        {/* Jupiter */}
        {jupiter && (
          <div style={{
            borderRadius:8, padding:'12px 14px',
            border: jupiter.favorable ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(212,175,55,0.1)',
            background: jupiter.favorable ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:14 }}>♃</span>
              <span style={{ color: jupiter.favorable ? '#FBBF24' : '#94A3B8', fontSize:11, fontWeight:700 }}>
                {chooseText(lang, 'Jupiter Transit', 'गुरु गोचर')} — {jupiter.favorable ? chooseText(lang, 'Supportive', 'सहायक') : chooseText(lang, 'Neutral / Demanding', 'सामान्य / प्रयास मांगता है')}
              </span>
            </div>
            <p style={{ color:'rgba(245,240,232,0.7)', fontSize:12, lineHeight:1.75 }}>
              {gocharText('jupiter', jupiter, chart, lang)}
            </p>
          </div>
        )}

        {/* Rahu-Ketu */}
        {rahu_ketu && (
          <div style={{ borderRadius:8, padding:'12px 14px', border:'1px solid rgba(167,139,250,0.15)', background:'rgba(167,139,250,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:14 }}>☊☋</span>
              <span style={{ color:'#A78BFA', fontSize:11, fontWeight:700 }}>
                {chooseText(lang, 'Rahu-Ketu Axis', 'राहु-केतु अक्ष')} — {rahu_ketu.axis}
              </span>
            </div>
            <p style={{ color:'rgba(245,240,232,0.7)', fontSize:12, lineHeight:1.75 }}>
              {gocharText('rahu_ketu', rahu_ketu, chart, lang)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChallengesOpportunitiesCard({ challenges, opportunities, lang, delay = 0 }) {
  const [tab, setTab] = useState('opp');
  const hasC = challenges?.length > 0;
  const hasO = opportunities?.length > 0;
  if (!hasC && !hasO) return null;

  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className="card-royal p-5">
      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {hasO && (
          <button onClick={() => setTab('opp')}
            style={{ padding:'4px 12px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab==='opp' ? 'rgba(34,197,94,0.18)' : 'transparent',
              color: tab==='opp' ? '#22C55E' : 'rgba(245,240,232,0.38)', transition:'all 0.18s' }}>
            ✦ {chooseText(lang, 'Opportunities', 'अवसर')} ({opportunities.length})
          </button>
        )}
        {hasC && (
          <button onClick={() => setTab('ch')}
            style={{ padding:'4px 12px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab==='ch' ? 'rgba(251,146,60,0.18)' : 'transparent',
              color: tab==='ch' ? '#FB923C' : 'rgba(245,240,232,0.38)', transition:'all 0.18s' }}>
            ⚠ {chooseText(lang, 'Watch Out', 'सावधानियां')} ({challenges.length})
          </button>
        )}
      </div>

      {tab === 'opp' && hasO && (
        <div className="space-y-2">
          {opportunities.map((o, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(212,175,55,0.06)' }}>
              <span style={{ color:'#22C55E', fontSize:14, flexShrink:0, marginTop:1 }}>✦</span>
              <p style={{ color:'rgba(245,240,232,0.78)', fontSize:12.5, lineHeight:1.7 }}>{translatedListItem(o, lang)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'ch' && hasC && (
        <div className="space-y-2">
          {challenges.map((c, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(212,175,55,0.06)' }}>
              <span style={{ color:'#FB923C', fontSize:14, flexShrink:0, marginTop:1 }}>⚠</span>
              <p style={{ color:'rgba(245,240,232,0.78)', fontSize:12.5, lineHeight:1.7 }}>{translatedListItem(c, lang)}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RemediesCard({ remedyData, fallbackRemedies, lifeIshtaDevata, lang, delay = 0 }) {
  const [tab, setTab] = useState('ishta');
  const hasLifeIshta = !!lifeIshtaDevata;
  const hasDashaRemedy  = !!remedyData?.dasha_planet;
  const hasLagnaRemedy  = !!remedyData?.lagna_planet;
  const hasPujaSequence = remedyData?.puja_sequence?.length > 0;
  const hasProblems     = remedyData?.problems?.length > 0;
  const hasSuite        = remedyData?.suite?.items?.length > 0;
  const hasFallback     = fallbackRemedies?.length > 0;

  if (!hasLifeIshta && !hasDashaRemedy && !hasFallback) return null;

  const tabs = [
    hasLifeIshta     && { key:'ishta',  label: chooseText(lang, 'Chart Isht Devata', 'कुंडली इष्ट देवता') },
    hasDashaRemedy  && { key:'dasha',  label: chooseText(lang, 'Dasha Remedy', 'दशा उपाय')   },
    hasLagnaRemedy  && { key:'lagna',  label: chooseText(lang, 'Lagna Remedy', 'लग्न उपाय')   },
    hasPujaSequence && { key:'puja',   label: chooseText(lang, 'Puja Sequence', 'पूजा क्रम')  },
    hasProblems     && { key:'problems', label: chooseText(lang, 'Problem Remedies', 'समस्या उपाय') },
    hasSuite        && { key:'sacred',   label: chooseText(lang, 'Rudraksha · Yantra · Daan', 'रुद्राक्ष · यंत्र · दान') },
  ].filter(Boolean);
  const activeTab = tabs.some((item) => item.key === tab) ? tab : tabs[0]?.key;

  const renderLifeIshtaCard = () => {
    if (!lifeIshtaDevata) return null;
    return (
      <div className="space-y-3">
        <div style={{ padding:'13px 14px', borderRadius:10, background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.22)' }}>
          <p style={{ color:'rgba(245,240,232,0.58)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:5 }}>
            {chooseText(lang, 'Your Personal Isht Devata', 'आपके व्यक्तिगत इष्ट देवता')}
          </p>
          <p style={{ color:'#D4AF37', fontSize:18, fontWeight:700, fontFamily:'Georgia,serif' }}>
            {lang === 'hi' ? lifeIshtaDevata.ishta_devata_hi : lifeIshtaDevata.ishta_devata_en}
          </p>
          <p style={{ color:'rgba(245,240,232,0.76)', fontSize:12, lineHeight:1.75, marginTop:8, fontFamily:'var(--font-devanagari),sans-serif' }}>
            {chooseText(
              lang,
              `Calculated from Atmakaraka ${lifeIshtaDevata.atmakaraka} in D9 (${lifeIshtaDevata.d9_sign_en}), whose sign lord is ${lifeIshtaDevata.d9_sign_lord}. This is the same Isht Devata shown in the Life Report.`,
              `यह आत्मकारक ${lifeIshtaDevata.atmakaraka_hi || lifeIshtaDevata.atmakaraka} की D9 स्थिति (${lifeIshtaDevata.d9_sign_hi || lifeIshtaDevata.d9_sign_en}) से निकला है; इसका राशि स्वामी ${lifeIshtaDevata.d9_sign_lord} है। यही इष्ट देवता Life Report में भी दिखाया गया है।`
            )}
          </p>
        </div>
        <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.18)' }}>
          <p style={{ color:'#A78BFA', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:5 }}>
            {chooseText(lang, 'Primary Mantra / Suktam', 'प्राथमिक मंत्र / सूक्त')}
          </p>
          <p style={{ color:'rgba(245,240,232,0.86)', fontSize:12.5, lineHeight:1.75, fontFamily:'var(--font-devanagari),sans-serif' }}>
            {lang === 'hi' ? lifeIshtaDevata.primary_mantra_hi : lifeIshtaDevata.primary_mantra_en}
          </p>
        </div>
      </div>
    );
  };

  const renderPlanetCard = (planet) => {
    if (!planet) return null;
    const mantras = lang === 'hi' ? (planet.mantras_hi || planet.mantras_en || []) : (planet.mantras_en || []);
    const secondaryMantras = lang === 'hi' ? (planet.mantras_en || []) : (planet.mantras_hi || []);
    return (
      <div className="space-y-4">
        {/* Planetary remedy devata */}
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', borderRadius:10, background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.15)' }}>
          <span style={{ fontSize:22, flexShrink:0 }}>🙏</span>
          <div>
            <p style={{ color:'rgba(245,240,232,0.58)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:3 }}>{chooseText(lang, 'Remedy Devata', 'उपाय देवता')}</p>
            <p style={{ color:'#D4AF37', fontSize:15, fontWeight:700, fontFamily:'Georgia,serif' }}>{lang === 'hi' ? planet.ishta_devata_hi : planet.ishta_devata_en}</p>
            <p style={{ color:'rgba(245,240,232,0.5)', fontSize:11, marginTop:2, fontFamily:'var(--font-devanagari),sans-serif' }}>{lang === 'hi' ? planet.ishta_devata_en : planet.ishta_devata_hi}</p>
          </div>
        </div>

        {/* Mantras */}
        {mantras?.length > 0 && (
          <div>
            <p style={{ color:'#A78BFA', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>
              📿 {chooseText(lang, 'Prescribed Mantras / Suktams', 'निर्धारित मंत्र / सूक्त')}
            </p>
            <div className="space-y-2">
              {mantras.map((m, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'9px 12px', borderRadius:8, background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.15)' }}>
                  <span style={{ color:'#A78BFA', flexShrink:0, fontSize:12, marginTop:1 }}>◆</span>
                  <div>
                    <p style={{ color:'rgba(245,240,232,0.82)', fontSize:12.5 }}>{m}</p>
                    {secondaryMantras?.[i] && (
                      <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, marginTop:3, fontFamily:'var(--font-devanagari),sans-serif' }}>{secondaryMantras[i]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special notes */}
        {planet.special_notes_en && (
          <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.08)' }}>
            <p style={{ color:'#F59E0B', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:5 }}>📌 {chooseText(lang, 'Important Note', 'महत्वपूर्ण नोट')}</p>
            <p style={{ color:'rgba(245,240,232,0.7)', fontSize:12, lineHeight:1.75 }}>{lang === 'hi' ? planet.special_notes_hi : planet.special_notes_en}</p>
            <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, marginTop:5, lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>{lang === 'hi' ? planet.special_notes_en : planet.special_notes_hi}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className="card-royal p-5">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">🌺 {chooseText(lang, 'Vedic Remedies', 'वैदिक उपाय')}</h2>
      <p style={{ color:'rgba(245,240,232,0.58)', fontSize:10, marginBottom:14 }}>
        {chooseText(lang, 'Chart Isht Devata is matched with the Life Report. Dasha and Lagna tabs show planetary remedy devata, prescribed mantras, and daily puja sequence.', 'कुंडली इष्ट देवता Life Report से मिलाया गया है। दशा और लग्न टैब ग्रह उपाय देवता, निर्धारित मंत्र और दैनिक पूजा क्रम दिखाते हैं।')}
      </p>

      {/* Tab bar */}
      {tabs.length > 1 && (
        <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding:'4px 12px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
                background: activeTab===t.key ? 'rgba(212,175,55,0.18)' : 'transparent',
                color: activeTab===t.key ? '#D4AF37' : 'rgba(245,240,232,0.6)', transition:'all 0.18s' }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'ishta' && renderLifeIshtaCard()}
      {activeTab === 'dasha' && renderPlanetCard(remedyData?.dasha_planet)}
      {activeTab === 'lagna' && renderPlanetCard(remedyData?.lagna_planet)}

      {activeTab === 'sacred' && hasSuite && (
        <div className="space-y-4">
          {remedyData.suite.items.map((it) => (
            <div key={it.planet}>
              <p style={{ color:'#D4AF37', fontSize:13, fontWeight:700, marginBottom:3 }} className="font-devanagari">
                {chooseText(lang, `For ${it.planet}`, `${it.planet_hi} के लिए`)}
              </p>
              <p style={{ color:'rgba(245,240,232,0.5)', fontSize:10.5, lineHeight:1.6, marginBottom:8 }} className="font-devanagari">
                {lang === 'hi' ? it.reason_hi : it.reason_en}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: chooseText(lang,'Rudraksha','रुद्राक्ष'), title: it.rudraksha.mukhi, txt: lang==='hi' ? it.rudraksha.hi : it.rudraksha.en, color:'#A78BFA', icon:'📿' },
                  { label: chooseText(lang,'Yantra','यंत्र'), title: it.yantra.name, txt: lang==='hi' ? it.yantra.hi : it.yantra.en, color:'#60A5FA', icon:'🔯' },
                  { label: chooseText(lang,'Daan (Charity)','दान'), title: lang==='hi' ? it.daan.day_hi : it.daan.day, txt: lang==='hi' ? it.daan.hi : it.daan.en, color:'#22C55E', icon:'🤲' },
                ].map((c) => (
                  <div key={c.label} style={{ borderRadius:8, padding:'10px 12px', background:'rgba(255,255,255,0.025)', borderTop:`2px solid ${c.color}`, border:`1px solid ${c.color}33` }}>
                    <p style={{ color:c.color, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>{c.icon} {c.label}</p>
                    <p style={{ color:'rgba(245,240,232,0.92)', fontSize:11.5, fontWeight:700, marginBottom:4 }} className="font-devanagari">{c.title}</p>
                    <p style={{ color:'rgba(245,240,232,0.55)', fontSize:10, lineHeight:1.65 }} className="font-devanagari">{c.txt}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)' }}>
            <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>
              📌 {chooseText(lang, 'How to use', 'उपयोग विधि')}
            </p>
            <p style={{ color:'rgba(245,240,232,0.7)', fontSize:11, lineHeight:1.75 }} className="font-devanagari">
              {lang === 'hi' ? remedyData.suite.wearing_hi : remedyData.suite.wearing_en}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'problems' && hasProblems && (
        <div className="space-y-3">
          <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, lineHeight:1.7, marginBottom:10 }}>
            {chooseText(lang, 'Specific life problems and their classical planetary remedies — devata, mantras and method.', 'विशिष्ट जीवन समस्याएं और उनके शास्त्रीय ग्रह उपाय — देवता, मंत्र और विधि।')}
          </p>
          {remedyData.problems.map((pr) => {
            const mantras = lang === 'hi' ? (pr.mantras_hi?.length ? pr.mantras_hi : pr.mantras_en) : pr.mantras_en;
            return (
              <div key={pr.id} style={{ padding:'12px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.12)' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p style={{ color:'#D4AF37', fontSize:13, fontWeight:700, fontFamily:'var(--font-devanagari),Georgia,serif' }}>
                    {lang === 'hi' ? (pr.problem_hi || pr.problem_en) : pr.problem_en}
                  </p>
                  <span style={{ fontSize:9, color:'#A78BFA', background:'rgba(167,139,250,0.1)', borderRadius:10, padding:'2px 8px', fontWeight:700, whiteSpace:'nowrap' }}>
                    {pr.planet}
                  </span>
                </div>
                {(pr.devata_en || pr.devata_hi) && (
                  <p style={{ color:'rgba(245,240,232,0.7)', fontSize:11, marginBottom:6, fontFamily:'var(--font-devanagari),sans-serif' }}>
                    🙏 {chooseText(lang, 'Devata', 'देवता')}: {lang === 'hi' ? (pr.devata_hi || pr.devata_en) : pr.devata_en}
                  </p>
                )}
                {mantras?.length > 0 && mantras.map((m, i) => (
                  <p key={i} style={{ color:'rgba(245,240,232,0.82)', fontSize:11.5, lineHeight:1.7, marginBottom:3, fontFamily:'var(--font-devanagari),sans-serif' }}>
                    ◆ {m}
                  </p>
                ))}
                {(pr.notes_en || pr.notes_hi) && (
                  <p style={{ color:'rgba(245,240,232,0.5)', fontSize:10.5, lineHeight:1.65, marginTop:5, fontFamily:'var(--font-devanagari),sans-serif' }}>
                    📌 {lang === 'hi' ? (pr.notes_hi || pr.notes_en) : pr.notes_en}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'puja' && hasPujaSequence && (
        <div className="space-y-3">
          <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, lineHeight:1.7, marginBottom:10 }}>
            {chooseText(lang, 'Follow this sequence for your daily remedial puja. Always begin with Step 0 — invoking Ganesha.', 'दैनिक उपाय पूजा के लिए यह क्रम अपनाएं। हमेशा चरण 0 — गणेश आवाहन — से शुरू करें।')}
          </p>
          {remedyData.puja_sequence.map((step) => (
            <div key={step.step_key} style={{
              display:'flex', gap:12, padding:'12px 14px', borderRadius:8,
              border: step.is_conditional ? '1px solid rgba(251,146,60,0.2)' : '1px solid rgba(212,175,55,0.12)',
              background: step.is_conditional ? 'rgba(251,146,60,0.04)' : 'rgba(255,255,255,0.02)',
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%', flexShrink:0,
                background: step.is_conditional ? 'rgba(251,146,60,0.15)' : 'rgba(212,175,55,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color: step.is_conditional ? '#FB923C' : '#D4AF37',
                fontSize:11, fontWeight:700,
              }}>
                {step.step_key === 'tc' ? 'T&C' : step.step_key}
              </div>
              <div>
                <p style={{ color: step.is_conditional ? '#FB923C' : '#D4AF37', fontSize:12, fontWeight:700, marginBottom:4 }}>
                  {lang === 'hi' ? step.action_hi : step.action_en}
                  {step.is_conditional && <span style={{ fontSize:9, marginLeft:6, opacity:0.7 }}>{chooseText(lang, '(Conditional)', '(शर्त अनुसार)')}</span>}
                </p>
                <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, fontFamily:'var(--font-devanagari),sans-serif', marginBottom:4 }}>{lang === 'hi' ? step.action_en : step.action_hi}</p>
                <p style={{ color:'rgba(245,240,232,0.75)', fontSize:12, lineHeight:1.75 }}>{lang === 'hi' ? step.description_hi : step.description_en}</p>
                <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, lineHeight:1.7, marginTop:5, fontFamily:'var(--font-devanagari),sans-serif' }}>{lang === 'hi' ? step.description_en : step.description_hi}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback if no DB data yet */}
      {!hasDashaRemedy && hasFallback && (
        <div className="space-y-2">
          {fallbackRemedies.map((r, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'10px 12px', borderRadius:8, background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.1)' }}>
              <span style={{ color:'#D4AF37', fontSize:13, flexShrink:0 }}>◆</span>
              <p style={{ color:'rgba(245,240,232,0.78)', fontSize:12.5, lineHeight:1.7 }}>{translatedListItem(r, lang)}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Predictions() {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [profiles,      setProfiles]      = useState([]);
  const [selectedUuid,  setSelectedUuid]  = useState('');
  const [fetching,      setFetching]      = useState(true);

  const t = (en, hi) => (lang === 'hi' ? hi : en);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setFetching(true);
      try {
        const { data } = await api.get('/kundli');
        const baseProfiles = data.profiles || [];
        const detailed = await Promise.all(baseProfiles.map(async (profile) => {
          try {
            const detail = await api.get(`/kundli/${profile.uuid}`);
            return detail.data.profile;
          } catch { return profile; }
        }));
        const requestedUuid = readPredictionKundliParam(
          typeof window !== 'undefined' ? window.location.search : ''
        );
        setProfiles(detailed);
        setSelectedUuid((current) => {
          const requested = detailed.find((profile) => profile.uuid === requestedUuid)?.uuid;
          if (requested) return requested;
          const currentStillValid = detailed.some((profile) => profile.uuid === current);
          return currentStillValid ? current : (detailed[0]?.uuid || '');
        });
      } catch (e) {
        toast.error(e.response?.data?.message || t('Unable to load predictions', 'भविष्यवाणी लोड नहीं हो पाई'));
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [user]);

  const selected = useMemo(
    () => profiles.find((p) => p.uuid === selectedUuid) || profiles[0],
    [profiles, selectedUuid]
  );
  const chart        = parseChart(selected);
  const pred         = chart?.predictions;
  const friendly     = selected?.predictions_friendly || null;
  const remedyData   = selected?.remedy_data || null;
  const lifeGuidance = selected?.life_guidance || null;
  const dasha = chart?.dasha?.find((d) => d.is_current) || chart?.dasha?.[0];
  const antar = dasha?.antardasha?.find((d) => d.is_current) || dasha?.antardasha?.[0];

  const downloadPdf = async () => {
    if (!selected) return;
    try {
      const response = await api.get(`/kundli/${selected.uuid}/report.pdf`, { responseType: 'blob' });
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), `${selected.name || 'kundli'}-report.pdf`);
    } catch (e) {
      toast.error(e.response?.data?.message || t('Unable to export PDF', 'PDF निर्यात नहीं हो पाया'));
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gold">{t('Loading…', 'लोड हो रहा है…')}</div>;
  }

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={70} />
      <div className="relative z-10 max-w-8xl mx-auto">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-gold/50 text-xs uppercase tracking-[0.35em]">Bhavishya Vani</p>
            <h1 className="font-serif text-3xl md:text-4xl text-gradient-gold font-bold mt-2">
              {t('Predictions', 'भविष्यवाणी')}
            </h1>
            <p className="text-ivory/45 text-sm mt-2 max-w-xl">
              {t('Your life reading — who you are, what this period means, and where to focus your energy.',
                 'आपका जीवन-पाठ — आप कौन हैं, इस अवधि का क्या अर्थ है, और ऊर्जा कहाँ लगाएं।')}
            </p>
          </div>
          {selected && (
            <button onClick={downloadPdf} className="btn-outline-gold text-xs px-4 py-2">
              ↓ {t('Export PDF Report', 'PDF रिपोर्ट निर्यात करें')}
            </button>
          )}
        </div>

        {fetching ? (
          <div className="card-royal p-8 text-center text-ivory/45">{t('Loading your reading…', 'आपकी रीडिंग लोड हो रही है…')}</div>
        ) : profiles.length === 0 ? (
          <div className="card-royal p-10 text-center">
            <h2 className="font-serif text-gold text-2xl mb-2">{t('Create a Kundli first', 'पहले कुंडली बनाएं')}</h2>
            <p className="text-ivory/55 text-sm mb-5">{t('Your predictions are generated from your birth chart.', 'आपकी भविष्यवाणी जन्म कुंडली से तैयार होती है।')}</p>
            <Link href="/kundli/new" className="btn-gold text-sm px-5 py-2">{t('Create Kundli', 'कुंडली बनाएं')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* ── Sidebar: profile selector ── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card-royal p-4">
                <h2 className="font-serif text-gold text-sm mb-3">{t('Profiles', 'प्रोफाइल')}</h2>
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <button key={profile.uuid} onClick={() => {
                      setSelectedUuid(profile.uuid);
                      router.replace(predictionHref(profile.uuid), { scroll: false });
                    }}
                      className={`w-full text-left rounded border p-3 transition-colors ${profile.uuid === selected?.uuid ? 'border-gold/45 bg-gold/10' : 'border-gold/10 hover:border-gold/30'}`}>
                      <p className="text-sm text-ivory font-medium">{profile.name}</p>
                      <p className="text-[10px] text-ivory/35 mt-1">{String(profile.date_of_birth).slice(0, 10)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dasha summary card */}
              {chart && (
                <div className="card-royal p-4">
                  <p className="text-[10px] text-gold/50 uppercase tracking-widest mb-3">{t('Your Current Chapter', 'आपका वर्तमान अध्याय')}</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-ivory/35 uppercase tracking-wider">{t('Main Influence', 'मुख्य प्रभाव')}</p>
                      <p className="text-gold font-serif text-lg">{planetName(dasha?.lord, lang) || '—'}</p>
                      <p className="text-[10px] text-ivory/30">{untilText(fmtDate(dasha?.end), lang)}</p>
                    </div>
                    <div style={{ borderTop:'1px solid rgba(212,175,55,0.1)', paddingTop:10 }}>
                      <p className="text-[10px] text-ivory/35 uppercase tracking-wider">{t('Current Influence', 'वर्तमान प्रभाव')}</p>
                      <p style={{ color:'#A78BFA' }} className="font-serif text-base">{planetName(antar?.lord, lang) || '—'}</p>
                      <p className="text-[10px] text-ivory/30">{untilText(fmtDate(antar?.end), lang)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Main content ── */}
            <div className="lg:col-span-3 space-y-5">
              {!chart ? (
                <div className="card-royal p-8 text-center">
                  <p className="text-ivory/55 text-sm mb-4">{t('Calculation is pending for this Kundli.', 'इस कुंडली की गणना अभी बाकी है।')}</p>
                  <Link href={`/kundli/${selected?.uuid}`} className="btn-gold text-sm px-5 py-2">{t('Open Kundli', 'कुंडली खोलें')}</Link>
                </div>
              ) : (
                <>
                  {/* ── Identity Banner ── */}
                  <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    className="card-royal p-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] text-gold/45 uppercase tracking-[0.3em] mb-1">{t('Reading for', 'रीडिंग')}</p>
                        <h2 className="font-serif text-2xl text-gold">{selected.name}</h2>
                        <p className="text-ivory/50 text-sm mt-2">
                          {friendly?.overview
                            ? chooseText(lang, friendly.overview.chartLineEn, friendly.overview.chartLineHi)
                            : <>
                                {lang === 'hi' ? chart.ascendant?.rashi_hi : chart.ascendant?.rashi_en} {t('Lagna', 'लग्न')}
                                {' · '}{t('Moon in', 'चंद्र')} {lang === 'hi' ? chart.planets?.Moon?.rashi_hi : chart.planets?.Moon?.rashi_en}
                                {' · '}{lang === 'hi' ? chart.nakshatra?.hi : chart.nakshatra?.en} {t('Nakshatra', 'नक्षत्र')}, {t(`Pada ${chart.nakshatra?.pada}`, `चरण ${chart.nakshatra?.pada}`)}
                              </>}
                        </p>
                        {/* Portrait sentence */}
                        {(friendly?.overview || pred?.portrait?.combined_en) && (
                          <p style={{ color:'rgba(245,240,232,0.65)', fontSize:13, lineHeight:1.8, marginTop:10, borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:10 }}>
                            {friendly?.overview
                              ? chooseText(lang, friendly.overview.summaryEn, friendly.overview.summaryHi)
                              : portraitText(pred.portrait, 'combined', chart, lang)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {friendly ? (
                    <PredictionFriendlyView data={friendly} lang={lang} />
                  ) : (
                    <>
                  {/* ── Who You Are — Lagna Portrait (legacy fallback) ── */}
                  {pred?.portrait && (
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.04 }}
                      className="card-royal p-5">
                      <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                        🪐 {t('Who You Are', 'आप कौन हैं')}
                      </h2>
                      <div className="space-y-4">
                        {pred.portrait.lagna_en && (
                          <div>
                            <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:7 }}>
                              ✦ {t('Your Ascendant — Outer Personality', 'आपकी लग्न — बाहरी व्यक्तित्व')}
                            </p>
                            <p style={{ color:'rgba(245,240,232,0.82)', fontSize:13, lineHeight:1.85 }}>{portraitText(pred.portrait, 'lagna', chart, lang)}</p>
                          </div>
                        )}
                        {pred.portrait.moon_en && (
                          <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
                            <p style={{ color:'#94A3B8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:7 }}>
                              ☽ {t('Your Moon Sign — Inner Emotional World', 'आपकी चंद्र राशि — आंतरिक भावनाएं')}
                            </p>
                            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:13, lineHeight:1.85 }}>{portraitText(pred.portrait, 'moon', chart, lang)}</p>
                          </div>
                        )}
                        {pred.portrait.nakshatra_en && (
                          <div style={{ borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:14 }}>
                            <p style={{ color:'#A78BFA', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:7 }}>
                              ✨ {t('Your Nakshatra — Soul Nature', 'आपका नक्षत्र — आत्मा की प्रकृति')}
                            </p>
                            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:13, lineHeight:1.85 }}>{portraitText(pred.portrait, 'nakshatra', chart, lang)}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Current Period Reading ── */}
                  {pred?.current_period && (
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }}
                      className="card-royal p-5">
                      <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                        📖 {t('What This Period Means', 'इस दशा का अर्थ')}
                      </h2>
                      {/* Dasha badges */}
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                        <div style={{ padding:'6px 14px', borderRadius:20, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.35)' }}>
                          <p style={{ color:'rgba(245,240,232,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em' }}>{t('Mahadasha', 'महादशा')}</p>
                          <p style={{ color:'#D4AF37', fontSize:16, fontWeight:700, fontFamily:'Georgia,serif', marginTop:2 }}>{planetName(pred.current_period.mahadasha?.lord, lang)}</p>
                          <p style={{ color:'rgba(245,240,232,0.68)', fontSize:9, marginTop:2 }}>{untilText(fmtDate(pred.current_period.mahadasha?.end), lang)}</p>
                        </div>
                        <div style={{ padding:'6px 14px', borderRadius:20, background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.3)' }}>
                          <p style={{ color:'rgba(245,240,232,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em' }}>{t('Antardasha', 'अंतर्दशा')}</p>
                          <p style={{ color:'#A78BFA', fontSize:16, fontWeight:700, fontFamily:'Georgia,serif', marginTop:2 }}>{planetName(pred.current_period.antardasha?.lord, lang)}</p>
                          <p style={{ color:'rgba(245,240,232,0.68)', fontSize:9, marginTop:2 }}>{untilText(fmtDate(pred.current_period.antardasha?.end), lang)}</p>
                        </div>
                      </div>
                      <p style={{ color:'rgba(245,240,232,0.8)', fontSize:13, lineHeight:1.85 }}>
                        {currentPeriodText(pred.current_period, chart, lang)}
                      </p>
                      {pred.current_period.mahadasha?.nature && (
                        <div style={{ marginTop:12, background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 12px' }}>
                          <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, marginBottom:2 }}>{t('Mahadasha Nature', 'महादशा की प्रकृति')}</p>
                          <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12 }}>
                            {lang === 'hi'
                              ? `${planetName(pred.current_period.mahadasha.lord, 'hi')} की महादशा उसके कारकत्व, भाव स्थिति और बल के अनुसार जीवन की मुख्य दिशा को सक्रिय करती है।`
                              : pred.current_period.mahadasha.nature}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Life Areas ── */}
                  {pred?.life_areas && (
                    <div>
                      <p style={{ color:'rgba(245,240,232,0.68)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.3em', marginBottom:12 }}>
                        {t('Life Area Readings', 'जीवन क्षेत्र रीडिंग')}
                      </p>
                      <div className="space-y-3">
                        {Object.entries(pred.life_areas).map(([key, area], i) => (
                          <LifeAreaCard key={key} areaKey={key} area={area} chart={chart} lang={lang} delay={0.08 + i * 0.03} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Opportunities & Challenges ── */}
                  <ChallengesOpportunitiesCard
                    challenges={pred?.current_challenges}
                    opportunities={pred?.current_opportunities}
                    lang={lang}
                    delay={0.22}
                  />

                  {/* ── Transit Summary ── */}
                  <GocharCard gochar={pred?.gochar_narrative} chart={chart} lang={lang} delay={0.26} />
                    </>
                  )}

                  {/* ── Remedies (from DB via PDF) ── */}
                  <RemediesCard
                    remedyData={remedyData}
                    fallbackRemedies={pred?.remedies}
                    lifeIshtaDevata={chart?.life_report?.ishta_devata}
                    lang={lang}
                    delay={0.3}
                  />

                  {/* ── Life Guidance (Session 33) ── */}
                  {lifeGuidance && (
                    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.34 }}
                      style={{
                        borderRadius:12, border:'1px solid rgba(212,175,55,0.12)',
                        background:'rgba(17,20,40,0.65)', padding:20,
                      }}>
                      <LifeGuidancePanel guidance={lifeGuidance} lang={lang} marriageTiming={selected?.marriage_timing} />
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
