'use client';
import { useEffect, useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

const STATUS_STYLE = {
  new:     { bg:'rgba(96,165,250,0.12)',  color:'#60A5FA', border:'rgba(96,165,250,0.3)'  },
  read:    { bg:'rgba(107,114,128,0.12)', color:'#9CA3AF', border:'rgba(107,114,128,0.28)' },
  replied: { bg:'rgba(34,197,94,0.12)',   color:'#22C55E', border:'rgba(34,197,94,0.28)'  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.read;
  return (
    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:700,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`, textTransform:'capitalize' }}>
      {status}
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

function DetailModal({ inquiry, onClose, onRefresh }) {
  const [note, setNote]       = useState(inquiry.admin_note || '');
  const [status, setStatus]   = useState(inquiry.status || 'read');
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/inquiries/${inquiry.id}`, { status, admin_note: note });
      toast.success('Saved');
      onRefresh();
      onClose();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center',
      justifyContent:'center', padding:20 }}>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)' }} />
      <div style={{ position:'relative', background:'#111428', border:'1px solid rgba(212,175,55,0.25)',
        borderRadius:12, padding:'28px', width:'100%', maxWidth:580, boxShadow:'0 24px 60px rgba(0,0,0,0.7)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <h2 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:4 }}>
              📩 Inquiry #{inquiry.id}
            </h2>
            <p style={{ color:DIM, fontSize:11 }}>{new Date(inquiry.created_at).toLocaleString('en-IN')}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          {[['Name', inquiry.name], ['Email', inquiry.email], ['Phone', inquiry.phone || '—'], ['Subject', inquiry.subject || '—']].map(([l, v]) => (
            <div key={l}>
              <p style={{ color:DIM, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{l}</p>
              <p style={{ color:IVORY, fontSize:13 }}>{v}</p>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:16 }}>
          <p style={{ color:DIM, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Message</p>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.12)',
            borderRadius:8, padding:'12px 14px', color:IVORY, fontSize:13, lineHeight:1.75 }}>
            {inquiry.message}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', color:DIM, fontSize:10, fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Status</label>
          <div style={{ display:'flex', gap:8 }}>
            {['new','read','replied'].map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                fontSize:12, padding:'5px 14px', borderRadius:20, cursor:'pointer',
                background: status === s ? `${GOLD}1A` : 'transparent',
                color: status === s ? GOLD : DIM,
                border:`1px solid ${status === s ? GOLD + '40' : 'rgba(255,255,255,0.08)'}`,
                fontWeight: status === s ? 600 : 400, textTransform:'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', color:DIM, fontSize:10, fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Admin Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Internal notes (not shown to customer)…"
            style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
              borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', resize:'vertical', boxSizing:'border-box' }} />
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn outline onClick={onClose}>Close</Btn>
          <Btn disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
        </div>
      </div>
    </div>
  );
}

export default function AdminInquiries() {
  const [items, setItems]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [detail, setDetail]       = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit:20 };
      if (statusFilter) params.status = statusFilter;
      const r = await adminApi.get('/admin/inquiries', { params });
      setItems(r.data?.data || []);
      setPagination(r.data?.pagination || null);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
    adminApi.get('/admin/inquiries/stats').then(r => setStats(r.data?.data)).catch(() => {});
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const r = await adminApi.get(`/admin/inquiries/${id}`);
      setDetail(r.data?.data);
    } catch { toast.error('Failed to load inquiry'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this inquiry?')) return;
    try { await adminApi.delete(`/admin/inquiries/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:2 }}>📩 Inquiries</h1>
          <p style={{ color:DIM, fontSize:13 }}>Contact form submissions and customer messages</p>
        </div>
        {stats && (
          <div style={{ display:'flex', gap:10 }}>
            {[['New', stats.new, '#60A5FA'], ['Read', stats.read, '#9CA3AF'], ['Replied', stats.replied, '#22C55E']].map(([l, n, c]) => (
              <div key={l} style={{ textAlign:'center', background:'rgba(255,255,255,0.03)',
                border:`1px solid ${c}28`, borderRadius:8, padding:'8px 16px' }}>
                <p style={{ color:c, fontWeight:700, fontSize:18, lineHeight:1 }}>{n}</p>
                <p style={{ color:DIM, fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status filter */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['', 'new', 'read', 'replied'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ fontSize:12, padding:'5px 14px', borderRadius:20, cursor:'pointer',
              background: statusFilter === s ? `${GOLD}1A` : 'transparent',
              color: statusFilter === s ? GOLD : DIM,
              border:`1px solid ${statusFilter === s ? GOLD + '40' : 'rgba(255,255,255,0.06)'}`,
              fontWeight: statusFilter === s ? 600 : 400 }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:8, padding:'12px 16px', color:'#EF4444', fontSize:13, marginBottom:16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>
          <p style={{ fontSize:40, marginBottom:12 }}>📭</p>
          <p>No inquiries {statusFilter ? `with status "${statusFilter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map(inq => (
            <div key={inq.id} onClick={() => openDetail(inq.id)}
              style={{ background:'rgba(255,255,255,0.02)',
                border:`1px solid ${inq.status === 'new' ? 'rgba(96,165,250,0.3)' : 'rgba(212,175,55,0.1)'}`,
                borderRadius:8, padding:'13px 18px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
                transition:'border-color 0.15s',
              }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:4 }}>
                  <span style={{ color:IVORY, fontWeight:600, fontSize:13 }}>{inq.name}</span>
                  <span style={{ color:DIM, fontSize:12 }}>{inq.email}</span>
                  <StatusBadge status={inq.status} />
                </div>
                <p style={{ color:DIM, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {inq.subject ? <strong style={{ color:IVORY }}>{inq.subject} — </strong> : null}
                  {inq.message}
                </p>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                <span style={{ color:DIM, fontSize:11 }}>{new Date(inq.created_at).toLocaleDateString('en-IN')}</span>
                <Btn small outline color="#EF4444" onClick={e => { e.stopPropagation(); del(inq.id); }}>Del</Btn>
              </div>
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

      {detail && (
        <DetailModal inquiry={detail} onClose={() => setDetail(null)} onRefresh={load} />
      )}
    </div>
  );
}
