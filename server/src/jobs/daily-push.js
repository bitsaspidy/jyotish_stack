'use strict';
/**
 * Daily horoscope web-push cron job.
 * Fires at 07:00 IST (Asia/Kolkata) every day — one hour after the email
 * digest — and sends each active push subscription its rashi-targeted
 * daily horoscope notification.
 *
 * Register once at server startup via initDailyPushJob().
 * Admin can trigger manually via POST /api/admin/push/daily.
 */
const cron = require('node-cron');
const { sendDailyHoroscopePush } = require('../services/push.service');

let _task = null;

function initDailyPushJob() {
  if (_task) return;

  _task = cron.schedule(
    '0 7 * * *',
    async () => {
      console.log('[DailyPush] Starting daily push run…');
      try {
        const summary = await sendDailyHoroscopePush();
        console.log('[DailyPush] Completed:', summary);
      } catch (err) {
        console.error('[DailyPush] Job failed:', err.message);
      }
    },
    { timezone: 'Asia/Kolkata' },
  );

  console.log('[DailyPush] Cron job scheduled — 07:00 IST daily.');
}

module.exports = { initDailyPushJob };
