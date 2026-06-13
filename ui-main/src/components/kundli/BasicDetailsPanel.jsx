'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { t, planetName, nityaYogaName, karanaName } from '../../lib/astroI18n';

const BD_TABS = [
  { key: 'basic',  label: 'Basic Details',  label_hi: 'जन्म विवरण' },
  { key: 'ghat',   label: 'Ghat Chakra',    label_hi: 'घट चक्र'   },
  { key: 'astro',  label: 'Astro Details',  label_hi: 'ज्योतिष विवरण' },
];

export function InfoRow({ label, value }) {
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

export default function BasicDetailsPanel({ kundli, chart, lang }) {
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
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid rgba(212,175,55,0.1)', paddingBottom:10 }}>
        {BD_TABS.map(tab_ => (
          <button key={tab_.key} onClick={() => setTab(tab_.key)}
            style={{
              padding:'4px 11px', borderRadius:16, fontSize:10, fontWeight:600, cursor:'pointer', border:'none',
              background: tab === tab_.key ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab === tab_.key ? '#D4AF37' : 'rgba(245,240,232,0.38)',
              transition:'all 0.18s',
            }}>
            {lang === 'hi' ? tab_.label_hi : tab_.label}
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
          <InfoRow label={label('Vikram Samvat', 'विक्रम संवत')} value={p?.samvat ? String(p.samvat.vikram) : '—'} />
          <InfoRow label={label('Shaka Samvat', 'शक संवत')}    value={p?.samvat ? String(p.samvat.shaka)  : '—'} />
          <InfoRow label={label('Samvatsara', 'संवत्सर')}       value={p?.samvat ? (lang==='hi' ? p.samvat.samvatsara_hi : p.samvat.samvatsara_en) : '—'} />
          <InfoRow label={label('Kali Samvat', 'कलि संवत')}    value={p?.samvat ? String(p.samvat.kali)   : '—'} />
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
        <p style={{ color:'rgba(245,240,232,0.68)', fontSize:12, textAlign:'center', padding:16 }}>
          {lang==='hi' ? 'कुंडली पुनः गणना करें' : 'Recalculate to see Astro Details'}
        </p>
      )}
    </motion.div>
  );
}
