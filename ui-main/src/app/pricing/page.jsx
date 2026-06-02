import Home from '../../views/Home';
export const metadata = { title: 'Pricing — Jyotish Stack AI' };
export default function PricingPage() {
  // Pricing section is embedded in the Home page; reuse it until a standalone page is needed
  return <Home scrollTo="pricing" />;
}
