import AdminShell from '../../../admin-components/AdminShell';
import Users from '../../../admin-views/Users';
export const metadata = { title: 'Users — Admin | Jyotish Stack AI' };
export default function UsersPage() {
  return <AdminShell><Users /></AdminShell>;
}
