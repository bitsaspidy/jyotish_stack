'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../context/AdminAuthContext';

const links = [
  { href: '/admin/dashboard',     label: 'Dashboard',    icon: '📊' },
  { href: '/admin/users',         label: 'Users',         icon: '👥' },
  { href: '/admin/settings',      label: 'Settings',      icon: '⚙️' },
  { href: '/admin/newsletter',    label: 'Newsletter',    icon: '📰' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/admin/email-blast',   label: 'Email Blast',   icon: '📧' },
  { href: '/admin/plans',         label: 'Plans',         icon: '💳' },
  { href: '/admin/email-logs',    label: 'Email Logs',    icon: '📋' },
];

export default function Sidebar() {
  const { admin, logoutAdmin } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAdmin();
    toast.success('Logged out');
    router.push('/admin/login');
  };

  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, height: '100%', width: 240, background: '#06070F', borderRight: '1px solid rgba(212,175,55,0.15)', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 16, fontFamily: 'Georgia,serif' }}>🪐 JS Admin</p>
        <p style={{ color: 'rgba(245,240,232,0.3)', fontSize: 11, marginTop: 2 }}>jyotishstack.com/admin</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, fontSize: 13, textDecoration: 'none', transition: 'all 0.15s',
                background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: active ? '#D4AF37' : 'rgba(245,240,232,0.55)' }}>
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(212,175,55,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 700, fontSize: 13 }}>
            {admin?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#F5F0E8', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.name}</p>
            <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 11, textTransform: 'capitalize' }}>{admin?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '8px', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          Logout
        </button>
      </div>
    </aside>
  );
}
