'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import api from '../lib/api';

const GOLD   = '#D4AF37';
const IVORY  = '#F5F0E8';
const DIM    = 'rgba(245,240,232,0.45)';
const CARD   = 'rgba(20,23,40,0.92)';
const BORDER = 'rgba(212,175,55,0.22)';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8, color: IVORY,
  padding: '12px 14px', fontSize: 15,
  outline: 'none', fontFamily: 'Inter,sans-serif',
};
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.08em', color: DIM,
  marginBottom: 6, textTransform: 'uppercase',
};

const PRESETS = [
  { label: 'New Delhi',  place: 'New Delhi, Delhi, India',    lat: '28.613939', lon: '77.209023', tz: '5.5' },
  { label: 'Mumbai',     place: 'Mumbai, Maharashtra, India',  lat: '19.076090', lon: '72.877426', tz: '5.5' },
  { label: 'Bengaluru',  place: 'Bengaluru, Karnataka, India', lat: '12.971599', lon: '77.594566', tz: '5.5' },
];

// ── Place search component ────────────────────────────────────────────────────
function PlaceSearch({ placeValue, latitude, onChange }) {
  const [query,     setQuery]     = useState(placeValue || '');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef               = useRef(null);

  const searchPlace = useCallback((q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`)
      .then(r => r.json())
      .then(items => setResults(items || []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  const onQueryChange = (v) => {
    setQuery(v);
    // Clear coords when user types again
    onChange('place_of_birth', v);
    onChange('latitude', '');
    onChange('longitude', '');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlace(v), 420);
  };

  const selectPlace = (r) => {
    const lat  = parseFloat(r.lat).toFixed(6);
    const lon  = parseFloat(r.lon).toFixed(6);
    const latF = parseFloat(lat), lonF = parseFloat(lon);
    let tz = Math.round((lonF / 15) * 2) / 2;
    if (latF >= 6 && latF <= 37 && lonF >= 68 && lonF <= 98) tz = 5.5;
    onChange('place_of_birth', r.display_name);
    onChange('latitude', lat);
    onChange('longitude', lon);
    onChange('timezone_offset', String(tz));
    setQuery(r.display_name);
    setResults([]);
  };

  const selectPreset = (p) => {
    onChange('place_of_birth', p.place);
    onChange('latitude', p.lat);
    onChange('longitude', p.lon);
    onChange('timezone_offset', p.tz);
    setQuery(p.place);
    setResults([]);
  };

  return (
    <div>
      {/* Quick presets */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button key={p.label} type="button" onClick={() => selectPreset(p)} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 20,
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
            color: GOLD, cursor: 'pointer',
          }}>{p.label}</button>
        ))}
      </div>

      {/* Search input + dropdown */}
      <div style={{ position: 'relative' }}>
        <input
          style={inputStyle}
          value={query}
          placeholder="Search city, state, country…"
          onChange={e => onQueryChange(e.target.value)}
        />
        {searching && (
          <p style={{ fontSize: 11, color: DIM, marginTop: 4 }}>Searching…</p>
        )}
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#151829', border: `1px solid ${BORDER}`, borderRadius: 8,
            maxHeight: 220, overflowY: 'auto', marginTop: 4,
          }}>
            {results.map((r, i) => (
              <button key={i} type="button" onClick={() => selectPlace(r)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', background: 'none', border: 'none',
                borderBottom: i < results.length - 1 ? `1px solid ${BORDER}` : 'none',
                color: IVORY, fontSize: 13, cursor: 'pointer',
              }}>
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation row */}
      {latitude && (
        <p style={{ fontSize: 11, color: DIM, marginTop: 6 }}>
          ✓ {placeValue?.split(',')[0]}
        </p>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function RemedyResubmit() {
  const params = useSearchParams();
  const token  = params.get('token');

  const [status,   setStatus]   = useState('loading'); // loading | ready | success | error
  const [userName, setUserName] = useState('');
  const [errMsg,   setErrMsg]   = useState('');

  const [form, setForm] = useState({
    dob:              '',
    tob:              '12:00',
    place_of_birth:   '',
    latitude:         '',
    longitude:        '',
    timezone_offset:  '5.5',
    lang:             'en',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrMsg('No token found in this link. Please use the link from your email.');
      return;
    }
    api.get(`/remedy/resubmit-info?token=${encodeURIComponent(token)}`)
      .then(({ data }) => { setUserName(data.name || ''); setStatus('ready'); })
      .catch((e) => {
        setStatus('error');
        setErrMsg(e.response?.data?.message || 'This link is invalid or has expired.');
      });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.dob) { toast.error('Please enter your date of birth'); return; }
    if (!form.latitude) { toast.error('Please select a birth location from the dropdown'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/remedy/resubmit', {
        token,
        date_of_birth:   form.dob,
        time_of_birth:   form.tob ? `${form.tob}:00` : '12:00:00',
        place_of_birth:  form.place_of_birth,
        latitude:        form.latitude,
        longitude:       form.longitude,
        timezone_offset: form.timezone_offset,
        lang:            form.lang,
      });
      toast.success(data.message || 'Report sent!');
      setStatus('success');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', position: 'relative' }}>
      <StarField />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em' }}>✦ JYOTISH STACK AI</span>
          </Link>
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '32px 28px', backdropFilter: 'blur(12px)' }}>

          {/* Loading */}
          {status === 'loading' && (
            <p style={{ color: DIM, textAlign: 'center', fontSize: 14 }}>Validating your link…</p>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>⚠️</div>
              <h1 style={{ color: '#EF4444', fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Link Invalid or Expired</h1>
              <p style={{ color: DIM, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{errMsg}</p>
              <Link href="/" style={{ color: GOLD, fontSize: 14 }}>← Back to Jyotish Stack AI</Link>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🙏</div>
              <h1 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Report Sent!</h1>
              <p style={{ color: DIM, fontSize: 14, lineHeight: 1.7 }}>
                Your personalised <strong style={{ color: IVORY }}>Vedic Remedy Report</strong> has been generated and sent to your email. Please check your inbox (and spam folder).
              </p>
              <div style={{ marginTop: 24 }}>
                <Link href="/" style={{ color: GOLD, fontSize: 14 }}>← Go to Jyotish Stack AI</Link>
              </div>
            </div>
          )}

          {/* Form */}
          {status === 'ready' && (
            <form onSubmit={submit}>
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🪐</div>
                <h1 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                  Re-submit Birth Details
                </h1>
                {userName && (
                  <p style={{ color: DIM, fontSize: 14 }}>
                    Namaste <strong style={{ color: IVORY }}>{userName}</strong> — please fill in your birth details below to receive your Vedic Remedy Report.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div>
                  <label style={labelStyle}>Date of Birth <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type="date" required
                    style={inputStyle}
                    value={form.dob}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => set('dob', e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Time of Birth
                    <span style={{ marginLeft: 8, fontSize: 10, color: DIM, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      (leave as 12:00 if unknown)
                    </span>
                  </label>
                  <input type="time" style={inputStyle} value={form.tob} onChange={e => set('tob', e.target.value)} />
                </div>

                <div>
                  <label style={labelStyle}>Place of Birth <span style={{ color: '#EF4444' }}>*</span></label>
                  <PlaceSearch
                    placeValue={form.place_of_birth}
                    latitude={form.latitude}
                    onChange={set}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Preferred Language</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={form.lang}
                    onChange={e => set('lang', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>

              </div>

              <button
                type="submit"
                disabled={busy}
                style={{
                  marginTop: 26, width: '100%',
                  padding: '14px 0', borderRadius: 8, border: 'none',
                  background: busy
                    ? 'rgba(212,175,55,0.4)'
                    : `linear-gradient(135deg, ${GOLD}, #F0D060, #A88B20)`,
                  color: '#0B0D1A', fontWeight: 800, fontSize: 15,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter,sans-serif', letterSpacing: '0.02em',
                }}
              >
                {busy ? 'Generating your report…' : '✦ Generate & Send My Report'}
              </button>

              <p style={{ marginTop: 16, fontSize: 11, color: DIM, textAlign: 'center', lineHeight: 1.6 }}>
                Your birth details are stored securely and used only to generate your Vedic Remedy Report.
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
