export default function manifest() {
  return {
    name: 'Jyotish Stack AI — Vedic Astrology',
    short_name: 'Jyotish Stack',
    description: 'Free Kundli, matchmaking, daily horoscope, Panchang and AI-powered Vedic predictions.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0D1A',
    theme_color: '#0B0D1A',
    lang: 'en',
    categories: ['lifestyle', 'education', 'astrology'],
    icons: [
      { src: '/logo-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png',  sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png',  sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Daily Horoscope', url: '/horoscope',        icons: [{ src: '/logo-icon.svg', sizes: 'any' }] },
      { name: 'Free Kundli',     url: '/free-kundli',      icons: [{ src: '/logo-icon.svg', sizes: 'any' }] },
      { name: 'Panchang',        url: '/panchang-muhurat', icons: [{ src: '/logo-icon.svg', sizes: 'any' }] },
    ],
  };
}
