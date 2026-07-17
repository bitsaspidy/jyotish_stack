'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { LangProvider, useLang } from '../context/LangContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ComingSoon from '../views/ComingSoon';
import PwaSetup from '../components/PwaSetup';
import api from '../lib/api';

// ──────────────────────────────────────────────────────────────────────────────
// PublicShell — only mounts for non-admin routes; owns the maintenance check
// ──────────────────────────────────────────────────────────────────────────────
function PublicShell({ children }) {
  const { lang } = useLang();

  /**
   * FAIL OPEN. `maint` starts as false — "site is on" — not as a loading state.
   *
   * This used to be `useState(null)` with a spinner returned while `null`. Because
   * the value only changed inside a useEffect, and effects never run during server
   * rendering, the server ALWAYS returned that spinner. Every public page — the
   * homepage included — was prerendered as 105 characters reading
   * "🪐 JYOTISH STACK AI". Navbar, Footer and every page's content existed only
   * after hydration, so first-wave crawlers saw an empty site and users waited for
   * an API round-trip before seeing anything.
   *
   * Rendering the site first and switching to ComingSoon only if the API says
   * maintenance is on costs a brief flash during the rare maintenance window. The
   * old default cost every crawl and every first paint. The API is independently
   * gated by server/src/middleware/maintenance.js, so this component is a UX
   * courtesy, not the enforcement point — it must never be the thing that decides
   * whether the site renders at all.
   */
  const [maint, setMaint] = useState(false);

  useEffect(() => {
    api.get('/settings/public')
      .then(({ data }) => {
        const s = data?.settings || {};
        if (s.maintenance_mode === 'true') {
          setMaint({ title: s.maintenance_title, message: s.maintenance_message, message_hi: s.maintenance_message_hi });
        }
      })
      .catch(() => { /* server offline → leave the site visible */ });
  }, []);

  if (maint) {
    return <ComingSoon lang={lang} title={maint.title} message={maint.message} messageHi={maint.message_hi} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
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
        <PwaSetup />
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
