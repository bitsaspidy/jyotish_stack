'use client';
import { useEffect } from 'react';
import {
  CHUNK_RELOAD_STORAGE_KEY,
  isChunkLoadFailure,
  shouldAttemptChunkReload,
} from '../lib/chunkRecovery.mjs';

// Registers the service worker once on mount (PWA install + push transport)
export default function PwaSetup() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    const recoverFromChunkFailure = (event) => {
      if (!isChunkLoadFailure(event)) return;

      let lastAttempt = 0;
      try {
        lastAttempt = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
      } catch {
        // Storage can be disabled; the browser can still perform one reload.
      }
      if (!shouldAttemptChunkReload(lastAttempt)) return;

      try {
        sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(Date.now()));
      } catch {
        // Reload recovery does not depend on storage being available.
      }
      window.location.reload();
    };

    window.addEventListener('error', recoverFromChunkFailure);
    window.addEventListener('unhandledrejection', recoverFromChunkFailure);
    return () => {
      window.removeEventListener('error', recoverFromChunkFailure);
      window.removeEventListener('unhandledrejection', recoverFromChunkFailure);
    };
  }, []);
  return null;
}
