'use strict';
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const { ok, fail }              = require('../utils/response');
const { randomToken, signAccess, signRefresh } = require('../utils/token');
const { createOrder, verifySignature, getKeys } = require('../services/razorpay.service');
const { createInvoiceForSubscription, getBusinessConfig } = require('../services/invoice.service');
const { buildInvoicePdf } = require('../services/pdf/invoice');
const { calculateVedicChart }   = require('../services/vedic-calc.service');
const { generatePersonalizedRemedies } = require('../services/remedy-engine');
const { buildRemedyPackagePdf } = require('../services/pdf/remedy-package-pdf');
const { sendEmail }             = require('../services/email.service');

const safeFile = (s) => String(s || 'invoice').replace(/[^\w.-]+/g, '-');

// POST /api/remedy/order — public: create a Razorpay order for the basic plan
// Accepts email so we can reject duplicates before taking payment.
router.post('/order', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return fail(res, 'Email is required', 400);

    // Reject if account already exists — don't take payment unnecessarily
    const existing = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (existing) {
      return fail(res, 'An account with this email already exists. Please log in to upgrade your plan.', 409);
    }

    const plan = await db('subscription_plans')
      .where({ is_active: true })
      .whereRaw("LOWER(name) = 'basic'")
      .first();
    if (!plan) return fail(res, 'Basic plan not available. Please contact support.', 404);

    const order = await createOrder({
      amount:   plan.price,
      currency: plan.currency || 'INR',
      receipt:  `remedy_${Date.now()}`,
      notes:    { source: 'remedy_package' },
    });

    const { key_id } = await getKeys();
    return ok(res, {
      order_id:  order.id,
      amount:    order.amount,
      currency:  order.currency,
      key_id,
      plan_id:   plan.id,
      plan_name: plan.name,
      plan_price: plan.price,
    });
  } catch (err) {
    console.error('[remedy/order]', err);
    return fail(res, 'Failed to create order. Please try again.', 500);
  }
});

// POST /api/remedy/submit — public: verify payment, generate PDF, create basic account, send emails
router.post('/submit', async (req, res) => {
  try {
    const {
      // Personal
      name, email, phone,
      lang             = 'en',
      // Birth
      date_of_birth,
      time_of_birth    = '12:00:00',
      place_of_birth   = 'India',
      latitude         = '20.5937',
      longitude        = '78.9629',
      timezone_offset  = '5.5',
      // Payment
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
    } = req.body;

    if (!name || !email || !date_of_birth) {
      return fail(res, 'Name, email, and date of birth are required', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, 'Please enter a valid email address', 400);
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail(res, 'Payment details are missing', 400);
    }

    // 1. Verify Razorpay signature
    const valid = await verifySignature({
      orderId:   razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) return fail(res, 'Payment verification failed. Please contact support.', 400);

    // 2. Ensure no duplicate account (race-condition guard after the order step check)
    const existing = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (existing) {
      return fail(res, 'An account with this email already exists. Please log in.', 409);
    }

    // 3. Fetch the plan
    const plan = await db('subscription_plans').where({ id: plan_id, is_active: true }).first()
      || await db('subscription_plans').whereRaw("LOWER(name) = 'basic'").where({ is_active: true }).first();
    if (!plan) return fail(res, 'Plan not found', 404);

    // 4. Calculate Vedic chart
    const [yr, mo, dy] = String(date_of_birth).split('-').map(Number);
    const [hr, mn, sc] = String(time_of_birth || '12:00:00').split(':').map(Number);
    const chart = calculateVedicChart({
      year: yr, month: mo, day: dy,
      hour: hr || 0, minute: mn || 0, second: sc || 0,
      latitude:         parseFloat(latitude)  || 20.59,
      longitude:        parseFloat(longitude) || 78.96,
      timezone_offset:  parseFloat(timezone_offset) || 5.5,
    });

    // 5. Generate personalised remedies
    const remedies = await generatePersonalizedRemedies(chart, { lang });

    // 6. Build remedy PDF
    const pdfBuffer = await buildRemedyPackagePdf({
      name, date_of_birth, time_of_birth, place_of_birth,
      chart, remedies, lang,
    });

    // 7. Create user account (plan = 'basic')
    const setupToken = randomToken();
    const emailToken = randomToken();
    const tempHash   = await bcrypt.hash(randomToken() + randomToken(), 12);

    const [userId] = await db('users').insert({
      uuid:                     uuidv4(),
      name,
      email:                    email.toLowerCase().trim(),
      phone:                    phone || null,
      password_hash:            tempHash,
      plan:                     'basic',
      email_verification_token: emailToken,
      password_reset_token:     setupToken,
      password_reset_expires:   new Date(Date.now() + 72 * 3600_000),
    });

    // 8. Create subscription record (active)
    const starts_at  = new Date();
    const expires_at = new Date(Date.now() + plan.duration_days * 86_400_000);
    const [subId] = await db('user_subscriptions').insert({
      uuid:                uuidv4(),
      user_id:             userId,
      plan_id:             plan.id,
      status:              'active',
      amount_paid:         plan.price,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      starts_at,
      expires_at,
    });

    // 9. Generate invoice (non-fatal)
    let invoice = null;
    try {
      const freshSub  = await db('user_subscriptions').where({ id: subId }).first();
      const freshUser = await db('users').where({ id: userId }).first();
      invoice = await createInvoiceForSubscription({
        subscription: freshSub,
        plan,
        user: freshUser,
        customerState: null,
        customerGstin: null,
      });
    } catch (e) {
      console.error('[remedy/invoice]', e.message);
    }

    const base     = process.env.APP_URL || 'https://jyotishstack.com';
    const setupUrl = `${base}/set-password?token=${setupToken}`;
    const verifyUrl= `${base}/verify-email?token=${emailToken}`;

    // 10. Send remedy PDF email
    const pdfName = `remedy-report-${name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    await sendEmail({
      to:       email,
      template: 'remedy_report',
      data:     { name, lang },
      attachments: [{ filename: pdfName, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    // 11. Send account setup + welcome email (with invoice PDF if available) — non-blocking
    setImmediate(async () => {
      try {
        let attachments;
        if (invoice) {
          try {
            const business = await getBusinessConfig();
            const invPdf   = buildInvoicePdf(invoice, business);
            attachments    = [{ filename: `${safeFile(invoice.invoice_number)}.pdf`, content: invPdf, contentType: 'application/pdf' }];
          } catch (e) { console.error('[remedy/invoice-pdf]', e.message); }
        }
        await sendEmail({
          to:       email,
          template: 'account_setup',
          data:     { name, setupUrl, verifyUrl, planName: plan.name, lang },
          attachments,
        });
      } catch (e) {
        console.error('[remedy/account_setup email]', e.message);
      }
    });

    return ok(res, {}, 'Remedy report sent! Check your email to set your account password.');
  } catch (err) {
    console.error('[remedy/submit]', err);
    return fail(res, 'Failed to process your request. Please try again.', 500);
  }
});

// POST /api/remedy/set-password — public: activate account via setup token, auto-login
router.post('/set-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return fail(res, 'Token and password are required', 400);
    if (password.length < 8)  return fail(res, 'Password must be at least 8 characters', 400);

    const user = await db('users').where({ password_reset_token: token }).first();
    if (!user) return fail(res, 'This setup link is invalid or has already been used.', 400);

    if (user.password_reset_expires && new Date(user.password_reset_expires) < new Date()) {
      return fail(res, 'This setup link has expired. Please contact support for a new link.', 400);
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
