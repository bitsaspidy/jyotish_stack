import AboutUs from '../../views/AboutUs';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'About Us — Jyotish Stack AI',
  description: 'Jyotish Stack AI blends classical Vedic astrology with modern technology — accurate sidereal calculation, honest readings, and grounded remedies. Learn who we are and how we work.',
  path: '/about',
  keywords: ['about jyotish stack', 'vedic astrology platform', 'jyotish stack ai', 'about us', 'M/S Sat Sai Infocom'],
});

export default function AboutPage() {
  return <AboutUs />;
}
