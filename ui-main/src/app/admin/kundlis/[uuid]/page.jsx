import AdminShell from '../../../../admin-components/AdminShell';
import KundliAdminDetail from '../../../../admin-views/KundliAdminDetail';
export const metadata = { title: 'Kundli Detail — Admin | Jyotish Stack AI' };
export default function KundliDetailPage({ params }) {
  return <AdminShell><KundliAdminDetail kundliUuid={params.uuid} /></AdminShell>;
}
