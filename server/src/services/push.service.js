'use strict';
/**
 * Web push service (VAPID).
 * Env (server/.env):
 *   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY  — generate once with:
 *     npx web-push generate-vapid-keys
 *   VAPID_SUBJECT — defaults to mailto:team@jyotishstack.com
 * If keys are missing the service is disabled (subscribe still stores rows,
 * sends become no-ops) so the app never crashes without configuration.
 */
const db = require('../config/db');

let webpush = null;
let configured = false;

function init() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  try {
    webpush = require('web-push');
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:team@jyotishstack.com', pub, priv);
    configured = true;
    return true;
  } catch (e) {
    console.error('[Push] init failed:', e.message);
    return false;
  }
}

function publicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

async function saveSubscription({ subscription, rashi_num, user_id, lang }) {
  const { endpoint, keys } = subscription || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) throw new Error('Invalid subscription');
  const row = {
    endpoint: endpoint.slice(0, 500),
    p256dh: keys.p256dh,
    auth: keys.auth,
    rashi_num: rashi_num >= 1 && rashi_num <= 12 ? rashi_num : null,
    user_id: user_id || null,
    lang: lang === 'hi' ? 'hi' : 'en',
    is_active: true,
    fail_count: 0,
  };
  await db('push_subscriptions').insert(row).onConflict('endpoint').merge();
  return true;
}

async function removeSubscription(endpoint) {
  if (!endpoint) return false;
  await db('push_subscriptions').where({ endpoint: endpoint.slice(0, 500) }).del();
  return true;
}

async function sendTo(sub, payload) {
  if (!init()) return { ok: false, reason: 'not_configured' };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 12 * 3600 }
    );
    await db('push_subscriptions').where({ id: sub.id })
      .update({ last_sent_at: db.fn.now(), fail_count: 0 });
    return { ok: true };
  } catch (e) {
    // 404/410 = subscription expired or revoked → deactivate immediately
    if (e.statusCode === 404 || e.statusCode === 410) {
      await db('push_subscriptions').where({ id: sub.id }).update({ is_active: false });
    } else {
      await db('push_subscriptions').where({ id: sub.id }).increment('fail_count', 1);
      await db('push_subscriptions').where({ id: sub.id }).andWhere('fail_count', '>=', 5)
        .update({ is_active: false });
    }
    return { ok: false, reason: e.statusCode || e.message };
  }
}

/** Daily horoscope push — one notification per active subscription, rashi-targeted. */
async function sendDailyHoroscopePush() {
  if (!init()) {
    console.log('[Push] VAPID keys not configured — daily push skipped');
    return { sent: 0, failed: 0, skipped: true };
  }
  const { generateDailyHoroscope } = require('./helpers/daily-horoscope');
  const horoscope = generateDailyHoroscope(new Date());
  if (!horoscope) return { sent: 0, failed: 0 };

  const byRashi = {};
  for (const r of horoscope.rashis) byRashi[r.rashi_num] = r;

  const subs = await db('push_subscriptions').where({ is_active: true });
  let sent = 0, failed = 0;

  for (const sub of subs) {
    const r  = byRashi[sub.rashi_num] || null;
    const hi = sub.lang === 'hi';
    const payload = r
      ? {
          title: `${r.stars.slice(0, r.score)} ${hi ? r.rashi_hi : r.rashi_en} — ${hi ? r.title_hi : r.title_en}`,
          body: (hi ? r.advice?.hi : r.advice?.en) || (hi ? r.description_hi : r.description_en) || '',
          url: '/horoscope',
          tag: `daily-${horoscope.date}`,
        }
      : {
          title: hi ? '🔯 आज का राशिफल तैयार है' : "🔯 Today's horoscope is ready",
          body: hi ? 'सभी 12 राशियों का दैनिक राशिफल देखें' : 'Read the daily forecast for all 12 signs',
          url: '/horoscope',
          tag: `daily-${horoscope.date}`,
        };
    const res = await sendTo(sub, payload);
    if (res.ok) sent += 1; else failed += 1;
  }
  console.log(`[Push] Daily horoscope push: ${sent} sent, ${failed} failed (${subs.length} subs)`);
  return { sent, failed };
}

/** Admin blast — custom title/body to all active subscriptions. */
async function sendBlast({ title, body, url }) {
  if (!init()) return { sent: 0, failed: 0, skipped: true };
  const subs = await db('push_subscriptions').where({ is_active: true });
  let sent = 0, failed = 0;
  for (const sub of subs) {
    const res = await sendTo(sub, { title, body, url: url || '/', tag: `blast-${Date.now()}` });
    if (res.ok) sent += 1; else failed += 1;
  }
  return { sent, failed, total: subs.length };
}

module.exports = { init, publicKey, saveSubscription, removeSubscription, sendDailyHoroscopePush, sendBlast };
