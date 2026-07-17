'use strict';
// Invoice service — GST computation, sequential numbering, business config,
// and creation of immutable invoice records on successful payment.
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// ─── Business / GST configuration ─────────────────────────────────────────────
// Stored in app_settings (editable from the admin Sales page). Code defaults
// below keep everything working before the owner fills in the real values.
const CONFIG_DEFAULTS = {
  // The LEGAL entity, not the brand. A GST invoice names the registered person —
  // the GSTIN belongs to M/S. Sat Sai Infocom, and "Jyotish Stack AI" is its
  // trading name. Only used when the admin has not set a value in
  // Sales → Business Settings, which overrides this.
  business_legal_name: 'M/S. Sat Sai Infocom',
  business_gstin: '',
  business_pan: '',
  business_address: '',
  business_state: '',
  business_state_code: '',
  business_email: 'account@jyotishstack.com',
  business_phone: '',
  gst_enabled: 'true',
  gst_rate: '18',
  gst_inclusive: 'true',
  hsn_sac: '999799', // SAC for other professional/astrology services
  invoice_prefix: 'JYS',
  tax_split_mode: 'igst', // auto | cgst_sgst | igst — default IGST (inter-state)
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const norm = (s) => String(s || '').trim().toLowerCase();

async function getBusinessConfig() {
  const keys = Object.keys(CONFIG_DEFAULTS);
  const rows = await db('app_settings').whereIn('key', keys).select('key', 'value');
  const cfg = { ...CONFIG_DEFAULTS };
  rows.forEach((r) => { if (r.value !== null && r.value !== undefined && r.value !== '') cfg[r.key] = r.value; });
  // Typed coercions
  cfg.gst_rate = Number(cfg.gst_rate) || 0;
  cfg.gst_inclusive = String(cfg.gst_inclusive) !== 'false';
  cfg.gst_enabled = String(cfg.gst_enabled) !== 'false';
  return cfg;
}

async function saveBusinessConfig(updates = {}) {
  const allowed = Object.keys(CONFIG_DEFAULTS);
  for (const [key, value] of Object.entries(updates)) {
    if (!allowed.includes(key)) continue;
    await db('app_settings')
      .insert({ key, value: String(value ?? ''), description: 'Invoice / GST setting' })
      .onConflict('key')
      .merge({ value: String(value ?? '') });
  }
  return getBusinessConfig();
}

// ─── GST math ─────────────────────────────────────────────────────────────────
function determineInterstate(splitMode, customerState, businessState) {
  if (splitMode === 'igst') return true;
  if (splitMode === 'cgst_sgst') return false;
  // auto: inter-state only when we positively know the customer is elsewhere
  if (customerState && businessState && norm(customerState) !== norm(businessState)) return true;
  return false; // unknown customer state → fall back to CGST+SGST
}

/**
 * Compute the tax break-up. Prices are GST-inclusive by default, so the gross
 * amount the customer paid is preserved and the taxable value is back-calculated.
 */
function computeGst({ total, rate = 18, inclusive = true, interstate = false }) {
  const gross = Number(total) || 0;
  let taxable, taxTotal, grandTotal;
  if (inclusive) {
    taxable = round2(gross / (1 + rate / 100));
    taxTotal = round2(gross - taxable);
    grandTotal = round2(gross);
  } else {
    taxable = round2(gross);
    taxTotal = round2(gross * (rate / 100));
    grandTotal = round2(taxable + taxTotal);
  }
  let cgst = 0, sgst = 0, igst = 0;
  if (interstate) {
    igst = taxTotal;
  } else {
    cgst = round2(taxTotal / 2);
    sgst = round2(taxTotal - cgst); // absorb rounding remainder into SGST
  }
  return { taxable_value: taxable, total_tax: taxTotal, cgst, sgst, igst, total_amount: grandTotal };
}

// ─── Invoice numbering ─────────────────────────────────────────────────────────
function fiscalYearLabel(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 3 ? y : y - 1; // Indian FY starts in April (month index 3)
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

async function nextInvoiceNumber(prefix, date = new Date()) {
  const fy = fiscalYearLabel(date);
  const like = `${prefix}/${fy}/%`;
  const row = await db('invoices').where('invoice_number', 'like', like).count('id as c').first();
  const seq = Number(row.c) + 1;
  return `${prefix}/${fy}/${String(seq).padStart(4, '0')}`;
}

// ─── Create an invoice for a paid subscription ─────────────────────────────────
async function createInvoiceForSubscription({ subscription, plan, user, customerState = null, customerGstin = null }) {
  const cfg = await getBusinessConfig();
  const gstActive = cfg.gst_enabled && cfg.gst_rate > 0;
  const total = Number(subscription.amount_paid ?? plan.price ?? 0);

  const interstate = gstActive ? determineInterstate(cfg.tax_split_mode, customerState, cfg.business_state) : false;
  const calc = gstActive
    ? computeGst({ total, rate: cfg.gst_rate, inclusive: cfg.gst_inclusive, interstate })
    : { taxable_value: round2(total), total_tax: 0, cgst: 0, sgst: 0, igst: 0, total_amount: round2(total) };

  const base = {
    subscription_id: subscription.id || null,
    user_id: user.id,
    plan_id: plan.id || null,
    plan_name: plan.name || null,
    razorpay_order_id: subscription.razorpay_order_id || null,
    razorpay_payment_id: subscription.razorpay_payment_id || null,
    currency: plan.currency || 'INR',
    document_type: gstActive ? 'tax_invoice' : 'bill_of_supply',
    gst_rate: gstActive ? cfg.gst_rate : 0,
    gst_inclusive: cfg.gst_inclusive,
    hsn_sac: cfg.hsn_sac || null,
    taxable_value: calc.taxable_value,
    cgst: calc.cgst, sgst: calc.sgst, igst: calc.igst,
    total_tax: calc.total_tax, total_amount: calc.total_amount,
    is_interstate: interstate,
    place_of_supply: customerState || cfg.business_state || null,
    customer_name: user.name || null,
    customer_email: user.email || null,
    customer_state: customerState || null,
    customer_gstin: customerGstin || null,
    seller_name: cfg.business_legal_name || null,
    seller_gstin: cfg.business_gstin || null,
    seller_state: cfg.business_state || null,
    seller_address: cfg.business_address || null,
    status: 'paid',
    issued_at: new Date(),
  };

  // Insert with a small retry loop in case two payments race for the same number
  for (let attempt = 0; attempt < 4; attempt++) {
    const invoice_number = await nextInvoiceNumber(cfg.invoice_prefix || 'JYS', base.issued_at);
    try {
      const [id] = await db('invoices').insert({ uuid: uuidv4(), invoice_number, ...base });
      return db('invoices').where({ id }).first();
    } catch (err) {
      if (attempt === 3 || !/duplicate|unique|ER_DUP/i.test(err.message)) throw err;
    }
  }
}

module.exports = {
  CONFIG_DEFAULTS,
  getBusinessConfig,
  saveBusinessConfig,
  determineInterstate,
  computeGst,
  fiscalYearLabel,
  nextInvoiceNumber,
  createInvoiceForSubscription,
  round2,
};
