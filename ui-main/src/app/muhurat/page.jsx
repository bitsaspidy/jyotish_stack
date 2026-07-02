import { redirect } from 'next/navigation';

// /muhurat → default to marriage muhurat (the highest-traffic occasion)
export default function MuhuratIndexPage() {
  redirect('/muhurat/marriage');
}
