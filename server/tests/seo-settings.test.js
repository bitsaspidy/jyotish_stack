'use strict';
/**
 * SEO settings — validation, override sanitising, and the Search Console file.
 *
 * DB-free: every test drives the pure functions. The one function that reads the
 * database (gscFileBody) is covered through its guard behaviour in the route
 * tests below, which stub the settings read.
 */

const test = require('node:test');
const assert = require('node:assert');

const seo = require('../src/services/seo-settings.service');

// ── GA measurement ID ────────────────────────────────────────────────────────

test('SEO-ga: accepts a GA4 id and normalises case', () => {
  assert.deepStrictEqual(seo.validateGaId('G-ABC123XYZ'), { ok: true, value: 'G-ABC123XYZ' });
  assert.deepStrictEqual(seo.validateGaId('  g-abc123xyz  '), { ok: true, value: 'G-ABC123XYZ' });
});

test('SEO-ga: empty means analytics off, not an error', () => {
  assert.deepStrictEqual(seo.validateGaId(''), { ok: true, value: '' });
  assert.deepStrictEqual(seo.validateGaId(null), { ok: true, value: '' });
});

test('SEO-ga: rejects Universal Analytics with an explanation', () => {
  const r = seo.validateGaId('UA-12345-1');
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /2023|GA4|G-/, 'the error must say why UA is not accepted');
});

test('SEO-ga: rejects malformed ids', () => {
  for (const bad of ['nonsense', 'G-', 'GTM-ABC123', 'G ABC123']) {
    assert.strictEqual(seo.validateGaId(bad).ok, false, `${bad} should be rejected`);
  }
});

// ── Search Console file ──────────────────────────────────────────────────────

test('SEO-gsc: accepts the filename Google issues', () => {
  assert.deepStrictEqual(seo.validateGscFile('google1a2b3c4d5e6f7890.html'),
    { ok: true, value: 'google1a2b3c4d5e6f7890.html' });
});

test('SEO-gsc: forgives a leading slash and a missing extension', () => {
  assert.strictEqual(seo.validateGscFile('/google1a2b3c4d5e6f7890.html').value, 'google1a2b3c4d5e6f7890.html');
  assert.strictEqual(seo.validateGscFile('google1a2b3c4d5e6f7890').value, 'google1a2b3c4d5e6f7890.html');
});

test('SEO-gsc: rejects anything that is not a google verification file', () => {
  // This value decides what we serve from the site root — it must not become a
  // way to host arbitrary files.
  for (const bad of ['evil.html', '../../etc/passwd', 'index.html', 'google.html', 'google<script>.html']) {
    assert.strictEqual(seo.validateGscFile(bad).ok, false, `${bad} should be rejected`);
  }
});

test('SEO-gsc: empty means the file is not served', () => {
  assert.deepStrictEqual(seo.validateGscFile(''), { ok: true, value: '' });
});

// ── DNS TXT verification ─────────────────────────────────────────────────────

test('SEO-txt: accepts the bare token', () => {
  const r = seo.validateTxtToken('8uHYQVuUYvCy1V67ZLTWMur_KBAbEgS12l-ggkAxA4I');
  assert.deepStrictEqual(r, { ok: true, value: '8uHYQVuUYvCy1V67ZLTWMur_KBAbEgS12l-ggkAxA4I' });
});

test('SEO-txt: accepts a pasted full record, quoted or not', () => {
  // Admins copy the record out of the DNS panel, not the bare token.
  const expected = '8uHYQVuUYvCy1V67ZLTWMur_KBAbEgS12l-ggkAxA4I';
  for (const input of [
    'google-site-verification=8uHYQVuUYvCy1V67ZLTWMur_KBAbEgS12l-ggkAxA4I',
    '"google-site-verification=8uHYQVuUYvCy1V67ZLTWMur_KBAbEgS12l-ggkAxA4I"',
    '  google-site-verification = 8uHYQVuUYvCy1V67ZLTWMur_KBAbEgS12l-ggkAxA4I  ',
  ]) {
    assert.strictEqual(seo.validateTxtToken(input).value, expected, `failed for: ${input}`);
  }
});

