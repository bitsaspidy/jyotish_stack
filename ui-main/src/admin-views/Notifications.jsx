'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchNotifs = () =>
    adminApi.get('/admin/notifications').then(({ data }) => setNotifs(data.notifications)).catch(() => {});

  useEffect(() => { fetchNotifs(); }, []);

  const onSend = async (data) => {
    setSending(true);
    try {
      await adminApi.post('/admin/notifications', {
        title: data.title, body: data.body, type: data.type, user_id: data.user_id || null,
      });
      toast.success('Notification sent');
      reset();
      fetchNotifs();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-6">Notifications</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="admin-card">
          <h2 className="text-ivory font-semibold mb-4">Send Notification</h2>
          <form onSubmit={handleSubmit(onSend)} className="space-y-3">
            <input className="admin-input" placeholder="Title" {...register('title', { required: true })} />
            <textarea className="admin-input h-24 resize-none" placeholder="Message body..." {...register('body', { required: true })} />
            <select className="admin-input" {...register('type')}>
              {['info','success','warning','promo','prediction'].map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
            <input className="admin-input" placeholder="User ID (blank = broadcast all)" {...register('user_id')} />
            <button type="submit" disabled={sending} className="admin-btn w-full">
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        <div className="admin-card">
          <h2 className="text-ivory font-semibold mb-4">Recent Notifications</h2>
          {notifs.length === 0 ? (
            <p className="text-ivory/40 text-sm">No notifications yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifs.map((n) => (
                <div key={n.id} className="border border-white/5 rounded p-3">
                  <div className="flex justify-between items-start">
                    <p className="text-ivory text-sm font-medium">{n.title}</p>
                    <span className="badge-pending text-xs ml-2">{n.type}</span>
                  </div>
                  <p className="text-ivory/50 text-xs mt-1">{n.body}</p>
                  <p className="text-ivory/30 text-xs mt-1">{n.user_id ? `User #${n.user_id}` : '📡 Broadcast'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
