'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const TYPE_STYLE = {
  info:       { icon:'ℹ️', bg:'rgba(96,165,250,0.12)',   color:'#60A5FA',  border:'rgba(96,165,250,0.25)'   },
  success:    { icon:'✅', bg:'rgba(52,211,153,0.12)',   color:'#34D399',  border:'rgba(52,211,153,0.25)'   },
  warning:    { icon:'⚠️', bg:'rgba(245,158,11,0.12)',   color:'#FBBF24',  border:'rgba(245,158,11,0.25)'   },
  promo:      { icon:'🎁', bg:'rgba(167,139,250,0.12)', color:'#A78BFA',  border:'rgba(167,139,250,0.25)'  },
  prediction: { icon:'🔮', bg:'rgba(212,175,55,0.12)',   color:'#D4AF37',  border:'rgba(212,175,55,0.25)'   },
};

function relTime(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

export default function Notifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form,    setForm]    = useState({ title:'', body:'', type:'info', user_id:'' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Web push (PWA) state ──
  const [pushStats, setPushStats] = useState(null);
  const [pushForm,  setPushForm]  = useState({ title:'', body:'', url:'/horoscope' });
  const [pushBusy,  setPushBusy]  = useState(false);
  const setP = (k, v) => setPushForm(f => ({ ...f, [k]: v }));

  const fetchPushStats = () => {
    adminApi.get('/admin/push/stats')
      .then(({ data }) => setPushStats(data))
      .catch(() => setPushStats({ total: 0, active: 0, by_rashi: [], unavailable: true }));
  };
  useEffect(() => { fetchPushStats(); }, []);

  const triggerDailyPush = async () => {
    if (!confirm('Send today\'s horoscope push to all active subscribers now?')) return;
    setPushBusy(true);
    try {
      const { data } = await adminApi.post('/admin/push/daily');
      toast.success(data?.message || 'Daily push started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger daily push');
    } finally { setPushBusy(false); }
  };

  const sendPushBlast = async (e) => {
    e.preventDefault();
    if (!pushForm.title || !pushForm.body) return toast.error('Push title and body required');
    if (!confirm(`Send this push notification to ${pushStats?.active ?? 'all'} subscribers?`)) return;
    setPushBusy(true);
    try {
      const { data } = await adminApi.post('/admin/push/blast', pushForm);
      toast.success(data?.skipped ? 'Push not configured (VAPID keys missing)' : `Push sent: ${data?.sent ?? 0} delivered, ${data?.failed ?? 0} failed`);
      setPushForm({ title:'', body:'', url:'/horoscope' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send push');
    } finally { setPushBusy(false); }
  };

  const fetchNotifs = () => {
    setLoading(true);
    adminApi.get('/admin/notifications', { params: { page } })
      .then(({ data }) => { setNotifs(data.notifications); setTotal(Number(data.pagination?.total || 0)); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(); }, [page]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return toast.error('Title and body required');
    setSending(true);
    try {
      await adminApi.post('/admin/notifications', {
        title: form.title, body: form.body, type: form.type,
        user_id: form.user_id ? parseInt(form.user_id) : null,
      });
      toast.success(form.user_id ? 'Notification sent to user' : 'Broadcast sent to all users');
      setForm({ title:'', body:'', type:'info', user_id:'' });
      setPage(1);
      fetchNotifs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSending(false); }
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>Notifications</h1>
        <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>Send in-app notifications to users</p>
      </div>

      <div className="admin-responsive-grid" style={{ display:'grid', gridTemplateColumns:'420px 1fr', gap:16, alignItems:'start' }}>
        {/* ── Send Form ────────────────────────────────────────────────── */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'22px' }}>
          <h2 style={{ color:'#F5F0E8', fontSize:15, fontWeight:700, marginBottom:18 }}>🔔 Send Notification</h2>
          <form onSubmit={onSend} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Type selector */}
            <div>
              <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Type</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(TYPE_STYLE).map(([key, s]) => (
                  <button key={key} type="button" onClick={() => set('type', key)} style={{
                    padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
                    background: form.type===key ? s.bg : 'rgba(255,255,255,0.05)',
                    border:`1px solid ${form.type===key ? s.border : 'rgba(255,255,255,0.1)'}`,
                    color: form.type===key ? s.color : 'rgba(245,240,232,0.45)',
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    <span>{s.icon}</span> {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Title</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Notification title…"
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none' }} />
            </div>

            {/* Body */}
            <div>
              <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Message Body</label>
              <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={4} placeholder="Notification message…"
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none', resize:'vertical', lineHeight:1.6 }} />
            </div>

            {/* Target */}
            <div>
              <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>
                Target User ID <span style={{ color:'rgba(245,240,232,0.25)', textTransform:'none', fontWeight:400 }}>(blank = broadcast all)</span>
              </label>
              <input value={form.user_id} onChange={e => set('user_id', e.target.value)} placeholder="Leave blank to broadcast to everyone"
                type="number"
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none' }} />
            </div>

            {/* Preview pill */}
            <div style={{ padding:'10px 14px', borderRadius:8, background: TYPE_STYLE[form.type]?.bg, border:`1px solid ${TYPE_STYLE[form.type]?.border}` }}>
              <p style={{ color: TYPE_STYLE[form.type]?.color, fontSize:12, fontWeight:700, marginBottom:2 }}>
                {TYPE_STYLE[form.type]?.icon} {form.title || 'Notification Title'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.6)', fontSize:11, lineHeight:1.5 }}>
                {form.body || 'Message body will appear here…'}
              </p>
              <p style={{ color:'rgba(245,240,232,0.3)', fontSize:10, marginTop:6 }}>
                → {form.user_id ? `User #${form.user_id}` : '📡 All users (broadcast)'}
              </p>
            </div>

            <button type="submit" disabled={sending}
              style={{ padding:'10px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              {sending ? '⏳ Sending…' : `🔔 ${form.user_id ? 'Send to User' : 'Broadcast to All'}`}
            </button>
          </form>
        </div>

        {/* ── History ──────────────────────────────────────────────────── */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(212,175,55,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ color:'#F5F0E8', fontSize:15, fontWeight:700 }}>Recent History</h2>
            <span style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>{total} total</span>
          </div>

          {loading ? (
            <div style={{ padding:20 }}>
              {[1,2,3].map(i => <div key={i} style={{ height:60, background:'rgba(255,255,255,0.04)', borderRadius:6, marginBottom:10, animation:'pulse 1.5s infinite' }} />)}
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ padding:'32px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>No notifications yet</div>
          ) : (
            <div style={{ overflowY:'auto', maxHeight:520 }}>
              {notifs.map(n => {
                const ts = TYPE_STYLE[n.type] || TYPE_STYLE.info;
                return (
                  <div key={n.id} style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,55,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:12, padding:'1px 7px', borderRadius:10, fontWeight:600, background:ts.bg, color:ts.color, border:`1px solid ${ts.border}` }}>
                            {ts.icon} {n.type}
                          </span>
                          <span style={{ color:'rgba(245,240,232,0.28)', fontSize:11 }}>
                            {n.user_id ? `→ User #${n.user_id}` : '📡 Broadcast'}
                          </span>
                        </div>
                        <p style={{ color:'#F5F0E8', fontSize:13, fontWeight:600, marginBottom:2 }}>{n.title}</p>
                        <p style={{ color:'rgba(245,240,232,0.5)', fontSize:12, lineHeight:1.5 }}>{n.body}</p>
                      </div>
                      <span style={{ color:'rgba(245,240,232,0.28)', fontSize:11, flexShrink:0, marginTop:2 }}>{relTime(n.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>Page {page} / {Math.ceil(total/20)}</span>
              <div style={{ display:'flex', gap:6 }}>
                <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={{ padding:'4px 11px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page===1 ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page===1 ? 'default' : 'pointer', fontSize:12 }}>←</button>
                <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)} style={{ padding:'4px 11px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page*20>=total ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page*20>=total ? 'default' : 'pointer', fontSize:12 }}>→</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Web Push (PWA daily horoscope notifications) ──────────────────── */}
      <div style={{ marginTop:28 }}>
        <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:18, fontWeight:700, marginBottom:3 }}>📲 Web Push (PWA)</h2>
        <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13, marginBottom:16 }}>
          Browser push notifications to visitors who opted in. The daily horoscope push runs automatically at 07:00 IST.
        </p>

        <div className="admin-responsive-grid" style={{ display:'grid', gridTemplateColumns:'420px 1fr', gap:16, alignItems:'start' }}>
          {/* Blast form */}
          <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'22px' }}>
            <h3 style={{ color:'#F5F0E8', fontSize:15, fontWeight:700, marginBottom:18 }}>📢 Send Push Blast</h3>
            <form onSubmit={sendPushBlast} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Push Title</label>
                <input value={pushForm.title} onChange={e => setP('title', e.target.value)} placeholder="🔯 Notification title…"
                  style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none' }} />
              </div>
              <div>
                <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Body</label>
                <textarea value={pushForm.body} onChange={e => setP('body', e.target.value)} rows={3} placeholder="Push message…"
                  style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none', resize:'vertical', lineHeight:1.6 }} />
              </div>
              <div>
                <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>
                  Click URL <span style={{ color:'rgba(245,240,232,0.25)', textTransform:'none', fontWeight:400 }}>(where the notification opens)</span>
                </label>
                <input value={pushForm.url} onChange={e => setP('url', e.target.value)} placeholder="/horoscope"
                  style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none' }} />
              </div>
              <button type="submit" disabled={pushBusy}
                style={{ padding:'10px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor: pushBusy ? 'not-allowed' : 'pointer', opacity: pushBusy ? 0.7 : 1 }}>
                {pushBusy ? '⏳ Working…' : '📢 Send Push to All Subscribers'}
              </button>
            </form>
          </div>

          {/* Stats + daily trigger */}
          <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ color:'#F5F0E8', fontSize:15, fontWeight:700 }}>Subscribers</h3>
              <button onClick={fetchPushStats} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color:'#D4AF37', cursor:'pointer', fontSize:11 }}>↻ Refresh</button>
            </div>

            {pushStats?.unavailable ? (
              <p style={{ color:'#FBBF24', fontSize:13 }}>⚠️ Push endpoint unavailable — is the API deployed with migration 042?</p>
            ) : !pushStats ? (
              <p style={{ color:'rgba(245,240,232,0.35)', fontSize:13 }}>Loading…</p>
            ) : (
              <>
                <div style={{ display:'flex', gap:12, marginBottom:18 }}>
                  <div style={{ flex:1, background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:8, padding:'14px 16px' }}>
                    <p style={{ color:'rgba(245,240,232,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Active</p>
                    <p style={{ color:'#34D399', fontSize:26, fontWeight:800 }}>{pushStats.active}</p>
                  </div>
                  <div style={{ flex:1, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'14px 16px' }}>
                    <p style={{ color:'rgba(245,240,232,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Total ever</p>
                    <p style={{ color:'#F5F0E8', fontSize:26, fontWeight:800 }}>{pushStats.total}</p>
                  </div>
                </div>

                <button onClick={triggerDailyPush} disabled={pushBusy || !pushStats.active}
                  style={{ width:'100%', padding:'10px', borderRadius:6, border:'1px solid rgba(52,211,153,0.35)', background:'rgba(52,211,153,0.1)', color:'#34D399', fontWeight:700, fontSize:13, cursor: (pushBusy||!pushStats.active) ? 'not-allowed' : 'pointer', opacity:(pushBusy||!pushStats.active)?0.6:1 }}>
                  🌅 Trigger Daily Horoscope Push Now
                </button>
                <p style={{ color:'rgba(245,240,232,0.3)', fontSize:11, marginTop:8, lineHeight:1.5 }}>
                  Sends each subscriber their moon-sign horoscope. Runs automatically every day at 07:00 IST — use this only to re-send or test.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
