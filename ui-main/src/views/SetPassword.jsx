'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const GOLD  = '#D4AF37';
const IVORY = '#F5F0E8';
const DIM   = 'rgba(245,240,232,0.45)';
const CARD  = 'rgba(20,23,40,0.92)';
const BORDER= 'rgba(212,175,55,0.22)';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8, color: IVORY,
  padding: '12px 14px', fontSize: 15,
  outline: 'none', fontFamily: 'Inter,sans-serif',
};
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.08em', color: DIM,
  marginBottom: 6, textTransform: 'uppercase',
};

export default function SetPassword() {
  const params   = useSearchParams();
  const router   = useRouter();
  const { setUser } = useAuth();

  const token    = params?.get('token') || '';

  const [pw,     setPw]     = useState('');
  const [pw2,    setPw2]    = useState('');
  const [show,   setShow]   = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [done,   setDone]   = useState(false);
  const [err,    setErr]    = useState('');

  // If no token at all, show a clear message
  const noToken = !token;

  const validate = () => {
    if (!pw)          return 'Please enter a password.';
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (pw !== pw2)   return 'Passwords do not match.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr('');
    setBusy(true);
    try {
      const { data } = await api.post('/remedy/set-password', { token, password: pw });
      // Store tokens for auto-login
      if (data.accessToken)  localStorage.setItem('access_token',  data.accessToken);
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
      if (data.user) setUser(data.user);
      setDone(true);
      toast.success('Password set! Welcome to Jyotish Stack AI.');
      // Redirect to dashboard — user is already on basic plan
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const strength = (p) => {
    if (!p) return { w: 0, c: 'transparent', t: '' };
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p))  s++;
    if (/[0-9]/.test(p))  s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { w: 20, c: '#EF4444', t: 'Weak' };
    if (s <= 3) return { w: 60, c: '#F59E0B', t: 'Fair' };
    return { w: 100, c: '#22C55E', t: 'Strong' };
  };
  const str = strength(pw);

  return (
    <div className="relative min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at top,#181C35 0%,#0B0D1A 60%,#06070F 100%)' }}>
      <StarField count={90} />

      <div className="relative z-10 w-full max-w-md px-4 py-20">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ color: GOLD, fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, marginBottom: 10 }}>
            🔐 JYOTISH STACK AI
          </p>
          <h1 style={{ color: IVORY, fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
            {done ? 'Password Set!' : 'Set Your Password'}
          </h1>
          {!done && !noToken && (
            <p style={{ color: DIM, fontSize: 14 }}>
              Choose a password to activate your account and access your remedy report history.
            </p>
          )}
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '32px 28px' }}>
          {noToken && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#F87171', fontSize: 14, marginBottom: 20 }}>
                This link is invalid or has expired. Please submit the remedy form again to receive a fresh setup link.
              </p>
              <Link href="/remedy" className="btn-gold" style={{ display: 'inline-block', padding: '12px 28px', fontWeight: 700, fontSize: 14 }}>
                Get a New Link →
              </Link>
            </div>
          )}

          {!noToken && done && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <p style={{ color: IVORY, fontWeight: 600, marginBottom: 8 }}>
                Account activated! Taking you to your dashboard…
              </p>
              <p style={{ color: DIM, fontSize: 13, marginBottom: 24 }}>
                Your Basic plan is active. Please also verify your email — the link is in the setup email we sent.
              </p>
              <Link href="/dashboard" style={{ color: GOLD, fontSize: 13, textDecoration: 'underline' }}>
                Go to dashboard
              </Link>
            </div>
          )}

          {!noToken && !done && (
            <form onSubmit={submit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    type={show ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShow(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: DIM, cursor: 'pointer', fontSize: 16,
                  }}>
                    {show ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Strength bar */}
                {pw && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: str.c, width: `${str.w}%`, transition: 'width 0.3s, background 0.3s' }} />
                    </div>
                    <p style={{ fontSize: 11, color: str.c, marginTop: 4 }}>{str.t}</p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: pw2 && pw !== pw2 ? '#EF4444' : BORDER,
                  }}
                  type={show ? 'text' : 'password'}
                  value={pw2}
                  onChange={e => setPw2(e.target.value)}
                  placeholder="Re-enter password"
                />
                {pw2 && pw !== pw2 && (
                  <p style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>Passwords do not match.</p>
                )}
              </div>

              {err && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
                  <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{err}</p>
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-gold"
                style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 700 }}>
                {busy ? 'Setting password…' : 'Set Password & Activate Account →'}
              </button>

              <p style={{ color: DIM, fontSize: 12, textAlign: 'center', marginTop: 16 }}>
                Your account will be activated immediately. You'll then verify your email and choose a plan.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
