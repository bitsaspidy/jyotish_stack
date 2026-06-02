'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/users', { params: { page, search, limit } });
      setUsers(data.users);
      setTotal(Number(data.pagination.total));
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const toggleActive = async (id, current) => {
    try {
      await adminApi.patch(`/admin/users/${id}/toggle-active`);
      toast.success(current ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gold">Users</h1>
          <p className="text-ivory/50 text-sm">{total} total users</p>
        </div>
      </div>

      <div className="admin-card mb-4">
        <input className="admin-input max-w-xs" placeholder="Search name or email..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="admin-card overflow-x-auto">
        {loading ? <p className="text-ivory/40 text-sm py-4">Loading...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Name','Email','Role','Status','Joined','Action'].map(h => (
                  <th key={h} className="text-gold/70 text-xs uppercase tracking-wider pb-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 border-t border-white/5 text-ivory">{u.name}</td>
                  <td className="py-3 border-t border-white/5 text-ivory/70">{u.email}</td>
                  <td className="py-3 border-t border-white/5">
                    <span className="text-xs bg-indigo-dark/30 text-indigo-light px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                  </td>
                  <td className="py-3 border-t border-white/5">
                    <span className={u.is_active ? 'badge-active' : 'badge-inactive'}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="py-3 border-t border-white/5 text-ivory/50">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3 border-t border-white/5">
                    {u.role !== 'superadmin' && (
                      <button onClick={() => toggleActive(u.id, u.is_active)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${u.is_active ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'}`}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex gap-2 mt-4 justify-end">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="admin-btn-outline text-xs px-3 py-1 disabled:opacity-30">←</button>
          <span className="text-ivory/50 text-xs self-center">Page {page} / {Math.ceil(total / limit) || 1}</span>
          <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="admin-btn-outline text-xs px-3 py-1 disabled:opacity-30">→</button>
        </div>
      </div>
    </div>
  );
}
