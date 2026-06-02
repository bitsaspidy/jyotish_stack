import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './lib/api';
import Sidebar from './components/Sidebar';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Newsletter from './pages/Newsletter';
import Notifications from './pages/Notifications';
import EmailBlast from './pages/EmailBlast';
import Plans from './pages/Plans';
import EmailLogs from './pages/EmailLogs';

function Protected({ children, user }) {
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => {
        if (['admin', 'superadmin'].includes(data.user.role)) setAdmin(data.user);
        else { localStorage.removeItem('adminToken'); }
      })
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cosmos-800">
      <p className="text-gold animate-pulse">Loading...</p>
    </div>
  );

  if (location.pathname === '/login') return (
    <Routes>
      <Route path="/login" element={<AdminLogin setAdmin={setAdmin} />} />
    </Routes>
  );

  return (
    <div className="flex min-h-screen">
      <Protected user={admin}>
        <Sidebar admin={admin} setAdmin={setAdmin} />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/email-blast" element={<EmailBlast />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/email-logs" element={<EmailLogs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Protected>
    </div>
  );
}
