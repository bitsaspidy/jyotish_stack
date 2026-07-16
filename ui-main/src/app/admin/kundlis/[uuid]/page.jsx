import AdminShell from '../../../../admin-components/AdminShell';
import KundliAdminDetail from '../../../../admin-views/KundliAdminDetail';

export const metadata = { title: 'Kundli Detail — Admin | Jyotish Stack AI' };

// `params` must be awaited — see kundli/[uuid]/page.jsx for the full reasoning.
// Reading `params.uuid` synchronously yields undefined on Next 15+, which left this
// page stuck on "Loading Kundli…" forever without ever making a request.
export default async function KundliDetailPage({ params }) {
  const { uuid } = await params;
  return <AdminShell><KundliAdminDetail kundliUuid={uuid} /></AdminShell>;
}
