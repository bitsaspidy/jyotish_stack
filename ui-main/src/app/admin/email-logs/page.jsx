import AdminShell from '../../../admin-components/AdminShell';
import EmailLogs from '../../../admin-views/EmailLogs';
export const metadata = { title: 'Email Logs — Admin | Jyotish Stack AI' };
export default function EmailLogsPage() {
  return <AdminShell><EmailLogs /></AdminShell>;
}
