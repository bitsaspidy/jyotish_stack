import PanchangMuhurta from '../../views/PanchangMuhurta';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Panchang & Muhurat — Daily Vedic Almanac',
  description: 'Free daily Panchang with Tithi, Nakshatra, Yoga, Karana, sunrise/sunset, Choghadiya, Hora and auspicious Muhurat timings for any city and date.',
  path: '/panchang-muhurat',
  keywords: ['panchang', 'today panchang', 'muhurat', 'choghadiya', 'tithi', 'nakshatra', 'shubh muhurat'],
});

export default function PanchangMuhurtaPage() {
  return <PanchangMuhurta />;
}
