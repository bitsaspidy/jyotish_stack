import { KundliMilanCalc } from '../../../views/CalculatorViews';
import { pageMeta } from '../../../lib/seo';

export const metadata = pageMeta({
  title: 'Kundli Milan — Free Gun Milan Calculator (36 Guna Matching)',
  description: 'Free online Kundli Milan for marriage: Ashtakoot 36-guna matching by birth details of boy and girl. Instant compatibility score with verdict — koota breakdown and mangal comparison in full report.',
  path: '/calculators/kundli-milan',
  keywords: ['kundli milan', 'gun milan calculator', 'kundali matching for marriage', '36 guna milan', 'horoscope matching free', 'गुण मिलान'],
});

export default function KundliMilanPage() {
  return <KundliMilanCalc />;
}
