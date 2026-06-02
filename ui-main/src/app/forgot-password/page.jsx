'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import StarField from '../../components/StarField';
import Logo from '../../components/Logo';
import api from '../../lib/api';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen starfield-bg flex items-center justify-center px-4 py-20">
      <StarField count={100} />
      <div className="relative z-10 w-full max-w-md card-royal p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} />
          <h1 className="font-serif text-2xl text-gold mt-4 font-bold">Forgot Password</h1>
        </div>
        {sent ? (
          <div className="text-center">
            <p className="text-5xl mb-4">📧</p>
            <p className="text-ivory/70 mb-6">If that email exists, a reset link has been sent.</p>
            <Link href="/login" className="btn-gold px-8 py-3">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="email" placeholder="Your email" className="input-royal"
              {...register('email', { required: true })} />
            <button type="submit" disabled={loading} className="btn-gold w-full py-3">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-gold/70 text-sm hover:text-gold">Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
