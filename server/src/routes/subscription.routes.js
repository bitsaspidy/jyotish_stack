const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { createOrder, verifySignature, getKeys } = require('../services/razorpay.service');
const { sendEmail } = require('../services/email.service');
const { createInvoiceForSubscription, getBusinessConfig } = require('../services/invoice.service');
const { buildInvoicePdf } = require('../services/pdf/invoice');
const { ok, fail } = require('../utils/response');

const money2 = (n) => Number(n || 0).toFixed(2);
const safeFile = (s) => String(s || 'invoice').replace(/[^\w.-]+/g, '-');

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

  // Generate the GST invoice record (non-fatal — never block plan activation)
  let invoice = null;
  try {
    const freshSub = await db('user_subscriptions').where({ id: sub.id }).first();
    invoice = await createInvoiceForSubscription({
      subscription: freshSub,
      plan,
      user: req.user,
      customerState: req.body.customer_state || null,
      customerGstin: req.body.customer_gstin || null,
    });
  } catch (e) {
    console.error('[Invoice] generation failed:', e.message);
  }

  // Send the payment-success email with the invoice PDF attached (backgrounded)
  setImmediate(async () => {
    try {
      let attachments;
      const data = {
        name: req.user.name,
        planName: plan.name,
        expiresAt: expires_at.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        dashboardUrl: `${process.env.APP_URL || 'https://jyotishstack.com'}/dashboard`,
        invoiceNumber: invoice?.invoice_number || '—',
        isTax: invoice ? invoice.document_type !== 'bill_of_supply' && Number(invoice.total_tax) > 0 : false,
        interstate: invoice ? !!invoice.is_interstate : false,
        gstRate: invoice ? Number(invoice.gst_rate) : 0,
        taxableValue: money2(invoice?.taxable_value ?? plan.price),
        cgst: money2(invoice?.cgst), sgst: money2(invoice?.sgst), igst: money2(invoice?.igst),
        total: money2(invoice?.total_amount ?? plan.price),
      };
      if (invoice) {
        const business = await getBusinessConfig();
        const pdf = buildInvoicePdf(invoice, business);
        attachments = [{ filename: `${safeFile(invoice.invoice_number)}.pdf`, content: pdf, contentType: 'application/pdf' }];
      }
      await sendEmail({ to: req.user.email, template: 'payment_success', data, attachments });
    } catch (e) {
      console.error('[Invoice] email failed:', e.message);
    }
  });

  return ok(res, { expires_at, invoice_number: invoice?.invoice_number || null }, 'Subscription activated');
});

// ─── User invoices ──────────────────────────────────────────────────────────────
// GET /api/subscriptions/invoices — list the logged-in user's own invoices
router.get('/invoices', authenticate, async (req, res) => {
  const invoices = await db('invoices')
    .where({ user_id: req.user.id })
    .orderBy('created_at', 'desc')
    .select('uuid', 'invoice_number', 'plan_name', 'document_type', 'total_amount',
            'total_tax', 'taxable_value', 'currency', 'status', 'issued_at', 'created_at');
  return ok(res, { invoices });
});

// GET /api/subscriptions/invoices/:uuid/invoice.pdf — download own invoice
router.get('/invoices/:uuid/invoice.pdf', authenticate, async (req, res) => {
  const invoice = await db('invoices').where({ uuid: req.params.uuid, user_id: req.user.id }).first();
  if (!invoice) return fail(res, 'Invoice not found', 404);
  const business = await getBusinessConfig();
  const pdf = buildInvoicePdf(invoice, business);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFile(invoice.invoice_number)}.pdf"`);
  return res.send(pdf);
});

module.exports = router;
