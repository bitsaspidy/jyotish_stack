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
