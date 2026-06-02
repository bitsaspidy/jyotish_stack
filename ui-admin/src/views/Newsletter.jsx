'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Newsletter() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/newsletter', { params: { page } })
      .then(({ data }) => { setSubs(data.subscribers); setTotal(Number(data.pagination.total)); })
      .catch(() => {});
  }, [page]);

  const handleBlast = async () => {
    const subject = window.prompt('Email Subject:');
    const body = window.prompt('Email Body (HTML):');
    if (!subject || !body) return;
    try {
      const { data } = await api.post('/admin/newsletter/blast', { subject, body });
      toast.success(data.message);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gold">Newsletter</h1>
          <p className="text-ivory/50 text-sm">{total} total subscribers</p>
        </div>
        <button onClick={handleBlast} className="admin-btn">Send Newsletter</button>
      </div>

      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>{['Email','Name','Language','Status','Subscribed'].map(h => (
              <th key={h} className="text-gold/70 text-xs uppercase tracking-wider pb-3 text-left font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="py-3 border-t border-white/5">{s.email}</td>
                <td className="py-3 border-t border-white/5 text-ivory/70">{s.name || '—'}</td>
                <td className="py-3 border-t border-white/5 uppercase text-xs">{s.preferred_language}</td>
                <td className="py-3 border-t border-white/5">
                  <span className={s.is_active ? 'badge-active' : 'badge-inactive'}>{s.is_active ? 'Active' : 'Unsubscribed'}</span>
                </td>
                <td className="py-3 border-t border-white/5 text-ivory/50">{new Date(s.subscribed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2 mt-4 justify-end">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="admin-btn-outline text-xs px-3 py-1 disabled:opacity-30">←</button>
          <span className="text-ivory/50 text-xs self-center">Page {page} / {Math.ceil(total / 20) || 1}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="admin-btn-outline text-xs px-3 py-1 disabled:opacity-30">→</button>
        </div>
      </div>
    </div>
  );
}
