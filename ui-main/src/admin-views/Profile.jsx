'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

function Section({ title, children }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.12)',
      borderRadius:10, padding:'22px 24px', marginBottom:20 }}>
      <h2 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700,
        marginBottom:18, paddingBottom:10, borderBottom:'1px solid rgba(212,175,55,0.1)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
  borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', boxSizing:'border-box',
};

function Btn({ children, onClick, type = 'button', color = GOLD, outline = false, disabled = false }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background: outline ? 'transparent' : color, color: outline ? color : '#0A0C18',
      border:`1px solid ${color}`, borderRadius:6, fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontSize:13, padding:'9px 20px', transition:'all 0.15s',
    }}>{children}</button>
  );
}

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ name:'', email:'' });
  const [pw, setPw]           = useState({ current:'', newPw:'', confirm:'' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]           = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    adminApi.get('/admin/profile').then(r => {
      const d = r.data?.data;
      setProfile(d);
      setForm({ name: d?.name || '', email: d?.email || '' });
    }).catch(() => setError('Failed to load profile'));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    setSavingProfile(true);
    try {
      await adminApi.put('/admin/profile', form);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pw.current || !pw.newPw || !pw.confirm) return toast.error('All fields required');
    if (pw.newPw !== pw.confirm) return toast.error('New passwords do not match');
    if (pw.newPw.length < 8) return toast.error('Password must be at least 8 characters');
    setSavingPw(true);
    try {
      await adminApi.put('/admin/profile/password', { current_password: pw.current, new_password: pw.newPw });
      toast.success('Password changed');
      setPw({ current:'', newPw:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingPw(false); }
  };

  return (
    <div style={{ maxWidth:580 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:2 }}>⚙️ Admin Profile</h1>
        <p style={{ color:DIM, fontSize:13 }}>Manage your account details and password</p>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:8, padding:'12px 16px', color:'#EF4444', fontSize:13, marginBottom:20 }}>{error}</div>
      )}

      {profile && (
        <>
          {/* Account details */}
          <Section title="Account Details">
            <form onSubmit={saveProfile}>
              <Field label="Full Name">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                  placeholder="Your name" style={inputStyle} />
              </Field>
              <Field label="Email Address">
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
                  placeholder="admin@example.com" style={inputStyle} />
              </Field>
              <div style={{ marginTop:4 }}>
                <Field label="Role">
                  <div style={{ padding:'9px 12px', background:'rgba(255,255,255,0.02)',
                    border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, color:DIM, fontSize:13 }}>
                    {profile.role || 'admin'}
                  </div>
                </Field>
              </div>
              <div style={{ marginTop:4 }}>
                <Field label="Account Created">
                  <div style={{ padding:'9px 12px', background:'rgba(255,255,255,0.02)',
                    border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, color:DIM, fontSize:13 }}>
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { dateStyle:'long' }) : '—'}
                  </div>
                </Field>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
                <Btn type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Update Profile'}</Btn>
              </div>
            </form>
          </Section>

          {/* Change password */}
          <Section title="Change Password">
            <form onSubmit={savePassword}>
              {[['Current Password','current','Current password'],
                ['New Password','newPw','Minimum 8 characters'],
                ['Confirm New Password','confirm','Repeat new password']].map(([lbl, key, ph]) => (
                <Field key={key} label={lbl}>
                  <input type="password" value={pw[key]} placeholder={ph}
                    onChange={e => setPw(p => ({ ...p, [key]:e.target.value }))}
                    style={inputStyle} />
                </Field>
              ))}
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
                <Btn type="submit" disabled={savingPw}>{savingPw ? 'Saving…' : 'Change Password'}</Btn>
              </div>
            </form>
          </Section>

          {/* Stats card */}
          <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.12)',
            borderRadius:10, padding:'16px 20px', display:'flex', gap:28, flexWrap:'wrap' }}>
            <div>
              <p style={{ color:DIM, fontSize:10, fontWeight:600, textTransform:'uppercase',
                letterSpacing:'0.08em', marginBottom:4 }}>Plan</p>
              <p style={{ color:GOLD, fontWeight:700, fontSize:16, textTransform:'capitalize' }}>{profile.plan || 'admin'}</p>
            </div>
            <div>
              <p style={{ color:DIM, fontSize:10, fontWeight:600, textTransform:'uppercase',
                letterSpacing:'0.08em', marginBottom:4 }}>Last Login</p>
              <p style={{ color:IVORY, fontWeight:600, fontSize:14 }}>
                {profile.last_login ? new Date(profile.last_login).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' }) : 'Now'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
