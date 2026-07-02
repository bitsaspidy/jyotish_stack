import { SadeSatiCalc } from '../../../views/CalculatorViews';
import { pageMeta } from '../../../lib/seo';

export const metadata = pageMeta({
  title: 'Sade Sati Calculator — Is Shani Sade Sati Active in Your Life?',
  description: "Free Sade Sati calculator by date of birth. Check if Saturn's 7½-year Sade Sati is running now, your current phase, end date, and when the next cycle begins.",
  path: '/calculators/sade-sati',
  keywords: ['sade sati calculator', 'shani sade sati', 'sade sati check by date of birth', 'साढ़े साती', 'saturn transit calculator'],
});

export default function SadeSatiPage() {
  return <SadeSatiCalc />;
}
