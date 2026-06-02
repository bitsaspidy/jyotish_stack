import { Inter, Noto_Sans_Devanagari } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', weight: ['300','400','600','700'], display: 'swap' });

export const metadata = {
  title: 'ज्योतिष स्टैक AI — AI-संचालित वैदिक ज्योतिष | jyotishstackai.in',
  description: 'AI की शक्ति से वैदिक ज्योतिष। कुंडली, विवाह मिलान, भविष्यवाणी — हिंदी में।',
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi" className={`${inter.variable} ${devanagari.variable}`}>
      <body style={{ background: '#060810', color: '#FFF5E8', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
