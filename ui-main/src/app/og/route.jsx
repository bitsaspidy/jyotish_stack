import { ImageResponse } from 'next/og';
import { SITE_NAME } from '../../lib/seo';

/**
 * Social share image — 1200×630 PNG, generated on demand.
 *
 * WHY THIS EXISTS: og:image used to point at /logo.svg. No platform renders SVG as
 * a share image — not WhatsApp, Facebook, LinkedIn or X — so every share of this
 * site produced a blank preview, while the metadata cheerfully declared
 * width:1200 height:630 for a vector logo that was neither. In India WhatsApp is
 * the main sharing channel, so this was costing real traffic silently.
 *
 * next/og ships inside Next 14 (no new dependency). It renders through Satori,
 * which supports a SUBSET of CSS — flexbox only, no grid, every element with more
 * than one child needs display:flex. Keep it boring.
 *
 * `?title=` lets a page pass its own headline; everything falls back to the brand
 * default, so a missing or junk param can never produce a broken image.
 */

export const runtime = 'edge';

const GOLD = '#D4AF37';
const GOLD_SOFT = '#F0D060';
const IVORY = '#F5F0E8';
const COSMOS = '#0B0D1A';

const clean = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = clean(searchParams.get('title'), 90) || 'Ancient Wisdom. Modern Intelligence.';
  const subtitle = clean(searchParams.get('subtitle'), 110)
    || 'Free Kundli · Matchmaking · Horoscope · Panchang · Vedic Predictions';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: COSMOS,
          // A faint gold aura behind the mark — depth without an image asset.
          backgroundImage: 'radial-gradient(circle at 78% 30%, rgba(212,175,55,0.20) 0%, rgba(11,13,26,0) 55%)',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* ── Brand row ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Jyot Chakra: shatkona inside a cosmic disc */}
          <svg width="76" height="76" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke={GOLD} strokeWidth="2.5" opacity="0.85" />
            <circle cx="50" cy="50" r="38" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.35" />
            <polygon points="50,18 77,64 23,64" fill="none" stroke={GOLD_SOFT} strokeWidth="2.5" />
            <polygon points="50,82 23,36 77,36" fill="none" stroke={GOLD_SOFT} strokeWidth="2.5" />
            <circle cx="50" cy="50" r="6" fill={GOLD} />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '20px' }}>
            <div style={{ fontSize: '34px', fontWeight: 700, color: GOLD, letterSpacing: '-0.5px' }}>
              {SITE_NAME}
            </div>
            {/* Latin only, deliberately. next/og's bundled font has no Devanagari
                shaping — "वैदिक ज्योतिष" rendered with its matras detached and in
                the wrong places, which looks worse on a Jyotish brand than no
                Devanagari at all. Restoring it means shipping and loading a
                Devanagari TTF here; until then this line stays Latin. */}
            <div style={{ fontSize: '15px', color: 'rgba(245,240,232,0.42)', letterSpacing: '4px', marginTop: '4px' }}>
              VEDIC ASTROLOGY
            </div>
          </div>
        </div>

        {/* ── Headline ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: title.length > 55 ? '52px' : '64px',
              fontWeight: 700,
              color: IVORY,
              lineHeight: 1.18,
              letterSpacing: '-1px',
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', width: '120px', height: '5px', background: GOLD, marginTop: '28px', borderRadius: '3px' }} />
          <div style={{ fontSize: '25px', color: 'rgba(245,240,232,0.62)', marginTop: '24px', lineHeight: 1.45 }}>
            {subtitle}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '22px', color: GOLD, fontWeight: 600 }}>jyotishstack.com</div>
          <div style={{ fontSize: '18px', color: 'rgba(245,240,232,0.35)' }}>
            Lahiri ayanamsa · Whole-sign houses
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Crawlers refetch this constantly; it only changes when the code does.
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
      },
    },
  );
}
