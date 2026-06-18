import Matchmaking from '../../views/Matchmaking';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Kundli Matchmaking — Gun Milan',
  description: 'Free Kundli matching for marriage with Ashtakoot Gun Milan, Mangal Dosha and Rajju-Vedha analysis. Get a detailed 36-guna compatibility report instantly.',
  path: '/matchmaking',
  keywords: ['kundli matching', 'gun milan', 'horoscope matching', 'ashtakoot', 'marriage compatibility', 'mangal dosha'],
});

export default function MatchmakingPage() {
  return <Matchmaking />;
}
