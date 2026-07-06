'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLang } from '../../context/LangContext';
import api from '../../lib/api';
import { t } from '../../lib/astroI18n';

export default function EditKundliModal({ kundli, onClose, onSaved }) {
  const { lang } = useLang();
  const dob = String(kundli.date_of_birth || '').slice(0, 10);
  const [form, setForm] = useState({
    name:             kundli.name          || '',
    date_of_birth:    dob,
    time_of_birth:    (kundli.time_of_birth || '00:00:00').slice(0, 5),
    place_of_birth:   kundli.place_of_birth || '',
    latitude:         String(kundli.latitude  || ''),
    longitude:        String(kundli.longitude || ''),
    timezone_offset:  String(kundli.timezone_offset || '5.5'),
    gender:           kundli.gender        || 'male',
    marital_status:   kundli.marital_status || '',
  });

  const [locQuery,    setLocQuery]    = useState('');
  const [locResults,  setLocResults]  = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setLocResults([]);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleLocationSearch(e) {
    e.preventDefault();
    if (!locQuery.trim()) return;
    setSearching(true);
    setLocResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=6&addressdetails=1`;
      const res  = await fetch(url, {
        headers: { 'Accept-Language': lang === 'hi' ? 'hi' : 'en', 'Accept': 'application/json' },
      });
      const data = await res.json();
      setLocResults(data);
    } catch {
      toast.error(t(lang, 'Location search failed. Check internet connection.', 'स्थान खोज विफल रही। इंटरनेट कनेक्शन जांचें।'));
    } finally {
      setSearching(false);
    }
  }

  function selectResult(r) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    let tz = Math.round((lon / 15) * 2) / 2;
    if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 98) tz = 5.5;
    const label = r.display_name;
    set('place_of_birth', label);
    setForm(f => ({
      ...f,
      place_of_birth:  label,
      latitude:        lat.toFixed(6),
      longitude:       lon.toFixed(6),
      timezone_offset: String(tz),
    }));
    setLocQuery(label.split(',')[0]);
    setLocResults([]);
  }

  const lat = parseFloat(form.latitude);
  const lon = parseFloat(form.longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lon);
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lon-0.05).toFixed(5)},${(lat-0.05).toFixed(5)},${(lon+0.05).toFixed(5)},${(lat+0.05).toFixed(5)}&layer=mapnik&marker=${lat},${lon}`
    : null;

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.date_of_birth || !form.time_of_birth) {
      toast.error(t(lang, 'Name, date and time are required.', 'नाम, जन्म तिथि और जन्म समय आवश्यक हैं।'));
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/kundli/${kundli.uuid}`, {
        name:            form.name,
        date_of_birth:   form.date_of_birth,
        time_of_birth:   form.time_of_birth + ':00',
        place_of_birth:  form.place_of_birth,
        latitude:        parseFloat(form.latitude),
        longitude:       parseFloat(form.longitude),
        timezone_offset: parseFloat(form.timezone_offset),
        gender:          form.gender,
        marital_status:  form.marital_status,
      });
      await api.post(`/kundli/${kundli.uuid}/recalculate`);
      toast.success(t(lang, 'Birth details saved & chart recalculated!', 'जन्म विवरण सेव हो गया और कुंडली पुनः गणना हो गई!'));
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || t(lang, 'Save failed. Try again.', 'सेव नहीं हो पाया। फिर प्रयास करें।'));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full bg-[#0f1128] border border-gold/20 rounded-lg px-3 py-2 text-ivory text-sm focus:outline-none focus:border-gold/60 placeholder-ivory/25 transition-colors';
  const labelCls = 'text-ivory/45 text-[10px] uppercase tracking-widest block mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(6,7,15,0.88)', backdropFilter: 'blur(6px)', paddingTop: 60, paddingBottom: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="card-royal w-full max-w-2xl mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-gold text-lg font-bold">✏️ {t(lang, 'Edit Birth Details', 'जन्म विवरण संपादित करें')}</h2>
          <button onClick={onClose}
            style={{ color:'rgba(245,240,232,0.4)', fontSize:20, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t(lang, 'Full Name *', 'पूरा नाम *')}</label>
              <input className={inputCls} value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'Gender *', 'लिंग *')}</label>
              <select className={inputCls} value={form.gender}
                onChange={e => set('gender', e.target.value)}>
                <option value="male">{t(lang, 'Male', 'पुरुष')}</option>
                <option value="female">{t(lang, 'Female', 'महिला')}</option>
                <option value="other">{t(lang, 'Other', 'अन्य')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'Marital Status', 'वैवाहिक स्थिति')}</label>
              <select className={inputCls} value={form.marital_status}
                onChange={e => set('marital_status', e.target.value)}>
                <option value="">{t(lang, 'Not specified', 'नहीं बताया')}</option>
                <option value="unmarried">{t(lang, 'Unmarried', 'अविवाहित')}</option>
                <option value="married">{t(lang, 'Married', 'विवाहित')}</option>
                <option value="divorced">{t(lang, 'Divorced', 'तलाकशुदा')}</option>
                <option value="widowed">{t(lang, 'Widowed', 'विधवा / विधुर')}</option>
              </select>
              <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, marginTop:4 }}>
                {t(lang, 'D9 activates after marriage or from age 36.', 'D9 विवाह के बाद या 36 वर्ष की आयु से सक्रिय होता है।')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t(lang, 'Date of Birth *', 'जन्म तिथि *')}</label>
              <input type="date" className={inputCls} value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'Time of Birth *', 'जन्म समय *')}</label>
              <input type="time" className={inputCls} value={form.time_of_birth}
                onChange={e => set('time_of_birth', e.target.value)} required />
            </div>
          </div>

          <div ref={searchRef}>
            <label className={labelCls}>{t(lang, 'Search Place of Birth (OpenStreetMap — free)', 'जन्म स्थान खोजें (OpenStreetMap — मुफ्त)')}</label>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder={t(lang, 'e.g. Jodhpur, Rajasthan, India', 'जैसे: जोधपुर, राजस्थान, भारत')}
                value={locQuery}
                onChange={e => setLocQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLocationSearch(e); }}}
              />
              <button type="button" onClick={handleLocationSearch} disabled={searching}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
                  color: '#D4AF37', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {searching ? '⏳' : `🔍 ${t(lang, 'Search', 'खोजें')}`}
              </button>
            </div>

            {locResults.length > 0 && (
              <div style={{
                position: 'absolute', zIndex: 100, left: 0, right: 0,
                background: '#0f1128', border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {locResults.map((r, i) => (
                  <button key={i} type="button"
                    onClick={() => selectResult(r)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', fontSize: 12, color: 'rgba(245,240,232,0.75)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: i < locResults.length - 1 ? '1px solid rgba(212,175,55,0.08)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ color: '#D4AF37', marginRight: 6 }}>📍</span>
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>{t(lang, 'Place of Birth (Label)', 'जन्म स्थान (लेबल)')}</label>
            <input className={inputCls} value={form.place_of_birth}
              onChange={e => set('place_of_birth', e.target.value)}
              placeholder={t(lang, 'City, State, Country', 'शहर, राज्य, देश')} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{t(lang, 'Latitude °N', 'अक्षांश °N')}</label>
              <input type="number" step="0.000001" className={inputCls}
                value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
                placeholder="26.2800" />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'Longitude °E', 'देशांतर °E')}</label>
              <input type="number" step="0.000001" className={inputCls}
                value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
                placeholder="73.0200" />
            </div>
            <div>
              <label className={labelCls}>{t(lang, 'UTC Offset (hrs)', 'UTC अंतर (घंटे)')}</label>
              <select className={inputCls} value={form.timezone_offset}
                onChange={e => set('timezone_offset', e.target.value)}>
                {['-12','-11','-10','-9.5','-9','-8','-7','-6','-5','-4.5','-4',
                  '-3.5','-3','-2','-1','0','1','2','3','3.5','4','4.5','5','5.5',
                  '5.75','6','6.5','7','8','8.75','9','9.5','10','10.5','11','12',
                  '12.75','13','14'].map(v => (
                  <option key={v} value={v}>UTC {+v >= 0 ? '+' : ''}{v}</option>
                ))}
              </select>
            </div>
          </div>

          {hasCoords && mapSrc && (
            <div>
              <label className={labelCls}>{t(lang, 'Location Preview (OpenStreetMap)', 'स्थान पूर्वावलोकन (OpenStreetMap)')}</label>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', height: 200 }}>
                <iframe
                  src={mapSrc}
                  width="100%" height="200"
                  style={{ border: 'none', display: 'block' }}
                  loading="lazy"
                  title={t(lang, 'Birth place map', 'जन्म स्थान मानचित्र')}
                />
              </div>
              <p style={{ fontSize:10, color:'rgba(245,240,232,0.25)', marginTop:4 }}>
                📌 {lat.toFixed(4)}°N, {lon.toFixed(4)}°E ·
                <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color:'#D4AF37', marginLeft:4, textDecoration:'underline' }}>
                  {t(lang, 'Open full map ↗', 'पूरा मानचित्र खोलें ↗')}
                </a>
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-gold/10">
            <button type="button" onClick={onClose}
              style={{
                padding:'8px 20px', borderRadius:8, fontSize:12, cursor:'pointer',
                background:'transparent', border:'1px solid rgba(212,175,55,0.25)', color:'rgba(245,240,232,0.5)',
              }}>
              {t(lang, 'Cancel', 'रद्द करें')}
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding:'8px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
                background: saving ? 'rgba(212,175,55,0.2)' : 'linear-gradient(135deg,#D4AF37,#B8960C)',
                border:'none', color: saving ? '#D4AF37' : '#0B0D1A',
                opacity: saving ? 0.7 : 1,
              }}>
              {saving
                ? `⏳ ${t(lang, 'Saving & Recalculating…', 'सेव और पुनः गणना हो रही है…')}`
                : `💾 ${t(lang, 'Save & Recalculate Chart', 'सेव करें और कुंडली पुनः गणना करें')}`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
