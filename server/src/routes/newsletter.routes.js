const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { randomToken } = require('../utils/token');
const db = require('../config/db');
const { ok, fail } = require('../utils/response');

// POST /api/newsletter/subscribe
router.post('/subscribe', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 'Valid email required', 400);

  const { email, name, preferred_language = 'en' } = req.body;
  const existing = await db('newsletter_subscribers').where({ email }).first();
  if (existing) {
    if (existing.is_active) return ok(res, {}, 'Already subscribed');
    await db('newsletter_subscribers').where({ email }).update({ is_active: true, unsubscribed_at: null, name: name || existing.name });
    return ok(res, {}, 'Re-subscribed successfully');
  }

  await db('newsletter_subscribers').insert({
    email, name: name || null, preferred_language, is_active: true, unsubscribe_token: randomToken(16),
  });
  return ok(res, {}, 'Subscribed successfully! Thank you.', 201);
});

// GET /api/newsletter/unsubscribe?token=xxx
router.get('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token) return fail(res, 'Token required', 400);
  const sub = await db('newsletter_subscribers').where({ unsubscribe_token: token }).first();
  if (!sub) return fail(res, 'Invalid token', 400);
  await db('newsletter_subscribers').where({ id: sub.id }).update({ is_active: false, unsubscribed_at: new Date() });
  return ok(res, {}, 'Unsubscribed successfully');
});

module.exports = router;
