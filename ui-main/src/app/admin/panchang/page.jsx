import AdminShell from '../../../admin-components/AdminShell';
import Panchang from '../../../admin-views/Panchang';
export const metadata = { title: 'Panchang Muhurta — Admin | Jyotish Stack AI' };
export default function PanchangPage() {
  return <AdminShell><Panchang /></AdminShell>;
}
