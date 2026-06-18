const nodemailer = require('nodemailer');
const db = require('../config/db');

// ─── Department mailboxes ─────────────────────────────────────────────────────
const boolEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const buildSharedConfig = (env = process.env) => {
  const port = Number(env.SMTP_PORT) || 587;
  return {
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE ? boolEnv(env.SMTP_SECURE) : port === 465,
    requireTLS: boolEnv(env.SMTP_REQUIRE_TLS, false),
    tls: {
      rejectUnauthorized: boolEnv(env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
      servername: env.SMTP_TLS_SERVERNAME || env.SMTP_HOST,
    },
  };
};
const SHARED = buildSharedConfig();

const DEFAULT_ACCOUNT = {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
};

const DEPARTMENTS = {
  sales: {
    user: process.env.MAIL_SALES_USER   || DEFAULT_ACCOUNT.user,
    pass: process.env.MAIL_SALES_PASS   || DEFAULT_ACCOUNT.pass,
    from: process.env.MAIL_SALES_FROM   || 'Jyotish Stack Sales <sales@jyotishstack.com>',
    address: process.env.MAIL_SALES_USER || 'sales@jyotishstack.com',
    label: 'Sales',
  },
  team: {
    user: process.env.MAIL_TEAM_USER    || DEFAULT_ACCOUNT.user,
    pass: process.env.MAIL_TEAM_PASS    || DEFAULT_ACCOUNT.pass,
    from: process.env.MAIL_TEAM_FROM    || 'Jyotish Stack Support <team@jyotishstack.com>',
    address: process.env.MAIL_TEAM_USER  || 'team@jyotishstack.com',
    label: 'Support',
  },
  account: {
    user: process.env.MAIL_ACCOUNT_USER || DEFAULT_ACCOUNT.user,
    pass: process.env.MAIL_ACCOUNT_PASS || DEFAULT_ACCOUNT.pass,
    from: process.env.MAIL_ACCOUNT_FROM || 'Jyotish Stack <account@jyotishstack.com>',
    address: process.env.MAIL_ACCOUNT_USER || 'account@jyotishstack.com',
    label: 'Accounts',
  },
};

const INBOX_FOR = { sales: 'sales', team: 'team', account: 'account', general: 'team' };

const TEMPLATE_DEPARTMENT = {
  welcome:              'account',
  verify_email:         'account',
  reset_password:       'account',
  subscription_confirm: 'account',
  payment_success:      'account',
  newsletter:           'team',
  custom:               'team',
  contact_ack:          'team',
  contact_notify:       'team',
};

const _transports = {};
const getTransport = (deptKey) => {
  const dept = DEPARTMENTS[deptKey] ? deptKey : 'account';
  if (!_transports[dept]) {
    const { user, pass } = DEPARTMENTS[dept];
    _transports[dept] = nodemailer.createTransport({
      host: SHARED.host, port: SHARED.port, secure: SHARED.secure,
      requireTLS: SHARED.requireTLS, tls: SHARED.tls,
      auth: user ? { user, pass } : undefined,
    });
  }
  return { transport: _transports[dept], cfg: DEPARTMENTS[dept] };
};

const departmentInbox = (department) => INBOX_FOR[department] || 'team';

// ─── Email Signatures ─────────────────────────────────────────────────────────
// 5-minute in-memory cache per department
const _sigCache = {};
const SIG_CACHE_TTL = 5 * 60 * 1000;

async function getSignatureHtml(deptKey) {
  const hit = _sigCache[deptKey];
  if (hit && Date.now() - hit.ts < SIG_CACHE_TTL) return hit.html;

  try {
    const row = await db('email_signatures').where({ department: deptKey, is_active: true }).first();
    if (!row || !row.signature_html) {
      _sigCache[deptKey] = { ts: Date.now(), html: '' };
      return '';
    }

    const appUrl = process.env.APP_URL || 'https://jyotishstack.com';
    const logoHtml = row.include_logo
      ? `<img src="${appUrl}/logo-icon.svg" alt="Jyotish Stack AI" style="height:36px;margin-bottom:10px;display:block;" />`
      : '';

    const html = `
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(212,175,55,0.25);">
        ${logoHtml}
        <div style="font-size:13px;color:#c8c0b0;line-height:1.6;">${row.signature_html}</div>
      </div>`;

    _sigCache[deptKey] = { ts: Date.now(), html };
    return html;
  } catch (_) {
    return '';
  }
}

/** Call after saving a signature to flush the cache for that dept */
function invalidateSignatureCache(deptKey) {
  delete _sigCache[deptKey];
}

// ─── Brand Shell ──────────────────────────────────────────────────────────────
const BRAND_SHELL = (inner, signatureHtml = '') => `
  <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
    <h1 style="color:#D4AF37;text-align:center;letter-spacing:2px;margin-top:0;">🪐 Jyotish Stack AI</h1>
    ${inner}
    ${signatureHtml}
    <hr style="border-color:#D4AF37;opacity:0.3;margin-top:30px;"/>
    <p style="text-align:center;font-size:12px;color:#888;">© ${new Date().getFullYear()} Jyotish Stack AI • jyotishstack.com</p>
  </div>`;

// ─── Templates ────────────────────────────────────────────────────────────────
const templates = {
  welcome: (data, sig) => ({
    subject: `Welcome to Jyotish Stack AI, ${data.name}!`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Welcome to <strong style="color:#D4AF37;">Jyotish Stack AI</strong> — where ancient Vedic wisdom meets modern intelligence.</p>
        <p>Your journey to discover cosmic insights begins now. Explore your Kundli, match horoscopes, and receive personalised Bhavishya Vani.</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">If you did not register, please ignore this email.</p>`, sig),
  }),

  verify_email: (data, sig) => ({
    subject: 'Verify your Jyotish Stack AI email',
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Email Verification</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">This link expires in 24 hours.</p>`, sig),
  }),

  reset_password: (data, sig) => ({
    subject: 'Reset your Jyotish Stack AI password',
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Password Reset</h2>
        <p>We received a request to reset your password. Click below to proceed:</p>
        <a href="${data.resetUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a>
        <p style="font-size:12px;color:#888;">This link expires in 1 hour. If you did not request this, ignore the email.</p>`, sig),
  }),

  subscription_confirm: (data, sig) => ({
    subject: `Subscription Confirmed — ${data.planName}`,
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Subscription Active</h2>
        <p>Namaste ${data.name},</p>
        <p>Your <strong style="color:#D4AF37;">${data.planName}</strong> subscription is now active.</p>
        <ul>
          <li>Amount Paid: ₹${data.amount}</li>
          <li>Valid Until: ${data.expiresAt}</li>
        </ul>
        <p>Thank you for choosing Jyotish Stack AI. For billing questions, reply to this email (account@jyotishstack.com).</p>`, sig),
  }),

  payment_success: (data, sig) => {
    const taxRows = data.isTax
      ? (data.interstate
          ? `<tr><td style="padding:4px 0;color:#bdb6a6;">IGST @ ${data.gstRate}%</td><td style="padding:4px 0;text-align:right;">₹${data.igst}</td></tr>`
          : `<tr><td style="padding:4px 0;color:#bdb6a6;">CGST @ ${data.gstRate / 2}%</td><td style="padding:4px 0;text-align:right;">₹${data.cgst}</td></tr>
             <tr><td style="padding:4px 0;color:#bdb6a6;">SGST @ ${data.gstRate / 2}%</td><td style="padding:4px 0;text-align:right;">₹${data.sgst}</td></tr>`)
      : '';
    return {
      subject: `Payment Received — Invoice ${data.invoiceNumber}`,
      html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;margin-bottom:4px;">Payment Successful ✓</h2>
        <p style="font-size:15px;">Namaste ${data.name},</p>
        <p>Thank you! We've received your payment and your <strong style="color:#D4AF37;">${data.planName}</strong> plan is now active${data.expiresAt ? ` until <strong>${data.expiresAt}</strong>` : ''}.</p>
        <div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.25);border-radius:8px;padding:16px 18px;margin:20px 0;">
          <p style="margin:0 0 10px;color:#D4AF37;font-size:13px;letter-spacing:0.04em;"><strong>${data.isTax ? 'TAX INVOICE' : 'BILL OF SUPPLY'} · ${data.invoiceNumber}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#F5F0E8;">
            <tr><td style="padding:4px 0;color:#bdb6a6;">Plan</td><td style="padding:4px 0;text-align:right;">${data.planName}</td></tr>
            <tr><td style="padding:4px 0;color:#bdb6a6;">Taxable Value</td><td style="padding:4px 0;text-align:right;">₹${data.taxableValue}</td></tr>
            ${taxRows}
            <tr><td style="padding:8px 0 0;border-top:1px solid rgba(212,175,55,0.25);color:#D4AF37;font-weight:bold;">Total Paid</td><td style="padding:8px 0 0;border-top:1px solid rgba(212,175,55,0.25);text-align:right;color:#D4AF37;font-weight:bold;">₹${data.total}</td></tr>
          </table>
        </div>
        <p style="font-size:13px;color:#bdb6a6;">📎 Your invoice PDF is attached to this email.</p>
        ${data.dashboardUrl ? `<a href="${data.dashboardUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:11px 26px;text-decoration:none;font-weight:bold;margin:14px 0;border-radius:4px;">Go to Dashboard</a>` : ''}
        <p style="font-size:12px;color:#888;">For any billing questions, reply to this email (account@jyotishstack.com).</p>`, sig),
    };
  },

  newsletter: (data, sig) => ({
    subject: data.subject,
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h1 style="color:#D4AF37;text-align:center;">🪐 Jyotish Stack AI</h1>
        ${data.body}
        ${sig}
        <hr style="border-color:#D4AF37;opacity:0.3;margin-top:30px;"/>
        <p style="text-align:center;font-size:11px;color:#666;">
          <a href="${data.unsubscribeUrl}" style="color:#888;">Unsubscribe</a>
        </p>
      </div>`,
  }),

  custom: (data, sig) => ({
    subject: data.subject,
    html: BRAND_SHELL(data.body, sig),
  }),

  contact_ack: (data, sig) => ({
    subject: `We received your message — Jyotish Stack AI`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Thank you for reaching out to our <strong style="color:#D4AF37;">${data.departmentLabel}</strong> team.
           We've received your message and will reply to this email address shortly.</p>
        <blockquote style="border-left:3px solid #D4AF37;margin:18px 0;padding:6px 16px;color:#cfc8bb;">
          ${(data.message || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}
        </blockquote>
        <p style="font-size:12px;color:#888;">This is an automated acknowledgement — no need to reply.</p>`, sig),
  }),

  contact_notify: (data, sig) => ({
    subject: `[${data.departmentLabel}] ${data.subject || 'New inquiry'} — ${data.name}`,
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">New ${data.departmentLabel} inquiry</h2>
        <table style="font-size:14px;color:#F5F0E8;border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Name</td><td>${data.name}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Email</td><td>${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding:4px 12px 4px 0;color:#888;">Phone</td><td>${data.phone}</td></tr>` : ''}
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Subject</td><td>${data.subject || '—'}</td></tr>
        </table>
        <p style="margin-top:16px;color:#888;font-size:12px;">Message:</p>
        <blockquote style="border-left:3px solid #D4AF37;margin:6px 0;padding:6px 16px;color:#cfc8bb;">
          ${(data.message || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}
        </blockquote>
        <p style="font-size:12px;color:#888;">Reply directly to this email to respond to ${data.name}.</p>`, sig),
  }),
};

const DEPT_LABELS = { sales: 'Sales', team: 'Support', account: 'Accounts', general: 'Support' };

/**
 * Send an email.
 * Appends the department's active signature automatically.
 * Stores html_body + department + from_address in email_logs for retry support.
 */
const sendEmail = async ({ to, template, data = {}, from, replyTo, attachments }) => {
  const tmpl = templates[template];
  if (!tmpl) throw new Error(`Unknown email template: ${template}`);

  const deptKey = from && DEPARTMENTS[from] ? from : (TEMPLATE_DEPARTMENT[template] || 'account');
  const { transport, cfg } = getTransport(deptKey);

  // Fetch signature (non-fatal)
  const sig = await getSignatureHtml(deptKey);
  const { subject, html } = tmpl(data, sig);

  // Log to DB (department + from_address + html_body stored for retry)
  const [logId] = await db('email_logs').insert({
    to_email:     to,
    subject,
    template,
    status:       'queued',
    department:   deptKey,
    from_address: cfg.from,
    html_body:    html,
  });

  try {
    await transport.sendMail({
      from: cfg.from, to, subject, html,
      replyTo: replyTo || undefined,
      attachments: Array.isArray(attachments) && attachments.length ? attachments : undefined,
    });
    await db('email_logs').where({ id: logId }).update({ status: 'sent' });
  } catch (err) {
    await db('email_logs').where({ id: logId }).update({ status: 'failed', error_message: err.message });
    console.error('[Email]', err.message);
  }
};

/**
 * Re-send a failed email log entry using the stored html_body.
 * Creates a new log entry; marks the old one as 'retried'.
 */
const retryEmail = async (logId) => {
  const log = await db('email_logs').where({ id: logId }).first();
  if (!log) throw new Error('Log entry not found');
  if (log.status === 'sent') throw new Error('Email already sent successfully');

  const deptKey = log.department || 'account';
  const { transport, cfg } = getTransport(deptKey);
  const fromAddr = log.from_address || cfg.from;
  const html = log.html_body || '';

  // Old logs (sent before the html_body column existed) have no stored body to
  // resend — fail loudly instead of silently delivering a blank email.
  if (!html.trim()) {
    throw new Error('No stored email body for this entry — only emails sent after the latest update can be retried.');
  }

  const [newLogId] = await db('email_logs').insert({
    to_email:     log.to_email,
    subject:      log.subject,
    template:     log.template,
    status:       'queued',
    department:   deptKey,
    from_address: fromAddr,
    html_body:    html,
  });

  await db('email_logs').where({ id: logId }).update({ status: 'retried' });

  try {
    await transport.sendMail({ from: fromAddr, to: log.to_email, subject: log.subject, html });
    await db('email_logs').where({ id: newLogId }).update({ status: 'sent' });
    return { success: true, new_log_id: newLogId };
  } catch (err) {
    await db('email_logs').where({ id: newLogId }).update({ status: 'failed', error_message: err.message });
    throw new Error('Retry failed: ' + err.message);
  }
};

module.exports = {
  sendEmail,
  retryEmail,
  departmentInbox,
  invalidateSignatureCache,
  DEPARTMENTS,
  DEPT_LABELS,
  buildSharedConfig,
  boolEnv,
};
