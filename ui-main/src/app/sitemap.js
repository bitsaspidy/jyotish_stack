import { SITE_URL, INTERNAL_API_URL } from '../lib/seo';
import { resolveRoutes, resolveBlogRoute, resolveExtraRoutes } from '../lib/seoRoutes';

/**
 * sitemap.xml — the route catalogue lives in lib/seoRoutes.js; the admin panel
 * stores only per-path overrides (enabled / priority / changeFrequency).
 *
 * Both fetches are guarded and revalidated hourly. If the API is down when this
 * builds, overrides come back empty and every catalogue route renders with its
 * default — a correct sitemap, just without the admin's tuning. That is precisely
 * why the catalogue is not stored in the database.
 */

async function fetchSitemapConfig() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/public/seo/sitemap-overrides`, { next: { revalidate: 3600 } });
    if (!res.ok) return { overrides: {}, extras: [] };
    const json = await res.json();
    const body = json?.data || json || {};
    return { overrides: body.overrides || {}, extras: body.extras || [] };
  } catch {
    return { overrides: {}, extras: [] };
  }
}

async function fetchBlogPosts() {
  try {
    // Dedicated slim endpoint — the paginated /blog caps at 24, which silently
    // dropped every post past the 24th from the sitemap.
    const res = await fetch(`${INTERNAL_API_URL}/api/public/blog-sitemap`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.posts || json?.posts || [];
    return posts.filter((p) => p.slug);
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const { overrides, extras } = await fetchSitemapConfig();

  // Catalogue routes + anything the admin added on top of it. resolveExtraRoutes
  // drops extras that the catalogue has since claimed, so a URL cannot appear
  // twice while a page is being promoted from "added in admin" to "in code".
  //
  // No lastModified on static routes: we do not track a real per-page modification
  // date, and stamping every page with `now` on every build tells Google all 37
  // pages changed at each deploy — which trains it to distrust and ignore our
  // <lastmod> everywhere, including the blog where the date IS real. Omitting it is
  // honest; Google handles its absence fine. Blog entries below carry updated_at.
  const staticEntries = [...resolveRoutes(overrides), ...resolveExtraRoutes(extras)]
    .filter((r) => r.enabled)
    .map((r) => ({
      url: `${SITE_URL}${r.path === '/' ? '' : r.path}`,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    }));

  const blogRoute = resolveBlogRoute(overrides);
  let blogEntries = [];
  if (blogRoute.enabled) {
    const posts = await fetchBlogPosts();
    blogEntries = posts.map((p) => {
      const lastmod = p.updated_at || p.published_at;
      return {
        url: `${SITE_URL}/blog/${p.slug}`,
        // Only a REAL date — a post with neither timestamp omits lastModified
        // rather than claiming it changed at build time.
        ...(lastmod ? { lastModified: new Date(lastmod) } : {}),
        changeFrequency: blogRoute.changeFrequency,
        priority: blogRoute.priority,
      };
    });
  }

  return [...staticEntries, ...blogEntries];
}
