import KundliDetail from '../../../views/KundliDetail';

export const metadata = { title: 'Kundli Detail — Jyotish Stack AI' };

export default function KundliDetailPage({ params }) {
  return <KundliDetail uuid={params.uuid} />;
}
