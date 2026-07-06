'use client';
import { useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';

// ── Nominatim geocode ─────────────────────────────────────────────────────────
async function geocodePlace(place) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const j = await r.json();
  if (!j[0]) throw new Error('Place not found');
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon), display: j[0].display_name };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PLANET_COLORS = { Sun:'#F59E0B', Venus:'#EC4899', Mercury:'#10B981', Moon:'#94A3B8', Saturn:'#6B7280', Jupiter:'#F97316', Mars:'#EF4444' };
const PLANET_ICONS  = { Sun:'☉', Venus:'♀', Mercury:'☿', Moon:'☽', Saturn:'♄', Jupiter:'♃', Mars:'♂' };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function SLabel({ children }) {
  return <p style={{ color:'rgba(212,175,55,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>{children}</p>;
}

function InfoRow({ label, value, sub, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color:'rgba(245,240,232,0.45)', fontSize:12 }}>{label}</span>
      <span style={{ color: color || '#F5F0E8', fontSize:13, fontWeight:600, textAlign:'right' }}>
        {value}{sub && <span style={{ color:'rgba(245,240,232,0.35)', fontSize:10, fontWeight:400, marginLeft:5 }}>{sub}</span>}
      </span>
    </div>
  );
}

function Card({ title, children, accent }) {
  return (
    <div style={{ background:'rgba(17,20,40,0.8)', border:`1px solid ${accent || 'rgba(212,175,55,0.15)'}`, borderRadius:12, padding:20 }}>
      {title && <SLabel>{title}</SLabel>}
      {children}
    </div>
  );
}

