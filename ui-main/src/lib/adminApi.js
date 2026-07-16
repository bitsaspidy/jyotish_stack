/**
 * Dedicated Axios instance for admin panel.
 * Reads adminToken / adminRefresh from localStorage — NOT the public accessToken.
 * On 401, redirects to /admin/login (not /login).
 */
import axios from 'axios';

// Axios defaults to timeout: 0 — wait forever, so a request that never settles
// leaves "Loading Kundli…" on screen permanently instead of reporting a failure.
// 120s matches Apache's ProxyTimeout: beyond that the proxy has already abandoned
// the upstream, so a longer wait cannot succeed — it only hides the error.
const adminApi = axios.create({ baseURL: '/api', withCredentials: true, timeout: 120000 });

// Attach admin token
adminApi.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Auto-refresh on 401
adminApi.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('adminRefresh') : null;
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
          localStorage.setItem('adminToken', data.accessToken);
          orig.headers.Authorization = `Bearer ${data.accessToken}`;
          return adminApi(orig);
        } catch {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefresh');
          if (typeof window !== 'undefined') window.location.href = '/admin/login';
        }
      } else {
        if (typeof window !== 'undefined') window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export default adminApi;
