import axios from 'axios';

// Axios defaults to timeout: 0 — wait forever. With no timeout, a request that
// never settles leaves the caller's loading state stuck on screen permanently,
// which is indistinguishable from a frozen page and tells the user nothing.
//
// 120s matches Apache's ProxyTimeout: past that the proxy has already given up on
// the upstream, so waiting longer cannot succeed — it only hides the failure. Slow
// endpoints (PDF export, first-time chart calculation) still fit well inside it.
const TIMEOUT_MS = 120000;

const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: TIMEOUT_MS });

// Attach access token
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;

    // A timeout arrives with no `err.response`, so every caller's
    // `err.response?.data?.message` fallback would report whatever generic
    // message it has — usually "not found", which is both wrong and unhelpful.
    // Give the real reason instead.
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      err.response = {
        status: 504,
        data: { message: 'This is taking longer than expected. Please reload the page, and let us know if it keeps happening.' },
      };
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
          localStorage.setItem('accessToken', data.accessToken);
          orig.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(orig);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
