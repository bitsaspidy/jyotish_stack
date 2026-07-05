const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');

test('production deployment builds separately and preserves previous static chunks', () => {
  const deploy = fs.readFileSync(path.join(ROOT, 'deploy.sh'), 'utf8');
  const nextConfig = fs.readFileSync(path.join(ROOT, 'ui-main/next.config.js'), 'utf8');

  assert.match(nextConfig, /distDir:\s*process\.env\.NEXT_DIST_DIR/);
  assert.match(deploy, /NEXT_DIST_DIR="\$NEXT_RELEASE_DIR"/);
  assert.match(deploy, /cp -a -n "\$UI_DIR\/\.next\/static\/\."/);
  assert.match(deploy, /mv "\$UI_DIR\/\$NEXT_RELEASE_DIR" "\$UI_DIR\/\.next"/);
});

test('service worker rejects failed or HTML responses for static assets', () => {
  const serviceWorker = fs.readFileSync(path.join(ROOT, 'ui-main/public/sw.js'), 'utf8');

  assert.match(serviceWorker, /const CACHE = 'js-static-v2'/);
  assert.match(serviceWorker, /!response\.ok/);
  assert.match(serviceWorker, /path\.endsWith\('\.js'\).*contentType\.includes\('javascript'\)/s);
  assert.match(serviceWorker, /!contentType\.includes\('text\/html'\)/);
});

test('chunk failure recovery recognizes deployment-related browser errors', async () => {
  const recovery = await import(pathToFileURL(path.join(ROOT, 'ui-main/src/lib/chunkRecovery.mjs')).href);

  assert.equal(recovery.isChunkLoadFailure(new Error('Loading chunk 1250 failed.')), true);
  assert.equal(recovery.isChunkLoadFailure({ reason: new Error('ChunkLoadError: missing page chunk') }), true);
  assert.equal(recovery.isChunkLoadFailure(new Error('Regular API request failed')), false);
  assert.equal(recovery.shouldAttemptChunkReload(0, 100_000), true);
  assert.equal(recovery.shouldAttemptChunkReload(90_000, 100_000), false);
  assert.equal(recovery.shouldAttemptChunkReload(1, 100_000), true);
});
