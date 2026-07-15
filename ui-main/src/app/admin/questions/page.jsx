import AdminShell from '../../../admin-components/AdminShell';
import Questions from '../../../admin-views/Questions';
export const metadata = { title: 'Kundli Q&A — Admin | Jyotish Stack AI' };
export default function QuestionsPage() {
  return <AdminShell><Questions /></AdminShell>;
}
