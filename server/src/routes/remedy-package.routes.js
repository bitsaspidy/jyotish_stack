'use strict';
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const { ok, fail }              = require('../utils/response');
const { randomToken, signAccess, signRefresh } = require('../utils/token');
const { calculateVedicChart }   = require('../services/vedic-calc.service');
const { generatePersonalizedRemedies } = require('../services/remedy-engine');
const { buildRemedyPackagePdf } = require('../services/pdf/remedy-package-pdf');
const { sendEmail }             = require('../services/email.service');

// POST /api/remedy/submit — public: collect lead, generate PDF, email it, create account
router.post('/submit', async (req, res) => {
  try {
    const {
      name, email, phone,
      date_of_birth,
      time_of_birth    = '12:00:00',
      place_of_birth   = 'India',
      latitude         = '20.5937',
      longitude        = '78.9629',
      timezone_offset  = '5.5',
      lang             = 'en',
    } = req.body;

    if (!name || !email || !date_of_birth) {
      return fail(res, 'Name, email, and date of birth are required', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, 'Please enter a valid email address', 400);
    }

    // Parse date/time
    const [yr, mo, dy] = String(date_of_birth).split('-').map(Number);
    const [hr, mn, sc] = String(time_of_birth || '12:00:00').split(':').map(Number);

    // Calculate Vedic chart
    const chart = calculateVedicChart({
      year: yr, month: mo, day: dy,
      hour: hr || 0, minute: mn || 0, second: sc || 0,
      latitude:         parseFloat(latitude)  || 20.59,
      longitude:        parseFloat(longitude) || 78.96,
      timezone_offset:  parseFloat(timezone_offset) || 5.5,
    });

    // Generate personalized remedies
    const remedies = await generatePersonalizedRemedies(chart, { lang });

    // Build remedy PDF
    const pdfBuffer = await buildRemedyPackagePdf({
      name, date_of_birth, time_of_birth, place_of_birth,
      chart, remedies, lang,
    });

    const pdfName = `remedy-report-${name.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    // Send remedy report email with PDF attachment
    await sendEmail({
      to: email,
      template: 'remedy_report',
      data: { name, lang },
      attachments: [{ filename: pdfName, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    // Create user account if email not already registered
    const existing = await db('users').where({ email: email.toLowerCase().trim() }).first();
    let isNewUser = false;

    if (!existing) {
      isNewUser = true;
      const setupToken = randomToken();
      const emailToken = randomToken();
      // Unusable random temp password — user must click setup link to set a real one
      const tempHash = await bcrypt.hash(randomToken() + randomToken(), 12);

      await db('users').insert({
        uuid:                     uuidv4(),
        name,
        email:                    email.toLowerCase().trim(),
        phone:                    phone || null,
        password_hash:            tempHash,
        email_verification_token: emailToken,
        password_reset_token:     setupToken,
        password_reset_expires:   new Date(Date.now() + 72 * 3600_000), // 72 h
      });

      const base       = process.env.APP_URL || 'https://jyotishstack.com';
      const setupUrl   = `${base}/set-password?token=${setupToken}`;
      const verifyUrl  = `${base}/verify-email?token=${emailToken}`;

      // Send setup email (non-blocking — don't fail the request if this fails)
      sendEmail({ to: email, template: 'account_setup', data: { name, setupUrl, verifyUrl } })
        .catch(err => console.error('[remedy/account_setup email]', err.message));
    }

    return ok(res, { is_new_user: isNewUser }, 'Remedy report sent to your email');
  } catch (err) {
    console.error('[remedy/submit]', err);
    return fail(res, 'Failed to process your request. Please try again later.', 500);
  }
});

// POST /api/remedy/set-password — public: activate account with setup token
router.post('/set-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)    return fail(res, 'Token and password are required', 400);
    if (password.length < 8)    return fail(res, 'Password must be at least 8 characters', 400);

    const user = await db('users').where({ password_reset_token: token }).first();
    if (!user) return fail(res, 'This setup link is invalid or has already been used', 400);

    if (user.password_reset_expires && new Date(user.password_reset_expires) < new Date()) {
      return fail(res, 'This setup link has expired. Please submit the remedy form again to get a fresh link.', 400);
    }

    const password_hash = await bcrypt.hash(password, 12);
    await db('users').where({ id: user.id }).update({
      password_hash,
      password_reset_token:   null,
      password_reset_expires: null,
    });

    // Auto-login
    const accessToken  = signAccess({ id: user.id, role: user.role });
    const refreshToken = signRefresh({ id: user.id });
    await db('user_sessions').insert({
      user_id:       user.id,
      refresh_token: refreshToken,
      ip_address:    req.ip,
      expires_at:    new Date(Date.now() + 30 * 86_400_000),
    });

    const fresh = await db('users').where({ id: user.id }).first();
    const { password_hash: _p, email_verification_token: _e, password_reset_token: _r, ...safeUser } = fresh;
    return ok(res, { user: safeUser, accessToken, refreshToken }, 'Account activated — welcome!');
  } catch (err) {
    console.error('[remedy/set-password]', err);
    return fail(res, 'Failed to set password. Please try again.', 500);
  }
});

module.exports = router;
