'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => {
        if (['admin', 'superadmin'].includes(data.user.role)) setAdmin(data.user);
        else localStorage.removeItem('adminToken');
      })
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setLoading(false));
  }, []);

  const loginAdmin = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!['admin', 'superadmin'].includes(data.user.role)) throw new Error('Access denied');
    localStorage.setItem('adminToken', data.accessToken);
    localStorage.setItem('adminRefresh', data.refreshToken);
    setAdmin(data.user);
    return data.user;
  };

  const logoutAdmin = async () => {
    await api.post('/auth/logout', { refreshToken: localStorage.getItem('adminRefresh') }).catch(() => {});
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
