'use client';
import { useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const t = (lang, en, hi) => lang === 'hi' ? hi : en;

const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B', hi:'सूर्य'    },
  Moon:    { icon:'☽', color:'#94A3B8', hi:'चन्द्र'   },
  Mars:    { icon:'♂', color:'#EF4444', hi:'मंगल'      },
  Mercury: { icon:'☿', color:'#10B981', hi:'बुध'       },
  Jupiter: { icon:'♃', color:'#FBBF24', hi:'बृहस्पति' },
  Venus:   { icon:'♀', color:'#F472B6', hi:'शुक्र'     },
  Saturn:  { icon:'♄', color:'#818CF8', hi:'शनि'       },
  Rahu:    { icon:'☊', color:'#A78BFA', hi:'राहु'      },
  Ketu:    { icon:'☋', color:'#6B7280', hi:'केतु'      },
};

// Dignity display — strength % from EDOFEN PDF (exalt=100%, own=70%, debil=10%)
const DIGNITY_INFO = {
  'Exaltation (उच्च)':        { label_en:'★ Excellent',   label_hi:'★ उत्कृष्ट',        strength:100, desc_en:'Maximum strength (100%) — outstanding results', desc_hi:'अधिकतम शक्ति (100%) — उत्कृष्ट परिणाम', color:'#22C55E', bg:'rgba(34,197,94,0.1)' },
  'Moolatrikona (मूलत्रिकोण)':{ label_en:'◆ Very Strong', label_hi:'◆ बहुत शक्तिशाली', strength:85,  desc_en:'Very strong (85%) — in preferred zone',          desc_hi:'बहुत शक्तिशाली (85%) — प्रिय क्षेत्र में',   color:'#F59E0B', bg:'rgba(245,158,11,0.1)' },
  'Own Sign (स्वगृह)':         { label_en:'✦ Strong',      label_hi:'✦ शक्तिशाली',       strength:70,  desc_en:'Strong (70%) — comfortable in own sign',         desc_hi:'शक्तिशाली (70%) — अपनी राशि में',            color:'#60A5FA', bg:'rgba(96,165,250,0.1)' },
  'Neutral':                  { label_en:'○ Normal',      label_hi:'○ सामान्य',          strength:50,  desc_en:'Average (50%) — neutral results',                desc_hi:'औसत (50%) — सामान्य परिणाम',                color:'#9CA3AF', bg:'rgba(107,114,128,0.08)' },
  'Debilitation (नीच)':       { label_en:'▼ Needs Care',  label_hi:'▼ ध्यान दें',        strength:10,  desc_en:'Low strength (10%) — remedies recommended',      desc_hi:'कम शक्ति (10%) — उपाय अनुशंसित',             color:'#EF4444', bg:'rgba(239,68,68,0.1)' },
};

// Sign-lord relation display (friend/enemy/neutral — from EDOFEN PDF page 3)
const RELATION_INFO = {
  friend:  { label_en:'Friend\'s Sign',  label_hi:'मित्र राशि',  color:'#22C55E', icon:'✓' },
  enemy:   { label_en:'Enemy\'s Sign',   label_hi:'शत्रु राशि',  color:'#EF4444', icon:'✗' },
  neutral: { label_en:'Neutral Sign',    label_hi:'सम राशि',     color:'#9CA3AF', icon:'○' },
  self:    { label_en:'Own Sign',        label_hi:'स्वराशि',     color:'#60A5FA', icon:'★' },
};

// Bhava (house) type badge styling
const BHAVA_BADGE = {
  kendra:   { label_en:'Kendra',   label_hi:'केंद्र',    color:'#D4AF37', bg:'rgba(212,175,55,0.12)' },
  trikona:  { label_en:'Trikona',  label_hi:'त्रिकोण',   color:'#22C55E', bg:'rgba(34,197,94,0.12)'  },
  dusthana: { label_en:'Dusthana', label_hi:'दुस्थान',   color:'#EF4444', bg:'rgba(239,68,68,0.12)'  },
  upachaya: { label_en:'Upachaya', label_hi:'उपचय',      color:'#A78BFA', bg:'rgba(167,139,250,0.12)' },
  maarak:   { label_en:'Maarak',   label_hi:'मारक',      color:'#F97316', bg:'rgba(249,115,22,0.12)'  },
};

// Nature → card border/bg tint
const NATURE_TINT = {
  kendra:   { border:'rgba(212,175,55,0.3)',  bg:'rgba(212,175,55,0.04)'  },
  trikona:  { border:'rgba(34,197,94,0.25)',  bg:'rgba(34,197,94,0.04)'   },
  dusthana: { border:'rgba(239,68,68,0.22)',  bg:'rgba(239,68,68,0.04)'   },
  upachaya: { border:'rgba(167,139,250,0.2)', bg:'rgba(167,139,250,0.04)' },
  neutral:  { border:'rgba(212,175,55,0.1)',  bg:'rgba(255,255,255,0.06)'    },
};

// Plain-language guna badge
const GUNA_INFO = {
  Satvik: { label_en:'Satvik — Pure & Wise',        label_hi:'साात्विक — शुद्ध और ज्ञानी', color:'#22C55E', bg:'rgba(34,197,94,0.12)'  },
  Rajsik: { label_en:'Rajsik — Active & Ambitious', label_hi:'राजसिक — सक्रिय और महत्वाकांक्षी', color:'#F59E0B', bg:'rgba(245,158,11,0.12)' },
  Tamsik: { label_en:'Tamsik — Intense & Karmic',   label_hi:'तामसिक — तीव्र और कार्मिक', color:'#818CF8', bg:'rgba(129,140,248,0.12)' },
};

