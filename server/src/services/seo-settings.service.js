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

const dns = require('node:dns').promises;
const db = require('../config/db');
const { SITE_URL } = require('../config/seo-site');

const KEYS = {
  ga: 'seo_ga_measurement_id',
  gsc: 'seo_gsc_file',
  method: 'seo_gsc_method',
  txt: 'seo_gsc_txt_token',
  overrides: 'seo_sitemap_overrides',
  extras: 'seo_sitemap_extra_routes',
};

/** Sanity ceiling — a sitemap addition list is not a bulk URL importer. */
const MAX_EXTRA_ROUTES = 200;

/**
 * How the site proves ownership to Google.
 *
 * `dns_txt` is a DOMAIN-property verification done entirely at the registrar —
 * the app serves nothing for it and cannot make it work or break it. It is
 * recorded here so the method is documented rather than tribal knowledge, and so
 * the admin can check the record is still live: a TXT record quietly removed
 * during a DNS migration un-verifies the property without any warning from
 * Google, and nothing else in this system would notice.
 */
const METHODS = ['none', 'dns_txt', 'html_file'];

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

/**
 * Google's domain-property TXT token. The record itself reads
 * `google-site-verification=<token>`; admins paste either the whole record or
 * just the token, so both are accepted and reduced to the token.
 */
const TXT_TOKEN_RE = /^[A-Za-z0-9_-]{20,100}$/;

