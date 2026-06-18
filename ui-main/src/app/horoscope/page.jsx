import DailyHoroscope from '../../views/DailyHoroscope';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Daily Horoscope (Rashifal)',
  description: 'Read your free daily horoscope for all 12 zodiac signs — career, love, health and finance predictions based on real-time Vedic planetary transits. Updated every day.',
  path: '/horoscope',
  keywords: ['daily horoscope', 'rashifal', 'aaj ka rashifal', 'zodiac prediction', 'vedic horoscope today'],
});

export default function HoroscopePage() {
  return <DailyHoroscope />;
}
