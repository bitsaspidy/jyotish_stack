import { Suspense } from 'react';
import RemedyResubmit from '../../views/RemedyResubmit';

export const metadata = {
  title: 'Re-submit Birth Details — Jyotish Stack AI',
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <RemedyResubmit />
    </Suspense>
  );
}
