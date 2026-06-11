'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import { predictionHref } from '../lib/kundliLinks';

const emptyForm = {
  name: '',
  gender: 'male',
  date_of_birth: '',
  time_of_birth: '',
  place_of_birth: '',
  latitude: '',
  longitude: '',
  timezone_offset: '5.5',
};

const presets = [
  { label: 'New Delhi', latitude: '28.6139', longitude: '77.2090', timezone_offset: '5.5' },
  { label: 'Mumbai', latitude: '19.0760', longitude: '72.8777', timezone_offset: '5.5' },
  { label: 'Bengaluru', latitude: '12.9716', longitude: '77.5946', timezone_offset: '5.5' },
];

function parseChart(profile) {
  if (!profile?.calculated_data) return null;
  if (typeof profile.calculated_data === 'object') return profile.calculated_data;
  try { return JSON.parse(profile.calculated_data); } catch { return null; }
}

function profileSummary(profile, chart, lang) {
  const summary = profile?.chart_summary || {};
  const currentDasha = chart?.dasha?.find((period) => period.is_current) || chart?.dasha?.[0];
  return {
    calculated: Boolean(summary.calculated || chart),
    lagna: lang === 'hi'
      ? (summary.lagna_hi || chart?.ascendant?.rashi_hi || summary.lagna_en || chart?.ascendant?.rashi_en)
      : (summary.lagna_en || chart?.ascendant?.rashi_en || summary.lagna_hi || chart?.ascendant?.rashi_hi),
    nakshatra: lang === 'hi'
      ? (summary.nakshatra_hi || chart?.nakshatra?.hi || summary.nakshatra_en || chart?.nakshatra?.en)
      : (summary.nakshatra_en || chart?.nakshatra?.en || summary.nakshatra_hi || chart?.nakshatra?.hi),
    dasha: summary.dasha_lord || currentDasha?.lord,
  };
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

export default function KundliManager({ startWithForm = false }) {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(startWithForm);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [locQuery,   setLocQuery]   = useState('');
  const [locResults, setLocResults] = useState([]);
  const [searching,  setSearching]  = useState(false);
  const searchRef = useRef(null);

  const t = (en, hi) => (lang === 'hi' ? hi : en);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setLocResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const loadProfiles = async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/kundli');
      setProfiles(data.profiles || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to load Kundlis');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) loadProfiles();
  }, [user]);

  const stats = useMemo(() => {
    const calculated = profiles.filter((profile) => profile?.chart_summary?.calculated || !!profile.calculated_data).length;
    return [
      { label: t('Profiles', 'Profiles'), value: profiles.length },
      { label: t('Calculated', 'Calculated'), value: calculated },
      { label: t('Ready for Match', 'Match Ready'), value: profiles.filter((p) => ['male', 'female'].includes(p.gender)).length },
    ];
  }, [profiles, lang]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function handleLocationSearch(e) {
    e.preventDefault();
    if (!locQuery.trim()) return;
    setSearching(true);
    setLocResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=6&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': lang === 'hi' ? 'hi' : 'en', 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.length === 0) toast.error(t('No results found. Try a different name.', 'कोई परिणाम नहीं मिला। अलग नाम आज़माएं।'));
      setLocResults(data);
    } catch {
      toast.error(t('Location search failed. Check internet connection.', 'स्थान खोज विफल रही। इंटरनेट कनेक्शन जांचें।'));
    } finally {
      setSearching(false);
    }
  }

  function selectLocResult(r) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    let tz = Math.round((lon / 15) * 2) / 2;
    // India heuristic → IST = +5.5
    if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 98) tz = 5.5;
    const label = r.display_name;
    setForm((current) => ({
      ...current,
      place_of_birth:  label,
      latitude:        lat.toFixed(6),
      longitude:       lon.toFixed(6),
      timezone_offset: String(tz),
    }));
    setLocQuery(label.split(',')[0]);
    setLocResults([]);
  }

  const applyPreset = (preset) => {
    setForm((current) => ({
      ...current,
      place_of_birth: current.place_of_birth || preset.label,
      latitude: preset.latitude,
      longitude: preset.longitude,
      timezone_offset: preset.timezone_offset,
    }));
  };

  const createKundli = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/kundli', form);
      toast.success(t('Kundli created', 'Kundli ban gayi'));
      setForm(emptyForm);
      setShowForm(false);
      if (data.profile?.uuid) {
        router.push(`/kundli/${data.profile.uuid}`);
      } else {
        await loadProfiles();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to create Kundli');
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async (profile) => {
    try {
      const response = await api.get(`/kundli/${profile.uuid}/report.pdf`, { responseType: 'blob' });
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), `${profile.name || 'kundli'}-kundli.pdf`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to export PDF');
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gold">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={70} />
      <div className="relative z-10 max-w-8xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-gold/50 text-xs uppercase tracking-[0.35em]">Kundli Engine</p>
            <h1 className="font-serif text-3xl md:text-4xl text-gradient-gold font-bold mt-2">
              {t('My Kundlis', 'Meri Kundliyan')}
            </h1>
            <p className="text-ivory/55 text-sm mt-2 max-w-2xl">
              {t('Create birth charts, review D1/D9 calculations, export reports, and use profiles for matching.', 'Birth chart banao, D1/D9 dekho, report export karo aur matching me use karo.')}
            </p>
          </div>
          <button onClick={() => setShowForm((value) => !value)} className="btn-gold text-sm px-5 py-2">
            {showForm ? t('Close Form', 'Form band') : t('New Kundli', 'Nayi Kundli')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((item) => (
            <div key={item.label} className="card-royal p-4 text-center">
              <p className="text-2xl font-bold text-gradient-gold">{item.value}</p>
              <p className="text-ivory/45 text-xs mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={createKundli} className="card-royal p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-xs text-ivory/55">
                {t('Name', 'Naam')}
                <input className="input-royal mt-1" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </label>
              <label className="text-xs text-ivory/55">
                {t('Gender', 'Gender')}
                <select className="input-royal mt-1" value={form.gender} onChange={(e) => update('gender', e.target.value)} required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-xs text-ivory/55">
                {t('Date of Birth', 'Janm tithi')}
                <input className="input-royal mt-1" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} required />
              </label>
              <label className="text-xs text-ivory/55">
                {t('Time of Birth', 'Janm samay')}
                <input className="input-royal mt-1" type="time" step="1" value={form.time_of_birth} onChange={(e) => update('time_of_birth', e.target.value)} required />
              </label>
              {/* Location search — Nominatim (free, no API key) */}
              <div className="md:col-span-2" ref={searchRef} style={{ position: 'relative' }}>
                <p className="text-xs text-ivory/55 mb-1">{t('Search Place of Birth', 'जन्म स्थान खोजें')}</p>
                <div className="flex gap-2">
                  <input
                    className="input-royal flex-1"
                    placeholder={t('e.g. Jodhpur, Rajasthan, India', 'जैसे: जोधपुर, राजस्थान, भारत')}
                    value={locQuery}
                    onChange={(e) => setLocQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocationSearch(e); } }}
                  />
                  <button
                    type="button"
                    onClick={handleLocationSearch}
                    disabled={searching}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
                      color: '#D4AF37', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {searching ? '⏳' : `🔍 ${t('Search', 'खोजें')}`}
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
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectLocResult(r)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 14px', fontSize: 12, color: 'rgba(245,240,232,0.75)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          borderBottom: i < locResults.length - 1 ? '1px solid rgba(212,175,55,0.08)' : 'none',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        <span style={{ color: '#D4AF37', marginRight: 6 }}>📍</span>
                        {r.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Place label (auto-filled or manual) */}
              <label className="text-xs text-ivory/55 md:col-span-2">
                {t('Place of Birth (Label)', 'जन्म स्थान (लेबल)')}
                <input className="input-royal mt-1" value={form.place_of_birth} onChange={(e) => update('place_of_birth', e.target.value)} required placeholder="City, State, Country" />
              </label>

              <label className="text-xs text-ivory/55">
                {t('Latitude', 'अक्षांश')}
                <input className="input-royal mt-1" type="number" step="0.000001" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} required placeholder="28.6139" />
              </label>
              <label className="text-xs text-ivory/55">
                {t('Longitude', 'देशांतर')}
                <input className="input-royal mt-1" type="number" step="0.000001" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} required placeholder="77.2090" />
              </label>
              <label className="text-xs text-ivory/55">
                {t('Timezone (UTC offset)', 'टाइमज़ोन (UTC अंतर)')}
                <input className="input-royal mt-1" type="number" step="0.5" value={form.timezone_offset} onChange={(e) => update('timezone_offset', e.target.value)} required placeholder="5.5" />
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <p className="w-full text-xs text-ivory/40 mb-1">{t('Quick fill:', 'Quick fill:')}</p>
                {presets.map((preset) => (
                  <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="btn-outline-gold text-xs px-3 py-2">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button disabled={saving} className="btn-gold px-6 py-2 text-sm">
                {saving ? t('Creating...', 'Ban rahi hai...') : t('Create and Calculate', 'Create aur calculate')}
              </button>
            </div>
          </motion.form>
        )}

        {fetching ? (
          <div className="card-royal p-8 text-center text-ivory/45">Loading Kundlis...</div>
        ) : profiles.length === 0 ? (
          <div className="card-royal p-10 text-center">
            <h2 className="font-serif text-gold text-2xl mb-2">{t('No Kundli yet', 'Abhi Kundli nahi hai')}</h2>
            <p className="text-ivory/55 text-sm mb-5">{t('Create the first profile to unlock D1, D9, dasha, gochar, predictions, and PDF exports.', 'Pehli profile banao aur D1, D9, dasha, gochar, predictions aur PDF export dekho.')}</p>
            <button onClick={() => setShowForm(true)} className="btn-gold text-sm px-5 py-2">{t('Create First Kundli', 'Pehli Kundli')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile) => {
              const chart = parseChart(profile);
              const summary = profileSummary(profile, chart, lang);
              return (
                <motion.div key={profile.uuid} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-royal p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl text-gold">{profile.name}</h2>
                      <p className="text-ivory/45 text-xs mt-1">{String(profile.date_of_birth).slice(0, 10)} | {profile.time_of_birth?.slice(0, 5)} | {profile.place_of_birth}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded border border-gold/20 text-gold/70 uppercase">{profile.gender}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 my-4">
                    <div className="bg-white/5 rounded p-2">
                      <p className="text-[10px] text-ivory/35">Lagna</p>
                      <p className="text-sm text-ivory font-devanagari">{summary.lagna || 'Pending'}</p>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <p className="text-[10px] text-ivory/35">Nakshatra</p>
                      <p className="text-sm text-ivory font-devanagari">{summary.nakshatra || 'Pending'}</p>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <p className="text-[10px] text-ivory/35">Dasha</p>
                      <p className="text-sm text-ivory">{summary.dasha || 'Pending'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/kundli/${profile.uuid}`} className="btn-gold text-xs px-4 py-2">{t('Open', 'Open')}</Link>
                    <Link href={predictionHref(profile.uuid)} className="btn-outline-gold text-xs px-4 py-2">{t('Predictions', 'भविष्यवाणी')}</Link>
                    <button onClick={() => downloadPdf(profile)} className="btn-outline-gold text-xs px-4 py-2">PDF</button>
                    <Link href="/matchmaking" className="btn-outline-gold text-xs px-4 py-2">{t('Match', 'Milan')}</Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
