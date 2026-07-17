'use strict';
/**
 * The site's public base URL, server-side.
 *
 * ui-main has its own copy in lib/seo.js (NEXT_PUBLIC_SITE_URL) because that value
 * is inlined into the browser bundle at build time. The server cannot read a
 * NEXT_PUBLIC_* var at runtime, so it reads SITE_URL from server/.env and falls
 * back to the production domain — the same default the frontend uses.
 *
 * Only used to SHOW the admin where the Search Console file will appear. Nothing
 * user-facing depends on it, so a stale value is cosmetic, not a broken page.
 */
const SITE_URL = (process.env.SITE_URL || 'https://jyotishstack.com').replace(/\/$/, '');

module.exports = { SITE_URL };
