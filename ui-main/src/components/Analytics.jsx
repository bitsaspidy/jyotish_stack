'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Google Analytics 4 — measurement ID comes from the admin panel at RUNTIME.
 *
 * Why this is a client component that fetches, rather than a value read in the
 * layout: almost every page here is statically generated, so anything the layout
 * reads is frozen at build time. A `NEXT_PUBLIC_*` env var has the same problem —
 * it is inlined into the bundle. Fetching on mount is what lets the owner change
 * the ID in /admin/settings and have it take effect without a rebuild.
 *
 * The ID is cached in sessionStorage so this costs one request per session, not
 * one per navigation. If the fetch fails, analytics simply stays off — it must
 * never be able to break a page.
 *
 * App Router does not fire a GA page_view on client-side navigation (there is no
 * document load), so route changes are sent manually below.
 */

const CACHE_KEY = 'seo_ga_id';

function GaPageViews({ measurementId }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== 'function') return;
    const qs = searchParams?.toString();
    window.gtag('event', 'page_view', {
      page_path: qs ? `${pathname}?${qs}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}

export default function Analytics() {
  const [measurementId, setMeasurementId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(CACHE_KEY) : null;
    if (cached !== null) {
      if (cached) setMeasurementId(cached);
      return undefined;
    }

    (async () => {
      try {
        const res = await fetch('/api/public/seo/config');
        if (!res.ok) return;
        const json = await res.json();
        const id = json?.data?.gaMeasurementId || json?.gaMeasurementId || '';
        if (cancelled) return;
        // Cache the answer either way — an empty string means "configured off",
        // which is just as worth remembering as an ID.
        try { sessionStorage.setItem(CACHE_KEY, id); } catch { /* private mode */ }
        if (id) setMeasurementId(id);
      } catch {
        // Analytics is never load-bearing. Stay silent and stay off.
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          // send_page_view is off: App Router navigations are reported by GaPageViews,
          // and leaving it on double-counts the first page of every session.
          gtag('config', '${measurementId}', { send_page_view: false });
          gtag('event', 'page_view', {
            page_path: window.location.pathname + window.location.search,
            page_location: window.location.href,
            page_title: document.title,
          });
        `}
      </Script>
      {/* useSearchParams needs a Suspense boundary or it opts the whole tree out
          of static rendering — which would de-optimise all 84 pages. */}
      <Suspense fallback={null}>
        <GaPageViews measurementId={measurementId} />
      </Suspense>
    </>
  );
}
