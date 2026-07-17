'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StarField from '../../components/StarField';
import api from '../../lib/api';

/** See reset-password/page.jsx — useSearchParams needs a Suspense boundary. */
function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 starfield-bg">
      <StarField count={100} />
      <div className="relative z-10 card-royal p-10 text-center max-w-md w-full">
        {status === 'verifying' && <><p className="text-5xl mb-4">🪐</p><p className="text-gold animate-pulse">Verifying your email...</p></>}
        {status === 'success' && (
          <>
            <p className="text-5xl mb-4">✅</p>
            <h2 className="font-serif text-gold text-2xl mb-3">Email Verified!</h2>
            <p className="text-ivory/60 mb-6">Your account is now active. Welcome to Jyotish Stack AI.</p>
            <Link href="/dashboard" className="btn-gold px-8 py-3">Go to Dashboard</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-5xl mb-4">❌</p>
            <h2 className="font-serif text-crimson-light text-2xl mb-3">Invalid Link</h2>
            <p className="text-ivory/60 mb-6">This link is invalid or has already been used.</p>
            <Link href="/login" className="btn-outline-gold px-8 py-3">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen starfield-bg" />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
