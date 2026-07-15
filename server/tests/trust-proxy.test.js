'use strict';
/**
 * Reverse-proxy (trust proxy) behaviour.
 *
 * Apache terminates TLS and proxies to the app on 127.0.0.1. Without
 * `trust proxy`, req.ip was always the proxy (127.0.0.1), which silently broke
 * every rate limiter (one shared bucket for all users) and logged a useless IP.
 *
 * These tests pin the two properties that matter:
 *   1. the REAL client IP is resolved from the proxy's X-Forwarded-For, and
 *   2. a client-forged X-Forwarded-For CANNOT override it (would be true if the
 *      setting were `true` instead of `1`).
 *
 * Uses a small express app configured identically to src/index.js, driven over
 * real HTTP via node:http — no supertest dependency.
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

// Mirrors the production setting in src/index.js.
const TRUST_PROXY = 1;

function makeApp() {
  const app = express();
  app.set('trust proxy', TRUST_PROXY);
  app.get('/whoami', (req, res) => res.json({ ip: req.ip, ips: req.ips }));
  return app;
}

function get(port, headers) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/whoami', headers }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function withServer(fn) {
  const server = http.createServer(makeApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { return await fn(server.address().port); }
  finally { await new Promise((r) => server.close(r)); }
}

test('the real client IP is taken from the proxy-appended X-Forwarded-For', async () => {
  await withServer(async (port) => {
    // Apache (the loopback peer) forwards the real client as the only XFF entry
    const res = await get(port, { 'X-Forwarded-For': '203.0.113.7' });
    assert.strictEqual(res.ip, '203.0.113.7', 'req.ip must be the real client, not the proxy');
    assert.notStrictEqual(res.ip, '127.0.0.1', 'req.ip must no longer be the proxy address');
  });
});

test('a client-forged X-Forwarded-For cannot spoof req.ip', async () => {
  await withServer(async (port) => {
    // Attacker sends "1.2.3.4"; Apache APPENDS the real peer → "1.2.3.4, 203.0.113.7".
    // With one trusted hop, Express must take the right-most (real) entry.
    const res = await get(port, { 'X-Forwarded-For': '1.2.3.4, 203.0.113.7' });
    assert.strictEqual(res.ip, '203.0.113.7', 'must use the proxy-appended entry');
    assert.notStrictEqual(res.ip, '1.2.3.4', 'client-supplied left-most entry must NOT win');
  });
});

test('without a proxy header req.ip falls back to the socket peer', async () => {
  await withServer(async (port) => {
    const res = await get(port, {});
    assert.match(res.ip, /127\.0\.0\.1|::1|::ffff:127\.0\.0\.1/, 'direct request → socket peer');
  });
});

test('src/index.js sets trust proxy to 1 (never true — true is spoofable)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.match(src, /app\.set\(\s*['"]trust proxy['"]\s*,\s*1\s*\)/, "index.js must set trust proxy to 1");
  assert.doesNotMatch(src, /app\.set\(\s*['"]trust proxy['"]\s*,\s*true\s*\)/, "trust proxy must NOT be true");
});

test('no route reads a raw X-Forwarded-For for identity (spoofable)', () => {
  const routesDir = path.join(__dirname, '..', 'src', 'routes');
  const offenders = [];
  for (const f of fs.readdirSync(routesDir).filter((n) => n.endsWith('.js'))) {
    const content = fs.readFileSync(path.join(routesDir, f), 'utf8');
    // allow the word in comments; flag actual header reads
    if (/req\.headers\s*\[\s*['"]x-forwarded-for['"]\s*\]/i.test(content)) offenders.push(f);
  }
  assert.deepStrictEqual(offenders, [], `routes must use req.ip, not raw X-Forwarded-For: ${offenders.join(', ')}`);
});
