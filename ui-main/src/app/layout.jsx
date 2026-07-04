import { Inter, Playfair_Display, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { SITE_URL, SITE_NAME, JsonLd, organizationLd, websiteLd } from '../lib/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', weight: ['300', '400', '600'], display: 'swap' });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Jyotish Stack AI — Ancient Wisdom. Modern Intelligence.',
    template: '%s | Jyotish Stack AI',
  },
  description: 'Discover your cosmic destiny with Jyotish Stack AI — free Kundli, Kundli matchmaking, daily horoscope, Panchang and personalised Bhavishya Vani powered by Vedic astrology and AI.',
  applicationName: SITE_NAME,
  keywords: ['jyotish', 'kundli', 'free kundli', 'astrology', 'bhavishya vani', 'vedic astrology', 'kundli matching', 'matchmaking', 'horoscope', 'panchang', 'rashifal', 'birth chart', 'janam kundli'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: '/' },
  category: 'Astrology',
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/logo-icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo-icon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Jyotish Stack AI — Ancient Wisdom. Modern Intelligence.',
    description: 'Free Kundli, matchmaking, daily horoscope, Panchang and AI-powered Vedic predictions.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/logo.svg', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jyotish Stack AI',
    description: 'Free Kundli, matchmaking, daily horoscope & AI-powered Vedic predictions.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport = {
  themeColor: '#0B0D1A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${devanagari.variable}`}>
      <body className="bg-cosmos-800 text-ivory font-sans antialiased">
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
