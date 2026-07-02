import { MahadashaCalc } from '../../../views/CalculatorViews';
import { pageMeta } from '../../../lib/seo';

export const metadata = pageMeta({
  title: 'Mahadasha Calculator — Find Your Current Vimshottari Dasha',
  description: 'Free Vimshottari Mahadasha calculator by date of birth. Find your current planetary period, running antardasha and next mahadasha with exact dates.',
  path: '/calculators/mahadasha',
  keywords: ['mahadasha calculator', 'vimshottari dasha calculator', 'current dasha check', 'antardasha calculator', 'महादशा'],
});

export default function MahadashaPage() {
  return <MahadashaCalc />;
}
