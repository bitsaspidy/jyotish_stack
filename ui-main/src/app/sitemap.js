import { SITE_URL, INTERNAL_API_URL } from '../lib/seo';
import { resolveRoutes, resolveBlogRoute } from '../lib/seoRoutes';

/**
 * sitemap.xml — the route catalogue lives in lib/seoRoutes.js; the admin panel
 * stores only per-path overrides (enabled / priority / changeFrequency).
 *
 * Both fetches are guarded and revalidated hourly. If the API is down when this
 * builds, overrides come back empty and every catalogue route renders with its
 * default — a correct sitemap, just without the admin's tuning. That is precisely
 * why the catalogue is not stored in the database.
 */

async function fetchOverrides() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/public/seo/sitemap-overrides`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.overrides || json?.overrides || {};
  } catch {
    return {};
  }
}

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
  const overrides = await fetchOverrides();

  const staticEntries = resolveRoutes(overrides)
    .filter((r) => r.enabled)
    .map((r) => ({
      url: `${SITE_URL}${r.path === '/' ? '' : r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    }));

  const blogRoute = resolveBlogRoute(overrides);
  let blogEntries = [];
  if (blogRoute.enabled) {
    const posts = await fetchBlogPosts();
    blogEntries = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updated_at || p.published_at || now,
      changeFrequency: blogRoute.changeFrequency,
      priority: blogRoute.priority,
    }));
  }

  return [...staticEntries, ...blogEntries];
}
