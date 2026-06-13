'use client';
import { useEffect, useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

const ACTION_COLOR = {
  create: '#22C55E',
  update: '#60A5FA',
  delete: '#EF4444',
  login:  '#A78BFA',
  logout: '#9CA3AF',
};

function ActionBadge({ action }) {
  const c = ACTION_COLOR[action] || GOLD;
  return (
    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:700,
      background:`${c}14`, color:c, border:`1px solid ${c}28`, textTransform:'uppercase' }}>
      {action}
    </span>
  );
}

function Btn({ children, onClick, color = GOLD, outline = false, small = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? 'transparent' : color, color: outline ? color : '#0A0C18',
      border:`1px solid ${color}`, borderRadius:6, fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontSize: small ? 11 : 13, padding: small ? '4px 10px' : '8px 16px', transition:'all 0.15s',
    }}>{children}</button>
  );
}

const ENTITIES = ['', 'blog_post', 'testimonial', 'inquiry', 'team_member', 'user', 'kundli', 'admin_profile'];

export default function AdminActivity() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit:30 };
      if (entityFilter) params.entity = entityFilter;
      const r = await adminApi.get('/admin/activity', { params });
      setLogs(r.data?.data || []);
      setPagination(r.data?.pagination || null);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, [page, entityFilter]);

  useEffect(() => { load(); }, [load]);

  const fmt = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' });
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:2 }}>📋 Activity Log</h1>
          <p style={{ color:DIM, fontSize:13 }}>Audit trail of all admin actions</p>
        </div>
        <button onClick={load} style={{ fontSize:12, padding:'6px 14px', borderRadius:6, cursor:'pointer',
          background:'transparent', color:DIM, border:'1px solid rgba(255,255,255,0.08)', fontWeight:600 }}>
          ↻ Refresh
        </button>
      </div>

      {/* Entity filter */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {ENTITIES.map(e => (
          <button key={e} onClick={() => { setEntityFilter(e); setPage(1); }}
            style={{ fontSize:11, padding:'4px 11px', borderRadius:20, cursor:'pointer',
              background: entityFilter === e ? `${GOLD}1A` : 'transparent',
              color: entityFilter === e ? GOLD : DIM,
              border:`1px solid ${entityFilter === e ? GOLD + '40' : 'rgba(255,255,255,0.06)'}`,
              fontWeight: entityFilter === e ? 600 : 400 }}>
            {e === '' ? 'All' : e.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:8, padding:'12px 16px', color:'#EF4444', fontSize:13, marginBottom:16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>Loading…</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>
          <p style={{ fontSize:40, marginBottom:12 }}>📋</p>
          <p>No activity logged yet.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background:'rgba(255,255,255,0.02)',
              border:'1px solid rgba(212,175,55,0.08)', borderRadius:7,
              padding:'10px 16px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ color:DIM, fontSize:11, minWidth:120, flexShrink:0 }}>{fmt(log.created_at)}</span>
              <ActionBadge action={log.action} />
              <span style={{ color:IVORY, fontSize:12, fontWeight:500 }}>
                {log.admin_name || 'Admin'}
              </span>
              <span style={{ color:DIM, fontSize:12 }}>
                {log.entity?.replace(/_/g, ' ')}
                {log.entity_id ? <span style={{ color:`${GOLD}80` }}> #{log.entity_id}</span> : null}
              </span>
              {log.detail && (
                <span style={{ color:DIM, fontSize:11, flex:1, overflow:'hidden',
                  textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  — {log.detail}
                </span>
              )}
              {log.ip_address && (
                <span style={{ color:DIM, fontSize:10, marginLeft:'auto', flexShrink:0 }}>{log.ip_address}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20 }}>
          <Btn small outline disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
          <span style={{ color:DIM, fontSize:12, alignSelf:'center' }}>Page {page} / {pagination.total_pages}</span>
          <Btn small outline disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
        </div>
      )}
    </div>
  );
}
