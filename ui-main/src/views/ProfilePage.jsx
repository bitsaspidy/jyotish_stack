'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import { PLAN_LIMITS } from '../components/UpgradeModal';

// ── Constants ─────────────────────────────────────────────────────────────────
const GOLD   = '#D4AF37';
const NAVY   = '#0B0D1A';
const CARD   = '#111428';
const IVORY  = '#F5F0E8';
const DIM    = 'rgba(245,240,232,0.45)';
const GREEN  = '#22C55E';
const AMBER  = '#F59E0B';
const RED    = '#EF4444';
const VIOLET = '#A78BFA';
const BLUE   = '#60A5FA';

const PLAN_META = {
  free:    { label: 'Free',    color: '#9CA3AF', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)'  },
  basic:   { label: 'Basic',   color: BLUE,      bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)'   },
  premium: { label: 'Premium', color: GOLD,      bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.3)'   },
  yearly:  { label: 'Yearly',  color: VIOLET,    bg: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.35)' },
};

const TABS = [
  { key: 'profile',      en: '👤 Profile',      hi: '👤 प्रोफाइल'     },
  { key: 'security',     en: '🔐 Security',     hi: '🔐 सुरक्षा'       },
  { key: 'subscription', en: '💎 Subscription', hi: '💎 सदस्यता'      },
];

// ── Small helpers ─────────────────────────────────────────────────────────────
const Label = ({ children, style }) => (
  <p style={{ color: DIM, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, ...style }}>
    {children}
  </p>
);

const Field = ({ children }) => (
  <div style={{ marginBottom: 20 }}>{children}</div>
);

const Input = ({ value, onChange, type = 'text', placeholder, disabled }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      width: '100%', boxSizing: 'border-box',
      background: disabled ? 'rgba(255,255,255,0.03)' : '#0D0F1E',
      border: `1px solid rgba(212,175,55,${disabled ? '0.1' : '0.22'})`,
      borderRadius: 8, color: disabled ? DIM : IVORY,
      padding: '10px 14px', fontSize: 14, outline: 'none',
      transition: 'border-color 0.2s',
    }}
    onFocus={e  => { if (!disabled) e.target.style.borderColor = 'rgba(212,175,55,0.5)'; }}
    onBlur={e   => { if (!disabled) e.target.style.borderColor = 'rgba(212,175,55,0.22)'; }}
  />
);

const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      width: '100%', background: '#0D0F1E', border: '1px solid rgba(212,175,55,0.22)',
      borderRadius: 8, color: IVORY, padding: '10px 14px', fontSize: 14, outline: 'none',
    }}
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const SaveBtn = ({ onClick, loading, children }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      padding: '10px 28px', borderRadius: 8, border: 'none',
      background: loading ? 'rgba(212,175,55,0.4)' : `linear-gradient(135deg,${GOLD},#E8C96A)`,
      color: NAVY, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
      letterSpacing: '0.03em', transition: 'opacity 0.2s',
    }}
  >
    {loading ? '⏳ Saving…' : children}
  </button>
);

