const router = require('express').Router();
const db = require('../config/db');
const { ok } = require('../utils/response');

// GET /api/settings/public — returns non-sensitive settings for UIs
router.get('/public', async (_req, res) => {
  const keys = ['maintenance_mode', 'maintenance_title', 'maintenance_message', 'maintenance_message_hi',
    'site_name', 'site_tagline', 'site_tagline_hi', 'contact_email', 'razorpay_enabled'];
  const rows = await db('app_settings').whereIn('key', keys).select('key', 'value');
  const settings = {};
  rows.forEach((r) => (settings[r.key] = r.value));
  return ok(res, { settings });
});

module.exports = router;
