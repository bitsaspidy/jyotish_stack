'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

// Inner component — only renders once auth is confirmed
function ShellInner({ children }) {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) router.replace('/admin/login');
  }, [admin, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0B0D1A', fontFamily: 'Inter,sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 3s linear infinite' }}>🪐</div>
          <p style={{ color: 'rgba(212,175,55,0.5)', fontSize: 12, letterSpacing: '0.25em' }}>LOADING…</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#0B0D1A', color: '#F5F0E8',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '32px', overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

export default function AdminShell({ children }) {
  return (
    <AdminAuthProvider>
      <ShellInner>{children}</ShellInner>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111428', color: '#F5F0E8', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 6 }
      }} />
    </AdminAuthProvider>
  );
}