// ── Tab: Profile ──────────────────────────────────────────────────────────────
function ProfileTab({ user, setUser, lang, onResendVerif }) {
  const hi = lang === 'hi';
  const [form,    setForm]    = useState({ name: user.name || '', phone: user.phone || '', preferred_language: user.preferred_language || 'hi' });
  const [saving,  setSaving]  = useState(false);
  const [sending, setSending] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return toast.error(hi ? 'नाम आवश्यक है' : 'Name is required');
    setSaving(true);
    try {
      const { data } = await api.patch('/users/profile', form);
      setUser(data.user);
      toast.success(hi ? 'प्रोफाइल अपडेट हो गई' : 'Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const resendVerif = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success(hi ? 'सत्यापन ईमेल भेजा गया!' : 'Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  return (
    <div>
      {/* Email verification notice */}
      {!user.email_verified && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ color: AMBER, fontWeight: 600, fontSize: 13, margin: 0 }}>
                {hi ? 'ईमेल सत्यापित नहीं है' : 'Email not verified'}
              </p>
              <p style={{ color: DIM, fontSize: 12, margin: '3px 0 0' }}>
                {hi ? 'कृपया अपना ईमेल सत्यापित करें।' : 'Please verify your email to unlock all features.'}
              </p>
            </div>
          </div>
          <button onClick={resendVerif} disabled={sending}
            style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.12)', color: AMBER, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: sending ? 0.6 : 1 }}>
            {sending ? '⏳' : (hi ? '📧 ईमेल दोबारा भेजें' : '📧 Resend Email')}
          </button>
        </div>
      )}

      {/* Read-only meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 18px' }}>
        {[
          { label: hi ? 'ईमेल' : 'Email',        value: user.email },
          { label: hi ? 'सदस्यता' : 'Plan',       value: (PLAN_META[user.plan || 'free']?.label || 'Free').toUpperCase(), color: PLAN_META[user.plan || 'free']?.color },
          { label: hi ? 'सदस्य बने' : 'Member Since', value: new Date(user.created_at).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day:'2-digit', month:'long', year:'numeric' }) },
          { label: hi ? 'ईमेल सत्यापन' : 'Email Verified', value: user.email_verified ? (hi ? '✓ सत्यापित' : '✓ Verified') : (hi ? '✗ असत्यापित' : '✗ Not Verified'), color: user.email_verified ? GREEN : AMBER },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <Label>{label}</Label>
            <p style={{ color: color || IVORY, fontSize: 13, margin: 0, wordBreak: 'break-all' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field>
          <Label>{hi ? 'पूरा नाम' : 'Full Name'}</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
        </Field>
        <Field>
          <Label>{hi ? 'फ़ोन नंबर' : 'Phone Number'}</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
        </Field>
        <Field>
          <Label>{hi ? 'पसंदीदा भाषा' : 'Preferred Language'}</Label>
          <Select
            value={form.preferred_language}
            onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))}
            options={[
              { value: 'en', label: 'English'        },
              { value: 'hi', label: 'हिंदी (Hindi)'  },
            ]}
          />
        </Field>
        <Field>
          <Label>{hi ? 'यूज़र ID' : 'User UUID'}</Label>
          <Input value={user.uuid} disabled />
        </Field>
      </div>

      <div style={{ marginTop: 8 }}>
        <SaveBtn onClick={save} loading={saving}>
          {hi ? 'बदलाव सहेजें' : 'Save Changes'}
        </SaveBtn>
      </div>
    </div>
  );
}

// ── Tab: Security ─────────────────────────────────────────────────────────────
function SecurityTab({ lang }) {
  const hi = lang === 'hi';
  const [form,   setForm]   = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.current_password || !form.new_password) return toast.error(hi ? 'सभी फ़ील्ड आवश्यक हैं' : 'All fields required');
    if (form.new_password.length < 8) return toast.error(hi ? 'नया पासवर्ड कम से कम 8 अक्षरों का होना चाहिए' : 'New password must be at least 8 characters');
    if (form.new_password !== form.confirm_password) return toast.error(hi ? 'पासवर्ड मेल नहीं खाता' : 'Passwords do not match');
    setSaving(true);
    try {
      await api.patch('/users/password', { current_password: form.current_password, new_password: form.new_password });
      toast.success(hi ? 'पासवर्ड बदल गया' : 'Password changed successfully');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const fields = [
    { key: 'current_password', label: hi ? 'मौजूदा पासवर्ड' : 'Current Password' },
    { key: 'new_password',     label: hi ? 'नया पासवर्ड'     : 'New Password'     },
    { key: 'confirm_password', label: hi ? 'पासवर्ड दोहराएं'  : 'Confirm Password' },
  ];

  return (
    <div>
      <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 26, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <p style={{ color: BLUE, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          {hi
            ? 'अपना पासवर्ड नियमित रूप से बदलते रहें। 8+ अक्षरों का मजबूत पासवर्ड चुनें।'
            : 'Choose a strong password with 8+ characters mixing letters, numbers and symbols.'}
        </p>
      </div>

      <div style={{ maxWidth: 440 }}>
        {fields.map(({ key, label }) => (
          <Field key={key}>
            <Label>{label}</Label>
            <Input
              type="password"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder="••••••••"
            />
          </Field>
        ))}

        {/* Strength indicator for new password */}
        {form.new_password.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {(() => {
              const p = form.new_password;
              let score = 0;
              if (p.length >= 8)  score++;
              if (p.length >= 12) score++;
              if (/[A-Z]/.test(p)) score++;
              if (/[0-9]/.test(p)) score++;
              if (/[^A-Za-z0-9]/.test(p)) score++;
              const colors = ['#EF4444','#F59E0B','#F59E0B','#22C55E','#22C55E'];
              const labels = hi
                ? ['बहुत कमज़ोर','कमज़ोर','ठीक','मजबूत','बहुत मजबूत']
                : ['Very Weak','Weak','Fair','Strong','Very Strong'];
              return (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <p style={{ color: colors[score - 1] || DIM, fontSize: 11, margin: 0 }}>{labels[score - 1] || ''}</p>
                </div>
              );
            })()}
          </div>
        )}

        <SaveBtn onClick={save} loading={saving}>
          {hi ? 'पासवर्ड बदलें' : 'Change Password'}
        </SaveBtn>
      </div>
    </div>
  );
}

