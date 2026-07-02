import RemediesShowcase from '../../views/RemediesShowcase';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Vedic Remedies (Upay) — Mantra, Gemstone & Charity for All 9 Planets',
  description: 'Free classical graha shanti remedies for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu — mantras with jap count, gemstones, donation days and conduct. Personalised remedy booklet from your kundli.',
  path: '/remedies',
  keywords: ['vedic remedies', 'graha shanti upay', 'planet remedies astrology', 'shani remedies', 'rahu remedies', 'नवग्रह उपाय', 'astrological remedies'],
});

export default function RemediesPage() {
  return <RemediesShowcase />;
}
