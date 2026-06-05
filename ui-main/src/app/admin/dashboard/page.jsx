import AdminShell from '../../../admin-components/AdminShell';
import Dashboard from '../../../admin-views/Dashboard';
export const metadata = { title: 'Dashboard — Admin | Jyotish Stack AI' };
export default function DashboardPage() {
  return <AdminShell><Dashboard /></AdminShell>;
}
