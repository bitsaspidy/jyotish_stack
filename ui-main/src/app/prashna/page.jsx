import Prashna from '../../views/Prashna';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title:'Prashna Jyotish — Ask a Question with Horary Astrology',
  description:'Ask a focused question and cast a Vedic Prashna chart for the exact time and location. Free basic direction with complete paid member judgement and timing.',
  path:'/prashna',
  keywords:['prashna jyotish', 'horary astrology', 'prashna kundli', 'question astrology', 'प्रश्न ज्योतिष', 'प्रश्न कुंडली'],
});

export default function PrashnaPage() {
  return <Prashna />;
}
