import { notFound } from 'next/navigation';
import SignHoroscope from '../../../views/SignHoroscope';
import { SIGNS, signBySlug } from '../../../lib/rashiSigns';
import { pageMeta } from '../../../lib/seo';

export function generateStaticParams() {
  return SIGNS.map((s) => ({ sign: s.slug }));
}

// `params` must be awaited — see kundli/[uuid]/page.jsx. Next 16 passes a Promise,
// so `params.sign` reads as undefined and every sign would 404. Awaiting works on
// Next 14 too, where params is a plain object.
export async function generateMetadata({ params }) {
  const { sign } = await params;
  const s = signBySlug(sign);
  if (!s) return {};
  const l = s.en.toLowerCase();
  return pageMeta({
    title: `${s.en} Horoscope Today — ${s.hi} Rashifal (Daily)`,
    description: `Free daily ${s.en} (${s.hi}) horoscope — today's career, love, health and finance predictions based on real Vedic Moon transits. Updated every day.`,
    path: `/horoscope/${s.slug}`,
    keywords: [
      `${l} horoscope`, `${l} horoscope today`, `${l} daily horoscope`,
      `${l} rashifal`, `aaj ka ${l} rashifal`, `${s.hi} राशिफल`, `${s.hi} राशिफल आज`,
    ],
  });
}

export default async function SignHoroscopePage({ params }) {
  const { sign } = await params;
  if (!signBySlug(sign)) notFound();
  return <SignHoroscope sign={sign} />;
}
