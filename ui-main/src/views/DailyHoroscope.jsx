'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Link from 'next/link';
import PeriodTabs from '../components/horoscope/PeriodTabs';
import PushOptIn from '../components/PushOptIn';
import { SIGNS } from '../lib/rashiSigns';

// ─── Helpers ─────────────────────────────────────────────────────────────────
import { t } from '../lib/astroI18n';

const PLANET_ICON = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
const PLANET_COLOR = { Sun:'#FBBF24', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#10B981', Jupiter:'#F97316', Venus:'#F472B6', Saturn:'#818CF8', Rahu:'#A78BFA', Ketu:'#6B7280' };
const PLANET_NAME_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' };

const SCORE_COLOR = { 1:'#EF4444', 2:'#F97316', 3:'#F59E0B', 4:'#22C55E', 5:'#10B981' };
const SCORE_LABEL = { 1:'Difficult', 2:'Challenging', 3:'Moderate', 4:'Favorable', 5:'Excellent' };
const SCORE_LABEL_HI = { 1:'कठिन', 2:'चुनौतीपूर्ण', 3:'सामान्य', 4:'अनुकूल', 5:'उत्कृष्ट' };

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ score }) {
  return (
    <span style={{ letterSpacing:2 }}>
      {[1,2,3,4,5].map((n) => (
        <span key={n} style={{ color: n <= score ? SCORE_COLOR[score] : 'rgba(255,255,255,0.12)', fontSize:14 }}>★</span>
      ))}
    </span>
  );
}

