import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function AdminLogin({ setAdmin }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (!['admin', 'superadmin'].includes(data.user.role)) {
        toast.error('Access denied — admin only');
        return;
      }
      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('adminRefresh', data.refreshToken);
      setAdmin(data.user);
      toast.success(`Welcome, ${data.user.name}`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmos-800 flex items-center justify-center px-4">
      <div className="bg-cosmos-700 border border-gold/20 rounded p-10 w-full max-w-sm">
        <h1 className="text-gold font-bold text-2xl mb-1">🪐 Admin</h1>
        <p className="text-ivory/50 text-sm mb-8">Jyotish Stack AI Control Panel</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="email" placeholder="Admin email" className="admin-input" {...register('email', { required: true })} />
          <input type="password" placeholder="Password" className="admin-input" {...register('password', { required: true })} />
          <button type="submit" disabled={loading} className="admin-btn w-full py-3">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