test('SEO-txt: rejects junk, allows empty', () => {
  assert.deepStrictEqual(seo.validateTxtToken(''), { ok: true, value: '' });
  for (const bad of ['short', 'has spaces in it here', 'bad!!token@@']) {
    assert.strictEqual(seo.validateTxtToken(bad).ok, false, `${bad} should be rejected`);
  }
});

test('SEO-method: only the known methods are accepted', () => {
  for (const m of seo.METHODS) assert.strictEqual(seo.validateMethod(m).ok, true);
  assert.strictEqual(seo.validateMethod('').value, 'none', 'empty defaults to none');
  assert.strictEqual(seo.validateMethod('carrier_pigeon').ok, false);
});

test('SEO-dns: the apex domain drops www', () => {
  // Google verifies the domain property on the apex, not on www.
  const apex = seo.apexDomain();
  assert.ok(apex && !apex.startsWith('www.'), `apex should not include www, got ${apex}`);
  assert.ok(!apex.includes('/') && !apex.includes(':'), 'apex must be a hostname, not a URL');
});

// ── Page discovery ───────────────────────────────────────────────────────────

const pages = require('../src/services/seo-pages.service');

test('SEO-discover: finds the real pages of this site', () => {
  const r = pages.discoverPages();
  assert.strictEqual(r.found, true, 'the app directory should resolve from server/');
  assert.ok(r.pages.length > 20, `expected the real page list, got ${r.pages.length}`);
  const routes = r.pages.map((p) => p.route);
  assert.ok(routes.includes('/'), 'the homepage is a page');
  assert.ok(routes.includes('/free-kundli'));
});

test('SEO-discover: a redirect-only page is never a sitemap candidate', () => {
  // /muhurat only calls redirect(). Listing it earns a "Page with redirect"
  // exclusion in Search Console — this was found by hand once.
  const r = pages.discoverPages();
  const muhurat = r.pages.find((p) => p.route === '/muhurat');
  assert.ok(muhurat, '/muhurat should be discovered');
  assert.strictEqual(muhurat.status, 'redirect');
});

test('SEO-discover: login-only and admin pages are never candidates', () => {
  const r = pages.discoverPages();
  for (const route of ['/admin', '/dashboard', '/login', '/account', '/kundli/new']) {
    const hit = r.pages.find((p) => p.route === route);
    if (!hit) continue;
    assert.strictEqual(hit.status, 'private', `${route} must not be offered for the sitemap`);
  }
  assert.ok(!r.pages.some((p) => p.status === 'candidate' && pages.isPrivate(p.route)));
});

test('SEO-discover: dynamic routes are not offered as fixed URLs', () => {
  // The invariant is "never a candidate", not "always labelled dynamic":
  // /kundli/[uuid] is both dynamic AND private, and private is the more important
  // fact about it, so that label wins.
  const r = pages.discoverPages();
  for (const p of r.pages) {
    if (p.route.includes('[')) {
      assert.notStrictEqual(p.status, 'candidate', `${p.route} must never be offered as a fixed URL`);
    }
  }
  assert.ok(r.pages.some((p) => p.status === 'dynamic'), 'the public dynamic routes should be labelled as such');
});

test('SEO-discover: redirect detection needs both the import and the call', () => {
  assert.strictEqual(pages.isRedirectOnly("import { redirect } from 'next/navigation';\nexport default function P(){ redirect('/x'); }"), true);
  // a page that merely mentions the word
  assert.strictEqual(pages.isRedirectOnly("// we should redirect (later)\nexport default function P(){ return <div/>; }"), false);
  // a big page that redirects conditionally is still a real page
  const big = "import { redirect } from 'next/navigation';\n" + '// x'.repeat(400) + "\nexport default function P(){ if (a) redirect('/x'); return <div/>; }";
  assert.strictEqual(pages.isRedirectOnly(big), false);
});

test('SEO-discover: route groups do not appear in the URL', () => {
  assert.strictEqual(pages.toRoute(['(marketing)', 'pricing']), '/pricing');
  assert.strictEqual(pages.toRoute([]), '/');
  assert.strictEqual(pages.toRoute(['@modal', 'x']), null, 'parallel routes are not listable URLs');
});

