import { Inter, Playfair_Display, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', weight: ['300', '400', '600'], display: 'swap' });

export const metadata = {
  title: 'Jyotish Stack AI — Ancient Wisdom. Modern Intelligence.',
  description: 'Discover your cosmic destiny with Jyotish Stack AI — Kundli, matchmaking, and personalised Bhavishya Vani powered by Vedic astrology and AI.',
  keywords: ['jyotish', 'kundli', 'astrology', 'bhavishya vani', 'vedic astrology', 'matchmaking', 'horoscope'],
  openGraph: {
    title: 'Jyotish Stack AI',
    description: 'Ancient Vedic wisdom meets modern AI intelligence.',
    url: 'https://jyotishstack.com',
    siteName: 'Jyotish Stack AI',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${devanagari.variable}`}>
      <body className="bg-cosmos-800 text-ivory font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
