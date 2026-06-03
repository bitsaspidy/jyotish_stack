'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import { predictionHref } from '../lib/kundliLinks';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [kundlis, setKundlis] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    api.get('/kundli').then(({ data }) => setKundlis(data.profiles || [])).catch(() => {});
    api.get('/users/notifications').then(({ data }) => setNotifications(data.notifications?.slice(0, 5) || [])).catch(() => {});
  }, [user]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin-slow text-4xl">🪐</div>
    </div>
  );

  const latestKundliUuid = kundlis[0]?.uuid || '';
  const cards = [
    { icon: '🪐', label: lang === 'hi' ? 'कुंडली' : 'My Kundlis', value: kundlis.length, href: '/kundli' },
    { icon: '💫', label: lang === 'hi' ? 'भविष्यवाणी' : 'Predictions', value: '—', href: predictionHref(latestKundliUuid) },
    { icon: '🔔', label: lang === 'hi' ? 'सूचनाएं' : 'Notifications', value: notifications.filter(n => !n.is_read).length, href: '#' },
    { icon: '💍', label: lang === 'hi' ? 'मिलान' : 'Matchmaking', value: '—', href: '/matchmaking' },
  ];

  return (
    <div className="relative min-h-screen pt-24 px-6 pb-20">
      <StarField count={80} />
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-gradient-gold font-bold">
            {lang === 'hi' ? `नमस्ते, ${user.name.split(' ')[0]}` : `Namaste, ${user.name.split(' ')[0]}`} 🙏
          </h1>
          <p className="text-ivory/50 mt-2">{lang === 'hi' ? 'आपका ब्रह्मांडीय नियंत्रण कक्ष' : 'Your cosmic command centre'}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {cards.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={c.href} className="card-royal p-5 flex flex-col items-center text-center group block">
                <span className="text-3xl mb-2">{c.icon}</span>
                <span className="text-2xl font-bold text-gradient-gold">{c.value}</span>
                <span className="text-ivory/60 text-xs mt-1 group-hover:text-gold transition-colors">{c.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kundlis */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-gold text-xl">{lang === 'hi' ? 'मेरी कुंडलियां' : 'My Kundlis'}</h2>
              <Link href="/kundli/new" className="btn-outline-gold text-xs px-4 py-2">
                + {lang === 'hi' ? 'नई कुंडली' : 'New Kundli'}
              </Link>
            </div>
            {kundlis.length === 0 ? (
              <div className="card-royal p-10 text-center">
                <p className="text-5xl mb-4">🪐</p>
                <p className="text-ivory/60 mb-4">{lang === 'hi' ? 'कोई कुंडली नहीं बनाई गई' : 'No Kundli created yet'}</p>
                <Link href="/kundli/new" className="btn-gold px-6 py-2 inline-block">
                  {lang === 'hi' ? 'पहली कुंडली बनाएं' : 'Create First Kundli'}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {kundlis.map((k) => (
                  <Link href={`/kundli/${k.uuid}`} key={k.id} className="card-royal p-4 flex items-center gap-4 group block">
                    <span className="text-2xl">🪐</span>
                    <div className="flex-1">
                      <p className="text-ivory font-medium group-hover:text-gold transition-colors">{k.name}</p>
                      <p className="text-ivory/50 text-xs">{k.date_of_birth} · {k.place_of_birth}</p>
                    </div>
                    <span className="text-gold/40 group-hover:text-gold text-lg">→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div>
            <h2 className="font-serif text-gold text-xl mb-4">{lang === 'hi' ? 'सूचनाएं' : 'Notifications'}</h2>
            {notifications.length === 0 ? (
              <div className="card-royal p-6 text-center text-ivory/40 text-sm">
                {lang === 'hi' ? 'कोई सूचना नहीं' : 'No notifications'}
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`card-royal p-4 ${!n.is_read ? 'border-gold/40' : ''}`}>
                    <p className="text-ivory text-sm font-medium">{n.title}</p>
                    <p className="text-ivory/50 text-xs mt-1 line-clamp-2">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
