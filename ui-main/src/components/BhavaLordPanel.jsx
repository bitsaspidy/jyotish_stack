'use client';
import { useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const t = (lang, en, hi) => (lang === 'hi' ? hi : en);

const PLANET_META = {
  Sun:     { icon: '☉', color: '#F59E0B', hi: 'सूर्य'     },
  Moon:    { icon: '☽', color: '#94A3B8', hi: 'चन्द्र'    },
  Mars:    { icon: '♂', color: '#EF4444', hi: 'मंगल'       },
  Mercury: { icon: '☿', color: '#10B981', hi: 'बुध'        },
  Jupiter: { icon: '♃', color: '#FBBF24', hi: 'बृहस्पति'  },
  Venus:   { icon: '♀', color: '#F472B6', hi: 'शुक्र'      },
  Saturn:  { icon: '♄', color: '#818CF8', hi: 'शनि'        },
  Rahu:    { icon: '☊', color: '#A78BFA', hi: 'राहु'       },
  Ketu:    { icon: '☋', color: '#6B7280', hi: 'केतु'       },
};

const EFFECT_CONFIG = {
  highly_positive: { label_en: 'Excellent',    label_hi: 'उत्कृष्ट',       color: '#22C55E', bg: 'rgba(34,197,94,0.12)',    icon: '★★' },
  positive:        { label_en: 'Favourable',   label_hi: 'शुभ',             color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',   icon: '★'  },
  neutral:         { label_en: 'Mixed',         label_hi: 'मिश्रित',         color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)',  icon: '◎'  },
  negative:        { label_en: 'Challenging',  label_hi: 'चुनौतीपूर्ण',     color: '#F97316', bg: 'rgba(249,115,22,0.12)',  icon: '▲'  },
  highly_negative: { label_en: 'Difficult',    label_hi: 'कठिन',            color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   icon: '▼▼' },
};

const HOUSE_ORDINAL = ['','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const HOUSE_ORDINAL_HI = ['','प्रथम','द्वितीय','तृतीय','चतुर्थ','पंचम','षष्ठ','सप्तम','अष्टम','नवम','दशम','एकादश','द्वादश'];

// ─── Single Card ─────────────────────────────────────────────────────────────
function BhavaLordCard({ reading, lang, index }) {
  const [open, setOpen] = useState(false);
  const pm = PLANET_META[reading.lord_planet] || { icon: '●', color: '#9CA3AF', hi: reading.lord_planet };
  const eff = EFFECT_CONFIG[reading.overall_effect] || EFFECT_CONFIG.neutral;

  const houseOrdEN = HOUSE_ORDINAL[reading.house_number] || `${reading.house_number}th`;
  const houseOrdHI = HOUSE_ORDINAL_HI[reading.house_number] || `${reading.house_number}वें`;
  const placedOrdEN = HOUSE_ORDINAL[reading.placed_in_house] || `${reading.placed_in_house}th`;
  const placedOrdHI = HOUSE_ORDINAL_HI[reading.placed_in_house] || `${reading.placed_in_house}वें`;

  // Regional DB langs (seed 031): regional column with EN fallback. lord_name and
  // house_signification fall back to the ordinal label when unseeded.
  const reg = ['ta','te','bn','mr','pa','gu'].includes(lang);
  const pickReg = (base) => reg ? (reading[`${base}_${lang}`] || reading[`${base}_en`]) : null;

  const lordNameEN = reading.lord_name_en || `${houseOrdEN} Lord`;
  const lordNameHI = reading.lord_name_hi || `${houseOrdHI} भावेश`;
  const lordName   = reg ? (reading[`lord_name_${lang}`] || lordNameEN) : t(lang, lordNameEN, lordNameHI);
  const houseSig   = reg ? pickReg('house_signification') : t(lang, reading.house_signification_en, reading.house_signification_hi || reading.house_signification_en);

  const interpretation = reg
    ? (reading[`interpretation_${lang}`] || reading.interpretation_en || '')
    : (lang === 'hi'
        ? (reading.interpretation_hi || reading.interpretation_en || '')
        : (reading.interpretation_en || ''));

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* ── Header ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          cursor: 'pointer', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        {/* House number badge */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(212,175,55,0.1)', border: '1.5px solid rgba(212,175,55,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#D4AF37',
        }}>
          {reading.house_number}
        </div>

        {/* Lord name + planet badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>
              {lordName}
            </span>
            {/* Planet badge */}
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: `${pm.color}20`, color: pm.color,
              border: `1px solid ${pm.color}40`, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {pm.icon} {t(lang, reading.lord_planet, pm.hi)}
            </span>
            {/* Effect badge */}
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: eff.bg, color: eff.color,
              border: `1px solid ${eff.color}30`, fontWeight: 600,
            }}>
              {eff.icon} {t(lang, eff.label_en, eff.label_hi)}
            </span>
            {/* VRY badge */}
            {reading.forms_viparita_yoga && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20,
                background: 'rgba(167,139,250,0.12)', color: '#A78BFA',
                border: '1px solid rgba(167,139,250,0.3)', fontWeight: 600,
              }}>
                ✦ {t(lang, 'Viparita Raja Yoga', 'विपरीत राज योग')}
              </span>
            )}
          </div>
          {/* Placement summary */}
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
            {t(lang,
              `${lordNameEN} placed in ${placedOrdEN} house`,
              `${lordNameHI} ${placedOrdHI} भाव में स्थित`
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <span style={{ color: '#64748B', fontSize: 12, flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* ── Expanded Content ── */}
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* House signification */}
          {reading.house_signification_en && (
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
            }}>
              <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>
                {t(lang, `HOUSE ${reading.house_number} GOVERNS`, `भाव ${reading.house_number} का कारकत्व`)}
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                {houseSig}
              </div>
            </div>
          )}

          {/* Main interpretation */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>
              {t(lang, 'INTERPRETATION (BPHS)', 'फलकथन (BPHS)')}
            </div>
            <p style={{
              fontSize: 13, color: '#CBD5E1', lineHeight: 1.75, margin: 0,
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.025)',
              borderLeft: `3px solid ${eff.color}60`,
            }}>
              {interpretation}
            </p>
          </div>

          {/* Key results */}
          {Array.isArray(reading.key_results_en) && reading.key_results_en.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>
                {t(lang, 'KEY RESULTS', 'मुख्य फल')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(lang === 'hi'
                  ? (reading.key_results_hi || reading.key_results_en)
                  : reading.key_results_en
                ).map((pt, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    background: `${eff.color}12`, color: eff.color,
                    border: `1px solid ${eff.color}30`, fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ opacity: 0.6 }}>•</span> {pt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* VRY explanation */}
          {reading.forms_viparita_yoga && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
              fontSize: 12, color: '#C4B5FD',
            }}>
              <strong>
                {t(lang, '✦ Viparita Raja Yoga: ', '✦ विपरीत राज योग: ')}
              </strong>
              {t(lang,
                'This dusthana lord in another dusthana creates a powerful reversal yoga — the native rises strongly after adversity.',
                'यह दुष्टस्थान का स्वामी दूसरे दुष्टस्थान में जाकर शक्तिशाली विपरीत राज योग बनाता है — जातक प्रतिकूलता के बाद प्रबल रूप से उठता है।'
              )}
            </div>
          )}

          {/* 📌 PDF Example callout */}
          {reading.example_en && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)',
              borderLeft: '3px solid rgba(212,175,55,0.6)',
            }}>
              <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                📌 {t(lang, 'EXAMPLE (BPHS)', 'उदाहरण (BPHS)')}
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.65, fontStyle: 'italic' }}>
                {t(lang, reading.example_en, reading.example_hi || reading.example_en)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function BhavaLordPanel({ readings, lang = 'en' }) {
  const [filterEffect, setFilterEffect] = useState('all');
  const [showAll, setShowAll] = useState(false);

  if (!readings?.length) return null;

  const effectFilters = [
    { key: 'all',             label_en: 'All Houses',   label_hi: 'सभी भाव'       },
    { key: 'highly_positive', label_en: 'Excellent',    label_hi: 'उत्कृष्ट'       },
    { key: 'positive',        label_en: 'Favourable',   label_hi: 'शुभ'             },
    { key: 'neutral',         label_en: 'Mixed',        label_hi: 'मिश्रित'         },
    { key: 'negative',        label_en: 'Challenging',  label_hi: 'चुनौतीपूर्ण'    },
  ];

  const filtered = filterEffect === 'all'
    ? readings
    : readings.filter((r) => r.overall_effect === filterEffect);

  const displayed = showAll ? filtered : filtered.slice(0, 6);

  // Summary counts
  const counts = {};
  for (const r of readings) counts[r.overall_effect] = (counts[r.overall_effect] || 0) + 1;
  const vryCount = readings.filter((r) => r.forms_viparita_yoga).length;

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Section Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏛️</span>
          {t(lang, 'Bhava Lord Readings', 'भाव स्वामी फलकथन')}
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
          {t(lang,
            'Each house has a ruling lord (Bhavesh). Its placement in another house creates a profound connection between the two houses, yielding specific results in your life.',
            'प्रत्येक भाव का एक स्वामी ग्रह होता है जिसे भावेश कहते हैं। जब यह भावेश किसी अन्य भाव में स्थित होता है, तो दोनों भावों के कारकत्व आपस में जुड़ जाते हैं और जातक के जीवन में विशेष फल उत्पन्न होते हैं।'
          )}
        </p>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {Object.entries(counts).map(([eff, cnt]) => {
            const ec = EFFECT_CONFIG[eff] || EFFECT_CONFIG.neutral;
            return (
              <div key={eff} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11,
                background: ec.bg, color: ec.color,
                border: `1px solid ${ec.color}30`, fontWeight: 600,
              }}>
                {ec.icon} {cnt} {t(lang, ec.label_en, ec.label_hi)}
              </div>
            );
          })}
          {vryCount > 0 && (
            <div style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11,
              background: 'rgba(167,139,250,0.12)', color: '#A78BFA',
              border: '1px solid rgba(167,139,250,0.3)', fontWeight: 600,
            }}>
              ✦ {vryCount} {t(lang, 'Viparita Raja Yoga', 'विपरीत राज योग')}
            </div>
          )}
        </div>
      </div>

      {/* ── Key Principles ── */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 20,
        background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
      }}>
        <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>
          {t(lang, 'KEY PRINCIPLES (BPHS)', 'मूल सिद्धांत (BPHS)')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            [t(lang,'Trikona (1,5,9) or Kendra (1,4,7,10) placements give auspicious results','त्रिकोण (1,5,9) या केंद्र (1,4,7,10) में स्थिति शुभ फल देती है'), '#22C55E'],
            [t(lang,'Dusthana (6,8,12) placements create challenges or transformative experiences','दुष्ट स्थान (6,8,12) में स्थिति कठिनाइयाँ या परिवर्तन लाती है'), '#F97316'],
            [t(lang,'Lord in own house powerfully strengthens that house\'s significations','स्वभाव में स्थित भावेश उस भाव के कारकत्वों को प्रबल बनाता है'), '#60A5FA'],
            [t(lang,'6-8 (Shadashtaka) and 2-12 (Dwirdwadash) positions often create strain','षडाष्टक (6/8) और द्विर्द्वादश (2/12) स्थितियाँ प्रायः तनाव उत्पन्न करती हैं'), '#A78BFA'],
          ].map(([text, color], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
              <span style={{ color, flexShrink: 0, marginTop: 1 }}>•</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {effectFilters.map(({ key, label_en, label_hi }) => {
          const active = filterEffect === key;
          const ec = key === 'all' ? null : EFFECT_CONFIG[key];
          return (
            <button key={key} onClick={() => { setFilterEffect(key); setShowAll(false); }} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              fontWeight: 600, border: '1px solid',
              background: active ? (ec ? ec.bg : 'rgba(212,175,55,0.12)') : 'rgba(255,255,255,0.03)',
              color:      active ? (ec ? ec.color : '#D4AF37') : '#9CA3AF',
              borderColor: active ? (ec ? `${ec.color}50` : 'rgba(212,175,55,0.4)') : 'rgba(255,255,255,0.08)',
            }}>
              {t(lang, label_en, label_hi)}
            </button>
          );
        })}
      </div>

      {/* ── House cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748B', padding: '24px 0', fontSize: 13 }}>
            {t(lang, 'No entries for this filter.', 'इस फ़िल्टर के लिए कोई प्रविष्टि नहीं।')}
          </div>
        ) : (
          displayed.map((reading, i) => (
            <BhavaLordCard key={reading.house_number} reading={reading} lang={lang} index={i} />
          ))
        )}
      </div>

      {/* Show more/less */}
      {filtered.length > 6 && (
        <button onClick={() => setShowAll(!showAll)} style={{
          display: 'block', margin: '14px auto 0', padding: '8px 24px',
          borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 600,
          background: 'rgba(212,175,55,0.08)', color: '#D4AF37',
          border: '1px solid rgba(212,175,55,0.25)',
        }}>
          {showAll
            ? t(lang, 'Show Less ▲', 'कम दिखाएं ▲')
            : t(lang, `Show All ${filtered.length} Houses ▼`, `सभी ${filtered.length} भाव दिखाएं ▼`)
          }
        </button>
      )}

    </div>
  );
}
