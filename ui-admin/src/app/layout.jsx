import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = { title: 'Admin — Jyotish Stack AI', robots: 'noindex,nofollow' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-cosmos-800 text-ivory antialiased">{children}</body>
    </html>
  );
}
