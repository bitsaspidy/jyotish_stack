import PlanetTransitDetail from '../../../views/PlanetTransitDetail';
import { pageMeta } from '../../../lib/seo';

const NAMES = {
  sun:'Sun', moon:'Moon', mars:'Mars', mercury:'Mercury', jupiter:'Jupiter',
  venus:'Venus', saturn:'Saturn', rahu:'Rahu', ketu:'Ketu',
};

export function generateMetadata({ params }) {
  const name = NAMES[String(params.planet || '').toLowerCase()] || 'Planet';
  return pageMeta({
    title: `${name} Transit — Rashi & Nakshatra Ingress Dates`,
    description: `The dates ${name} enters each Rashi and nakshatra through the year — the sidereal (Lahiri) transit calendar with exact ingress times for New Delhi.`,
    path: `/planet-transit/${String(params.planet || '').toLowerCase()}`,
    keywords: [`${name} transit`, `${name} rashi change`, 'planet transit', 'grah gochar', 'nakshatra transit'],
  });
}

export default function PlanetTransitDetailPage({ params }) {
  return <PlanetTransitDetail slug={params.planet} />;
}
