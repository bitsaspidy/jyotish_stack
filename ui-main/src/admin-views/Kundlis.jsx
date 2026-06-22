'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const PLANET_COLOR = {
  Sun:'#F59E0B', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#22C55E',
  Jupiter:'#F59E0B', Venus:'#EC4899', Saturn:'#6366F1', Rahu:'#A78BFA', Ketu:'#D97706',
};
const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु',
  Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

function relTime(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  if (dy < 30) return `${dy}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
}

function GenderBadge({ gender, lang }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;
  const male   = { bg:'rgba(96,165,250,0.12)', color:'#60A5FA', border:'rgba(96,165,250,0.3)' };
  const female = { bg:'rgba(236,72,153,0.12)', color:'#EC4899', border:'rgba(236,72,153,0.3)' };
  const s = gender === 'male' ? male : female;
  return (
    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600,
      background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {gender === 'male' ? T('♂ Male', '♂ पुरुष') : T('♀ Female', '♀ महिला')}
    </span>
  );
}

// ── Lang toggle ───────────────────────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  return (
    <div style={{ display:'flex', borderRadius:7, overflow:'hidden', border:'1px solid rgba(212,175,55,0.25)' }}>
      {['en','hi'].map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{
            padding:'5px 12px', fontSize:11, fontWeight:700, border:'none', cursor:'pointer',
            background: lang === l ? 'rgba(212,175,55,0.2)' : 'transparent',
            color: lang === l ? '#D4AF37' : 'rgba(245,240,232,0.4)',
            transition:'all 0.15s',
          }}>
          {l === 'en' ? 'EN' : 'हि'}
        </button>
      ))}
    </div>
  );
}

// ── Create Kundli Modal ───────────────────────────────────────────────────────
function CreateKundliModal({ onClose, onCreated, lang }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;
  const router = useRouter();

  const [userEmail,     setUserEmail]     = useState('');
  const [userSuggests,  setUserSuggests]  = useState([]);
  const [userLoading,   setUserLoading]   = useState(false);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [showDropdown,  setShowDropdown]  = useState(false);

  const [name,          setName]          = useState('');
  const [dob,           setDob]           = useState('');
  const [tob,           setTob]           = useState('');
  const [place,         setPlace]         = useState('');
  const [lat,           setLat]           = useState('');
  const [lon,           setLon]           = useState('');
  const [tz,            setTz]            = useState('5.5');
  const [gender,        setGender]        = useState('male');
  const [geocoding,     setGeocoding]     = useState(false);
  const [placeResults,  setPlaceResults]  = useState([]);
  const [showPlaceDrop, setShowPlaceDrop] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  const searchTimer = useRef(null);

  // Debounced user search
  const handleEmailInput = (val) => {
    setUserEmail(val);
    setSelectedUser(null);
    setShowDropdown(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim() || val.length < 2) { setUserSuggests([]); return; }
    searchTimer.current = setTimeout(async () => {
      setUserLoading(true);
      try {
        const { data } = await adminApi.get('/admin/users', { params: { search: val, limit: 8 } });
        setUserSuggests(data.users || []);
        setShowDropdown(true);
      } catch { setUserSuggests([]); }
      finally { setUserLoading(false); }
    }, 350);
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    setUserEmail(u.email);
    setShowDropdown(false);
    setUserSuggests([]);
  };

  // Nominatim search — shows a dropdown of results for selection
  const geocodePlace = async () => {
    if (!place.trim()) return;
    setGeocoding(true);
    setPlaceResults([]);
    setShowPlaceDrop(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=6`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = await res.json();
      if (data?.length) {
        setPlaceResults(data);
        setShowPlaceDrop(true);
      } else {
        toast.error('Location not found. Try a different name or enter coordinates manually.');
      }
    } catch { toast.error('Geocoding failed. Enter coordinates manually.'); }
    finally { setGeocoding(false); }
  };

  const selectLocation = (r) => {
    const latV = parseFloat(r.lat).toFixed(4);
    const lonV = parseFloat(r.lon).toFixed(4);
    const latF = parseFloat(latV);
    const lonF = parseFloat(lonV);
    let tzV = Math.round((lonF / 15) * 2) / 2;
    if (latF >= 6 && latF <= 37 && lonF >= 68 && lonF <= 98) tzV = 5.5;
    setPlace(r.display_name);
    setLat(latV);
    setLon(lonV);
    setTz(String(tzV));
    setPlaceResults([]);
    setShowPlaceDrop(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail.trim()) return toast.error(T('Select a user first', 'पहले उपयोगकर्ता चुनें'));
    if (!name.trim() || !dob || !tob || !place.trim() || !lat || !lon || !gender)
      return toast.error(T('All fields are required', 'सभी फ़ील्ड आवश्यक हैं'));

    setSubmitting(true);
    try {
      const { data } = await adminApi.post('/admin/kundlis', {
        user_email: userEmail.trim(),
        name: name.trim(),
        date_of_birth: dob,
        time_of_birth: tob,
        place_of_birth: place.trim(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        timezone_offset: parseFloat(tz) || 5.5,
        gender,
      });
      toast.success(T('Kundli created successfully!', 'कुंडली सफलतापूर्वक बनाई गई!'), { duration: 3000 });
      onCreated();
      router.push(`/admin/kundlis/${data.uuid}`);
    } catch (err) {
      toast.error(err.response?.data?.message || T('Failed to create kundli', 'कुंडली बनाने में त्रुटि'));
    } finally { setSubmitting(false); }
  };

  const inputStyle = {
    width:'100%', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)',
    borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none',
    boxSizing:'border-box',
  };
  const labelStyle = { color:'rgba(212,175,55,0.7)', fontSize:11, fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5, display:'block' };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background:'#111428', border:'1px solid rgba(212,175,55,0.25)', borderRadius:14,
        width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto',
        padding:28, boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Modal header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:18, fontWeight:700 }}>
            🪐 {T('Create Kundli for User', 'उपयोगकर्ता के लिए कुंडली बनाएं')}
          </h2>
          <button onClick={onClose}
            style={{ background:'none', border:'none', color:'rgba(245,240,232,0.4)', fontSize:20, cursor:'pointer', lineHeight:1 }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* User search */}
          <div style={{ position:'relative' }}>
            <label style={labelStyle}>{T('User (by email)', 'उपयोगकर्ता (ईमेल द्वारा)')}</label>
            <input
              value={userEmail}
              onChange={e => handleEmailInput(e.target.value)}
              placeholder={T('Type user email or name…', 'ईमेल या नाम टाइप करें…')}
              style={{ ...inputStyle, border: selectedUser ? '1px solid rgba(34,197,94,0.4)' : inputStyle.border }}
            />
            {userLoading && (
              <span style={{ position:'absolute', right:10, top:34, color:'rgba(212,175,55,0.5)', fontSize:11 }}>
                {T('Searching…', 'खोज रहे हैं…')}
              </span>
            )}
            {showDropdown && userSuggests.length > 0 && (
              <div style={{
                position:'absolute', top:'100%', left:0, right:0, zIndex:50,
                background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.2)', borderRadius:6,
                boxShadow:'0 8px 24px rgba(0,0,0,0.5)', marginTop:2,
              }}>
                {userSuggests.map(u => (
                  <div key={u.id} onClick={() => selectUser(u)}
                    style={{ padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.05)',
                      transition:'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,55,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ color:'#F5F0E8', fontSize:12, fontWeight:600 }}>{u.name}</div>
                    <div style={{ color:'rgba(245,240,232,0.38)', fontSize:11 }}>{u.email}</div>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && userSuggests.length === 0 && !userLoading && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.2)', borderRadius:6, padding:'10px 12px', marginTop:2 }}>
                <span style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>{T('No users found', 'कोई उपयोगकर्ता नहीं मिला')}</span>
              </div>
            )}
            {selectedUser && (
              <div style={{ marginTop:6, padding:'7px 10px', borderRadius:6, background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', fontSize:11, color:'#22C55E' }}>
                ✓ {selectedUser.name} · {T('ID', 'ID')}: {selectedUser.id}
              </div>
            )}
          </div>

          {/* Person name */}
          <div>
            <label style={labelStyle}>{T('Person Name', 'व्यक्ति का नाम')}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder={T('Name of the person (can differ from user)', 'व्यक्ति का नाम (उपयोगकर्ता से अलग हो सकता है)')}
              style={inputStyle} required />
          </div>

          {/* DOB + TOB */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>{T('Date of Birth', 'जन्म तिथि')}</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>{T('Time of Birth', 'जन्म समय')}</label>
              <input type="time" value={tob} onChange={e => setTob(e.target.value)} style={inputStyle} required step="1" />
            </div>
          </div>

          {/* Place + Geocode */}
          <div>
            <label style={labelStyle}>{T('Place of Birth', 'जन्म स्थान')}</label>
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={place}
                  onChange={e => { setPlace(e.target.value); setShowPlaceDrop(false); setLat(''); setLon(''); }}
                  placeholder={T('City, State, Country', 'शहर, राज्य, देश')}
                  style={{ ...inputStyle, flex:1 }}
                  required
                />
                <button type="button" onClick={geocodePlace} disabled={geocoding || !place.trim()}
                  style={{
                    padding:'8px 14px', borderRadius:6, fontSize:12, fontWeight:600, flexShrink:0,
                    background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)',
                    color:'#D4AF37', cursor: geocoding || !place.trim() ? 'not-allowed' : 'pointer',
                    opacity: geocoding || !place.trim() ? 0.5 : 1, whiteSpace:'nowrap',
                  }}>
                  {geocoding ? '⏳' : '📍'} {T('Find', 'खोजें')}
                </button>
              </div>

              {/* Results dropdown */}
              {showPlaceDrop && placeResults.length > 0 && (
                <div style={{
                  position:'absolute', top:'100%', left:0, right:0, zIndex:200,
                  background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.25)',
                  borderRadius:6, boxShadow:'0 8px 28px rgba(0,0,0,0.6)',
                  marginTop:3, maxHeight:220, overflowY:'auto',
                }}>
                  {placeResults.map((r, i) => (
                    <div key={i} onClick={() => selectLocation(r)}
                      style={{
                        padding:'9px 12px', cursor:'pointer',
                        borderBottom: i < placeResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        transition:'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ color:'#F5F0E8', fontSize:12 }}>{r.display_name}</div>
                      <div style={{ color:'rgba(245,240,232,0.35)', fontSize:11, fontFamily:'monospace', marginTop:2 }}>
                        {parseFloat(r.lat).toFixed(4)}°, {parseFloat(r.lon).toFixed(4)}°
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lat && lon && (
              <p style={{ fontSize:11, color:'rgba(34,197,94,0.7)', marginTop:5 }}>
                ✓ {lat}°, {lon}° · TZ {tz}
              </p>
            )}
          </div>

          {/* Lat + Lon + TZ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 0.7fr', gap:12 }}>
            <div>
              <label style={labelStyle}>{T('Latitude', 'अक्षांश')}</label>
              <input type="number" step="0.0001" value={lat} onChange={e => setLat(e.target.value)}
                placeholder="28.6139" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>{T('Longitude', 'देशांतर')}</label>
              <input type="number" step="0.0001" value={lon} onChange={e => setLon(e.target.value)}
                placeholder="77.2090" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>{T('TZ (hrs)', 'समयक्षेत्र')}</label>
              <input type="number" step="0.25" value={tz} onChange={e => setTz(e.target.value)}
                placeholder="5.5" style={inputStyle} required />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label style={labelStyle}>{T('Gender', 'लिंग')}</label>
            <div style={{ display:'flex', gap:10 }}>
              {[['male', T('♂ Male', '♂ पुरुष')], ['female', T('♀ Female', '♀ महिला')]].map(([val, label]) => (
                <label key={val} style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer',
                  padding:'7px 16px', borderRadius:7, flex:1, justifyContent:'center',
                  background: gender === val ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${gender === val ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  transition:'all 0.15s',
                }}>
                  <input type="radio" value={val} checked={gender === val} onChange={() => setGender(val)}
                    style={{ accentColor:'#D4AF37' }} />
                  <span style={{ color: gender === val ? '#D4AF37' : 'rgba(245,240,232,0.55)', fontSize:13, fontWeight: gender === val ? 700 : 400 }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, marginTop:6 }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:'10px', borderRadius:7, fontSize:13, fontWeight:600,
                background:'transparent', border:'1px solid rgba(255,255,255,0.1)',
                color:'rgba(245,240,232,0.45)', cursor:'pointer' }}>
              {T('Cancel', 'रद्द करें')}
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex:2, padding:'10px', borderRadius:7, fontSize:13, fontWeight:700,
                background: submitting ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.18)',
                border:'1px solid rgba(212,175,55,0.45)', color:'#D4AF37',
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? T('⏳ Creating…', '⏳ बना रहे हैं…') : T('🪐 Create Kundli', '🪐 कुंडली बनाएं')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main list component ───────────────────────────────────────────────────────
export default function Kundlis() {
  const router = useRouter();
  const [lang,      setLang]      = useState('en');
  const [profiles,  setProfiles]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [gender,    setGender]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 20;

  const T = (en, hi) => lang === 'hi' ? hi : en;

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const { data } = await adminApi.get('/admin/kundlis', { params: { page, search, limit, gender } });
      setProfiles(data.profiles || []);
      setTotal(Number(data.pagination?.total) || 0);
    } catch (err) {
      setApiError(true);
      toast.error(err.response?.data?.message || 'Failed to load kundli profiles');
    } finally { setLoading(false); }
  }, [page, search, gender]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  return (
    <div>
      {showCreate && (
        <CreateKundliModal
          lang={lang}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchProfiles(); }}
        />
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>
            {T('Kundli Profiles', 'कुंडली प्रोफ़ाइल')}
          </h1>
          <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>
            {T(`${total} total charts across all users`, `सभी उपयोगकर्ताओं की ${total} कुल कुंडलियां`)}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <LangToggle lang={lang} setLang={setLang} />
          <div style={{ padding:'8px 14px', borderRadius:6, background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)', color:'rgba(212,175,55,0.7)', fontSize:12 }}>
            🪐 {total} {T('Kundlis', 'कुंडलियां')}
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ padding:'8px 16px', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer',
              background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.4)',
              color:'#D4AF37', display:'flex', alignItems:'center', gap:6 }}>
            ➕ {T('Create Kundli', 'कुंडली बनाएं')}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'14px 16px', marginBottom:14, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input
          placeholder={T('Search by person name, user email, or place…', 'नाम, ईमेल या जन्म स्थान से खोजें…')}
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex:1, minWidth:220, background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'7px 12px', fontSize:13, outline:'none' }} />
        <select value={gender} onChange={e => { setGender(e.target.value); setPage(1); }}
          style={{ background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color: gender ? '#F5F0E8' : 'rgba(245,240,232,0.35)', padding:'7px 12px', fontSize:13, outline:'none' }}>
          <option value="">{T('All Genders', 'सभी लिंग')}</option>
          <option value="male">{T('Male', 'पुरुष')}</option>
          <option value="female">{T('Female', 'महिला')}</option>
        </select>
        {(search || gender) && (
          <button onClick={() => { setSearch(''); setGender(''); setPage(1); }}
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, color:'#F87171', fontSize:12, padding:'7px 12px', cursor:'pointer' }}>
            {T('Clear', 'साफ़ करें')}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(212,175,55,0.12)' }}>
                {[
                  T('Person','व्यक्ति'), T('Owner','स्वामी'), T('Date of Birth','जन्म तिथि'),
                  T('Place','स्थान'), T('Lagna','लग्न'), T('Current Dasha','वर्तमान दशा'),
                  T('Gender','लिंग'), T('Added','जोड़ा'), '',
                ].map((h, i) => (
                  <th key={i} style={{ padding:'11px 14px', textAlign:'left', color:'rgba(212,175,55,0.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding:'36px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  {T('Loading kundli profiles…', 'कुंडली प्रोफ़ाइल लोड हो रहे हैं…')}
                </td></tr>
              ) : apiError ? (
                <tr>
                  <td colSpan={9} style={{ padding:'36px', textAlign:'center' }}>
                    <p style={{ color:'#F87171', fontSize:14, fontWeight:600, marginBottom:10 }}>
                      ⚠ {T('Could not load kundli profiles', 'कुंडली प्रोफ़ाइल लोड नहीं हो सके')}
                    </p>
                    <button onClick={fetchProfiles}
                      style={{ padding:'7px 18px', borderRadius:6, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      ↺ {T('Retry', 'पुनः प्रयास')}
                    </button>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={9} style={{ padding:'36px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  {T('No kundli profiles found', 'कोई कुंडली प्रोफ़ाइल नहीं मिली')}
                </td></tr>
              ) : profiles.map(p => {
                const cs = p.chart_summary;
                return (
                  <tr key={p.id}
                    style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.12s', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,55,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    {/* Person */}
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#D4AF37', fontWeight:700, fontSize:12, flexShrink:0 }}>
                          🪐
                        </div>
                        <span style={{ color:'#F5F0E8', fontSize:13, fontWeight:600 }}>{p.name}</span>
                      </div>
                    </td>
                    {/* Owner */}
                    <td style={{ padding:'10px 14px' }}>
                      <p style={{ color:'#F5F0E8', fontSize:12, fontWeight:500 }}>{p.owner_name}</p>
                      <p style={{ color:'rgba(245,240,232,0.38)', fontSize:11 }}>{p.owner_email}</p>
                    </td>
                    {/* DOB */}
                    <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.65)', fontSize:12, fontFamily:'monospace' }}>
                      {String(p.date_of_birth).slice(0,10)}
                      <br/>
                      <span style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>{p.time_of_birth?.slice(0,5)}</span>
                    </td>
                    {/* Place */}
                    <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.55)', fontSize:12, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      📍 {p.place_of_birth}
                    </td>
                    {/* Lagna */}
                    <td style={{ padding:'10px 14px' }}>
                      {cs?.calculated ? (
                        <span style={{ color:'#D4AF37', fontSize:12, fontWeight:600 }}>
                          {lang === 'hi' ? (cs.lagna_hi || cs.lagna_en) : cs.lagna_en}
                        </span>
                      ) : (
                        <span style={{ color:'rgba(245,240,232,0.2)', fontSize:11 }}>—</span>
                      )}
                    </td>
                    {/* Dasha */}
                    <td style={{ padding:'10px 14px' }}>
                      {cs?.dasha_lord ? (
                        <div>
                          <span style={{ color: PLANET_COLOR[cs.dasha_lord] || '#D4AF37', fontSize:12, fontWeight:600 }}>
                            {lang === 'hi' ? (PLANET_HI[cs.dasha_lord] || cs.dasha_lord) : cs.dasha_lord}
                          </span>
                          {cs.antardasha_lord && (
                            <span style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>
                              {' / '}{lang === 'hi' ? (PLANET_HI[cs.antardasha_lord] || cs.antardasha_lord) : cs.antardasha_lord}
                            </span>
                          )}
                          {cs.dasha_end && (
                            <p style={{ color:'rgba(245,240,232,0.25)', fontSize:10, fontFamily:'monospace', marginTop:1 }}>
                              {T('until', 'तक')} {cs.dasha_end}
                            </p>
                          )}
                        </div>
                      ) : <span style={{ color:'rgba(245,240,232,0.2)', fontSize:11 }}>—</span>}
                    </td>
                    {/* Gender */}
                    <td style={{ padding:'10px 14px' }}><GenderBadge gender={p.gender} lang={lang} /></td>
                    {/* Added */}
                    <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.38)', fontSize:12 }}>
                      {relTime(p.created_at)}
                    </td>
                    {/* Action */}
                    <td style={{ padding:'10px 14px' }}>
                      <button onClick={() => router.push(`/admin/kundlis/${p.uuid}`)}
                        style={{ padding:'5px 14px', borderRadius:5, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                        🔮 {T('View', 'देखें')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>
            {total === 0
              ? T('0 profiles', '0 प्रोफ़ाइल')
              : `${Math.min((page-1)*limit+1, total)}–${Math.min(page*limit, total)} ${T('of', 'में से')} ${total}`}
          </span>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button disabled={page === 1} onClick={() => setPage(p=>p-1)}
              style={{ padding:'5px 12px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page===1 ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page===1 ? 'default' : 'pointer', fontSize:12 }}>
              ←
            </button>
            <span style={{ color:'rgba(245,240,232,0.45)', fontSize:12, padding:'0 4px' }}>
              {page} / {Math.ceil(total/limit) || 1}
            </span>
            <button disabled={page*limit >= total} onClick={() => setPage(p=>p+1)}
              style={{ padding:'5px 12px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page*limit>=total ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page*limit>=total ? 'default' : 'pointer', fontSize:12 }}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
