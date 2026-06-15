const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { createOrder, verifySignature, getKeys } = require('../services/razorpay.service');
const { sendEmail } = require('../services/email.service');
const { ok, fail } = require('../utils/response');

// Maps a subscription_plans.name to the users.plan tier used for feature gating
const PLAN_TIER_MAP = { basic: 'basic', premium: 'premium', yearly: 'yearly' };
const planTierFor = (planName) => PLAN_TIER_MAP[String(planName || '').toLowerCase()] || 'basic';

// GET /api/subscriptions/plans — public
router.get('/plans', async (_req, res) => {
  const plans = await db('subscription_plans').where({ is_active: true }).select();
  return ok(res, { plans });
});

// POST /api/subscriptions/order — create Razorpay order
router.post('/order', authenticate, async (req, res) => {
  const { plan_id } = req.body;
  const plan = await db('subscription_plans').where({ id: plan_id, is_active: true }).first();
  if (!plan) return fail(res, 'Plan not found', 404);

  if (plan.price == 0) {
    // Free plan — activate immediately
    const starts_at = new Date();
    const expires_at = new Date(Date.now() + plan.duration_days * 86400000);
    const [id] = await db('user_subscriptions').insert({
      uuid: uuidv4(), user_id: req.user.id, plan_id: plan.id, status: 'active', amount_paid: 0, starts_at, expires_at,
    });
    await db('users').where({ id: req.user.id }).update({ plan: planTierFor(plan.name) });
    return ok(res, { subscription_id: id, free: true }, 'Free plan activated');
  }

  const order = await createOrder({ amount: plan.price, currency: plan.currency, receipt: `jys_${req.user.id}_${Date.now()}` });

  const [id] = await db('user_subscriptions').insert({
    uuid: uuidv4(), user_id: req.user.id, plan_id: plan.id, status: 'pending', amount_paid: plan.price, razorpay_order_id: order.id,
  });

  const { key_id } = await getKeys();
  return ok(res, {
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    subscription_id: id,
    key_id,
  }, 'Order created');
});

// POST /api/subscriptions/verify — verify Razorpay payment
router.post('/verify', authenticate, async (req, res) => {
  const { order_id, payment_id, signature, subscription_id } = req.body;
  if (!order_id || !payment_id || !signature || !subscription_id) return fail(res, 'Missing payment details', 400);

  const valid = await verifySignature({ orderId: order_id, paymentId: payment_id, signature });
  if (!valid) return fail(res, 'Payment verification failed', 400);

  const sub = await db('user_subscriptions').where({ id: subscription_id, user_id: req.user.id }).first();
  if (!sub) return fail(res, 'Subscription not found', 404);

  const plan = await db('subscription_plans').where({ id: sub.plan_id }).first();
  const starts_at = new Date();
  const expires_at = new Date(Date.now() + plan.duration_days * 86400000);

  await db('user_subscriptions').where({ id: sub.id }).update({
    status: 'active', razorpay_payment_id: payment_id, razorpay_signature: signature, starts_at, expires_at,
  });

  await db('users').where({ id: req.user.id }).update({ plan: planTierFor(plan.name) });

  sendEmail({
    to: req.user.email, template: 'subscription_confirm',
    data: { name: req.user.name, planName: plan.name, amount: plan.price, expiresAt: expires_at.toLocaleDateString('en-IN') },
  }).catch(() => {});

  return ok(res, { expires_at }, 'Subscription activated');
});

module.exports = router;
