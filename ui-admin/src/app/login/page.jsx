'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext';
import { Toaster } from 'react-hot-toast';

function LoginForm() {
  const { loginAdmin, admin, loading } = useAdminAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    if (!loading && admin) router.replace('/dashboard');
  }, [admin, loading]);

  const onSubmit = async ({ email, password }) => {
    setSubmitting(true);
    try {
      const user = await loginAdmin(email, password);
      toast.success(`Welcome, ${user.name}`);
      router.push('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmos-800 flex items-center justify-center px-4">
      <div className="bg-cosmos-700 border border-gold/20 rounded p-10 w-full max-w-sm">
        <h1 className="text-gold font-bold text-2xl mb-1">🪐 Admin Panel</h1>
        <p className="text-ivory/50 text-sm mb-8">Jyotish Stack AI Control Panel</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="email" placeholder="Admin email" className="admin-input" {...register('email', { required: true })} />
          <input type="password" placeholder="Password" className="admin-input" {...register('password', { required: true })} />
          <button type="submit" disabled={submitting} className="admin-btn w-full py-3">
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <LoginForm />
      <Toaster position="top-right" toastOptions={{ style: { background: '#111428', color: '#F5F0E8', border: '1px solid #D4AF37' } }} />
    </AdminAuthProvider>
  );
}
