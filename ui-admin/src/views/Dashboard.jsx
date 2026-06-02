'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const cards = stats
    ? [
        { label: 'Total Users',          value: stats.total_users,         icon: '👥' },
        { label: 'Newsletter Subscribers', value: stats.active_subscribers,  icon: '📰' },
        { label: 'Kundli Profiles',       value: stats.kundli_profiles,     icon: '🪐' },
        { label: 'Active Subscriptions',  value: stats.active_subscriptions, icon: '💳' },
        { label: 'Emails Sent',           value: stats.emails_sent,         icon: '📧' },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-1">Dashboard</h1>
      <p className="text-ivory/50 text-sm mb-8">Jyotish Stack AI overview</p>

      {!stats ? (
        <p className="text-ivory/40 text-sm animate-pulse">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {cards.map((c) => (
            <div key={c.label} className="admin-card text-center">
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-2xl font-bold text-gold">{c.value}</div>
              <div className="text-ivory/50 text-xs mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-card">
        <h2 className="text-gold font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['/users',        '👥', 'Manage Users'],
            ['/settings',     '⚙️', 'App Settings'],
            ['/email-blast',  '📧', 'Send Email'],
            ['/notifications','🔔', 'Send Notification'],
          ].map(([href, icon, label]) => (
            <Link key={href} href={href}
              className="border border-gold/20 rounded p-3 flex items-center gap-2 hover:border-gold/50 transition-colors text-sm text-ivory/70 hover:text-ivory">
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
