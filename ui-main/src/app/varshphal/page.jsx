import VarshphalPage from '../../views/VarshphalPage';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Varshphal — Annual Solar Return Chart',
  description: 'Your personalised Varshphal (Tajika annual chart) — yearly predictions, Mudda Dasha, Varshesha and month-by-month life-area forecasts based on your solar return.',
  path: '/varshphal',
  keywords: ['varshphal', 'annual horoscope', 'solar return', 'tajika', 'mudda dasha', 'yearly prediction'],
});

export default function Page() { return <VarshphalPage />; }
