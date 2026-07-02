import PeriodHoroscope from '../../../views/PeriodHoroscope';
import { pageMeta } from '../../../lib/seo';

export const metadata = pageMeta({
  title: 'Yearly Horoscope 2026 — Jupiter & Saturn Transits',
  description: 'Free yearly horoscope for all 12 rashis — Jupiter and Saturn transit phases with exact dates, Sade Sati alerts, quarterly outlook, and annual career, love, finance and health forecasts.',
  path: '/horoscope/yearly',
  keywords: ['yearly horoscope 2026', 'varshik rashifal', 'jupiter transit 2026', 'saturn transit 2026', 'वार्षिक राशिफल', 'sade sati 2026'],
});

export default function YearlyHoroscopePage() {
  return <PeriodHoroscope period="yearly" />;
}
