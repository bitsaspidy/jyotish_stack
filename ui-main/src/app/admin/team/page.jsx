import AdminShell from '../../../admin-components/AdminShell';
import Team from '../../../admin-views/Team';
export const metadata = { title: 'Team — Admin | Jyotish Stack AI' };
export default function TeamPage() {
  return <AdminShell><Team /></AdminShell>;
}
