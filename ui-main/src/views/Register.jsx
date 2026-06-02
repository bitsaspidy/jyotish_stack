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

export default function Register() {
  const { register: registerUser } = useAuth();
  const { lang } = useLang();
  const router   = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ name, email, password }) => {
    setBusy(true);
    try {
      await registerUser({ name, email, password, preferred_language: lang });
      toast.success(lang === 'hi' ? 'स्वागत है! खाता बनाया गया।' : 'Account created! Welcome aboard.');
      router.push('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || (lang === 'hi' ? 'पंजीकरण विफल' : 'Registration failed'));
    } finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20 starfield-bg">
      <StarField count={100} />
      <div className="relative z-10 w-full max-w-md card-royal p-8 sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <Logo size={52} />
          <h1 className="font-serif text-gold text-2xl font-bold mt-4">
            {lang === 'hi' ? 'खाता बनाएं' : 'Create Account'}
          </h1>
          <p className="text-ivory/45 text-sm mt-1 font-devanagari">
            {lang === 'hi' ? 'ब्रह्मांडीय यात्रा शुरू करें' : 'Begin your cosmic journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-ivory/55 text-xs font-medium mb-1.5 uppercase tracking-wider">
              {lang === 'hi' ? 'पूरा नाम' : 'Full Name'}
            </label>
            <input placeholder={lang === 'hi' ? 'आपका नाम' : 'Your name'} className="input-royal"
              {...register('name', { required: 'Name required', minLength: { value:2, message:'Min 2 chars' } })} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-ivory/55 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" placeholder="you@example.com" className="input-royal"
              {...register('email', { required: 'Email required' })} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-ivory/55 text-xs font-medium mb-1.5 uppercase tracking-wider">
              {lang === 'hi' ? 'पासवर्ड' : 'Password'}
            </label>
            <input type="password" placeholder="Min 8 characters" className="input-royal"
              {...register('password', { required: 'Password required', minLength: { value:8, message:'Min 8 chars' } })} />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-ivory/55 text-xs font-medium mb-1.5 uppercase tracking-wider">
              {lang === 'hi' ? 'पासवर्ड दोहराएं' : 'Confirm Password'}
            </label>
            <input type="password" placeholder="Repeat password" className="input-royal"
              {...register('confirm', {
                required: 'Please confirm',
                validate: v => v === watch('password') || 'Passwords do not match',
              })} />
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          <button type="submit" disabled={busy}
            className="btn-gold w-full py-3.5 text-[15px] font-semibold text-center block mt-2">
            {busy ? '…' : (lang === 'hi' ? 'खाता बनाएं' : 'Create Account')}
          </button>
        </form>

        <div className="divider-gold" />
        <p className="text-center text-ivory/45 text-sm font-devanagari">
          {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
          <Link href="/login" className="text-gold font-semibold hover:text-gold-light transition-colors">
            {lang === 'hi' ? 'लॉगिन करें' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
