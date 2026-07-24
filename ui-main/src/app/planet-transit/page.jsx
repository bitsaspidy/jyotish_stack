import PlanetTransit from '../../views/PlanetTransit';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Planet Transit — Rashi & Nakshatra Ingress Dates',
  description: 'When each planet changes sign (Rashi) and nakshatra through the year — the full sidereal (Lahiri) transit calendar for the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu.',
  path: '/planet-transit',
  keywords: ['planet transit', 'rashi transit', 'nakshatra transit', 'grah gochar', 'sankranti dates', 'planet ingress'],
});

export default function PlanetTransitPage() {
  return <PlanetTransit />;
}
