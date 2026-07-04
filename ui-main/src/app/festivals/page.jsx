import FestivalCalendar from '../../views/FestivalCalendar';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'Hindu Festivals 2026 — Complete Calendar with Dates',
  description: 'Complete list of major Hindu festivals and vrat dates in 2026 — Makar Sankranti, Holi, Ram Navami, Raksha Bandhan, Janmashtami, Ganesh Chaturthi, Navratri, Dussehra, Diwali, Chhath and more, with day and significance.',
  path: '/festivals',
  keywords: ['hindu festivals 2026', 'festival calendar 2026', 'hindu calendar 2026', 'vrat tyohar 2026', 'diwali 2026 date', 'holi 2026 date', 'हिंदू त्योहार 2026', 'festival dates 2026'],
});

export default function FestivalsPage() {
  return <FestivalCalendar />;
}
