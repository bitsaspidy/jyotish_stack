'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/email-logs', { params: { page } })
      .then(({ data }) => { setLogs(data.logs); setTotal(Number(data.pagination.total)); })
      .catch(() => {});
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-6">Email Logs</h1>
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>{['To','Subject','Template','Status','Date'].map(h => (
              <th key={h} className="text-gold/70 text-xs uppercase tracking-wider pb-3 text-left font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="py-3 border-t border-white/5 text-ivory/80">{l.to_email}</td>
                <td className="py-3 border-t border-white/5 text-ivory/70 max-w-xs truncate">{l.subject}</td>
                <td className="py-3 border-t border-white/5">
                  <span className="text-xs bg-white/5 text-ivory/50 px-2 py-0.5 rounded">{l.template}</span>
                </td>
                <td className="py-3 border-t border-white/5">
                  <span className={l.status === 'sent' ? 'badge-active' : l.status === 'failed' ? 'badge-inactive' : 'badge-pending'}>
                    {l.status}
                  </span>
                </td>
                <td className="py-3 border-t border-white/5 text-ivory/50">{new Date(l.created_at).toLocaleString()}</td>
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
