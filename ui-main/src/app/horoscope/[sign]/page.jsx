import { notFound } from 'next/navigation';
import SignHoroscope from '../../../views/SignHoroscope';
import { SIGNS, signBySlug } from '../../../lib/rashiSigns';
import { pageMeta } from '../../../lib/seo';

export function generateStaticParams() {
  return SIGNS.map((s) => ({ sign: s.slug }));
}

export function generateMetadata({ params }) {
  const s = signBySlug(params.sign);
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

export default function SignHoroscopePage({ params }) {
  if (!signBySlug(params.sign)) notFound();
  return <SignHoroscope sign={params.sign} />;
}
