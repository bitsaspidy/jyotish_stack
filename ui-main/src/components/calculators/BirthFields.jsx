'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export const emptyBirthForm = {
  name: '', gender: 'male',
  date_of_birth: '', time_of_birth: '',
  place_of_birth: '', latitude: '', longitude: '', timezone_offset: '5.5',
};

const presets = [
  { label: 'New Delhi', latitude: '28.6139', longitude: '77.2090', timezone_offset: '5.5' },
  { label: 'Mumbai',    latitude: '19.0760', longitude: '72.8777', timezone_offset: '5.5' },
  { label: 'Bengaluru', latitude: '12.9716', longitude: '77.5946', timezone_offset: '5.5' },
];

const MUTED = 'rgba(245,240,232,0.55)';

// Controlled birth-details fields with Nominatim place search.
// Parent owns `form` state; this component only renders + updates it.
export default function BirthFields({ form, onChange, lang, showName = true, showGender = false }) {
  const hi = lang === 'hi';
  const t = (en, h) => (hi ? h : en);

  const [locQuery, setLocQuery]     = useState('');
  const [locResults, setLocResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setLocResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = (key, value) => onChange({ ...form, [key]: value });

  async function handleLocationSearch(e) {
    e.preventDefault();
    if (!locQuery.trim()) return;
    setSearching(true);
    setLocResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=6&addressdetails=1`;
      const res  = await fetch(url, { headers: { 'Accept-Language': hi ? 'hi' : 'en', 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.length === 0) toast.error(t('No results found. Try a different name.', 'कोई परिणाम नहीं मिला। अलग नाम आज़माएं।'));
      setLocResults(data);
    } catch {
      toast.error(t('Location search failed.', 'स्थान खोज विफल रही।'));
    } finally {
      setSearching(false);
    }
  }

  function selectLocResult(r) {
    const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    let tz = Math.round((lon / 15) * 2) / 2;
    if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 98) tz = 5.5; // India → IST
    onChange({
      ...form, place_of_birth: r.display_name,
      latitude: lat.toFixed(6), longitude: lon.toFixed(6), timezone_offset: String(tz),
    });
    setLocQuery(r.display_name.split(',')[0]);
    setLocResults([]);
  }

  const applyPreset = (p) => onChange({
    ...form, place_of_birth: form.place_of_birth || p.label,
    latitude: p.latitude, longitude: p.longitude, timezone_offset: p.timezone_offset,
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      {showName && (
        <div style={{ gridColumn: showGender ? 'auto' : '1 / -1' }}>
          <label className="text-ivory/70 text-xs">{t('Full Name', 'पूरा नाम')} *</label>
          <input className="input-royal mt-1 w-full" value={form.name} onChange={(e) => update('name', e.target.value)} required
            placeholder={t('Your name', 'आपका नाम')} />
        </div>
      )}
      {showGender && (
        <div>
          <label className="text-ivory/70 text-xs">{t('Gender', 'लिंग')}</label>
          <select className="input-royal mt-1 w-full" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
            <option value="male">{t('Male', 'पुरुष')}</option>
            <option value="female">{t('Female', 'महिला')}</option>
            <option value="other">{t('Other', 'अन्य')}</option>
          </select>
        </div>
      )}
      <div>
        <label className="text-ivory/70 text-xs">{t('Date of Birth', 'जन्म तिथि')} *</label>
        <input className="input-royal mt-1 w-full" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} required />
      </div>
      <div>
        <label className="text-ivory/70 text-xs">{t('Time of Birth', 'जन्म समय')} *</label>
        <input className="input-royal mt-1 w-full" type="time" value={form.time_of_birth} onChange={(e) => update('time_of_birth', e.target.value)} required />
      </div>

      <div style={{ gridColumn:'1 / -1', position:'relative' }} ref={searchRef}>
        <label className="text-ivory/70 text-xs">{t('Birth Place', 'जन्म स्थान')} *</label>
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <input className="input-royal w-full" value={locQuery} onChange={(e) => setLocQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLocationSearch(e); }}
            placeholder={t('e.g. Jodhpur, Rajasthan, India', 'जैसे: जोधपुर, राजस्थान, भारत')} />
          <button type="button" onClick={handleLocationSearch} className="btn-gold" style={{ fontSize:12, padding:'0 16px', borderRadius:8, whiteSpace:'nowrap' }}>
            {searching ? '…' : t('Search', 'खोजें')}
          </button>
        </div>
        {locResults.length > 0 && (
          <div style={{
            position:'absolute', top:'100%', left:0, right:0, zIndex:30,
            background:'#141838', border:'1px solid rgba(212,175,55,0.3)', borderRadius:10,
            marginTop:4, maxHeight:220, overflowY:'auto',
          }}>
            {locResults.map((r, i) => (
              <button key={i} type="button" onClick={() => selectLocResult(r)} style={{
                display:'block', width:'100%', textAlign:'left', padding:'9px 12px',
                fontSize:11, color:'#F5F0E8', background:'transparent', border:'none',
                borderBottom:'1px solid rgba(255,255,255,0.06)', cursor:'pointer',
              }}>
                📍 {r.display_name}
              </button>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
          {presets.map((p) => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)} style={{
              fontSize:10, color:MUTED, border:'1px solid rgba(255,255,255,0.12)',
              background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'3px 10px', cursor:'pointer',
            }}>
              {p.label}
            </button>
          ))}
          {form.latitude && (
            <span style={{ fontSize:10, color:'#22C55E', padding:'3px 6px' }}>
              ✓ {form.latitude}, {form.longitude} (UTC+{form.timezone_offset})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