function validateTxtToken(value) {
  let v = String(value || '').trim();
  if (!v) return { ok: true, value: '' };
  // accept a pasted full record, quoted or not
  v = v.replace(/^["']|["']$/g, '').trim();
  const m = /^google-site-verification\s*=\s*(.+)$/i.exec(v);
  if (m) v = m[1].trim().replace(/^["']|["']$/g, '');
  if (!TXT_TOKEN_RE.test(v)) {
    return { ok: false, error: 'Expected the token from your google-site-verification TXT record (letters, numbers, - and _).' };
  }
  return { ok: true, value: v };
}

function validateMethod(value) {
  const v = String(value || '').trim();
  if (!v) return { ok: true, value: 'none' };
  if (!METHODS.includes(v)) return { ok: false, error: `Verification method must be one of: ${METHODS.join(', ')}.` };
  return { ok: true, value: v };
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

/**
 * Routes the admin has added on top of the code catalogue — normally pages that
 * were built after the catalogue was last edited, added from the "new pages
 * detected" list.
 *
 * Same rule as overrides: paths only, never absolute URLs. A sitemap is a
 * statement about THIS site, so letting an admin paste someone else's URL in is
 * both wrong and a way to launder links through our domain's reputation.
 */
function sanitizeExtras(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw.slice(0, MAX_EXTRA_ROUTES)) {
    if (!item || typeof item !== 'object') continue;
    const p = String(item.path || '').trim();
    if (!/^\/[A-Za-z0-9\-/_]*$/.test(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);

    const priority = Number(item.priority);
    const entry = {
      path: p,
      label: String(item.label || p).trim().slice(0, 80),
      priority: Number.isFinite(priority) && priority >= 0 && priority <= 1 ? Math.round(priority * 100) / 100 : 0.5,
      changeFrequency: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].includes(item.changeFrequency)
        ? item.changeFrequency : 'monthly',
      enabled: item.enabled !== false,
    };
    out.push(entry);
  }
  return out;
}

function parseExtras(value) {
  if (!value) return [];
  try {
    return sanitizeExtras(JSON.parse(value));
  } catch {
    return [];
  }
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
    gscMethod: METHODS.includes(map[KEYS.method]) ? map[KEYS.method] : 'none',
    gscFile: map[KEYS.gsc] || '',
    gscTxtToken: map[KEYS.txt] || '',
    sitemapOverrides: parseOverrides(map[KEYS.overrides]),
    sitemapExtraRoutes: parseExtras(map[KEYS.extras]),
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
  if ('gscMethod' in updates) {
    const r = validateMethod(updates.gscMethod);
    if (!r.ok) errors.push(r.error);
    else writes.push([KEYS.method, r.value, 'Search Console verification method in use']);
  }
  if ('gscFile' in updates) {
    const r = validateGscFile(updates.gscFile);
    if (!r.ok) errors.push(r.error);
    else writes.push([KEYS.gsc, r.value, 'Google Search Console HTML verification filename']);
  }
  if ('gscTxtToken' in updates) {
    const r = validateTxtToken(updates.gscTxtToken);
    if (!r.ok) errors.push(r.error);
    else writes.push([KEYS.txt, r.value, 'Google Search Console DNS TXT token (verification lives at the registrar)']);
  }
  if ('sitemapOverrides' in updates) {
    writes.push([KEYS.overrides, JSON.stringify(sanitizeOverrides(updates.sitemapOverrides)), 'Per-route sitemap overrides']);
  }
  if ('sitemapExtraRoutes' in updates) {
    writes.push([KEYS.extras, JSON.stringify(sanitizeExtras(updates.sitemapExtraRoutes)), 'Admin-added sitemap routes']);
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

/** The apex domain to query — Google's domain property is verified on the apex. */
function apexDomain() {
  try {
    const host = new URL(SITE_URL).hostname;
    return host.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

/** Public resolvers, tried when the host's own resolver cannot answer. */
const PUBLIC_RESOLVERS = [
  { label: 'Google DNS', servers: ['8.8.8.8', '8.8.4.4'] },
  { label: 'Cloudflare DNS', servers: ['1.1.1.1'] },
];

/**
 * One TXT lookup. `servers` null = the host's own resolver.
 *
 * Uses a SCOPED Resolver rather than dns.setServers(), which is process-global —
 * pointing it at a public DNS server here would silently change name resolution
 * for outgoing mail and every other connection this process makes.
 */
async function txtLookup(domain, servers) {
  const resolver = new dns.Resolver({ timeout: 5000, tries: 2 });
  if (servers) resolver.setServers(servers);
  return resolver.resolveTxt(domain);
}

/**
 * Ask real DNS whether the google-site-verification TXT record is live.
 *
 * This is the whole point of recording the method. DNS TXT verification happens
 * at the registrar and the app plays no part in it — but the record does get
 * dropped during DNS migrations, and Google then un-verifies the property with no
 * warning. Nothing else in this system would ever notice.
 *
 * Falls back to public resolvers when the host's resolver cannot answer. That is
 * not just robustness: a public resolver is a closer match for what GOOGLE sees
 * than the VPS's local cache, which is the question actually being asked.
 *
 * @returns {{ok, domain, present, matches, found[], expected, resolver, error?}}
 */
async function checkDnsVerification() {
  const domain = apexDomain();
  const { gscTxtToken } = await getSeoSettings();
  const base = { domain, expected: gscTxtToken || null };

  if (!domain) return { ...base, ok: false, present: false, matches: false, found: [], resolver: null, error: 'Site URL is not a valid domain.' };

  const attempts = [{ label: 'system resolver', servers: null }, ...PUBLIC_RESOLVERS];
  let records = null;
  let resolverUsed = null;
  let lastError = null;

  for (const attempt of attempts) {
    try {
      records = await txtLookup(domain, attempt.servers);
      resolverUsed = attempt.label;
      break;
    } catch (e) {
      // ENODATA/ENOTFOUND is a real answer: the domain has no TXT records. Do not
      // keep asking other resolvers — they will say the same thing.
      if (['ENODATA', 'ENOTFOUND'].includes(e.code)) {
        return { ...base, ok: true, present: false, matches: false, found: [], resolver: attempt.label, error: 'No TXT records found for this domain.' };
      }
      lastError = e;
    }
  }

  if (!records) {
    return { ...base, ok: false, present: false, matches: false, found: [], resolver: null, error: `DNS lookup failed (${lastError?.code || lastError?.message || 'unknown'}).` };
  }

  // resolveTxt returns chunked strings per record: [["v=spf1", " mx -all"], ...]
  const found = records
    .map((chunks) => chunks.join(''))
    .filter((r) => /^google-site-verification\s*=/i.test(r))
    .map((r) => r.replace(/^google-site-verification\s*=\s*/i, '').trim());

  return {
    ...base,
    ok: true,
    present: found.length > 0,
    // With no token stored we can still report what is live, but we must not
    // claim a match we did not actually verify.
    matches: gscTxtToken ? found.includes(gscTxtToken) : false,
    found,
    resolver: resolverUsed,
  };
}

module.exports = {
  getSeoSettings,
  saveSeoSettings,
  gscFileBody,
  checkDnsVerification,
  invalidate,
  validateGaId,
  validateGscFile,
  validateTxtToken,
  validateMethod,
  sanitizeOverrides,
  sanitizeExtras,
  apexDomain,
  METHODS,
  KEYS,
};
