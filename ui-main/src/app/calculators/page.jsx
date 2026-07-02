import { CalculatorsHub } from '../../views/CalculatorViews';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Free Astrology Calculators — Mangal Dosha, Sade Sati, Mahadasha, Kundli Milan',
  description: 'Free Vedic astrology calculators: Mangal Dosha (Manglik) checker, Sade Sati calculator, Vimshottari Mahadasha finder and 36-guna Kundli Milan. Instant, accurate, no login.',
  path: '/calculators',
  keywords: ['astrology calculators', 'manglik calculator', 'sade sati calculator', 'mahadasha calculator', 'kundli milan', 'free vedic tools'],
});

export default function CalculatorsPage() {
  return <CalculatorsHub />;
}
