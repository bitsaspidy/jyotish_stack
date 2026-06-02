'use client';
import Link from 'next/link';
import { useContext } from 'react';
import { LangContext } from '../context/LangContext';

export default function ComingSoonPage({ title, icon, descEn, descHi }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
      <p className="text-6xl mb-6 animate-float">{icon}</p>
      <h2 className="font-serif text-3xl text-gradient-gold mb-3">{title}</h2>
      <p className="text-ivory/50 mb-8">{descEn}</p>
      <p className="text-ivory/40 text-sm font-devanagari mb-8">{descHi}</p>
      <Link href="/dashboard" className="btn-outline-gold px-6 py-2 text-sm">← Back to Dashboard</Link>
    </div>
  );
}
