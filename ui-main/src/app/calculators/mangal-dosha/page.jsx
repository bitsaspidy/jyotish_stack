import { MangalDoshaCalc } from '../../../views/CalculatorViews';
import { pageMeta } from '../../../lib/seo';

export const metadata = pageMeta({
  title: 'Mangal Dosha Calculator — Free Manglik Check by Date of Birth',
  description: 'Check Mangal Dosha (Manglik) free by date, time and place of birth. Instant analysis of Mars in houses 1, 4, 7, 8, 12 from lagna, Moon and Venus — with cancellation (parihar) detection.',
  path: '/calculators/mangal-dosha',
  keywords: ['mangal dosha calculator', 'manglik calculator', 'am i manglik', 'manglik check by date of birth', 'मंगल दोष', 'kuja dosha calculator'],
});

export default function MangalDoshaPage() {
  return <MangalDoshaCalc />;
}
