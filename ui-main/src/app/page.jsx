import Home from '../views/Home';
import { absUrl } from '../lib/seo';

export const metadata = {
  title: { absolute: 'Free Kundli, Matchmaking & Daily Horoscope — Jyotish Stack AI' },
  description: 'Generate your free Janam Kundli, match horoscopes for marriage, read your daily rashifal and get AI-powered Vedic predictions — all in one place at Jyotish Stack AI.',
  alternates: { canonical: absUrl('/') },
};

export default function HomePage() {
  return <Home />;
}
