'use strict';
/**
 * Page discovery — find pages that exist in the code but are not in the sitemap.
 *
 * In the App Router the filesystem IS the route table, so the honest way to answer
 * "what pages does this site have?" is to read it. That beats asking an admin to
 * type URLs: a typed URL can 404, and a page nobody remembers to type stays
 * invisible to Google forever.
 *
 * This reads ui-main's app directory from disk. Both the server and ui-main live
 * in the same repo checkout (/var/www/jyotish-stack), so the path resolves in
 * production and in dev. If it ever does not, discovery reports `found: false`
 * and the admin simply loses the suggestions — the sitemap itself is unaffected,
 * because it is built from the catalogue, not from this.
 *
 * CLASSIFICATION MATTERS MORE THAN DISCOVERY. A raw file listing would happily
 * suggest /admin, /login and /muhurat. The last one is the interesting case: it
 * is a real page file that only calls redirect(), and listing a redirect in a
 * sitemap earns a "Page with redirect" exclusion in Search Console. That was
 * caught by hand once; it is caught automatically here.
 */

const fs = require('node:fs');
const path = require('node:path');

/** Repo root → ui-main/src/app. server/src/services → ../../.. is the repo root. */
const APP_DIR = process.env.UI_MAIN_APP_DIR
  || path.resolve(__dirname, '..', '..', '..', 'ui-main', 'src', 'app');

/**
 * Paths never offered as sitemap candidates. Mirrors the disallow list in
 * ui-main/src/app/robots.js, plus the logged-in-user pages that robots does not
 * name but which have no business being indexed.
 */
const PRIVATE_PREFIXES = [
  '/admin', '/dashboard', '/kundli', '/predictions', '/api',
  '/login', '/register', '/forgot-password', '/reset-password', '/verify-email',
  '/set-password', '/account', '/remedy-resubmit',
];

const PAGE_FILE = /^page\.(jsx|js|tsx|ts)$/;

const isPrivate = (route) => PRIVATE_PREFIXES.some((p) => route === p || route.startsWith(`${p}/`));

/**
 * A page whose whole job is to redirect somewhere else.
 *
 * Deliberately conservative: it must import Next's redirect AND actually call it,
 * and the file must be small. A large page that happens to redirect on some
 * condition is a real page and stays a candidate.
 */
function isRedirectOnly(src) {
  const callsRedirect = /\bredirect\s*\(/.test(src);
  const importsRedirect = /from\s+['"]next\/navigation['"]/.test(src);
  return callsRedirect && importsRedirect && src.length < 800;
}

/**
 * Turn a directory path into a route.
 * Route groups — (marketing) — organise files without appearing in the URL.
 * Parallel/intercepted routes (@slot, (.)foo) are not routes we can list.
 */
function toRoute(segments) {
  const kept = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  if (kept.some((s) => s.startsWith('@'))) return null;
  return `/${kept.join('/')}`.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1') || '/';
}

function walk(dir, segments, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(path.join(dir, entry.name), [...segments, entry.name], out);
    } else if (PAGE_FILE.test(entry.name)) {
      const route = toRoute(segments);
      if (route) out.push({ route, file: path.join(dir, entry.name) });
    }
  }
}

/**
 * @returns {{found:boolean, appDir:string, pages:Array<{route,status,reason}>}}
 *   status: 'candidate' | 'dynamic' | 'private' | 'redirect'
 */
function discoverPages() {
  if (!fs.existsSync(APP_DIR)) {
    return { found: false, appDir: APP_DIR, pages: [] };
  }

  const raw = [];
  walk(APP_DIR, [], raw);

  const pages = raw.map(({ route, file }) => {
    if (isPrivate(route)) return { route, status: 'private', reason: 'Behind login or disallowed in robots.txt' };
    if (route.includes('[')) return { route, status: 'dynamic', reason: 'Dynamic route — its pages are listed from data, not as a fixed URL' };
    let src = '';
    try { src = fs.readFileSync(file, 'utf8'); } catch { /* unreadable → treat as a normal page */ }
    if (src && isRedirectOnly(src)) {
      return { route, status: 'redirect', reason: 'Redirects elsewhere — listing a redirect causes a "Page with redirect" exclusion' };
    }
    return { route, status: 'candidate', reason: 'Public page' };
  });

  // stable, de-duplicated output
  const seen = new Set();
  const unique = pages.filter((p) => (seen.has(p.route) ? false : seen.add(p.route)));
  unique.sort((a, b) => a.route.localeCompare(b.route));

  return { found: true, appDir: APP_DIR, pages: unique };
}

module.exports = { discoverPages, isRedirectOnly, isPrivate, toRoute, APP_DIR, PRIVATE_PREFIXES };
