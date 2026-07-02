import PeriodHoroscope from '../../../views/PeriodHoroscope';
import { pageMeta } from '../../../lib/seo';

export const metadata = pageMeta({
  title: 'Monthly Horoscope — Lucky Dates & Key Transits',
  description: 'Free monthly horoscope for all 12 rashis — lucky dates, caution dates, key planetary transits of the month, and career, love, finance and health forecasts.',
  path: '/horoscope/monthly',
  keywords: ['monthly horoscope', 'masik rashifal', 'this month horoscope', 'मासिक राशिफल', 'monthly prediction'],
});

export default function MonthlyHoroscopePage() {
  return <PeriodHoroscope period="monthly" />;
}
