'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function EmailBlast() {
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, watch, reset } = useForm({ defaultValues: { target: 'all' } });

  const onSubmit = async (data) => {
    setSending(true);
    try {
      const payload = { subject: data.subject, body: data.body };
      if (data.target === 'all') payload.all_users = true;
      else payload.user_ids = data.user_ids.split(',').map(id => id.trim()).filter(Boolean);
      const { data: res } = await api.post('/admin/send-email', payload);
      toast.success(res.message);
      reset();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-6">Email Blast</h1>
      <div className="admin-card max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-ivory/60 text-xs mb-1 block">Recipients</label>
            <select className="admin-input" {...register('target')}>
              <option value="all">All Active Users</option>
              <option value="specific">Specific User IDs</option>
            </select>
          </div>
          {watch('target') === 'specific' && (
            <div>
              <label className="text-ivory/60 text-xs mb-1 block">User IDs (comma separated)</label>
              <input className="admin-input" placeholder="1, 2, 3..." {...register('user_ids')} />
            </div>
          )}
          <div>
            <label className="text-ivory/60 text-xs mb-1 block">Subject</label>
            <input className="admin-input" placeholder="Email subject..." {...register('subject', { required: true })} />
          </div>
          <div>
            <label className="text-ivory/60 text-xs mb-1 block">Body (HTML)</label>
            <textarea className="admin-input h-48 resize-none font-mono text-xs" placeholder="<p>Your content...</p>" {...register('body', { required: true })} />
          </div>
          <button type="submit" disabled={sending} className="admin-btn px-8 py-3">
            {sending ? 'Queueing...' : 'Send Email'}
          </button>
        </form>
      </div>
    </div>
  );
}
