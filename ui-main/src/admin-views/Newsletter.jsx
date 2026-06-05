'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

// ── Newsletter Blast Modal ────────────────────────────────────────────────────
function BlastModal({ subscriberCount, onClose }) {
  const [form, setForm] = useState({ subject:'', body:'' });
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.body) return toast.error('Subject and body are required');
    setSending(true);
    try {
      const { data } = await adminApi.post('/admin/newsletter/blast', form);
      toast.success(data.message || `Queued for ${subscriberCount} subscribers`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)' }} />
      <div style={{ position:'relative', background:'#111428', border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'28px', width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.7)' }}>
        <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:4 }}>📰 Send Newsletter</h2>
        <p style={{ color:'rgba(245,240,232,0.38)', fontSize:12, marginBottom:22 }}>
          This will be sent to <strong style={{ color:'#34D399' }}>{subscriberCount}</strong> active subscriber{subscriberCount!==1?'s':''}
        </p>

        {/* Tab: Compose / Preview */}
        <div style={{ display:'flex', gap:1, marginBottom:18 }}>
          {['Compose','Preview'].map(tab => (
            <button key={tab} onClick={() => setPreview(tab==='Preview')}
              style={{ padding:'6px 16px', fontSize:12, fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.15s',
                background: (preview === (tab==='Preview')) ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                color: (preview === (tab==='Preview')) ? '#D4AF37' : 'rgba(245,240,232,0.45)',
                borderRadius: tab==='Compose' ? '6px 0 0 6px' : '0 6px 6px 0',
                borderBottom: (preview === (tab==='Preview')) ? '2px solid #D4AF37' : '2px solid transparent',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {preview ? (
          <div style={{ border:'1px solid rgba(212,175,55,0.18)', borderRadius:8, overflow:'hidden', marginBottom:20 }}>
            <div style={{ background:'#1A1E38', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11 }}>Subject: <span style={{ color:'#F5F0E8', fontWeight:600 }}>{form.subject || '(no subject)'}</span></p>
            </div>
            <div style={{ padding:20, minHeight:200 }}>
              {form.body
                ? <div style={{ color:'rgba(245,240,232,0.8)', fontSize:13, lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: form.body }} />
                : <p style={{ color:'rgba(245,240,232,0.25)', fontSize:12 }}>Body is empty…</p>
              }
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Subject Line</label>
              <input value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))}
                placeholder="Your newsletter subject…"
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'9px 13px', fontSize:13, outline:'none' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>
                Body <span style={{ color:'rgba(245,240,232,0.25)', textTransform:'none', fontWeight:400 }}>(HTML supported)</span>
              </label>
              <textarea value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} rows={10}
                placeholder="<h2>Hello {{name}},</h2><p>Your message here...</p>"
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'9px 13px', fontSize:12, outline:'none', resize:'vertical', fontFamily:'monospace', lineHeight:1.6 }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding:'8px 18px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(245,240,232,0.55)', fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={sending}
                style={{ padding:'8px 22px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, display:'flex', alignItems:'center', gap:6 }}>
                {sending ? '⏳ Sending…' : `📧 Send to ${subscriberCount} Subscribers`}
              </button>
            </div>
          </form>
        )}
        {preview && (
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setPreview(false)} style={{ padding:'8px 18px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(245,240,232,0.55)', fontSize:13, cursor:'pointer' }}>
              ← Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Newsletter View ──────────────────────────────────────────────────────
export default function Newsletter() {
  const [subs,    setSubs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [active,  setActive]  = useState(0);
  const [page,    setPage]    = useState(1);
  const [blast,   setBlast]   = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSubs = () => {
    setLoading(true);
    adminApi.get('/admin/newsletter', { params: { page } })
      .then(({ data }) => {
        setSubs(data.subscribers);
        const tot = Number(data.pagination.total);
        setTotal(tot);
        setActive(data.subscribers.filter(s => s.is_active).length || 0);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubs(); }, [page]);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>Newsletter</h1>
          <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>{total} total subscribers</p>
        </div>
        <button onClick={() => setBlast(true)}
          style={{ padding:'9px 20px', borderRadius:6, background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', border:'none', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
          📧 Send Newsletter
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Subscribers', value:total,             color:'#D4AF37' },
          { label:'Active',            value:active,            color:'#34D399' },
          { label:'Unsubscribed',      value:total - active,    color:'#F87171' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'14px 16px' }}>
            <p style={{ color, fontSize:24, fontWeight:700, lineHeight:1, marginBottom:4 }}>{value}</p>
            <p style={{ color:'rgba(245,240,232,0.4)', fontSize:12 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(212,175,55,0.1)' }}>
                {['Email','Name','Language','Status','Subscribed On'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:'rgba(212,175,55,0.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding:'32px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>Loading…</td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:'32px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>No subscribers yet</td></tr>
              ) : subs.map(s => (
                <tr key={s.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,55,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.8)', fontSize:13 }}>{s.email}</td>
                  <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.55)', fontSize:13 }}>{s.name || '—'}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'rgba(96,165,250,0.12)', color:'#60A5FA', border:'1px solid rgba(96,165,250,0.25)', fontWeight:600, textTransform:'uppercase' }}>
                      {s.preferred_language}
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background: s.is_active ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)', color: s.is_active ? '#34D399' : '#F87171', border:`1px solid ${s.is_active ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                      {s.is_active ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.38)', fontSize:12 }}>
                    {new Date(s.subscribed_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>Page {page} of {Math.ceil(total/20)||1}</span>
          <div style={{ display:'flex', gap:6 }}>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={{ padding:'5px 12px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page===1 ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page===1 ? 'default' : 'pointer', fontSize:12 }}>←</button>
            <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)} style={{ padding:'5px 12px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page*20>=total ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page*20>=total ? 'default' : 'pointer', fontSize:12 }}>→</button>
          </div>
        </div>
      </div>

      {blast && <BlastModal subscriberCount={active} onClose={() => setBlast(false)} />}
    </div>
  );
}