// ── Tab: Subscription ─────────────────────────────────────────────────────────
function SubscriptionTab({ user, usage, lang }) {
  const hi = lang === 'hi';
  const [subs,     setSubs]     = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/subscriptions').catch(() => ({ data: { subscriptions: [] } })),
      api.get('/subscriptions/invoices').catch(() => ({ data: { invoices: [] } })),
    ]).then(([s, inv]) => {
      setSubs(s.data.subscriptions || []);
      setInvoices(inv.data.invoices || []);
    }).finally(() => setLoading(false));
  }, []);

  const plan     = user.plan || 'free';
  const pm       = PLAN_META[plan] || PLAN_META.free;
  const limit    = user.role === 'admin' ? Infinity : (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free);
  const usedK    = usage?.used  ?? 0;
  const pct      = limit === Infinity ? 100 : Math.min(100, (usedK / limit) * 100);
  const barColor = pct >= 100 ? RED : pct >= 75 ? AMBER : GREEN;

  const activeSub = subs.find(s => s.status === 'active');

  return (
    <div>
      {/* Current plan card */}
      <div style={{ background: pm.bg, border: `1.5px solid ${pm.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: DIM, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
              {hi ? 'वर्तमान प्लान' : 'Current Plan'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: pm.color, fontFamily: 'Georgia,serif' }}>
                {pm.label}
              </span>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: pm.bg, border: `1px solid ${pm.border}`, color: pm.color, fontWeight: 700 }}>
                {plan.toUpperCase()}
              </span>
            </div>
            {activeSub?.expires_at && (
              <p style={{ color: DIM, fontSize: 12, margin: '6px 0 0' }}>
                {hi ? 'समाप्ति:' : 'Expires:'} {new Date(activeSub.expires_at).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day:'2-digit', month:'long', year:'numeric' })}
              </p>
            )}
          </div>
          {plan !== 'yearly' && (
            <Link href="/pricing"
              style={{ display: 'inline-block', padding: '9px 22px', borderRadius: 8, background: `linear-gradient(135deg,${GOLD},#E8C96A)`, color: NAVY, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              {hi ? 'अपग्रेड करें →' : 'Upgrade →'}
            </Link>
          )}
        </div>
      </div>

      {/* Kundli usage bar */}
      <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ color: IVORY, fontSize: 14, fontWeight: 600, margin: 0 }}>
            {hi ? '🪐 कुंडली उपयोग' : '🪐 Kundli Usage'}
          </p>
          <p style={{ color: barColor, fontSize: 13, fontWeight: 700, margin: 0 }}>
            {limit === Infinity
              ? `${usedK} ${hi ? '(असीमित)' : '(Unlimited)'}`
              : `${usedK} / ${limit}`}
          </p>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${barColor},${barColor}99)`, borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>
        <p style={{ color: DIM, fontSize: 11, margin: 0 }}>
          {limit === Infinity
            ? (hi ? 'आप असीमित कुंडली बना सकते हैं।' : 'You can create unlimited Kundli profiles.')
            : pct >= 100
              ? (hi ? 'सीमा पूरी हो गई। अधिक के लिए अपग्रेड करें।' : 'Limit reached. Upgrade for more.')
              : (hi ? `${limit - usedK} और कुंडली बना सकते हैं।` : `${limit - usedK} more Kundli profile${limit - usedK !== 1 ? 's' : ''} remaining.`)}
        </p>
      </div>

      {/* Plan features */}
      <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}>
        <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {hi ? 'आपके प्लान में शामिल है' : 'Included in your plan'}
        </p>
        {[
          { en: `${limit === Infinity ? 'Unlimited' : limit} Kundli profile${limit !== 1 ? 's' : ''}`, hi: `${limit === Infinity ? 'असीमित' : limit} कुंडली प्रोफाइल`, ok: true },
          { en: 'D1/D9 Birth charts', hi: 'D1/D9 जन्म कुंडली', ok: plan !== 'free' },
          { en: 'Dasha & Gochar analysis', hi: 'दशा और गोचर विश्लेषण', ok: plan !== 'free' },
          { en: 'Life Guidance report', hi: 'जीवन मार्गदर्शन रिपोर्ट', ok: plan !== 'free' },
          { en: 'Personalized Remedy Engine', hi: 'व्यक्तिगत उपाय इंजन', ok: plan === 'premium' || plan === 'yearly' },
          { en: 'AI-powered predictions', hi: 'AI भविष्यवाणी', ok: plan === 'premium' || plan === 'yearly' },
          { en: 'Daily digest email', hi: 'दैनिक डाइजेस्ट ईमेल', ok: plan !== 'free' },
          { en: 'PDF export', hi: 'PDF निर्यात', ok: plan !== 'free' },
        ].map(({ en, hi: hiLabel, ok }) => (
          <div key={en} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ color: ok ? GREEN : 'rgba(255,255,255,0.2)', fontSize: 13, width: 16 }}>{ok ? '✓' : '✗'}</span>
            <p style={{ color: ok ? IVORY : 'rgba(245,240,232,0.3)', fontSize: 13, margin: 0 }}>{hi ? hiLabel : en}</p>
          </div>
        ))}
      </div>

      {/* Subscription history */}
      {loading ? (
        <p style={{ color: DIM, fontSize: 13, textAlign: 'center', padding: 20 }}>Loading history…</p>
      ) : subs.length > 0 ? (
        <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, margin: 0, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {hi ? 'सदस्यता इतिहास' : 'Subscription History'}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {[hi ? 'प्लान' : 'Plan', hi ? 'स्थिति' : 'Status', hi ? 'शुरू' : 'Started', hi ? 'समाप्ति' : 'Expires', hi ? 'राशि' : 'Amount'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'rgba(212,175,55,0.55)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 16px', color: IVORY, fontSize: 13 }}>{s.plan_name || s.plan}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600,
                        background: s.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.15)',
                        color: s.status === 'active' ? GREEN : '#9CA3AF',
                        border: `1px solid ${s.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)'}`,
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: DIM, fontSize: 12 }}>
                      {s.starts_at ? new Date(s.starts_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: DIM, fontSize: 12 }}>
                      {s.expires_at ? new Date(s.expires_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: IVORY, fontSize: 13 }}>
                      {s.amount_paid ? `₹${s.amount_paid}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Invoices */}
      {invoices.length > 0 && (
        <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, margin: 0, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {hi ? 'इनवॉइस' : 'Invoices'}
          </p>
          {invoices.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: IVORY, fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{inv.invoice_number}</p>
                <p style={{ color: DIM, fontSize: 11, margin: 0 }}>
                  {new Date(inv.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} · ₹{inv.total_amount}
                </p>
              </div>
              <a
                href={`/api/subscriptions/invoices/${inv.uuid}/invoice.pdf`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
              >
                📄 {hi ? 'डाउनलोड' : 'Download'}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ProfilePage ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();
  const { lang } = useLang();
  const router   = useRouter();
  const [tab,   setTab]   = useState('profile');
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // Fetch fresh profile + usage on mount — ensures admin plan changes are
  // reflected immediately without the user needing to fully re-login.
  useEffect(() => {
    if (!loading && user) {
      api.get('/users/profile').then(({ data }) => setUser(data.user)).catch(() => {});
      api.get('/kundli/usage').then(({ data }) => setUsage(data)).catch(() => {});
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ fontSize: 48, animation: 'spin 2s linear infinite' }}>🪐</div>
      </div>
    );
  }

  const hi   = lang === 'hi';
  const plan = user.plan || 'free';
  const pm   = PLAN_META[plan] || PLAN_META.free;
  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={60} />
      <div className="relative z-10 max-w-4xl mx-auto">

        {/* ── Header card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: CARD, border: `1px solid rgba(212,175,55,0.18)`, borderRadius: 16, padding: '28px 28px 0', marginBottom: 24, overflow: 'hidden' }}
        >
          {/* Gold top accent bar */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: `linear-gradient(90deg,${pm.color},${pm.color}44,transparent)` }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg,${pm.color}33,${pm.color}11)`,
              border: `2px solid ${pm.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: pm.color, fontWeight: 800, fontSize: 26, fontFamily: 'Georgia,serif',
            }}>
              {initials}
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ color: IVORY, fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, margin: 0 }}>{user.name}</h1>
                <span style={{ fontSize: 11, padding: '3px 11px', borderRadius: 20, fontWeight: 700, background: pm.bg, color: pm.color, border: `1px solid ${pm.border}`, letterSpacing: '0.06em' }}>
                  {pm.label.toUpperCase()}
                </span>
                {user.role !== 'user' && (
                  <span style={{ fontSize: 11, padding: '3px 11px', borderRadius: 20, fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: VIOLET, border: '1px solid rgba(167,139,250,0.3)', letterSpacing: '0.06em' }}>
                    {user.role.toUpperCase()}
                  </span>
                )}
              </div>
              <p style={{ color: DIM, fontSize: 13, margin: '0 0 4px' }}>{user.email}</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: user.email_verified ? GREEN : AMBER, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {user.email_verified ? '✓' : '⚠'} {user.email_verified ? (hi ? 'सत्यापित' : 'Verified') : (hi ? 'असत्यापित' : 'Unverified')}
                </span>
                <span style={{ fontSize: 11, color: DIM }}>
                  {hi ? 'सदस्य बने:' : 'Joined:'} {new Date(user.created_at).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' })}
                </span>
                {usage && (
                  <span style={{ fontSize: 11, color: DIM }}>
                    🪐 {usage.used} / {usage.limit >= 9999 ? (hi ? 'असीमित' : '∞') : usage.limit} {hi ? 'कुंडली' : 'Kundlis'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', marginLeft: -28, marginRight: -28, paddingLeft: 28 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '13px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'none', border: 'none', outline: 'none',
                  color: tab === t.key ? GOLD : DIM,
                  borderBottom: `2px solid ${tab === t.key ? GOLD : 'transparent'}`,
                  transition: 'color 0.2s, border-color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {hi ? t.hi : t.en}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Tab content ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={{ background: CARD, border: '1px solid rgba(212,175,55,0.12)', borderRadius: 16, padding: '28px 28px' }}
          >
            {tab === 'profile'      && <ProfileTab      user={user} setUser={setUser} lang={lang} />}
            {tab === 'security'     && <SecurityTab     lang={lang} />}
            {tab === 'subscription' && <SubscriptionTab user={user} usage={usage} lang={lang} />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
