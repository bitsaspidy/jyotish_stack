import AdminShell from '../../../admin-components/AdminShell';
import Blog from '../../../admin-views/Blog';
export const metadata = { title: 'Blog — Admin | Jyotish Stack AI' };
export default function BlogPage() {
  return <AdminShell><Blog /></AdminShell>;
}
