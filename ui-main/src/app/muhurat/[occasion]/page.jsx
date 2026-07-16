import { notFound } from 'next/navigation';
import MuhuratOccasion from '../../../views/MuhuratOccasion';
import { pageMeta } from '../../../lib/seo';

const YEAR = new Date().getFullYear();

const OCCASION_SEO = {
  marriage: {
    title: `Marriage Muhurat ${YEAR} — Auspicious Vivah Dates`,
    description: `Complete list of auspicious marriage (vivah) muhurat dates in ${YEAR} with tithi and nakshatra — computed from classical Muhurta Chintamani rules. Check shubh vivah dates month by month.`,
    keywords: [`marriage muhurat ${YEAR}`, `vivah muhurat ${YEAR}`, 'shubh vivah dates', 'wedding dates hindu calendar', 'विवाह मुहूर्त'],
  },
  'griha-pravesh': {
    title: `Griha Pravesh Muhurat ${YEAR} — House Warming Dates`,
    description: `Auspicious Griha Pravesh (house warming) muhurat dates in ${YEAR} with tithi and nakshatra details. Find the right day to enter your new home.`,
    keywords: [`griha pravesh muhurat ${YEAR}`, 'house warming dates', 'new home muhurat', 'गृह प्रवेश मुहूर्त'],
  },
  naamkaran: {
    title: `Naamkaran Muhurat ${YEAR} — Naming Ceremony Dates`,
    description: `Auspicious Naamkaran (baby naming ceremony) muhurat dates in ${YEAR} with tithi and nakshatra. Choose a blessed day for your child's naming sanskar.`,
    keywords: [`naamkaran muhurat ${YEAR}`, 'naming ceremony dates', 'baby naming muhurat', 'नामकरण मुहूर्त'],
  },
  mundan: {
    title: `Mundan Muhurat ${YEAR} — First Haircut Ceremony Dates`,
    description: `Auspicious Mundan sanskar (first haircut) muhurat dates in ${YEAR} with tithi and nakshatra, per classical muhurta rules.`,
    keywords: [`mundan muhurat ${YEAR}`, 'mundan sanskar dates', 'first haircut ceremony', 'मुंडन मुहूर्त'],
  },
  'vehicle-purchase': {
    title: `Vehicle Purchase Muhurat ${YEAR} — Car & Bike Buying Dates`,
    description: `Auspicious vehicle purchase muhurat dates in ${YEAR} — best days to buy a car or bike with tithi and nakshatra details.`,
    keywords: [`vehicle purchase muhurat ${YEAR}`, `car buying muhurat ${YEAR}`, 'bike purchase auspicious date', 'वाहन खरीद मुहूर्त'],
  },
};

export function generateStaticParams() {
  return Object.keys(OCCASION_SEO).map((occasion) => ({ occasion }));
}

// `params` must be awaited — see kundli/[uuid]/page.jsx. Next 16 passes a Promise,
// so `params.occasion` reads as undefined and every occasion would 404. Awaiting
// works on Next 14 too, where params is a plain object.
export async function generateMetadata({ params }) {
  const { occasion } = await params;
  const seo = OCCASION_SEO[occasion];
  if (!seo) return {};
  return pageMeta({ ...seo, path: `/muhurat/${occasion}` });
}

export default async function MuhuratOccasionPage({ params }) {
  const { occasion } = await params;
  if (!OCCASION_SEO[occasion]) notFound();
  return <MuhuratOccasion occasion={occasion} />;
}
