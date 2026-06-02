'use client';
// ─────────────────────────────────────────────────────────────────────────────
// Admin Login — completely standalone (no AdminShell, no public Navbar/Footer).
// AdminAuthProvider is initialised fresh here.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { AdminAuthProvider, useAdminAuth } from '../../../context/AdminAuthContext';

function LoginForm() {
  const { loginAdmin, admin, loading } = useAdminAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Already logged-in → redirect immediately
  useEffect(() => {
    if (!loading && admin) router.replace('/admin/dashboard');
  }, [admin, loading, router]);

  const onSubmit = async ({ email, password }) => {
    setBusy(true);
    try {
      const user = await loginAdmin(email, password);
      toast.success(`Welcome, ${user.name}!`);
      router.push('/admin/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Invalid credentials');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at top, #181C35 0%, #0B0D1A 60%, #06070F 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        background: '#111428',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 10,
        padding: '44px 40px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>🪐</div>
          <h1 style={{ color: '#D4AF37', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
            Admin Panel
          </h1>
          <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 12, margin: 0, letterSpacing: '0.05em' }}>
            Jyotish Stack AI · jyotishstack.com/admin
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', color: 'rgba(245,240,232,0.55)', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@jyotishstack.com"
              {...register('email', { required: 'Email is required' })}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#181C35',
                border: `1px solid ${errors.email ? '#C0392B' : 'rgba(212,175,55,0.22)'}`,
                borderRadius: 6,
                color: '#F5F0E8',
                padding: '11px 14px',
                fontSize: 14,
                outline: 'none',
              }}
            />
            {errors.email && <p style={{ color: '#C0392B', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', color: 'rgba(245,240,232,0.55)', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#181C35',
                border: `1px solid ${errors.password ? '#C0392B' : 'rgba(212,175,55,0.22)'}`,
                borderRadius: 6,
                color: '#F5F0E8',
                padding: '11px 14px',
                fontSize: 14,
                outline: 'none',
              }}
            />
            {errors.password && <p style={{ color: '#C0392B', fontSize: 11, marginTop: 4 }}>{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={busy || loading}
            style={{
              marginTop: 8,
              background: busy || loading ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)',
              color: '#0B0D1A',
              fontWeight: 700,
              fontSize: 15,
              padding: '13px',
              borderRadius: 6,
              border: 'none',
              cursor: busy || loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}>
            {busy ? 'Signing in…' : loading ? 'Checking…' : 'Sign In to Admin'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(245,240,232,0.2)', fontSize: 11, marginTop: 24 }}>
          🔒 Restricted access · Admins only
        </p>
      </div>

      <Toaster position="top-right" toastOptions={{
        style: { background: '#111428', color: '#F5F0E8', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 6 }
      }} />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <LoginForm />
    </AdminAuthProvider>
  );
}
