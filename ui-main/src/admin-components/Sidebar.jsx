'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV = [
  {
    section: 'Overview',
    items: [
      { href:'/admin/dashboard',  icon:'▣', emoji:'📊', label:'Dashboard' },
    ],
  },
  {
    section: 'Management',
    items: [
      { href:'/admin/users',    icon:'◎', emoji:'👥', label:'Users' },
      { href:'/admin/plans',    icon:'◉', emoji:'💳', label:'Plans' },
      { href:'/admin/kundlis',  icon:'◈', emoji:'🔯', label:'Kundli Profiles' },
      { href:'/admin/knowledge', icon:'◈', emoji:'📚', label:'Knowledge Base' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { href:'/admin/newsletter',    icon:'◈', emoji:'📰', label:'Newsletter' },
      { href:'/admin/email-blast',   icon:'◈', emoji:'📧', label:'Email Blast' },
      { href:'/admin/email-logs',    icon:'◈', emoji:'📋', label:'Email Logs' },
      { href:'/admin/notifications', icon:'◈', emoji:'🔔', label:'Notifications' },
    ],
  },
  {
    section: 'Jyotish Tools',
    items: [
      { href:'/admin/panchang', icon:'◈', emoji:'🕉', label:'Panchang Muhurta' },
    ],
  },
  {
    section: 'System',
    items: [
      { href:'/admin/settings', icon:'◧', emoji:'⚙️', label:'Settings' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { admin, logoutAdmin } = useAdminAuth();
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await logoutAdmin();
    toast.success('Signed out');
    router.push('/admin/login');
  };

  return (
    <aside style={{
      position:'fixed', left:0, top:0, bottom:0,
      width: collapsed ? 64 : 240,
      background:'#06070F',
      borderRight:'1px solid rgba(212,175,55,0.1)',
      display:'flex', flexDirection:'column',
      zIndex:40, overflow:'hidden',
      transition:'width 0.22s ease',
    }}>

      {/* ── Logo row ─────────────────────────────────────────────────────── */}
      <div style={{
        height:56, padding:'0 16px', flexShrink:0,
        display:'flex', alignItems:'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom:'1px solid rgba(212,175,55,0.1)',
      }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🪐</span>
            <div>
              <p style={{ color:'#D4AF37', fontWeight:700, fontSize:13, fontFamily:'Georgia,serif', whiteSpace:'nowrap', lineHeight:1.2 }}>JS Admin</p>
              <p style={{ color:'rgba(212,175,55,0.3)', fontSize:9, letterSpacing:'0.08em', whiteSpace:'nowrap' }}>jyotishstack.com</p>
            </div>
          </div>
        )}
        {collapsed && <span style={{ fontSize:18 }}>🪐</span>}
        <button onClick={onToggle} style={{
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:4, cursor:'pointer', color:'rgba(245,240,232,0.4)',
          fontSize:11, padding:'4px 6px', lineHeight:1, transition:'all 0.15s',
          flexShrink:0, marginLeft: collapsed ? 0 : 8,
        }}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', paddingBottom:8 }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginTop:4 }}>
            {!collapsed && (
              <p style={{
                color:'rgba(245,240,232,0.18)', fontSize:9, fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.18em',
                padding:'10px 16px 3px',
              }}>
                {section}
              </p>
            )}
            {collapsed && <div style={{ height:6 }} />}

            {items.map(({ href, emoji, label }) => {
              const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
              return (
                <Link key={href} href={href} title={collapsed ? label : undefined} style={{
                  display:'flex', alignItems:'center', gap:10, textDecoration:'none',
                  padding: collapsed ? '10px 0' : '8px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRight:`2px solid ${active ? '#D4AF37' : 'transparent'}`,
                  background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
                  color: active ? '#D4AF37' : 'rgba(245,240,232,0.48)',
                  transition:'all 0.14s',
                  position:'relative',
                }}>
                  <span style={{ fontSize:14, width:18, textAlign:'center', flexShrink:0 }}>{emoji}</span>
                  {!collapsed && (
                    <span style={{ fontSize:13, fontWeight: active ? 600 : 400, whiteSpace:'nowrap', letterSpacing:'0.01em' }}>
                      {label}
                    </span>
                  )}
                  {active && !collapsed && (
                    <span style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'#D4AF37', flexShrink:0 }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Admin profile + logout ────────────────────────────────────────── */}
      <div style={{ borderTop:'1px solid rgba(212,175,55,0.1)', flexShrink:0, padding: collapsed ? '10px 0' : '12px 14px' }}>
        {!collapsed && admin && (
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg,rgba(212,175,55,0.22),rgba(212,175,55,0.06))',
              border:'1px solid rgba(212,175,55,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#D4AF37', fontWeight:700, fontSize:12,
            }}>
              {admin.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#F5F0E8', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {admin.name}
              </p>
              <p style={{ color:'rgba(245,240,232,0.3)', fontSize:10, textTransform:'capitalize', letterSpacing:'0.04em' }}>
                {admin.role}
              </p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined} style={{
          width:'100%', border:'1px solid rgba(212,175,55,0.18)',
          background:'transparent', color:'rgba(212,175,55,0.6)',
          borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:500,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          padding: collapsed ? '8px 0' : '7px 10px',
          transition:'all 0.15s',
        }}>
          <span style={{ fontSize:13 }}>⎋</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