// ─── Sign lord map (for lagna lord lookup) ────────────────────────────────────
const SIGN_LORD = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
//                  1-Ari 2-Tau   3-Gem    4-Can  5-Leo 6-Vir     7-Lib   8-Sco  9-Sag     10-Cap   11-Aqu   12-Pis

// ─── ExpandableText — shows full text with a read-more toggle ────────────────
function ExpandableText({ text, lang = 'en', limit = 340, textStyle }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const needsCut = text.length > limit + 40;
  const display  = !needsCut || open ? text : text.substring(0, limit);
  return (
    <>
      <span style={textStyle}>{display}</span>
      {needsCut && !open && <span style={{ color:'rgba(245,240,232,0.70)' }}>… </span>}
      {needsCut && (
        <button type="button" onClick={() => setOpen(v => !v)} style={{
          background:'none', border:'none', cursor:'pointer',
          color:'rgba(212,175,55,0.7)', fontSize:10, fontWeight:700,
          padding:'0 4px', verticalAlign:'baseline',
        }}>
          {open ? t(lang, '↑ Show less', '↑ कम दिखाएं') : t(lang, 'Read more ↓', 'और पढ़ें ↓')}
        </button>
      )}
    </>
  );
}

// Court role plain description
function courtRoleDesc(role, lang) {
  const map = {
    King:      [' — Commands authority in life',    ' — जीवन में अधिकार का संचालन करता है'],
    Queen:     [' — Governs emotions and mind',     ' — भावनाओं और मन का शासन करती है'],
    Commander: [' — Drives courage and action',     ' — साहस और कार्रवाई को प्रेरित करता है'],
    Prince:    [' — Rules intellect and commerce',  ' — बुद्धि और व्यापार पर शासन करता है'],
    Minister:  [' — Bestows wisdom and justice',    ' — ज्ञान और न्याय प्रदान करता है'],
    Servant:   [' — Teaches discipline and karma',  ' — अनुशासन और कर्म सिखाता है'],
    Army:      [' — Creates karmic crossroads',     ' — कार्मिक चौराहे बनाता है'],
  };
  const pair = map[role] || ['',''];
  return pair[lang === 'hi' ? 1 : 0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:'7px 14px', borderRadius:8, fontSize:11, fontWeight:600,
        background: active ? 'rgba(212,175,55,0.18)' : 'transparent',
        color: active ? '#D4AF37' : 'rgba(245,240,232,0.45)',
        border: active ? '1px solid rgba(212,175,55,0.35)' : '1px solid transparent',
        cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.18s',
      }}>
      {children}
    </button>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <p style={{ color:'rgba(212,175,55,0.55)', fontSize:10, textTransform:'uppercase',
      letterSpacing:'0.18em', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
      {icon && <span>{icon}</span>}{children}
    </p>
  );
}

function Badge({ bg, color, children, border }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600,
      background: bg, color, border: border || `1px solid ${color}33`,
    }}>{children}</span>
  );
}

// ─── Tab 1: Summary ───────────────────────────────────────────────────────────

const HOUSE_AREA = ['','Self & Body','Wealth & Speech','Siblings & Courage','Home & Mother','Intelligence & Children','Health & Debts','Marriage & Partnerships','Longevity & Hidden','Luck & Higher Learning','Career & Status','Gains & Network','Expenses & Spirituality'];
const HOUSE_AREA_HI = ['','स्वयं और शरीर','धन और वाणी','भाई-बहन और साहस','घर और माता','बुद्धि और संतान','स्वास्थ्य और ऋण','विवाह और साझेदारी','आयु और रहस्य','भाग्य और ज्ञान','कैरियर और प्रतिष्ठा','लाभ और नेटवर्क','खर्च और अध्यात्म'];

function validHouse(value) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 12 ? num : null;
}

function planetHouse(chart, placement) {
  const directHouse = validHouse(placement?.house ?? placement?.house_num ?? placement?.house_number ?? placement?.bhava);
  if (directHouse) return directHouse;

  const ascRashi = validHouse(chart?.ascendant?.rashi_num);
  const planetRashi = validHouse(placement?.rashi_num);
  if (!ascRashi || !planetRashi) return null;

  return ((planetRashi - ascRashi + 12) % 12) + 1;
}

function planetEntriesWithHouse(chart) {
  return Object.entries(chart?.planets || {}).map(([name, placement]) => [
    name,
    { ...placement, house: planetHouse(chart, placement) },
  ]);
}

function houseAreaText(house, lang) {
  const num = validHouse(house);
  if (!num) return null;
  return lang === 'hi' ? HOUSE_AREA_HI[num] : HOUSE_AREA[num];
}

function compactHouseText(house, lang) {
  const num = validHouse(house);
  return num ? `${t(lang, 'H', 'भाव')}${num}` : t(lang, 'House pending', 'भाव प्रतीक्षित');
}

function houseValueText(house, lang) {
  const num = validHouse(house);
  return num || t(lang, 'Pending', 'प्रतीक्षित');
}

