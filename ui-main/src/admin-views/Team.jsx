'use client';
import { useEffect, useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

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

function MemberModal({ member, onClose, onSaved }) {
  const isEdit = !!member?.id;
  const [form, setForm] = useState({
    name:      member?.name      || '',
    role:      member?.role      || '',
    bio:       member?.bio       || '',
    avatar:    member?.avatar    || '',
    linkedin:  member?.linkedin  || '',
    twitter:   member?.twitter   || '',
    is_active: member?.is_active !== undefined ? member.is_active : true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return toast.error('Name and role required');
    setSaving(true);
    try {
      if (isEdit) await adminApi.put(`/admin/team/${member.id}`, form);
      else        await adminApi.post('/admin/team', form);
      toast.success(isEdit ? 'Updated' : 'Added');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center',
      justifyContent:'center', padding:20 }}>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)' }} />
      <div style={{ position:'relative', background:'#111428', border:'1px solid rgba(212,175,55,0.25)',
        borderRadius:12, padding:'28px', width:'100%', maxWidth:520, boxShadow:'0 24px 60px rgba(0,0,0,0.7)' }}>
        <h2 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:20 }}>
          {isEdit ? '✏️ Edit Member' : '👤 Add Team Member'}
        </h2>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[['Name *','name','Member name'], ['Role *','role','e.g. Vedic Astrologer'],
            ['Avatar URL','avatar','https://…'], ['LinkedIn URL','linkedin','https://linkedin.com/in/…'],
            ['Twitter / X URL','twitter','https://x.com/…']].map(([lbl, key, ph]) => (
            <div key={key}>
              <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{lbl}</label>
              <input value={form[key]} placeholder={ph} onChange={e => set(key, e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                  borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', boxSizing:'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Bio</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3}
              placeholder="Short biography shown on the About page…"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              style={{ width:14, height:14, accentColor:GOLD }} />
            <span style={{ color:DIM, fontSize:13 }}>Visible on website</span>
          </label>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <Btn outline onClick={onClose}>Cancel</Btn>
            <Btn disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Member'}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminTeam() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await adminApi.get('/admin/team');
      setMembers(r.data?.data || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!confirm('Remove this team member?')) return;
    try { await adminApi.delete(`/admin/team/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:2 }}>👥 Team</h1>
          <p style={{ color:DIM, fontSize:13 }}>Team members shown on the About / Team page</p>
        </div>
        <Btn onClick={() => setModal('new')}>+ Add Member</Btn>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:8, padding:'12px 16px', color:'#EF4444', fontSize:13, marginBottom:16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>Loading…</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>
          <p style={{ fontSize:40, marginBottom:12 }}>👥</p>
          <p>No team members yet.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {members.map(m => (
            <div key={m.id} style={{ background:'rgba(255,255,255,0.02)',
              border:`1px solid ${m.is_active ? 'rgba(212,175,55,0.2)' : 'rgba(107,114,128,0.15)'}`,
              borderRadius:10, padding:'18px 18px', opacity: m.is_active ? 1 : 0.6 }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                {m.avatar ? (
                  <img src={m.avatar} alt={m.name} style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                ) : (
                  <div style={{ width:52, height:52, borderRadius:'50%', background:`${GOLD}18`,
                    border:`1px solid ${GOLD}35`, display:'flex', alignItems:'center', justifyContent:'center',
                    color:GOLD, fontWeight:700, fontSize:20, flexShrink:0 }}>
                    {m.name[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:IVORY, fontWeight:700, fontSize:14, marginBottom:2 }}>{m.name}</p>
                  <p style={{ color:GOLD, fontSize:12, marginBottom:4 }}>{m.role}</p>
                  <div style={{ display:'flex', gap:8 }}>
                    {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" style={{ color:DIM, fontSize:11 }}>LinkedIn</a>}
                    {m.twitter  && <a href={m.twitter}  target="_blank" rel="noreferrer" style={{ color:DIM, fontSize:11 }}>X</a>}
                  </div>
                </div>
                {!m.is_active && (
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:'rgba(107,114,128,0.15)',
                    color:'#9CA3AF', border:'1px solid rgba(107,114,128,0.2)', fontWeight:700, flexShrink:0 }}>HIDDEN</span>
                )}
              </div>
              {m.bio && <p style={{ color:DIM, fontSize:12, lineHeight:1.65, marginBottom:12 }}>{m.bio}</p>}
              <div style={{ display:'flex', gap:8 }}>
                <Btn small outline onClick={() => setModal(m)}>Edit</Btn>
                <Btn small outline color="#EF4444" onClick={() => del(m.id)}>Remove</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <MemberModal
          member={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
