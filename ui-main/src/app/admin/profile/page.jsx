import AdminShell from '../../../admin-components/AdminShell';
import Profile from '../../../admin-views/Profile';
export const metadata = { title: 'Profile — Admin | Jyotish Stack AI' };
export default function ProfilePage() {
  return <AdminShell><Profile /></AdminShell>;
}
