import Home from '../../views/Home';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Pricing & Plans',
  description: 'Simple, transparent pricing for Jyotish Stack AI — Basic, Premium and Yearly plans with full Kundli, PDF reports, predictions and matchmaking. All prices include GST.',
  path: '/pricing',
  keywords: ['jyotish pricing', 'kundli plan price', 'astrology subscription india'],
});

export default function PricingPage() {
  return <Home scrollTo="pricing" />;
}
