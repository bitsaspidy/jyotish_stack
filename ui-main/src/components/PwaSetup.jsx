'use client';
import { useEffect } from 'react';

// Registers the service worker once on mount (PWA install + push transport)
export default function PwaSetup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
