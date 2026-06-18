export default function manifest() {
  return {
    name: 'Jyotish Stack AI — Vedic Astrology',
    short_name: 'Jyotish Stack',
    description: 'Free Kundli, matchmaking, daily horoscope, Panchang and AI-powered Vedic predictions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0D1A',
    theme_color: '#0B0D1A',
    lang: 'en',
    categories: ['lifestyle', 'education', 'astrology'],
    icons: [
      { src: '/logo-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
