import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Astrology Blog',
  description: 'Vedic astrology articles, guides and research on Kundli, doshas, remedies, planets, nakshatras, dashas and predictions — in English and Hindi.',
  path: '/blog',
  keywords: ['astrology blog', 'vedic astrology articles', 'jyotish blog', 'kundli guide', 'astrology hindi'],
});

export default function BlogLayout({ children }) {
  return children;
}
