import PlanetaryPositions from '../../views/PlanetaryPositions';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Planetary Positions Today — Grah Gochar (All 9 Planets)',
  description: 'Live sidereal (Lahiri) planetary positions for any day — sign, degree, nakshatra, pada and retrograde status of the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu.',
  path: '/planetary-positions',
  keywords: ['planetary positions today', 'grah gochar', 'planet positions', 'today planetary transit', 'ग्रह स्थिति', 'graha gochar today', 'retrograde planets today'],
});

export default function PlanetaryPositionsPage({ searchParams }) {
  return <PlanetaryPositions initialDate={searchParams?.date} />;
}
