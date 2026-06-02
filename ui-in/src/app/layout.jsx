import { Inter, Playfair_Display, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', weight: ['300','400','600','700'], display: 'swap' });

export const metadata = {
  title: 'ज्योतिष स्टैक — वैदिक ज्योतिष का डिजिटल मंदिर | jyotishstack.in',
  description: 'कुंडली, विवाह मिलान, भविष्यवाणी और दशा विश्लेषण — AI की शक्ति के साथ।',
  keywords: ['ज्योतिष', 'कुंडली', 'भविष्यवाणी', 'विवाह मिलान', 'राशिफल'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi" className={`${inter.variable} ${playfair.variable} ${devanagari.variable}`}>
      <body style={{ background: '#1A0D08', color: '#FFF8F0', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
