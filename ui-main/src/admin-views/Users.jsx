'use client';
import { useEffect, useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

// ── constants ─────────────────────────────────────────────────────────────────
const ROLE_STYLE = {
  superadmin: { bg:'rgba(167,139,250,0.18)', color:'#A78BFA', border:'rgba(167,139,250,0.35)' },
  admin:      { bg:'rgba(96,165,250,0.15)',  color:'#60A5FA', border:'rgba(96,165,250,0.3)'  },
  user:       { bg:'rgba(52,211,153,0.12)',  color:'#34D399', border:'rgba(52,211,153,0.28)' },
};
function roleBadge(role) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.user;
  return { fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}` };
}

const PLAN_STYLE = {
  free:    { bg:'rgba(107,114,128,0.15)', color:'#9CA3AF', border:'rgba(107,114,128,0.3)'  },
  basic:   { bg:'rgba(59,130,246,0.15)',  color:'#60A5FA', border:'rgba(59,130,246,0.3)'   },
  premium: { bg:'rgba(212,175,55,0.15)',  color:'#D4AF37', border:'rgba(212,175,55,0.3)'   },
  yearly:  { bg:'rgba(167,139,250,0.18)', color:'#A78BFA', border:'rgba(167,139,250,0.35)' },
};
function planBadge(plan) {
  const s = PLAN_STYLE[plan] || PLAN_STYLE.free;
  return { fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}` };
}
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

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'user' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Name, email, password required');
    setSaving(true);
    try {
      await adminApi.post('/admin/users', form);
      toast.success('User created successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)' }} />
      <div style={{ position:'relative', background:'#111428', border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'28px 28px', width:'100%', maxWidth:440, boxShadow:'0 24px 60px rgba(0,0,0,0.7)' }}>
        <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:20 }}>➕ Create New User</h2>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { key:'name',     label:'Full Name',     type:'text',     placeholder:'John Doe'              },
            { key:'email',    label:'Email Address', type:'email',    placeholder:'john@example.com'      },
            { key:'password', label:'Password',      type:'password', placeholder:'Min. 8 characters'     },
            { key:'phone',    label:'Phone (opt.)',  type:'tel',      placeholder:'+91 98765 43210'        },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ display:'block', color:'rgba(245,240,232,0.5)', fontSize:11, fontWeight:500, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]} onChange={e => set(key, e.target.value)}
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.2)', borderRadius:6, color:'#F5F0E8', padding:'9px 13px', fontSize:13, outline:'none' }} />
            </div>
          ))}
          <div>
            <label style={{ display:'block', color:'rgba(245,240,232,0.5)', fontSize:11, fontWeight:500, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.2)', borderRadius:6, color:'#F5F0E8', padding:'9px 13px', fontSize:13, outline:'none' }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ padding:'8px 18px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(245,240,232,0.55)', fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding:'8px 20px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Detail Slide-over ────────────────────────────────────────────────────
function UserDetail({ user, onClose, onUpdated }) {
  const [roleLoading,    setRoleLoading]    = useState(false);
  const [planLoading,    setPlanLoading]    = useState(false);
  const [toggling,       setToggling]       = useState(false);
  const [resendingVerif, setResendingVerif] = useState(false);
  const [email, setEmail]           = useState(user.email);
  const [editingEmail, setEditEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(user.email);
  const [savingEmail, setSavingEmail] = useState(false);

  const saveEmail = async () => {
    const next = emailInput.trim().toLowerCase();
    if (next === email) { setEditEmail(false); return; }
    setSavingEmail(true);
    try {
      const { data } = await adminApi.patch(`/admin/users/${user.id}/email`, { email: next });
      setEmail(data.email || next);
      toast.success('Email updated');
      setEditEmail(false);
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally { setSavingEmail(false); }
  };

  const changeRole = async (newRole) => {
    setRoleLoading(true);
    try {
      await adminApi.patch(`/admin/users/${user.id}/role`, { role: newRole });
      toast.success('Role updated');
      onUpdated();
    } catch { toast.error('Failed to update role'); }
    finally { setRoleLoading(false); }
  };

  const changePlan = async (newPlan) => {
    setPlanLoading(true);
    try {
      await adminApi.patch(`/admin/users/${user.id}/plan`, { plan: newPlan });
      toast.success(`Plan updated to ${newPlan}`);
      onUpdated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update plan'); }
    finally { setPlanLoading(false); }
  };

  const resendVerification = async () => {
    setResendingVerif(true);
    try {
      await adminApi.post(`/admin/users/${user.id}/resend-verification`);
      toast.success('Verification email sent to ' + user.email);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification email');
    } finally { setResendingVerif(false); }
  };

  const toggleActive = async () => {
    setToggling(true);
    try {
      await adminApi.patch(`/admin/users/${user.id}/toggle-active`);
      toast.success(user.is_active ? 'User deactivated' : 'User activated');
      onUpdated();
      onClose();
    } catch { toast.error('Failed'); }
    finally { setToggling(false); }
  };

  const rs = ROLE_STYLE[user.role] || ROLE_STYLE.user;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex' }}>
      <div onClick={onClose} style={{ flex:1, background:'rgba(0,0,0,0.5)' }} />
      <div style={{
        width:360, background:'#0D0F1E', borderLeft:'1px solid rgba(212,175,55,0.2)',
        display:'flex', flexDirection:'column', overflowY:'auto',
        animation:'slideIn 0.2s ease',
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

        <div style={{ padding:'20px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ color:'#D4AF37', fontSize:15, fontWeight:700 }}>User Details</h2>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, color:'rgba(245,240,232,0.55)', fontSize:13, padding:'4px 9px', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'24px 20px', flex:1 }}>
          {/* Avatar + name */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(212,175,55,0.12)', border:'2px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#D4AF37', fontWeight:700, fontSize:20 }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ color:'#F5F0E8', fontSize:16, fontWeight:700 }}>{user.name}</p>
              <span style={roleBadge(user.role)}>{user.role}</span>
            </div>
          </div>

          {/* Email — editable */}
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
              <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em' }}>Email</p>
              {!editingEmail && (
                <button onClick={() => { setEmailInput(email); setEditEmail(true); }}
                  style={{ background:'none', border:'none', color:'#D4AF37', fontSize:11, fontWeight:600, cursor:'pointer', padding:0 }}>
                  ✏️ Edit
                </button>
              )}
            </div>
            {editingEmail ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <input
                  type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveEmail(); if (e.key === 'Escape') setEditEmail(false); }}
                  style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.3)', borderRadius:6, color:'#F5F0E8', padding:'8px 11px', fontSize:13, outline:'none' }} />
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={saveEmail} disabled={savingEmail}
                    style={{ padding:'6px 16px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:12, cursor: savingEmail ? 'not-allowed' : 'pointer', opacity: savingEmail ? 0.7 : 1 }}>
                    {savingEmail ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditEmail(false)} disabled={savingEmail}
                    style={{ padding:'6px 14px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(245,240,232,0.55)', fontSize:12, cursor:'pointer' }}>
                    Cancel
                  </button>
                </div>
                <p style={{ color:'rgba(245,240,232,0.3)', fontSize:10 }}>Dots are preserved (e.g. first.last@gmail.com). Lowercased on save.</p>
              </div>
            ) : (
              <p style={{ color:'#F5F0E8', fontSize:13, wordBreak:'break-all' }}>{email}</p>
            )}
          </div>

          {/* Details */}
          {[
            ['Phone',    user.phone || '—'],
            ['Language', user.preferred_language?.toUpperCase() || '—'],
            ['Joined',   new Date(user.created_at).toLocaleString('en-IN')],
            ['UUID',     user.uuid],
          ].map(([label, value]) => (
            <div key={label} style={{ marginBottom:12 }}>
              <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>{label}</p>
              <p style={{ color:'#F5F0E8', fontSize:13, wordBreak:'break-all' }}>{value}</p>
            </div>
          ))}

          {/* Email verification status */}
          <div style={{ marginBottom:20, background: user.email_verified ? 'rgba(52,211,153,0.06)' : 'rgba(245,158,11,0.07)', border:`1px solid ${user.email_verified ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.3)'}`, borderRadius:8, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <div>
                <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Email Verified</p>
                <span style={{ fontSize:12, fontWeight:600, color: user.email_verified ? '#34D399' : '#FBBF24' }}>
                  {user.email_verified ? '✓ Verified' : '✗ Not Verified'}
                </span>
              </div>
              {!user.email_verified && (
                <button onClick={resendVerification} disabled={resendingVerif}
                  style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.35)', color:'#FBBF24', opacity: resendingVerif ? 0.6 : 1, whiteSpace:'nowrap' }}>
                  {resendingVerif ? '⏳ Sending…' : '📧 Resend Link'}
                </button>
              )}
            </div>
          </div>

          {/* Plan badge */}
          <div style={{ marginBottom:20 }}>
            <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Subscription Plan</p>
            <span style={planBadge(user.plan || 'free')}>{(user.plan || 'free').toUpperCase()}</span>
          </div>

          {/* Status badge */}
          <div style={{ marginBottom:20 }}>
            <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Status</p>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, fontWeight:600, background: user.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', color: user.is_active ? '#34D399' : '#F87171', border:`1px solid ${user.is_active ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              {user.is_active ? '● Active' : '○ Inactive'}
            </span>
          </div>

          {/* Role change */}
          {user.role !== 'superadmin' && (
            <div style={{ marginBottom:20 }}>
              <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Change Role</p>
              <div style={{ display:'flex', gap:8 }}>
                {['user', 'admin'].map(r => (
                  <button key={r} onClick={() => changeRole(r)} disabled={roleLoading || user.role === r}
                    style={{
                      padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor: user.role===r ? 'default' : 'pointer',
                      background: user.role===r ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
                      border:`1px solid ${user.role===r ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: user.role===r ? '#D4AF37' : 'rgba(245,240,232,0.5)',
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan change */}
          <div style={{ marginBottom:20 }}>
            <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Change Plan</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['free', 'basic', 'premium', 'yearly'].map(p => {
                const ps = PLAN_STYLE[p];
                const isCurrent = (user.plan || 'free') === p;
                return (
                  <button key={p} onClick={() => changePlan(p)} disabled={planLoading || isCurrent}
                    style={{
                      padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600,
                      cursor: isCurrent ? 'default' : 'pointer',
                      background: isCurrent ? ps.bg : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isCurrent ? ps.border : 'rgba(255,255,255,0.1)'}`,
                      color: isCurrent ? ps.color : 'rgba(245,240,232,0.4)',
                      opacity: planLoading ? 0.6 : 1,
                    }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        {user.role !== 'superadmin' && (
          <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={toggleActive} disabled={toggling}
              style={{
                width:'100%', padding:'10px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer',
                background: user.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(52,211,153,0.12)',
                border:`1px solid ${user.is_active ? 'rgba(239,68,68,0.35)' : 'rgba(52,211,153,0.35)'}`,
                color: user.is_active ? '#F87171' : '#34D399',
              }}>
              {toggling ? '…' : user.is_active ? '⊘ Deactivate Account' : '✓ Activate Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Users View ───────────────────────────────────────────────────────────
export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);
  const [detailUser,  setDetailUser]  = useState(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const { data } = await adminApi.get('/admin/users', { params: { page, search, limit, role, status } });
      setUsers(data.users || []);
      setTotal(Number(data.pagination?.total) || 0);
    } catch (err) {
      setApiError(true);
      toast.error(err.response?.data?.message || 'Failed to load users — is the API server running?');
    }
    finally { setLoading(false); }
  }, [page, search, role, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openDetail = async (u) => {
    try {
      const { data } = await adminApi.get(`/admin/users/${u.id}`);
      setDetailUser(data.user);
    } catch { setDetailUser(u); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>User Management</h1>
          <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>{total} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ padding:'9px 20px', borderRadius:6, background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', border:'none', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
          ＋ Add User
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'14px 16px', marginBottom:14, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input
          placeholder="Search by name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex:1, minWidth:200, background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'7px 12px', fontSize:13, outline:'none' }} />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          style={{ background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color: role ? '#F5F0E8' : 'rgba(245,240,232,0.35)', padding:'7px 12px', fontSize:13, outline:'none' }}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color: status ? '#F5F0E8' : 'rgba(245,240,232,0.35)', padding:'7px 12px', fontSize:13, outline:'none' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(search || role || status) && (
          <button onClick={() => { setSearch(''); setRole(''); setStatus(''); setPage(1); }}
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, color:'#F87171', fontSize:12, padding:'7px 12px', cursor:'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(212,175,55,0.12)' }}>
                {['User', 'Email', 'Role', 'Plan', 'Status', 'Verified', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:'rgba(212,175,55,0.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>Loading…</td></tr>
              ) : apiError ? (
                <tr>
                  <td colSpan={8} style={{ padding:'36px', textAlign:'center' }}>
                    <p style={{ color:'#F87171', fontSize:14, fontWeight:600, marginBottom:10 }}>⚠ Could not load users</p>
                    <p style={{ color:'rgba(245,240,232,0.35)', fontSize:12, marginBottom:16 }}>Make sure the API server is running: <code style={{ color:'rgba(212,175,55,0.7)' }}>npm run dev:server</code></p>
                    <button onClick={fetchUsers}
                      style={{ padding:'7px 18px', borderRadius:6, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      ↺ Retry
                    </button>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,55,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#D4AF37', fontWeight:700, fontSize:11, flexShrink:0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ color:'#F5F0E8', fontSize:13, fontWeight:600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.55)', fontSize:13 }}>{u.email}</td>
                  <td style={{ padding:'10px 14px' }}><span style={roleBadge(u.role)}>{u.role}</span></td>
                  <td style={{ padding:'10px 14px' }}><span style={planBadge(u.plan || 'free')}>{(u.plan || 'free').toUpperCase()}</span></td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background: u.is_active ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)', color: u.is_active ? '#34D399' : '#F87171', border:`1px solid ${u.is_active ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                      {u.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ color: u.email_verified ? '#34D399' : '#F87171', fontSize:13 }}>
                      {u.email_verified ? '✓' : '✗'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px', color:'rgba(245,240,232,0.38)', fontSize:12 }}>{relTime(u.created_at)}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <button onClick={() => openDetail(u)}
                      style={{ padding:'4px 12px', borderRadius:5, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.25)', color:'#D4AF37', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color:'rgba(245,240,232,0.35)', fontSize:12 }}>
            {Math.min((page-1)*limit+1, total)}–{Math.min(page*limit, total)} of {total}
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

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}
      {detailUser && <UserDetail user={detailUser} onClose={() => setDetailUser(null)} onUpdated={fetchUsers} />}
    </div>
  );
}
