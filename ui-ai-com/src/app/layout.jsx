import { Inter, Space_Grotesk } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'Jyotish Stack AI — Ancient Vedic Intelligence Meets Artificial Intelligence',
  description: 'AI-powered Vedic astrology platform. Kundli, matchmaking, predictions, and Dasha analysis — jyotishstackai.com',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body style={{ background: '#040810', color: '#E8F4FF', margin: 0, fontFamily: 'var(--font-inter)' }}>
        {children}
      </body>
    </html>
  );
}
