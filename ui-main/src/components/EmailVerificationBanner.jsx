'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [dismissed, setDismissed] = useState(false);
  const [sending,   setSending]   = useState(false);

  if (!user || user.email_verified || dismissed) return null;

  const hi = lang === 'hi';

  const resend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success(hi ? 'सत्यापन ईमेल भेजा गया! अपना इनबॉक्स जांचें।' : 'Verification email sent! Check your inbox.');
      setDismissed(true);
    } catch (err) {
      toast.error(err.response?.data?.message || (hi ? 'भेजने में विफल। बाद में पुनः प्रयास करें।' : 'Failed to send. Try again later.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg,rgba(245,158,11,0.12),rgba(245,158,11,0.08))',
      borderBottom: '1px solid rgba(245,158,11,0.35)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <p style={{ fontSize: 13, color: '#FBBF24', margin: 0, fontWeight: 500 }}>
          {hi
            ? 'आपका ईमेल सत्यापित नहीं है। कृपया अपने इनबॉक्स में सत्यापन लिंक जांचें।'
            : 'Your email is not verified. Please check your inbox for the verification link.'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={resend}
          disabled={sending}
          style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.45)',
            color: '#FBBF24', opacity: sending ? 0.65 : 1,
          }}
        >
          {sending ? '⏳' : (hi ? '🔁 ईमेल दोबारा भेजें' : '🔁 Resend Email')}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', color: 'rgba(245,158,11,0.5)',
            fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
          }}
          title={hi ? 'बंद करें' : 'Dismiss'}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
