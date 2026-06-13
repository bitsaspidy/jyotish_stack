'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" onClick={onChange} disabled={disabled}
      style={{ width:44, height:24, borderRadius:12, background: checked ? '#D4AF37' : 'rgba(255,255,255,0.1)', border:'none', cursor: disabled ? 'default' : 'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:2, width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.3)', transition:'left 0.2s', left: checked ? 22 : 2 }} />
    </button>
  );
}

function Field({ label, description, children }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ color:'#F5F0E8', fontSize:13, fontWeight:600, marginBottom:3 }}>{label}</p>
        {description && <p style={{ color:'rgba(245,240,232,0.38)', fontSize:11, lineHeight:1.5 }}>{description}</p>}
      </div>
      <div style={{ flexShrink:0 }}>{children}</div>
    </div>
  );
}

const TABS = [
  { key:'general',     label:'🌐 General',     icon:'🌐' },
  { key:'maintenance', label:'🚧 Maintenance',  icon:'🚧' },
  { key:'payments',    label:'💳 Payments',     icon:'💳' },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [dirty,    setDirty]    = useState(false);
  const [tab,      setTab]      = useState('general');
  // Tracked separately — never pre-filled from API (secret is masked as '[SET]')
  const [secretInput, setSecretInput] = useState('');

  useEffect(() => {
    adminApi.get('/admin/settings')
      .then(({ data }) => setSettings(data.settings))
      .catch(() => toast.error('Failed to load settings'));
  }, []);

  const set = (key, val) => {
    setSettings(s => ({ ...s, [key]: val }));
    setDirty(true);
  };
  const toggle = (key) => set(key, settings[key] === 'true' ? 'false' : 'true');

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      // Never send the '[SET]' sentinel back — backend would skip it anyway,
      // but cleaner to omit it entirely
      delete payload.razorpay_key_secret;
      // Only include the secret if the admin actually typed a new value
      if (secretInput.trim()) payload.razorpay_key_secret = secretInput.trim();
      await adminApi.patch('/admin/settings', payload);
      toast.success('Settings saved successfully');
      setDirty(false);
      setSecretInput('');
      // Refresh so secretIsSet reflects new state
      const { data } = await adminApi.get('/admin/settings');
      setSettings(data.settings);
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>App Settings</h1>
        <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>Manage site configuration and preferences</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:1, marginBottom:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:4, width:'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'7px 18px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.15s',
            background: tab===t.key ? 'rgba(212,175,55,0.15)' : 'transparent',
            color: tab===t.key ? '#D4AF37' : 'rgba(245,240,232,0.45)',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── General Tab ──────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'22px 24px' }}>
          <h2 style={{ color:'#F5F0E8', fontSize:15, fontWeight:700, marginBottom:4 }}>🌐 Site Information</h2>
          <p style={{ color:'rgba(245,240,232,0.35)', fontSize:12, marginBottom:18 }}>Basic configuration displayed to visitors</p>

          {[
            { key:'site_name',      label:'Site Name',            desc:'Shown in browser tab and header', multiline:false },
            { key:'site_tagline',   label:'Tagline (English)',     desc:'Short description shown on landing page', multiline:false },
            { key:'site_tagline_hi',label:'Tagline (Hindi)',       desc:'Hindi version of the tagline', multiline:false },
            { key:'contact_email',  label:'Contact Email',         desc:'Public-facing support/contact address', multiline:false },
          ].map(({ key, label, desc, multiline }) => (
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ display:'block', color:'rgba(245,240,232,0.5)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</label>
              {desc && <p style={{ color:'rgba(245,240,232,0.28)', fontSize:11, marginBottom:5 }}>{desc}</p>}
              {multiline
                ? <textarea value={settings[key] || ''} onChange={e => set(key, e.target.value)} rows={3} style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none', resize:'vertical' }} />
                : <input value={settings[key] || ''} onChange={e => set(key, e.target.value)} style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none' }} />
              }
            </div>
          ))}
        </div>
      )}

      {/* ── Maintenance Tab ───────────────────────────────────────────────── */}
      {tab === 'maintenance' && (
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'22px 24px' }}>
          <h2 style={{ color:'#F5F0E8', fontSize:15, fontWeight:700, marginBottom:4 }}>🚧 Maintenance Mode</h2>
          <p style={{ color:'rgba(245,240,232,0.35)', fontSize:12, marginBottom:18 }}>When enabled, visitors see a "Coming Soon" page. Admin routes remain accessible.</p>

          <Field
            label="Maintenance Mode"
            description="Enable to show coming-soon page to all non-admin visitors">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11, fontWeight:600, color: settings.maintenance_mode==='true' ? '#F87171' : '#34D399' }}>
                {settings.maintenance_mode === 'true' ? '● ON' : '○ OFF'}
              </span>
              <Toggle checked={settings.maintenance_mode === 'true'} onChange={() => toggle('maintenance_mode')} />
            </div>
          </Field>

          {settings.maintenance_mode === 'true' && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'10px 14px', marginBottom:18 }}>
              <p style={{ color:'#F87171', fontSize:12, fontWeight:600 }}>⚠ Maintenance mode is ACTIVE — visitors cannot access the site.</p>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16 }}>
            {[
              { key:'maintenance_title',      label:'Page Title',         multiline:false },
              { key:'maintenance_message',    label:'Message (English)',  multiline:true  },
              { key:'maintenance_message_hi', label:'Message (Hindi)',    multiline:true  },
            ].map(({ key, label, multiline }) => (
              <div key={key} style={{ gridColumn: multiline ? 'span 1' : 'auto' }}>
                <label style={{ display:'block', color:'rgba(245,240,232,0.5)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{label}</label>
                {multiline
                  ? <textarea value={settings[key] || ''} onChange={e => set(key, e.target.value)} rows={4} style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none', resize:'vertical' }} />
                  : <input value={settings[key] || ''} onChange={e => set(key, e.target.value)} style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none' }} />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payments Tab ──────────────────────────────────────────────────── */}
      {tab === 'payments' && (
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'22px 24px' }}>
          <h2 style={{ color:'#F5F0E8', fontSize:15, fontWeight:700, marginBottom:4 }}>💳 Razorpay Configuration</h2>
          <p style={{ color:'rgba(245,240,232,0.35)', fontSize:12, marginBottom:18 }}>API keys and payment gateway settings</p>

          <Field
            label="Enable Payments"
            description="Show the payment UI to users — only activate once keys are configured below">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11, fontWeight:600, color: settings.razorpay_enabled==='true' ? '#34D399' : 'rgba(245,240,232,0.35)' }}>
                {settings.razorpay_enabled === 'true' ? '● Enabled' : '○ Disabled'}
              </span>
              <Toggle checked={settings.razorpay_enabled === 'true'} onChange={() => toggle('razorpay_enabled')} />
            </div>
          </Field>

          <div style={{ marginTop:22, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:20 }}>
            <p style={{ color:'rgba(245,240,232,0.5)', fontSize:12, fontWeight:600, marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>API Keys</p>

            {/* Key ID */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', color:'rgba(245,240,232,0.5)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
                Key ID
              </label>
              <p style={{ color:'rgba(245,240,232,0.28)', fontSize:11, marginBottom:6 }}>
                Starts with <code style={{ color:'rgba(212,175,55,0.7)', background:'rgba(212,175,55,0.08)', padding:'1px 5px', borderRadius:3 }}>rzp_live_</code> for production or <code style={{ color:'rgba(212,175,55,0.7)', background:'rgba(212,175,55,0.08)', padding:'1px 5px', borderRadius:3 }}>rzp_test_</code> for testing
              </p>
              <input
                value={settings.razorpay_key_id || ''}
                onChange={e => set('razorpay_key_id', e.target.value)}
                placeholder="rzp_live_xxxxxxxxxxxx"
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'monospace' }}
              />
            </div>

            {/* Key Secret */}
            <div style={{ marginBottom:8 }}>
              <label style={{ display:'block', color:'rgba(245,240,232,0.5)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
                Key Secret
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <p style={{ color:'rgba(245,240,232,0.28)', fontSize:11 }}>Never shared publicly — stored in the database</p>
                {settings.razorpay_key_secret === '[SET]' && (
                  <span style={{ fontSize:10, padding:'1px 8px', borderRadius:10, background:'rgba(34,197,94,0.1)', color:'#22C55E', border:'1px solid rgba(34,197,94,0.25)', fontWeight:600 }}>
                    ● Currently set
                  </span>
                )}
              </div>
              <input
                type="password"
                value={secretInput}
                onChange={e => { setSecretInput(e.target.value); setDirty(true); }}
                placeholder={settings.razorpay_key_secret === '[SET]' ? '••••••••••••••••  (leave blank to keep current)' : 'Enter key secret'}
                style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'monospace' }}
              />
            </div>

            <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:8 }}>
              <p style={{ color:'#FBBF24', fontSize:12, fontWeight:600, marginBottom:4 }}>⚠ Security reminder</p>
              <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11, lineHeight:1.6 }}>
                Use <strong style={{ color:'rgba(245,240,232,0.7)' }}>test keys</strong> during development. Switch to live keys only when going to production. Keys saved here take effect immediately — no server restart needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Bar ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop:20, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'14px 22px' }}>
        <span style={{ color: dirty ? '#FBBF24' : 'rgba(245,240,232,0.35)', fontSize:12 }}>
          {dirty ? '● Unsaved changes' : '✓ All settings saved'}
        </span>
        <button onClick={save} disabled={saving || !dirty}
          style={{ padding:'9px 24px', borderRadius:6, border:'none', background: (saving||!dirty) ? 'rgba(212,175,55,0.3)' : 'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor: (saving||!dirty) ? 'not-allowed' : 'pointer' }}>
          {saving ? '⏳ Saving…' : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
}
