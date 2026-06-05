'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '../lib/adminApi';

// ── helpers ──────────────────────────────────────────────────────────────────
function relTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ROLE_STYLE = {
  superadmin: { bg:'rgba(167,139,250,0.15)', color:'#A78BFA' },
  admin:      { bg:'rgba(96,165,250,0.15)', color:'#60A5FA' },
  user:       { bg:'rgba(52,211,153,0.1)',  color:'#34D399' },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent, trending }) {
  return (
    <div style={{
      background:'#111428', border:'1px solid rgba(212,175,55,0.12)',
      borderTop:`2px solid ${accent}`, borderRadius:8, padding:'18px 20px',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:8, background:`${accent}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
          {icon}
        </div>
        {trending !== undefined && (
          <span style={{ fontSize:11, fontWeight:600, color: trending >= 0 ? '#34D399' : '#F87171' }}>
            {trending >= 0 ? '▲' : '▼'} {Math.abs(trending)}
          </span>
        )}
      </div>
      <p style={{ color:'#F5F0E8', fontSize:26, fontWeight:700, lineHeight:1, marginBottom:4 }}>
        {value ?? <span style={{ color:'rgba(245,240,232,0.2)', fontSize:18 }}>—</span>}
      </p>
      <p style={{ color:'rgba(245,240,232,0.45)', fontSize:12, marginBottom:2 }}>{label}</p>
      {sub !== undefined && (
        <p style={{ color: sub > 0 ? '#34D399' : 'rgba(245,240,232,0.25)', fontSize:11, fontWeight:500 }}>
          +{sub} today
        </p>
      )}
    </div>
  );
}

// ── Sparkline bar chart ───────────────────────────────────────────────────────
function SparkBars({ data }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const days = ['S','M','T','W','T','F','S'];
  const today = new Date().getDay();
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:40, paddingTop:4 }}>
      {data.map((d, i) => {
        const pct = Math.max(4, (d.count / max) * 100);
        const isToday = i === data.length - 1;
        return (
          <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div title={`${d.date}: ${d.count} signups`} style={{
              width:'100%', height:`${pct}%`,
              background: isToday ? '#D4AF37' : 'rgba(212,175,55,0.3)',
              borderRadius:'3px 3px 0 0', transition:'height 0.3s ease',
              minHeight:3,
            }} />
            <span style={{ fontSize:8, color:'rgba(245,240,232,0.25)', textAlign:'center' }}>
              {days[(today - (data.length - 1 - i) + 7) % 7]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/dashboard')
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:4 }}>
          Dashboard
        </h1>
        <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>
          Welcome back — here's what's happening on Jyotish Stack AI
        </p>
      </div>

      {/* ── Stat Grid ──────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14, marginBottom:28 }}>
        <StatCard label="Total Users"         value={s?.total_users}          sub={s?.users_today}   icon="👥"  accent="#60A5FA" />
        <StatCard label="Kundli Profiles"     value={s?.kundli_profiles}      sub={s?.kundlis_today} icon="🪐"  accent="#D4AF37" />
        <StatCard label="Newsletter Subs"     value={s?.active_subscribers}                          icon="📰"  accent="#A78BFA" />
        <StatCard label="Active Subs"         value={s?.active_subscriptions}                        icon="💳"  accent="#34D399" />
        <StatCard label="Emails Sent"         value={s?.emails_sent}          sub={s?.emails_today}  icon="📧"  accent="#F59E0B" />
        <StatCard label="Signups This Week"   value={data?.signups_7d?.reduce((a,c)=>a+c.count,0)}  icon="📈" accent="#EC4899" />
      </div>

      {/* ── Middle Row ─────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Signups chart */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h2 style={{ color:'#F5F0E8', fontSize:14, fontWeight:600 }}>Signups — Last 7 Days</h2>
            <Link href="/admin/users" style={{ color:'rgba(212,175,55,0.65)', fontSize:11, textDecoration:'none' }}>View all →</Link>
          </div>
          {data?.signups_7d ? <SparkBars data={data.signups_7d} /> : (
            <div style={{ height:40, background:'rgba(255,255,255,0.04)', borderRadius:4, animation:'pulse 1.5s infinite' }} />
          )}
        </div>

        {/* Quick actions */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'18px 20px' }}>
          <h2 style={{ color:'#F5F0E8', fontSize:14, fontWeight:600, marginBottom:14 }}>Quick Actions</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { href:'/admin/users',         icon:'👥', label:'Manage Users',    color:'#60A5FA' },
              { href:'/admin/email-blast',   icon:'📧', label:'Send Email',      color:'#F59E0B' },
              { href:'/admin/notifications', icon:'🔔', label:'Push Notif',      color:'#A78BFA' },
              { href:'/admin/settings',      icon:'⚙️', label:'App Settings',   color:'#34D399' },
              { href:'/admin/plans',         icon:'💳', label:'Manage Plans',    color:'#D4AF37' },
              { href:'/admin/newsletter',    icon:'📰', label:'Newsletter',      color:'#EC4899' },
            ].map(({ href, icon, label, color }) => (
              <Link key={href} href={href} style={{
                display:'flex', alignItems:'center', gap:8, padding:'9px 11px',
                border:'1px solid rgba(255,255,255,0.08)', borderRadius:6,
                textDecoration:'none', transition:'all 0.15s',
                background:'rgba(255,255,255,0.02)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=color+'44'; e.currentTarget.style.background=color+'0A'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}>
                <span style={{ fontSize:14 }}>{icon}</span>
                <span style={{ color:'rgba(245,240,232,0.65)', fontSize:12 }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Recent Users */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h2 style={{ color:'#F5F0E8', fontSize:14, fontWeight:600 }}>Recent Signups</h2>
            <Link href="/admin/users" style={{ color:'rgba(212,175,55,0.65)', fontSize:11, textDecoration:'none' }}>See all →</Link>
          </div>
          {loading ? (
            <div style={{ space:'12px 0' }}>
              {[1,2,3].map(i=>(
                <div key={i} style={{ height:38, background:'rgba(255,255,255,0.04)', borderRadius:4, marginBottom:8, animation:'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : data?.recent_users?.length === 0 ? (
            <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, padding:'8px 0' }}>No users yet.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              {data?.recent_users?.map(u => {
                const rs = ROLE_STYLE[u.role] || ROLE_STYLE.user;
                return (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#D4AF37', fontWeight:700, fontSize:11, flexShrink:0 }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ color:'#F5F0E8', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                      <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</p>
                    </div>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:600, background:rs.bg, color:rs.color, flexShrink:0 }}>
                      {u.role}
                    </span>
                    <span style={{ color:'rgba(245,240,232,0.28)', fontSize:10, flexShrink:0 }}>{relTime(u.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Kundlis */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h2 style={{ color:'#F5F0E8', fontSize:14, fontWeight:600 }}>Recent Kundlis</h2>
          </div>
          {loading ? (
            <div>
              {[1,2,3].map(i=>(
                <div key={i} style={{ height:38, background:'rgba(255,255,255,0.04)', borderRadius:4, marginBottom:8, animation:'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : data?.recent_kundlis?.length === 0 ? (
            <p style={{ color:'rgba(245,240,232,0.3)', fontSize:12, padding:'8px 0' }}>No Kundlis yet.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              {data?.recent_kundlis?.map(k => (
                <div key={k.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:28, height:28, borderRadius:6, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>
                    🔯
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:'#F5F0E8', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.name}</p>
                    <p style={{ color:'rgba(245,240,232,0.38)', fontSize:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.place_of_birth}</p>
                  </div>
                  <span style={{ color:'rgba(245,240,232,0.3)', fontSize:10, flexShrink:0 }}>{String(k.date_of_birth).slice(0,10)}</span>
                  <span style={{ color:'rgba(245,240,232,0.28)', fontSize:10, flexShrink:0 }}>{relTime(k.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
