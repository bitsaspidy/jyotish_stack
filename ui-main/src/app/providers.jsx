'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { LangProvider, useLang } from '../context/LangContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import ComingSoon from '../views/ComingSoon';
import api from '../lib/api';

// ──────────────────────────────────────────────────────────────────────────────
// PublicShell — only mounts for non-admin routes; owns the maintenance check
// ──────────────────────────────────────────────────────────────────────────────
function PublicShell({ children }) {
  const { lang } = useLang();
  const [maint, setMaint] = useState(null);   // null = loading | false = off | obj = on

  useEffect(() => {
    api.get('/settings/public')
      .then(({ data }) => {
        const s = data?.settings || {};
        if (s.maintenance_mode === 'true') {
          setMaint({ title: s.maintenance_title, message: s.maintenance_message, message_hi: s.maintenance_message_hi });
        } else {
          setMaint(false);
        }
      })
      .catch(() => setMaint(false));   // server offline → show site
  }, []);

  if (maint === null) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at top,#181C35 0%,#0B0D1A 60%,#06070F 100%)' }}>
        <div className="text-center select-none">
          <div style={{ fontSize: 52, animation: 'floatAnim 2s ease-in-out infinite' }}>🪐</div>
          <p style={{ color: 'rgba(212,175,55,0.5)', fontSize: '0.7rem', marginTop: 14, letterSpacing: '0.35em', fontFamily: 'Inter,sans-serif' }}>
            JYOTISH STACK AI
          </p>
        </div>
        <style>{`@keyframes floatAnim{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}`}</style>
      </div>
    );
  }

  if (maint) {
    return <ComingSoon lang={lang} title={maint.title} message={maint.message} messageHi={maint.message_hi} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <EmailVerificationBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// AppRouter — decides which shell to use; admin gets ZERO extra wrappers
// ──────────────────────────────────────────────────────────────────────────────
function AppRouter({ children }) {
  const pathname = usePathname();

  // Admin routes are completely self-contained — no public shell, no spinner
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return <PublicShell>{children}</PublicShell>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Root providers wrapper
// ──────────────────────────────────────────────────────────────────────────────
export default function Providers({ children }) {
  return (
    <LangProvider>
      <AuthProvider>
        <AppRouter>{children}</AppRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#111428', color: '#F5F0E8', border: '1px solid rgba(212,175,55,0.5)', borderRadius: 6 },
            success: { iconTheme: { primary: '#D4AF37', secondary: '#0B0D1A' } },
          }}
        />
      </AuthProvider>
    </LangProvider>
  );
}
