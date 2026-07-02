import PeriodHoroscope from '../../../views/PeriodHoroscope';
import { pageMeta } from '../../../lib/seo';

export const metadata = pageMeta({
  title: 'Weekly Horoscope — All 12 Zodiac Signs',
  description: 'Free weekly horoscope for all 12 rashis based on real Vedic transits — day-by-day scores, best days, career, love, finance and health predictions for this week.',
  path: '/horoscope/weekly',
  keywords: ['weekly horoscope', 'saptahik rashifal', 'this week horoscope', 'weekly rashifal', 'साप्ताहिक राशिफल'],
});

export default function WeeklyHoroscopePage() {
  return <PeriodHoroscope period="weekly" />;
}
