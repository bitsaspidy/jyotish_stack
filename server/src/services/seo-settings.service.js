'use strict';
/**
 * SEO settings — Google Analytics, Search Console verification, sitemap overrides.
 *
 * Stored in `app_settings` (key/value TEXT), so NO migration is needed. Values are
 * read through a short cache and invalidated on write, matching the pattern
 * email.service.js already uses for signatures.
 *
 * WHY THESE LIVE IN THE DB AND NOT IN .env
 * `NEXT_PUBLIC_*` vars are inlined at BUILD time, so changing the GA id or the
 * verification token used to mean a rebuild + redeploy. Reading them at runtime is
 * the whole point of putting them in the admin panel.
 *
 * SITEMAP: the DB holds OVERRIDES ONLY, never the route list. The catalogue lives
 * in ui-main/src/lib/seoRoutes.js, which both the sitemap and the admin UI import.
 * That way a new page added in code appears automatically, and if this API is
 * unreachable when the sitemap builds, the defaults still render a correct sitemap
 * instead of an empty one.
 */

const db = require('../config/db');

const KEYS = {
  ga: 'seo_ga_measurement_id',
  gsc: 'seo_gsc_file',
  overrides: 'seo_sitemap_overrides',
};

const CACHE_MS = 60 * 1000;
let cache = null;
let cachedAt = 0;

/** GA4 measurement id — G-XXXXXXXXXX. UA-* is dead (sunset 2023) and is rejected. */
const GA_RE = /^G-[A-Z0-9]{4,20}$/;
/** Google's verification file, e.g. google1a2b3c4d5e6f7890.html */
const GSC_RE = /^google[a-z0-9]{8,40}\.html$/;

function validateGaId(value) {
  const v = String(value || '').trim();
  if (!v) return { ok: true, value: '' }; // empty = analytics off
  if (/^UA-/i.test(v)) return { ok: false, error: 'Universal Analytics (UA-) was shut down in 2023. Use a GA4 id that starts with G-.' };
  if (!GA_RE.test(v.toUpperCase())) return { ok: false, error: 'Measurement ID must look like G-XXXXXXXXXX.' };
  return { ok: true, value: v.toUpperCase() };
}

function validateGscFile(value) {
  let v = String(value || '').trim();
  if (!v) return { ok: true, value: '' }; // empty = verification file not served
  v = v.replace(/^\/+/, '').toLowerCase();
  if (!v.endsWith('.html')) v += '.html';
  if (!GSC_RE.test(v)) return { ok: false, error: 'Expected the filename Google gave you, e.g. google1a2b3c4d5e6f7890.html' };
  return { ok: true, value: v };
}

/**
 * Overrides are keyed by path and may only carry the three fields the sitemap
 * understands. Anything else is dropped rather than stored — an override file is
 * not a place for arbitrary admin input to accumulate.
 */
function sanitizeOverrides(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [path, cfg] of Object.entries(raw)) {
    if (!/^\/[A-Za-z0-9\-/_]*$/.test(path)) continue; // paths only, never URLs
    if (!cfg || typeof cfg !== 'object') continue;
    const entry = {};
    if (typeof cfg.enabled === 'boolean') entry.enabled = cfg.enabled;
    if (cfg.priority !== undefined && cfg.priority !== null && cfg.priority !== '') {
      const p = Number(cfg.priority);
      if (Number.isFinite(p) && p >= 0 && p <= 1) entry.priority = Math.round(p * 100) / 100;
    }
    if (typeof cfg.changeFrequency === 'string'
      && ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].includes(cfg.changeFrequency)) {
      entry.changeFrequency = cfg.changeFrequency;
    }
    if (Object.keys(entry).length) out[path] = entry;
  }
  return out;
}

function parseOverrides(value) {
  if (!value) return {};
  try {
    return sanitizeOverrides(JSON.parse(value));
  } catch {
    // A hand-edited row should degrade to "no overrides", never break the sitemap.
    return {};
  }
}

async function getSeoSettings({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cachedAt < CACHE_MS) return cache;
  const rows = await db('app_settings').whereIn('key', Object.values(KEYS)).select('key', 'value');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  cache = {
    gaMeasurementId: map[KEYS.ga] || '',
    gscFile: map[KEYS.gsc] || '',
    sitemapOverrides: parseOverrides(map[KEYS.overrides]),
  };
  cachedAt = Date.now();
  return cache;
}

function invalidate() { cache = null; cachedAt = 0; }

async function saveSeoSettings(updates = {}) {
  const errors = [];
  const writes = [];

  if ('gaMeasurementId' in updates) {
    const r = validateGaId(updates.gaMeasurementId);
    if (!r.ok) errors.push(r.error);
    else writes.push([KEYS.ga, r.value, 'GA4 measurement ID (empty = analytics disabled)']);
  }
  if ('gscFile' in updates) {
    const r = validateGscFile(updates.gscFile);
    if (!r.ok) errors.push(r.error);
    else writes.push([KEYS.gsc, r.value, 'Google Search Console HTML verification filename']);
  }
  if ('sitemapOverrides' in updates) {
    writes.push([KEYS.overrides, JSON.stringify(sanitizeOverrides(updates.sitemapOverrides)), 'Per-route sitemap overrides']);
  }

  if (errors.length) return { ok: false, errors };

  for (const [key, value, description] of writes) {
    await db('app_settings')
      .insert({ key, value: String(value ?? ''), description })
      .onConflict('key')
      .merge({ value: String(value ?? '') });
  }
  invalidate();
  return { ok: true, settings: await getSeoSettings({ fresh: true }) };
}

/**
 * The body Google expects inside the verification file: the filename itself.
 * Returns null when the requested name is not the configured one — an attacker
 * must not be able to have us serve an arbitrary verification token.
 */
async function gscFileBody(requestedFile) {
  const { gscFile } = await getSeoSettings();
  if (!gscFile) return null;
  const asked = String(requestedFile || '').replace(/^\/+/, '').toLowerCase();
  if (asked !== gscFile) return null;
  return `google-site-verification: ${gscFile}`;
}

module.exports = {
  getSeoSettings,
  saveSeoSettings,
  gscFileBody,
  invalidate,
  validateGaId,
  validateGscFile,
  sanitizeOverrides,
  KEYS,
};
