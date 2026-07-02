'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';

const GOLD  = '#D4AF37';
const MUTED = 'rgba(245,240,232,0.55)';

const RASHIS_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const RASHIS_HI = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Daily horoscope push opt-in banner. Hidden when unsupported, subscribed, or dismissed.
export default function PushOptIn({ defaultRashi = 1 }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const t = (en, h) => translate(lang, en, h);

  const [visible, setVisible] = useState(false);
  const [rashi, setRashi]     = useState(defaultRashi);
  const [busy, setBusy]       = useState(false);

  useEffect(() => { setRashi(defaultRashi); }, [defaultRashi]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem('push_subscribed')) return;
    if (localStorage.getItem('push_dismissed')) return;
    setVisible(true);
  }, []);

  async function subscribe() {
    setBusy(true);
    try {
      const { data } = await api.get('/public/push/vapid-key');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.error(t('Notification permission was not granted.', 'सूचना अनुमति नहीं मिली।'));
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.key),
      });
      await api.post('/public/push/subscribe', {
        subscription: subscription.toJSON(),
        rashi_num: rashi,
        lang,
      });
      localStorage.setItem('push_subscribed', subscription.endpoint);
      setVisible(false);
      toast.success(t('Done! Your daily horoscope will arrive every morning. 🔔', 'हो गया! आपका राशिफल हर सुबह मिलेगा। 🔔'));
    } catch (e) {
      const msg = e.response?.status === 503
        ? t('Notifications are not enabled on the server yet.', 'सर्वर पर सूचनाएं अभी सक्रिय नहीं हैं।')
        : t('Could not enable notifications.', 'सूचनाएं सक्षम नहीं हो सकीं।');
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
      background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.25)',
      borderRadius:12, padding:'12px 16px', marginBottom:20,
    }}>
      <span style={{ fontSize:22 }}>🔔</span>
      <div style={{ flex:1, minWidth:200 }}>
        <p style={{ fontSize:13, fontWeight:700, color:GOLD }}>
          {t('Get your horoscope every morning', 'हर सुबह अपना राशिफल पाएं')}
        </p>
        <p style={{ fontSize:11, color:MUTED }}>
          {t('Free daily notification at 7 AM — pick your moon sign', 'सुबह 7 बजे निःशुल्क सूचना — अपनी चंद्र राशि चुनें')}
        </p>
      </div>
      <select value={rashi} onChange={(e) => setRashi(parseInt(e.target.value, 10))}
        className="input-royal" style={{ fontSize:12, padding:'6px 10px', width:'auto' }}>
        {RASHIS_EN.map((r, i) => (
          <option key={i + 1} value={i + 1}>{hi ? RASHIS_HI[i] : r}</option>
        ))}
      </select>
      <button onClick={subscribe} disabled={busy} className="btn-gold"
        style={{ fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:8 }}>
        {busy ? '…' : t('Enable', 'चालू करें')}
      </button>
      <button onClick={() => { localStorage.setItem('push_dismissed', '1'); setVisible(false); }}
        style={{ fontSize:14, color:MUTED, background:'transparent', border:'none', cursor:'pointer', padding:4 }}
        aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