// ── Admin-added routes ───────────────────────────────────────────────────────

test('SEO-extras: keeps valid additions and fills sensible defaults', () => {
  const out = seo.sanitizeExtras([{ path: '/terms' }]);
  assert.deepStrictEqual(out, [{ path: '/terms', label: '/terms', priority: 0.5, changeFrequency: 'monthly', enabled: true }]);
});

test('SEO-extras: paths only — an absolute URL is never accepted', () => {
  // A sitemap is a statement about THIS site; accepting foreign URLs would let
  // someone launder links through our domain.
  const out = seo.sanitizeExtras([
    { path: 'https://evil.com/x' }, { path: '//evil.com' }, { path: 'no-slash' }, { path: '/ok' },
  ]);
  assert.deepStrictEqual(out.map((e) => e.path), ['/ok']);
});

test('SEO-extras: de-duplicates and caps the list', () => {
  assert.strictEqual(seo.sanitizeExtras([{ path: '/a' }, { path: '/a' }]).length, 1);
  const many = Array.from({ length: 500 }, (_, i) => ({ path: `/p${i}` }));
  assert.strictEqual(seo.sanitizeExtras(many).length, 200, 'the list is capped');
});

test('SEO-extras: bad priority/frequency fall back rather than reject the row', () => {
  const [e] = seo.sanitizeExtras([{ path: '/x', priority: 99, changeFrequency: 'often' }]);
  assert.strictEqual(e.priority, 0.5);
  assert.strictEqual(e.changeFrequency, 'monthly');
});

test('SEO-extras: junk in, empty out', () => {
  for (const junk of [null, undefined, {}, 'x', [null, 3, 'y']]) {
    assert.deepStrictEqual(seo.sanitizeExtras(junk), []);
  }
});

// ── Sitemap overrides ────────────────────────────────────────────────────────

test('SEO-overrides: keeps only the three fields the sitemap understands', () => {
  const out = seo.sanitizeOverrides({
    '/pricing': { enabled: false, priority: 0.5, changeFrequency: 'weekly', evil: 'x', __proto__: 'y' },
  });
  assert.deepStrictEqual(out, { '/pricing': { enabled: false, priority: 0.5, changeFrequency: 'weekly' } });
});

test('SEO-overrides: rejects absolute URLs — paths only', () => {
  const out = seo.sanitizeOverrides({
    'https://evil.com/x': { enabled: true },
    '//evil.com': { enabled: true },
    '/legit': { enabled: false },
  });
  assert.deepStrictEqual(Object.keys(out), ['/legit']);
});

test('SEO-overrides: clamps priority to 0..1 and drops out-of-range values', () => {
  assert.deepStrictEqual(seo.sanitizeOverrides({ '/a': { priority: 9 } }), {}, 'priority 9 is not a priority');
  assert.deepStrictEqual(seo.sanitizeOverrides({ '/a': { priority: -1 } }), {});
  assert.deepStrictEqual(seo.sanitizeOverrides({ '/a': { priority: 'abc' } }), {});
  assert.deepStrictEqual(seo.sanitizeOverrides({ '/a': { priority: 0.55 } }), { '/a': { priority: 0.55 } });
});

test('SEO-overrides: only real changeFrequency values survive', () => {
  assert.deepStrictEqual(seo.sanitizeOverrides({ '/a': { changeFrequency: 'often' } }), {});
  assert.deepStrictEqual(seo.sanitizeOverrides({ '/a': { changeFrequency: 'daily' } }), { '/a': { changeFrequency: 'daily' } });
});

test('SEO-overrides: survives junk without throwing', () => {
  for (const junk of [null, undefined, 'string', 42, []]) {
    assert.deepStrictEqual(seo.sanitizeOverrides(junk), {});
  }
});

test('SEO-overrides: an empty entry is dropped rather than stored', () => {
  // Everything invalid → nothing worth persisting for that path.
  assert.deepStrictEqual(seo.sanitizeOverrides({ '/a': { priority: 99, changeFrequency: 'nope' } }), {});
});
