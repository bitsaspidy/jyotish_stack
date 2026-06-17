'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  sent:     { bg:'rgba(52,211,153,0.12)',  color:'#34D399', border:'rgba(52,211,153,0.25)'  },
  failed:   { bg:'rgba(239,68,68,0.12)',   color:'#F87171', border:'rgba(239,68,68,0.25)'   },
  queued:   { bg:'rgba(245,158,11,0.12)',  color:'#FBBF24', border:'rgba(245,158,11,0.25)'  },
  retried:  { bg:'rgba(148,163,184,0.12)', color:'#94A3B8', border:'rgba(148,163,184,0.25)' },
  retrying: { bg:'rgba(96,165,250,0.12)',  color:'#60A5FA', border:'rgba(96,165,250,0.25)'  },
};

const DEPT_COLOR = { sales:'#F59E0B', team:'#10B981', account:'#818CF8' };

function DeptBadge({ dept }) {
  if (!dept) return null;
  const c = DEPT_COLOR[dept] || '#D4AF37';
  const label = { sales:'Sales', team:'Support', account:'Accounts' }[dept] || dept;
  return (
    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:`${c}15`, color:c, border:`1px solid ${c}30`, fontWeight:700, textTransform:'uppercase' }}>
      {label}
    </span>
  );
}

export default function EmailLogs() {
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState('');
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ sent:0, failed:0, queued:0, retried:0 });
  const [retrying, setRetrying] = useState({});

  const load = (p = page, f = filter) => {
    setLoading(true);
    adminApi.get('/admin/email-logs', { params: { page: p, status: f || undefined } })
      .then(({ data }) => {
        setLogs(data.logs);
        setTotal(Number(data.pagination.total));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Load stats separately (all statuses)
  useEffect(() => {
    Promise.all(['sent','failed','queued','retried'].map(s =>
      adminApi.get('/admin/email-logs', { params: { status: s, page: 1 } })
        .then(({ data }) => ({ s, n: Number(data.pagination.total) }))
        .catch(() => ({ s, n: 0 }))
    )).then(results => {
      const cnt = {};
      results.forEach(({ s, n }) => { cnt[s] = n; });
      setStats(cnt);
    });
  }, []);

  useEffect(() => { load(page, filter); }, [page, filter]);

  const retry = async (id) => {
    setRetrying(r => ({ ...r, [id]: true }));
    try {
      await adminApi.post(`/admin/email-logs/${id}/retry`);
      toast.success('Retry sent!');
      load(page, filter);
      // refresh stats
      setStats(s => ({ ...s, failed: Math.max(0, s.failed - 1) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Retry failed');
    } finally {
      setRetrying(r => ({ ...r, [id]: false }));
    }
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>Email Logs</h1>
        <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>{total} records matching current filter</p>
      </div>

      {/* Stats strip */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        {[
          { key:'',         label:'All',     count: stats.sent + stats.failed + stats.queued + stats.retried, color:'rgba(245,240,232,0.5)' },
          { key:'sent',     label:'Sent',    count: stats.sent,    color:'#34D399' },
          { key:'failed',   label:'Failed',  count: stats.failed,  color:'#F87171' },
          { key:'queued',   label:'Queued',  count: stats.queued,  color:'#FBBF24' },
          { key:'retried',  label:'Retried', count: stats.retried, color:'#94A3B8' },
        ].map(({ key, label, count, color }) => (
          <button key={key} onClick={() => { setFilter(key); setPage(1); }} style={{
            padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6,
            background: filter===key ? `${color}18` : 'rgba(255,255,255,0.04)',
            border:`1px solid ${filter===key ? color+'44' : 'rgba(255,255,255,0.1)'}`,
            color: filter===key ? color : 'rgba(245,240,232,0.45)',
            transition:'all 0.15s',
          }}>
            {label}
            <span style={{ background: filter===key ? color+'22' : 'rgba(255,255,255,0.08)', color: filter===key ? color : 'rgba(245,240,232,0.35)', borderRadius:10, padding:'0 6px', fontSize:10, fontWeight:700 }}>
              {count ?? '…'}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(212,175,55,0.1)' }}>
                {['Recipient','Subject','Template','Dept','Status','Date & Time','Actions'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:'rgba(212,175,55,0.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>No logs {filter ? `with status "${filter}"` : 'yet'}</td></tr>
              ) : logs.map(l => {
                const ss = STATUS_STYLE[l.status] || STATUS_STYLE.queued;
                const canRetry = l.status === 'failed' || l.status === 'queued';
                return (
                  <tr key={l.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,55,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.8)', fontSize:13 }}>{l.to_email}</td>
                    <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.6)', fontSize:13, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {l.subject || '—'}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.07)', color:'rgba(245,240,232,0.5)', fontWeight:600 }}>
                        {l.template || 'custom'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <DeptBadge dept={l.department} />
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}` }}>
                        {l.status}
                      </span>
                      {l.error_message && (
                        <p style={{ color:'#F87171', fontSize:10, marginTop:3, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={l.error_message}>
                          {l.error_message}
                        </p>
                      )}
                    </td>
                    <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.38)', fontSize:12, whiteSpace:'nowrap' }}>
                      {new Date(l.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      {canRetry && (
                        <button onClick={() => retry(l.id)} disabled={retrying[l.id]} style={{
                          padding:'4px 12px', borderRadius:5, border:'1px solid rgba(239,68,68,0.35)',
                          background:'rgba(239,68,68,0.08)', color:'#F87171', fontSize:11, fontWeight:700,
                          cursor: retrying[l.id] ? 'not-allowed' : 'pointer', whiteSpace:'nowrap',
                          opacity: retrying[l.id] ? 0.6 : 1,
                        }}>
                          {retrying[l.id] ? '⏳' : '↻ Retry'}
                        </button>
                      )}
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
            Showing {Math.min((page-1)*20+1,total)}–{Math.min(page*20,total)} of {total}
          </span>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)}
              style={{ padding:'5px 12px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page===1 ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page===1 ? 'default' : 'pointer', fontSize:12 }}>
              ←
            </button>
            <span style={{ color:'rgba(245,240,232,0.45)', fontSize:12 }}>{page} / {Math.ceil(total/20)||1}</span>
            <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)}
              style={{ padding:'5px 12px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page*20>=total ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page*20>=total ? 'default' : 'pointer', fontSize:12 }}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
