'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import StarField from '../../components/StarField';
import Logo from '../../components/Logo';
import api from '../../lib/api';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch } = useForm();

  const onSubmit = async ({ password }) => {
    if (!token) { toast.error('Invalid reset link'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset! Please log in.');
      router.push('/login');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen starfield-bg flex items-center justify-center px-4 py-20">
      <StarField count={100} />
      <div className="relative z-10 w-full max-w-md card-royal p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} />
          <h1 className="font-serif text-2xl text-gold mt-4 font-bold">Reset Password</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="password" placeholder="New password (min 8 chars)" className="input-royal"
            {...register('password', { required: true, minLength: 8 })} />
          <input type="password" placeholder="Confirm password" className="input-royal"
            {...register('confirm', { validate: v => v === watch('password') || 'Passwords do not match' })} />
          <button type="submit" disabled={loading} className="btn-gold w-full py-3">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <div className="text-center">
            <Link href="/login" className="text-gold/70 text-sm hover:text-gold">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