// ── Chaughadiya Table ─────────────────────────────────────────────────────────
function ChaughadiyaTable({ periods, title }) {
  if (!periods?.length) return null;
  return (
    <div>
      <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>{title}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {periods.map((p, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'7px 10px', borderRadius:6,
            background: p.auspicious ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${p.auspicious ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color: p.auspicious ? '#10B981' : '#EF4444', fontWeight:700 }}>
                {p.auspicious ? '✓' : '✗'}
              </span>
              <span style={{ color:'#F5F0E8', fontSize:12, fontWeight:600 }}>{p.en}</span>
              <span style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>{p.hi}</span>
            </div>
            <span style={{ color: p.auspicious ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.6)', fontSize:10 }}>
              {p.auspicious ? 'Auspicious' : 'Inauspicious'}
            </span>
            <span style={{ color:'rgba(245,240,232,0.4)', fontSize:10, fontFamily:'monospace' }}>
              {p.start} – {p.end}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hora Table ────────────────────────────────────────────────────────────────
function HoraTable({ horas, title }) {
  if (!horas?.length) return null;
  return (
    <div>
      <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>{title}</p>
      <div className="admin-responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
        {horas.map((h, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'7px 10px', borderRadius:6,
            background:'rgba(255,255,255,0.02)',
            border:`1px solid ${PLANET_COLORS[h.lord] || '#D4AF37'}22`,
          }}>
            <span style={{ color: PLANET_COLORS[h.lord], fontSize:15, width:18, textAlign:'center' }}>
              {PLANET_ICONS[h.lord]}
            </span>
            <div style={{ flex:1 }}>
              <p style={{ color: PLANET_COLORS[h.lord], fontSize:12, fontWeight:600, lineHeight:1.2 }}>{h.lord}</p>
              <p style={{ color:'rgba(245,240,232,0.3)', fontSize:9, fontFamily:'monospace' }}>{h.start} – {h.end}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Panchang() {
  const [date,    setDate]    = useState(todayISO());
  const [place,   setPlace]   = useState('');
  const [lat,     setLat]     = useState('');
  const [lon,     setLon]     = useState('');
  const [tz,      setTz]      = useState('5.5');
  const [lang,    setLang]    = useState('en');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');

  const T = (en, hi) => lang === 'hi' ? hi : en;

  const handleGeocode = async () => {
    if (!place.trim()) return;
    setGeoLoading(true);
    setError('');
    try {
      const g = await geocodePlace(place.trim());
      setLat(g.lat.toFixed(4));
      setLon(g.lon.toFixed(4));
    } catch {
      setError('Place not found. Enter coordinates manually.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleFetch = async () => {
    if (!date || !lat || !lon || !tz) { setError('Fill date, lat, lon, tz'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await adminApi.get('/admin/panchang', { params: { date, lat, lon, tz, place } });
      setResult(data.panchang);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load panchang');
    } finally {
      setLoading(false);
    }
  };

  const inp = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:6, color:'#F5F0E8', fontSize:13, padding:'8px 12px', outline:'none', width:'100%', boxSizing:'border-box' };
  const btn = (accent) => ({ padding:'9px 18px', borderRadius:7, border:`1px solid ${accent}`, background:`${accent}18`, color:accent, cursor:'pointer', fontSize:12, fontWeight:600 });

  const p = result;

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, margin:0 }}>
            🕉 {T('Panchang Muhurta', 'पंचांग मुहूर्त')}
          </h1>
          <p style={{ color:'rgba(245,240,232,0.35)', fontSize:12, marginTop:4 }}>
            {T('Daily Vedic almanac — Tithi, Nakshatra, Yoga, Karana, Chaughadiya, Hora', 'दैनिक वैदिक पंचांग — तिथि, नक्षत्र, योग, करण, चौघड़िया, होरा')}
          </p>
        </div>
        {/* Lang toggle */}
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:4 }}>
          {['en','hi'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding:'5px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
              background: lang === l ? 'rgba(212,175,55,0.2)' : 'transparent',
              color: lang === l ? '#D4AF37' : 'rgba(245,240,232,0.4)',
            }}>
              {l === 'en' ? 'EN' : 'हि'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Form ──────────────────────────────────────────────────────── */}
      <div style={{ background:'rgba(17,20,40,0.8)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:12, padding:20, marginBottom:24 }}>
        <div className="admin-responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11, marginBottom:5 }}>{T('Date','तारीख')}</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
          </div>
          <div>
            <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11, marginBottom:5 }}>{T('Latitude','अक्षांश')}</p>
            <input type="number" step="0.0001" value={lat} onChange={e => setLat(e.target.value)} placeholder="28.6139" style={inp} />
          </div>
          <div>
            <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11, marginBottom:5 }}>{T('Longitude','देशांतर')}</p>
            <input type="number" step="0.0001" value={lon} onChange={e => setLon(e.target.value)} placeholder="77.2090" style={inp} />
          </div>
          <div>
            <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11, marginBottom:5 }}>{T('Timezone (hrs)','समय क्षेत्र (घंटे)')}</p>
            <input type="number" step="0.5" value={tz} onChange={e => setTz(e.target.value)} placeholder="5.5" style={inp} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11, marginBottom:5 }}>{T('Place (auto-fill coords)','स्थान (निर्देशांक भरें)')}</p>
            <input value={place} onChange={e => setPlace(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGeocode()}
              placeholder={T('e.g. Kishangarh, Rajasthan','जैसे किशनगढ़, राजस्थान')} style={inp} />
          </div>
          <button onClick={handleGeocode} disabled={geoLoading} style={{ ...btn('#60A5FA'), height:38, whiteSpace:'nowrap' }}>
            {geoLoading ? '⏳' : '📍'} {T('Find','खोजें')}
          </button>
          <button onClick={handleFetch} disabled={loading} style={{ ...btn('#D4AF37'), height:38, whiteSpace:'nowrap' }}>
            {loading ? '⏳' : '🕉'} {T('Get Panchang','पंचांग देखें')}
          </button>
        </div>
        {error && <p style={{ color:'#F87171', fontSize:12, marginTop:10 }}>{error}</p>}
      </div>

      {/* ── Result ──────────────────────────────────────────────────────────── */}
      {p && (
        <>
          {/* ── Overview ──────────────────────────────────────────────────── */}
          <div className="admin-responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

            {/* Left: Core Panchang */}
            <Card title={T('Panchang Details','पंचांग विवरण')}>
              <InfoRow label={T('Day','दिन')}       value={T(p.vara.day_en, p.vara.day_hi)} color="#D4AF37" />
              <InfoRow label={T('Sunrise','सूर्योदय')} value={p.sunrise} color="#F59E0B" />
              <InfoRow label={T('Sunset','सूर्यास्त')}  value={p.sunset}  color="#F97316" />
              <InfoRow label={T('Moonrise','चंद्रोदय')} value={p.moonrise || '—'} color="#94A3B8" />
              <InfoRow label={T('Moonset','चंद्रास्त')}  value={p.moonset  || '—'} color="#94A3B8" />
              <InfoRow label={T('Tithi','तिथि')}
                value={`${p.tithi.num} ${T(p.tithi.name_en, p.tithi.name_hi)}`}
                sub={T(p.tithi.paksha, p.tithi.paksha === 'Shukla' ? 'शुक्ल' : 'कृष्ण')} />
              <InfoRow label={T('Nakshatra','नक्षत्र')}
                value={`${p.nakshatra.num} ${T(p.nakshatra.en, p.nakshatra.hi)}`}
                sub={`Pada ${p.nakshatra.pada}`} />
              <InfoRow label={T('Yoga','योग')}
                value={`${p.yoga.num} ${p.yoga.name}`}
                color={p.yoga.is_auspicious ? '#10B981' : '#EF4444'} />
              <InfoRow label={T('Karana','करण')}    value={p.karana.name} />
              <InfoRow label={T('Paksha','पक्ष')}   value={T(p.paksha.en, p.paksha.hi)} />
            </Card>

            {/* Right: Astro details */}
            <Card title={T('Astronomical Details','खगोलीय विवरण')}>
              <InfoRow label={T('Ritu (Season)','ऋतु')} value={T(p.ritu.en, p.ritu.hi)} color="#A78BFA" />
              <InfoRow label={T('Ayana','अयन')}          value={T(p.ayana.en, p.ayana.hi)} color="#60A5FA" />
              <InfoRow label={T('Sun Sign','सूर्य राशि')}  value={T(p.sun_sign.en,  p.sun_sign.hi)}  color="#F59E0B" />
              <InfoRow label={T('Moon Sign','चंद्र राशि')} value={T(p.moon_sign.en, p.moon_sign.hi)} color="#94A3B8" />
              <InfoRow label={T('Masa (Month)','मास')}   value={T(p.masa.name, p.masa.name_hi)} />

              {/* Special yogas */}
              {p.special_yogas?.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
                    {T('Panchang Yogas','पंचांग योग')}
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {p.special_yogas.map((y, i) => (
                      <span key={i} style={{
                        fontSize:11, padding:'3px 9px', borderRadius:12, fontWeight:600,
                        background: y.auspicious ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                        color:      y.auspicious ? '#10B981' : '#EF4444',
                        border: `1px solid ${y.auspicious ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
                      }}>
                        {lang === 'hi' ? y.name_hi : y.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(!p.special_yogas || p.special_yogas.length === 0) && (
                <div style={{ marginTop:12 }}>
                  <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>
                    {T('Panchang Yogas','पंचांग योग')}
                  </p>
                  <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12 }}>{T('None for today','आज कोई विशेष योग नहीं')}</p>
                </div>
              )}
            </Card>
          </div>

          {/* ── Chaughadiya ─────────────────────────────────────────────────── */}
          <Card title={T('Chaughadiya','चौघड़िया')} accent="rgba(167,139,250,0.2)">
            <div className="admin-responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <ChaughadiyaTable periods={p.chaughadiya?.day}   title={T('Day','दिन')} />
              <ChaughadiyaTable periods={p.chaughadiya?.night} title={T('Night','रात')} />
            </div>
          </Card>

          {/* ── Hora ────────────────────────────────────────────────────────── */}
          <div style={{ marginTop:16 }}>
            <Card title={T('Hora (Planetary Hours)','होरा (ग्रह घड़ी)')} accent="rgba(96,165,250,0.2)">
              <div className="admin-responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <HoraTable horas={p.hora?.day}   title={T('Day Horas','दिन की होरा')} />
                <HoraTable horas={p.hora?.night} title={T('Night Horas','रात की होरा')} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