// ─── Transit Strip ────────────────────────────────────────────────────────────
function TransitStrip({ summary, lang }) {
  if (!summary) return null;
  const planets = Object.entries(summary);
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', padding:'12px 0' }}>
      {planets.map(([name, data]) => (
        <div key={name} style={{
          display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:20, flexShrink:0,
        }}>
          <span style={{ fontSize:13, color: PLANET_COLOR[name] || '#D4AF37' }}>{PLANET_ICON[name]}</span>
          <span style={{ fontSize:10, color:'#CBD5E1' }}>
            {t(lang, name, PLANET_NAME_HI[name])}
          </span>
          <span style={{ fontSize:10, color:'#94A3B8' }}>
            {t(lang, data.rashi_en, data.rashi_hi)}
          </span>
          {data.is_retrograde && <span style={{ fontSize:9, color:'#F59E0B' }}>℞</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Rashi Selector Grid ──────────────────────────────────────────────────────
function RashiGrid({ rashis, selected, onSelect, lang }) {
  if (!rashis) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
      {rashis.map((r) => {
        const isSelected = selected?.rashi_num === r.rashi_num;
        const scoreColor = SCORE_COLOR[r.score] || '#D4AF37';
        return (
          <button key={r.rashi_num} onClick={() => onSelect(r)} style={{
            background: isSelected ? `rgba(${hexToRgb(r.color)}, 0.15)` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isSelected ? r.color : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding:'10px 6px', cursor:'pointer',
            textAlign:'center', transition:'all 0.2s',
          }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{r.symbol}</div>
            <div style={{ fontSize:11, fontWeight:600, color: isSelected ? r.color : '#CBD5E1', marginBottom:3 }}>
              {t(lang, r.rashi_en, r.rashi_hi)}
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:1 }}>
              {[1,2,3,4,5].map((n) => (
                <span key={n} style={{ fontSize:8, color: n <= r.score ? scoreColor : 'rgba(255,255,255,0.1)' }}>★</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ─── Rashi remedies (client-side, no API needed) ─────────────────────────────
const RASHI_LORD_MAP = [null,'Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const PLANET_REMEDY = {
  Sun:     { mantra:'Om Suryaya Namah (108×)', mantra_hi:'ॐ सूर्याय नमः (108 बार)', color:'Red / Orange', color_hi:'लाल / नारंगी', gem:'Ruby or Red Garnet', gem_hi:'माणिक या लाल गार्नेट', day:'Sunday', day_hi:'रविवार', puja:'Offer water to the Sun at sunrise, donate wheat or jaggery', puja_hi:'सूर्योदय पर सूर्य को जल अर्पित करें, गेहूं या गुड़ दान करें', avoid:'Avoid ego conflicts and arguments with authority', avoid_hi:'अहंकार के कारण विवाद और अधिकारियों से झगड़े से बचें' },
  Moon:    { mantra:'Om Chandraya Namah (108×)', mantra_hi:'ॐ चंद्राय नमः (108 बार)', color:'White / Silver', color_hi:'सफेद / चांदी', gem:'Pearl or Moonstone', gem_hi:'मोती या मूनस्टोन', day:'Monday', day_hi:'सोमवार', puja:'Offer milk to Lord Shiva, visit a water body', puja_hi:'शिवजी को दूध अर्पित करें, जलाशय दर्शन करें', avoid:'Avoid emotional decisions and mood swings', avoid_hi:'भावनात्मक निर्णय और मनोदशा परिवर्तन से बचें' },
  Mars:    { mantra:'Om Mangalaya Namah (108×)', mantra_hi:'ॐ मंगलाय नमः (108 बार)', color:'Red / Coral', color_hi:'लाल / मूंगा', gem:'Red Coral', gem_hi:'मूंगा', day:'Tuesday', day_hi:'मंगलवार', puja:'Hanuman puja, offer red flowers, donate red lentils', puja_hi:'हनुमान पूजा, लाल फूल अर्पित करें, मसूर दाल दान करें', avoid:'Avoid anger, arguments, and hasty decisions', avoid_hi:'क्रोध, झगड़े और जल्दबाजी के निर्णय से बचें' },
  Mercury: { mantra:'Om Budhaya Namah (108×)', mantra_hi:'ॐ बुधाय नमः (108 बार)', color:'Green', color_hi:'हरा', gem:'Emerald or Green Tourmaline', gem_hi:'पन्ना या हरा तुरमाली', day:'Wednesday', day_hi:'बुधवार', puja:'Worship Vishnu, donate green vegetables, read scriptures', puja_hi:'विष्णु पूजा, हरी सब्जी दान, धर्मग्रंथ पाठ', avoid:'Avoid signing contracts without reading them carefully', avoid_hi:'बिना पढ़े अनुबंध पर हस्ताक्षर न करें' },
  Jupiter: { mantra:'Om Gurave Namah (108×)', mantra_hi:'ॐ गुरवे नमः (108 बार)', color:'Yellow / Gold', color_hi:'पीला / सुनहरा', gem:'Yellow Sapphire or Topaz', gem_hi:'पुखराज या टोपाज', day:'Thursday', day_hi:'गुरुवार', puja:'Vishnu Sahasranama, offer yellow sweets, donate to teachers', puja_hi:'विष्णु सहस्रनाम, पीली मिठाई अर्पित करें, गुरु/शिक्षक को दान दें', avoid:'Avoid arrogance and disrespecting teachers or elders', avoid_hi:'अहंकार और गुरु/बड़ों का अपमान करने से बचें' },
  Venus:   { mantra:'Om Shukraya Namah (108×)', mantra_hi:'ॐ शुक्राय नमः (108 बार)', color:'White / Pink', color_hi:'सफेद / गुलाबी', gem:'Diamond or White Sapphire', gem_hi:'हीरा या सफेद पुखराज', day:'Friday', day_hi:'शुक्रवार', puja:'Lakshmi puja, offer white flowers and sweets', puja_hi:'लक्ष्मी पूजा, सफेद फूल और मिठाई अर्पित करें', avoid:'Avoid over-indulgence, luxury spending, and jealousy', avoid_hi:'अत्यधिक भोग, फिजूलखर्ची और ईर्ष्या से बचें' },
  Saturn:  { mantra:'Om Shanaye Namah (108×)', mantra_hi:'ॐ शनये नमः (108 बार)', color:'Blue / Black', color_hi:'नीला / काला', gem:'Blue Sapphire (test first)', gem_hi:'नीलम (पहले परीक्षण करें)', day:'Saturday', day_hi:'शनिवार', puja:'Shani puja, light oil lamp under Peepal tree, serve the elderly', puja_hi:'शनि पूजा, पीपल के नीचे तेल का दीपक, बुजुर्गों की सेवा', avoid:'Avoid laziness, shortcuts, and disrespecting service workers', avoid_hi:'आलस्य, शॉर्टकट और सेवाकर्मियों का अपमान न करें' },
  Rahu:    { mantra:'Om Rahave Namah (108×)', mantra_hi:'ॐ राहवे नमः (108 बार)', color:'Smoky Gray / Blue', color_hi:'धुएं जैसा ग्रे / नीला', gem:'Hessonite (Gomed)', gem_hi:'गोमेद', day:'Saturday', day_hi:'शनिवार', puja:'Durga puja, donate to the poor, light incense', puja_hi:'दुर्गा पूजा, गरीबों को दान, धूप जलाएं', avoid:'Avoid illusions, obsessive thinking, and risky speculation', avoid_hi:'भ्रम, जुनूनी सोच और जोखिम भरे सट्टे से बचें' },
  Ketu:    { mantra:'Om Ketave Namah (108×)', mantra_hi:'ॐ केतवे नमः (108 बार)', color:'Brownish Gray', color_hi:'भूरा-ग्रे', gem:"Cat's Eye (Lehsunia)", gem_hi:'लहसुनिया', day:'Tuesday', day_hi:'मंगलवार', puja:'Ganesha puja, spiritual practice, donate blankets', puja_hi:'गणेश पूजा, साधना, कंबल दान', avoid:'Avoid scattered focus and ignoring spiritual needs', avoid_hi:'बिखरा ध्यान और आध्यात्मिक जरूरतों की अनदेखी से बचें' },
};

const HOUSE_EFFECT_BRIEF = {
  1:'Personal vitality, appearance, and overall day energy',
  2:'Speech, family matters, finances and food',
  3:'Communication, short travel, siblings and courage',
  4:'Home, mother, comfort and mental peace',
  5:'Creativity, children, investments and romance',
  6:'Work routine, health, competition and service',
  7:'Relationships, partnerships and public dealings',
  8:'Hidden matters, research, and sudden changes',
  9:'Fortune, travel, higher learning and blessings',
  10:'Career, authority, reputation and public image',
  11:'Income, gains, social connections and wishes',
  12:'Rest, spirituality, foreign matters and expenses',
};

// ─── Rashi Detail Card ────────────────────────────────────────────────────────
function RashiDetail({ rashi, lang }) {
  const [tab, setTab] = useState('overview');
  if (!rashi) return null;
  const scoreColor = SCORE_COLOR[rashi.score];
  const scoreLabel = t(lang, SCORE_LABEL[rashi.score], SCORE_LABEL_HI[rashi.score]);

  // Pick localized text from a server language map ({en, hi, ta, ...});
  // falls back to the legacy en/hi pair for older cached payloads.
  const L = (map, en, hi) => (map && map[lang]) || t(lang, en ?? map?.en, hi ?? map?.hi);

  const rashiLord  = RASHI_LORD_MAP[rashi.rashi_num];
  const remedy     = PLANET_REMEDY[rashiLord] || {};

  const TABS = [
    { key:'overview', en:'Overview',  hi:'सारांश'      },
    { key:'career',   en:'Career',    hi:'करियर'       },
    { key:'love',     en:'Love',      hi:'प्रेम'        },
    { key:'health',   en:'Health',    hi:'स्वास्थ्य'   },
    { key:'finance',  en:'Finance',   hi:'धन'           },
    { key:'transit',  en:'Transits',  hi:'गोचर प्रभाव' },
    { key:'remedy',   en:'Remedies',  hi:'उपाय'        },
  ];

  return (
    <motion.div key={rashi.rashi_num} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      style={{
        background:'rgba(17,20,40,0.8)', border:`1px solid ${rashi.color}33`,
        borderRadius:16, overflow:'hidden',
      }}>
      {/* Header */}
      <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:`rgba(${hexToRgb(rashi.color)},0.06)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:36 }}>{rashi.symbol}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <h2 style={{ fontSize:20, fontWeight:700, color: rashi.color, fontFamily:'Georgia,serif', margin:0 }}>
                {t(lang, rashi.rashi_en, rashi.rashi_hi)}
              </h2>
              <span style={{
                fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
                padding:'3px 10px', borderRadius:20, border:`1px solid ${scoreColor}44`,
                background:`${scoreColor}18`, color: scoreColor,
              }}>{scoreLabel}</span>
              {rashi.sade_sati?.active && (
                <span style={{ fontSize:10, color:'#F59E0B', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', padding:'2px 8px', borderRadius:12 }}>
                  ⚠ {t(lang,`Sade Sati (${rashi.sade_sati.phase})`,'साढ़ेसाती')}
                </span>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:5 }}>
              <StarRating score={rashi.score} />
              <span style={{ fontSize:11, color:'#64748B' }}>
                {L(rashi.title, rashi.title_en, rashi.title_hi)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 24px' }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding:'10px 14px', background:'none', border:'none', cursor:'pointer',
            fontSize:11, fontWeight:600, transition:'all 0.15s',
            color: tab===tb.key ? rashi.color : '#64748B',
            borderBottom: tab===tb.key ? `2px solid ${rashi.color}` : '2px solid transparent',
            marginBottom:-1,
          }}>
            {t(lang, tb.en, tb.hi)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding:'20px 24px' }}>
        {tab === 'overview' && (
          <div>
            <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, marginBottom:16 }}>
              {L(rashi.description, rashi.description_en, rashi.description_hi)}
            </p>

            {/* Advice + Caution */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div style={{ padding:'12px 14px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#22C55E', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                  ✓ {t(lang,'Today\'s Guidance','आज का मार्गदर्शन')}
                </div>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, margin:0 }}>{L(rashi.advice)}</p>
              </div>
              <div style={{ padding:'12px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                  ⚠ {t(lang,'Caution','सावधानी')}
                </div>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, margin:0 }}>{L(rashi.caution)}</p>
              </div>
            </div>

            {/* Lucky */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {[
                { label: t(lang,'Lucky Numbers','शुभ अंक'), value: rashi.lucky.numbers.join(', ') },
                { label: t(lang,'Lucky Colors','शुभ रंग'),  value: rashi.lucky.colors.join(', ')  },
                { label: t(lang,'Gemstone','रत्न'),         value: rashi.lucky.gemstone             },
                { label: t(lang,'Best Day','शुभ दिन'),      value: t(lang, rashi.lucky.day || '', rashi.lucky.day) },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding:'8px 12px', background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:8 }}>
                  <div style={{ fontSize:9, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:12, color:'#F1F5F9', fontWeight:600 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Planet positions for this rashi */}
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
                {t(lang,'Today\'s Planets from Your Sign','आपकी राशि से आज के ग्रह')}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {Object.entries(rashi.planet_positions).map(([key, house]) => {
                  const pname = key.replace('_house','');
                  const pCap = pname.charAt(0).toUpperCase() + pname.slice(1);
                  const color = PLANET_COLOR[pCap] || '#94A3B8';
                  const icon  = PLANET_ICON[pCap]  || '●';
                  return (
                    <span key={key} style={{ fontSize:10, padding:'3px 8px', background:`${color}18`, border:`1px solid ${color}33`, borderRadius:12, color }}>
                      {icon} {lang==='hi' ? (PLANET_NAME_HI[pCap]||pCap) : pCap} — H{house}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'career' && (
          <div>
            <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:'0 0 12px' }}>
              {L(rashi.career)}
            </p>
          </div>
        )}
        {tab === 'love' && (
          <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
            {L(rashi.love)}
          </p>
        )}
        {tab === 'health' && (
          <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
            {L(rashi.health)}
          </p>
        )}
        {tab === 'finance' && (
          <p style={{ fontSize:13, color:'rgba(245,240,232,0.82)', lineHeight:1.85, margin:0 }}>
            {L(rashi.finance)}
          </p>
        )}

        {/* ── Transit Effects tab ── */}
        {tab === 'transit' && (
          <div>
            <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>
              {t(lang,
                `Today's planet positions from ${rashi.rashi_en} Lagna. Each planet activates its house and area of life.`,
                `${rashi.rashi_hi} लग्न से आज के ग्रह। प्रत्येक ग्रह अपने भाव और जीवन क्षेत्र को सक्रिय करता है।`
              )}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {Object.entries(rashi.planet_positions || {}).map(([key, house]) => {
                const pname = key.replace('_house','');
                const pCap  = pname.charAt(0).toUpperCase() + pname.slice(1);
                const color = PLANET_COLOR[pCap] || '#94A3B8';
                const icon  = PLANET_ICON[pCap]  || '●';
                const nameHi = PLANET_NAME_HI[pCap] || pCap;
                const effect = HOUSE_EFFECT_BRIEF[house] || '';
                return (
                  <div key={key} style={{ display:'flex', gap:12, padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:`1px solid ${color}25`, borderRadius:10, alignItems:'flex-start' }}>
                    <span style={{ fontSize:18, color, flexShrink:0, lineHeight:1.4 }}>{icon}</span>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:12, fontWeight:700, color }}>{t(lang, pCap, nameHi)}</span>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>in</span>
                        <span style={{ fontSize:11, fontWeight:600, color:'#CBD5E1' }}>House {house}</span>
                        <span style={{ fontSize:9, color:'#475569', background:'rgba(255,255,255,0.05)', padding:'2px 7px', borderRadius:8 }}>{t(lang,`H${house}`,`${house}वां भाव`)}</span>
                      </div>
                      <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.7, margin:0 }}>{effect}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Remedy tab ── */}
        {tab === 'remedy' && (
          <div>
            <div style={{ marginBottom:14, padding:'10px 14px', background:`rgba(${hexToRgb(rashi.color)},0.08)`, border:`1px solid ${rashi.color}33`, borderRadius:10 }}>
              <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.75, margin:0 }}>
                {t(lang,
                  `Remedies are based on ${rashi.rashi_en}'s ruling planet: ${rashiLord}. Performing these consistently strengthens your rashi lord and reduces day-to-day challenges.`,
                  `ये उपाय ${rashi.rashi_hi} के स्वामी ग्रह ${PLANET_NAME_HI[rashiLord] || rashiLord} पर आधारित हैं। नियमित रूप से करने से राशि स्वामी मजबूत होते हैं।`
                )}
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { icon:'📿', en:'Daily Mantra', hi:'दैनिक मंत्र', val_en: remedy.mantra, val_hi: remedy.mantra_hi },
                { icon:'🔵', en:'Lucky Color Today', hi:'आज का शुभ रंग', val_en: remedy.color, val_hi: remedy.color_hi },
                { icon:'💎', en:'Recommended Gem', hi:'अनुशंसित रत्न', val_en: remedy.gem, val_hi: remedy.gem_hi },
                { icon:'📅', en:'Best Day for Puja', hi:'पूजा का शुभ दिन', val_en: remedy.day, val_hi: remedy.day_hi },
              ].map(({ icon, en, hi, val_en, val_hi }) => (
                <div key={en} style={{ padding:'12px 14px', background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:10 }}>
                  <div style={{ fontSize:10, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{icon} {t(lang, en, hi)}</div>
                  <div style={{ fontSize:12, color:'#F1F5F9', fontWeight:600 }}>{t(lang, val_en, val_hi) || '—'}</div>
                </div>
              ))}
            </div>
            {/* Puja steps */}
            {remedy.puja && (
              <div style={{ marginTop:10, padding:'12px 14px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:10, color:'#22C55E', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>🙏 {t(lang,'Today\'s Puja & Actions','आज की पूजा और कार्य')}</div>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.75, margin:0 }}>{t(lang, remedy.puja, remedy.puja_hi)}</p>
              </div>
            )}
            {/* What to avoid */}
            {remedy.avoid && (
              <div style={{ marginTop:10, padding:'12px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:10, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>⚠ {t(lang,'Avoid Today','आज से बचें')}</div>
                <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.75, margin:0 }}>{t(lang, remedy.avoid, remedy.avoid_hi)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DailyHoroscope() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [userRashi, setUserRashi] = useState(null);
  const [dayOffset, setDayOffset] = useState(0); // -1 yesterday, 0 today, +1 tomorrow

  // Load horoscope for the selected day
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let url = '/horoscope/daily';
        if (dayOffset !== 0) {
          const d = new Date(Date.now() + dayOffset * 86400e3);
          url += `?date=${d.toISOString().slice(0, 10)}`;
        }
        const res = await api.get(url);
        setData(res.data);
        setSelected((prev) => {
          const keep = prev && res.data.rashis?.find((r) => r.rashi_num === prev.rashi_num);
          return keep || res.data.rashis?.[0] || null;
        });
      } catch (e) {
        console.error('Horoscope load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dayOffset]);

  // If logged in, load user's primary kundli to find their Moon rashi
  useEffect(() => {
    if (!user || !data) return;
    const loadKundli = async () => {
      try {
        const listRes = await api.get('/kundli');
        const profiles = listRes.data.profiles || [];
        if (!profiles.length) return;
        const first = profiles[0];
        const detailRes = await api.get(`/kundli/${first.uuid}`);
        const chart = detailRes.data.profile?.calculated_data;
        if (typeof chart === 'string') {
          try {
            const parsed = JSON.parse(chart);
            const moonRashiNum = parsed?.planets?.Moon?.rashi_num;
            if (moonRashiNum) {
              setUserRashi(moonRashiNum);
              const match = data.rashis?.find((r) => r.rashi_num === moonRashiNum);
              if (match) setSelected(match);
            }
          } catch {}
        } else if (chart?.planets?.Moon?.rashi_num) {
          const moonRashiNum = chart.planets.Moon.rashi_num;
          setUserRashi(moonRashiNum);
          const match = data.rashis?.find((r) => r.rashi_num === moonRashiNum);
          if (match) setSelected(match);
        }
      } catch {}
    };
    loadKundli();
  }, [user, data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>☽</div>
          <p style={{ color:'#D4AF37', fontSize:14 }}>{t(lang,'Loading today\'s cosmic reading…','आज की ब्रह्मांडीय रीडिंग लोड हो रही है…')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={60} />
      <div className="relative z-10 max-w-8xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
          <p style={{ color:'rgba(212,175,55,0.5)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.35em', marginBottom:6 }}>
            {t(lang,'Rashi Phal','राशि फल')}
          </p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#F1F5F9', marginBottom:4 }}>
            {t(lang,'Daily Horoscope','दैनिक राशिफल')}
          </h1>
          <p style={{ color:'rgba(245,240,232,0.45)', fontSize:13 }}>
            {data?.date ? fmtDate(data.date) : ''}
            {userRashi && data && (
              <span style={{ marginLeft:12, color:'#D4AF37' }}>
                {t(lang,'·  Your Moon sign is highlighted','·  आपकी चंद्र राशि हाइलाइट है')}
              </span>
            )}
          </p>
        </motion.div>

        {/* ── Push opt-in ── */}
        <PushOptIn defaultRashi={userRashi || 1} />

        {/* ── Period tabs + day chips ── */}
        <PeriodTabs />
        <div style={{ display:'flex', gap:6, marginBottom:20, marginTop:-8 }}>
          {[
            { off:-1, en:'Yesterday', hi:'कल (बीता)' },
            { off:0,  en:'Today',     hi:'आज'        },
            { off:1,  en:'Tomorrow',  hi:'कल (आगामी)' },
          ].map((d) => (
            <button key={d.off} onClick={() => setDayOffset(d.off)} style={{
              fontSize:11, fontWeight:600, cursor:'pointer',
              padding:'5px 14px', borderRadius:16,
              border:`1px solid ${dayOffset === d.off ? 'rgba(148,163,184,0.7)' : 'rgba(148,163,184,0.2)'}`,
              background: dayOffset === d.off ? 'rgba(148,163,184,0.15)' : 'transparent',
              color: dayOffset === d.off ? '#F1F5F9' : 'rgba(245,240,232,0.45)',
              transition:'all 0.2s',
            }}>
              {t(lang, d.en, d.hi)}
            </button>
          ))}
        </div>

        {/* ── Today's Moon ── */}
        {data?.moon_sign && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.05 }}
            style={{ marginBottom:20, padding:'14px 20px', background:'rgba(148,163,184,0.08)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:12, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:28 }}>☽</span>
            <div>
              <div style={{ fontSize:10, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:2 }}>
                {t(lang,'Moon in','चंद्र राशि में')}
              </div>
              <div style={{ fontSize:16, color:'#F1F5F9', fontWeight:700 }}>
                {t(lang, data.moon_sign.rashi_en, data.moon_sign.rashi_hi)}
                <span style={{ fontSize:12, color:'#64748B', fontWeight:400, marginLeft:8 }}>
                  {data.moon_sign.degree}°
                </span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <TransitStrip summary={data.transit_summary} lang={lang} />
            </div>
          </motion.div>
        )}

        {/* ── Main Grid: Selector + Detail ── */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(260px,1fr) 2fr', gap:20, alignItems:'start' }}>

          {/* Rashi Selector */}
          <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
            <div style={{ padding:'16px', background:'rgba(17,20,40,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, marginBottom:14 }}>
              <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>
                {t(lang,'Select Your Rashi','अपनी राशि चुनें')}
              </p>
              <RashiGrid rashis={data?.rashis} selected={selected} onSelect={setSelected} lang={lang} />
            </div>

            {/* Scores legend */}
            <div style={{ padding:'12px 14px', background:'rgba(17,20,40,0.5)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
              <p style={{ fontSize:10, color:'#64748B', marginBottom:8 }}>{t(lang,'Day Rating Guide','दिन रेटिंग गाइड')}</p>
              {[5,4,3,2,1].map((s) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <StarRating score={s} />
                  <span style={{ fontSize:11, color: SCORE_COLOR[s] }}>
                    {t(lang, SCORE_LABEL[s], SCORE_LABEL_HI[s])}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Detail */}
          <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.12 }}>
            {selected
              ? <RashiDetail rashi={selected} lang={lang} />
              : (
                <div style={{ padding:40, textAlign:'center', color:'#64748B' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>☽</div>
                  <p>{t(lang,'Select a rashi to read your daily horoscope','अपनी राशि चुनें')}</p>
                </div>
              )
            }
          </motion.div>
        </div>

        {/* ── All Rashis Summary Strip ── */}
        {data?.rashis && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            style={{ marginTop:24, padding:'16px 20px', background:'rgba(17,20,40,0.6)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
            <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>
              {t(lang,'All Rashis — Today at a Glance','सभी राशियां — आज एक नज़र में')}
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {data.rashis.map((r) => {
                const sc = SCORE_COLOR[r.score];
                const isMe = userRashi === r.rashi_num;
                return (
                  <button key={r.rashi_num} onClick={() => { setSelected(r); window.scrollTo({ top:0, behavior:'smooth' }); }} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                    background: isMe ? `rgba(${hexToRgb(r.color)},0.15)` : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${isMe ? r.color : sc + '44'}`,
                    borderRadius:20, cursor:'pointer', transition:'all 0.15s',
                  }}>
                    <span style={{ fontSize:14 }}>{r.symbol}</span>
                    <span style={{ fontSize:11, color:'#CBD5E1' }}>{t(lang, r.rashi_en, r.rashi_hi)}</span>
                    <span style={{ fontSize:10, color: sc }}>{'★'.repeat(r.score)}</span>
                    {isMe && <span style={{ fontSize:9, color: r.color }}>●</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Browse by sign (dedicated SEO landing pages) ── */}
        <div style={{ marginTop:24, padding:'16px 20px', background:'rgba(17,20,40,0.6)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
          <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>
            {t(lang,'Full Horoscope by Sign','राशि अनुसार पूर्ण राशिफल')}
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {SIGNS.map((s) => (
              <Link key={s.slug} href={`/horoscope/${s.slug}`} style={{
                display:'flex', alignItems:'center', gap:6, padding:'6px 12px', textDecoration:'none',
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:20, color:'#CBD5E1', fontSize:11,
              }}>
                <span style={{ fontSize:14 }}>{s.symbol}</span>
                {t(lang, s.en, s.hi)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
