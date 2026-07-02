import FreeKundli from '../../views/FreeKundli';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Free Kundli Online — Janam Kundali in 30 Seconds',
  description: 'Generate your free Vedic janam kundali online — lagna chart, planetary positions, nakshatra, vimshottari dasha and dosha scan. Accurate Lahiri ayanamsa calculations. No login required.',
  path: '/free-kundli',
  keywords: ['free kundli', 'janam kundali online', 'free kundli online', 'birth chart calculator', 'kundli by date of birth', 'जन्म कुंडली', 'vedic birth chart free'],
});

export default function FreeKundliPage() {
  return <FreeKundli />;
}
