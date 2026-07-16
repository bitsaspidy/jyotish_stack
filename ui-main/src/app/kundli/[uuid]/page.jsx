import KundliDetail from '../../../views/KundliDetail';

export const metadata = { title: 'Kundli Detail — Jyotish Stack AI' };

/**
 * `params` must be awaited.
 *
 * Next 14 passes a plain object; Next 15+ passes a Promise, and Next 16 removed
 * the shim that allowed reading it synchronously. Under Next 16 `params.uuid` is
 * therefore `undefined`, KundliDetail receives no uuid, its fetch bails out
 * before sending a request, and the page shows "Computing Kundli…" forever — no
 * error, no network call, a perfectly idle server.
 *
 * `await` on a plain object returns that object, so this one form is correct on
 * BOTH versions. Do not read `params.x` directly here.
 */
export default async function KundliDetailPage({ params }) {
  const { uuid } = await params;
  return <KundliDetail uuid={uuid} />;
}
