'use strict';
/**
 * Daily digest cron job.
 * Fires at 06:00 IST (Asia/Kolkata) every day and sends each eligible user
 * their personalised "Today for You" email.
 *
 * Register once at server startup via initDailyDigestJob().
 * An admin can also trigger it manually via POST /admin/jobs/daily-digest.
 */
const cron = require('node-cron');
const { sendDailyDigestToAll } = require('../services/daily-email.service');

let _task = null;

function initDailyDigestJob() {
  if (_task) return;

  _task = cron.schedule(
    '0 6 * * *',
    async () => {
      console.log('[DailyDigest] Starting daily email run…');
      try {
        const summary = await sendDailyDigestToAll();
        console.log('[DailyDigest] Completed:', summary);
      } catch (err) {
        console.error('[DailyDigest] Job failed:', err.message);
      }
    },
    { timezone: 'Asia/Kolkata' },
  );

  console.log('[DailyDigest] Cron job scheduled — 06:00 IST daily.');
}

module.exports = { initDailyDigestJob };
