'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../context/AdminAuthContext';

const links = [
  { href: '/dashboard',     label: 'Dashboard',     icon: '📊' },
  { href: '/users',         label: 'Users',          icon: '👥' },
  { href: '/questions',     label: 'Kundli Q&A',     icon: '💬' },
  { href: '/settings',      label: 'Settings',       icon: '⚙️' },
  { href: '/newsletter',    label: 'Newsletter',     icon: '📰' },
  { href: '/notifications', label: 'Notifications',  icon: '🔔' },
  { href: '/email-blast',   label: 'Email Blast',    icon: '📧' },
  { href: '/plans',         label: 'Plans',          icon: '💳' },
  { href: '/email-logs',    label: 'Email Logs',     icon: '📋' },
];

export default function Sidebar() {
  const { admin, logoutAdmin } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAdmin();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-cosmos-900 border-r border-gold/15 flex flex-col z-40">
      <div className="p-6 border-b border-gold/15">
        <h1 className="text-gold font-bold text-lg">🪐 JS Admin</h1>
        <p className="text-ivory/40 text-xs mt-1">Jyotish Stack AI</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
              pathname === l.href ? 'bg-gold/15 text-gold' : 'text-ivory/60 hover:text-ivory hover:bg-white/5'
            }`}
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gold/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold">
            {admin?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ivory text-sm truncate">{admin?.name}</p>
            <p className="text-ivory/40 text-xs capitalize">{admin?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="admin-btn-outline w-full text-center text-xs py-2">
          Logout
        </button>
      </div>
    </aside>
  );
}
