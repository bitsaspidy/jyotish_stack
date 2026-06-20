import { Suspense } from 'react';
import SetPassword from '../../views/SetPassword';

export const metadata = {
  title: 'Set Your Password — Jyotish Stack AI',
};

export default function Page() {
  return (
    <Suspense>
      <SetPassword />
    </Suspense>
  );
}
