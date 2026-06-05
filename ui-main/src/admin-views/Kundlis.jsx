'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const PLANET_COLOR = {
  Sun:'#F59E0B', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#22C55E',
  Jupiter:'#F59E0B', Venus:'#EC4899', Saturn:'#6366F1', Rahu:'#A78BFA', Ketu:'#D97706',
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

function GenderBadge({ gender }) {
  const male   = { bg:'rgba(96,165,250,0.12)', color:'#60A5FA', border:'rgba(96,165,250,0.3)' };
  const female = { bg:'rgba(236,72,153,0.12)', color:'#EC4899', border:'rgba(236,72,153,0.3)' };
  const s = gender === 'male' ? male : female;
  return (
    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600,
      background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {gender === 'male' ? '♂ Male' : '♀ Female'}
    </span>
  );
}

export default function Kundlis() {
  const router = useRouter();
  const [profiles,  setProfiles]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [gender,    setGender]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState(false);
  const limit = 20;

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
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>Kundli Profiles</h1>
          <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>
            {total} total charts across all users
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ padding:'8px 14px', borderRadius:6, background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)', color:'rgba(212,175,55,0.7)', fontSize:12 }}>
            🪐 {total} Kundlis in system
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'14px 16px', marginBottom:14, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input
          placeholder="Search by person name, user email, or place…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex:1, minWidth:220, background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'7px 12px', fontSize:13, outline:'none' }} />
        <select value={gender} onChange={e => { setGender(e.target.value); setPage(1); }}
          style={{ background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color: gender ? '#F5F0E8' : 'rgba(245,240,232,0.35)', padding:'7px 12px', fontSize:13, outline:'none' }}>
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {(search || gender) && (
          <button onClick={() => { setSearch(''); setGender(''); setPage(1); }}
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, color:'#F87171', fontSize:12, padding:'7px 12px', cursor:'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(212,175,55,0.12)' }}>
                {['Person','Owner','Date of Birth','Place','Lagna','Current Dasha','Gender','Added',''].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:'rgba(212,175,55,0.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding:'36px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  Loading kundli profiles…
                </td></tr>
              ) : apiError ? (
                <tr>
                  <td colSpan={9} style={{ padding:'36px', textAlign:'center' }}>
                    <p style={{ color:'#F87171', fontSize:14, fontWeight:600, marginBottom:10 }}>⚠ Could not load kundli profiles</p>
                    <button onClick={fetchProfiles}
                      style={{ padding:'7px 18px', borderRadius:6, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      ↺ Retry
                    </button>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={9} style={{ padding:'36px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  No kundli profiles found
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
                        <span style={{ color:'#D4AF37', fontSize:12, fontWeight:600 }}>{cs.lagna_en}</span>
                      ) : (
                        <span style={{ color:'rgba(245,240,232,0.2)', fontSize:11 }}>—</span>
                      )}
                    </td>
                    {/* Dasha */}
                    <td style={{ padding:'10px 14px' }}>
                      {cs?.dasha_lord ? (
                        <div>
                          <span style={{ color: PLANET_COLOR[cs.dasha_lord] || '#D4AF37', fontSize:12, fontWeight:600 }}>
                            {cs.dasha_lord}
                          </span>
                          {cs.antardasha_lord && (
                            <span style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>
                              {' / '}{cs.antardasha_lord}
                            </span>
                          )}
                          {cs.dasha_end && (
                            <p style={{ color:'rgba(245,240,232,0.25)', fontSize:10, fontFamily:'monospace', marginTop:1 }}>
                              until {cs.dasha_end}
                            </p>
                          )}
                        </div>
                      ) : <span style={{ color:'rgba(245,240,232,0.2)', fontSize:11 }}>—</span>}
                    </td>
                    {/* Gender */}
                    <td style={{ padding:'10px 14px' }}><GenderBadge gender={p.gender} /></td>
                    {/* Added */}
                    <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.38)', fontSize:12 }}>
                      {relTime(p.created_at)}
                    </td>
                    {/* Action */}
                    <td style={{ padding:'10px 14px' }}>
                      <button onClick={() => router.push(`/admin/kundlis/${p.uuid}`)}
                        style={{ padding:'5px 14px', borderRadius:5, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                        🔮 View Chart
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
            {total === 0 ? '0 profiles' : `${Math.min((page-1)*limit+1, total)}–${Math.min(page*limit, total)} of ${total}`}
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