function SummaryTab({ chart, enrichment, lang }) {
  const lagna = enrichment?.lagna_sign;
  const moon  = enrichment?.moon_sign;
  const curDasha = Array.isArray(chart?.dasha) ? (chart.dasha.find(d => d.is_current) || chart.dasha[0]) : null;
  const curAntar  = curDasha?.antardasha?.find?.(a => a.is_current);

  // Planets assessment
  const planetEntries = planetEntriesWithHouse(chart);
  const good     = planetEntries.filter(([,p]) => ['Exaltation (उच्च)','Moolatrikona (मूलत्रिकोण)','Own Sign (स्वगृह)'].includes(p.dignity));
  const watchOut = planetEntries.filter(([,p]) => p.dignity === 'Debilitation (नीच)');

  // Lagna lord placement (practical key insight)
  const ascRashiNum = chart?.ascendant?.rashi_num;
  const lagnaLord   = chart?.ascendant?.rashi_lord || (ascRashiNum ? SIGN_LORD[ascRashiNum - 1] : null);
  const lagnaLordPl = lagnaLord ? chart?.planets?.[lagnaLord] : null;
  const lagnaLordHouse = planetHouse(chart, lagnaLordPl);
  const lagnaLordAreaEn = houseAreaText(lagnaLordHouse, 'en');
  const lagnaLordAreaHi = houseAreaText(lagnaLordHouse, 'hi');

  // Yogas / Doshas count
  const yogasCount  = chart?.yogas_doshas?.yogas?.length  || 0;
  const doshasCount = chart?.yogas_doshas?.doshas?.length || 0;

  // Moon nakshatra
  const nak = chart?.nakshatra;

  const dashaColor = curDasha?.nature === 'benefic' ? '#22C55E' : curDasha?.nature === 'malefic' ? '#EF4444' : '#A78BFA';
  const dashaLabel = curDasha?.nature === 'benefic'
    ? t(lang, 'Favorable period', 'शुभ काल')
    : curDasha?.nature === 'malefic'
    ? t(lang, 'Challenging period', 'कठिन काल')
    : t(lang, 'Significant period', 'महत्वपूर्ण काल');

  return (
    <div className="space-y-5">

      {/* ── Quick Identity Strip ── */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        {lagna && (
          <div style={{ flex:'1 1 120px', border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'10px 14px',
            background:'rgba(212,175,55,0.05)', minWidth:110 }}>
            <p style={{ color:'rgba(212,175,55,0.5)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.15em' }}>
              {t(lang,'Lagna','लग्न')}
            </p>
            <p style={{ color:'#D4AF37', fontSize:15, fontFamily:'Georgia,serif', fontWeight:700, marginTop:2 }}>
              {lang === 'hi' ? lagna.name_hi : lagna.name}
            </p>
            {lagnaLord && lagnaLordPl && lagnaLordHouse && (
              <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, marginTop:3 }}>
                {t(lang,'Lord:','स्वामी:')} <span style={{ color: PLANET_META[lagnaLord]?.color }}>
                  {lang === 'hi' ? PLANET_META[lagnaLord]?.hi : lagnaLord}
                </span>
                {' '}{t(lang,'in House','भाव में')} <strong style={{ color:'rgba(245,240,232,0.7)' }}>
                  {lagnaLordHouse}
                </strong>
                {' '}<span style={{ color:'rgba(245,240,232,0.73)', fontSize:9 }}>
                  ({lang === 'hi' ? lagnaLordAreaHi : lagnaLordAreaEn})
                </span>
              </p>
            )}
          </div>
        )}
        {moon && (
          <div style={{ flex:'1 1 120px', border:'1px solid rgba(148,163,184,0.2)', borderRadius:10, padding:'10px 14px',
            background:'rgba(148,163,184,0.04)', minWidth:110 }}>
            <p style={{ color:'rgba(148,163,184,0.5)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.15em' }}>
              {t(lang,'Moon Sign','चन्द्र राशि')}
            </p>
            <p style={{ color:'#94A3B8', fontSize:15, fontFamily:'Georgia,serif', fontWeight:700, marginTop:2 }}>
              {lang === 'hi' ? moon.name_hi : moon.name}
            </p>
            {nak?.en && (
              <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, marginTop:3 }}>
                {t(lang,'Nakshatra:','नक्षत्र:')} <span style={{ color:'rgba(245,240,232,0.65)' }}>
                  {lang === 'hi' ? (nak.hi || nak.en) : nak.en}
                </span>
                {nak.pada && <span style={{ color:'rgba(245,240,232,0.70)' }}> {t(lang,'Pada','चरण')} {nak.pada}</span>}
              </p>
            )}
          </div>
        )}
        {curDasha && (
          <div style={{ flex:'1 1 140px', border:`1px solid ${dashaColor}33`, borderRadius:10, padding:'10px 14px',
            background:`${dashaColor}08`, minWidth:130 }}>
            <p style={{ color:`${dashaColor}99`, fontSize:9, textTransform:'uppercase', letterSpacing:'0.15em' }}>
              {t(lang,'Current Dasha','वर्तमान दशा')}
            </p>
            <p style={{ color: dashaColor, fontSize:15, fontFamily:'Georgia,serif', fontWeight:700, marginTop:2 }}>
              {lang === 'hi' ? PLANET_META[curDasha.lord]?.hi : curDasha.lord}
            </p>
            <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, marginTop:3 }}>
              {dashaLabel} · {t(lang,'ends','समाप्त')} {curDasha.end}
            </p>
          </div>
        )}
      </div>

      {/* ── Lagna Sign — full description ── */}
      {lagna && (
        <div style={{ border:'1px solid rgba(212,175,55,0.22)', borderRadius:12, padding:'16px 18px',
          background:'rgba(212,175,55,0.04)' }}>
          <SectionTitle icon="🔺">{t(lang, 'Your Ascendant (Lagna) — The Real You', 'आपका लग्न — आपका असली स्वरूप')}</SectionTitle>
          {lagna.key_traits_en && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
              {(lang === 'hi' ? lagna.key_traits_hi : lagna.key_traits_en)
                ?.split(',').map((trait, i) => (
                <Badge key={i} bg="rgba(212,175,55,0.08)" color="#D4AF37">
                  {trait.trim()}
                </Badge>
              ))}
            </div>
          )}
          {(lang === 'hi' ? lagna.detailed_description_hi : lagna.detailed_description_en) && (
            <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.8,
              borderTop:'1px solid rgba(212,175,55,0.1)', paddingTop:10, marginTop:6 }}>
              <ExpandableText
                text={lang === 'hi' ? lagna.detailed_description_hi : lagna.detailed_description_en}
                lang={lang}
                textStyle={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.8 }}
              />
            </p>
          )}
          {/* Practical lagna lord insight */}
          {lagnaLord && lagnaLordPl && (
            <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8,
              background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.12)' }}>
              <p style={{ color:'rgba(245,240,232,0.55)', fontSize:11, lineHeight:1.7 }}>
                💡 <strong style={{ color:'#D4AF37' }}>
                  {t(lang, 'Practical insight:', 'व्यावहारिक अंतर्दृष्टि:')}
                </strong>{' '}
                {t(lang,
                  lagnaLordHouse
                    ? `Your Lagna lord ${lagnaLord} sits in House ${lagnaLordHouse} (${lagnaLordAreaEn}). This means your core life energy flows toward ${lagnaLordAreaEn.toLowerCase()}.`
                    : `Your Lagna lord ${lagnaLord} is present in this chart, but its exact house placement is not ready yet. Recalculate this Kundli to refresh the practical reading.`,
                  lagnaLordHouse
                    ? `आपका लग्न स्वामी ${PLANET_META[lagnaLord]?.hi || lagnaLord} भाव ${lagnaLordHouse} (${lagnaLordAreaHi}) में है। इसका अर्थ है कि आपकी मूल जीवन ऊर्जा ${lagnaLordAreaHi} की ओर बहती है।`
                    : `आपका लग्न स्वामी ${PLANET_META[lagnaLord]?.hi || lagnaLord} चार्ट में उपलब्ध है, लेकिन उसकी सटीक भाव स्थिति अभी तैयार नहीं है। व्यावहारिक पाठ ताज़ा करने के लिए इस कुंडली को दोबारा गणना करें।`
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Moon Sign — full description ── */}
      {moon && (
        <div style={{ border:'1px solid rgba(148,163,184,0.2)', borderRadius:12, padding:'16px 18px',
          background:'rgba(148,163,184,0.04)' }}>
          <SectionTitle icon="🌙">{t(lang, 'Your Moon Sign — Your Inner World', 'आपकी चन्द्र राशि — आपका आंतरिक जगत')}</SectionTitle>
          {moon.key_traits_en && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
              {(lang === 'hi' ? moon.key_traits_hi : moon.key_traits_en)
                ?.split(',').map((trait, i) => (
                <Badge key={i} bg="rgba(148,163,184,0.1)" color="#94A3B8">
                  {trait.trim()}
                </Badge>
              ))}
            </div>
          )}
          <p style={{ color:'rgba(245,240,232,0.55)', fontSize:12, lineHeight:1.8 }}>
            <ExpandableText
              text={lang === 'hi' ? moon.detailed_description_hi : moon.detailed_description_en}
              lang={lang}
              textStyle={{ color:'rgba(245,240,232,0.55)', fontSize:12, lineHeight:1.8 }}
            />
          </p>
          {/* Nakshatra practical note */}
          {nak?.en && (
            <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8,
              background:'rgba(148,163,184,0.06)', border:'1px solid rgba(148,163,184,0.12)' }}>
              <p style={{ color:'rgba(245,240,232,0.55)', fontSize:11, lineHeight:1.7 }}>
                🌟 <strong style={{ color:'#94A3B8' }}>{t(lang,'Your Nakshatra:','आपका नक्षत्र:')}</strong>{' '}
                {lang === 'hi' ? (nak.hi || nak.en) : nak.en}
                {nak.pada ? ` ${t(lang,'Pada','चरण')} ${nak.pada}` : ''}.{' '}
                {t(lang,
                  'The Nakshatra reveals your soul\'s deeper nature, instincts, and innate talents.',
                  'नक्षत्र आपकी आत्मा की गहरी प्रकृति, प्रवृत्तियों और जन्मजात प्रतिभाओं को प्रकट करता है।'
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Current Dasha — practical ── */}
      {curDasha && (
        <div style={{ border:`1px solid ${dashaColor}30`, borderRadius:12, padding:'16px 18px',
          background:`${dashaColor}06` }}>
          <SectionTitle icon="⏳">{t(lang, 'Your Current Life Period (Dasha)', 'आपका वर्तमान जीवन काल (दशा)')}</SectionTitle>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ color: dashaColor, fontSize:18, fontFamily:'Georgia,serif', fontWeight:700 }}>
              {lang === 'hi' ? PLANET_META[curDasha.lord]?.hi : curDasha.lord} {t(lang,'Mahadasha','महादशा')}
            </span>
            <Badge bg={`${dashaColor}18`} color={dashaColor}>{dashaLabel}</Badge>
            <span style={{ color:'rgba(245,240,232,0.73)', fontSize:11 }}>
              {curDasha.start} → {curDasha.end}
            </span>
          </div>
          {curAntar && (
            <p style={{ color:'rgba(245,240,232,0.55)', fontSize:11, marginBottom:10 }}>
              {t(lang,'Sub-period (Antardasha):','उप-काल (अंतर्दशा):')}
              {' '}<strong style={{ color: PLANET_META[curAntar.lord]?.color || dashaColor }}>
                {lang === 'hi' ? PLANET_META[curAntar.lord]?.hi : curAntar.lord}
              </strong>
              {' '}{t(lang,'until','तक')} {curAntar.end}
            </p>
          )}
          <p style={{ color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.8 }}>
            {t(lang,
              `The ${curDasha.lord} Mahadasha shapes the overall theme of this phase of your life. The planet ${curDasha.lord} governs the life areas connected to its house placement and natural karakatva. Focus your energy in alignment with this planet's qualities for best results.`,
              `${PLANET_META[curDasha.lord]?.hi || curDasha.lord} महादशा आपके जीवन के इस चरण का समग्र विषय तय करती है। ${PLANET_META[curDasha.lord]?.hi || curDasha.lord} ग्रह अपनी भाव स्थिति और प्राकृतिक कारकत्व से जुड़े जीवन क्षेत्रों को नियंत्रित करता है। सर्वोत्तम परिणाम के लिए इस ग्रह की गुणों के अनुसार ऊर्जा लगाएं।`
            )}
          </p>
        </div>
      )}

      {/* ── Yogas & Doshas Quick Count ── */}
      {(yogasCount > 0 || doshasCount > 0) && (
        <div className="responsive-two-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:'14px 16px',
            background:'rgba(34,197,94,0.04)', textAlign:'center' }}>
            <p style={{ color:'#22C55E', fontSize:26, fontWeight:700 }}>{yogasCount}</p>
            <p style={{ color:'rgba(245,240,232,0.6)', fontSize:11, marginTop:2 }}>
              {t(lang,'Active Yogas','सक्रिय योग')}
            </p>
            <p style={{ color:'rgba(245,240,232,0.73)', fontSize:10, marginTop:4 }}>
              {t(lang,'Positive planetary combinations in your chart','आपकी कुंडली में शुभ ग्रह योग')}
            </p>
          </div>
          <div style={{ border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'14px 16px',
            background:'rgba(239,68,68,0.04)', textAlign:'center' }}>
            <p style={{ color: doshasCount > 0 ? '#EF4444' : '#22C55E', fontSize:26, fontWeight:700 }}>
              {doshasCount}
            </p>
            <p style={{ color:'rgba(245,240,232,0.6)', fontSize:11, marginTop:2 }}>
              {t(lang,'Active Doshas','सक्रिय दोष')}
            </p>
            <p style={{ color:'rgba(245,240,232,0.73)', fontSize:10, marginTop:4 }}>
              {doshasCount === 0
                ? t(lang,'No doshas detected — good overall chart','कोई दोष नहीं — अच्छी कुंडली')
                : t(lang,'Karmic patterns needing attention + remedies','उपाय की आवश्यकता वाले कार्मिक संयोग')}
            </p>
          </div>
        </div>
      )}

      {/* ── Strong / Watch-out Planets ── */}
      <div className="responsive-two-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:'14px 16px',
          background:'rgba(34,197,94,0.04)' }}>
          <SectionTitle icon="✅">{t(lang, 'Strong Planets', 'शक्तिशाली ग्रह')}</SectionTitle>
          {good.length ? good.map(([name, pd]) => (
            <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              marginBottom:6, flexWrap:'wrap', gap:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color: PLANET_META[name]?.color, fontSize:13 }}>{PLANET_META[name]?.icon}</span>
                <span style={{ color:'rgba(245,240,232,0.85)', fontSize:12, fontWeight:600 }}>
                  {lang === 'hi' ? PLANET_META[name]?.hi : name}
                </span>
              </div>
              <span style={{ color:'rgba(245,240,232,0.73)', fontSize:10 }}>
                {compactHouseText(pd.house, lang)} · {lang === 'hi' ? pd.rashi_hi : pd.rashi_en}
              </span>
            </div>
          )) : (
            <p style={{ color:'rgba(245,240,232,0.70)', fontSize:11 }}>
              {t(lang, 'None in exaltation, moolatrikona, or own sign', 'कोई उच्च, मूलत्रिकोण या स्वराशि में नहीं')}
            </p>
          )}
        </div>
        <div style={{ border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'14px 16px',
          background:'rgba(239,68,68,0.04)' }}>
          <SectionTitle icon="⚠️">{t(lang, 'Planets Needing Attention', 'ध्यान देने योग्य ग्रह')}</SectionTitle>
          {watchOut.length ? watchOut.map(([name, pd]) => (
            <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              marginBottom:6, flexWrap:'wrap', gap:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color: PLANET_META[name]?.color, fontSize:13 }}>{PLANET_META[name]?.icon}</span>
                <span style={{ color:'rgba(245,240,232,0.85)', fontSize:12, fontWeight:600 }}>
                  {lang === 'hi' ? PLANET_META[name]?.hi : name}
                </span>
              </div>
              <span style={{ color:'rgba(245,240,232,0.73)', fontSize:10 }}>
                {compactHouseText(pd.house, lang)} · {t(lang,'Debilitated','नीच')}
              </span>
            </div>
          )) : (
            <p style={{ color:'rgba(245,240,232,0.70)', fontSize:11 }}>
              {t(lang, 'No debilitated planets — good overall strength', 'कोई नीच ग्रह नहीं — अच्छी समग्र शक्ति')}
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Tab 2: Your Planets ──────────────────────────────────────────────────────

function PlanetsTab({ chart, enrichment, lang }) {
  const planetMeta = enrichment?.planet_meta || {};
  const planetEntries = planetEntriesWithHouse(chart);

  return (
    <div className="space-y-3">
      <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, lineHeight:1.7, marginBottom:4 }}>
        {t(lang,
          'Each planet in your chart acts like a different department of your life. Here is what each planet means for you, in plain language.',
          'आपकी कुंडली में प्रत्येक ग्रह आपके जीवन के एक अलग विभाग की तरह काम करता है। यहाँ प्रत्येक ग्रह का आपके लिए क्या अर्थ है, सरल भाषा में।'
        )}
      </p>
      {planetEntries.map(([name, pd]) => {
        const meta    = PLANET_META[name] || {};
        const dbMeta  = planetMeta[name] || {};
        const dignity = DIGNITY_INFO[pd.dignity] || DIGNITY_INFO['Neutral'];
        const guna    = dbMeta.guna ? (GUNA_INFO[dbMeta.guna] || null) : null;
        const isGood  = ['Exaltation (उच्च)','Moolatrikona (मूलत्रिकोण)','Own Sign (स्वगृह)'].includes(pd.dignity);
        const isWeak  = pd.dignity === 'Debilitation (नीच)';

        return (
          <div key={name} style={{
            border: `1px solid ${isGood ? 'rgba(34,197,94,0.25)' : isWeak ? 'rgba(239,68,68,0.22)' : 'rgba(212,175,55,0.1)'}`,
            borderRadius:12, padding:'14px 16px',
            background: isGood ? 'rgba(34,197,94,0.04)' : isWeak ? 'rgba(239,68,68,0.04)' : 'rgba(17,20,40,0.4)',
          }}>
            {/* Planet header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ color: meta.color, fontSize:22, lineHeight:1 }}>{meta.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ color:'#F5F0E8', fontSize:14, fontWeight:700,
                    fontFamily:'var(--font-devanagari,Georgia),sans-serif' }}>
                    {lang === 'hi' ? (meta.hi || name) : name}
                  </span>
                  {dbMeta.deity && (
                    <span style={{ color:'rgba(245,240,232,0.45)', fontSize:10 }}>
                      🙏 {lang === 'hi' ? (dbMeta.deity_hi || dbMeta.deity) : dbMeta.deity}
                    </span>
                  )}
                </div>
                {dbMeta.court_role && (
                  <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10, marginTop:2, fontStyle:'italic' }}>
                    {lang === 'hi'
                      ? `${dbMeta.court_role_hi || dbMeta.court_role}${courtRoleDesc(dbMeta.court_role, 'hi')}`
                      : `${dbMeta.court_role}${courtRoleDesc(dbMeta.court_role, 'en')}`}
                  </p>
                )}
              </div>
              {/* Dignity badge */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <Badge bg={dignity.bg} color={dignity.color}>
                  {lang === 'hi' ? dignity.label_hi : dignity.label_en}
                </Badge>
              </div>
            </div>

            {/* Position row */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8, fontSize:11,
              color:'rgba(245,240,232,0.6)', alignItems:'center' }}>
              <span>📍 {t(lang, 'In', 'में')} <strong style={{ color:'rgba(245,240,232,0.85)' }}>
                {lang === 'hi' ? pd.rashi_hi : pd.rashi_en}
              </strong></span>
              <span style={{ color:'rgba(212,175,55,0.35)' }}>•</span>
              <span>{t(lang, 'House', 'भाव')} <strong style={{ color:'rgba(245,240,232,0.85)' }}>
                {houseValueText(pd.house, lang)}
              </strong></span>
              {pd.is_retrograde && (
                <Badge bg="rgba(239,68,68,0.1)" color="#EF4444">
                  ℞ {t(lang, 'Retrograde', 'वक्री')}
                </Badge>
              )}
            </div>

            {/* Guna badge + dignity description + EDOFEN data */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:6 }}>
              {guna && (
                <Badge bg={guna.bg} color={guna.color}>
                  {lang === 'hi' ? guna.label_hi : guna.label_en}
                </Badge>
              )}
              {/* Dignity strength % from EDOFEN PDF */}
              {dignity.strength !== undefined && (
                <Badge
                  bg={isGood ? 'rgba(34,197,94,0.15)' : isWeak ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.1)'}
                  color={dignity.color}
                >
                  {dignity.strength}% {t(lang,'strength','शक्ति')}
                </Badge>
              )}
              {/* Sign-lord relation from EDOFEN Friendship table */}
              {pd.sign_lord_relation && pd.sign_lord_relation !== 'self' && (() => {
                const ri = RELATION_INFO[pd.sign_lord_relation];
                return ri ? (
                  <Badge bg={`${ri.color}18`} color={ri.color}>
                    {ri.icon} {lang === 'hi' ? ri.label_hi : ri.label_en}
                  </Badge>
                ) : null;
              })()}
            </div>
            <div>
              <span style={{ color: dignity.color, fontSize:11, opacity:0.85 }}>
                {lang === 'hi' ? dignity.desc_hi : dignity.desc_en}
              </span>
            </div>

            {/* Plain language what it controls */}
            {dbMeta.characteristics && (
              <p style={{ color:'rgba(245,240,232,0.4)', fontSize:10.5, marginTop:8, lineHeight:1.6,
                borderTop:'1px solid rgba(212,175,55,0.08)', paddingTop:8 }}>
                🔮 {t(lang, 'Controls:', 'नियंत्रित करता है:')}{' '}
                <ExpandableText
                  text={dbMeta.characteristics}
                  lang={lang}
                  limit={160}
                  textStyle={{ color:'rgba(245,240,232,0.4)', fontSize:10.5, lineHeight:1.6 }}
                />
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 3: Your Houses ───────────────────────────────────────────────────────

function HousesTab({ chart, enrichment, lang }) {
  const housesMeta = enrichment?.houses_meta || [];
  const planetEntries = planetEntriesWithHouse(chart);

  // Build house → planets map
  const houseMap = {};
  for (let h = 1; h <= 12; h++) houseMap[h] = [];
  planetEntries.forEach(([name, pd]) => {
    if (pd.house && houseMap[pd.house]) houseMap[pd.house].push(name);
  });

  return (
    <div>
      <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, lineHeight:1.7, marginBottom:14 }}>
        {t(lang,
          'Your 12 houses represent the 12 departments of your life. Kendra = most powerful · Trikona = most auspicious · Upachaya = improves with time · Dusthana = challenging · Maarak = sensitive.',
          'आपके 12 भाव जीवन के 12 विभाग हैं। केंद्र = सबसे शक्तिशाली · त्रिकोण = सबसे शुभ · उपचय = समय के साथ बढ़ता है · दुस्थान = चुनौतीपूर्ण · मारक = संवेदनशील।'
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {housesMeta.map((house) => {
          const planetsHere  = houseMap[house.id] || [];
          const hasplanets   = planetsHere.length > 0;
          // Use new bhava classification from DB (seed 014)
          const bhavaType    = house.bhava_type || 'neutral';
          const bhavaGroups  = Array.isArray(house.bhava_groups) ? house.bhava_groups
            : (typeof house.bhava_groups === 'string' ? JSON.parse(house.bhava_groups || '[]') : []);
          const tint         = NATURE_TINT[bhavaType] || NATURE_TINT.neutral;

          return (
            <div key={house.id} style={{
              border: `1px solid ${hasplanets ? tint.border : 'rgba(212,175,55,0.1)'}`,
              borderRadius:10, padding:'12px 14px',
              background: hasplanets ? tint.bg : 'rgba(17,20,40,0.35)',
            }}>
              {/* House header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div>
                  <span style={{ color:'rgba(212,175,55,0.5)', fontSize:11, fontWeight:700 }}>
                    {t(lang, `House ${house.id}`, `भाव ${house.id}`)}
                  </span>
                  <p style={{ color:'#F5F0E8', fontSize:12, fontWeight:600,
                    fontFamily:'var(--font-devanagari,Georgia),sans-serif', lineHeight:1.3, marginTop:2 }}>
                    {lang === 'hi' ? house.keywords_hi : house.keywords_en}
                  </p>
                </div>
                {/* Planet icons in this house */}
                <div style={{ display:'flex', gap:3 }}>
                  {planetsHere.map(p => (
                    <span key={p} title={p} style={{
                      color: PLANET_META[p]?.color || '#D4AF37', fontSize:15, lineHeight:1,
                    }}>
                      {PLANET_META[p]?.icon}
                    </span>
                  ))}
                  {!hasplanets && (
                    <span style={{ color:'rgba(245,240,232,0.62)', fontSize:10 }}>
                      {t(lang, 'Empty', 'खाली')}
                    </span>
                  )}
                </div>
              </div>

              {/* Bhava type badges — from EDOFEN/Bhava PDF (seed 014) */}
              {bhavaGroups.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                  {bhavaGroups.map(group => {
                    const bb = BHAVA_BADGE[group];
                    if (!bb) return null;
                    return (
                      <Badge key={group} bg={bb.bg} color={bb.color}>
                        {lang === 'hi' ? bb.label_hi : bb.label_en}
                      </Badge>
                    );
                  })}
                  {house.bhava_nature_en && (
                    <span style={{ color:'rgba(245,240,232,0.73)', fontSize:9, alignSelf:'center', marginLeft:2 }}>
                      — {lang === 'hi' ? house.bhava_nature_hi : house.bhava_nature_en}
                    </span>
                  )}
                </div>
              )}

              {/* Topics covered */}
              <p style={{ color:'rgba(245,240,232,0.5)', fontSize:10.5, lineHeight:1.6, marginBottom:6 }}>
                {(lang === 'hi' ? house.topics_hi : house.topics_en)?.split(',').slice(0,5).join(' · ')}
              </p>

              {/* Health organ */}
              {house.health_organs_en && (
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                  <span style={{ fontSize:9 }}>🏥</span>
                  <span style={{ color:'rgba(245,240,232,0.73)', fontSize:10 }}>
                    {lang === 'hi' ? house.health_organs_hi : house.health_organs_en}
                  </span>
                </div>
              )}

              {/* Active planet names */}
              {hasplanets && (
                <div style={{ marginTop:6, paddingTop:6, borderTop:'1px solid rgba(212,175,55,0.08)' }}>
                  <p style={{ color:'rgba(212,175,55,0.65)', fontSize:10 }}>
                    {planetsHere.map(p => lang === 'hi' ? PLANET_META[p]?.hi : p).join(', ')}
                    {' '}{t(lang, 'activate this area of life', 'इस जीवन क्षेत्र को सक्रिय करते हैं')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 4: Health Guide ──────────────────────────────────────────────────────

function HealthTab({ chart, enrichment, lang }) {
  const housesMeta = enrichment?.houses_meta || [];
  const planetEntries = planetEntriesWithHouse(chart);

  const houseMap = {};
  for (let h = 1; h <= 12; h++) houseMap[h] = [];
  planetEntries.forEach(([name, pd]) => {
    if (pd.house && houseMap[pd.house]) houseMap[pd.house].push(name);
  });

  return (
    <div>
      <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, lineHeight:1.7, marginBottom:14 }}>
        {t(lang,
          'In Jyotish, each house governs specific body parts. Planets in a house influence that body area. This is a guide — always consult a medical professional for health concerns.',
          'ज्योतिष में, प्रत्येक भाव विशेष शरीर के अंगों को नियंत्रित करता है। किसी भाव में ग्रह उस शरीर क्षेत्र को प्रभावित करते हैं। यह एक मार्गदर्शिका है — स्वास्थ्य संबंधी चिंताओं के लिए हमेशा चिकित्सक से परामर्श लें।'
        )}
      </p>
      <div className="space-y-2">
        {housesMeta.map((house) => {
          const planetsHere = houseMap[house.id] || [];
          const hasMalefic  = planetsHere.some(p =>
            ['Mars','Saturn','Rahu','Ketu'].includes(p)
          );
          const hasBenefic  = planetsHere.some(p =>
            ['Jupiter','Venus','Mercury'].includes(p)
          );

          return (
            <div key={house.id} style={{
              display:'grid', gridTemplateColumns:'90px 1fr auto',
              alignItems:'center', gap:12,
              padding:'10px 14px', borderRadius:8,
              border:`1px solid ${hasMalefic ? 'rgba(239,68,68,0.15)' : hasBenefic ? 'rgba(34,197,94,0.12)' : 'rgba(212,175,55,0.08)'}`,
              background: hasMalefic ? 'rgba(239,68,68,0.03)' : hasBenefic ? 'rgba(34,197,94,0.03)' : 'transparent',
            }}>
              {/* House + keyword */}
              <div>
                <p style={{ color:'rgba(212,175,55,0.5)', fontSize:10, fontWeight:700 }}>
                  {t(lang, `H${house.id}`, `भाव ${house.id}`)}
                </p>
                <p style={{ color:'rgba(245,240,232,0.65)', fontSize:10.5, fontWeight:600 }}>
                  {(lang === 'hi' ? house.keywords_hi : house.keywords_en)?.split(',')[0].trim()}
                </p>
              </div>

              {/* Body organs */}
              <div>
                <p style={{ color:'rgba(245,240,232,0.7)', fontSize:11 }}>
                  🏥 {lang === 'hi' ? house.health_organs_hi : house.health_organs_en}
                </p>
                {planetsHere.length > 0 && (
                  <p style={{ color:'rgba(245,240,232,0.73)', fontSize:10, marginTop:2 }}>
                    {t(lang, 'Influenced by:', 'प्रभावित:')}
                    {' '}{planetsHere.map(p => lang === 'hi' ? PLANET_META[p]?.hi : p).join(', ')}
                  </p>
                )}
              </div>

              {/* Status dot */}
              <div style={{ textAlign:'right' }}>
                {hasMalefic && (
                  <Badge bg="rgba(239,68,68,0.1)" color="#EF4444">
                    {t(lang, 'Watch', 'ध्यान दें')}
                  </Badge>
                )}
                {hasBenefic && !hasMalefic && (
                  <Badge bg="rgba(34,197,94,0.1)" color="#22C55E">
                    {t(lang, 'Protected', 'सुरक्षित')}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ color:'rgba(245,240,232,0.65)', fontSize:10, marginTop:16, textAlign:'center' }}>
        ⚕️ {t(lang,
          'This is Jyotish guidance only — not a substitute for professional medical advice.',
          'यह केवल ज्योतिषीय मार्गदर्शन है — व्यावसायिक चिकित्सा सलाह का विकल्प नहीं।'
        )}
      </p>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function KundliInsightPanel({ chart, enrichment, lang = 'en' }) {
  const [tab, setTab] = useState(0);

  if (!chart || !enrichment) return null;

  const TABS = [
    { label_en:'📋 Summary',       label_hi:'📋 सारांश'         },
    { label_en:'🪐 Your Planets',   label_hi:'🪐 आपके ग्रह'      },
    { label_en:'🏠 Your Houses',    label_hi:'🏠 आपके भाव'       },
    { label_en:'🏥 Health Guide',   label_hi:'🏥 स्वास्थ्य मार्गदर्शिका' },
  ];

  return (
    <div style={{
      background:'rgba(11,13,26,0.6)',
      border:'1px solid rgba(212,175,55,0.18)',
      borderRadius:14,
      overflow:'hidden',
      marginTop:24,
    }}>
      {/* Panel header */}
      <div style={{
        padding:'16px 20px 0',
        background:'linear-gradient(180deg,rgba(212,175,55,0.06) 0%,transparent 100%)',
        borderBottom:'1px solid rgba(212,175,55,0.1)',
      }}>
        <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, marginBottom:4 }}>
          ✨ {t(lang, 'Your Kundli — Explained in Plain Language', 'आपकी कुंडली — सरल भाषा में समझें')}
        </h2>
        <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11, marginBottom:14 }}>
          {t(lang,
            'A customer-friendly reading of what\'s in your chart — what\'s strong, what needs attention, and what each area of life looks like.',
            'आपकी कुंडली की एक सरल व्याख्या — क्या शक्तिशाली है, क्या ध्यान देने योग्य है, और जीवन का प्रत्येक क्षेत्र कैसा दिखता है।'
          )}
        </p>
        {/* Tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingBottom:1 }}>
          {TABS.map((tb, i) => (
            <Tab key={i} active={tab === i} onClick={() => setTab(i)}>
              {lang === 'hi' ? tb.label_hi : tb.label_en}
            </Tab>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding:'20px' }}>
        {tab === 0 && <SummaryTab   chart={chart} enrichment={enrichment} lang={lang} />}
        {tab === 1 && <PlanetsTab   chart={chart} enrichment={enrichment} lang={lang} />}
        {tab === 2 && <HousesTab    chart={chart} enrichment={enrichment} lang={lang} />}
        {tab === 3 && <HealthTab    chart={chart} enrichment={enrichment} lang={lang} />}
      </div>
    </div>
  );
}
