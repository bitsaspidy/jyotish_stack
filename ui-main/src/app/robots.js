import { SITE_URL } from '../lib/seo';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin', '/admin/', '/dashboard', '/kundli', '/predictions',
          '/login', '/register', '/forgot-password', '/reset-password',
          '/verify-email', '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
