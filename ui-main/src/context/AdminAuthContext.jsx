'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import adminApi from '../lib/adminApi';   // ← uses adminToken, not accessToken

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin,   setAdmin]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }

    // Verify token is still valid + user is still admin/superadmin
    adminApi.get('/auth/me')
      .then(({ data }) => {
        if (['admin', 'superadmin'].includes(data.user?.role)) {
          setAdmin(data.user);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefresh');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefresh');
      })
      .finally(() => setLoading(false));
  }, []);

  const loginAdmin = async (email, password) => {
    // Login itself needs no auth header
    const { data } = await adminApi.post('/auth/login', { email, password });
    if (!['admin', 'superadmin'].includes(data.user?.role)) {
      throw new Error('Access denied — not an admin account');
    }
    localStorage.setItem('adminToken',   data.accessToken);
    localStorage.setItem('adminRefresh', data.refreshToken);
    setAdmin(data.user);
    return data.user;
  };

  const logoutAdmin = async () => {
    try {
      await adminApi.post('/auth/logout', { refreshToken: localStorage.getItem('adminRefresh') });
    } catch { /* ignore */ }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefresh');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, setAdmin, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
