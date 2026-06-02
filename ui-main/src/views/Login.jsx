'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Login() {
  const { login } = useAuth();
  const { lang }  = useLang();
  const router    = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email, password }) => {
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(lang === 'hi' ? `स्वागत, ${user.name.split(' ')[0]}!` : `Welcome, ${user.name.split(' ')[0]}!`);
      router.push('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || (lang === 'hi' ? 'लॉगिन विफल' : 'Login failed'));
    } finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20 starfield-bg">
      <StarField count={100} />
      <div className="relative z-10 w-full max-w-md card-royal p-8 sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <Logo size={52} />
          <h1 className="font-serif text-gold text-2xl font-bold mt-4">
            {lang === 'hi' ? 'लॉगिन करें' : 'Welcome Back'}
          </h1>
          <p className="text-ivory/45 text-sm mt-1 font-devanagari">
            {lang === 'hi' ? 'अपने खाते में प्रवेश करें' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-ivory/55 text-xs font-medium mb-1.5 uppercase tracking-wider">
              {lang === 'hi' ? 'ईमेल' : 'Email'}
            </label>
            <input type="email" placeholder="you@example.com" className="input-royal"
              {...register('email', { required: 'Email required' })} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-ivory/55 text-xs font-medium uppercase tracking-wider">
                {lang === 'hi' ? 'पासवर्ड' : 'Password'}
              </label>
              <Link href="/forgot-password" className="text-gold/55 text-xs hover:text-gold transition-colors">
                {lang === 'hi' ? 'भूल गए?' : 'Forgot?'}
              </Link>
            </div>
            <input type="password" placeholder="••••••••" className="input-royal"
              {...register('password', { required: 'Password required' })} />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={busy}
            className="btn-gold w-full py-3.5 text-[15px] font-semibold text-center block">
            {busy ? '…' : (lang === 'hi' ? 'लॉगिन करें' : 'Sign In')}
          </button>
        </form>

        <div className="divider-gold" />
        <p className="text-center text-ivory/45 text-sm font-devanagari">
          {lang === 'hi' ? 'नया खाता?' : "New here?"}{' '}
          <Link href="/register" className="text-gold font-semibold hover:text-gold-light transition-colors">
            {lang === 'hi' ? 'रजिस्टर करें' : 'Create account'}
          </Link>
        </p>
      </div>
    </div>
  );
}
