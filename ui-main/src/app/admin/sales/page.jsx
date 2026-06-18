import AdminShell from '../../../admin-components/AdminShell';
import SalesManagement from '../../../admin-views/SalesManagement';
export const metadata = { title: 'Sales Management — Admin | Jyotish Stack AI' };
export default function SalesPage() {
  return <AdminShell><SalesManagement /></AdminShell>;
}
