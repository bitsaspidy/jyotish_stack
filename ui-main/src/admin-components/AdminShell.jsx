'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

const PAGE_TITLES = {
  '/admin/dashboard':     'Dashboard',
  '/admin/users':         'User Management',
  '/admin/plans':         'Subscription Plans',
  '/admin/sales':         'Sales Management',
  '/admin/kundlis':       'Kundli Profiles',
  '/admin/knowledge':     'Jyotish Knowledge Base',
  '/admin/newsletter':    'Newsletter',
  '/admin/email-blast':   'Email Blast',
  '/admin/email-manager': 'Email Manager',
  '/admin/email-logs':    'Email Logs',
  '/admin/notifications': 'Notifications',
  '/admin/settings':      'App Settings',
  '/admin/panchang':      'Panchang Muhurta',
  '/admin/blog':          'Blog',
  '/admin/testimonials':  'Testimonials',
  '/admin/inquiries':     'Inquiries',
  '/admin/team':          'Team',
  '/admin/activity':      'Activity Log',
  '/admin/profile':       'My Profile',
};

function ShellInner({ children }) {
  const { admin, loading } = useAdminAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('adminSidebarCollapsed') : null;
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem('adminSidebarCollapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!loading && !admin) router.replace('/admin/login');
  }, [admin, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0C18' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:16, animation:'spin 3s linear infinite' }}>🪐</div>
          <p style={{ color:'rgba(212,175,55,0.5)', fontSize:12, letterSpacing:'0.25em', fontFamily:'Inter,sans-serif' }}>LOADING…</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (!admin) return null;

  const sidebarW = collapsed ? 64 : 240;
  const pageTitle = PAGE_TITLES[pathname]
    || (pathname.startsWith('/admin/kundlis/') ? 'Kundli Detail'
    : pathname.startsWith('/admin/users/')    ? 'User Detail'
    : 'Admin');

  return (
    <div style={{ minHeight:'100vh', background:'#0A0C18', color:'#F5F0E8', fontFamily:'Inter, system-ui, sans-serif' }}>
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <header style={{
        position:'fixed', top:0, left:sidebarW, right:0, height:56,
        background:'rgba(10,12,24,0.97)', borderBottom:'1px solid rgba(212,175,55,0.1)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 28px', zIndex:30, backdropFilter:'blur(12px)',
        transition:'left 0.22s ease',
      }}>
        {/* Left: breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'rgba(245,240,232,0.28)', fontSize:11, letterSpacing:'0.06em' }}>ADMIN</span>
          <span style={{ color:'rgba(245,240,232,0.18)', fontSize:13 }}>›</span>
          <span style={{ color:'#D4AF37', fontSize:14, fontWeight:600, letterSpacing:'0.01em' }}>{pageTitle}</span>
        </div>

        {/* Right: admin identity */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <p style={{ color:'#F5F0E8', fontSize:13, fontWeight:600, lineHeight:1.3 }}>{admin.name}</p>
            <p style={{ color:'rgba(245,240,232,0.3)', fontSize:10, textTransform:'capitalize', letterSpacing:'0.06em' }}>{admin.role}</p>
          </div>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:'linear-gradient(135deg,rgba(212,175,55,0.28),rgba(212,175,55,0.08))',
            border:'1px solid rgba(212,175,55,0.38)', display:'flex', alignItems:'center',
            justifyContent:'center', color:'#D4AF37', fontWeight:700, fontSize:14,
          }}>
            {admin.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── Page Content ───────────────────────────────────────────────────── */}
      <main style={{ marginLeft:sidebarW, paddingTop:56, minHeight:'100vh', transition:'margin-left 0.22s ease' }}>
        <div style={{ padding:'30px 28px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminShell({ children }) {
  return (
    <AdminAuthProvider>
      <ShellInner>{children}</ShellInner>
      <Toaster position="top-right" toastOptions={{
        style: { background:'#111428', color:'#F5F0E8', border:'1px solid rgba(212,175,55,0.4)', borderRadius:6, fontSize:13 },
      }} />
    </AdminAuthProvider>
  );
}
