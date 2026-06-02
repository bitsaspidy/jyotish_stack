// Admin root layout — intentionally bare.
// The /admin/login page manages its own AdminAuthProvider.
// Every protected admin page (dashboard, users, etc.) individually wraps with
// <AdminShell> which provides auth guard + sidebar. So this layout must NOT
// wrap children with AdminShell — that would block the unauthenticated login page.
export const metadata = { title: 'Admin — Jyotish Stack AI', robots: 'noindex,nofollow' };

export default function AdminLayout({ children }) {
  return <>{children}</>;
}
