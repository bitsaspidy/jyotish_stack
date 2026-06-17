import AdminShell from '../../../admin-components/AdminShell';
import EmailManager from '../../../admin-views/EmailManager';

export const metadata = { title: 'Email Manager — Jyotish Stack Admin' };

export default function Page() {
  return (
    <AdminShell>
      <EmailManager />
    </AdminShell>
  );
}
