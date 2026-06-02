'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const fetch = () => api.get('/admin/plans').then(({ data }) => setPlans(data.plans)).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const toggle = async (id, current) => {
    await api.patch(`/admin/plans/${id}`, { is_active: !current });
    toast.success('Plan updated');
    fetch();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-6">Subscription Plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
          return (
            <div key={p.id} className="admin-card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-ivory font-semibold">{p.name}</h3>
                <span className={p.is_active ? 'badge-active' : 'badge-inactive'}>{p.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-gold text-2xl font-bold mb-1">₹{p.price}</p>
              <p className="text-ivory/50 text-xs mb-3">{p.duration_days} days</p>
              <ul className="text-xs text-ivory/60 space-y-1 mb-4">
                {features.map((f, i) => <li key={i}>✦ {f}</li>)}
              </ul>
              <button onClick={() => toggle(p.id, p.is_active)}
                className={`${p.is_active ? 'admin-btn-danger' : 'admin-btn'} text-xs w-full`}>
                {p.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
