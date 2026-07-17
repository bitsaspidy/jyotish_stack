import { SIGNS } from './rashiSigns';

/**
 * The canonical catalogue of public routes that belong in the sitemap.
 *
 * SINGLE SOURCE. Both app/sitemap.js and the admin SEO settings screen import this
 * file — they both live in ui-main, so there is no second copy to drift. The
 * database stores only per-path OVERRIDES (enabled / priority / changeFrequency),
 * never the list itself. Two consequences worth keeping:
 *
 *   1. A page added in code shows up here and in the sitemap automatically; the
 *      admin decides how it is crawled, not whether it exists.
 *   2. If the settings API is unreachable when the sitemap builds, these defaults
 *      still produce a CORRECT sitemap instead of an empty one.
 *
 * Only user-accessible pages go here. Anything behind auth (/dashboard, /kundli,
 * /admin) is disallowed in robots.js and must never be listed.
 */

export const CHANGE_FREQUENCIES = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export const ROUTE_GROUPS = {
  core: 'Core',
  kundli: 'Kundli & Calculators',
  horoscope: 'Horoscope',
  panchang: 'Panchang & Muhurat',
  content: 'Content',
  legal: 'Legal',
};

export const SITEMAP_ROUTES = [
  // ── Core ────────────────────────────────────────────────────────────────
  { path: '/', label: 'Home', group: 'core', priority: 1.0, changeFrequency: 'daily' },
  { path: '/pricing', label: 'Pricing', group: 'core', priority: 0.9, changeFrequency: 'weekly' },

  // ── Kundli & calculators ────────────────────────────────────────────────
  { path: '/free-kundli', label: 'Free Kundli', group: 'kundli', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/calculators', label: 'Calculators hub', group: 'kundli', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/calculators/mangal-dosha', label: 'Mangal Dosha', group: 'kundli', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/calculators/sade-sati', label: 'Sade Sati', group: 'kundli', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/calculators/mahadasha', label: 'Mahadasha', group: 'kundli', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/calculators/kundli-milan', label: 'Kundli Milan', group: 'kundli', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/matchmaking', label: 'Matchmaking', group: 'kundli', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/varshphal', label: 'Varshphal', group: 'kundli', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/prashna', label: 'Prashna', group: 'kundli', priority: 0.85, changeFrequency: 'monthly' },

  // ── Horoscope ───────────────────────────────────────────────────────────
  { path: '/horoscope', label: 'Daily horoscope', group: 'horoscope', priority: 0.9, changeFrequency: 'daily' },
  { path: '/horoscope/weekly', label: 'Weekly horoscope', group: 'horoscope', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/horoscope/monthly', label: 'Monthly horoscope', group: 'horoscope', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/horoscope/yearly', label: 'Yearly horoscope', group: 'horoscope', priority: 0.7, changeFrequency: 'monthly' },
  // Per-sign daily landing pages
  ...SIGNS.map((s) => ({
    path: `/horoscope/${s.slug}`,
    label: `${s.en} horoscope`,
    group: 'horoscope',
    priority: 0.85,
    changeFrequency: 'daily',
  })),

  // ── Panchang & muhurat ──────────────────────────────────────────────────
  { path: '/panchang-muhurat', label: 'Panchang & Muhurat', group: 'panchang', priority: 0.8, changeFrequency: 'daily' },
  { path: '/festivals', label: 'Festival calendar', group: 'panchang', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/planetary-positions', label: 'Planetary positions', group: 'panchang', priority: 0.8, changeFrequency: 'daily' },
  // NOTE: /muhurat is deliberately absent. It is not a page — it redirects to
  // /muhurat/marriage. Listing a redirect in a sitemap earns a "Page with
  // redirect" exclusion in Search Console, so the destination is listed instead.
  { path: '/muhurat/marriage', label: 'Marriage muhurat', group: 'panchang', priority: 0.75, changeFrequency: 'weekly' },
  { path: '/muhurat/griha-pravesh', label: 'Griha Pravesh muhurat', group: 'panchang', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/muhurat/naamkaran', label: 'Naamkaran muhurat', group: 'panchang', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/muhurat/mundan', label: 'Mundan muhurat', group: 'panchang', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/muhurat/vehicle-purchase', label: 'Vehicle purchase muhurat', group: 'panchang', priority: 0.7, changeFrequency: 'weekly' },

  // ── Content ─────────────────────────────────────────────────────────────
  { path: '/remedies', label: 'Remedies', group: 'content', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog', label: 'Blog index', group: 'content', priority: 0.8, changeFrequency: 'daily' },
];

/**
 * Blog posts are not in the catalogue — they are rows, not routes. The admin
 * controls them as one group via this pseudo-entry; individual posts are managed
 * in the blog admin, not here.
 */
export const BLOG_POSTS_ROUTE = {
  path: '/blog/*',
  label: 'Blog posts (all published)',
  group: 'content',
  priority: 0.6,
  changeFrequency: 'weekly',
};

/**
 * Merge the catalogue with admin overrides.
 * @param {object} overrides { [path]: { enabled?, priority?, changeFrequency? } }
 * @returns {Array} routes with `enabled` resolved — default is enabled
 */
export function resolveRoutes(overrides = {}) {
  return SITEMAP_ROUTES.map((r) => {
    const o = overrides?.[r.path] || {};
    return {
      ...r,
      enabled: o.enabled !== false, // absent override = listed
      priority: o.priority ?? r.priority,
      changeFrequency: o.changeFrequency ?? r.changeFrequency,
      overridden: Object.keys(o).length > 0,
    };
  });
}

export function resolveBlogRoute(overrides = {}) {
  const o = overrides?.[BLOG_POSTS_ROUTE.path] || {};
  return {
    ...BLOG_POSTS_ROUTE,
    enabled: o.enabled !== false,
    priority: o.priority ?? BLOG_POSTS_ROUTE.priority,
    changeFrequency: o.changeFrequency ?? BLOG_POSTS_ROUTE.changeFrequency,
    overridden: Object.keys(o).length > 0,
  };
}
