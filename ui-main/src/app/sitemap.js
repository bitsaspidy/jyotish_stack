import { SITE_URL, INTERNAL_API_URL } from '../lib/seo';

// Static public routes with crawl priority
const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/horoscope', priority: 0.9, changeFrequency: 'daily' },
  { path: '/panchang-muhurat', priority: 0.8, changeFrequency: 'daily' },
  { path: '/matchmaking', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/varshphal', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
];

async function fetchBlogPosts() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/public/blog?limit=1000`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.posts || json?.posts || [];
    return posts.filter((p) => p.slug);
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();
  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const posts = await fetchBlogPosts();
  const blogEntries = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at || p.published_at || now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
