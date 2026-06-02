'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

function ShellInner({ children }) {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) router.replace('/login');
  }, [admin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmos-800">
        <p className="text-gold animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">{children}</main>
    </div>
  );
}

export default function AdminShell({ children }) {
  return (
    <AdminAuthProvider>
      <ShellInner>{children}</ShellInner>
      <Toaster position="top-right" toastOptions={{ style: { background: '#111428', color: '#F5F0E8', border: '1px solid #D4AF37' } }} />
    </AdminAuthProvider>
  );
}
